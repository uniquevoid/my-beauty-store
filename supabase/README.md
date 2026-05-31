# Database migrations



Schema changes live in `migrations/` and are applied automatically by the backend (on startup) or manually via npm scripts.



## Migration files (in order)



1. `migrations/20260526000000_initial_schema.sql` — base tables + `resumes` storage bucket

2. `migrations/20260527000001_multi_tenant.sql` — tenants, admin users, import tables, `tenant_id` columns

3. `migrations/20260527000002_backfill_default_tenant.sql` — default tenant + backfill existing rows

4. `migrations/20260528000001_jobs_area_of_interest.sql` — `jobs.area_of_interest` filter column



Applied migrations are tracked in the `_platform_migrations` table.



## Environment



Add to `backend/.env`:



| Variable | Purpose |

|----------|---------|

| `DATABASE_URL` | Postgres connection string (Supabase → Project Settings → Database) |

| `AUTO_DB_MIGRATE` | Set to `false` to disable migrations on backend startup (default: on) |

| `DEFAULT_TENANT_SLUG` | Fallback tenant when host does not match (default: `default`) |

| `PLATFORM_DOMAIN` | Subdomain routing, e.g. `acme.platform.com` → tenant subdomain `acme` |

| `ADMIN_JWT_SECRET` | Optional separate secret for admin tokens |

| `PROVISION_API_KEY` | Protects `POST /internal/tenants` |



## Commands (from `backend/`)



```bash

npm run db:migrate:status    # list applied vs pending

npm run db:migrate             # apply pending migrations

npm run db:migrate:baseline    # mark all files as applied without running SQL (one-time for existing DBs)

```



## Existing Supabase project (one-time)



If you set up the database manually before migration automation existed:



```bash

cd backend

# Set DATABASE_URL in .env first

npm run db:migrate:baseline

npm run db:migrate:status      # should show all applied, none pending

```



From then on, new migration files apply automatically when you start the backend or deploy.



## Fresh Supabase project



```bash

cd backend

# Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL in .env

npm run db:migrate             # applies all migrations in order

npm run start:dev              # bootstraps default tenant + admin

```



No SQL Editor copy/paste required.



## New prospect demo



See [docs/PROSPECT_DEMO.md](../docs/PROSPECT_DEMO.md) for the full sales playbook.



```bash

npm run create-prospect -- --slug acme --name "Acme Corp" --branding-file ../docs/examples/acme-branding.json

```



When `PLATFORM_DOMAIN` is set in `.env`, the demo URL is `https://acme.<PLATFORM_DOMAIN>`.



Admin portal: `/admin` (login `admin` / `user`, change password on first login).

