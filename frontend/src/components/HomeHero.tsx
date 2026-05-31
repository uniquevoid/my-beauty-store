import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listJobLocations } from '../api/jobs';
import { getHeroHeadingClassName } from '../config/branding';
import { useBranding } from '../contexts/BrandingContext';
import { useCareers } from '../contexts/CareersContext';
import JobSearchForm, { type JobSearchValues } from './JobSearchForm';

function buildJobsSearchUrl(values: JobSearchValues) {
  const params = new URLSearchParams();
  if (values.q) params.set('q', values.q);
  if (values.location) params.set('location', values.location);
  if (values.areaOfInterest) params.set('areaOfInterest', values.areaOfInterest);
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : '/jobs';
}

export default function HomeHero() {
  const navigate = useNavigate();
  const { careers } = useCareers();
  const { branding: tenantBranding } = useBranding();
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    listJobLocations()
      .then((data) => {
        if (!cancelled) setLocations(data);
      })
      .catch(() => {
        // Location dropdown falls back to "All Locations" only
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(values: JobSearchValues) {
    navigate(buildJobsSearchUrl(values));
  }

  const { hero } = tenantBranding;
  const heroVideo = tenantBranding.assets?.heroVideoUrl;
  const heroImage =
    hero.backgroundImageUrl ?? tenantBranding.assets?.heroBackgroundImageUrl;
  const headingClass = getHeroHeadingClassName(tenantBranding);
  const heroTextColor = tenantBranding.colors.heroTextForeground ?? '#FFFFFF';
  const heroSubtextColor =
    heroTextColor.toLowerCase() === '#ffffff'
      ? 'rgba(255, 255, 255, 0.85)'
      : `${heroTextColor}D9`;

  return (
    <section className="relative w-full overflow-hidden min-h-[520px] md:min-h-[560px] lg:min-h-[600px]">
      {heroVideo ? (
        <video
          src={heroVideo}
          className="absolute inset-0 w-full h-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      ) : null}
      {!heroVideo && heroImage ? (
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          fetchPriority="high"
        />
      ) : null}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-hero-overlay"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-brand-accent text-brand-accent-foreground px-4 py-1 text-xs font-semibold tracking-wide">
            {hero.badgeText}
          </span>

          <h1
            className={`mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-heading font-bold leading-tight tracking-tight ${headingClass}`}
            style={{ color: heroTextColor }}
          >
            {hero.headline}
          </h1>

          {hero.subheadline && (
            <p
              className="mt-4 text-base md:text-lg max-w-xl leading-relaxed"
              style={{ color: heroSubtextColor }}
            >
              {hero.subheadline}
            </p>
          )}

          <div className="mt-8 md:mt-10">
            <JobSearchForm
              locations={locations}
              areaOfInterestOptions={careers.areaOfInterest.options}
              areaOfInterestLabel={careers.areaOfInterest.label}
              onSubmit={handleSearch}
              variant="hero"
            />
          </div>
        </div>
      </div>

      {/* Decorative bottom curve */}
      <div className="absolute bottom-0 left-0 right-0 h-8 md:h-12 overflow-hidden pointer-events-none" aria-hidden="true">
        <svg
          viewBox="0 0 1440 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 48V24C240 0 480 0 720 12C960 24 1200 48 1440 24V48H0Z"
            fill="var(--brand-background, #FAF7F2)"
          />
        </svg>
      </div>
    </section>
  );
}
