import HomeHero from '../components/HomeHero';
import AboutSection from '../components/landing/AboutSection';
import CoreValuesSection from '../components/landing/CoreValuesSection';
import CustomersSection from '../components/landing/CustomersSection';
import CultureSpotlightSection from '../components/landing/CultureSpotlightSection';
import JobAlertsCtaSection from '../components/landing/JobAlertsCtaSection';
import LifeAtSection from '../components/landing/LifeAtSection';
import TechnologySection from '../components/landing/TechnologySection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import RecommendationsCta from '../components/RecommendationsCta';
import { useBranding } from '../contexts/BrandingContext';
import { resolveLandingSections } from '../lib/landing-sections';
import { PageMeta } from '../seo/PageMeta';

export default function HomePage() {
  const { branding, loading } = useBranding();
  const sections = resolveLandingSections(branding);

  if (loading) {
    return (
      <>
        <PageMeta title="Careers" description="Loading careers site…" />
        <div className="min-h-[50vh] flex items-center justify-center bg-brand-background">
          <p className="text-sm text-brand-text/60">Loading careers site…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`Careers at ${branding.companyName}`}
        description={branding.metaDescription}
      />

      <div className="w-full">
        <HomeHero />
        <RecommendationsCta />

        {sections.about && <AboutSection />}
        {sections.customers && <CustomersSection />}
        {sections.technology && <TechnologySection />}
        {sections.coreValues && <CoreValuesSection />}
        {sections.lifeAt && <LifeAtSection />}
        {sections.testimonials && <TestimonialsSection />}
        {sections.cultureSpotlight && <CultureSpotlightSection />}
        {sections.jobAlerts && <JobAlertsCtaSection />}
      </div>
    </>
  );
}
