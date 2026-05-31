import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const CACHE_FILE = resolve(__dirname, '../../.outreach-api-url');
const DEFAULT_RENDER = 'https://careers-api.onrender.com';
const PROBE_TIMEOUT_MS = 12_000;

export type OutreachApiResolution = {
  url: string;
  source: 'render' | 'env' | 'cache' | 'none';
  renderReachable: boolean;
};

async function probeTenantApi(baseUrl: string, slug: string): Promise<boolean> {
  const url = `${baseUrl.replace(/\/$/, '')}/tenants/current?tenant=${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { slug?: string };
    return Boolean(body.slug);
  } catch {
    return false;
  }
}

function readCachedApiUrl(): string | null {
  if (!existsSync(CACHE_FILE)) return null;
  const raw = readFileSync(CACHE_FILE, 'utf-8').trim();
  return raw || null;
}

export function saveOutreachApiUrl(url: string) {
  writeFileSync(CACHE_FILE, `${url.replace(/\/$/, '')}\n`, 'utf-8');
}

export async function resolveOutreachApiUrl(
  tenantSlug: string,
): Promise<OutreachApiResolution> {
  const renderUrl = (process.env.RENDER_API_URL ?? DEFAULT_RENDER).trim();
  const renderReachable = await probeTenantApi(renderUrl, tenantSlug);
  if (renderReachable) {
    saveOutreachApiUrl(renderUrl);
    return { url: renderUrl, source: 'render', renderReachable: true };
  }

  const fromEnv = process.env.OUTREACH_API_URL?.trim();
  if (fromEnv && (await probeTenantApi(fromEnv, tenantSlug))) {
    saveOutreachApiUrl(fromEnv);
    return { url: fromEnv.replace(/\/$/, ''), source: 'env', renderReachable: false };
  }

  const cached = readCachedApiUrl();
  if (cached) {
    const reachable = await probeTenantApi(cached, tenantSlug);
    if (reachable) {
      return { url: cached.replace(/\/$/, ''), source: 'cache', renderReachable: false };
    }
  }

  return { url: renderUrl, source: 'none', renderReachable: false };
}
