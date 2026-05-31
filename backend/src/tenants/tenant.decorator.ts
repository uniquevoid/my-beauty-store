import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithTenant } from './tenant.middleware';
import type { TenantContext } from './tenant.types';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const req = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return req.tenant;
  },
);
