import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { searchSiteWithSuggestions } from '../src/utils/smartSiteSearch.js';
import { cmsStore, mergeStaffWithDefaults } from '../src/services/cmsStore.js';
import { saveCmsSettings } from '../src/admin/services/cmsClient.js';
import { orgInfo } from '../src/data/dcvcData.js';

describe('DCVC Approved Improvements: GEM Membership, Sponsorship, In-Kind, CRC Hours', () => {
  let originalWindow;
  let originalSessionStorage;
  let originalLocalStorage;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalSessionStorage = globalThis.sessionStorage;
    originalLocalStorage = globalThis.localStorage;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.sessionStorage = originalSessionStorage;
    globalThis.localStorage = originalLocalStorage;
  });

  describe('1. GEM Membership (Give Every Month)', () => {
    it('indexes "gem", "gem membership", and "give every month" to direct donors to /donate', () => {
      const searchGem = searchSiteWithSuggestions('gem');
      assert.ok(searchGem.results.some((r) => r.url === '/donate'), 'Search for "gem" must return /donate');

      const searchGemMember = searchSiteWithSuggestions('gem membership');
      assert.ok(searchGemMember.results.some((r) => r.url === '/donate'), 'Search for "gem membership" must return /donate');

      const searchGiveEveryMonth = searchSiteWithSuggestions('give every month');
      assert.ok(searchGiveEveryMonth.results.some((r) => r.url === '/donate'), 'Search for "give every month" must return /donate');
    });
  });

  describe('2. CRC Operating Hours Admin Management & RBAC', () => {
    it('preserves initial default operating hours in cmsStore and orgInfo baseline', () => {
      const settings = cmsStore.getSettings();
      assert.ok(settings.hours, 'Settings must have default hours');
      assert.match(settings.hours, /1:00 PM\s*[–-]\s*5:00 PM Weekdays/i);
      assert.match(orgInfo.hours, /1:00 PM\s*[–-]\s*5:00 PM Weekdays/i);
    });

    it('successfully updates and retrieves CRC operating hours via cmsStore', () => {
      const originalSettings = cmsStore.getSettings();
      const testHours = 'Monday–Friday 10:00 AM – 6:00 PM (Drop-ins Welcome)';

      const updated = cmsStore.saveSettings({ hours: testHours });
      assert.equal(updated.hours, testHours);

      const retrieved = cmsStore.getSettings();
      assert.equal(retrieved.hours, testHours);

      // Restore original
      cmsStore.saveSettings({ hours: originalSettings.hours });
    });

    it('supports closed-day schedules and maintenance notices', () => {
      const closedSchedule = 'Closed Today for Staff Development & Facility Maintenance';
      const updated = cmsStore.saveSettings({ hours: closedSchedule });
      assert.equal(updated.hours, closedSchedule);
      assert.match(cmsStore.getSettings().hours, /Closed Today/i);

      // Restore
      cmsStore.saveSettings({ hours: '1:00 PM – 5:00 PM Weekdays (Drop-ins & Supplies; HIV/STI Screenings 1st Mon 3–7 PM)' });
    });

    it('enforces RBAC in saveCmsSettings: rejects non-admin users and authorizes admins', () => {
      // Mock storage
      const mockStorage = new Map();
      const storageMock = {
        getItem: (key) => mockStorage.get(key) || null,
        setItem: (key, val) => mockStorage.set(key, String(val)),
        removeItem: (key) => mockStorage.delete(key)
      };
      globalThis.window = {
        sessionStorage: storageMock,
        localStorage: storageMock,
        dispatchEvent: () => true
      };
      globalThis.sessionStorage = storageMock;
      globalThis.localStorage = storageMock;

      // Set user as editor (non-admin)
      globalThis.sessionStorage.setItem('dcvc_admin_user', JSON.stringify({
        email: 'editor@diversitycollective.org',
        role: 'editor'
      }));

      // Non-admin must be blocked from saving settings
      assert.throws(() => {
        saveCmsSettings({ hours: '12:00 PM – 4:00 PM' });
      }, /Unauthorized.*Admin role/i);

      // Set user as admin
      globalThis.sessionStorage.setItem('dcvc_admin_user', JSON.stringify({
        email: 'director@diversitycollective.org',
        role: 'admin'
      }));

      // Admin must be authorized
      assert.doesNotThrow(() => {
        saveCmsSettings({ hours: '1:00 PM – 5:00 PM Weekdays (Drop-ins & Supplies; HIV/STI Screenings 1st Mon 3–7 PM)' });
      });
    });
  });

  describe('3. Program Deletion Persistence & Tombstone Integrity', () => {
    it('permanently deletes newly added programs and records tombstones without resurrecting', () => {
      const initialCount = cmsStore.getPrograms().length;
      const testProgram = {
        id: 'prog-temp-delete-test',
        slug: 'temp-delete-test-slug',
        title: 'Temporary Deletion Test Program',
        schedule: 'Fridays 4 PM',
        location: 'Ventura Community Center'
      };

      cmsStore.saveProgram(testProgram);
      assert.equal(cmsStore.getPrograms().length, initialCount + 1);
      assert.ok(cmsStore.getPrograms().some(p => p.slug === 'temp-delete-test-slug'));

      // Delete by slug
      cmsStore.deleteProgram('temp-delete-test-slug');
      const afterDelete = cmsStore.getPrograms();
      assert.equal(afterDelete.length, initialCount);
      assert.ok(!afterDelete.some(p => p.slug === 'temp-delete-test-slug' || p.id === 'prog-temp-delete-test'));

      // Check tombstones
      const deletedList = cmsStore.getAllData().deletedPrograms || [];
      assert.ok(deletedList.includes('temp-delete-test-slug'));
      assert.ok(deletedList.includes('prog-temp-delete-test'));
    });
  });

  describe('4. Board Members Integrity, Deduplication & Isolation from Staff Edits', () => {
    it('returns exactly the 6 approved board members in the requested order with zero duplicates', () => {
      const board = cmsStore.getBoardMembers();
      assert.equal(board.length, 6, `Expected exactly 6 board members, got ${board.length}`);

      const expectedNames = [
        'Steve Somann',
        'Celia Sandhya Daniels',
        'AJ Holmes',
        'Roland Catabona',
        'Luis Andrade',
        'Unique Dowtin'
      ];

      expectedNames.forEach((expectedName, idx) => {
        assert.equal(board[idx].name, expectedName, `Expected index ${idx} to be ${expectedName}`);
        assert.ok(board[idx].photo.includes('/images/board/'), `Missing real image for ${expectedName}`);
        assert.ok(board[idx].email.endsWith('@diversitycollective.org'), `Invalid official email for ${expectedName}`);
      });

      // Assert no repetitions by name or slug
      const names = board.map(b => b.name.toLowerCase());
      assert.equal(new Set(names).size, 6, 'Duplicate board member names detected!');

      const slugs = board.map(b => b.slug.toLowerCase());
      assert.equal(new Set(slugs).size, 6, 'Duplicate board member slugs detected!');

      // Assert all emails are distinct (not all having the same email)
      const emails = board.map(b => b.email.toLowerCase());
      assert.equal(new Set(emails).size, 6, 'Board members must not have identical emails!');
    });

    it('ensures modifying or adding staff members does not affect or duplicate board member cards', () => {
      const boardBefore = cmsStore.getBoardMembers();
      const boardCountBefore = boardBefore.length;

      // Add a new staff member
      const newStaff = {
        name: 'Community Care Navigator',
        role: 'Peer Support & Navigation Lead',
        category: 'staff',
        email: 'care@diversitycollective.org',
        photo: '/images/volunteers.jpg',
        bio: 'Providing warm handoffs and community navigation services.'
      };

      cmsStore.saveStaff(newStaff);

      // Verify board members were completely untouched
      const boardAfter = cmsStore.getBoardMembers();
      assert.equal(boardAfter.length, boardCountBefore, 'Board members count must not change when staff is added');
      assert.equal(boardAfter[0].name, 'Steve Somann');
      assert.equal(boardAfter[3].name, 'Roland Catabona');

      // Verify staff member was added
      const staffList = cmsStore.getStaffMembers();
      assert.ok(staffList.some(s => s.name === 'Community Care Navigator'));

      // Clean up test staff
      cmsStore.deleteStaff('Community Care Navigator');
    });

    it('deduplicates staff and board members if duplicate records are presented', () => {
      const duplicatedList = [
        ...cmsStore.getBoardMembers(),
        ...cmsStore.getBoardMembers() // duplicate entries
      ];

      const merged = mergeStaffWithDefaults(duplicatedList, null, []);
      const boardOnly = merged.filter(m => m.category === 'board');
      assert.equal(boardOnly.length, 6, 'mergeStaffWithDefaults must deduplicate repeated board cards');
    });
  });
});
