# DCVC PLATFORM: FINAL ENVIRONMENT DEPENDENCIES & CREDENTIALS CATALOG
**Exhaustive Pre-Deployment Setup Guide for Final Stage Handoff**
**Date:** November 6, 2026
**Target Release:** Production Launch (Phase 3 Cutover)
**Author:** Senior Full-Stack Architect & Cloud Infrastructure Engineer

---

## EXECUTIVE SUMMARY

In strict adherence to project constraints, **no real credentials, production API keys, database connection strings, or DNS cutover operations have been performed or committed to git**.

All integrations are currently operating via verified offline simulation adapters and test fixtures, passing all 106 automated tests. When you are ready to execute the final deployment stage, the following concrete accounts, credentials, and settings must be provisioned.

---

## 1. INTEGRATION CREDENTIALS MATRIX

| Integration Service | Required Secret / Variable Name | Environment Scope | How to Obtain from Provider | Operational Impact if Missing |
| :--- | :--- | :--- | :--- | :--- |
| **Cloudflare Workers** | `CLOUDFLARE_API_TOKEN`<br>`CLOUDFLARE_ACCOUNT_ID` | CI/CD / CLI | Cloudflare Dashboard -> My Profile -> API Tokens -> Create Custom Token (Workers + DNS edit). | Cannot deploy edge Worker (`worker/src/index.js`) to production. |
| **Cloudflare Turnstile** | `VITE_TURNSTILE_SITE_KEY`<br>`TURNSTILE_SECRET_KEY` | Public Frontend (`.env`)<br>Worker (`wrangler secret`) | Cloudflare Dashboard -> Turnstile -> Add Widget -> Domain: `diversitycollective.org`. Mode: Managed. | Form submissions fall back to dev bypass mode (bot defense disabled). |
| **Cloudflare Workers AI** | `[ai] binding = "AI"`<br>`CHATBOT_ENABLED="true"` | Worker (`wrangler.toml`)<br>Worker (`wrangler secret`) | Enabled natively on Cloudflare account under Workers -> AI. | Chatbot falls back to client-side zero-quota deterministic engine. |
| **Turso (libSQL)** | `TURSO_DATABASE_URL`<br>`TURSO_AUTH_TOKEN` | Worker (`wrangler secret`) | Run `turso db create dcvc-prod --location lax`<br>Run `turso db tokens create dcvc-prod`. | Directory submissions and inquiries fall back to dev mock storage. |
| **Resend Email System** | `RESEND_API_KEY`<br>`RESEND_FROM_EMAIL` | Worker (`wrangler secret`) | Resend.com -> API Keys -> Create API Key.<br>Add domain `diversitycollective.org` and configure DNS TXT/MX records. | Automated email notifications fall back to local console simulation. |
| **Zeffy 0% Fee Giving** | `VITE_ZEFFY_DONATION_FORM_URL`<br>`ZEFFY_WEBHOOK_SECRET` | Public Frontend (`.env`)<br>Worker (`wrangler secret`) | Zeffy Dashboard -> Campaigns -> Embed Link.<br>Zeffy Dashboard -> Settings -> Webhooks -> Add endpoint `/api/webhooks/zeffy`. | Donation page redirects to hosted fallback; webhooks fall back to mock. |
| **Sanity CMS** | `VITE_SANITY_PROJECT_ID`<br>`VITE_SANITY_DATASET` | Public Frontend (`.env`)<br>Studio (`studio/.env`) | Sanity.io -> Manage -> Create Project "DCVC Website" -> Dataset: `production`. | Frontend renders local fallback seed data (`src/data/dcvcData.js`). |
| **Cloudinary Media** | `VITE_CLOUDINARY_CLOUD_NAME`<br>`CLOUDINARY_API_KEY`<br>`CLOUDINARY_API_SECRET` | Public Frontend (`.env`)<br>Worker (`wrangler secret`) | Cloudinary Console -> Dashboard -> Copy Cloud Name, API Key, and Secret. | Media uploads fall back to local static paths (`/images/*`). |
| **Google Cloud (Sheets)** | `GOOGLE_SERVICE_ACCOUNT_EMAIL`<br>`GOOGLE_PRIVATE_KEY`<br>`GOOGLE_SHEET_ID` | Worker (`wrangler secret`) | Google Cloud Console -> IAM -> Service Accounts -> Create Key (JSON). Share target Google Sheet with service account. | Operational contact tracking falls back to on-demand CSV exports. |
| **Admin Authentication** | `JWT_SECRET` | Worker (`wrangler secret`) | Generate 256-bit secure secret via `openssl rand -hex 32`. | Falls back to internal dev secret; tokens insecure across redeploys. |

---

## 2. STEP-BY-STEP PROVISIONING RUNBOOK

### Step 2.1: Turso Edge Database Setup
1. Install Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
2. Authenticate and create production database in US-West (Los Angeles):
   ```bash
   turso auth login
   turso db create dcvc-prod --location lax
   ```
3. Execute master SQL DDL schema:
   ```bash
   turso db shell dcvc-prod < src/db/schema.sql
   ```
4. Seed verified directory listings:
   ```bash
   turso db shell dcvc-prod < src/db/seed.sql
   ```
5. Obtain connection credentials:
   ```bash
   turso db show dcvc-prod --url
   turso db tokens create dcvc-prod
   ```

---

### Step 2.2: Cloudflare Worker Secrets Injection
Execute from the `worker/` directory:
```bash
cd worker
npx wrangler secret put TURSO_DATABASE_URL
npx wrangler secret put TURSO_AUTH_TOKEN
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ZEFFY_WEBHOOK_SECRET
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
npx wrangler secret put GOOGLE_PRIVATE_KEY
npx wrangler secret put GOOGLE_SHEET_ID
npx wrangler deploy
```

---

### Step 2.3: Resend Domain Authentication (DNS)
To ensure 100% email deliverability and avoid spam filters, add the following DNS records to `diversitycollective.org` in Cloudflare DNS:

| Type | Name | Content / Target | Purpose |
| :--- | :--- | :--- | :--- |
| **TXT** | `resend._domainkey` | `k=rsa; p=[RESEND_PUBLIC_KEY]` | DKIM Email Signature Verification |
| **TXT** | `@` | `v=spf1 include:amazonses.com ~all` | SPF Authorized Mail Delivery |
| **MX** | `feedback` | `feedback-smtp.us-east-1.amazonses.com` (Priority 10) | Delivery Bounce & Feedback Loop |

---

### Step 2.4: Zeffy Webhook Registration
1. Log into DCVC Zeffy non-profit administrative dashboard.
2. Navigate to **Settings** -> **Webhooks** -> **Add New Webhook**.
3. Set **Target URL**:
   ```
   https://diversitycollective.org/api/webhooks/zeffy
   ```
4. Select Events:
   - `payment.completed`
   - `donation.created`
5. Copy the generated **Webhook Secret** and inject it into Cloudflare:
   ```bash
   npx wrangler secret put ZEFFY_WEBHOOK_SECRET
   ```

---

### Step 2.5: Sanity CMS Studio Deployment
1. Navigate to the `studio/` directory:
   ```bash
   cd studio
   npm install
   ```
2. Authenticate Sanity CLI:
   ```bash
   npx sanity login
   ```
3. Initialize `.env`:
   ```bash
   cp .env.example .env
   # Enter SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET="production"
   ```
4. Deploy the Studio desk:
   ```bash
   npx sanity deploy
   # Target subdomain: studio.diversitycollective.org or dcvc.sanity.studio
   ```
5. In Sanity Management Dashboard -> **API** -> **CORS Origins**, add:
   - `https://diversitycollective.org` (Credentials: Enabled)
   - `https://admin.diversitycollective.org` (Credentials: Enabled)
   - `http://localhost:5173` (For local testing)

---

### Step 2.6: Production Domain Cutover (DNS)
When DCVC Executive Leadership approves the public launch:

1. Log into Cloudflare Dashboard -> **DNS Records**.
2. Add the following records for `diversitycollective.org`:

| Record Type | Name | Content | Proxy Status | Note |
| :--- | :--- | :--- | :---: | :--- |
| **A** | `@` | `76.76.21.21` (or Cloudflare Pages IP) | Proxied (Orange Cloud) | Apex Domain |
| **CNAME** | `www` | `diversitycollective.org` | Proxied (Orange Cloud) | WWW Subdomain |
| **CNAME** | `admin` | `[admin-deployment-target]` | Proxied (Orange Cloud) | Admin Portal |
| **CNAME** | `studio` | `[sanity-studio-target]` | Proxied (Orange Cloud) | CMS Studio |

3. Confirm SSL/TLS Mode is set to **Full (Strict)**.
4. Verify HTTP -> HTTPS automatic redirection is **Enabled**.

---

## 3. CLIENT INPUT & OPERATIONAL APPROVALS REQUIRED

Before launch, obtain confirmation from DCVC Executive Director Tess Allen and Board President Roland Catabona on:

1. **Donation Appreciation Tier Thresholds**: Confirm approval of $1 (Ally), $50 (Advocate), $150 (Champion), and $500 (Benefactor).
2. **Staff Inbox Routing**:
   - General Inquiries: `info@diversitycollective.org`
   - Volunteer Applications: `volunteer@diversitycollective.org`
   - P.R.I.D.E. Training Requests: `training@diversitycollective.org`
   - Accessibility Barrier Reports: `accessibility@diversitycollective.org`
3. **High-Resolution Photography**: Final high-res portrait headshots for the 8 Board and Staff members.
4. **Staff & Board Training Session**: Confirm date for the 60-minute recorded virtual walkthrough of Sanity Studio and the Admin Management Portal.

