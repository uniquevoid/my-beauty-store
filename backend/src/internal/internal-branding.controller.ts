import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import { BrandingExtractService } from '../branding/branding-extract.service';

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

@Controller('internal/branding')
export class InternalBrandingController {
  constructor(private readonly brandingExtract: BrandingExtractService) {}

  @Post('from-url')
  async fromUrl(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body()
    body: {
      url?: string;
      companyName?: string;
      slug?: string;
      primaryColor?: string;
    },
  ) {
    requireProvisionKey(headers);

    const url = body.url?.trim();
    if (!url) {
      throw new BadRequestException('url is required.');
    }

    return this.brandingExtract.extractFromUrl(url, {
      companyName: body.companyName?.trim(),
      slug: body.slug?.trim(),
      primaryColor: body.primaryColor?.trim(),
    });
  }
}
