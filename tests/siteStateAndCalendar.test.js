import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseEventDate,
  normalizeCmsEvent,
  findBestCalendarMonth
} from '../src/utils/eventDates.js';
import {
  sanitizePublicUrl,
  sanitizeSiteTheme,
  sanitizeSiteStatePatch
} from '../worker/src/siteStateService.js';
import { DEFAULT_HERO_THEME_ID } from '../src/data/siteDefaults.js';
import { HERO_THEMES, resolveHeroTheme } from '../src/services/heroThemeStore.js';

test('parseEventDate parses ISO, human-readable, and legacy event fields consistently', () => {
  const iso = parseEventDate('2026-08-15');
  assert.equal(iso.isoDate, '2026-08-15');
  assert.equal(iso.monthAbbr, 'AUG');
  assert.equal(iso.monthIndex, 7);
  assert.equal(iso.day, 15);
  assert.equal(iso.year, 2026);
  assert.equal(iso.displayDate, 'August 15, 2026');

  const human = parseEventDate('October 9, 2026');
  assert.equal(human.isoDate, '2026-10-09');
  assert.equal(human.monthAbbr, 'OCT');
  assert.equal(human.day, 9);

  const legacy = parseEventDate({ month: 'JUN', day: '14', year: '2026' });
  assert.equal(legacy.isoDate, '2026-06-14');
  assert.equal(legacy.monthAbbr, 'JUN');

  assert.equal(parseEventDate('To Be Announced'), null);
});

test('normalizeCmsEvent auto-populates calendar month/day/year/isoDate for Admin-created events', () => {
  const fromPicker = normalizeCmsEvent({
    id: 'evt-new',
    title: 'Summer Pride Mixer',
    isoDate: '2026-07-18',
    location: 'Ventura Harbor'
  });

  assert.equal(fromPicker.month, 'JUL');
  assert.equal(fromPicker.day, '18');
  assert.equal(fromPicker.year, '2026');
  assert.equal(fromPicker.date, 'July 18, 2026');

  const fromText = normalizeCmsEvent({
    title: 'Winter Youth Gala',
    date: 'December 5, 2026'
  });
  assert.equal(fromText.isoDate, '2026-12-05');
  assert.equal(fromText.month, 'DEC');
  assert.equal(fromText.day, '5');
});

test('findBestCalendarMonth selects active event month instead of hardcoding October', () => {
  const julyEvents = [
    { id: '1', title: 'Pride Kickoff', isoDate: '2026-07-04' },
    { id: '2', title: 'Beach Hangout', isoDate: '2026-07-19' }
  ];
  const chosen = findBestCalendarMonth(julyEvents, new Date(2026, 6, 1));
  assert.equal(chosen.getFullYear(), 2026);
  assert.equal(chosen.getMonth(), 6);
});

test('sanitizePublicUrl and sanitizeSiteTheme block unsafe protocols and CSS injections', () => {
  assert.equal(sanitizePublicUrl('javascript:alert(1)', ''), '');
  assert.equal(sanitizePublicUrl('data:text/html,<script>alert(1)</script>', ''), '');
  assert.equal(sanitizePublicUrl('/images/volunteers.jpg', ''), '/images/volunteers.jpg');
  assert.equal(
    sanitizePublicUrl('https://diversitycollectivevc.org/pride', ''),
    'https://diversitycollectivevc.org/pride'
  );

  const theme = sanitizeSiteTheme({
    btnPrimaryBg: '#5A1E65',
    btnPrimaryBgGradient: 'linear-gradient(135deg, #5A1E65 0%, #7E22CE 100%)',
    headingFont: 'Plus Jakarta Sans',
    badInjection: 'red; behavior: url(evil.htc)',
    btnSecondaryBg: 'url(javascript:alert(1))'
  });
  assert.equal(theme.btnPrimaryBg, '#5A1E65');
  assert.equal(theme.headingFont, 'Plus Jakarta Sans');
  assert.equal(theme.badInjection, undefined);
  assert.equal(theme.btnSecondaryBg, undefined);
});

test('sanitizeSiteStatePatch enforces structure, strips unsafe URLs, and rejects oversized payloads', () => {
  const valid = sanitizeSiteStatePatch(
    {
      heroTheme: 'portal',
      layoutBlocks: [
        {
          id: 'block-hero_banner',
          type: 'hero_banner',
          label: 'Hero',
          enabled: true,
          props: {
            titleLine1: 'You Belong',
            photoUrl: '/images/volunteers.jpg',
            primaryCtaLink: 'javascript:alert(1)'
          }
        }
      ]
    },
    { heroTheme: 'aurora' }
  );

  assert.equal(valid.heroTheme, 'portal');
  assert.equal(valid.layoutBlocks.length, 1);
  assert.equal(valid.layoutBlocks[0].props.photoUrl, '/images/volunteers.jpg');
  assert.equal(valid.layoutBlocks[0].props.primaryCtaLink, '');

  assert.throws(() => sanitizeSiteStatePatch({ heroTheme: '../bad' }), /Invalid heroTheme/);
  assert.throws(() => sanitizeSiteStatePatch({ layoutBlocks: [] }), /non-empty array/);

  const hugeString = 'x'.repeat(800 * 1024);
  assert.throws(
    () =>
      sanitizeSiteStatePatch({
        layoutBlocks: [{ id: '1', type: 'hero_banner', props: { subtitle: hugeString } }]
      }),
    /exceeds maximum allowed size/
  );
});

test('heroThemeStore aligns default flagship aurora design with Admin picker themes', () => {
  assert.equal(DEFAULT_HERO_THEME_ID, 'aurora');
  assert.equal(resolveHeroTheme(null).id, 'aurora');
  assert.equal(resolveHeroTheme('non-existent').id, 'aurora');
  assert.ok(HERO_THEMES.some((t) => t.id === 'aurora'));
  assert.ok(HERO_THEMES.some((t) => t.id === 'portal'));
});

test('sanitizeSiteStatePatch accepts and sanitizes siteFeatures (flexSpace & formSchemas)', () => {
  const patch = {
    siteFeatures: {
      flexSpace: {
        title: 'Community Flex Space Test',
        slots: ['1:00 PM – 2:00 PM', '2:00 PM – 3:00 PM']
      },
      formSchemas: {
        flex_space: {
          title: 'Custom Flex Booking Title',
          submitLabel: 'Reserve Now',
          fields: [
            { id: 'name', label: 'Organization Name', type: 'text', required: true }
          ]
        }
      }
    }
  };
  const res = sanitizeSiteStatePatch(patch, {});
  assert.equal(res.siteFeatures.flexSpace.title, 'Community Flex Space Test');
  assert.equal(res.siteFeatures.formSchemas.flex_space.title, 'Custom Flex Booking Title');
  assert.equal(res.siteFeatures.formSchemas.flex_space.fields[0].label, 'Organization Name');
});

