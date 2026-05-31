import type { ProspectBrandingJson } from './branding-schema.types';
import {
  DEFAULT_UNSPLASH_HERO,
  GENERIC_CAREERS_HEADLINE,
  GENERIC_HERO_HEADLINE_PREFIX,
} from './branding-schema.types';
import { validateAccessibleTokens } from './ensure-accessible-brand-tokens';
import { meetsContrastAA } from './color-contrast';
import { isCustomerFacingCopy, hasCareersIntent } from './careers-copy-intent';
export type VisualParityValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function validateVisualBrandParity(
  branding: ProspectBrandingJson,
  options?: { force?: boolean; skipPlaywrightCheck?: boolean },
): VisualParityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!branding.logoUrl?.trim()) {
    errors.push('Missing logoUrl — extract company logo from header or apple-touch-icon.');
  }

  const primary = branding.colors?.primary?.trim();
  if (!primary) {
    errors.push('Missing colors.primary.');
  }

  const background =
    branding.colors?.background?.trim() ?? branding.theme?.background?.trim();
  if (!background) {
    errors.push('Missing colors.background or theme.background.');
  }

  const text = branding.colors?.text?.trim() ?? branding.theme?.text?.trim();
  if (!text) {
    errors.push('Missing colors.text or theme.text.');
  }

  const headline = branding.hero?.headline?.trim() ?? '';
  if (!headline) {
    errors.push('Missing hero.headline.');
  } else if (isCustomerFacingCopy(headline)) {
    errors.push(
      `hero.headline is customer-facing copy ("${headline.slice(0, 50)}…") — rewrite for job candidates.`,
    );
  } else if (
    (headline === GENERIC_CAREERS_HEADLINE ||
      headline.startsWith(GENERIC_HERO_HEADLINE_PREFIX)) &&
    !hasCareersIntent(headline)
  ) {
    errors.push(
      `hero.headline is generic template copy ("${headline.slice(0, 40)}…") — use recruitment-focused company copy.`,
    );
  }

  const subheadline = branding.hero?.subheadline?.trim() ?? '';
  if (subheadline && isCustomerFacingCopy(subheadline)) {
    errors.push(
      `hero.subheadline is customer-facing copy ("${subheadline.slice(0, 50)}…") — rewrite for job candidates.`,
    );
  }

  const meta = branding.metaDescription?.trim() ?? '';
  if (meta && isCustomerFacingCopy(meta)) {
    errors.push('metaDescription is customer-facing — rewrite for job candidates.');
  }

  if (
    subheadline &&
    branding.landing?.about?.body?.trim() === subheadline
  ) {
    warnings.push('landing.about.body duplicates hero.subheadline — consider distinct about copy.');
  }

  const heroBg =
    branding.hero?.backgroundImageUrl?.trim() ??
    branding.assets?.heroBackgroundImageUrl?.trim();
  if (!heroBg) {
    errors.push('Missing hero.backgroundImageUrl (company og:image or hero background).');
  } else if (heroBg === DEFAULT_UNSPLASH_HERO || heroBg.includes('unsplash.com')) {
    errors.push('hero.backgroundImageUrl must not be the generic Unsplash placeholder.');
  }

  const fontSans = branding.typography?.fontFamilySans?.trim();
  if (!fontSans) {
    errors.push('Missing typography.fontFamilySans — extract body font from company site.');
  }

  const heroOverlay =
    branding.colors?.heroOverlay?.trim() ?? branding.theme?.heroOverlay?.trim();
  if (!heroOverlay) {
    errors.push('Missing theme.heroOverlay or colors.heroOverlay.');
  }

  const headerBg = branding.components?.header?.background?.trim();
  if (!headerBg) {
    errors.push('Missing components.header.background.');
  }

  const btnBg = branding.components?.primaryButton?.background?.trim();
  if (!btnBg) {
    errors.push('Missing components.primaryButton.background.');
  }

  if (!options?.skipPlaywrightCheck && !options?.force) {
    if (branding.source?.method !== 'playwright') {
      errors.push(
        `source.method is "${branding.source?.method ?? 'missing'}" — re-run URL extraction (Playwright) or pass --force.`,
      );
    }
  }

  const primaryFg = branding.colors?.primaryForeground?.trim();
  if (primary && primaryFg && !meetsContrastAA(primaryFg, primary, 3)) {
    warnings.push(
      `Low contrast: colors.primary (${primary}) vs primaryForeground (${primaryFg}) — check testimonial/primary sections in /newcustomer iteration.`,
    );
  }

  const accessible = validateAccessibleTokens(branding);
  for (const msg of accessible.errors) {
    errors.push(msg);
  }
  for (const msg of accessible.warnings) {
    warnings.push(msg);
  }

  const navLinks = branding.navLinks;
  if (!navLinks || !Array.isArray(navLinks) || navLinks.length === 0) {
    warnings.push('Missing navLinks — header will use derived defaults at runtime.');
  }

  const footer = branding.footer as
    | { socialLinks?: Record<string, string>; legalLinks?: Record<string, string> }
    | undefined;
  const socialValues = Object.values(footer?.socialLinks ?? {});
  if (socialValues.some((url) => typeof url === 'string' && url.includes('example.com'))) {
    warnings.push('Footer socialLinks still contain example.com placeholder URLs.');
  }

  if (!branding.languages?.options?.length) {
    warnings.push('Missing languages — frontend will fall back to English + Español.');
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function formatValidationErrors(errors: string[]): string {
  return errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n');
}
