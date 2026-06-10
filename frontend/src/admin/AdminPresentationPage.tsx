import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  adminGeneratePresentation,
  adminGetPresentationAuditEvents,
  adminGetScreenedCandidate,
  adminPublishPresentation,
  adminResetPresentationEngagement,
  adminUnlockFullPresentation,
  adminUpdatePresentation,
  adminUpdateScreenedCandidate,
  type CandidatePresentation,
  type IntroductionAuditEvent,
  type PresentationContent,
  type ScreenedCandidateDetail,
} from '../api/admin';
import { getApiErrorMessage } from '../api/errors';

const EMPTY_CONTENT: PresentationContent = {
  headline: '',
  executiveSummary: '',
  keyStrengths: [],
  roleFit: [],
  screeningHighlights: [],
  experienceSnapshot: '',
  skills: [],
  recruiterRecommendation: '',
};

function unwrapSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function listToTextarea(values: string[]) {
  return values.join('\n');
}

function textareaToList(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

type LinkedApplication = {
  status: string;
  resume_extracted?: Record<string, unknown> | null;
};

function getGenerateGateReason(
  application: LinkedApplication | null,
): string | null {
  if (!application) {
    return 'Waiting for the candidate to apply via the invite link (include ?invite= in the URL).';
  }
  if (application.status !== 'submitted') {
    return `Application is "${application.status}" — the candidate must finish and submit their application first.`;
  }
  if (!application.resume_extracted || Object.keys(application.resume_extracted).length === 0) {
    return 'No resume data on the application — ask the candidate to re-apply with a resume upload.';
  }
  return null;
}

export default function AdminPresentationPage() {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<ScreenedCandidateDetail | null>(null);
  const [presentation, setPresentation] = useState<CandidatePresentation | null>(null);
  const [screeningNotes, setScreeningNotes] = useState('');
  const [content, setContent] = useState<PresentationContent>(EMPTY_CONTENT);
  const [candidateDisplayName, setCandidateDisplayName] = useState('');
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [auditEvents, setAuditEvents] = useState<IntroductionAuditEvent[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const job = useMemo(() => unwrapSingle(detail?.jobs), [detail]);
  const application = useMemo(() => unwrapSingle(detail?.applications), [detail]);
  const inviteUrl = useMemo(() => {
    if (!job?.slug || !detail?.invite_token) return null;
    return `${window.location.origin}/apply/${encodeURIComponent(job.slug)}?invite=${encodeURIComponent(detail.invite_token)}`;
  }, [detail, job]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetScreenedCandidate(id);
      setDetail(data);
      setScreeningNotes(data.screening_notes ?? '');
      const existingPresentation = unwrapSingle(data.candidate_presentations);
      setPresentation(existingPresentation);
      if (existingPresentation) {
        setContent(existingPresentation.content_json ?? EMPTY_CONTENT);
        setCandidateDisplayName(existingPresentation.candidate_display_name ?? '');
        setProtectionEnabled(existingPresentation.protection_enabled ?? true);
        if (existingPresentation.status === 'published') {
          setShareUrl(
            `${window.location.origin}/present/${encodeURIComponent(existingPresentation.share_token)}`,
          );
          try {
            const events = await adminGetPresentationAuditEvents(existingPresentation.id);
            setAuditEvents(events);
          } catch {
            setAuditEvents([]);
          }
        } else {
          setAuditEvents([]);
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load pipeline record.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function saveNotes() {
    if (!detail) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await adminUpdateScreenedCandidate(detail.id, { screeningNotes });
      setMessage('Screening notes saved.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save notes.'));
    } finally {
      setBusy(false);
    }
  }

  async function onGenerate() {
    if (!detail) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await adminUpdateScreenedCandidate(detail.id, { screeningNotes });
      const generated = await adminGeneratePresentation(detail.id);
      setPresentation(generated);
      setContent(generated.content_json ?? EMPTY_CONTENT);
      setCandidateDisplayName(generated.candidate_display_name ?? '');
      setMessage('Presentation draft generated.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not generate presentation.'));
    } finally {
      setBusy(false);
    }
  }

  async function onSaveContent() {
    if (!presentation) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminUpdatePresentation(presentation.id, {
        content,
        candidateDisplayName,
        protectionEnabled,
      });
      setPresentation(updated);
      setMessage('Presentation content saved.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save presentation.'));
    } finally {
      setBusy(false);
    }
  }

  async function onPublish() {
    if (!presentation) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await adminUpdatePresentation(presentation.id, {
        content,
        candidateDisplayName,
        protectionEnabled,
      });
      const published = await adminPublishPresentation(presentation.id);
      setPresentation(published);
      const url = `${window.location.origin}/present/${encodeURIComponent(published.share_token)}`;
      setShareUrl(url);
      setMessage('Presentation published.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not publish presentation.'));
    } finally {
      setBusy(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setMessage('Client share link copied.');
  }

  function openPreview() {
    if (!presentation?.share_token) return;
    const url = `${window.location.origin}/present/${encodeURIComponent(presentation.share_token)}?preview=1`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function onUnlockFull() {
    if (!presentation) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminUnlockFullPresentation(presentation.id);
      setPresentation(updated);
      setMessage('Full presentation unlocked for client.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not unlock full presentation.'));
    } finally {
      setBusy(false);
    }
  }

  async function onResetEngagement() {
    if (!presentation) return;
    if (
      !window.confirm(
        'Clear client engagement stats? Use this if you accidentally opened the client link yourself.',
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminResetPresentationEngagement(presentation.id);
      setPresentation(updated);
      setMessage('Client engagement reset.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reset engagement.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading presentation workspace…</p>;
  }

  if (!detail) {
    return <p className="text-sm text-red-600">{error ?? 'Record not found.'}</p>;
  }

  const canGenerate = !getGenerateGateReason(application);
  const generateGateReason = getGenerateGateReason(application);

  const screenedCode = detail.id.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/pipeline" className="text-sm text-brand-primary hover:underline">
          ← Back to pipeline
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">{detail.candidate_name}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {job?.title ?? 'Job'} · {detail.candidate_email}
        </p>
        {presentation?.introduction_code && presentation.status === 'published' && (
          <p className="mt-2 text-sm text-slate-500">
            Candidate SC-{screenedCode} · Introduction {presentation.introduction_code}
            {presentation.client_company_name ? ` · Client ${presentation.client_company_name}` : ''}
            {presentation.published_at
              ? ` · Published ${new Date(presentation.published_at).toLocaleString()}`
              : ''}
          </p>
        )}
      </div>

      {inviteUrl && detail.status === 'invited' && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium">Invite link</p>
          <p className="mt-2 break-all text-slate-700">{inviteUrl}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
            className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
          >
            Copy invite link
          </button>
        </div>
      )}

      {generateGateReason && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {generateGateReason}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold">Screening notes</h3>
          <textarea
            rows={14}
            value={screeningNotes}
            onChange={(e) => setScreeningNotes(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={saveNotes}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Save notes
          </button>
        </section>

        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Client presentation</h3>
            <button
              type="button"
              disabled={busy || !canGenerate}
              onClick={onGenerate}
              className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              Generate draft
            </button>
          </div>

          {!presentation ? (
            <p className="text-sm text-slate-600">
              {canGenerate
                ? 'Ready — click Generate draft to create an AI-written client presentation from the resume and screening notes.'
                : 'Generate a draft once the candidate has submitted their application via the invite link.'}
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Display name on public page</label>
                <input
                  value={candidateDisplayName}
                  onChange={(e) => setCandidateDisplayName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Hidden from clients until full presentation is unlocked.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={protectionEnabled}
                  onChange={(e) => setProtectionEnabled(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Enable candidate protection (blind profile, terms gate, progressive disclosure)
              </label>

              {presentation.redaction_flags && presentation.redaction_flags.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">Redaction review — check before publishing</p>
                  <ul className="mt-2 list-disc pl-5">
                    {presentation.redaction_flags.map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Field
                label="Headline"
                value={content.headline}
                onChange={(value) => setContent({ ...content, headline: value })}
              />
              <Field
                label="Executive summary"
                value={content.executiveSummary}
                onChange={(value) => setContent({ ...content, executiveSummary: value })}
                multiline
              />
              <Field
                label="Key strengths (one per line)"
                value={listToTextarea(content.keyStrengths)}
                onChange={(value) => setContent({ ...content, keyStrengths: textareaToList(value) })}
                multiline
              />
              <Field
                label="Role fit (one per line)"
                value={listToTextarea(content.roleFit)}
                onChange={(value) => setContent({ ...content, roleFit: textareaToList(value) })}
                multiline
              />
              <Field
                label="Screening highlights (one per line)"
                value={listToTextarea(content.screeningHighlights)}
                onChange={(value) =>
                  setContent({ ...content, screeningHighlights: textareaToList(value) })
                }
                multiline
              />
              <Field
                label="Experience snapshot"
                value={content.experienceSnapshot}
                onChange={(value) => setContent({ ...content, experienceSnapshot: value })}
                multiline
              />
              <Field
                label="Skills (one per line)"
                value={listToTextarea(content.skills)}
                onChange={(value) => setContent({ ...content, skills: textareaToList(value) })}
                multiline
              />
              <Field
                label="Recruiter recommendation"
                value={content.recruiterRecommendation}
                onChange={(value) => setContent({ ...content, recruiterRecommendation: value })}
                multiline
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSaveContent}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPublish}
                  className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  Publish
                </button>
              </div>

              {shareUrl && presentation?.status === 'published' && (
                <div className="space-y-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
                  <div>
                    <p className="font-medium text-emerald-900">Client share link</p>
                    <p className="mt-1 break-all text-emerald-800">{shareUrl}</p>
                    <p className="mt-2 text-xs text-emerald-800/80">
                      Send this link to your client. Use Preview for internal review — preview visits
                      are not tracked.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyShareUrl}
                      className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-emerald-900"
                    >
                      Copy client link
                    </button>
                    <button
                      type="button"
                      onClick={openPreview}
                      className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-emerald-900"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onResetEngagement}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 disabled:opacity-60"
                    >
                      Reset engagement
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <EngagementBadge
                      active={Boolean(presentation.client_viewed_at)}
                      activeLabel="Link opened"
                      inactiveLabel="Not opened yet"
                    />
                    <EngagementBadge
                      active={Boolean(presentation.client_exported_at)}
                      activeLabel="PDF exported"
                      inactiveLabel="Not exported yet"
                    />
                    {presentation.protection_enabled && (
                      <>
                        <EngagementBadge
                          active={Boolean(presentation.terms_accepted_at)}
                          activeLabel="Terms accepted"
                          inactiveLabel="Terms pending"
                        />
                        <EngagementBadge
                          active={Boolean(presentation.interview_requested_at)}
                          activeLabel="Interview requested"
                          inactiveLabel="No interview request"
                        />
                        <EngagementBadge
                          active={presentation.disclosure_stage === 'full_unlocked'}
                          activeLabel="Full profile unlocked"
                          inactiveLabel="Blind profile only"
                        />
                      </>
                    )}
                  </div>

                  {presentation.protection_enabled &&
                    presentation.interview_requested_at &&
                    presentation.disclosure_stage !== 'full_unlocked' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onUnlockFull}
                        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                      >
                        Unlock full presentation
                      </button>
                    )}

                  {auditEvents.length > 0 && (
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <p className="font-medium text-slate-900">Audit trail</p>
                      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
                        {auditEvents.map((event) => (
                          <li key={event.id}>
                            {new Date(event.created_at).toLocaleString()} —{' '}
                            {event.event_type.replace(/_/g, ' ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EngagementBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        active ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
