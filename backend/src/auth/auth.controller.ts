import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { CurrentTenant } from '../tenants/tenant.decorator';
import type { TenantContext } from '../tenants/tenant.types';
import { AuthService } from './auth.service';

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('/register')
  async register(
    @CurrentTenant() tenant: TenantContext,
    @Body()
    body: {
      email?: string;
      password?: string;
      passwordConfirm?: string;
      applicationCode?: string;
      firstName?: string;
      lastName?: string;
      positionTitle?: string;
    },
  ) {
    return await this.auth.register(tenant.id, body.email ?? '', body.password ?? '', {
      applicationCode: body.applicationCode,
      passwordConfirm: body.passwordConfirm,
      firstName: body.firstName,
      lastName: body.lastName,
      positionTitle: body.positionTitle,
    });
  }

  @Post('/login')
  async login(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { email?: string; password?: string },
  ) {
    return await this.auth.login(tenant.id, body.email ?? '', body.password ?? '');
  }

  @Get('/me')
  async me(@Headers('authorization') authorization?: string) {
    const token = (authorization ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new UnauthorizedException('Missing token.');
    return this.auth.verifyCandidateToken(token);
  }
}

