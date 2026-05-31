import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getJob, type JobDetail } from '../api/jobs';
import JobDescriptionContent from '../components/JobDescriptionContent';
import RelatedJobsSidebar, { JobDetailApplyActions } from '../components/RelatedJobsSidebar';
import WorkplaceTypeBadge from '../components/WorkplaceTypeBadge';
import { branding } from '../config/branding';
import { PageMeta } from '../seo/PageMeta';
import { plainTextFromDescription } from '../utils/parseJobDescription';

export default function JobDetailPage() {
  const params = useParams();
  const slug = useMemo(() => params.slug ?? '', [params.slug]);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!slug) return;

    getJob(slug)
      .then((data) => {
        if (!cancelled) setJob(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load job.');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const metaDescription = job?.description
    ? plainTextFromDescription(job.description)
    : `Apply for ${job?.title ?? 'this role'} at ${branding.companyName}.`;

  return (
    <>
      {job && (
        <PageMeta
          title={`${job.title} | ${branding.companyName}`}
          description={metaDescription}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="mb-6">
          <Link to="/jobs" className="text-sm text-gray-500 hover:text-terracotta transition-colors">
            ← Back to jobs
          </Link>
        </div>

        {error ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 text-red-700">{error}</div>
        ) : !job ? (
          <div className="text-gray-500">Loading…</div>
        ) : (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 lg:items-start">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h1 className="text-3xl md:text-4xl font-heading tracking-tight">{job.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {job.location ? <span className="text-sm text-gray-500">{job.location}</span> : null}
                <WorkplaceTypeBadge type={job.workplace_type} />
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {[job.area_of_interest, job.department, job.employment_type].filter(Boolean).join(' • ')}
              </div>

              <div className="mt-8">
                {job.description ? (
                  <JobDescriptionContent description={job.description} />
                ) : (
                  <p className="text-gray-500">No description provided.</p>
                )}
              </div>

              <div className="mt-10 lg:hidden">
                <JobDetailApplyActions jobSlug={job.slug} />
              </div>
            </div>

            <div className="hidden lg:block">
              <RelatedJobsSidebar jobSlug={job.slug} relatedJobs={job.related_jobs ?? []} />
            </div>

            {job.related_jobs?.length ? (
              <div className="mt-6 lg:hidden">
                <RelatedJobsSidebar
                  jobSlug={job.slug}
                  relatedJobs={job.related_jobs}
                  showApplyActions={false}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
