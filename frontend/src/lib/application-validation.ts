import type { ExtractedResume } from '../types/resume';
import { isValidHttpUrl } from './url-utils';

export type ApplicationValidationResult = {
  valid: boolean;
  errors: string[];
  fieldErrors: Partial<Record<'name' | 'email' | 'phone' | 'location' | 'education' | 'work_experience' | 'links' | 'resume', string>>;
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function validateApplication(
  extracted: ExtractedResume,
  options: { hasResume: boolean },
): ApplicationValidationResult {
  const errors: string[] = [];
  const fieldErrors: ApplicationValidationResult['fieldErrors'] = {};

  if (!options.hasResume) {
    errors.push('Resume upload is required.');
    fieldErrors.resume = 'Resume upload is required.';
  }
  if (!hasText(extracted.name)) {
    errors.push('Full name is required.');
    fieldErrors.name = 'Full name is required.';
  }
  if (!hasText(extracted.email)) {
    errors.push('Email is required.');
    fieldErrors.email = 'Email is required.';
  }
  if (!hasText(extracted.phone)) {
    errors.push('Phone is required.');
    fieldErrors.phone = 'Phone is required.';
  }
  if (!hasText(extracted.location)) {
    errors.push('Location is required.');
    fieldErrors.location = 'Location is required.';
  }

  const education = extracted.education ?? [];
  const hasEducation = education.some(
    (entry) => hasText(entry.school) || hasText(entry.degree),
  );
  if (!hasEducation) {
    errors.push('At least one education entry is required.');
    fieldErrors.education = 'Add at least one education entry with a school or degree.';
  }

  const work = extracted.work_experience ?? [];
  const hasWork = work.some((entry) => hasText(entry.company) || hasText(entry.title));
  if (!hasWork) {
    errors.push('At least one work experience entry is required.');
    fieldErrors.work_experience = 'Add at least one work experience entry with a company or title.';
  }

  const link = (extracted.links ?? [])[0]?.trim() ?? '';
  if (link && !isValidHttpUrl(link)) {
    errors.push('Portfolio or website must be a valid URL.');
    fieldErrors.links = 'Enter a valid URL (https://…).';
  }

  return { valid: errors.length === 0, errors, fieldErrors };
}

export function validateCandidateProfile(
  extracted: ExtractedResume,
  options?: { accountEmail?: string },
): ApplicationValidationResult {
  const profile = options?.accountEmail
    ? { ...extracted, email: options.accountEmail.trim().toLowerCase() }
    : extracted;
  return validateApplication(profile, { hasResume: true });
}
