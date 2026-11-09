# DCVC: ZEFFY PAYMENT & WEBHOOK HANDOVER GUIDE
## Authoritative Integration, Reconciliation, and Keepsake Issuance Architecture

**Organization:** Diversity Collective Ventura County (DCVC)  
**Primary Non-Profit Domain:** `diversitycollective.org` / `diversitycollectivevc.org`  
**API Engine:** Cloudflare Edge Worker (`dcvc-api`)  
**Staging Worker URL:** `https://dcvc-api.diversity-collective-vc.workers.dev`  
**Prepared For:** Celia Rivera (Development Lead) & DCVC Administrative Leadership  
**Author:** NXC Badge Studios India / Antigravity Engineering  
**Date:** November 9, 2026  

---

## 1. EXECUTIVE SUMMARY

The DCVC platform connects donor generosity directly to community recognition through **Personalized Digital Appreciation Cards** (keepsakes). When a community member donates through Zeffy, DCVC's backend verifies the payment server-side, deterministically matches the gift against the donor's intent, mints an immutable cryptographic token, and unlocks an official keepsake with full export capabilities (PNG, single-page A4 landscape PDF, and mobile share sheet).

To ensure zero lost gifts and zero fraudulent keepsake issuance, DCVC implements a **Dual-Channel Reconciliation Pipeline**:
1. **Real-Time Push Webhook Receiver:** (`POST /api/webhooks/zeffy`) captures instantaneous donation events.
2. **Scheduled 5-Minute Poller Engine:** (`executeZeffySync` via Cloudflare Cron Triggers) acts as a self-healing fallback that queries the official Zeffy API (`https://api.zeffy.com/api/v1/payments`) with cursor pagination (`starting_after`), detects refunds/disputes, and reconciles unmatched gifts.

---

## 2. WEBHOOK CONFIGURATION IN ZEFFY

When configuring DCVC's organization in the Zeffy Dashboard, input the following settings:

### 2.1 Webhook URL
```text
https://dcvc-api.diversity-collective-vc.workers.dev/api/webhooks/zeffy
```
*(Once production custom DNS is routed to Cloudflare, this will transition to `https://api.diversitycollectivevc.org/api/webhooks/zeffy` or `https://diversitycollective.org/api/webhooks/zeffy` without any code changes).*

### 2.2 Event Subscriptions
Enable notifications for the following payment lifecycle events:
- `payment.succeeded` (or `payment.created` with `status: "succeeded"`)
- `payment.refunded`
- `dispute.created` / `dispute.updated`

### 2.3 Webhook Authentication & Security
DCVC's webhook receiver strictly verifies incoming payloads using a multi-tier authentication engine:
- **Primary Method:** HMAC-SHA256 signature in the `X-Zeffy-Signature` header computed over the raw request body using your configured `ZEFFY_WEBHOOK_SECRET`.
- **Alternative Method:** Shared secret delivered in `X-Zeffy-Secret` header or `?secret=<token>` query parameter.
- **Timing Safe Comparison:** Cryptographic subtle timing-safe checks prevent side-channel timing analysis attacks.

---

## 3. DONATION MATCHING & SECURITY RULES

To prevent unauthorized generation of high-tier benefactor cards or cross-donor pollution, DCVC enforces strict server-side rules:

| Rule | Enforcement Mechanism |
|---|---|
| **Pre-Checkout Intent Registration** | When a donor begins a gift on `/donate`, the frontend calls `POST /api/donations/intent` with `donorName`, `donorEmail`, and `amount`. The server records an unverified intent in the `donation_intents` table with a 2-hour expiration window. |
| **Deterministic Association** | When a Zeffy payment arrives (via webhook or cron poller), the engine matches `donor_email` (normalized lowercase) AND expected amount. |
| **Idempotency Guarantee** | Each Zeffy `payment_reference` (e.g., `ord_xxx` or `pay_xxx`) is uniquely indexed. If Zeffy retries a webhook delivery, DCVC detects the existing payment reference and returns `HTTP 200 { success: true, duplicate: true }` without double-minting cards. |
| **Ambiguity Safety Queue** | If a payment arrives directly through an external Zeffy link without a pre-registered intent, or if multiple pending intents share identical attributes, the payment is **never auto-issued**. It is securely routed to the `donation_reconciliations` queue with type `unmatched_direct_donor` or `ambiguous_match` for staff review. |
| **Refund & Dispute Revocation** | When a refund or dispute is detected, the associated card status is transitioned to `revoked_refunded` or `revoked_disputed`, immediately blocking public keepsake rendering (`HTTP 410 Gone`). |

---

## 4. APPRECIATION TIERS & THRESHOLDS

Appreciation keepsakes are automatically awarded according to verified net donation amounts:

| Tier Identifier | Public Title | Minimum Amount | Visual Theme Token |
|---|---|---|---|
| `community_ally` | **Community Ally** | $1 – $49 | Warm Gold & Amber |
| `pride_advocate` | **Pride Advocate** | $50 – $149 | Vibrant Pride Rainbow Accent |
| `rainbow_champion` | **Rainbow Champion** | $150 – $499 | Royal Purple & Violet Gradient |
| `visionary_benefactor` | **Visionary Benefactor** | $500+ | Platinum & Brilliant Blue |

*Note: Thresholds are dynamically configurable via Cloudflare Worker environment variables (`APPRECIATION_TIER_1_MIN` through `APPRECIATION_TIER_4_MIN`) without requiring code recompilation.*

---

## 5. RECONCILIATION & ADMINISTRATIVE OVERRIDE

Authorized DCVC administrators (Tess Allen, Celia Rivera, and executive staff) can manage reconciliations and audit transactions via the Administrative API:

### 5.1 Endpoints
- `GET /api/admin/reconciliations`: View pending ambiguous, unmatched, or disputed transactions.
- `POST /api/admin/reconciliations/:id/resolve`: Approve, assign to an intent, or dismiss an ambiguous transaction.
- `POST /api/admin/appreciation-cards/:id/revoke`: Manually revoke a compromised or mistakenly issued keepsake.
- `POST /api/admin/audit-logs`: Review immutable administrative audit trails.

---

## 6. CREDENTIAL INJECTION INSTRUCTIONS (FOR CELIA / PROJECT OWNER)

Run the following commands using the Cloudflare Wrangler CLI:

```bash
# 1. Zeffy Organization API Key (for 5-minute poller & refund verification)
npx wrangler secret put ZEFFY_API_KEY --config worker/wrangler.toml

# 2. Zeffy Webhook Secret (for HMAC-SHA256 signature verification)
npx wrangler secret put ZEFFY_WEBHOOK_SECRET --config worker/wrangler.toml
```

Once injected, test the health check endpoint:
```bash
curl -s https://dcvc-api.diversity-collective-vc.workers.dev/api/health
```
When `zeffyWebhookConfigured: true` appears in the response, the Zeffy integration is 100% active and running on Cloudflare edge.

