import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { PipelineService } from './pipeline.service';
import { PresentationsService } from './presentations.service';
import type { PresentationContent, ScreenedCandidateStatus } from './presentation.types';

@Controller('admin')
export class AdminPipelineController {
  constructor(
    private readonly pipeline: PipelineService,
    private readonly presentations: PresentationsService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  private auth(authHeader: string | undefined) {
    return this.adminAuth.adminFromAuthHeader(authHeader);
  }

  @Post('screened-candidates')
  async create(
    @Headers('authorization') auth: string | undefined,
    @Body()
    body: {
      jobId?: string;
      candidateName?: string;
      candidateEmail?: string;
      screeningNotes?: string;
      screeningCompletedAt?: string | null;
    },
  ) {
    const payload = this.auth(auth);
    if (!body.jobId) throw new BadRequestException('jobId is required.');
    const row = await this.pipeline.create(payload.tenant_id, payload.sub, {
      jobId: body.jobId,
      candidateName: body.candidateName ?? '',
      candidateEmail: body.candidateEmail ?? '',
      screeningNotes: body.screeningNotes ?? '',
      screeningCompletedAt: body.screeningCompletedAt,
    });
    return row;
  }

  @Get('screened-candidates')
  list(
    @Headers('authorization') auth: string | undefined,
    @Query('status') status?: ScreenedCandidateStatus,
    @Query('jobId') jobId?: string,
  ) {
    const payload = this.auth(auth);
    return this.pipeline.list(payload.tenant_id, { status, jobId });
  }

  @Get('screened-candidates/:id')
  getOne(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    const payload = this.auth(auth);
    return this.pipeline.getById(payload.tenant_id, id);
  }

  @Patch('screened-candidates/:id')
  update(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
    @Body()
    body: {
      candidateName?: string;
      candidateEmail?: string;
      screeningNotes?: string;
      screeningCompletedAt?: string | null;
    },
  ) {
    const payload = this.auth(auth);
    return this.pipeline.update(payload.tenant_id, id, body);
  }

  @Post('presentations/:screenedCandidateId/generate')
  generate(
    @Headers('authorization') auth: string | undefined,
    @Param('screenedCandidateId') screenedCandidateId: string,
  ) {
    const payload = this.auth(auth);
    return this.presentations.generate(payload.tenant_id, screenedCandidateId);
  }

  @Patch('presentations/:id')
  updatePresentation(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string,
    @Body()
    body: {
      content?: PresentationContent;
      candidateDisplayName?: string;
      protectionEnabled?: boolean;
    },
  ) {
    const payload = this.auth(auth);
    if (!body.content) throw new BadRequestException('content is required.');
    return this.presentations.updateContent(
      payload.tenant_id,
      id,
      body.content,
      body.candidateDisplayName,
      { protectionEnabled: body.protectionEnabled },
    );
  }

  @Post('presentations/:id/publish')
  publish(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    const payload = this.auth(auth);
    return this.presentations.publish(payload.tenant_id, id, payload.sub);
  }

  @Post('presentations/:id/unlock-full')
  unlockFull(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    const payload = this.auth(auth);
    return this.presentations.unlockFull(payload.tenant_id, id, payload.sub);
  }

  @Get('presentations/:id/audit-events')
  auditEvents(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    const payload = this.auth(auth);
    return this.presentations.getAuditEvents(payload.tenant_id, id);
  }

  @Post('presentations/:id/reset-engagement')
  resetEngagement(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    const payload = this.auth(auth);
    return this.presentations.resetEngagement(payload.tenant_id, id);
  }
}
