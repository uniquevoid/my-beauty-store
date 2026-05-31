/** WCAG 2.x relative luminance and contrast helpers for brand token derivation. */

export function parseHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'transparent' || trimmed === 'rgba(0, 0, 0, 0)') return null;
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    if (trimmed.length === 4) {
      const r = trimmed[1];
      const g = trimmed[2];
      const b = trimmed[3];
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    return trimmed.length === 7 ? trimmed.toUpperCase() : null;
  }
  const rgb = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    const r = Number(rgb[1]).toString(16).padStart(2, '0');
    const g = Number(rgb[2]).toString(16).padStart(2, '0');
    const b = Number(rgb[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  return null;
}

export function relativeLuminance(hex: string): number {
  const normalized = parseHexColor(hex);
  if (!normalized) return 0;
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

const DEFAULT_FOREGROUND_CANDIDATES = ['#FFFFFF', '#F5F5F5', '#181818', '#1A1A1A'];

/** Pick the foreground color with the best contrast against bg (target WCAG AA 4.5:1). */
export function pickAccessibleForeground(
  bgHex: string,
  candidates: string[] = DEFAULT_FOREGROUND_CANDIDATES,
  minRatio = 4.5,
): string {
  const bg = parseHexColor(bgHex);
  if (!bg) return '#FFFFFF';

  let best = candidates[0] ?? '#FFFFFF';
  let bestRatio = 0;

  for (const candidate of candidates) {
    const fg = parseHexColor(candidate);
    if (!fg) continue;
    const ratio = contrastRatio(fg, bg);
    if (ratio >= minRatio) return fg;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = fg;
    }
  }

  return best;
}

/** Foreground for large text on primary-colored sections (WCAG AA 3:1). */
export function pickLargeTextForeground(bgHex: string): string {
  return pickAccessibleForeground(bgHex, DEFAULT_FOREGROUND_CANDIDATES, 3);
}

/** Muted text on a primary background — white at reduced opacity when contrast allows. */
export function deriveMutedOnPrimary(bgHex: string, foregroundHex: string): string {
  const bg = parseHexColor(bgHex);
  const fg = parseHexColor(foregroundHex);
  if (!bg || !fg) return 'rgba(255, 255, 255, 0.85)';

  if (fg === '#FFFFFF' || fg === '#F5F5F5') {
    if (contrastRatio('#FFFFFF', bg) >= 3) return 'rgba(255, 255, 255, 0.85)';
    if (contrastRatio('#E8E8E8', bg) >= 3) return 'rgba(232, 232, 232, 0.95)';
  }

  if (fg === '#181818' || fg === '#1A1A1A') {
    if (contrastRatio('#181818', bg) >= 3) return 'rgba(24, 24, 24, 0.75)';
  }

  return fg;
}

export function meetsContrastAA(foreground: string, background: string, minRatio = 4.5): boolean {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!fg || !bg) return false;
  return contrastRatio(fg, bg) >= minRatio;
}

function mixHexChannels(
  from: { r: number; g: number; b: number },
  to: { r: number; g: number; b: number },
  amount: number,
): string {
  const t = Math.min(1, Math.max(0, amount));
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`.toUpperCase();
}

/** Nudge brand primary toward black/white until it meets large-text contrast on the page background. */
export function adjustPrimaryForPageContrast(
  primary: string,
  background: string,
  minRatio = 3,
): string {
  const base = parseHexColor(primary);
  const bg = parseHexColor(background);
  if (!base || !bg) return primary;
  if (meetsContrastAA(base, bg, minRatio)) return base;

  const rgb = hexToRgb(base);
  if (!rgb) return primary;

  const toward = relativeLuminance(bg) > 0.5 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
  for (let step = 1; step <= 48; step++) {
    const candidate = mixHexChannels(rgb, toward, step / 48);
    if (meetsContrastAA(candidate, bg, minRatio) && !isNeutralBrandColor(candidate)) {
      return candidate;
    }
  }

  return base;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = parseHexColor(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

/** Near-white, near-black, or low-saturation grays unsuitable as brand primary. */
export function isNeutralBrandColor(hex: string): boolean {
  const normalized = parseHexColor(hex);
  if (!normalized) return true;
  const rgb = hexToRgb(normalized);
  if (!rgb) return true;
  const { r, g, b } = rgb;
  if (r > 240 && g > 240 && b > 240) return true;
  if (r < 20 && g < 20 && b < 20) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 12) return true;
  return false;
}

/** Pick readable body/nav text; keep extracted color when it meets WCAG AA on the background. */
export function deriveReadableText(background: string, extractedText?: string | null): string {
  const bg = parseHexColor(background);
  if (!bg) return '#181818';

  const extracted = extractedText ? parseHexColor(extractedText) : null;
  if (extracted && meetsContrastAA(extracted, bg, 4.5)) {
    return extracted;
  }

  return pickAccessibleForeground(bg);
}

export type SectionSurfaceTokens = {
  surface: string;
  surfaceText: string;
};

/** Contrasting band for alternating landing sections (e.g. job alerts). */
export function deriveSectionSurface(
  pageBackground: string,
  accent?: string | null,
): SectionSurfaceTokens {
  const bg = parseHexColor(pageBackground) ?? '#FFFFFF';
  const darkPage = relativeLuminance(bg) < 0.35;

  if (darkPage) {
    const surface = '#F4F4F5';
    return { surface, surfaceText: pickAccessibleForeground(surface) };
  }

  const accentHex = accent ? parseHexColor(accent) : null;
  if (accentHex && !isNeutralBrandColor(accentHex)) {
    const rgb = hexToRgb(accentHex)!;
    const surface = `#${Math.min(rgb.r + 230, 255)
      .toString(16)
      .padStart(2, '0')}${Math.min(rgb.g + 230, 255)
      .toString(16)
      .padStart(2, '0')}${Math.min(rgb.b + 230, 255)
      .toString(16)
      .padStart(2, '0')}`.toUpperCase();
    return { surface, surfaceText: pickAccessibleForeground(surface) };
  }

  const surface = '#FFFFFF';
  return { surface, surfaceText: pickAccessibleForeground(surface) };
}
