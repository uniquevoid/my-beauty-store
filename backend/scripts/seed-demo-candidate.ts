/**
 * Seed demo candidate (profile, applications, job alerts) for a tenant.
 *
 * Usage:
 *   npm run seed-demo-candidate -- --slug default
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  DEMO_CANDIDATE_CREDENTIALS,
  seedDemoCandidateForTenant,
} from '../src/careers/seed-demo-candidate';

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i]?.startsWith('--') && args[i + 1]) {
      out[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return out;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
  }

  const slug = parseArgs().slug?.trim();
  if (!slug) {
    console.error('Usage: npm run seed-demo-candidate -- --slug <tenant-slug>');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();

  if (tenantErr) throw tenantErr;
  if (!tenant) {
    console.error(`Tenant not found: ${slug}. Run create-prospect first.`);
    process.exit(1);
  }

  const result = await seedDemoCandidateForTenant(supabase, tenant.id);

  console.log(`Demo candidate seeded for ${tenant.name} (${slug}).`);
  console.log(`  Candidate ID: ${result.candidateId}`);
  console.log(`  Applications created: ${result.applicationsCreated}`);
  console.log(`  Job alerts created: ${result.jobAlertsCreated}`);
  console.log(`\nLogin: ${DEMO_CANDIDATE_CREDENTIALS.email} / ${DEMO_CANDIDATE_CREDENTIALS.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
