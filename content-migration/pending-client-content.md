# Pending Client Content Requirements (New Scope of Work Pages)

**Organization:** Diversity Collective Ventura County (`diversitycollective.org`)  
**Purpose:** Formal catalog of content, copy, and assets that must be supplied or officially approved by DCVC leadership for newly introduced pages and features.

---

## 1. Executive Notice

The approved website redesign purposefully introduces modules, pages, and workflows that **did not exist on the previous website**.

Per our global engineering directives:
- We have preserved all newly implemented page functionality.
- We have **refused to invent fictional organizational information, staff biographies, policies, business listings, or course fees**.
- Where legitimate legacy information existed (e.g., board bios, mission/values, program hours, partner agency names), it has been extracted and migrated.
- The items itemized below represent verified operational gaps that require direct input from DCVC staff, legal counsel, or the Board of Directors.

---

## 2. Itemized Content Requirements by Page

### 2.1 Board and Staff Directory (`/board-and-staff`)
* **Current Status**: Verified board members (Roland Catabona, Steve Somann, Unique Dowtin, Luis Andrade, Celia Sandhya Daniels, AJ Holmes) and Executive Directors (Tess Allen, Genevieve Flores-Haro) are fully migrated.
* **Client Action Required**:
  1. Provide formal biographies, titles, and professional email addresses for non-executive operational staff (e.g., Youth Programs Lead, CRC Host, Clinical Health Specialists).
  2. Provide high-resolution official portrait photographs for each staff member to replace temporary photo assets.

### 2.2 Sponsors and Partners (`/sponsors`)
* **Current Status**: Verified foundational partnerships with Ventura County Behavioral Health (VCBH) and Ventura County Public Health (VCPH) are migrated.
* **Client Action Required**:
  1. Confirm the 2025/2026 sponsorship tier names, donation thresholds, and benefit packages (e.g. Founding Benefactor: $10,000, Community Champion: $5,000, Civic Ally: $2,500).
  2. Provide high-resolution vector logos (SVG or PNG with transparent backgrounds) for corporate and institutional sponsors.
  3. Provide downloadable 2025/2026 Sponsorship Prospectus PDF.

### 2.3 P.R.I.D.E. Training Catalog & Booking (`/training`, `/training/:slug`, `/training/book`)
* **Current Status**: Core 4-hour curriculum outline, learning objectives, and workshop booking form are implemented.
* **Client Action Required**:
  1. Provide official course fee schedules for corporate versus non-profit clients (e.g., sliding-scale pricing brackets).
  2. Confirm specific Continuing Education Units (CEUs) licensing accreditation (e.g., BBS, CAMFT, BRN provider numbers) if DCVC issues accredited professional credits.
  3. Designate the primary staff email recipient for training booking submissions (defaulting to `training@diversitycollective.org` or `info@diversitycollective.org`).

### 2.4 Affirming Business Directory (`/directory`, `/directory/:slug`, `/directory/submit`)
* **Current Status**: Directory interface, search, compound filters, Turso libSQL schema, and 6 local seed listings are implemented.
* **Client Action Required**:
  1. Provide the initial master roster of Ventura County affirming businesses to seed the database prior to public launch.
  2. Review and officially approve the wording of the **LGBTQ+ Affirming Business Pledge** displayed on `/directory/submit`.
  3. Designate staff members assigned to the administrative review queue to verify submissions and flip status from `pending` to `approved`.

### 2.5 News & Stories (`/news`, `/news/:slug`)
* **Current Status**: Modern newsroom and blog layout implemented with verified announcement fixtures.
* **Client Action Required**:
  1. Supply 2–3 recent official press releases or executive director letters to populate initial newsroom articles.
  2. Assign editorial roles in Sanity Studio for DCVC staff who will draft and publish future dispatches.

### 2.6 Community Visual Photo Gallery (`/gallery`)
* **Current Status**: Accessible grid and horizontal wall layouts with WCAG-compliant keyboard-navigable modal lightbox implemented.
* **Client Action Required**:
  1. Provide 15–30 high-resolution archival photographs from Ventura County Pride festivals, Diversity Galas, and Pride Proms.
  2. Ensure all submitted photographs have written photo releases for identifiable minors (e.g., Rainbow Umbrella participants).
  3. Supply descriptive alt text and event years for each image.

### 2.7 Legal & Compliance Documents (`/privacy`, `/terms`)
* **Current Status**: Comprehensive non-profit privacy policy (protecting donor data, HIPAA clinical separation) and community terms of service implemented.
* **Client Action Required**:
  1. Board of Directors / legal counsel review and formal adoption of the Privacy Notice and Terms of Use.
  2. Confirm official registered agent and corporate legal address on file with the California Secretary of State.

### 2.8 Zeffy Donation Campaign URL (`/donate`)
* **Current Status**: Dedicated giving portal with tax disclosures and zero-fee non-profit messaging implemented.
* **Client Action Required**:
  1. Create the official "Diversity Collective General Fund" form in DCVC's Zeffy portal.
  2. Provide the production form URL (e.g., `https://www.zeffy.com/donation-form/...`) to bind to `VITE_ZEFFY_DONATION_FORM_URL`.

