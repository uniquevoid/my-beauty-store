/** Statuses where the invite link can still attach an application. */
export const INVITE_OPEN_STATUSES = ['invited', 'applied', 'presentation_draft'] as const;

export type LinkedApplicationSummary = {
  id: string;
  application_code: string;
  status: string;
  resume_extracted?: unknown;
  created_at: string;
};

/** Prefer submitted application; otherwise most recently created. */
export function pickLinkedApplication(
  apps: LinkedApplicationSummary[] | LinkedApplicationSummary | null | undefined,
): LinkedApplicationSummary | null {
  const list = Array.isArray(apps) ? apps : apps ? [apps] : [];
  if (!list.length) return null;

  const submitted = list.find((a) => a.status === 'submitted');
  if (submitted) return submitted;

  return [...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0] ?? null;
}

export function groupApplicationsByScreenedCandidate<T extends { screened_candidate_id: string | null }>(
  rows: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    if (!row.screened_candidate_id) continue;
    const list = map.get(row.screened_candidate_id) ?? [];
    list.push(row);
    map.set(row.screened_candidate_id, list);
  }
  return map;
}
