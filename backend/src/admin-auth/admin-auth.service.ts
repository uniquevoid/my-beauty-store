import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type AdminUserRow = {
  id: string;
  tenant_id: string;
  username: string;
  password_hash: string;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminTokenPayload = {
  sub: string;
  tenant_id: string;
  username: string;
  role: 'admin';
};

function requireAdminJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) throw new Error('ADMIN_JWT_SECRET or JWT_SECRET is required.');
  return secret;
}

function assertPasswordStrength(password: string) {
  if (!password || password.length < 8) {
    throw new BadRequestException('Password must be at least 8 characters.');
  }
}

@Injectable()
export class AdminAuthService {
  constructor(private readonly supabase: SupabaseService) {}

  signAdminToken(admin: AdminUserRow) {
    const secret = requireAdminJwtSecret();
    const payload: AdminTokenPayload = {
      sub: admin.id,
      tenant_id: admin.tenant_id,
      username: admin.username,
      role: 'admin',
    };
    return jwt.sign(payload, secret, { expiresIn: '12h' });
  }

  verifyAdminToken(token: string): AdminTokenPayload {
    const secret = requireAdminJwtSecret();
    try {
      const payload = jwt.verify(token, secret) as AdminTokenPayload;
      if (payload.role !== 'admin') {
        throw new UnauthorizedException('Invalid admin token.');
      }
      return payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid admin token.');
    }
  }

  adminFromAuthHeader(authorization?: string): AdminTokenPayload {
    const token = (authorization ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new UnauthorizedException('Missing admin token.');
    return this.verifyAdminToken(token);
  }

  async login(tenantId: string, username: string, password: string) {
    const normalizedUsername = username.trim().toLowerCase();
    const { data: admin, error } = await this.supabase.adminClient
      .from('admin_users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (error) throw error;
    if (!admin) throw new UnauthorizedException('Invalid credentials.');

    const row = admin as AdminUserRow;
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials.');

    await this.supabase.adminClient
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', row.id);

    const token = this.signAdminToken(row);
    return {
      admin: {
        id: row.id,
        username: row.username,
        must_change_password: row.must_change_password,
      },
      token,
    };
  }

  async getMe(adminId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('admin_users')
      .select('id, tenant_id, username, must_change_password, last_login_at')
      .eq('id', adminId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new UnauthorizedException('Admin not found.');
    return data;
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string) {
    const { data: admin, error } = await this.supabase.adminClient
      .from('admin_users')
      .select('*')
      .eq('id', adminId)
      .maybeSingle();

    if (error) throw error;
    if (!admin) throw new UnauthorizedException('Admin not found.');

    const row = admin as AdminUserRow;
    const ok = await bcrypt.compare(currentPassword, row.password_hash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect.');

    assertPasswordStrength(newPassword);
    const password_hash = await bcrypt.hash(newPassword, 10);

    const { error: updateErr } = await this.supabase.adminClient
      .from('admin_users')
      .update({ password_hash, must_change_password: false })
      .eq('id', adminId);

    if (updateErr) throw updateErr;
    return { ok: true };
  }

  async ensureDefaultAdmin(tenantId: string, password = 'user') {
    const { data: existing } = await this.supabase.adminClient
      .from('admin_users')
      .select('id, password_hash')
      .eq('tenant_id', tenantId)
      .eq('username', 'admin')
      .maybeSingle();

    if (existing) {
      const valid = await bcrypt.compare(password, (existing as { password_hash: string }).password_hash);
      if (valid) return existing;
      const password_hash = await bcrypt.hash(password, 10);
      await this.supabase.adminClient
        .from('admin_users')
        .update({ password_hash, must_change_password: true })
        .eq('id', existing.id);
      return existing;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await this.supabase.adminClient
      .from('admin_users')
      .insert({
        tenant_id: tenantId,
        username: 'admin',
        password_hash,
        must_change_password: true,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data;
  }
}
