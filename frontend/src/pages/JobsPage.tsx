import { useEffect, useState } from 'react';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { listJobLocations, listJobs, type Job } from '../api/jobs';

import JobSearchForm, { type JobSearchValues } from '../components/JobSearchForm';
import WorkplaceTypeBadge from '../components/WorkplaceTypeBadge';

import { branding } from '../config/branding';

import { useCareers } from '../contexts/CareersContext';

import { PageMeta } from '../seo/PageMeta';



export default function JobsPage() {

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const { careers } = useCareers();

  const q = searchParams.get('q') ?? '';

  const location = searchParams.get('location') ?? '';

  const areaOfInterest = searchParams.get('areaOfInterest') ?? '';



  const [jobs, setJobs] = useState<Job[] | null>(null);

  const [locations, setLocations] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    let cancelled = false;

    listJobLocations()

      .then((data) => {

        if (!cancelled) setLocations(data);

      })

      .catch(() => {});

    return () => {

      cancelled = true;

    };

  }, []);



  useEffect(() => {

    let cancelled = false;

    setError(null);

    setJobs(null);



    listJobs({

      q: q || undefined,

      location: location || undefined,

      areaOfInterest: areaOfInterest || undefined,

    })

      .then((data) => {

        if (!cancelled) setJobs(data);

      })

      .catch((e) => {

        if (!cancelled) setError(e?.message ?? 'Failed to load jobs.');

      });



    return () => {

      cancelled = true;

    };

  }, [q, location, areaOfInterest]);



  function handleSearch(values: JobSearchValues) {

    const params = new URLSearchParams();

    if (values.q) params.set('q', values.q);

    if (values.location) params.set('location', values.location);

    if (values.areaOfInterest) params.set('areaOfInterest', values.areaOfInterest);

    setSearchParams(params, { replace: true });

  }



  const hasFilters = Boolean(q || location || areaOfInterest);

  const metaTitle = hasFilters

    ? `Search results${q ? ` for "${q}"` : ''}${location ? ` in ${location}` : ''} | ${branding.companyName}`

    : `Open roles | ${branding.companyName}`;



  const metaDescription = hasFilters

    ? `Browse job openings${q ? ` matching "${q}"` : ''}${location ? ` in ${location}` : ''} at ${branding.companyName}.`

    : branding.metaDescription;



  return (

    <>

      <PageMeta title={metaTitle} description={metaDescription} noIndex={hasFilters} />



      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 md:py-12">

        <div className="mb-8">

          <h1 className="text-3xl md:text-4xl font-heading tracking-tight text-charcoal">Open roles</h1>

          <p className="mt-3 text-gray-500 max-w-2xl">
            Start with where you&apos;d like to work, then explore roles that match your interests.
          </p>

        </div>



        <div className="mb-10 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">

          <JobSearchForm

            defaultKeyword={q}

            defaultLocation={location}

            defaultAreaOfInterest={areaOfInterest}

            locations={locations}

            areaOfInterestOptions={careers.areaOfInterest.options}

            areaOfInterestLabel={careers.areaOfInterest.label}

            onSubmit={handleSearch}

            variant="page"

          />

        </div>



        {error ? (

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 text-red-700">{error}</div>

        ) : jobs === null ? (

          <div className="text-gray-500">Loading…</div>

        ) : jobs.length === 0 ? (

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-gray-700">

            {hasFilters ? (

              <>

                No roles match your search

                {q ? ` for "${q}"` : ''}

                {location ? ` in ${location}` : ''}

                {areaOfInterest ? ` in ${areaOfInterest}` : ''}.

                <button

                  type="button"

                  onClick={() => navigate('/jobs')}

                  className="mt-3 block text-sm text-brand-nav-link hover:opacity-80 font-medium"

                >

                  View all open roles

                </button>

              </>

            ) : (

              'No open roles are published yet.'

            )}

          </div>

        ) : (

          <>

            <p className="mb-4 text-sm text-gray-500">

              {jobs.length} {jobs.length === 1 ? 'role' : 'roles'}

              {hasFilters ? ' matching your search' : ' available'}

            </p>

            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        to={`/jobs/${job.slug}`}
                        className="text-xl font-medium text-charcoal hover:text-terracotta transition-colors"
                      >
                        {job.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {job.location ? (
                          <span className="text-sm text-gray-500">{job.location}</span>
                        ) : null}
                        <WorkplaceTypeBadge type={job.workplace_type} />
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {[job.area_of_interest, job.department, job.employment_type]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col sm:flex-row gap-2">
                      <Link
                        to={`/apply/${job.slug}`}
                        className="inline-flex items-center justify-center rounded-xl bg-charcoal text-sand px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Apply now
                      </Link>
                      <Link
                        to={`/jobs/${job.slug}`}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-charcoal hover:border-gray-300 transition-colors"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </>

        )}

      </div>

    </>

  );

}

