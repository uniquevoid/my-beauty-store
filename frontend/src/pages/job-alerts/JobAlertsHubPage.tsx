import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/errors';
import { listJobAlerts, type JobAlert } from '../../api/jobAlerts';
import { useCandidateAuth } from '../../auth/useCandidateAuth';
import JobAlertsPageChrome from '../../components/job-alerts/JobAlertsPageChrome';
import { PageMeta } from '../../seo/PageMeta';

function describeAlert(alert: JobAlert) {
  const parts = [alert.keyword, alert.location, alert.department].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Any new roles';
}

export default function JobAlertsHubPage() {
  const { isLoggedIn } = useCandidateAuth();
  const [alerts, setAlerts] = useState<JobAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    listJobAlerts()
      .then((data) => {
        if (!cancelled) setAlerts(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load your alerts.'));
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  return (
    <>
      <PageMeta title="Job alerts" description="Create tailored job alerts tied to your candidate account." />

      <JobAlertsPageChrome>
        {!isLoggedIn ? (
          <div className="bg-gray-100 border-y border-gray-200 px-4 sm:px-8 py-3 text-center text-sm text-brand-highlight">
            If you have an account please{' '}
            <Link to="/job-alerts/login?redirect=/job-alerts" className="font-bold text-brand-primary hover:underline">
              login
            </Link>{' '}
            first
          </div>
        ) : null}

        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 md:py-14">
          <h2 className="text-2xl font-sans font-semibold text-brand-highlight">Your job alerts</h2>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Tailored alerts are saved to your account. We&apos;ll notify you when matching roles are published.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          {!isLoggedIn ? (
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/job-alerts/register"
                className="inline-flex items-center justify-center rounded-full bg-brand-highlight text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Create your account
              </Link>
              <Link
                to="/job-alerts/login?redirect=/job-alerts"
                className="inline-flex items-center justify-center rounded-full border-2 border-brand-primary text-brand-primary px-6 py-3 text-sm font-semibold hover:bg-brand-primary/5 transition-colors"
              >
                Sign in
              </Link>
            </div>
          ) : alerts === null ? (
            <div className="mt-8 text-gray-500">Loading your alerts…</div>
          ) : alerts.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 text-gray-600">
              You don&apos;t have any alerts yet.{' '}
              <Link to="/job-alerts/create" className="font-semibold text-brand-primary hover:underline">
                Create your first alert
              </Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-3">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-2xl border border-gray-100 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <span className="font-medium text-charcoal">{describeAlert(alert)}</span>
                  <span className="text-xs text-gray-500">
                    Created {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {isLoggedIn ? (
            <div className="mt-8">
              <Link
                to="/job-alerts/create"
                className="inline-flex items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Create job alert
              </Link>
            </div>
          ) : null}
        </div>
      </JobAlertsPageChrome>
    </>
  );
}
