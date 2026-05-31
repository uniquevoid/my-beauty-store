import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [CandidateController],
  providers: [CandidateService],
})
export class CandidateModule {}

