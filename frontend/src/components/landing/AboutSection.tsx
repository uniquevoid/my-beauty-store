import { useBranding } from '../../contexts/BrandingContext';

import OptionalExternalLink from '../OptionalExternalLink';

function statsGridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
  return 'grid-cols-2 md:grid-cols-4';
}

export default function AboutSection() {

  const { branding } = useBranding();

  const { about } = branding.landing;



  if (!about.body?.trim()) return null;



  return (

    <section id="about" className="relative overflow-hidden py-12 md:py-20">

      <div

        className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-brand-highlight/10 blur-3xl md:h-96 md:w-96"

        aria-hidden="true"

      />

      <div

        className="pointer-events-none absolute right-0 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-brand-primary/5 blur-2xl"

        aria-hidden="true"

      />



      <div className="relative max-w-7xl mx-auto px-4 sm:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          <div className={about.stats.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'}>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading text-brand-text">{about.heading}</h2>

            <p className="mt-4 text-brand-text/80 leading-relaxed max-w-xl">{about.body}</p>

            <OptionalExternalLink

              href={about.ctaHref}

              className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"

            >

              {about.ctaLabel}

            </OptionalExternalLink>

          </div>



          {about.stats.length > 0 && (

            <div className="lg:col-span-6">

              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">

                <div className={`grid ${statsGridClass(about.stats.length)} gap-6`}>

                  {about.stats.map((stat) => (

                    <div key={stat.label} className="text-center md:text-left">

                      <div className="text-3xl md:text-4xl font-bold text-brand-highlight">{stat.value}</div>

                      <div className="mt-1 text-sm text-brand-text/80 leading-snug">{stat.label}</div>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </section>

  );

}


