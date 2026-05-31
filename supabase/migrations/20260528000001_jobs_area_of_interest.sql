ALTER TABLE jobs ADD COLUMN IF NOT EXISTS area_of_interest TEXT;

CREATE INDEX IF NOT EXISTS jobs_tenant_area_of_interest_idx ON jobs (tenant_id, area_of_interest);
