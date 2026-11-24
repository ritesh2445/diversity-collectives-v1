/**
 * Diversity Collective Ventura County — Automated Backup & Disaster Recovery Utility
 * 
 * Target: Non-production verification of database, content, and configuration recovery.
 * Primary Backup Provider: Backblaze B2 Free Tier (10 GB Free Storage Allocation)
 * Supports:
 *  - Full JSON / SQL snapshot of Turso application tables & Sanity content schemas
 *  - AES-256-GCM Authenticated Encryption for sensitive database exports
 *  - Dual SHA-256 archive and ciphertext checksum validation
 *  - Retention cleanup enforcing 10 GB limit with inviolable protection of latest backup
 *  - Non-production restore verification test
 *  - RPO (Recovery Point Objective): < 24 Hours
 *  - RTO (Recovery Time Objective): < 15 Minutes
 */

import crypto from 'node:crypto';

export const BACKBLAZE_FREE_TIER_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
export const DEFAULT_RETENTION_DAYS = 14;

/**
 * Validate that an encryption key is a genuine, non-default 32-byte (64 hex characters) hex key
 */
export function assertValidEncryptionKey(hexKey) {
  if (!hexKey || typeof hexKey !== 'string') {
    throw new Error('Encryption rejected: BACKUP_ENCRYPTION_KEY is required and must be a string');
  }
  const cleanKey = hexKey.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    throw new Error('Encryption rejected: BACKUP_ENCRYPTION_KEY must be a valid 32-byte hexadecimal string (exactly 64 hex characters)');
  }
  return cleanKey;
}

/**
 * Compute a non-reversible cryptographic key fingerprint (SHA-256 slice).
 * Identifies which historical key was used to encrypt a package without exposing key material.
 */
export function generateKeyFingerprint(hexKey) {
  const validKey = assertValidEncryptionKey(hexKey);
  return crypto.createHash('sha256').update(validKey).digest('hex').slice(0, 16);
}

/**
 * Authoritative Topological Table Restoration Ordering
 * Resolves all foreign-key dependencies (Parents inserted before Children)
 */
export const TOPOLOGICAL_RESTORE_ORDER = [
  // 1. Independent Identity & Core Entity Tables
  'admin_users',
  'businesses',
  'donation_intents',
  'donation_appreciation_cards',
  'contact_submissions',
  'volunteer_applications',
  'training_bookings',
  'accessibility_feedback',
  'newsletter_subscribers',
  'event_rsvps',
  'webhook_events',
  'reconciliation_sync_state',
  'site_state',
  'voicemails',
  'media_suggestions',
  'community_group_joins',
  'community_group_broadcasts',
  'gallery_photos',
  'uploaded_documents',
  'admin_revoked_tokens',
  'admin_used_temp_tokens',
  'admin_email_otps',
  'admin_rate_limits',

  // 2. Dependent Child Tables Enforcing Foreign Key Integrity
  'business_corrections',       // FK -> businesses(id) ON DELETE CASCADE
  'admin_audit_logs',           // FK -> admin_users(id) ON DELETE SET NULL
  'donation_reconciliations'    // FK -> donation_intents(id) ON DELETE SET NULL
];

/**
 * Post-Restoration Security Hygiene Queries
 * Explicit policy to invalidate transient authentication records and prevent session replay:
 * 1. Bumps token_version for all admin users, invalidating all pre-disaster JWT sessions.
 * 2. Marks all pending or in-flight email OTPs as consumed and exhausted.
 * 3. Marks all temporary authentication and MFA tokens as consumed.
 * 4. Clears transient rate limit lockouts for clean operational access.
 * Note: admin_revoked_tokens records are preserved as-is so blacklisted tokens remain revoked.
 */
export const POST_RESTORE_SECURITY_QUERIES = [
  {
    name: 'bump_token_version',
    description: 'Invalidate all pre-disaster admin sessions by incrementing token version',
    sql: 'UPDATE admin_users SET token_version = COALESCE(token_version, 1) + 1;'
  },
  {
    name: 'invalidate_email_otps',
    description: 'Invalidate pending email OTPs to prevent code replay post-recovery',
    sql: 'UPDATE admin_email_otps SET consumed = 1, attempts = 5;'
  },
  {
    name: 'invalidate_temp_tokens',
    description: 'Invalidate temporary 2FA/MFA setup tokens',
    sql: 'UPDATE admin_used_temp_tokens SET consumed = 1;'
  },
  {
    name: 'reset_rate_limits',
    description: 'Reset transient IP and email rate limit counters',
    sql: 'DELETE FROM admin_rate_limits;'
  }
];

/**
 * Verify Foreign-Key Integrity Across Restored Tables
 * Evaluates all foreign key constraints before accepting restore.
 */
export function checkForeignKeyIntegrity(tablesData = {}) {
  const violations = [];

  // 1. business_corrections.business_id -> businesses.id
  if (Array.isArray(tablesData.business_corrections) && Array.isArray(tablesData.businesses)) {
    const businessIds = new Set(tablesData.businesses.map(b => b.id).filter(Boolean));
    for (const corr of tablesData.business_corrections) {
      if (corr.business_id && !businessIds.has(corr.business_id)) {
        violations.push({
          table: 'business_corrections',
          rowId: corr.id,
          fkColumn: 'business_id',
          targetTable: 'businesses',
          foreignKey: corr.business_id,
          error: `Foreign key violation: business_id '${corr.business_id}' does not exist in businesses table`
        });
      }
    }
  }

  // 2. admin_audit_logs.user_id -> admin_users.id (nullable)
  if (Array.isArray(tablesData.admin_audit_logs) && Array.isArray(tablesData.admin_users)) {
    const userIds = new Set(tablesData.admin_users.map(u => u.id).filter(Boolean));
    for (const log of tablesData.admin_audit_logs) {
      if (log.user_id && !userIds.has(log.user_id)) {
        violations.push({
          table: 'admin_audit_logs',
          rowId: log.id,
          fkColumn: 'user_id',
          targetTable: 'admin_users',
          foreignKey: log.user_id,
          error: `Foreign key violation: user_id '${log.user_id}' does not exist in admin_users table`
        });
      }
    }
  }

  // 3. donation_reconciliations.assigned_intent_id -> donation_intents.id (nullable)
  if (Array.isArray(tablesData.donation_reconciliations) && Array.isArray(tablesData.donation_intents)) {
    const intentIds = new Set(tablesData.donation_intents.map(i => i.id).filter(Boolean));
    for (const rec of tablesData.donation_reconciliations) {
      if (rec.assigned_intent_id && !intentIds.has(rec.assigned_intent_id)) {
        violations.push({
          table: 'donation_reconciliations',
          rowId: rec.id,
          fkColumn: 'assigned_intent_id',
          targetTable: 'donation_intents',
          foreignKey: rec.assigned_intent_id,
          error: `Foreign key violation: assigned_intent_id '${rec.assigned_intent_id}' does not exist in donation_intents table`
        });
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Generate a verified backup archive from in-memory or database records
 */
export async function createDatabaseSnapshot(tablesData = {}, metadata = {}) {
  const snapshotTimestamp = new Date().toISOString();
  const schemaVersion = '2026.1';
  
  const payload = {
    metadata: {
      organization: 'Diversity Collective Ventura County',
      domain: 'diversitycollective.org',
      snapshotTimestamp,
      schemaVersion,
      tablesIncluded: Object.keys(tablesData),
      ...metadata
    },
    tables: tablesData
  };

  const serialized = JSON.stringify(payload);
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(serialized));
  const checksum = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    archive: payload,
    checksum,
    sizeBytes: enc.encode(serialized).length
  };
}

/**
 * Encrypt sensitive database exports using AES-256-GCM authenticated encryption
 * Format: [12 bytes IV] + [16 bytes Auth Tag] + [Ciphertext]
 */
export function encryptPayload(dataBufferOrString, hexKey) {
  const validKey = assertValidEncryptionKey(hexKey);
  const key = Buffer.from(validKey, 'hex');

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const inputBuffer = Buffer.isBuffer(dataBufferOrString)
    ? dataBufferOrString
    : Buffer.from(typeof dataBufferOrString === 'string' ? dataBufferOrString : JSON.stringify(dataBufferOrString), 'utf8');

  const ciphertext = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack: IV (12) + Tag (16) + Ciphertext
  return Buffer.concat([iv, authTag, ciphertext]);
}

/**
 * Decrypt AES-256-GCM encrypted backup package
 */
export function decryptPayload(encryptedBuffer, hexKey) {
  const validKey = assertValidEncryptionKey(hexKey);
  const key = Buffer.from(validKey, 'hex');

  if (!Buffer.isBuffer(encryptedBuffer) || encryptedBuffer.length < 28) {
    throw new Error('Decryption rejected: Encrypted package buffer is malformed or too short');
  }

  const iv = encryptedBuffer.subarray(0, 12);
  const authTag = encryptedBuffer.subarray(12, 28);
  const ciphertext = encryptedBuffer.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Create a complete encrypted backup package ready for Backblaze B2 upload
 */
export async function createEncryptedBackupPackage(tablesData, hexKey, extraMetadata = {}) {
  // 1. Create plaintext snapshot
  const snapshot = await createDatabaseSnapshot(tablesData, extraMetadata);

  // 2. Encrypt plaintext payload with AES-256-GCM
  const serialized = JSON.stringify(snapshot.archive);
  const encryptedBuffer = encryptPayload(serialized, hexKey);

  // 3. Calculate SHA-256 of encrypted buffer
  const ciphertextHashBuffer = await crypto.subtle.digest('SHA-256', encryptedBuffer);
  const ciphertextChecksum = Array.from(new Uint8Array(ciphertextHashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const keyFingerprint = generateKeyFingerprint(hexKey);
  const backupId = `dcvc-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;

  const manifest = {
    backupId,
    provider: 'backblaze',
    targetBucket: extraMetadata.bucketName || 'dcvc-backups-production',
    createdAt: new Date().toISOString(),
    organization: 'Diversity Collective Ventura County',
    encryption: {
      algorithm: 'AES-256-GCM',
      keyLengthBits: 256,
      keyFingerprint,
      ivLengthBytes: 12,
      authTagLengthBytes: 16
    },
    integrity: {
      plaintextChecksumSha256: snapshot.checksum,
      ciphertextChecksumSha256: ciphertextChecksum
    },
    tablesIncluded: Object.keys(tablesData),
    recordCount: Object.values(tablesData).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0),
    plaintextSizeBytes: snapshot.sizeBytes,
    ciphertextSizeBytes: encryptedBuffer.length
  };

  return {
    backupId,
    manifest,
    encryptedBuffer,
    ciphertextChecksum,
    plaintextChecksum: snapshot.checksum
  };
}

/**
 * Verify integrity and decrypt a complete backup package from Backblaze B2
 */
export async function verifyAndDecryptBackupPackage(encryptedBuffer, manifest, hexKey) {
  if (!manifest || !manifest.integrity || !manifest.integrity.ciphertextChecksumSha256) {
    throw new Error('Verification failed: Manifest is missing or lacks ciphertext integrity hash');
  }

  // 1. Verify ciphertext SHA-256 checksum
  const ciphertextHashBuffer = await crypto.subtle.digest('SHA-256', encryptedBuffer);
  const computedCiphertextChecksum = Array.from(new Uint8Array(ciphertextHashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (computedCiphertextChecksum !== manifest.integrity.ciphertextChecksumSha256) {
    throw new Error('Integrity check failed: Ciphertext SHA-256 checksum mismatch (corrupted or tampered payload)');
  }

  // 2. Decrypt with AES-256-GCM
  const decryptedBuffer = decryptPayload(encryptedBuffer, hexKey);

  // 3. Verify plaintext SHA-256 checksum
  const plaintextHashBuffer = await crypto.subtle.digest('SHA-256', decryptedBuffer);
  const computedPlaintextChecksum = Array.from(new Uint8Array(plaintextHashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (computedPlaintextChecksum !== manifest.integrity.plaintextChecksumSha256) {
    throw new Error('Integrity check failed: Plaintext SHA-256 checksum mismatch after decryption');
  }

  const rawJson = decryptedBuffer.toString('utf8');
  const snapshot = {
    archive: JSON.parse(rawJson),
    checksum: computedPlaintextChecksum,
    sizeBytes: decryptedBuffer.length
  };

  const validation = await validateBackupArchive(snapshot);
  if (!validation.valid) {
    throw new Error(`Archive schema validation failed: ${validation.error}`);
  }

  return {
    valid: true,
    snapshot,
    manifest
  };
}

/**
 * Enforce retention policy on Backblaze B2 backup file inventory
 * Rule 1: Delete backups older than retentionDays
 * Rule 2: Ensure total storage stays under 10 GB
 * Rule 3 (INVIOLABLE): NEVER delete the most recent verified backup!
 */
export function enforceBackupRetention(backupList = [], options = {}) {
  const retentionDays = options.retentionDays || DEFAULT_RETENTION_DAYS;
  const storageLimitBytes = options.storageLimitBytes || BACKBLAZE_FREE_TIER_LIMIT_BYTES;
  const now = options.now ? new Date(options.now).getTime() : Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

  if (!Array.isArray(backupList) || backupList.length === 0) {
    return {
      toRetain: [],
      toDelete: [],
      totalStorageBytes: 0,
      quotaUsedPercent: 0
    };
  }

  // Sort descending by timestamp (newest first)
  const sorted = [...backupList].sort((a, b) => {
    const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return tB - tA;
  });

  const newestBackup = sorted[0];
  const toRetain = [newestBackup]; // Inviolable protection: newest is ALWAYS retained
  const toDelete = [];

  let currentStorageBytes = Number(newestBackup.sizeBytes || newestBackup.size || 0);

  // Process remaining backups
  for (let i = 1; i < sorted.length; i++) {
    const backup = sorted[i];
    const timestamp = new Date(backup.createdAt || backup.timestamp || 0).getTime();
    const ageMs = now - timestamp;
    const backupBytes = Number(backup.sizeBytes || backup.size || 0);

    const isExpired = ageMs > maxAgeMs;
    const wouldExceedLimit = (currentStorageBytes + backupBytes) > storageLimitBytes;

    if (isExpired || wouldExceedLimit) {
      toDelete.push({ ...backup, reason: isExpired ? 'expired_retention' : 'storage_quota_exceeded' });
    } else {
      toRetain.push(backup);
      currentStorageBytes += backupBytes;
    }
  }

  return {
    toRetain,
    toDelete,
    totalStorageBytes: currentStorageBytes,
    quotaUsedPercent: Number(((currentStorageBytes / storageLimitBytes) * 100).toFixed(2))
  };
}

/**
 * Validate backup archive integrity and checksum
 */
export async function validateBackupArchive(snapshot) {
  if (!snapshot || !snapshot.archive || !snapshot.checksum) {
    return { valid: false, error: 'Malformed archive: Missing archive data or checksum' };
  }

  const serialized = JSON.stringify(snapshot.archive);
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(serialized));
  const computedChecksum = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (computedChecksum !== snapshot.checksum) {
    return { valid: false, error: 'Checksum mismatch: Archive may be corrupted or tampered' };
  }

  const { metadata, tables } = snapshot.archive;
  if (!metadata || !tables) {
    return { valid: false, error: 'Archive missing metadata or tables object' };
  }

  let totalRecords = 0;
  for (const [, rows] of Object.entries(tables)) {
    if (Array.isArray(rows)) {
      totalRecords += rows.length;
    }
  }

  return {
    valid: true,
    schemaVersion: metadata.schemaVersion,
    snapshotTimestamp: metadata.snapshotTimestamp,
    tableCount: Object.keys(tables).length,
    totalRecords
  };
}

/**
 * Restore database records from verified backup archive
 * Enforces:
 *   1. Foreign-key topological ordering (parents before children)
 *   2. Strict foreign-key integrity validation (rejects orphaned child rows)
 *   3. Post-restore security hygiene (JWT token_version bump, OTP & temp token invalidation)
 */
export async function restoreDatabaseFromSnapshot(snapshot, mockDb = null, options = {}) {
  const validation = await validateBackupArchive(snapshot);
  if (!validation.valid) {
    throw new Error(`Restore rejected: ${validation.error}`);
  }

  const { tables } = snapshot.archive;

  // 1. Verify foreign-key constraints before accepting restore
  const fkCheck = checkForeignKeyIntegrity(tables);
  if (!fkCheck.valid) {
    const errorDetails = fkCheck.violations.map(v => v.error).join('; ');
    throw new Error(`Restore rejected: Foreign key integrity check failed! Detected ${fkCheck.violations.length} violation(s): ${errorDetails}`);
  }

  const restoredTables = {};

  // Determine restore ordering: order by TOPOLOGICAL_RESTORE_ORDER, followed by any remaining tables
  const presentTableNames = Object.keys(tables);
  const orderedTables = [
    ...TOPOLOGICAL_RESTORE_ORDER.filter(t => presentTableNames.includes(t)),
    ...presentTableNames.filter(t => !TOPOLOGICAL_RESTORE_ORDER.includes(t))
  ];

  for (const tableName of orderedTables) {
    const rows = tables[tableName];
    restoredTables[tableName] = Array.isArray(rows) ? rows.map(r => ({ ...r })) : [];
    
    // If mockDb is provided, populate it
    if (mockDb && typeof mockDb.insertMany === 'function') {
      await mockDb.insertMany(tableName, restoredTables[tableName]);
    }
  }

  // 2. Apply Post-Restore Security Hygiene
  const applyHygiene = options.applySecurityHygiene !== false;
  let securityApplied = false;

  if (applyHygiene) {
    // If database runner has an execute method, run SQL queries
    if (mockDb && typeof mockDb.execute === 'function') {
      for (const query of POST_RESTORE_SECURITY_QUERIES) {
        await mockDb.execute(query.sql);
      }
      securityApplied = true;
    } else {
      // In-memory application of security hygiene policies
      if (restoredTables.admin_users) {
        for (const user of restoredTables.admin_users) {
          user.token_version = (Number(user.token_version) || 1) + 1;
        }
        if (mockDb && typeof mockDb.insertMany === 'function') {
          await mockDb.insertMany('admin_users', restoredTables.admin_users);
        }
      }
      if (restoredTables.admin_email_otps) {
        for (const otp of restoredTables.admin_email_otps) {
          otp.consumed = 1;
          otp.attempts = 5;
        }
        if (mockDb && typeof mockDb.insertMany === 'function') {
          await mockDb.insertMany('admin_email_otps', restoredTables.admin_email_otps);
        }
      }
      if (restoredTables.admin_used_temp_tokens) {
        for (const temp of restoredTables.admin_used_temp_tokens) {
          temp.consumed = 1;
        }
        if (mockDb && typeof mockDb.insertMany === 'function') {
          await mockDb.insertMany('admin_used_temp_tokens', restoredTables.admin_used_temp_tokens);
        }
      }
      if (restoredTables.admin_rate_limits) {
        restoredTables.admin_rate_limits = [];
        if (mockDb && typeof mockDb.insertMany === 'function') {
          await mockDb.insertMany('admin_rate_limits', []);
        }
      }
      securityApplied = true;
    }
  }

  return {
    success: true,
    restoredAt: new Date().toISOString(),
    restoredTables: orderedTables,
    totalRecordsRestored: validation.totalRecords,
    foreignKeyIntegrity: 'verified',
    securityHygieneApplied: securityApplied
  };
}

