import { Module } from '@nestjs/common';
import { BrandingExtractService } from './branding-extract.service';

@Module({
  providers: [BrandingExtractService],
  exports: [BrandingExtractService],
})
export class BrandingModule {}
