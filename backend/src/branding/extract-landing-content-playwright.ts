import type { ProspectLanding, LandingSectionsMap } from './branding-schema.types';
import { isGenericTemplateCopy, isStubAboutBody } from './generic-copy-guard';
import {
  assignDistinctLandingImages,
  rankPhotoUrls,
} from './pick-section-images';
import { CANONICAL_SECTION_HEADINGS } from './prospect-section-copy';
import {
  collectArticleCandidatesFromAnchors,
  ensureCultureSpotlightFallback,
  hasCultureSpotlightData,
  type ArticleLinkCandidate,
} from './extract-culture-spotlight';

export type ExtractedLandingContent = ProspectLanding;

export type LandingPageExtraction = {
  fragment: Partial<ProspectLanding>;
  photoCandidates: Array<{ url: string; width?: number; height?: number; alt?: string }>;
};

export type LandingSiteExtraction = {
  landing: ProspectLanding;
  marketingPhotoUrls: string[];
  articleCandidates: ArticleLinkCandidate[];
};

const SECTION_KEYWORDS = {
  partners:
    /\b(partner|partners|client|customer|trusted\s+by|brands?\s+we\s+work|socio|cliente|clientes|l[ií]deres?\s+en|tecnolog[ií]a\s+en\s+la\s+nube|AWS|Google\s+Cloud)\b/i,
  technology:
    /\b(technology|platform|product|engineering|software|stack|especializaci[oó]n|cloud|datos|analytics|alto\s+valor)\b/i,
  values:
    /\b(values?|culture|principles?|pillars?|what\s+we\s+believe|valores|cultura|principios?|equipo)\b/i,
  lifeAt: /\b(life\s+at|our\s+team|workplace|people|vida\s+en|nuestro\s+equipo)\b/i,
  testimonials:
    /\b(testimonial|what\s+people\s+say|employee\s+stories?|hear\s+from|historias|testimonio)\b/i,
};

const NAMED_PARTNER_RE =
  /\b(AWS|Amazon Web Services|Google Cloud|GCP|Microsoft Azure|Azure)\b/i;

function shortAboutHeading(): string {
  return CANONICAL_SECTION_HEADINGS.about;
}

function partnerLogosMeetThreshold(logos: { name: string }[]): boolean {
  if (logos.length >= 2) return true;
  return logos.length >= 1 && logos.some((l) => NAMED_PARTNER_RE.test(l.name));
}

function extractStatsFromDocument(doc: Document): { value: string; label: string }[] {
  const stats: { value: string; label: string }[] = [];
  const seen = new Set<string>();

  for (const section of doc.querySelectorAll('section, article, div[class], main')) {
    const text = section.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (text.length < 10 || text.length > 2500) continue;

    const re = /(\d{1,3}%|\d{1,2}\+|\d{1,4}\+)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s.,'’\-]{2,48}?)(?=\s+\d{1,3}%|\s+\d{1,2}\+|\s+\d{1,4}\+|$)/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const value = match[1]?.trim();
      const label = match[2]?.trim().replace(/\s{2,}/g, ' ');
      if (!value || !label || label.length < 3) continue;
      const key = `${value}|${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      stats.push({ value, label: label.slice(0, 60) });
      if (stats.length >= 6) return stats;
    }
  }

  return stats;
}

function resolveAbsolute(base: string, href: string): string | undefined {
  if (!href?.trim()) return undefined;
  try {
    return new URL(href, base).href;
  } catch {
    return undefined;
  }
}

function sectionMatches(el: Element, pattern: RegExp): boolean {
  const text = [
    el.id,
    el.className,
    el.getAttribute('aria-label') ?? '',
    el.querySelector('h1,h2,h3,h4')?.textContent ?? '',
  ]
    .join(' ')
    .slice(0, 500);
  return pattern.test(text);
}

function collectImageCandidates(
  root: Element,
  pageUrl: string,
): Array<{ url: string; width?: number; height?: number; alt?: string }> {
  const candidates: Array<{ url: string; width?: number; height?: number; alt?: string }> = [];
  for (const img of root.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? img.getAttribute('data-src') ?? '';
    const resolved = resolveAbsolute(pageUrl, src);
    if (!resolved || resolved.includes('data:')) continue;
    candidates.push({
      url: resolved,
      width: img.naturalWidth || img.width || 0,
      height: img.naturalHeight || img.height || 0,
      alt: img.getAttribute('alt') ?? '',
    });
  }
  return candidates;
}

function pickImages(section: Element, pageUrl: string, limit = 2): string[] {
  return rankPhotoUrls(collectImageCandidates(section, pageUrl)).slice(0, limit);
}

function extractAboutFromDocument(doc: Document, _pageUrl: string): ProspectLanding['about'] | undefined {
  const paragraphs = [...doc.querySelectorAll('main p, article p, section p')]
    .map((p) => p.textContent?.trim() ?? '')
    .filter((t) => t.length >= 40)
    .slice(0, 2);
  const body = paragraphs.join('\n\n').slice(0, 800);
  if (isStubAboutBody(body)) return undefined;
  const stats = extractStatsFromDocument(doc);
  return {
    heading: shortAboutHeading(),
    body,
    stats,
    ctaLabel: 'View open positions',
  };
}

function collectPartnerLogos(section: Element, pageUrl: string): { name: string; imageUrl?: string }[] {
  const logos: { name: string; imageUrl?: string }[] = [];
  for (const img of section.querySelectorAll('img')) {
    const alt = img.getAttribute('alt')?.trim();
    const src = resolveAbsolute(pageUrl, img.getAttribute('src') ?? '');
    if (!alt && !src) continue;
    const name = alt || src?.split('/').pop()?.replace(/\.\w+$/, '') || 'Partner';
    if (name.length < 2) continue;
    logos.push({ name: name.slice(0, 80), imageUrl: src });
  }
  return logos;
}

function extractPartnersFromDocument(doc: Document, pageUrl: string): ProspectLanding['customers'] | undefined {
  const sections = [...doc.querySelectorAll('section, div[class], article')].filter((el) =>
    sectionMatches(el, SECTION_KEYWORDS.partners),
  );
  for (const section of sections) {
    const logos = collectPartnerLogos(section, pageUrl);
    if (partnerLogosMeetThreshold(logos)) {
      return {
        heading: CANONICAL_SECTION_HEADINGS.customers,
        logos: logos.slice(0, 12),
      };
    }
  }

  const cloudLogos: { name: string; imageUrl?: string }[] = [];
  for (const img of doc.querySelectorAll('img')) {
    const alt = img.getAttribute('alt')?.trim() ?? '';
    if (!NAMED_PARTNER_RE.test(alt)) continue;
    const src = resolveAbsolute(pageUrl, img.getAttribute('src') ?? '');
    cloudLogos.push({ name: alt.slice(0, 80), imageUrl: src });
  }
  if (partnerLogosMeetThreshold(cloudLogos)) {
    return {
      heading: CANONICAL_SECTION_HEADINGS.customers,
      logos: cloudLogos.slice(0, 12),
    };
  }

  return undefined;
}

function extractTechnologyFromDocument(doc: Document, pageUrl: string): ProspectLanding['technology'] | undefined {
  const sections = [...doc.querySelectorAll('section, div[class], article')].filter((el) =>
    sectionMatches(el, SECTION_KEYWORDS.technology),
  );
  for (const section of sections) {
    const heading = section.querySelector('h2,h3,h4')?.textContent?.trim();
    const body =
      section.querySelector('p')?.textContent?.trim()?.slice(0, 600) ?? '';
    if (!heading || body.length < 40 || isGenericTemplateCopy(body)) continue;
    const sectionPhoto = rankPhotoUrls(collectImageCandidates(section, pageUrl))[0];
    return {
      heading: CANONICAL_SECTION_HEADINGS.technology,
      body,
      imageUrl: sectionPhoto,
      ctaLabel: 'Read more',
    };
  }
  return undefined;
}

function extractCoreValuesFromDocument(doc: Document): ProspectLanding['coreValues'] | undefined {
  const sections = [...doc.querySelectorAll('section, div[class], article')].filter((el) =>
    sectionMatches(el, SECTION_KEYWORDS.values),
  );
  for (const section of sections) {
    const heading = section.querySelector('h2,h3,h4')?.textContent?.trim();
    const labels = [
      ...section.querySelectorAll('li, [class*="value" i], [class*="pillar" i]'),
    ]
      .map((el) => el.textContent?.trim() ?? '')
      .filter((t) => t.length >= 3 && t.length <= 60)
      .slice(0, 6);
    if (labels.length >= 2) {
      const icons = ['smile', 'sparkles', 'handshake', 'move', 'refresh-cw', 'heart'];
      return {
        heading: CANONICAL_SECTION_HEADINGS.coreValues,
        values: labels.map((label, i) => ({
          icon: icons[i % icons.length]!,
          label,
        })),
      };
    }
  }
  return undefined;
}

function extractLifeAtFromDocument(doc: Document, pageUrl: string): ProspectLanding['lifeAt'] | undefined {
  const sections = [...doc.querySelectorAll('section, div[class], article')].filter((el) =>
    sectionMatches(el, SECTION_KEYWORDS.lifeAt),
  );
  for (const section of sections) {
    const heading = section.querySelector('h2,h3,h4')?.textContent?.trim();
    const subheading = section.querySelector('p')?.textContent?.trim()?.slice(0, 200);
    const images = pickImages(section, pageUrl, 2);
    if (heading && (subheading || images.length > 0)) {
      return {
        heading: CANONICAL_SECTION_HEADINGS.lifeAt,
        subheading: subheading || 'Discover what it is like to work with us.',
        leftImageUrl: images[0],
        rightImageUrl: images[1],
        ctaLabel: 'Learn more',
      };
    }
  }
  return undefined;
}

function extractTestimonialsFromDocument(doc: Document): ProspectLanding['testimonials'] | undefined {
  const items: NonNullable<ProspectLanding['testimonials']>['items'] = [];

  for (const blockquote of doc.querySelectorAll('blockquote')) {
    const quote = blockquote.textContent?.trim()?.slice(0, 500);
    if (!quote || quote.length < 40) continue;
    const parent = blockquote.closest('section, div, article') ?? blockquote.parentElement;
    const name =
      parent?.querySelector('[class*="name" i], cite, strong, h4, h5')?.textContent?.trim() ??
      'Team member';
    const role =
      parent?.querySelector('[class*="role" i], [class*="title" i], em, span')?.textContent?.trim() ??
      '';
    items.push({ quote, name: name.slice(0, 80), role: role.slice(0, 80) });
    if (items.length >= 5) break;
  }

  if (items.length === 0) {
    const sections = [...doc.querySelectorAll('section, div[class]')].filter((el) =>
      sectionMatches(el, SECTION_KEYWORDS.testimonials),
    );
    for (const section of sections) {
      const quote = section.querySelector('p')?.textContent?.trim()?.slice(0, 500);
      if (!quote || quote.length < 40) continue;
      const name =
        section.querySelector('[class*="name" i], strong, h4')?.textContent?.trim() ?? 'Team member';
      const role =
        section.querySelector('[class*="role" i], em')?.textContent?.trim() ?? '';
      items.push({ quote, name: name.slice(0, 80), role: role.slice(0, 80) });
      if (items.length >= 5) break;
    }
  }

  return items.length > 0 ? { items } : undefined;
}

/** Build landing sections map from extracted content. */
export function buildLandingSectionsMap(landing: ProspectLanding): LandingSectionsMap {
  return {
    about: Boolean(landing.about?.body && !isStubAboutBody(landing.about.body)),
    customers: Boolean(
      landing.customers?.logos && partnerLogosMeetThreshold(landing.customers.logos),
    ),
    technology: Boolean(landing.technology?.body && landing.technology.body.length >= 40),
    coreValues: Boolean(landing.coreValues?.values && landing.coreValues.values.length >= 2),
    lifeAt: Boolean(
      landing.lifeAt?.heading &&
        (landing.lifeAt.subheading || landing.lifeAt.leftImageUrl || landing.lifeAt.rightImageUrl),
    ),
    testimonials: Boolean(landing.testimonials?.items && landing.testimonials.items.length > 0),
    cultureSpotlight: hasCultureSpotlightData(landing),
    jobAlerts: true,
  };
}

/** Merge extracted landing fragments; later pages override earlier empty fields. */
export function mergeLandingContent(...fragments: Partial<ProspectLanding>[]): ProspectLanding {
  const merged: ProspectLanding = {};
  for (const fragment of fragments) {
    if (fragment.about) merged.about = fragment.about;
    if (fragment.customers) merged.customers = fragment.customers;
    if (fragment.technology) merged.technology = fragment.technology;
    if (fragment.coreValues) merged.coreValues = fragment.coreValues;
    if (fragment.lifeAt) merged.lifeAt = fragment.lifeAt;
    if (fragment.testimonials) merged.testimonials = fragment.testimonials;
    if (fragment.cultureSpotlight) merged.cultureSpotlight = fragment.cultureSpotlight;
  }
  merged.sections = buildLandingSectionsMap(merged);
  return merged;
}

/** Crawl corporate site paths and merge landing content + marketing photo pool. */
export async function extractLandingContentFromSite(
  origin: string,
  options?: { companyName?: string; heroImageUrl?: string },
): Promise<LandingSiteExtraction> {
  const contentPaths = [
    '/',
    '/about',
    '/careers',
    '/culture',
    '/team',
    '/blog',
    '/news',
    '/insights',
    '/stories',
    '/resources',
  ];
  const fragments: Partial<ProspectLanding>[] = [];
  const allPhotoCandidates: LandingPageExtraction['photoCandidates'] = [];
  const allArticleCandidates: ArticleLinkCandidate[] = [];

  const { chromium } = await import('playwright');
  const USER_AGENT = 'CareersPlatformProspectBot/1.0 (+prospect-demo)';
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT, locale: 'en-US' });
    for (const path of contentPaths) {
      const pageUrl = `${origin}${path}`;
      const page = await context.newPage();
      try {
        const response = await page.goto(pageUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        });
        if (!response?.ok()) continue;
        await page.waitForTimeout(800);
        const extracted = await extractLandingContentFromPage(page, pageUrl);
        fragments.push(extracted.fragment);
        allPhotoCandidates.push(...extracted.photoCandidates);

        const anchors = await page.evaluate(() => {
          const results: { href: string; text: string }[] = [];
          for (const el of document.querySelectorAll('a[href]')) {
            const anchor = el as HTMLAnchorElement;
            results.push({
              href: anchor.href,
              text: (anchor.textContent ?? anchor.getAttribute('aria-label') ?? '').trim(),
            });
          }
          return results;
        });
        allArticleCandidates.push(...collectArticleCandidatesFromAnchors(anchors, origin));
      } catch {
        /* skip path */
      } finally {
        await page.close();
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }

  const marketingPhotoUrls = rankPhotoUrls(allPhotoCandidates);
  let landing = finalizeExtractedLanding(mergeLandingContent(...fragments));

  if (options?.companyName) {
    landing = ensureCultureSpotlightFallback(landing, options.companyName, origin, {
      articleCandidates: allArticleCandidates,
      marketingPhotoUrls,
      heroImageUrl: options.heroImageUrl,
    });
    landing.sections = buildLandingSectionsMap(landing);
  }

  return { landing, marketingPhotoUrls, articleCandidates: allArticleCandidates };
}

/** Extract landing page content from a loaded Playwright page. */
export async function extractLandingContentFromPage(
  page: import('playwright').Page,
  pageUrl: string,
): Promise<LandingPageExtraction> {
  return await page.evaluate(
    ({ pageUrl: url, keywords }) => {
      const resolve = (href: string) => {
        try {
          return new URL(href, url).href;
        } catch {
          return undefined;
        }
      };

      const sectionMatches = (el: Element, patternSource: string) =>
        new RegExp(patternSource, 'i').test(
          [
            el.id,
            el.className,
            el.getAttribute('aria-label') ?? '',
            el.querySelector('h1,h2,h3,h4')?.textContent ?? '',
          ]
            .join(' ')
            .slice(0, 500),
        );

      const result: Record<string, unknown> = {};

      const aboutParagraphs = [...document.querySelectorAll('main p, article p, section p')]
        .map((p) => p.textContent?.trim() ?? '')
        .filter((t) => t.length >= 40)
        .slice(0, 2);
      const aboutBody = aboutParagraphs.join('\n\n').slice(0, 800);
      if (aboutBody.length >= 40) {
        const stats: { value: string; label: string }[] = [];
        const seen = new Set<string>();
        for (const section of document.querySelectorAll('section, article, div[class], main')) {
          const text = section.textContent?.replace(/\s+/g, ' ').trim() ?? '';
          if (text.length < 10 || text.length > 2500) continue;
          const re = /(\d{1,3}%|\d{1,2}\+|\d{1,4}\+)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s.,'’\-]{2,48}?)(?=\s+\d{1,3}%|\s+\d{1,2}\+|\s+\d{1,4}\+|$)/gi;
          let statMatch: RegExpExecArray | null;
          while ((statMatch = re.exec(text)) !== null) {
            const value = statMatch[1]?.trim();
            const label = statMatch[2]?.trim().replace(/\s{2,}/g, ' ');
            if (!value || !label || label.length < 3) continue;
            const key = `${value}|${label}`;
            if (seen.has(key)) continue;
            seen.add(key);
            stats.push({ value, label: label.slice(0, 60) });
            if (stats.length >= 6) break;
          }
          if (stats.length >= 6) break;
        }
        result.about = {
          heading: 'About us',
          body: aboutBody,
          stats,
          ctaLabel: 'View open positions',
        };
      }

      const partnerSections = [...document.querySelectorAll('section, div[class], article')].filter(
        (el) => sectionMatches(el, keywords.partners),
      );
      for (const section of partnerSections) {
        const logos: { name: string; imageUrl?: string }[] = [];
        for (const img of section.querySelectorAll('img')) {
          const alt = img.getAttribute('alt')?.trim();
          const src = resolve(img.getAttribute('src') ?? '') ?? undefined;
          if (!alt && !src) continue;
          const name = alt || src?.split('/').pop()?.replace(/\.\w+$/, '') || 'Partner';
          if (name.length < 2) continue;
          logos.push({ name: name.slice(0, 80), imageUrl: src });
        }
        const namedPartner =
          /AWS|Amazon Web Services|Google Cloud|GCP|Microsoft Azure|Azure/i;
        const enough = logos.length >= 2 || (logos.length >= 1 && logos.some((l) => namedPartner.test(l.name)));
        if (enough) {
          result.customers = {
            heading: 'Our partners',
            logos: logos.slice(0, 12),
          };
          break;
        }
      }

      if (!result.customers) {
        const cloudLogos: { name: string; imageUrl?: string }[] = [];
        const namedPartner =
          /AWS|Amazon Web Services|Google Cloud|GCP|Microsoft Azure|Azure/i;
        for (const img of document.querySelectorAll('img')) {
          const alt = img.getAttribute('alt')?.trim() ?? '';
          if (!namedPartner.test(alt)) continue;
          const src = resolve(img.getAttribute('src') ?? '') ?? undefined;
          cloudLogos.push({ name: alt.slice(0, 80), imageUrl: src });
        }
        if (cloudLogos.length >= 1) {
          const lang = document.documentElement.lang?.trim().toLowerCase() ?? '';
          result.customers = {
            heading: 'Our partners',
            logos: cloudLogos.slice(0, 12),
          };
        }
      }

      const techSections = [...document.querySelectorAll('section, div[class], article')].filter(
        (el) => sectionMatches(el, keywords.technology),
      );
      for (const section of techSections) {
        const heading = section.querySelector('h2,h3,h4')?.textContent?.trim();
        const body = section.querySelector('p')?.textContent?.trim()?.slice(0, 600) ?? '';
        if (heading && body.length >= 40) {
          const img = section.querySelector('img');
          result.technology = {
            heading: 'What we do',
            body,
            imageUrl: img ? resolve(img.getAttribute('src') ?? '') : undefined,
            ctaLabel: 'Read more',
          };
          break;
        }
      }

      const valueSections = [...document.querySelectorAll('section, div[class], article')].filter(
        (el) => sectionMatches(el, keywords.values),
      );
      for (const section of valueSections) {
        const labels = [...section.querySelectorAll('li, [class*="value" i], [class*="pillar" i]')]
          .map((el) => el.textContent?.trim() ?? '')
          .filter((t) => t.length >= 3 && t.length <= 60)
          .slice(0, 6);
        if (labels.length >= 2) {
          const icons = ['smile', 'sparkles', 'handshake', 'move', 'refresh-cw', 'heart'];
          result.coreValues = {
            heading: 'Our culture',
            values: labels.map((label, i) => ({ icon: icons[i % icons.length], label })),
          };
          break;
        }
      }

      const lifeSections = [...document.querySelectorAll('section, div[class], article')].filter(
        (el) => sectionMatches(el, keywords.lifeAt),
      );
      for (const section of lifeSections) {
        const heading = section.querySelector('h2,h3,h4')?.textContent?.trim();
        const subheading = section.querySelector('p')?.textContent?.trim()?.slice(0, 200);
        const images = [...section.querySelectorAll('img')]
          .map((img) => {
            const src = resolve(img.getAttribute('src') ?? img.getAttribute('data-src') ?? '');
            if (!src || src.includes('.svg') || /\/icons?\//i.test(src)) return null;
            return src;
          })
          .filter((u): u is string => Boolean(u))
          .slice(0, 2);
        if (heading && (subheading || images.length > 0)) {
          result.lifeAt = {
            heading: 'Join our team',
            subheading: subheading || 'Discover what it is like to work with us.',
            leftImageUrl: images[0],
            rightImageUrl: images[1],
            ctaLabel: 'Learn more',
          };
          break;
        }
      }

      const testimonialItems: { quote: string; name: string; role: string }[] = [];
      for (const blockquote of document.querySelectorAll('blockquote')) {
        const quote = blockquote.textContent?.trim()?.slice(0, 500);
        if (!quote || quote.length < 40) continue;
        const parent = blockquote.closest('section, div, article') ?? blockquote.parentElement;
        testimonialItems.push({
          quote,
          name:
            parent?.querySelector('[class*="name" i], cite, strong, h4, h5')?.textContent?.trim()?.slice(0, 80) ??
            'Team member',
          role:
            parent?.querySelector('[class*="role" i], [class*="title" i], em')?.textContent?.trim()?.slice(0, 80) ??
            '',
        });
        if (testimonialItems.length >= 5) break;
      }
      if (testimonialItems.length > 0) {
        result.testimonials = { items: testimonialItems };
      }

      const photoCandidates: { url: string; width: number; height: number; alt: string }[] = [];
      for (const img of document.querySelectorAll('main img, section img, article img')) {
        const el = img as HTMLImageElement;
        const src = resolve(el.getAttribute('src') ?? el.getAttribute('data-src') ?? '');
        if (!src || src.includes('data:') || /\.svg(\?|$)/i.test(src) || /\/icons?\//i.test(src)) {
          continue;
        }
        photoCandidates.push({
          url: src,
          width: el.naturalWidth || el.width || 0,
          height: el.naturalHeight || el.height || 0,
          alt: el.getAttribute('alt') ?? '',
        });
      }

      return { fragment: result, photoCandidates };
    },
    {
      pageUrl,
      keywords: {
        partners: SECTION_KEYWORDS.partners.source,
        technology: SECTION_KEYWORDS.technology.source,
        values: SECTION_KEYWORDS.values.source,
        lifeAt: SECTION_KEYWORDS.lifeAt.source,
        testimonials: SECTION_KEYWORDS.testimonials.source,
      },
    },
  ) as LandingPageExtraction;
}

/** Post-process extracted landing: apply generic copy guard and sections map. */
export function finalizeExtractedLanding(landing: ProspectLanding): ProspectLanding {
  if (landing.about?.body && isStubAboutBody(landing.about.body)) {
    delete landing.about;
  }
  if (landing.technology?.body && isGenericTemplateCopy(landing.technology.body)) {
    delete landing.technology;
  }
  landing.sections = buildLandingSectionsMap(landing);
  return landing;
}

// Re-export for unit tests using cheerio-less DOM strings
export {
  extractAboutFromDocument,
  extractPartnersFromDocument,
  extractTechnologyFromDocument,
  extractCoreValuesFromDocument,
  extractLifeAtFromDocument,
  extractTestimonialsFromDocument,
  extractStatsFromDocument,
  shortAboutHeading,
  partnerLogosMeetThreshold,
};
