/**
 * Smoke QA for candidate presentation pipeline (base product).
 * Usage: npm run qa-verify-pipeline -- --tenant default [--api http://localhost:3001]
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
  options?: RequestInit,
): Promise<{ ok: boolean; status: number; body: unknown; text: string }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { ok: res.ok, status: res.status, body, text };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error calling ${url}: ${message}`);
  }
}

function printReport(tenant: string, apiBase: string, findings: QaFinding[]) {
  const blockers = findings.filter((f) => f.severity === 'blocker');
  const warnings = findings.filter((f) => f.severity === 'warning');

  console.log('\n' + '='.repeat(60));
  console.log('PIPELINE QA REPORT');
  console.log('='.repeat(60));
  console.log(`  Tenant: ${tenant}`);
  console.log(`  API:    ${apiBase}\n`);

  if (blockers.length === 0 && warnings.length === 0) {
    console.log('  All checks passed.\n');
    return;
  }

  if (blockers.length > 0) {
    console.log('Blockers:');
    for (const f of blockers) console.log(`  [FAIL] ${f.message}`);
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('Warnings:');
    for (const f of warnings) console.log(`  [WARN] ${f.message}`);
    console.log('');
  }

  console.log(
    blockers.length > 0
      ? 'Verdict: NOT READY — fix blockers and re-run QA.'
      : 'Verdict: READY WITH WARNINGS — review before shipping.',
  );
  console.log('');
}

async function main() {
  const { tenant, apiBase } = parseArgs();
  const q = tenantQuery(tenant);
  const findings: QaFinding[] = [];
  let token = '';
  let createdId = '';

  // Health
  try {
    const health = await requestJson(`${apiBase}/tenants/current?${q}`);
    if (!health.ok) {
      findings.push({
        severity: 'blocker',
        message: `GET /tenants/current failed (${health.status}). Is the backend running on ${apiBase}?`,
      });
    } else {
      const slug = (health.body as { slug?: string })?.slug;
      if (slug !== tenant) {
        findings.push({
          severity: 'warning',
          message: `Tenant slug mismatch: expected ${tenant}, got ${slug ?? 'unknown'}`,
        });
      }
    }
  } catch (err) {
    findings.push({
      severity: 'blocker',
      message: err instanceof Error ? err.message : String(err),
    });
    printReport(tenant, apiBase, findings);
    process.exit(1);
  }

  if (findings.some((f) => f.severity === 'blocker')) {
    printReport(tenant, apiBase, findings);
    process.exit(1);
  }

  // Admin login
  const login = await requestJson(`${apiBase}/admin/auth/login?${q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'user' }),
  });

  if (!login.ok) {
    findings.push({
      severity: 'blocker',
      message: `Admin login failed (${login.status}). Check admin credentials for tenant "${tenant}".`,
    });
    printReport(tenant, apiBase, findings);
    process.exit(1);
  }

  token = (login.body as { token?: string })?.token ?? '';
  if (!token) {
    findings.push({ severity: 'blocker', message: 'Admin login returned no token.' });
    printReport(tenant, apiBase, findings);
    process.exit(1);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Published job for create test
  const jobs = await requestJson(`${apiBase}/admin/jobs?${q}&status=published`, {
    headers: authHeaders,
  });

  if (!jobs.ok) {
    findings.push({ severity: 'blocker', message: `GET /admin/jobs failed (${jobs.status}).` });
    printReport(tenant, apiBase, findings);
    process.exit(1);
  }

  const jobList = jobs.body as Array<{ id: string; title: string }>;
  if (!Array.isArray(jobList) || jobList.length === 0) {
    findings.push({
      severity: 'blocker',
      message: 'No published jobs found — seed jobs before testing pipeline create.',
    });
    printReport(tenant, apiBase, findings);
    process.exit(1);
  }

  const jobId = jobList[0]!.id;
  const testEmail = `qa-pipeline-${Date.now()}@example.com`;

  // Create screened candidate (validates screened_candidates table)
  const create = await requestJson(`${apiBase}/admin/screened-candidates?${q}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      jobId,
      candidateName: 'QA Pipeline Test',
      candidateEmail: testEmail,
      screeningNotes: 'Automated smoke test record.',
      screeningCompletedAt: new Date().toISOString().slice(0, 10),
    }),
  });

  if (!create.ok) {
    const msg =
      typeof create.body === 'object' && create.body && 'message' in create.body
        ? String((create.body as { message: unknown }).message)
        : create.text.slice(0, 200);
    findings.push({
      severity: 'blocker',
      message: `POST /admin/screened-candidates failed (${create.status}): ${msg}`,
    });
  } else {
    createdId = (create.body as { id?: string })?.id ?? '';
    const inviteToken = (create.body as { invite_token?: string })?.invite_token;
    if (!createdId || !inviteToken) {
      findings.push({ severity: 'blocker', message: 'Create response missing id or invite_token.' });
    }
  }

  // List pipeline
  const list = await requestJson(`${apiBase}/admin/screened-candidates?${q}`, {
    headers: authHeaders,
  });

  if (!list.ok) {
    findings.push({ severity: 'blocker', message: `GET /admin/screened-candidates failed (${list.status}).` });
  } else if (createdId) {
    const rows = list.body as Array<{ id: string }>;
    if (!Array.isArray(rows) || !rows.some((r) => r.id === createdId)) {
      findings.push({ severity: 'warning', message: 'Created screened candidate not found in list response.' });
    }
  }

  // Public presentation protection endpoints (404 on missing token)
  const missingToken = 'qa-nonexistent-share-token';
  const publicGet = await requestJson(
    `${apiBase}/presentations/public/${encodeURIComponent(missingToken)}?${q}`,
  );
  if (publicGet.status !== 404) {
    findings.push({
      severity: 'warning',
      message: `GET /presentations/public/:token expected 404 for missing token, got ${publicGet.status}.`,
    });
  }

  const acceptTerms = await requestJson(
    `${apiBase}/presentations/public/${encodeURIComponent(missingToken)}/accept-terms?${q}`,
    { method: 'POST' },
  );
  if (acceptTerms.status !== 404) {
    findings.push({
      severity: 'warning',
      message: `POST accept-terms expected 404 for missing token, got ${acceptTerms.status}.`,
    });
  }

  const auditEvents = await requestJson(`${apiBase}/admin/presentations/${createdId}/audit-events?${q}`, {
    headers: authHeaders,
  });
  if (auditEvents.status !== 404 && auditEvents.status !== 200) {
    findings.push({
      severity: 'warning',
      message: `GET audit-events returned unexpected status ${auditEvents.status}.`,
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
