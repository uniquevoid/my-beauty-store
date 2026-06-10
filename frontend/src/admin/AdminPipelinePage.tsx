import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  adminListScreenedCandidates,
  type ScreenedCandidateListItem,
  type ScreenedCandidateStatus,
} from '../api/admin';
import { getApiErrorMessage } from '../api/errors';

function unwrapJob(item: ScreenedCandidateListItem) {
  return Array.isArray(item.jobs) ? item.jobs[0] : item.jobs;
}

function unwrapApplication(item: ScreenedCandidateListItem) {
  if (!item.applications) return null;
  return Array.isArray(item.applications) ? item.applications[0] : item.applications;
}

function unwrapPresentation(item: ScreenedCandidateListItem) {
  if (!item.candidate_presentations) return null;
  return Array.isArray(item.candidate_presentations)
    ? item.candidate_presentations[0]
    : item.candidate_presentations;
}

function formatEngagementSummary(item: ScreenedCandidateListItem) {
  if (item.status !== 'published') return '—';
  const presentation = unwrapPresentation(item);
  if (!presentation) return '—';
  const parts: string[] = [];
  if (presentation.client_viewed_at) parts.push('Opened');
  if (presentation.client_exported_at) parts.push('Exported');
  if (presentation.protection_enabled) {
    if (presentation.terms_accepted_at) parts.push('Terms OK');
    if (presentation.interview_requested_at) parts.push('Interview req');
    if (presentation.disclosure_stage === 'full_unlocked') parts.push('Unlocked');
  }
  return parts.length ? parts.join(' · ') : 'No activity';
}

const STATUS_LABELS: Record<ScreenedCandidateStatus, string> = {
  invited: 'Invited',
  applied: 'Applied',
  presentation_draft: 'Draft presentation',
  published: 'Published',
};

export default function AdminPipelinePage() {
  const [items, setItems] = useState<ScreenedCandidateListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListScreenedCandidates({
        status: (statusFilter || undefined) as ScreenedCandidateStatus | undefined,
      });
      setItems(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load pipeline. Try signing out and back in.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  const rows = useMemo(
    () =>
      items.map((item) => ({
        item,
        job: unwrapJob(item),
        application: unwrapApplication(item),
      })),
    [items],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Candidate pipeline</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pre-screen candidates, send invite links, and publish client presentations.
          </p>
        </div>
        <Link
          to="/admin/pipeline/new"
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Add screened candidate
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600" htmlFor="pipeline-status">
          Status
        </label>
        <select
          id="pipeline-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="invited">Invited</option>
          <option value="applied">Applied</option>
          <option value="presentation_draft">Draft presentation</option>
          <option value="published">Published</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-600">Loading pipeline…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          No screened candidates yet. Create one to get an invite link for a pre-screened applicant.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Client activity</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ item, job, application }) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{item.candidate_name}</div>
                    <div className="text-slate-500">{item.candidate_email}</div>
                  </td>
                  <td className="px-4 py-3">{job?.title ?? '—'}</td>
                  <td className="px-4 py-3">{STATUS_LABELS[item.status]}</td>
                  <td className="px-4 py-3">
                    {application
                      ? new Date(application.created_at).toLocaleDateString()
                      : 'Not yet'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatEngagementSummary(item)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/pipeline/${item.id}/presentation`}
                      className="font-medium text-brand-primary hover:underline"
                    >
                      {item.status === 'invited' ? 'View invite' : 'Presentation'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
