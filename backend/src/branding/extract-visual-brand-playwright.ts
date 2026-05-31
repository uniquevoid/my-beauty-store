import { chromium } from 'playwright';
import {
  buildProspectBrandingFromSnapshot,
  type VisualBrandSnapshot,
} from './brand-token-derivation';
import type { ProspectBrandingJson } from './branding-schema.types';
import { extractLandingContentFromSite } from './extract-landing-content-playwright';
import { isLowValueHeroImageUrl } from './extract-culture-spotlight';
import { isStubAboutBody } from './generic-copy-guard';
import { extractHexColorsFromCss } from './extract-prospect-branding-css';
import { extractSiteLinksAndLanguages } from './extract-site-links-playwright';
import { finalizeProspectBranding } from './finalize-prospect-branding';

const USER_AGENT = 'CareersPlatformProspectBot/1.0 (+prospect-demo)';

type PageStyleProbe = {
  body: { background: string; color: string; fontFamily: string };
  header: { background: string; color: string; borderColor: string };
  footer: { background: string; color: string };
  primaryButton: { background: string; color: string; borderRadius: string };
  hero: { backgroundImage: string; textTransform: string };
  h1Text: string;
  logoUrl: string;
  faviconUrl: string;
  googleFontsUrl: string;
  heroVideoUrl: string;
  ogImage: string;
  themeColor: string;
  metaDescription: string;
  ogTitle: string;
  companyName: string;
  h1Color: string;
  documentLang: string;
};

async function probePageStyles(pageUrl: string): Promise<PageStyleProbe | null> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      locale: 'en-US',
    });
    const page = await context.newPage();
    const response = await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    if (!response || !response.ok()) return null;

    await page.waitForTimeout(1500);

    const probe = await page.evaluate(() => {
      const styleOf = (el: Element | null) => {
        if (!el) {
          return {
            background: 'transparent',
            color: 'inherit',
            fontFamily: 'sans-serif',
            borderColor: 'transparent',
            borderRadius: '0px',
            backgroundImage: 'none',
            textTransform: 'none',
          };
        }
        const s = getComputedStyle(el);
        return {
          background: s.backgroundColor,
          color: s.color,
          fontFamily: s.fontFamily,
          borderColor: s.borderTopColor,
          borderRadius: s.borderRadius,
          backgroundImage: s.backgroundImage,
          textTransform: s.textTransform,
        };
      };

      const headerEl =
        document.querySelector('header') ??
        document.querySelector('nav') ??
        document.querySelector('[role="banner"]');
      const footerEl =
        document.querySelector('footer') ?? document.querySelector('[role="contentinfo"]');

      const isVisibleCta = (el: Element) => {
        const s = getComputedStyle(el);
        const bg = s.backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return false;
        const rect = el.getBoundingClientRect();
        return rect.width >= 48 && rect.height >= 24;
      };

      const heroCtaCandidates = [
        ...document.querySelectorAll(
          'main a[class*="btn" i], main button[class*="btn" i], main a.elementor-button, main .wp-block-button__link, main a[role="button"]',
        ),
        ...document.querySelectorAll(
          '[class*="hero" i] a, [class*="hero" i] button, main section:first-of-type a, main section:first-of-type button',
        ),
      ];
      const headerCtaCandidates = [
        ...document.querySelectorAll('header a, header button, nav a, nav button'),
        ...document.querySelectorAll('a[class*="btn"], button[class*="btn"]'),
      ];

      let primaryBtn: Element | null = null;
      for (const el of heroCtaCandidates) {
        if (isVisibleCta(el)) {
          primaryBtn = el;
          break;
        }
      }
      if (!primaryBtn) {
        for (const el of headerCtaCandidates) {
          if (isVisibleCta(el)) {
            primaryBtn = el;
            break;
          }
        }
      }

      const heroEl =
        document.querySelector('[class*="hero" i]') ??
        document.querySelector('main section') ??
        document.querySelector('main > div');
      const h1 = document.querySelector('h1');

      const logoImg =
        document.querySelector('header img, nav img, img[class*="logo" i], img[alt*="logo" i]') ??
        document.querySelector('img[src*="logo" i]');

      const favicon =
        document.querySelector<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
      const appleIcon = document.querySelector<HTMLLinkElement>(
        'link[rel="apple-touch-icon"]',
      );
      const fontLink = document.querySelector<HTMLLinkElement>(
        'link[href*="fonts.googleapis.com"]',
      );
      const video = document.querySelector<HTMLVideoElement>('video[src], video source');

      const ogImage = document.querySelector<HTMLMetaElement>(
        'meta[property="og:image"], meta[property="og:image:secure_url"]',
      );
      const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
      const ogSite = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]');

      const headerStyle = styleOf(headerEl);
      const footerStyle = styleOf(footerEl);
      const btnStyle = styleOf(primaryBtn);
      const heroStyle = styleOf(heroEl);
      const bodyStyle = styleOf(document.body);

      return {
        body: {
          background: bodyStyle.background,
          color: bodyStyle.color,
          fontFamily: bodyStyle.fontFamily,
        },
        header: {
          background: headerStyle.background,
          color: headerStyle.color,
          borderColor: headerStyle.borderColor,
        },
        footer: {
          background: footerStyle.background,
          color: footerStyle.color,
        },
        primaryButton: {
          background: btnStyle.background,
          color: btnStyle.color,
          borderRadius: btnStyle.borderRadius,
        },
        hero: {
          backgroundImage: heroStyle.backgroundImage,
          textTransform: heroStyle.textTransform,
        },
        h1Text: h1?.textContent?.trim() ?? '',
        h1Color: h1 ? getComputedStyle(h1).color : '',
        documentLang: document.documentElement.lang?.trim() ?? '',
        logoUrl: logoImg?.getAttribute('src') ?? '',
        faviconUrl: appleIcon?.href ?? favicon?.href ?? '',
        googleFontsUrl: fontLink?.href ?? '',
        heroVideoUrl:
          video?.getAttribute('src') ??
          document.querySelector<HTMLSourceElement>('video source')?.src ??
          '',
        ogImage: ogImage?.content ?? '',
        themeColor: themeColor?.content ?? '',
        metaDescription: metaDesc?.content ?? '',
        ogTitle: ogTitle?.content ?? ogSite?.content ?? document.title,
        companyName: ogSite?.content ?? document.title.split(/[|\-–—]/)[0]?.trim() ?? '',
      };
    });

    await context.close();
    return probe;
  } finally {
    await browser.close();
  }
}

function resolveAbsolute(base: string, href: string): string | undefined {
  if (!href?.trim()) return undefined;
  try {
    return new URL(href, base).href;
  } catch {
    return undefined;
  }
}

async function collectCssColorsFromPage(pageUrl: string): Promise<string[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const html = await page.content();
    const colors = new Set<string>(extractHexColorsFromCss(html));
    const sheetUrls = await page.evaluate(() => {
      const urls: string[] = [];
      for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
        const href = (link as HTMLLinkElement).href;
        if (href) urls.push(href);
      }
      return urls.slice(0, 8);
    });
    for (const sheetUrl of sheetUrls) {
      try {
        const res = await fetch(sheetUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (res.ok) {
          for (const hex of extractHexColorsFromCss(await res.text())) colors.add(hex);
        }
      } catch {
        /* skip */
      }
    }
    return [...colors];
  } finally {
    await browser.close();
  }
}

function trimSiteSuffix(title: string, companyName: string): string {
  const parts = title.split(/[|\-–—·]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return title.trim();
  const companyLower = companyName.toLowerCase();
  const withoutSite = parts.filter((p) => !p.toLowerCase().includes(companyLower));
  return (withoutSite[0] ?? parts[0] ?? title).trim();
}

function extractUrlFromCssBackground(bg: string): string | undefined {
  const match = bg.match(/url\(["']?([^"')]+)["']?\)/i);
  return match?.[1];
}

function resolveBestHeroImageUrl(
  probe: PageStyleProbe,
  homepageUrl: string,
  marketingPhotoUrls: string[] = [],
): string | undefined {
  const cssHero =
    probe.hero.backgroundImage && probe.hero.backgroundImage !== 'none'
      ? extractUrlFromCssBackground(probe.hero.backgroundImage)
      : undefined;
  const cssResolved = cssHero ? resolveAbsolute(homepageUrl, cssHero) : undefined;
  const ogResolved = probe.ogImage ? resolveAbsolute(homepageUrl, probe.ogImage) : undefined;

  if (cssResolved && !isLowValueHeroImageUrl(cssResolved)) return cssResolved;
  if (ogResolved && !isLowValueHeroImageUrl(ogResolved)) return ogResolved;

  const marketing = marketingPhotoUrls.find((u) => u && !isLowValueHeroImageUrl(u));
  if (marketing) return marketing;

  return cssResolved ?? ogResolved;
}

export async function extractVisualBrandWithPlaywright(
  rawUrl: string,
  overrides?: {
    companyName?: string;
    primaryColor?: string;
  },
): Promise<{ branding: ProspectBrandingJson; snapshot: VisualBrandSnapshot }> {
  const sourceUrl = rawUrl.trim().startsWith('http')
    ? rawUrl.trim()
    : `https://${rawUrl.trim()}`;
  const parsed = new URL(sourceUrl);
  const paths = ['/', '/careers', '/jobs', '/about'];
  let bestProbe: PageStyleProbe | null = null;

  for (const path of paths) {
    const pageUrl = `${parsed.origin}${path}`;
    const probe = await probePageStyles(pageUrl);
    if (!probe) continue;
    if (!bestProbe) {
      bestProbe = probe;
    }
    if (probe.hero.backgroundImage && probe.hero.backgroundImage !== 'none') {
      bestProbe = probe;
      break;
    }
  }

  if (!bestProbe) {
    throw new Error(`Playwright could not load ${sourceUrl}`);
  }

  const homepageUrl = parsed.origin + '/';
  const cssColors = await collectCssColorsFromPage(homepageUrl);
  const companyName =
    overrides?.companyName?.trim() ||
    bestProbe.companyName?.trim() ||
    parsed.hostname.replace(/^www\./i, '').split('.')[0]!;

  const heroHeadline = bestProbe.h1Text
    ? bestProbe.h1Text.length <= 120
      ? bestProbe.h1Text
      : trimSiteSuffix(bestProbe.ogTitle, companyName)
    : trimSiteSuffix(bestProbe.ogTitle, companyName);

  const provisionalHero = resolveBestHeroImageUrl(bestProbe, homepageUrl);

  const snapshot: VisualBrandSnapshot = {
    sourceUrl: homepageUrl,
    companyName,
    metaDescription: bestProbe.metaDescription || null,
    logoUrl: resolveAbsolute(homepageUrl, bestProbe.logoUrl),
    faviconUrl: resolveAbsolute(homepageUrl, bestProbe.faviconUrl),
    googleFontsUrl: bestProbe.googleFontsUrl || undefined,
    heroBackgroundImageUrl: provisionalHero,
    heroVideoUrl: resolveAbsolute(homepageUrl, bestProbe.heroVideoUrl),
    heroHeadline: heroHeadline || undefined,
    heroSubheadline: bestProbe.metaDescription || undefined,
    cssColors,
    themeColor: bestProbe.themeColor || null,
    body: bestProbe.body,
    header: bestProbe.header,
    footer: bestProbe.footer,
    primaryButton: bestProbe.primaryButton,
    hero: bestProbe.hero,
    h1Text: bestProbe.h1Text || undefined,
    h1Color: bestProbe.h1Color || undefined,
  };

  const branding = buildProspectBrandingFromSnapshot(snapshot, 'playwright', overrides);
  const { landing: landingContent, marketingPhotoUrls } = await extractLandingContentFromSite(
    parsed.origin,
    { companyName, heroImageUrl: provisionalHero },
  );

  const resolvedHero =
    resolveBestHeroImageUrl(bestProbe, homepageUrl, marketingPhotoUrls) ?? provisionalHero;
  if (resolvedHero) {
    snapshot.heroBackgroundImageUrl = resolvedHero;
    branding.hero.backgroundImageUrl = resolvedHero;
    if (branding.assets) {
      branding.assets.heroBackgroundImageUrl = resolvedHero;
    }
  }

  branding.assets = {
    ...branding.assets,
    marketingPhotoUrls,
  };

  const existingAbout = branding.landing as Record<string, unknown> | undefined;
  const mergedLanding = {
    ...existingAbout,
    ...landingContent,
    sections: landingContent.sections,
  };

  if (mergedLanding.about && isStubAboutBody((mergedLanding.about as { body?: string }).body)) {
    delete mergedLanding.about;
    if (mergedLanding.sections) mergedLanding.sections.about = false;
  }

  branding.landing = mergedLanding;

  const siteExtras = await extractSiteLinksAndLanguages(homepageUrl);
  return {
    branding: await finalizeProspectBranding(branding, {
      siteLinks: siteExtras?.links,
    }),
    snapshot,
  };
}
