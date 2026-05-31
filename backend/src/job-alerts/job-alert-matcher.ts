export type JobForAlertMatch = {
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
};

export type AlertCriteria = {
  keyword?: string | null;
  location?: string | null;
  department?: string | null;
};

function includesInsensitive(haystack: string | null | undefined, needle: string) {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function keywordMatches(job: JobForAlertMatch, keyword: string) {
  const trimmed = keyword.trim();
  if (!trimmed) return true;

  return (
    includesInsensitive(job.title, trimmed) ||
    includesInsensitive(job.description, trimmed) ||
    includesInsensitive(job.department, trimmed)
  );
}

export function jobMatchesAlert(job: JobForAlertMatch, alert: AlertCriteria): boolean {
  if (alert.keyword && !keywordMatches(job, alert.keyword)) return false;
  if (alert.location && !includesInsensitive(job.location, alert.location)) return false;
  if (alert.department && !includesInsensitive(job.department, alert.department)) return false;
  return true;
}
