import axios from 'axios';

export type ProspectBrandingPayload = Record<string, unknown>;

const PROVISION_KEY_STORAGE = 'careers_provision_api_key';

export function getStoredProvisionKey(): string | null {
  try {
    return sessionStorage.getItem(PROVISION_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setStoredProvisionKey(key: string) {
  sessionStorage.setItem(PROVISION_KEY_STORAGE, key);
}

export function clearStoredProvisionKey() {
  sessionStorage.removeItem(PROVISION_KEY_STORAGE);
}

function internalClient(provisionKey: string) {
  return axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    headers: { 'X-Provision-Key': provisionKey },
  });
}

export type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  hostname: string | null;
  subdomain: string;
  demo_url: string | null;
};

export async function listTenants(provisionKey: string): Promise<TenantSummary[]> {
  const { data } = await internalClient(provisionKey).get<TenantSummary[]>('/internal/tenants');
  return data;
}

export async function provisionTenant(
  provisionKey: string,
  payload: {
    slug: string;
    name: string;
    branding: ProspectBrandingPayload;
  },
): Promise<{ tenant: TenantSummary; demo_url: string | null }> {
  const { data } = await internalClient(provisionKey).post('/internal/tenants', {
    slug: payload.slug,
    name: payload.name,
    subdomain: payload.slug,
    branding: payload.branding,
  });
  return data;
}

export async function updateTenantBranding(
  provisionKey: string,
  slug: string,
  branding: ProspectBrandingPayload,
  name?: string,
): Promise<{ tenant: TenantSummary; demo_url: string | null }> {
  const { data } = await internalClient(provisionKey).patch(`/internal/tenants/${slug}`, {
    name,
    branding,
  });
  return data;
}

export function buildProspectBranding(input: {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  heroHeadline: string;
  heroSubheadline?: string;
  metaDescription?: string;
}): ProspectBrandingPayload {
  const companyName = input.companyName.trim();
  return {
    companyName,
    logoAlt: companyName,
    logoUrl: input.logoUrl?.trim() || undefined,
    metaDescription:
      input.metaDescription?.trim() ||
      `Explore careers at ${companyName}. Search open roles and apply in minutes.`,
    colors: {
      primary: input.primaryColor,
      primaryForeground: '#FFFFFF',
      navLink: input.primaryColor,
    },
    hero: {
      badgeText: "We're hiring!",
      headline: input.heroHeadline.trim(),
      subheadline: input.heroSubheadline?.trim(),
    },
    landing: {
      about: {
        heading: `About ${companyName}`,
        body: `Join ${companyName} and explore opportunities across teams and locations.`,
        stats: [],
        ctaLabel: 'View open positions',
      },
    },
  };
}

export type BrandingFromUrlResult = {
  sourceUrl: string;
  companyName: string;
  suggestedSlug: string;
  branding: ProspectBrandingPayload;
};

export async function fetchBrandingFromUrl(
  provisionKey: string,
  url: string,
  overrides?: { companyName?: string; slug?: string; primaryColor?: string },
): Promise<BrandingFromUrlResult> {
  const { data } = await internalClient(provisionKey).post<BrandingFromUrlResult>(
    '/internal/branding/from-url',
    {
      url,
      companyName: overrides?.companyName,
      slug: overrides?.slug,
      primaryColor: overrides?.primaryColor,
    },
  );
  return data;
}
