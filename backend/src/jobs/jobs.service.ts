import { Injectable, NotFoundException } from '@nestjs/common';
import { JobAlertNotifierService } from '../job-alerts/job-alert-notifier.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  rankJobSearchSuggestions,
  type JobSearchSuggestion,
} from './job-search-suggestions';
import { pickRelatedJobs, type RelatedJobSummary } from './jobs-related';

export type JobStatus = 'draft' | 'published' | 'closed';

export type JobRow = {
  id: string;
  tenant_id: string;
  slug: string;
  external_id: string | null;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  area_of_interest: string | null;
  workplace_type: string | null;
  description: string | null;
  status: JobStatus;
  custom_fields: Record<string, unknown>;
  closed_at: string | null;
  last_import_batch_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ListPublishedFilters = {
  q?: string;
  location?: string;
  areaOfInterest?: string;
};

export type JobUpsertInput = {
  slug?: string;
  external_id?: string | null;
  title: string;
  department?: string | null;
  location?: string | null;
  employment_type?: string | null;
  area_of_interest?: string | null;
  workplace_type?: string | null;
  description?: string | null;
  status?: JobStatus;
  custom_fields?: Record<string, unknown>;
  last_import_batch_id?: string | null;
};

function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, (c) => `\\${c}`);
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class JobsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly jobAlertNotifier: JobAlertNotifierService,
  ) {}

  async listPublished(tenantId: string, filters: ListPublishedFilters = {}): Promise<JobRow[]> {
    const q = filters.q?.trim();
    const location = filters.location?.trim();
    const areaOfInterest = filters.areaOfInterest?.trim();

    let query = this.supabase.adminClient
      .from('jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (q) {
      const pattern = `%${escapeIlike(q)}%`;
      query = query.or(
        `title.ilike.${pattern},description.ilike.${pattern},department.ilike.${pattern}`,
      );
    }

    if (location) {
      query = query.eq('location', location);
    }

    if (areaOfInterest) {
      query = query.eq('area_of_interest', areaOfInterest);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as JobRow[];
  }

  async listDistinctAreasOfInterest(tenantId: string): Promise<string[]> {
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .select('area_of_interest')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .not('area_of_interest', 'is', null)
      .order('area_of_interest', { ascending: true });

    if (error) throw error;

    const unique = new Set<string>();
    for (const row of data ?? []) {
      const area = (row as { area_of_interest: string | null }).area_of_interest?.trim();
      if (area) unique.add(area);
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }

  async listSearchSuggestions(
    tenantId: string,
    q: string,
    limit = 8,
  ): Promise<JobSearchSuggestion[]> {
    const query = q?.trim();
    if (!query || query.length < 2) return [];

    const pattern = `%${escapeIlike(query)}%`;
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .select('slug, title, department, location')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .or(`title.ilike.${pattern},department.ilike.${pattern}`)
      .order('title', { ascending: true })
      .limit(50);

    if (error) throw error;

    return rankJobSearchSuggestions(
      query,
      (data ?? []) as Array<{
        slug: string;
        title: string;
        department: string | null;
        location: string | null;
      }>,
      limit,
    );
  }

  async listDistinctLocations(tenantId: string): Promise<string[]> {
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .select('location')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .not('location', 'is', null)
      .order('location', { ascending: true });

    if (error) throw error;

    const unique = new Set<string>();
    for (const row of data ?? []) {
      const loc = (row as { location: string | null }).location?.trim();
      if (loc) unique.add(loc);
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }

  async getPublishedBySlug(tenantId: string, slug: string): Promise<JobRow | null> {
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as JobRow | null;
  }

  async listRelatedPublished(
    tenantId: string,
    job: JobRow,
    limit = 3,
  ): Promise<RelatedJobSummary[]> {
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'published');

    if (error) throw error;
    return pickRelatedJobs(job, (data ?? []) as JobRow[], limit);
  }

  async getBySlug(tenantId: string, slug: string): Promise<JobRow | null> {
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as JobRow | null;
  }

  async listForAdmin(
    tenantId: string,
    filters?: { status?: JobStatus; q?: string },
  ): Promise<JobRow[]> {
    let query = this.supabase.adminClient
      .from('jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.q?.trim()) {
      const pattern = `%${escapeIlike(filters.q.trim())}%`;
      query = query.or(
        `title.ilike.${pattern},external_id.ilike.${pattern},slug.ilike.${pattern}`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as JobRow[];
  }

  async getStats(tenantId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .select('status')
      .eq('tenant_id', tenantId);

    if (error) throw error;

    const stats = { draft: 0, published: 0, closed: 0, total: 0 };
    for (const row of data ?? []) {
      const status = (row as { status: JobStatus }).status;
      if (status in stats) stats[status as keyof typeof stats]++;
      stats.total++;
    }
    return stats;
  }

  async updateStatus(tenantId: string, jobId: string, status: JobStatus) {
    const patch: Record<string, unknown> = { status };
    if (status === 'closed') {
      patch.closed_at = new Date().toISOString();
    } else {
      patch.closed_at = null;
    }

    const { data: existing } = await this.supabase.adminClient
      .from('jobs')
      .select('slug, status')
      .eq('tenant_id', tenantId)
      .eq('id', jobId)
      .maybeSingle();

    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .update(patch)
      .eq('tenant_id', tenantId)
      .eq('id', jobId)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    const job = data as JobRow;
    const priorStatus = (existing as { status?: JobStatus } | null)?.status;
    if (job?.status === 'published' && priorStatus !== 'published') {
      void this.jobAlertNotifier
        .notifyForNewlyPublishedJobs(tenantId, [job])
        .catch(() => undefined);
    }

    return job;
  }

  async deleteJob(tenantId: string, jobId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', jobId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new NotFoundException('Job not found.');
    }
  }

  async findByExternalIds(tenantId: string, externalIds: string[]) {
    if (!externalIds.length) return [] as JobRow[];
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('external_id', externalIds);

    if (error) throw error;
    return (data ?? []) as JobRow[];
  }

  async findBySlugs(tenantId: string, slugs: string[]) {
    if (!slugs.length) return [] as JobRow[];
    const { data, error } = await this.supabase.adminClient
      .from('jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('slug', slugs);

    if (error) throw error;
    return (data ?? []) as JobRow[];
  }

  async upsertManyForTenant(
    tenantId: string,
    rows: Array<JobUpsertInput & { title: string }>,
    options?: { importBatchId?: string },
  ) {
    const externalIds = rows
      .map((r) => r.external_id?.trim())
      .filter((id): id is string => Boolean(id));

    const slugs = rows.map((r) => r.slug?.trim()).filter((s): s is string => Boolean(s));

    const existingByExternalId = new Map<string, JobRow>();
    const existingBySlug = new Map<string, JobRow>();

    if (externalIds.length) {
      for (const job of await this.findByExternalIds(tenantId, externalIds)) {
        if (job.external_id) existingByExternalId.set(job.external_id, job);
      }
    }

    if (slugs.length) {
      for (const job of await this.findBySlugs(tenantId, slugs)) {
        existingBySlug.set(job.slug, job);
      }
    }

    const priorStatusByKey = new Map<string, JobStatus>();
    const payload = rows.map((r) => {
      const external_id = r.external_id?.trim() || null;
      const existing =
        (external_id ? existingByExternalId.get(external_id) : undefined) ??
        (r.slug ? existingBySlug.get(r.slug) : undefined);

      const slug = existing?.slug ?? (r.slug?.trim() || slugify(r.title));

      const key = external_id ?? slug;
      if (existing) priorStatusByKey.set(key, existing.status);

      return {
        tenant_id: tenantId,
        external_id,
        slug,
        title: r.title,
        department: r.department ?? null,
        location: r.location ?? null,
        employment_type: r.employment_type ?? null,
        area_of_interest: r.area_of_interest ?? null,
        workplace_type: r.workplace_type ?? null,
        description: r.description ?? null,
        status: r.status ?? 'draft',
        custom_fields: r.custom_fields ?? {},
        last_import_batch_id: options?.importBatchId ?? r.last_import_batch_id ?? null,
        closed_at: r.status === 'closed' ? new Date().toISOString() : null,
        ...(existing ? { id: existing.id } : {}),
      };
    });

    const upserted: JobRow[] = [];

    for (const row of payload) {
      if (row.id) {
        const { data, error } = await this.supabase.adminClient
          .from('jobs')
          .update(row)
          .eq('id', row.id)
          .select('*')
          .single();
        if (error) throw error;
        upserted.push(data as JobRow);
      } else {
        const { data, error } = await this.supabase.adminClient
          .from('jobs')
          .insert(row)
          .select('*')
          .single();
        if (error) throw error;
        upserted.push(data as JobRow);
      }
    }

    return this.handlePostUpsert(tenantId, upserted, priorStatusByKey);
  }

  private handlePostUpsert(
    tenantId: string,
    upserted: JobRow[],
    priorStatusByKey: Map<string, JobStatus>,
  ) {
    const newlyPublished = upserted.filter((job) => {
      const key = job.external_id ?? job.slug;
      return job.status === 'published' && priorStatusByKey.get(key) !== 'published';
    });

    if (newlyPublished.length) {
      void this.jobAlertNotifier
        .notifyForNewlyPublishedJobs(tenantId, newlyPublished)
        .catch(() => undefined);
    }

    return upserted;
  }

  async closeJobsNotInExternalIds(
    tenantId: string,
    externalIdsInFile: string[],
    importBatchId?: string,
  ) {
    const { data: published, error } = await this.supabase.adminClient
      .from('jobs')
      .select('id, external_id, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .not('external_id', 'is', null);

    if (error) throw error;

    const inFile = new Set(externalIdsInFile);
    const toClose = (published ?? []).filter(
      (row) => row.external_id && !inFile.has(row.external_id as string),
    );

    if (!toClose.length) return 0;

    const ids = toClose.map((r) => r.id as string);
    const { error: updateErr } = await this.supabase.adminClient
      .from('jobs')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        last_import_batch_id: importBatchId ?? null,
      })
      .in('id', ids);

    if (updateErr) throw updateErr;
    return ids.length;
  }
}
