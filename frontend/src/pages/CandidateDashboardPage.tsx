import { useEffect, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { updateCandidateProfile } from '../api/candidate';

import { http } from '../api/http';

import { deleteJobAlert } from '../api/jobAlerts';

import { clearCandidateToken } from '../auth/session';

import ApplicationForm from '../components/ApplicationForm';

import ProfileSummary from '../components/ProfileSummary';

import {

  validateCandidateProfile,

  type ApplicationValidationResult,

} from '../lib/application-validation';

import { normalizeExtractedResume, type ExtractedResume } from '../types/resume';



type DashboardResponse = {

  candidate: {

    id: string;

    email: string;

    profile_json: ExtractedResume;

    created_at: string;

    updated_at: string;

  };

  applications: Array<{

    id: string;

    application_code: string;

    status: string;

    created_at: string;

    updated_at: string;

    job: {

      slug: string;

      title: string;

      department: string | null;

      location: string | null;

      employment_type: string | null;

    } | null;

  }>;

  jobAlerts: Array<{

    id: string;

    keyword: string | null;

    location: string | null;

    department: string | null;

    created_at: string;

    updated_at: string;

  }>;

};



function describeJobAlert(alert: DashboardResponse['jobAlerts'][number]) {

  const parts = [alert.keyword, alert.location, alert.department].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : 'Any new roles';

}



function profileDraftFromCandidate(candidate: DashboardResponse['candidate']): ExtractedResume {

  return normalizeExtractedResume({

    ...candidate.profile_json,

    email: candidate.email,

  });

}



export default function CandidateDashboardPage() {

  const navigate = useNavigate();

  const [data, setData] = useState<DashboardResponse | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  const [draftProfile, setDraftProfile] = useState<ExtractedResume>(normalizeExtractedResume({}));

  const [fieldErrors, setFieldErrors] = useState<ApplicationValidationResult['fieldErrors']>({});

  const [saving, setSaving] = useState(false);



  useEffect(() => {

    let cancelled = false;

    http

      .get<DashboardResponse>('/candidate/dashboard')

      .then((res) => {

        if (!cancelled) setData(res.data);

      })

      .catch((e) => {

        if (!cancelled) setError(e?.message ?? 'Failed to load dashboard.');

      });

    return () => {

      cancelled = true;

    };

  }, []);



  function onSignOut() {

    clearCandidateToken();

    navigate('/');

  }



  function onStartEdit() {

    if (!data) return;

    setDraftProfile(profileDraftFromCandidate(data.candidate));

    setFieldErrors({});

    setIsEditing(true);

  }



  function onCancelEdit() {

    setFieldErrors({});

    setIsEditing(false);

  }



  async function onSaveProfile() {

    if (!data) return;



    const validation = validateCandidateProfile(draftProfile, {

      accountEmail: data.candidate.email,

    });

    if (!validation.valid) {

      setFieldErrors(validation.fieldErrors);

      return;

    }



    setSaving(true);

    setError(null);

    try {

      const updated = await updateCandidateProfile({

        ...draftProfile,

        email: data.candidate.email,

      });

      setData({

        ...data,

        candidate: {

          ...data.candidate,

          profile_json: updated.profile_json,

          updated_at: updated.updated_at,

        },

      });

      setFieldErrors({});

      setIsEditing(false);

    } catch (e: unknown) {

      const message = e instanceof Error ? e.message : 'Failed to save profile.';

      setError(message);

    } finally {

      setSaving(false);

    }

  }



  async function onDeleteAlert(id: string) {

    if (!data) return;

    try {

      await deleteJobAlert(id);

      setData({

        ...data,

        jobAlerts: data.jobAlerts.filter((a) => a.id !== id),

      });

    } catch (e: unknown) {

      const message = e instanceof Error ? e.message : 'Failed to delete alert.';

      setError(message);

    }

  }



  return (

    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">

      <div className="flex items-start justify-between gap-4 mb-8">

        <div>

          <h1 className="text-3xl md:text-4xl font-heading tracking-tight">Candidate dashboard</h1>

          <p className="mt-2 text-sm text-gray-500">Your profile and submitted applications.</p>

        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">

          {isEditing ? (

            <>

              <button

                type="button"

                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:border-gray-300 transition-colors disabled:opacity-50"

                onClick={onCancelEdit}

                disabled={saving}

              >

                Cancel

              </button>

              <button

                type="button"

                className="rounded-xl bg-charcoal text-sand px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"

                onClick={onSaveProfile}

                disabled={saving}

              >

                {saving ? 'Saving…' : 'Save changes'}

              </button>

            </>

          ) : (

            <button

              type="button"

              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:border-gray-300 transition-colors disabled:opacity-50"

              onClick={onStartEdit}

              disabled={!data}

            >

              Edit

            </button>

          )}

          <button

            type="button"

            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:border-gray-300 transition-colors"

            onClick={onSignOut}

          >

            Sign out

          </button>

        </div>

      </div>



      {error ? (

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 text-red-700 mb-6">{error}</div>

      ) : null}



      {!data ? (

        <div className="text-gray-500">Loading…</div>

      ) : (

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

            <div className="text-sm uppercase tracking-widest text-gray-400">Profile</div>

            <div className="mt-4">

              <div className="text-xs uppercase tracking-wide text-gray-400">Email</div>

              <div className="mt-1 font-medium">{data.candidate.email}</div>

            </div>

            <div className="mt-6">

              {isEditing ? (

                <ApplicationForm

                  value={draftProfile}

                  onChange={setDraftProfile}

                  emailReadOnly

                  fieldErrors={fieldErrors}

                />

              ) : (

                <ProfileSummary profile={data.candidate.profile_json} />

              )}

            </div>

          </div>



          <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

            <div className="text-sm uppercase tracking-widest text-gray-400">Applications</div>

            {data.applications.length === 0 ? (

              <div className="mt-4 text-gray-600 text-sm">

                No linked applications yet. If you applied as a guest, make sure you registered using your application code.

                <div className="mt-3">

                  <Link to="/jobs" className="text-terracotta hover:underline">

                    Browse jobs

                  </Link>

                </div>

              </div>

            ) : (

              <div className="mt-4 space-y-3">

                {data.applications.map((a) => (

                  <div key={a.id} className="rounded-2xl border border-gray-100 p-4">

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                      <div>

                        {a.job ? (

                          <Link

                            to={`/jobs/${a.job.slug}`}

                            className="text-base font-medium text-charcoal hover:text-brand-primary transition-colors"

                          >

                            {a.job.title}

                          </Link>

                        ) : (

                          <div className="text-base font-medium">Application</div>

                        )}

                        {a.job ? (

                          <p className="mt-1 text-sm text-gray-500">

                            {[a.job.department, a.job.location, a.job.employment_type]

                              .filter(Boolean)

                              .join(' · ')}

                          </p>

                        ) : null}

                      </div>

                      <span className="inline-flex self-start items-center rounded-full px-3 py-1 text-xs font-semibold capitalize bg-brand-primary/10 text-brand-primary">

                        Submitted

                      </span>

                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">

                      <span>Submitted: {new Date(a.created_at).toLocaleString()}</span>

                      <span className="font-mono">{a.application_code}</span>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>



          <div className="lg:col-span-12 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div className="text-sm uppercase tracking-widest text-gray-400">Job alerts</div>

              <Link

                to="/job-alerts/create"

                className="inline-flex items-center justify-center rounded-full bg-brand-highlight text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"

              >

                New alert

              </Link>

            </div>

            {data.jobAlerts.length === 0 ? (

              <p className="mt-4 text-sm text-gray-600">

                No job alerts yet.{' '}

                <Link to="/job-alerts/create" className="text-brand-primary font-semibold hover:underline">

                  Create one

                </Link>

              </p>

            ) : (

              <ul className="mt-4 space-y-3">

                {data.jobAlerts.map((alert) => (

                  <li

                    key={alert.id}

                    className="rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"

                  >

                    <div>

                      <div className="font-medium">{describeJobAlert(alert)}</div>

                      <div className="mt-1 text-xs text-gray-500">

                        Created {new Date(alert.created_at).toLocaleDateString()}

                      </div>

                    </div>

                    <button

                      type="button"

                      onClick={() => onDeleteAlert(alert.id)}

                      className="self-start rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 transition-colors"

                    >

                      Remove

                    </button>

                  </li>

                ))}

              </ul>

            )}

          </div>

        </div>

      )}

    </div>

  );

}


