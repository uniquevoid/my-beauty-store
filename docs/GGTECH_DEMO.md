# GGTech demo — quick walkthrough

Prospect: [GGTech Entertainment](https://ggtech.gg/)  
Tenant slug: `ggtech`

## Before you start

- Backend `.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (you already have this).
- Optional for pretty URLs after deploy: `PLATFORM_DOMAIN` in backend `.env`.
- Two terminals: backend `npm run start:dev`, frontend `npm run dev`.

## Step 1 — Customize branding (5–15 min)

1. Open `docs/examples/ggtech-branding.json`.
2. Update from [ggtech.gg](https://ggtech.gg/):
   - **logoUrl** — right-click their logo → copy image address (replace favicon if needed).
   - **colors.primary** — use their brand purple/green (browser color picker on their site).
   - **hero.headline / subheadline** — mirror their tone (tech, education, esports).
   - **landing.about.body** — 2–3 sentences about what they do.

## Step 2 — Create the GGTech tenant + 10 jobs (one command)

In PowerShell, from `backend/`:

```powershell
.\scripts\create-prospect-demo.ps1 -Slug ggtech -Name "GGTech Entertainment" -BrandingFile ..\docs\examples\ggtech-branding.json
```

This creates the tenant, applies branding, and loads **10 published jobs** automatically (no CSV).

## Step 3 — Preview locally

Open in the browser:

**http://localhost:5173/?tenant=ggtech**

Check home page, **Open Positions** (`/jobs`), one job detail, and apply flow.

Admin (to tweak later): **http://localhost:5173/admin?tenant=ggtech** — login `admin` / `user`.

Candidate dashboard: **http://localhost:5173/login?tenant=ggtech** — email `candidate@demo.local` / password `demo123!`, then open `/candidate`.

## Step 4 — After deploy (outreach URL)

When [DEPLOY.md](../DEPLOY.md) is done and `PLATFORM_DOMAIN` is set:

**https://ggtech.&lt;your-platform-domain&gt;**

Send that link in your email.

## Step 5 — Outreach

- **Link:** their demo URL.
- **Angle:** modern careers experience on top of existing hiring stack; they see *their* brand, not a generic template.
- **CTA:** 20-minute walkthrough.

## Re-run jobs only

```bash
npm run seed-demo-jobs -- --slug ggtech
```

## Re-run demo candidate only

```bash
npm run seed-demo-candidate -- --slug ggtech
```
