import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { TenantContext, TenantRow } from './tenant.types';

function normalizeHost(host: string | undefined): string | null {
  if (!host) return null;
  const value = host.split(',')[0]?.trim().toLowerCase() ?? '';
  if (!value) return null;
  return value.replace(/:\d+$/, '');
}

function subdomainFromHost(host: string, platformDomain?: string): string | null {
  if (!platformDomain) return null;
  const base = platformDomain.toLowerCase();
  if (!host.endsWith(`.${base}`) || host === base) return null;
  const sub = host.slice(0, -(base.length + 1));
  if (!sub || sub.includes('.')) return null;
  return sub;
}

@Injectable()
export class TenantsService {
  constructor(private readonly supabase: SupabaseService) {}

  toContext(row: TenantRow): TenantContext {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      branding_json: row.branding_json ?? {},
    };
  }

  async resolveFromRequest(options: {
    host?: string;
    tenantSlug?: string;
  }): Promise<TenantContext> {
    const slugOverride = options.tenantSlug?.trim();
    if (slugOverride) {
      return this.toContext(await this.findBySlug(slugOverride));
    }

    const host = normalizeHost(options.host);
    if (host) {
      const byHostname = await this.findByHostname(host);
      if (byHostname) return this.toContext(byHostname);

      const platformDomain = process.env.PLATFORM_DOMAIN?.trim();
      const sub = platformDomain ? subdomainFromHost(host, platformDomain) : null;
      if (sub) {
        return this.toContext(await this.findBySubdomain(sub));
      }
    }

    const fallbackSlug = process.env.DEFAULT_TENANT_SLUG?.trim() || 'default';
    return this.toContext(await this.findBySlug(fallbackSlug));
  }

  async findBySlug(slug: string): Promise<TenantRow> {
    const { data, error } = await this.supabase.adminClient
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException(`Tenant not found: ${slug}`);
    return data as TenantRow;
  }

  async findByHostname(hostname: string): Promise<TenantRow | null> {
    const { data, error } = await this.supabase.adminClient
      .from('tenants')
      .select('*')
      .eq('hostname', hostname)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as TenantRow | null;
  }

  async findBySubdomain(subdomain: string): Promise<TenantRow> {
    const { data, error } = await this.supabase.adminClient
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException(`Tenant not found for subdomain: ${subdomain}`);
    return data as TenantRow;
  }

  async getCurrent(tenantId: string): Promise<TenantContext> {
    const { data, error } = await this.supabase.adminClient
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Tenant not found.');
    return this.toContext(data as TenantRow);
  }
}
