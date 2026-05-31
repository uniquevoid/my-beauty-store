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
