import type { ProspectBrandingJson } from './branding-schema.types';

export type ScoredPhoto = {
  url: string;
  score: number;
};

const RASTER_EXT = /\.(webp|jpe?g|png|gif)(\?|$)/i;

/** Unsplash fallbacks when the site pool lacks enough distinct section photos. */
export const STOCK_SECTION_IMAGES = {
  cultureSpotlight:
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
  technology:
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
  lifeAtLeft:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  lifeAtRight:
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
  jobAlerts:
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
} as const;

export type StockSectionKey = keyof typeof STOCK_SECTION_IMAGES;

export function resolveStockSectionImage(section: StockSectionKey): string {
  return STOCK_SECTION_IMAGES[section];
}

/** Icons, logos, partner marks — not suitable for technology / job-alerts panels. */
export function isDecorativeImageUrl(url: string, alt = ''): boolean {
  const combined = `${url} ${alt}`.toLowerCase();
  if (!url.trim()) return true;
  if (/\.svg(\?|$)/i.test(url)) return true;
  if (/\/icons?\//i.test(url)) return true;
  if (/\/partners?\//i.test(url) && /\.(svg|png)(\?|$)/i.test(url)) return true;
  if (/\b(logo|favicon|isotipo|sprite|badge|icon-)\b/i.test(combined)) return true;
  return false;
}

/** Client logos, blog banners, and similar assets — poor section hero panels. */
export function isLowValueSectionPhoto(url: string): boolean {
  const u = url.toLowerCase();
  if (/banner-blog|logos-clientes|logo_\d|\/logo[_-]/i.test(u)) return true;
  if (/\b(cliente|clientes|partner-logo)\b/i.test(u)) return true;
  return false;
}

export function scoreMarketingPhoto(url: string, width = 0, height = 0): number {
  if (isDecorativeImageUrl(url)) return -1;
  if (isLowValueSectionPhoto(url)) return -1;
  let score = 0;
  if (RASTER_EXT.test(url)) score += 60;
  if (/\.webp(\?|$)/i.test(url)) score += 15;
  if (/\.jpe?g(\?|$)/i.test(url)) score += 20;
  const area = width > 0 && height > 0 ? width * height : 120_000;
  score += Math.min(area / 400, 80);
  if (/download-\d|people|portrait|team|office|career|work/i.test(url)) score += 35;
  if (/trabaja|hero/i.test(url)) score += 20;
  if (/galaxia|space|orbit|cloud|satellite/i.test(url)) score += 10;
  if (/banner-blog|logos-clientes|logo_/i.test(url)) score -= 100;
  return score;
}

export function rankPhotoUrls(
  candidates: Array<{ url: string; width?: number; height?: number; alt?: string }>,
): string[] {
  const scored: ScoredPhoto[] = [];
  const seen = new Set<string>();

  for (const c of candidates) {
    const url = c.url?.trim();
    if (!url || seen.has(url) || isDecorativeImageUrl(url, c.alt ?? '')) continue;
    const score = scoreMarketingPhoto(url, c.width ?? 0, c.height ?? 0);
    if (score < 0) continue;
    seen.add(url);
    scored.push({ url, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.url);
}

export function pickBestFromPool(pool: string[], excludeUrls: Set<string>): string | undefined {
  for (const url of pool) {
    if (!excludeUrls.has(url) && !isDecorativeImageUrl(url)) return url;
  }
  return undefined;
}

export function resolveTechnologyImage(
  sectionImage: string | undefined,
  pool: string[],
  excludeUrls: Set<string>,
): string | undefined {
  if (sectionImage && !excludeUrls.has(sectionImage) && !isDecorativeImageUrl(sectionImage)) {
    return sectionImage;
  }
  return pickBestFromPool(pool, excludeUrls);
}

export function buildUsedSectionImageUrls(branding: ProspectBrandingJson): Set<string> {
  const used = new Set<string>();
  const hero =
    branding.hero?.backgroundImageUrl?.trim() ||
    branding.assets?.heroBackgroundImageUrl?.trim();
  if (hero) used.add(hero);

  const landing = branding.landing;
  const tech = landing?.technology?.imageUrl?.trim();
  if (tech) used.add(tech);
  const lifeLeft = landing?.lifeAt?.leftImageUrl?.trim();
  if (lifeLeft) used.add(lifeLeft);
  const lifeRight = landing?.lifeAt?.rightImageUrl?.trim();
  if (lifeRight) used.add(lifeRight);
  return used;
}

/** @deprecated Use buildUsedSectionImageUrls */
export function buildExcludeUrlsForBranding(branding: ProspectBrandingJson): Set<string> {
  return buildUsedSectionImageUrls(branding);
}

function pickLifeAtRightImage(pool: string[], used: Set<string>): string | undefined {
  const thematic = pool.find(
    (u) =>
      !used.has(u) &&
      !isDecorativeImageUrl(u) &&
      !isLowValueSectionPhoto(u) &&
      /galaxia|space|orbit|satellite|cloud/i.test(u),
  );
  if (thematic) return thematic;
  return pickBestFromPool(pool, used);
}

function pickSectionImage(
  current: string | undefined,
  pool: string[],
  used: Set<string>,
  stockFallback: string,
): string {
  const trimmed = current?.trim();
  if (
    trimmed &&
    !used.has(trimmed) &&
    !isDecorativeImageUrl(trimmed) &&
    !isLowValueSectionPhoto(trimmed)
  ) {
    used.add(trimmed);
    return trimmed;
  }
  const fromPool = pickBestFromPool(pool, used);
  const url = fromPool ?? stockFallback;
  used.add(url);
  return url;
}

/** Assign unique photos to technology, life-at, and job-alerts from the marketing pool (or stock). */
export function assignDistinctLandingImages(branding: ProspectBrandingJson): void {
  const landing = branding.landing;
  if (!landing) return;

  const pool = branding.assets?.marketingPhotoUrls ?? [];
  const used = new Set<string>();
  const hero =
    branding.hero?.backgroundImageUrl?.trim() ||
    branding.assets?.heroBackgroundImageUrl?.trim();
  if (hero) used.add(hero);

  if (landing.technology) {
    landing.technology.imageUrl = pickSectionImage(
      landing.technology.imageUrl,
      pool,
      used,
      STOCK_SECTION_IMAGES.technology,
    );
  }

  if (landing.lifeAt) {
    landing.lifeAt.leftImageUrl = pickSectionImage(
      landing.lifeAt.leftImageUrl,
      pool,
      used,
      STOCK_SECTION_IMAGES.lifeAtLeft,
    );
    const rightCurrent = landing.lifeAt.rightImageUrl?.trim();
    if (
      rightCurrent &&
      !used.has(rightCurrent) &&
      !isDecorativeImageUrl(rightCurrent) &&
      !isLowValueSectionPhoto(rightCurrent)
    ) {
      landing.lifeAt.rightImageUrl = rightCurrent;
      used.add(rightCurrent);
    } else {
      const right =
        pickLifeAtRightImage(pool, used) ?? STOCK_SECTION_IMAGES.lifeAtRight;
      landing.lifeAt.rightImageUrl = right;
      used.add(right);
    }
  }

  if (landing.jobAlerts) {
    landing.jobAlerts.imageUrl = pickSectionImage(
      landing.jobAlerts.imageUrl,
      pool,
      used,
      STOCK_SECTION_IMAGES.jobAlerts,
    );
  }

  if (landing.cultureSpotlight) {
    landing.cultureSpotlight.imageUrl = pickSectionImage(
      landing.cultureSpotlight.imageUrl,
      pool,
      used,
      STOCK_SECTION_IMAGES.cultureSpotlight,
    );
  }
}

export function resolveJobAlertsImage(
  branding: ProspectBrandingJson,
  pool: string[],
): string | undefined {
  const used = buildUsedSectionImageUrls(branding);
  const existing = branding.landing?.jobAlerts?.imageUrl?.trim();
  if (
    existing &&
    !used.has(existing) &&
    !isDecorativeImageUrl(existing) &&
    !isLowValueSectionPhoto(existing)
  ) {
    return existing;
  }
  return pickBestFromPool(pool, used);
}
