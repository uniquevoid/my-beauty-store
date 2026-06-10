import { ServiceUnavailableException } from '@nestjs/common';

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

export function rethrowPipelineDbError(error: unknown): never {
  const row = error as SupabaseLikeError;
  if (row?.code === 'PGRST205' || row?.message?.includes('schema cache')) {
    throw new ServiceUnavailableException(
      'Pipeline database tables are missing. Run: cd backend && npm run db:migrate',
    );
  }
  throw error;
}
