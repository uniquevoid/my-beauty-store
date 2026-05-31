import { enrichPartialBranding } from './brand-token-derivation';
import type { ProspectBrandingJson } from './branding-schema.types';
import { DEFAULT_UNSPLASH_HERO } from './branding-schema.types';
import { pickAccessibleForeground, pickLargeTextForeground } from './color-contrast';
import { extractVisualBrandWithPlaywright } from './extract-visual-brand-playwright';

export type { ProspectBrandingJson } from './branding-schema.types';

export type ExtractProspectBrandingResult = {
  sourceUrl: string;
  companyName: string;
  suggestedSlug: string;
  branding: ProspectBrandingJson;
};

const DEFAULT_PRIMARY = '#003366';
const DEFAULT_ACCENT = '#FF6600';
const DEFAULT_HERO_IMAGE = DEFAULT_UNSPLASH_HERO;

function firstMatch(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return decodeHtmlEntities(value);
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtmlTags(text: string): string {
  return decodeHtmlEntities(text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function resolveUrl(base: string, href: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function slugFromDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '');
    const base = host.split('.')[0] ?? 'prospect';
    return base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  } catch {
    return 'prospect';
  }
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function isUsableBrandColor(hex: string | null): boolean {
  if (!hex || hex.length !== 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
  if (r > 240 && g > 240 && b > 240) return false;
  if (r < 20 && g < 20 && b < 20) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 12) return false;
  return true;
}

const GENERIC_TEMPLATE_BLUES = new Set(['#003366', '#0066CC', '#004080', '#0055AA', '#336699']);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function colorSaturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === 0) return 0;
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

export type RankBrandColorsOptions = {
  /** When CTA is magenta/pink, penalize legacy orange tokens in CSS. */
  deprioritizeOrange?: boolean;
};

function brandColorScore(hex: string, options?: RankBrandColorsOptions): number {
  const upper = hex.toUpperCase();
  let score = colorSaturation(hex) * 100;
  if (GENERIC_TEMPLATE_BLUES.has(upper)) score -= 50;
  const { r, g, b } = hexToRgb(hex);
  if (r > g && r > b) score += 25;
  if (upper === '#FF003D' || upper.startsWith('#FF00') || upper.startsWith('#C10') || upper.startsWith('#D10')) {
    score += 15;
  }
  if (options?.deprioritizeOrange && r >= 180 && g >= 80 && b < Math.min(r, g) * 0.65) {
    score -= 45;
  }
  if (options?.deprioritizeOrange && r >= 120 && b >= 80 && g < r * 0.75 && b > g) {
    score += 20;
  }
  return score;
}

/** Rank extracted hex colors for primary brand selection (highest first). */
export function rankBrandColors(colors: string[], options?: RankBrandColorsOptions): string[] {
  const unique = [...new Set(colors.map((c) => c.toUpperCase()))].filter(isUsableBrandColor);
  return unique.sort(
    (a, b) => brandColorScore(b, options) - brandColorScore(a, options),
  );
}

export function pickPrimaryBrandColor(input: {
  colors: string[];
  themeColor: string | null;
  override?: string;
  rankOptions?: RankBrandColorsOptions;
}): string {
  const override = normalizeHexColor(input.override?.trim() ?? null);
  if (override && isUsableBrandColor(override)) return override;

  const ranked = rankBrandColors(input.colors, input.rankOptions);
  if (ranked.length > 0) return ranked[0]!;

  const theme = normalizeHexColor(input.themeColor);
  if (theme && isUsableBrandColor(theme)) return theme;

  return DEFAULT_PRIMARY;
}

function normalizeHexColor(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    if (trimmed.length === 4) {
      const r = trimmed[1];
      const g = trimmed[2];
      const b = trimmed[3];
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    return trimmed.length === 7 ? trimmed.toUpperCase() : trimmed;
  }
  const rgbMatch = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = Number(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = Number(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  return null;
}

function extractHexColorsFromCss(css: string): string[] {
  const found = new Set<string>();
  const hexPattern = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const cssVarPattern = /--(?:brand|primary|accent|color-primary|theme)[^:]*:\s*([^;]+)/gi;

  let match: RegExpExecArray | null;
  while ((match = cssVarPattern.exec(css)) !== null) {
    const normalized = normalizeHexColor(match[1]?.trim() ?? null);
    if (normalized && isUsableBrandColor(normalized)) found.add(normalized);
  }

  for (const hex of css.match(hexPattern) ?? []) {
    const normalized = normalizeHexColor(hex);
    if (normalized && isUsableBrandColor(normalized)) found.add(normalized);
  }

  return [...found];
}

function extractStylesheetUrls(html: string, pageUrl: string): string[] {
  const urls: string[] = [];
  const linkPattern =
    /<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html)) !== null) {
    const tag = match[0];
    const href =
      tag.match(/href=["']([^"']+)["']/i)?.[1] ??
      tag.match(/href=([^\s>]+)/i)?.[1];
    if (!href || href.startsWith('data:')) continue;
    try {
      const resolved = new URL(href, pageUrl);
      if (resolved.origin === new URL(pageUrl).origin) {
        urls.push(resolved.href);
      }
    } catch {
      /* skip invalid */
    }
  }
  return [...new Set(urls)].slice(0, 5);
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CareersPlatformProspectBot/1.0 (+prospect-demo)',
        Accept: 'text/css,text/html,*/*',
      },
      redirect: 'follow',
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function collectBrandColorsFromPage(html: string, pageUrl: string): Promise<string[]> {
  const found = new Set<string>(extractHexColorsFromCss(html));
  const sheets = extractStylesheetUrls(html, pageUrl);
  await Promise.all(
    sheets.map(async (sheetUrl) => {
      const css = await fetchText(sheetUrl);
      if (css) {
        for (const hex of extractHexColorsFromCss(css)) found.add(hex);
      }
    }),
  );
  return rankBrandColors([...found]);
}

function pickSocialImageUrl(html: string, pageUrl: string): string | undefined {
  const raw =
    firstMatch(html, [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    ]) ??
    firstMatch(html, [
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    ]);

  if (!raw) return undefined;
  return resolveUrl(pageUrl, raw);
}

function pickLogoUrl(html: string, pageUrl: string): string | undefined {
  const appleIcons: { href: string; size: number }[] = [];
  const applePattern =
    /<link[^>]+(?:rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']|href=["']([^"']+)["'][^>]*rel=["'][^"']*apple-touch-icon[^"']*["'])[^>]*>/gi;
  let appleMatch: RegExpExecArray | null;
  while ((appleMatch = applePattern.exec(html)) !== null) {
    const href = appleMatch[1] ?? appleMatch[2];
    if (!href) continue;
    const sizeMatch = href.match(/(\d{2,3})x\1/i);
    appleIcons.push({
      href,
      size: sizeMatch ? Number(sizeMatch[1]) : 57,
    });
  }
  appleIcons.sort((a, b) => b.size - a.size);
  if (appleIcons.length > 0) {
    return resolveUrl(pageUrl, appleIcons[0]!.href);
  }

  const icon =
    firstMatch(html, [
      /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["']/i,
      /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    ]) ?? undefined;
  if (icon) return resolveUrl(pageUrl, icon);

  const logoImg =
    firstMatch(html, [
      /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
      /<img[^>]+src=["']([^"']+)["'][^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["']/i,
    ]) ??
    firstMatch(html, [
      /<img[^>]+alt=["'][^"']*(?:logo|brand)[^"']*["'][^>]+src=["']([^"']+)["']/i,
      /<img[^>]+src=["']([^"']+)["'][^>]+alt=["'][^"']*(?:logo|brand)[^"']*["']/i,
    ]);
  if (logoImg) return resolveUrl(pageUrl, logoImg);

  return undefined;
}

function trimSiteSuffix(title: string, companyName: string): string {
  const parts = title.split(/[|\-–—·]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return title.trim();

  const companyLower = companyName.toLowerCase();
  const withoutSite = parts.filter((p) => !p.toLowerCase().includes(companyLower));
  return (withoutSite[0] ?? parts[0] ?? title).trim();
}

function pickHeroHeadline(html: string, companyName: string): string | undefined {
  const ogTitle =
    firstMatch(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    ]) ?? undefined;

  if (ogTitle) {
    const trimmed = trimSiteSuffix(ogTitle, companyName);
    if (trimmed && !/^build your career at/i.test(trimmed)) return trimmed;
  }

  const h1 = firstMatch(html, [/<h1[^>]*>([\s\S]*?)<\/h1>/i]);
  if (h1) {
    const text = stripHtmlTags(h1);
    if (text && text.length <= 120) return text;
  }

  return undefined;
}

function pickFirstContentParagraph(html: string): string | undefined {
  const articleMatch = html.match(/<(?:article|main|section)[^>]*>([\s\S]*?)<\/(?:article|main|section)>/i);
  const scope = articleMatch?.[1] ?? html;
  const paragraphMatch = scope.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!paragraphMatch?.[1]) return undefined;
  const text = stripHtmlTags(paragraphMatch[1]);
  return text.length >= 40 ? text.slice(0, 600) : undefined;
}

function pickCompanyName(html: string, fallbackDomain: string): string {
  const fromMeta =
    firstMatch(html, [
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
    ]) ??
    firstMatch(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    ]);

  if (fromMeta) {
    return fromMeta.split(/[|\-–—]/)[0]?.trim() || fromMeta;
  }

  const title = firstMatch(html, [/<title[^>]*>([^<]+)<\/title>/i]);
  if (title) {
    return title.split(/[|\-–—]/)[0]?.trim() || title;
  }

  return fallbackDomain
    .replace(/^www\./i, '')
    .split('.')[0]!
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickDescription(html: string): string | null {
  return (
    firstMatch(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    ]) ??
    firstMatch(html, [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ])
  );
}

function pickThemeColor(html: string): string | null {
  const raw =
    firstMatch(html, [
      /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i,
    ]) ??
    firstMatch(html, [
      /<meta[^>]+name=["']msapplication-TileColor["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']msapplication-TileColor["']/i,
    ]);
  return normalizeHexColor(raw);
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CareersPlatformProspectBot/1.0 (+prospect-demo)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function pickAboutBody(
  pageUrl: URL,
  primaryHtml: string,
  description: string | null,
): Promise<string | undefined> {
  const isAboutPage = /\/about\b/i.test(pageUrl.pathname);
  const aboutHtml = isAboutPage ? primaryHtml : await fetchHtml(`${pageUrl.origin}/about`);
  const html = aboutHtml ?? primaryHtml;

  const paragraph = pickFirstContentParagraph(html);
  if (paragraph) {
    if (description && !paragraph.toLowerCase().includes(description.toLowerCase().slice(0, 40))) {
      return `${description}\n\n${paragraph}`;
    }
    return paragraph;
  }

  return description ?? undefined;
}

export function buildProspectBrandingJson(input: {
  companyName: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroBackgroundImageUrl?: string;
  aboutBody?: string;
  metaDescription?: string;
}): ProspectBrandingJson {
  const companyName = input.companyName.trim();
  const primary = input.primaryColor?.trim() || DEFAULT_PRIMARY;
  const accent = input.accentColor?.trim() || DEFAULT_ACCENT;
  const description =
    input.metaDescription?.trim() ||
    input.heroSubheadline?.trim() ||
    `Explore careers at ${companyName}. Search open roles and apply in minutes.`;

  const partial: ProspectBrandingJson = {
    companyName,
    logoUrl: input.logoUrl?.trim() || undefined,
    logoAlt: companyName,
    metaDescription: description,
    colors: {
      primary,
      primaryForeground: pickLargeTextForeground(primary),
      navLink: primary,
      accent,
      accentForeground: pickAccessibleForeground(accent),
    },
    hero: {
      badgeText: "We're hiring!",
      headline: input.heroHeadline?.trim() || `Build your career at ${companyName}.`,
      subheadline:
        input.heroSubheadline?.trim() ||
        `Discover opportunities across teams and locations at ${companyName}.`,
      backgroundImageUrl:
        input.heroBackgroundImageUrl?.trim() &&
        input.heroBackgroundImageUrl.trim() !== DEFAULT_HERO_IMAGE
          ? input.heroBackgroundImageUrl.trim()
          : input.heroBackgroundImageUrl?.trim() || undefined,
    },
    landing: {
      about: {
        heading: `About ${companyName.replace(/\s+(Inc|LLC|Ltd|Corp|Corporation)\.?$/i, '')}`,
        body:
          input.aboutBody?.trim() ||
          description ||
          `${companyName} is growing. Join a team focused on innovation, inclusion, and impact.`,
        stats: [],
        ctaLabel: 'View open positions',
      },
    },
  };

  return partial;
}

async function extractProspectBrandingViaFetch(
  parsed: URL,
  overrides?: {
    companyName?: string;
    slug?: string;
    primaryColor?: string;
  },
): Promise<ExtractProspectBrandingResult> {
  const html = await fetchHtml(parsed.href);
  if (!html) {
    throw new Error(`Failed to fetch ${parsed.href}`);
  }

  const domainLabel = parsed.hostname.replace(/^www\./i, '');
  const companyName = overrides?.companyName?.trim() || pickCompanyName(html, domainLabel);
  const description = pickDescription(html);
  const logoUrl = pickLogoUrl(html, parsed.href);
  const heroBackground = pickSocialImageUrl(html, parsed.href);
  const themeColor = pickThemeColor(html);
  const cssColors = await collectBrandColorsFromPage(html, parsed.href);
  const primaryColor = pickPrimaryBrandColor({
    colors: cssColors,
    themeColor,
    override: overrides?.primaryColor,
  });
  const accentColor =
    cssColors.find((c) => c.toUpperCase() !== primaryColor.toUpperCase()) ?? DEFAULT_ACCENT;

  const heroHeadline = pickHeroHeadline(html, companyName);
  const aboutBody = await pickAboutBody(parsed, html, description);

  const partial = buildProspectBrandingJson({
    companyName,
    logoUrl,
    primaryColor,
    accentColor,
    heroHeadline,
    heroSubheadline: description ?? undefined,
    heroBackgroundImageUrl: heroBackground,
    aboutBody,
    metaDescription: description
      ? `Join ${companyName} — ${description}`
      : `Explore careers at ${companyName}. Search open roles and apply in minutes.`,
  });

  const branding = await enrichPartialBranding(partial, parsed.href, 'fetch-fallback');
  const suggestedSlug =
    overrides?.slug?.trim().toLowerCase() || slugFromDomain(parsed.href) || slugFromName(companyName);

  return {
    sourceUrl: parsed.href,
    companyName,
    suggestedSlug,
    branding,
  };
}

export async function extractProspectBrandingFromUrl(
  rawUrl: string,
  overrides?: {
    companyName?: string;
    slug?: string;
    primaryColor?: string;
  },
): Promise<ExtractProspectBrandingResult> {
  const sourceUrl = rawUrl.trim();
  if (!sourceUrl) throw new Error('URL is required.');

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  try {
    const { branding } = await extractVisualBrandWithPlaywright(parsed.href, {
      companyName: overrides?.companyName,
      primaryColor: overrides?.primaryColor,
    });
    const companyName =
      overrides?.companyName?.trim() || (branding.companyName as string) || 'Prospect';
    const suggestedSlug =
      overrides?.slug?.trim().toLowerCase() ||
      slugFromDomain(parsed.href) ||
      slugFromName(companyName);

    return {
      sourceUrl: parsed.href,
      companyName,
      suggestedSlug,
      branding,
    };
  } catch (playwrightErr) {
    const msg = playwrightErr instanceof Error ? playwrightErr.message : String(playwrightErr);
    console.warn(`Playwright visual extraction failed (${msg}); using fetch fallback.`);
    return extractProspectBrandingViaFetch(parsed, overrides);
  }
}
