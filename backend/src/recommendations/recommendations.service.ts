import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import { AiService, type ExtractedResume } from '../ai/ai.service';
import { JobRow, JobsService } from '../jobs/jobs.service';
import { ResumeFileService } from '../resume/resume-file.service';
import { SupabaseService } from '../supabase/supabase.service';

function makeSessionCode() {
  return crypto.randomBytes(12).toString('base64url');
}

export type ResumeSessionRow = {
  id: string;
  session_code: string;
  resume_storage_path: string | null;
  resume_extracted: ExtractedResume;
  created_at: string;
  updated_at: string;
  expires_at: string;
};

export type RecommendedJob = JobRow & {
  match_score: number;
  match_reasons: string[];
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1),
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let matches = 0;
  for (const token of a) {
    if (b.has(token)) matches += 1;
  }
  return matches / Math.max(a.size, 1);
}

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly resumeFile: ResumeFileService,
    private readonly jobs: JobsService,
    private readonly ai: AiService,
  ) {}

  async startSession(tenantId: string) {
    const sessionCode = makeSessionCode();

    const { data, error } = await this.supabase.adminClient
      .from('resume_sessions')
      .insert({ tenant_id: tenantId, session_code: sessionCode })
      .select('*')
      .single();

    if (error) throw error;
    return { session_code: (data as ResumeSessionRow).session_code };
  }

  async getSession(sessionCode: string): Promise<ResumeSessionRow> {
    const { data, error } = await this.supabase.adminClient
      .from('resume_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Invalid session code.');
    if (new Date((data as ResumeSessionRow).expires_at) < new Date()) {
      throw new BadRequestException('Session has expired.');
    }
    return data as ResumeSessionRow;
  }

  async uploadAndExtract(sessionCode: string, file: Express.Multer.File) {
    await this.getSession(sessionCode);

    const { resume_storage_path, extracted } = await this.resumeFile.uploadAndExtract(
      `sessions/${sessionCode}`,
      file,
    );

    const { data: updated, error } = await this.supabase.adminClient
      .from('resume_sessions')
      .update({
        resume_storage_path,
        resume_extracted: extracted,
        updated_at: new Date().toISOString(),
      })
      .eq('session_code', sessionCode)
      .select('*')
      .single();

    if (error) throw error;

    return {
      session: updated as ResumeSessionRow,
      extracted,
      resume_storage_path,
    };
  }

  computeRuleScores(extracted: ExtractedResume, jobs: JobRow[]): Map<string, { score: number; reasons: string[] }> {
    const skillTokens = tokenize((extracted.skills ?? []).join(' '));
    const summaryTokens = tokenize(extracted.summary ?? '');
    const candidateTokens = new Set([...skillTokens, ...summaryTokens]);
    const candidateLocation = (extracted.location ?? '').toLowerCase().trim();

    const workTitles = (extracted.work_experience ?? [])
      .map((w) => w.title ?? '')
      .join(' ');
    const workTokens = tokenize(workTitles);

    const scores = new Map<string, { score: number; reasons: string[] }>();

    for (const job of jobs) {
      const jobText = [job.title, job.department, job.description].filter(Boolean).join(' ');
      const jobTokens = tokenize(jobText);
      const titleTokens = tokenize(job.title);

      const skillOverlap = overlapScore(skillTokens, jobTokens);
      const titleOverlap = overlapScore(workTokens, titleTokens);
      const summaryOverlap = overlapScore(summaryTokens, jobTokens);

      let score = skillOverlap * 50 + titleOverlap * 30 + summaryOverlap * 20;
      const reasons: string[] = [];

      if (skillOverlap > 0.1) {
        reasons.push('Skills align with job requirements');
      }
      if (titleOverlap > 0.1) {
        reasons.push('Experience matches the role title');
      }

      const jobLocation = (job.location ?? '').toLowerCase().trim();
      if (
        candidateLocation &&
        jobLocation &&
        (jobLocation.includes('remote') ||
          candidateLocation.includes(jobLocation) ||
          jobLocation.includes(candidateLocation))
      ) {
        score += 10;
        reasons.push('Location preference matches');
      }

      scores.set(job.slug, {
        score: Math.min(100, Math.round(score * 100)),
        reasons: reasons.length ? reasons : ['General profile match'],
      });
    }

    return scores;
  }

  async getRecommendedJobs(tenantId: string, sessionCode: string): Promise<RecommendedJob[]> {
    const session = await this.getSession(sessionCode);
    const extracted = session.resume_extracted ?? {};

    if (!extracted.skills?.length && !extracted.summary && !extracted.work_experience?.length) {
      throw new BadRequestException('Upload a resume before requesting recommendations.');
    }

    const allJobs = await this.jobs.listPublished(tenantId);
    if (!allJobs.length) return [];

    const ruleScores = this.computeRuleScores(extracted, allJobs);

    const sortedByRules = [...allJobs].sort(
      (a, b) => (ruleScores.get(b.slug)?.score ?? 0) - (ruleScores.get(a.slug)?.score ?? 0),
    );
    const topCandidates = sortedByRules.slice(0, 10);

    let aiRankings: Array<{ slug: string; score: number; reasons: string[] }> = [];
    try {
      aiRankings = await this.ai.rankJobsForCandidate(extracted, topCandidates);
    } catch {
      // Fall back to rule-based only
    }

    const aiBySlug = new Map(aiRankings.map((r) => [r.slug, r]));

    const ranked = topCandidates.map((job) => {
      const rule = ruleScores.get(job.slug) ?? { score: 0, reasons: [] };
      const ai = aiBySlug.get(job.slug);

      const match_score = ai
        ? Math.round(rule.score * 0.4 + ai.score * 0.6)
        : rule.score;

      const match_reasons = ai?.reasons?.length ? ai.reasons : rule.reasons;

      return {
        ...job,
        match_score,
        match_reasons,
      };
    });

    ranked.sort((a, b) => b.match_score - a.match_score);

    const remaining = allJobs.filter((j) => !topCandidates.some((t) => t.slug === j.slug));
    const rest = remaining.map((job) => {
      const rule = ruleScores.get(job.slug) ?? { score: 0, reasons: ['General profile match'] };
      return { ...job, match_score: rule.score, match_reasons: rule.reasons };
    });

    return [...ranked, ...rest.sort((a, b) => b.match_score - a.match_score)];
  }
}
