import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  getWeekdayOccurrenceInMonth,
  isProgramScheduledOnDate,
  getProgramsForDate,
  getUpcomingWeeklySchedule,
  DEFAULT_WEEKLY_SCHEDULE
} from '../src/utils/recurringSchedule.js';
import {
  DEFAULT_FORM_SCHEMAS,
  getSiteFeatures,
  getSlotAvailability,
  bookTimeSlot
} from '../src/services/siteFeaturesStore.js';
import { submitVolunteer } from '../src/services/api.js';
import { cmsStore } from '../src/services/cmsStore.js';

describe('DCVC Requested Updates & Weekly Recurring Calendar Engine', () => {

  describe('1. Deterministic Occurrence Engine & Recurring Schedule Logic', () => {
    it('accurately identifies weekday occurrence in month (1st, 2nd, 3rd, 4th, 5th)', () => {
      // November 2026 test dates:
      // Nov 1 = Sun (1st Sun)
      // Nov 2 = Mon (1st Mon)
      // Nov 3 = Tue (1st Tue)
      // Nov 10 = Tue (2nd Tue)
      // Nov 17 = Tue (3rd Tue)
      // Nov 24 = Tue (4th Tue)
      assert.strictEqual(getWeekdayOccurrenceInMonth(new Date(2026, 10, 1)), 1);
      assert.strictEqual(getWeekdayOccurrenceInMonth(new Date(2026, 10, 2)), 1);
      assert.strictEqual(getWeekdayOccurrenceInMonth(new Date(2026, 10, 3)), 1);
      assert.strictEqual(getWeekdayOccurrenceInMonth(new Date(2026, 10, 10)), 2);
      assert.strictEqual(getWeekdayOccurrenceInMonth(new Date(2026, 10, 17)), 3);
      assert.strictEqual(getWeekdayOccurrenceInMonth(new Date(2026, 10, 24)), 4);
    });

    it('distinguishes 1st and 3rd Tuesday (Toastmasters) vs 2nd Tuesday (PFLAG)', () => {
      const toastmasters = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Toastmasters'));
      const pflag = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('PFLAG'));

      assert.ok(toastmasters, 'Toastmasters exists in weekly schedule');
      assert.ok(pflag, 'PFLAG exists in weekly schedule');

      const firstTue = new Date(2026, 10, 3);
      const secondTue = new Date(2026, 10, 10);
      const thirdTue = new Date(2026, 10, 17);
      const fourthTue = new Date(2026, 10, 24);

      // 1st Tuesday: Toastmasters YES, PFLAG NO
      assert.strictEqual(isProgramScheduledOnDate(toastmasters, firstTue), true);
      assert.strictEqual(isProgramScheduledOnDate(pflag, firstTue), false);

      // 2nd Tuesday: Toastmasters NO, PFLAG YES
      assert.strictEqual(isProgramScheduledOnDate(toastmasters, secondTue), false);
      assert.strictEqual(isProgramScheduledOnDate(pflag, secondTue), true);

      // 3rd Tuesday: Toastmasters YES, PFLAG NO
      assert.strictEqual(isProgramScheduledOnDate(toastmasters, thirdTue), true);
      assert.strictEqual(isProgramScheduledOnDate(pflag, thirdTue), false);

      // 4th Tuesday: Neither
      assert.strictEqual(isProgramScheduledOnDate(toastmasters, fourthTue), false);
      assert.strictEqual(isProgramScheduledOnDate(pflag, fourthTue), false);
    });

    it('correctly schedules Queer Adulting (1st & 3rd Wed) and Silver Collective (2nd Thu only)', () => {
      const queerAdulting = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Queer Adulting'));
      const silverCollective = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Silver Collective'));

      assert.ok(queerAdulting);
      assert.ok(silverCollective);

      // Wednesdays in Nov 2026: Nov 4 (1st), Nov 11 (2nd), Nov 18 (3rd), Nov 25 (4th)
      assert.strictEqual(isProgramScheduledOnDate(queerAdulting, new Date(2026, 10, 4)), true);
      assert.strictEqual(isProgramScheduledOnDate(queerAdulting, new Date(2026, 10, 11)), false);
      assert.strictEqual(isProgramScheduledOnDate(queerAdulting, new Date(2026, 10, 18)), true);
      assert.strictEqual(isProgramScheduledOnDate(queerAdulting, new Date(2026, 10, 25)), false);

      // Thursdays in Nov 2026: Nov 5 (1st), Nov 12 (2nd), Nov 19 (3rd), Nov 26 (4th)
      assert.strictEqual(isProgramScheduledOnDate(silverCollective, new Date(2026, 10, 5)), false);
      assert.strictEqual(isProgramScheduledOnDate(silverCollective, new Date(2026, 10, 12)), true);
      assert.strictEqual(isProgramScheduledOnDate(silverCollective, new Date(2026, 10, 19)), false);
      assert.strictEqual(isProgramScheduledOnDate(silverCollective, new Date(2026, 10, 26)), false);
    });

    it('never invents times for programs whose times were not supplied', () => {
      const na = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Narcotics Anonymous'));
      const toastmasters = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Toastmasters'));
      const pflag = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('PFLAG'));
      const queerAdulting = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Queer Adulting'));
      const silver = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Silver Collective'));
      const ru = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Rainbow Umbrella'));
      const unicorns = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Little Unicorns'));
      const transverse = DEFAULT_WEEKLY_SCHEDULE.find(p => p.name.includes('Transverse'));

      // Supplied times
      assert.strictEqual(na.time, '6:00 PM');
      assert.strictEqual(toastmasters.time, '6:15 PM');
      assert.strictEqual(pflag.time, '6:30 PM');

      // Unsupplied times: must remain empty, never invented
      assert.strictEqual(queerAdulting.time, '');
      assert.strictEqual(silver.time, '');
      assert.strictEqual(ru.time, '');
      assert.strictEqual(unicorns.time, '');
      assert.strictEqual(transverse.time, '');
    });

    it('getUpcomingWeeklySchedule excludes past days and sorts chronologically', () => {
      const midWeek = new Date(2026, 10, 11); // Wednesday
      const upcoming = getUpcomingWeeklySchedule(midWeek, DEFAULT_WEEKLY_SCHEDULE, []);

      assert.ok(upcoming.length > 0, 'Should return upcoming days');
      
      // All returned days must be on or after midWeek
      upcoming.forEach(day => {
        assert.ok(day.date >= new Date(2026, 10, 11), 'Returned dates must be on or after current day');
      });

      // Must be strictly chronological
      for (let i = 0; i < upcoming.length - 1; i++) {
        assert.ok(upcoming[i].date <= upcoming[i + 1].date, 'Must be sorted in chronological order');
      }
    });

    it('all weekly programs link to specific program pages rather than general community', () => {
      DEFAULT_WEEKLY_SCHEDULE.forEach(prog => {
        assert.ok(
          prog.link.startsWith('/programs/'),
          `Program "${prog.name}" link must start with /programs/, got "${prog.link}"`
        );
        assert.notStrictEqual(
          prog.link,
          '/community',
          `Program "${prog.name}" must not point to generic /community`
        );
      });
    });
  });

  describe('2. STI Screening Form Validation & Options Preservation', () => {
    it('contains non-empty selection options for service and preferred language', () => {
      const hivSchema = DEFAULT_FORM_SCHEMAS.hiv_screening;
      assert.ok(hivSchema, 'HIV schema exists');

      const serviceField = hivSchema.fields.find(f => f.id === 'service');
      const langField = hivSchema.fields.find(f => f.id === 'preferredLanguage');

      assert.ok(serviceField, 'Service field exists');
      assert.ok(Array.isArray(serviceField.options) && serviceField.options.length > 0, 'Service options must be non-empty');
      assert.ok(serviceField.options.some(o => o.includes('HIV') || o.includes('Fingerstick')));

      assert.ok(langField, 'Preferred language field exists');
      assert.ok(Array.isArray(langField.options) && langField.options.length > 0, 'Language options must be non-empty');
      assert.ok(langField.options.includes('English'));
      assert.ok(langField.options.includes('Español (Spanish)'));
    });

    it('prevents overbooking when a time slot reaches capacity', () => {
      const testDate = '2026-11-30';
      const slotName = '3:00 PM – 4:00 PM';

      // hivScreening capacity is 4
      for (let i = 0; i < 4; i++) {
        const res = bookTimeSlot('hiv', { date: testDate, slot: slotName, name: `Client ${i + 1}`, contact: `c${i + 1}@example.com` });
        assert.strictEqual(res.ok, true);
      }

      // Fifth booking should be rejected (overbooking prevention)
      const resOverflow = bookTimeSlot('hiv', { date: testDate, slot: slotName, name: 'Client 5', contact: 'c5@example.com' });
      assert.strictEqual(resOverflow.ok, false);
      assert.match(resOverflow.error, /full/i);
    });
  });

  describe('3. Volunteer Application Form Requirements', () => {
    it('requires name and volunteer verification consent', async () => {
      // Empty name should fail
      const res1 = await submitVolunteer({
        preferredName: '',
        fullName: '',
        email: 'vol@example.com',
        backgroundCheckConsent: true
      });
      assert.strictEqual(res1.success, false);

      // Missing consent should fail
      const res2 = await submitVolunteer({
        preferredName: 'Alex',
        fullName: 'Alex Smith',
        email: 'vol@example.com',
        backgroundCheckConsent: false
      });
      assert.strictEqual(res2.success, false);
    });

    it('addresses volunteer by Preferred Name in confirmation message and data', async () => {
      const res = await submitVolunteer({
        preferredName: 'River',
        pronouns: 'they/them',
        fullName: 'River Legal Harrison',
        email: 'river@example.com',
        backgroundCheckConsent: true
      });

      assert.strictEqual(res.success, true);
      assert.match(res.message, /Thank you, River!/, 'Must address volunteer by Preferred Name');
      assert.strictEqual(res.data.preferredName, 'River');
      assert.strictEqual(res.data.pronouns, 'they/them');
      assert.strictEqual(res.data.fullName, 'River Legal Harrison');
    });
  });

  describe('4. Programs Page & Footer Regression-Safe Verifications', () => {
    it('Programs.jsx uses "Affirming Spaces" and removes "Affirming Sanctuaries"', () => {
      const content = fs.readFileSync(path.join(process.cwd(), 'src/pages/Programs.jsx'), 'utf8');
      assert.ok(!content.includes('Affirming Sanctuaries.'), 'Must not contain "Affirming Sanctuaries."');
      assert.ok(content.includes('Affirming Spaces.'), 'Must contain "Affirming Spaces."');
    });

    it('Footer.jsx removes "Verified Civic Alliances" section while retaining regional cities', () => {
      const content = fs.readFileSync(path.join(process.cwd(), 'src/components/Footer.jsx'), 'utf8');
      assert.ok(!content.includes('VERIFIED CIVIC ALLIANCES & PUBLIC HEALTH LEADERSHIP'), 'Must remove civic alliances section');
      assert.ok(content.includes('Serving Ventura County Communities:'), 'Must retain regional cities ribbon');
      assert.ok(content.includes('Ventura'), 'Retains Ventura link');
      assert.ok(content.includes('Oxnard'), 'Retains Oxnard link');
    });

    it('Home.jsx contains UpcomingWeekSection positioned between stats and programs', () => {
      const content = fs.readFileSync(path.join(process.cwd(), 'src/pages/Home.jsx'), 'utf8');
      assert.ok(content.includes('UpcomingWeekSection'), 'Home imports UpcomingWeekSection');
      const upcomingPos = content.indexOf('<UpcomingWeekSection');
      const programsPos = content.indexOf('data-block-id="block-programs"');
      const statsPos = content.indexOf('data-block-id="block-stats"');

      assert.ok(upcomingPos > statsPos, 'Upcoming section is placed after Community Impact stats');
      assert.ok(upcomingPos < programsPos, 'Upcoming section is placed before Programs section');
    });
  });

  describe('5. Admin CMS Store Weekly Schedule Management', () => {
    it('allows admins to retrieve, save and delete weekly recurring programs', () => {
      const schedule = cmsStore.getWeeklySchedule();
      assert.ok(Array.isArray(schedule), 'Weekly schedule is an array');
      assert.ok(schedule.length >= 8, 'Has at least 8 weekly programs');

      // Add a test weekly program
      const testProg = {
        id: 'test-weekly-circle',
        name: 'Youth Art Circle',
        dayOfWeek: 4,
        dayName: 'Thursday',
        recurrence: 'every',
        recurrenceLabel: 'Every Thursday',
        time: '4:00 PM',
        category: 'Youth Arts'
      };

      cmsStore.saveWeeklyProgram(testProg);
      const afterSave = cmsStore.getWeeklySchedule();
      const found = afterSave.find(p => p.id === 'test-weekly-circle');
      assert.ok(found, 'Saved program exists in schedule');
      assert.strictEqual(found.name, 'Youth Art Circle');

      // Delete program
      cmsStore.deleteWeeklyProgram('test-weekly-circle');
      const afterDelete = cmsStore.getWeeklySchedule();
      assert.ok(!afterDelete.some(p => p.id === 'test-weekly-circle'), 'Deleted program removed from schedule');
    });
  });
});
