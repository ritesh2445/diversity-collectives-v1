# Production Deployment Runbook

**Target Production Domain:** `https://diversitycollective.org`  
**API Subdomain:** `https://api.diversitycollective.org`  
**Studio Subdomain:** `https://studio.diversitycollective.org`

---

## 1. Prerequisites & Tooling

Ensure the following CLIs are installed and authenticated before initiating deployment:
```bash
# 1. Cloudflare Wrangler CLI
npm install -g wrangler
wrangler login

# 2. Turso CLI
# On macOS/Linux: curl -sSfL https://get.tur.so/install.sh | bash
# On Windows: scoop install turso (or install via powershell)
turso auth login

# 3. Sanity CLI
npm install -g @sanity/cli
sanity login
```

---

## 2. Step 1: Provision & Migrate Turso Database

### 2.1 Create Database Instance
```bash
# Create production database in closest region (San Jose / Los Angeles: sjc / lax)
turso db create dcvc-production --location lax

# Get database URL
turso db show dcvc-production --url
# Outputs: libsql://dcvc-production-[org].turso.io

# Create persistent authentication token
turso db tokens create dcvc-production
```

### 2.2 Execute Schema DDL & Initial Migrations
```bash
# Run initial master schema DDL
turso db shell dcvc-production < src/db/schema.sql

# Seed initial verified business directory listings
turso db shell dcvc-production < src/db/seed.sql

# Verify tables created
turso db shell dcvc-production ".tables"
# Expected: accessibility_feedback, business_corrections, businesses, businesses_fts, contact_submissions, event_rsvps, newsletter_subscribers, training_bookings, volunteer_applications
```

---

## 3. Step 2: Deploy Cloudflare Worker API Backend

### 3.1 Configure Secrets
```bash
cd worker

# Inject production secrets into Cloudflare Edge
wrangler secret put TURSO_DATABASE_URL
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put RESEND_API_KEY
wrangler secret put TURNSTILE_SECRET_KEY
```

### 3.2 Deploy Worker
```bash
wrangler deploy
```
After deployment, configure the custom domain `api.diversitycollective.org` in the Cloudflare Dashboard under **Workers & Pages > dcvc-api > Settings > Triggers > Custom Domains**.

Verify endpoint health:
```bash
curl -i https://api.diversitycollective.org/api/health
```

---

## 4. Step 3: Deploy Sanity Studio (`studio.diversitycollective.org`)

```bash
cd studio

# Deploy to Sanity Cloud hosting (e.g. dcvc.sanity.studio)
npm run deploy

# Alternatively, build static bundle to deploy on Cloudflare Pages
npm run build
# Output directory: studio/dist
```

To configure custom domain:
1. In Sanity Management Dashboard (`sanity.io/manage`), navigate to your project.
2. Select **Studio Host** and add `studio.diversitycollective.org`.
3. Add CNAME record pointing `studio` to your Sanity host.

---

## 5. Step 4: Deploy Public Frontend (Cloudflare Pages or Vercel)

### Option A: Cloudflare Pages (Recommended)
1. In Cloudflare Dashboard, go to **Workers & Pages > Create application > Pages > Connect to Git**.
2. Select repository: `diversity-collectives-v1`.
3. Set build configuration:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_URL`: `https://api.diversitycollective.org/api`
   - `VITE_TURNSTILE_SITE_KEY`: `[Your Turnstile Site Key]`
   - `VITE_CLOUDINARY_CLOUD_NAME`: `dcvc`
   - `VITE_SANITY_PROJECT_ID`: `v7z28m5x`
   - `VITE_SANITY_DATASET`: `production`
   - `VITE_ZEFFY_DONATION_FORM_URL`: `https://www.zeffy.com/donation-form/...`
5. Click **Save and Deploy**.
6. Bind custom domain `diversitycollective.org` under **Custom domains**.

### Option B: Vercel
1. Run `vercel deploy --prod`.
2. Vercel automatically detects `vercel.json` and configures legacy 301 redirects, caching headers, and SPA rewrites.

---

## 6. DNS Records Summary

| Type | Name | Content / Target | Proxy Status | Purpose |
| :---: | :---: | :---: | :---: | :--- |
| **A / CNAME** | `@` / `diversitycollective.org` | Cloudflare Pages / Vercel endpoint | Proxied (Orange cloud) | Public Website |
| **CNAME** | `www` | `diversitycollective.org` | Proxied | Apex redirect |
| **CNAME** | `api` | `dcvc-api.[account].workers.dev` | Proxied | Worker Backend REST API |
| **CNAME** | `studio` | `dcvc.sanity.studio` | DNS Only (Grey cloud) | Isolated Sanity CMS Studio |
| **TXT** | `@` | Resend SPF / DKIM verification records | DNS Only | Transactional Email Deliverability |

---

## 7. Rollback & Verification Procedures

### Rollback Strategy
- **Frontend**: In Cloudflare Pages / Vercel dashboard, click **Rollback to Previous Deployment** to immediately revert to the prior production build within seconds.
- **Worker**: Run `wrangler rollback` to revert the edge worker to the prior deployment tag.
- **Database**: Restore point-in-time snapshot via `turso db restore dcvc-production-backup`.

### Smoke Testing Checklist
- [ ] Visit `https://diversitycollective.org/` — confirm page loads under 1 second.
- [ ] Verify accessibility skip link: press `Tab` key, ensure "Skip to main content" appears and focuses `#main-content`.
- [ ] Test Business Directory: navigate to `/directory`, search for "Beacon", verify instant filter.
- [ ] Test Contact Form: submit a test message with turnstile check, verify confirmation page `/submission-success?type=contact` displays.
- [ ] Verify 301 redirects: visit `/donate/` and ensure browser seamlessly redirects to `/donate`.

