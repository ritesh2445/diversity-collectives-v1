// Calendar Utility Tests
// Validates .ics iCalendar generation and Google Calendar web link parameters

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildIcsString, getGoogleCalendarUrl } from '../src/utils/calendar.js';

describe('Calendar Utility', () => {
  const sampleEvent = {
    title: 'Rainbow Umbrella Weekly Meeting',
    description: 'Weekly peer support group for LGBTQ+ youth ages 13-23.',
    location: '2471 Portola Road, Suite 100, Ventura, CA 93003',
    date: '2025-06-20',
    time: '5:30 PM - 7:30 PM'
  };

  it('buildIcsString produces valid VCALENDAR and VEVENT structure', () => {
    const ics = buildIcsString(sampleEvent);

    assert.ok(ics.includes('BEGIN:VCALENDAR'), 'Missing BEGIN:VCALENDAR');
    assert.ok(ics.includes('VERSION:2.0'), 'Missing VERSION:2.0');
    assert.ok(ics.includes('PRODID:-//Diversity Collective Ventura County'), 'Missing PRODID');
    assert.ok(ics.includes('BEGIN:VEVENT'), 'Missing BEGIN:VEVENT');
    assert.ok(ics.includes('SUMMARY:Rainbow Umbrella Weekly Meeting'), 'Missing SUMMARY');
    assert.ok(ics.includes('LOCATION:2471 Portola Road, Suite 100, Ventura, CA 93003'), 'Missing LOCATION');
    assert.ok(ics.includes('END:VEVENT'), 'Missing END:VEVENT');
    assert.ok(ics.includes('END:VCALENDAR'), 'Missing END:VCALENDAR');
  });

  it('getGoogleCalendarUrl formats URL with correct query parameters', () => {
    const url = getGoogleCalendarUrl(sampleEvent);

    assert.ok(url.includes('https://calendar.google.com/calendar/render?action=TEMPLATE'));
    assert.ok(url.includes('text=' + encodeURIComponent(sampleEvent.title)));
    assert.ok(url.includes('location=' + encodeURIComponent(sampleEvent.location)));
    assert.ok(url.includes('details='));
  });
});
