import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { createGeminiClient, generateContentWithFallback, generateJsonWithFallback } from './gemini-client';
import { withInferredLocation } from './location-extract';
import { extractStructuredResumeFallback, extractStructuredResumeFallbackForApplication } from './resume-fallback';
import type { ExtractedResume } from './extracted-resume.types';
import {
  buildBlindPresentationFallback,
  buildFullPresentationFallback,
  type PresentationContent,
} from './presentation-fallback';
import { normalizeExtractedLinks } from '../applications/url-normalization';
import {
  buildBlindPresentation,
  deriveBlindProfile,
  scanRedactionFlags,
} from '../pipeline/presentation-redaction';

export type { ExtractedResume } from './extracted-resume.types';
export type { PresentationContent } from './presentation-fallback';

export type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const logger = new Logger('AiService');

@Injectable()
export class AiService {
  constructor() {
    createGeminiClient();
  }

  async generateCareerAssistantReply(
    systemPrompt: string,
    message: string,
    history: ChatHistoryMessage[] = [],
  ): Promise<string> {
    const historyLines = history.map((entry) =>
      entry.role === 'user' ? `User: ${entry.content}` : `Assistant: ${entry.content}`,
    );

    const prompt = [
      systemPrompt,
      '',
      ...(historyLines.length ? ['CONVERSATION HISTORY:', ...historyLines, ''] : []),
      `User: ${message}`,
      'Assistant:',
    ].join('\n');

    return generateContentWithFallback({
      prompt,
      generationConfig: { temperature: 0.4 },
      logger,
    });
  }

  async extractTextFromResume(file: { mimetype?: string; buffer: Buffer }) {
    const type = (file.mimetype ?? '').toLowerCase();

    if (type.includes('pdf')) {
      const parser = new PDFParse({ data: file.buffer });
      try {
        const result = await parser.getText();
        return (result.text ?? '').trim();
      } finally {
        await parser.destroy();
      }
    }

    if (type.includes('word') || type.includes('docx') || type.includes('officedocument')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return (result.value ?? '').trim();
    }

    const asText = file.buffer.toString('utf-8').trim();
    return asText;
  }

  async rankJobsForCandidate(
    extracted: ExtractedResume,
    jobs: Array<{
      slug: string;
      title: string;
      department: string | null;
      location: string | null;
      description: string | null;
    }>,
  ): Promise<Array<{ slug: string; score: number; reasons: string[] }>> {
    if (!jobs.length) return [];

    const candidateSummary = {
      skills: extracted.skills ?? [],
      summary: extracted.summary ?? null,
      location: extracted.location ?? null,
      work_titles: (extracted.work_experience ?? []).map((w) => w.title).filter(Boolean),
    };

    const jobsPayload = jobs.map((j) => ({
      slug: j.slug,
      title: j.title,
      department: j.department,
      location: j.location,
      description: (j.description ?? '').slice(0, 2000),
    }));

    const prompt = [
      'Rank these job openings for the candidate based on skills, experience, and role fit.',
      'Return ONLY valid JSON: an array of objects with { "slug": string, "score": number (0-100), "reasons": string[] (1-3 short bullets) }.',
      'Order by best fit first. Include every job slug exactly once.',
      '',
      'CANDIDATE:',
      JSON.stringify(candidateSummary),
      '',
      'JOBS:',
      JSON.stringify(jobsPayload),
    ].join('\n');

    const raw = await generateJsonWithFallback(prompt, { logger });

    let parsed: Array<{ slug: string; score: number; reasons: string[] }>;
    try {
      parsed = JSON.parse(raw) as Array<{ slug: string; score: number; reasons: string[] }>;
    } catch {
      const firstBracket = raw.indexOf('[');
      const lastBracket = raw.lastIndexOf(']');
      if (firstBracket >= 0 && lastBracket > firstBracket) {
        parsed = JSON.parse(raw.slice(firstBracket, lastBracket + 1)) as Array<{
          slug: string;
          score: number;
          reasons: string[];
        }>;
      } else {
        throw new Error('Gemini did not return valid JSON for job ranking.');
      }
    }

    return parsed.map((r) => ({
      slug: r.slug,
      score: Math.max(0, Math.min(100, Number(r.score) || 0)),
      reasons: Array.isArray(r.reasons) ? r.reasons.slice(0, 3) : [],
    }));
  }

  async extractStructuredResumeForApplication(text: string): Promise<ExtractedResume> {
    const prompt = [
      'Extract the candidate information from the resume text below.',
      'Do NOT extract or infer a professional summary.',
      'Return ONLY valid JSON that matches this schema:',
      '{',
      '  "name": string | null,',
      '  "email": string | null,',
      '  "phone": string | null,',
      '  "location": string | null,',
      '  "skills": string[],',
      '  "education": [{"school": string|null, "degree": string|null, "field": string|null, "start_date": string|null, "end_date": string|null}],',
      '  "work_experience": [{"company": string|null, "title": string|null, "location": string|null, "start_date": string|null, "end_date": string|null, "highlights": string[]}],',
      '  "links": string[]',
      '}',
      'If a field is unknown, use null or empty arrays. Use plain strings for dates (e.g. "2022-03" or "2022").',
      'Set location to the candidate home or mailing address from the Contact or header section (e.g. "Denver, CO 80209"), not job or employer locations.',
      'Include at most one portfolio or personal website URL in links.',
      '',
      'RESUME_TEXT:',
      text.slice(0, 250_000),
    ].join('\n');

    try {
      const raw = await generateJsonWithFallback(prompt, { logger });

      let parsed: ExtractedResume;
      try {
        parsed = JSON.parse(raw) as ExtractedResume;
      } catch {
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          const json = raw.slice(firstBrace, lastBrace + 1);
          parsed = JSON.parse(json) as ExtractedResume;
        } else {
          throw new Error('Gemini did not return valid JSON.');
        }
      }

      return {
        ...parsed,
        location: withInferredLocation(parsed, text),
        summary: undefined,
        links: normalizeExtractedLinks(parsed.links),
      };
    } catch (error) {
      logger.warn(
        `Falling back to local resume parsing (application): ${error instanceof Error ? error.message : error}`,
      );
      const fallback = extractStructuredResumeFallbackForApplication(text);
      return { ...fallback, links: normalizeExtractedLinks(fallback.links) };
    }
  }

  async extractStructuredResume(text: string): Promise<ExtractedResume> {
    const prompt = [
      'Extract the candidate information from the resume text below.',
      'Return ONLY valid JSON that matches this schema:',
      '{',
      '  "name": string | null,',
      '  "email": string | null,',
      '  "phone": string | null,',
      '  "location": string | null,',
      '  "summary": string | null,',
      '  "skills": string[],',
      '  "education": [{"school": string|null, "degree": string|null, "field": string|null, "start_date": string|null, "end_date": string|null}],',
      '  "work_experience": [{"company": string|null, "title": string|null, "location": string|null, "start_date": string|null, "end_date": string|null, "highlights": string[]}],',
      '  "links": string[]',
      '}',
      'If a field is unknown, use null or empty arrays. Use plain strings for dates (e.g. "2022-03" or "2022").',
      'Set location to the candidate home or mailing address from the Contact or header section, not job or employer locations.',
      '',
      'RESUME_TEXT:',
      text.slice(0, 250_000),
    ].join('\n');

    try {
      const raw = await generateJsonWithFallback(prompt, { logger });

      let parsed: ExtractedResume;
      try {
        parsed = JSON.parse(raw) as ExtractedResume;
      } catch {
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          const json = raw.slice(firstBrace, lastBrace + 1);
          parsed = JSON.parse(json) as ExtractedResume;
        } else {
          throw new Error('Gemini did not return valid JSON.');
        }
      }

      return {
        ...parsed,
        location: withInferredLocation(parsed, text),
        links: normalizeExtractedLinks(parsed.links),
      };
    } catch (error) {
      logger.warn(
        `Falling back to local resume parsing: ${error instanceof Error ? error.message : error}`,
      );
      const fallback = extractStructuredResumeFallback(text);
      return { ...fallback, links: normalizeExtractedLinks(fallback.links) };
    }
  }

  async generateCandidatePresentation(input: {
    resume: ExtractedResume;
    jobTitle: string;
    jobDescription: string;
    screeningNotes: string;
    clientName?: string;
  }): Promise<{
    fullContent: PresentationContent;
    blindContent: PresentationContent;
    redactionFlags: string[];
  }> {
    const candidateSummary = {
      name: input.resume.name ?? null,
      skills: input.resume.skills ?? [],
      summary: input.resume.summary ?? null,
      work_experience: (input.resume.work_experience ?? []).slice(0, 6),
      education: (input.resume.education ?? []).slice(0, 3),
    };

    const blindProfile = deriveBlindProfile(input.resume, input.screeningNotes);

    const prompt = [
      'Write TWO client-facing candidate presentations for a recruiting agency: one FULL version and one BLIND (anonymized) version.',
      'Use a professional, concise tone suitable for a hiring manager.',
      'Do NOT invent facts not supported by the resume or screening notes.',
      'Paraphrase screening notes into polished highlights — never quote raw call notes verbatim.',
      '',
      'FULL version rules:',
      '- May include candidate first name and real employer/university names.',
      '- Never include email, phone, LinkedIn, GitHub, or street addresses.',
      '',
      'BLIND version rules:',
      '- Never include candidate name, email, phone, LinkedIn, GitHub, or addresses.',
      '- Replace employer names with generic descriptors (e.g. "a Fortune 100 technology company").',
      '- Replace university names with generic descriptors (e.g. "a top-ranked UK university").',
      '- Use "the candidate" instead of personal names.',
      '',
      'Return ONLY valid JSON matching this schema:',
      '{',
      '  "full": {',
      '    "headline": string,',
      '    "executiveSummary": string,',
      '    "keyStrengths": string[],',
      '    "roleFit": string[],',
      '    "screeningHighlights": string[],',
      '    "experienceSnapshot": string,',
      '    "skills": string[],',
      '    "recruiterRecommendation": string',
      '  },',
      '  "blind": { same schema as full but anonymized }',
      '}',
      '',
      input.clientName ? `CLIENT COMPANY: ${input.clientName}` : '',
      `JOB TITLE: ${input.jobTitle}`,
      'JOB DESCRIPTION:',
      input.jobDescription.slice(0, 4000) || '(not provided)',
      '',
      'SCREENING NOTES:',
      input.screeningNotes.slice(0, 8000) || '(none provided)',
      '',
      'RESUME DATA:',
      JSON.stringify(candidateSummary),
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const raw = await generateJsonWithFallback(prompt, { logger });
      let parsed: { full?: PresentationContent; blind?: PresentationContent };
      try {
        parsed = JSON.parse(raw) as { full?: PresentationContent; blind?: PresentationContent };
      } catch {
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as {
            full?: PresentationContent;
            blind?: PresentationContent;
          };
        } else {
          throw new Error('Gemini did not return valid JSON for presentation.');
        }
      }

      const fullContent = this.normalizePresentationContent(
        parsed.full,
        input.jobTitle,
        blindProfile,
      );
      const blindContent = this.normalizePresentationContent(
        parsed.blind ?? buildBlindPresentation(fullContent),
        input.jobTitle,
        blindProfile,
      );
      const redactionFlags = scanRedactionFlags(blindContent);

      return { fullContent, blindContent, redactionFlags };
    } catch (error) {
      logger.warn(
        `Falling back to template presentation: ${error instanceof Error ? error.message : error}`,
      );
      const fullContent = buildFullPresentationFallback({
        resume: input.resume,
        jobTitle: input.jobTitle,
        screeningNotes: input.screeningNotes,
      });
      const blindContent = buildBlindPresentationFallback({
        resume: input.resume,
        jobTitle: input.jobTitle,
        screeningNotes: input.screeningNotes,
      });
      return {
        fullContent,
        blindContent,
        redactionFlags: scanRedactionFlags(blindContent),
      };
    }
  }

  private normalizePresentationContent(
    parsed: PresentationContent | undefined,
    jobTitle: string,
    blindProfile: ReturnType<typeof deriveBlindProfile>,
  ): PresentationContent {
    return {
      headline: parsed?.headline?.trim() || `${jobTitle} — Recommended Candidate`,
      executiveSummary: parsed?.executiveSummary?.trim() || '',
      keyStrengths: Array.isArray(parsed?.keyStrengths) ? parsed!.keyStrengths.filter(Boolean) : [],
      roleFit: Array.isArray(parsed?.roleFit) ? parsed!.roleFit.filter(Boolean) : [],
      screeningHighlights: Array.isArray(parsed?.screeningHighlights)
        ? parsed!.screeningHighlights.filter(Boolean)
        : [],
      experienceSnapshot: parsed?.experienceSnapshot?.trim() || '',
      skills: Array.isArray(parsed?.skills) ? parsed!.skills.filter(Boolean).slice(0, 12) : [],
      recruiterRecommendation: parsed?.recruiterRecommendation?.trim() || '',
      blindProfile,
    };
  }
}
