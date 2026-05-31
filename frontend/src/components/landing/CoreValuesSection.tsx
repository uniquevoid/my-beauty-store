import {

  Heart,

  Handshake,

  Move,

  RefreshCw,

  Smile,

  Sparkles,

  type LucideIcon,

} from 'lucide-react';

import { useBranding } from '../../contexts/BrandingContext';

import type { CoreValueIcon } from '../../config/branding';



const iconMap: Record<CoreValueIcon, LucideIcon> = {

  smile: Smile,

  sparkles: Sparkles,

  handshake: Handshake,

  move: Move,

  'refresh-cw': RefreshCw,

  heart: Heart,

};



export default function CoreValuesSection() {

  const { branding } = useBranding();

  const { coreValues } = branding.landing;



  if (coreValues.values.length < 2) return null;



  const firstRow = coreValues.values.slice(0, 4);

  const secondRow = coreValues.values.slice(4);



  return (

    <section

      id="values"

      className="py-12 md:py-20 bg-gradient-to-br from-white via-white to-brand-highlight/10"

    >

      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <h2 className="text-2xl md:text-3xl font-heading text-brand-text">{coreValues.heading}</h2>



        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">

          {firstRow.map((value) => {

            const Icon = iconMap[value.icon as CoreValueIcon] ?? Smile;

            return (

              <div

                key={value.label}

                className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-gray-100 text-center"

              >

                <Icon className="h-10 w-10 text-brand-primary" strokeWidth={1.5} aria-hidden="true" />

                <div className="mt-4 text-sm md:text-base font-semibold text-brand-text">{value.label}</div>

              </div>

            );

          })}

        </div>



        {secondRow.length > 0 && (

          <div className="mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">

            {secondRow.map((value) => {

              const Icon = iconMap[value.icon as CoreValueIcon] ?? Smile;

              return (

                <div

                  key={value.label}

                  className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-gray-100 text-center"

                >

                  <Icon className="h-10 w-10 text-brand-primary" strokeWidth={1.5} aria-hidden="true" />

                  <div className="mt-4 text-sm md:text-base font-semibold text-brand-text">{value.label}</div>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </section>

  );

}


