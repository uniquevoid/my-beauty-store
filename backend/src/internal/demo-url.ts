/** Build a shareable prospect demo URL (subdomain or ?tenant= on APP_PUBLIC_URL). */
export function buildShareableDemoUrl(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const platform = process.env.PLATFORM_DOMAIN?.trim();
  const base = process.env.APP_PUBLIC_URL?.trim()?.replace(/\/$/, '');

  if (platform) return `https://${normalized}.${platform}`;
  if (base) return `${base}/?tenant=${encodeURIComponent(normalized)}`;
  return null;
}
