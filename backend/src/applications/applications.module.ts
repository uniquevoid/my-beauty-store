import { Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module';

import { RecommendationsModule } from '../recommendations/recommendations.module';

import { ResumeModule } from '../resume/resume.module';

import { SupabaseModule } from '../supabase/supabase.module';

import { ApplicationsController } from './applications.controller';

import { ApplicationsService } from './applications.service';



@Module({

  imports: [SupabaseModule, ResumeModule, RecommendationsModule, MailModule],

  controllers: [ApplicationsController],

  providers: [ApplicationsService],

})

export class ApplicationsModule {}


