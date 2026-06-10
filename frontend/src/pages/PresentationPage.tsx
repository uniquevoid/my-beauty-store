import { useEffect, useRef, useState } from 'react';
import { FileDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useParams, useSearchParams } from 'react-router-dom';

import {
  acceptPresentationTerms,
  getPublicPresentation,
  recordPresentationEngagement,
  requestPresentationInterview,
  type BlindProfileFields,
  type PublicPresentation,
} from '../api/presentations';
import { useBranding } from '../contexts/BrandingContext';
import type { PresentationContent } from '../api/admin';

function BulletList({ items, title }: { items: string[]; title: string }) {
  if (!items.length) return null;
  return (
    <section className="space-y-3 print:break-inside-avoid">
      <h2 className="text-xl font-semibold text-brand-text print:text-black">{title}</h2>
      <ul className="list-disc space-y-2 pl-5 text-brand-text/90 print:text-black">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function BlindProfileCard({ profile }: { profile: BlindProfileFields }) {
  const rows = [
    { label: 'Years of experience', value: profile.yearsExperience },
    { label: 'Industry expertise', value: profile.industryExpertise?.join(', ') },
    { label: 'Salary expectations', value: profile.salaryExpectation },
    { label: 'Location region', value: profile.locationRegion },
    { label: 'Availability', value: profile.availability },
  ].filter((row) => row.value);

  if (!rows.length) return null;

  return (
    <section className="rounded-2xl border border-brand-primary/20 bg-brand-surface p-6 text-brand-surfaceText shadow-sm print:border-gray-200 print:bg-white print:text-black print:break-inside-avoid">
      <h2 className="mb-4 text-lg font-semibold">Anonymous candidate profile</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs uppercase tracking-wide text-brand-text/60 print:text-gray-500">
              {row.label}
            </dt>
            <dd className="mt-1 font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TermsGate({
  tenantName,
  onAccept,
  busy,
}: {
  tenantName: string;
  onAccept: () => void;
  busy: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-brand-text/15 bg-brand-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-brand-text">Candidate introduction</h1>
        <p className="mt-4 leading-relaxed text-brand-text/80">
          By reviewing this candidate, you acknowledge that this introduction was made by{' '}
          <strong>{tenantName}</strong> and is subject to your agreed recruitment terms.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className="mt-6 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          I accept — view candidate profile
        </button>
      </div>
    </div>
  );
}

export default function PresentationPage() {
  const { shareToken = '' } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const { branding } = useBranding();
  const [data, setData] = useState<PublicPresentation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const viewedTracked = useRef(false);

  useEffect(() => {
    if (!shareToken) return;
    let cancelled = false;

    getPublicPresentation(shareToken, { preview: isPreview })
      .then((presentation) => {
        if (cancelled) return;
        setData(presentation);
      })
      .catch(() => {
        if (!cancelled) {
          setError('This presentation is unavailable or has not been published yet.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shareToken]);

  useEffect(() => {
    if (!shareToken || !data || isPreview || viewedTracked.current) return;
    if (data.termsRequired) return;
    if (!data.content) return;
    viewedTracked.current = true;
    void recordPresentationEngagement(shareToken, 'viewed', { preview: false });
  }, [shareToken, data, isPreview]);

  async function onAcceptTerms() {
    if (!shareToken) return;
    setBusy(true);
    try {
      const updated = await acceptPresentationTerms(shareToken);
      setData(updated);
      if (!isPreview) {
        viewedTracked.current = true;
        void recordPresentationEngagement(shareToken, 'viewed', { preview: false });
      }
    } catch {
      setError('Could not record terms acceptance. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onRequestInterview() {
    if (!shareToken) return;
    setBusy(true);
    try {
      const updated = await requestPresentationInterview(shareToken);
      setData(updated);
    } catch {
      setError('Could not submit interview request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onExportPdf() {
    if (!shareToken) return;
    if (!isPreview) {
      try {
        await recordPresentationEngagement(shareToken, 'export_pdf', { preview: false });
      } catch {
        // Still allow print if tracking fails
      }
    }
    window.print();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-brand-text/70">
        Loading presentation…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-brand-text/70">
        {error ?? 'Presentation not found.'}
      </div>
    );
  }

  if (data.termsRequired && !isPreview) {
    return (
      <div className="min-h-screen bg-brand-background text-brand-text">
        <Helmet>
          <title>Candidate introduction — {data.tenantName}</title>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <TermsGate tenantName={data.tenantName} onAccept={onAcceptTerms} busy={busy} />
      </div>
    );
  }

  const logoUrl = typeof branding.logoUrl === 'string' ? branding.logoUrl : undefined;
  const content = data.content;
  const isBlindStage = data.protectionEnabled && data.disclosureStage === 'blind';
  const pageTitle = data.candidateDisplayName
    ? `${data.candidateDisplayName} — ${content?.headline || 'Candidate presentation'}`
    : content?.headline || 'Candidate presentation';

  return (
    <div className="presentation-page min-h-screen bg-brand-background text-brand-text print:bg-white print:text-black">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Print watermark */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden items-center justify-center print:flex"
      >
        <span className="-rotate-45 text-6xl font-bold uppercase tracking-widest text-gray-200/80">
          Confidential
        </span>
      </div>

      {isPreview && (
        <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Recruiter preview — client engagement is not tracked.
        </div>
      )}

      <div className="relative z-10 border-b border-brand-text/10 bg-brand-surface/40 print:border-gray-200 print:bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={data.tenantName} className="h-10 w-auto object-contain" />
            ) : (
              <p className="text-lg font-semibold">{data.tenantName}</p>
            )}
            {data.jobTitle && (
              <p className="hidden text-sm uppercase tracking-wide text-brand-text/60 sm:block print:text-gray-600">
                {data.jobTitle}
              </p>
            )}
          </div>
          {content && (
            <button
              type="button"
              onClick={onExportPdf}
              className="no-print inline-flex shrink-0 items-center gap-2 rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm font-medium text-brand-text hover:bg-brand-surface/60"
            >
              <FileDown className="h-4 w-4" aria-hidden />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {!content ? (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-brand-text/70">
          Content is not available yet.
        </div>
      ) : (
        <article className="relative z-10 mx-auto max-w-4xl px-4 py-10 print:py-6">
          <header className="space-y-3 border-b border-brand-text/10 pb-8 print:border-gray-200">
            <p className="text-sm uppercase tracking-wide text-brand-primary print:text-gray-700">
              {isBlindStage ? 'Anonymous candidate presentation' : 'Candidate presentation'}
            </p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl print:text-black">
              {content.headline}
            </h1>
            {data.candidateDisplayName && (
              <p className="text-lg text-brand-text/80 print:text-gray-700">
                {data.candidateDisplayName}
              </p>
            )}
            {data.introductionCode && (
              <p className="text-sm text-brand-text/60 print:text-gray-500">
                Introduction ID {data.introductionCode}
                {data.clientCompanyName ? ` · Prepared for ${data.clientCompanyName}` : ''}
              </p>
            )}
          </header>

          <div className="mt-8 space-y-10">
            {isBlindStage && content.blindProfile && (
              <BlindProfileCard profile={content.blindProfile} />
            )}

            <PresentationSections content={content} />

            {isBlindStage && !data.interviewRequested && (
              <section className="no-print rounded-2xl border border-brand-primary/30 bg-brand-primary/5 p-6">
                <h2 className="text-lg font-semibold text-brand-primary">Interested in this candidate?</h2>
                <p className="mt-2 text-sm text-brand-text/80">
                  Request an interview to signal interest. Your recruiter will review and may unlock the
                  full presentation profile.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onRequestInterview}
                  className="mt-4 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  Request interview
                </button>
              </section>
            )}

            {data.interviewRequestPending && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 print:border-gray-300 print:bg-white">
                <h2 className="text-lg font-semibold">Interview requested</h2>
                <p className="mt-2 text-sm">
                  Your recruiter has been notified. The full candidate presentation will be available here
                  once approved.
                </p>
              </section>
            )}
          </div>

          <footer className="mt-12 border-t border-brand-text/10 pt-6 text-sm text-brand-text/60 print:border-gray-200 print:text-gray-600">
            <p className="print-watermark-footer">
              Submitted by {data.tenantName}
              {data.introductionCode ? ` · Introduction ID ${data.introductionCode}` : ''}
              {' · '}
              Confidential
              {data.clientCompanyName
                ? ` · Prepared exclusively for ${data.clientCompanyName}`
                : ''}
            </p>
            {data.publishedAt && (
              <p className="mt-1">{new Date(data.publishedAt).toLocaleDateString()}</p>
            )}
          </footer>
        </article>
      )}
    </div>
  );
}

function PresentationSections({ content }: { content: PresentationContent }) {
  return (
    <>
      {content.executiveSummary && (
        <section className="rounded-2xl bg-brand-surface p-6 text-brand-surfaceText shadow-sm print:border print:border-gray-200 print:bg-white print:text-black print:shadow-none print:break-inside-avoid">
          <h2 className="mb-3 text-lg font-semibold">Executive summary</h2>
          <p className="leading-relaxed">{content.executiveSummary}</p>
        </section>
      )}

      <BulletList items={content.keyStrengths} title="Key strengths" />
      <BulletList items={content.roleFit} title="Role fit" />
      <BulletList items={content.screeningHighlights} title="Screening insights" />

      {content.experienceSnapshot && (
        <section className="space-y-3 print:break-inside-avoid">
          <h2 className="text-xl font-semibold print:text-black">Experience snapshot</h2>
          <p className="leading-relaxed text-brand-text/90 print:text-black">
            {content.experienceSnapshot}
          </p>
        </section>
      )}

      {content.skills.length > 0 && (
        <section className="space-y-3 print:break-inside-avoid">
          <h2 className="text-xl font-semibold print:text-black">Relevant skills</h2>
          <div className="flex flex-wrap gap-2">
            {content.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-brand-primary/10 px-3 py-1 text-sm text-brand-primary print:border print:border-gray-300 print:bg-white print:text-black"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {content.recruiterRecommendation && (
        <section className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-6 print:border-gray-300 print:bg-white print:break-inside-avoid">
          <h2 className="mb-3 text-lg font-semibold text-brand-primary print:text-black">
            Recruiter recommendation
          </h2>
          <p className="leading-relaxed text-brand-text/90 print:text-black">
            {content.recruiterRecommendation}
          </p>
        </section>
      )}
    </>
  );
}
