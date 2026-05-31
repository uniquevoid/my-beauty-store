import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { type ExtractedResume } from '../ai/ai.service';
import { validateGuestApplication } from './application-validation';
import { MailService } from '../mail/mail.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { ResumeFileService } from '../resume/resume-file.service';
import { SupabaseService } from '../supabase/supabase.service';
import crypto from 'crypto';

function makeApplicationCode() {
  return crypto.randomBytes(12).toString('base64url');
}

export type ApplicationRow = {
  id: string;
  application_code: string;
  job_id: string;
  candidate_id: string | null;
  applicant_email: string | null;
  resume_storage_path: string | null;
  resume_extracted: ExtractedResume;
  status: string;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly resumeFile: ResumeFileService,
    private readonly recommendations: RecommendationsService,
    private readonly mail: MailService,
  ) {}

  async startGuestApplication(tenantId: string, jobSlug: string, sessionCode?: string) {
    const { data: job, error: jobError } = await this.supabase.adminClient
      .from('jobs')
      .select('id, slug, status')
      .eq('tenant_id', tenantId)
      .eq('slug', jobSlug)
      .eq('status', 'published')
      .maybeSingle();

    if (jobError) throw jobError;
    if (!job) throw new BadRequestException('Job not found or not published.');

    let resumeData: {
      resume_storage_path?: string | null;
      resume_extracted?: ExtractedResume;
      applicant_email?: string | null;
    } = {};

    if (sessionCode) {
      const session = await this.recommendations.getSession(sessionCode);
      if (!session.resume_extracted || Object.keys(session.resume_extracted).length === 0) {
        throw new BadRequestException('Session has no extracted resume data.');
      }
      resumeData = {
        resume_storage_path: session.resume_storage_path,
        resume_extracted: session.resume_extracted,
        applicant_email: (session.resume_extracted.email ?? '').trim() || null,
      };
    }

    const applicationCode = makeApplicationCode();

    const { data, error } = await this.supabase.adminClient
      .from('applications')
      .insert({
        tenant_id: tenantId,
        application_code: applicationCode,
        job_id: job.id,
        status: 'started',
        ...resumeData,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as ApplicationRow;
  }

  async uploadAndExtractResume(applicationCode: string, file: Express.Multer.File) {
    const { data: appRow, error: appErr } = await this.supabase.adminClient
      .from('applications')
      .select('*')
      .eq('application_code', applicationCode)
      .maybeSingle();

    if (appErr) throw appErr;
    if (!appRow) throw new BadRequestException('Invalid application code.');

    const { resume_storage_path, extracted } = await this.resumeFile.uploadAndExtract(
      `applications/${applicationCode}`,
      file,
      { mode: 'application' },
    );
    const applicantEmail = (extracted.email ?? '').trim() || null;

    const { data: updated, error: updateErr } = await this.supabase.adminClient
      .from('applications')
      .update({
        resume_storage_path,
        resume_extracted: extracted,
        applicant_email: applicantEmail,
      })
      .eq('id', appRow.id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    return {
      application: updated as ApplicationRow,
      extracted,
      resume_storage_path,
    };
  }

  async getGuestApplicationSummary(applicationCode: string) {
    const { data, error } = await this.supabase.adminClient
      .from('applications')
      .select('application_code, applicant_email, status, jobs ( title )')
      .eq('application_code', applicationCode)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Invalid application code.');

    const job = data.jobs as { title: string } | { title: string }[] | null;
    const jobTitle = Array.isArray(job) ? job[0]?.title : job?.title;

    return {
      applicant_email: data.applicant_email,
      job_title: jobTitle ?? null,
      status: data.status,
    };
  }

  async submitGuestApplication(applicationCode: string, extracted: ExtractedResume) {
    const { data: existing, error: findErr } = await this.supabase.adminClient
      .from('applications')
      .select('resume_storage_path')
      .eq('application_code', applicationCode)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) throw new NotFoundException('Invalid application code.');

    const validation = validateGuestApplication(extracted, {
      hasResume: Boolean(existing.resume_storage_path),
    });
    if (!validation.valid) {
      throw new BadRequestException(validation.errors[0]);
    }

    const applicantEmail = (extracted.email ?? '').trim() || null;

    const { data: updated, error: updateErr } = await this.supabase.adminClient
      .from('applications')
      .update({
        resume_extracted: extracted,
        applicant_email: applicantEmail,
        status: 'submitted',
      })
      .eq('application_code', applicationCode)
      .select('*, jobs ( title )')
      .single();

    if (updateErr) throw updateErr;

    const row = updated as ApplicationRow & { jobs?: { title: string } | { title: string }[] };
    const job = row.jobs;
    const jobTitle = Array.isArray(job) ? job[0]?.title : job?.title;

    void this.mail.sendApplicationConfirmation({
      to: applicantEmail!,
      candidateName: extracted.name ?? undefined,
      jobTitle: jobTitle ?? 'Open role',
      applicationCode,
    });

    return updated as ApplicationRow;
  }
}
