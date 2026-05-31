import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildProspectBrandingFromSnapshot,
  deriveHeroOverlay,
  type VisualBrandSnapshot,
} from './brand-token-derivation';
import { isNeutralBrandColor, meetsContrastAA } from './color-contrast';
import { finalizeProspectBranding } from './finalize-prospect-branding';
import { validateVisualBrandParity } from './validate-visual-brand-parity';

describe('brand-token-derivation', () => {
  const ggtechPath = resolve(__dirname, '__fixtures__/ggtech-visual-snapshot.json');
  const vivaPath = resolve(__dirname, '__fixtures__/vivastudios-visual-snapshot.json');
  const ggtechSnapshot = JSON.parse(readFileSync(ggtechPath, 'utf-8')) as VisualBrandSnapshot;
  const vivaSnapshot = JSON.parse(readFileSync(vivaPath, 'utf-8')) as VisualBrandSnapshot;

  it('derives GGTech primary red from fixture snapshot', () => {
    const branding = buildProspectBrandingFromSnapshot(ggtechSnapshot, 'playwright');
    expect(branding.colors?.primary).toBe('#FF003D');
    expect(branding.typography?.fontFamilySans).toContain('Montserrat');
    expect(branding.typography?.headingStyle).toBe('uppercase');
    expect(branding.hero?.backgroundImageUrl).toBe('https://ggtech.gg/ogimage.jpg');
    expect(branding.components?.header?.background).toBeTruthy();
    expect(branding.components?.primaryButton?.background).toBeTruthy();
  });

  it('passes visual parity validation for GGTech after finalize', async () => {
    const branding = await finalizeProspectBranding(
      buildProspectBrandingFromSnapshot(ggtechSnapshot, 'playwright'),
    );
    const result = validateVisualBrandParity(branding);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('derives accessible primary foreground for GGTech red', () => {
    const branding = buildProspectBrandingFromSnapshot(ggtechSnapshot, 'playwright');
    expect(branding.colors?.primaryForeground).toBe('#FFFFFF');
    expect(branding.colors?.mutedOnPrimary).toBeTruthy();
  });

  it('does not promote white CTA button to primary on dark Viva-like site', () => {
    const branding = buildProspectBrandingFromSnapshot(vivaSnapshot, 'playwright');
    expect(branding.colors?.primary).not.toBe('#FFFFFF');
    expect(isNeutralBrandColor(branding.colors?.primary ?? '')).toBe(false);
    expect(branding.components?.primaryButton?.background).toBe('#FFFFFF');
  });

  it('derives light readable text on Viva dark background', () => {
    const branding = buildProspectBrandingFromSnapshot(vivaSnapshot, 'playwright');
    expect(meetsContrastAA(branding.colors?.text ?? '', branding.colors?.background ?? '', 4.5)).toBe(
      true,
    );
    expect(meetsContrastAA(
      branding.colors?.navLink ?? '',
      branding.components?.header?.background ?? '',
      4.5,
    )).toBe(true);
  });

  it('derives surface band and job alerts image for Viva after finalize', async () => {
    const branding = await finalizeProspectBranding(
      buildProspectBrandingFromSnapshot(vivaSnapshot, 'playwright'),
    );
    expect(branding.colors?.surface).toBeTruthy();
    expect(branding.colors?.surfaceText).toBeTruthy();
    expect(meetsContrastAA(
      branding.colors?.surfaceText ?? '',
      branding.colors?.surface ?? '',
      4.5,
    )).toBe(true);
    expect(branding.landing?.jobAlerts?.imageUrl).toBeTruthy();
    expect(branding.hero?.backgroundImageUrl).toContain('Gladiator_Chica_Pose1.png');
    const result = validateVisualBrandParity(branding);
    expect(result.ok).toBe(true);
  });

  it('builds dark-site hero overlay', () => {
    const overlay = deriveHeroOverlay('#FF003D', '#111111');
    expect(overlay).toContain('linear-gradient');
    expect(overlay).toContain('255');
  });

  it('builds dark-first hero overlay for light page backgrounds', () => {
    const overlay = deriveHeroOverlay('#A58F8F', '#FFFFFF');
    expect(overlay).toContain('rgba(0, 0, 0, 0.6)');
    expect(overlay).not.toContain('0.88');
  });
});
