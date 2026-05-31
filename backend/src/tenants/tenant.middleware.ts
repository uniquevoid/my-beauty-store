import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantsService } from './tenants.service';
import type { TenantContext } from './tenant.types';

export type RequestWithTenant = Request & { tenant: TenantContext };

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenants: TenantsService) {}

  async use(req: RequestWithTenant, _res: Response, next: NextFunction) {
    const hostHeader = req.headers['x-tenant-host'] ?? req.headers.host;
    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    const tenantSlug =
      typeof req.query.tenant === 'string' ? req.query.tenant : undefined;

    req.tenant = await this.tenants.resolveFromRequest({ host, tenantSlug });
    next();
  }
}
