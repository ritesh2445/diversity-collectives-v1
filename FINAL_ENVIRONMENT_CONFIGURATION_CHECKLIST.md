# Final Environment Configuration Checklist

This document is your complete step-by-step master reference for configuring all external accounts, environment variables, secrets, and DNS records during the **final production deployment stage**.

---

## 1. Cloudflare DNS & Domain Preparation (`diversitycollective.org`)

- [ ] **DNS Ownership**: Confirm domain `diversitycollective.org` is managed in your official Cloudflare organization account.
- [ ] **Cloudflare Turnstile Setup**:
  1. Navigate to **Cloudflare Dashboard > Turnstile**.
  2. Create a new Turnstile widget named `DCVC Production`.
  3. Domain: `diversitycollective.org`.
  4. Widget Mode: **Managed** (or **Invisible**).
  5. Record **Site Key** (`VITE_TURNSTILE_SITE_KEY`).
  6. Record **Secret Key** (`TURNSTILE_SECRET_KEY`).

---

## 2. Cloudflare Worker Backend Secrets (`worker/`)

Configure all backend secrets using the Wrangler CLI. **Never write production secrets to version-controlled files.**

```bash
cd worker

# 1. Turso Distributed Database Credentials
npx wrangler secret put TURSO_DATABASE_URL
# Value: libsql://dcvc-production-<account>.turso.io

npx wrangler secret put TURSO_AUTH_TOKEN
# Value: eyJhbGciOi... (JWT token from turso db tokens create)

# 2. Resend Transactional Email Secret
npx wrangler secret put RESEND_API_KEY
# Value: re_... (API key from resend.com)

# 3. Cloudflare Turnstile Server Verification Secret
npx wrangler secret put TURNSTILE_SECRET_KEY
# Value: 0x4AAAAAAA... (from Step 1)

# 4. Zeffy Webhook Signature Verification Secret
npx wrangler secret put ZEFFY_WEBHOOK_SECRET
# Value: (Signing secret from Zeffy Dashboard > Settings > Webhooks)

# 5. Admin Portal JWT Signing Secret
npx wrangler secret put JWT_SECRET
# Value: (A strong 64-character random string for admin session signing)

# 6. Cloudinary Upload Signing Secret
npx wrangler secret put CLOUDINARY_API_SECRET
# Value: (API secret from cloudinary.com dashboard)

# 7. Activate Ask DCVC Chatbot in Production
npx wrangler secret put CHATBOT_ENABLED
# Value: true
```

---

## 3. Cloudflare Pages / Frontend Environment Variables

Configure these in your **Cloudflare Pages (or Vercel) Project Settings > Environment Variables** for the main website repository:

| Variable Name | Environment | Value Description |
| :--- | :---: | :--- |
| `VITE_API_URL` | Production | `https://api.diversitycollective.org/api` (or Worker route `/api`) |
| `VITE_TURNSTILE_SITE_KEY` | Production | Your Turnstile public site key from Step 1 |
| `VITE_CLOUDINARY_CLOUD_NAME` | Production | `dcvc` (or your registered Cloudinary cloud name) |
| `VITE_SANITY_PROJECT_ID` | Production | `v7z28m5x` (or your Sanity project ID) |
| `VITE_SANITY_DATASET` | Production | `production` |
| `VITE_ZEFFY_DONATION_FORM_URL` | Production | `https://www.zeffy.com/donation-form/diversity-collective-general-fund` |
| `VITE_ENABLE_CHATBOT` | Production | `true` (activates floating Ask DCVC assistant) |

---

## 4. Turso Database Provisioning & Schema Shell Execution

```bash
# 1. Create production database in closest region (Los Angeles - lax)
turso db create dcvc-production --location lax

# 2. Get connection URL and authentication token
turso db show dcvc-production --url
turso db tokens create dcvc-production

# 3. Apply Master Schema DDL and Seed Verified Businesses
turso db shell dcvc-production < src/db/schema.sql
turso db shell dcvc-production < src/db/seed.sql
```

---

## 5. Resend Email Domain Verification (DNS)

1. Log into [resend.com](https://resend.com) and add domain `diversitycollective.org`.
2. Add the 3 provided DKIM / SPF TXT records into Cloudflare DNS:
   - `resend._domainkey.diversitycollective.org` (TXT)
   - `send.diversitycollective.org` (MX / TXT)
   - `_dmarc.diversitycollective.org` (TXT)
3. Wait until Resend dashboard indicates **Domain Verified**.

---

## 6. Zeffy Webhook Registration

1. Log into your verified DCVC account on [zeffy.com](https://zeffy.com) (EIN: `46-5312131`).
2. Go to **Settings > Integrations > Webhooks**.
3. Add Endpoint URL: `https://diversitycollective.org/api/webhooks/zeffy`.
4. Subscribe to event: `payment.completed`.
5. Copy the Webhook Signing Secret into `worker` via `npx wrangler secret put ZEFFY_WEBHOOK_SECRET`.

---

## 7. Sanity Studio & Custom Admin Portal Deployments

### Sanity Studio Deployment (`studio/`)
```bash
cd studio
npm install
npm run deploy
# Deploys desk to dcvc.sanity.studio or configure studio.diversitycollective.org
```

In Sanity Dashboard > API > CORS Origins:
- Add `https://diversitycollective.org` (Credentials: false)
- Add `https://admin.diversitycollective.org` (Credentials: false)

### Custom Admin Dashboard Deployment (`admin/`)
```bash
cd admin
# Deploy to Cloudflare Pages as project 'dcvc-admin'
# Custom domain: admin.diversitycollective.org
# Set Environment Variable: VITE_API_URL=https://diversitycollective.org/api
```

