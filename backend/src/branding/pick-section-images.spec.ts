import {
  assignDistinctLandingImages,
  isDecorativeImageUrl,
  isLowValueSectionPhoto,
  resolveJobAlertsImage,
  resolveTechnologyImage,
  scoreMarketingPhoto,
} from './pick-section-images';
import type { ProspectBrandingJson } from './branding-schema.types';

describe('pick-section-images', () => {
  it('rejects svg and icon paths', () => {
    expect(isDecorativeImageUrl('https://example.com/assets/icons/Users.svg')).toBe(true);
    expect(isDecorativeImageUrl('https://example.com/hero.svg')).toBe(true);
    expect(
      isDecorativeImageUrl('https://www.altostratus.es/assets/partners/aws.svg'),
    ).toBe(true);
  });

  it('prefers raster photos over svg in scoring', () => {
    const svg = scoreMarketingPhoto('https://example.com/a.svg');
    const webp = scoreMarketingPhoto('https://static.example.com/team.webp', 800, 600);
    expect(webp).toBeGreaterThan(svg);
  });

  it('resolveTechnologyImage skips decorative section image and uses pool', () => {
    const pool = [
      'https://static.altostratus.es/2025/07/trabaja-con-nosotros-cta.webp',
      'https://example.com/icons/Users.svg',
    ];
    const result = resolveTechnologyImage(
      'https://example.com/icons/Users.svg',
      pool,
      new Set(['https://example.com/hero.svg']),
    );
    expect(result).toContain('trabaja-con-nosotros-cta.webp');
  });

  it('resolveJobAlertsImage does not reuse lifeAt photos', () => {
    const trabaja = 'https://static.altostratus.es/2025/07/trabaja-con-nosotros-cta.webp';
    const galaxia =
      'https://static.altostratus.es/2024/10/galaxia-qebv5g0pyyhvdhz0k23wvuf9xtwhvrwj8mf1gwakl4.png';
    const download1 = 'https://static.altostratus.es/2024/10/download-1.jpg';
    const branding: ProspectBrandingJson = {
      companyName: 'Altostratus',
      logoAlt: 'Altostratus',
      metaDescription: 'Careers',
      colors: { primary: '#FF0B6F', primaryForeground: '#FFF', accent: '#0064FF', accentForeground: '#FFF', navLink: '#333' },
      hero: {
        badgeText: "We're hiring!",
        headline: 'Headline',
        backgroundImageUrl: 'https://static.altostratus.es/2024/11/Ai-Computing.svg',
      },
      landing: {
        technology: { heading: 'What we do', body: 'Body', imageUrl: trabaja },
        lifeAt: {
          heading: 'Join our team',
          leftImageUrl: download1,
          rightImageUrl: galaxia,
        },
        jobAlerts: {
          headingLead: "Let's stay",
          headingTrail: 'connected',
          body: ['Body'],
          ctaLabel: 'Create Job Alert',
          imageUrl: trabaja,
        },
      },
      assets: {
        marketingPhotoUrls: [trabaja, galaxia, download1, 'https://static.altostratus.es/2024/10/download-2.jpg'],
      },
    };
    const result = resolveJobAlertsImage(branding, branding.assets!.marketingPhotoUrls!);
    expect(result).toBe('https://static.altostratus.es/2024/10/download-2.jpg');
    expect(result).not.toBe(trabaja);
    expect(result).not.toBe(download1);
    expect(result).not.toBe(galaxia);
  });

  it('assignDistinctLandingImages uses different URLs per section', () => {
    const trabaja = 'https://static.altostratus.es/2025/07/trabaja-con-nosotros-cta.webp';
    const galaxia =
      'https://static.altostratus.es/2024/10/galaxia-qebv5g0pyyhvdhz0k23wvuf9xtwhvrwj8mf1gwakl4.png';
    const download1 = 'https://static.altostratus.es/2024/10/download-1.jpg';
    const download2 = 'https://static.altostratus.es/2024/10/download-2.jpg';
    const branding: ProspectBrandingJson = {
      companyName: 'Altostratus',
      logoAlt: 'Altostratus',
      metaDescription: 'Careers',
      colors: { primary: '#FF0B6F', primaryForeground: '#FFF', accent: '#0064FF', accentForeground: '#FFF', navLink: '#333' },
      hero: {
        badgeText: "We're hiring!",
        headline: 'Headline',
        backgroundImageUrl: 'https://static.altostratus.es/2024/11/Ai-Computing.svg',
      },
      landing: {
        technology: { heading: 'What we do', body: 'Body', imageUrl: trabaja },
        lifeAt: {
          heading: 'Join our team',
          leftImageUrl: trabaja,
          rightImageUrl: trabaja,
        },
        jobAlerts: {
          headingLead: "Let's stay",
          headingTrail: 'connected',
          body: ['Body'],
          ctaLabel: 'Create Job Alert',
          imageUrl: trabaja,
        },
      },
      assets: {
        marketingPhotoUrls: [trabaja, galaxia, download1, download2],
      },
    };
    assignDistinctLandingImages(branding);
    const tech = branding.landing!.technology!.imageUrl!;
    const left = branding.landing!.lifeAt!.leftImageUrl!;
    const right = branding.landing!.lifeAt!.rightImageUrl!;
    const alerts = branding.landing!.jobAlerts!.imageUrl!;
    const unique = new Set([tech, left, right, alerts]);
    expect(unique.size).toBe(4);
    expect(unique.has(galaxia)).toBe(true);
  });

  it('demotes client logo paths in scoring', () => {
    const logo = scoreMarketingPhoto('https://static.altostratus.es/2024/10/logos-clientes-13.png');
    const photo = scoreMarketingPhoto('https://static.altostratus.es/2024/10/download-1.jpg', 800, 600);
    expect(isLowValueSectionPhoto('https://static.altostratus.es/2024/10/logos-clientes-13.png')).toBe(true);
    expect(logo).toBeLessThan(0);
    expect(photo).toBeGreaterThan(0);
  });

  it('assigns distinct stock photos when pool is empty', () => {
    const branding: ProspectBrandingJson = {
      companyName: 'Sparse Co',
      logoAlt: 'Sparse Co',
      metaDescription: 'Careers',
      colors: { primary: '#0066CC', primaryForeground: '#FFF', accent: '#0066CC', accentForeground: '#FFF', navLink: '#333' },
      hero: { badgeText: "We're hiring!", headline: 'Headline' },
      landing: {
        cultureSpotlight: {
          heading: 'Life at Sparse Co',
          body: 'Read our team stories.',
          ctaLabel: 'Read the story',
          articleUrl: 'https://sparse.co/contact',
        },
        jobAlerts: {
          headingLead: "Let's stay",
          headingTrail: 'connected',
          body: ['Body'],
          ctaLabel: 'Create Job Alert',
        },
      },
      assets: { marketingPhotoUrls: [] },
    };
    assignDistinctLandingImages(branding);
    const culture = branding.landing!.cultureSpotlight!.imageUrl!;
    const alerts = branding.landing!.jobAlerts!.imageUrl!;
    expect(culture).toContain('unsplash.com');
    expect(alerts).toContain('unsplash.com');
    expect(culture).not.toBe(alerts);
  });
});
