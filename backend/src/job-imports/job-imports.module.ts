import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminJobsController } from './admin-jobs.controller';
import { JobImportsController } from './job-imports.controller';
import { JobImportsService } from './job-imports.service';

@Module({
  imports: [SupabaseModule, AdminAuthModule, JobsModule],
  controllers: [JobImportsController, AdminJobsController],
  providers: [JobImportsService],
})
export class JobImportsModule {}
