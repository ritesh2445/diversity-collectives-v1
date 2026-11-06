# DCVC WEBSITE: FINAL TECHNICAL & DESIGN IMPROVEMENT BACKLOG
**Comprehensive Prioritization Matrix for Production Polish, Usability & Handover**
**Date:** November 6, 2026
**Target Repository:** `diversity-collectives-v1`
**Author:** Senior Full-Stack Architect & Creative Design Director

---

## EXECUTIVE SUMMARY

This backlog captures all components, workflows, administrative features, and visual treatments that currently exist in functional or partial states but warrant targeted improvements prior to final client handover. 

Every backlog entry specifies the current implementation, its technical limitation, the proposed improvement, its priority, estimated effort, client dependency, and scope tier (Baseline SOW vs. Additional Scope).

---

## 1. PRIORITY LEVEL DEFINITIONS

* **P0 — Critical Functionality & Security**: Essential for stability, data protection, compliance, or launch blockers.
* **P1 — Baseline SOW Completeness**: Gaps in the original SOW deliverables that require technical completion.
* **P2 — Design Quality & User Experience**: Visual polish, responsiveness enhancements, and brand elevated touchpoints.
* **P3 — Administrative Usability & Tooling**: Improvements that save staff time and ease CMS workflows.
* **P4 — Polish, Performance & Optional Extras**: Non-blocking enhancements for post-launch enhancement.

---

## 2. COMPREHENSIVE IMPROVEMENT BACKLOG

### Group 1: Critical Functionality & Security (P0)

| ID | Component / Workflow | Current Implementation | Existing Limitation | Proposed Improvement | Priority | Est. Effort | Client Dependency | Scope Tier |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **SEC-01** | **Google Sheets Sync Retry Queue** | Synchronous API append call in [`worker/src/googleSheetsSync.js`](file:///e:/DCVC-1/diversity-collectives-v1/worker/src/googleSheetsSync.js). | If Google Sheets API times out, in-memory retry fails if Worker isolates recycle. | Store failed sync payloads in an encrypted `sync_failures` Turso table; retry via scheduled cron. | **P0** | 3.5 hrs | None | Baseline SOW |
| **SEC-02** | **Admin JWT Refresh & Revocation** | Static 24-hour JWT signed with secret in [`worker/src/index.js`](file:///e:/DCVC-1/diversity-collectives-v1/worker/src/index.js). | Token remains valid until expiration even if staff role is revoked in DB. | Check `token_revoked_at` timestamp on user record during sensitive API operations. | **P0** | 2.5 hrs | None | Baseline SOW |
| **SEC-03** | **Zeffy Webhook Replay Window Check** | Validates HMAC signature against payload in [`worker/src/index.js`](file:///e:/DCVC-1/diversity-collectives-v1/worker/src/index.js). | Does not currently reject payloads older than 5 minutes (potential replay window). | Enforce timestamp delta check: reject payloads where `abs(now - event.timestamp) > 300s`. | **P0** | 1.5 hrs | None | Baseline SOW |

---

### Group 2: Baseline SOW Completeness & Edge Cases (P1)

| ID | Component / Workflow | Current Implementation | Existing Limitation | Proposed Improvement | Priority | Est. Effort | Client Dependency | Scope Tier |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **SOW-01** | **Event Cancellation / Reschedule CMS Field** | Hardcoded status badges in [`src/data/dcvcData.js`](file:///e:/DCVC-1/diversity-collectives-v1/src/data/dcvcData.js). | Staff cannot flag an event as "Cancelled" or "Postponed" from Sanity Studio UI. | Add `status: string (active, cancelled, postponed)` and `cancellationNotice: text` fields to [`studio/schemas/event.js`](file:///e:/DCVC-1/diversity-collectives-v1/studio/schemas/event.js). | **P1** | 2.0 hrs | None | Baseline SOW |
| **SOW-02** | **Standalone Individual Resource URL** | Filterable list on [`src/pages/Resources.jsx`](file:///e:/DCVC-1/diversity-collectives-v1/src/pages/Resources.jsx). | No dedicated canonical permalink for sharing a single resource externally. | Add route `/resources/:slug` with dedicated metadata, Open Graph cards, and direct phone link. | **P1** | 3.0 hrs | None | Baseline SOW |
| **SOW-03** | **Manual Screen Reader User Panel Testing** | Automated tests pass 100% in Node.js test runner. | Real-world blind and low-vision accessibility feedback cannot be automated. | Conduct live testing with NVDA (Windows), JAWS, and VoiceOver (macOS/iOS) with local community members. | **P1** | 8.0 hrs | DCVC Community Panel | Baseline SOW |
| **SOW-04** | **Sponsor PDF Information Download** | Sponsor page CTA points to email mailto link. | Commercial clarification requires downloadable sponsor tier prospectus. | Create and link official DCVC Sponsor Opportunities PDF (`/docs/dcvc-sponsorship-guide-2026.pdf`). | **P1** | 2.5 hrs | DCVC Board Approved PDF | Baseline SOW |

---

### Group 3: Design Quality & Visual Polish (P2)

| ID | Component / Workflow | Current Implementation | Existing Limitation | Proposed Improvement | Priority | Est. Effort | Client Dependency | Scope Tier |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **DES-01** | **Donor Appreciation Cards Redesign** | Completed bespoke 4-tier illustration suite in [`src/pages/AppreciationCard.jsx`](file:///e:/DCVC-1/diversity-collectives-v1/src/pages/AppreciationCard.jsx). | Previews are local; needs export-ready high-res SVG and PNG rendering for donor email attachments. | Generate pre-rendered static SVG previews for Resend email embed fallbacks. | **P2** | 3.0 hrs | None | Design Enhancement |
| **DES-02** | **Staff & Board Authentic Photography** | Placeholder vector portraits and initial avatars in [`src/pages/BoardAndStaff.jsx`](file:///e:/DCVC-1/diversity-collectives-v1/src/pages/BoardAndStaff.jsx). | Lacks authentic human warmth of real DCVC leadership. | Ingest high-res photography of Tess Allen, Roland Catabona, and team with uniform duo-tone styling. | **P2** | 2.0 hrs | DCVC Photography Assets | Baseline SOW |
| **DES-03** | **Community Gallery Lightbox Touch Gestures** | Click-based navigation in [`src/pages/Gallery.jsx`](file:///e:/DCVC-1/diversity-collectives-v1/src/pages/Gallery.jsx). | Mobile users cannot swipe horizontally between gallery photos. | Integrate lightweight touch swipe listener (`touchstart`/`touchend` delta) in gallery modal. | **P2** | 2.5 hrs | None | Polish |
| **DES-04** | **Programs Dynamic Accordion Peeking** | Simple expand/collapse toggles on Home page program peeks. | Abrupt layout shift when clicking "Preview Schedule" on mobile. | Smooth CSS grid animation `grid-template-rows: 0fr -> 1fr` for fluid accordion transition. | **P2** | 1.5 hrs | None | Polish |

---

### Group 4: Administrative Usability & Tooling (P3)

| ID | Component / Workflow | Current Implementation | Existing Limitation | Proposed Improvement | Priority | Est. Effort | Client Dependency | Scope Tier |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **ADM-01** | **Design Editor Undo/Redo History** | Single-level state in [`admin/src/components/DesignEditor.jsx`](file:///e:/DCVC-1/diversity-collectives-v1/admin/src/components/DesignEditor.jsx). | Accidental deletion or block reordering requires manual re-adjustment. | Implement 10-step undo/redo stack (`history` array + `historyIdx`) with Ctrl+Z / Ctrl+Y hotkeys. | **P3** | 3.0 hrs | None | Admin Feature |
| **ADM-02** | **Bulk Business Directory Moderation** | Single listing approve/reject buttons in [`admin/src/App.jsx`](file:///e:/DCVC-1/diversity-collectives-v1/admin/src/App.jsx). | Moderating dozens of new pride festival vendor submissions is repetitive. | Add multi-select checkboxes and "Approve Selected" / "Reject Selected" batch actions. | **P3** | 2.5 hrs | None | Admin Feature |
| **ADM-03** | **Live Database Sync Indicator in Admin** | Health status check runs on manual refresh. | Admin does not immediately see if offline mock mode or live Turso database is active. | Add prominent header status pill: "Connected: Turso Edge (Production)" vs "Offline: Local Mock Mode". | **P3** | 1.0 hr | None | Admin Feature |

---

### Group 5: Performance, Polish & Optional Enhancements (P4)

| ID | Component / Workflow | Current Implementation | Existing Limitation | Proposed Improvement | Priority | Est. Effort | Client Dependency | Scope Tier |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **OPT-01** | **Real-Time Web Analytics Dashboard** | Privacy telemetry helper records events in [`src/utils/analytics.js`](file:///e:/DCVC-1/diversity-collectives-v1/src/utils/analytics.js). | Staff must log into Cloudflare dashboard to view visitor metrics. | Add simple in-admin summary chart displaying 30-day donation conversion and pageview trends. | **P4** | 4.0 hrs | None | Optional / Additional |
| **OPT-02** | **Bilingual Spanish Translation (ES)** | Site copy is currently 100% English. Ventura County has a 43% Hispanic population. | Non-English speaking community members rely on browser auto-translate. | Scaffold lightweight i18n dictionary for core sanctuary hours, HIV testing, and crisis lines. | **P4** | 8.0 hrs | DCVC Board Approval | Optional / Additional |
| **OPT-03** | **Interactive 3D Community Map** | 2D embedded Google Map on Contact page. | Visual exploration of all 10 county cities could be more dynamic. | Interactive SVG county map highlighting partner clinics and youth hubs in Oxnard, Simi, Ojai. | **P4** | 6.0 hrs | None | Optional / Additional |

---

## 3. SUMMARY OF EFFORT BY DISCIPLINE

```
================================================================================
ESTIMATED REMAINING IMPROVEMENT EFFORT SUMMARY
================================================================================
Group 1 (P0: Critical Security & Retries)    :  7.5 hours
Group 2 (P1: SOW Baseline Edge Cases)        : 15.5 hours
Group 3 (P2: Design Quality & Polish)        :  9.0 hours
Group 4 (P3: Administrative Usability)       :  6.5 hours
Group 5 (P4: Optional Extras & Spanish i18n) : 18.0 hours
--------------------------------------------------------------------------------
TOTAL EFFORT FOR PRODUCTION LAUNCH (P0–P2)   : 32.0 hours (Approx. 4 working days)
TOTAL INCLUDING OPTIONAL ENHANCEMENTS        : 56.5 hours
================================================================================
```

