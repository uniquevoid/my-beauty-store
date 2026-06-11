import {
  anonymizeCompanyName,
  anonymizeSchoolName,
  buildBlindPresentation,
  makeIntroductionCode,
  resolvePublicContent,
  scanRedactionFlags,
} from './presentation-redaction';
import type { PresentationContent } from './presentation.types';

const SAMPLE: PresentationContent = {
  headline: 'Jane Smith — Senior Engineer',
  executiveSummary: 'Jane Smith has 10 years at Amazon. Contact: jane@example.com',
  keyStrengths: ['Cloud architecture'],
  roleFit: ['Maps to role requirements'],
  screeningHighlights: ['Strong communicator'],
  experienceSnapshot: 'Senior Software Engineer at Amazon for 5 years.',
  skills: ['AWS', 'TypeScript'],
  recruiterRecommendation: 'We recommend Jane Smith for this role.',
  blindProfile: { yearsExperience: '10+ years' },
};

describe('presentation-redaction', () => {
  it('generates stable introduction codes', () => {
    expect(makeIntroductionCode('28491abc-def0-1234-5678-abcdef012345')).toBe('INT-28491');
  });

  it('anonymizes known company names', () => {
    expect(anonymizeCompanyName('Amazon Web Services')).toContain('Fortune 100');
  });

  it('anonymizes known school names', () => {
    expect(anonymizeSchoolName('Imperial College London')).toBe('a top-ranked university');
  });

  it('builds blind presentation without obvious PII patterns', () => {
    const blind = buildBlindPresentation(SAMPLE);
    expect(blind.headline).not.toContain('Jane Smith');
    expect(blind.executiveSummary).not.toContain('jane@example.com');
  });

  it('flags residual PII in content', () => {
    const flags = scanRedactionFlags(SAMPLE);
    expect(flags.some((f) => f.includes('email'))).toBe(true);
    expect(flags.some((f) => f.includes('name'))).toBe(true);
  });

  it('returns null public content when terms not accepted', () => {
    const content = resolvePublicContent({
      protection_enabled: true,
      disclosure_stage: 'blind',
      terms_accepted_at: null,
      blind_content_json: SAMPLE,
      full_content_json: SAMPLE,
      content_json: SAMPLE,
    });
    expect(content).toBeNull();
  });

  it('returns blind content after terms accepted', () => {
    const blind = { ...SAMPLE, headline: 'Anonymous engineer' };
    const content = resolvePublicContent({
      protection_enabled: true,
      disclosure_stage: 'blind',
      terms_accepted_at: '2026-06-10T10:00:00.000Z',
      blind_content_json: blind,
      full_content_json: SAMPLE,
      content_json: SAMPLE,
    });
    expect(content?.headline).toBe('Anonymous engineer');
  });

  it('returns full content after unlock', () => {
    const full = { ...SAMPLE, headline: 'Jane Smith — Full' };
    const content = resolvePublicContent({
      protection_enabled: true,
      disclosure_stage: 'full_unlocked',
      terms_accepted_at: '2026-06-10T10:00:00.000Z',
      blind_content_json: SAMPLE,
      full_content_json: full,
      content_json: full,
    });
    expect(content?.headline).toBe('Jane Smith — Full');
  });
});
