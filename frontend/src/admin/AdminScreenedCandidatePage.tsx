import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  adminCreateScreenedCandidate,
  adminListJobs,
  type AdminJob,
} from '../api/admin';
import { getApiErrorMessage } from '../api/errors';

export default function AdminScreenedCandidatePage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [jobId, setJobId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [screeningNotes, setScreeningNotes] = useState('');
  const [screeningCompletedAt, setScreeningCompletedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    adminListJobs({ status: 'published' })
      .then(setJobs)
      .catch(() => setError('Could not load published jobs.'));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInviteUrl(null);

    try {
      const result = await adminCreateScreenedCandidate({
        jobId,
        candidateName,
        candidateEmail,
        screeningNotes,
        screeningCompletedAt: screeningCompletedAt || null,
      });
      const url = `${window.location.origin}/apply/${encodeURIComponent(result.job.slug)}?invite=${encodeURIComponent(result.invite_token)}`;
      setInviteUrl(url);
      setCreatedId(result.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create screened candidate.'));
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/admin/pipeline" className="text-sm text-brand-primary hover:underline">
          ← Back to pipeline
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">Add screened candidate</h2>
        <p className="mt-1 text-sm text-slate-600">
          Record screening notes and generate an invite link for the candidate to apply.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="job">
            Job
          </label>
          <select
            id="job"
            required
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a published job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="name">
            Candidate name
          </label>
          <input
            id="name"
            required
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            Candidate email
          </label>
          <input
            id="email"
            type="email"
            required
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="screening-date">
            Screening date
          </label>
          <input
            id="screening-date"
            type="date"
            value={screeningCompletedAt}
            onChange={(e) => setScreeningCompletedAt(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="notes">
            Screening notes
          </label>
          <textarea
            id="notes"
            rows={8}
            value={screeningNotes}
            onChange={(e) => setScreeningNotes(e.target.value)}
            placeholder="Key strengths, motivation, compensation expectations, availability, culture fit…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create & get invite link'}
        </button>
      </form>

      {inviteUrl && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-medium text-emerald-900">Invite link ready</p>
          <p className="mt-2 break-all text-emerald-800">{inviteUrl}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyInvite}
              className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-emerald-900 hover:bg-emerald-100"
            >
              Copy link
            </button>
            {createdId && (
              <Link
                to={`/admin/pipeline/${createdId}/presentation`}
                className="rounded-md bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-800"
              >
                Open pipeline record
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
