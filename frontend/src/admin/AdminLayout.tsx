import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearAdminToken, isAdminLoggedIn } from '../auth/adminSession';

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/jobs', label: 'Jobs' },
  { to: '/admin/pipeline', label: 'Pipeline' },
  { to: '/admin/import', label: 'CSV Import' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const onLogin = location.pathname === '/admin/login';

  function onSignOut() {
    clearAdminToken();
    navigate('/admin', { replace: true });
  }

  if (!onLogin && !isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (onLogin) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Admin</p>
            <h1 className="text-lg font-semibold">Careers portal</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))
                    ? 'font-semibold text-brand-primary'
                    : 'text-slate-600 hover:text-brand-primary'
                }
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={onSignOut}
              className="text-slate-600 hover:text-brand-primary"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
