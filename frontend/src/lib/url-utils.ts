export function normalizeOptionalUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

export function normalizeExtractedLinks(links?: string[] | null): string[] {
  const first = links?.[0]?.trim();
  if (!first) return [];
  const normalized = normalizeOptionalUrl(first);
  return normalized ? [normalized] : [first];
}

export function isValidHttpUrl(raw: string): boolean {
  return normalizeOptionalUrl(raw) !== null;
}
