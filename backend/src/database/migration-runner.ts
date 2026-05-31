import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Client } from 'pg';

const MIGRATIONS_TABLE = '_platform_migrations';

export function migrationsDirectory() {
  const candidates = [
    join(process.cwd(), 'supabase', 'migrations'),
    join(__dirname, '..', '..', '..', 'supabase', 'migrations'),
    join(__dirname, '..', '..', 'supabase', 'migrations'),
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  throw new Error(
    'Migrations directory not found. Run npm run build to sync migrations into backend/supabase/migrations.',
  );
}

export function isAutoMigrateEnabled() {
  const value = process.env.AUTO_DB_MIGRATE?.trim().toLowerCase();
  if (!value) return true;
  return value !== 'false' && value !== '0' && value !== 'no';
}

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is required for migrations. Copy the Postgres connection string from Supabase → Project Settings → Database.',
    );
  }
  return url;
}

async function listMigrationFiles(): Promise<string[]> {
  const dir = migrationsDirectory();
  const entries = await readdir(dir);
  return entries.filter((name) => name.endsWith('.sql')).sort((a, b) => a.localeCompare(b));
}

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  await ensureMigrationsTable(client);
  const result = await client.query<{ name: string }>(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`,
  );
  return new Set(result.rows.map((row) => row.name));
}

export type MigrationStatus = {
  name: string;
  applied: boolean;
  appliedAt?: string;
};

export async function getMigrationStatus(): Promise<MigrationStatus[]> {
  const client = new Client({ connectionString: requireDatabaseUrl() });
  await client.connect();

  try {
    const files = await listMigrationFiles();
    await ensureMigrationsTable(client);
    const result = await client.query<{ name: string; applied_at: string }>(
      `SELECT name, applied_at FROM ${MIGRATIONS_TABLE}`,
    );
    const appliedMap = new Map(result.rows.map((row) => [row.name, row.applied_at]));

    return files.map((name) => ({
      name,
      applied: appliedMap.has(name),
      appliedAt: appliedMap.get(name),
    }));
  } finally {
    await client.end();
  }
}

export async function baselineMigrations(): Promise<string[]> {
  const client = new Client({ connectionString: requireDatabaseUrl() });
  await client.connect();

  try {
    const files = await listMigrationFiles();
    await ensureMigrationsTable(client);

    const baselined: string[] = [];
    for (const name of files) {
      const inserted = await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING name`,
        [name],
      );
      if (inserted.rowCount) baselined.push(name);
    }

    return baselined;
  } finally {
    await client.end();
  }
}

export async function applyPendingMigrations(): Promise<string[]> {
  const client = new Client({ connectionString: requireDatabaseUrl() });
  await client.connect();

  try {
    const files = await listMigrationFiles();
    const applied = await getAppliedMigrations(client);
    const pending = files.filter((name) => !applied.has(name));

    const ran: string[] = [];
    for (const name of pending) {
      const sql = await readFile(join(migrationsDirectory(), name), 'utf-8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [name]);
        await client.query('COMMIT');
        ran.push(name);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    return ran;
  } finally {
    await client.end();
  }
}
