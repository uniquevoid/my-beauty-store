# New customer demo (company website → shareable URL)



You are starting a **new prospect demo**. The user invoked `/newcustomer` with a company website (and optional notes). **Run everything yourself** — do not tell the user to run npm scripts manually.



## Input



- **Company website URL** — required. It is the text after `/newcustomer` (e.g. `/newcustomer https://ggtech.gg`).

- Optional: `--slug acme`, `--name "Acme Corp"`, `--color #hex` if the user included them.



Parse the URL from the command arguments. If no URL is present, ask once: "What is the company website URL?"



## Phase 1 — Generate demo (run now)



From repo `backend/`:



```powershell

npm run demo-from-website -- --url <website> [--slug <slug>] [--name "<name>"]

```



If tenant already exists, add `--update`.



Requirements in `backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_PUBLIC_URL`, `VERCEL_TOKEN`. Playwright: `npx playwright install chromium` if extraction fails.



After the command finishes, reply with **only what the user needs**:



1. **CHECK LINK (incognito):** `{APP_PUBLIC_URL}/?tenant=<slug>` (default `https://frontend-five-chi-66.vercel.app/?tenant=<slug>`)

2. **Branding file to tweak:** `docs/examples/<slug>-branding.json`

3. **Quick checklist:**

   - Logo, company font (not Inter/Playfair), header colors, hero headline/image, brand CTAs

   - **No generic template sections** — no fake Fortune 500 customer logos or employee quotes unless extracted from the company site

   - **About copy** matches the company (not ATS boilerplate like "enterprise software… talent and acquisition")

   - **Contrast** on primary-colored blocks — testimonial avatar rings and Life at panel readable on saturated brand colors

   - **Adaptive sections** — extracted sections when data exists; **culture spotlight** fallback when partners/testimonials/culture are missing
   - **Brand palette** — `colors.primary` matches the **main site CTA** (e.g. pink/magenta), not legacy orange/CSS noise; accent/headline blues when present on the corporate site
   - **Personalized sections** — include `customers` (partner logos), `coreValues` / culture, `testimonials`, and `about.stats` when scraped from the company site
   - **Hero contrast** — headline readable on light hero photos (dark overlay, not white-on-white)
   - **English only** on the careers site (nav, hero, sections, job alerts) — corporate site may be Spanish; Gemini translates copy when `GEMINI_API_KEY` is set
   - **Header nav** — **3 links minimum** (Open Positions + 2 sections); each label **≤ 3 words** in English; never the hero headline in the nav bar
   - **Culture spotlight** — `/#culture-spotlight` section with "Read the story" CTA to corporate blog/interview or contact/careers page when social-proof sections are sparse
   - **Section images** — technology, job-alerts, and culture spotlight use marketing photos or distinct career/HR stock images (never the generic SVG illustration)



If production API was unreachable, start interim stack and redeploy:



```powershell

.\backend\scripts\start-outreach-demo.ps1 -Slug <slug>

npm run demo-from-website -- --slug <slug> --sync-only

```



## Phase 2 — Iterate until the user is happy



Stay in this thread. When the user reports visual issues (fonts, colors, hero, header, copy, wrong sections):



1. Fix `docs/examples/<slug>-branding.json` and/or re-extract:

   ```powershell

   npm run demo-from-website -- --url <website> --slug <slug> --update

   ```

   Or after manual JSON edits only:

   ```powershell

   npm run demo-from-website -- --slug <slug> --update

   ```

2. To hide a section: set `landing.sections.<section>: false` or remove its data (empty `customers.logos`, `testimonials.items`, etc.).

3. Verify the live URL (Playwright MCP or `web_fetch` on the check link): title, logo, font-family, hero, visible sections, contrast on red/primary blocks.

4. Post the **same check link** again and ask: "Anything else before you share with the customer?"



Repeat Phase 2 until the user says they are **ready to share**, **looks good**, or **ship it**.



## Phase 3 — Handoff



When the user confirms ready:



- Repeat the final **check link** once.

- Note: demo logins are admin `admin` / `user`, candidate `candidate@demo.local` / `demo123!`

- Do not commit secrets or `.env`.



## Rules



- Follow `.cursor/rules/work-context-routing.mdc`, `prospect-visual-brand-parity.mdc`, and `prospect-outreach-production.mdc`.

- Prefer Playwright extraction; use `--force` only if the user explicitly allows skipping validation.

- Keep responses short; the deliverable is the **check link**, not a tutorial.

