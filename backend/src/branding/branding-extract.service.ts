import { Injectable } from '@nestjs/common';
import {
  extractProspectBrandingFromUrl,
  type ExtractProspectBrandingResult,
} from './extract-prospect-branding';

@Injectable()
export class BrandingExtractService {
  extractFromUrl(
    url: string,
    overrides?: { companyName?: string; slug?: string; primaryColor?: string },
  ): Promise<ExtractProspectBrandingResult> {
    return extractProspectBrandingFromUrl(url, overrides);
  }
}
