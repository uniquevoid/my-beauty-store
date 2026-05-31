import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProspectBrandingJson } from './branding-schema.types';
import { isCustomerFacingCopy as hasCustomerFacingPhrase } from './generic-copy-guard';
import { CANONICAL_SECTION_HEADINGS } from './prospect-section-copy';

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
].filter(Boolean) as string[];

/** Buyer / product CTAs that must not appear on careers sites. */
const CUSTOMER_FACING_PATTERNS = [
  /\bfind the perfect\b/i,
  /\bbuy\b/i,
  /\bshop\b/i,
  /\bget a quote\b/i,
  /\bdiscover our\b/i,
  /\byour digital transformation\b/i,
  /\bstart here\b/i,
  /\bcompramos tu coche\b/i,
  /\bencuentra el coche\b/i,
  /\btransformaci[oó]n digital\b/i,
  /\baccelerate your digital transformation\b/i,
  /\bpartners of aws\b/i,
  /\btailored cloud solutions\b/i,
];

const CAREERS_INTENT_PATTERNS = [
  /\bcareer/i,
  /\bjoin us\b/i,
  /\bjoin our\b/i,
  /\bwork (at|for|with)\b/i,
  /\bwe(?:'re| are) hiring\b/i,
  /\bopen roles?\b/i,
  /\bbuild your career\b/i,
  /\bgrow your career\b/i,
  /\bexplore opportunities\b/i,
  /\bbe part of\b/i,
];

const GENERIC_JOB_ALERTS_BODY = [
  'things move pretty fast around here',
  'new tech, new products, new ideas',
];

export type IndustryHint = 'automotive' | 'retail' | 'tech' | 'generic';

type CareersRewritePayload = {
  heroHeadline?: string;
  heroSubheadline?: string;
  metaDescription?: string;
  aboutBody?: string;
  technologyBody?: string;
  lifeAtSubheading?: string;
  jobAlertsBody?: string[];
  coreValueLabels?: string[];
};

function isRetryableGeminiError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /503|429|high demand|unavailable|timeout/i.test(msg);
}

async function generateJsonWithFallback(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;

  for (const modelName of [...new Set(GEMINI_MODELS)]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent(prompt);
        return (result.response.text() ?? '').trim();
      } catch (error) {
        lastError = error;
        if (!isRetryableGeminiError(error) || attempt === 2) break;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error('All Gemini models failed.');
}

export function isCustomerFacingCopy(text: string | undefined | null): boolean {
  if (hasCustomerFacingPhrase(text)) return true;
  if (!text?.trim()) return false;
  return CUSTOMER_FACING_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasCareersIntent(text: string | undefined | null): boolean {
  if (!text?.trim()) return false;
  return CAREERS_INTENT_PATTERNS.some((pattern) => pattern.test(text));
}

export function isGenericJobAlertsCopy(body: string[] | undefined): boolean {
  if (!body?.length) return true;
  const joined = body.join(' ').toLowerCase();
  return GENERIC_JOB_ALERTS_BODY.some((phrase) => joined.includes(phrase));
}

function collectContextText(branding: ProspectBrandingJson): string {
  return [
    branding.hero?.headline,
    branding.hero?.subheadline,
    branding.metaDescription,
    branding.landing?.about?.body,
    branding.landing?.technology?.body,
    branding.landing?.lifeAt?.subheading,
  ]
    .filter(Boolean)
    .join(' ');
}

export function inferIndustryHint(branding: ProspectBrandingJson): IndustryHint {
  const context = collectContextText(branding).toLowerCase();
  const url = branding.source?.url?.toLowerCase() ?? '';

  if (
    /\b(car|auto|vehicle|dealership|concesionario|coche|motorcycle|moto)\b/.test(context) ||
    /\b(car|auto|coche|motor)\b/.test(url)
  ) {
    return 'automotive';
  }
  if (/\b(retail|store|e-?commerce|shop)\b/.test(context)) {
    return 'retail';
  }
  if (
    /\b(cloud|software|tech|engineering|platform|saas|data|ai)\b/.test(context) ||
    /\b(tech|cloud|software)\b/.test(url)
  ) {
    return 'tech';
  }
  return 'generic';
}

function industryDescriptor(hint: IndustryHint): string {
  switch (hint) {
    case 'automotive':
      return 'automotive retail';
    case 'retail':
      return 'retail';
    case 'tech':
      return 'technology';
    default:
      return 'growing organization';
  }
}

function industryHeadline(hint: IndustryHint, companyName: string): string {
  switch (hint) {
    case 'automotive':
      return 'Work for a leading used-car dealership brand';
    case 'retail':
      return `Build your retail career at ${companyName}`;
    case 'tech':
      return `Grow your tech career at ${companyName}`;
    default:
      return `Build your career at ${companyName}`;
  }
}

function industrySubheadline(hint: IndustryHint, companyName: string): string {
  switch (hint) {
    case 'automotive':
      return `Join ${companyName} — explore open roles across our nationwide dealership network and help deliver trusted automotive experiences every day.`;
    case 'retail':
      return `Join ${companyName} — explore open roles where you can grow with a customer-focused retail team.`;
    case 'tech':
      return `Join ${companyName} — explore engineering, product, and operations roles on teams building modern technology.`;
    default:
      return `Join ${companyName} — explore open roles across teams and locations and grow with people who care about doing great work.`;
  }
}

function industryAboutBody(hint: IndustryHint, companyName: string): string {
  switch (hint) {
    case 'automotive':
      return `At ${companyName}, we help drivers find the right vehicle with confidence — and we are always looking for talented people to join our teams.\n\nWith locations across Spain, flexible career paths, and a culture built around customer happiness, ${companyName} is a place where you can build a rewarding career in automotive retail.`;
    case 'retail':
      return `${companyName} is a customer-focused retailer where teams work together to deliver great experiences every day.\n\nExplore careers across stores, operations, and support functions — and grow with a company that invests in its people.`;
    case 'tech':
      return `${companyName} builds technology and digital products that help organizations move faster.\n\nJoin engineers, product specialists, and customer-facing teams who are shaping what's next — and grow your career with meaningful work.`;
    default:
      return `${companyName} is a growing organization with opportunities across multiple teams and locations.\n\nExplore open roles, develop new skills, and build a career with people who value collaboration and impact.`;
  }
}

function industryJobAlertsBody(hint: IndustryHint, companyName: string): string[] {
  switch (hint) {
    case 'automotive':
      return [
        `${companyName} is expanding across Spain — new dealerships, new teams, and new roles open regularly.`,
        "Create a tailored job alert and we'll notify you as soon as a role that fits your skills becomes available.",
      ];
    case 'retail':
      return [
        `${companyName} is growing — new stores and teams mean new opportunities for motivated people.`,
        "Set up a job alert and we'll reach out when a matching role opens up.",
      ];
    case 'tech':
      return [
        `${companyName} is hiring across engineering, product, and operations as the team scales.`,
        "Create a job alert and we'll notify you when a role aligned with your skills is posted.",
      ];
    default:
      return [
        `${companyName} is growing — new teams and locations mean new opportunities for talented people.`,
        "Create a tailored job alert and we'll let you know when your next role is ready.",
      ];
  }
}

export function buildCareersCopyFallback(branding: ProspectBrandingJson): void {
  const companyName = branding.companyName?.trim() || 'our company';
  const hint = inferIndustryHint(branding);
  const descriptor = industryDescriptor(hint);

  if (!branding.hero) {
    branding.hero = { badgeText: "We're hiring!", headline: '', subheadline: '' };
  }

  if (!hasCareersIntent(branding.hero.headline) || isCustomerFacingCopy(branding.hero.headline)) {
    branding.hero.headline = industryHeadline(hint, companyName);
  }
  if (
    !hasCareersIntent(branding.hero.subheadline) ||
    isCustomerFacingCopy(branding.hero.subheadline)
  ) {
    branding.hero.subheadline = industrySubheadline(hint, companyName);
  }

  const meta = branding.metaDescription?.trim();
  if (!meta || isCustomerFacingCopy(meta) || !hasCareersIntent(meta)) {
    branding.metaDescription = `Join ${companyName} — explore open roles across our ${descriptor} teams and build a career with impact.`;
  } else if (!meta.startsWith('Join ')) {
    branding.metaDescription = `Join ${companyName} — ${meta}`;
  }

  if (branding.landing?.about) {
    const aboutBody = branding.landing.about.body?.trim();
    if (
      !aboutBody ||
      isCustomerFacingCopy(aboutBody) ||
      !hasCareersIntent(aboutBody) ||
      aboutBody === branding.hero.subheadline?.trim()
    ) {
      branding.landing.about.body = industryAboutBody(hint, companyName);
      branding.landing.about.heading = CANONICAL_SECTION_HEADINGS.about;
    }
  }

  if (branding.landing?.technology?.body) {
    const techBody = branding.landing.technology.body.trim();
    if (isCustomerFacingCopy(techBody) && !hasCareersIntent(techBody)) {
      branding.landing.technology.body = `At ${companyName}, our teams build and deliver ${descriptor} solutions — and we're always looking for people who want to grow their careers here.`;
    }
  }

  if (branding.landing?.lifeAt?.subheading) {
    const lifeAt = branding.landing.lifeAt.subheading.trim();
    if (isCustomerFacingCopy(lifeAt) && !hasCareersIntent(lifeAt)) {
      branding.landing.lifeAt.subheading = `Ready to take the next step? Join ${companyName} and grow with a team that values collaboration and impact.`;
    }
  }

  if (!branding.landing) {
    branding.landing = { sections: { jobAlerts: true } };
  }
  if (!branding.landing.jobAlerts) {
    branding.landing.jobAlerts = {
      headingLead: "Let's stay",
      headingTrail: 'connected',
      body: [],
      ctaLabel: 'Create Job Alert',
    };
  }
  if (isGenericJobAlertsCopy(branding.landing.jobAlerts.body)) {
    branding.landing.jobAlerts.body = industryJobAlertsBody(hint, companyName);
  }
}

function buildRewritePayload(branding: ProspectBrandingJson): CareersRewritePayload {
  const payload: CareersRewritePayload = {};

  const headline = branding.hero?.headline?.trim();
  if (headline && (isCustomerFacingCopy(headline) || !hasCareersIntent(headline))) {
    payload.heroHeadline = headline;
  }

  const subheadline = branding.hero?.subheadline?.trim();
  if (subheadline && (isCustomerFacingCopy(subheadline) || !hasCareersIntent(subheadline))) {
    payload.heroSubheadline = subheadline;
  }

  const meta = branding.metaDescription?.trim();
  if (meta && (isCustomerFacingCopy(meta) || !hasCareersIntent(meta))) {
    payload.metaDescription = meta;
  }

  const aboutBody = branding.landing?.about?.body?.trim();
  if (
    aboutBody &&
    (isCustomerFacingCopy(aboutBody) ||
      !hasCareersIntent(aboutBody) ||
      aboutBody === subheadline)
  ) {
    payload.aboutBody = aboutBody;
  }

  const technologyBody = branding.landing?.technology?.body?.trim();
  if (
    technologyBody &&
    isCustomerFacingCopy(technologyBody) &&
    !hasCareersIntent(technologyBody)
  ) {
    payload.technologyBody = technologyBody;
  }

  const lifeAtSubheading = branding.landing?.lifeAt?.subheading?.trim();
  if (
    lifeAtSubheading &&
    isCustomerFacingCopy(lifeAtSubheading) &&
    !hasCareersIntent(lifeAtSubheading)
  ) {
    payload.lifeAtSubheading = lifeAtSubheading;
  }

  if (isGenericJobAlertsCopy(branding.landing?.jobAlerts?.body)) {
    payload.jobAlertsBody = branding.landing?.jobAlerts?.body;
  }

  const coreValues = branding.landing?.coreValues?.values ?? [];
  const customerLabels = coreValues
    .map((v) => v.label?.trim())
    .filter((label): label is string => Boolean(label))
    .filter((label) => isCustomerFacingCopy(label) && !hasCareersIntent(label));
  if (customerLabels.length > 0) {
    payload.coreValueLabels = customerLabels;
  }

  return payload;
}

export function needsCareersIntentRewrite(branding: ProspectBrandingJson): boolean {
  return Object.keys(buildRewritePayload(branding)).length > 0;
}

function applyRewriteResult(
  branding: ProspectBrandingJson,
  result: CareersRewritePayload,
): void {
  const companyName = branding.companyName?.trim() || 'the company';

  if (result.heroHeadline && branding.hero) {
    branding.hero.headline = result.heroHeadline.trim();
  }
  if (result.heroSubheadline && branding.hero) {
    branding.hero.subheadline = result.heroSubheadline.trim();
  }
  if (result.metaDescription) {
    const desc = result.metaDescription.trim();
    branding.metaDescription = desc.startsWith('Join ')
      ? desc
      : `Join ${companyName} — ${desc}`;
  }
  if (result.aboutBody && branding.landing?.about) {
    branding.landing.about.body = result.aboutBody.trim();
    branding.landing.about.heading = CANONICAL_SECTION_HEADINGS.about;
  }
  if (result.technologyBody && branding.landing?.technology) {
    branding.landing.technology.body = result.technologyBody.trim();
  }
  if (result.lifeAtSubheading && branding.landing?.lifeAt) {
    branding.landing.lifeAt.subheading = result.lifeAtSubheading.trim();
  }
  if (result.jobAlertsBody && branding.landing?.jobAlerts) {
    branding.landing.jobAlerts.body = result.jobAlertsBody.map((p) => p.trim()).filter(Boolean);
  }
  if (result.coreValueLabels?.length && branding.landing?.coreValues?.values) {
    const labelMap = new Map(
      result.coreValueLabels.map((label, i) => {
        const original = branding.landing!.coreValues!.values[i]?.label;
        return original ? [original, label.trim()] : null;
      }).filter(Boolean) as [string, string][],
    );
    for (const value of branding.landing.coreValues.values) {
      const rewritten = labelMap.get(value.label);
      if (rewritten) value.label = rewritten;
    }
  }
}

/** Rewrite scraped corporate copy into recruitment-focused careers site messaging. */
export async function normalizeProspectCareersCopy(
  branding: ProspectBrandingJson,
): Promise<void> {
  const payload = buildRewritePayload(branding);
  if (Object.keys(payload).length === 0) return;

  if (!process.env.GEMINI_API_KEY?.trim()) {
    buildCareersCopyFallback(branding);
    return;
  }

  const companyName = branding.companyName?.trim() || 'the company';
  const sourceUrl = branding.source?.url?.trim() ?? '';
  const prompt = `You rewrite corporate website copy into natural US English for a careers / jobs site aimed at job candidates.
Company: ${companyName}${sourceUrl ? `\nWebsite: ${sourceUrl}` : ''}

Rules:
- Speak to job seekers (join, work, grow your career, explore open roles). Never use product CTAs aimed at customers (buy, shop, find the perfect product).
- Preserve industry and company facts from the input (locations, scale, domain expertise).
- Keep each field concise. Headline ≤ 12 words. Subheadline ≤ 35 words.
- Return JSON with the same keys as input; rewrite only provided values.

Input:
${JSON.stringify(payload)}`;

  try {
    const raw = await generateJsonWithFallback(prompt);
    const rewritten = JSON.parse(raw) as CareersRewritePayload;
    applyRewriteResult(branding, rewritten);
  } catch (error) {
    console.warn(
      `Prospect careers copy rewrite failed: ${error instanceof Error ? error.message : error}`,
    );
    buildCareersCopyFallback(branding);
    return;
  }

  if (needsCareersIntentRewrite(branding)) {
    buildCareersCopyFallback(branding);
  }
}
