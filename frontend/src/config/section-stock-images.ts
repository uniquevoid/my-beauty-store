/** Career/HR-themed stock photos for landing section panels (mirrors backend STOCK_SECTION_IMAGES). */
export const SECTION_STOCK_IMAGES = {
  cultureSpotlight:
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
  jobAlerts:
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
} as const;

export type SectionStockKey = keyof typeof SECTION_STOCK_IMAGES;

export function resolveSectionStockImage(section: SectionStockKey): string {
  return SECTION_STOCK_IMAGES[section];
}
