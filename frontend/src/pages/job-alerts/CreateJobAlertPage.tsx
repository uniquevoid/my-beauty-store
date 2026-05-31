import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/errors';
import { createJobAlert } from '../../api/jobAlerts';
import { listJobLocations } from '../../api/jobs';
import { useCandidateAuth } from '../../auth/useCandidateAuth';
import JobAlertsPageChrome from '../../components/job-alerts/JobAlertsPageChrome';
import { PageMeta } from '../../seo/PageMeta';

const inputClass =
  'mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-brand-primary/30';

export default function CreateJobAlertPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useCandidateAuth();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/job-alerts/login?redirect=/job-alerts/create', { replace: true });
      return;
    }
    let cancelled = false;
    listJobLocations()
      .then((data) => {
        if (!cancelled) setLocations(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createJobAlert({
        keyword: keyword || undefined,
        location: location || undefined,
        department: department || undefined,
      });
      navigate('/job-alerts');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not save your alert.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageMeta title="Create job alert" description="Set criteria for your tailored job alert." />

      <JobAlertsPageChrome breadcrumb="Create alert">
        <div className="max-w-xl mx-auto px-4 sm:px-8 py-10 md:py-14">
          <h2 className="text-2xl font-sans font-semibold text-brand-highlight">Create your job alert</h2>
          <p className="mt-2 text-gray-600">
            Tell us what you&apos;re looking for. Leave fields blank to keep that filter open.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium">Keyword</label>
              <input
                className={inputClass}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. engineer, designer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Location</label>
              <select
                className={inputClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Any location</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Department</label>
              <input
                className={inputClass}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/job-alerts"
                className="inline-flex items-center justify-center rounded-xl border-2 border-brand-primary text-brand-primary bg-white px-6 py-3 text-sm font-semibold hover:bg-brand-primary/5 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-xl bg-brand-highlight text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Save alert
              </button>
            </div>
          </form>
        </div>
      </JobAlertsPageChrome>
    </>
  );
}
