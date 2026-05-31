import type { JobRow } from './jobs.service';

export type RelatedJobSummary = Pick<
  JobRow,
  | 'id'
  | 'slug'
  | 'title'
  | 'location'
  | 'department'
  | 'area_of_interest'
  | 'workplace_type'
  | 'employment_type'
>;

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

export function scoreRelatedJob(source: JobRow, candidate: JobRow): number {
  let score = 0;

  const sourceDepartment = normalize(source.department);
  const candidateDepartment = normalize(candidate.department);
  if (sourceDepartment && candidateDepartment && sourceDepartment === candidateDepartment) {
    score += 2;
  }

  const sourceArea = normalize(source.area_of_interest);
  const candidateArea = normalize(candidate.area_of_interest);
  if (sourceArea && candidateArea && sourceArea === candidateArea) {
    score += 1;
  }

  return score;
}

export function pickRelatedJobs(
  source: JobRow,
  candidates: JobRow[],
  limit = 3,
): RelatedJobSummary[] {
  return candidates
    .filter((candidate) => candidate.id !== source.id)
    .map((candidate) => ({
      candidate,
      score: scoreRelatedJob(source, candidate),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.candidate.created_at.localeCompare(a.candidate.created_at);
    })
    .slice(0, limit)
    .map(({ candidate }) => ({
      id: candidate.id,
      slug: candidate.slug,
      title: candidate.title,
      location: candidate.location,
      department: candidate.department,
      area_of_interest: candidate.area_of_interest,
      workplace_type: candidate.workplace_type,
      employment_type: candidate.employment_type,
    }));
}
