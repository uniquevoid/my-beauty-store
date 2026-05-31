import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { DatabaseModule } from '../database/database.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { TenantBootstrapService } from './tenant-bootstrap.service';
import { TenantMiddleware } from './tenant.middleware';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [DatabaseModule, SupabaseModule, AdminAuthModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantMiddleware, TenantBootstrapService],
  exports: [TenantsService, TenantMiddleware],
})
export class TenantsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
