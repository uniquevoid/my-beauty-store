import {
  collectArticleCandidatesFromAnchors,
  ensureCultureSpotlightFallback,
  needsCultureSpotlightFallback,
  pickBestArticleLink,
  scoreArticleLink,
} from './extract-culture-spotlight';
import type { ProspectLanding } from './branding-schema.types';

describe('extract-culture-spotlight', () => {
  it('scores culture blog links higher than product press', () => {
    const cultureScore = scoreArticleLink(
      'https://acme.com/blog/life-at-acme',
      'Employee interview: life at Acme',
    );
    const pressScore = scoreArticleLink(
      'https://acme.com/news/product-launch',
      'Acme announces product launch',
    );
    expect(cultureScore).toBeGreaterThan(pressScore);
  });

  it('collects article candidates from anchors', () => {
    const candidates = collectArticleCandidatesFromAnchors(
      [
        { href: 'https://acme.com/blog/team-story', text: 'Life at Acme' },
        { href: 'https://other.com/blog/x', text: 'External' },
      ],
      'https://acme.com',
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.url).toContain('/blog/team-story');
  });

  it('activates culture spotlight when social proof sections are missing', () => {
    const landing: ProspectLanding = {
      sections: { jobAlerts: true },
    };
    expect(needsCultureSpotlightFallback(landing)).toBe(true);

    const updated = ensureCultureSpotlightFallback(landing, 'Acme Corp', 'https://acme.com', {
      articleCandidates: [
        {
          url: 'https://acme.com/blog/employee-story',
          title: 'Employee story',
          score: 90,
        },
      ],
    });

    expect(updated.sections?.cultureSpotlight).toBe(true);
    expect(updated.cultureSpotlight?.articleUrl).toBe('https://acme.com/blog/employee-story');
    expect(updated.cultureSpotlight?.ctaLabel).toBe('Read the story');
  });

  it('falls back to contact page when no article is found', () => {
    const landing: ProspectLanding = { sections: { jobAlerts: true } };
    const updated = ensureCultureSpotlightFallback(landing, 'Acme Corp', 'https://acme.com');
    expect(updated.cultureSpotlight?.articleUrl).toBe('https://acme.com/contact');
  });

  it('includes stock image when no marketing photos are available', () => {
    const landing: ProspectLanding = { sections: { jobAlerts: true } };
    const updated = ensureCultureSpotlightFallback(landing, 'Acme Corp', 'https://acme.com', {
      marketingPhotoUrls: [],
    });
    expect(updated.cultureSpotlight?.imageUrl).toContain('unsplash.com');
  });
});
