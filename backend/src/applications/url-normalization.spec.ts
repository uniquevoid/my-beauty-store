import {
  isValidHttpUrl,
  normalizeExtractedLinks,
  normalizeOptionalUrl,
} from './url-normalization';

describe('url-normalization', () => {
  it('adds https to bare linkedin URLs', () => {
    expect(normalizeOptionalUrl('linkedin.com/in/foo')).toBe('https://linkedin.com/in/foo');
  });

  it('preserves existing https URLs', () => {
    expect(normalizeOptionalUrl('https://github.com/user')).toBe('https://github.com/user');
  });

  it('returns null for empty or invalid input', () => {
    expect(normalizeOptionalUrl('')).toBeNull();
    expect(normalizeOptionalUrl('not a url!!!')).toBeNull();
  });

  it('normalizes extracted links array', () => {
    expect(normalizeExtractedLinks(['linkedin.com/in/foo'])).toEqual(['https://linkedin.com/in/foo']);
  });

  it('validates via isValidHttpUrl after normalization', () => {
    expect(isValidHttpUrl('linkedin.com/in/foo')).toBe(true);
    expect(isValidHttpUrl('not a url')).toBe(false);
  });
});
