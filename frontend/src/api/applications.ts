import { http } from './http';
import type { ExtractedResume } from '../types/resume';

export type StartApplicationResponse = {
  id: string;
  application_code: string;
  job_id: string;
  resume_extracted: ExtractedResume;
  status: string;
};

export async function startGuestApplication(
  jobSlug: string,
  sessionCode?: string,
  inviteToken?: string,
): Promise<StartApplicationResponse> {
  const res = await http.post<StartApplicationResponse>('/applications/guest/start', {
    jobSlug,
    ...(sessionCode ? { sessionCode } : {}),
    ...(inviteToken ? { inviteToken } : {}),
  });
  return res.data;
}

export async function extractResumeForApplication(
  applicationCode: string,
  file: File,
): Promise<{ extracted: ExtractedResume }> {
  const form = new FormData();
  form.append('file', file);
  const res = await http.post<{ extracted: ExtractedResume }>(
    `/applications/guest/resume-extract/${encodeURIComponent(applicationCode)}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data;
}

export async function submitGuestApplication(
  applicationCode: string,
  extracted: ExtractedResume,
): Promise<void> {
  await http.post('/applications/guest/submit', {
    applicationCode,
    extracted: {
      ...extracted,
      skills: extracted.skills ?? [],
      links: extracted.links ?? [],
      education: extracted.education ?? [],
      work_experience: extracted.work_experience ?? [],
    },
  });
}

export type ApplicationSummary = {
  applicant_email: string | null;
  job_title: string | null;
  status: string;
};

export async function getApplicationSummary(applicationCode: string): Promise<ApplicationSummary> {
  const res = await http.get<ApplicationSummary>(
    `/applications/guest/summary/${encodeURIComponent(applicationCode)}`,
  );
  return res.data;
}
