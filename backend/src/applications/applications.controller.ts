import { BadRequestException, Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentTenant } from '../tenants/tenant.decorator';
import type { TenantContext } from '../tenants/tenant.types';
import { ApplicationsService } from './applications.service';
import { ExtractedResume } from '../ai/ai.service';

@Controller('/applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post('/guest/start')
  async startGuest(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { jobSlug?: string; sessionCode?: string; inviteToken?: string },
  ) {
    if (!body?.jobSlug) throw new BadRequestException('jobSlug is required.');
    return await this.applications.startGuestApplication(
      tenant.id,
      body.jobSlug,
      body.sessionCode,
      body.inviteToken,
    );
  }

  @Post('/guest/resume-extract/:applicationCode')
  @UseInterceptors(FileInterceptor('file'))
  async resumeExtract(
    @Param('applicationCode') applicationCode: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Missing resume upload (field name: file).');
    }
    return await this.applications.uploadAndExtractResume(applicationCode, file);
  }

  @Get('/guest/summary/:applicationCode')
  async getGuestSummary(@Param('applicationCode') applicationCode: string) {
    return await this.applications.getGuestApplicationSummary(applicationCode);
  }

  @Post('/guest/submit')
  async submitGuest(@Body() body: { applicationCode?: string; extracted?: ExtractedResume }) {
    if (!body?.applicationCode) throw new BadRequestException('applicationCode is required.');
    if (!body?.extracted) throw new BadRequestException('extracted is required.');
    return await this.applications.submitGuestApplication(body.applicationCode, body.extracted);
  }
}

