import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { ResumeFileService } from './resume-file.service';

@Module({
  imports: [SupabaseModule, AiModule],
  providers: [ResumeFileService],
  exports: [ResumeFileService],
})
export class ResumeModule {}
