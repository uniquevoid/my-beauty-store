import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ExtractedResume } from '../ai/ai.service';
import { AiService } from '../ai/ai.service';
import { MailService } from '../mail/mail.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PipelineService } from './pipeline.service';
import { formatCandidateDisplayName, makeShareToken } from './pipeline.tokens';
import { rethrowPipelineDbError } from './supabase-error.util';
import {
  buildBlindPresentation,
  makeIntroductionCode,
  resolvePublicContent,
  scanRedactionFlags,
} from './presentation-redaction';
import type {
  CandidatePresentationRow,
  IntroductionAuditEventRow,
  IntroductionAuditEventType,
  PresentationContent,
  PresentationEngagementEvent,
  PresentationEngagementStats,
  PublicPresentationPayload,
} from './presentation.types';

@Injectable()
export class PresentationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly pipeline: PipelineService,
    private readonly ai: AiService,
    private readonly mail: MailService,
  ) {}

  async generate(tenantId: string, screenedCandidateId: string) {
    const detail = await this.pipeline.getById(tenantId, screenedCandidateId);
    const job = this.unwrapSingle(detail.jobs) as {
      title: string;
      description: string | null;
      custom_fields: Record<string, unknown>;
    } | null;
    const application = this.unwrapSingle(detail.applications) as {
      id: string;
      resume_extracted: ExtractedResume;
    } | null;

    if (!application?.resume_extracted || !hasResumeExtracted(application.resume_extracted)) {
      throw new BadRequestException(
        'Candidate must submit an application with resume data before generating a presentation.',
      );
    }

    const clientName = resolveClientCompanyName(job?.custom_fields) ?? undefined;

    const { fullContent, blindContent, redactionFlags } =
      await this.ai.generateCandidatePresentation({
        resume: application.resume_extracted,
        jobTitle: job?.title ?? 'Open role',
        jobDescription: job?.description ?? '',
        screeningNotes: detail.screening_notes ?? '',
        clientName,
      });

    const displayName = formatCandidateDisplayName(
      application.resume_extracted.name ?? detail.candidate_name,
    );

    const existing = this.unwrapSingle(detail.candidate_presentations) as
      | CandidatePresentationRow
      | null;

    const payload = {
      content_json: fullContent,
      full_content_json: fullContent,
      blind_content_json: blindContent,
      redaction_flags: redactionFlags,
      application_id: application.id,
      candidate_display_name: displayName,
      status: 'draft' as const,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { data, error } = await this.supabase.adminClient
        .from('candidate_presentations')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) rethrowPipelineDbError(error);
      await this.pipeline.markPresentationDraft(screenedCandidateId);
      return this.normalizePresentationRow(data as CandidatePresentationRow);
    }

    const shareToken = makeShareToken();
    const { data, error } = await this.supabase.adminClient
      .from('candidate_presentations')
      .insert({
        tenant_id: tenantId,
        screened_candidate_id: screenedCandidateId,
        share_token: shareToken,
        ...payload,
        protection_enabled: true,
        disclosure_stage: 'blind',
      })
      .select('*')
      .single();

    if (error) rethrowPipelineDbError(error);
    await this.pipeline.markPresentationDraft(screenedCandidateId);
    return this.normalizePresentationRow(data as CandidatePresentationRow);
  }

  async updateContent(
    tenantId: string,
    presentationId: string,
    content: PresentationContent,
    candidateDisplayName?: string,
    options?: { protectionEnabled?: boolean; blindContent?: PresentationContent; fullContent?: PresentationContent },
  ) {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (options?.fullContent) {
      updates.full_content_json = options.fullContent;
      updates.content_json = options.fullContent;
    } else if (options?.blindContent) {
      updates.blind_content_json = options.blindContent;
    } else {
      updates.content_json = content;
      updates.full_content_json = content;
      updates.blind_content_json = buildBlindPresentation(content);
    }

    updates.redaction_flags = scanRedactionFlags(
      (updates.blind_content_json as PresentationContent) ??
        buildBlindPresentation(content),
    );

    if (candidateDisplayName !== undefined) {
      updates.candidate_display_name = candidateDisplayName.trim() || null;
    }
    if (options?.protectionEnabled !== undefined) {
      updates.protection_enabled = options.protectionEnabled;
    }

    const { data, error } = await this.supabase.adminClient
      .from('candidate_presentations')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', presentationId)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('Presentation not found.');
    return this.normalizePresentationRow(data as CandidatePresentationRow);
  }

  async publish(tenantId: string, presentationId: string, adminId: string) {
    const { data: existing, error: findErr } = await this.supabase.adminClient
      .from('candidate_presentations')
      .select('*, screened_candidates ( id, jobs ( custom_fields ) )')
      .eq('tenant_id', tenantId)
      .eq('id', presentationId)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) throw new NotFoundException('Presentation not found.');

    const row = this.normalizePresentationRow(existing as CandidatePresentationRow);
    const content = row.full_content_json ?? row.content_json;
    if (!content?.headline) {
      throw new BadRequestException('Generate presentation content before publishing.');
    }

    const screened = this.unwrapSingle(
      (existing as { screened_candidates: unknown }).screened_candidates,
    ) as { id: string; jobs: { custom_fields: Record<string, unknown> } | { custom_fields: Record<string, unknown> }[] } | null;
    const job = screened?.jobs
      ? this.unwrapSingle(screened.jobs)
      : null;
    const clientCompanyName = resolveClientCompanyName(job?.custom_fields);

    const now = new Date().toISOString();
    const introductionCode = row.introduction_code ?? makeIntroductionCode(presentationId);

    const { data, error } = await this.supabase.adminClient
      .from('candidate_presentations')
      .update({
        status: 'published',
        published_at: now,
        published_by_admin_id: adminId,
        introduction_code: introductionCode,
        client_company_name: clientCompanyName,
        disclosure_stage: row.protection_enabled ? 'blind' : 'full_unlocked',
        updated_at: now,
      })
      .eq('id', presentationId)
      .select('*')
      .single();

    if (error) throw error;

    await this.pipeline.markPublished(row.screened_candidate_id);
    return this.normalizePresentationRow(data as CandidatePresentationRow);
  }

  async unlockFull(tenantId: string, presentationId: string, adminId: string) {
    const { data: existing, error: findErr } = await this.supabase.adminClient
      .from('candidate_presentations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', presentationId)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) throw new NotFoundException('Presentation not found.');

    const row = this.normalizePresentationRow(existing as CandidatePresentationRow);
    if (row.status !== 'published') {
      throw new BadRequestException('Only published presentations can be unlocked.');
    }
    if (!row.protection_enabled) {
      throw new BadRequestException('Protection is disabled for this presentation.');
    }
    if (row.disclosure_stage === 'full_unlocked') {
      return row;
    }
    if (!row.interview_requested_at) {
      throw new BadRequestException('Client must request an interview before full unlock.');
    }

    const now = new Date().toISOString();
    const { data, error } = await this.supabase.adminClient
      .from('candidate_presentations')
      .update({
        disclosure_stage: 'full_unlocked',
        full_unlocked_at: now,
        full_unlocked_by_admin_id: adminId,
        updated_at: now,
      })
      .eq('id', presentationId)
      .select('*')
      .single();

    if (error) throw error;
    await this.appendAuditEvent(presentationId, 'full_unlocked', adminId);
    return this.normalizePresentationRow(data as CandidatePresentationRow);
  }

  async getAuditEvents(tenantId: string, presentationId: string) {
    const { data: pres, error: presErr } = await this.supabase.adminClient
      .from('candidate_presentations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', presentationId)
      .maybeSingle();

    if (presErr) throw presErr;
    if (!pres) throw new NotFoundException('Presentation not found.');

    const { data, error } = await this.supabase.adminClient
      .from('introduction_audit_events')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as IntroductionAuditEventRow[];
  }

  async acceptTerms(shareToken: string) {
    const row = await this.fetchPublishedByShareToken(shareToken);
    if (!row.protection_enabled) {
      return this.buildPublicPayload(row);
    }
    if (row.terms_accepted_at) {
      return this.buildPublicPayload(row);
    }

    const now = new Date().toISOString();
    const { data, error } = await this.supabase.adminClient
      .from('candidate_presentations')
      .update({ terms_accepted_at: now, updated_at: now })
      .eq('id', row.id)
      .select('*')
      .single();

    if (error) throw error;
    await this.appendAuditEvent(row.id, 'terms_accepted', 'client');
    return this.buildPublicPayload(this.normalizePresentationRow(data as CandidatePresentationRow));
  }

  async requestInterview(shareToken: string) {
    const row = await this.fetchPublishedByShareToken(shareToken);
    if (!row.protection_enabled) {
      throw new BadRequestException('Interview request is not required when protection is disabled.');
    }
    if (!row.terms_accepted_at) {
      throw new BadRequestException('Terms must be accepted before requesting an interview.');
    }
    if (row.interview_requested_at) {
      return this.buildPublicPayload(row);
    }

    const now = new Date().toISOString();
    const { data, error } = await this.supabase.adminClient
      .from('candidate_presentations')
      .update({ interview_requested_at: now, updated_at: now })
      .eq('id', row.id)
      .select('*, screened_candidates ( id, candidate_name, jobs ( title, slug ) ), tenants ( settings_json )')
      .single();

    if (error) throw error;
    await this.appendAuditEvent(row.id, 'interview_requested', 'client');

    const updated = this.normalizePresentationRow(data as CandidatePresentationRow);
    const screened = this.unwrapSingle(
      (data as { screened_candidates: unknown }).screened_candidates,
    ) as {
      id: string;
      candidate_name: string;
      jobs: { title: string; slug: string } | { title: string; slug: string }[];
    } | null;
    const job = screened?.jobs ? this.unwrapSingle(screened.jobs) : null;

    const recruiterEmail = await this.pipeline.resolveRecruiterNotificationEmail(row.tenant_id);
    if (recruiterEmail) {
      void this.mail.sendInterviewRequestNotification({
        to: recruiterEmail,
        candidateName: screened?.candidate_name,
        jobTitle: job?.title ?? 'Open role',
        screenedCandidateId: screened?.id ?? row.screened_candidate_id,
        introductionCode: updated.introduction_code ?? undefined,
        clientCompanyName: updated.client_company_name ?? undefined,
      });
    }

    return this.buildPublicPayload(updated);
  }

  async recordEngagement(
    shareToken: string,
    event: PresentationEngagementEvent,
    preview: boolean,
  ): Promise<PresentationEngagementStats> {
    const { data: existing, error: findErr } = await this.supabase.adminClient
      .from('candidate_presentations')
      .select(
        'id, status, client_viewed_at, client_exported_at, client_view_count, client_export_count',
      )
      .eq('share_token', shareToken)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) throw new NotFoundException('Presentation not found.');
    if (existing.status !== 'published') {
      throw new BadRequestException('Engagement is only tracked for published presentations.');
    }

    const current = this.toEngagementStats(existing as CandidatePresentationRow);
    if (preview) return current;

    const now = new Date().toISOString();
    const row = existing as CandidatePresentationRow;
    const updates: Record<string, unknown> = {
      updated_at: now,
    };

    if (event === 'viewed') {
      updates.client_view_count = (row.client_view_count ?? 0) + 1;
      if (!row.client_viewed_at) updates.client_viewed_at = now;
    } else {
      updates.client_export_count = (row.client_export_count ?? 0) + 1;
      if (!row.client_exported_at) updates.client_exported_at = now;
    }

    const { data, error } = await this.supabase.adminClient
      .from('candidate_presentations')
      .update(updates)
      .eq('id', row.id)
      .select(
        'client_viewed_at, client_exported_at, client_view_count, client_export_count',
      )
      .single();

    if (error) throw error;
    await this.appendAuditEvent(row.id, event, 'client');
    return this.toEngagementStats(data as CandidatePresentationRow);
  }

  async resetEngagement(tenantId: string, presentationId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('candidate_presentations')
      .update({
        client_viewed_at: null,
        client_exported_at: null,
        client_view_count: 0,
        client_export_count: 0,
        terms_accepted_at: null,
        interview_requested_at: null,
        disclosure_stage: 'blind',
        full_unlocked_at: null,
        full_unlocked_by_admin_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('id', presentationId)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('Presentation not found.');
    return this.normalizePresentationRow(data as CandidatePresentationRow);
  }

  async getPublicByShareToken(shareToken: string, preview = false): Promise<PublicPresentationPayload> {
    const row = await this.fetchPublishedByShareToken(shareToken);
    return this.buildPublicPayload(row, preview);
  }

  private async fetchPublishedByShareToken(shareToken: string): Promise<CandidatePresentationRow & {
    tenantName: string;
    branding: Record<string, unknown>;
    jobTitle: string | null;
  }> {
    const { data, error } = await this.supabase.adminClient
      .from('candidate_presentations')
      .select(
        '*, tenants ( name, branding_json ), screened_candidates ( jobs ( title ) )',
      )
      .eq('share_token', shareToken)
      .eq('status', 'published')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Presentation not found.');

    const tenant = this.unwrapSingle(data.tenants) as {
      name: string;
      branding_json: Record<string, unknown>;
    } | null;

    const screened = this.unwrapSingle(data.screened_candidates) as {
      jobs: { title: string } | { title: string }[];
    } | null;
    const nestedJob = screened?.jobs;
    const jobTitle = Array.isArray(nestedJob) ? nestedJob[0]?.title : nestedJob?.title;

    const row = this.normalizePresentationRow(data as CandidatePresentationRow);
    return {
      ...row,
      tenantName: tenant?.name ?? 'Careers',
      branding: tenant?.branding_json ?? {},
      jobTitle: jobTitle ?? null,
    };
  }

  private buildPublicPayload(
    row: CandidatePresentationRow & {
      tenantName?: string;
      branding?: Record<string, unknown>;
      jobTitle?: string | null;
    },
    preview = false,
  ): PublicPresentationPayload {
    const termsAccepted = Boolean(row.terms_accepted_at);
    const termsRequired = row.protection_enabled && !termsAccepted && !preview;
    const content =
      termsRequired && !preview
        ? null
        : resolvePublicContent({
            ...row,
            terms_accepted_at: preview || termsAccepted ? row.terms_accepted_at ?? new Date().toISOString() : null,
          });
    const showDisplayName =
      !row.protection_enabled || row.disclosure_stage === 'full_unlocked';

    return {
      shareToken: row.share_token,
      content,
      candidateDisplayName: showDisplayName ? row.candidate_display_name : null,
      publishedAt: row.published_at,
      tenantName: row.tenantName ?? 'Careers',
      branding: row.branding ?? {},
      jobTitle: row.jobTitle ?? null,
      introductionCode: row.introduction_code,
      clientCompanyName: row.client_company_name,
      protectionEnabled: row.protection_enabled,
      disclosureStage: row.disclosure_stage,
      termsAccepted: preview || termsAccepted,
      termsRequired,
      interviewRequested: Boolean(row.interview_requested_at),
      interviewRequestPending:
        row.protection_enabled &&
        Boolean(row.interview_requested_at) &&
        row.disclosure_stage !== 'full_unlocked',
    };
  }

  private async appendAuditEvent(
    presentationId: string,
    eventType: IntroductionAuditEventType,
    actor: string,
    metadata: Record<string, unknown> = {},
  ) {
    try {
      const { error } = await this.supabase.adminClient.from('introduction_audit_events').insert({
        presentation_id: presentationId,
        event_type: eventType,
        actor,
        metadata_json: metadata,
      });
      if (error) {
        // Non-fatal — engagement still recorded on presentation row
      }
    } catch {
      // Non-fatal when audit table unavailable (e.g. tests without full mock)
    }
  }

  private normalizePresentationRow(row: CandidatePresentationRow): CandidatePresentationRow {
    return {
      ...row,
      redaction_flags: Array.isArray(row.redaction_flags)
        ? row.redaction_flags
        : typeof row.redaction_flags === 'string'
          ? JSON.parse(row.redaction_flags)
          : [],
      protection_enabled: row.protection_enabled ?? true,
      disclosure_stage: row.disclosure_stage ?? 'blind',
    };
  }

  private toEngagementStats(row: {
    client_viewed_at?: string | null;
    client_exported_at?: string | null;
    client_view_count?: number | null;
    client_export_count?: number | null;
  }): PresentationEngagementStats {
    return {
      clientViewedAt: row.client_viewed_at ?? null,
      clientExportedAt: row.client_exported_at ?? null,
      clientViewCount: row.client_view_count ?? 0,
      clientExportCount: row.client_export_count ?? 0,
    };
  }

  private unwrapSingle<T>(value: T | T[] | null | undefined): T | null {
    if (!value) return null;
    return Array.isArray(value) ? (value[0] ?? null) : value;
  }
}

function hasResumeExtracted(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(value as Record<string, unknown>).length > 0;
}

function resolveClientCompanyName(customFields?: Record<string, unknown>): string | null {
  if (!customFields) return null;
  if (typeof customFields.client === 'string' && customFields.client.trim()) {
    return customFields.client.trim();
  }
  if (typeof customFields.client_name === 'string' && customFields.client_name.trim()) {
    return customFields.client_name.trim();
  }
  return null;
}
