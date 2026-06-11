import { http } from './http';

import type { BlindProfileFields, DisclosureStage, PresentationContent } from './admin';

export type PublicPresentation = {
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

export type { BlindProfileFields };

export type PresentationEngagementStats = {
  clientViewedAt: string | null;
  clientExportedAt: string | null;
  clientViewCount: number;
  clientExportCount: number;
};

export async function getPublicPresentation(
  shareToken: string,
  options?: { preview?: boolean },
): Promise<PublicPresentation> {
  const preview = options?.preview ? '?preview=1' : '';
  const { data } = await http.get<PublicPresentation>(
    `/presentations/public/${encodeURIComponent(shareToken)}${preview}`,
  );
  return data;
}

export async function acceptPresentationTerms(shareToken: string): Promise<PublicPresentation> {
  const { data } = await http.post<PublicPresentation>(
    `/presentations/public/${encodeURIComponent(shareToken)}/accept-terms`,
  );
  return data;
}

export async function requestPresentationInterview(
  shareToken: string,
): Promise<PublicPresentation> {
  const { data } = await http.post<PublicPresentation>(
    `/presentations/public/${encodeURIComponent(shareToken)}/request-interview`,
  );
  return data;
}

export async function recordPresentationEngagement(
  shareToken: string,
  event: 'viewed' | 'export_pdf',
  options: { preview: boolean },
): Promise<PresentationEngagementStats> {
  const { data } = await http.post<PresentationEngagementStats>(
    `/presentations/public/${encodeURIComponent(shareToken)}/engagement`,
    { event, preview: options.preview },
  );
  return data;
}
