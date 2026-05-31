import { http } from './http';

export type Job = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  area_of_interest: string | null;
  workplace_type: string | null;
  description: string | null;
  status: 'draft' | 'published' | 'closed';
  external_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type JobSummary = Pick<
  Job,
  | 'id'
  | 'slug'
  | 'title'
  | 'location'
  | 'department'
  | 'area_of_interest'
  | 'workplace_type'
  | 'employment_type'
>;

export type JobDetail = Job & {
  related_jobs: JobSummary[];
};

export type ListJobsParams = {
  q?: string;
  location?: string;
  areaOfInterest?: string;
};

export async function listJobs(params?: ListJobsParams) {
  const res = await http.get<Job[]>('/jobs', { params });
  return res.data;
}

export async function listJobLocations() {
  const res = await http.get<string[]>('/jobs/locations');
  return res.data;
}

export async function listJobAreasOfInterest() {
  const res = await http.get<string[]>('/jobs/areas-of-interest');
  return res.data;
}

export async function getJob(slug: string) {
  const res = await http.get<JobDetail>(`/jobs/${encodeURIComponent(slug)}`);
  return res.data;
}
