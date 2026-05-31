import {
  buildSiteLanguagesFromSignals,
  buildSiteLinksFromAnchors,
  classifyLegalLink,
  classifySocialUrl,
} from './extract-site-links';

describe('extract-site-links', () => {
  it('classifies social URLs', () => {
    expect(classifySocialUrl('https://www.linkedin.com/company/ggtech_es')).toBe('linkedin');
    expect(classifySocialUrl('https://www.youtube.com/@ggtechentertainment')).toBe('youtube');
  });

  it('classifies legal links', () => {
    expect(classifyLegalLink('Canal ético', 'https://ggtech.gg/ethic')).toBe('ethics');
    expect(
      classifyLegalLink(
        'Legal Advice and Privacy Policy',
        'https://s3.eu-west-1.amazonaws.com/privacy.pdf',
      ),
    ).toBe('privacyNotice');
  });

  it('builds footer links from anchors', () => {
    const result = buildSiteLinksFromAnchors(
      [
        {
          href: 'https://www.linkedin.com/company/ggtech_es',
          text: 'LinkedIn',
        },
        {
          href: 'https://ggtech.gg/ethic',
          text: 'Canal ético',
        },
      ],
      'GGTech Entertainment',
    );

    expect(result.socialLinks.linkedin).toContain('linkedin.com');
    expect(result.legalLinks.ethics).toBe('https://ggtech.gg/ethic');
  });

  it('builds English + alternate language options', () => {
    const languages = buildSiteLanguagesFromSignals([
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
    ]);

    expect(languages?.default).toBe('en');
    expect(languages?.options).toHaveLength(2);
    expect(languages?.options[1]?.code).toBe('es');
  });
});
