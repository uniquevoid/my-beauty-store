import { ServiceUnavailableException } from '@nestjs/common';
import { rethrowPipelineDbError } from './supabase-error.util';

describe('rethrowPipelineDbError', () => {
  it('maps missing table errors to ServiceUnavailableException', () => {
    expect(() =>
      rethrowPipelineDbError({
        code: 'PGRST205',
        message: "Could not find the table 'public.screened_candidates' in the schema cache",
      }),
    ).toThrow(ServiceUnavailableException);
  });

  it('rethrows unrelated errors', () => {
    const err = new Error('boom');
    expect(() => rethrowPipelineDbError(err)).toThrow(err);
  });
});
