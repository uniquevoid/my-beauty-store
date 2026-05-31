import type { LandingCultureSpotlight, ProspectLanding } from './branding-schema.types';
import {
  buildCultureSpotlightBody,
  buildCultureSpotlightHeading,
  CULTURE_SPOTLIGHT_CTA_LABEL,
} from './prospect-section-copy';
import { resolveStockSectionImage } from './pick-section-images';

export type ArticleLinkCandidate = {
  url: string;
  title: string;
  score: number;
};

const BLOG_URL_RE =
  /\/(blog|news|insights|stories|resources|posts?|articles?|press|media)\//i;

const CULTURE_TEXT_RE =
  /\b(employee|team|life\s+at|culture|interview|work\s+with\s+us|careers|day\s+in|behind\s+the|our\s+people|equipo|vida\s+en|cultura|entrevista|trabajar)\b/i;

const PRODUCT_PRESS_RE =
  /\b(press\s+release|product\s+launch|funding|partnership|acquisition|fda|clinical\s+trial|publication)\b/i;

const LOW_VALUE_HERO_RE = /metadatos|metadata|og-|social-share|favicon/i;

export function isLowValueHeroImageUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;
  return LOW_VALUE_HERO_RE.test(url);
}

export function scoreArticleLink(url: string, linkText: string, pageTitle?: string): number {
  let score = 0;
  const combined = `${linkText} ${pageTitle ?? ''}`.trim();

  if (BLOG_URL_RE.test(url)) score += 40;
  if (CULTURE_TEXT_RE.test(combined)) score += 50;
  if (CULTURE_TEXT_RE.test(linkText)) score += 20;
  if (PRODUCT_PRESS_RE.test(combined)) score -= 30;
  if (/\/contact/i.test(url)) score += 15;
  if (/\/careers/i.test(url)) score += 25;

  return score;
}

export function pickBestArticleLink(candidates: ArticleLinkCandidate[]): ArticleLinkCandidate | null {
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => b.score - a.score)[0] ?? null;
}

export function buildFallbackArticleUrl(origin: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/contact`;
}

export function needsCultureSpotlightFallback(landing: ProspectLanding): boolean {
  const sections = landing.sections;
  const socialProofDisabled =
    !sections?.customers &&
    !sections?.testimonials &&
    !sections?.lifeAt &&
    !sections?.coreValues;

  const hasSocialProofData =
    (landing.customers?.logos?.length ?? 0) >= 1 ||
    (landing.testimonials?.items?.length ?? 0) > 0 ||
    Boolean(landing.lifeAt?.heading) ||
    (landing.coreValues?.values?.length ?? 0) >= 2;

  return socialProofDisabled && !hasSocialProofData;
}

export function ensureCultureSpotlightFallback(
  landing: ProspectLanding,
  companyName: string,
  origin: string,
  options?: {
    articleCandidates?: ArticleLinkCandidate[];
    marketingPhotoUrls?: string[];
    heroImageUrl?: string;
  },
): ProspectLanding {
  if (!needsCultureSpotlightFallback(landing)) {
    return landing;
  }

  const best = pickBestArticleLink(options?.articleCandidates ?? []);
  const fallbackUrl = buildFallbackArticleUrl(origin);
  const articleUrl = best?.url ?? fallbackUrl;

  const photo =
    options?.marketingPhotoUrls?.find((u) => u && u !== options.heroImageUrl) ??
    options?.marketingPhotoUrls?.[0] ??
    resolveStockSectionImage('cultureSpotlight');

  landing.cultureSpotlight = {
    heading: buildCultureSpotlightHeading(companyName),
    body: buildCultureSpotlightBody(companyName),
    ctaLabel: CULTURE_SPOTLIGHT_CTA_LABEL,
    articleUrl,
    articleTitle: best?.title,
    imageUrl: photo,
  };

  landing.sections = {
    ...landing.sections,
    cultureSpotlight: true,
  };

  return landing;
}

export function collectArticleCandidatesFromAnchors(
  anchors: { href: string; text: string }[],
  origin: string,
): ArticleLinkCandidate[] {
  const seen = new Set<string>();
  const candidates: ArticleLinkCandidate[] = [];

  for (const { href, text } of anchors) {
    if (!href?.startsWith('http')) continue;
    try {
      const parsed = new URL(href);
      const originParsed = new URL(origin);
      if (parsed.hostname !== originParsed.hostname) continue;
    } catch {
      continue;
    }

    const normalized = href.split('#')[0] ?? href;
    if (seen.has(normalized)) continue;

    const score = scoreArticleLink(normalized, text);
    if (score < 15 && !BLOG_URL_RE.test(normalized) && !CULTURE_TEXT_RE.test(text)) continue;

    seen.add(normalized);
    candidates.push({
      url: normalized,
      title: text.trim() || normalized,
      score,
    });
  }

  return candidates;
}

export function hasCultureSpotlightData(landing: ProspectLanding | undefined): boolean {
  return Boolean(
    landing?.cultureSpotlight?.articleUrl?.trim() &&
      landing?.cultureSpotlight?.body?.trim(),
  );
}
