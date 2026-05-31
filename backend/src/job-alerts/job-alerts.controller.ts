import { Body, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { CurrentTenant } from '../tenants/tenant.decorator';
import type { TenantContext } from '../tenants/tenant.types';
import { JobAlertsService } from './job-alerts.service';

@Controller('/job-alerts')
export class JobAlertsController {
  constructor(private readonly jobAlerts: JobAlertsService) {}

  @Get()
  async list(
    @CurrentTenant() tenant: TenantContext,
    @Headers('authorization') authorization?: string,
  ) {
    return await this.jobAlerts.list(tenant.id, authorization);
  }

  @Post()
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Headers('authorization') authorization?: string,
    @Body() body?: { keyword?: string; location?: string; department?: string },
  ) {
    return await this.jobAlerts.create(tenant.id, authorization, body ?? {});
  }

  @Delete('/:id')
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Headers('authorization') authorization?: string,
    @Param('id') id?: string,
  ) {
    return await this.jobAlerts.remove(tenant.id, authorization, id ?? '');
  }
}
