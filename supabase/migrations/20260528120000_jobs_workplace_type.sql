ALTER TABLE jobs ADD COLUMN IF NOT EXISTS workplace_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_workplace_type_check'
  ) THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_workplace_type_check
      CHECK (workplace_type IS NULL OR workplace_type IN ('remote', 'hybrid', 'in_office'));
  END IF;
END $$;

-- Backfill from combined location strings
UPDATE jobs
SET
  workplace_type = 'hybrid',
  location = trim(regexp_replace(location, '\s*·\s*Hybrid\s*$', '', 'i'))
WHERE location ~* '·\s*Hybrid\s*$';

UPDATE jobs
SET workplace_type = 'remote'
WHERE workplace_type IS NULL
  AND location ~* '^Remote';

UPDATE jobs
SET workplace_type = 'in_office'
WHERE workplace_type IS NULL;
