import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildCareersCopyFallback,
  hasCareersIntent,
  inferIndustryHint,
  isCustomerFacingCopy,
  normalizeProspectCareersCopy,
  needsCareersIntentRewrite,
} from './careers-copy-intent';
import {
  buildProspectBrandingFromSnapshot,
  type VisualBrandSnapshot,
} from './brand-token-derivation';
import { finalizeProspectBranding } from './finalize-prospect-branding';
import { validateVisualBrandParity } from './validate-visual-brand-parity';
import type { ProspectBrandingJson } from './branding-schema.types';

function crestanevadaLikeBranding(): ProspectBrandingJson {
  return {
    companyName: 'Crestanevada',
    logoUrl: 'https://www.crestanevada.es/logo.webp',
    metaDescription: 'Concesionario de coches de segunda mano y ocasión',
    hero: {
      badgeText: "We're hiring!",
      headline: 'Find the perfect car for you',
      subheadline:
        'Discover Crestanevada — Spain leading used-car dealership with flexible financing.',
      backgroundImageUrl: 'https://www.crestanevada.es/hero.png',
    },
    colors: {
      primary: '#FF004C',
      primaryForeground: '#FFFFFF',
      background: '#FFFFFF',
      text: '#000000',
    },
    typography: { fontFamilySans: 'Lato, sans-serif' },
    theme: {
      heroOverlay: 'linear-gradient(135deg, rgba(255,0,76,0.88) 0%, rgba(0,0,0,0.25) 100%)',
      background: '#FFFFFF',
      text: '#000000',
      footerBackground: '#2A2E3D',
    },
    components: {
      header: { background: '#FFFFFF', text: '#000000' },
      primaryButton: { background: '#FF004C', text: '#FFFFFF' },
    },
    source: {
      url: 'https://www.crestanevada.es/',
      extractedAt: new Date().toISOString(),
      method: 'playwright',
    },
    landing: {
      sections: { about: true, jobAlerts: true },
      about: {
        heading: 'About us',
        body: 'Discover Crestanevada — Spain leading used-car dealership with flexible financing.',
        stats: [],
        ctaLabel: 'View open positions',
      },
      jobAlerts: {
        headingLead: "Let's stay",
        headingTrail: 'connected',
        body: [
          'Things move pretty fast around here. New tech, new products, new ideas — and new opportunities for talented people like you.',
          "So, create a tailored job alert, and we'll let you know as soon as your dream role's ready for you.",
        ],
        ctaLabel: 'Create Job Alert',
      },
    },
  };
}

describe('careers-copy-intent', () => {
  it('detects customer-facing hero copy', () => {
    expect(isCustomerFacingCopy('Find the perfect car for you')).toBe(true);
    expect(isCustomerFacingCopy('Your digital transformation starts here')).toBe(true);
    expect(isCustomerFacingCopy('Careers at Viva Studios')).toBe(false);
    expect(hasCareersIntent('Careers at Viva Studios')).toBe(true);
  });

  it('infers automotive industry from crestanevada-like context', () => {
    const branding = crestanevadaLikeBranding();
    expect(inferIndustryHint(branding)).toBe('automotive');
  });

  it('rewrites crestanevada-like copy via template fallback', () => {
    const branding = crestanevadaLikeBranding();
    expect(needsCareersIntentRewrite(branding)).toBe(true);

    buildCareersCopyFallback(branding);

    expect(branding.hero?.headline).toBe('Work for a leading used-car dealership brand');
    expect(hasCareersIntent(branding.hero?.headline)).toBe(true);
    expect(isCustomerFacingCopy(branding.hero?.headline)).toBe(false);
    expect(branding.hero?.subheadline).toContain('Join Crestanevada');
    expect(branding.metaDescription).toMatch(/^Join Crestanevada/);
    expect(branding.landing?.about?.body).toContain('career');
    expect(branding.landing?.jobAlerts?.body?.[0]).toContain('Crestanevada');
    expect(branding.landing?.jobAlerts?.body?.[0]).not.toContain('New tech, new products');
  });

  it('passes through careers-focused viva headline without rewrite payload', async () => {
    const branding: ProspectBrandingJson = {
      companyName: 'Viva Studios',
      hero: {
        badgeText: "We're hiring!",
        headline: 'Careers at Viva Studios',
        subheadline: 'Explore open roles across game development teams.',
      },
      source: { url: 'https://vivastudios.com', extractedAt: '', method: 'playwright' },
    };

    const originalHeadline = branding.hero?.headline;
    await normalizeProspectCareersCopy(branding);
    expect(branding.hero?.headline).toBe(originalHeadline);
  });

  it('finalize altostratus fixture with customer-facing h1 into careers copy', async () => {
    const altostratusPath = resolve(__dirname, '__fixtures__/altostratus-visual-snapshot.json');
    const snapshot = JSON.parse(readFileSync(altostratusPath, 'utf-8')) as VisualBrandSnapshot;
    const branding = await finalizeProspectBranding(
      buildProspectBrandingFromSnapshot(snapshot, 'playwright'),
    );

    expect(isCustomerFacingCopy(branding.hero?.headline)).toBe(false);
    expect(hasCareersIntent(branding.hero?.headline)).toBe(true);
    expect(isCustomerFacingCopy(branding.hero?.subheadline)).toBe(false);

    const parity = validateVisualBrandParity(branding, { skipPlaywrightCheck: true });
    expect(parity.errors.some((e) => e.includes('customer-facing'))).toBe(false);
  });
});
