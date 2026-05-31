import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminJobStats, adminLastImport, adminMe } from '../api/admin';
import type { JobStats } from '../api/admin';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [lastImport, setLastImport] = useState<{
    filename?: string;
    status?: string;
    created_at?: string;
    stats?: Record<string, number>;
  } | null>(null);
  const [mustChange, setMustChange] = useState(false);

  useEffect(() => {
    adminMe().then((a) => setMustChange(a.must_change_password));
    adminJobStats().then(setStats).catch(() => setStats(null));
    adminLastImport()
      .then((b) => setLastImport(b as typeof lastImport))
      .catch(() => setLastImport(null));
  }, []);

  if (mustChange) {
    return (
      <p className="text-sm">
        <Link to="/admin/change-password" className="text-brand-primary underline">
          Change your password
        </Link>{' '}
        to continue.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-slate-600">Overview of jobs and recent imports.</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          {(
            [
              ['Published', stats.published, 'text-green-700'],
              ['Draft', stats.draft, 'text-amber-700'],
              ['Closed', stats.closed, 'text-slate-600'],
              ['Total', stats.total, 'text-slate-900'],
            ] as const
          ).map(([label, value, color]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className={`text-3xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-medium">Last CSV import</h3>
        {lastImport ? (
          <dl className="mt-3 space-y-1 text-sm text-slate-600">
            <div>
              <dt className="inline font-medium text-slate-800">File: </dt>
              <dd className="inline">{lastImport.filename ?? '—'}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-800">Status: </dt>
              <dd className="inline">{lastImport.status}</dd>
            </div>
            {lastImport.stats && (
              <div>
                <dt className="inline font-medium text-slate-800">Stats: </dt>
                <dd className="inline">{JSON.stringify(lastImport.stats)}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No imports yet.</p>
        )}
        <Link
          to="/admin/import"
          className="mt-4 inline-block text-sm font-medium text-brand-primary hover:underline"
        >
          Start import →
        </Link>
      </div>
    </div>
  );
}
