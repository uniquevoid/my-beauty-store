# Job search autocomplete QA

Smoke script for the default-tenant keyword suggestion API and search flow.

## Prerequisites

- Backend running at `http://localhost:3001`
- Default tenant provisioned with demo jobs

## Run

```powershell
cd backend
npm run qa-verify-job-search -- --tenant default
```

Optional API override:

```powershell
npm run qa-verify-job-search -- --tenant default --api http://localhost:3001
```

## Manual check

1. `http://localhost:5173/?tenant=default` — type `eng` in the hero search box.
2. Confirm suggestions list job titles with location/department subtext.
3. Pick a suggestion — URL should update to `/jobs?q=...` with filtered results.
4. Repeat on `/jobs` (page variant styling).
