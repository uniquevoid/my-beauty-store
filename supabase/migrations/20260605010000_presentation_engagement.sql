-- Client engagement tracking for published candidate presentations

ALTER TABLE candidate_presentations
  ADD COLUMN IF NOT EXISTS client_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_exported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_view_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_export_count INT NOT NULL DEFAULT 0;
