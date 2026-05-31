/** Canonical English headings for prospect careers landing sections. */
export const CANONICAL_SECTION_HEADINGS = {
  about: 'About us',
  customers: 'Our partners',
  technology: 'What we do',
  lifeAt: 'Join our team',
  coreValues: 'Our culture',
  cultureSpotlight: 'Team stories',
} as const;

export function buildCultureSpotlightHeading(companyName: string): string {
  return `Life at ${companyName}`;
}

export function buildCultureSpotlightBody(companyName: string): string {
  return `Curious what it's like to work at ${companyName}? Read how our team members describe their experience, culture, and growth.`;
}

export const CULTURE_SPOTLIGHT_CTA_LABEL = 'Read the story';

export const CAREERS_SITE_LANGUAGES = {
  default: 'en' as const,
  options: [{ code: 'en', label: 'English' }],
};
