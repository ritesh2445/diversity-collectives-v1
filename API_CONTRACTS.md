# API Contracts & Integration Specifications

**Base URL (Production):** `https://api.diversitycollective.org/api`  
**Base URL (Local Worker):** `http://localhost:8787/api`  
**Protocol:** HTTPS / REST over JSON  
**Authentication:** Public with Cloudflare Turnstile token validation on write operations

---

## 1. Common Conventions

### 1.1 Headers
All requests containing a JSON payload must include:
```http
Content-Type: application/json
```

All responses include security and CORS headers:
```http
Access-Control-Allow-Origin: https://diversitycollective.org
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

### 1.2 Standard Success Response
```json
{
  "success": true,
  "message": "Human-readable confirmation message",
  "data": {},
  "reference": "uuid-v4-reference-id"
}
```

### 1.3 Standard Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": null
}
```

---

## 2. Endpoints Catalog

### 2.1 Health Check
- **Endpoint:** `GET /api/health`
- **Description:** Verifies worker runtime health and connectivity to external services.
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "timestamp": "2025-02-01T12:00:00.000Z",
  "integrations": {
    "databaseConfigured": true,
    "resendConfigured": true,
    "turnstileConfigured": true
  }
}
```

---

### 2.2 Affirming Business Directory: Search & Filter
- **Endpoint:** `GET /api/directory`
- **Query Parameters:**
  - `q` *(optional, string)*: Free-text search matching name, description, category, or city.
  - `category` *(optional, string)*: Filter by category (e.g. `Dining & Coffee`, `Health & Wellness`).
  - `city` *(optional, string)*: Filter by Ventura County city (e.g. `Ventura`, `Oxnard`, `Ojai`).
  - `cursor` *(optional, string)*: Pagination cursor string in format `{created_at}|{id}`.
  - `limit` *(optional, integer, default: 12, max: 50)*: Number of records per page.
- **Response `200 OK`:**
```json
{
  "success": true,
  "businesses": [
    {
      "id": "biz-1",
      "slug": "beacon-coffee-company",
      "name": "Beacon Coffee Company",
      "category": "Dining & Coffee",
      "description": "Artisanal specialty coffee roastery...",
      "address": "5777 Valentine Rd, Ventura, CA 93003",
      "city": "Ventura",
      "zip": "93003",
      "phone": "(805) 248-7054",
      "email": "hello@beaconcoffee.com",
      "website": "https://beaconcoffee.com",
      "instagram": "@beaconcoffee",
      "hours": "7:00 AM - 4:00 PM Daily",
      "logo_url": "https://res.cloudinary.com/dcvc/image/upload/v1/...",
      "cover_url": "https://res.cloudinary.com/dcvc/image/upload/v1/...",
      "is_featured": 1,
      "is_verified": 1,
      "created_at": "2024-01-15 10:00:00"
    }
  ],
  "hasMore": true,
  "nextCursor": "2024-01-15 10:00:00|biz-1"
}
```

---

### 2.3 Affirming Business Directory: Single Profile
- **Endpoint:** `GET /api/directory/:slug`
- **Path Parameters:**
  - `slug` *(required, string)*: Unique URL slug for the business.
- **Response `200 OK`:**
```json
{
  "success": true,
  "business": {
    "id": "biz-1",
    "slug": "beacon-coffee-company",
    "name": "Beacon Coffee Company",
    "category": "Dining & Coffee",
    "city": "Ventura",
    "status": "approved"
  }
}
```
- **Response `404 Not Found`:**
```json
{
  "success": false,
  "error": "Business profile not found"
}
```

---

### 2.4 Affirming Business Directory: Submission
- **Endpoint:** `POST /api/directory`
- **Request Body:**
```json
{
  "name": "Channel Islands Yoga Collective",
  "category": "Fitness & Recreation",
  "city": "Ventura",
  "address": "123 Main St, Ventura, CA 93001",
  "zip": "93001",
  "phone": "(805) 555-0199",
  "email": "info@ciyoga.example",
  "website": "https://ciyoga.example",
  "instagram": "@ciyoga",
  "hours": "Mon-Sat 8am-7pm",
  "description": "Inclusive yoga and mindful movement sanctuary.",
  "ownerName": "Alex Chen",
  "ownerEmail": "alex@ciyoga.example",
  "affirmingPledge": true,
  "turnstileToken": "0.XXXXXX..."
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Your listing has been submitted for review. DCVC staff will verify and publish your profile within 3–5 business days.",
  "reference": "3f9c64ab-1290-4e31-89d4-1a2f64e29b12"
}
```

---

### 2.5 Business Correction or Removal Request
- **Endpoint:** `POST /api/directory/correction`
- **Request Body:**
```json
{
  "businessId": "biz-1",
  "businessName": "Beacon Coffee Company",
  "requesterName": "Jordan Smith",
  "requesterEmail": "jordan@example.com",
  "requestType": "update",
  "details": "Please update operating hours to 6:30 AM to 5:00 PM."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Correction request received. Our team will review the requested update.",
  "reference": "7c8d9e0f-..."
}
```

---

### 2.6 Contact Inquiries
- **Endpoint:** `POST /api/contact`
- **Request Body:**
```json
{
  "name": "Taylor Morgan",
  "email": "taylor@example.org",
  "phone": "(805) 555-0122",
  "subject": "Community Center Group Space Rental",
  "message": "We would like to inquire about hosting a monthly support meeting in your multi-purpose room.",
  "consent": true,
  "turnstileToken": "0.XXXXXX..."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Thank you! Your message has been sent to our team.",
  "reference": "c2a98f12-..."
}
```

---

### 2.7 Volunteer Applications
- **Endpoint:** `POST /api/volunteer`
- **Request Body:**
```json
{
  "fullName": "Casey Rivera",
  "email": "casey@example.com",
  "phone": "(805) 555-0199",
  "city": "Oxnard",
  "availability": "Weekends & Friday Evenings",
  "roles": ["events", "center_host"],
  "skills": "Bilingual (English/Spanish), event setup, graphic design",
  "livedExperience": "Passionate about youth mentorship and creating affirming spaces.",
  "consent": true,
  "turnstileToken": "0.XXXXXX..."
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Volunteer application received! Our team will contact you with orientation details.",
  "reference": "98e4f1a2-..."
}
```

---

### 2.8 Training Workshop Bookings (P.R.I.D.E.)
- **Endpoint:** `POST /api/training/book`
- **Request Body:**
```json
{
  "organizationName": "Ventura Health Clinic",
  "organizationType": "Healthcare Provider",
  "contactName": "Dr. Leslie Vance",
  "email": "lvance@clinic.example",
  "phone": "(805) 555-0144",
  "courseId": "PRIDE-201",
  "courseTitle": "Affirming Healthcare & Clinical Sensitivity",
  "preferredFormat": "in-person",
  "attendeeCount": 35,
  "preferredDate": "2025-05-15",
  "alternativeDate": "2025-05-22",
  "notes": "We would like to focus on intake forms and pronoun sensitivity in our reception staff."
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Training inquiry received. A coordinator will provide scheduling and proposal details within 2 business days.",
  "reference": "5b4c3d2e-..."
}
```

---

### 2.9 Accessibility Barrier Reports
- **Endpoint:** `POST /api/accessibility/report`
- **Request Body:**
```json
{
  "pageUrl": "https://diversitycollective.org/events",
  "barrierDescription": "Screen reader NVDA is not announcing month change when using previous/next buttons.",
  "assistiveTech": "NVDA 2024.1 on Firefox",
  "contactName": "Robin Lee",
  "contactEmail": "robin@example.org"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Accessibility barrier report received. Thank you for helping us improve our digital experience for everyone.",
  "reference": "a1b2c3d4-..."
}
```

---

### 2.10 Newsletter Subscriptions
- **Endpoint:** `POST /api/newsletter/subscribe`
- **Request Body:**
```json
{
  "email": "community_member@example.com",
  "source": "website_footer"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Thank you for subscribing to Diversity Collective updates!"
}
```

---

### 2.11 Zeffy Webhook (`payment.completed`)
- **Endpoint:** `POST /api/webhooks/zeffy`
- **Headers:** `X-Zeffy-Signature: sha256=<hmac>`
- **Request Body (Zeffy Payload):**
```json
{
  "event": "payment.completed",
  "data": {
    "id": "zeffy_pay_9823419",
    "donation_amount": 100,
    "donor_name": "Taylor Smith",
    "donor_email": "taylor@example.org",
    "is_anonymous": false,
    "frequency": "monthly"
  }
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "status": "card_created",
  "cardToken": "dcvc_4f89b...",
  "cardUrl": "https://diversitycollective.org/appreciation-card/dcvc_4f89b...",
  "tier": "pride_advocate",
  "tierName": "Pride Advocate",
  "donorDisplayName": "Taylor Smith",
  "amountInDollars": 100
}
```
- **Response `200 OK` (Duplicate / Retry Handling):**
```json
{
  "success": true,
  "status": "already_processed",
  "message": "This payment has already been processed."
}
```

---

### 2.12 Appreciation Card Public Retrieval
- **Endpoint:** `GET /api/appreciation-cards/:token`
- **Path Parameters:** `token` (32-character secure random card token)
- **Response `200 OK`:**
```json
{
  "success": true,
  "card": {
    "token": "dcvc_4f89b...",
    "tier": "pride_advocate",
    "tierName": "Pride Advocate",
    "amountCents": 10000,
    "donorDisplayName": "Taylor Smith",
    "isAnonymous": false,
    "frequency": "monthly",
    "impactMessage": "Your gift directly funds free, confidential rapid HIV and STI testing clinics...",
    "createdAt": "2025-02-01T15:30:00Z"
  }
}
```
- **Response `404 Not Found`:**
```json
{
  "success": false,
  "error": "Appreciation card not found"
}
```

