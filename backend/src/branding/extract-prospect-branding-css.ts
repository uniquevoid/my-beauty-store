/** CSS color extraction (shared by fetch and Playwright paths). */

function normalizeHexColor(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    if (trimmed.length === 4) {
      const r = trimmed[1];
      const g = trimmed[2];
      const b = trimmed[3];
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    return trimmed.length === 7 ? trimmed.toUpperCase() : trimmed;
  }
  const rgbMatch = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = Number(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = Number(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  return null;
}

function isUsableBrandColor(hex: string | null): boolean {
  if (!hex || hex.length !== 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
  if (r > 240 && g > 240 && b > 240) return false;
  if (r < 20 && g < 20 && b < 20) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 12) return false;
  return true;
}

export function extractHexColorsFromCss(css: string): string[] {
  const found = new Set<string>();
  const hexPattern = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const cssVarPattern = /--(?:brand|primary|accent|color-primary|theme)[^:]*:\s*([^;]+)/gi;

  let match: RegExpExecArray | null;
  while ((match = cssVarPattern.exec(css)) !== null) {
    const normalized = normalizeHexColor(match[1]?.trim() ?? null);
    if (normalized && isUsableBrandColor(normalized)) found.add(normalized);
  }

  for (const hex of css.match(hexPattern) ?? []) {
    const normalized = normalizeHexColor(hex);
    if (normalized && isUsableBrandColor(normalized)) found.add(normalized);
  }

  return [...found];
}
