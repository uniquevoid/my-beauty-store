import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { BrandingModule } from '../branding/branding.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { TenantsModule } from '../tenants/tenants.module';
import { InternalBrandingController } from './internal-branding.controller';
import { InternalController } from './internal.controller';
import { TenantProvisioningService } from './tenant-provisioning.service';

@Module({
  imports: [SupabaseModule, AdminAuthModule, TenantsModule, BrandingModule],
  controllers: [InternalController, InternalBrandingController],
  providers: [TenantProvisioningService],
  exports: [TenantProvisioningService],
})
export class InternalModule {}
