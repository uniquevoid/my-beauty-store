import { rankJobSearchSuggestions } from './job-search-suggestions';

const candidates = [
  {
    slug: 'senior-software-engineer',
    title: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'Madrid, Spain',
  },
  {
    slug: 'qa-engineer',
    title: 'QA Engineer',
    department: 'Engineering',
    location: 'Remote · EU',
  },
  {
    slug: 'solutions-consultant',
    title: 'Solutions Consultant',
    department: 'Professional Services',
    location: 'Barcelona, Spain',
  },
  {
    slug: 'engineering-manager',
    title: 'Engineering Manager',
    department: 'Engineering',
    location: 'Madrid, Spain',
  },
];

describe('rankJobSearchSuggestions', () => {
  it('returns empty results for short queries', () => {
    expect(rankJobSearchSuggestions('e', candidates)).toEqual([]);
    expect(rankJobSearchSuggestions('  ', candidates)).toEqual([]);
  });

  it('prioritizes title prefix matches over substring matches', () => {
    const results = rankJobSearchSuggestions('eng', candidates, 4);
    expect(results.map((item) => item.slug)).toEqual([
      'engineering-manager',
      'qa-engineer',
      'senior-software-engineer',
    ]);
  });

  it('matches department when title does not contain the query', () => {
    const results = rankJobSearchSuggestions('professional', candidates);
    expect(results).toHaveLength(1);
    expect(results[0]?.slug).toBe('solutions-consultant');
  });

  it('deduplicates by slug and respects the limit', () => {
    const duplicated = [
      ...candidates,
      {
        slug: 'qa-engineer',
        title: 'QA Engineer',
        department: 'Engineering',
        location: 'Remote · EU',
      },
    ];
    const results = rankJobSearchSuggestions('engineer', duplicated, 2);
    expect(results).toHaveLength(2);
    expect(new Set(results.map((item) => item.slug)).size).toBe(2);
  });
});
