function normalizeLocation(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function stripTrailingContactNoise(value: string): string {
  return value
    .replace(/\s+(Phone|Email|Tel|Téléphone|E-mail|WWW|Web|LinkedIn).*/i, '')
    .trim();
}

const LABELED_ADDRESS =
  /(?:^|\n)\s*(?:Address|Adresse|Location|Lieu|Residence|Résidence)\s*:\s*(.+)/i;

const US_CITY_STATE_ZIP =
  /\b([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]{1,40},\s*[A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?\b/;

const CA_CITY_PROVINCE_POSTAL =
  /\b([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]{1,40},\s*[A-Za-zÀ-ÿ]{2,30})(?:\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d))?\b/i;

/** Infer candidate home/mailing location from raw resume text when AI omits it. */
export function inferLocationFromResumeText(text: string): string | undefined {
  const labeled = text.match(LABELED_ADDRESS);
  if (labeled?.[1]) {
    const cleaned = normalizeLocation(stripTrailingContactNoise(labeled[1]));
    if (cleaned.length >= 3 && cleaned.length <= 120) return cleaned;
  }

  const usMatch = text.match(US_CITY_STATE_ZIP);
  if (usMatch) {
    const cityState = normalizeLocation(usMatch[1]);
    const zip = usMatch[2]?.trim();
    return zip ? `${cityState} ${zip}` : cityState;
  }

  const caMatch = text.match(CA_CITY_PROVINCE_POSTAL);
  if (caMatch) {
    const cityProv = normalizeLocation(caMatch[1]);
    const postal = caMatch[2]?.replace(/\s+/g, ' ').trim().toUpperCase();
    return postal ? `${cityProv} ${postal}` : cityProv;
  }

  return undefined;
}

export function withInferredLocation(
  extracted: { location?: string | null },
  text: string,
): string | undefined {
  const existing = extracted.location?.trim();
  if (existing) return existing;
  return inferLocationFromResumeText(text);
}
