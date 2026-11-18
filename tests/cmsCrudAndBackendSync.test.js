import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cmsStore } from '../src/services/cmsStore.js';
import { boardMembers, staffMembers } from '../src/data/dcvcData.js';

describe('CMS Comprehensive CRUD Operations & Frontend Instant Reactivity', () => {
  it('1. Board Members: Adding a new board member PRESERVES all existing pre-populated board members', () => {
    const initialBoard = cmsStore.getBoardMembers();
    const initialCount = initialBoard.length;
    assert.ok(initialCount >= 5, 'Must have pre-populated seed board members');

    const firstSeedName = initialBoard[0].name;

    // Simulate adding a brand new board member via admin CMS modal
    const newBoardPayload = {
      name: 'Elena Rostova, J.D.',
      title: 'Advocacy & Legal Advisory Chair',
      category: 'board',
      email: 'elena.rostova@diversitycollective.org',
      photo: '/images/volunteers.jpg',
      bio: 'Championing civil rights, affirming legal aid, and tenant advocacy for Ventura County LGBTQ+ families.'
    };

    const savedStaffList = cmsStore.saveStaff(newBoardPayload);
    const updatedBoard = cmsStore.getBoardMembers();

    // 1. Board count must increase by exactly 1
    assert.equal(updatedBoard.length, initialCount + 1, `Board count must be ${initialCount + 1}, got ${updatedBoard.length}`);

    // 2. The original seed board members must ALL still be present
    const seedMemberCheck = updatedBoard.find(b => b.name === firstSeedName);
    assert.ok(seedMemberCheck, `Original board member "${firstSeedName}" MUST still be present`);
    assert.notEqual(seedMemberCheck.name, newBoardPayload.name, 'Seed board member must NOT be overwritten');

    for (const original of initialBoard) {
      const exists = updatedBoard.some(b => b.name === original.name);
      assert.ok(exists, `Original board member "${original.name}" must remain in the board team`);
    }

    // 3. The new board member must exist with category 'board' and valid id
    const foundNew = updatedBoard.find(b => b.name === 'Elena Rostova, J.D.');
    assert.ok(foundNew, 'New board member must be present in board team');
    assert.equal(foundNew.category, 'board');
    assert.equal(foundNew.title, 'Advocacy & Legal Advisory Chair');
    assert.ok(foundNew.id, 'New board member must have an id');

    // 4. Update the board member in-place
    cmsStore.saveStaff({
      ...foundNew,
      title: 'Senior Legal & Policy Chair'
    });

    const refreshedBoard = cmsStore.getBoardMembers();
    const updatedNew = refreshedBoard.find(b => b.id === foundNew.id);
    assert.ok(updatedNew);
    assert.equal(updatedNew.title, 'Senior Legal & Policy Chair');
    assert.equal(refreshedBoard.length, initialCount + 1, 'Editing must not change count');

    // 5. Delete the test board member cleanly
    cmsStore.deleteStaff(foundNew.id);
    const afterDelete = cmsStore.getBoardMembers();
    assert.equal(afterDelete.length, initialCount, 'Deleting test member restores initial count');
    assert.ok(!afterDelete.some(b => b.id === foundNew.id), 'Deleted member must be removed');
    assert.ok(afterDelete.some(b => b.name === firstSeedName), 'Seed board member remains safe');
  });

  it('2. Programs: Adding a new program preserves all pre-populated programs', () => {
    const initialPrograms = cmsStore.getPrograms();
    const initialCount = initialPrograms.length;
    const firstSlug = initialPrograms[0].slug;

    const newProg = {
      title: 'Ventura Queer Book Guild',
      tagline: 'Monthly reading and literary collective',
      slug: 'ventura-queer-book-guild',
      summary: 'Reading queer literature across generations.',
      active: true
    };

    cmsStore.saveProgram(newProg);
    const afterAdd = cmsStore.getPrograms();
    assert.equal(afterAdd.length, initialCount + 1);

    const firstSeed = afterAdd.find(p => p.slug === firstSlug);
    assert.ok(firstSeed, 'First seed program must still exist');
    assert.notEqual(firstSeed.title, newProg.title, 'Seed program must not be overwritten');

    const added = afterAdd.find(p => p.slug === 'ventura-queer-book-guild');
    assert.ok(added, 'New program must exist');

    // Cleanup
    cmsStore.deleteProgram('ventura-queer-book-guild');
    assert.equal(cmsStore.getPrograms().length, initialCount);
  });

  it('3. Events: CRUD operations and cancellation toggling work reliably', () => {
    const initialEvents = cmsStore.getEvents();
    const initialCount = initialEvents.length;

    const testEvent = {
      title: 'Annual Pride Gala Night 2026',
      date: 'November 15, 2026',
      time: '6:00 PM – 10:00 PM',
      location: 'Ventura Beach Marriott',
      category: 'Celebration',
      description: 'An elegant evening honoring community leaders.'
    };

    cmsStore.saveEvent(testEvent);
    const afterAdd = cmsStore.getEvents();
    assert.equal(afterAdd.length, initialCount + 1);

    const saved = afterAdd.find(e => e.title === testEvent.title);
    assert.ok(saved, 'Saved event must exist');
    assert.equal(saved.isCancelled, false);

    // Toggle cancellation
    cmsStore.toggleEventCancellation(saved.id, 'Rescheduled due to venue renovation');
    const afterToggle = cmsStore.getEvents().find(e => e.id === saved.id);
    assert.equal(afterToggle.isCancelled, true);
    assert.ok(afterToggle.cancellationNotice.includes('renovation'));

    // Cleanup
    cmsStore.deleteEvent(saved.id);
    assert.equal(cmsStore.getEvents().length, initialCount);
  });

  it('4. Frontend Instant Reactivity: cmsStore.subscribe fires synchronously on every CRUD change', () => {
    let callCount = 0;
    let latestData = null;

    const unsubscribe = cmsStore.subscribe((data) => {
      callCount++;
      latestData = data;
    });

    const testArticle = {
      title: 'Instant Sync Test Article',
      excerpt: 'Verifying 0ms subscriber broadcast.',
      body: 'Content for instant subscriber verification.'
    };

    cmsStore.saveNews(testArticle);
    assert.ok(callCount > 0, 'Subscriber must be notified on saveNews');
    assert.ok(latestData?.news?.some(n => n.title === testArticle.title), 'Subscriber receives updated news');

    // Delete
    const saved = cmsStore.getNews().find(n => n.title === testArticle.title);
    cmsStore.deleteNews(saved.id);

    unsubscribe();
    const countAfterUnsub = callCount;
    cmsStore.saveSettings({ tagline: 'Testing Unsubscribe' });
    assert.equal(callCount, countAfterUnsub, 'Unsubscribed listener must not be called');
  });
});
