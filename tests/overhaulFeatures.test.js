import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_PAGE_BLOCKS, upgradeOrNormalizePageLayout } from '../src/data/siteDefaults.js';
import {
  communityGroups,
  annualSignatureEvents,
  specialEngagements
} from '../src/data/dcvcData.js';
import {
  DEFAULT_SITE_FEATURES,
  computeFlexSpaceStatus,
  getSlotAvailability,
  bookTimeSlot,
  getActiveBroadcastPopup
} from '../src/services/siteFeaturesStore.js';
import { LOCAL_KNOWLEDGE_BASE } from '../src/services/localKnowledgeEngine.js';

test('Home DEFAULT_PAGE_BLOCKS follows exact 12-section DCVC overhaul sequence', () => {
  const types = DEFAULT_PAGE_BLOCKS.map((b) => b.type);
  const expectedOrder = [
    'impact_popups',
    'hero_banner',
    'impact_stats',
    'upcoming_week',
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
  assert.deepEqual(types, expectedOrder);

  // Legacy cached layouts automatically upgrade to include new v3 sections
  const legacy = [
    { id: 'block-hero', type: 'hero_banner', enabled: true, props: { titleLine1: 'Custom' } },
    { id: 'block-programs', type: 'programs_section', enabled: true, props: {} },
    { id: 'block-directory', type: 'directory_cta', enabled: true, props: {} }
  ];
  const upgraded = upgradeOrNormalizePageLayout(legacy);
  assert.deepEqual(upgraded.map((b) => b.type), expectedOrder);
  assert.equal(upgraded.find((b) => b.type === 'hero_banner')?.props.titleLine1, 'Custom');
});

test('Official DCVC data includes Men\'s Collective, Amplify Arts, and top 3 Signature Events', () => {
  assert.ok(communityGroups.some((g) => g.name.includes("Men's Collective")));
  assert.ok(specialEngagements.some((s) => s.title.includes('Amplify Arts')));
  assert.deepEqual(
    annualSignatureEvents.slice(0, 3).map((e) => e.title),
    ['AIDS Walk Ventura', 'Pride Prom', 'Ventura County Pride']
  );
  assert.ok(LOCAL_KNOWLEDGE_BASE.some((k) => k.id === 'core-programs-ordered'));
  assert.ok(LOCAL_KNOWLEDGE_BASE.some((k) => k.id === 'signature-events-distinct'));
});

test('Flex Space availability respects manual overrides and automated weekday schedule', () => {
  const cfg = DEFAULT_SITE_FEATURES.flexSpace;
  // Wednesday 2:00 PM -> open in auto mode
  const wedOpen = new Date(2026, 10, 11, 14, 0, 0);
  assert.equal(computeFlexSpaceStatus({ ...cfg, manualStatus: 'auto' }, wedOpen).isAvailable, true);

  // Sunday 2:00 PM -> outside automated hours
  const sunClosed = new Date(2026, 10, 15, 14, 0, 0);
  assert.equal(computeFlexSpaceStatus({ ...cfg, manualStatus: 'auto' }, sunClosed).isAvailable, false);

  // Manual override
  assert.equal(computeFlexSpaceStatus({ ...cfg, manualStatus: 'occupied' }, wedOpen).isAvailable, false);
  assert.equal(computeFlexSpaceStatus({ ...cfg, manualStatus: 'available' }, sunClosed).isAvailable, true);
});

test('HIV Screening slot booking enforces capacity and prevents overbooking', () => {
  const features = JSON.parse(JSON.stringify(DEFAULT_SITE_FEATURES));
  const slotName = features.hivScreening.slots[0];
  features.hivScreening.slotCapacity = 2;
  features.hivScreening.bookings = [
    { date: '2026-12-01', slot: slotName },
    { date: '2026-12-01', slot: slotName }
  ];
  const avail = getSlotAvailability('hiv', '2026-12-01', features);
  assert.equal(avail[0].remaining, 0);
  assert.equal(avail[0].isFull, true);
  assert.equal(avail[1].remaining, 2);

  // Missing date/slot rejected cleanly
  const bad = bookTimeSlot('hiv', { date: '', slot: '' });
  assert.equal(bad.ok, false);
});

test('Auto Broadcast Popup detects today\'s scheduled events and custom overrides', () => {
  const now = new Date(2026, 10, 12, 12, 0, 0); // Nov 12, 2026
  const events = [
    { id: 'evt-today', slug: 'today-meetup', month: 'NOV', day: '12', year: '2026', title: 'Pride Youth Night', time: '5:30 PM', location: 'CRC' }
  ];
  const popup = getActiveBroadcastPopup(events, DEFAULT_SITE_FEATURES, now);
  assert.ok(popup);
  assert.equal(popup.kind, 'today_event');
  assert.equal(popup.title, 'Pride Youth Night');

  const customFeatures = {
    ...DEFAULT_SITE_FEATURES,
    broadcastPopup: {
      ...DEFAULT_SITE_FEATURES.broadcastPopup,
      customEnabled: true,
      customTitle: 'Urgent Center Notice',
      customMessage: 'Open extended hours tonight!'
    }
  };
  const customPopup = getActiveBroadcastPopup(events, customFeatures, now);
  assert.equal(customPopup.kind, 'custom');
  assert.equal(customPopup.title, 'Urgent Center Notice');
});

