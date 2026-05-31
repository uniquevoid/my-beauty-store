import { useMemo, useState } from 'react';

import { useBranding } from '../../contexts/BrandingContext';

const MAX_LOGOS_PER_SLIDE = 5;

function chunk<T>(items: T[], size: number): T[][] {
  const slides: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    slides.push(items.slice(i, i + size));
  }
  return slides;
}

function logoGridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-2 sm:grid-cols-3';
  if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
  return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5';
}

function LogoPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="flex h-12 w-full items-center justify-center rounded-lg bg-gray-50 text-sm font-semibold text-brand-text/60">
      {initials}
    </div>
  );
}

export default function CustomersSection() {
  const { branding } = useBranding();
  const { customers } = branding.landing;
  const logosPerSlide = Math.min(MAX_LOGOS_PER_SLIDE, customers.logos.length);
  const slides = useMemo(
    () => chunk(customers.logos, logosPerSlide),
    [customers.logos, logosPerSlide],
  );
  const [activeSlide, setActiveSlide] = useState(0);

  if (customers.logos.length < 2) return null;

  const currentLogos = slides[activeSlide] ?? [];

  return (
    <section id="customers" className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <h2 className="text-center text-2xl md:text-3xl font-heading text-brand-primary">
          {customers.heading}
        </h2>

        <div
          className={`mt-10 grid ${logoGridClass(currentLogos.length)} gap-6 md:gap-8 items-center justify-items-center mx-auto max-w-5xl`}
        >
          {currentLogos.map((logo) => (
            <div key={logo.name} className="flex w-full items-center justify-center px-2">
              {logo.imageUrl ? (
                <img
                  src={logo.imageUrl}
                  alt={logo.name}
                  className="max-h-12 w-full object-contain"
                />
              ) : (
                <LogoPlaceholder name={logo.name} />
              )}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show customer logos slide ${index + 1}`}
                aria-current={index === activeSlide ? 'true' : undefined}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === activeSlide ? 'bg-brand-primary' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
