import { useBranding } from '../../contexts/BrandingContext';

import OptionalExternalLink from '../OptionalExternalLink';



export default function TechnologySection() {

  const { branding } = useBranding();

  const { technology } = branding.landing;



  if (!technology.body?.trim()) return null;



  return (

    <section id="technology" className="py-12 md:py-16">

      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100">

          <div className="grid grid-cols-1 md:grid-cols-2">

            {technology.imageUrl && (

              <div className="relative min-h-[240px] md:min-h-[320px]">

                <img

                  src={technology.imageUrl}

                  alt=""

                  className="absolute inset-0 h-full w-full object-cover"

                />

              </div>

            )}



            <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">

              <h2 className="text-2xl md:text-3xl font-heading text-brand-primary">{technology.heading}</h2>

              <p className="mt-4 text-brand-text/80 leading-relaxed">{technology.body}</p>

              <OptionalExternalLink

                href={technology.ctaHref}

                className="mt-6 inline-flex text-sm font-semibold text-brand-primary hover:opacity-80 transition-opacity"

              >

                {technology.ctaLabel}

              </OptionalExternalLink>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}


