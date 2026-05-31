-- Backfill existing single-tenant data into default tenant.
-- Safe to re-run: uses slug 'default' and skips rows already assigned.

INSERT INTO tenants (slug, name, hostname, subdomain, branding_json)
VALUES (
  'default',
  'Default Tenant',
  'localhost',
  'default',
  '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  SELECT id INTO default_tenant_id FROM tenants WHERE slug = 'default' LIMIT 1;

  UPDATE jobs SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE jobs SET external_id = slug WHERE external_id IS NULL AND slug IS NOT NULL;

  UPDATE candidates SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE applications SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE job_alerts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE job_alert_notifications SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE resume_sessions SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;

  -- Default admin user is created by: npm run provision-tenant (uses bcryptjs)

  INSERT INTO job_import_profiles (tenant_id, name, column_map, value_map, sync_mode, is_default)
  SELECT
    default_tenant_id,
    'default',
    '{"slug":"slug","title":"title","department":"department","location":"location","employment_type":"employment_type","description":"description","status":"status","external_id":"external_id"}'::jsonb,
    '{"status":{"published":"published","open":"published","active":"published","draft":"draft","closed":"closed","filled":"closed"}}'::jsonb,
    'delta',
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM job_import_profiles WHERE tenant_id = default_tenant_id AND name = 'default'
  );
END $$;
