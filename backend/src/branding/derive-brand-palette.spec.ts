import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildProspectBrandingFromSnapshot,
  type VisualBrandSnapshot,
} from './brand-token-derivation';
import { deriveBrandPalette, isOrangeBrandNoise } from './derive-brand-palette';
import { validateVisualBrandParity } from './validate-visual-brand-parity';
import { finalizeProspectBranding } from './finalize-prospect-branding';

describe('deriveBrandPalette', () => {
  const fixturePath = resolve(__dirname, '__fixtures__/altostratus-visual-snapshot.json');
  const snapshot = JSON.parse(readFileSync(fixturePath, 'utf-8')) as VisualBrandSnapshot;

  it('prefers pink CTA over orange CSS noise for Altostratus-like sites', () => {
    const palette = deriveBrandPalette({
      cssColors: snapshot.cssColors,
      themeColor: snapshot.themeColor,
      roles: {
        ctaBackground: snapshot.primaryButton.background,
        headlineColor: snapshot.h1Color,
        footerBackground: snapshot.footer.background,
      },
    });
    expect(isOrangeBrandNoise(palette.primary)).toBe(false);
    expect(palette.primary).toMatch(/#E91E8C|#EB1E8C|#E91E|#D91E8C/i);
  });

  it('uses blue headline as accent when distinct from primary', () => {
    const palette = deriveBrandPalette({
      cssColors: snapshot.cssColors,
      themeColor: null,
      roles: {
        ctaBackground: snapshot.primaryButton.background,
        headlineColor: snapshot.h1Color,
      },
    });
    expect(palette.accent).not.toBe(palette.primary);
    const b = parseInt(palette.accent.slice(5, 7), 16);
    expect(b).toBeGreaterThan(100);
  });

  it('passes visual parity after finalize for Altostratus fixture', async () => {
    const branding = await finalizeProspectBranding(
      buildProspectBrandingFromSnapshot(snapshot, 'playwright'),
    );
    const result = validateVisualBrandParity(branding);
    expect(result.ok).toBe(true);
    expect(branding.colors?.primary).toBeTruthy();
    expect(isOrangeBrandNoise(branding.colors?.primary ?? '')).toBe(false);
  });
});
