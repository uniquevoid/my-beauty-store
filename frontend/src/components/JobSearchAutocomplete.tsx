import { useEffect, useId, useRef, useState } from 'react';
import { listJobSearchSuggestions, type JobSearchSuggestion } from '../api/jobs';

type JobSearchAutocompleteProps = {
  id: string;
  value: string;
  placeholder?: string;
  variant: 'hero' | 'page';
  inputClassName: string;
  onChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: JobSearchSuggestion) => void;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

export default function JobSearchAutocomplete({
  id,
  value,
  placeholder = 'Search by title',
  variant,
  inputClassName,
  onChange,
  onSuggestionSelect,
}: JobSearchAutocompleteProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<JobSearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      setFetchError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchError(false);

    const timer = window.setTimeout(() => {
      listJobSearchSuggestions(trimmed)
        .then((data) => {
          if (cancelled) return;
          setSuggestions(data);
          setOpen(data.length > 0);
          setActiveIndex(data.length > 0 ? 0 : -1);
        })
        .catch(() => {
          if (cancelled) return;
          setSuggestions([]);
          setOpen(false);
          setActiveIndex(-1);
          setFetchError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function closeList() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function selectSuggestion(suggestion: JobSearchSuggestion) {
    onChange(suggestion.title);
    onSuggestionSelect?.(suggestion);
    closeList();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === 'ArrowDown' && suggestions.length > 0) {
        setOpen(true);
        setActiveIndex(0);
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeIndex];
      if (suggestion) selectSuggestion(suggestion);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeList();
    }
  }

  const panelClass =
    variant === 'hero'
      ? 'rounded-md border border-white/20 bg-white shadow-lg ring-1 ring-black/5'
      : 'rounded-md border border-gray-200 bg-white shadow-lg ring-1 ring-black/5';

  const optionClass = (active: boolean) =>
    [
      'cursor-pointer px-3 py-2.5 text-sm transition-colors',
      active ? 'bg-brand-primary/10 text-charcoal' : 'text-charcoal hover:bg-gray-50',
    ].join(' ');

  const statusId = `${id}-status`;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        name="q"
        type="search"
        role="combobox"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        aria-describedby={statusId}
        className={inputClassName}
      />

      <span id={statusId} className="sr-only" aria-live="polite">
        {loading
          ? 'Loading suggestions'
          : fetchError
            ? 'Suggestions unavailable'
            : open
              ? `${suggestions.length} suggestions available`
              : ''}
      </span>

      {open && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Job title suggestions"
          className={`absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-auto ${panelClass}`}
        >
          {suggestions.map((suggestion, index) => {
            const meta = [suggestion.location, suggestion.department]
              .filter(Boolean)
              .join(' · ');

            return (
              <li
                key={suggestion.slug}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={optionClass(index === activeIndex)}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="block font-medium leading-snug">{suggestion.title}</span>
                {meta ? (
                  <span className="mt-0.5 block text-xs text-gray-500">{meta}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
