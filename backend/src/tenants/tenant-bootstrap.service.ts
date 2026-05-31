import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { AdminAuthService } from '../admin-auth/admin-auth.service';
import {
  DEMO_CANDIDATE_CREDENTIALS,
  seedDemoCandidateForTenant,
} from '../careers/seed-demo-candidate';
import { seedDemoJobsForTenant } from '../careers/seed-demo-jobs';
import { SupabaseService } from '../supabase/supabase.service';



const DEFAULT_IMPORT_PROFILE = {

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

    external_id: 'external_id',

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

  sync_mode: 'delta' as const,

  is_default: true,

};



/**

 * Ensures default tenant + admin + import profile exist after migrations.

 * Safe to run on every startup — no-ops when already provisioned.

 */

@Injectable()

export class TenantBootstrapService implements OnModuleInit {

  private readonly logger = new Logger(TenantBootstrapService.name);



  constructor(

    private readonly supabase: SupabaseService,

    private readonly adminAuth: AdminAuthService,

  ) {}



  async onModuleInit() {

    try {

      await this.ensureDefaultTenant();

    } catch (err) {

      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('does not exist') || message.includes('admin_users')) {

        this.logger.warn(

          'Multi-tenant tables missing. Set DATABASE_URL and restart after migrations, or run: npm run db:migrate',

        );

        return;

      }

      this.logger.error(`Tenant bootstrap failed: ${message}`);

    }

  }



  private async ensureDefaultTenant() {

    const slug = process.env.DEFAULT_TENANT_SLUG?.trim() || 'default';



    const { data: existing } = await this.supabase.adminClient

      .from('tenants')

      .select('id')

      .eq('slug', slug)

      .maybeSingle();



    let tenantId = existing?.id as string | undefined;



    if (!tenantId) {

      const { data: created, error } = await this.supabase.adminClient

        .from('tenants')

        .insert({

          slug,

          name: 'Default Tenant',

          hostname: 'localhost',

          subdomain: slug,

          branding_json: {},

        })

        .select('id')

        .single();



      if (error) throw error;

      tenantId = created.id;

      this.logger.log(`Created default tenant (${slug}).`);

    }



    if (!tenantId) return;



    await this.adminAuth.ensureDefaultAdmin(tenantId);

    await this.ensureDefaultImportProfile(tenantId);

    await seedDemoJobsForTenant(this.supabase.adminClient, tenantId);
    await seedDemoCandidateForTenant(this.supabase.adminClient, tenantId);

    this.logger.log(`Default admin ready for tenant "${slug}" (admin / user).`);
    this.logger.log(
      `Demo candidate ready for tenant "${slug}" (${DEMO_CANDIDATE_CREDENTIALS.email} / ${DEMO_CANDIDATE_CREDENTIALS.password}).`,
    );

  }



  private async ensureDefaultImportProfile(tenantId: string) {

    const { data: existing } = await this.supabase.adminClient

      .from('job_import_profiles')

      .select('id')

      .eq('tenant_id', tenantId)

      .eq('name', DEFAULT_IMPORT_PROFILE.name)

      .maybeSingle();



    if (existing) return;



    const { error } = await this.supabase.adminClient.from('job_import_profiles').insert({

      tenant_id: tenantId,

      ...DEFAULT_IMPORT_PROFILE,

    });



    if (error) throw error;

    this.logger.log('Created default job import profile.');

  }

}


