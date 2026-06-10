import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { SupabaseService } from '../supabase/supabase.service';

function mockQueryChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  const terminal = jest.fn().mockResolvedValue(result);
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = terminal;
  chain.single = terminal;
  return chain;
}

describe('PipelineService', () => {
  let service: PipelineService;
  let fromMock: jest.Mock;

  beforeEach(() => {
    fromMock = jest.fn();
    const supabase = {
      adminClient: { from: fromMock },
    } as unknown as SupabaseService;
    service = new PipelineService(supabase);
  });

  it('rejects empty candidate name', async () => {
    await expect(
      service.create('tenant-1', 'admin-1', {
        jobId: 'job-1',
        candidateName: '  ',
        candidateEmail: 'test@example.com',
        screeningNotes: 'notes',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid email', async () => {
    await expect(
      service.create('tenant-1', 'admin-1', {
        jobId: 'job-1',
        candidateName: 'Test User',
        candidateEmail: 'not-an-email',
        screeningNotes: 'notes',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates screened candidate for published job', async () => {
    const jobChain = mockQueryChain({
      data: { id: 'job-1', slug: 'engineer', title: 'Engineer', status: 'published' },
      error: null,
    });
    const insertChain = mockQueryChain({
      data: {
        id: 'sc-1',
        tenant_id: 'tenant-1',
        job_id: 'job-1',
        candidate_name: 'Test User',
        candidate_email: 'test@example.com',
        screening_notes: 'notes',
        invite_token: 'token-abc',
        status: 'invited',
      },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'jobs') return jobChain;
      if (table === 'screened_candidates') return insertChain;
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await service.create('tenant-1', 'admin-1', {
      jobId: 'job-1',
      candidateName: 'Test User',
      candidateEmail: 'test@example.com',
      screeningNotes: 'notes',
    });

    expect(result.id).toBe('sc-1');
    expect(result.job.slug).toBe('engineer');
    expect(insertChain.insert).toHaveBeenCalled();
  });

  it('throws when job is not published', async () => {
    const jobChain = mockQueryChain({
      data: { id: 'job-1', slug: 'engineer', title: 'Engineer', status: 'draft' },
      error: null,
    });
    fromMock.mockReturnValue(jobChain);

    await expect(
      service.create('tenant-1', 'admin-1', {
        jobId: 'job-1',
        candidateName: 'Test User',
        candidateEmail: 'test@example.com',
        screeningNotes: 'notes',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps missing table errors to ServiceUnavailableException', async () => {
    const jobChain = mockQueryChain({
      data: { id: 'job-1', slug: 'engineer', title: 'Engineer', status: 'published' },
      error: null,
    });
    const insertChain = mockQueryChain({
      data: null,
      error: {
        code: 'PGRST205',
        message: "Could not find the table 'public.screened_candidates' in the schema cache",
      },
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'jobs') return jobChain;
      if (table === 'screened_candidates') return insertChain;
      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      service.create('tenant-1', 'admin-1', {
        jobId: 'job-1',
        candidateName: 'Test User',
        candidateEmail: 'test@example.com',
        screeningNotes: 'notes',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('throws NotFoundException when job missing', async () => {
    const jobChain = mockQueryChain({ data: null, error: null });
    fromMock.mockReturnValue(jobChain);

    await expect(
      service.create('tenant-1', 'admin-1', {
        jobId: 'missing',
        candidateName: 'Test User',
        candidateEmail: 'test@example.com',
        screeningNotes: 'notes',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
