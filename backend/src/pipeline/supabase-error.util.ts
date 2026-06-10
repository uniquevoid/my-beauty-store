import { ServiceUnavailableException } from '@nestjs/common';

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

function isPipelineSchemaError(row: SupabaseLikeError): boolean {
  if (row?.code === 'PGRST205' || row?.code === 'PGRST204') return true;
  const message = row?.message ?? '';
  return message.includes('schema cache') || message.includes("Could not find the '");
}

export function rethrowPipelineDbError(error: unknown): never {
  const row = error as SupabaseLikeError;
  if (isPipelineSchemaError(row)) {
    throw new ServiceUnavailableException(
      'Pipeline database schema is outdated. Run: cd backend && npm run db:migrate',
    );
  }
  throw error;
}
