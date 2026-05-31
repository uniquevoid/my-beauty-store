import { BadRequestException, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentTenant } from '../tenants/tenant.decorator';
import type { TenantContext } from '../tenants/tenant.types';
import { RecommendationsService } from './recommendations.service';

@Controller('/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Post('/start')
  async start(@CurrentTenant() tenant: TenantContext) {
    return await this.recommendations.startSession(tenant.id);
  }

  @Post('/:sessionCode/resume')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @Param('sessionCode') sessionCode: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Missing resume upload (field name: file).');
    }
    return await this.recommendations.uploadAndExtract(sessionCode, file);
  }

  @Get('/:sessionCode/jobs')
  async getJobs(
    @CurrentTenant() tenant: TenantContext,
    @Param('sessionCode') sessionCode: string,
  ) {
    const jobs = await this.recommendations.getRecommendedJobs(tenant.id, sessionCode);
    return { jobs };
  }
}
