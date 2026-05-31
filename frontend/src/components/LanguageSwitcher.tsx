import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  branding as defaultBranding,
  type BrandingConfig,
  type BrandingLanguages,
} from '../config/branding';
import { useBranding } from '../contexts/BrandingContext';

const LOCALE_STORAGE_KEY = 'careers-locale';

const FALLBACK_LANGUAGES: BrandingLanguages = {
  default: 'en',
  options: [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ],
};

function resolveLanguages(config: BrandingConfig): BrandingLanguages {
  const fromConfig = config.languages;
  if (fromConfig?.options?.length === 2) {
    const english =
      fromConfig.options.find((o) => o.code === 'en') ?? { code: 'en', label: 'English' };
    const alternate = fromConfig.options.find((o) => o.code !== 'en') ?? fromConfig.options[1];
    return { default: 'en', options: [english, alternate] };
  }
  return FALLBACK_LANGUAGES;
}

type LanguageSwitcherProps = {
  className?: string;
  variant?: 'header' | 'mobile';
};

export default function LanguageSwitcher({ className = '', variant = 'header' }: LanguageSwitcherProps) {
  const { branding } = useBranding();
  const languages = resolveLanguages(branding);
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState('en');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && languages.options.some((o) => o.code === stored)) {
        setSelectedCode(stored);
      }
    } catch {
      /* ignore */
    }
  }, [languages.options]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected =
    languages.options.find((o) => o.code === selectedCode) ??
    languages.options.find((o) => o.code === 'en') ??
    defaultBranding.languages?.options?.[0] ??
    FALLBACK_LANGUAGES.options[0];

  function selectLanguage(code: string) {
    setSelectedCode(code);
    setOpen(false);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }

  const buttonClass =
    variant === 'header'
      ? 'hidden md:inline-flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity'
      : 'inline-flex w-full items-center justify-between rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-charcoal hover:border-gray-300 transition-colors';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className={buttonClass}
        style={
          variant === 'header'
            ? { color: 'var(--brand-header-text, var(--brand-nav-link))' }
            : undefined
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Languages"
          className={
            variant === 'header'
              ? 'absolute right-0 top-full z-50 mt-1 min-w-[9rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg'
              : 'mt-2 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-sm'
          }
        >
          {languages.options.map((option) => (
            <li key={option.code} role="option" aria-selected={option.code === selectedCode}>
              <button
                type="button"
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                  option.code === selectedCode ? 'font-semibold text-brand-primary' : 'text-charcoal'
                }`}
                onClick={() => selectLanguage(option.code)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
