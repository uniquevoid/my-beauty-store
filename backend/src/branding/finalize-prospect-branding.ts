import type { ProspectBrandingJson } from './branding-schema.types';
import { ensureAccessibleBrandTokens } from './ensure-accessible-brand-tokens';
import { deriveProspectNavLinks, ensureMinimalAboutForNav } from './derive-prospect-nav';
import { isPlaceholderExampleUrl } from './extract-site-links';
import type { ExtractedSiteLanguages, ExtractedSiteLinks } from './extract-site-links';
import { CAREERS_SITE_LANGUAGES } from './prospect-section-copy';
import {
  applyCanonicalEnglishHeadings,
  translateProspectCopyToEnglish,
} from './translate-prospect-copy-en';
import { normalizeProspectCareersCopy } from './careers-copy-intent';

function stripPlaceholderUrls<T extends Record<string, string | undefined>>(
  links: Partial<T> | undefined,
): Partial<T> {
  if (!links) return {};
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(links)) {
    if (typeof value === 'string' && value.trim() && !isPlaceholderExampleUrl(value)) {
      (out as Record<string, string>)[key] = value;
    }
  }
  return out;
}

export function buildProspectFooter(
  branding: ProspectBrandingJson,
  extracted?: ExtractedSiteLinks,
): Record<string, unknown> {
  const existing = branding.footer as
    | {
        copyright?: string;
        legalLinks?: Record<string, string>;
        socialLinks?: Record<string, string>;
      }
    | undefined;

  const companyName = branding.companyName?.trim() || 'Careers';

  return {
    copyright:
      existing?.copyright?.trim() ||
      extracted?.copyright?.trim() ||
      `Copyright © {year} ${companyName}. All Rights Reserved.`,
    legalLinks: {
      ...stripPlaceholderUrls(extracted?.legalLinks),
      ...stripPlaceholderUrls(existing?.legalLinks),
    },
    socialLinks: {
      ...stripPlaceholderUrls(extracted?.socialLinks),
      ...stripPlaceholderUrls(existing?.socialLinks),
    },
  };
}

export async function finalizeProspectBranding(
  branding: ProspectBrandingJson,
  extras?: {
    siteLinks?: ExtractedSiteLinks;
    languages?: ExtractedSiteLanguages;
  },
): Promise<ProspectBrandingJson> {
  const out: ProspectBrandingJson = { ...branding };

  applyCanonicalEnglishHeadings(out);

  if (out.source?.method === 'playwright') {
    out.languages = CAREERS_SITE_LANGUAGES;
    await translateProspectCopyToEnglish(out);
    await normalizeProspectCareersCopy(out);
    applyCanonicalEnglishHeadings(out);
  } else if (extras?.languages?.options?.length === 2) {
    out.languages = extras.languages;
  }

  const shouldDeriveNav =
    out.source?.method === 'playwright' ||
    !out.navLinks ||
    !Array.isArray(out.navLinks) ||
    out.navLinks.length === 0;
  if (shouldDeriveNav) {
    ensureMinimalAboutForNav(out);
    out.navLinks = deriveProspectNavLinks(out);
  }

  out.footer = buildProspectFooter(out, extras?.siteLinks);

  return ensureAccessibleBrandTokens(out);
}
