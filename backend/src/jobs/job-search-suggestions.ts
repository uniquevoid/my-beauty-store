export type JobSearchSuggestionCandidate = {
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
};

export type JobSearchSuggestion = {
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
};

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function scoreSuggestion(query: string, candidate: JobSearchSuggestionCandidate): number | null {
  const title = candidate.title.trim().toLowerCase();
  const department = candidate.department?.trim().toLowerCase() ?? '';
  if (!title) return null;

  if (title.startsWith(query)) return 100;
  if (title.includes(query)) return 80;
  if (department && department.includes(query)) return 60;
  return null;
}

export function rankJobSearchSuggestions(
  query: string,
  candidates: JobSearchSuggestionCandidate[],
  limit = 8,
): JobSearchSuggestion[] {
  const normalized = normalizeQuery(query);
  if (normalized.length < 2) return [];

  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreSuggestion(normalized, candidate),
    }))
    .filter((entry): entry is { candidate: JobSearchSuggestionCandidate; score: number } =>
      entry.score !== null,
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidate.title.localeCompare(b.candidate.title);
    });

  const seen = new Set<string>();
  const results: JobSearchSuggestion[] = [];

  for (const { candidate } of ranked) {
    const key = candidate.slug || candidate.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      slug: candidate.slug,
      title: candidate.title,
      department: candidate.department,
      location: candidate.location,
    });
    if (results.length >= limit) break;
  }

  return results;
}
