import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  groupApplicationsByScreenedCandidate,
  INVITE_OPEN_STATUSES,
  pickLinkedApplication,
  type LinkedApplicationSummary,
} from './pipeline-application.util';
import { makeInviteToken } from './pipeline.tokens';
import type { ScreenedCandidateRow, ScreenedCandidateStatus } from './presentation.types';
import { rethrowPipelineDbError } from './supabase-error.util';

export type CreateScreenedCandidateInput = {
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  screeningNotes: string;
  screeningCompletedAt?: string | null;
};

export type UpdateScreenedCandidateInput = {
  candidateName?: string;
  candidateEmail?: string;
  screeningNotes?: string;
  screeningCompletedAt?: string | null;
};

@Injectable()
export class PipelineService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(
    tenantId: string,
    adminId: string,
    input: CreateScreenedCandidateInput,
  ): Promise<ScreenedCandidateRow & { job: { slug: string; title: string } }> {
    const name = input.candidateName.trim();
    const email = input.candidateEmail.trim().toLowerCase();
    const notes = input.screeningNotes.trim();

    if (!name) throw new BadRequestException('Candidate name is required.');
    if (!email || !email.includes('@')) throw new BadRequestException('Valid candidate email is required.');

    const { data: job, error: jobErr } = await this.supabase.adminClient
      .from('jobs')
      .select('id, slug, title, status')
      .eq('tenant_id', tenantId)
      .eq('id', input.jobId)
      .maybeSingle();

    if (jobErr) rethrowPipelineDbError(jobErr);
    if (!job) throw new NotFoundException('Job not found.');
    if (job.status !== 'published') {
      throw new BadRequestException('Screened candidates can only be created for published jobs.');
    }

    const inviteToken = makeInviteToken();

    const { data, error } = await this.supabase.adminClient
      .from('screened_candidates')
      .insert({
        tenant_id: tenantId,
        job_id: job.id,
        created_by_admin_id: adminId,
        candidate_name: name,
        candidate_email: email,
        screening_notes: notes,
        screening_completed_at: input.screeningCompletedAt ?? null,
        invite_token: inviteToken,
        status: 'invited',
      })
      .select('*')
      .single();

    if (error) rethrowPipelineDbError(error);

    return {
      ...(data as ScreenedCandidateRow),
      job: { slug: job.slug, title: job.title },
    };
  }

  async list(
    tenantId: string,
    filters?: { status?: ScreenedCandidateStatus; jobId?: string },
  ) {
    let query = this.supabase.adminClient
      .from('screened_candidates')
      .select(
        '*, jobs ( id, slug, title ), candidate_presentations ( id, status, client_viewed_at, client_exported_at, client_view_count, client_export_count, introduction_code, disclosure_stage, protection_enabled, terms_accepted_at, interview_requested_at, full_unlocked_at )',
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.jobId) query = query.eq('job_id', filters.jobId);

    const { data, error } = await query;
    if (error) rethrowPipelineDbError(error);
    const rows = data ?? [];
    if (!rows.length) return [];

    const ids = rows.map((row) => row.id as string);
    const appsByCandidate = await this.fetchLinkedApplicationsByCandidate(ids);

    return rows.map((row) => ({
      ...row,
      applications: pickLinkedApplication(appsByCandidate.get(row.id as string) ?? []),
    }));
  }

  async getById(tenantId: string, id: string) {
    const { data, error } = await this.supabase.adminClient
      .from('screened_candidates')
      .select(
        '*, jobs ( id, slug, title, description, custom_fields ), candidate_presentations ( * )',
      )
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error) rethrowPipelineDbError(error);
    if (!data) throw new NotFoundException('Screened candidate not found.');

    const appsByCandidate = await this.fetchLinkedApplicationsByCandidate([id]);
    return {
      ...data,
      applications: pickLinkedApplication(appsByCandidate.get(id) ?? []),
    };
  }

  async update(tenantId: string, id: string, input: UpdateScreenedCandidateInput) {
    const existing = await this.getById(tenantId, id);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (input.candidateName !== undefined) {
      const name = input.candidateName.trim();
      if (!name) throw new BadRequestException('Candidate name cannot be empty.');
      updates.candidate_name = name;
    }
    if (input.candidateEmail !== undefined) {
      const email = input.candidateEmail.trim().toLowerCase();
      if (!email || !email.includes('@')) throw new BadRequestException('Valid candidate email is required.');
      updates.candidate_email = email;
    }
    if (input.screeningNotes !== undefined) {
      updates.screening_notes = input.screeningNotes.trim();
    }
    if (input.screeningCompletedAt !== undefined) {
      updates.screening_completed_at = input.screeningCompletedAt;
    }

    const { data, error } = await this.supabase.adminClient
      .from('screened_candidates')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select('*')
      .single();

    if (error) rethrowPipelineDbError(error);
    return { ...(data as ScreenedCandidateRow), job: (existing as { jobs: unknown }).jobs };
  }

  async findByInviteToken(tenantId: string, jobId: string, inviteToken: string) {
    const { data, error } = await this.supabase.adminClient
      .from('screened_candidates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('job_id', jobId)
      .eq('invite_token', inviteToken)
      .in('status', [...INVITE_OPEN_STATUSES])
      .maybeSingle();

    if (error) rethrowPipelineDbError(error);
    return data as ScreenedCandidateRow | null;
  }

  async markApplied(screenedCandidateId: string, applicationId: string) {
    const { error } = await this.supabase.adminClient
      .from('screened_candidates')
      .update({
        status: 'applied',
        updated_at: new Date().toISOString(),
      })
      .eq('id', screenedCandidateId)
      .in('status', [...INVITE_OPEN_STATUSES]);

    if (error) rethrowPipelineDbError(error);

    const { error: linkErr } = await this.supabase.adminClient
      .from('applications')
      .update({ screened_candidate_id: screenedCandidateId })
      .eq('id', applicationId);

    if (linkErr) rethrowPipelineDbError(linkErr);
  }

  async markPresentationDraft(screenedCandidateId: string) {
    const { error } = await this.supabase.adminClient
      .from('screened_candidates')
      .update({
        status: 'presentation_draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', screenedCandidateId)
      .in('status', ['applied', 'presentation_draft']);

    if (error) rethrowPipelineDbError(error);
  }

  async markPublished(screenedCandidateId: string) {
    const { error } = await this.supabase.adminClient
      .from('screened_candidates')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', screenedCandidateId);

    if (error) rethrowPipelineDbError(error);
  }

  async resolveRecruiterNotificationEmail(tenantId: string): Promise<string | null> {
    const { data: tenant, error: tenantErr } = await this.supabase.adminClient
      .from('tenants')
      .select('settings_json')
      .eq('id', tenantId)
      .maybeSingle();

    if (tenantErr) throw tenantErr;

    const settings = (tenant?.settings_json ?? {}) as { recruiterNotificationEmail?: string };
    const configured = settings.recruiterNotificationEmail?.trim();
    if (configured && configured.includes('@')) return configured;

    const { data: admins, error: adminErr } = await this.supabase.adminClient
      .from('admin_users')
      .select('username')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (adminErr) throw adminErr;
    const username = admins?.[0]?.username?.trim();
    if (username && username.includes('@')) return username;
    return null;
  }

  private async fetchLinkedApplicationsByCandidate(screenedCandidateIds: string[]) {
    if (!screenedCandidateIds.length) return new Map<string, LinkedApplicationSummary[]>();

    const { data, error } = await this.supabase.adminClient
      .from('applications')
      .select('id, application_code, status, resume_extracted, created_at, screened_candidate_id')
      .in('screened_candidate_id', screenedCandidateIds)
      .order('created_at', { ascending: false });

    if (error) rethrowPipelineDbError(error);
    return groupApplicationsByScreenedCandidate(
      (data ?? []) as Array<LinkedApplicationSummary & { screened_candidate_id: string }>,
    );
  }
}
