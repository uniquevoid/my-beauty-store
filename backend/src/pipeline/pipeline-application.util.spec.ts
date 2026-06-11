import {
  pickLinkedApplication,
  type LinkedApplicationSummary,
} from './pipeline-application.util';

describe('pickLinkedApplication', () => {
  const started: LinkedApplicationSummary = {
    id: 'a1',
    application_code: 'code1',
    status: 'started',
    created_at: '2026-06-05T10:00:00Z',
  };

  const submitted: LinkedApplicationSummary = {
    id: 'a2',
    application_code: 'code2',
    status: 'submitted',
    created_at: '2026-06-05T09:00:00Z',
  };

  it('returns null when no applications', () => {
    expect(pickLinkedApplication([])).toBeNull();
    expect(pickLinkedApplication(null)).toBeNull();
  });

  it('prefers submitted over newer started application', () => {
    expect(pickLinkedApplication([started, submitted])).toEqual(submitted);
  });

  it('returns most recent when none submitted', () => {
    const older: LinkedApplicationSummary = {
      ...started,
      id: 'old',
      created_at: '2026-06-05T08:00:00Z',
    };
    expect(pickLinkedApplication([older, started])).toEqual(started);
  });
});
