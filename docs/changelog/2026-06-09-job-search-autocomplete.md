# Job search keyword autocomplete

**Date:** 2026-06-09
**Tenant:** default (base product)

## What changed

- Added `GET /jobs/search-suggestions` API that returns ranked job title suggestions for keyword queries (2+ characters).
- Replaced the plain keyword text input in `JobSearchForm` with an accessible combobox that shows title, location, and department hints.
- Selecting a suggestion fills the keyword and runs the search immediately (hero and jobs page).

## Why we did it

Career sites from Workday, Greenhouse, and similar ATS platforms use debounced keyword typeahead so candidates can discover open roles faster. This brings the default tenant search UX in line with common HCM patterns while keeping location and area filters as structured controls.

## How to verify

1. Start the local stack (`Start-Local-Dev.ps1`).
2. Open `http://localhost:5173/?tenant=default` and type `eng` in the hero keyword field — suggestions should appear with job titles and metadata.
3. Select a suggestion — you should land on `/jobs` with matching results.
4. Run `cd backend && npm run qa-verify-job-search`.

## Scope notes

- Suggestions search published job titles and departments only (not full description text).
- Prospect tenant branding is unchanged; the component inherits tenant design tokens via existing form styles.
