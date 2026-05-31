import { Link } from 'react-router-dom';
import type { JobSummary } from '../api/jobs';
import WorkplaceTypeBadge from './WorkplaceTypeBadge';

type RelatedJobsSidebarProps = {
  jobSlug: string;
  relatedJobs: JobSummary[];
  showApplyActions?: boolean;
};

function ApplyActions({ jobSlug, className }: { jobSlug: string; className?: string }) {
  return (
    <div className={className}>
      <Link
        to={`/apply/${jobSlug}`}
        className="inline-flex w-full items-center justify-center rounded-xl bg-charcoal text-sand px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Apply now
      </Link>
      <Link
        to="/login"
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-charcoal hover:border-gray-300 transition-colors"
      >
        Already applied? Sign in
      </Link>
    </div>
  );
}

export default function RelatedJobsSidebar({
  jobSlug,
  relatedJobs,
  showApplyActions = true,
}: RelatedJobsSidebarProps) {
  return (
    <aside className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:sticky lg:top-8">
        {showApplyActions ? <ApplyActions jobSlug={jobSlug} /> : null}

        {relatedJobs.length > 0 ? (
          <div className={showApplyActions ? 'mt-8 border-t border-gray-100 pt-6' : undefined}>
            <h2 className="text-base font-semibold text-charcoal">Related jobs</h2>
            <ul className="mt-4 space-y-4">
              {relatedJobs.map((relatedJob) => (
                <li key={relatedJob.id} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                  <Link
                    to={`/jobs/${relatedJob.slug}`}
                    className="text-sm font-medium text-charcoal hover:text-terracotta transition-colors"
                  >
                    {relatedJob.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {relatedJob.location ? (
                      <span className="text-xs text-gray-500">{relatedJob.location}</span>
                    ) : null}
                    <WorkplaceTypeBadge type={relatedJob.workplace_type} />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {[relatedJob.department, relatedJob.area_of_interest, relatedJob.employment_type]
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function JobDetailApplyActions({ jobSlug }: { jobSlug: string }) {
  return <ApplyActions jobSlug={jobSlug} className="flex flex-col sm:flex-row lg:flex-col gap-3" />;
}
