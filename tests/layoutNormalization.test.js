import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PAGE_BLOCKS,
  normalizePageLayoutBlocks
} from '../src/data/siteDefaults.js';
import {
  getSavedPageLayout
} from '../src/admin/services/adminClient.js';

test('normalizePageLayoutBlocks restores missing section props after Sanity layout sync', () => {
  const sanityOnlySections = [
    { id: 'block-impact_stats', type: 'impact_stats', label: 'Impact Milestones', enabled: true },
    { id: 'block-hero_banner', type: 'hero_banner', label: 'Hero', enabled: false, props: { titleLine1: 'Custom Hero' } }
  ];

  const normalized = normalizePageLayoutBlocks(sanityOnlySections);
  assert.equal(normalized.length, 2);

  const statsBlock = normalized.find((b) => b.type === 'impact_stats');
  assert.ok(statsBlock);
  assert.equal(statsBlock.title, 'Impact Milestones');
  assert.equal(statsBlock.props.stat1Number, '10+');
  assert.equal(statsBlock.props.stat2Number, '5,000+');
  assert.equal(statsBlock.props.stat3Number, '1,200+');

  const heroBlock = normalized.find((b) => b.type === 'hero_banner');
  assert.ok(heroBlock);
  assert.equal(heroBlock.enabled, false);
  assert.equal(heroBlock.props.titleLine1, 'Custom Hero');
  assert.equal(heroBlock.props.emailAddress, 'info@diversitycollective.org');
});

test('normalizePageLayoutBlocks falls back safely for empty or malformed input', () => {
  assert.deepEqual(normalizePageLayoutBlocks(null), DEFAULT_PAGE_BLOCKS);
  assert.deepEqual(normalizePageLayoutBlocks([]), DEFAULT_PAGE_BLOCKS);
  assert.deepEqual(normalizePageLayoutBlocks([null, 'bad']), DEFAULT_PAGE_BLOCKS);
});

test('getSavedPageLayout repairs cached layout missing props in localStorage', () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };

  store.set('dcvc_admin_custom_layout', JSON.stringify([
    { id: 'block-impact_stats', type: 'impact_stats', label: 'Milestones', enabled: true },
    { id: 'block-directory_cta', type: 'directory_cta', label: 'Directory', enabled: true }
  ]));

  const loaded = getSavedPageLayout();
  assert.equal(loaded.length, 2);
  assert.equal(loaded[0].props.stat1Number, '10+');
  assert.equal(loaded[1].props.ctaText, 'Browse Full Directory');

  delete globalThis.localStorage;
});

const EXPECTED_V3_ORDER = [
  'impact_popups',
  'hero_banner',
  'impact_stats',
  'programs_section',
  'signature_events',
  'events_section',
  'calendar_section',
  'special_engagements',
  'partnerships_section',
  'directory_cta',
  'flex_space',
  'zeffy_giving',
  'community_voices',
  'newsletter_section',
  'final_cta'
];

test('DEFAULT_PAGE_BLOCKS follows required homepage order including partnerships_section', () => {
  const types = DEFAULT_PAGE_BLOCKS.map((b) => b.type);
  assert.deepEqual(types, EXPECTED_V3_ORDER);
});

test('getSavedPageLayout upgrades legacy full homepage layout lacking partnerships_section while keeping edited props', () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };

  store.set('dcvc_admin_custom_layout', JSON.stringify([
    { id: 'block-hero', type: 'hero_banner', props: { emailAddress: 'custom@diversitycollective.org' } },
    { id: 'block-stats', type: 'impact_stats', props: { stat1Number: '12+' } },
    { id: 'block-directory', type: 'directory_cta', props: {} },
    { id: 'block-programs', type: 'programs_section', props: {} },
    { id: 'block-events', type: 'events_section', props: {} }
  ]));

  const upgraded = getSavedPageLayout();
  assert.deepEqual(upgraded.map((b) => b.type), EXPECTED_V3_ORDER);
  assert.equal(upgraded.find((b) => b.type === 'hero_banner')?.props.emailAddress, 'custom@diversitycollective.org');
  assert.equal(upgraded.find((b) => b.type === 'impact_stats')?.props.stat1Number, '12+');

  delete globalThis.localStorage;
});

