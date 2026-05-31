import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import { adminDeleteJob, adminListJobs, type AdminJob } from '../api/admin';



export default function AdminJobsPage() {

  const [jobs, setJobs] = useState<AdminJob[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>('');

  const [q, setQ] = useState('');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);



  async function load() {

    setLoading(true);

    setError(null);

    try {

      const data = await adminListJobs({

        status: statusFilter || undefined,

        q: q || undefined,

      });

      setJobs(data);

    } catch {

      setError('Could not load jobs. Try signing out and back in.');

      setJobs([]);

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    load();

  }, [statusFilter]);



  async function onDelete(id: string, title: string) {

    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setDeletingId(id);

    setError(null);

    try {

      await adminDeleteJob(id);

      await load();

    } catch {

      setError('Could not delete this job. Please try again.');

    } finally {

      setDeletingId(null);

    }

  }



  return (

    <div className="space-y-6">

      <div>

        <h2 className="text-2xl font-semibold">Jobs</h2>

        <p className="text-slate-600">

          Review and remove positions. Add new jobs via{' '}

          <Link to="/admin/import" className="font-medium text-brand-primary hover:underline">

            CSV Import

          </Link>

          .

        </p>

      </div>



      <div className="flex flex-wrap gap-3">

        <select

          className="rounded border border-slate-300 px-3 py-2 text-sm"

          value={statusFilter}

          onChange={(e) => setStatusFilter(e.target.value)}

        >

          <option value="">All statuses</option>

          <option value="published">Published</option>

          <option value="draft">Draft</option>

          <option value="closed">Closed</option>

        </select>

        <input

          className="min-w-[200px] flex-1 rounded border border-slate-300 px-3 py-2 text-sm"

          placeholder="Search title, slug, external ID"

          value={q}

          onChange={(e) => setQ(e.target.value)}

          onKeyDown={(e) => e.key === 'Enter' && load()}

        />

        <button

          type="button"

          onClick={load}

          className="rounded bg-brand-primary px-4 py-2 text-sm text-white"

        >

          Search

        </button>

      </div>



      {error ? <p className="text-sm text-red-600">{error}</p> : null}



      {loading ? (

        <p className="text-sm text-slate-500">Loading…</p>

      ) : (

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">

          <table className="min-w-full text-left text-sm">

            <thead className="border-b bg-slate-50 text-slate-600">

              <tr>

                <th className="px-4 py-3">Title</th>

                <th className="px-4 py-3">External ID</th>

                <th className="px-4 py-3">Status</th>

                <th className="px-4 py-3">Actions</th>

              </tr>

            </thead>

            <tbody>

              {jobs.map((job) => (

                <tr key={job.id} className="border-b last:border-0">

                  <td className="px-4 py-3">

                    <div className="font-medium">{job.title}</div>

                    <div className="text-xs text-slate-500">{job.slug}</div>

                  </td>

                  <td className="px-4 py-3 text-slate-600">{job.external_id ?? '—'}</td>

                  <td className="px-4 py-3 capitalize">{job.status}</td>

                  <td className="px-4 py-3">

                    <button

                      type="button"

                      className="text-xs text-red-700 hover:underline disabled:opacity-50"

                      disabled={deletingId === job.id}

                      onClick={() => onDelete(job.id, job.title)}

                    >

                      {deletingId === job.id ? 'Deleting…' : 'Delete'}

                    </button>

                  </td>

                </tr>

              ))}

              {!jobs.length && (

                <tr>

                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">

                    No jobs found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      )}

    </div>

  );

}

