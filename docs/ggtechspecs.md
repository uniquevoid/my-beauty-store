# GGTech Entertainment — prospect tenant spec

Source site: [https://ggtech.gg/](https://ggtech.gg/)  
Captured: 2026-05-28 (Playwright, English locale)  
Purpose: provision a **ggtech** tenant for the prospect demo outreach flow.

---

## MCPs and Supabase (not auto-sync)

Cursor MCPs (**Supabase**, **Vercel**, **Playwright**, **GitHub**) are enabled for this workspace as **agent tools**. They do **not** push branding when you edit this file or run Playwright.

| What changed | Where it must be updated |
|--------------|---------------------------|
| Branding JSON on disk | [`docs/examples/ggtech-branding.json`](examples/ggtech-branding.json) |
| Live demo data | **Supabase** `tenants.branding_json` for slug `ggtech` |
| Public URL appearance | **Vercel** must have `VITE_API_URL` → your Render API (redeploy after change) |

After Playwright or manual JSON edits, sync Supabase **and production** (auto-runs Render + Vercel sync):

```powershell
cd backend
npm run create-prospect-from-url -- --slug ggtech --name "GGTech Entertainment" --update --branding-file ../docs/examples/ggtech-branding.json
```

Requires `VERCEL_TOKEN` in `backend/.env` for step 3 (Vercel `VITE_API_URL` + redeploy). One-time: `npm run ensure-outreach-production -- --slug ggtech`

Or re-extract from the site (extractor now prefers `#FF003D` from linked CSS):

```powershell
npm run create-prospect-from-url -- --url https://ggtech.gg --slug ggtech --update
```

## Quick provision

From `backend/`:

```powershell
npm run create-prospect-from-url -- --url https://ggtech.gg --slug ggtech --name "GGTech Entertainment"
```

Or apply the branding JSON below manually:

```powershell
.\scripts\create-prospect-demo.ps1 -Slug ggtech -Name "GGTech Entertainment" -BrandingFile ..\docs\examples\ggtech-branding.json
```

**Cold outreach URL** (set `APP_PUBLIC_URL` on backend):

`https://frontend-five-chi-66.vercel.app/?tenant=ggtech`

| Role | Login |
|------|--------|
| Admin | `admin` / `user` (change on first login) |
| Demo candidate | `candidate@demo.local` / `demo123!` |

> **Vercel:** If the live URL still shows generic “Careers” branding, set **`VITE_API_URL`** to your Render API URL in the Vercel project and **redeploy** (see [`PRODUCTION_URL_CHECKLIST.md`](PRODUCTION_URL_CHECKLIST.md)).

---

## Company identity

| Field | Value |
|-------|--------|
| Legal name | GGTech Entertainment, S.L. |
| Display name | GGTech Entertainment |
| Tenant slug | `ggtech` |
| Tagline | Tech, Education & Esports |
| Industries | Videogames, Esports, Education |
| Site language | EN / ES (combobox on site) |

**Meta description** (from site):

> GGTech Entertainment is a technology company with projects related to the Esports, Video Games and Education industry in Europe, Latin America, Middle East, North Africa and the United States.

**OG / social**

| Property | URL |
|----------|-----|
| og:title | GGTech Entertainment - Tech, Education and Esports |
| og:image | https://ggtech.gg/ogimage.jpg (1200×630) |
| og:url | https://ggtech.gg |

---

## Color palette

Primary brand color is **red `#FF003D`**, not blue. Extracted from live CSS (`index-CFAy-RjK.css`, buttons, SVG fills).

### Core

| Token | Hex | Usage |
|-------|-----|--------|
| Brand primary | `#FF003D` | Logo “GG”, CTAs (Contact, Download Deck), accents |
| Primary dark | `#C10037` | Logo diamond gradients |
| Primary darker | `#B50034` | Logo diamond shadows |
| Primary bright | `#D1053F` | Logo highlights |
| Primary alt | `#C50634` | CSS variant |
| Background | `#FFFFFF` | Page body |
| Surface dark | `#111111` | Footer / dark sections |
| Surface darker | `#0B0B0B` | Deep backgrounds |
| Text primary | `#181818` | Body copy |
| Text secondary | `#212121` | Muted UI |
| Text tertiary | `#333333` | Secondary text |
| On-brand / inverse | `#FFFFFF` | Text on red buttons, logo “Tech” letters |

### Recommended tenant `colors` object

```json
{
  "primary": "#FF003D",
  "primaryForeground": "#FFFFFF",
  "navLink": "#181818",
  "accent": "#C10037",
  "accentForeground": "#FFFFFF"
}
```

### Computed UI (Playwright)

| Element | Background | Text |
|---------|------------|------|
| Contact CTA | `#FF003D` | `#FFFFFF` |
| Download Deck CTA | `#FF003D` | `#FFFFFF` |
| About GGTech (outline) | transparent | `#FFFFFF` |

---

## Typography

| Role | Family |
|------|--------|
| Body / UI | **Montserrat**, sans-serif |

Headings on the marketing site are uppercase in hero/section labels (e.g. “TECH, EDUCATION & ESPORTS”).

---

## Logo & icons

Header and hero logos are **inline SVG** on the site. For the careers tenant, use raster icons (same brand mark).

### Recommended `logoUrl`

| Asset | URL | Notes |
|-------|-----|--------|
| **Logo (recommended)** | https://ggtech.gg/favicon-96x96.png | Square mark, good for nav |
| Apple touch | https://ggtech.gg/apple-icon-180x180.png | Larger square |
| Android / PWA | https://ggtech.gg/android-icon-192x192.png | 192×192 |
| Favicon 32 | https://ggtech.gg/favicon-32x32.png | Tab icon |

`logoAlt`: `GGTech Entertainment`

### SVG brand colors (embedded in site logo)

- “GG” paths: `#FF003D`
- “Tech” paths: `#FFFFFF` (on dark hero) / white in header on dark nav

---

## Hero & media

| Asset | URL |
|-------|-----|
| Hero background (OG / share image) | https://ggtech.gg/ogimage.jpg |
| Hero video | https://ggtech.gg/assets/hero-BQ-WISNE.mp4 |
| Partners section decor | https://ggtech.gg/assets/partners-decor-Cqvl7Srb.jpg |
| World map | https://ggtech.gg/assets/map-dkreZqA2.png |

### Hero copy (English)

| Field | Text |
|-------|------|
| Headline | Tech, Education & Esports |
| Subheadline | GGTech Entertainment is a technology company with projects related to Videogames, Esports and Education. |
| Badge (optional for careers demo) | We're hiring! |

---

## Page sections & copy

### Navigation

| Label | Notes |
|-------|--------|
| Holding | Dropdown (regional subsidiaries) |
| Noticias | News |
| Sobre nosotros | About us |
| Contact | Header CTA |

**Holding subsidiaries** (menu items):

- GGTech Entertainment — Europa y Central
- GGTech Norteamérica — Estados Unidos y Canadá
- GGTech América — México, Centro y América del Sur
- MENATech — Medio Oriente y Norte de África
- NUEL — Reino Unido y países nórdicos
- DODIT Entertainment — España
- GGTech Studios — Desarrollo de videojuegos

### About / company pitch

**Section title:** An international leading company in Esports

**Body:**

> We are a **multidisciplinar technology company** providing tech solutions and developing games. Some of our projects are being developed by side with **trusted brands** such as Amazon, Intel, Riot Games or Tencent.

**CTAs:**

| Label | URL |
|-------|-----|
| About GGTech | https://www.youtube.com/watch?v=mBVarGLAfMs |
| Download Deck | https://docsend.com/view/hfee98swikwjcepj |

### Partners

**Section title:** SOME OF OUR PARTNERS

Partner names shown on site: Riot Games, Ubisoft, Epic Games, Supercell, Garena, Tencent, Activision, Amazon, McDonald's, Microsoft, Philips, Intel, Omen, Logitech, Adidas, Red Bull, Prime Student, Domino's Pizza, Samsung, Twitch, SteelSeries, Nvidia, Lenovo, Sony, HyperX, Disney+, Office Depot, AMD, ASUS, TikTok, Vodafone.

**Raster asset URLs** (others are lazy-loaded base64 on homepage):

| Partner | URL |
|---------|-----|
| Red Bull | https://ggtech.gg/assets/redbull-DpAnTn7q.png |
| Disney+ | https://ggtech.gg/assets/disney-plus-CUXSEEn8.png |
| Office Depot | https://ggtech.gg/assets/office-depot-Dv-NyznM.png |
| MENATech (holding) | https://ggtech.gg/assets/menatech-B8AIs4rl.png |

### Our IPs

**Section title:** Our IPs  
**Intro:** These are some of the company's top IPs in the Esports industry.

#### GAMERGY

| Field | Value |
|-------|--------|
| Subtitle | ESPORTS AND GAMING FESTIVAL |
| Stat 1 | +180K Visitors |
| Stat 2 | 16 Editions |
| Stat 3 | 4 Countries |

#### University Esports

| Field | Value |
|-------|--------|
| Logo | https://ggtech.gg/assets/university-DK8cSfNr.svg |
| Subtitle | OUR GLOBAL UNIVERSITY PROGRAM |
| Stat 1 | +100k Students |
| Stat 2 | +1300 Universities |
| Stat 3 | 25 Countries |

> Note: Some stat labels on the live site remain Spanish (Visitantes, Ediciones, etc.) when UI locale is mixed; use English labels above for the demo tenant.

### Global presence

**Section title:** Where we are?

**Body:**

> GGTech Entertainment is an expanding international company with physical locations in Spain, United Kingdom, Estonia, Abu Dhabi, Argentina, Mexico, United States and Canada.

**Map image:** https://ggtech.gg/assets/map-dkreZqA2.png

### Contact

**Section title:** Contact us

**Body:**

> If you have any questions or feedback, please contact GGTech Entertainment through email.

| Channel | URL |
|---------|-----|
| Email | mailto:info@ggtech.gg |
| LinkedIn | https://www.linkedin.com/company/ggtech_es |
| YouTube | https://www.youtube.com/@ggtechentertainment |

### Footer

**Copyright:** GGTech Entertainment, S.L. © 2023. All rights reserved.

| Link | URL |
|------|-----|
| Legal Advice and Privacy Policy | https://s3.eu-west-1.amazonaws.com/2023.ggtech.gg/privacy/aviso-legal-y-politica-de-privacidad-ggtech.pdf |
| Canal ético | https://ggtech.gg/ethic |

---

## Ready-to-use branding JSON

Save as `docs/examples/ggtech-branding.json` (or let CLI write it, then fix `colors.primary`):

```json
{
  "companyName": "GGTech Entertainment",
  "logoUrl": "https://ggtech.gg/favicon-96x96.png",
  "logoAlt": "GGTech Entertainment",
  "metaDescription": "GGTech Entertainment is a technology company with projects related to the Esports, Video Games and Education industry in Europe, Latin America, Middle East, North Africa and the United States.",
  "colors": {
    "primary": "#FF003D",
    "primaryForeground": "#FFFFFF",
    "navLink": "#181818",
    "accent": "#C10037",
    "accentForeground": "#FFFFFF"
  },
  "hero": {
    "badgeText": "We're hiring!",
    "headline": "Tech, Education & Esports",
    "subheadline": "GGTech Entertainment is a technology company with projects related to Videogames, Esports and Education.",
    "backgroundImageUrl": "https://ggtech.gg/ogimage.jpg"
  },
  "landing": {
    "about": {
      "heading": "An international leading company in Esports",
      "body": "We are a multidisciplinar technology company providing tech solutions and developing games. Some of our projects are developed alongside trusted brands such as Amazon, Intel, Riot Games and Tencent.",
      "stats": [
        { "value": "+180K", "label": "GAMERGY visitors" },
        { "value": "+100k", "label": "University students" },
        { "value": "8+", "label": "Countries with offices" }
      ],
      "ctaLabel": "View open positions"
    }
  }
}
```

---

## Outreach angle (careers demo)

- **Hook:** Branded careers experience aligned with their esports / tech identity (red diamond mark, Montserrat, bold tone).
- **Proof:** Demo URL with 10 sample jobs + candidate login — they see **GGTech**, not a generic template.
- **CTA:** Short walkthrough (see `docs/GGTECH_DEMO.md`, `docs/PROSPECT_DEMO.md`).

---

## Extraction notes

| Item | Detail |
|------|--------|
| Auto-extract primary color | Now ranks linked CSS and picks `#FF003D` for ggtech.gg; use `--branding-file` for curated copy/stats |
| Partner logos | Mostly inlined as base64 at runtime; only a few have stable `/assets/*.png` URLs |
| Header logo | SVG data-URI only; use `favicon-96x96.png` or `apple-icon-180x180.png` for tenant |
| Careers page | Corporate site has no public jobs board; demo jobs are platform-seeded |
