# Production URL checklist

Use this after provisioning a prospect tenant (e.g. `ggtech`). The tenant lives in Supabase immediately; the **public shareable URL** shows prospect branding only when the Vercel build can reach your deployed API.

## MCPs vs live data

| Tool | Role |
|------|------|
| **Supabase MCP** | Inspect or SQL-update `tenants` — source of truth for branding |
| **Playwright MCP** | Scrape prospect sites — does not write to Supabase by itself |
| **Vercel MCP** | Deployments/logs — does not store tenant branding |
| **CLI** (`create-prospect-from-url`) | Writes JSON + updates Supabase when `SUPABASE_*` is in `backend/.env` |

Editing [`docs/ggtechspecs.md`](ggtechspecs.md) or Playwright captures alone **do not** update the live demo until you run `--update` (or SQL).

## Free tier (default — no paid domain)

Share prospect demos with query-param URLs:

**`https://{vercel-project}.vercel.app/?tenant={slug}`**

Example: `https://frontend-five-chi-66.vercel.app/?tenant=ggtech`

| Layer | Free host | Status |
|-------|-----------|--------|
| Frontend SPA | **Vercel** | Live: `https://frontend-five-chi-66.vercel.app` |
| API | **Render** free web service ([`render.yaml`](../render.yaml)) | One-time GitHub connect (see below) |
| Database | **Supabase** | Already connected |

No wildcard DNS or paid domain required. When you later buy a domain, set `PLATFORM_DOMAIN` for `https://{slug}.yourdomain.com` — same tenant rows, no re-provision.

## Current state

| Item | Status |
|------|--------|
| Supabase tenant + branding | Ready after `create-prospect-from-url` |
| Frontend on Vercel | **Deployed** — `https://frontend-five-chi-66.vercel.app` |
| `APP_PUBLIC_URL` on backend | Set to Vercel URL (enables CLI demo links) |
| `VITE_API_URL` on Vercel | **Required** — must be your Render URL, not `http://localhost:3000` |
| Render backend | **One-time setup** — connect repo, root `backend` |

## Stable demo without your laptop (recommended)

1. Deploy `careers-api` on Render from [`render.yaml`](../render.yaml) (Blueprint → connect repo → set Supabase env vars in checklist below).
2. From `backend/`:
   ```powershell
   npm run ensure-outreach-production -- --slug ggtech
   ```
3. Share only: `https://frontend-five-chi-66.vercel.app/?tenant=ggtech` — no tunnel, no local backend.

## Interim demo (API on your PC)

Until Render is live:

```powershell
.\backend\scripts\start-outreach-demo.ps1 -Slug ggtech
```

Then run the `ensure-outreach-production` command it prints (bakes tunnel URL into Vercel). Same check URL works while tunnel + backend run.

## Architecture (one repo, many prospects)

- **One GitHub repo** — `frontend/`, `backend/`, `supabase/`
- **No separate repo per prospect** — each prospect is a tenant row in Postgres
- **Vercel** — single frontend project
- **Render** — NestJS API (`backend/`)
- **Supabase** — database

### Share URL patterns

| Tier | Pattern | Example |
|------|---------|---------|
| Free (default) | `{APP_PUBLIC_URL}/?tenant={slug}` | `https://frontend-five-chi-66.vercel.app/?tenant=ggtech` |
| Custom domain | `https://{slug}.{PLATFORM_DOMAIN}` | `https://ggtech.careersites.yourcompany.com` |

## One-time Render backend setup

1. [render.com](https://render.com) → **New** → **Blueprint** (or Web Service from GitHub)
2. Connect this repo; Render reads [`render.yaml`](../render.yaml)
3. Set secrets on the `careers-api` service:

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `DATABASE_URL` | Postgres URI (Supabase → Database → Connection string) |
| `JWT_SECRET` | Random string |
| `PROVISION_API_KEY` | Random string (Demo Builder + internal API) |
| **`APP_PUBLIC_URL`** | `https://frontend-five-chi-66.vercel.app` |

4. After deploy, copy the Render URL (e.g. `https://careers-api.onrender.com`)

## Frontend env (Vercel)

In Vercel → Project **frontend** → Settings → Environment Variables:

| Variable | Value |
|----------|--------|
| **`VITE_API_URL`** | Your Render API URL, e.g. `https://careers-api.onrender.com` |
| `VITE_ENABLE_DEMO_BUILDER` | `true` (internal sales tool only) |

Redeploy after setting `VITE_API_URL` (Vite bakes env at build time).

Root directory: **`frontend`**. Output: **`dist`**.

## How tenant routing works

### Free tier (`?tenant=`)

1. User opens `https://frontend-five-chi-66.vercel.app/?tenant=ggtech`
2. Frontend reads `?tenant=` → stores in `sessionStorage` → sends `tenant=ggtech` on every API call
3. Backend [`TenantMiddleware`](../backend/src/tenants/tenant.middleware.ts) resolves tenant from query param

### Custom domain (optional upgrade)

1. User opens `https://ggtech.careersites.yourcompany.com`
2. Vercel serves the same SPA for all subdomains
3. Frontend sends `X-Tenant-Host` to the API
4. Backend resolves `ggtech` from subdomain

Local dev equivalent: `http://localhost:5173/?tenant=ggtech`

## Verify before outreach

- [ ] Open `https://frontend-five-chi-66.vercel.app/?tenant=ggtech` in incognito — GGTech logo, site hero image, company name
- [ ] Navigate to `/jobs` without `?tenant=` — still GGTech (sessionStorage)
- [ ] `/jobs` shows 10 roles
- [ ] One apply flow loads
- [ ] `/admin` — `admin` / `user`
- [ ] `/login` — `candidate@demo.local` / `demo123!`

## GGTech (provisioned)

| | |
|--|--|
| Slug | `ggtech` |
| Supabase `colors.primary` | `#FF003D` (synced via `--branding-file`) |
| Local preview | http://localhost:5173/?tenant=ggtech (backend on `:3000`) |
| Free tier URL | https://frontend-five-chi-66.vercel.app/?tenant=ggtech |
| Production (custom domain) | https://ggtech.{PLATFORM_DOMAIN} |
| Branding file | [`docs/examples/ggtech-branding.json`](examples/ggtech-branding.json) |

Refresh Supabase branding after spec changes:

```powershell
cd backend
npm run create-prospect-from-url -- --slug ggtech --name "GGTech Entertainment" --update --branding-file ../docs/examples/ggtech-branding.json
```

That command updates Supabase **and** runs production sync automatically (Render + Vercel). To skip deploy: add `--skip-production-sync`.

Manual production sync only:

```powershell
npm run ensure-outreach-production -- --slug ggtech
```

Requires `VERCEL_TOKEN` in `backend/.env` (see [backend/.env.example](../backend/.env.example)).

**If the Vercel URL shows generic Careers UI:** DevTools → Network — requests to `localhost:3000` mean `VITE_API_URL` was not set at build time. Run `npm run ensure-outreach-production` or set `VITE_API_URL` on Vercel and redeploy.

## Creating more prospects

```powershell
cd backend
npm run create-prospect-from-url -- --url https://company.com/about --slug company
```

CLI prints the shareable URL when `APP_PUBLIC_URL` is set in backend `.env`.

See [DEPLOY.md](../DEPLOY.md) for full setup and [SALES_ONE_PAGER.md](SALES_ONE_PAGER.md) for outreach workflow.
