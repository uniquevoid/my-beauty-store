import type { ExtractedResume } from '../ai/extracted-resume.types';
import type { BlindProfileFields, PresentationContent } from './presentation.types';

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const LINKEDIN_PATTERN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s]+/gi;
const GITHUB_PATTERN = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s]+/gi;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

export function makeIntroductionCode(presentationId: string): string {
  const hex = presentationId.replace(/-/g, '').slice(0, 5).toUpperCase();
  return `INT-${hex}`;
}

export function formatScreenedCandidateCode(screenedCandidateId: string): string {
  const hex = screenedCandidateId.replace(/-/g, '').slice(0, 3).toUpperCase();
  return `SC-${hex}`;
}

export function deriveBlindProfile(
  resume: ExtractedResume,
  screeningNotes: string,
): BlindProfileFields {
  const work = resume.work_experience ?? [];
  const yearsExperience = estimateYearsExperience(work);
  const industryExpertise = deriveIndustries(work, resume.skills ?? []);
  const locationRegion = resume.location?.trim() || extractFromNotes(screeningNotes, /location[:\s]+([^\n]+)/i);
  const salaryExpectation =
    extractFromNotes(screeningNotes, /salary[:\s]+([^\n]+)/i) ||
    extractFromNotes(screeningNotes, /comp(?:ensation)?[:\s]+([^\n]+)/i);
  const availability =
    extractFromNotes(screeningNotes, /availab(?:le|ility)[:\s]+([^\n]+)/i) ||
    extractFromNotes(screeningNotes, /notice[:\s]+([^\n]+)/i);

  return {
    yearsExperience,
    industryExpertise: industryExpertise.length ? industryExpertise : undefined,
    salaryExpectation: salaryExpectation || undefined,
    locationRegion: locationRegion || undefined,
    availability: availability || undefined,
  };
}

function estimateYearsExperience(
  work: NonNullable<ExtractedResume['work_experience']>,
): string | undefined {
  if (!work.length) return undefined;
  const startYears = work
    .map((w) => parseYear(w.start_date))
    .filter((y): y is number => y !== null);
  if (!startYears.length) return `${work.length}+ years`;
  const earliest = Math.min(...startYears);
  const years = Math.max(1, new Date().getFullYear() - earliest);
  return `${years}+ years`;
}

function parseYear(value?: string): number | null {
  if (!value) return null;
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function deriveIndustries(
  work: NonNullable<ExtractedResume['work_experience']>,
  skills: string[],
): string[] {
  const industries = new Set<string>();
  for (const role of work.slice(0, 4)) {
    const title = role.title?.toLowerCase() ?? '';
    if (/software|engineer|developer|tech|data|cloud|devops/.test(title)) {
      industries.add('Technology');
    } else if (/finance|bank|investment|account/.test(title)) {
      industries.add('Financial Services');
    } else if (/health|pharma|medical|clinical/.test(title)) {
      industries.add('Healthcare');
    } else if (/retail|commerce|e-?commerce|consumer/.test(title)) {
      industries.add('Retail & Consumer');
    } else if (/consult/.test(title)) {
      industries.add('Professional Services');
    }
  }
  for (const skill of skills.slice(0, 6)) {
    if (/aws|azure|gcp|kubernetes|react|python|java|typescript/.test(skill.toLowerCase())) {
      industries.add('Technology');
    }
  }
  return [...industries].slice(0, 4);
}

function extractFromNotes(notes: string, pattern: RegExp): string | undefined {
  const match = notes.match(pattern);
  return match?.[1]?.trim() || undefined;
}

export function anonymizeCompanyName(company?: string): string {
  if (!company?.trim()) return 'a leading organization';
  const lower = company.toLowerCase();
  const fortune100 = ['amazon', 'google', 'microsoft', 'apple', 'meta', 'ibm', 'oracle', 'salesforce'];
  if (fortune100.some((name) => lower.includes(name))) {
    return 'a Fortune 100 technology company';
  }
  if (/bank|capital|financial|investment/.test(lower)) {
    return 'a major financial services firm';
  }
  if (/health|pharma|medical/.test(lower)) {
    return 'a leading healthcare organization';
  }
  if (/consult/.test(lower)) {
    return 'a top-tier consulting firm';
  }
  if (/startup|stealth/.test(lower)) {
    return 'a high-growth startup';
  }
  return 'a well-regarded company in the industry';
}

export function anonymizeSchoolName(school?: string): string {
  if (!school?.trim()) return 'a respected university';
  const lower = school.toLowerCase();
  if (/imperial|oxford|cambridge|ucl|lse|mit|stanford|harvard|yale|princeton|berkeley/.test(lower)) {
    return 'a top-ranked university';
  }
  if (/university|college|institute|school/.test(lower)) {
    const degreeMatch = school.match(/^(BSc|MSc|BA|MA|PhD|MBA)[^,]*/i);
    if (degreeMatch) return `${degreeMatch[0]} from a respected university`;
    return 'a respected university';
  }
  return 'a respected educational institution';
}

export function buildBlindPresentation(full: PresentationContent): PresentationContent {
  const anonymizeText = (text: string) =>
    text
      .replace(EMAIL_PATTERN, '[email redacted]')
      .replace(PHONE_PATTERN, '[phone redacted]')
      .replace(LINKEDIN_PATTERN, '[LinkedIn redacted]')
      .replace(GITHUB_PATTERN, '[GitHub redacted]');

  return {
    ...full,
    headline: anonymizeText(stripPersonalNames(full.headline)),
    executiveSummary: anonymizeText(stripPersonalNames(full.executiveSummary)),
    keyStrengths: full.keyStrengths.map((s) => anonymizeText(stripPersonalNames(s))),
    roleFit: full.roleFit.map((s) => anonymizeText(stripPersonalNames(s))),
    screeningHighlights: full.screeningHighlights.map((s) => anonymizeText(stripPersonalNames(s))),
    experienceSnapshot: anonymizeText(stripPersonalNames(full.experienceSnapshot)),
    skills: full.skills,
    recruiterRecommendation: anonymizeText(stripPersonalNames(full.recruiterRecommendation)),
    blindProfile: full.blindProfile,
  };
}

function stripPersonalNames(text: string): string {
  return text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, 'the candidate');
}

export function scanRedactionFlags(content: PresentationContent): string[] {
  const flags = new Set<string>();
  const texts = [
    content.headline,
    content.executiveSummary,
    content.experienceSnapshot,
    content.recruiterRecommendation,
    ...content.keyStrengths,
    ...content.roleFit,
    ...content.screeningHighlights,
  ];

  for (const text of texts) {
    if (!text) continue;
    if (EMAIL_PATTERN.test(text)) flags.add('Possible email address detected');
    EMAIL_PATTERN.lastIndex = 0;
    if (PHONE_PATTERN.test(text)) flags.add('Possible phone number detected');
    PHONE_PATTERN.lastIndex = 0;
    if (LINKEDIN_PATTERN.test(text)) flags.add('Possible LinkedIn URL detected');
    LINKEDIN_PATTERN.lastIndex = 0;
    if (GITHUB_PATTERN.test(text)) flags.add('Possible GitHub URL detected');
    GITHUB_PATTERN.lastIndex = 0;
    if (URL_PATTERN.test(text)) flags.add('Possible external URL detected');
    URL_PATTERN.lastIndex = 0;
    if (/\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text)) {
      flags.add('Possible full name detected');
    }
  }

  return [...flags];
}

export function resolvePublicContent(row: {
  protection_enabled: boolean;
  disclosure_stage: 'blind' | 'full_unlocked';
  terms_accepted_at: string | null;
  blind_content_json: PresentationContent | null;
  full_content_json: PresentationContent | null;
  content_json: PresentationContent;
}): PresentationContent | null {
  if (!row.protection_enabled) {
    return row.full_content_json ?? row.content_json;
  }
  if (!row.terms_accepted_at) return null;
  if (row.disclosure_stage === 'full_unlocked') {
    return row.full_content_json ?? row.content_json;
  }
  return row.blind_content_json ?? buildBlindPresentation(row.content_json);
}
