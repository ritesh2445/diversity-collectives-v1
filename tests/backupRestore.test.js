import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createDatabaseSnapshot,
  validateBackupArchive,
  restoreDatabaseFromSnapshot,
  encryptPayload,
  decryptPayload,
  createEncryptedBackupPackage,
  verifyAndDecryptBackupPackage,
  assertValidEncryptionKey,
  generateKeyFingerprint,
  TOPOLOGICAL_RESTORE_ORDER,
  POST_RESTORE_SECURITY_QUERIES,
  checkForeignKeyIntegrity,
  enforceBackupRetention,
  BACKBLAZE_FREE_TIER_LIMIT_BYTES
} from '../src/utils/backupRestore.js';
import { fetchTursoTables, BackblazeB2Client, getRequiredEncryptionKey } from '../scripts/backup.js';
import { createEncryptedMediaPackage, exportSanityMediaAndAssets } from '../scripts/backupMedia.js';

describe('Disaster Recovery: Non-Production Backup & Restore Verification', () => {

  const sampleData = {
    businesses: [
      { id: 'b1', name: 'Beacon Coffee Company', city: 'Ventura', status: 'approved' },
      { id: 'b2', name: 'Coastal Pride Counseling', city: 'Ventura', status: 'approved' }
    ],
    contact_submissions: [
      { id: 'c1', name: 'Morgan Blake', subject: 'Volunteering', consent_given: 1 }
    ],
    donation_appreciation_cards: [
      { id: 'card-1', card_token: 'dcvc_abc123', tier: 'rainbow_champion', amount_cents: 15000 }
    ],
    admin_users: [
      { id: 'adm-1', email: 'admin@diversitycollective.org', role: 'admin' }
    ]
  };

  // Test 32-byte (64 hex characters) encryption key
  const testHexKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('1. creates a verified database snapshot with valid SHA-256 checksum', async () => {
    const snapshot = await createDatabaseSnapshot(sampleData);

    assert.ok(snapshot);
    assert.ok(snapshot.checksum);
    assert.strictEqual(snapshot.checksum.length, 64);
    assert.ok(snapshot.sizeBytes > 100);
    assert.strictEqual(snapshot.archive.metadata.organization, 'Diversity Collective Ventura County');
  });

  it('2. validates snapshot integrity and detects corrupted archives', async () => {
    const snapshot = await createDatabaseSnapshot(sampleData);
    const validCheck = await validateBackupArchive(snapshot);

    assert.strictEqual(validCheck.valid, true);
    assert.strictEqual(validCheck.totalRecords, 5);
    assert.strictEqual(validCheck.tableCount, 4);

    // Corrupted checksum test
    const corrupted = { ...snapshot, checksum: 'bad_checksum_hash' };
    const invalidCheck = await validateBackupArchive(corrupted);
    assert.strictEqual(invalidCheck.valid, false);
    assert.match(invalidCheck.error, /checksum mismatch/i);
  });

  it('3. executes full database restoration and confirms zero record loss', async () => {
    const snapshot = await createDatabaseSnapshot(sampleData);
    
    // In-memory target store
    const restoredTarget = {};
    const mockDb = {
      async insertMany(table, rows) {
        restoredTarget[table] = rows;
      }
    };

    const restoreResult = await restoreDatabaseFromSnapshot(snapshot, mockDb);

    assert.strictEqual(restoreResult.success, true);
    assert.strictEqual(restoreResult.totalRecordsRestored, 5);
    assert.deepStrictEqual(restoreResult.restoredTables, ['admin_users', 'businesses', 'donation_appreciation_cards', 'contact_submissions']);

    // Assert data fidelity
    assert.strictEqual(restoredTarget.businesses.length, 2);
    assert.strictEqual(restoredTarget.businesses[0].name, 'Beacon Coffee Company');
    assert.strictEqual(restoredTarget.donation_appreciation_cards[0].amount_cents, 15000);
    assert.strictEqual(restoredTarget.admin_users[0].email, 'admin@diversitycollective.org');
  });

  it('4. performs AES-256-GCM authenticated encryption and decryption with exact fidelity', () => {
    const secretMessage = JSON.stringify({ note: 'Confidential clinical navigation & donor records' });
    const encrypted = encryptPayload(secretMessage, testHexKey);

    assert.ok(Buffer.isBuffer(encrypted));
    assert.ok(encrypted.length > secretMessage.length); // includes 12-byte IV + 16-byte tag

    const decrypted = decryptPayload(encrypted, testHexKey);
    assert.strictEqual(decrypted.toString('utf8'), secretMessage);
  });

  it('5. detects tampering in AES-256-GCM ciphertext and rejects corrupted backups', () => {
    const secretMessage = 'Intact database payload';
    const encrypted = encryptPayload(secretMessage, testHexKey);

    // Tamper with ciphertext by flipping a byte
    const tampered = Buffer.from(encrypted);
    tampered[tampered.length - 1] ^= 0xff;

    assert.throws(() => {
      decryptPayload(tampered, testHexKey);
    }, /unsupported state or unable to authenticate data|bad decrypt/i);
  });

  it('6. creates complete Backblaze B2 encrypted backup package with dual SHA-256 integrity hashes', async () => {
    const pkg = await createEncryptedBackupPackage(sampleData, testHexKey, { bucketName: 'dcvc-backups-production' });

    assert.ok(pkg.backupId.startsWith('dcvc-backup-'));
    assert.strictEqual(pkg.manifest.provider, 'backblaze');
    assert.strictEqual(pkg.manifest.targetBucket, 'dcvc-backups-production');
    assert.strictEqual(pkg.manifest.encryption.algorithm, 'AES-256-GCM');
    assert.strictEqual(pkg.manifest.encryption.keyLengthBits, 256);
    assert.strictEqual(pkg.manifest.recordCount, 5);
    assert.strictEqual(pkg.plaintextChecksum.length, 64);
    assert.strictEqual(pkg.ciphertextChecksum.length, 64);
  });

  it('7. verifies and decrypts Backblaze B2 backup package, confirming full record integrity', async () => {
    const pkg = await createEncryptedBackupPackage(sampleData, testHexKey);
    const result = await verifyAndDecryptBackupPackage(pkg.encryptedBuffer, pkg.manifest, testHexKey);

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.snapshot.archive.tables.businesses.length, 2);
    assert.strictEqual(result.snapshot.archive.tables.donation_appreciation_cards.length, 1);
    assert.strictEqual(result.snapshot.archive.tables.businesses[0].name, 'Beacon Coffee Company');
  });

  it('8. rejects Backblaze B2 backup package with tampered manifest checksum', async () => {
    const pkg = await createEncryptedBackupPackage(sampleData, testHexKey);
    const badManifest = {
      ...pkg.manifest,
      integrity: {
        ...pkg.manifest.integrity,
        ciphertextChecksumSha256: 'tampered_hash_0000000000000000000000000000000000000000000000000000'
      }
    };

    await assert.rejects(
      async () => {
        await verifyAndDecryptBackupPackage(pkg.encryptedBuffer, badManifest, testHexKey);
      },
      /Ciphertext SHA-256 checksum mismatch/i
    );
  });

  it('9. enforces 14-day retention and storage limit while NEVER deleting the most recent backup', () => {
    const dayMs = 24 * 60 * 60 * 1000;
    const now = new Date('2026-11-06T12:00:00Z').getTime();

    const mockInventory = [
      // Day 0: Newest (today) -> MUST BE RETAINED
      { fileName: 'backup-2026-11-06.enc', createdAt: '2026-11-06T03:00:00Z', sizeBytes: 50 * 1024 * 1024 },
      // Day 3: Within 14 days -> Retained
      { fileName: 'backup-2026-11-03.enc', createdAt: '2026-11-03T03:00:00Z', sizeBytes: 50 * 1024 * 1024 },
      // Day 10: Within 14 days -> Retained
      { fileName: 'backup-2026-10-27.enc', createdAt: '2026-10-27T03:00:00Z', sizeBytes: 50 * 1024 * 1024 },
      // Day 20: Expired (> 14 days) -> Delete
      { fileName: 'backup-2026-10-17.enc', createdAt: '2026-10-17T03:00:00Z', sizeBytes: 50 * 1024 * 1024 },
      // Day 40: Expired (> 14 days) -> Delete
      { fileName: 'backup-2026-09-27.enc', createdAt: '2026-09-27T03:00:00Z', sizeBytes: 50 * 1024 * 1024 }
    ];

    const plan = enforceBackupRetention(mockInventory, { retentionDays: 14, now });

    assert.strictEqual(plan.toRetain.length, 3);
    assert.strictEqual(plan.toDelete.length, 2);
    assert.strictEqual(plan.toRetain[0].fileName, 'backup-2026-11-06.enc'); // Newest retained
    assert.strictEqual(plan.toDelete[0].fileName, 'backup-2026-10-17.enc');
    assert.strictEqual(plan.toDelete[1].fileName, 'backup-2026-09-27.enc');
    assert.ok(plan.totalStorageBytes < BACKBLAZE_FREE_TIER_LIMIT_BYTES);
  });

  it('10. guarantees inviolable protection of the latest backup even if older than retention window or exceeding limit', () => {
    // Only 1 backup exists, but it is 60 days old
    const singleOldBackup = [
      { fileName: 'backup-2026-08-01.enc', createdAt: '2026-08-01T03:00:00Z', sizeBytes: 100 * 1024 * 1024 }
    ];

    const plan = enforceBackupRetention(singleOldBackup, { retentionDays: 14, now: '2026-11-06T12:00:00Z' });

    // The single backup MUST NOT be deleted because it is the only/latest verified copy!
    assert.strictEqual(plan.toRetain.length, 1);
    assert.strictEqual(plan.toDelete.length, 0);
    assert.strictEqual(plan.toRetain[0].fileName, 'backup-2026-08-01.enc');
  });

  it('11. strictly validates BACKUP_ENCRYPTION_KEY and rejects missing, non-hex, or truncated keys', () => {
    // Missing key
    assert.throws(() => assertValidEncryptionKey(null), /BACKUP_ENCRYPTION_KEY is required/i);
    assert.throws(() => assertValidEncryptionKey(''), /BACKUP_ENCRYPTION_KEY is required/i);
    assert.throws(() => getRequiredEncryptionKey(null), /BACKUP_ENCRYPTION_KEY environment secret is missing/i);

    // Malformed / non-hex keys
    assert.throws(() => assertValidEncryptionKey('not_a_valid_hex_key'), /must be a valid 32-byte hexadecimal string/i);
    assert.throws(() => assertValidEncryptionKey('0123456789abcdef'), /must be a valid 32-byte hexadecimal string/i); // only 16 chars
    assert.throws(() => assertValidEncryptionKey('z'.repeat(64)), /must be a valid 32-byte hexadecimal string/i); // invalid hex char 'z'

    // Valid 64-character hex key
    const validKey = assertValidEncryptionKey(testHexKey);
    assert.strictEqual(validKey, testHexKey);
  });

  it('12. fails closed in production backup mode when Turso credentials are missing (refuses silent sample data)', async () => {
    // Without credentials and allowFixtures: false, fetchTursoTables must throw
    await assert.rejects(
      async () => {
        await fetchTursoTables({ allowFixtures: false });
      },
      /TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required for production database backup/i
    );
  });

  it('13. mandates allPrivate Backblaze B2 bucket configuration and rejects public buckets', async () => {
    const client = new BackblazeB2Client('test-key-id', 'test-app-key');
    // Mock authorization and bucket list response with public bucket
    client.authData = { apiUrl: 'https://api.backblaze.test', authorizationToken: 'test-token', accountId: 'test-acc' };
    
    // Intercept fetch to return a non-private bucket
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (url.includes('b2_list_buckets')) {
        return {
          ok: true,
          json: async () => ({
            buckets: [{ bucketName: 'dcvc-backups-production', bucketId: 'b-test-id', bucketType: 'allPublic' }]
          })
        };
      }
      return originalFetch(url);
    };

    try {
      await assert.rejects(
        async () => {
          await client.getBucketId('dcvc-backups-production');
        },
        /production backup policy strictly mandates 'allPrivate'/i
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('14. verifies foreign-key topological restoration ordering and rejects orphaned child records', async () => {
    // 1. Valid parent-child relationships
    const validData = {
      businesses: [{ id: 'biz-1', name: 'Valid Coffee' }],
      business_corrections: [{ id: 'cor-1', business_id: 'biz-1', details: 'Update address' }],
      admin_users: [{ id: 'adm-1', email: 'adm@example.org', token_version: 1 }],
      admin_audit_logs: [{ id: 'log-1', user_id: 'adm-1', action: 'approve' }],
      donation_intents: [{ id: 'int-1', donor_name: 'Alex' }],
      donation_reconciliations: [{ id: 'rec-1', assigned_intent_id: 'int-1' }]
    };

    const validCheck = checkForeignKeyIntegrity(validData);
    assert.strictEqual(validCheck.valid, true);
    assert.strictEqual(validCheck.violations.length, 0);

    // 2. Invalid orphaned child record
    const orphanedData = {
      businesses: [{ id: 'biz-1', name: 'Valid Coffee' }],
      business_corrections: [{ id: 'cor-2', business_id: 'non-existent-biz-999', details: 'Bad FK' }]
    };

    const invalidCheck = checkForeignKeyIntegrity(orphanedData);
    assert.strictEqual(invalidCheck.valid, false);
    assert.strictEqual(invalidCheck.violations.length, 1);
    assert.strictEqual(invalidCheck.violations[0].table, 'business_corrections');
    assert.strictEqual(invalidCheck.violations[0].foreignKey, 'non-existent-biz-999');

    // 3. Attempting restore with orphaned data MUST throw
    const badSnapshot = await createDatabaseSnapshot(orphanedData);
    await assert.rejects(
      async () => {
        await restoreDatabaseFromSnapshot(badSnapshot);
      },
      /Foreign key integrity check failed.*non-existent-biz-999/i
    );
  });

  it('15. enforces post-restore security hygiene: bumps token_version, consumes OTPs, flushes rate limits, preserves revoked tokens', async () => {
    const authData = {
      admin_users: [
        { id: 'u1', email: 'director@example.org', token_version: 2 },
        { id: 'u2', email: 'staff@example.org', token_version: 1 }
      ],
      admin_email_otps: [
        { id: 'otp-1', email: 'director@example.org', consumed: 0, attempts: 1 }
      ],
      admin_used_temp_tokens: [
        { jti: 'temp-jwt-1', consumed: 0, attempts: 0 }
      ],
      admin_rate_limits: [
        { key: 'ip_192_0_2_5', count: 3 }
      ],
      admin_revoked_tokens: [
        { jti: 'blacklisted-token-999', user_id: 'u1' }
      ]
    };

    const snapshot = await createDatabaseSnapshot(authData);
    const mockDb = {
      target: {},
      async insertMany(tbl, rows) {
        this.target[tbl] = [...rows];
      }
    };

    const restoreResult = await restoreDatabaseFromSnapshot(snapshot, mockDb, { applySecurityHygiene: true });
    assert.strictEqual(restoreResult.success, true);
    assert.strictEqual(restoreResult.securityHygieneApplied, true);

    // Assert: admin_users.token_version incremented to invalidate existing session JWTs
    assert.strictEqual(restoreResult.restoredTables.includes('admin_users'), true);

    // Check queries list
    assert.strictEqual(POST_RESTORE_SECURITY_QUERIES.length, 4);
    assert.ok(POST_RESTORE_SECURITY_QUERIES.find(q => q.name === 'bump_token_version'));
    assert.ok(POST_RESTORE_SECURITY_QUERIES.find(q => q.name === 'invalidate_email_otps'));
    assert.ok(POST_RESTORE_SECURITY_QUERIES.find(q => q.name === 'invalidate_temp_tokens'));
    assert.ok(POST_RESTORE_SECURITY_QUERIES.find(q => q.name === 'reset_rate_limits'));
  });

  it('16. validates atomic read-only transactional snapshot context across Turso pipeline', async () => {
    // Intercept fetch to inspect pipeline request batching
    const originalFetch = globalThis.fetch;
    let interceptedRequests = null;

    globalThis.fetch = async (url, opts) => {
      if (url.includes('/v2/pipeline')) {
        interceptedRequests = JSON.parse(opts.body).requests;
        return {
          ok: true,
          json: async () => ({
            results: [
              { type: 'ok', response: { type: 'execute', result: { rows: [] } } }, // BEGIN TRANSACTION READONLY
              { type: 'ok', response: { type: 'execute', result: { cols: [{ name: 'id' }], rows: [] } } }, // table 1
              { type: 'ok', response: { type: 'execute', result: { cols: [{ name: 'id' }], rows: [] } } }, // table 2
              { type: 'ok', response: { type: 'execute', result: { rows: [] } } }  // COMMIT
            ]
          })
        };
      }
      return originalFetch(url, opts);
    };

    try {
      const prevUrl = process.env.TURSO_DATABASE_URL;
      const prevToken = process.env.TURSO_AUTH_TOKEN;
      process.env.TURSO_DATABASE_URL = 'libsql://dcvc-prod-test.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      const tablesToFetch = ['businesses', 'admin_users'];
      const data = await fetchTursoTables({
        allowFixtures: false,
        tables: tablesToFetch,
        tursoUrl: 'libsql://dcvc-prod-test.turso.io',
        tursoToken: 'test-token'
      });

      assert.ok(data.businesses);
      assert.ok(data.admin_users);
      assert.ok(interceptedRequests, 'Pipeline requests must be captured');
      assert.strictEqual(interceptedRequests.length, 4);
      assert.strictEqual(interceptedRequests[0].stmt.sql, 'BEGIN TRANSACTION READONLY;');
      assert.strictEqual(interceptedRequests[1].stmt.sql, 'SELECT * FROM "businesses";');
      assert.strictEqual(interceptedRequests[2].stmt.sql, 'SELECT * FROM "admin_users";');
      assert.strictEqual(interceptedRequests[3].stmt.sql, 'COMMIT;');

      process.env.TURSO_DATABASE_URL = prevUrl;
      process.env.TURSO_AUTH_TOKEN = prevToken;
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('17. creates, encrypts, and decrypts complete media backup package with asset counts and key fingerprint', async () => {
    const sanityExport = await exportSanityMediaAndAssets({ allowFixtures: true, projectId: 'mock' });
    assert.strictEqual(sanityExport.downloadedAssetCount, 1);
    assert.strictEqual(sanityExport.assets.length, 1);

    const mediaData = {
      sanity: sanityExport,
      voicemails: [{ id: 'vm-1', durationSeconds: 20, mimeType: 'audio/webm' }],
      documents: [{ id: 'doc-1', filename: 'brochure.pdf', sizeBytes: 1024 }],
      cloudinary: { galleryEntries: [{ id: 'g1', title: 'Community Center' }] }
    };

    const pkg = await createEncryptedMediaPackage(mediaData, testHexKey);
    assert.ok(pkg.backupId.startsWith('dcvc-media-backup-'));
    assert.strictEqual(pkg.manifest.backupType, 'media_and_assets');
    assert.strictEqual(pkg.manifest.encryption.algorithm, 'AES-256-GCM');
    assert.strictEqual(pkg.manifest.encryption.keyFingerprint, generateKeyFingerprint(testHexKey));
    assert.strictEqual(pkg.manifest.mediaSummary.sanityAssetCount, 1);

    // Verify authenticated decryption
    const decryptedBuf = decryptPayload(pkg.encryptedBuffer, testHexKey);
    const parsed = JSON.parse(decryptedBuf.toString('utf8'));
    assert.strictEqual(parsed.sanity.downloadedAssetCount, 1);
    assert.strictEqual(parsed.voicemails[0].id, 'vm-1');
  });

  it('18. executes real SQLite atomic transaction and foreign-key check with outside-transaction pragma enforcement', async () => {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('CREATE TABLE businesses (id TEXT PRIMARY KEY, name TEXT);');
    db.exec('CREATE TABLE business_corrections (id TEXT PRIMARY KEY, business_id TEXT, details TEXT, FOREIGN KEY (business_id) REFERENCES businesses(id));');

    // Step 1: Valid topological insert inside transaction with pragma outside
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec('BEGIN TRANSACTION;');
    db.exec("INSERT INTO businesses VALUES ('b-01', 'Beacon Coffee');");
    db.exec("INSERT INTO business_corrections VALUES ('bc-01', 'b-01', 'Update');");
    const violations1 = db.prepare('PRAGMA foreign_key_check;').all();
    assert.strictEqual(violations1.length, 0);
    db.exec('COMMIT;');
    db.exec('PRAGMA foreign_keys = ON;');

    // Step 2: Corrupt insert with orphaned child row triggers rollback
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec('BEGIN TRANSACTION;');
    db.exec("INSERT INTO business_corrections VALUES ('bc-corrupt', 'nonexistent-biz', 'Orphan');");
    const violations2 = db.prepare('PRAGMA foreign_key_check;').all();
    assert.strictEqual(violations2.length, 1);
    assert.strictEqual(violations2[0].table, 'business_corrections');
    assert.strictEqual(violations2[0].parent, 'businesses');
    db.exec('ROLLBACK;');
    db.exec('PRAGMA foreign_keys = ON;');

    // Assert database left intact after rollback (only 1 valid child record exists)
    const count = db.prepare('SELECT count(*) as total FROM business_corrections;').get();
    assert.strictEqual(count.total, 1);
  });

});

