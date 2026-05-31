import {

  BadRequestException,

  Body,

  Controller,

  Delete,

  Get,

  Headers,

  Param,

  Patch,

  Query,

} from '@nestjs/common';

import { AdminAuthService } from '../admin-auth/admin-auth.service';

import { JobsService, type JobStatus } from '../jobs/jobs.service';



@Controller('admin/jobs')

export class AdminJobsController {

  constructor(

    private readonly jobs: JobsService,

    private readonly adminAuth: AdminAuthService,

  ) {}



  private tenantIdFromAuth(auth: string | undefined) {

    return this.adminAuth.adminFromAuthHeader(auth).tenant_id;

  }



  @Get('stats')

  stats(@Headers('authorization') auth?: string) {

    return this.jobs.getStats(this.tenantIdFromAuth(auth));

  }



  @Get()

  list(

    @Headers('authorization') auth: string | undefined,

    @Query('status') status?: JobStatus,

    @Query('q') q?: string,

  ) {

    return this.jobs.listForAdmin(this.tenantIdFromAuth(auth), { status, q });

  }



  @Patch(':id/status')

  updateStatus(

    @Headers('authorization') auth: string | undefined,

    @Param('id') id: string,

    @Body() body: { status?: JobStatus },

  ) {

    if (!body.status || !['draft', 'published', 'closed'].includes(body.status)) {

      throw new BadRequestException('Invalid status.');

    }

    return this.jobs.updateStatus(this.tenantIdFromAuth(auth), id, body.status);

  }



  @Delete(':id')

  async deleteJob(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {

    await this.jobs.deleteJob(this.tenantIdFromAuth(auth), id);

    return { ok: true };

  }

}


