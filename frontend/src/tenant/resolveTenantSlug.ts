const STORAGE_KEY = 'careers_tenant_slug';

function readTenantFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const slug = new URLSearchParams(window.location.search).get('tenant')?.trim().toLowerCase();
  return slug || null;
}

function readTenantFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY)?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

/** Persist tenant slug from ?tenant= on first visit so in-app navigation keeps the prospect brand. */
export function syncTenantSlugFromUrl(): void {
  if (typeof window === 'undefined') return;
  const fromUrl = readTenantFromUrl();
  if (!fromUrl) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, fromUrl);
  } catch {
    // ignore quota / private mode
  }
}

/** Tenant slug for API calls: env override > URL > sessionStorage. */
export function resolveTenantSlug(): string | undefined {
  const envSlug = import.meta.env.VITE_TENANT_SLUG as string | undefined;
  if (envSlug?.trim()) return envSlug.trim().toLowerCase();

  return readTenantFromUrl() ?? readTenantFromStorage() ?? undefined;
}
