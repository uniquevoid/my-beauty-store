import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

type CandidateRow = {
  id: string;
  email: string;
  password_hash: string;
  profile_json: any;
  created_at: string;
  updated_at: string;
};

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing from environment variables.');
  return secret;
}

function assertPasswordStrength(password: string) {
  if (!password || password.length < 8) {
    throw new BadRequestException('Password must be at least 8 characters.');
  }
  if (!/\d/.test(password)) {
    throw new BadRequestException('Password must include at least one number.');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new BadRequestException('Password must include at least one symbol.');
  }
}

function buildProfileJson(fields: {
  firstName?: string;
  lastName?: string;
  positionTitle?: string;
}) {
  const firstName = fields.firstName?.trim() || '';
  const lastName = fields.lastName?.trim() || '';
  const positionTitle = fields.positionTitle?.trim() || '';
  const name = [firstName, lastName].filter(Boolean).join(' ');

  const profile: Record<string, string> = {};
  if (firstName) profile.firstName = firstName;
  if (lastName) profile.lastName = lastName;
  if (positionTitle) profile.positionTitle = positionTitle;
  if (name) profile.name = name;

  return profile;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly mail: MailService,
  ) {}

  signCandidateToken(candidate: { id: string; email: string; tenant_id: string }) {
    const secret = requireJwtSecret();
    return jwt.sign(
      { sub: candidate.id, email: candidate.email, tenant_id: candidate.tenant_id },
      secret,
      { expiresIn: '7d' },
    );
  }

  async register(
    tenantId: string,
    email: string,
    password: string,
    options?: {
      applicationCode?: string;
      passwordConfirm?: string;
      firstName?: string;
      lastName?: string;
      positionTitle?: string;
    },
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new BadRequestException('Email is required.');

    const firstName = options?.firstName?.trim() ?? '';
    const lastName = options?.lastName?.trim() ?? '';
    if (firstName || lastName) {
      if (!firstName) throw new BadRequestException('First name is required.');
      if (!lastName) throw new BadRequestException('Last name is required.');
    }

    assertPasswordStrength(password);
    if (options?.passwordConfirm !== undefined && password !== options.passwordConfirm) {
      throw new BadRequestException('Passwords do not match.');
    }

    const profile_json = buildProfileJson({
      firstName: options?.firstName,
      lastName: options?.lastName,
      positionTitle: options?.positionTitle,
    });

    const password_hash = await bcrypt.hash(password, 10);

    const { data: created, error: createErr } = await this.supabase.adminClient
      .from('candidates')
      .insert({
        tenant_id: tenantId,
        email: normalizedEmail,
        password_hash,
        ...(Object.keys(profile_json).length > 0 ? { profile_json } : {}),
      })
      .select('*')
      .single();

    if (createErr) throw createErr;

    const applicationCode = options?.applicationCode;
    if (applicationCode) {
      const { data: app, error: appErr } = await this.supabase.adminClient
        .from('applications')
        .select('id, resume_extracted')
        .eq('application_code', applicationCode)
        .maybeSingle();

      if (appErr) throw appErr;
      if (!app) throw new BadRequestException('Invalid application code.');

      const extracted = app.resume_extracted ?? {};

      const { error: linkErr } = await this.supabase.adminClient
        .from('applications')
        .update({ candidate_id: created.id })
        .eq('id', app.id);

      if (linkErr) throw linkErr;

      const { error: profileErr } = await this.supabase.adminClient
        .from('candidates')
        .update({ profile_json: extracted })
        .eq('id', created.id);

      if (profileErr) throw profileErr;

      void this.mail.sendWelcomeEmail({
        to: normalizedEmail,
        candidateName: (extracted as { name?: string }).name,
      });
    } else {
      void this.mail.sendWelcomeEmail({ to: normalizedEmail });
    }

    const token = this.signCandidateToken({
      id: created.id,
      email: created.email,
      tenant_id: tenantId,
    });
    return { candidate: created as CandidateRow, token };
  }

  async login(tenantId: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const { data: candidate, error } = await this.supabase.adminClient
      .from('candidates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) throw error;
    if (!candidate) throw new UnauthorizedException('Invalid credentials.');

    const ok = await bcrypt.compare(password, (candidate as CandidateRow).password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials.');

    const row = candidate as CandidateRow & { tenant_id: string };
    const token = this.signCandidateToken({
      id: row.id,
      email: normalizedEmail,
      tenant_id: row.tenant_id ?? tenantId,
    });
    return { candidate: candidate as CandidateRow, token };
  }

  verifyCandidateToken(token: string) {
    const secret = requireJwtSecret();
    try {
      const payload = jwt.verify(token, secret) as {
        sub: string;
        email: string;
        tenant_id?: string;
      };
      return {
        candidateId: payload.sub,
        email: payload.email,
        tenantId: payload.tenant_id,
      };
    } catch {
      throw new UnauthorizedException('Invalid token.');
    }
  }
}

