import type { BrandingConfig } from '../config/branding';
import type { CareersConfig } from '../config/careers';
import { http } from './http';

export type TenantCurrent = {
  slug: string;
  name: string;
  branding: Partial<BrandingConfig> & Record<string, unknown>;
  careers?: Partial<CareersConfig>;
};

export async function fetchCurrentTenant(): Promise<TenantCurrent> {
  const { data } = await http.get<TenantCurrent>('/tenants/current');
  return data;
}
