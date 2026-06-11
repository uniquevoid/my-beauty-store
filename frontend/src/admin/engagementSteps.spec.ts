import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CandidatePresentation } from '../api/admin';
import { buildEngagementSteps, showUnlockFullCta } from './engagementSteps';

const EMPTY_CONTENT = {
  headline: '',
  executiveSummary: '',
  keyStrengths: [],
  roleFit: [],
  screeningHighlights: [],
  experienceSnapshot: '',
  skills: [],
  recruiterRecommendation: '',
};

function basePresentation(
  overrides: Partial<CandidatePresentation> = {},
): CandidatePresentation {
  return {
    id: 'pres-1',
    share_token: 'token',
    content_json: EMPTY_CONTENT,
    candidate_display_name: 'Candidate',
    status: 'published',
    published_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildEngagementSteps', () => {
  it('returns two base steps when protection is disabled', () => {
    const steps = buildEngagementSteps(basePresentation({ protection_enabled: false }));
    assert.equal(steps.length, 2);
    assert.deepEqual(
      steps.map((s) => s.id),
      ['link_opened', 'pdf_exported'],
    );
  });

  it('returns five steps when protection is enabled', () => {
    const steps = buildEngagementSteps(basePresentation({ protection_enabled: true }));
    assert.equal(steps.length, 5);
    assert.deepEqual(steps.map((s) => s.id), [
      'link_opened',
      'pdf_exported',
      'terms_accepted',
      'interview_requested',
      'full_unlocked',
    ]);
  });

  it('marks first step as current when nothing is complete', () => {
    const steps = buildEngagementSteps(basePresentation({ protection_enabled: true }));
    assert.equal(steps[0]?.status, 'current');
    assert.equal(
      steps.slice(1).every((s) => s.status === 'pending'),
      true,
    );
  });

  it('marks completed steps and sets next as current', () => {
    const steps = buildEngagementSteps(
      basePresentation({
        protection_enabled: true,
        client_viewed_at: '2026-01-02T00:00:00Z',
        client_exported_at: '2026-01-02T01:00:00Z',
      }),
    );
    assert.equal(steps[0]?.status, 'completed');
    assert.equal(steps[1]?.status, 'completed');
    assert.equal(steps[2]?.status, 'current');
    assert.equal(steps[3]?.status, 'pending');
  });

  it('marks all steps completed when fully unlocked', () => {
    const steps = buildEngagementSteps(
      basePresentation({
        protection_enabled: true,
        client_viewed_at: '2026-01-02T00:00:00Z',
        client_exported_at: '2026-01-02T01:00:00Z',
        terms_accepted_at: '2026-01-02T02:00:00Z',
        interview_requested_at: '2026-01-02T03:00:00Z',
        disclosure_stage: 'full_unlocked',
      }),
    );
    assert.equal(
      steps.every((s) => s.status === 'completed'),
      true,
    );
  });
});

describe('showUnlockFullCta', () => {
  it('is false without protection', () => {
    assert.equal(
      showUnlockFullCta(
        basePresentation({
          interview_requested_at: '2026-01-02T00:00:00Z',
        }),
      ),
      false,
    );
  });

  it('is true when interview requested but not unlocked', () => {
    assert.equal(
      showUnlockFullCta(
        basePresentation({
          protection_enabled: true,
          interview_requested_at: '2026-01-02T00:00:00Z',
          disclosure_stage: 'blind',
        }),
      ),
      true,
    );
  });

  it('is false when already fully unlocked', () => {
    assert.equal(
      showUnlockFullCta(
        basePresentation({
          protection_enabled: true,
          interview_requested_at: '2026-01-02T00:00:00Z',
          disclosure_stage: 'full_unlocked',
        }),
      ),
      false,
    );
  });
});
