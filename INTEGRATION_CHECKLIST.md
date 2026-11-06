# Phase 2 Third-Party Integrations & Accounts Checklist

This checklist itemizes every external account, credential, and DNS record required from Diversity Collective leadership before Phase 2 backend deployment can occur.

---

## 1. Domain & DNS Control (Cloudflare)

- [ ] **Account Ownership Verification**:
  - Confirm the Cloudflare account managing `diversitycollective.org` is owned and controlled by an official DCVC organization email (e.g. `it@diversitycollective.org` or `admin@diversitycollective.org`), not a third-party vendor's personal account.
- [ ] **Nameservers Active**:
  - Confirm registrar nameservers point to Cloudflare.
- [ ] **Cloudflare Turnstile Setup**:
  - Create Turnstile widget for `diversitycollective.org` (Managed or Invisible challenge mode).
  - Note **Site Key** (`VITE_TURNSTILE_SITE_KEY`).
  - Note **Secret Key** (`TURNSTILE_SECRET_KEY`).

---

## 2. Application Database (Turso libSQL)

- [ ] **Account Creation**:
  - Create organization account on [turso.tech](https://turso.tech).
- [ ] **Database Provisioning**:
  - Run `turso db create dcvc-production --location lax` (closest to Ventura County).
- [ ] **Credentials Recorded**:
  - Record `TURSO_DATABASE_URL` (`libsql://dcvc-production-...turso.io`).
  - Generate auth token: `turso db tokens create dcvc-production` -> Record `TURSO_AUTH_TOKEN`.
- [ ] **DDL Execution**:
  - Run `turso db shell dcvc-production < src/db/schema.sql`.
  - Run `turso db shell dcvc-production < src/db/seed.sql`.

---

## 3. Transactional Email (Resend)

- [ ] **Account Creation**:
  - Sign up at [resend.com](https://resend.com) using DCVC credentials.
- [ ] **Domain Verification**:
  - Add domain `diversitycollective.org`.
  - Add the 3 provided DKIM / SPF TXT records into Cloudflare DNS.
  - Wait for status to show **Verified**.
- [ ] **API Key Created**:
  - Generate full-access API key -> Record `RESEND_API_KEY`.
- [ ] **Recipient Mailboxes Verified**:
  - Ensure the following email addresses exist and route to staff:
    - `info@diversitycollective.org`
    - `volunteer@diversitycollective.org`
    - `training@diversitycollective.org`
    - `directory@diversitycollective.org`

---

## 4. Content Management System (Sanity CMS)

- [ ] **Project Created**:
  - Create Sanity project at [sanity.io](https://sanity.io) named `Diversity Collective Ventura County`.
  - Note `SANITY_PROJECT_ID` (`v7z28m5x` or newly generated).
  - Confirm dataset `production` is initialized.
- [ ] **CORS Origins Configured**:
  - In Sanity Dashboard > API > CORS Origins:
    - Add `https://diversitycollective.org` (Allow credentials: false).
    - Add `http://localhost:5173` (Local testing).
- [ ] **Studio Hosting Configured**:
  - Deploy studio workspace to `dcvc.sanity.studio` or configure `studio.diversitycollective.org`.
- [ ] **Staff Users Invited**:
  - Invite designated DCVC editors and administrators with appropriate roles (Admin, Editor).

---

## 5. Media Delivery CDN (Cloudinary)

- [ ] **Account Provisioned**:
  - Create free tier account at [cloudinary.com](https://cloudinary.com) with cloud name `dcvc` (or designated organization name).
  - Record `VITE_CLOUDINARY_CLOUD_NAME`.
- [ ] **Auto-Formatting Configured**:
  - Confirm default delivery optimization is set to automatic WebP/AVIF formatting and quality.

---

## 6. Non-Profit Donation Portal (Zeffy)

- [ ] **501(c)(3) Verification**:
  - Confirm DCVC profile is active on [zeffy.com](https://zeffy.com) using EIN `46-5312131`.
  - Confirm direct bank deposit (ACH) is linked for zero-fee disbursement.
- [ ] **Donation Campaign Form Created**:
  - Create "Diversity Collective General Fund" form.
  - Retrieve embed/share URL -> Set as `VITE_ZEFFY_DONATION_FORM_URL`.

---

## 7. Search Console & Analytics

- [ ] **Google Search Console**:
  - Add domain property `diversitycollective.org`.
  - Submit sitemap `https://diversitycollective.org/sitemap.xml`.
- [ ] **Google Analytics 4**:
  - Ensure GA4 property is owned by DCVC Google Workspace.
  - Note Measurement ID (`G-XXXXXXXXXX`).

---

## 8. Zeffy Webhooks & Appreciation Cards Integration

- [ ] **Webhook Endpoint Registration**:
  - In Zeffy Dashboard > Settings > Developer / Integrations > Webhooks:
    - Add endpoint URL: `https://diversitycollective.org/api/webhooks/zeffy` (or worker custom domain).
    - Subscribe to event: `payment.completed`.
- [ ] **Webhook Signing Secret**:
  - Copy Zeffy Webhook Signing Secret -> Record `ZEFFY_WEBHOOK_SECRET`.
  - Ensure secret is kept secure and will be added during Cloudflare environment configuration.
- [ ] **Appreciation Card Email Delivery (Resend)**:
  - Verify transactional template or HTML dispatch is enabled to deliver digital thank-you cards from `giving@diversitycollective.org`.
- [ ] **Card Tiers Verified**:
  - Confirm donation tier thresholds:
    - **Community Ally**: \$1 – \$49
    - **Pride Advocate**: \$50 – \$149
    - **Rainbow Champion**: \$150 – \$499
    - **Visionary Benefactor**: \$500+

---

## 9. Ask DCVC: Free AI Chatbot (Workers AI)

- [ ] **Workers AI Binding in Cloudflare**:
  - Confirm Cloudflare Workers project has the AI binding configured (`[ai] binding = "AI"` in `wrangler.toml`).
  - Model configured: `@cf/meta/llama-3.1-8b-instruct-fp8`.
- [ ] **Free Tier Quota Check**:
  - Confirm Cloudflare account has the 10,000 neurons/day Workers AI free tier active ($0 cost).
- [ ] **Knowledge Base & Fallback Grounding Verified**:
  - Confirm 14 DCVC knowledge domains in `worker/src/knowledgeBase.js` match current organizational programs, hours, locations, and services.
  - Verify emergency intercept (988, Trevor Project) and negative fallback string are active.

---

## 10. FINAL STEP: Cloudflare Environment Variables & Production Activation

> **CRITICAL DEPLOYMENT NOTE:**
> As specified, setting environment variables in Cloudflare and activating features is the **very last task** performed immediately prior to go-live. Keep features disabled in preview environments until this step is reached.

When authorized to conduct final production deployment:

- [ ] **Cloudflare Workers Secrets & Variables Configuration**:
  ```bash
  # 1. Set Turso database secrets
  npx wrangler secret put TURSO_DATABASE_URL
  npx wrangler secret put TURSO_AUTH_TOKEN

  # 2. Set Turnstile secret
  npx wrangler secret put TURNSTILE_SECRET_KEY

  # 3. Set Resend email secret
  npx wrangler secret put RESEND_API_KEY

  # 4. Set Zeffy webhook secret
  npx wrangler secret put ZEFFY_WEBHOOK_SECRET

  # 5. Enable and configure Ask DCVC Chatbot
  npx wrangler secret put CHATBOT_ENABLED
  # Value: true
  ```
- [ ] **Cloudflare Pages / Frontend Environment Variables**:
  In Cloudflare Pages Project Settings > Environment variables:
  - `VITE_API_URL` = `https://diversitycollective.org/api` (or worker URL)
  - `VITE_TURNSTILE_SITE_KEY` = `<Turnstile Site Key>`
  - `VITE_SANITY_PROJECT_ID` = `v7z28m5x`
  - `VITE_SANITY_DATASET` = `production`
  - `VITE_CLOUDINARY_CLOUD_NAME` = `dcvc`
  - `VITE_ZEFFY_DONATION_FORM_URL` = `https://www.zeffy.com/donation-form/...`
  - `VITE_ENABLE_CHATBOT` = `true` (activate frontend floating widget)
- [ ] **Final Deployment Smoke Test**:
  - Verify form submissions: Contact, Volunteer, Affirming Business Directory.
  - Test Zeffy donation webhook end-to-end with test transaction.
  - Test Ask DCVC Chatbot floating button, suggested questions, and response generation.


