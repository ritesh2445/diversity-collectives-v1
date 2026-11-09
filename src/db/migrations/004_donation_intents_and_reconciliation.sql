-- Migration 004: Donation Intents, Reconciliation Queue, and Certificate Lifecycle
-- Description: Supports deterministic Zeffy payment matching, scheduled polling watermarks,
-- refund/dispute status tracking, and auditable manual administrator overrides.

-- 1. Create Donation Intents Table
CREATE TABLE IF NOT EXISTS donation_intents (
    id TEXT PRIMARY KEY,                                       -- Unique intent ID (e.g. intent_uuid)
    intent_token TEXT NOT NULL UNIQUE,                         -- Opaque client verification token
    donor_name TEXT,                                           -- Pre-checkout donor display name
    donor_email TEXT NOT NULL,                                 -- Normalized lowercase email
    donor_email_hash TEXT NOT NULL,                            -- SHA-256 hash for privacy
    expected_amount_cents INTEGER NOT NULL,                    -- Expected amount in cents
    tier TEXT NOT NULL,                                        -- Target tier
    frequency TEXT DEFAULT 'one-time',                         -- 'one-time' or 'monthly'
    campaign TEXT DEFAULT 'diversity-collective-general-fund', -- Zeffy campaign identifier
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'expired', 'manual_review', 'cancelled')),
    matched_payment_reference TEXT UNIQUE,                     -- Zeffy transaction ID once matched
    card_token TEXT,                                           -- Generated card token upon verification
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL                                   -- Time window for matching (created_at + 2 hours)
);

CREATE INDEX IF NOT EXISTS idx_intents_email_status 
    ON donation_intents (donor_email, status, created_at);

CREATE INDEX IF NOT EXISTS idx_intents_token 
    ON donation_intents (intent_token);

CREATE INDEX IF NOT EXISTS idx_intents_matched_ref 
    ON donation_intents (matched_payment_reference);

-- 2. Create Pending Reconciliations Table (Audit queue for ambiguous, unmatched, or disputed transactions)
CREATE TABLE IF NOT EXISTS donation_reconciliations (
    id TEXT PRIMARY KEY,                                       -- UUID
    payment_reference TEXT NOT NULL UNIQUE,                    -- Authoritative Zeffy transaction ID
    donor_name TEXT,
    donor_email TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    payment_status TEXT NOT NULL,                              -- 'succeeded', 'failed', 'refunded', 'disputed'
    refund_status TEXT,                                        -- 'full', 'partial', or NULL
    dispute_status TEXT,                                       -- 'needs_response', 'under_review', 'won', 'lost', or NULL
    reconciliation_type TEXT NOT NULL CHECK(reconciliation_type IN (
        'unmatched_direct_donor', 
        'ambiguous_match', 
        'refund_detected', 
        'dispute_detected', 
        'manual_request'
    )),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'resolved', 'dismissed')),
    assigned_intent_id TEXT,
    assigned_card_id TEXT,
    raw_payload TEXT,                                          -- Complete verified Zeffy payment JSON
    admin_notes TEXT,
    reviewed_by TEXT,                                          -- Administrator email
    reviewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(assigned_intent_id) REFERENCES donation_intents(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reconciliations_status 
    ON donation_reconciliations (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliations_payment_ref 
    ON donation_reconciliations (payment_reference);

-- 3. Create Polling Synchronization Watermark Table
CREATE TABLE IF NOT EXISTS reconciliation_sync_state (
    id TEXT PRIMARY KEY,                                       -- e.g. 'zeffy_poller'
    last_sync_timestamp TEXT NOT NULL,
    last_cursor TEXT,
    sync_count INTEGER DEFAULT 0,
    last_error TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed initial watermark row if absent
INSERT OR IGNORE INTO reconciliation_sync_state (id, last_sync_timestamp, sync_count)
VALUES ('zeffy_poller', datetime('now', '-7 days'), 0);

