import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Papa from 'papaparse';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { JobsService, slugify, type JobStatus, type JobUpsertInput } from '../jobs/jobs.service';
import { SupabaseService } from '../supabase/supabase.service';

export type CanonicalField =
  | 'external_id'
  | 'title'
  | 'slug'
  | 'department'
  | 'location'
  | 'employment_type'
  | 'area_of_interest'
  | 'workplace_type'
  | 'description'
  | 'status';

export type ImportProfileRow = {
  id: string;
  tenant_id: string;
  name: string;
  column_map: Record<string, CanonicalField | string>;
  value_map: Record<string, Record<string, string>>;
  sync_mode: 'delta' | 'full';
  is_default: boolean;
};

export type ImportBatchRow = {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  filename: string | null;
  status: string;
  headers: string[];
  sample_rows: Record<string, string>[];
  raw_csv: string | null;
  column_map: Record<string, string> | null;
  value_map: Record<string, unknown> | null;
  sync_mode: 'delta' | 'full' | null;
  preview_result: unknown;
  stats: Record<string, number> | null;
};

const CANONICAL_FIELDS: CanonicalField[] = [
  'external_id',
  'title',
  'slug',
  'department',
  'location',
  'employment_type',
  'area_of_interest',
  'workplace_type',
  'description',
  'status',
];

const HEADER_ALIASES: Record<string, CanonicalField> = {
  'requisition id': 'external_id',
  'job id': 'external_id',
  'id': 'external_id',
  'external id': 'external_id',
  'job title': 'title',
  'title': 'title',
  'position': 'title',
  'role': 'title',
  'slug': 'slug',
  'department': 'department',
  'team': 'department',
  'location': 'location',
  'city': 'location',
  'employment type': 'employment_type',
  'type': 'employment_type',
  'area of interest': 'area_of_interest',
  'area': 'area_of_interest',
  'category': 'area_of_interest',
  'workplace type': 'workplace_type',
  'work arrangement': 'workplace_type',
  'workplace': 'workplace_type',
  'description': 'description',
  'status': 'status',
  'posting status': 'status',
  'state': 'status',
};

function normalizeHeader(h: string) {
  return h.trim().toLowerCase();
}

export function suggestColumnMap(headers: string[]): Record<string, CanonicalField> {
  const map: Record<string, CanonicalField> = {};
  for (const header of headers) {
    const key = normalizeHeader(header);
    const field = HEADER_ALIASES[key];
    if (field && !Object.values(map).includes(field)) {
      map[header] = field;
    }
  }
  return map;
}

function mapStatusValue(
  raw: string,
  valueMap: Record<string, Record<string, string>>,
): JobStatus {
  const normalized = raw.trim().toLowerCase();
  const statusMap = valueMap.status ?? {
    published: 'published',
    open: 'published',
    active: 'published',
    draft: 'draft',
    closed: 'closed',
    filled: 'closed',
  };

  for (const [from, to] of Object.entries(statusMap)) {
    if (from.trim().toLowerCase() === normalized) {
      return (to as JobStatus) || 'draft';
    }
  }

  if (normalized === 'published' || normalized === 'open' || normalized === 'active') {
    return 'published';
  }
  if (normalized === 'closed' || normalized === 'filled') {
    return 'closed';
  }
  return 'draft';
}

@Injectable()
export class JobImportsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly jobs: JobsService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  private requireAdmin(authorization?: string) {
    return this.adminAuth.adminFromAuthHeader(authorization);
  }

  async listProfiles(tenantId: string, authorization?: string) {
    this.requireAdmin(authorization);
    const { data, error } = await this.supabase.adminClient
      .from('job_import_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) throw error;
    return { profiles: data ?? [] };
  }

  async saveProfile(
    tenantId: string,
    authorization: string | undefined,
    body: {
      name?: string;
      column_map?: Record<string, string>;
      value_map?: Record<string, Record<string, string>>;
      sync_mode?: 'delta' | 'full';
      is_default?: boolean;
    },
  ) {
    this.requireAdmin(authorization);
    const name = body.name?.trim() || 'default';

    if (body.is_default) {
      await this.supabase.adminClient
        .from('job_import_profiles')
        .update({ is_default: false })
        .eq('tenant_id', tenantId);
    }

    const { data, error } = await this.supabase.adminClient
      .from('job_import_profiles')
      .upsert(
        {
          tenant_id: tenantId,
          name,
          column_map: body.column_map ?? {},
          value_map: body.value_map ?? { status: {} },
          sync_mode: body.sync_mode ?? 'delta',
          is_default: body.is_default ?? true,
        },
        { onConflict: 'tenant_id,name' },
      )
      .select('*')
      .single();

    if (error) throw error;
    return { profile: data };
  }

  async upload(
    tenantId: string,
    adminId: string,
    filename: string,
    csvText: string,
    authorization?: string,
  ) {
    this.requireAdmin(authorization);

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
    });

    if (parsed.errors.length) {
      throw new BadRequestException(
        `CSV parse error: ${parsed.errors[0]?.message ?? 'Unknown error'}`,
      );
    }

    const rows = parsed.data ?? [];
    const headers = parsed.meta.fields ?? Object.keys(rows[0] ?? {});
    const sample_rows = rows.slice(0, 5);

    const { data, error } = await this.supabase.adminClient
      .from('job_import_batches')
      .insert({
        tenant_id: tenantId,
        filename,
        status: 'uploaded',
        headers,
        sample_rows,
        raw_csv: csvText,
        created_by_admin_id: adminId,
      })
      .select('*')
      .single();

    if (error) throw error;

    const suggested_map = suggestColumnMap(headers);

    return {
      batch: data,
      headers,
      sample_rows,
      suggested_map,
      canonical_fields: CANONICAL_FIELDS,
    };
  }

  private async getBatch(tenantId: string, batchId: string): Promise<ImportBatchRow> {
    const { data, error } = await this.supabase.adminClient
      .from('job_import_batches')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', batchId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Import batch not found.');
    return data as ImportBatchRow;
  }

  private parseRows(batch: ImportBatchRow) {
    if (!batch.raw_csv) throw new BadRequestException('Batch has no CSV data.');
    const parsed = Papa.parse<Record<string, string>>(batch.raw_csv, {
      header: true,
      skipEmptyLines: 'greedy',
    });
    return parsed.data ?? [];
  }

  private transformRows(
    rawRows: Record<string, string>[],
    columnMap: Record<string, string>,
    valueMap: Record<string, Record<string, string>>,
  ) {
    const inverted = new Map<string, string>();
    for (const [csvCol, canonical] of Object.entries(columnMap)) {
      if (canonical && canonical !== 'ignore') inverted.set(csvCol, canonical);
    }

    return rawRows.map((raw, index) => {
      const canonical: Record<string, string> = {};
      const custom_fields: Record<string, string> = {};

      for (const [col, value] of Object.entries(raw)) {
        const target = inverted.get(col);
        if (target && CANONICAL_FIELDS.includes(target as CanonicalField)) {
          canonical[target] = (value ?? '').trim();
        } else if (col.trim()) {
          custom_fields[col] = (value ?? '').trim();
        }
      }

      const title = canonical.title?.trim() ?? '';
      const external_id = canonical.external_id?.trim() || null;
      let status: JobStatus = 'draft';
      if (canonical.status) {
        status = mapStatusValue(canonical.status, valueMap);
      }

      const row: JobUpsertInput & { title: string; _rowIndex: number } = {
        _rowIndex: index + 2,
        title,
        external_id,
        slug: canonical.slug?.trim() || (title ? slugify(title) : ''),
        department: canonical.department || null,
        location: canonical.location || null,
        employment_type: canonical.employment_type || null,
        area_of_interest: canonical.area_of_interest || null,
        workplace_type: canonical.workplace_type || null,
        description: canonical.description || null,
        status,
        custom_fields: Object.keys(custom_fields).length ? custom_fields : {},
      };

      return row;
    });
  }

  async saveMapping(
    tenantId: string,
    batchId: string,
    authorization: string | undefined,
    body: {
      column_map: Record<string, string>;
      value_map?: Record<string, Record<string, string>>;
      sync_mode?: 'delta' | 'full';
      save_profile?: boolean;
      profile_name?: string;
    },
  ) {
    this.requireAdmin(authorization);
    const hasTitle = Object.values(body.column_map).includes('title');
    if (!hasTitle) {
      throw new BadRequestException('Column map must include a mapping to "title".');
    }

    const { data, error } = await this.supabase.adminClient
      .from('job_import_batches')
      .update({
        column_map: body.column_map,
        value_map: body.value_map ?? { status: {} },
        sync_mode: body.sync_mode ?? 'delta',
        status: 'mapped',
      })
      .eq('tenant_id', tenantId)
      .eq('id', batchId)
      .select('*')
      .single();

    if (error) throw error;

    if (body.save_profile) {
      await this.saveProfile(tenantId, authorization, {
        name: body.profile_name,
        column_map: body.column_map,
        value_map: body.value_map,
        sync_mode: body.sync_mode,
        is_default: true,
      });
    }

    return { batch: data };
  }

  async preview(tenantId: string, batchId: string, authorization?: string) {
    this.requireAdmin(authorization);
    const batch = await this.getBatch(tenantId, batchId);
    if (!batch.column_map) {
      throw new BadRequestException('Save column mapping before preview.');
    }

    const rawRows = this.parseRows(batch);
    const transformed = this.transformRows(
      rawRows,
      batch.column_map,
      (batch.value_map as Record<string, Record<string, string>>) ?? {},
    );

    const syncMode = batch.sync_mode ?? 'delta';
    const externalIdsInFile: string[] = [];
    const seenExternalIds = new Map<string, number>();
    const results: Array<{
      row: number;
      action: 'create' | 'update' | 'unchanged' | 'skip' | 'error';
      message?: string;
      external_id?: string | null;
      title?: string;
    }> = [];

    const validRows: Array<JobUpsertInput & { title: string }> = [];

    for (const row of transformed) {
      if (!row.title) {
        results.push({
          row: row._rowIndex,
          action: 'error',
          message: 'Missing title',
        });
        continue;
      }

      if (syncMode === 'full' && !row.external_id) {
        results.push({
          row: row._rowIndex,
          action: 'error',
          message: 'Full sync requires external_id on every row',
          title: row.title,
        });
        continue;
      }

      if (row.external_id) {
        const prior = seenExternalIds.get(row.external_id);
        if (prior !== undefined) {
          results.push({
            row: row._rowIndex,
            action: 'skip',
            message: `Duplicate external_id (first at row ${prior})`,
            external_id: row.external_id,
            title: row.title,
          });
          continue;
        }
        seenExternalIds.set(row.external_id, row._rowIndex);
        externalIdsInFile.push(row.external_id);
      }

      validRows.push(row);
    }

    const existingByExt = new Map(
      (await this.jobs.findByExternalIds(tenantId, externalIdsInFile)).map((j) => [
        j.external_id!,
        j,
      ]),
    );

    for (const row of validRows) {
      const idx = transformed.find((t) => t.title === row.title && t.external_id === row.external_id)?._rowIndex ?? 0;
      const existing = row.external_id ? existingByExt.get(row.external_id) : undefined;

      if (!existing) {
        results.push({
          row: idx,
          action: 'create',
          external_id: row.external_id,
          title: row.title,
        });
        continue;
      }

      const changed =
        existing.title !== row.title ||
        existing.department !== row.department ||
        existing.location !== row.location ||
        existing.employment_type !== row.employment_type ||
        existing.description !== row.description ||
        existing.status !== row.status;

      results.push({
        row: idx,
        action: changed ? 'update' : 'unchanged',
        external_id: row.external_id,
        title: row.title,
      });
    }

    let toClose = 0;
    if (syncMode === 'full' && externalIdsInFile.length) {
      const { data: published } = await this.supabase.adminClient
        .from('jobs')
        .select('external_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'published')
        .not('external_id', 'is', null);

      const inFile = new Set(externalIdsInFile);
      toClose = (published ?? []).filter(
        (j) => j.external_id && !inFile.has(j.external_id as string),
      ).length;
    }

    const preview_result = {
      results,
      summary: {
        create: results.filter((r) => r.action === 'create').length,
        update: results.filter((r) => r.action === 'update').length,
        unchanged: results.filter((r) => r.action === 'unchanged').length,
        skip: results.filter((r) => r.action === 'skip').length,
        error: results.filter((r) => r.action === 'error').length,
        to_close: toClose,
      },
      valid_row_count: validRows.length,
    };

    await this.supabase.adminClient
      .from('job_import_batches')
      .update({ status: 'previewed', preview_result })
      .eq('id', batchId);

    return preview_result;
  }

  async apply(tenantId: string, batchId: string, authorization?: string) {
    this.requireAdmin(authorization);
    const batch = await this.getBatch(tenantId, batchId);
    if (!batch.column_map) {
      throw new BadRequestException('Save column mapping before apply.');
    }

    const rawRows = this.parseRows(batch);
    const transformed = this.transformRows(
      rawRows,
      batch.column_map,
      (batch.value_map as Record<string, Record<string, string>>) ?? {},
    );

    const syncMode = batch.sync_mode ?? 'delta';
    const seenExternalIds = new Set<string>();
    const rowsToUpsert: Array<JobUpsertInput & { title: string }> = [];
    let skipped = 0;
    let errors = 0;

    for (const row of transformed) {
      if (!row.title) {
        errors++;
        continue;
      }
      if (syncMode === 'full' && !row.external_id) {
        errors++;
        continue;
      }
      if (row.external_id) {
        if (seenExternalIds.has(row.external_id)) {
          skipped++;
          continue;
        }
        seenExternalIds.add(row.external_id);
      }
      rowsToUpsert.push(row);
    }

    const upserted = await this.jobs.upsertManyForTenant(tenantId, rowsToUpsert, {
      importBatchId: batchId,
    });

    let closed = 0;
    if (syncMode === 'full') {
      closed = await this.jobs.closeJobsNotInExternalIds(
        tenantId,
        Array.from(seenExternalIds),
        batchId,
      );
    }

    const stats = {
      created: upserted.length,
      updated: 0,
      closed,
      skipped,
      errors,
    };

    await this.supabase.adminClient
      .from('job_import_batches')
      .update({ status: 'applied', stats })
      .eq('id', batchId);

    return { stats, jobs: upserted };
  }

  async getLastBatch(tenantId: string, authorization?: string) {
    this.requireAdmin(authorization);
    const { data, error } = await this.supabase.adminClient
      .from('job_import_batches')
      .select('id, filename, status, stats, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { batch: data ?? null };
  }
}
