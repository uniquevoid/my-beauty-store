import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';

import type { ExtractedResume } from '../ai/extracted-resume.types';
import { validateCandidateProfile } from '../applications/application-validation';
import { AuthService } from '../auth/auth.service';

import { SupabaseService } from '../supabase/supabase.service';



type JobSummary = {

  slug: string;

  title: string;

  department: string | null;

  location: string | null;

  employment_type: string | null;

};



type ApplicationWithJob = {

  id: string;

  application_code: string;

  job_id: string;

  status: string;

  created_at: string;

  updated_at: string;

  jobs: JobSummary | JobSummary[] | null;

};



function normalizeJob(jobs: JobSummary | JobSummary[] | null): JobSummary | null {

  if (!jobs) return null;

  return Array.isArray(jobs) ? (jobs[0] ?? null) : jobs;

}



@Injectable()

export class CandidateService {

  constructor(

    private readonly supabase: SupabaseService,

    private readonly auth: AuthService,

  ) {}



  private candidateIdFromAuthHeader(authorization?: string) {

    const token = (authorization ?? '').replace(/^Bearer\s+/i, '').trim();

    if (!token) throw new UnauthorizedException('Missing token.');

    return this.auth.verifyCandidateToken(token).candidateId;

  }



  async getDashboard(authorization?: string) {

    const candidateId = this.candidateIdFromAuthHeader(authorization);



    const { data: candidate, error: candidateErr } = await this.supabase.adminClient

      .from('candidates')

      .select('id, email, profile_json, created_at, updated_at')

      .eq('id', candidateId)

      .single();



    if (candidateErr) throw candidateErr;



    const { data: applications, error: appsErr } = await this.supabase.adminClient

      .from('applications')

      .select(

        'id, application_code, job_id, status, created_at, updated_at, jobs ( slug, title, department, location, employment_type )',

      )

      .eq('candidate_id', candidateId)

      .order('created_at', { ascending: false });



    if (appsErr) throw appsErr;

    const { data: jobAlerts, error: alertsErr } = await this.supabase.adminClient
      .from('job_alerts')
      .select('id, keyword, location, department, created_at, updated_at')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (alertsErr) throw alertsErr;

    const normalizedApplications = ((applications ?? []) as ApplicationWithJob[]).map((app) => {

      const job = normalizeJob(app.jobs);

      return {

        id: app.id,

        application_code: app.application_code,

        status: app.status,

        created_at: app.created_at,

        updated_at: app.updated_at,

        job: job

          ? {

              slug: job.slug,

              title: job.title,

              department: job.department,

              location: job.location,

              employment_type: job.employment_type,

            }

          : null,

      };

    });



    return { candidate, applications: normalizedApplications, jobAlerts: jobAlerts ?? [] };

  }

  async updateProfile(authorization: string | undefined, profileJson: ExtractedResume) {
    const candidateId = this.candidateIdFromAuthHeader(authorization);

    const { data: existing, error: findErr } = await this.supabase.adminClient
      .from('candidates')
      .select('id, email, profile_json')
      .eq('id', candidateId)
      .single();

    if (findErr) throw findErr;

    const accountEmail = (existing.email as string).trim().toLowerCase();
    const merged: ExtractedResume = {
      ...profileJson,
      email: accountEmail,
    };

    const existingProfile = (existing.profile_json ?? {}) as ExtractedResume;
    const existingSkills = existingProfile.skills ?? [];
    if (!merged.skills?.length && existingSkills.length > 0) {
      merged.skills = existingSkills;
    }

    const validation = validateCandidateProfile(merged);
    if (!validation.valid) {
      throw new BadRequestException(validation.errors[0]);
    }

    const { data: updated, error: updateErr } = await this.supabase.adminClient
      .from('candidates')
      .update({ profile_json: merged })
      .eq('id', candidateId)
      .select('id, email, profile_json, created_at, updated_at')
      .single();

    if (updateErr) throw updateErr;
    return { candidate: updated };
  }

}


