# Candidate presentation pipeline — QA checklist

Automated smoke test:

```powershell
cd backend
npm run qa-verify-pipeline -- --tenant default --api http://localhost:3001
```

Requires backend running on the API URL and at least one **published** job for the tenant.

## Manual end-to-end flow

### 1. Start local stack

```powershell
.\Start-Local-Dev.ps1
```

Or two terminals: backend `$env:PORT="3001"; npm run start:dev`, frontend `npm run dev`.

Ensure `frontend/.env` has `VITE_API_URL=http://localhost:3001`.

### 2. Admin — create screened candidate

1. Open http://localhost:5173/admin/login?tenant=default (`admin` / `user`)
2. **Pipeline → Add screened candidate**
3. Select a published job, enter name, email, screening notes
4. Submit → green **Invite link ready** box with URL like `/apply/{slug}?invite=...`

### 3. Candidate — apply via invite

1. Open invite link in incognito
2. Confirm invited-candidate banner
3. Upload resume, submit application

### 4. Admin — presentation

1. **Pipeline → Presentation** for that candidate
2. **Generate draft** (after application submitted)
3. Edit sections → **Save draft** → **Publish**
4. Copy share link

### 5. Client view, PDF export, and engagement

1. **Preview** (admin) opens `/present/{token}?preview=1` — does **not** update client activity badges; bypasses terms gate for internal review
2. **Copy client link** and open `/present/{shareToken}` in incognito (no `preview=1`)
3. Accept the **introduction agreement** banner before content loads
4. Verify **anonymous blind profile** (structured fields + anonymized narrative, no candidate name)
5. Click **Request interview** — confirmation state appears; admin shows **Interview requested** badge
6. Admin: click **Unlock full presentation** — client refresh shows full profile with display name and real employers
7. Verify branded layout, summary, strengths, screening insights
8. Admin pipeline shows **Opened** under Client activity; presentation page shows **Link opened** badge
9. Click **Export PDF** on the public page → browser print dialog → verify CONFIDENTIAL watermark and introduction ID in footer
10. Admin shows **PDF exported** badge and pipeline **Opened · Exported · Terms OK · Interview req · Unlocked**
11. Review **Audit trail** on admin presentation page (terms accepted, interview requested, full unlocked, viewed, export)
12. If you accidentally used the client link yourself, use **Reset engagement** on the admin presentation page

### 6. Recruiter notification (optional)

Set tenant notification email:

```sql
UPDATE tenants
SET settings_json = '{"recruiterNotificationEmail": "you@example.com"}'
WHERE slug = 'default';
```

With `MAIL_PROVIDER=console`, check backend logs after candidate submit.

## Common failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Network Error in admin UI | Backend not reachable | Start API on :3001; check `VITE_API_URL` |
| 500 / migration message | `screened_candidates` missing | `npm run db:migrate` with `DATABASE_URL` set |
| Generate disabled | Application not submitted or not linked to invite | Re-apply via invite link; refresh admin page |
| Status shows "Draft presentation" but no draft | Old bug: status set on submit before generate | Fixed — status stays "Applied" until generate |
| Engagement badges not updating | Opened preview link or migration missing | Use client link without `?preview=1`; run `npm run db:migrate` |
