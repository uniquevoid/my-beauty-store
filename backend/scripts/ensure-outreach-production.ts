/**
 * Ensures prospect demo URLs work in production after tenant branding updates:
 * 1. Wake / verify Render careers-api
 * 2. Set Vercel VITE_API_URL to the Render API URL
 * 3. Redeploy the Vercel frontend (Vite bakes env at build time)
 *
 * Usage (from backend/):
 *   npm run ensure-outreach-production
 *   npm run ensure-outreach-production -- --slug ggtech
 *
 * Requires in backend/.env (one-time):
 *   RENDER_API_URL=https://careers-api.onrender.com
 *   VERCEL_TOKEN=...          (Vercel → Account → Tokens)
 * Optional:
 *   RENDER_DEPLOY_HOOK_URL=...  (Render service → Deploy Hook)
 *   VERCEL_DEPLOY_HOOK_URL=...  (Vercel project → Deploy Hooks → production)
 */
import 'dotenv/config';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const DEFAULT_RENDER_API = 'https://careers-api.onrender.com';
const WAKE_TIMEOUT_MS = 180_000;
const WAKE_INTERVAL_MS = 10_000;
const FRONTEND_DIR = resolve(__dirname, '../../frontend');
const ENV_PRODUCTION_PATH = resolve(FRONTEND_DIR, '.env.production');

function loadVercelToken(): string | undefined {
  const fromEnv = process.env.VERCEL_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  const candidates = [
    process.env.APPDATA
      ? resolve(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json')
      : null,
    resolve(
      process.env.HOME ?? process.env.USERPROFILE ?? '',
      '.local/share/com.vercel.cli/auth.json',
    ),
  ].filter(Boolean) as string[];

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const raw = JSON.parse(readFileSync(file, 'utf-8')) as { token?: string };
      if (raw.token?.trim()) return raw.token.trim();
    } catch {
      /* try next */
    }
  }
  return undefined;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skip-render') {
      out.skipRender = true;
      continue;
    }
    if (args[i]?.startsWith('--') && args[i + 1]) {
      out[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return out;
}

function loadVercelProjectMeta(): { projectId: string; teamId: string } {
  const fromEnv = {
    projectId: process.env.VERCEL_PROJECT_ID?.trim(),
    teamId: process.env.VERCEL_TEAM_ID?.trim(),
  };
  if (fromEnv.projectId && fromEnv.teamId) {
    return { projectId: fromEnv.projectId, teamId: fromEnv.teamId };
  }

  const projectFile = resolve(__dirname, '../../frontend/.vercel/project.json');
  if (!existsSync(projectFile)) {
    throw new Error(
      'Missing frontend/.vercel/project.json. Link the Vercel project or set VERCEL_PROJECT_ID and VERCEL_TEAM_ID.',
    );
  }
  const raw = JSON.parse(readFileSync(projectFile, 'utf-8')) as {
    projectId?: string;
    orgId?: string;
  };
  if (!raw.projectId || !raw.orgId) {
    throw new Error('Invalid frontend/.vercel/project.json (need projectId and orgId).');
  }
  return { projectId: raw.projectId, teamId: raw.orgId };
}

async function triggerRenderDeploy(hookUrl: string) {
  console.log('Triggering Render deploy hook…');
  const res = await fetch(hookUrl, { method: 'POST' });
  if (!res.ok) {
    console.warn(`Render deploy hook returned ${res.status} ${res.statusText}`);
  } else {
    console.log('Render deploy hook accepted.');
  }
}

async function waitForRenderApi(apiUrl: string, tenantSlug: string): Promise<boolean> {
  const base = apiUrl.replace(/\/$/, '');
  const probeUrl = `${base}/tenants/current?tenant=${encodeURIComponent(tenantSlug)}`;
  const deadline = Date.now() + WAKE_TIMEOUT_MS;

  console.log(`Waiting for Render API: ${probeUrl}`);

  while (Date.now() < deadline) {
    try {
      const res = await fetch(probeUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(25_000),
      });
      if (res.ok) {
        const body = (await res.json()) as { slug?: string; branding?: unknown };
        if (body.slug) {
          console.log(`Render API ready (tenant: ${body.slug}).`);
          return true;
        }
      } else {
        console.log(`  … ${res.status} ${res.statusText}, retrying`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  … ${msg}, retrying`);
    }
    await new Promise((r) => setTimeout(r, WAKE_INTERVAL_MS));
  }

  return false;
}

async function listVercelEnv(
  token: string,
  projectId: string,
  teamId: string,
): Promise<Array<{ id: string; key: string; value?: string }>> {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${teamId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Vercel list env failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { envs?: Array<{ id: string; key: string; value?: string }> };
  return data.envs ?? [];
}

async function deleteVercelEnv(
  token: string,
  projectId: string,
  teamId: string,
  envId: string,
) {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env/${envId}?teamId=${teamId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Vercel delete env failed: ${res.status} ${await res.text()}`);
  }
}

async function createVercelEnv(
  token: string,
  projectId: string,
  teamId: string,
  key: string,
  value: string,
) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Vercel create env failed: ${res.status} ${await res.text()}`);
  }
}

async function ensureVercelApiUrl(
  token: string,
  projectId: string,
  teamId: string,
  apiUrl: string,
) {
  const normalized = apiUrl.replace(/\/$/, '');
  const envs = await listVercelEnv(token, projectId, teamId);
  const existing = envs.find((e) => e.key === 'VITE_API_URL');

  if (existing?.value === normalized) {
    console.log(`Vercel VITE_API_URL already set to ${normalized}`);
    return;
  }

  if (existing) {
    console.log('Updating Vercel VITE_API_URL…');
    await deleteVercelEnv(token, projectId, teamId, existing.id);
  } else {
    console.log('Creating Vercel VITE_API_URL…');
  }

  await createVercelEnv(token, projectId, teamId, 'VITE_API_URL', normalized);
  console.log(`Vercel VITE_API_URL → ${normalized}`);
}

function writeFrontendProductionApiUrl(apiUrl: string) {
  const normalized = apiUrl.replace(/\/$/, '');
  const content = `# Auto-updated by ensure-outreach-production\nVITE_API_URL=${normalized}\n`;
  writeFileSync(ENV_PRODUCTION_PATH, content, 'utf-8');
  console.log(`Wrote ${ENV_PRODUCTION_PATH} → VITE_API_URL=${normalized}`);
}

async function redeployVercelFrontend(token: string, deployHookUrl?: string) {
  if (deployHookUrl) {
    console.log('Triggering Vercel production deploy hook…');
    const res = await fetch(deployHookUrl, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Vercel deploy hook failed: ${res.status} ${res.statusText}`);
    }
    console.log('Vercel deploy hook accepted.');
    return;
  }

  const frontendDir = resolve(__dirname, '../../frontend');
  console.log('Deploying frontend to Vercel production (vercel CLI)…');
  execSync(`npx --yes vercel@latest deploy --prod --yes --token "${token}"`, {
    cwd: frontendDir,
    stdio: 'inherit',
    env: { ...process.env, CI: '1' },
  });
}

export async function ensureOutreachProduction(input?: {
  tenantSlug?: string;
  renderApiUrl?: string;
  skipVercel?: boolean;
  skipRender?: boolean;
}): Promise<{ renderOk: boolean; vercelSynced: boolean }> {
  const args = parseArgs();
  const tenantSlug = input?.tenantSlug ?? (args.slug as string | undefined) ?? 'ggtech';
  const renderApiUrl = (
    input?.renderApiUrl ??
    process.env.RENDER_API_URL ??
    DEFAULT_RENDER_API
  ).trim();

  const skipRender = input?.skipRender ?? Boolean(args.skipRender);

  const renderHook = process.env.RENDER_DEPLOY_HOOK_URL?.trim();
  if (renderHook && !skipRender) {
    await triggerRenderDeploy(renderHook);
  }

  const renderOk = skipRender
    ? false
    : await waitForRenderApi(renderApiUrl, tenantSlug);
  if (!renderOk && !skipRender) {
    console.error(
      `\nRender API not reachable at ${renderApiUrl} after ${WAKE_TIMEOUT_MS / 1000}s.`,
    );
    console.error(
      'Deploy careers-api on Render (render.yaml), set env vars, or add RENDER_DEPLOY_HOOK_URL to backend/.env',
    );
  } else if (skipRender) {
    console.warn(`Skipping Render wait; will still configure Vercel for ${renderApiUrl}`);
  }

  let vercelSynced = false;
  if (input?.skipVercel) {
    return { renderOk, vercelSynced };
  }

  const vercelToken = loadVercelToken();
  if (!vercelToken) {
    console.error('\nNo Vercel credentials — cannot set VITE_API_URL or redeploy.');
    console.error('Add VERCEL_TOKEN to backend/.env, or run: npx vercel login');
    console.error('Token: https://vercel.com/account/settings/tokens');
    return { renderOk, vercelSynced };
  }

  const apiUrlForBuild =
    process.env.OUTREACH_API_URL?.trim() ||
    (renderOk ? renderApiUrl : process.env.TEMP_OUTREACH_API_URL?.trim()) ||
    renderApiUrl;

  writeFrontendProductionApiUrl(apiUrlForBuild);

  const { projectId, teamId } = loadVercelProjectMeta();
  await ensureVercelApiUrl(vercelToken, projectId, teamId, apiUrlForBuild);

  const vercelHook = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
  await redeployVercelFrontend(vercelToken, vercelHook);
  vercelSynced = true;

  const appPublic = process.env.APP_PUBLIC_URL?.trim();
  if (appPublic) {
    console.log(`\nOutreach URL: ${appPublic}/?tenant=${tenantSlug}`);
    console.log('Allow 1–3 minutes for the Vercel deployment to finish, then hard-refresh in incognito.');
  }

  return { renderOk, vercelSynced };
}

async function main() {
  const args = parseArgs();
  const skipRender = Boolean(args.skipRender);
  const { renderOk, vercelSynced } = await ensureOutreachProduction();
  if (!vercelSynced) {
    process.exit(1);
  }
  if (!renderOk && !skipRender) {
    console.warn('\nRender API was not reachable; Vercel is configured for when the API is live.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
