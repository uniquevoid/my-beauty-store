/**
 * Provision a tenant with default admin (admin / user).
 *
 * Usage:
 *   npm run provision-tenant -- --slug acme --name "Acme Corp"
 *   npm run provision-tenant -- --slug acme --name "Acme Corp" --branding-file ../docs/examples/acme-branding.json
 *   npm run provision-tenant -- --migrate-default
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { seedDemoJobsForTenant } from '../src/careers/seed-demo-jobs';
import {
  DEMO_CANDIDATE_CREDENTIALS,
  seedDemoCandidateForTenant,
} from '../src/careers/seed-demo-candidate';
import { demoHostnameForSlug, loadBrandingFromFile, buildShareableDemoUrl } from './branding-file';

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--migrate-default') {
      out.migrateDefault = 'true';
      continue;
    }
    if (args[i]?.startsWith('--') && args[i + 1]) {
      out[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return out;
}

function loadDefaultBranding(): Record<string, unknown> {
  try {
    const brandingPath = resolve(__dirname, '../../frontend/src/config/branding.ts');
    const raw = readFileSync(brandingPath, 'utf-8');
    const match = raw.match(/export const branding[^=]*=\s*(\{[\s\S]*?\n\});/);
    if (!match) return {};
    // eslint-disable-next-line no-eval
    return eval(`(${match[1]})`) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const args = parseArgs();

  if (args.migrateDefault) {
    const branding = loadDefaultBranding();
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'default')
      .maybeSingle();

    let tenantId = existing?.id;
    if (!tenantId) {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          slug: 'default',
          name: 'Default Tenant',
          hostname: 'localhost',
          subdomain: 'default',
          branding_json: branding,
        })
        .select('id')
        .single();
      if (error) throw error;
      tenantId = data.id;
      console.log('Created default tenant:', tenantId);
    } else if (Object.keys(branding).length) {
      await supabase.from('tenants').update({ branding_json: branding }).eq('id', tenantId);
      console.log('Updated default tenant branding.');
    }

    await backfillTenantData(supabase, tenantId!);
    await ensureAdmin(supabase, tenantId!);
    await ensureImportProfile(supabase, tenantId!);
    await seedDemoJobsForTenant(supabase, tenantId!);
    await seedDemoCandidateForTenant(supabase, tenantId!);
    console.log('Default tenant ready. Admin: admin / user');
    console.log(
      `Demo candidate: ${DEMO_CANDIDATE_CREDENTIALS.email} / ${DEMO_CANDIDATE_CREDENTIALS.password}`,
    );
    return;
  }

  const slug = args.slug?.trim();
  const name = args.name?.trim();
  if (!slug || !name) {
    console.error(
      'Usage: --slug <slug> --name "Company Name" [--hostname host] [--subdomain sub] [--branding-file path.json]',
    );
    process.exit(1);
  }

  let brandingJson: Record<string, unknown> = {};
  if (args['branding-file']) {
    brandingJson = loadBrandingFromFile(args['branding-file']);
  }

  const hostname = args.hostname ?? demoHostnameForSlug(slug) ?? null;
  const subdomain = args.subdomain ?? slug;

  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      slug,
      name,
      hostname,
      subdomain,
      branding_json: brandingJson,
    })
    .select('*')
    .single();

  if (error) throw error;
  await ensureAdmin(supabase, tenant.id);
  await ensureImportProfile(supabase, tenant.id);
  const jobCount = await seedDemoJobsForTenant(supabase, tenant.id);
  await seedDemoCandidateForTenant(supabase, tenant.id);
  console.log('Provisioned tenant:', tenant.slug, tenant.id);
  console.log(`Seeded ${jobCount} demo jobs.`);
  if (hostname) {
    console.log('Demo hostname:', hostname);
  }
  const demoUrl = buildShareableDemoUrl(subdomain);
  if (demoUrl) {
    console.log('Demo URL:', demoUrl);
  }
  console.log('Admin login: admin / user (must change password on first login)');
  console.log(
    `Candidate login: ${DEMO_CANDIDATE_CREDENTIALS.email} / ${DEMO_CANDIDATE_CREDENTIALS.password}`,
  );
}

async function backfillTenantData(supabase: SupabaseClient, tenantId: string) {
  const tables = [
    'jobs',
    'candidates',
    'applications',
    'job_alerts',
    'job_alert_notifications',
    'resume_sessions',
  ] as const;

  for (const table of tables) {
    const { error } = await supabase.from(table).update({ tenant_id: tenantId }).is('tenant_id', null);
    if (error) console.warn(`Backfill ${table}:`, error.message);
  }

  const { data: jobs } = await supabase.from('jobs').select('id, slug, external_id').eq('tenant_id', tenantId);
  for (const job of jobs ?? []) {
    if (!job.external_id && job.slug) {
      await supabase.from('jobs').update({ external_id: job.slug }).eq('id', job.id);
    }
  }
}

async function ensureAdmin(supabase: SupabaseClient, tenantId: string) {
  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('username', 'admin')
    .maybeSingle();

  if (existing) return;

  const password_hash = await bcrypt.hash('user', 10);
  const { error } = await supabase.from('admin_users').insert({
    tenant_id: tenantId,
    username: 'admin',
    password_hash,
    must_change_password: true,
  });

  if (error) throw error;
}

async function ensureImportProfile(supabase: SupabaseClient, tenantId: string) {
  const { data: existing } = await supabase
    .from('job_import_profiles')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('name', 'default')
    .maybeSingle();

  if (existing) return;

  await supabase.from('job_import_profiles').insert({
    tenant_id: tenantId,
    name: 'default',
    column_map: {
      slug: 'slug',
      title: 'title',
      department: 'department',
      location: 'location',
      employment_type: 'employment_type',
      area_of_interest: 'area_of_interest',
      workplace_type: 'workplace_type',
      description: 'description',
      status: 'status',
      external_id: 'external_id',
    },
    value_map: {
      status: {
        published: 'published',
        open: 'published',
        active: 'published',
        draft: 'draft',
        closed: 'closed',
        filled: 'closed',
      },
    },
    sync_mode: 'delta',
    is_default: true,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
