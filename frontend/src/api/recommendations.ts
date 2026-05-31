import { http } from './http';
import type { ExtractedResume } from '../types/resume';
import type { Job } from './jobs';

export type RecommendedJob = Job & {
  match_score: number;
  match_reasons: string[];
};

export async function startRecommendationSession(): Promise<{ session_code: string }> {
  const res = await http.post<{ session_code: string }>('/recommendations/start');
  return res.data;
}

export async function uploadResumeForSession(
  sessionCode: string,
  file: File,
): Promise<{ extracted: ExtractedResume }> {
  const form = new FormData();
  form.append('file', file);
  const res = await http.post<{ extracted: ExtractedResume }>(
    `/recommendations/${encodeURIComponent(sessionCode)}/resume`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data;
}

export async function getRecommendedJobs(sessionCode: string): Promise<RecommendedJob[]> {
  const res = await http.get<{ jobs: RecommendedJob[] }>(
    `/recommendations/${encodeURIComponent(sessionCode)}/jobs`,
  );
  return res.data.jobs ?? [];
}
