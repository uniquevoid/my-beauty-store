export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'suspended';
  hostname: string | null;
  subdomain: string | null;
  branding_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  branding_json: Record<string, unknown>;
};
