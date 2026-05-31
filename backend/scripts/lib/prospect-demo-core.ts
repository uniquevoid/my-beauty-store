import bcrypt from 'bcryptjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import {
  DEMO_CANDIDATE_CREDENTIALS,
  seedDemoCandidateForTenant,
} from '../../src/careers/seed-demo-candidate';
import { seedDemoJobsForTenant } from '../../src/careers/seed-demo-jobs';
import { extractProspectBrandingFromUrl } from '../../src/branding/extract-prospect-branding';
import { enrichPartialBranding } from '../../src/branding/brand-token-derivation';
import type { ProspectBrandingJson } from '../../src/branding/branding-schema.types';
import {
  formatValidationErrors,
  validateVisualBrandParity,
} from '../../src/branding/validate-visual-brand-parity';
import { buildShareableDemoUrl, demoHostnameForSlug, loadBrandingFromFile } from '../branding-file';

export type ProspectDemoInput = {
  url?: string;
  slug?: string;
  name?: string;
  primaryColor?: string;
  brandingFile?: string;
  update?: boolean;
  dryRun?: boolean;
  force?: boolean;
};

export type ProspectDemoResult = {
  slug: string;
  name: string;
  branding: ProspectBrandingJson;
  brandingPath: string;
  demoUrl: string | null;
  created: boolean;
  jobCount?: number;
  tenantId?: string;
};

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
      status: 'status',
      description: 'description',
    },
    value_map: {
      status: {
        published: 'published',
        open: 'published',
        draft: 'draft',
        closed: 'closed',
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
  return seedDemoJobsForTenant(supabase, tenantId);
}

export async function runProspectDemo(input: ProspectDemoInput): Promise<ProspectDemoResult> {
  const url = input.url?.trim() ?? '';
  const brandingFileArg = input.brandingFile?.trim() ?? '';

  if (!url && !brandingFileArg) {
    throw new Error('Provide --url <company-website> or --branding-file <path.json>');
  }

  let branding: ProspectBrandingJson;
  let suggestedSlug = 'prospect';
  let companyName = input.name?.trim() || 'Prospect';

  if (brandingFileArg) {
    const loaded = loadBrandingFromFile(brandingFileArg) as ProspectBrandingJson;
    const sourceUrl = url || (loaded.source?.url as string | undefined) || 'https://unknown.local';
    branding = await enrichPartialBranding(loaded, sourceUrl, loaded.source?.method ?? 'fetch-fallback');
    companyName = (input.name ?? branding.companyName ?? companyName).trim();
    suggestedSlug = (input.slug ?? companyName).trim().toLowerCase();
  } else {
    const extracted = await extractProspectBrandingFromUrl(url, {
      companyName: input.name,
      slug: input.slug,
      primaryColor: input.primaryColor,
    });
    branding = extracted.branding;
    suggestedSlug = extracted.suggestedSlug;
    companyName = extracted.companyName;
  }

  const slug = (input.slug ?? suggestedSlug).trim().toLowerCase();
  const name = (input.name ?? companyName).trim();

  const brandingPath = resolve(__dirname, '../../../docs/examples', `${slug}-branding.json`);
  mkdirSync(dirname(brandingPath), { recursive: true });
  writeFileSync(brandingPath, `${JSON.stringify(branding, null, 2)}\n`, 'utf-8');

  const parity = validateVisualBrandParity(branding, {
    force: input.force,
    skipPlaywrightCheck: Boolean(brandingFileArg),
  });
  if (!parity.ok) {
    const msg = formatValidationErrors(parity.errors);
    throw new Error(`Visual brand parity check failed:\n${msg}`);
  }
  if (parity.warnings.length > 0) {
    console.warn('Visual brand parity warnings:');
    for (const w of parity.warnings) console.warn(`  - ${w}`);
  }

  if (input.dryRun) {
    return {
      slug,
      name,
      branding,
      brandingPath,
      demoUrl: buildShareableDemoUrl(slug),
      created: false,
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const { data: existing } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    if (!input.update) {
      throw new Error(
        `Tenant "${slug}" already exists. Pass --update to refresh branding (iteration).`,
      );
    }

    const jobCount = await updateExistingTenant(supabase, existing.id, name, branding);
    await seedDemoCandidateForTenant(supabase, existing.id);

    return {
      slug,
      name,
      branding,
      brandingPath,
      demoUrl: buildShareableDemoUrl(slug),
      created: false,
      jobCount,
      tenantId: existing.id,
    };
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

  return {
    slug,
    name,
    branding,
    brandingPath,
    demoUrl: buildShareableDemoUrl(slug),
    created: true,
    jobCount,
    tenantId: tenant.id,
  };
}

export function printBrandingSummary(result: ProspectDemoResult) {
  const { branding, brandingPath, slug, name } = result;
  console.log(`Wrote branding: ${brandingPath}`);
  console.log(`  Company: ${name}`);
  console.log(`  Slug:    ${slug}`);
  console.log(`  Color:   ${branding.colors?.primary ?? '—'}`);
  console.log(`  Font:    ${branding.typography?.fontFamilySans ?? '—'}`);
  console.log(`  Logo:    ${branding.logoUrl ?? '—'}`);
  console.log(`  Hero:    ${branding.hero?.backgroundImageUrl ?? '—'}`);
}

export function printCredentials() {
  console.log('  Admin:     admin / user');
  console.log(`  Candidate: ${DEMO_CANDIDATE_CREDENTIALS.email} / ${DEMO_CANDIDATE_CREDENTIALS.password}`);
}
