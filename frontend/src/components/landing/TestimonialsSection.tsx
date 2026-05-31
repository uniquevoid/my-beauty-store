import { useState } from 'react';

import { useBranding } from '../../contexts/BrandingContext';



function AvatarFallback({ name }: { name: string }) {

  const initials = name

    .split(/\s+/)

    .slice(0, 2)

    .map((part) => part.charAt(0).toUpperCase())

    .join('');



  return (

    <span className="flex h-full w-full items-center justify-center bg-white/40 text-xs font-semibold text-brand-primary-foreground">

      {initials}

    </span>

  );

}



export default function TestimonialsSection() {

  const { branding } = useBranding();

  const { testimonials } = branding.landing;

  const [activeIndex, setActiveIndex] = useState(0);



  if (testimonials.items.length === 0) return null;



  const active = testimonials.items[activeIndex] ?? testimonials.items[0];

  if (!active) return null;



  return (

    <section id="testimonials" className="py-12 md:py-16 bg-brand-primary text-brand-primary-foreground">

      <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">

        <div className="text-5xl md:text-6xl font-heading leading-none opacity-90" aria-hidden="true">

          &ldquo;

        </div>



        <blockquote className="mt-4 text-lg md:text-xl leading-relaxed font-light">

          {active.quote}

        </blockquote>



        <div className="mt-8">

          <div className="font-semibold">{active.name}</div>

          {active.role && (

            <div className="mt-1 text-sm text-brand-muted-on-primary">{active.role}</div>

          )}

        </div>



        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">

          {testimonials.items.map((item, index) => (

            <button

              key={item.name}

              type="button"

              aria-label={`Show testimonial from ${item.name}`}

              aria-current={index === activeIndex ? 'true' : undefined}

              onClick={() => setActiveIndex(index)}

              className={`h-12 w-12 overflow-hidden rounded-full transition-all ${

                index === activeIndex

                  ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-primary'

                  : 'ring-1 ring-white/70 hover:ring-white'

              }`}

            >

              {item.avatarUrl ? (

                <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />

              ) : (

                <AvatarFallback name={item.name} />

              )}

            </button>

          ))}

        </div>

      </div>

    </section>

  );

}


