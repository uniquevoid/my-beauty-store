import { Link } from 'react-router-dom';

import { useBranding } from '../../contexts/BrandingContext';

import JobAlertsIllustration from '../job-alerts/JobAlertsIllustration';

export default function JobAlertsCtaSection() {
  const { branding } = useBranding();
  const { jobAlerts } = branding.landing;
  const sectionStyle = jobAlerts.background
    ? { backgroundColor: jobAlerts.background }
    : undefined;

  return (
    <section
      id="job-alerts"
      className="py-12 md:py-16 bg-brand-surface text-brand-surface-text"
      style={sectionStyle}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-sans font-bold leading-tight">
              <span className="text-brand-highlight">{jobAlerts.headingLead}</span>{' '}
              <span className="text-brand-surface-text">{jobAlerts.headingTrail}</span>
            </h2>
            <div className="mt-6 space-y-4 text-brand-surface-text/80 leading-relaxed max-w-lg">
              {jobAlerts.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <Link
              to="/job-alerts"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-highlight text-brand-accent-foreground px-8 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {jobAlerts.ctaLabel}
            </Link>
          </div>

          <div className="lg:pl-8">
            <JobAlertsIllustration imageUrl={jobAlerts.imageUrl} />
          </div>
        </div>
      </div>
    </section>
  );
}
