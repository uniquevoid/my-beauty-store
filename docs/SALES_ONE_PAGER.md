# Sales one-pager — prospect demo in minutes

Use this when outreach needs a **branded careers site URL** before the first call. Demo jobs (10 roles) and a sample candidate account are included automatically.

## Fastest path: one CLI command

**Preferred:** from `backend/`:

```powershell
npm run demo-from-website -- --url https://company.com
```

Legacy step-by-step (with `.env` pointing at production Supabase and `APP_PUBLIC_URL` set to your Vercel URL):

```powershell
npm run create-prospect-from-url -- --url https://company.com/about
```

Optional flags:

```powershell
npm run create-prospect-from-url -- --url https://company.com --slug acme --name "Acme Corp"
npm run create-prospect-from-url -- --url https://company.com --update
npm run create-prospect-from-url -- --url https://company.com --dry-run
```

This will:

1. Fetch the company site and extract logo, hero image, colors, headline, and about copy
2. Write `docs/examples/{slug}-branding.json`
3. Provision the tenant with 10 demo jobs + demo candidate
4. **Auto-sync production** — wake Render API, set Vercel `VITE_API_URL`, redeploy frontend (`ensure-outreach-production`)
5. Print the **shareable demo URL** — free tier: `https://your-project.vercel.app/?tenant={slug}`

One-time in `backend/.env`: `VERCEL_TOKEN` (or `npx vercel login`), `RENDER_API_URL`, optional deploy hooks. Deploy `careers-api` on Render first ([`render.yaml`](../render.yaml)).

**Dry run** writes the JSON only — review branding, then re-run without `--dry-run`.

**Update** (`--update`) refreshes branding and re-seeds demo jobs for an existing slug.

---

## Shareable URL (free tier — no paid domain)

Set once on the backend (Render + local `.env`):

```env
APP_PUBLIC_URL=https://frontend-five-chi-66.vercel.app
```

Prospect link pattern:

**`https://frontend-five-chi-66.vercel.app/?tenant={slug}`**

Example: `https://frontend-five-chi-66.vercel.app/?tenant=ggtech`

When you buy a custom domain later, set `PLATFORM_DOMAIN` for subdomain URLs — same tenants, no re-provision.

---

## Cursor Agent prompt (paste in chat)

Copy, replace the URL, and send in **Agent mode**:

```
Create a prospect demo for outreach.

Company website: https://EXAMPLE.com/about
Preferred slug (optional): example
Environment: production (use my backend .env / Supabase)

Do the following:
1. Run npm run create-prospect-from-url (or fetch + write branding JSON and provision if the script fails)
2. Return the shareable demo URL, admin login, and candidate demo login
3. Give me a 3-item smoke-test checklist before I email the prospect
```

The agent can refine hero copy in the branding JSON if the auto-extracted text is weak.

---

## Demo Builder (no terminal)

When `VITE_ENABLE_DEMO_BUILDER=true` on your platform frontend:

1. Open `https://<your-platform>/demo-builder`
2. Enter `PROVISION_API_KEY`
3. **Import from URL** — paste the prospect homepage or `/about` page
4. Review pre-filled fields → **Create demo site**

---

## What the prospect sees

| Included | Notes |
|----------|--------|
| Branded home (logo, colors, hero, about) | Pulled from their website (logo ≠ social banner) |
| 10 open positions | Generic demo roles (good for first email) |
| Apply flow + AI resume extract | Full product experience |
| Candidate dashboard demo | `candidate@demo.local` / `demo123!` |

Not customized on first pass: footer legal links, technology/life-at sections (base product copy), real job listings from their ATS.

---

## Credentials to keep handy

| Role | Login |
|------|--------|
| Admin (tweak branding/jobs) | `admin` / `user` at `/admin` |
| Candidate (show dashboard) | `candidate@demo.local` / `demo123!` at `/login` |

---

## Outreach email skeleton

**Subject:** A careers experience built for [Company]

Hi [Name],

I put together a branded careers front door for [Company] so you can see the candidate experience before we talk:

**[Demo URL]** — e.g. `https://frontend-five-chi-66.vercel.app/?tenant=acme`

It includes open positions, apply-with-resume, and a candidate portal — without replacing your ATS on day one.

Open to a 20-minute walkthrough this week?

---

## After they reply yes

Same tenant — no new deploy. See [PROSPECT_DEMO.md](PROSPECT_DEMO.md) for go-live steps (custom domain, real job import, admin users).

## Related docs

- [PRODUCTION_URL_CHECKLIST.md](PRODUCTION_URL_CHECKLIST.md) — Vercel + Render free tier setup
- [PROSPECT_DEMO.md](PROSPECT_DEMO.md) — full playbook
- [GGTECH_DEMO.md](GGTECH_DEMO.md) — worked example
- [DEPLOY.md](../DEPLOY.md) — platform setup
