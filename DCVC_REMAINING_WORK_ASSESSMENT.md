# DCVC: Comprehensive Remaining Work Assessment & Master Implementation Plan
## Appreciation Cards, Backend Connectivity, Donation Integrity, and Cross-Device Architecture

**Document Version:** 2.0.0 (Revised Master Plan)  
**Audit Date:** November 9, 2026  
**Auditor Roles:** Principal Software Architect, Senior Full-Stack Engineer, Payment Integration Specialist, Frontend Rendering Engineer  
**Target Canonical Domain:** `https://diversitycollectivevc.org`  
**Legacy Domain:** `https://diversitycollective.org`  
**Target Repository:** Diversity Collective Ventura County v1 (`c:\DCVC-1\diversity-collectives-v1`)

---

## 1. Executive Summary

Diversity Collective Ventura County (DCVC) is preparing to launch a production web application built on **Next.js/React 19**, **Vite**, **Tailwind CSS v4**, **Cloudflare Workers**, **Turso (libSQL)**, **Sanity CMS**, **Cloudinary**, **Resend**, and **Zeffy**.

Following architectural review, this revised document defines the exact verified API contracts, deterministic donation-matching pipelines, refund/dispute lifecycles, and proportional print/export geometry required before any implementation begins.

### Key Architectural Resolutions:
1. **Zeffy API Verification:** Verified against official Zeffy OpenAPI documentation (`https://api.zeffy.com/api/docs`). Corrected parameters to use `campaign`, `contact`, lowercase currency `usd`, and cursor pagination via `starting_after`.
2. **Deterministic Donation Matching:** Prevented amount-only guessing. A multi-factor verification engine pairs pending donation intents (email + time window + campaign) against authoritative Zeffy transactions.
3. **Refund & Dispute Lifecycle:** Fail-closed certificate access. Any transaction marked with `refund`, `refund_status`, or `dispute` automatically revokes certificate validity (HTTP 410/403).
4. **Proportional Print & Export Scaling:** Replaced naive CSS clipping with a flexbox proportional print layout (`297mm × 210mm`) guaranteeing zero clipped elements and exactly 1 page.
5. **Exact 300 DPI Export:** Calibrated `html-to-image` and `jspdf` to generate `3508 × 2480` on desktop and memory-safe `2338 × 1654` on iOS Safari, paired with native Web Share API saving.

---

## 2. Corrected Zeffy API Specification & Official Contracts

All integration code must conform to the verified public API specification (`https://api.zeffy.com/api/docs`):

### A. Base Configuration & Authentication
* **Base URL:** `https://api.zeffy.com/api/v1`
* **Authentication Header:**
  ```http
  Authorization: Bearer <ZEFFY_API_KEY>
  ```
* **Rate Limits:** 100 requests per minute per API key.
* **Format:** JSON (`Content-Type: application/json; charset=utf-8`).

### B. Verified Query Endpoints & Parameters

#### 1. List Payments (`GET /api/v1/payments`)
* **Verified Query Parameters:**
  * `limit` *(integer, optional)*: Number of items per page (default `10`, maximum `100`).
  * `starting_after` *(string, optional)*: Cursor pagination ID. Set to the `id` of the last item from the previous page.
  * `currency` *(string, optional)*: Must be lowercase ISO code: **`usd`** (or `cad`). Uppercase is rejected.
  * `status` *(string, optional)*: Filter by transaction state (`succeeded`, `failed`, `pending`, `refunded`, `disputed`).
  * `campaign` *(string, optional)*: Filter by Zeffy campaign ID (e.g. general fund form). **Parameter name is `campaign`, NOT `campaignId`.**
  * `contact` *(string, optional)*: Filter by Zeffy contact identifier. **Parameter name is `contact`, NOT `contactId`.**
  * `type` *(string, optional)*: `online`, `manual`, `imported`.

#### 2. Retrieve Single Payment (`GET /api/v1/payments/{id}`)
* **Path Parameter:** `id` *(string, required)*: The Zeffy payment ID.
* **Returns:** Authoritative payment object with full line items, donor details, refund records, and tax receipts.

### C. Verified Payment Response Schema
```json
{
  "id": "pay_01HX98...",
  "amount": 5000,
  "currency": "usd",
  "status": "succeeded",
  "type": "online",
  "contact": "ct_01HX...",
  "campaign": "camp_01HX...",
  "createdAt": "2026-11-09T01:30:00.000Z",
  "donor": {
    "firstName": "Jordan",
    "lastName": "Rivers",
    "email": "jordan.rivers@example.org"
  },
  "lineItems": [
    {
      "id": "li_01HX...",
      "amount": 5000,
      "description": "DCVC General Sanctuary Fund"
    }
  ],
  "refund": null,
  "refund_status": null,
  "dispute": null,
  "taxReceiptUrl": "https://receipts.zeffy.com/..."
}
```

### D. Cursor Pagination Algorithm
```javascript
async function fetchAllRecentSucceededPayments(apiKey, campaignId, sinceIsoString) {
  let hasMore = true;
  let startingAfter = null;
  const payments = [];

  while (hasMore) {
    const url = new URL('https://api.zeffy.com/api/v1/payments');
    url.searchParams.set('currency', 'usd');
    url.searchParams.set('status', 'succeeded');
    url.searchParams.set('limit', '50');
    if (campaignId) url.searchParams.set('campaign', campaignId);
    if (startingAfter) url.searchParams.set('starting_after', startingAfter);

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error(`Zeffy API error HTTP ${res.status}`);

    const body = await res.json();
    const batch = body.data || [];
    for (const payment of batch) {
      if (new Date(payment.createdAt) < new Date(sinceIsoString)) {
        hasMore = false;
        break;
      }
      payments.push(payment);
    }

    if (body.has_more && batch.length > 0) {
      startingAfter = batch[batch.length - 1].id;
    } else {
      hasMore = false;
    }
  }
  return payments;
}
```

---

## 3. Reliable Donation-to-Transaction Matching Architecture

Under no circumstances will transactions be matched using donation amount alone.

### A. Intent Creation Pipeline
When a donor initiates giving on the DCVC website (`/donate`):
1. **Client Submission:** The donor specifies amount, frequency, and optional donor name/email before redirecting to Zeffy.
2. **Intent Stored in Turso:**
   ```sql
   CREATE TABLE IF NOT EXISTS donation_intents (
       id TEXT PRIMARY KEY,                       -- UUID v4 (intent_...)
       intent_token TEXT NOT NULL UNIQUE,         -- Cryptographic secret
       donor_name TEXT,                           -- Pre-entered name
       donor_email TEXT NOT NULL,                 -- Normalized lowercase email
       donor_email_hash TEXT NOT NULL,            -- SHA-256 for privacy
       expected_amount_cents INTEGER NOT NULL,    -- Amount in cents
       tier TEXT NOT NULL,                        -- Expected tier
       frequency TEXT DEFAULT 'one-time',
       status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'expired', 'manual_review')),
       matched_payment_id TEXT UNIQUE,
       created_at TEXT DEFAULT (datetime('now')),
       expires_at TEXT NOT NULL                   -- created_at + 2 hours
   );
   ```

### B. Deterministic Matching Engine
When the 5-minute poller or reconciliation worker processes a Zeffy payment:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DETERMINISTIC MATCHING STAGES                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Idempotency Check:                                                       │
│    SELECT id FROM donation_appreciation_cards WHERE payment_reference = ?   │
│    If exists -> Skip processing (already minted).                           │
│                                                                             │
│ 2. Email Matching (Authoritative Donor Identity):                           │
│    Extract payment.donor.email (normalized lowercase).                      │
│    SELECT * FROM donation_intents                                           │
│    WHERE donor_email = ?                                                    │
│      AND status = 'pending'                                                 │
│      AND created_at <= payment.createdAt                                    │
│      AND expires_at >= payment.createdAt                                    │
│                                                                             │
│ 3. Match Evaluation:                                                        │
│    - CASE A: Exactly 1 intent matches email within time window:             │
│      -> Intent matched. Link intent.matched_payment_id = payment.id.        │
│      -> Mint appreciation card using verified Zeffy amount & donor details. │
│                                                                             │
│    - CASE B: Zero intents match (Donor gave directly on Zeffy):             │
│      -> Fallback to Zeffy Authoritative Contact details.                     │
│      -> Mint appreciation card using payment.donor.firstName & lastName.    │
│                                                                             │
│    - CASE C: Ambiguous matches (Multiple intents for same email in window): │
│      -> DO NOT GUESS.                                                       │
│      -> Flag payment in `pending_reconciliations` with status='ambiguous'.  │
│      -> Queue for administrator review in `/admin`.                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### C. Self-Service Donor Verification (No Direct Frontend Trust)
If a donor returns to `/donate/verify` after checkout:
1. Donor inputs their **Zeffy Transaction ID** (from email receipt) and **Donor Email**.
2. Frontend sends `POST /api/donations/verify` to Cloudflare Worker.
3. Backend Worker executes authoritative call: `GET /api/v1/payments/{id}` using secret `ZEFFY_API_KEY`.
4. Verification assertions:
   * Payment `status === "succeeded"`
   * Payment `currency === "usd"`
   * Normalized email on Zeffy payment matches the submitted email.
   * `refund === null` and `dispute === null`.
5. Only upon 100% backend verification is the card token minted and returned.

---

## 4. Refund, Partial Refund, and Dispute Handling

Appreciation cards represent authentic donor recognition; unearned or retracted gifts must not retain valid public certificates.

### A. Lifecycle States
A card record in `donation_appreciation_cards` possesses the following operational status:
* `active`: Payment verified, certificate valid for display and download.
* `revoked_refunded`: Payment refunded (full or partial). Certificate blocked.
* `revoked_disputed`: Payment disputed by cardholder. Certificate blocked.
* `manual_hold`: Under staff review.

### B. Periodic Reconciliation Polling
1. Every 5 minutes, the worker checks for recent refunds and disputes:
   * Query `GET /api/v1/payments?status=refunded&currency=usd`.
   * For each refunded payment:
     ```sql
     UPDATE donation_appreciation_cards 
     SET status = 'revoked_refunded', 
         revoked_at = datetime('now'),
         revocation_reason = 'Payment refunded via Zeffy'
     WHERE payment_reference = ?;
     ```
2. For payments over 30 days old, periodic deep reconciliation sweeps verify active payment integrity.

### C. Fail-Closed Enforcement on Retrieval & Export
* When `/api/appreciation-cards/:token` is called:
  * If `status != 'active'`, Worker returns **HTTP 410 Gone**:
    ```json
    {
      "success": false,
      "error": "certificate_revoked",
      "message": "This commemorative certificate is no longer active due to a transaction adjustment or refund."
    }
    ```
* If Zeffy API cannot be reached during an on-demand verification check, the backend **fails closed** (returns HTTP 503 Service Unavailable, never mints or unlocks cards).

### D. Policy for Already-Downloaded Certificates
* If a donor downloaded a PNG/PDF prior to a refund:
  * The digital share link (`/appreciation-card/:token`) is permanently revoked.
  * The verification ID will fail public validation checks.
  * An entry is written to `admin_audit_logs` detailing the revocation timestamp.

---

## 5. Correct Appreciation Card Export Dimensions & Print Scaling

To ensure **one card = one complete page** without clipping or content degradation, the rendering pipeline must use proportional geometric scaling.

### A. Print Geometry & Containment (A4 Landscape: 297mm × 210mm)
* **Root Problem:** Fixed pixel heights combined with `overflow: hidden` cropped the bottom signature blocks and legal disclaimers.
* **Proportional Scaling Solution:**
  * Define `@page { size: 297mm 210mm; margin: 0; }`.
  * Isolate `#appreciation-card-render` on the printable canvas with flexbox vertical distribution:
    ```css
    @media print {
      html, body {
        width: 297mm !important;
        height: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body * {
        visibility: hidden;
      }
      #appreciation-card-render, #appreciation-card-render * {
        visibility: visible;
      }
      #appreciation-card-render {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 297mm !important;
        height: 210mm !important;
        max-width: 297mm !important;
        max-height: 210mm !important;
        padding: 10mm 14mm !important;
        box-sizing: border-box !important;
        border-radius: 0 !important;
        border: 2px solid #cbd5e1 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      /* Compact print classes to ensure zero vertical overflow */
      .print-compact-art {
        height: 140px !important;
      }
      .print-compact-text {
        font-size: 28px !important;
        line-height: 1.2 !important;
      }
    }
    ```
  * By distributing the header, SVG artwork, donor inscription, impact box, signatures, and disclaimer via flexbox `justify-between`, all 6 vertical sections fit onto a single A4 sheet with zero clipping.

### B. High-Resolution PNG & PDF Dimensions
* **Standard A4 Dimensions at 300 DPI:**
  * Physical size: `297mm × 210mm` (11.693 in × 8.268 in).
  * Exact Pixel Resolution: **`3508 × 2480` pixels**.
* **Mobile / iOS Safari Memory Safety:**
  * iOS Safari caps `<canvas>` memory to 288MB. Multiplying 3508 × 2480 by device pixel ratios on iPhone causes canvas allocation failure.
  * **Calibration:**
    * Desktop / Tablet (`width >= 768px`): Render at full 300 DPI (`3508 × 2480`).
    * Mobile Viewports (`width < 768px` or WebKit iOS): Render at `2338 × 1654` (approx 200 DPI, memory footprint ~15.5MB, safely under the 288MB ceiling).
* **PDF Compilation (`jspdf`):**
  * Generate high-res raster canvas via `html-to-image`.
  * Embed into `jsPDF({ orientation: 'landscape', unit: 'mm', format: [297, 210] })`.
  * `doc.addImage(canvasDataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST')`.
  * Guaranteed output: exactly 1 landscape A4 PDF page.

### C. iOS Safari Save / Share Flow
```javascript
async function exportCardImage(blob, fileName, title) {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title || 'DCVC Appreciation Card',
        text: 'My Diversity Collective Ventura County Keepsake'
      });
      return;
    } catch (shareErr) {
      if (shareErr.name !== 'AbortError') console.warn('Share sheet dismissed', shareErr);
    }
  }

  // Fallback for desktop & Android browsers
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

---

## 6. Revised Stage Dependencies & Pre-Flight Checklist

Implementation will not execute any stage until its prerequisites are verified:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: Appreciation Card Rendering, Export & Print Pipeline               │
│ - Prerequisites: Local development environment, React 19, Vite.             │
│ - External Credentials Required: NONE (Self-contained client-side).         │
│ - Deliverables: html-to-image & jspdf integration, print stylesheet fix,    │
│   iOS Web Share API fallback, font pre-flight verification.                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ STAGE 2: Payment Protection & Security Hardening                            │
│ - Prerequisites: Cloudflare Worker codebase (worker/src/index.js).          │
│ - External Credentials Required: NONE (Local / preview authorization gates).│
│ - Deliverables: Restrict simulation endpoint to admin role, remove mock     │
│   fallbacks, apply watermark to preview mode, disable unearned downloads.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ STAGE 3: Zeffy Polling, Matching Engine & Refund Lifecycle                  │
│ - Prerequisites: Cloudflare Worker environment, Zeffy API key.              │
│ - External Credentials Required: ZEFFY_API_KEY (Settings > Integrations).   │
│ - Infrastructure: Turso Database (local dev or Turso staging instance).     │
│ - Deliverables: Cron trigger poller, donation_intents schema, multi-factor  │
│   matching, refund revocation rules, manual admin reconciliation route.     │
├─────────────────────────────────────────────────────────────────────────────┤
│ STAGE 4: Full-Stack Backend Integration & Route Alignment                   │
│ - Prerequisites: Completed Stages 1, 2, and 3.                              │
│ - External Credentials Required:                                            │
│   1. TURSO_DATABASE_URL and TURSO_AUTH_TOKEN                                │
│   2. RESEND_API_KEY and verified domain diversitycollectivevc.org          │
│   3. Cloudflare Turnstile SITE_KEY & SECRET_KEY                             │
│ - Infrastructure: Live DNS route / CNAME for Cloudflare Worker API.         │
│ - Deliverables: Connect production Turso, verify Resend dispatch, run 140+  │
│   regression test suite, verify end-to-end user workflows.                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Exact Acceptance Criteria for Each Stage

### Stage 1 Acceptance Criteria:
1. When downloading PNG on Chrome, Safari, Edge, and Firefox, the image visually replicates the on-screen card: DCVC logo, tier artwork (Laurel, Rings, Ribbons, or Crown), gradients, and Fraunces/Outfit typography.
2. In browser Print Preview (`Ctrl+P` / `Cmd+P`), all 4 tiers render on **exactly 1 page** (A4 Landscape and US Letter Landscape) with zero blank pages and zero severed text or missing disclaimers.
3. On iOS Safari emulation and mobile viewports, tapping download opens the native share sheet or triggers an unclipped, high-res download without memory crashes.
4. `document.fonts.ready` is verified before rasterization, eliminating fallback font flashing.

### Stage 2 Acceptance Criteria:
1. `POST /api/appreciation-cards/simulate` returns HTTP 403 Forbidden when called without an authenticated admin JWT token.
2. Requesting `GET /api/appreciation-cards/:token` with an invalid or unseeded token returns HTTP 404 Not Found, never a mock card.
3. Accessing `/appreciation-card/preview` displays a repeating diagonal watermark: `"STUDIO PREVIEW · UNISSUED KEEPSAKE"`.
4. High-resolution PNG and PDF download buttons are disabled in preview mode until authenticated or verified.

### Stage 3 Acceptance Criteria:
1. Scheduled poller correctly queries `https://api.zeffy.com/api/v1/payments` with `currency=usd`, `campaign`, and `starting_after` pagination.
2. Given a verified donation intent, the transaction matches on email and timestamp window, minting exactly 1 card token.
3. Duplicate webhook/poller executions for the same payment reference are rejected via Turso unique constraint.
4. If a payment's `refund` is non-null or status is `refunded`, the card record status updates to `revoked_refunded` and subsequent requests return HTTP 410 Gone.
5. All ambiguous matches are assigned to `pending_reconciliations` for admin review in `/admin`.

### Stage 4 Acceptance Criteria:
1. Real form submissions (Contact, Volunteer, Directory Submit, Newsletter) persist to Turso and trigger Resend email notifications.
2. All 140 unit and integration tests pass cleanly (`npm test`).
3. Production Vite build completes in under 10 seconds (`npm run build`) with zero module resolution errors.

---

## 8. Remaining Infrastructure Blockers

1. **Legacy Domain 301 Redirect:**
   * `diversitycollective.org` remains hosted at GoDaddy pointing to WP Engine, preventing direct webhook ingestion on `diversitycollective.org/api/webhooks/zeffy`.
   * **Mitigation:** The verified polling and donor self-service verification pipeline in Stage 3 bypasses the webhook blocker completely.
2. **Missing Production Secrets:**
   * `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (Required for Stage 3 & 4).
   * `ZEFFY_API_KEY` (Required for Stage 3).
   * `RESEND_API_KEY` (Required for Stage 4).
3. **Public API Routing:**
   * `api.diversitycollective.org` does not currently exist in DNS.
   * **Mitigation:** Stage 1 and Stage 2 operate locally and via relative worker routing; production deployment will map the worker to a route on `diversitycollectivevc.org`.

---
*End of Revised Master Implementation Plan. Awaiting explicit user approval before beginning Stage 1.*
