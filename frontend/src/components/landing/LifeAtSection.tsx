import { useBranding } from '../../contexts/BrandingContext';

import OptionalExternalLink from '../OptionalExternalLink';



export default function LifeAtSection() {

  const { branding } = useBranding();

  const { lifeAt } = branding.landing;



  if (!lifeAt.heading?.trim()) return null;

  if (!lifeAt.subheading?.trim() && !lifeAt.leftImageUrl && !lifeAt.rightImageUrl) return null;



  return (

    <section id="life-at" className="py-12 md:py-16">

      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <div className="grid grid-cols-1 md:grid-cols-3 overflow-hidden rounded-3xl shadow-sm">

          {lifeAt.leftImageUrl && (

            <div className="relative min-h-[240px] md:min-h-[360px]">

              <img

                src={lifeAt.leftImageUrl}

                alt=""

                className="absolute inset-0 h-full w-full object-cover"

              />

            </div>

          )}



          <div className="flex flex-col items-start justify-center bg-brand-primary text-brand-primary-foreground p-8 md:p-10">

            <h2 className="text-2xl md:text-3xl font-heading">{lifeAt.heading}</h2>

            {lifeAt.subheading && (

              <p className="mt-3 text-brand-muted-on-primary leading-relaxed">{lifeAt.subheading}</p>

            )}

            <OptionalExternalLink

              href={lifeAt.ctaHref}

              className="mt-6 inline-flex items-center justify-center rounded-full bg-white text-brand-primary px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"

            >

              {lifeAt.ctaLabel}

            </OptionalExternalLink>

          </div>



          {lifeAt.rightImageUrl && (

            <div className="relative min-h-[240px] md:min-h-[360px]">

              <img

                src={lifeAt.rightImageUrl}

                alt=""

                className="absolute inset-0 h-full w-full object-cover"

              />

            </div>

          )}

        </div>

      </div>

    </section>

  );

}


