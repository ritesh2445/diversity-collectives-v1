/**
 * Diversity Collective Ventura County — Automated Schema Migration Runner
 * Executes all 4 schema migrations (001, 002, 003, 004) sequentially against Turso libSQL
 * Sets up tables, indexes, triggers, full-text search (FTS5), and baseline seed records.
 */

export const SCHEMA_STATEMENTS = [
  // 1. Businesses Directory
  `CREATE TABLE IF NOT EXISTS businesses (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_businesses_status_city_category ON businesses (status, city, category)`,
  `CREATE INDEX IF NOT EXISTS idx_businesses_status_featured ON businesses (status, is_featured DESC, name ASC)`,
  `CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses (slug)`,
  `CREATE INDEX IF NOT EXISTS idx_businesses_cursor ON businesses (status, created_at DESC, id DESC)`,

  // 1B. Full-Text Search
  `CREATE VIRTUAL TABLE IF NOT EXISTS businesses_fts USING fts5(
    id UNINDEXED,
    name,
    description,
    category,
    city,
    content='businesses',
    content_rowid='rowid'
  )`,

  `CREATE TRIGGER IF NOT EXISTS businesses_ai AFTER INSERT ON businesses BEGIN
    INSERT INTO businesses_fts(rowid, id, name, description, category, city) 
    VALUES (new.rowid, new.id, new.name, new.description, new.category, new.city);
  END`,

  `CREATE TRIGGER IF NOT EXISTS businesses_ad AFTER DELETE ON businesses BEGIN
    INSERT INTO businesses_fts(businesses_fts, rowid, id, name, description, category, city) 
    VALUES('delete', old.rowid, old.id, old.name, old.description, old.category, old.city);
  END`,

  `CREATE TRIGGER IF NOT EXISTS businesses_au AFTER UPDATE ON businesses BEGIN
    INSERT INTO businesses_fts(businesses_fts, rowid, id, name, description, category, city) 
    VALUES('delete', old.rowid, old.id, old.name, old.description, old.category, old.city);
    INSERT INTO businesses_fts(rowid, id, name, description, category, city) 
    VALUES (new.rowid, new.id, new.name, new.description, new.category, new.city);
  END`,

  // 2. Business Corrections
  `CREATE TABLE IF NOT EXISTS business_corrections (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_business_corrections_status ON business_corrections (status, created_at DESC)`,

  // 3. Contact Submissions
  `CREATE TABLE IF NOT EXISTS contact_submissions (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_contact_submissions_status_date ON contact_submissions (status, created_at DESC)`,

  // 4. Volunteer Applications
  `CREATE TABLE IF NOT EXISTS volunteer_applications (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status_date ON volunteer_applications (status, created_at DESC)`,

  // 5. Training Bookings (P.R.I.D.E.)
  `CREATE TABLE IF NOT EXISTS training_bookings (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_training_bookings_status_date ON training_bookings (status, created_at DESC)`,

  // 6. Accessibility Barrier Reports
  `CREATE TABLE IF NOT EXISTS accessibility_feedback (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_a11y_feedback_status_date ON accessibility_feedback (status, created_at DESC)`,

  // 7. Newsletter Subscribers
  `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'website_footer',
    consent_timestamp TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    unsubscribed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_subscribers_active ON newsletter_subscribers (is_active, created_at DESC)`,

  // 8. Event RSVPs
  `CREATE TABLE IF NOT EXISTS event_rsvps (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    event_title TEXT NOT NULL,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    attendee_count INTEGER DEFAULT 1,
    accessibility_accommodations TEXT,
    status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled', 'waitlisted')),
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_status ON event_rsvps (event_id, status)`,

  // 9. Donation Appreciation Cards
  `CREATE TABLE IF NOT EXISTS donation_appreciation_cards (
    id TEXT PRIMARY KEY,
    card_token TEXT NOT NULL UNIQUE,
    token_hash TEXT,
    payment_reference TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL CHECK(tier IN ('community_ally', 'pride_advocate', 'rainbow_champion', 'visionary_benefactor')),
    tier_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    donor_display_name TEXT NOT NULL,
    donor_email_hash TEXT,
    recipient_email TEXT,
    is_anonymous INTEGER DEFAULT 0,
    is_opened INTEGER DEFAULT 0,
    opened_at TEXT,
    impact_message TEXT NOT NULL,
    frequency TEXT DEFAULT 'one-time',
    status TEXT DEFAULT 'active' CHECK(status IN (
      'pending_payment', 
      'pending_verification', 
      'active', 
      'manual_review', 
      'manual_hold', 
      'revoked_refunded', 
      'revoked_disputed', 
      'revoked_admin'
    )),
    revoked_at TEXT,
    revocation_reason TEXT,
    admin_notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_cards_token ON donation_appreciation_cards (card_token)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_token_hash ON donation_appreciation_cards (token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_status ON donation_appreciation_cards (status)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_payment_ref ON donation_appreciation_cards (payment_reference)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_tier_created ON donation_appreciation_cards (tier, created_at DESC)`,

  // 10. Webhook Events (Idempotency)
  `CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    payload_hash TEXT,
    status TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_webhook_events_id ON webhook_events (event_id)`,

  // 11. Admin Users & RBAC
  `CREATE TABLE IF NOT EXISTS admin_users (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email)`,
  `CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role, is_active)`,

  // 12. Admin Audit Logs
  `CREATE TABLE IF NOT EXISTS admin_audit_logs (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs (action, target_type)`,

  // 13. Donation Intents (Pre-Checkout Matching)
  `CREATE TABLE IF NOT EXISTS donation_intents (
    id TEXT PRIMARY KEY,
    intent_token TEXT NOT NULL UNIQUE,
    token_hash TEXT,
    donor_name TEXT,
    donor_email TEXT NOT NULL,
    donor_email_hash TEXT,
    expected_amount_cents INTEGER,
    amount_cents INTEGER,
    tier TEXT,
    frequency TEXT DEFAULT 'one-time',
    campaign TEXT DEFAULT 'diversity-collective-general-fund',
    is_anonymous INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'expired', 'manual_review', 'cancelled')),
    matched_payment_reference TEXT UNIQUE,
    card_token TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_intents_email_status ON donation_intents (donor_email, status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_intents_token ON donation_intents (intent_token)`,
  `CREATE INDEX IF NOT EXISTS idx_intents_matched_ref ON donation_intents (matched_payment_reference)`,

  // 14. Donation Reconciliations Queue
  `CREATE TABLE IF NOT EXISTS donation_reconciliations (
    id TEXT PRIMARY KEY,
    payment_reference TEXT NOT NULL UNIQUE,
    donor_name TEXT,
    donor_email TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    payment_status TEXT NOT NULL,
    refund_status TEXT,
    dispute_status TEXT,
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
    raw_payload TEXT,
    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(assigned_intent_id) REFERENCES donation_intents(id) ON DELETE SET NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_reconciliations_status ON donation_reconciliations (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_reconciliations_payment_ref ON donation_reconciliations (payment_reference)`,

  // 15. Reconciliation Sync State Watermark
  `CREATE TABLE IF NOT EXISTS reconciliation_sync_state (
    id TEXT PRIMARY KEY,
    last_sync_timestamp TEXT NOT NULL,
    last_cursor TEXT,
    sync_count INTEGER DEFAULT 0,
    last_error TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )`
];

export const INITIAL_SEEDS = [
  // Seed Zeffy Poller Watermark
  {
    sql: `INSERT OR IGNORE INTO reconciliation_sync_state (id, last_sync_timestamp, sync_count)
          VALUES ('zeffy_poller', datetime('now', '-7 days'), 0)`,
    args: []
  },

  // Seed Administrative Users (PBKDF2-SHA256 salted hash for 'DCVC-Admin-2026!')
  {
    sql: `INSERT OR REPLACE INTO admin_users (id, email, name, role, password_hash, salt, is_active)
          VALUES 
          ('adm-1', 'admin@diversitycollective.org', 'Tess Allen (Executive Director)', 'admin', '8b5a794966c62c2f0fcf6408226068222383c27e3848b61e27a69623e1e07297', 'dcvc_salt_2026', 1),
          ('adm-2', 'moderator@diversitycollective.org', 'Community Directory Moderator', 'approver', '8b5a794966c62c2f0fcf6408226068222383c27e3848b61e27a69623e1e07297', 'dcvc_salt_2026', 1),
          ('adm-3', 'editor@diversitycollective.org', 'Communications Specialist', 'editor', '8b5a794966c62c2f0fcf6408226068222383c27e3848b61e27a69623e1e07297', 'dcvc_salt_2026', 1),
          ('adm-4', 'board-observer@diversitycollective.org', 'Board Secretary (Audit)', 'read_only', '8b5a794966c62c2f0fcf6408226068222383c27e3848b61e27a69623e1e07297', 'dcvc_salt_2026', 1)`,
    args: []
  },

  // Seed Approved Business Directory Samples
  {
    sql: `INSERT OR REPLACE INTO businesses 
          (id, slug, name, category, description, address, city, zip, phone, email, website, logo_url, cover_url, is_featured, is_verified, status, affirming_pledge_signed_at)
          VALUES 
          ('biz-1', 'beacon-coffee-company', 'Beacon Coffee Company', 'Dining & Coffee', 'Artisanal, sustainably sourced specialty coffee roastery and welcoming community gathering spot with all-gender facilities and inclusive staff training.', '5777 Valentine Rd, Ventura, CA 93003', 'Ventura', '93003', '(805) 248-7054', 'hello@beaconcoffee.com', 'https://beaconcoffee.com', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/beacon-coffee-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/beacon-coffee-cover.jpg', 1, 1, 'approved', '2024-01-15T10:00:00Z'),
          ('biz-2', 'coastal-pride-counseling', 'Coastal Pride Counseling & Wellness', 'Health & Wellness', 'Trauma-informed, gender-affirming psychotherapy and mental health counseling specializing in LGBTQ+ youth, gender transitions, and couples therapy.', '1070 E Front St, Suite 200, Ventura, CA 93001', 'Ventura', '93001', '(805) 555-0144', 'care@coastalpridecounseling.com', 'https://example.com/coastal-pride', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/coastal-pride-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/coastal-pride-cover.jpg', 1, 1, 'approved', '2024-01-20T14:30:00Z'),
          ('biz-3', 'channel-islands-law-group', 'Channel Islands Inclusive Law Group', 'Legal & Financial', 'Full-service legal practice focusing on California legal name and gender-marker changes, estate planning for non-traditional families, and workplace advocacy.', '300 E Esplanade Dr, Suite 900, Oxnard, CA 93036', 'Oxnard', '93036', '(805) 555-0182', 'info@cilawgroup.example', 'https://example.com/cilaw', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/ci-law-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/ci-law-cover.jpg', 0, 1, 'approved', '2024-02-01T09:15:00Z'),
          ('biz-4', 'ojai-valley-botanicals', 'Ojai Valley Botanicals & Tea Lounge', 'Retail & Gifts', 'Queer-owned organic herbal dispensary, local artwork gallery, and safe community space hosting queer book clubs and acoustic open mics.', '214 E Ojai Ave, Ojai, CA 93023', 'Ojai', '93023', '(805) 555-0199', 'herbs@ojaibotanicals.example', 'https://example.com/ojai-botanicals', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/ojai-botanicals-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/ojai-botanicals-cover.jpg', 1, 1, 'approved', '2024-02-10T16:00:00Z'),
          ('biz-5', 'conejo-valley-fitness-collective', 'Conejo Valley Fitness Collective', 'Fitness & Recreation', 'Body-neutral, trans-inclusive functional movement studio with private changing suites, gender-neutral showers, and certified affirming personal trainers.', '145 E Thousand Oaks Blvd, Thousand Oaks, CA 91360', 'Thousand Oaks', '91360', '(805) 555-0123', 'train@conejofitness.example', 'https://example.com/conejofitness', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/conejo-fitness-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/conejo-fitness-cover.jpg', 0, 1, 'approved', '2024-02-15T11:45:00Z'),
          ('biz-6', 'pacific-view-design-studio', 'Pacific View Creative & Web Studio', 'Professional Services', 'Full-stack digital design, web accessibility auditing, and brand strategy studio partnering with non-profits, progressive campaigns, and queer creators.', '4001 Mission Oaks Blvd, Camarillo, CA 93012', 'Camarillo', '93012', '(805) 555-0167', 'create@pacificview.example', 'https://example.com/pacificview', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/pacific-view-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/pacific-view-cover.jpg', 1, 1, 'approved', '2024-02-20T13:00:00Z')`,
    args: []
  }
];

/**
 * Execute all schema migrations and baseline seeds
 */
export async function runAllMigrations(db) {
  if (!db) {
    throw new Error('Database client is not configured.');
  }

  const results = {
    executedStatements: 0,
    seedsApplied: 0,
    errors: [],
    tables: []
  };

  // Convert schema statements into executable objects
  const ddlStatements = SCHEMA_STATEMENTS
    .map(s => s.trim())
    .filter(Boolean)
    .map(sql => ({ sql, args: [] }));

  // Execute DDL statements in small batches (5 per batch) to respect subrequest limits
  // and prevent pipeline timeouts while grouping operations
  const CHUNK_SIZE = 5;
  for (let i = 0; i < ddlStatements.length; i += CHUNK_SIZE) {
    const chunk = ddlStatements.slice(i, i + CHUNK_SIZE);
    try {
      if (typeof db.batch === 'function') {
        await db.batch(chunk, 'deferred');
        results.executedStatements += chunk.length;
      } else {
        for (const item of chunk) {
          await db.execute(item);
          results.executedStatements++;
        }
      }
    } catch (err) {
      console.error(`Batch migration error on chunk starting at #${i + 1}:`, err.message);
      // Fallback: try individual statements in this chunk to identify specific failure
      for (let j = 0; j < chunk.length; j++) {
        try {
          await db.execute(chunk[j]);
          results.executedStatements++;
        } catch (singleErr) {
          results.errors.push({ statementIndex: i + j + 1, error: singleErr.message });
        }
      }
    }
  }

  // Run Baseline Seeds
  for (let s = 0; s < INITIAL_SEEDS.length; s++) {
    const seed = INITIAL_SEEDS[s];
    try {
      await db.execute({ sql: seed.sql, args: seed.args || [] });
      results.seedsApplied++;
    } catch (err) {
      console.warn(`Seed statement #${s + 1} skipped or error:`, err.message);
    }
  }

  // Fetch list of all active tables
  try {
    const tableRes = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`,
      args: []
    });
    results.tables = (tableRes.rows || []).map(r => r.name || r[0]);
  } catch (err) {
    console.error('Failed to list tables after migration:', err);
  }

  return results;
}
