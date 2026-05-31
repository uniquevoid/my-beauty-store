import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/errors';
import { http } from '../../api/http';
import { setCandidateToken } from '../../auth/session';
import JobAlertsPageChrome from '../../components/job-alerts/JobAlertsPageChrome';
import { PageMeta } from '../../seo/PageMeta';
import { validatePasswordClient } from '../../utils/password';

const inputClass =
  'mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-brand-primary/30';

export default function JobAlertRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/job-alerts/create';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.');
      return;
    }

    const passwordError = validatePasswordClient(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const res = await http.post<{ token: string }>('/auth/register', {
        email,
        password,
        passwordConfirm,
        firstName,
        lastName,
        positionTitle: positionTitle || undefined,
      });
      setCandidateToken(res.data.token);
      navigate(redirect);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Registration failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageMeta title="Create your account | Job alerts" description="Create a candidate account to save job alerts." />

      <JobAlertsPageChrome breadcrumb="Create account">
        <div className="bg-gray-100 border-y border-gray-200 px-4 sm:px-8 py-3 text-center text-sm text-brand-highlight">
          If you have an account please{' '}
          <Link
            to={`/job-alerts/login?redirect=${encodeURIComponent(redirect)}`}
            className="font-bold text-brand-primary hover:underline"
          >
            login
          </Link>{' '}
          first
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 md:py-14">
          <h2 className="text-2xl font-sans font-semibold text-brand-highlight">Create your account</h2>
          <p className="mt-2 text-lg font-bold text-charcoal">Review your information</p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-charcoal">
                  First Name <span className="text-brand-highlight">*</span>
                </label>
                <input
                  className={inputClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal">
                  Last Name <span className="text-brand-highlight">*</span>
                </label>
                <input
                  className={inputClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-charcoal">Position Title</label>
                <input
                  className={inputClass}
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal">
                  Email <span className="text-brand-highlight">*</span>
                </label>
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-charcoal">
                  Password <span className="text-brand-highlight">*</span>
                </label>
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  <div>Your password must:</div>
                  <div>• Have at least 8 characters.</div>
                  <div>• Have at least one number and one symbol.</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal">
                  Password confirmation <span className="text-brand-highlight">*</span>
                </label>
                <input
                  type="password"
                  className={inputClass}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/job-alerts"
                className="inline-flex min-w-[120px] items-center justify-center rounded-xl border-2 border-brand-primary text-brand-primary bg-white px-6 py-3 text-sm font-semibold hover:bg-brand-primary/5 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-brand-highlight text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </JobAlertsPageChrome>
    </>
  );
}
