import type { JobRow } from '../jobs/jobs.service';

const PLATFORM_FEATURES = [
  'Browse and search published job openings',
  'Upload a resume for AI-powered job recommendations',
  'Apply online with resume pre-fill assistance',
  'Create personalized job alerts',
];

const MAX_JOBS = 20;
const MAX_DESC_CHARS = 200;
const MAX_CONTEXT_CHARS = 12_000;

function truncate(text: string | null | undefined, max: number): string | null {
  if (!text?.trim()) return null;
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max).trim()}…`;
}

function pickString(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pickNestedString(
  obj: Record<string, unknown>,
  path: string[],
): string | null {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' && current.trim() ? current.trim() : null;
}

export type CareerChatContext = {
  company: {
    name: string;
    metaDescription: string | null;
    heroHeadline: string | null;
    heroSubheadline: string | null;
  };
  culture: {
    about: string | null;
    coreValues: string[];
    testimonials: Array<{ quote: string; name: string; role: string }>;
  };
  platformFeatures: string[];
  jobs: Array<{
    title: string;
    slug: string;
    location: string | null;
    department: string | null;
    description: string | null;
  }>;
};

export function buildCareerChatContext(
  tenantName: string,
  brandingJson: Record<string, unknown>,
  jobs: JobRow[],
): CareerChatContext {
  const landing = (brandingJson.landing as Record<string, unknown> | undefined) ?? {};
  const about = (landing.about as Record<string, unknown> | undefined) ?? {};
  const coreValuesBlock = (landing.coreValues as Record<string, unknown> | undefined) ?? {};
  const testimonialsBlock = (landing.testimonials as Record<string, unknown> | undefined) ?? {};
  const hero = (brandingJson.hero as Record<string, unknown> | undefined) ?? {};

  const coreValuesRaw = Array.isArray(coreValuesBlock.values)
    ? (coreValuesBlock.values as Array<Record<string, unknown>>)
    : [];
  const coreValues = coreValuesRaw
    .map((v) => (typeof v.label === 'string' ? v.label.trim() : ''))
    .filter(Boolean)
    .slice(0, 8);

  const testimonialsRaw = Array.isArray(testimonialsBlock.items)
    ? (testimonialsBlock.items as Array<Record<string, unknown>>)
    : [];
  const testimonials = testimonialsRaw
    .slice(0, 3)
    .map((item) => ({
      quote: truncate(typeof item.quote === 'string' ? item.quote : '', 120) ?? '',
      name: typeof item.name === 'string' ? item.name : '',
      role: typeof item.role === 'string' ? item.role : '',
    }))
    .filter((t) => t.quote);

  const companyName =
    pickString(brandingJson, 'companyName') ?? tenantName;

  return {
    company: {
      name: companyName,
      metaDescription: pickString(brandingJson, 'metaDescription'),
      heroHeadline: pickString(hero, 'headline'),
      heroSubheadline: pickString(hero, 'subheadline'),
    },
    culture: {
      about: truncate(pickNestedString(landing, ['about', 'body']), 500),
      coreValues,
      testimonials,
    },
    platformFeatures: PLATFORM_FEATURES,
    jobs: jobs.slice(0, MAX_JOBS).map((job) => ({
      title: job.title,
      slug: job.slug,
      location: job.location,
      department: job.department,
      description: truncate(job.description, MAX_DESC_CHARS),
    })),
  };
}

export function serializeCareerChatContext(context: CareerChatContext): string {
  let serialized = JSON.stringify(context, null, 2);
  if (serialized.length > MAX_CONTEXT_CHARS) {
    const trimmed = { ...context, jobs: context.jobs.slice(0, 10) };
    serialized = JSON.stringify(trimmed, null, 2);
    if (serialized.length > MAX_CONTEXT_CHARS) {
      serialized = JSON.stringify({ ...trimmed, culture: { ...trimmed.culture, about: truncate(trimmed.culture.about, 200) } });
    }
  }
  return serialized;
}
