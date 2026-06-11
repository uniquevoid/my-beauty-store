# Pipeline apply URL fix and generate draft errors

**Date:** 2026-06-10
**Tenant:** default (base product)

## What changed

- Bare LinkedIn/portfolio URLs (e.g. `linkedin.com/in/user`) are auto-normalized to `https://…` on resume extract and in the apply form
- Application validation accepts normalized bare domains on both frontend and backend
- Generate draft maps missing protection DB columns to a 503 with migrate instructions instead of a generic 500
- Removed invalid `gemini-3.1-flash` from the model fallback chain to reduce generate latency

## Why we did it

Resume parsing often extracts LinkedIn without a scheme, which blocked application submit. Generate draft failed with Internal server error when the candidate protection migration had not been applied, after a slow AI retry loop.

## How to verify

1. Apply via invite with a resume containing `linkedin.com/in/username` — submit should succeed
2. Run `cd backend && npm run db:migrate`, then **Generate draft** on a screened candidate — draft should save
3. Unit tests: `npm test -- --testPathPatterns=url-normalization|supabase-error`

## Scope notes

- If generate still fails, confirm `DATABASE_URL` is set in `backend/.env` and migration `20260610000000_candidate_protection.sql` has run
