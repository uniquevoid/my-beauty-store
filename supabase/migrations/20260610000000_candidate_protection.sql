-- Candidate Protection & Ownership — introduction tracking and progressive disclosure

ALTER TABLE candidate_presentations
  ADD COLUMN IF NOT EXISTS introduction_code TEXT,
  ADD COLUMN IF NOT EXISTS client_company_name TEXT,
  ADD COLUMN IF NOT EXISTS disclosure_stage TEXT NOT NULL DEFAULT 'blind'
    CHECK (disclosure_stage IN ('blind', 'full_unlocked')),
  ADD COLUMN IF NOT EXISTS protection_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS blind_content_json JSONB,
  ADD COLUMN IF NOT EXISTS full_content_json JSONB,
  ADD COLUMN IF NOT EXISTS redaction_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interview_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS full_unlocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS full_unlocked_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS candidate_presentations_introduction_code_idx
  ON candidate_presentations (introduction_code)
  WHERE introduction_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS introduction_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES candidate_presentations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('viewed', 'export_pdf', 'terms_accepted', 'interview_requested', 'full_unlocked')),
  actor TEXT NOT NULL DEFAULT 'client',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS introduction_audit_events_presentation_id_idx
  ON introduction_audit_events (presentation_id, created_at DESC);

ALTER TABLE introduction_audit_events ENABLE ROW LEVEL SECURITY;
