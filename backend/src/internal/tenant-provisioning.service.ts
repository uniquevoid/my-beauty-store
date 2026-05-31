import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ProspectBrandingJson } from '../branding/branding-schema.types';
import {
  formatValidationErrors,
  validateVisualBrandParity,
} from '../branding/validate-visual-brand-parity';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import {
  DEMO_CANDIDATE_CREDENTIALS,
  seedDemoCandidateForTenant,
} from '../careers/seed-demo-candidate';
import { seedDemoJobsForTenant } from '../careers/seed-demo-jobs';
import { SupabaseService } from '../supabase/supabase.service';
import { buildShareableDemoUrl } from './demo-url';

function demoHostnameForSlug(slug: string): string | null {
  const platform = process.env.PLATFORM_DOMAIN?.trim();
  if (!platform) return null;
  return `${slug}.${platform}`;
}

@Injectable()
export class TenantProvisioningService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  async provisionTenant(input: {
    slug: string;
    name: string;
    hostname?: string;
    subdomain?: string;
    branding_json?: Record<string, unknown>;
  }) {
    const slug = input.slug.trim();
    const subdomain = input.subdomain?.trim() || slug;
    const hostname = input.hostname?.trim() ?? demoHostnameForSlug(slug) ?? null;

    const { data: tenant, error: tenantErr } = await this.supabase.adminClient
      .from('tenants')
      .insert({
        slug,
        name: input.name.trim(),
        hostname,
        subdomain,
        branding_json: input.branding_json ?? {},
      })
      .select('*')
      .single();

    if (tenantErr) throw tenantErr;

    await this.adminAuth.ensureDefaultAdmin(tenant.id);

    const { error: profileErr } = await this.supabase.adminClient
      .from('job_import_profiles')
      .insert({
        tenant_id: tenant.id,
        name: 'default',
        column_map: {
          slug: 'slug',
          title: 'title',
          department: 'department',
          location: 'location',
          employment_type: 'employment_type',
          area_of_interest: 'area_of_interest',
          workplace_type: 'workplace_type',
          description: 'description',
          status: 'status',
          'Requisition ID': 'external_id',
          'Job Title': 'title',
        },
        value_map: {
          status: {
            published: 'published',
            open: 'published',
            active: 'published',
            draft: 'draft',
            closed: 'closed',
            filled: 'closed',
          },
        },
        sync_mode: 'delta',
        is_default: true,
      });

    if (profileErr) throw profileErr;

    await seedDemoJobsForTenant(this.supabase.adminClient, tenant.id);
    await seedDemoCandidateForTenant(this.supabase.adminClient, tenant.id);

    const demoUrl = buildShareableDemoUrl(subdomain);

    return {
      tenant,
      demo_url: demoUrl,
      admin: { username: 'admin', password: 'user', must_change_password: true },
      candidate: { ...DEMO_CANDIDATE_CREDENTIALS },
    };
  }

  async listTenants() {
    const { data, error } = await this.supabase.adminClient
      .from('tenants')
      .select('id, slug, name, hostname, subdomain, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      ...row,
      demo_url: buildShareableDemoUrl(row.subdomain ?? row.slug),
    }));
  }

  async updateTenant(
    slug: string,
    input: {
      name?: string;
      hostname?: string;
      subdomain?: string;
      branding?: Record<string, unknown>;
    },
  ) {
    const { data: existing, error: findErr } = await this.supabase.adminClient
      .from('tenants')
      .select('*')
      .eq('slug', slug.trim())
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) throw new NotFoundException(`Tenant not found: ${slug}`);

    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.hostname !== undefined) patch.hostname = input.hostname.trim() || null;
    if (input.subdomain !== undefined) patch.subdomain = input.subdomain.trim();

    if (input.branding !== undefined) {
      const merged = {
        ...(existing.branding_json ?? {}),
        ...input.branding,
      } as ProspectBrandingJson;
      const parity = validateVisualBrandParity(merged, {
        skipPlaywrightCheck: true,
      });
      if (!parity.ok) {
        throw new BadRequestException({
          message: 'Visual brand parity check failed',
          errors: parity.errors,
          hint: formatValidationErrors(parity.errors),
        });
      }
      patch.branding_json = merged;
    }

    if (Object.keys(patch).length === 0) {
      return { tenant: existing, updated: false };
    }

    const { data: tenant, error } = await this.supabase.adminClient
      .from('tenants')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;

    return { tenant, demo_url: buildShareableDemoUrl(tenant.subdomain ?? slug), updated: true };
  }

  async ensureDefaultTenant(branding?: Record<string, unknown>) {
    const { data: existing } = await this.supabase.adminClient
      .from('tenants')
      .select('id')
      .eq('slug', 'default')
      .maybeSingle();

    if (existing) {
      await this.adminAuth.ensureDefaultAdmin(existing.id);
      await seedDemoJobsForTenant(this.supabase.adminClient, existing.id);
      await seedDemoCandidateForTenant(this.supabase.adminClient, existing.id);
      if (branding && Object.keys(branding).length) {
        await this.supabase.adminClient
          .from('tenants')
          .update({ branding_json: branding })
          .eq('id', existing.id);
      }
      return { tenant_id: existing.id, created: false };
    }

    const result = await this.provisionTenant({
      slug: 'default',
      name: 'Default Tenant',
      hostname: 'localhost',
      subdomain: 'default',
      branding_json: branding ?? {},
    });

    return { tenant_id: result.tenant.id, created: true, admin: result.admin };
  }
}
