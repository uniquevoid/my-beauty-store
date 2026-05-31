import { isNeutralBrandColor, parseHexColor } from './color-contrast';
import {
  pickPrimaryBrandColor,
  rankBrandColors,
  type RankBrandColorsOptions,
} from './extract-prospect-branding';

export type BrandPaletteRoles = {
  ctaBackground?: string | null;
  headlineColor?: string | null;
  footerBackground?: string | null;
};

export type DerivedBrandPalette = {
  primary: string;
  accent: string;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** Magenta / pink brand CTA (high R and B, moderate G). */
export function isMagentaPinkBrand(hex: string): boolean {
  const normalized = parseHexColor(hex);
  if (!normalized) return false;
  const { r, g, b } = hexToRgb(normalized);
  return r >= 120 && b >= 80 && g < r * 0.75 && b > g;
}

/** Orange accent noise common in legacy CSS (high R and G, low B). */
export function isOrangeBrandNoise(hex: string): boolean {
  const normalized = parseHexColor(hex);
  if (!normalized) return false;
  const { r, g, b } = hexToRgb(normalized);
  return r >= 180 && g >= 80 && b < Math.min(r, g) * 0.65;
}

/** Sky / brand blue suitable as accent (headlines, links). */
export function isBlueCyanAccent(hex: string): boolean {
  const normalized = parseHexColor(hex);
  if (!normalized) return false;
  const { r, g, b } = hexToRgb(normalized);
  return b >= 120 && b >= r * 1.1 && b > g;
}

/**
 * Resolve primary + accent from Playwright roles and CSS, preferring hero CTA over stylesheet noise.
 */
export function deriveBrandPalette(input: {
  cssColors: string[];
  themeColor: string | null;
  roles: BrandPaletteRoles;
  override?: string;
}): DerivedBrandPalette {
  const cta = parseHexColor(input.roles.ctaBackground ?? '');
  const headline = parseHexColor(input.roles.headlineColor ?? '');
  const deprioritizeOrange = Boolean(cta && isMagentaPinkBrand(cta));

  const rankOptions: RankBrandColorsOptions | undefined = deprioritizeOrange
    ? { deprioritizeOrange: true }
    : undefined;

  const ctaUsable =
    cta && !isOrangeBrandNoise(cta) && !isNeutralBrandColor(cta) ? cta : null;

  const primary =
    (input.override && parseHexColor(input.override)) ||
    ctaUsable ||
    pickPrimaryBrandColor({
      colors: [
        cta,
        headline,
        ...input.cssColors,
        parseHexColor(input.themeColor ?? ''),
      ].filter((c): c is string => Boolean(c)),
      themeColor: input.themeColor,
      rankOptions,
    });

  let accent: string | null = null;
  if (headline && isBlueCyanAccent(headline) && headline.toUpperCase() !== primary.toUpperCase()) {
    accent = headline;
  }

  if (!accent) {
    const ranked = rankBrandColors(
      [
        headline,
        ...input.cssColors,
        parseHexColor(input.themeColor ?? ''),
      ].filter((c): c is string => Boolean(c)),
      rankOptions,
    );
    accent =
      ranked.find((c) => c.toUpperCase() !== primary.toUpperCase() && !isOrangeBrandNoise(c)) ??
      ranked.find((c) => c.toUpperCase() !== primary.toUpperCase()) ??
      '#0066CC';
  }

  return { primary, accent };
}
