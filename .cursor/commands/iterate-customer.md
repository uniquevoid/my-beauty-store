# Iterate customer demo (visual fixes → redeploy)



The user already has a prospect tenant and wants to **fix visuals** before sharing. Text after `/iterate-customer` is the **tenant slug** (e.g. `ggtech`) or a slug plus notes.



**Run commands yourself** from `backend/`.



## Steps



1. Identify `slug` from the command text (required). If missing, ask once.



2. Read `docs/examples/<slug>-branding.json`. Apply fixes for what the user described (fonts → `typography`, colors → `colors`/`theme`/`components`, hero → `hero`, images → `assets`, sections → `landing.sections` + section data).



3. Redeploy:

   ```powershell

   npm run demo-from-website -- --slug <slug> --update

   ```

   If they asked to re-scrape the company site, include `--url <website>`.



4. Verify the check link in incognito (Playwright MCP if available):

   - No generic template bleed (fake customers/testimonials)

   - Contrast on primary-colored sections (testimonial avatars, Life at panel)

   - Only intended sections visible per `landing.sections`



5. Reply with:

   - **CHECK LINK:** `https://frontend-five-chi-66.vercel.app/?tenant=<slug>` (or `APP_PUBLIC_URL`)

   - What you changed (one short bullet list)

   - Ask if ready to share or need another pass



## If API unreachable



```powershell

.\backend\scripts\start-outreach-demo.ps1 -Slug <slug>

npm run demo-from-website -- --slug <slug> --sync-only

```



Follow `prospect-visual-brand-parity` and `work-context-routing` rules. Do not ask the user to run npm manually.

