import type { BrandingConfig } from '../config/branding';

export type LandingSectionKey =
  | 'about'
  | 'customers'
  | 'technology'
  | 'coreValues'
  | 'lifeAt'
  | 'testimonials'
  | 'cultureSpotlight'
  | 'jobAlerts';

export type ResolvedLandingSections = Record<LandingSectionKey, boolean>;

const GENERIC_ABOUT_PHRASES = [
  'enterprise software',
  'talent and acquisition at scale',
  'fortune 500 customers',
];

function isProspectTenant(branding: BrandingConfig): boolean {
  return branding.source?.method === 'playwright' || branding.source?.method === 'fetch-fallback';
}

function isGenericAboutBody(body: string | undefined): boolean {
  if (!body?.trim()) return true;
  const lower = body.toLowerCase();
  return GENERIC_ABOUT_PHRASES.some((p) => lower.includes(p));
}

function hasAboutData(branding: BrandingConfig): boolean {
  const { about } = branding.landing;
  return Boolean(about.body?.trim() && !isGenericAboutBody(about.body));
}

function hasCustomersData(branding: BrandingConfig): boolean {
  return branding.landing.customers.logos.length >= 2;
}

function hasTechnologyData(branding: BrandingConfig): boolean {
  const { technology } = branding.landing;
  return Boolean(technology.body?.trim() && technology.body.trim().length >= 40);
}

function hasCoreValuesData(branding: BrandingConfig): boolean {
  return branding.landing.coreValues.values.length >= 2;
}

function hasLifeAtData(branding: BrandingConfig): boolean {
  const { lifeAt } = branding.landing;
  return Boolean(
    lifeAt.heading?.trim() &&
      (lifeAt.subheading?.trim() || lifeAt.leftImageUrl || lifeAt.rightImageUrl),
  );
}

function hasTestimonialsData(branding: BrandingConfig): boolean {
  return branding.landing.testimonials.items.length > 0;
}

function hasCultureSpotlightData(branding: BrandingConfig): boolean {
  const spotlight = branding.landing.cultureSpotlight;
  return Boolean(spotlight?.articleUrl?.trim() && spotlight?.body?.trim());
}

/** Resolve which landing sections to render for the current tenant. */
export function resolveLandingSections(branding: BrandingConfig): ResolvedLandingSections {
  const explicit = branding.landing.sections;

  if (!isProspectTenant(branding)) {
    return {
      about: true,
      customers: true,
      technology: true,
      coreValues: true,
      lifeAt: true,
      testimonials: true,
      cultureSpotlight: false,
      jobAlerts: true,
    };
  }

  return {
    about: explicit?.about ?? hasAboutData(branding),
    customers: explicit?.customers ?? hasCustomersData(branding),
    technology: explicit?.technology ?? hasTechnologyData(branding),
    coreValues: explicit?.coreValues ?? hasCoreValuesData(branding),
    lifeAt: explicit?.lifeAt ?? hasLifeAtData(branding),
    testimonials: explicit?.testimonials ?? hasTestimonialsData(branding),
    cultureSpotlight: explicit?.cultureSpotlight ?? hasCultureSpotlightData(branding),
    jobAlerts: explicit?.jobAlerts ?? true,
  };
}
