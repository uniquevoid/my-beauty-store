---
name: default-tenant-feature
description: >-
  Ships base-product features for the default tenant (slug `default`). Use when
  building or changing candidate UX, admin, AI, resume matching, core API, or
  any user-facing behavior on `/?tenant=default`. Follows feature-delivery-qa
  and default-tenant-changelog rules.
---

# Default tenant feature development

Use for **base product** work on the default tenant — not prospect demos.

## Scope

| In scope | Out of scope |
|----------|--------------|
| `frontend/src/`, `backend/src/careers/`, `backend/src/jobs/`, core API | `backend/src/branding/`, `docs/examples/*-branding.json` |
| `/?tenant=default` candidate and admin UX | `demo-from-website`, prospect provisioning |
| Migrations affecting default-tenant behavior | `ensure-outreach-production` |

When ambiguous, ask once: **"Are we improving the base product or customizing a prospect demo?"**

## Workflow

Copy and track:

```
Task progress:
- [ ] 1. Clarify UX + pick approach (prototype 2–3 options if non-obvious)
- [ ] 2. Implement minimal diff in existing patterns
- [ ] 3. Unit tests for pure logic (`*.spec.ts`)
- [ ] 4. Smoke script if HTTP/DB touched (`backend/scripts/qa-verify-*.ts`)
- [ ] 5. Error UX via `getApiErrorMessage()` in admin/candidate UI
- [ ] 6. Run tests + smoke against local stack
- [ ] 7. Changelog: `docs/changelog/YYYY-MM-DD-kebab-slug.md`
- [ ] 8. Verify on `http://localhost:5173/?tenant=default`
```

## Local stack

- Frontend: `http://localhost:5173` (`VITE_API_URL=http://localhost:3001`)
- Backend: `http://localhost:3001`
- Quick start: `Start-Local-Dev.ps1` or `Start-Local-Dev.bat`

## Delivery rules

Follow `.cursor/rules/feature-delivery-qa.mdc` and `.cursor/rules/default-tenant-changelog.mdc`.

Changelog template: `docs/changelog/_template.md`. Required sections: **What changed**, **Why we did it**, **How to verify**.

## References

- Strategy: `docs/NORTH_STAR.md`
- Base product context: `.cursor/rules/base-product-development.mdc`
- Existing smoke examples: `npm run qa-verify-pipeline`, `docs/QA_PIPELINE.md`
