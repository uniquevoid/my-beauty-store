import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type JobAlertsPageChromeProps = {
  children: ReactNode;
  breadcrumb?: string;
};

export default function JobAlertsPageChrome({ children, breadcrumb = 'Job Alert' }: JobAlertsPageChromeProps) {
  return (
    <div className="bg-brand-background min-h-[60vh]">
      <div
        className="relative overflow-hidden bg-gradient-to-br from-brand-highlight via-brand-primary to-brand-primary px-4 sm:px-8 py-14 md:py-16"
        aria-hidden="false"
      >
        <div
          className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-brand-highlight/30 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-sans font-bold text-white">Job alerts</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <nav className="py-4 text-sm font-semibold text-gray-700" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-primary transition-colors">
            Home
          </Link>
          <span className="mx-2 text-gray-400" aria-hidden="true">
            |
          </span>
          <span>{breadcrumb}</span>
        </nav>
      </div>

      {children}
    </div>
  );
}
