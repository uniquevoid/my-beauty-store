import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';
import { ResumeModule } from '../resume/resume.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [SupabaseModule, ResumeModule, JobsModule, AiModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
