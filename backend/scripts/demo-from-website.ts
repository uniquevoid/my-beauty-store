/**
 * One command: company website → live demo URL, with iteration support.
 *
 * First run (extract + provision + deploy):
 *   npm run demo-from-website -- --url https://ggtech.gg
 *
 * Iterate after editing branding JSON:
 *   npm run demo-from-website -- --slug ggtech --update
 *
 * Re-scrape company site and redeploy:
 *   npm run demo-from-website -- --url https://ggtech.gg --slug ggtech --update
 *
 * Apply a hand-edited branding file:
 *   npm run demo-from-website -- --slug ggtech --branding-file ../docs/examples/ggtech-branding.json --update
 *
 * Redeploy only (no Supabase change):
 *   npm run demo-from-website -- --slug ggtech --sync-only
 */
import 'dotenv/config';
import {
  printBrandingSummary,
  printCredentials,
  runProspectDemo,
  type ProspectDemoInput,
} from './lib/prospect-demo-core';
import { resolveOutreachApiUrl, saveOutreachApiUrl } from './lib/resolve-outreach-api';
import { ensureOutreachProduction } from './ensure-outreach-production';
import { buildShareableDemoUrl } from './branding-file';

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--update' || a === '--dry-run' || a === '--force' || a === '--sync-only') {
      out[a.slice(2)] = true;
      continue;
    }
    if (a === '--skip-deploy') {
      out.skipDeploy = true;
      continue;
    }
    if (a?.startsWith('--') && args[i + 1]) {
      out[a.slice(2)] = args[i + 1];
      i++;
    }
  }
  return out;
}

function printChecklist(slug: string, demoUrl: string | null, brandingPath: string) {
  const checkUrl = demoUrl ?? `(set APP_PUBLIC_URL in backend/.env)/?tenant=${slug}`;

  console.log('\n' + '='.repeat(60));
  console.log('CHECK YOUR DEMO (open in incognito)');
  console.log('='.repeat(60));
  console.log(`\n  ${checkUrl}\n`);
  console.log('Verify:');
  console.log('  - Tab title shows company name (not generic "Careers")');
  console.log('  - Logo and brand colors match the company site');
  console.log('  - Font matches typography in branding JSON (not default system UI only)');
  console.log('  - Hero headline and background image look right');
  console.log('  - /jobs lists demo roles\n');

  console.log('Not happy yet? Iterate:');
  console.log(`  1. Edit ${brandingPath}`);
  console.log(`  2. npm run demo-from-website -- --slug ${slug} --update`);
  console.log(`     or re-scrape: npm run demo-from-website -- --url <site> --slug ${slug} --update`);
  console.log('  3. Repeat until ready, then share the CHECK URL above.\n');
}

async function syncProduction(slug: string, skipDeploy: boolean) {
  if (skipDeploy) {
    console.log('\nSkipped Vercel deploy (--skip-deploy).');
    return;
  }

  console.log('\nResolving production API URL…');
  const api = await resolveOutreachApiUrl(slug);

  if (api.source === 'none') {
    console.warn('\nNo reachable API for the live demo.');
    console.warn('  - Deploy Render careers-api (see docs/PRODUCTION_URL_CHECKLIST.md), or');
    console.warn('  - Run: .\\backend\\scripts\\start-outreach-demo.ps1 -Slug ' + slug);
    console.warn('  - Then re-run: npm run demo-from-website -- --slug ' + slug + ' --sync-only');
    return;
  }

  process.env.OUTREACH_API_URL = api.url;
  saveOutreachApiUrl(api.url);
  console.log(`  Using API (${api.source}): ${api.url}`);

  const result = await ensureOutreachProduction({
    tenantSlug: slug,
    skipRender: !api.renderReachable,
  });

  if (!result.vercelSynced) {
    console.warn('\nVercel deploy failed — add VERCEL_TOKEN to backend/.env');
  } else if (!api.renderReachable) {
    console.warn('\nDemo uses interim API URL. Keep tunnel/backend running, or deploy Render for 24/7.');
  }
}

async function main() {
  const args = parseArgs();
  const slugArg = args.slug ? String(args.slug).trim().toLowerCase() : '';

  if (args['sync-only']) {
    if (!slugArg) {
      console.error('--sync-only requires --slug <tenant>');
      process.exit(1);
    }
    await syncProduction(slugArg, Boolean(args.skipDeploy));
    printChecklist(
      slugArg,
      buildShareableDemoUrl(slugArg),
      `docs/examples/${slugArg}-branding.json`,
    );
    return;
  }

  const input: ProspectDemoInput = {
    url: args.url ? String(args.url) : undefined,
    slug: slugArg || undefined,
    name: args.name ? String(args.name) : undefined,
    primaryColor: args.color ? String(args.color) : undefined,
    brandingFile: args['branding-file'] ? String(args['branding-file']) : undefined,
    update: Boolean(args.update),
    dryRun: Boolean(args['dry-run']),
    force: Boolean(args.force),
  };

  if (!input.url && !input.brandingFile) {
    console.error(`
Usage:
  npm run demo-from-website -- --url <company-website> [--slug slug] [--name "Company"]

Iterate (after editing docs/examples/<slug>-branding.json):
  npm run demo-from-website -- --slug <slug> --update

Re-scrape + redeploy:
  npm run demo-from-website -- --url <site> --slug <slug> --update

Redeploy Vercel only:
  npm run demo-from-website -- --slug <slug> --sync-only

Options: --dry-run  --force  --skip-deploy  --color #hex  --branding-file <path>
`);
    process.exit(1);
  }

  try {
    if (input.url) {
      console.log(`\nExtracting visual brand from ${input.url} (Playwright)…`);
    }

    const result = await runProspectDemo(input);
    printBrandingSummary(result);

    if (input.dryRun) {
      console.log('\nDry run — nothing provisioned. Re-run without --dry-run when ready.');
      printChecklist(result.slug, result.demoUrl, result.brandingPath);
      return;
    }

    console.log(result.created ? '\nProspect demo created.' : '\nProspect demo updated.');
    if (result.tenantId) console.log(`  Tenant: ${result.slug} (${result.tenantId})`);
    if (result.jobCount != null) console.log(`  Jobs:   ${result.jobCount} demo roles`);
    printCredentials();

    await syncProduction(result.slug, Boolean(args.skipDeploy));
    printChecklist(result.slug, result.demoUrl, result.brandingPath);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
