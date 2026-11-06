-- Migration 002: Donation Appreciation Cards & Webhook Idempotency
-- Description: Supports DCVC Appreciation Cards and secure Zeffy webhook event processing

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

-- Webhook event log for auditability & idempotency guarantees
CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,            -- Zeffy event ID / idempotency token
    event_type TEXT NOT NULL,
    payload_hash TEXT,
    status TEXT NOT NULL,                     -- 'processed', 'ignored', 'failed'
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_id 
    ON webhook_events (event_id);

