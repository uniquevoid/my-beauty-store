import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

import { SupabaseModule } from './supabase/supabase.module';

import { TenantsModule } from './tenants/tenants.module';

import { JobsModule } from './jobs/jobs.module';

import { AiModule } from './ai/ai.module';

import { ApplicationsModule } from './applications/applications.module';

import { AuthModule } from './auth/auth.module';

import { CandidateModule } from './candidate/candidate.module';

import { RecommendationsModule } from './recommendations/recommendations.module';

import { JobAlertsModule } from './job-alerts/job-alerts.module';

import { AdminAuthModule } from './admin-auth/admin-auth.module';

import { JobImportsModule } from './job-imports/job-imports.module';

import { InternalModule } from './internal/internal.module';

import { ChatModule } from './chat/chat.module';



@Module({

  imports: [

    ConfigModule.forRoot({ isGlobal: true }),

    DatabaseModule,

    SupabaseModule,

    TenantsModule,

    JobsModule,

    AiModule,

    ChatModule,

    ApplicationsModule,

    AuthModule,

    CandidateModule,

    RecommendationsModule,

    JobAlertsModule,

    AdminAuthModule,

    JobImportsModule,

    InternalModule,

  ],

})

export class AppModule {}

