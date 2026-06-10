-- Candidate presentation pipeline for agency recruiters

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings_json JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS screened_candidate_id UUID;

CREATE TABLE IF NOT EXISTS screened_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  screening_notes TEXT NOT NULL DEFAULT '',
  screening_completed_at TIMESTAMPTZ,
  invite_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'applied', 'presentation_draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS screened_candidates_tenant_id_idx ON screened_candidates (tenant_id);
CREATE INDEX IF NOT EXISTS screened_candidates_job_id_idx ON screened_candidates (job_id);
CREATE INDEX IF NOT EXISTS screened_candidates_invite_token_idx ON screened_candidates (invite_token);
CREATE INDEX IF NOT EXISTS screened_candidates_status_idx ON screened_candidates (tenant_id, status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_screened_candidate_id_fkey'
  ) THEN
    ALTER TABLE applications
      ADD CONSTRAINT applications_screened_candidate_id_fkey
      FOREIGN KEY (screened_candidate_id) REFERENCES screened_candidates(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS candidate_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  screened_candidate_id UUID NOT NULL REFERENCES screened_candidates(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  share_token TEXT NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  candidate_display_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  published_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (screened_candidate_id)
);

CREATE INDEX IF NOT EXISTS candidate_presentations_tenant_id_idx ON candidate_presentations (tenant_id);
CREATE INDEX IF NOT EXISTS candidate_presentations_share_token_idx ON candidate_presentations (share_token);
CREATE INDEX IF NOT EXISTS candidate_presentations_status_idx ON candidate_presentations (tenant_id, status);

ALTER TABLE screened_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_presentations ENABLE ROW LEVEL SECURITY;
