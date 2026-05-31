import { useBranding } from '../../contexts/BrandingContext';

import OptionalExternalLink from '../OptionalExternalLink';

import JobAlertsIllustration from '../job-alerts/JobAlertsIllustration';
import { resolveSectionStockImage } from '../../config/section-stock-images';

export default function CultureSpotlightSection() {
  const { branding } = useBranding();
  const spotlight = branding.landing.cultureSpotlight;

  if (!spotlight?.articleUrl?.trim() || !spotlight.body?.trim()) {
    return null;
  }

  return (
    <section
      id="culture-spotlight"
      className="py-12 md:py-16 bg-brand-background text-brand-text"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold leading-tight text-brand-text">
              {spotlight.heading}
            </h2>
            <p className="mt-6 text-brand-text/80 leading-relaxed max-w-lg">{spotlight.body}</p>
            {spotlight.articleTitle && (
              <p className="mt-4 text-sm font-semibold text-brand-highlight">
                {spotlight.articleTitle}
              </p>
            )}
            <OptionalExternalLink
              href={spotlight.articleUrl}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground px-8 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {spotlight.ctaLabel}
            </OptionalExternalLink>
          </div>

          <div className="lg:pl-8">
            <JobAlertsIllustration
              imageUrl={spotlight.imageUrl}
              fallbackImageUrl={resolveSectionStockImage('cultureSpotlight')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
