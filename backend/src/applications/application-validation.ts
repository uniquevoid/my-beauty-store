import type { ExtractedResume } from '../ai/extracted-resume.types';

export type ApplicationValidationResult = {
  valid: boolean;
  errors: string[];
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateGuestApplication(
  extracted: ExtractedResume,
  options: { hasResume: boolean },
): ApplicationValidationResult {
  const errors: string[] = [];

  if (!options.hasResume) {
    errors.push('Resume upload is required.');
  }
  if (!hasText(extracted.name)) {
    errors.push('Full name is required.');
  }
  if (!hasText(extracted.email)) {
    errors.push('Email is required.');
  }
  if (!hasText(extracted.phone)) {
    errors.push('Phone is required.');
  }
  if (!hasText(extracted.location)) {
    errors.push('Location is required.');
  }

  const education = extracted.education ?? [];
  const hasEducation = education.some(
    (entry) => hasText(entry.school) || hasText(entry.degree),
  );
  if (!hasEducation) {
    errors.push('At least one education entry is required.');
  }

  const work = extracted.work_experience ?? [];
  const hasWork = work.some((entry) => hasText(entry.company) || hasText(entry.title));
  if (!hasWork) {
    errors.push('At least one work experience entry is required.');
  }

  const links = extracted.links ?? [];
  if (links.length > 1) {
    errors.push('Only one portfolio or website URL is allowed.');
  }
  if (links.length === 1 && links[0]?.trim() && !isValidUrl(links[0].trim())) {
    errors.push('Portfolio or website must be a valid URL.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateCandidateProfile(extracted: ExtractedResume): ApplicationValidationResult {
  return validateGuestApplication(extracted, { hasResume: true });
}
