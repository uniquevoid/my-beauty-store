import type { ExtractedResume } from './extracted-resume.types';
import { inferLocationFromResumeText } from './location-extract';

function parseFallbackFields(text: string) {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d+)?/,
  );

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const nameCandidate = lines.find((line) => line.length > 2 && line.length < 80 && !line.includes('@'));
  const skillsSection = text.match(
    /(?:skills|technologies|tech stack)[:\s]*([\s\S]*?)(?:\n\s*\n|\n[A-Z][a-z]+:|\n[A-Z ]{3,}|$)/i,
  );
  const skills = skillsSection
    ? skillsSection[1]
        .split(/[,;|•\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 50)
        .slice(0, 25)
    : [];

  const links = [...text.matchAll(/https?:\/\/[^\s)]+/g)].map((m) => m[0]).slice(0, 8);

  const summaryLines = lines
    .filter((line) => !line.includes('@') && !/^https?:\/\//.test(line))
    .slice(1, 5);

  return {
    nameCandidate,
    email: emailMatch?.[0],
    phone: phoneMatch?.[0],
    skills,
    links,
    summary: summaryLines.join(' ').slice(0, 600) || undefined,
  };
}

export function extractStructuredResumeFallback(text: string): ExtractedResume {
  const parsed = parseFallbackFields(text);

  return {
    name: parsed.nameCandidate,
    email: parsed.email,
    phone: parsed.phone,
    location: inferLocationFromResumeText(text),
    summary: parsed.summary,
    skills: parsed.skills,
    education: [],
    work_experience: [],
    links: parsed.links,
  };
}

export function extractStructuredResumeFallbackForApplication(text: string): ExtractedResume {
  const parsed = parseFallbackFields(text);

  return {
    name: parsed.nameCandidate,
    email: parsed.email,
    phone: parsed.phone,
    location: inferLocationFromResumeText(text),
    skills: parsed.skills,
    education: [],
    work_experience: [],
    links: parsed.links.slice(0, 1),
  };
}
