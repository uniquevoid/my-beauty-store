# Client share link widget redesign

**Date:** 2026-06-11
**Tenant:** default (base product)

## What changed

- Extracted the published-presentation "Client share link" block from `AdminPresentationPage` into `ClientShareLinkWidget`.
- Replaced emerald pill engagement badges with a horizontal milestone stepper (vertical on mobile).
- Redesigned the share URL area, action button group, and audit trail as a premium B2B admin card (slate/blue palette, Lucide icons, soft shadows).
- Added `engagementSteps.ts` pure helpers with unit tests for step and unlock-CTA logic.

## Why we did it

Recruitment consultants need a clearer, more professional view of client submittal link status and engagement history. The previous inline UI used uniform green pills and a raw text audit list that did not match the quality bar of the rest of the admin experience.

## How to verify

1. Sign in to admin and open a **published** presentation (`/admin/pipeline/:id/presentation`).
2. Confirm the client share link card shows:
   - Monospace URL in a secure inset block with lock icon
   - Copy / Preview / Reset engagement button group with hover transitions
   - Engagement stepper reflecting `client_viewed_at`, export, terms, interview, and unlock state
   - Audit trail timeline when events exist
3. Copy link and preview still work; reset engagement still prompts for confirmation.
4. Run unit tests: `cd frontend && npx tsx --test src/admin/engagementSteps.spec.ts`
5. Run build: `cd frontend && npm run build`

## Scope notes

- No API or database changes. All fetching and handlers remain in `AdminPresentationPage`.
