import { Link } from 'react-router-dom';

type ApplicationSuccessProps = {
  applicationCode: string;
};

export default function ApplicationSuccess({ applicationCode }: ApplicationSuccessProps) {
  return (
    <div className="mt-8 rounded-2xl bg-sand p-6">
      <div className="text-lg font-medium">Application submitted.</div>
      <div className="mt-2 text-sm text-gray-600">
        Save your application code. You can create an account later to manage your data and applications.
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <Link
          to={`/register?code=${encodeURIComponent(applicationCode)}`}
          className="inline-flex items-center justify-center rounded-xl bg-charcoal text-sand px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Create candidate account
        </Link>
        <Link
          to="/jobs"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-charcoal hover:border-gray-300 transition-colors"
        >
          Back to jobs
        </Link>
      </div>
    </div>
  );
}
