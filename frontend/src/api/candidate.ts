import { http } from './http';
import type { ExtractedResume } from '../types/resume';

type CandidateRow = {
  id: string;
  email: string;
  profile_json: ExtractedResume;
  created_at: string;
  updated_at: string;
};

export async function updateCandidateProfile(profile_json: ExtractedResume) {
  const res = await http.patch<{ candidate: CandidateRow }>('/candidate/profile', {
    profile_json,
  });
  return res.data.candidate;
}
