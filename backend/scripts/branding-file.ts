import { readFileSync } from 'fs';
import { resolve } from 'path';

export function loadBrandingFromFile(filePath: string): Record<string, unknown> {
  const resolved = resolve(process.cwd(), filePath);
  const raw = readFileSync(resolved, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Branding file must be a JSON object: ${resolved}`);
  }
  return parsed as Record<string, unknown>;
}

export function demoHostnameForSlug(slug: string): string | null {
  const platform = process.env.PLATFORM_DOMAIN?.trim();
  if (!platform) return null;
  return `${slug}.${platform}`;
}

export { buildShareableDemoUrl } from '../src/internal/demo-url';
