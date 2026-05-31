import type { BrandingConfig, NavLink } from '../config/branding';



const GENERIC_ABOUT_PHRASES = [

  'enterprise software',

  'talent and acquisition at scale',

  'fortune 500 customers',

];



export const MIN_NAV_LINKS = 3;

const MAX_NAV_ITEMS = 4;



function isGenericAboutBody(body: string | undefined): boolean {

  if (!body?.trim()) return true;

  const lower = body.toLowerCase();

  return GENERIC_ABOUT_PHRASES.some((p) => lower.includes(p));

}



function resolveSections(branding: BrandingConfig) {

  const landing = branding.landing;

  const explicit = landing.sections;

  const isProspect =

    branding.source?.method === 'playwright' || branding.source?.method === 'fetch-fallback';



  if (!isProspect) {

    return {

      about: true,

      customers: true,

      technology: true,

      coreValues: true,

      lifeAt: true,

      testimonials: true,

      cultureSpotlight: false,

    };

  }



  return {

    about: explicit?.about ?? Boolean(landing.about.body?.trim() && !isGenericAboutBody(landing.about.body)),

    customers: explicit?.customers ?? landing.customers.logos.length >= 2,

    technology:

      explicit?.technology ??

      Boolean(landing.technology.body?.trim() && landing.technology.body.trim().length >= 40),

    coreValues: explicit?.coreValues ?? landing.coreValues.values.length >= 2,

    lifeAt:

      explicit?.lifeAt ??

      Boolean(

        landing.lifeAt.heading?.trim() &&

          (landing.lifeAt.subheading?.trim() ||

            landing.lifeAt.leftImageUrl ||

            landing.lifeAt.rightImageUrl),

      ),

    testimonials: explicit?.testimonials ?? landing.testimonials.items.length > 0,

    cultureSpotlight:

      explicit?.cultureSpotlight ??

      Boolean(

        landing.cultureSpotlight?.articleUrl?.trim() && landing.cultureSpotlight?.body?.trim(),

      ),

  };

}



function truncateNavLabel(label: string, max = 48): string {

  const trimmed = label.trim();

  if (trimmed.length <= max) return trimmed;

  return `${trimmed.slice(0, max - 1).trim()}…`;

}



const NAV_PADDING_FALLBACKS: Array<{ href: string; label: string; enabled: (sections: ReturnType<typeof resolveSections>) => boolean }> = [
  { href: '/#culture-spotlight', label: 'Team stories', enabled: (s) => s.cultureSpotlight },
  { href: '/#about', label: 'About us', enabled: (s) => s.about },
  { href: '/#job-alerts', label: 'Job alerts', enabled: () => true },
];



export function deriveProspectNavLinks(branding: BrandingConfig): NavLink[] {

  const landing = branding.landing;

  const sections = resolveSections(branding);

  const links: NavLink[] = [{ label: 'Open Positions', href: '/jobs' }];

  const candidates: NavLink[] = [];



  if (sections.about) {

    candidates.push({

      label: truncateNavLabel(landing.about.heading || 'About us'),

      href: '/#about',

    });

  }

  if (sections.customers) {

    candidates.push({

      label: truncateNavLabel(landing.customers.heading || 'Our partners'),

      href: '/#customers',

    });

  }

  if (sections.technology) {

    candidates.push({

      label: truncateNavLabel(landing.technology.heading || 'Our Technology'),

      href: '/#technology',

    });

  }

  if (sections.lifeAt) {

    candidates.push({

      label: truncateNavLabel(landing.lifeAt.heading || 'Life at Company'),

      href: '/#life-at',

    });

  }

  if (sections.coreValues) {

    candidates.push({

      label: truncateNavLabel(landing.coreValues.heading || 'Our team'),

      href: '/#values',

    });

  }

  if (sections.testimonials) {

    candidates.push({ label: 'Testimonials', href: '/#testimonials' });

  }

  if (sections.cultureSpotlight) {

    candidates.push({ label: 'Team stories', href: '/#culture-spotlight' });

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
    if (fallback.enabled(sections)) {
      links.push({ label: fallback.label, href: fallback.href });
    }
  }



  return links.slice(0, MAX_NAV_ITEMS);

}



function isPlaceholderExampleUrl(url: string | undefined): boolean {

  if (!url?.trim()) return false;

  try {

    const host = new URL(url).hostname.toLowerCase();

    return host === 'example.com' || host.endsWith('.example.com');

  } catch {

    return false;

  }

}



export function mergeProspectFooter(

  partial: Partial<BrandingConfig>,

  companyName: string,

): BrandingConfig['footer'] {

  const existing = partial.footer;

  const filterLinks = <T extends Record<string, string | undefined>>(links: Partial<T> | undefined) => {

    const out: Partial<T> = {};

    if (!links) return out;

    for (const [key, value] of Object.entries(links)) {

      if (typeof value === 'string' && value.trim() && !isPlaceholderExampleUrl(value)) {

        (out as Record<string, string>)[key] = value;

      }

    }

    return out;

  };



  return {

    copyright:

      existing?.copyright?.trim() ||

      `Copyright © {year} ${companyName}. All Rights Reserved.`,

    legalLinks: filterLinks(existing?.legalLinks),

    socialLinks: filterLinks(existing?.socialLinks),

  };

}

