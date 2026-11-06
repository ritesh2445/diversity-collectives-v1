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
  if (!hexKey) {
    throw new Error('Encryption rejected: BACKUP_ENCRYPTION_KEY is required');
  }
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== 32) {
    throw new Error('Encryption rejected: BACKUP_ENCRYPTION_KEY must be a 32-byte (64 hex characters) key');
  }

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
  if (!hexKey) {
    throw new Error('Decryption rejected: BACKUP_ENCRYPTION_KEY is required');
  }
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== 32) {
    throw new Error('Decryption rejected: BACKUP_ENCRYPTION_KEY must be a 32-byte (64 hex characters) key');
  }

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
 */
export async function restoreDatabaseFromSnapshot(snapshot, mockDb = null) {
  const validation = await validateBackupArchive(snapshot);
  if (!validation.valid) {
    throw new Error(`Restore rejected: ${validation.error}`);
  }

  const restoredTables = {};
  const { tables } = snapshot.archive;

  for (const [tableName, rows] of Object.entries(tables)) {
    restoredTables[tableName] = Array.isArray(rows) ? [...rows] : [];
    
    // If mockDb is provided, populate it
    if (mockDb && typeof mockDb.insertMany === 'function') {
      await mockDb.insertMany(tableName, restoredTables[tableName]);
    }
  }

  return {
    success: true,
    restoredAt: new Date().toISOString(),
    restoredTables: Object.keys(restoredTables),
    totalRecordsRestored: validation.totalRecords
  };
}

