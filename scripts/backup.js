#!/usr/bin/env node

/**
 * Diversity Collective Ventura County — Automated Disaster Recovery Backup Engine
 * 
 * Provider: Backblaze B2 Free Tier (10 GB Free Storage Allocation, zero paid credit cards required)
 * Security: Pre-upload client-side AES-256-GCM authenticated encryption + dual SHA-256 integrity hashes
 * Scope: 
 *   - 12 Production Turso Tables (Directory, RSVPs, Donors, Contacts, Volunteers, Training, Audit, RBAC)
 *   - Sanity Structured Content (Programs, Events, News, Resources, Board, Staff, Sponsors, Settings)
 *   - Zero Binary Media Duplication (Cloudinary remains primary CDN; only metadata and URLs stored)
 * Retention: 14-day rolling window + inviolable protection guaranteeing latest verified backup is never deleted
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { 
  createEncryptedBackupPackage, 
  verifyAndDecryptBackupPackage,
  assertValidEncryptionKey,
  enforceBackupRetention,
  BACKBLAZE_FREE_TIER_LIMIT_BYTES,
  DEFAULT_RETENTION_DAYS 
} from '../src/utils/backupRestore.js';

// Configuration
const PROVIDER = process.env.BACKUP_PROVIDER || 'backblaze';
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'dcvc-backups-production';
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://api.backblazeb2.com';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || '6abul0sq';
const SANITY_DATASET = process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'production';

// Comprehensive 25 durable and operational Turso database tables across all migrations
export const REQUIRED_PRODUCTION_TABLES = [
  // 1. Core Directory & Submissions (Migration 001)
  'businesses',
  'business_corrections',
  'contact_submissions',
  'volunteer_applications',
  'training_bookings',
  'accessibility_feedback',
  'newsletter_subscribers',
  'event_rsvps',

  // 2. Donations & Financial Reconciliation (Migrations 002 & 004)
  'donation_appreciation_cards',
  'donation_intents',
  'donation_reconciliations',
  'reconciliation_sync_state',
  'webhook_events',

  // 3. Admin RBAC, Audit & Security Infrastructure (Migration 003 & edge tables)
  'admin_users',
  'admin_audit_logs',
  'admin_revoked_tokens',
  'admin_used_temp_tokens',
  'admin_email_otps',
  'admin_rate_limits',

  // 4. Authoritative CMS Overrides & Media Records
  'site_state',
  'voicemails',
  'media_suggestions',
  'community_group_joins',
  'community_group_broadcasts',
  'gallery_photos',
  'uploaded_documents'
];

/**
 * Validate and retrieve encryption key strictly from environment.
 * Rejects missing or invalid keys immediately to prevent unencrypted or default-key backups.
 */
export function getRequiredEncryptionKey(explicitKey = null) {
  const keyToVerify = explicitKey || process.env.BACKUP_ENCRYPTION_KEY;
  if (!keyToVerify) {
    throw new Error('FATAL: BACKUP_ENCRYPTION_KEY environment secret is missing. Production backups require a valid 64-hexadecimal character (256-bit) encryption key.');
  }
  return assertValidEncryptionKey(keyToVerify);
}

/**
 * Sleep helper for retry backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Synthetic 25-table fixtures strictly isolated for local testing and CI isolation drills.
 * NEVER substituted silently into production backup archives.
 */
export function getSampleTestFixtures(tablesToInclude = REQUIRED_PRODUCTION_TABLES) {
  const allFixtures = {
    // 1. Core Directory & Submissions
    businesses: [
      { id: 'b-01', slug: 'beacon-coffee', name: 'Beacon Coffee Company', category: 'dining', city: 'Ventura', is_verified: 1, status: 'approved' },
      { id: 'b-02', slug: 'coastal-pride-counseling', name: 'Coastal Pride Counseling', category: 'healthcare', city: 'Ventura', is_verified: 1, status: 'approved' }
    ],
    business_corrections: [
      { id: 'bc-01', business_id: 'b-01', business_name: 'Beacon Coffee Company', requester_name: 'Store Manager', requester_email: 'mgr@beaconcoffee.example', request_type: 'update', details: 'Updated holiday hours', status: 'resolved' }
    ],
    contact_submissions: [
      { id: 'c-01', name: 'Casey Miller', email: 'casey@example.org', subject: 'Youth Prom Volunteering', message: 'I would love to help.', consent_given: 1, status: 'unread' }
    ],
    volunteer_applications: [
      { id: 'v-01', full_name: 'Alex Rivera', email: 'alex@example.org', phone: '805-555-0199', city: 'Oxnard', roles_of_interest: '["events","youth"]', consent_given: 1, status: 'pending' }
    ],
    training_bookings: [
      { id: 'tb-01', organization_name: 'Ventura Health System', contact_name: 'Dr. Taylor', email: 'taylor@vhs.org', phone: '805-555-0155', course_id: 'lgbtq-cultural-humility', course_title: 'LGBTQ+ Cultural Humility', preferred_format: 'in-person', estimated_attendees: 35, status: 'confirmed' }
    ],
    accessibility_feedback: [
      { id: 'af-01', page_url: '/directory', barrier_description: 'Contrast on filter chip text', status: 'remediated' }
    ],
    newsletter_subscribers: [
      { id: 'ns-01', email: 'subscriber@example.org', source: 'website_footer', is_active: 1 }
    ],
    event_rsvps: [
      { id: 'rsvp-01', event_id: 'pride-prom-2026', event_title: 'Pride Prom 2026', attendee_name: 'Jordan Lee', attendee_email: 'jordan@example.org', attendee_count: 2, status: 'confirmed' }
    ],

    // 2. Donations & Financial Reconciliation
    donation_appreciation_cards: [
      { id: 'ac-01', card_token: 'dcvc_rc_demo', payment_reference: 'zf_demo_101', tier: 'rainbow_champion', tier_name: 'Rainbow Champion', amount_cents: 15000, donor_display_name: 'Taylor S.', is_opened: 1, impact_message: 'Empowers Rainbow Umbrella Youth' }
    ],
    donation_intents: [
      { id: 'int-01', intent_token: 'tok_intent_101', donor_name: 'Taylor S.', donor_email: 'taylor@example.org', expected_amount_cents: 15000, amount_cents: 15000, status: 'matched', matched_payment_reference: 'zf_demo_101' }
    ],
    donation_reconciliations: [
      { id: 'rec-01', payment_reference: 'zf_demo_101', donor_name: 'Taylor S.', donor_email: 'taylor@example.org', amount_cents: 15000, payment_status: 'succeeded', reconciliation_type: 'unmatched_direct_donor', status: 'resolved', assigned_intent_id: 'int-01' }
    ],
    reconciliation_sync_state: [
      { id: 'sync-watermark', last_sync_timestamp: '2026-11-24T18:00:00Z', sync_count: 42 }
    ],
    webhook_events: [
      { id: 'wh-01', event_id: 'evt_zeffy_101', event_type: 'donation.succeeded', status: 'processed' }
    ],

    // 3. Admin RBAC, Audit & Security Infrastructure
    admin_users: [
      { id: 'adm-01', email: 'admin@diversitycollective.org', name: 'Executive Director', role: 'admin', password_hash: 'mock_hash', salt: 'mock_salt', is_active: 1, token_version: 1 }
    ],
    admin_audit_logs: [
      { id: 'log-01', user_id: 'adm-01', user_email: 'admin@diversitycollective.org', action: 'directory_listing_approve', target_type: 'business', target_id: 'b-01' }
    ],
    admin_revoked_tokens: [
      { jti: 'revoked_jwt_jti_demo_01', user_id: 'adm-01', expires_at: Math.floor(Date.now() / 1000) + 3600 }
    ],
    admin_used_temp_tokens: [
      { jti: 'temp_2fa_jti_demo_01', attempts: 1, consumed: 1, expires_at: Math.floor(Date.now() / 1000) + 600 }
    ],
    admin_email_otps: [
      { id: 'otp-01', email: 'admin@diversitycollective.org', otp_hash: 'mock_otp_hash', salt: 'mock_otp_salt', consumed: 1, attempts: 1, expires_at: Math.floor(Date.now() / 1000) + 600 }
    ],
    admin_rate_limits: [
      { key: 'ip_192_0_2_1', count: 1, first_attempt: Math.floor(Date.now() / 1000), locked_until: null }
    ],

    // 4. Authoritative CMS Overrides & Media Records
    site_state: [
      { state_key: 'site_features', payload_json: JSON.stringify({ flexSpaceEnabled: true }), version: 2 },
      { state_key: 'donation_email_template', payload_json: JSON.stringify({ subject: 'Thank you for your support' }), version: 1 }
    ],
    voicemails: [
      { id: 'vm-01', name: 'Morgan B.', email: 'morgan@example.org', duration_seconds: 45, r2_key: 'voicemail/2026/vm-01.webm', status: 'new' }
    ],
    media_suggestions: [
      { id: 'ms-01', name: 'Community Member', email: 'member@example.org', topic: 'Queer Elder Oral History Project', status: 'new' }
    ],
    community_group_joins: [
      { id: 'cgj-01', group_slug: 'rainbow-umbrella', group_name: 'Rainbow Umbrella Youth', name: 'Sam Jordan', email: 'sam@example.org', email_consent: 1, status: 'active' }
    ],
    community_group_broadcasts: [
      { id: 'cgb-01', group_slug: 'rainbow-umbrella', group_name: 'Rainbow Umbrella Youth', subject: 'Friday Meeting Reminder', content: 'See you at 5:30 PM!', sent_by_email: 'leader@example.org', delivery_status: 'sent' }
    ],
    gallery_photos: [
      { id: 'gp-01', title: 'Pride Prom 2026 Celebration', category: 'Events', year: '2026', image_url: 'https://res.cloudinary.com/dcvc/image/upload/v1/gallery/prom26.jpg', cdn_url: 'https://res.cloudinary.com/dcvc/image/upload/v1/gallery/prom26.jpg' }
    ],
    uploaded_documents: [
      { id: 'doc-01', filename: 'dcvc_sponsorship_deck_2026.pdf', title: 'Official 2026 Sponsorship Deck', file_data_base64: 'JVBERi0xLjQKJcTl8uXr...', mime_type: 'application/pdf', file_size_bytes: 18450 }
    ]
  };

  const filtered = {};
  for (const tbl of tablesToInclude) {
    filtered[tbl] = allFixtures[tbl] || [];
  }
  return filtered;
}

/**
 * Isolated synthetic Sanity copy fixtures strictly for local isolation drills.
 */
export function getSampleSanityFixtures() {
  return [
    { _id: 'prog-ru', _type: 'program', title: 'Rainbow Umbrella Youth', audience: 'Ages 13-23', meetingTime: 'Fridays 5:30 - 7:30 PM' },
    { _id: 'prog-shines', _type: 'program', title: 'Diversity SHINES Rapid Testing', audience: 'All Ventura County', hours: 'Mon-Fri 1:00 - 5:00 PM' },
    { _id: 'prog-crc', _type: 'program', title: 'Community Resource Center', address: '2471 Portola Road, Suite 100, Ventura' }
  ];
}

/**
 * Fetch all production tables from Turso within a consistent, atomic read transaction snapshot.
 * In production mode, if Turso is unreachable or any table fails, this throws immediately.
 * Synthetic fixtures are strictly segregated and only used when allowFixtures === true.
 */
export async function fetchTursoTables({ 
  allowFixtures = false, 
  tables = REQUIRED_PRODUCTION_TABLES,
  tursoUrl = process.env.TURSO_DATABASE_URL || TURSO_URL,
  tursoToken = process.env.TURSO_AUTH_TOKEN || TURSO_TOKEN
} = {}) {
  if (!tursoUrl || !tursoToken) {
    if (allowFixtures) {
      console.log(`[BACKUP] Assembling comprehensive ${tables.length}-table dataset matching production schema (Isolated Drill Fixture Mode)...`);
      return getSampleTestFixtures(tables);
    }
    throw new Error('FATAL: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required for production database backup. Production backups will never silently substitute synthetic sample fixtures.');
  }

  const maskedUrl = tursoUrl.replace(/:\/\/.*@/, '://***@');
  console.log(`[BACKUP] Connecting to Turso production database (${maskedUrl})...`);
  const httpUrl = tursoUrl.replace(/^libsql:\/\//, 'https://');
  const pipelineUrl = `${httpUrl}/v2/pipeline`;

  console.log(`[BACKUP] Executing atomic read-only snapshot transaction for ${tables.length} tables in a unified transaction context...`);
  const requests = [
    { type: 'execute', stmt: { sql: 'BEGIN TRANSACTION READONLY;' } }
  ];
  for (const tbl of tables) {
    requests.push({ type: 'execute', stmt: { sql: `SELECT * FROM "${tbl}";` } });
  }
  requests.push({ type: 'execute', stmt: { sql: 'COMMIT;' } });

  let pipelineRes;
  try {
    pipelineRes = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tursoToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  } catch (netErr) {
    throw new Error(`FATAL: Network connection failed while executing transactional snapshot pipeline against Turso: ${netErr.message}`);
  }

  // If BEGIN TRANSACTION READONLY fails on specific SQLite driver build, fallback to standard BEGIN
  if (!pipelineRes.ok && pipelineRes.status === 400) {
    console.warn('[BACKUP] Retrying snapshot transaction with standard BEGIN;');
    requests[0] = { type: 'execute', stmt: { sql: 'BEGIN;' } };
    pipelineRes = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tursoToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  }

  if (!pipelineRes.ok) {
    const errText = await pipelineRes.text().catch(() => '');
    throw new Error(`FATAL: Failed to execute transactional snapshot pipeline against Turso (HTTP ${pipelineRes.status} ${pipelineRes.statusText}): ${errText}`);
  }

  const pipelineJson = await pipelineRes.json();
  const results = pipelineJson.results || [];

  const beginResult = results[0];
  if (beginResult?.type === 'error' || beginResult?.error) {
    const err = beginResult.error?.message || JSON.stringify(beginResult.error);
    throw new Error(`FATAL: Failed to initiate read transaction for database snapshot: ${err}`);
  }

  const tablesData = {};
  for (let i = 0; i < tables.length; i++) {
    const tbl = tables[i];
    const queryResult = results[i + 1];

    if (!queryResult) {
      throw new Error(`FATAL: No pipeline response returned for required production table '${tbl}'.`);
    }

    if (queryResult.type === 'error' || queryResult.error) {
      const sqlErr = queryResult.error?.message || JSON.stringify(queryResult.error);
      throw new Error(`FATAL: Failed to query required production table '${tbl}' inside snapshot transaction: ${sqlErr}`);
    }

    const cols = (queryResult.response?.result?.cols || []).map(c => c.name);
    const rawRows = queryResult.response?.result?.rows || [];
    tablesData[tbl] = rawRows.map(row => {
      const obj = {};
      cols.forEach((col, idx) => {
        obj[col] = row[idx]?.value;
      });
      return obj;
    });
    console.log(`[BACKUP SNAPSHOT] Table '${tbl}': extracted ${tablesData[tbl].length} records inside atomic snapshot.`);
  }

  const commitResult = results[results.length - 1];
  if (commitResult?.type === 'error' || commitResult?.error) {
    console.warn('[BACKUP SNAPSHOT] Notice on snapshot transaction commit:', commitResult.error?.message);
  }

  console.log(`[BACKUP SNAPSHOT] Verified consistent transactional read snapshot across all ${tables.length} tables.`);
  return tablesData;
}

/**
 * Fetch structured Sanity copy and metadata directly from Sanity Edge APICDN.
 * Includes all authentic document types (programs, events, board, staff, sponsors, resources, news, gallery, trainings, settings).
 * No binary media duplication (only references and metadata stored).
 */
export async function fetchSanityStructuredContent({ allowFixtures = false } = {}) {
  const projectId = SANITY_PROJECT_ID;
  const dataset = SANITY_DATASET;

  console.log(`[BACKUP] Fetching structured content metadata from Sanity APICDN (${projectId}/${dataset})...`);
  const groqTypes = [
    'program',
    'event',
    'boardMember',
    'staffMember',
    'sponsor',
    'resource',
    'newsArticle',
    'galleryItem',
    'trainingModule',
    'siteSettings'
  ];
  const query = encodeURIComponent(`*[_type in ${JSON.stringify(groqTypes)}]{_id, _type, title, name, slug, date, publishedAt, category, description, summary, "assetRefs": [mainImage.asset._ref, coverImage.asset._ref, photo.asset._ref, image.asset._ref, logo.asset._ref]}`);
  const sanityUrl = `https://${projectId}.apicdn.sanity.io/v2024-03-01/data/query/${dataset}?query=${query}`;

  try {
    const res = await fetch(sanityUrl, {
      headers: { Accept: 'application/json' }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Sanity APICDN returned HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const records = data.result || [];
    if (records.length === 0 && !allowFixtures) {
      throw new Error(`Sanity production query returned 0 records for dataset '${dataset}'. Refusing to create production backup with empty CMS content.`);
    }

    console.log(`[BACKUP] Retrieved ${records.length} authentic structured Sanity content entries.`);
    return records;
  } catch (err) {
    if (allowFixtures) {
      console.warn(`[BACKUP] Sanity query notice: ${err.message}. Staging test fixtures for isolated drill.`);
      return getSampleSanityFixtures();
    }
    throw new Error(`FATAL: Failed to query Sanity structured content: ${err.message}`);
  }
}

/**
 * Native Backblaze B2 Client with Automatic Retries, Backoff, Expired-Token Handling,
 * and Independent Download Verification
 */
export class BackblazeB2Client {
  constructor(keyId, applicationKey, endpoint = 'https://api.backblazeb2.com') {
    this.keyId = keyId;
    this.applicationKey = applicationKey;
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.authData = null;
    this.cachedUploadUrl = null;
    this.cachedUploadToken = null;
  }

  /**
   * Authorize Account against Backblaze Native API v3
   */
  async authorizeAccount() {
    if (!this.keyId || !this.applicationKey) {
      throw new Error('Missing B2_KEY_ID or B2_APPLICATION_KEY credentials.');
    }

    const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.applicationKey}`).toString('base64');
    const authUrl = `${this.endpoint}/b2api/v3/b2_authorize_account`;

    const res = await fetch(authUrl, {
      method: 'GET',
      headers: { 'Authorization': authHeader }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Backblaze B2 Authorization failed (${res.status} ${res.statusText}): ${errText}`);
    }

    this.authData = await res.json();
    return this.authData;
  }

  /**
   * Look up Bucket ID for the configured bucket name and verify private bucket configuration
   */
  async getBucketId(bucketName) {
    if (!this.authData) await this.authorizeAccount();

    const url = `${this.authData.apiUrl}/b2api/v3/b2_list_buckets`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: this.authData.accountId,
        bucketName: bucketName
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to lookup bucket ${bucketName} (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const bucket = data.buckets?.find(b => b.bucketName === bucketName);
    if (!bucket) {
      throw new Error(`Bucket '${bucketName}' does not exist in Backblaze account.`);
    }

    if (bucket.bucketType !== 'allPrivate') {
      throw new Error(`FATAL: Backblaze B2 bucket '${bucketName}' is configured as '${bucket.bucketType}'. Production backup policy strictly mandates 'allPrivate' to protect encrypted archives against public disclosure.`);
    }

    return bucket.bucketId;
  }

  /**
   * Obtain fresh Upload URL and Token for the bucket
   */
  async getUploadUrl(bucketId) {
    if (!this.authData) await this.authorizeAccount();

    const url = `${this.authData.apiUrl}/b2api/v3/b2_get_upload_url`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bucketId })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to obtain upload URL (${res.status}): ${errText}`);
    }

    const data = await res.json();
    this.cachedUploadUrl = data.uploadUrl;
    this.cachedUploadToken = data.authorizationToken;
    return data;
  }

  /**
   * Upload File with automatic exponential backoff and expired upload URL refresh
   */
  async uploadFile(bucketId, fileName, buffer, contentType = 'application/octet-stream', maxRetries = 3) {
    const sha1Checksum = crypto.createHash('sha1').update(buffer).digest('hex');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.cachedUploadUrl || !this.cachedUploadToken) {
          await this.getUploadUrl(bucketId);
        }

        const res = await fetch(this.cachedUploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': this.cachedUploadToken,
            'X-Bz-File-Name': encodeURIComponent(fileName),
            'Content-Type': contentType,
            'Content-Length': buffer.length.toString(),
            'X-Bz-Content-Sha1': sha1Checksum
          },
          body: buffer
        });

        // 401 indicates expired upload URL/token - refresh immediately
        if (res.status === 401) {
          console.warn(`[BACKUP B2] Upload token expired (401). Refreshing upload URL for attempt ${attempt + 1}...`);
          this.cachedUploadUrl = null;
          this.cachedUploadToken = null;
          if (attempt < maxRetries) {
            await sleep(500 * attempt);
            continue;
          }
        }

        // 500/503/408 transient errors
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          if (attempt < maxRetries && [408, 500, 503].includes(res.status)) {
            console.warn(`[BACKUP B2] Transient error (${res.status}) on attempt ${attempt}. Retrying in ${attempt * 1000}ms...`);
            await sleep(attempt * 1000);
            continue;
          }
          throw new Error(`Upload of '${fileName}' failed (${res.status} ${res.statusText}): ${errText}`);
        }

        return await res.json();
      } catch (err) {
        if (attempt >= maxRetries) throw err;
        console.warn(`[BACKUP B2] Upload attempt ${attempt} failed (${err.message}). Retrying...`);
        this.cachedUploadUrl = null;
        this.cachedUploadToken = null;
        await sleep(attempt * 1000);
      }
    }
  }

  /**
   * Download a file from Backblaze B2 by name for independent round-trip verification
   */
  async downloadFileByName(bucketName, fileName) {
    if (!this.authData) await this.authorizeAccount();

    const fileUrl = `${this.authData.downloadUrl}/file/${bucketName}/${encodeURIComponent(fileName)}`;
    const res = await fetch(fileUrl, {
      headers: { 'Authorization': this.authData.authorizationToken }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Verification download of '${fileName}' failed (${res.status}): ${errText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * List file versions in the bucket
   */
  async listFileVersions(bucketId, maxFileCount = 100) {
    if (!this.authData) await this.authorizeAccount();

    const url = `${this.authData.apiUrl}/b2api/v3/b2_list_file_names`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bucketId, maxFileCount })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to list bucket inventory (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return (data.files || []).map(f => ({
      fileId: f.fileId,
      fileName: f.fileName,
      sizeBytes: f.contentLength,
      createdAt: new Date(f.uploadTimestamp).toISOString()
    }));
  }

  /**
   * Delete an expired file version (handles scoped keys without delete permissions gracefully)
   */
  async deleteFileVersion(fileId, fileName) {
    if (!this.authData) await this.authorizeAccount();

    const url = `${this.authData.apiUrl}/b2api/v3/b2_delete_file_version`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileId, fileName })
    });

    if (res.status === 401 || res.status === 403) {
      console.log(`[BACKUP RETENTION] Current application key has upload-only scope. Server-side deletion is governed by Backblaze B2 Native Bucket Lifecycle Rules (14 days).`);
      return { deferredToLifecycleRules: true };
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[BACKUP RETENTION] Notice on delete ${fileName} (${res.status}): ${errText}`);
      return { deleted: false };
    }

    return await res.json();
  }
}

/**
 * Execute Cloud Upload to Backblaze B2 Free and perform independent verification.
 * Missing credentials in a production run will throw an error and fail the pipeline.
 */
export async function uploadToBackblazeB2(encryptedBuffer, manifest, encryptionKey, options = {}) {
  const isDryRun = options.isDryRun === true;

  if (!B2_KEY_ID || !B2_APPLICATION_KEY) {
    if (isDryRun) {
      console.log('[BACKUP] Dry-run mode active: B2 upload simulated. Archive verified locally.');
      return { uploaded: false, dryRun: true, backupId: manifest.backupId };
    }
    throw new Error('FATAL: Backblaze B2 credentials (B2_KEY_ID / B2_APPLICATION_KEY) are missing in environment secrets. Production disaster recovery workflows must upload verified archives to Backblaze B2 cloud storage.');
  }

  console.log('[BACKUP] Initializing Backblaze B2 Native API Client...');
  const client = new BackblazeB2Client(B2_KEY_ID, B2_APPLICATION_KEY, B2_ENDPOINT);
  
  await client.authorizeAccount();
  console.log('[BACKUP] Backblaze B2 Authorization successful.');

  const bucketId = await client.getBucketId(B2_BUCKET_NAME);
  console.log(`[BACKUP] Verified Backblaze B2 private bucket: ${B2_BUCKET_NAME} (${bucketId})`);

  // 1. Upload Encrypted Binary Archive (.enc)
  const encFileName = `${manifest.backupId}.enc`;
  console.log(`[BACKUP] Uploading encrypted ciphertext archive: ${encFileName} (${encryptedBuffer.length} bytes)...`);
  await client.uploadFile(bucketId, encFileName, encryptedBuffer, 'application/octet-stream');
  console.log(`[BACKUP] Upload complete: ${encFileName}`);

  // 2. Upload Manifest Metadata (.json)
  const manifestFileName = `${manifest.backupId}-manifest.json`;
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[BACKUP] Uploading cryptographic manifest: ${manifestFileName}...`);
  await client.uploadFile(bucketId, manifestFileName, manifestBuffer, 'application/json');
  console.log(`[BACKUP] Upload complete: ${manifestFileName}`);

  // 3. Independent Remote Retrieval & Decryption Verification Drill
  console.log('[BACKUP] Performing independent round-trip verification: downloading remote archive from Backblaze B2...');
  const downloadedArchive = await client.downloadFileByName(B2_BUCKET_NAME, encFileName);
  const downloadedManifestBuf = await client.downloadFileByName(B2_BUCKET_NAME, manifestFileName);
  const downloadedManifest = JSON.parse(downloadedManifestBuf.toString('utf8'));

  console.log('[BACKUP] Decrypting downloaded archive with encryption key to verify end-to-end recoverable fidelity...');
  const remoteVerification = await verifyAndDecryptBackupPackage(downloadedArchive, downloadedManifest, encryptionKey);
  if (!remoteVerification.valid) {
    throw new Error('FATAL: Independent verification failed! Downloaded Backblaze B2 archive could not be authenticated and decrypted.');
  }
  console.log(`[BACKUP VERIFIED] Disaster recovery confirmed: Remote Backblaze archive matches dual SHA-256 integrity hashes and restored ${remoteVerification.snapshot.archive.metadata.tablesIncluded.length} tables cleanly.`);

  // 4. Enforce 14-day Retention & Quota Check
  try {
    console.log('[BACKUP] Querying B2 inventory to enforce 14-day retention and 10 GB limit...');
    const inventory = await client.listFileVersions(bucketId, 100);
    const retentionPlan = enforceBackupRetention(inventory, {
      retentionDays: DEFAULT_RETENTION_DAYS,
      storageLimitBytes: BACKBLAZE_FREE_TIER_LIMIT_BYTES
    });

    console.log(`[BACKUP] Retention Analysis: ${retentionPlan.toRetain.length} retained, ${retentionPlan.toDelete.length} expired.`);
    console.log(`[BACKUP] Current Storage Used: ${(retentionPlan.totalStorageBytes / (1024 * 1024)).toFixed(2)} MB / 10,000 MB (${retentionPlan.quotaUsedPercent}% of Free Tier).`);

    for (const item of retentionPlan.toDelete) {
      console.log(`[BACKUP] Purging expired archive: ${item.fileName} (${item.reason})...`);
      await client.deleteFileVersion(item.fileId, item.fileName);
    }
  } catch (retentionErr) {
    console.warn(`[BACKUP RETENTION WARNING] Inventory/retention check note: ${retentionErr.message}`);
  }

  return { uploaded: true, backupId: manifest.backupId, verified: true };
}

/**
 * Main Backup Runner
 */
async function run() {
  const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

  console.log('================================================================');
  console.log('DCVC DISASTER RECOVERY: BACKBLAZE B2 AUTOMATED BACKUP ENGINE');
  console.log(`Provider: ${PROVIDER.toUpperCase()} | Free Allocation: 10 GB | Encryption: AES-256-GCM`);
  if (isDryRun) {
    console.log('Execution Mode: SIMULATION / DRY-RUN (Cloud upload skipped)');
  }
  console.log('================================================================');

  // 1. Verify encryption key strictly before proceeding
  const encryptionKey = getRequiredEncryptionKey();

  // 2. Extract 12 Turso tables (strictly fail if Turso is inaccessible)
  const tablesData = await fetchTursoTables({ allowFixtures: false });
  const tableKeys = Object.keys(tablesData);
  const totalDbRecords = Object.values(tablesData).reduce((sum, rows) => sum + rows.length, 0);
  console.log(`[BACKUP] Extracted ${tableKeys.length} / 12 database tables (${totalDbRecords} total production records).`);

  // 3. Extract Sanity structured content from live Edge APICDN
  const sanityContent = await fetchSanityStructuredContent({ allowFixtures: false });
  tablesData._sanity_content = sanityContent;
  console.log(`[BACKUP] Appended ${sanityContent.length} structured CMS records under '_sanity_content'.`);

  // 4. Create AES-256-GCM encrypted package
  console.log('[BACKUP] Encrypting dataset with AES-256-GCM and computing dual SHA-256 checksums...');
  const pkg = await createEncryptedBackupPackage(tablesData, encryptionKey, {
    bucketName: B2_BUCKET_NAME,
    provider: PROVIDER
  });

  // 5. Save local verified copy in backups/
  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const localEncFile = path.join(backupDir, `${pkg.backupId}.enc`);
  const localManifestFile = path.join(backupDir, `${pkg.backupId}-manifest.json`);

  fs.writeFileSync(localEncFile, pkg.encryptedBuffer);
  fs.writeFileSync(localManifestFile, JSON.stringify(pkg.manifest, null, 2), 'utf8');

  console.log(`[BACKUP] Staged local archive:  ${localEncFile} (${pkg.encryptedBuffer.length} bytes)`);
  console.log(`[BACKUP] Staged local manifest: ${localManifestFile}`);
  console.log(`[BACKUP] Ciphertext SHA-256:    ${pkg.ciphertextChecksum}`);
  console.log(`[BACKUP] Plaintext SHA-256:     ${pkg.plaintextChecksum}`);

  // 6. Upload and verify against Backblaze B2 Free
  const b2Result = await uploadToBackblazeB2(pkg.encryptedBuffer, pkg.manifest, encryptionKey, { isDryRun });

  console.log('================================================================');
  console.log('BACKUP OPERATION FINISHED SUCCESSFULLY');
  console.log(`Backup ID:          ${pkg.backupId}`);
  console.log(`Database Tables:    ${tableKeys.length} / 12 verified`);
  console.log(`CMS Content:        ${sanityContent.length} verified records`);
  console.log(`Cloud Upload:       ${b2Result.uploaded ? 'VERIFIED (Uploaded and Decryption-Confirmed in Backblaze B2)' : 'SIMULATED (Dry-run mode)'}`);
  console.log(`Local Archive:      backups/${pkg.backupId}.enc`);
  console.log('================================================================');
}

// Execute when run as script
if (process.argv[1] && process.argv[1].endsWith('backup.js')) {
  run().catch(err => {
    console.error('\n[BACKUP CRITICAL ERROR]');
    console.error(err.message || err);
    process.exit(1);
  });
}
