import type { FooterSocialPlatform } from '../config/branding';
import {
  getFooterCopyrightText,
  getFooterLegalLinks,
  getFooterSocialLinks,
} from '../config/branding';
import { useBranding } from '../contexts/BrandingContext';

const socialLabels: Record<FooterSocialPlatform, string> = {
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  glassdoor: 'Glassdoor',
  youtube: 'YouTube',
};

function FooterSocialIcon({ platform }: { platform: FooterSocialPlatform }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM17.75 6a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 17.75 6z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M4.98 3.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5zM3.75 9h2.46v12H3.75V9zm6.24 0h2.36v1.64h.03c.33-.62 1.14-1.28 2.35-1.28 2.51 0 2.97 1.65 2.97 3.8V21h-2.46v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94V21H9.99V9z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M13.5 3h3.75c.41 0 .75.34.75.75V9h3.5c.08 0 .15.03.2.08l.05.05a.25.25 0 0 1 .05.2l-.75 4.5a.25.25 0 0 1-.25.21h-3.05v7.21a.75.75 0 0 1-.75.75h-3.5a.75.75 0 0 1-.75-.75V14H9.75a.25.25 0 0 1-.25-.25v-3.5c0-.14.11-.25.25-.25H11V7.5c0-2.49 2.01-4.5 4.5-4.5z" />
        </svg>
      );
    case 'glassdoor':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h16v4H4v-4z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M21.8 8.001a2.75 2.75 0 0 0-1.93-1.95C18.2 5.75 12 5.75 12 5.75s-6.2 0-7.87.301A2.75 2.75 0 0 0 2.2 8.001 28.9 28.9 0 0 0 1.9 12a28.9 28.9 0 0 0 .3 3.999 2.75 2.75 0 0 0 1.93 1.95C5.8 18.25 12 18.25 12 18.25s6.2 0 7.87-.301a2.75 2.75 0 0 0 1.93-1.95c.2-1.32.301-2.667.301-3.999s-.101-2.679-.301-3.999zM10.2 14.9V9.1L15.45 12 10.2 14.9z" />
        </svg>
      );
  }
}

export default function CareersFooter() {
  const { branding } = useBranding();
  const legalLinks = getFooterLegalLinks(branding.footer);
  const socialLinks = getFooterSocialLinks(branding.footer);
  const copyrightText = getFooterCopyrightText(branding);

  if (legalLinks.length === 0 && socialLinks.length === 0 && !copyrightText) {
    return null;
  }

  return (
    <footer className="bg-brand-footer text-white">
      <div
        className="h-0.5 w-full bg-brand-footer-accent-border"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {legalLinks.length > 0 && (
            <nav aria-label="Legal and policy links">
              <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {legalLinks.map((link, index) => (
                  <li key={link.key} className="flex items-center gap-2">
                    {index > 0 && (
                      <span className="text-white/60" aria-hidden="true">
                        ·
                      </span>
                    )}
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/90 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:justify-end">
            <p className="min-w-0 text-sm text-white/90">{copyrightText}</p>

            {socialLinks.length > 0 && (
              <>
                <span
                  className="hidden sm:block h-4 w-px bg-white/30"
                  aria-hidden="true"
                />
                <nav aria-label="Social media links">
                  <ul className="flex flex-wrap items-center gap-4">
                    {socialLinks.map((link) => (
                      <li key={link.platform}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={socialLabels[link.platform]}
                          className="inline-flex items-center justify-center text-white/90 hover:text-white transition-colors"
                        >
                          <FooterSocialIcon platform={link.platform} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
