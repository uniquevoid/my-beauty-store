import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AiModule } from '../ai/ai.module';
import { MailModule } from '../mail/mail.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminPipelineController } from './admin-pipeline.controller';
import { PipelineService } from './pipeline.service';
import { PresentationsService } from './presentations.service';
import { PublicPresentationsController } from './public-presentations.controller';

@Module({
  imports: [SupabaseModule, AdminAuthModule, AiModule, MailModule],
  controllers: [AdminPipelineController, PublicPresentationsController],
  providers: [PipelineService, PresentationsService],
  exports: [PipelineService, PresentationsService],
})
export class PipelineModule {}
