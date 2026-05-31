import { useEffect, useMemo, useState } from 'react';

import { Link, useParams, useSearchParams } from 'react-router-dom';

import { getApiErrorMessage } from '../api/errors';

import {

  extractResumeForApplication,

  startGuestApplication,

  submitGuestApplication,

} from '../api/applications';

import { getJob, type Job } from '../api/jobs';

import ApplicationForm from '../components/ApplicationForm';

import ApplicationSuccess from '../components/ApplicationSuccess';

import ResumeDropzone from '../components/ResumeDropzone';

import { validateApplication } from '../lib/application-validation';

import { emptyExtractedResume, normalizeExtractedResume, type ExtractedResume } from '../types/resume';



export default function ApplyPage() {

  const params = useParams();

  const [searchParams] = useSearchParams();

  const jobSlug = useMemo(() => params.jobSlug ?? '', [params.jobSlug]);

  const sessionCode = searchParams.get('session') ?? undefined;



  const [job, setJob] = useState<Job | null>(null);

  const [applicationCode, setApplicationCode] = useState<string | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [extracted, setExtracted] = useState<ExtractedResume>(emptyExtractedResume());

  const [prefilledFromSession, setPrefilledFromSession] = useState(false);

  const [resumeExtracted, setResumeExtracted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateApplication>['fieldErrors']>(

    {},

  );



  const [stepError, setStepError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const [extracting, setExtracting] = useState(false);

  const [submitted, setSubmitted] = useState(false);



  const formEnabled = resumeExtracted && !busy;



  useEffect(() => {

    let cancelled = false;

    if (!jobSlug) return;



    getJob(jobSlug)

      .then((j) => {

        if (!cancelled) setJob(j);

      })

      .catch((e) => {

        if (!cancelled) setStepError(e?.message ?? 'Failed to load job.');

      });



    return () => {

      cancelled = true;

    };

  }, [jobSlug]);



  useEffect(() => {

    let cancelled = false;

    if (!jobSlug) return;



    setBusy(true);

    startGuestApplication(jobSlug, sessionCode)

      .then((res) => {

        if (cancelled) return;

        setApplicationCode(res.application_code);

        if (res.resume_extracted && Object.keys(res.resume_extracted).length > 0) {

          setExtracted(normalizeExtractedResume(res.resume_extracted));

          setPrefilledFromSession(true);

          setResumeExtracted(true);

        }

      })

      .catch((e) => {

        if (!cancelled) setStepError(getApiErrorMessage(e, 'Failed to start application.'));

      })

      .finally(() => {

        if (!cancelled) setBusy(false);

      });



    return () => {

      cancelled = true;

    };

  }, [jobSlug, sessionCode]);



  async function onFileSelect(file: File) {

    if (!applicationCode) return;



    setResumeFile(file);

    setStepError(null);

    setFieldErrors({});

    setExtracting(true);

    setBusy(true);



    const previousSummary = extracted.summary ?? '';



    try {

      const res = await extractResumeForApplication(applicationCode, file);

      const normalized = normalizeExtractedResume(res.extracted);

      setExtracted({ ...normalized, summary: previousSummary });

      setPrefilledFromSession(false);

      setResumeExtracted(true);

    } catch (e: unknown) {

      setResumeExtracted(false);

      setStepError(getApiErrorMessage(e, 'Failed to extract resume.'));

    } finally {

      setExtracting(false);

      setBusy(false);

    }

  }



  async function onSubmit() {

    if (!applicationCode) return;



    const validation = validateApplication(extracted, { hasResume: resumeExtracted });

    if (!validation.valid) {

      setFieldErrors(validation.fieldErrors);

      setStepError(validation.errors[0] ?? 'Please complete all required fields.');

      return;

    }



    setStepError(null);

    setFieldErrors({});

    setBusy(true);

    try {

      await submitGuestApplication(applicationCode, extracted);

      setSubmitted(true);

    } catch (e: unknown) {

      setStepError(getApiErrorMessage(e, 'Failed to submit application.'));

    } finally {

      setBusy(false);

    }

  }



  return (

    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">

      <div className="mb-6 flex items-center justify-between gap-4">

        <Link to={`/jobs/${jobSlug}`} className="text-sm text-gray-500 hover:text-terracotta transition-colors">

          ← Back to job

        </Link>

        {applicationCode ? (

          <div className="text-xs text-gray-500">

            Application code: <span className="font-mono">{applicationCode}</span>

          </div>

        ) : null}

      </div>



      {stepError ? (

        <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-red-100 text-red-700">{stepError}</div>

      ) : null}



      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">

        <h1 className="text-3xl md:text-4xl font-heading tracking-tight">

          Apply{job?.title ? ` — ${job.title}` : ''}

        </h1>

        <p className="mt-2 text-sm text-gray-500">

          Upload your resume to unlock and pre-fill the form. Review everything before submitting.

        </p>



        {submitted ? (

          <ApplicationSuccess applicationCode={applicationCode ?? ''} />

        ) : (

          <>

            {prefilledFromSession ? (

              <div className="mt-6 rounded-2xl bg-sand p-4 text-sm text-gray-600">

                Your application has been pre-filled from your uploaded resume. Review the details below before

                submitting.

              </div>

            ) : (

              <div className="mt-8">

                <ResumeDropzone

                  onFileSelect={onFileSelect}

                  disabled={busy || !applicationCode}

                  busy={extracting}

                  selectedFileName={resumeFile?.name ?? null}

                />

              </div>

            )}



            {!formEnabled && !prefilledFromSession ? (

              <p className="mt-6 text-sm text-gray-500">

                Upload your resume to unlock the application form.

              </p>

            ) : null}



            <div

              className={`mt-10 transition-opacity ${formEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}

            >

              <ApplicationForm

                value={extracted}

                onChange={setExtracted}

                disabled={!formEnabled}

                fieldErrors={fieldErrors}

              />

            </div>



            <div className="mt-10 flex flex-col sm:flex-row gap-3">

              <button

                type="button"

                className="inline-flex items-center justify-center rounded-xl bg-terracotta text-sand px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"

                onClick={onSubmit}

                disabled={busy || !applicationCode || !resumeExtracted}

              >

                Submit application

              </button>

              <div className="text-xs text-gray-500 sm:self-center">

                You can create an account later using your application code.

              </div>

            </div>

          </>

        )}

      </div>

    </div>

  );

}

