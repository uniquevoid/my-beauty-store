import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentTenant } from '../tenants/tenant.decorator';
import type { TenantContext } from '../tenants/tenant.types';
import { AdminAuthService } from './admin-auth.service';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Post('login')
  async login(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { username?: string; password?: string },
  ) {
    const username = body.username?.trim();
    const password = body.password ?? '';
    if (!username || !password) {
      throw new BadRequestException('Username and password are required.');
    }
    const result = await this.adminAuth.login(tenant.id, username, password);
    return { ...result, tenant_slug: tenant.slug };
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const payload = this.adminAuth.adminFromAuthHeader(authorization);
    const admin = await this.adminAuth.getMe(payload.sub);
    if (admin.tenant_id !== payload.tenant_id) {
      throw new UnauthorizedException('Token tenant mismatch.');
    }
    return { admin };
  }

  @Post('change-password')
  async changePassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { currentPassword?: string; newPassword?: string },
  ) {
    const payload = this.adminAuth.adminFromAuthHeader(authorization);
    const currentPassword = body.currentPassword ?? '';
    const newPassword = body.newPassword ?? '';
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current and new password are required.');
    }
    return this.adminAuth.changePassword(payload.sub, currentPassword, newPassword);
  }
}
