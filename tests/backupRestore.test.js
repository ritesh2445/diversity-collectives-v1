import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createDatabaseSnapshot,
  validateBackupArchive,
  restoreDatabaseFromSnapshot
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

});

