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

export type IntroductionAuditEventType =
  | 'viewed'
  | 'export_pdf'
  | 'terms_accepted'
  | 'interview_requested'
  | 'full_unlocked';

export type ScreenedCandidateStatus = 'invited' | 'applied' | 'presentation_draft' | 'published';

export type PresentationStatus = 'draft' | 'published' | 'archived';

export type ScreenedCandidateRow = {
  id: string;
  tenant_id: string;
  job_id: string;
  created_by_admin_id: string | null;
  candidate_name: string;
  candidate_email: string;
  screening_notes: string;
  screening_completed_at: string | null;
  invite_token: string;
  status: ScreenedCandidateStatus;
  created_at: string;
  updated_at: string;
};

export type PresentationEngagementEvent = 'viewed' | 'export_pdf';

export type PresentationEngagementStats = {
  clientViewedAt: string | null;
  clientExportedAt: string | null;
  clientViewCount: number;
  clientExportCount: number;
};

export type IntroductionAuditEventRow = {
  id: string;
  presentation_id: string;
  event_type: IntroductionAuditEventType;
  actor: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type CandidatePresentationRow = {
  id: string;
  tenant_id: string;
  screened_candidate_id: string;
  application_id: string | null;
  share_token: string;
  content_json: PresentationContent;
  blind_content_json: PresentationContent | null;
  full_content_json: PresentationContent | null;
  candidate_display_name: string | null;
  status: PresentationStatus;
  published_at: string | null;
  published_by_admin_id: string | null;
  client_viewed_at: string | null;
  client_exported_at: string | null;
  client_view_count: number;
  client_export_count: number;
  introduction_code: string | null;
  client_company_name: string | null;
  disclosure_stage: DisclosureStage;
  protection_enabled: boolean;
  redaction_flags: string[];
  terms_accepted_at: string | null;
  interview_requested_at: string | null;
  full_unlocked_at: string | null;
  full_unlocked_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicPresentationPayload = {
  shareToken: string;
  content: PresentationContent | null;
  candidateDisplayName: string | null;
  publishedAt: string | null;
  tenantName: string;
  branding: Record<string, unknown>;
  jobTitle: string | null;
  introductionCode: string | null;
  clientCompanyName: string | null;
  protectionEnabled: boolean;
  disclosureStage: DisclosureStage;
  termsAccepted: boolean;
  termsRequired: boolean;
  interviewRequested: boolean;
  interviewRequestPending: boolean;
};
