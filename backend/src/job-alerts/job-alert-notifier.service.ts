import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { JobRow } from '../jobs/jobs.service';
import { jobMatchesAlert, type AlertCriteria } from './job-alert-matcher';

type AlertWithCandidate = {
  id: string;
  candidate_id: string;
  keyword: string | null;
  location: string | null;
  department: string | null;
  candidates:
    | { email: string; profile_json: Record<string, unknown> | null }
    | { email: string; profile_json: Record<string, unknown> | null }[]
    | null;
};

function normalizeCandidate(
  row: AlertWithCandidate['candidates'],
): { email: string; profile_json: Record<string, unknown> | null } | null {
  if (!row) return null;
  return Array.isArray(row) ? (row[0] ?? null) : row;
}

function candidateDisplayName(profile: Record<string, unknown> | null | undefined) {
  if (!profile) return undefined;
  const name = typeof profile.name === 'string' ? profile.name.trim() : '';
  if (name) return name;
  const first = typeof profile.firstName === 'string' ? profile.firstName.trim() : '';
  const last = typeof profile.lastName === 'string' ? profile.lastName.trim() : '';
  const combined = [first, last].filter(Boolean).join(' ');
  return combined || undefined;
}

function describeAlertCriteria(alert: AlertCriteria) {
  const parts = [alert.keyword, alert.location, alert.department].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'your saved criteria';
}

@Injectable()
export class JobAlertNotifierService {
  private readonly logger = new Logger(JobAlertNotifierService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly mail: MailService,
  ) {}

  /**
   * Sends job-alert emails for jobs that were just published (draft → published or new published).
   * Skips pairs already recorded in job_alert_notifications.
   */
  async notifyForNewlyPublishedJobs(tenantId: string, jobs: JobRow[]) {
    const published = jobs.filter((j) => j.status === 'published');
    if (!published.length) return;

    const { data: alerts, error: alertsErr } = await this.supabase.adminClient
      .from('job_alerts')
      .select('id, candidate_id, keyword, location, department, candidates ( email, profile_json )')
      .eq('tenant_id', tenantId);

    if (alertsErr) throw alertsErr;
    if (!alerts?.length) return;

    const jobIds = published.map((j) => j.id);
    const { data: sentRows, error: sentErr } = await this.supabase.adminClient
      .from('job_alert_notifications')
      .select('job_alert_id, job_id')
      .in('job_id', jobIds);

    if (sentErr) throw sentErr;

    const alreadySent = new Set(
      (sentRows ?? []).map((row) => `${row.job_alert_id}:${row.job_id}`),
    );

    const pendingByCandidate = new Map<
      string,
      {
        email: string;
        candidateName?: string;
        alerts: Map<string, { criteria: AlertCriteria; jobs: JobRow[] }>;
      }
    >();

    for (const job of published) {
      for (const rawAlert of alerts as AlertWithCandidate[]) {
        const alert = {
          id: rawAlert.id,
          keyword: rawAlert.keyword,
          location: rawAlert.location,
          department: rawAlert.department,
        };

        if (!jobMatchesAlert(job, alert)) continue;
        if (alreadySent.has(`${alert.id}:${job.id}`)) continue;

        const candidate = normalizeCandidate(rawAlert.candidates);
        if (!candidate?.email) continue;

        let bucket = pendingByCandidate.get(rawAlert.candidate_id);
        if (!bucket) {
          bucket = {
            email: candidate.email,
            candidateName: candidateDisplayName(candidate.profile_json ?? null),
            alerts: new Map(),
          };
          pendingByCandidate.set(rawAlert.candidate_id, bucket);
        }

        let alertBucket = bucket.alerts.get(alert.id);
        if (!alertBucket) {
          alertBucket = {
            criteria: {
              keyword: alert.keyword,
              location: alert.location,
              department: alert.department,
            },
            jobs: [],
          };
          bucket.alerts.set(alert.id, alertBucket);
        }

        if (!alertBucket.jobs.some((j) => j.id === job.id)) {
          alertBucket.jobs.push(job);
        }
      }
    }

    for (const [, bucket] of pendingByCandidate) {
      for (const [alertId, { criteria, jobs: matchedJobs }] of bucket.alerts) {
        if (!matchedJobs.length) continue;

        try {
          await this.mail.sendJobAlertMatch({
            to: bucket.email,
            candidateName: bucket.candidateName,
            alertCriteria: describeAlertCriteria(criteria),
            jobs: matchedJobs.map((j) => ({
              title: j.title,
              slug: j.slug,
              department: j.department,
              location: j.location,
              employment_type: j.employment_type,
            })),
          });

          const { error: insertErr } = await this.supabase.adminClient
            .from('job_alert_notifications')
            .insert(
              matchedJobs.map((job) => ({
                tenant_id: tenantId,
                job_alert_id: alertId,
                job_id: job.id,
              })),
            );

          if (insertErr) {
            this.logger.error(
              `Sent job alert email to ${bucket.email} but failed to record notifications: ${insertErr.message}`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `Failed job alert notification for ${bucket.email}: ${error instanceof Error ? error.message : error}`,
          );
        }
      }
    }
  }
}
