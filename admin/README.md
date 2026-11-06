# DCVC Custom Staff & Board Administration Portal

**Domain:** `admin.diversitycollective.org`  
**Purpose:** Custom administrative interface for business directory moderation, operational inquiry management (Contact, Volunteer, Training, Accessibility), RBAC user management, CSV data exports, and audit logging.

---

## 1. Architectural Isolation

Per security and performance specifications:
- The custom admin portal is built and deployed as an **independent application**, completely separate from the public website bundle (`diversitycollective.org`).
- Public bundle size remains untouched at 463 kB.
- No administrative code, credentials, or moderation UI components are bundled into the public website.
- Authenticates with the Cloudflare Worker backend API endpoints under `/api/admin/*` using PBKDF2-SHA256 salted password hashing and HMAC-SHA256 bearer tokens.

---

## 2. Capabilities by Role (RBAC)

| Capability | Superadmin (`admin`) | Approver (`approver`) | Editor (`editor`) | Read-Only (`read_only`) |
| :--- | :---: | :---: | :---: | :---: |
| **View Directory Submissions** | Yes | Yes | Yes | Yes |
| **Approve / Reject Businesses** | Yes | Yes | No | No |
| **Edit Business Profiles** | Yes | Yes | Yes | No |
| **Remove / Delete Listings** | Yes | No | No | No |
| **Review Corrections & Removals** | Yes | Yes | No | No |
| **View Contact / Volunteer Inquiries** | Yes | Yes | Yes | Yes |
| **Update Inquiry Status** | Yes | Yes | Yes | No |
| **Export Data (CSV)** | Yes | No | No | No |
| **Audit Logs** | Yes | Yes | Yes | Yes |
| **Manage Staff Accounts** | Yes | No | No | No |

---

## 3. Local Development

```bash
cd admin
npm install
npm run dev
# Starts admin development server on http://localhost:5174
```

### Staging / Dev Test Account
* **Email:** `admin@diversitycollective.org`
* **Password:** `DCVC-Admin-2026!`
* **Role:** `admin` (Superadmin)

---

## 4. Production Deployment

1. Deploy the `admin/` directory to Cloudflare Pages (or Vercel) under project name `dcvc-admin`.
2. Configure Custom Domain: `admin.diversitycollective.org`.
3. Set environment variable: `VITE_API_URL=https://api.diversitycollective.org/api` (or worker URL).

