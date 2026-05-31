# Careers platform (multi-tenant)

White-label career sites for prospects and customers. One codebase, many branded demos via tenant subdomains.

## Quick links

| Doc | Purpose |
|-----|---------|
| [docs/NORTH_STAR.md](docs/NORTH_STAR.md) | Product vision, sales demo engine, AI features, engineering priorities |
| [DEPLOY.md](DEPLOY.md) | One-time Vercel + Railway/Render + Supabase setup |
| [docs/PRODUCTION_URL_CHECKLIST.md](docs/PRODUCTION_URL_CHECKLIST.md) | Go live: wildcard domain + backend env for shareable prospect URLs |
| [docs/PROSPECT_DEMO.md](docs/PROSPECT_DEMO.md) | Create a prospect demo before outreach |
| [supabase/README.md](supabase/README.md) | Database migrations (automated) |

## Local development

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # fill Supabase keys + DATABASE_URL
npm install
npm run db:migrate:status   # first time on existing DB: npm run db:migrate:baseline
npm run start:dev             # applies pending migrations + bootstraps default tenant

# Terminal 2 — frontend
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

Open http://localhost:5173. Use `?tenant=your-slug` or set `VITE_TENANT_SLUG` for a specific prospect.

## New prospect demo (summary)

```bash
cd backend
npm run create-prospect -- --slug acme --name "Acme Corp" --branding-file ../docs/examples/prospect-branding.template.json
```

Demo URL (after deploy): `https://acme.<PLATFORM_DOMAIN>`

## Product schema changes

Add a SQL file under `supabase/migrations/`. Pending migrations apply automatically when you start the backend or deploy — no Supabase SQL Editor step.
