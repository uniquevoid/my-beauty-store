import { jobMatchesAlert } from './job-alert-matcher';

describe('jobMatchesAlert', () => {
  const job = {
    title: 'Senior Software Engineer',
    description: 'Build APIs with Node.js',
    department: 'Engineering',
    location: 'Remote',
  };

  it('matches when all alert fields fit', () => {
    expect(
      jobMatchesAlert(job, { keyword: 'engineer', location: 'Remote', department: 'Engineering' }),
    ).toBe(true);
  });

  it('treats empty alert fields as wildcards', () => {
    expect(jobMatchesAlert(job, { keyword: null, location: null, department: null })).toBe(true);
  });

  it('rejects when keyword does not appear in searchable fields', () => {
    expect(jobMatchesAlert(job, { keyword: 'designer', location: null, department: null })).toBe(false);
  });

  it('rejects when location does not match', () => {
    expect(jobMatchesAlert(job, { keyword: null, location: 'Berlin', department: null })).toBe(false);
  });
});
