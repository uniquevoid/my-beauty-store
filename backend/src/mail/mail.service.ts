import { Injectable, Logger } from '@nestjs/common';

export type ApplicationConfirmationEmail = {
  to: string;
  candidateName?: string;
  jobTitle: string;
  applicationCode: string;
};

export type WelcomeEmail = {
  to: string;
  candidateName?: string;
};

export type JobAlertMatchEmail = {
  to: string;
  candidateName?: string;
  alertCriteria: string;
  jobs: Array<{
    title: string;
    slug: string;
    department: string | null;
    location: string | null;
    employment_type: string | null;
  }>;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private get from() {
    return process.env.MAIL_FROM ?? 'careers@localhost';
  }

  private get appPublicUrl() {
    return (process.env.APP_PUBLIC_URL ?? 'http://localhost:5175').replace(/\/$/, '');
  }

  async sendApplicationConfirmation(payload: ApplicationConfirmationEmail): Promise<void> {
    try {
      const registerUrl = `${this.appPublicUrl}/register?code=${encodeURIComponent(payload.applicationCode)}`;
      const jobsUrl = `${this.appPublicUrl}/jobs`;
      const greeting = payload.candidateName?.trim() ? `Hi ${payload.candidateName.trim()},` : 'Hi,';

      const body = [
        `${greeting}`,
        '',
        `Thank you for applying for the ${payload.jobTitle} role.`,
        '',
        `Your application has been received. Save this code for your records: ${payload.applicationCode}`,
        '',
        `Create a candidate account to track your application: ${registerUrl}`,
        `Browse more open roles: ${jobsUrl}`,
        '',
        'Best regards,',
        'Careers Team',
      ].join('\n');

      await this.dispatch({
        subject: `Application received — ${payload.jobTitle}`,
        to: payload.to,
        body,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send application confirmation to ${payload.to}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async sendJobAlertMatch(payload: JobAlertMatchEmail): Promise<void> {
    try {
      const greeting = payload.candidateName?.trim() ? `Hi ${payload.candidateName.trim()},` : 'Hi,';
      const jobLines = payload.jobs.map((job) => {
        const meta = [job.department, job.location, job.employment_type].filter(Boolean).join(' · ');
        const url = `${this.appPublicUrl}/jobs/${encodeURIComponent(job.slug)}`;
        return meta
          ? `• ${job.title} (${meta})\n  ${url}`
          : `• ${job.title}\n  ${url}`;
      });

      const body = [
        greeting,
        '',
        `A new role matching ${payload.alertCriteria} has been published:`,
        '',
        ...jobLines,
        '',
        `Manage your alerts: ${this.appPublicUrl}/job-alerts`,
        `Browse all roles: ${this.appPublicUrl}/jobs`,
        '',
        'Best regards,',
        'Careers Team',
      ].join('\n');

      const subject =
        payload.jobs.length === 1
          ? `New job alert: ${payload.jobs[0].title}`
          : `${payload.jobs.length} new roles match your job alert`;

      await this.dispatch({ subject, to: payload.to, body });
    } catch (error) {
      this.logger.warn(
        `Failed to send job alert email to ${payload.to}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async sendWelcomeEmail(payload: WelcomeEmail): Promise<void> {
    try {
      const dashboardUrl = `${this.appPublicUrl}/candidate`;
      const greeting = payload.candidateName?.trim() ? `Hi ${payload.candidateName.trim()},` : 'Hi,';

      const body = [
        `${greeting}`,
        '',
        'Your candidate account has been created successfully.',
        '',
        `View your profile and applications: ${dashboardUrl}`,
        '',
        'Best regards,',
        'Careers Team',
      ].join('\n');

      await this.dispatch({
        subject: 'Welcome to your candidate account',
        to: payload.to,
        body,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send welcome email to ${payload.to}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async dispatch(email: { subject: string; to: string; body: string }) {
    const provider = (process.env.MAIL_PROVIDER ?? 'console').toLowerCase();

    if (provider === 'console') {
      this.logToConsole(email);
      return;
    }

    if (provider === 'resend') {
      await this.sendViaResend(email);
      return;
    }

    this.logger.warn(`MAIL_PROVIDER "${provider}" is not implemented; falling back to console log.`);
    this.logToConsole(email);
  }

  private logToConsole(email: { subject: string; to: string; body: string }) {
    this.logger.log(
      [
        '--- EMAIL (console) ---',
        `From: ${this.from}`,
        `To: ${email.to}`,
        `Subject: ${email.subject}`,
        '',
        email.body,
        '--- END EMAIL ---',
      ].join('\n'),
    );
  }

  private async sendViaResend(email: { subject: string; to: string; body: string }) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is missing; logging email to console instead.');
      this.logToConsole(email);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [email.to],
        subject: email.subject,
        text: email.body,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(`Resend API error (${response.status}): ${detail}`);
    }
  }
}
