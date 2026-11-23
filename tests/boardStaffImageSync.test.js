import { describe, it } from 'node:test';
import assert from 'node:assert';
import { cmsStore, lookupStaffImageOverride, getStaffImageOverrides } from '../src/services/cmsStore.js';
import { applySiteStatePayload } from '../src/services/liveSync.js';

describe('Board of Directors & Staff Image Persistence and Deduplication Verification', () => {
  it('1. Strictly returns the 6 Official Board Members with correct order and deduplication', () => {
    const board = cmsStore.getBoardMembers();
    assert.strictEqual(board.length, 6, 'Board MUST strictly contain exactly 6 members');

    const expectedNames = [
      'Steve Somann',
      'Celia Sandhya Daniels',
      'AJ Holmes',
      'Roland Catabona',
      'Luis Andrade',
      'Unique Dowtin'
    ];

    expectedNames.forEach((expected, idx) => {
      assert.strictEqual(board[idx].name, expected, `Index ${idx} must be ${expected}`);
      assert.strictEqual(board[idx].category, 'board');
    });

    // Zero duplicate names
    const names = board.map(b => b.name.toLowerCase());
    assert.strictEqual(new Set(names).size, 6, 'Duplicate board members found');
  });

  it('2. Operational staff contains 5 distinct team members without bleeding into board', () => {
    const staff = cmsStore.getStaffMembers();
    assert.ok(staff.length >= 5, 'Operational staff must have at least 5 members');
    const boardNames = new Set([
      'steve somann',
      'celia sandhya daniels',
      'aj holmes',
      'roland catabona',
      'luis andrade',
      'unique dowtin'
    ]);
    for (const member of staff) {
      assert.ok(!boardNames.has(member.name.toLowerCase()), `${member.name} must not be in operational staff`);
    }
  });

  it('3. Persists custom uploaded headshot to overrides and survives server sync without revert', () => {
    const testCustomPhoto = 'data:image/webp;base64,TEST_CUSTOM_HEADSHOT_DATA_URL_12345';
    
    // Save image change for Roland Catabona
    cmsStore.saveStaff({
      name: 'Roland Catabona',
      role: 'President, Board of Directors',
      category: 'board',
      photo: testCustomPhoto,
      image: testCustomPhoto
    });

    // Check that override was recorded
    const override = lookupStaffImageOverride('Roland Catabona');
    assert.strictEqual(override, testCustomPhoto);

    // Verify getBoardMembers() reflects the new image immediately
    let board = cmsStore.getBoardMembers();
    const roland = board.find(b => b.name === 'Roland Catabona');
    assert.ok(roland, 'Roland Catabona must exist in board');
    assert.strictEqual(roland.photo, testCustomPhoto);
    assert.strictEqual(roland.image, testCustomPhoto);

    // Simulate incoming stale server sync from Cloudflare Worker with default seed image
    applySiteStatePayload({
      cmsData: {
        staff: [
          {
            name: 'Roland Catabona',
            category: 'board',
            photo: '/images/board/roland-catabona.jpg',
            image: '/images/board/roland-catabona.jpg'
          }
        ]
      }
    });

    // Verify that the user's custom photo was PROTECTED and NOT reverted by stale server data
    board = cmsStore.getBoardMembers();
    const rolandAfterSync = board.find(b => b.name === 'Roland Catabona');
    assert.strictEqual(rolandAfterSync.photo, testCustomPhoto, 'Custom photo must survive server sync');
  });

  it('4. Deleting an operational staff member permanently removes them and persists tombstones across sync', () => {
    const initialStaff = cmsStore.getStaffMembers();
    const countBefore = initialStaff.length;
    assert.ok(countBefore >= 5);

    // Pick one staff member to delete, e.g. Health Navigation Specialist
    const target = initialStaff.find(s => s.name === 'Health Navigation Specialist') || initialStaff[initialStaff.length - 1];
    const targetName = target.name;
    const targetId = target.id;

    // Delete staff member
    cmsStore.deleteStaff(targetId);

    // Verify removed from getStaffMembers
    const staffAfterDelete = cmsStore.getStaffMembers();
    assert.strictEqual(staffAfterDelete.length, countBefore - 1);
    assert.ok(!staffAfterDelete.some(s => s.name === targetName), 'Deleted staff member must no longer appear');

    // Simulate incoming server sync
    applySiteStatePayload({
      cmsData: {
        staff: [
          {
            name: targetName,
            category: 'staff',
            photo: '/images/volunteers.jpg'
          }
        ]
      }
    });

    // Verify deleted staff member was NOT resurrected by incoming server sync
    const staffAfterSync = cmsStore.getStaffMembers();
    assert.strictEqual(staffAfterSync.length, countBefore - 1);
    assert.ok(!staffAfterSync.some(s => s.name === targetName), 'Deleted staff member must not be resurrected by sync');
  });
});
