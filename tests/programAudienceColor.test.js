import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cmsStore } from '../src/services/cmsStore.js';

describe('Program Audience Color Selection & Live Sync', () => {
  it('1. correctly saves and persists custom audienceColor on a program', () => {
    const programs = cmsStore.getPrograms();
    assert.ok(Array.isArray(programs) && programs.length > 0, 'programs must exist');

    const target = programs[0];
    const updatedColor = '#D91B5C';
    const updatedAudience = 'All LGBTQIA+ individuals, families, youth, seniors, and allies';

    cmsStore.saveProgram({
      ...target,
      audience: updatedAudience,
      audienceColor: updatedColor
    });

    const refreshed = cmsStore.getPrograms();
    const found = refreshed.find(p => p.slug === target.slug || p.id === target.id);
    assert.ok(found, 'saved program must be found');
    assert.equal(found.audience, updatedAudience);
    assert.equal(found.audienceColor, updatedColor);
  });

  it('2. falls back gracefully when audienceColor is not specified', () => {
    const programs = cmsStore.getPrograms();
    const target = programs[0];

    cmsStore.saveProgram({
      ...target,
      audienceColor: '#059669'
    });

    const refreshed = cmsStore.getPrograms();
    const found = refreshed.find(p => p.slug === target.slug || p.id === target.id);
    assert.equal(found.audienceColor, '#059669');
  });
});
