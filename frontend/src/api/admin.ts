import { adminHttp } from './http';

export type AdminUser = {
  id: string;
  username: string;
  must_change_password: boolean;
};

export type JobStats = {
  draft: number;
  published: number;
  closed: number;
  total: number;
};

export type AdminJob = {
  id: string;
  slug: string;
  external_id: string | null;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  status: 'draft' | 'published' | 'closed';
  updated_at: string;
};

export async function adminLogin(username: string, password: string) {
  const { data } = await adminHttp.post<{
    token: string;
    tenant_slug?: string;
    admin: AdminUser;
  }>('/admin/auth/login', { username, password });
  return data;
}

export async function adminMe() {
  const { data } = await adminHttp.get<{ admin: AdminUser }>('/admin/auth/me');
  return data.admin;
}

export async function adminChangePassword(currentPassword: string, newPassword: string) {
  await adminHttp.post('/admin/auth/change-password', { currentPassword, newPassword });
}

export async function adminJobStats() {
  const { data } = await adminHttp.get<JobStats>('/admin/jobs/stats');
  return data;
}

export async function adminListJobs(params?: { status?: string; q?: string }) {
  const { data } = await adminHttp.get<AdminJob[]>('/admin/jobs', { params });
  return data;
}

export async function adminDeleteJob(id: string) {
  await adminHttp.delete(`/admin/jobs/${id}`);
}

export async function adminUploadCsv(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await adminHttp.post('/admin/imports/upload', form);
  return data;
}

export async function adminSaveImportMapping(
  batchId: string,
  body: {
    column_map: Record<string, string>;
    value_map?: Record<string, Record<string, string>>;
    sync_mode?: 'delta' | 'full';
    save_profile?: boolean;
  },
) {
  const { data } = await adminHttp.post(`/admin/imports/${batchId}/mapping`, body);
  return data;
}

export async function adminPreviewImport(batchId: string) {
  const { data } = await adminHttp.post(`/admin/imports/${batchId}/preview`);
  return data;
}

export async function adminApplyImport(batchId: string) {
  const { data } = await adminHttp.post(`/admin/imports/${batchId}/apply`);
  return data;
}

export async function adminLastImport() {
  const { data } = await adminHttp.get<{ batch: unknown }>('/admin/imports/last');
  return data.batch;
}

export type ScreenedCandidateStatus = 'invited' | 'applied' | 'presentation_draft' | 'published';

export type BlindProfileFields = {
  yearsExperience?: string;
  industryExpertise?: string[];
  salaryExpectation?: string;
  locationRegion?: string;
  availability?: string;
};

export type PresentationContent = {
  headline: string;
  executiveSummary: string;
  keyStrengths: string[];
  roleFit: string[];
  screeningHighlights: string[];
  experienceSnapshot: string;
  skills: string[];
  recruiterRecommendation: string;
  blindProfile?: BlindProfileFields;
};

export type DisclosureStage = 'blind' | 'full_unlocked';

export type IntroductionAuditEvent = {
  id: string;
  presentation_id: string;
  event_type: string;
  actor: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type CandidatePresentation = {
  id: string;
  share_token: string;
  content_json: PresentationContent;
  blind_content_json?: PresentationContent | null;
  full_content_json?: PresentationContent | null;
  candidate_display_name: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  client_viewed_at?: string | null;
  client_exported_at?: string | null;
  client_view_count?: number;
  client_export_count?: number;
  introduction_code?: string | null;
  client_company_name?: string | null;
  disclosure_stage?: DisclosureStage;
  protection_enabled?: boolean;
  redaction_flags?: string[];
  terms_accepted_at?: string | null;
  interview_requested_at?: string | null;
  full_unlocked_at?: string | null;
};

export type CandidatePresentationSummary = Pick<
  CandidatePresentation,
  | 'id'
  | 'status'
  | 'client_viewed_at'
  | 'client_exported_at'
  | 'client_view_count'
  | 'client_export_count'
  | 'introduction_code'
  | 'disclosure_stage'
  | 'protection_enabled'
  | 'terms_accepted_at'
  | 'interview_requested_at'
  | 'full_unlocked_at'
>;

export type ScreenedCandidateListItem = {
  id: string;
  candidate_name: string;
  candidate_email: string;
  screening_notes: string;
  screening_completed_at: string | null;
  invite_token: string;
  status: ScreenedCandidateStatus;
  created_at: string;
  updated_at: string;
  jobs: { id: string; slug: string; title: string } | { id: string; slug: string; title: string }[];
  applications:
    | {
        id: string;
        application_code: string;
        status: string;
        created_at: string;
        resume_extracted?: Record<string, unknown> | null;
      }
    | {
        id: string;
        application_code: string;
        status: string;
        created_at: string;
        resume_extracted?: Record<string, unknown> | null;
      }[]
    | null;
  candidate_presentations?: CandidatePresentationSummary | CandidatePresentationSummary[] | null;
};

export type ScreenedCandidateDetail = Omit<
  ScreenedCandidateListItem,
  'jobs' | 'candidate_presentations'
> & {
  jobs:
    | {
        id: string;
        slug: string;
        title: string;
        description: string | null;
        custom_fields: Record<string, unknown>;
      }
    | {
        id: string;
        slug: string;
        title: string;
        description: string | null;
        custom_fields: Record<string, unknown>;
      }[];
  candidate_presentations: CandidatePresentation | CandidatePresentation[] | null;
};

export async function adminListScreenedCandidates(params?: {
  status?: ScreenedCandidateStatus;
  jobId?: string;
}) {
  const { data } = await adminHttp.get<ScreenedCandidateListItem[]>('/admin/screened-candidates', {
    params,
  });
  return data;
}

export async function adminCreateScreenedCandidate(body: {
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  screeningNotes: string;
  screeningCompletedAt?: string | null;
}) {
  const { data } = await adminHttp.post<
    ScreenedCandidateListItem & { job: { slug: string; title: string } }
  >('/admin/screened-candidates', body);
  return data;
}

export async function adminGetScreenedCandidate(id: string) {
  const { data } = await adminHttp.get<ScreenedCandidateDetail>(`/admin/screened-candidates/${id}`);
  return data;
}

export async function adminUpdateScreenedCandidate(
  id: string,
  body: {
    candidateName?: string;
    candidateEmail?: string;
    screeningNotes?: string;
    screeningCompletedAt?: string | null;
  },
) {
  const { data } = await adminHttp.patch<ScreenedCandidateListItem>(
    `/admin/screened-candidates/${id}`,
    body,
  );
  return data;
}

export async function adminGeneratePresentation(screenedCandidateId: string) {
  const { data } = await adminHttp.post<CandidatePresentation>(
    `/admin/presentations/${screenedCandidateId}/generate`,
  );
  return data;
}

export async function adminUpdatePresentation(
  id: string,
  body: { content: PresentationContent; candidateDisplayName?: string; protectionEnabled?: boolean },
) {
  const { data } = await adminHttp.patch<CandidatePresentation>(`/admin/presentations/${id}`, body);
  return data;
}

export async function adminPublishPresentation(id: string) {
  const { data } = await adminHttp.post<CandidatePresentation>(`/admin/presentations/${id}/publish`);
  return data;
}

export async function adminUnlockFullPresentation(id: string) {
  const { data } = await adminHttp.post<CandidatePresentation>(
    `/admin/presentations/${id}/unlock-full`,
  );
  return data;
}

export async function adminGetPresentationAuditEvents(id: string) {
  const { data } = await adminHttp.get<IntroductionAuditEvent[]>(
    `/admin/presentations/${id}/audit-events`,
  );
  return data;
}

export async function adminResetPresentationEngagement(id: string) {
  const { data } = await adminHttp.post<CandidatePresentation>(
    `/admin/presentations/${id}/reset-engagement`,
  );
  return data;
}
