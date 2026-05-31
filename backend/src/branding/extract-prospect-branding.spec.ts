import {
  pickPrimaryBrandColor,
  rankBrandColors,
} from './extract-prospect-branding';

const GGTECH_CSS_SNIPPET = `
  #fff { color: white; }
  #000 { color: black; }
  #181818 { color: #181818; }
  #ff003d { background: #ff003d; }
  #212121 { color: #212121; }
  #c50634 { border-color: #c50634; }
  #003366 { color: #003366; }
`;

describe('rankBrandColors', () => {
  it('prefers GGTech brand red over generic template navy', () => {
    const hexes = GGTECH_CSS_SNIPPET.match(/#[0-9a-fA-F]{3,6}\b/gi) ?? [];
    const ranked = rankBrandColors(hexes);
    expect(ranked[0]).toBe('#FF003D');
    expect(ranked).not.toHaveLength(0);
    const navyIndex = ranked.indexOf('#003366');
    const redIndex = ranked.indexOf('#FF003D');
    expect(redIndex).toBeGreaterThanOrEqual(0);
    if (navyIndex >= 0) expect(redIndex).toBeLessThan(navyIndex);
  });
});

describe('pickPrimaryBrandColor', () => {
  it('returns override when provided', () => {
    expect(
      pickPrimaryBrandColor({
        colors: ['#003366', '#FF003D'],
        themeColor: '#FFFFFF',
        override: '#112233',
      }),
    ).toBe('#112233');
  });

  it('picks ranked brand color over theme-color white', () => {
    expect(
      pickPrimaryBrandColor({
        colors: rankBrandColors(['#003366', '#FF003D', '#181818']),
        themeColor: '#FFFFFF',
      }),
    ).toBe('#FF003D');
  });
});
