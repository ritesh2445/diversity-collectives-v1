import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cmsStore } from '../src/services/cmsStore.js';

describe('CMS Program CRUD Operations & Fix Verification', () => {
  it('1. Adds a new program without overwriting or deleting seed programs', () => {
    const initialPrograms = cmsStore.getPrograms();
    const initialCount = initialPrograms.length;
    const initialFirstSlug = initialPrograms[0].slug;

    // Simulate adding a new program via modal where slug starts empty and id is undefined
    const newProgramPayload = {
      title: 'Ventura Youth Art Club',
      tagline: 'Expressive arts and safe community for queer youth',
      slug: '',
      chapter: `0${initialCount + 1}`,
      heroImage: '/images/crc-building.jpg',
      imageFit: 'contain',
      accent: '#7E22CE',
      audience: 'Youth ages 12-20',
      schedule: 'Every Wednesday 4-6 PM',
      location: 'Community Resource Center',
      summary: 'Weekly drop-in art and creative writing collective.',
      active: true
    };

    const updatedList = cmsStore.saveProgram(newProgramPayload);

    // List count must have increased by 1
    assert.equal(updatedList.length, initialCount + 1, 'Program count must increase by 1');

    // The seed program must still be intact and not overwritten
    const seedProgram = updatedList.find(p => p.slug === initialFirstSlug);
    assert.ok(seedProgram, `Seed program ${initialFirstSlug} must remain in the list`);
    assert.notEqual(seedProgram.title, newProgramPayload.title, 'Seed program must NOT be overwritten by new program');

    // The newly added program must exist with a valid slug and id
    const foundNew = updatedList.find(p => p.slug === 'ventura-youth-art-club');
    assert.ok(foundNew, 'Newly added program must exist with auto-generated slug');
    assert.equal(foundNew.title, 'Ventura Youth Art Club');
    assert.equal(foundNew.audience, 'Youth ages 12-20');
    assert.ok(foundNew.id, 'Newly added program must have a valid id');

    // Check that cmsStore.getPrograms() returns the newly added program
    const fromStore = cmsStore.getPrograms();
    assert.equal(fromStore.length, initialCount + 1);
    assert.ok(fromStore.some(p => p.slug === 'ventura-youth-art-club'));
  });

  it('2. Updates an existing program in-place without duplicating or dropping others', () => {
    const currentList = cmsStore.getPrograms();
    const target = currentList.find(p => p.slug === 'ventura-youth-art-club');
    assert.ok(target, 'Target program must exist');

    cmsStore.saveProgram({
      ...target,
      tagline: 'Updated Tagline for Art Club'
    });

    const refreshedList = cmsStore.getPrograms();
    const updated = refreshedList.find(p => p.slug === 'ventura-youth-art-club');
    assert.ok(updated);
    assert.equal(updated.tagline, 'Updated Tagline for Art Club');
    assert.equal(refreshedList.length, currentList.length, 'Length should not change on edit');
  });

  it('3. Successfully deletes a program without affecting remaining programs', () => {
    const currentList = cmsStore.getPrograms();
    const countBefore = currentList.length;

    cmsStore.deleteProgram('ventura-youth-art-club');

    const afterDelete = cmsStore.getPrograms();
    assert.equal(afterDelete.length, countBefore - 1, 'Count must decrease by 1');
    assert.ok(!afterDelete.some(p => p.slug === 'ventura-youth-art-club'), 'Deleted program must not exist');
  });
});
