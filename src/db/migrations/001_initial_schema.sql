-- Migration 001: Initial Schema
-- Description: Establishes base tables, indexes, and full-text search triggers for Turso libSQL

-- Up Migration
CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT NOT NULL,
    zip TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    hours TEXT,
    logo_url TEXT,
    cover_url TEXT,
    is_featured INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'archived')),
    affirming_pledge_signed_at TEXT,
    owner_name TEXT,
    owner_email TEXT,
    admin_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_businesses_status_city_category ON businesses (status, city, category);
CREATE INDEX IF NOT EXISTS idx_businesses_status_featured ON businesses (status, is_featured DESC, name ASC);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses (slug);
CREATE INDEX IF NOT EXISTS idx_businesses_cursor ON businesses (status, created_at DESC, id DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS businesses_fts USING fts5(
    id UNINDEXED,
    name,
    description,
    category,
    city,
    content='businesses',
    content_rowid='rowid'
);

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

CREATE INDEX IF NOT EXISTS idx_business_corrections_status ON business_corrections (status, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status_date ON contact_submissions (status, created_at DESC);

CREATE TABLE IF NOT EXISTS volunteer_applications (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    availability TEXT,
    roles_of_interest TEXT NOT NULL,
    skills_experience TEXT,
    lived_experience TEXT,
    consent_given INTEGER NOT NULL CHECK(consent_given = 1),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'oriented', 'active', 'inactive')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status_date ON volunteer_applications (status, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_training_bookings_status_date ON training_bookings (status, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_a11y_feedback_status_date ON accessibility_feedback (status, created_at DESC);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'website_footer',
    consent_timestamp TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    unsubscribed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscribers_active ON newsletter_subscribers (is_active, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_status ON event_rsvps (event_id, status);

