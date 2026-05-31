import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getRecommendedJobs,
  startRecommendationSession,
  uploadResumeForSession,
  type RecommendedJob,
} from '../api/recommendations';
import { getApiErrorMessage } from '../api/errors';
import ResumeDropzone from '../components/ResumeDropzone';
import { PageMeta } from '../seo/PageMeta';

type Step = 'upload' | 'results';

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    startRecommendationSession()
      .then((res) => {
        if (!cancelled) setSessionCode(res.session_code);
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e, 'Failed to start session.'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFileSelect(file: File) {
    if (!sessionCode) return;
    setError(null);
    setBusy(true);
    setSelectedFileName(file.name);

    try {
      await uploadResumeForSession(sessionCode, file);
      const recommended = await getRecommendedJobs(sessionCode);
      setJobs(recommended);
      setStep('results');
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Failed to process resume.'));
    } finally {
      setBusy(false);
    }
  }

  function handleApply(job: RecommendedJob) {
    if (!sessionCode) return;
    navigate(`/apply/${job.slug}?session=${encodeURIComponent(sessionCode)}`);
  }

  return (
    <>
      <PageMeta
        title="Get job recommendations"
        description="Upload your resume and get personalized job recommendations."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        <Link to="/" className="text-sm text-gray-500 hover:text-terracotta transition-colors">
          ← Back to home
        </Link>

        <div className="mt-6 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-heading tracking-tight">Get recommendations</h1>
          <p className="mt-2 text-sm text-gray-500">
            Upload your resume and we&apos;ll suggest the best matching open roles.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl p-4 border border-red-100 text-red-700 text-sm">{error}</div>
          ) : null}

          {step === 'upload' ? (
            <div className="mt-8">
              <ResumeDropzone
                onFileSelect={handleFileSelect}
                disabled={!sessionCode}
                busy={busy}
                selectedFileName={selectedFileName}
              />
              {!sessionCode && !error ? (
                <p className="mt-4 text-sm text-gray-500 text-center">Preparing session…</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-medium">Recommended for you</h2>
                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setSelectedFileName(null);
                    setJobs([]);
                  }}
                  className="text-sm text-brand-primary hover:underline"
                >
                  Upload a different resume
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="rounded-2xl bg-sand p-6 text-sm text-gray-600">
                  No matching jobs found right now.{' '}
                  <Link to="/jobs" className="text-brand-primary hover:underline">
                    Browse all open positions
                  </Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.slug}
                    className="rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-medium">{job.title}</h3>
                        <span className="inline-flex items-center rounded-full bg-brand-primary/10 text-brand-primary px-3 py-0.5 text-xs font-semibold">
                          {job.match_score}% match
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {[job.department, job.location, job.employment_type].filter(Boolean).join(' · ')}
                      </p>
                      {job.match_reasons?.length ? (
                        <ul className="mt-3 space-y-1">
                          {job.match_reasons.slice(0, 2).map((reason, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-brand-primary mt-0.5">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApply(job)}
                      className="shrink-0 inline-flex items-center justify-center rounded-xl bg-charcoal text-sand px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Apply
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
