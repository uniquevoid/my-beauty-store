import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApplicationSummary } from '../api/applications';
import { getApiErrorMessage } from '../api/errors';
import { http } from '../api/http';
import { setCandidateToken } from '../auth/session';

function useQueryParam(name: string) {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search).get(name) ?? '', [location.search, name]);
}

export default function CandidateRegisterPage() {
  const navigate = useNavigate();
  const code = useQueryParam('code');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    getApplicationSummary(code)
      .then((summary) => {
        if (cancelled) return;
        if (summary.applicant_email) setEmail(summary.applicant_email);
        if (summary.job_title) setJobTitle(summary.job_title);
      })
      .catch(() => {
        // Invalid or expired code — user can still register manually
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await http.post<{ token: string }>('/auth/register', {
        email,
        password,
        applicationCode: code || undefined,
      });
      setCandidateToken(res.data.token);
      navigate('/candidate');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Registration failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-8 py-14">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-3xl font-heading tracking-tight">Create your candidate account</h1>
        <p className="mt-2 text-sm text-gray-500">
          {code
            ? jobTitle
              ? `We'll link your application for ${jobTitle}.`
              : "We'll link your application using your code."
            : 'You can create an account to manage your applications.'}
        </p>

        {error ? (
          <div className="mt-6 bg-sand rounded-2xl p-4 text-sm text-red-700 border border-red-100">{error}</div>
        ) : null}

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white"
              required
              minLength={8}
            />
            <div className="mt-1 text-xs text-gray-500">At least 8 characters.</div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center rounded-xl bg-charcoal text-sand px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Create account
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-terracotta hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
