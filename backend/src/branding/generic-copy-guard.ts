/** Reject generic ATS/careers template copy that should not appear on prospect demos. */

const GENERIC_PHRASES = [
  'enterprise software',
  'talent and acquisition at scale',
  'fortune 500 customers',
  'big 4 accounting firms',
  'helps organizations manage talent',
  'hire with confidence',
  'global tech company that\u2019s all about people',
  "global tech company that's all about people",
  'configurable platform is built by a global engineering organization',
];

const CUSTOMER_FACING_PHRASES = [
  'find the perfect car',
  'find the perfect',
  'buy now',
  'shop now',
  'get a quote',
  'discover our products',
  'your digital transformation starts here',
  'accelerate your digital transformation',
  'compramos tu coche',
  'encuentra el coche',
];

export function isCustomerFacingCopy(text: string | undefined | null): boolean {
  if (!text?.trim()) return false;
  const lower = text.toLowerCase();
  return CUSTOMER_FACING_PHRASES.some((phrase) => lower.includes(phrase));
}

export function isGenericTemplateCopy(text: string | undefined | null): boolean {
  if (!text?.trim()) return true;
  const lower = text.toLowerCase();
  return GENERIC_PHRASES.some((phrase) => lower.includes(phrase));
}

export function isStubAboutBody(text: string | undefined | null, minLength = 40): boolean {
  if (!text?.trim()) return true;
  if (text.trim().length < minLength) return true;
  return isGenericTemplateCopy(text);
}
