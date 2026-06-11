import { useEffect, useId, useState } from 'react';

import type { JobSearchSuggestion } from '../api/jobs';
import JobSearchAutocomplete from './JobSearchAutocomplete';



export type JobSearchValues = {

  q: string;

  location: string;

  areaOfInterest: string;

};



type JobSearchFormProps = {

  defaultKeyword?: string;

  defaultLocation?: string;

  defaultAreaOfInterest?: string;

  locations?: string[];

  areaOfInterestOptions?: string[];

  areaOfInterestLabel?: string;

  onSubmit: (values: JobSearchValues) => void;

  variant?: 'hero' | 'page';

  className?: string;

};



export default function JobSearchForm({

  defaultKeyword = '',

  defaultLocation = '',

  defaultAreaOfInterest = '',

  locations = [],

  areaOfInterestOptions = [],

  areaOfInterestLabel = 'Area of Interest',

  onSubmit,

  variant = 'hero',

  className = '',

}: JobSearchFormProps) {

  const keywordId = useId();

  const locationId = useId();

  const areaId = useId();

  const [keyword, setKeyword] = useState(defaultKeyword);

  const [location, setLocation] = useState(defaultLocation);

  const [areaOfInterest, setAreaOfInterest] = useState(defaultAreaOfInterest);



  useEffect(() => {

    setKeyword(defaultKeyword);

  }, [defaultKeyword]);



  useEffect(() => {

    setLocation(defaultLocation);

  }, [defaultLocation]);



  useEffect(() => {

    setAreaOfInterest(defaultAreaOfInterest);

  }, [defaultAreaOfInterest]);



  const isHero = variant === 'hero';

  const labelClass = isHero

    ? 'text-sm font-medium text-white/90'

    : 'text-sm font-medium text-charcoal';

  const inputClass = isHero

    ? 'w-full rounded-md border-0 bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary'

    : 'w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent';

  const selectClass = inputClass;



  function submitValues(nextKeyword = keyword) {
    onSubmit({
      q: nextKeyword.trim(),
      location: location.trim(),
      areaOfInterest: areaOfInterest.trim(),
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitValues();
  }

  function handleSuggestionSelect(suggestion: JobSearchSuggestion) {
    setKeyword(suggestion.title);
    submitValues(suggestion.title);
  }



  return (

    <form

      role="search"

      aria-label="Job search"

      onSubmit={handleSubmit}

      className={`${className}`}

    >

      <div className="flex flex-col lg:flex-row lg:items-end gap-4">

        <div className="flex-1 min-w-0">

          <label htmlFor={keywordId} className={labelClass}>

            Keywords

          </label>

          <div className="mt-1.5">
            <JobSearchAutocomplete
              id={keywordId}
              value={keyword}
              variant={variant}
              inputClassName={inputClass}
              onChange={setKeyword}
              onSuggestionSelect={handleSuggestionSelect}
            />
          </div>

        </div>



        <div className="flex-1 min-w-0 lg:max-w-xs">

          <label htmlFor={locationId} className={labelClass}>

            Location

          </label>

          <select

            id={locationId}

            name="location"

            value={location}

            onChange={(e) => setLocation(e.target.value)}

            className={`mt-1.5 ${selectClass}`}

          >

            <option value="">All Locations</option>

            {locations.map((loc) => (

              <option key={loc} value={loc}>

                {loc}

              </option>

            ))}

          </select>

        </div>



        {areaOfInterestOptions.length > 0 ? (

          <div className="flex-1 min-w-0 lg:max-w-xs">

            <label htmlFor={areaId} className={labelClass}>

              {areaOfInterestLabel}

            </label>

            <select

              id={areaId}

              name="areaOfInterest"

              value={areaOfInterest}

              onChange={(e) => setAreaOfInterest(e.target.value)}

              className={`mt-1.5 ${selectClass}`}

            >

              <option value="">All areas</option>

              {areaOfInterestOptions.map((area) => (

                <option key={area} value={area}>

                  {area}

                </option>

              ))}

            </select>

          </div>

        ) : null}



        <div className="lg:pb-0.5">

          <button

            type="submit"

            className="w-full lg:w-auto inline-flex items-center justify-center px-8 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            style={{
              backgroundColor: 'var(--brand-btn-bg, var(--brand-primary))',
              color: 'var(--brand-btn-text, var(--brand-primary-foreground))',
              borderRadius: 'var(--brand-btn-radius, 9999px)',
            }}

          >

            Search

          </button>

        </div>

      </div>

    </form>

  );

}

