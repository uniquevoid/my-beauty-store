import type { ProspectBrandingJson } from './branding-schema.types';
import {
  adjustPrimaryForPageContrast,
  deriveMutedOnPrimary,
  deriveReadableText,
  deriveSectionSurface,
  isNeutralBrandColor,
  meetsContrastAA,
  parseHexColor,
  pickAccessibleForeground,
  pickLargeTextForeground,
  relativeLuminance,
} from './color-contrast';
import { deriveHeroOverlay } from './brand-token-derivation';
import { rankBrandColors } from './extract-prospect-branding';
import {
  assignDistinctLandingImages,
  isDecorativeImageUrl,
  resolveJobAlertsImage,
  resolveStockSectionImage,
} from './pick-section-images';

function resolveNonNeutralPrimary(
  branding: ProspectBrandingJson,
  rankedColors: string[],
): string {
  const current = branding.colors?.primary?.trim() ?? '';
  if (current && !isNeutralBrandColor(current)) return current;

  const accent = branding.colors?.accent?.trim();
  if (accent && !isNeutralBrandColor(accent)) return accent;

  const highlight = branding.colors?.highlight?.trim();
  if (highlight && !isNeutralBrandColor(highlight)) return highlight;

  for (const candidate of rankedColors) {
    if (!isNeutralBrandColor(candidate)) return candidate;
  }

  return '#FF6600';
}

function estimateHeroOverlayBackground(pageBackground: string): string {
  const bg = parseHexColor(pageBackground) ?? '#FFFFFF';
  const lum = relativeLuminance(bg);
  if (lum >= 0.35) {
    return '#3A3A3A';
  }
  return bg;
}

function heroImageUrl(branding: ProspectBrandingJson): string | undefined {
  return (
    branding.hero?.backgroundImageUrl?.trim() ||
    branding.assets?.heroBackgroundImageUrl?.trim() ||
    undefined
  );
}

function ensureHeroTextContrast(out: ProspectBrandingJson, background: string, primary: string): void {
  const lightPage = relativeLuminance(parseHexColor(background) ?? '#FFFFFF') >= 0.35;
  const heroImg = heroImageUrl(out);
  const lightHeroImage = Boolean(
    heroImg && /metadatos|metadata|og-|social-share|favicon|preview/i.test(heroImg),
  );

  if (lightPage) {
    const overlay = deriveHeroOverlay(primary, background, { lightHeroImage });
    out.colors.heroOverlay = overlay;
    if (out.theme) {
      out.theme.heroOverlay = overlay;
    }
  }

  const overlayBg = estimateHeroOverlayBackground(background);
  out.colors.heroTextForeground = pickLargeTextForeground(overlayBg);
}

/** Auto-fix contrast and surface tokens before provisioning a prospect demo. */
export function ensureAccessibleBrandTokens(branding: ProspectBrandingJson): ProspectBrandingJson {
  const out: ProspectBrandingJson = { ...branding, colors: { ...branding.colors } };

  const background =
    out.colors?.background?.trim() ?? out.theme?.background?.trim() ?? '#FFFFFF';
  const accent = out.colors?.accent?.trim() ?? out.colors?.highlight?.trim();
  const ranked = rankBrandColors([
    out.colors?.primary ?? '',
    out.colors?.accent ?? '',
    out.colors?.highlight ?? '',
  ].filter(Boolean));

  const primary = adjustPrimaryForPageContrast(
    resolveNonNeutralPrimary(out, ranked),
    background,
    3,
  );
  const primaryForeground = pickLargeTextForeground(primary);
  const mutedOnPrimary = deriveMutedOnPrimary(primary, primaryForeground);

  const text = deriveReadableText(background, out.colors?.text ?? out.theme?.text);
  const headerBg =
    out.components?.header?.background?.trim() ?? background;
  const headerText = deriveReadableText(
    headerBg,
    out.components?.header?.text ?? out.colors?.navLink,
  );

  const { surface, surfaceText } = deriveSectionSurface(background, accent ?? primary);
  const surfaceBg = out.colors?.surface?.trim() ?? surface;
  const surfaceFg = out.colors?.surfaceText?.trim() ?? surfaceText;

  out.colors = {
    ...out.colors,
    primary,
    primaryForeground,
    mutedOnPrimary,
    accent: out.colors?.accent ?? primary,
    accentForeground:
      out.colors?.accentForeground ?? pickAccessibleForeground(out.colors?.accent ?? primary),
    highlight: out.colors?.highlight ?? out.colors?.accent ?? primary,
    navLink: headerText,
    background,
    text,
    surface: surfaceBg,
    surfaceText: surfaceFg,
  };

  out.theme = {
    heroOverlay: out.colors.heroOverlay ?? out.theme?.heroOverlay ?? '',
    background,
    text,
    footerBackground:
      out.colors.footerBackground ?? out.theme?.footerBackground ?? '#0B1A33',
    footerAccentBorder: out.colors.footerAccentBorder ?? out.theme?.footerAccentBorder,
    borderRadius: out.theme?.borderRadius,
    boxShadow: out.theme?.boxShadow,
  };

  out.components = {
    ...out.components,
    header: {
      background: headerBg,
      text: headerText,
      borderColor: out.components?.header?.borderColor,
    },
    primaryButton: out.components?.primaryButton ?? {
      background: primary,
      text: pickAccessibleForeground(primary),
    },
    hero: out.components?.hero,
  };

  ensureHeroTextContrast(out, background, primary);

  assignDistinctLandingImages(out);

  const photoPool = out.assets?.marketingPhotoUrls ?? [];
  const existingJobAlerts = out.landing?.jobAlerts;
  const heroImg = heroImageUrl(out);
  let jobAlertsImage =
    out.landing?.jobAlerts?.imageUrl?.trim() ||
    resolveJobAlertsImage(out, photoPool) ||
    resolveStockSectionImage('jobAlerts');
  if (
    jobAlertsImage === heroImg ||
    isDecorativeImageUrl(jobAlertsImage) ||
    !jobAlertsImage.trim()
  ) {
    jobAlertsImage = resolveStockSectionImage('jobAlerts');
  }

  if (out.landing?.cultureSpotlight && !out.landing.cultureSpotlight.imageUrl?.trim()) {
    out.landing.cultureSpotlight.imageUrl = resolveStockSectionImage('cultureSpotlight');
  }

  out.landing = {
    ...out.landing,
    jobAlerts: {
      headingLead: existingJobAlerts?.headingLead ?? "Let's stay",
      headingTrail: existingJobAlerts?.headingTrail ?? 'connected',
      body:
        existingJobAlerts?.body && existingJobAlerts.body.length > 0
          ? existingJobAlerts.body
          : [
              'Things move pretty fast around here. New tech, new products, new ideas — and new opportunities for talented people like you.',
              "So, create a tailored job alert, and we'll let you know as soon as your dream role's ready for you.",
            ],
      ctaLabel: existingJobAlerts?.ctaLabel ?? 'Create Job Alert',
      imageUrl: jobAlertsImage,
      background: existingJobAlerts?.background?.trim() || surfaceBg,
    },
  };

  return out;
}

export function validateAccessibleTokens(branding: ProspectBrandingJson): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const primary = branding.colors?.primary?.trim();
  const background = branding.colors?.background?.trim() ?? branding.theme?.background?.trim();
  const text = branding.colors?.text?.trim() ?? branding.theme?.text?.trim();
  const navLink = branding.colors?.navLink?.trim();
  const headerBg = branding.components?.header?.background?.trim();
  const surface = branding.colors?.surface?.trim();
  const surfaceText = branding.colors?.surfaceText?.trim();

  if (primary && isNeutralBrandColor(primary)) {
    errors.push(`colors.primary (${primary}) must not be neutral white/black/gray.`);
  }

  if (text && background && !meetsContrastAA(text, background, 4.5)) {
    errors.push(`Low contrast: colors.text (${text}) vs background (${background}).`);
  }

  if (navLink && headerBg && !meetsContrastAA(navLink, headerBg, 4.5)) {
    errors.push(`Low contrast: navLink (${navLink}) vs header background (${headerBg}).`);
  }

  if (primary && background && !meetsContrastAA(primary, background, 3)) {
    errors.push(`Low contrast: colors.primary (${primary}) vs page background (${background}).`);
  }

  if (primary && surface && !meetsContrastAA(primary, surface, 3)) {
    warnings.push(`Low contrast: colors.primary (${primary}) vs surface (${surface}) — surface sections use accent/text tokens.`);
  }

  if (surfaceText && surface && !meetsContrastAA(surfaceText, surface, 4.5)) {
    errors.push(`Low contrast: surfaceText (${surfaceText}) vs surface (${surface}).`);
  }

  const heroImg = heroImageUrl(branding);
  const jobAlertsImg = branding.landing?.jobAlerts?.imageUrl?.trim();
  if (!jobAlertsImg) {
    warnings.push('landing.jobAlerts.imageUrl missing — section panel needs a career stock photo.');
  }

  const cultureEnabled = branding.landing?.sections?.cultureSpotlight !== false &&
    Boolean(branding.landing?.cultureSpotlight);
  const cultureImg = branding.landing?.cultureSpotlight?.imageUrl?.trim();
  if (cultureEnabled && !cultureImg) {
    warnings.push(
      'landing.cultureSpotlight.imageUrl missing — section panel needs a career stock photo.',
    );
  }

  if (primary && parseHexColor(primary) === null) {
    errors.push(`Invalid colors.primary: ${primary}`);
  }

  const heroText = branding.colors?.heroTextForeground?.trim() ?? '#FFFFFF';
  const overlayBg = estimateHeroOverlayBackground(background ?? '#FFFFFF');
  if (!meetsContrastAA(heroText, overlayBg, 3)) {
    warnings.push(
      `Low contrast: hero text (${heroText}) may be hard to read on the hero overlay.`,
    );
  }

  return { errors, warnings };
}
