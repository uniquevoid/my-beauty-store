/**
 * Smoke QA for job search autocomplete (base product).
 * Usage: npm run qa-verify-job-search -- --tenant default [--api http://localhost:3001]
 */
import 'dotenv/config';

type QaFinding = { severity: 'blocker' | 'warning'; message: string };

function parseArgs(): { tenant: string; apiBase: string } {
  const args = process.argv.slice(2);
  let tenant = 'default';
  let apiBase = process.env.QA_API_URL?.trim() || 'http://localhost:3001';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tenant' && args[i + 1]) {
      tenant = args[i + 1]!.trim().toLowerCase();
      i++;
    } else if (args[i] === '--api' && args[i + 1]) {
      apiBase = args[i + 1]!.trim().replace(/\/$/, '');
      i++;
    }
  }

  return { tenant, apiBase };
}

function tenantQuery(tenant: string) {
  return `tenant=${encodeURIComponent(tenant)}`;
}

async function requestJson(
  url: string,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  try {
    const res = await fetch(url);
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error calling ${url}: ${message}`);
  }
}

function printReport(tenant: string, apiBase: string, findings: QaFinding[]) {
  const blockers = findings.filter((f) => f.severity === 'blocker');

  console.log('\n' + '='.repeat(60));
  console.log('JOB SEARCH AUTOCOMPLETE QA REPORT');
  console.log('='.repeat(60));
  console.log(`  Tenant: ${tenant}`);
  console.log(`  API:    ${apiBase}\n`);

  if (blockers.length === 0) {
    console.log('  All checks passed.\n');
    return;
  }

  console.log('Blockers:');
  for (const f of blockers) console.log(`  [FAIL] ${f.message}`);
  console.log('');
  console.log('Verdict: NOT READY — fix blockers and re-run QA.\n');
}

async function main() {
  const { tenant, apiBase } = parseArgs();
  const findings: QaFinding[] = [];
  const tq = tenantQuery(tenant);

  const empty = await requestJson(`${apiBase}/jobs/search-suggestions?${tq}&q=e`);
  if (!empty.ok) {
    findings.push({
      severity: 'blocker',
      message: `GET /jobs/search-suggestions short query failed (${empty.status})`,
    });
  } else if (!Array.isArray(empty.body) || empty.body.length !== 0) {
    findings.push({
      severity: 'blocker',
      message: 'Short queries should return an empty suggestion array',
    });
  }

  const suggestions = await requestJson(
    `${apiBase}/jobs/search-suggestions?${tq}&q=eng`,
  );
  if (!suggestions.ok) {
    findings.push({
      severity: 'blocker',
      message: `GET /jobs/search-suggestions failed (${suggestions.status})`,
    });
  } else if (!Array.isArray(suggestions.body)) {
    findings.push({
      severity: 'blocker',
      message: 'Suggestions response must be a JSON array',
    });
  } else if (suggestions.body.length === 0) {
    findings.push({
      severity: 'blocker',
      message: 'Expected at least one suggestion for query "eng"',
    });
  } else {
    const first = suggestions.body[0] as Record<string, unknown>;
    if (typeof first.title !== 'string' || typeof first.slug !== 'string') {
      findings.push({
        severity: 'blocker',
        message: 'Suggestion items must include string title and slug',
      });
    }
  }

  const jobs = await requestJson(`${apiBase}/jobs?${tq}&q=engineer`);
  if (!jobs.ok) {
    findings.push({
      severity: 'blocker',
      message: `GET /jobs keyword search failed (${jobs.status})`,
    });
  } else if (!Array.isArray(jobs.body)) {
    findings.push({
      severity: 'blocker',
      message: 'Jobs search response must be a JSON array',
    });
  }

  printReport(tenant, apiBase, findings);
  if (findings.some((f) => f.severity === 'blocker')) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
