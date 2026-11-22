import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { liveEvents } from '../src/data/dcvcData.js';
import { cmsStore } from '../src/services/cmsStore.js';
import {
  parseEventDate,
  getCurrentPacificDate,
  getPacificEventEndTimestamp,
  isUpcomingEvent,
  isPastEvent,
  filterUpcomingEvents,
  filterPastEvents,
  findBestCalendarMonth
} from '../src/utils/eventDates.js';

describe('Real DCVC Calendar & Strategic Timezone Evaluation', () => {

  it('1. Prepopulates full authentic calendar feed from diversitycollectivevc.org', () => {
    const events = cmsStore.getEvents();
    assert.ok(events.length >= 29, `Must contain at least 29 events from live feed, got ${events.length}`);

    // Verify key real community groups and events from diversitycollectivevc.org
    const titles = events.map(e => e.title);
    assert.ok(titles.some(t => t.includes('Narcotics Anonymous')), 'Contains Narcotics Anonymous');
    assert.ok(titles.some(t => t.includes('Rainbow Umbrella Youth Group')), 'Contains Rainbow Umbrella Youth Group');
    assert.ok(titles.some(t => t.includes('Little Unicorns Youth Group')), 'Contains Little Unicorns Youth Group');
    assert.ok(titles.some(t => t.includes('Trans Peer Group by Transverse')), 'Contains Trans Peer Group by Transverse');
    assert.ok(titles.some(t => t.includes('Diversity Toastmasters')), 'Contains Diversity Toastmasters');
    assert.ok(titles.some(t => t.includes('Queer Adulting Group')), 'Contains Queer Adulting Group');
    assert.ok(titles.some(t => t.includes('HIV & STI Screenings')), 'Contains Free Confidential HIV & STI Screenings');
    assert.ok(titles.some(t => t.includes('Silver Collective')), 'Contains Silver Collective');
  });

  it('2. Properly flags Rainbow Umbrella 11/27 Thanksgiving cancellation notice', () => {
    const events = cmsStore.getEvents();
    const ruThanksgiving = events.find(e => e.title.includes('Rainbow Umbrella') && e.isoDate === '2026-11-27');
    assert.ok(ruThanksgiving, 'Rainbow Umbrella on 2026-11-27 must exist');
    assert.equal(ruThanksgiving.isCancelled, true, 'Must be marked as cancelled');
    assert.ok(ruThanksgiving.cancellationNotice.toLowerCase().includes('thanksgiving'), 'Cancellation notice mentions Thanksgiving');
  });

  it('3. In upcoming events, NO past events shall be shown', () => {
    const events = cmsStore.getEvents();
    // Reference date: current system time in late Nov 2026
    const upcoming = filterUpcomingEvents(events);
    const past = filterPastEvents(events);

    assert.ok(upcoming.length > 0, 'Must have upcoming events');
    assert.ok(past.length > 0, 'Must have past events (e.g. October events)');

    // Ensure strictly no overlap and no past events in upcoming
    for (const evt of upcoming) {
      assert.equal(isPastEvent(evt), false, `Upcoming event ${evt.title} (${evt.isoDate}) must not be past`);
      assert.equal(isUpcomingEvent(evt), true, `Upcoming event ${evt.title} (${evt.isoDate}) must be upcoming`);
      // No October 2026 event can be in upcoming
      assert.ok(!evt.isoDate.startsWith('2026-10'), `October event ${evt.title} must not be in upcoming`);
    }

    for (const evt of past) {
      assert.equal(isUpcomingEvent(evt), false, `Past event ${evt.title} (${evt.isoDate}) must not be upcoming`);
      assert.equal(isPastEvent(evt), true, `Past event ${evt.title} (${evt.isoDate}) must be past`);
    }
  });

  it('4. Timezone Strategy: Event occurring today in California does NOT expire prematurely for users in ahead timezones (IST, JST)', () => {
    // Suppose an event is on 2026-11-23 from 6:00 PM to 7:00 PM in California (America/Los_Angeles)
    const testEvt = {
      title: 'Narcotics Anonymous Evening Group',
      isoDate: '2026-11-23',
      time: '6:00 PM — 7:00 PM'
    };

    // Simulated user time in India (IST, UTC+5:30): Monday Nov 23, 10:00 AM IST
    // That corresponds to Sunday Nov 22, 8:30 PM PST.
    const indiaMorning = new Date('2026-11-23T04:30:00.000Z'); // 10:00 AM IST
    assert.equal(isUpcomingEvent(testEvt, indiaMorning), true, 'Must still be upcoming when viewed from India morning');

    // Simulated user time in Tokyo (JST, UTC+9): Tuesday Nov 24, 9:00 AM JST
    // That corresponds to Monday Nov 23, 4:00 PM PST (2 hours before event start).
    const tokyoTuesdayMorning = new Date('2026-11-24T00:00:00.000Z'); // 9:00 AM JST
    assert.equal(isUpcomingEvent(testEvt, tokyoTuesdayMorning), true, 'Must still be upcoming in Tokyo even though their local day is Nov 24!');

    // Once event ends in California at 7:00 PM PST (Nov 24 3:00 AM UTC):
    const afterEventEnded = new Date('2026-11-24T03:05:00.000Z'); // 7:05 PM PST
    assert.equal(isUpcomingEvent(testEvt, afterEventEnded), false, 'Must be marked past after 7:00 PM PST concludes');
    assert.equal(isPastEvent(testEvt, afterEventEnded), true, 'Must be past after conclusion');
  });

  it('5. All-day observances remain active until California midnight', () => {
    const worldAidsDay = {
      title: '(World AIDS Day)',
      isoDate: '2026-12-01',
      time: 'All Day'
    };

    // On Dec 1 at 10:00 PM PST (Dec 2 06:00 UTC)
    const lateNightDec1 = new Date('2026-12-02T06:00:00.000Z');
    assert.equal(isUpcomingEvent(worldAidsDay, lateNightDec1), true, 'All day event is active on Dec 1 10 PM PST');

    // On Dec 2 at 12:05 AM PST (Dec 2 08:05 UTC)
    const justPastMidnightDec2 = new Date('2026-12-02T08:05:00.000Z');
    assert.equal(isUpcomingEvent(worldAidsDay, justPastMidnightDec2), false, 'Becomes past once Dec 1 ends in California');
  });

  it('6. findBestCalendarMonth focuses on current/upcoming event month in California time', () => {
    const events = cmsStore.getEvents();
    const bestMonth = findBestCalendarMonth(events);
    assert.ok(bestMonth instanceof Date);
    // Should focus on November 2026 (or December 2026)
    assert.ok(bestMonth.getFullYear() === 2026 || bestMonth.getFullYear() === 2027);
  });

});
