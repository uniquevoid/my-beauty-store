import type {
  ProspectBrandingJson,
  ProspectLanding,
  LandingSectionKey,
} from './branding-schema.types';
import { CANONICAL_SECTION_HEADINGS } from './prospect-section-copy';
import { hasCultureSpotlightData } from './extract-culture-spotlight';

export type ProspectNavLink = {
  label: string;
  href: string;
  external?: boolean;
};

const GENERIC_ABOUT_PHRASES = [
  'enterprise software',
  'talent and acquisition at scale',
  'fortune 500 customers',
];

export const MIN_NAV_LINKS = 3;
const MAX_NAV_ITEMS = 4;
const MAX_NAV_WORDS = 3;

type NavSectionKey = Exclude<LandingSectionKey, 'jobAlerts'>;

const NAV_LABELS: Record<NavSectionKey, string> = {
  about: CANONICAL_SECTION_HEADINGS.about,
  customers: CANONICAL_SECTION_HEADINGS.customers,
  technology: CANONICAL_SECTION_HEADINGS.technology,
  coreValues: CANONICAL_SECTION_HEADINGS.coreValues,
  lifeAt: 'Life here',
  testimonials: 'Stories',
  cultureSpotlight: CANONICAL_SECTION_HEADINGS.cultureSpotlight,
};

export function limitNavWords(label: string, maxWords = MAX_NAV_WORDS): string {
  const cleaned = label
    .replace(/[…]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return cleaned;
  return words.slice(0, maxWords).join(' ');
}

export function canonicalNavLabel(section: NavSectionKey): string {
  return limitNavWords(NAV_LABELS[section]);
}

function isGenericAboutBody(body: string | undefined): boolean {
  if (!body?.trim()) return true;
  const lower = body.toLowerCase();
  return GENERIC_ABOUT_PHRASES.some((p) => lower.includes(p));
}

function hasAboutData(landing: ProspectLanding | undefined): boolean {
  const body = landing?.about?.body;
  return Boolean(body?.trim() && !isGenericAboutBody(body));
}

function hasCustomersData(landing: ProspectLanding | undefined): boolean {
  const logos = landing?.customers?.logos ?? [];
  if (logos.length >= 2) return true;
  return logos.some((l) =>
    /\b(AWS|Amazon Web Services|Google Cloud|GCP|Microsoft Azure|Azure)\b/i.test(l.name),
  );
}

function hasTechnologyData(landing: ProspectLanding | undefined): boolean {
  const body = landing?.technology?.body;
  return Boolean(body?.trim() && body.trim().length >= 40);
}

function hasCoreValuesData(landing: ProspectLanding | undefined): boolean {
  return (landing?.coreValues?.values?.length ?? 0) >= 2;
}

function hasLifeAtData(landing: ProspectLanding | undefined): boolean {
  const lifeAt = landing?.lifeAt;
  return Boolean(
    lifeAt?.heading?.trim() &&
      (lifeAt.subheading?.trim() || lifeAt.leftImageUrl || lifeAt.rightImageUrl),
  );
}

function hasTestimonialsData(landing: ProspectLanding | undefined): boolean {
  return (landing?.testimonials?.items?.length ?? 0) > 0;
}

function hasCultureSpotlightSection(landing: ProspectLanding | undefined): boolean {
  return hasCultureSpotlightData(landing);
}

export type ResolvedLandingSections = Record<LandingSectionKey, boolean>;

export function resolveProspectLandingSections(
  branding: ProspectBrandingJson,
): ResolvedLandingSections {
  const landing = branding.landing;
  const explicit = landing?.sections;

  return {
    about: explicit?.about ?? hasAboutData(landing),
    customers: explicit?.customers ?? hasCustomersData(landing),
    technology: explicit?.technology ?? hasTechnologyData(landing),
    coreValues: explicit?.coreValues ?? hasCoreValuesData(landing),
    lifeAt: explicit?.lifeAt ?? hasLifeAtData(landing),
    testimonials: explicit?.testimonials ?? hasTestimonialsData(landing),
    cultureSpotlight: explicit?.cultureSpotlight ?? hasCultureSpotlightSection(landing),
    jobAlerts: explicit?.jobAlerts ?? true,
  };
}

/** Inject minimal about copy when nav padding needs an About section. */
export function ensureMinimalAboutForNav(branding: ProspectBrandingJson): ProspectBrandingJson {
  if (hasAboutData(branding.landing)) {
    return branding;
  }

  const companyName = branding.companyName?.trim() || 'Our company';
  const description =
    branding.metaDescription?.trim() ||
    branding.hero?.subheadline?.trim() ||
    `${companyName} is growing across teams and locations.`;

  const body = description.replace(/^Join [^—]+ —\s*/i, '').trim() || description;

  branding.landing = {
    ...branding.landing,
    about: {
      heading: CANONICAL_SECTION_HEADINGS.about,
      body,
      stats: branding.landing?.about?.stats ?? [],
      ctaLabel: branding.landing?.about?.ctaLabel ?? 'View open positions',
    },
    sections: {
      ...branding.landing?.sections,
      about: true,
    },
  };

  return branding;
}

const NAV_PADDING_FALLBACKS: Array<{
  section: LandingSectionKey;
  label: string;
  href: string;
}> = [
  { section: 'cultureSpotlight', label: 'Team stories', href: '/#culture-spotlight' },
  { section: 'about', label: 'About us', href: '/#about' },
  { section: 'jobAlerts', label: 'Job alerts', href: '/#job-alerts' },
];

/** Build header nav from enabled landing sections (Open Positions + up to 3 words per label). */
export function deriveProspectNavLinks(branding: ProspectBrandingJson): ProspectNavLink[] {
  const working = ensureMinimalAboutForNav({ ...branding, landing: { ...branding.landing } });
  const sections = resolveProspectLandingSections(working);
  const links: ProspectNavLink[] = [{ label: 'Open Positions', href: '/jobs' }];

  const candidates: ProspectNavLink[] = [];

  if (sections.about) {
    candidates.push({ label: canonicalNavLabel('about'), href: '/#about' });
  }
  if (sections.customers) {
    candidates.push({ label: canonicalNavLabel('customers'), href: '/#customers' });
  }
  if (sections.technology) {
    candidates.push({ label: canonicalNavLabel('technology'), href: '/#technology' });
  }
  if (sections.lifeAt) {
    candidates.push({ label: canonicalNavLabel('lifeAt'), href: '/#life-at' });
  }
  if (sections.coreValues) {
    candidates.push({ label: canonicalNavLabel('coreValues'), href: '/#values' });
  }
  if (sections.testimonials) {
    candidates.push({ label: canonicalNavLabel('testimonials'), href: '/#testimonials' });
  }
  if (sections.cultureSpotlight) {
    candidates.push({ label: canonicalNavLabel('cultureSpotlight'), href: '/#culture-spotlight' });
  }

  for (const candidate of candidates) {
    if (links.length >= MAX_NAV_ITEMS) break;
    if (!links.some((l) => l.href === candidate.href)) {
      links.push(candidate);
    }
  }

  for (const fallback of NAV_PADDING_FALLBACKS) {
    if (links.length >= MIN_NAV_LINKS) break;
    if (links.some((l) => l.href === fallback.href)) continue;

    if (fallback.section === 'about' && !sections.about) {
      continue;
    }
    if (fallback.section === 'cultureSpotlight' && !sections.cultureSpotlight) {
      continue;
    }
    if (fallback.section === 'jobAlerts' && !sections.jobAlerts) {
      continue;
    }

    links.push({ label: fallback.label, href: fallback.href });
  }

  return links.slice(0, MAX_NAV_ITEMS);
}
