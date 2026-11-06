-- Diversity Collective Ventura County (diversitycollective.org)
-- Turso (libSQL) Master Schema DDL
-- Designed for High Scalability (supports 1,000,000+ business directory records with sub-10ms cursor pagination)

-- 1. Businesses Table (Directory Core)
CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,                       -- UUID v4
    slug TEXT NOT NULL UNIQUE,                 -- URL-friendly unique slug
    name TEXT NOT NULL,                        -- Business / Practice Name
    category TEXT NOT NULL,                    -- Category (e.g., healthcare, legal, dining, professional, wellness, retail, community)
    description TEXT,                          -- Extended business bio & services
    address TEXT,                              -- Physical street address (optional)
    city TEXT NOT NULL,                        -- Ventura County City (Ventura, Oxnard, Camarillo, Thousand Oaks, Simi Valley, Santa Paula, Ojai, Moorpark, Port Hueneme, Fillmore)
    zip TEXT,                                  -- Postal Code
    phone TEXT,                                -- Phone Number
    email TEXT,                                -- Inquiries Email
    website TEXT,                              -- External website URL
    instagram TEXT,                            -- Instagram handle or link
    hours TEXT,                                -- Operating hours summary
    logo_url TEXT,                             -- Cloudinary optimized logo URL
    cover_url TEXT,                            -- Cloudinary optimized banner URL
    is_featured INTEGER DEFAULT 0,             -- Flag for spotlight/featured placement
    is_verified INTEGER DEFAULT 0,             -- DCVC Staff Verified Affirming badge
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'archived')),
    affirming_pledge_signed_at TEXT,          -- ISO-8601 timestamp of anti-discrimination commitment
    owner_name TEXT,                           -- Submitter / Owner name (private)
    owner_email TEXT,                          -- Submitter / Owner email (private)
    admin_notes TEXT,                          -- Internal staff verification notes
    created_at TEXT DEFAULT (datetime('now')), -- ISO-8601 timestamp
    updated_at TEXT DEFAULT (datetime('now'))  -- ISO-8601 timestamp
);

-- Indexing for sub-10ms directory queries at 1M rows
CREATE INDEX IF NOT EXISTS idx_businesses_status_city_category 
    ON businesses (status, city, category);

CREATE INDEX IF NOT EXISTS idx_businesses_status_featured 
    ON businesses (status, is_featured DESC, name ASC);

CREATE INDEX IF NOT EXISTS idx_businesses_slug 
    ON businesses (slug);

-- Deterministic cursor-based pagination index: (status, created_at DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_businesses_cursor 
    ON businesses (status, created_at DESC, id DESC);

-- Full-Text Search (FTS5) for instant keyword searches across name, description, category, and city
CREATE VIRTUAL TABLE IF NOT EXISTS businesses_fts USING fts5(
    id UNINDEXED,
    name,
    description,
    category,
    city,
    content='businesses',
    content_rowid='rowid'
);

-- FTS5 Synchronization Triggers
CREATE TRIGGER IF NOT EXISTS businesses_ai AFTER INSERT ON businesses BEGIN
    INSERT INTO businesses_fts(rowid, id, name, description, category, city) 
    VALUES (new.rowid, new.id, new.name, new.description, new.category, new.city);
END;

CREATE TRIGGER IF NOT EXISTS businesses_ad AFTER DELETE ON businesses BEGIN
    INSERT INTO businesses_fts(businesses_fts, rowid, id, name, description, category, city) 
    VALUES('delete', old.rowid, old.id, old.name, old.description, old.category, old.city);
END;

CREATE TRIGGER IF NOT EXISTS businesses_au AFTER UPDATE ON businesses BEGIN
    INSERT INTO businesses_fts(businesses_fts, rowid, id, name, description, category, city) 
    VALUES('delete', old.rowid, old.id, old.name, old.description, old.category, old.city);
    INSERT INTO businesses_fts(rowid, id, name, description, category, city) 
    VALUES (new.rowid, new.id, new.name, new.description, new.category, new.city);
END;

-- 2. Business Correction / Removal Requests
CREATE TABLE IF NOT EXISTS business_corrections (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    business_name TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    request_type TEXT NOT NULL CHECK(request_type IN ('update', 'ownership_claim', 'removal', 'report')),
    details TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'resolved', 'dismissed')),
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_business_corrections_status 
    ON business_corrections (status, created_at DESC);

-- 3. Contact Form Submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    consent_given INTEGER NOT NULL CHECK(consent_given = 1),
    ip_hash TEXT,
    status TEXT DEFAULT 'unread' CHECK(status IN ('unread', 'in_progress', 'resolved', 'archived')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status_date 
    ON contact_submissions (status, created_at DESC);

-- 4. Volunteer Applications
CREATE TABLE IF NOT EXISTS volunteer_applications (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    availability TEXT,
    roles_of_interest TEXT NOT NULL,            -- Stored as JSON array: ["events", "center_host", "advocacy", "youth", "marketing"]
    skills_experience TEXT,
    lived_experience TEXT,
    consent_given INTEGER NOT NULL CHECK(consent_given = 1),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'oriented', 'active', 'inactive')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status_date 
    ON volunteer_applications (status, created_at DESC);

-- 5. Training / Educational Workshop Bookings (P.R.I.D.E.)
CREATE TABLE IF NOT EXISTS training_bookings (
    id TEXT PRIMARY KEY,
    organization_name TEXT NOT NULL,
    organization_type TEXT,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_title TEXT NOT NULL,
    preferred_format TEXT NOT NULL CHECK(preferred_format IN ('in-person', 'virtual', 'hybrid')),
    estimated_attendees INTEGER NOT NULL,
    preferred_date TEXT,
    alternative_date TEXT,
    goals_and_notes TEXT,
    status TEXT DEFAULT 'inquiry_received' CHECK(status IN ('inquiry_received', 'proposal_sent', 'confirmed', 'completed', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_training_bookings_status_date 
    ON training_bookings (status, created_at DESC);

-- 6. Accessibility Barrier Reports
CREATE TABLE IF NOT EXISTS accessibility_feedback (
    id TEXT PRIMARY KEY,
    page_url TEXT NOT NULL,
    barrier_description TEXT NOT NULL,
    assistive_tech TEXT,
    contact_name TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'under_review', 'remediated', 'closed')),
    remediation_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    remediated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_a11y_feedback_status_date 
    ON accessibility_feedback (status, created_at DESC);

-- 7. Newsletter Subscriptions (Clean opt-in with audit trail)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'website_footer',
    consent_timestamp TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    unsubscribed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscribers_active 
    ON newsletter_subscribers (is_active, created_at DESC);

-- 8. Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    event_title TEXT NOT NULL,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    attendee_count INTEGER DEFAULT 1,
    accessibility_accommodations TEXT,
    status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled', 'waitlisted')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_status 
    ON event_rsvps (event_id, status);

-- 9. Donation Appreciation Cards (DCVC Digital Keepsake)
CREATE TABLE IF NOT EXISTS donation_appreciation_cards (
    id TEXT PRIMARY KEY,
    card_token TEXT NOT NULL UNIQUE,
    payment_reference TEXT NOT NULL UNIQUE,   -- Enforces idempotency against Zeffy webhook retries
    tier TEXT NOT NULL CHECK(tier IN ('community_ally', 'pride_advocate', 'rainbow_champion', 'visionary_benefactor')),
    tier_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    donor_display_name TEXT NOT NULL,
    donor_email_hash TEXT,                    -- SHA-256 hash for verification without public PII
    recipient_email TEXT,                     -- Handled strictly for Resend notification delivery
    is_anonymous INTEGER DEFAULT 0,
    is_opened INTEGER DEFAULT 0,
    opened_at TEXT,
    impact_message TEXT NOT NULL,
    frequency TEXT DEFAULT 'one-time',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cards_token 
    ON donation_appreciation_cards (card_token);

CREATE INDEX IF NOT EXISTS idx_cards_payment_ref 
    ON donation_appreciation_cards (payment_reference);

CREATE INDEX IF NOT EXISTS idx_cards_tier_created 
    ON donation_appreciation_cards (tier, created_at DESC);

-- 10. Webhook Event Log (Zeffy & Third-Party Auditability)
CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    payload_hash TEXT,
    status TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_id 
    ON webhook_events (event_id);

-- 11. Administrative Users & Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'approver', 'read_only')),
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    mfa_enabled INTEGER DEFAULT 0,
    mfa_secret TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email 
    ON admin_users (email);

CREATE INDEX IF NOT EXISTS idx_admin_users_role 
    ON admin_users (role, is_active);

-- 12. Administrative Audit Log
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created 
    ON admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action 
    ON admin_audit_logs (action, target_type);

