# Environment Variables & Configuration Directory

This document details all configuration keys and credentials across the Diversity Collective platform.

---

## 1. Summary Catalog

| Variable Name | Component | Scope | Required (Dev) | Required (Prod) | Description |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `VITE_API_URL` | Frontend | Public (Client) | No (defaults `/api`) | Yes | Full URL to Cloudflare Worker backend |
| `VITE_TURNSTILE_SITE_KEY` | Frontend | Public (Client) | No (bypassed) | Yes | Cloudflare Turnstile public site key |
| `VITE_CLOUDINARY_CLOUD_NAME` | Frontend | Public (Client) | No (local fallback) | Yes | Cloudinary account name for media transforms |
| `VITE_SANITY_PROJECT_ID` | Frontend | Public (Client) | Yes | Yes | Sanity project identifier |
| `VITE_SANITY_DATASET` | Frontend | Public (Client) | Yes | Yes | Target dataset (`production`) |
| `VITE_ZEFFY_DONATION_FORM_URL`| Frontend | Public (Client) | No | Yes | Zeffy non-profit donation form URL |
| `VITE_ENABLE_CHATBOT` | Frontend | Public (Client) | No (defaults `false`) | Yes | Feature flag to show floating Ask DCVC widget |
| `TURSO_DATABASE_URL` | Worker | Secret (Server) | No (offline mode) | Yes | libSQL connection URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Worker | Secret (Server) | No | Yes | Turso database JWT authentication token |
| `RESEND_API_KEY` | Worker | Secret (Server) | No (logs to console)| Yes | Resend API key (`re_...`) |
| `TURNSTILE_SECRET_KEY` | Worker | Secret (Server) | No (bypassed) | Yes | Cloudflare Turnstile server verification secret |
| `ALLOWED_ORIGIN` | Worker | Plain (Worker) | No (`*`) | Yes | Strict CORS origin (`https://diversitycollective.org`)|
| `DCVC_STAFF_EMAIL` | Worker | Plain (Worker) | No | Yes | Destination address for general inquiries |
| `RESEND_FROM_EMAIL` | Worker | Plain (Worker) | No | Yes | Verified sending identity |
| `ZEFFY_WEBHOOK_SECRET` | Worker | Secret (Server) | No (bypassed in dev) | Yes | Zeffy HMAC-SHA256 signature verification secret |
| `APPRECIATION_TIER_1_MIN` | Worker | Plain (Worker) | No (defaults 1) | Yes | Community Ally threshold ($1 - $49) |
| `APPRECIATION_TIER_2_MIN` | Worker | Plain (Worker) | No (defaults 50) | Yes | Pride Advocate threshold ($50 - $149) |
| `APPRECIATION_TIER_3_MIN` | Worker | Plain (Worker) | No (defaults 150) | Yes | Rainbow Champion threshold ($150 - $499) |
| `APPRECIATION_TIER_4_MIN` | Worker | Plain (Worker) | No (defaults 500) | Yes | Visionary Benefactor threshold ($500+) |
| `FRONTEND_BASE_URL` | Worker | Plain (Worker) | No | Yes | Base URL for card links (`https://diversitycollective.org`) |
| `CHATBOT_ENABLED` | Worker | Plain/Secret | No (defaults `false`) | Yes | Controls Worker AI endpoint availability |
| `AI_MODEL` | Worker | Plain (Worker) | No (`@cf/meta/llama-3.1-8b-instruct-fp8`) | Yes | Cloudflare Workers AI model identifier |
| `SANITY_STUDIO_PROJECT_ID` | Studio | Public (Admin) | Yes | Yes | Sanity project identifier for Studio desk |
| `SANITY_STUDIO_DATASET` | Studio | Public (Admin) | Yes | Yes | Sanity dataset for Studio desk |

---

## 2. Configuration by Subsystem

### 2.1 Public Frontend (`.env`)
Create `.env` at the root of `diversity-collectives-v1/`:
```bash
VITE_API_URL=https://api.diversitycollective.org/api
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAAXXXXXXXXXXXXXX
VITE_CLOUDINARY_CLOUD_NAME=dcvc
VITE_SANITY_PROJECT_ID=v7z28m5x
VITE_SANITY_DATASET=production
VITE_ZEFFY_DONATION_FORM_URL=https://www.zeffy.com/donation-form/diversity-collective-general-fund
VITE_ENABLE_CHATBOT=false
```

### 2.2 Cloudflare Worker Backend (`worker/wrangler.toml` & Secrets)
Non-sensitive variables are configured in `worker/wrangler.toml`:
```toml
[vars]
ALLOWED_ORIGIN = "https://diversitycollective.org"
FRONTEND_BASE_URL = "https://diversitycollective.org"
DCVC_STAFF_EMAIL = "info@diversitycollective.org"
RESEND_FROM_EMAIL = "Diversity Collective <noreply@diversitycollective.org>"
APPRECIATION_TIER_1_MIN = "1"
APPRECIATION_TIER_2_MIN = "50"
APPRECIATION_TIER_3_MIN = "150"
APPRECIATION_TIER_4_MIN = "500"
CHATBOT_ENABLED = "false"
AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8"
```

Sensitive credentials **must never** be written to plain text files. In production, configure them via Wrangler CLI:
```bash
cd worker
wrangler secret put TURSO_DATABASE_URL
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put RESEND_API_KEY
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put ZEFFY_WEBHOOK_SECRET
```

For local testing with Wrangler, store local test values in `worker/.dev.vars` (which is excluded from Git):
```ini
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
RESEND_API_KEY=re_...
TURNSTILE_SECRET_KEY=...
ZEFFY_WEBHOOK_SECRET=...
```

### 2.3 Sanity Studio (`studio/.env`)
Create `studio/.env`:
```bash
SANITY_STUDIO_PROJECT_ID=v7z28m5x
SANITY_STUDIO_DATASET=production
```

---

## 3. Features Requiring Live Credentials for Final Verification

The following features operate in offline mock/fixture validation during Phase 2 and require live credentials for final end-to-end verification during the final deployment stage:

1. **Cloudflare Turnstile Bot Defense (`VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`)**:
   - *Phase 2 Behavior*: Bypassed in dev / simulated tokens accepted in tests.
   - *Requires Live Verification*: Live interactive challenge verification on production domain (`diversitycollective.org`).
2. **Turso libSQL Database (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)**:
   - *Phase 2 Behavior*: Offline in-memory / fixture persistence.
   - *Requires Live Verification*: Remote table provisioning (`schema.sql`), seeding (`seed.sql`), and live persistence of directory submissions and donations.
3. **Resend Email Notifications (`RESEND_API_KEY`)**:
   - *Phase 2 Behavior*: Simulated dispatch logged to console.
   - *Requires Live Verification*: Real email delivery to staff inboxes (`info@`, `volunteer@`, `giving@`) from verified domain `diversitycollective.org`.
4. **Zeffy Webhook & Appreciation Cards (`ZEFFY_WEBHOOK_SECRET`, `VITE_ZEFFY_DONATION_FORM_URL`)**:
   - *Phase 2 Behavior*: HMAC signature verification fully unit tested with mock secret; card rendering verified with local tiers.
   - *Requires Live Verification*: Receiving actual `payment.completed` webhooks from Zeffy's production server and generating live donor appreciation links.
5. **Sanity CMS Live Editorial Sync (`VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET`)**:
   - *Phase 2 Behavior*: Public dataset read-only / local fallback data.
   - *Requires Live Verification*: Studio deployment (`dcvc.sanity.studio` or `studio.diversitycollective.org`) and CORS origin approval.
6. **Cloudflare Workers AI Chatbot Binding (`CHATBOT_ENABLED="true"`, `env.AI`)**:
   - *Phase 2 Behavior*: Local zero-quota client knowledge engine active; Worker endpoint testable via `x-dcvc-simulation` header.
   - *Requires Live Verification*: Cloudflare dashboard Workers AI binding activation and setting `CHATBOT_ENABLED="true"`.


