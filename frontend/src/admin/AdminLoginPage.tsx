import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { adminLogin } from '../api/admin';
import { isAdminLoggedIn, setAdminTenantSlug, setAdminToken } from '../auth/adminSession';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('user');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAdminLoggedIn()) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, admin, tenant_slug } = await adminLogin(username, password);
      setAdminToken(token);
      if (tenant_slug) setAdminTenantSlug(tenant_slug);
      if (admin.must_change_password) {
        navigate('/admin/change-password', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Default credentials: <strong>admin</strong> / <strong>user</strong> (change on first login)
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            Username
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand-primary px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-brand-primary hover:underline">
            Back to careers site
          </Link>
        </p>
      </div>
    </div>
  );
}
