/**
 * Create a prospect demo from a company website URL.
 *
 * Fetches the homepage, extracts brand signals, writes branding JSON, and provisions the tenant.
 *
 * Usage:
 *   npm run create-prospect-from-url -- --url https://ggtech.gg
 *   npm run create-prospect-from-url -- --url https://acme.com --slug acme --name "Acme Corp"
 *   npm run create-prospect-from-url -- --url https://acme.com --update
 *   npm run create-prospect-from-url -- --slug ggtech --update --branding-file ../docs/examples/ggtech-branding.json
 *   npm run create-prospect-from-url -- --url https://acme.com --dry-run
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import {
  DEMO_CANDIDATE_CREDENTIALS,
  seedDemoCandidateForTenant,
} from '../src/careers/seed-demo-candidate';
import { seedDemoJobsForTenant } from '../src/careers/seed-demo-jobs';
import { extractProspectBrandingFromUrl } from '../src/branding/extract-prospect-branding';
import { enrichPartialBranding } from '../src/branding/brand-token-derivation';
import type { ProspectBrandingJson } from '../src/branding/branding-schema.types';
import {
  formatValidationErrors,
  validateVisualBrandParity,
} from '../src/branding/validate-visual-brand-parity';
import { buildShareableDemoUrl, demoHostnameForSlug, loadBrandingFromFile } from './branding-file';
import { ensureOutreachProduction } from './ensure-outreach-production';

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      out.dryRun = true;
      continue;
    }
    if (args[i] === '--update') {
      out.update = true;
      continue;
    }
    if (args[i] === '--skip-production-sync') {
      out.skipProductionSync = true;
      continue;
    }
    if (args[i] === '--force') {
      out.force = true;
      continue;
    }
    if (args[i]?.startsWith('--') && args[i + 1]) {
      out[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return out;
}

function printDemoUrl(slug: string) {
  const demoUrl = buildShareableDemoUrl(slug);
  if (demoUrl) {
    console.log(`  Demo URL: ${demoUrl}`);
  } else {
    console.log(`  Local preview: http://localhost:5173/?tenant=${slug}`);
    console.log('  Set APP_PUBLIC_URL (or PLATFORM_DOMAIN) in backend .env for shareable demo URLs.');
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

async function updateExistingTenant(
  supabase: SupabaseClient,
  tenantId: string,
  name: string,
  branding: Record<string, unknown>,
) {
  const { error } = await supabase
    .from('tenants')
    .update({ name, branding_json: branding })
    .eq('id', tenantId);

  if (error) throw error;

  await ensureAdmin(supabase, tenantId);
  await ensureImportProfile(supabase, tenantId);
  const jobCount = await seedDemoJobsForTenant(supabase, tenantId);
  await seedDemoCandidateForTenant(supabase, tenantId);
  return jobCount;
}

async function syncOutreachProduction(slug: string, skip?: boolean) {
  if (skip) return;
  console.log('\nSyncing production (Render + Vercel) for outreach URL…');
  try {
    const result = await ensureOutreachProduction({ tenantSlug: slug });
    if (!result.vercelSynced) {
      console.warn(
        'Vercel sync skipped or failed — add VERCEL_TOKEN to backend/.env (or run `npx vercel login`), then: npm run ensure-outreach-production',
      );
    }
    if (!result.renderOk) {
      console.warn(
        'Render API not ready — deploy careers-api on Render (see render.yaml) or set RENDER_DEPLOY_HOOK_URL.',
      );
    }
  } catch (err) {
    console.warn(
      `Production sync error: ${err instanceof Error ? err.message : err}. Re-run: npm run ensure-outreach-production -- --slug ${slug}`,
    );
  }
}

async function main() {
  const args = parseArgs();
  const brandingFileArg = args['branding-file'] ? String(args['branding-file']) : '';
  const url = String(args.url ?? '').trim();

  if (!url && !brandingFileArg) {
    console.error(
      'Usage: npm run create-prospect-from-url -- --url <company-website> [--slug slug] [--name "Company Name"] [--update] [--branding-file path.json] [--color #hex] [--dry-run]',
    );
    process.exit(1);
  }

  let branding: Record<string, unknown>;
  let suggestedSlug = 'prospect';
  let companyName = args.name ? String(args.name) : 'Prospect';

  if (brandingFileArg) {
    const loaded = loadBrandingFromFile(brandingFileArg) as ProspectBrandingJson;
    const sourceUrl = url || (loaded.source?.url as string | undefined) || 'https://unknown.local';
    branding = await enrichPartialBranding(loaded, sourceUrl, loaded.source?.method ?? 'fetch-fallback');
    companyName =
      String(args.name ?? (branding.companyName as string | undefined) ?? companyName).trim();
    suggestedSlug = String(args.slug ?? companyName).trim().toLowerCase();
    console.log(`Loaded branding from ${brandingFileArg}`);
  } else {
    console.log(`Fetching ${url}…`);
    const extracted = await extractProspectBrandingFromUrl(url, {
      companyName: args.name ? String(args.name) : undefined,
      slug: args.slug ? String(args.slug) : undefined,
      primaryColor: args.color ? String(args.color) : undefined,
    });
    branding = extracted.branding;
    suggestedSlug = extracted.suggestedSlug;
    companyName = extracted.companyName;
  }

  const slug = String(args.slug ?? suggestedSlug).trim().toLowerCase();
  const name = String(args.name ?? companyName).trim();

  const brandingPath = resolve(
    __dirname,
    '../../docs/examples',
    `${slug}-branding.json`,
  );

  mkdirSync(dirname(brandingPath), { recursive: true });
  writeFileSync(brandingPath, `${JSON.stringify(branding, null, 2)}\n`, 'utf-8');
  console.log(`Wrote branding: ${brandingPath}`);
  console.log(`  Company: ${name}`);
  console.log(`  Slug:    ${slug}`);
  console.log(`  Color:   ${(branding.colors as { primary?: string })?.primary ?? '—'}`);
  console.log(`  Logo:    ${(branding.logoUrl as string | undefined) ?? '—'}`);
  console.log(
    `  Hero:    ${(branding.hero as { backgroundImageUrl?: string })?.backgroundImageUrl ?? '—'}`,
  );

  const parity = validateVisualBrandParity(branding as ProspectBrandingJson, {
    force: Boolean(args.force),
    skipPlaywrightCheck: Boolean(brandingFileArg),
  });
  if (!parity.ok) {
    console.error('\nVisual brand parity check failed (mandatory for prospect demos):');
    console.error(formatValidationErrors(parity.errors));
    console.error('\nRe-run extraction from company URL, enrich the branding JSON, or pass --force to override.');
    process.exit(1);
  }
  if (parity.warnings.length > 0) {
    console.warn('\nVisual brand parity warnings:');
    for (const w of parity.warnings) console.warn(`  - ${w}`);
  }

  if (args.dryRun) {
    console.log('\nDry run — tenant not provisioned. Review the JSON, then re-run without --dry-run.');
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to provision.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const { data: existing } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    if (!args.update) {
      console.error(
        `Tenant slug "${slug}" already exists. Pass --update to refresh branding and re-seed demo jobs.`,
      );
      process.exit(1);
    }

    const jobCount = await updateExistingTenant(supabase, existing.id, name, branding);

    console.log('\nProspect demo updated.');
    console.log(`  Tenant: ${existing.slug} (${existing.id})`);
    console.log(`  Jobs:   ${jobCount} demo roles seeded`);
    printDemoUrl(slug);
    console.log('  Admin:     admin / user');
    console.log(
      `  Candidate: ${DEMO_CANDIDATE_CREDENTIALS.email} / ${DEMO_CANDIDATE_CREDENTIALS.password}`,
    );
    await syncOutreachProduction(slug, Boolean(args.skipProductionSync));
    return;
  }

  const hostname = demoHostnameForSlug(slug);
  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      slug,
      name,
      hostname,
      subdomain: slug,
      branding_json: branding,
    })
    .select('*')
    .single();

  if (error) throw error;

  await ensureAdmin(supabase, tenant.id);
  await ensureImportProfile(supabase, tenant.id);
  const jobCount = await seedDemoJobsForTenant(supabase, tenant.id);
  await seedDemoCandidateForTenant(supabase, tenant.id);

  console.log('\nProspect demo ready.');
  console.log(`  Tenant: ${tenant.slug} (${tenant.id})`);
  console.log(`  Jobs:   ${jobCount} demo roles seeded`);
  printDemoUrl(slug);
  console.log('  Admin:     admin / user');
  console.log(
    `  Candidate: ${DEMO_CANDIDATE_CREDENTIALS.email} / ${DEMO_CANDIDATE_CREDENTIALS.password}`,
  );

  await syncOutreachProduction(slug, Boolean(args.skipProductionSync));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
