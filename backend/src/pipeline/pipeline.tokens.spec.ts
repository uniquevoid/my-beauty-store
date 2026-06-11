import { formatCandidateDisplayName } from './pipeline.tokens';
import { buildPresentationFallback } from '../ai/presentation-fallback';

describe('formatCandidateDisplayName', () => {
  it('formats full name as first name plus last initial', () => {
    expect(formatCandidateDisplayName('Jane Doe')).toBe('Jane D.');
  });

  it('returns single name unchanged', () => {
    expect(formatCandidateDisplayName('Jane')).toBe('Jane');
  });
});

describe('buildPresentationFallback', () => {
  it('builds presentation sections from resume and notes', () => {
    const result = buildPresentationFallback({
      resume: {
        name: 'Jane Doe',
        skills: ['TypeScript', 'React'],
        work_experience: [{ title: 'Engineer', company: 'Acme' }],
      },
      jobTitle: 'Senior Engineer',
      screeningNotes: 'Strong communicator\nAvailable in 2 weeks',
    });

    expect(result.headline).toContain('Senior Engineer');
    expect(result.keyStrengths.length).toBeGreaterThan(0);
    expect(result.screeningHighlights).toEqual(['Strong communicator', 'Available in 2 weeks']);
  });
});
