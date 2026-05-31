import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SupabaseService } from '../supabase/supabase.service';

export type JobAlertRow = {
  id: string;
  candidate_id: string;
  keyword: string | null;
  location: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class JobAlertsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auth: AuthService,
  ) {}

  private authContext(authorization?: string) {
    const token = (authorization ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new UnauthorizedException('Missing token.');
    return this.auth.verifyCandidateToken(token);
  }

  async list(tenantId: string, authorization?: string) {
    const { candidateId, tenantId: tokenTenantId } = this.authContext(authorization);
    if (tokenTenantId && tokenTenantId !== tenantId) {
      throw new UnauthorizedException('Token tenant mismatch.');
    }

    const { data, error } = await this.supabase.adminClient
      .from('job_alerts')
      .select('id, keyword, location, department, created_at, updated_at')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { alerts: data ?? [] };
  }

  async create(
    tenantId: string,
    authorization: string | undefined,
    body: { keyword?: string; location?: string; department?: string },
  ) {
    const { candidateId, tenantId: tokenTenantId } = this.authContext(authorization);
    if (tokenTenantId && tokenTenantId !== tenantId) {
      throw new UnauthorizedException('Token tenant mismatch.');
    }

    const keyword = body.keyword?.trim() || null;
    const location = body.location?.trim() || null;
    const department = body.department?.trim() || null;

    if (!keyword && !location && !department) {
      throw new BadRequestException('Add at least a keyword, location, or department for your alert.');
    }

    const { data, error } = await this.supabase.adminClient
      .from('job_alerts')
      .insert({ tenant_id: tenantId, candidate_id: candidateId, keyword, location, department })
      .select('id, keyword, location, department, created_at, updated_at')
      .single();

    if (error) throw error;
    return { alert: data as JobAlertRow };
  }

  async remove(tenantId: string, authorization: string | undefined, id: string) {
    const { candidateId, tenantId: tokenTenantId } = this.authContext(authorization);
    if (tokenTenantId && tokenTenantId !== tenantId) {
      throw new UnauthorizedException('Token tenant mismatch.');
    }

    const { data, error } = await this.supabase.adminClient
      .from('job_alerts')
      .delete()
      .eq('id', id)
      .eq('candidate_id', candidateId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Job alert not found.');
    return { ok: true };
  }
}
