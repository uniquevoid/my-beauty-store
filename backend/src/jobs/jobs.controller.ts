import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { CurrentTenant } from '../tenants/tenant.decorator';
import type { TenantContext } from '../tenants/tenant.types';
import { JobsService } from './jobs.service';

@Controller()
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('/jobs/areas-of-interest')
  async listAreasOfInterest(@CurrentTenant() tenant: TenantContext) {
    return await this.jobs.listDistinctAreasOfInterest(tenant.id);
  }

  @Get('/jobs/locations')
  async listJobLocations(@CurrentTenant() tenant: TenantContext) {
    return await this.jobs.listDistinctLocations(tenant.id);
  }

  @Get('/jobs')
  async listJobs(
    @CurrentTenant() tenant: TenantContext,
    @Query('q') q?: string,
    @Query('location') location?: string,
    @Query('areaOfInterest') areaOfInterest?: string,
  ) {
    return await this.jobs.listPublished(tenant.id, { q, location, areaOfInterest });
  }

  @Get('/jobs/:slug')
  async getJob(@CurrentTenant() tenant: TenantContext, @Param('slug') slug: string) {
    const job = await this.jobs.getPublishedBySlug(tenant.id, slug);
    if (!job) {
      const closed = await this.jobs.getBySlug(tenant.id, slug);
      if (closed?.status === 'closed') {
        throw new NotFoundException('This position is no longer open.');
      }
      throw new NotFoundException('Job not found.');
    }

    const related_jobs = await this.jobs.listRelatedPublished(tenant.id, job);
    return { ...job, related_jobs };
  }
}
