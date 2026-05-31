-- Multi-tenant careers platform schema

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  hostname TEXT UNIQUE,
  subdomain TEXT UNIQUE,
  branding_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, username)
);

CREATE TABLE IF NOT EXISTS job_import_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'default',
  column_map JSONB NOT NULL DEFAULT '{}'::jsonb,
  value_map JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_mode TEXT NOT NULL DEFAULT 'delta' CHECK (sync_mode IN ('delta', 'full')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS job_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES job_import_profiles(id) ON DELETE SET NULL,
  filename TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'mapped', 'previewed', 'applied', 'failed')),
  headers JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_csv TEXT,
  column_map JSONB,
  value_map JSONB,
  sync_mode TEXT CHECK (sync_mode IN ('delta', 'full')),
  preview_result JSONB,
  stats JSONB,
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_import_batch_id UUID REFERENCES job_import_batches(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Drop old global slug unique if exists (name may vary)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_slug_key'
  ) THEN
    ALTER TABLE jobs DROP CONSTRAINT jobs_slug_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_tenant_slug_unique ON jobs (tenant_id, slug) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS jobs_tenant_external_id_unique ON jobs (tenant_id, external_id) WHERE external_id IS NOT NULL AND tenant_id IS NOT NULL;

-- Extend status check for closed (drop/recreate if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_status_check'
  ) THEN
    ALTER TABLE jobs DROP CONSTRAINT jobs_status_check;
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('draft', 'published', 'closed'));

-- Tenant scope on other tables
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE job_alert_notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE resume_sessions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Candidate email unique per tenant
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'candidates_email_key'
  ) THEN
    ALTER TABLE candidates DROP CONSTRAINT candidates_email_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS candidates_tenant_email_unique ON candidates (tenant_id, email) WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS jobs_tenant_status_idx ON jobs (tenant_id, status);
CREATE INDEX IF NOT EXISTS job_import_batches_tenant_idx ON job_import_batches (tenant_id, created_at DESC);
