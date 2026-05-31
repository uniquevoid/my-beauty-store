import { chromium } from 'playwright';
import {
  buildSiteLanguagesFromSignals,
  buildSiteLinksFromAnchors,
  parseLanguageSignalsFromDom,
  type ExtractedSiteLanguages,
  type ExtractedSiteLinks,
} from './extract-site-links';

const USER_AGENT = 'CareersPlatformProspectBot/1.0 (+prospect-demo)';

export type SiteLinksAndLanguages = {
  links: ExtractedSiteLinks;
  languages?: ExtractedSiteLanguages;
};

export async function extractSiteLinksAndLanguages(pageUrl: string): Promise<SiteLinksAndLanguages | null> {
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

    await page.waitForTimeout(1200);

    const payload = await page.evaluate(() => {
      const footerEl =
        document.querySelector('footer') ?? document.querySelector('[role="contentinfo"]');
      const contactEl =
        document.querySelector('[class*="contact" i], [id*="contact" i], section[class*="contact" i]') ??
        footerEl;

      const scope = footerEl ?? document.body;
      const contactScope = contactEl ?? scope;

      const anchors: { href: string; text: string }[] = [];
      for (const el of contactScope.querySelectorAll('a[href]')) {
        const anchor = el as HTMLAnchorElement;
        anchors.push({
          href: anchor.href,
          text: (anchor.textContent ?? anchor.getAttribute('aria-label') ?? '').trim(),
        });
      }

      const selectOptions: { value: string; text: string }[] = [];
      for (const select of document.querySelectorAll('select')) {
        for (const opt of select.querySelectorAll('option')) {
          selectOptions.push({
            value: (opt as HTMLOptionElement).value,
            text: (opt.textContent ?? '').trim(),
          });
        }
      }

      const linkHrefs: { href: string; text: string }[] = [];
      for (const el of document.querySelectorAll('header a[href], nav a[href], [class*="lang" i] a[href]')) {
        const anchor = el as HTMLAnchorElement;
        linkHrefs.push({
          href: anchor.href,
          text: (anchor.textContent ?? '').trim(),
        });
      }

      const buttonTexts: string[] = [];
      for (const el of document.querySelectorAll(
        'header button, nav button, [class*="lang" i] button, [aria-label*="language" i]',
      )) {
        const text = (el.textContent ?? el.getAttribute('aria-label') ?? '').trim();
        if (text) buttonTexts.push(text);
      }

      const hreflang: { hreflang: string; href: string }[] = [];
      for (const el of document.querySelectorAll('link[rel="alternate"][hreflang]')) {
        hreflang.push({
          hreflang: el.getAttribute('hreflang') ?? '',
          href: (el as HTMLLinkElement).href,
        });
      }

      return { anchors, selectOptions, linkHrefs, buttonTexts, hreflang };
    });

    const companyName = (await page.title()).split(/[-|–]/)[0]?.trim() || '';

    const links = buildSiteLinksFromAnchors(payload.anchors, companyName);
    const languageSignals = parseLanguageSignalsFromDom(payload);
    const languages = buildSiteLanguagesFromSignals(languageSignals);

    return { links, languages };
  } finally {
    await browser.close();
  }
}
