import { Link } from 'react-router-dom';

export default function RecommendationsCta() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <h2 className="text-xl md:text-2xl font-heading text-brand-text">Not sure where to start?</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/recommendations"
            className="inline-flex items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Get recommendations
          </Link>
          <Link
            to="/jobs"
            className="inline-flex items-center justify-center rounded-full border-2 border-brand-accent text-brand-accent bg-brand-background px-6 py-3 text-sm font-semibold hover:bg-brand-accent/10 transition-colors"
          >
            See all open positions
          </Link>
        </div>
      </div>
    </section>
  );
}
