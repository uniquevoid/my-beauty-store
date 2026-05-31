import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProspectBrandingJson } from './branding-schema.types';
import { CANONICAL_SECTION_HEADINGS } from './prospect-section-copy';
import { buildCareersCopyFallback } from './careers-copy-intent';
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
].filter(Boolean) as string[];

const NON_ENGLISH_RE = /[áéíóúñ¿¡]|(?:\b(somos|impulsamos|tu|nuestro|nuestra|equipo|soluciones)\b)/i;

export function needsEnglishNormalization(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return NON_ENGLISH_RE.test(text);
}

export function brandingNeedsEnglishCopy(branding: ProspectBrandingJson): boolean {
  const fields = [
    branding.hero?.headline,
    branding.hero?.subheadline,
    branding.metaDescription,
    branding.landing?.about?.body,
    branding.landing?.technology?.body,
    branding.landing?.lifeAt?.subheading,
  ];
  return fields.some((f) => needsEnglishNormalization(f));
}

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

/** When Gemini is unavailable, apply minimal English placeholders before careers-intent rewrite. */
export function applyFallbackEnglishCopy(branding: ProspectBrandingJson): void {
  const companyName = branding.companyName?.trim() || 'our company';

  if (needsEnglishNormalization(branding.hero?.headline)) {
    branding.hero!.headline = `Build your career at ${companyName}.`;
  }
  if (needsEnglishNormalization(branding.hero?.subheadline)) {
    branding.hero!.subheadline = `Explore open roles and grow with ${companyName}.`;
  }
  if (needsEnglishNormalization(branding.metaDescription)) {
    branding.metaDescription = `Join ${companyName} — explore open roles and apply in minutes.`;
  }
  if (needsEnglishNormalization(branding.landing?.about?.body)) {
    branding.landing!.about!.body =
      `${companyName} is growing across teams and locations.\n\nExplore careers where you can make an impact and develop new skills.`;
  }
  if (needsEnglishNormalization(branding.landing?.technology?.body)) {
    branding.landing!.technology!.body =
      `Join teams building technology and solutions that help ${companyName} deliver for customers every day.`;
  }
  if (needsEnglishNormalization(branding.landing?.lifeAt?.subheading)) {
    branding.landing!.lifeAt!.subheading =
      `Ready to take the next step in your career? Join ${companyName} and grow with our team.`;
  }

  applyCanonicalEnglishHeadings(branding);
  buildCareersCopyFallback(branding);
}
type TranslationPayload = {
  heroHeadline?: string;
  heroSubheadline?: string;
  metaDescription?: string;
  aboutBody?: string;
  technologyBody?: string;
  lifeAtSubheading?: string;
};

/** Translate scraped prospect copy to English for the careers site UI. */
export async function translateProspectCopyToEnglish(
  branding: ProspectBrandingJson,
): Promise<void> {
  if (!brandingNeedsEnglishCopy(branding)) return;

  if (!process.env.GEMINI_API_KEY?.trim()) {
    console.warn(
      'GEMINI_API_KEY not set — prospect copy left in source language. Set GEMINI_API_KEY for English normalization.',
    );
    return;
  }

  const payload: TranslationPayload = {};
  if (needsEnglishNormalization(branding.hero?.headline)) {
    payload.heroHeadline = branding.hero?.headline;
  }
  if (needsEnglishNormalization(branding.hero?.subheadline)) {
    payload.heroSubheadline = branding.hero?.subheadline;
  }
  if (needsEnglishNormalization(branding.metaDescription)) {
    payload.metaDescription = branding.metaDescription;
  }
  if (needsEnglishNormalization(branding.landing?.about?.body)) {
    payload.aboutBody = branding.landing?.about?.body;
  }
  if (needsEnglishNormalization(branding.landing?.technology?.body)) {
    payload.technologyBody = branding.landing?.technology?.body;
  }
  if (needsEnglishNormalization(branding.landing?.lifeAt?.subheading)) {
    payload.lifeAtSubheading = branding.landing?.lifeAt?.subheading;
  }

  if (Object.keys(payload).length === 0) return;

  const companyName = branding.companyName?.trim() || 'the company';
  const prompt = `You translate careers website copy to natural US English for candidates.
Company: ${companyName}
Return JSON with the same keys as input; translate only provided string values. Keep proper nouns (AWS, Google Cloud, Telefónica Tech). No marketing fluff.

Input:
${JSON.stringify(payload)}`;

  try {
    const raw = await generateJsonWithFallback(prompt);
    const translated = JSON.parse(raw) as TranslationPayload;

    if (translated.heroHeadline && branding.hero) {
      branding.hero.headline = translated.heroHeadline.trim();
    }
    if (translated.heroSubheadline && branding.hero) {
      branding.hero.subheadline = translated.heroSubheadline.trim();
    }
    if (translated.metaDescription) {
      const desc = translated.metaDescription.trim();
      branding.metaDescription = desc.startsWith('Join ')
        ? desc
        : `Join ${companyName} — ${desc}`;
    }
    if (translated.aboutBody && branding.landing?.about) {
      branding.landing.about.body = translated.aboutBody.trim();
      branding.landing.about.heading = CANONICAL_SECTION_HEADINGS.about;
    }
    if (translated.technologyBody && branding.landing?.technology) {
      branding.landing.technology.body = translated.technologyBody.trim();
      branding.landing.technology.heading = CANONICAL_SECTION_HEADINGS.technology;
    }
    if (translated.lifeAtSubheading && branding.landing?.lifeAt) {
      branding.landing.lifeAt.subheading = translated.lifeAtSubheading.trim();
      branding.landing.lifeAt.heading = CANONICAL_SECTION_HEADINGS.lifeAt;
    }
  } catch (error) {
    console.warn(
      `Prospect copy translation failed: ${error instanceof Error ? error.message : error}`,
    );
    applyFallbackEnglishCopy(branding);
  }

  if (brandingNeedsEnglishCopy(branding)) {
    applyFallbackEnglishCopy(branding);
  }
}

export function applyCanonicalEnglishHeadings(branding: ProspectBrandingJson): void {
  if (branding.landing?.about) {
    branding.landing.about.heading = CANONICAL_SECTION_HEADINGS.about;
  }
  if (branding.landing?.customers) {
    branding.landing.customers.heading = CANONICAL_SECTION_HEADINGS.customers;
  }
  if (branding.landing?.technology) {
    branding.landing.technology.heading = CANONICAL_SECTION_HEADINGS.technology;
  }
  if (branding.landing?.lifeAt) {
    branding.landing.lifeAt.heading = CANONICAL_SECTION_HEADINGS.lifeAt;
  }
  if (branding.landing?.coreValues) {
    branding.landing.coreValues.heading = CANONICAL_SECTION_HEADINGS.coreValues;
  }
}
