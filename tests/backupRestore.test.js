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
  enforceBackupRetention,
  BACKBLAZE_FREE_TIER_LIMIT_BYTES
} from '../src/utils/backupRestore.js';

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
    assert.deepStrictEqual(restoreResult.restoredTables, ['businesses', 'contact_submissions', 'donation_appreciation_cards', 'admin_users']);

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

});

