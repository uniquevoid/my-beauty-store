# Cursor slash commands

Type `/` in Cursor Agent chat to run these prompts.

| Command | Usage | Purpose |
|---------|--------|---------|
| `/newcustomer` | `/newcustomer https://company.com` | New prospect: extract → demo URL → iterate in chat |
| `/iterate-customer` | `/iterate-customer ggtech` | Fix visuals and redeploy an existing tenant |

Requires `backend/.env` with Supabase + `VERCEL_TOKEN` + `APP_PUBLIC_URL`.

Work context routing: `.cursor/rules/work-context-routing.mdc` (base product vs prospect outreach).
