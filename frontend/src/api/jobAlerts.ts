import { http } from './http';

export type JobAlert = {
  id: string;
  keyword: string | null;
  location: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
};

export async function listJobAlerts() {
  const res = await http.get<{ alerts: JobAlert[] }>('/job-alerts');
  return res.data.alerts;
}

export async function createJobAlert(payload: {
  keyword?: string;
  location?: string;
  department?: string;
}) {
  const res = await http.post<{ alert: JobAlert }>('/job-alerts', payload);
  return res.data.alert;
}

export async function deleteJobAlert(id: string) {
  await http.delete(`/job-alerts/${id}`);
}
