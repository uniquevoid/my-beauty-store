# Prospect demo playbook

Use this checklist for each company you outreach. You are **not** creating a new project—only a new **tenant** on your shared platform.

## Cursor command (recommended)

In Cursor chat, type:

```
/newcustomer https://company.com
```

The agent will extract branding, provision the tenant, deploy to Vercel, and give you the **check link**. Say what looks wrong in the same chat; it will iterate on `docs/examples/<slug>-branding.json` until you are ready to share.

Continue iteration only:

```
/iterate-customer ggtech
```

Commands live in [`.cursor/commands/`](../.cursor/commands/).

## One command (website → demo URL)

From `backend/`:

```powershell
npm run demo-from-website -- --url https://company.com
```

This will: Playwright extract → validate visuals → save `docs/examples/<slug>-branding.json` → Supabase tenant → Vercel deploy → print your **check link**.

**Iterate** until visuals are right (edit the JSON, then):

```powershell
npm run demo-from-website -- --slug company --update
```

Re-scrape from the live site:

```powershell
npm run demo-from-website -- --url https://company.com --slug company --update
```

Redeploy only (after JSON tweaks, no re-extract):

```powershell
npm run demo-from-website -- --slug company --sync-only
```

Windows shortcut: `.\backend\scripts\demo-from-website.ps1 -Url https://company.com`

## Check your demo (one link)

Open in **incognito** (avoids cached generic branding):

**`https://frontend-five-chi-66.vercel.app/?tenant={slug}`**

Example (GGTech): [https://frontend-five-chi-66.vercel.app/?tenant=ggtech](https://frontend-five-chi-66.vercel.app/?tenant=ggtech)

| What to verify | GGTech example |
|----------------|----------------|
| Browser tab title | Careers at **GGTech Entertainment** |
| Logo | GGTech mark in header |
| Font | **Montserrat** (not Inter/Playfair) — check hero headline letter shapes |
| Header | Dark background, light text |
| Hero | Red `#FF003D`, headline **Tech, Education & Esports**, company hero image |
| Jobs | `/jobs` shows ~10 demo roles |
| About copy | Company-specific (not "enterprise software… talent and acquisition") |
| Sections | Only extracted sections visible — no fake Accenture logos or employee quotes |
| Contrast | Testimonial avatar rings and Life at panel readable on brand primary |

If you still see generic blue "Careers" copy or Inter fonts, the production API is unreachable — deploy [Render `careers-api`](PRODUCTION_URL_CHECKLIST.md) (24/7) or run `.\backend\scripts\start-outreach-demo.ps1` (interim, while your PC is on).

**Adaptive sections:** Extraction sets `landing.sections` in `docs/examples/<slug>-branding.json`. Sections without data auto-hide. Override with `"sections": { "customers": false }` or add manual section data.

**Work context:** See `.cursor/rules/work-context-routing.mdc` — prospect demos vs base product work.

**Quick start:** see [SALES_ONE_PAGER.md](SALES_ONE_PAGER.md) for the one-command URL workflow and Cursor prompt template.

## Prerequisites

- Platform deployed per [DEPLOY.md](../DEPLOY.md)
- `PLATFORM_DOMAIN` set on the backend (e.g. `careersites.yourcompany.com`)
- `PROVISION_API_KEY` saved in your password manager
- **Playwright (one-time)** for visual extraction from `backend/`:
  ```powershell
  npm install
  npx playwright install chromium
  ```

## Step 1 — Branding (pick one)

### Mandatory visual parity

Prospect demos must match the company site: **fonts, colors, hero background, header/footer, button styles**. The CLI runs Playwright by default and **blocks provision** if validation fails (use `--force` only in emergencies).

**Checklist before sharing the demo URL:**

- [ ] Company logo and **body font** (not default Inter-only template)
- [ ] Hero uses company **og:image** or hero background (not Unsplash placeholder)
- [ ] Header and primary CTA colors match the corporate site (primary = main CTA color, not stray CSS orange)
- [ ] `hero.headline` is real marketing copy (not “Build your career at…”)
- [ ] **All careers copy in English** (even when the corporate site is Spanish)
- [ ] Nav labels are **≤ 3 words** in English (never the hero headline in the header)
- [ ] Technology and job-alerts sections use **photos**, not small SVG icons or the hero graphic
- [ ] Partner logos, culture/values, stats, or testimonials appear when present on the company site

### Option A — From company URL (recommended)

From `backend/`:

```powershell
npm run create-prospect-from-url -- --url https://acme.com --slug acme
```

Uses **Playwright** to extract computed styles, writes `docs/examples/acme-branding.json`, validates visual parity, provisions the tenant, and prints the demo URL. Use `--dry-run` to preview JSON only.

### Option B — Manual JSON

1. Copy [`docs/examples/prospect-branding.template.json`](examples/prospect-branding.template.json) to `docs/examples/acme-branding.json`.
2. Fill **all** required sections: `colors`, `typography`, `theme`, `components`, `assets`, `hero`, `landing.about`.
3. Provision with `--branding-file` (validation runs; Playwright `source.method` not required for files):
   ```powershell
   npm run create-prospect-from-url -- --slug acme --name "Acme Corp" --update --branding-file ../docs/examples/acme-branding.json
   ```

## Step 2 — Create the tenant (if not using Option A)

Option A (`create-prospect-from-url`) provisions automatically. Otherwise, from `backend/`:

**Windows (PowerShell):**

```powershell
.\scripts\create-prospect-demo.ps1 -Slug acme -Name "Acme Corp" -BrandingFile ..\docs\examples\acme-branding.json
```

**Mac/Linux:**

```bash
./scripts/create-prospect-demo.sh acme "Acme Corp" ../docs/examples/acme-branding.json
```

**Or npm directly:**

```bash
npm run create-prospect -- --slug acme --name "Acme Corp" --branding-file ../docs/examples/acme-branding.json
```

This creates:

- Tenant row with subdomain `acme`
- Demo hostname `acme.<PLATFORM_DOMAIN>` (when `PLATFORM_DOMAIN` is set)
- Admin login: `admin` / `user` (must change password on first login)
- **10 published demo jobs** (seeded automatically)
- Demo candidate: `candidate@demo.local` / `demo123!` (sign in at `/login`, dashboard at `/candidate`)

## Step 3 — Load jobs (optional)

Demo jobs are seeded automatically when the tenant is created. To refresh them:

```bash
npm run seed-demo-jobs -- --slug acme
```

To refresh the demo candidate (profile, sample applications, job alerts):

```bash
npm run seed-demo-candidate -- --slug acme
```

**Option B — Real jobs from their careers page (CSV):**

1. Export jobs into CSV (`title`, `slug`, `department`, `location`, `status`, `description`).
2. Open **https://acme.&lt;PLATFORM_DOMAIN&gt;/admin** → **Import** → upload CSV.

## Step 4 — Smoke test

Open the demo URL in an incognito window:

**https://acme.&lt;PLATFORM_DOMAIN&gt;**

Check:

- [ ] Logo and company name in header
- [ ] Hero headline matches prospect
- [ ] Jobs list shows realistic roles
- [ ] Job detail and apply flow load
- [ ] Candidate sign-in at `/login` with `candidate@demo.local` / `demo123!` shows dashboard with sample applications and job alerts

## Step 5 — Outreach email

- **Link:** the demo URL above
- **Problem:** legacy ATS + weak candidate experience; you modernize the careers front door without replacing their ATS on day one
- **CTA:** 20-minute walkthrough

## Alternative: Demo Builder UI

If `VITE_ENABLE_DEMO_BUILDER=true` on the frontend:

1. Open `https://<your-platform>/demo-builder`
2. Enter your `PROVISION_API_KEY` once (stored in this browser only)
3. Use **Import from URL** to pre-fill from the prospect homepage, or fill the form manually
4. Create or update the prospect

## After they sign (go-live)

Same tenant—no new deploy:

1. Refine `branding_json` (demo builder, branding file + PATCH API, or Supabase)
2. Point `hostname` to `careers.client.com` and add DNS + domain in Vercel
3. Import production jobs; change admin password
4. Add client recruiters as admin users

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Wrong brand shows | Confirm URL subdomain matches tenant `subdomain`; check `PLATFORM_DOMAIN` on API |
| Generic “Careers” branding | Re-run with `--branding-file` or update via demo builder |
| API 401 on demo builder | Check `PROVISION_API_KEY` matches backend env |
| Jobs empty | Import CSV in `/admin` for that subdomain’s tenant |
