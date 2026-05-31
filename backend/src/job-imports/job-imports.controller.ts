import {

  BadRequestException,

  Body,

  Controller,

  Get,

  Headers,

  Param,

  Post,

  UploadedFile,

  UseInterceptors,

} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { AdminAuthService } from '../admin-auth/admin-auth.service';

import { JobImportsService } from './job-imports.service';



@Controller('admin')

export class JobImportsController {

  constructor(

    private readonly imports: JobImportsService,

    private readonly adminAuth: AdminAuthService,

  ) {}



  private tenantIdFromAuth(auth: string | undefined) {

    return this.adminAuth.adminFromAuthHeader(auth).tenant_id;

  }



  @Get('imports/last')

  lastBatch(@Headers('authorization') auth?: string) {

    return this.imports.getLastBatch(this.tenantIdFromAuth(auth), auth);

  }



  @Get('import-profiles')

  listProfiles(@Headers('authorization') auth?: string) {

    return this.imports.listProfiles(this.tenantIdFromAuth(auth), auth);

  }



  @Post('import-profiles')

  saveProfile(

    @Headers('authorization') auth: string | undefined,

    @Body() body: Record<string, unknown>,

  ) {

    return this.imports.saveProfile(

      this.tenantIdFromAuth(auth),

      auth,

      body as Parameters<JobImportsService['saveProfile']>[2],

    );

  }



  @Post('imports/upload')

  @UseInterceptors(FileInterceptor('file'))

  async upload(

    @Headers('authorization') auth: string | undefined,

    @UploadedFile() file?: Express.Multer.File,

  ) {

    const payload = this.adminAuth.adminFromAuthHeader(auth);



    if (!file?.buffer?.length) {

      throw new BadRequestException('Missing CSV file (field: file).');

    }



    return this.imports.upload(

      payload.tenant_id,

      payload.sub,

      file.originalname || 'import.csv',

      file.buffer.toString('utf-8'),

      auth,

    );

  }



  @Post('imports/:batchId/mapping')

  saveMapping(

    @Param('batchId') batchId: string,

    @Headers('authorization') auth: string | undefined,

    @Body() body: Record<string, unknown>,

  ) {

    return this.imports.saveMapping(

      this.tenantIdFromAuth(auth),

      batchId,

      auth,

      body as Parameters<JobImportsService['saveMapping']>[3],

    );

  }



  @Post('imports/:batchId/preview')

  preview(@Param('batchId') batchId: string, @Headers('authorization') auth?: string) {

    return this.imports.preview(this.tenantIdFromAuth(auth), batchId, auth);

  }



  @Post('imports/:batchId/apply')

  apply(@Param('batchId') batchId: string, @Headers('authorization') auth?: string) {

    return this.imports.apply(this.tenantIdFromAuth(auth), batchId, auth);

  }

}


