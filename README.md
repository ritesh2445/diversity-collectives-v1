# Diversity Collective Ventura County (`diversitycollective.org`)

[![WCAG 2.2 AA Compliant](https://img.shields.io/badge/WCAG-2.2%20AA%20Compliant-purple.svg)](https://diversitycollective.org/accessibility)
[![Architecture: Jamstack + Edge Worker](https://img.shields.io/badge/Architecture-Cloudflare%20Edge%20%2B%20Turso-blue.svg)](./ARCHITECTURE.md)
[![CMS: Sanity Isolated Studio](https://img.shields.io/badge/CMS-Sanity%20v3%20Isolated-red.svg)](./studio/README.md)
[![License: 501(c)(3) Non-Profit Public Benefit](https://img.shields.io/badge/Organization-501(c)(3)%20Public%20Benefit-emerald.svg)](https://diversitycollective.org/about)

The official web platform for **Diversity Collective Ventura County, Inc.** (EIN: `46-5312131`), a 501(c)(3) non-profit public benefit organization founded in 2014 dedicated to providing advocacy, visibility, safety, and wellness for the LGBTQ+ community across Ventura County, California.

---

## 🌟 Key Highlights & Architectural Principles

1. **Zero Admin In Public Bundle (Strict Isolation)**:
   - The public website (`diversitycollective.org`) contains **zero administrative code** and **no studio routes**.
   - Sanity Studio is located in an isolated workspace (`/studio`) designed for deployment to a dedicated subdomain (`studio.diversitycollective.org`).
2. **Native WCAG 2.2 Level AA Accessibility**:
   - Built to meet WCAG 2.2 Level AA without relying on intrusive third-party commercial overlay widgets.
   - Includes keyboard navigation skip links, semantic landmarks, high-contrast themes, OpenDyslexic font toggling, reading rulers, and screen mask letterbox aids.
3. **Affirming Business Directory Scalability**:
   - Powered by **Turso (libSQL)** distributed database with FTS5 full-text search and deterministic cursor-based pagination designed to scale up to 1,000,000 business listings with sub-10ms query times.
4. **Zero-Fee Non-Profit Giving & Appreciation Cards**:
   - Integrates **Zeffy** giving portal embeds and links ensuring 100% of community contributions go to programs, with zero platform fees.
   - Automated HMAC-SHA256 webhook processing and personalized donor appreciation cards across 4 tiers (`/appreciation-card`).
5. **Ask DCVC Zero-Quota Conversational AI**:
   - Edge-native chatbot powered by Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8`) at $0 additional cost (free 10,000 neurons/day tier).
   - Seamless fallback to local deterministic knowledge engine with zero-quota degradation, emergency crisis interception (988, Trevor Project), and verified grounding.
6. **Isolated Admin Dashboard**:
   - Independent administrative interface (`/admin`) with PBKDF2 deterministic hashing, JWT sessions, role-based access control, directory moderation, and immutable audit logs.
7. **Modern Edge Infrastructure**:
   - **Frontend**: React 19 + Vite + Tailwind CSS, hosted on Cloudflare Pages or Vercel Edge Network.
   - **Backend API**: Cloudflare Worker (`worker/src/index.js`) providing CORS protection, Cloudflare Turnstile bot verification, and 12 Resend transactional email templates.
   - **Media CDN**: Cloudinary for automatic WebP/AVIF formatting and responsive scaling.

---

## 📂 Repository Structure

```
diversity-collectives-v1/
├── admin/                      # ISOLATED Admin Dashboard (Separate Build)
│   ├── src/                    # RBAC, Directory Moderation, Submissions, Audit Logs
│   ├── index.html              # Admin application entry point
│   └── package.json            # Vite build configuration
├── content-migration/          # Automated Sanity CMS Seeding & Migration Scripts
│   ├── migrateSanity.js        # Programmatic GROQ batch migration script
│   └── mockSanityData.json     # Verified seed fixtures for programs & events
├── public/                     # Static assets, XML sitemap, robots.txt, 301 redirects
│   ├── _redirects              # Cloudflare/Netlify SPA & legacy 301 redirect map
│   ├── robots.txt              # Search engine crawling policies
│   ├── sitemap.xml             # Complete canonical XML sitemap
│   └── images/                 # Verified DCVC community photography & brand assets
├── src/                        # Public Website Application
│   ├── accessibility/          # A11y store, focus audio cues, voice helper
│   ├── components/             # Reusable UI & WCAG accessibility components
│   │   ├── accessibility/      # Recite reading aids, toolbar, Skip navigation
│   │   ├── AskDcvcChatbot.jsx  # Floating conversational assistant with zero-quota engine
│   │   ├── Header.jsx          # Accessible header with circular a11y trigger & Donate pill
│   │   ├── Footer.jsx          # Comprehensive footer with legal & crisis helplines
│   │   └── NewsletterSignup.jsx # Privacy-respecting newsletter subscription box
│   ├── data/                   # Verified organization data, fixtures, programs, board
│   ├── db/                     # Turso libSQL Database Artifacts
│   │   ├── schema.sql          # Complete production DDL schema & FTS5 virtual tables
│   │   ├── seed.sql            # Direct SQL seed file for verified business directory
│   │   ├── seed.js             # Automated programmatic seeding script
│   │   └── migrations/         # Version-controlled migration history
│   ├── lib/                    # External Client Adapters (Cloudinary, Sanity)
│   ├── pages/                  # Route views (30+ fully implemented pages)
│   ├── services/               # Centralized API service contracts & client validation
│   ├── utils/                  # iCalendar generator, SEO hooks, analytics
│   ├── App.jsx                 # Client router with ErrorBoundary & custom 404
│   └── main.jsx                # Application root mount
├── studio/                     # ISOLATED Sanity Studio v3 (Separate Deployment)
│   ├── schemas/                # 10 editorial schemas (programs, events, training, etc.)
│   ├── sanity.config.js        # Studio desk structure configuration
│   └── package.json            # Independent Studio dependencies & build scripts
├── tests/                      # Automated unit & integration tests (106 tests, 13 suites)
│   ├── adminAuth.test.js       # PBKDF2 hashing, JWT signing, RBAC permissions
│   ├── analytics.test.js       # Privacy-preserving event logging & PII scrubbing
│   ├── api.test.js             # Client form validation tests
│   ├── appreciationCard.test.js# Donor tier calculation & visual tokens
│   ├── backupRestore.test.js   # Disaster recovery snapshot & restore tests
│   ├── calendar.test.js        # iCalendar format & query string tests
│   ├── chatbot.test.js         # Ask DCVC grounding, crisis interception, rate limits
│   ├── chatbotUnlimited.test.js# Zero-quota offline conversational engine
│   ├── cloudinary.test.js      # Image transform & fallback tests
│   ├── cloudinaryUpload.test.js# Server-side upload signing & folder isolation
│   ├── emailTemplates.test.js  # 12 transactional email templates
│   ├── googleSheets.test.js    # Sheet synchronization & clinical keyword redaction
│   └── zeffyWebhook.test.js    # HMAC-SHA256 signature verification & donation parsing
├── worker/                     # Cloudflare Worker Backend API
│   ├── src/                    # REST API, Workers AI binding, Resend templates
│   ├── wrangler.toml           # Worker deployment configuration & env bindings
│   └── package.json            # Worker dependencies
├── .env.example                # Catalog of required environment variables
├── API_CONTRACTS.md            # REST API schemas & request/response contracts
├── ARCHITECTURE.md             # System architecture & data flow
├── CHATBOT_COST_AND_LIMITS.md  # Workers AI free tier economics & scaling limits
├── CHATBOT_TEST_RESULTS.md     # 24/24 chatbot verification test results
├── DATABASE_DESIGN.md          # Turso libSQL schema & 1M-row indexing architecture
├── DEPLOYMENT_GUIDE.md         # Deployment runbook for Cloudflare, Turso & Sanity
├── ENVIRONMENT_VARIABLES.md    # Complete environment variable configuration guide
├── FINAL_DEPLOYMENT_RUNBOOK.md # Production cutover, health checks, rollback procedures
├── FINAL_ENVIRONMENT_CONFIGURATION_CHECKLIST.md # Step-by-step credentials configuration
├── INTEGRATION_CHECKLIST.md    # Pre-flight external service configuration checklist
├── PHASE_2_COMPLETION_REPORT.md# Workstreams 1-7 delivery report & verification matrix
├── TESTING_REPORT.md           # QA test execution & WCAG audit report
└── ZEFFY_INTEGRATION.md        # Zeffy 0% fee donation & webhook specification
```

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm

### 1. Public Frontend
```bash
# Clone the repository
git clone https://github.com/diversity-collective-vc/diversity-collectives-v1.git
cd diversity-collectives-v1

# Install frontend dependencies
npm install

# Start Vite local development server
npm run dev
```
The site runs at `http://localhost:5173`.

### 2. Cloudflare Worker API Backend
```bash
cd worker
npm install
npm run dev
```
The Worker runs locally at `http://localhost:8787`.

### 3. Isolated Admin Dashboard
```bash
cd admin
npm install
npm run dev
```
The Admin Dashboard runs locally at `http://localhost:5174`.

### 4. Isolated Sanity Studio
```bash
cd studio
npm install
npm run dev
```
The Studio runs locally at `http://localhost:3333`.

### 5. Automated Test Suite
```bash
# Run all 106 unit & integration tests
npm test
```
Executes complete automated validation across 13 test suites (RBAC, PII redaction, API validation, appreciation cards, disaster recovery, calendar, Ask DCVC grounding, offline chatbot engine, Cloudinary signatures, email templates, Google Sheets sync, Zeffy webhooks).

---

## 📋 Comprehensive Page & Route Inventory

| Path | Name | Description |
| :--- | :--- | :--- |
| `/` | Home | Mission hero, flagship programs, impact statistics, directory spotlight |
| `/about` | About DCVC | Organization history, values, DEI pledge, leadership overview |
| `/board-and-staff` | Board & Staff | Verified Board of Directors & executive operational team |
| `/sponsors` | Sponsors & Partners | Community benefactors, civic partners & sponsorship inquiry |
| `/programs` | Programs Overview | Flagship initiatives directory (CRC, SHINES, RU, Pride) |
| `/programs/:slug` | Program Detail | Deep-dive program syllabus, amenities, hours, and contacts |
| `/events` | Community Calendar | Categorized upcoming gatherings with filtering & Add to Calendar |
| `/events/:slug` | Event Detail | Detailed event view with `.ics` export & cancellation notices |
| `/training` | P.R.I.D.E. Training | LGBTQ+ cultural competency courses for healthcare, corporate, civic |
| `/training/:slug` | Course Detail | Course syllabus, objectives, CEU credits, and fee guidelines |
| `/training/book` | Workshop Booking | Formal training booking inquiry form with attendee estimates |
| `/directory` | Affirming Directory | Searchable directory with city & category filters, pagination |
| `/directory/:slug` | Business Profile | Verified affirming business profile, pledge status, contact info |
| `/directory/submit` | Submit Business | Business onboarding application with anti-discrimination pledge |
| `/news` | News & Stories | Community dispatches, press releases, and advocacy updates |
| `/news/:slug` | Article Detail | Editorial article view with reading time, author, and share links |
| `/gallery` | Community Gallery | Keyboard-navigable photo gallery with accessible lightbox |
| `/resources` | Resource Directory | Local healthcare, housing, legal, crisis services with Spanish filters |
| `/community` | Community Hub | Gathering spaces, peer groups, and community alliances |
| `/get-involved` | Get Involved | Centralized action pathways for donors, advocates, and volunteers |
| `/volunteer` | Volunteer Pathways | Volunteer opportunities with role-based intake application |
| `/donate` | Dedicated Giving | Zeffy non-profit giving embed, EIN disclosures, tax-deductibility |
| `/contact` | Contact DCVC | Location, hours, staff messaging form with turnstile protection |
| `/accessibility` | A11y Statement | WCAG 2.2 AA commitments, testing methodology, feedback pathway |
| `/accessibility-feedback` | Barrier Report | Accessibility barrier reporting form for assistive technology users |
| `/privacy` | Privacy Policy | LGBTQ+ confidential privacy protections, zero data selling |
| `/terms` | Terms & Conditions | Platform terms, directory affirmation standards, donor policies |
| `/submission-success` | Success Landing | Reusable confirmation page with next steps and reference ID |
| `/submission-error` | Error Fallback | Transmission issue recovery page with direct hotlines and phone |
| `/error` | General Error | Application error view with React Error Boundary integration |
| `*` | 404 Not Found | Branded 404 with navigation assistance and crisis support hotlines |

---

## ♿ WCAG 2.2 AA Compliance Standards

This application is built in strict adherence to the **Web Content Accessibility Guidelines (WCAG) 2.2 Level AA**:
- **Semantic HTML5 Landmarks**: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- **Skip Navigation**: Accessible skip-to-main-content bypass block on every route.
- **Color Contrast**: All primary text maintains a minimum contrast ratio of `4.5:1` against backgrounds (exceeds `7.0:1` for large headings).
- **Focus Management**: Visible focus rings (`focus:ring-2 focus:ring-purple-600`) across all interactive buttons, links, and form inputs.
- **Screen Reader Support**: ARIA live regions, polite announcements on filter changes, explicit `aria-expanded` and `aria-controls` bindings.
- **Reduced Motion**: All animations respect the user's OS-level `prefers-reduced-motion` settings.

---

## 🔒 Security & Data Privacy Guarantees

- **No Health / Clinical Data In Shared Sheets**: Clinical intake and HIV/STI testing data for Diversity SHINES never flows into public or shared spreadsheets.
- **Zero Cardholder Data Storage**: All financial donations are handled directly through Zeffy's PCI-DSS Level 1 compliant infrastructure.
- **Strict Least Privilege**: API endpoints use parameterized SQL queries preventing SQL injection; Turnstile tokens prevent automated spam and abuse.

---

## 📄 License & Organization Information

Diversity Collective Ventura County, Inc. is a registered 501(c)(3) non-profit public benefit organization under California law (Corp #`C3666108`).

- **Physical Address**: 2471 Portola Road, Suite 100, Ventura, CA 93003
- **Phone**: (805) 644-LGBT (5428)
- **General Inquiries**: `info@diversitycollective.org`
- **Website**: [diversitycollective.org](https://diversitycollective.org)
