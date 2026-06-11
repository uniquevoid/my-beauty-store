import type { ExtractedResume } from './extracted-resume.types';
import {
  anonymizeCompanyName,
  anonymizeSchoolName,
  buildBlindPresentation,
  deriveBlindProfile,
} from '../pipeline/presentation-redaction';
import type { PresentationContent } from '../pipeline/presentation.types';

export type { PresentationContent };

export function buildPresentationFallback(input: {
  resume: ExtractedResume;
  jobTitle: string;
  screeningNotes: string;
}): PresentationContent {
  const skills = (input.resume.skills ?? []).slice(0, 8);
  const latestRole = input.resume.work_experience?.[0];
  const roleLine = latestRole?.title
    ? `${latestRole.title} at ${anonymizeCompanyName(latestRole.company)}`
    : 'relevant professional experience';

  const screeningLines = input.screeningNotes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  const full: PresentationContent = {
    headline: `${input.jobTitle} — Recommended Candidate`,
    executiveSummary: `This candidate brings ${roleLine} and aligns well with the ${input.jobTitle} role based on skills, experience, and initial screening.`,
    keyStrengths: skills.length
      ? skills.slice(0, 5).map((skill) => `Strong ${skill} capability relevant to the role`)
      : ['Solid track record and role-relevant experience'],
    roleFit: [
      `Experience profile maps to core requirements for ${input.jobTitle}`,
      'Screening conversation confirmed motivation and baseline fit',
    ],
    screeningHighlights: screeningLines.length
      ? screeningLines
      : ['Positive initial screening with clear interest in the opportunity'],
    experienceSnapshot: input.resume.work_experience?.length
      ? input.resume.work_experience
          .slice(0, 3)
          .map((w) =>
            [w.title, anonymizeCompanyName(w.company)].filter(Boolean).join(' at ') +
              (w.highlights?.[0] ? ` — ${w.highlights[0]}` : ''),
          )
          .join('. ')
      : 'The candidate has professional experience suited to this opening.',
    skills,
    recruiterRecommendation: `Based on resume review and screening notes, we recommend moving forward with this candidate for the ${input.jobTitle} role.`,
    blindProfile: deriveBlindProfile(input.resume, input.screeningNotes),
  };

  return full;
}

export function buildFullPresentationFallback(input: {
  resume: ExtractedResume;
  jobTitle: string;
  screeningNotes: string;
}): PresentationContent {
  const name = input.resume.name?.trim() || 'This candidate';
  const skills = (input.resume.skills ?? []).slice(0, 8);
  const latestRole = input.resume.work_experience?.[0];
  const roleLine = latestRole?.title
    ? `${latestRole.title}${latestRole.company ? ` at ${latestRole.company}` : ''}`
    : 'relevant professional experience';

  const screeningLines = input.screeningNotes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  const educationLine = input.resume.education?.[0]
    ? [input.resume.education[0].degree, input.resume.education[0].school].filter(Boolean).join(', ')
    : null;

  return {
    headline: `${input.jobTitle} — ${name}`,
    executiveSummary: `${name} brings ${roleLine}${educationLine ? ` with ${educationLine}` : ''} and aligns well with the ${input.jobTitle} role.`,
    keyStrengths: skills.length
      ? skills.slice(0, 5).map((skill) => `Strong ${skill} capability relevant to the role`)
      : ['Solid track record and role-relevant experience'],
    roleFit: [
      `Experience profile maps to core requirements for ${input.jobTitle}`,
      'Screening conversation confirmed motivation and baseline fit',
    ],
    screeningHighlights: screeningLines.length
      ? screeningLines
      : ['Positive initial screening with clear interest in the opportunity'],
    experienceSnapshot: input.resume.work_experience?.length
      ? input.resume.work_experience
          .slice(0, 3)
          .map((w) =>
            [w.title, w.company].filter(Boolean).join(' at ') +
              (w.highlights?.[0] ? ` — ${w.highlights[0]}` : ''),
          )
          .join('. ')
      : `${name} has professional experience suited to this opening.`,
    skills,
    recruiterRecommendation: `Based on resume review and screening notes, we recommend moving forward with ${name.split(' ')[0] || 'this candidate'} for the ${input.jobTitle} role.`,
    blindProfile: deriveBlindProfile(input.resume, input.screeningNotes),
  };
}

export function buildBlindPresentationFallback(input: {
  resume: ExtractedResume;
  jobTitle: string;
  screeningNotes: string;
}): PresentationContent {
  const blind = buildPresentationFallback(input);
  if (input.resume.education?.length) {
    const edu = input.resume.education[0];
    const eduLine = [edu.degree, anonymizeSchoolName(edu.school)].filter(Boolean).join(', ');
    if (eduLine) {
      blind.experienceSnapshot = `${blind.experienceSnapshot} Education: ${eduLine}.`;
    }
  }
  return buildBlindPresentation(blind);
}
