# Candidate Protection & Ownership (Phase 1)

**Date:** 2026-06-10
**Tenant:** default (base product)

## What changed

- Added candidate protection to the presentation pipeline: blind profiles, dual full/blind AI-generated content, PII redaction flags, and recruiter review checklist before publish
- Progressive disclosure: clients accept introduction terms, view anonymous profile, request interview, then recruiter unlocks full presentation (presentation-only — no contact details)
- Digital ownership: human-readable introduction ID (`INT-xxxxx`), client company snapshot, immutable audit event log
- Watermarked PDF export via print CSS (CONFIDENTIAL diagonal watermark + introduction ID footer)
- Admin UI: protection toggle, unlock button, audit timeline, expanded pipeline activity badges
- Public API: `accept-terms`, `request-interview`, stage-gated content; admin API: `unlock-full`, `audit-events`

## Why we did it

Agency recruiters need to introduce candidates to clients without losing control of the relationship or leaking identifying details prematurely. This prototype delivers the core protection story: evaluate anonymously, signal interest, recruiter-controlled unlock, and provable audit trail for fee disputes.

## How to verify

1. Run unit tests: `cd backend && npm test -- --testPathPattern=pipeline`
2. Run smoke script: `npm run qa-verify-pipeline -- --tenant default --api http://localhost:3001`
3. Manual flow: see [docs/QA_PIPELINE.md](../QA_PIPELINE.md) section 5 (terms gate → blind profile → interview request → unlock → watermark)

## Scope notes

- Layer 6 (engagement intelligence / AI follow-up insights) deferred
- Resume PDF download on unlock deferred — contact stays offline with recruiter
- Per-client identity tracking deferred (anonymous share links)
