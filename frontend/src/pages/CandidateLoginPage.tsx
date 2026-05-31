import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import { setCandidateToken } from '../auth/session';

export default function CandidateLoginPage() {
  const navigate = useNavigate();
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
      navigate('/candidate');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-8 py-14">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-3xl font-heading tracking-tight">Candidate sign in</h1>
        <p className="mt-2 text-sm text-gray-500">Access your profile and applications.</p>

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
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center rounded-xl bg-charcoal text-sand px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500">
          Don’t have an account?{' '}
          <Link to="/register" className="text-terracotta hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

