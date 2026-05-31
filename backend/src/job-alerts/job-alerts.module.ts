import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { JobAlertsController } from './job-alerts.controller';
import { JobAlertNotifierService } from './job-alert-notifier.service';
import { JobAlertsService } from './job-alerts.service';

@Module({
  imports: [SupabaseModule, AuthModule, MailModule],
  controllers: [JobAlertsController],
  providers: [JobAlertsService, JobAlertNotifierService],
  exports: [JobAlertNotifierService],
})
export class JobAlertsModule {}
