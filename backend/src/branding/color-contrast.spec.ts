import {
  deriveReadableText,
  deriveSectionSurface,
  isNeutralBrandColor,
  meetsContrastAA,
} from './color-contrast';

describe('color-contrast accessibility helpers', () => {
  it('flags neutral colors', () => {
    expect(isNeutralBrandColor('#FFFFFF')).toBe(true);
    expect(isNeutralBrandColor('#181818')).toBe(true);
    expect(isNeutralBrandColor('#FF6900')).toBe(false);
  });

  it('derives light text on dark backgrounds when extracted text fails contrast', () => {
    const text = deriveReadableText('#0B0124', '#334155');
    expect(meetsContrastAA(text, '#0B0124', 4.5)).toBe(true);
  });

  it('derives light surface band on dark page backgrounds', () => {
    const { surface, surfaceText } = deriveSectionSurface('#0B0124', '#FF6900');
    expect(surface).toBe('#F4F4F5');
    expect(meetsContrastAA(surfaceText, surface, 4.5)).toBe(true);
  });
});
