import type { JobRow } from './jobs.service';
import { pickRelatedJobs, scoreRelatedJob } from './jobs-related';

function job(overrides: Partial<JobRow> & Pick<JobRow, 'id' | 'slug' | 'title'>): JobRow {
  return {
    tenant_id: 'tenant-1',
    external_id: null,
    department: null,
    location: null,
    employment_type: 'Full-time',
    area_of_interest: null,
    workplace_type: null,
    description: null,
    status: 'published',
    custom_fields: {},
    closed_at: null,
    last_import_batch_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('jobs-related', () => {
  const source = job({
    id: 'source',
    slug: 'source-job',
    title: 'Source Job',
    department: 'Engineering',
    area_of_interest: 'Development',
    created_at: '2026-05-01T00:00:00.000Z',
  });

  it('scores department matches higher than area-only matches', () => {
    const departmentMatch = job({
      id: 'dept',
      slug: 'dept-job',
      title: 'Dept Job',
      department: 'Engineering',
      area_of_interest: 'Consulting',
    });
    const areaMatch = job({
      id: 'area',
      slug: 'area-job',
      title: 'Area Job',
      department: 'Sales',
      area_of_interest: 'Development',
    });

    expect(scoreRelatedJob(source, departmentMatch)).toBe(2);
    expect(scoreRelatedJob(source, areaMatch)).toBe(1);
  });

  it('scores both department and area matches highest', () => {
    const bestMatch = job({
      id: 'best',
      slug: 'best-job',
      title: 'Best Job',
      department: 'Engineering',
      area_of_interest: 'Development',
    });

    expect(scoreRelatedJob(source, bestMatch)).toBe(3);
  });

  it('returns up to three related jobs ordered by score then recency', () => {
    const candidates = [
      job({
        id: '1',
        slug: 'job-1',
        title: 'Job 1',
        department: 'Engineering',
        area_of_interest: 'Development',
        created_at: '2026-05-03T00:00:00.000Z',
      }),
      job({
        id: '2',
        slug: 'job-2',
        title: 'Job 2',
        department: 'Engineering',
        area_of_interest: 'Consulting',
        created_at: '2026-05-02T00:00:00.000Z',
      }),
      job({
        id: '3',
        slug: 'job-3',
        title: 'Job 3',
        department: 'Sales',
        area_of_interest: 'Development',
        created_at: '2026-05-04T00:00:00.000Z',
      }),
      job({
        id: '4',
        slug: 'job-4',
        title: 'Job 4',
        department: 'Sales',
        area_of_interest: 'Account Management',
        created_at: '2026-05-05T00:00:00.000Z',
      }),
      source,
    ];

    const related = pickRelatedJobs(source, candidates, 3);

    expect(related.map((item) => item.slug)).toEqual(['job-1', 'job-2', 'job-3']);
    expect(related.every((item) => !('description' in item))).toBe(true);
  });

  it('excludes the source job from related results', () => {
    const related = pickRelatedJobs(source, [source], 3);
    expect(related).toEqual([]);
  });
});
