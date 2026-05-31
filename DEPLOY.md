# Deploying the shared careers platform

One deployment hosts unlimited prospect demo sites. Each prospect is a **tenant** (database row), not a separate git repo.

## Architecture

| Layer | Host (suggested) | Purpose |
|-------|------------------|---------|
| Frontend | [Vercel](https://vercel.com) | Static SPA; wildcard subdomain for demos |
| Backend | [Railway](https://railway.app) or [Render](https://render.com) | NestJS API |
| Database | [Supabase](https://supabase.com) | Postgres + migrations |

## 1. Supabase

1. Create a project and copy **Project URL**, **service role** key, and **Database connection string** (URI).
2. From `backend/`, set env vars (see `.env.example`) and run migrations:

   **Fresh project:**

   ```bash
   npm install
   npm run db:migrate
   ```

   **Existing project** (schema already applied manually — one-time):

   ```bash
   npm install
   npm run db:migrate:baseline
   npm run db:migrate:status   # all applied, none pending
   ```

3. Start the backend once locally or deploy — it bootstraps the default tenant, admin (`admin` / `user`), and import profile automatically. No `provision-tenant --migrate-default` step required.

Future product changes: add a file under `supabase/migrations/`; migrations apply on deploy (`npm run db:migrate` in build) and on backend startup.

See [supabase/README.md](supabase/README.md) for details.

## 2. Backend (Railway / Render)

**Root directory:** `backend`  
**Build:** `npm install && npm run build && npm run db:migrate`  
**Start:** `npm run start:prod`  
**Port:** `3000` (or set `PORT`)

Copy [backend/.env.example](backend/.env.example) and set:

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Never expose to frontend |
| `DATABASE_URL` | Yes | Postgres URI for automated migrations |
| `JWT_SECRET` | Yes | Random string |
| `PLATFORM_DOMAIN` | Yes for demos | e.g. `careersites.yourcompany.com` — enables `acme.careersites.yourcompany.com` |
| `DEFAULT_TENANT_SLUG` | No | Default `default` |
| `PROVISION_API_KEY` | Yes | Protects internal tenant API + demo builder |
| `APP_PUBLIC_URL` | Yes | Your Vercel URL, e.g. `https://careersites.yourcompany.com` |
| `GEMINI_API_KEY` | No | Resume parsing and AI job matching. Model fallback order is fixed in code (no `GEMINI_MODEL` env). |
| `MAIL_PROVIDER` | No | `console` or `resend` |

After deploy, note the public API URL (e.g. `https://api.careersites.yourcompany.com`).

## 3. Frontend (Vercel)

**Root directory:** `frontend`  
**Build:** `npm run build`  
**Output:** `dist`

Copy [frontend/.env.example](frontend/.env.example):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Backend URL from step 2 |
| `VITE_ENABLE_DEMO_BUILDER` | `true` (internal sales tool only) |

### Wildcard demo URLs

In Vercel → Project → **Domains**:

1. Add `careersites.yourcompany.com` (apex or www as needed).
2. Add `*.careersites.yourcompany.com` for prospect subdomains.

Set backend `PLATFORM_DOMAIN=careersites.yourcompany.com`.

When you provision a tenant with slug `acme`, the demo URL is:

**https://acme.careersites.yourcompany.com**

(No per-prospect Vercel project required.)

## 4. DNS checklist

| Record | Points to |
|--------|-----------|
| `careersites.yourcompany.com` | Vercel |
| `*.careersites.yourcompany.com` | Vercel |
| `api.careersites.yourcompany.com` (optional) | Railway/Render |

## 5. Verify

1. Open `https://acme.careersites.yourcompany.com` after provisioning a test tenant.
2. Admin: `https://acme.careersites.yourcompany.com/admin` — login `admin` / `user` (change password on first login).
3. Demo builder: `https://careersites.yourcompany.com/demo-builder` (requires `VITE_ENABLE_DEMO_BUILDER=true`).

See [docs/PROSPECT_DEMO.md](docs/PROSPECT_DEMO.md) for creating prospect demos.
