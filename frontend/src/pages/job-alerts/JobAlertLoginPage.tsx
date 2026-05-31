import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/errors';
import { http } from '../../api/http';
import { setCandidateToken } from '../../auth/session';
import JobAlertsPageChrome from '../../components/job-alerts/JobAlertsPageChrome';
import { PageMeta } from '../../seo/PageMeta';

const inputClass =
  'mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-brand-primary/30';

export default function JobAlertLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/job-alerts';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await http.post<{ token: string }>('/auth/login', { email, password });
      setCandidateToken(res.data.token);
      navigate(redirect);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Login failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageMeta title="Sign in | Job alerts" description="Sign in to manage your job alerts." />

      <JobAlertsPageChrome breadcrumb="Sign in">
        <div className="bg-gray-100 border-y border-gray-200 px-4 sm:px-8 py-3 text-center text-sm text-brand-highlight">
          Don&apos;t have an account?{' '}
          <Link
            to={`/job-alerts/register?redirect=${encodeURIComponent(redirect)}`}
            className="font-bold text-brand-primary hover:underline"
          >
            Create one
          </Link>
        </div>

        <div className="max-w-md mx-auto px-4 sm:px-8 py-10 md:py-14">
          <h2 className="text-2xl font-sans font-semibold text-brand-highlight">Sign in</h2>
          <p className="mt-2 text-gray-600">Access your saved job alerts.</p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center rounded-xl bg-brand-primary text-brand-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Sign in
            </button>
          </form>
        </div>
      </JobAlertsPageChrome>
    </>
  );
}
