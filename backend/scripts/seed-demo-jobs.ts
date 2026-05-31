/**
 * Seed 10 published demo jobs for a prospect tenant (no CSV).
 *
 * Usage:
 *   npm run seed-demo-jobs -- --slug ggtech
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { DEMO_JOBS, seedDemoJobsForTenant } from '../src/careers/seed-demo-jobs';

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
    console.error('Usage: npm run seed-demo-jobs -- --slug <tenant-slug>');
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

  const count = await seedDemoJobsForTenant(supabase, tenant.id);
  for (const job of DEMO_JOBS) {
    console.log(`  - ${job.title}`);
  }

  console.log(`\nSeeded ${count} published jobs for ${tenant.name} (${slug}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
