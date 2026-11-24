import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cmsStore } from '../src/services/cmsStore.js';

describe('Admin Community Group Complete Management & Image Handling', () => {
  it('1. Pre-populates all community groups with default authentic images and valid identifiers', () => {
    const groups = cmsStore.getCommunityGroups();
    assert.ok(Array.isArray(groups) && groups.length >= 8, 'Must have baseline community groups');

    for (const group of groups) {
      assert.ok(group.name, 'Every community group must have a name');
      assert.ok(group.image, `Group ${group.name} must have an image`);
      assert.ok(group.image.startsWith('/images/'), `Group image should be in /images/, got: ${group.image}`);
      assert.ok(group.slug, `Group ${group.name} must have a slug`);
    }
  });

  it('2. Admin can create a new community circle with a custom picture', () => {
    const initialGroups = cmsStore.getCommunityGroups();
    const initialCount = initialGroups.length;

    const newGroup = {
      name: 'Ventura Queer Book Club',
      category: 'Adult Peer Support',
      ages: 'Ages 18+',
      frequency: 'Every 3rd Sunday · 2:00 PM – 4:00 PM',
      location: 'DCVC Community Resource Center & Local Parks',
      description: 'A monthly gathering exploring LGBTQ+ literature, authors, and memoirs in a cozy, affirming atmosphere.',
      image: '/images/community-gathering.jpg',
      contact: 'bookclub@diversitycollective.org',
      active: true
    };

    const updated = cmsStore.saveCommunityGroup(newGroup);
    assert.equal(updated.length, initialCount + 1, 'Group count should increase by 1');

    const created = cmsStore.getCommunityGroups().find(g => g.name === 'Ventura Queer Book Club');
    assert.ok(created, 'Newly created community group must exist');
    assert.equal(created.image, '/images/community-gathering.jpg');
    assert.equal(created.category, 'Adult Peer Support');
    assert.equal(created.slug, 'ventura-queer-book-club');
  });

  it('3. Admin can edit an existing community circle picture and details', () => {
    const existing = cmsStore.getCommunityGroups().find(g => g.name === 'Ventura Queer Book Club');
    assert.ok(existing, 'Target group must exist');

    cmsStore.saveCommunityGroup({
      ...existing,
      image: '/images/volunteers.jpg',
      frequency: 'Every 2nd & 4th Sunday · 2:00 PM – 4:00 PM'
    });

    const refreshed = cmsStore.getCommunityGroups().find(g => g.name === 'Ventura Queer Book Club');
    assert.equal(refreshed.image, '/images/volunteers.jpg', 'Image must update to new picture');
    assert.equal(refreshed.frequency, 'Every 2nd & 4th Sunday · 2:00 PM – 4:00 PM');
  });

  it('4. Admin can delete a community circle cleanly', () => {
    const beforeCount = cmsStore.getCommunityGroups().length;
    cmsStore.deleteCommunityGroup('ventura-queer-book-club');
    const afterGroups = cmsStore.getCommunityGroups();

    assert.equal(afterGroups.length, beforeCount - 1, 'Group count should decrease by 1');
    assert.ok(!afterGroups.some(g => g.slug === 'ventura-queer-book-club'), 'Deleted group must not exist');
  });
});
