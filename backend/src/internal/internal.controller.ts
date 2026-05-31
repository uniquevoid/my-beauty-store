import {

  BadRequestException,

  Body,

  Controller,

  Get,

  Headers,

  Param,

  Patch,

  Post,

} from '@nestjs/common';

import { TenantProvisioningService } from './tenant-provisioning.service';



function requireProvisionKey(headers: Record<string, string | string[] | undefined>) {

  const expected = process.env.PROVISION_API_KEY;

  if (!expected) {

    throw new Error('PROVISION_API_KEY is missing from environment variables.');

  }

  const provided = headers['x-provision-key'];

  const value = Array.isArray(provided) ? provided[0] : provided;

  if (!value || value !== expected) {

    throw new BadRequestException('Invalid provision key.');

  }

}



@Controller('internal/tenants')

export class InternalController {

  constructor(private readonly provisioning: TenantProvisioningService) {}



  @Get()

  async list(@Headers() headers: Record<string, string | string[] | undefined>) {

    requireProvisionKey(headers);

    return this.provisioning.listTenants();

  }



  @Post()

  async provision(

    @Headers() headers: Record<string, string | string[] | undefined>,

    @Body()

    body: {

      slug?: string;

      name?: string;

      hostname?: string;

      subdomain?: string;

      branding?: Record<string, unknown>;

    },

  ) {

    requireProvisionKey(headers);

    const slug = body.slug?.trim();

    const name = body.name?.trim();

    if (!slug || !name) {

      throw new BadRequestException('slug and name are required.');

    }



    return this.provisioning.provisionTenant({

      slug,

      name,

      hostname: body.hostname?.trim(),

      subdomain: body.subdomain?.trim() || slug,

      branding_json: body.branding ?? {},

    });

  }



  @Patch(':slug')

  async update(

    @Headers() headers: Record<string, string | string[] | undefined>,

    @Param('slug') slug: string,

    @Body()

    body: {

      name?: string;

      hostname?: string;

      subdomain?: string;

      branding?: Record<string, unknown>;

    },

  ) {

    requireProvisionKey(headers);

    if (!slug?.trim()) {

      throw new BadRequestException('slug is required.');

    }



    return this.provisioning.updateTenant(slug, {

      name: body.name,

      hostname: body.hostname,

      subdomain: body.subdomain,

      branding: body.branding,

    });

  }



  @Post('migrate-default')

  async migrateDefault(

    @Headers() headers: Record<string, string | string[] | undefined>,

    @Body() body: { branding?: Record<string, unknown> },

  ) {

    requireProvisionKey(headers);

    return this.provisioning.ensureDefaultTenant(body.branding);

  }

}

