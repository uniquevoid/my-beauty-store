import { buildCareerChatContext, serializeCareerChatContext } from './chat-context.builder';
import type { JobRow } from '../jobs/jobs.service';

describe('chat-context.builder', () => {
  const sampleJob: JobRow = {
    id: '1',
    tenant_id: 't1',
    slug: 'software-engineer',
    external_id: null,
    title: 'Software Engineer',
    department: 'Engineering',
    location: 'Remote',
    employment_type: 'full_time',
    area_of_interest: 'Development',
    workplace_type: 'remote',
    description: 'Build great software.',
    status: 'published',
    custom_fields: {},
    closed_at: null,
    last_import_batch_id: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  it('builds context from branding and jobs', () => {
    const branding = {
      companyName: 'Acme Corp',
      metaDescription: 'Join Acme',
      hero: { headline: 'Work at Acme', subheadline: 'Great team' },
      landing: {
        about: { body: 'We innovate daily.' },
        coreValues: { values: [{ label: 'Integrity' }, { label: 'Teamwork' }] },
        testimonials: {
          items: [{ quote: 'Best place to work', name: 'Jane', role: 'Engineer' }],
        },
      },
    };

    const context = buildCareerChatContext('Acme Corp', branding, [sampleJob]);

    expect(context.company.name).toBe('Acme Corp');
    expect(context.company.heroHeadline).toBe('Work at Acme');
    expect(context.culture.about).toBe('We innovate daily.');
    expect(context.culture.coreValues).toEqual(['Integrity', 'Teamwork']);
    expect(context.culture.testimonials).toHaveLength(1);
    expect(context.platformFeatures.length).toBeGreaterThan(0);
    expect(context.jobs).toHaveLength(1);
    expect(context.jobs[0].slug).toBe('software-engineer');
  });

  it('serializes context as JSON under size cap', () => {
    const context = buildCareerChatContext('Acme', {}, []);
    const serialized = serializeCareerChatContext(context);
    expect(serialized.length).toBeLessThanOrEqual(12_000);
    expect(JSON.parse(serialized)).toHaveProperty('company');
  });
});
