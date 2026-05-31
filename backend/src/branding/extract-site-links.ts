export type FooterLegalLinkKey = 'cookieNotice' | 'ethics' | 'legal' | 'privacyNotice';

export type FooterSocialPlatform =
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'glassdoor'
  | 'youtube';

export type ExtractedSiteLink = {
  href: string;
  text: string;
};

export type ExtractedSiteLinks = {
  socialLinks: Partial<Record<FooterSocialPlatform, string>>;
  legalLinks: Partial<Record<FooterLegalLinkKey, string>>;
  copyright?: string;
};

export type ExtractedSiteLanguages = {
  default: 'en';
  options: { code: string; label: string }[];
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  pt: 'Português',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
};

const LANGUAGE_TEXT_PATTERNS: { code: string; pattern: RegExp }[] = [
  { code: 'en', pattern: /\benglish\b/i },
  { code: 'es', pattern: /\bespa[nñ]ol\b/i },
  { code: 'de', pattern: /\bdeutsch\b|\bgerman\b/i },
  { code: 'fr', pattern: /\bfran[cç]ais\b|\bfrench\b/i },
  { code: 'pt', pattern: /\bportugu[eê]s\b|\bportuguese\b/i },
  { code: 'it', pattern: /\bitaliano\b|\bitalian\b/i },
  { code: 'nl', pattern: /\bnederlands\b|\bdutch\b/i },
];

export function classifySocialUrl(url: string): FooterSocialPlatform | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('linkedin')) return 'linkedin';
    if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('twitter') || host === 'x.com' || host.endsWith('.x.com')) return 'twitter';
    if (host.includes('facebook') || host.includes('fb.com')) return 'facebook';
    if (host.includes('glassdoor')) return 'glassdoor';
  } catch {
    return null;
  }
  return null;
}

export function classifyLegalLink(text: string, url: string): FooterLegalLinkKey | null {
  const combined = `${text} ${url}`.toLowerCase();
  if (/\bcookie/i.test(combined)) return 'cookieNotice';
  if (/\bethic|ético|canal/i.test(combined)) return 'ethics';
  if (/\bprivacy|privacidad|aviso|legal advice|gdpr/i.test(combined)) return 'privacyNotice';
  if (/\bterms|legal|conditions|impressum/i.test(combined)) return 'legal';
  return null;
}

export function buildSiteLinksFromAnchors(
  anchors: ExtractedSiteLink[],
  companyName: string,
): ExtractedSiteLinks {
  const socialLinks: Partial<Record<FooterSocialPlatform, string>> = {};
  const legalLinks: Partial<Record<FooterLegalLinkKey, string>> = {};
  let copyright: string | undefined;

  for (const anchor of anchors) {
    const href = anchor.href?.trim();
    const text = anchor.text?.trim() ?? '';
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

    const social = classifySocialUrl(href);
    if (social && !socialLinks[social]) {
      socialLinks[social] = href;
      continue;
    }

    const legal = classifyLegalLink(text, href);
    if (legal && !legalLinks[legal]) {
      legalLinks[legal] = href;
      continue;
    }

    if (!copyright && /©|copyright/i.test(text) && text.length < 200) {
      copyright = text.replace(/\d{4}/, '{year}');
    }
  }

  if (!copyright && companyName) {
    copyright = `Copyright © {year} ${companyName}. All Rights Reserved.`;
  }

  return { socialLinks, legalLinks, copyright };
}

function labelForLanguageCode(code: string, fallbackText?: string): string {
  const normalized = code.toLowerCase().split('-')[0] ?? code;
  if (LANGUAGE_LABELS[normalized]) return LANGUAGE_LABELS[normalized];
  if (fallbackText?.trim()) return fallbackText.trim().slice(0, 32);
  return normalized.toUpperCase();
}

export function buildSiteLanguagesFromSignals(
  signals: { code: string; label?: string }[],
): ExtractedSiteLanguages | undefined {
  const seen = new Set<string>();
  const options: { code: string; label: string }[] = [];

  for (const signal of signals) {
    const code = signal.code.toLowerCase().split('-')[0] ?? signal.code;
    if (!code || seen.has(code)) continue;
    seen.add(code);
    options.push({ code, label: labelForLanguageCode(code, signal.label) });
  }

  if (!seen.has('en')) {
    options.unshift({ code: 'en', label: 'English' });
    seen.add('en');
  }

  const alternate = options.find((o) => o.code !== 'en');
  if (!alternate) return undefined;

  return {
    default: 'en',
    options: [
      options.find((o) => o.code === 'en') ?? { code: 'en', label: 'English' },
      alternate,
    ],
  };
}

export function parseLanguageSignalsFromDom(payload: {
  selectOptions: { value: string; text: string }[];
  linkHrefs: { href: string; text: string }[];
  buttonTexts: string[];
  hreflang: { hreflang: string; href: string }[];
}): { code: string; label?: string }[] {
  const signals: { code: string; label?: string }[] = [];

  for (const opt of payload.selectOptions) {
    const code = opt.value.trim().toLowerCase();
    if (/^[a-z]{2}(-[a-z]{2})?$/.test(code)) {
      signals.push({ code, label: opt.text.trim() || undefined });
    }
  }

  for (const entry of payload.hreflang) {
    const code = entry.hreflang.trim().toLowerCase();
    if (/^[a-z]{2}(-[a-z]{2})?$/.test(code)) {
      signals.push({ code });
    }
  }

  for (const link of payload.linkHrefs) {
    for (const { code, pattern } of LANGUAGE_TEXT_PATTERNS) {
      if (pattern.test(link.text)) {
        signals.push({ code, label: link.text.trim() || undefined });
      }
    }
    const langMatch = link.href.match(/[?&](?:lang|locale|language)=([a-z]{2})/i);
    if (langMatch?.[1]) {
      signals.push({ code: langMatch[1].toLowerCase() });
    }
  }

  for (const text of payload.buttonTexts) {
    for (const { code, pattern } of LANGUAGE_TEXT_PATTERNS) {
      if (pattern.test(text)) {
        signals.push({ code, label: text.trim() || undefined });
      }
    }
  }

  return signals;
}

export function isPlaceholderExampleUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'example.com' || host.endsWith('.example.com');
  } catch {
    return false;
  }
}
