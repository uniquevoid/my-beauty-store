import { Controller, Get } from '@nestjs/common';
import { careersFromBrandingJson } from '../careers/careers.config';
import { CurrentTenant } from './tenant.decorator';
import type { TenantContext } from './tenant.types';

@Controller('tenants')
export class TenantsController {
  @Get('current')
  getCurrent(@CurrentTenant() tenant: TenantContext) {
    return {
      slug: tenant.slug,
      name: tenant.name,
      branding: tenant.branding_json,
      careers: careersFromBrandingJson(tenant.branding_json),
    };
  }
}
