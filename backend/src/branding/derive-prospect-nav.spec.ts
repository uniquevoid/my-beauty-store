import { deriveProspectNavLinks, limitNavWords, resolveProspectLandingSections } from './derive-prospect-nav';
import type { ProspectBrandingJson } from './branding-schema.types';

describe('limitNavWords', () => {
  it('truncates to three words', () => {
    expect(limitNavWords('Tu transformación digital comienza aquí')).toBe('Tu transformación digital');
  });
});

describe('deriveProspectNavLinks', () => {
  const ggtechLike: ProspectBrandingJson = {
    companyName: 'GGTech Entertainment',
    logoAlt: 'GGTech',
    metaDescription: 'Esports company',
    colors: {
      primary: '#FF003D',
      primaryForeground: '#FFFFFF',
      accent: '#C10037',
      accentForeground: '#FFFFFF',
      navLink: '#FFFFFF',
    },
    hero: { badgeText: "We're hiring!", headline: 'Tech' },
    landing: {
      sections: {
        about: true,
        customers: true,
        technology: false,
        lifeAt: false,
      },
      about: {
        heading: 'An international leading company in Esports',
        body: 'We build games and esports platforms.',
        stats: [{ value: '+180K', label: 'GAMERGY visitors' }],
        ctaLabel: 'View open positions',
      },
      customers: {
        heading: 'Our partners',
        logos: [
          { name: 'Red Bull', imageUrl: 'https://example.com/rb.png' },
          { name: 'Disney+', imageUrl: 'https://example.com/disney.png' },
        ],
      },
    },
  };

  it('derives nav from enabled sections only', () => {
    const links = deriveProspectNavLinks(ggtechLike);
    expect(links).toHaveLength(3);
    expect(links[0]).toEqual({ label: 'Open Positions', href: '/jobs' });
    expect(links[1]?.href).toBe('/#about');
    expect(links[2]?.href).toBe('/#customers');
    expect(links.some((l) => l.href.includes('life-at'))).toBe(false);
  });

  it('uses short nav labels not section headings', () => {
    const links = deriveProspectNavLinks(ggtechLike);
    expect(links[1]?.label).toBe('About us');
    expect(links[1]?.label.split(/\s+/).length).toBeLessThanOrEqual(3);
    expect(links[1]?.label).not.toContain('international');
  });

  it('uses English nav labels even when about body is Spanish', () => {
    const esBranding: ProspectBrandingJson = {
      ...ggtechLike,
      hero: { badgeText: "We're hiring!", headline: 'Tu carrera en la nube' },
      landing: {
        sections: { about: true, customers: false },
        about: {
          heading: 'Tu transformación digital comienza aquí',
          body: 'Impulsamos tu empresa con soluciones cloud diseñadas a medida.',
          stats: [],
          ctaLabel: 'Ver puestos',
        },
      },
    };
    const links = deriveProspectNavLinks(esBranding);
    expect(links[1]?.label).toBe('About us');
    expect(links[1]?.label.split(/\s+/).length).toBeLessThanOrEqual(3);
  });

  it('resolveProspectLandingSections respects explicit flags', () => {
    const sections = resolveProspectLandingSections(ggtechLike);
    expect(sections.about).toBe(true);
    expect(sections.customers).toBe(true);
    expect(sections.technology).toBe(false);
    expect(sections.lifeAt).toBe(false);
  });

  it('enables customers with one named cloud partner logo', () => {
    const branding: ProspectBrandingJson = {
      ...ggtechLike,
      landing: {
        customers: {
          heading: 'Partners',
          logos: [{ name: 'Amazon Web Services', imageUrl: 'https://example.com/aws.png' }],
        },
      },
    };
    expect(resolveProspectLandingSections(branding).customers).toBe(true);
  });

  it('pads sparse nav to three links', () => {
    const sparse: ProspectBrandingJson = {
      companyName: 'Universal DX',
      logoAlt: 'Universal DX',
      metaDescription: 'Join Universal DX — blood tests for early cancer detection.',
      colors: {
        primary: '#A58F8F',
        primaryForeground: '#FFFFFF',
        accent: '#F6B98F',
        accentForeground: '#181818',
        navLink: '#1F191A',
      },
      hero: { badgeText: "We're hiring!", headline: 'Build your career at Universal DX' },
      landing: {
        sections: { jobAlerts: true, cultureSpotlight: true },
        cultureSpotlight: {
          heading: 'Life at Universal DX',
          body: 'Curious what it is like to work here?',
          ctaLabel: 'Read the story',
          articleUrl: 'https://www.universaldx.com/contact',
        },
      },
    };
    const links = deriveProspectNavLinks(sparse);
    expect(links).toHaveLength(3);
    expect(links[0]?.href).toBe('/jobs');
    expect(links.some((l) => l.href === '/#culture-spotlight')).toBe(true);
  });
});
