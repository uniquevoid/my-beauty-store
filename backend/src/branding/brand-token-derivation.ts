import { deriveBrandPalette } from './derive-brand-palette';
import type { ProspectBrandingJson } from './branding-schema.types';
import { DEFAULT_UNSPLASH_HERO } from './branding-schema.types';
import { finalizeProspectBranding } from './finalize-prospect-branding';
import { isLowValueHeroImageUrl } from './extract-culture-spotlight';
import { isCustomerFacingCopy } from './careers-copy-intent';
import {
  deriveMutedOnPrimary,
  deriveReadableText,
  deriveSectionSurface,
  parseHexColor,
  pickAccessibleForeground,
  pickLargeTextForeground,
  relativeLuminance,
} from './color-contrast';

export type VisualBrandSnapshot = {
  sourceUrl: string;
  companyName: string;
  metaDescription: string | null;
  logoUrl?: string;
  faviconUrl?: string;
  googleFontsUrl?: string;
  heroBackgroundImageUrl?: string;
  heroVideoUrl?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  cssColors: string[];
  themeColor: string | null;
  body: { background: string; color: string; fontFamily: string };
  header: { background: string; color: string; borderColor: string };
  footer: { background: string; color: string };
  primaryButton: { background: string; color: string; borderRadius: string };
  hero: { backgroundImage: string; textTransform: string };
  h1Text?: string;
  h1Color?: string;
};

function parseRgbColor(value: string): string | null {
  return parseHexColor(value);
}

function contrastForeground(bgHex: string): string {
  return pickLargeTextForeground(bgHex);
}

function buttonForeground(bgHex: string): string {
  return pickAccessibleForeground(bgHex);
}

export function deriveHeroOverlay(
  primary: string,
  background: string,
  options?: { lightHeroImage?: boolean },
): string {
  const bg = parseRgbColor(background) ?? '#FFFFFF';
  const darkBg = relativeLuminance(bg) < 0.35;
  const { r, g, b } = {
    r: parseInt(primary.slice(1, 3), 16),
    g: parseInt(primary.slice(3, 5), 16),
    b: parseInt(primary.slice(5, 7), 16),
  };

  if (darkBg) {
    return `linear-gradient(135deg, rgba(0, 0, 0, 0.75) 0%, rgba(${r}, ${g}, ${b}, 0.55) 50%, rgba(0, 0, 0, 0.35) 100%)`;
  }
  if (options?.lightHeroImage) {
    return `linear-gradient(135deg, rgba(0, 0, 0, 0.65) 0%, rgba(${r}, ${g}, ${b}, 0.4) 50%, rgba(0, 0, 0, 0.55) 100%)`;
  }
  return `linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(${r}, ${g}, ${b}, 0.35) 50%, rgba(0, 0, 0, 0.45) 100%)`;
}

export function deriveFooterAccentBorder(primary: string, accent: string): string {
  return `linear-gradient(90deg, ${primary} 0%, ${accent} 50%, ${primary} 100%)`;
}

function normalizeFontStack(fontFamily: string): string {
  const first = fontFamily.split(',')[0]?.trim().replace(/['"]/g, '') ?? 'sans-serif';
  if (/^(serif|sans-serif|monospace|system-ui)$/i.test(first)) {
    return `${first}, system-ui, sans-serif`;
  }
  return `${first}, system-ui, sans-serif`;
}

export function buildProspectBrandingFromSnapshot(
  snapshot: VisualBrandSnapshot,
  method: 'playwright' | 'fetch-fallback',
  overrides?: { primaryColor?: string; companyName?: string },
): ProspectBrandingJson {
  const companyName = overrides?.companyName?.trim() || snapshot.companyName.trim();
  const { primary, accent } = deriveBrandPalette({
    cssColors: snapshot.cssColors,
    themeColor: snapshot.themeColor,
    roles: {
      ctaBackground: snapshot.primaryButton.background,
      headlineColor: snapshot.h1Color ?? snapshot.body.color,
      footerBackground: snapshot.footer.background,
    },
    override: overrides?.primaryColor,
  });

  const bodyBg = parseRgbColor(snapshot.body.background) ?? '#FFFFFF';
  const bodyTextRaw = parseRgbColor(snapshot.body.color);
  const bodyText = deriveReadableText(bodyBg, bodyTextRaw);
  const headerBg = parseRgbColor(snapshot.header.background) ?? bodyBg;
  const headerTextRaw = parseRgbColor(snapshot.header.color);
  const headerText = deriveReadableText(headerBg, headerTextRaw ?? bodyTextRaw);
  const footerBg = parseRgbColor(snapshot.footer.background) ?? '#0B1A33';
  const btnBg = parseRgbColor(snapshot.primaryButton.background) ?? primary;
  const resolvedPrimary = primary;
  const btnTextParsed = parseRgbColor(snapshot.primaryButton.color);
  const btnText =
    btnTextParsed && buttonForeground(btnBg) === btnTextParsed
      ? btnTextParsed
      : buttonForeground(btnBg);
  const primaryFg = contrastForeground(resolvedPrimary);
  const mutedOnPrimary = deriveMutedOnPrimary(resolvedPrimary, primaryFg);
  const { surface, surfaceText } = deriveSectionSurface(bodyBg, accent);

  const heroBg =
    snapshot.heroBackgroundImageUrl ||
    (snapshot.hero.backgroundImage &&
    snapshot.hero.backgroundImage !== 'none' &&
    !snapshot.hero.backgroundImage.includes('gradient')
      ? extractUrlFromBackground(snapshot.hero.backgroundImage)
      : undefined);

  const description =
    snapshot.metaDescription?.trim() ||
    snapshot.heroSubheadline?.trim() ||
    `Explore careers at ${companyName}. Search open roles and apply in minutes.`;

  const headline =
    snapshot.heroHeadline?.trim() ||
    snapshot.h1Text?.trim() ||
    `Build your career at ${companyName}.`;

  const headingStyle: 'uppercase' | 'normal' =
    snapshot.hero.textTransform === 'uppercase' ? 'uppercase' : 'normal';

  const heroOverlay = deriveHeroOverlay(primary, bodyBg, {
    lightHeroImage: isLowValueHeroImageUrl(heroBg),
  });

  const aboutBody =
    description && !isCustomerFacingCopy(description) ? description : '';

  return {
    companyName,
    logoUrl: snapshot.logoUrl,
    logoAlt: companyName,
    metaDescription: description.startsWith('Join ')
      ? description
      : `Join ${companyName} — ${description}`,
    colors: {
      primary: resolvedPrimary,
      primaryForeground: primaryFg,
      mutedOnPrimary,
      heroOverlay,
      accent,
      accentForeground: contrastForeground(accent),
      highlight: accent,
      navLink: headerText,
      background: bodyBg,
      text: bodyText,
      footerBackground: footerBg,
      footerAccentBorder: deriveFooterAccentBorder(primary, accent),
      surface,
      surfaceText,
    },
    hero: {
      badgeText: "We're hiring!",
      headline,
      subheadline: snapshot.heroSubheadline?.trim() || description,
      backgroundImageUrl: heroBg && heroBg !== DEFAULT_UNSPLASH_HERO ? heroBg : heroBg,
    },
    typography: {
      fontFamilySans: normalizeFontStack(snapshot.body.fontFamily),
      fontFamilyHeading: normalizeFontStack(snapshot.body.fontFamily),
      googleFontsUrl: snapshot.googleFontsUrl,
      headingStyle,
    },
    theme: {
      heroOverlay,
      background: bodyBg,
      text: bodyText,
      footerBackground: footerBg,
      footerAccentBorder: deriveFooterAccentBorder(primary, accent),
      borderRadius: snapshot.primaryButton.borderRadius || '9999px',
    },
    components: {
      header: {
        background: headerBg,
        text: headerText,
        borderColor: parseRgbColor(snapshot.header.borderColor) ?? undefined,
      },
      primaryButton: {
        background: btnBg,
        text: btnText,
        borderRadius: snapshot.primaryButton.borderRadius || '9999px',
      },
      hero: { minHeight: '520px', overlayOpacity: 1 },
    },
    assets: {
      heroBackgroundImageUrl: heroBg,
      heroVideoUrl: snapshot.heroVideoUrl,
      faviconUrl: snapshot.faviconUrl,
    },
    source: {
      url: snapshot.sourceUrl,
      extractedAt: new Date().toISOString(),
      method,
    },
    landing: {
      sections: { jobAlerts: true },
      about: {
        heading: `About ${companyName.replace(/\s+(Inc|LLC|Ltd|Corp|Corporation)\.?$/i, '')}`,
        body: aboutBody,
        stats: [],
        ctaLabel: 'View open positions',
      },
    },
  };
}

function extractUrlFromBackground(bg: string): string | undefined {
  const match = bg.match(/url\(["']?([^"')]+)["']?\)/i);
  return match?.[1]?.trim();
}

/** Enrich partial branding from fetch fallback with defaults. */
export async function enrichPartialBranding(
  partial: ProspectBrandingJson,
  sourceUrl: string,
  method: 'playwright' | 'fetch-fallback',
): Promise<ProspectBrandingJson> {
  const primary = partial.colors?.primary ?? '#003366';
  const accent = partial.colors?.accent ?? '#FF6600';
  const background = partial.colors?.background ?? partial.theme?.background ?? '#FAF7F2';
  const text = partial.colors?.text ?? partial.theme?.text ?? '#2B2B2B';
  const footerBackground =
    partial.colors?.footerBackground ?? partial.theme?.footerBackground ?? '#0B1A33';
  const heroOverlay =
    partial.colors?.heroOverlay ??
    partial.theme?.heroOverlay ??
    deriveHeroOverlay(primary, background);

  const primaryForeground =
    partial.colors?.primaryForeground ?? pickLargeTextForeground(primary);
  const accentForeground =
    partial.colors?.accentForeground ?? pickAccessibleForeground(accent);
  const mutedOnPrimary =
    partial.colors?.mutedOnPrimary ?? deriveMutedOnPrimary(primary, primaryForeground);

  const enriched: ProspectBrandingJson = {
    ...partial,
    colors: {
      ...partial.colors,
      primary: partial.colors?.primary ?? primary,
      primaryForeground,
      mutedOnPrimary,
      accent: partial.colors?.accent ?? accent,
      accentForeground,
      highlight: partial.colors?.highlight ?? accent,
      navLink: partial.colors?.navLink ?? primary,
      background: partial.colors?.background ?? background,
      text: partial.colors?.text ?? text,
      footerBackground: partial.colors?.footerBackground ?? footerBackground,
      footerAccentBorder:
        partial.colors?.footerAccentBorder ?? deriveFooterAccentBorder(primary, accent),
      heroOverlay,
    },
    typography: partial.typography ?? {
      fontFamilySans: 'Inter, system-ui, sans-serif',
      headingStyle: 'normal',
    },
    theme: {
      heroOverlay,
      background,
      text,
      footerBackground,
      footerAccentBorder: deriveFooterAccentBorder(primary, accent),
      borderRadius: '9999px',
      ...partial.theme,
    },
    components: partial.components ?? {
      header: { background: '#FFFFFF', text: text },
      primaryButton: {
        background: primary,
        text: buttonForeground(primary),
        borderRadius: '9999px',
      },
    },
    assets: {
      heroBackgroundImageUrl: partial.hero?.backgroundImageUrl,
      ...partial.assets,
    },
    source: partial.source ?? {
      url: sourceUrl,
      extractedAt: new Date().toISOString(),
      method,
    },
  };

  return finalizeProspectBranding(enriched);
}

