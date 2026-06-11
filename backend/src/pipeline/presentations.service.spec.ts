import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PipelineService } from './pipeline.service';
import { PresentationsService } from './presentations.service';
import { SupabaseService } from '../supabase/supabase.service';

function mockQueryChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  const terminal = jest.fn().mockResolvedValue(result);
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = terminal;
  chain.single = terminal;
  return chain;
}

describe('PresentationsService.recordEngagement', () => {
  let service: PresentationsService;
  let fromMock: jest.Mock;

  beforeEach(() => {
    fromMock = jest.fn();
    const supabase = { adminClient: { from: fromMock } } as unknown as SupabaseService;
    service = new PresentationsService(
      supabase,
      {} as PipelineService,
      {} as AiService,
      {} as import('../mail/mail.service').MailService,
    );
  });

  it('returns current stats without updating when preview is true', async () => {
    const findChain = mockQueryChain({
      data: {
        id: 'pres-1',
        status: 'published',
        client_viewed_at: '2026-06-05T10:00:00.000Z',
        client_exported_at: null,
        client_view_count: 2,
        client_export_count: 0,
      },
      error: null,
    });
    fromMock.mockReturnValue(findChain);

    const result = await service.recordEngagement('token-abc', 'viewed', true);

    expect(result).toEqual({
      clientViewedAt: '2026-06-05T10:00:00.000Z',
      clientExportedAt: null,
      clientViewCount: 2,
      clientExportCount: 0,
    });
    expect(findChain.update).not.toHaveBeenCalled();
  });

  it('records first view and increments count', async () => {
    const findChain = mockQueryChain({
      data: {
        id: 'pres-1',
        status: 'published',
        client_viewed_at: null,
        client_exported_at: null,
        client_view_count: 0,
        client_export_count: 0,
      },
      error: null,
    });
    const updateChain = mockQueryChain({
      data: {
        client_viewed_at: '2026-06-05T12:00:00.000Z',
        client_exported_at: null,
        client_view_count: 1,
        client_export_count: 0,
      },
      error: null,
    });

    fromMock
      .mockReturnValueOnce(findChain)
      .mockReturnValueOnce(updateChain);

    const result = await service.recordEngagement('token-abc', 'viewed', false);

    expect(result.clientViewCount).toBe(1);
    expect(result.clientViewedAt).toBe('2026-06-05T12:00:00.000Z');
    expect(updateChain.update).toHaveBeenCalled();
  });

  it('records export_pdf and sets client_exported_at on first export', async () => {
    const findChain = mockQueryChain({
      data: {
        id: 'pres-1',
        status: 'published',
        client_viewed_at: '2026-06-05T10:00:00.000Z',
        client_exported_at: null,
        client_view_count: 1,
        client_export_count: 0,
      },
      error: null,
    });
    const updateChain = mockQueryChain({
      data: {
        client_viewed_at: '2026-06-05T10:00:00.000Z',
        client_exported_at: '2026-06-05T12:00:00.000Z',
        client_view_count: 1,
        client_export_count: 1,
      },
      error: null,
    });

    fromMock.mockReturnValueOnce(findChain).mockReturnValueOnce(updateChain);

    const result = await service.recordEngagement('token-abc', 'export_pdf', false);

    expect(result.clientExportCount).toBe(1);
    expect(result.clientExportedAt).toBe('2026-06-05T12:00:00.000Z');
  });

  it('rejects engagement for unpublished presentations', async () => {
    const findChain = mockQueryChain({
      data: {
        id: 'pres-1',
        status: 'draft',
        client_viewed_at: null,
        client_exported_at: null,
        client_view_count: 0,
        client_export_count: 0,
      },
      error: null,
    });
    fromMock.mockReturnValue(findChain);

    await expect(service.recordEngagement('token-abc', 'viewed', false)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when presentation is not found', async () => {
    const findChain = mockQueryChain({ data: null, error: null });
    fromMock.mockReturnValue(findChain);

    await expect(service.recordEngagement('missing', 'viewed', false)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('PresentationsService.resetEngagement', () => {
  it('clears engagement columns', async () => {
    const fromMock = jest.fn();
    const updateChain = mockQueryChain({
      data: {
        id: 'pres-1',
        client_viewed_at: null,
        client_exported_at: null,
        client_view_count: 0,
        client_export_count: 0,
      },
      error: null,
    });
    fromMock.mockReturnValue(updateChain);

    const supabase = { adminClient: { from: fromMock } } as unknown as SupabaseService;
    const service = new PresentationsService(
      supabase,
      {} as PipelineService,
      {} as AiService,
      {} as import('../mail/mail.service').MailService,
    );

    const result = await service.resetEngagement('tenant-1', 'pres-1');

    expect(result.client_view_count).toBe(0);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        client_viewed_at: null,
        client_exported_at: null,
        client_view_count: 0,
        client_export_count: 0,
      }),
    );
  });
});
