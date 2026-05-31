import { Module } from '@nestjs/common';
import { JobAlertsModule } from '../job-alerts/job-alerts.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [SupabaseModule, JobAlertsModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}

