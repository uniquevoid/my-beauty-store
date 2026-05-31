import { Body, Controller, Get, Headers, Patch } from '@nestjs/common';
import type { ExtractedResume } from '../ai/extracted-resume.types';
import { CandidateService } from './candidate.service';

@Controller('/candidate')
export class CandidateController {
  constructor(private readonly candidate: CandidateService) {}

  @Get('/dashboard')
  async dashboard(@Headers('authorization') authorization?: string) {
    return await this.candidate.getDashboard(authorization);
  }

  @Patch('/profile')
  async updateProfile(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { profile_json: ExtractedResume },
  ) {
    return await this.candidate.updateProfile(authorization, body.profile_json);
  }
}

