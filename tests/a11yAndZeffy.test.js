import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { boardMembers, getBoardMemberSlug, programsList, trainingCourses } from '../src/data/dcvcData.js';
import {
  DEFAULT_SETTINGS,
  a11yStore
} from '../src/accessibility/a11yStore.js';
import { focusAudio } from '../src/accessibility/focusAudio.js';
import { applyBionicReading, clearBionicReading } from '../src/accessibility/bionicReader.js';
import { searchSiteWithSuggestions } from '../src/utils/smartSiteSearch.js';
import { executeClientChat } from '../src/services/localKnowledgeEngine.js';
import { processChatRequest } from '../worker/src/chatEngine.js';
import { executeZeffySync } from '../worker/src/zeffySync.js';

describe('Board Member Editorial Profiles & Slugs', () => {
  it('derives deterministic URL slugs and includes rich editorial fields for every board member', () => {
    assert.ok(boardMembers.length >= 5);
    const seenSlugs = new Set();
    for (const member of boardMembers) {
      const slug = getBoardMemberSlug(member);
      assert.ok(slug && !slug.includes(' '), `Invalid slug for ${member.name}: ${slug}`);
      assert.ok(!seenSlugs.has(slug), `Duplicate slug: ${slug}`);
      seenSlugs.add(slug);
      assert.ok(member.quote, `Missing pull quote on ${member.name}`);
      assert.ok(Array.isArray(member.extendedBio) && member.extendedBio.length > 0, `Missing extendedBio on ${member.name}`);
      assert.ok(Array.isArray(member.focusAreas) && member.focusAreas.length > 0, `Missing focusAreas on ${member.name}`);
    }
  });
});

describe('Dyslexia Accessibility & Focus Audio Engine', () => {
  it('exposes default dyslexia/bionic settings and toggles them via a11yStore', () => {
    assert.strictEqual(DEFAULT_SETTINGS.dyslexiaMode, false);
    assert.strictEqual(DEFAULT_SETTINGS.bionicReading, false);

    a11yStore.resetAll();
    a11yStore.toggleDyslexiaMode();
    const dyslexicState = a11yStore.getState();
    assert.strictEqual(dyslexicState.dyslexiaMode, true);
    assert.strictEqual(dyslexicState.fontFamily, 'opendyslexic');
    assert.strictEqual(dyslexicState.textAlign, 'left');
    assert.strictEqual(dyslexicState.dyslexiaTint, 'cream');

    a11yStore.toggleDyslexiaMode();
    const toggledOff = a11yStore.getState();
    assert.strictEqual(toggledOff.dyslexiaMode, false);
    assert.strictEqual(toggledOff.fontFamily, 'default');
    assert.strictEqual(toggledOff.textAlign, 'normal');

    a11yStore.toggleBionicReading();
    assert.strictEqual(a11yStore.getState().bionicReading, true);
    a11yStore.resetAll();
  });

  it('gracefully handles focusAudio & bionicReader APIs safely when DOM / Web Audio are unavailable (SSR / Node)', async () => {
    focusAudio.init();
    focusAudio.setVolume(0.75);
    assert.strictEqual(focusAudio.volume, 0.75);
    for (const trackId of ['rain', 'brown-noise', 'ocean', 'chimes', 'silence']) {
      const played = await focusAudio.playFocusTrack(trackId);
      assert.strictEqual(played, false);
    }
    focusAudio.stop();
    assert.strictEqual(focusAudio.activeTrack, null);

    assert.doesNotThrow(() => applyBionicReading(null));
    assert.doesNotThrow(() => clearBionicReading(null));
  });
});

describe('Zeffy Confirmed Payment & Automatic Recurring Heartfelt Email', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('issues card and auto-sends heartfelt recurring email ONLY when Zeffy confirms non-refunded payment', async () => {
    const queries = [];
    const insertedCards = [];
    const sentEmails = [];

    const mockDb = {
      async execute({ sql, args = [] }) {
        queries.push({ sql, args });
        if (sql.includes('FROM reconciliation_sync_state')) {
          return { rows: [{ last_cursor: null, last_sync_timestamp: null }] };
        }
        if (sql.includes('SELECT id, card_token, status FROM donation_appreciation_cards')) {
          return { rows: [] };
        }
        if (sql.includes('FROM donation_intents')) {
          return { rows: [] };
        }
        if (sql.includes('INSERT INTO donation_appreciation_cards')) {
          insertedCards.push(args);
          return { rows: [] };
        }
        if (sql.includes('FROM donation_appreciation_cards WHERE status = \'active\'')) {
          return { rows: [] };
        }
        return { rows: [] };
      }
    };

    globalThis.fetch = async (url) => {
      assert.match(String(url), /^https:\/\/api\.zeffy\.com\/api\/v1\/payments/);
      return new Response(
        JSON.stringify({
          data: [
            {
              id: 'pay_rec_001',
              amount: 5000,
              recurrence: 'monthly',
              buyer: { email: 'jordan@example.org', name: 'Jordan Vance' }
            },
            {
              id: 'pay_ref_002',
              amount: 2500,
              refunded: true,
              buyer: { email: 'refund@example.org', name: 'Refunded Donor' }
            }
          ],
          has_more: false
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const result = await executeZeffySync(
      { ZEFFY_API_KEY: 'zf_test_key', FRONTEND_BASE_URL: 'https://diversitycollective.org' },
      mockDb,
      null,
      async (mail) => {
        sentEmails.push(mail);
      }
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.processed, 2);

    // Only the confirmed payment got a card & email; the refunded payment did NOT
    assert.strictEqual(insertedCards.length, 1);
    assert.strictEqual(insertedCards[0][7], 'Jordan Vance');
    assert.strictEqual(insertedCards[0][11], 'monthly');

    assert.strictEqual(sentEmails.length, 1);
    assert.strictEqual(sentEmails[0].to, 'jordan@example.org');
    assert.match(sentEmails[0].subject, /Recurring Sustainer Appreciation Card & Heartfelt Thanks/);
    assert.match(sentEmails[0].html, /Jordan Vance/);
    assert.match(sentEmails[0].html, /https:\/\/diversitycollective\.org\/appreciation-card\/[a-f0-9]{48}/);
  });
});

describe('P.R.I.D.E. Training Copy, Smart Search & Luna Conversational Intelligence', () => {
  it('removes "4 hour" / "4-hour" text from P.R.I.D.E. training program and workshop catalog', () => {
    const prideProg = programsList.find((p) => p.slug === 'pride-training');
    assert.ok(prideProg);
    assert.doesNotMatch(JSON.stringify(prideProg), /4\s*-?\s*hour/i);

    const prideCourse = trainingCourses.find((c) => c.slug === 'pride-cultural-competency');
    assert.ok(prideCourse);
    assert.doesNotMatch(JSON.stringify(prideCourse), /4\s*-?\s*hour/i);
  });

  it('auto-corrects misspelled queries in Smart Sitewide Search and indexes live Sanity/CMS updates', () => {
    const typoTraining = searchSiteWithSuggestions('traning');
    assert.strictEqual(typoTraining.correctedQuery, 'training');
    assert.ok(typoTraining.suggestions.includes('training'));
    assert.ok(typoTraining.results.some((r) => r.url.includes('/training')));

    const typoDyslexia = searchSiteWithSuggestions('dislexia');
    assert.strictEqual(typoDyslexia.correctedQuery, 'dyslexia');
    assert.ok(typoDyslexia.results.some((r) => r.url === '/accessibility'));

    const liveEventSearch = searchSiteWithSuggestions('Moonlight', {
      customSnapshot: {
        events: [
          {
            slug: 'moonlight-picnic-live',
            title: 'Moonlight Community Picnic',
            date: 'July 14, 2026',
            time: '7:00 PM',
            location: 'Ventura Harbor Lawn',
            summary: 'Live acoustic evening under the stars.'
          }
        ]
      }
    });
    assert.ok(liveEventSearch.results.some((r) => r.url === '/events/moonlight-picnic-live'));
  });

  it('replies naturally to Hi, Hello, casual small talk, typos, board members, and latest live site data in Luna', async () => {
    const hiRes = executeClientChat('Hi!');
    assert.strictEqual(hiRes.success, true);
    assert.strictEqual(hiRes.mode, 'client-conversational');
    assert.match(hiRes.answer, /Luna/);

    const howAreYou = executeClientChat('how are u doing today?');
    assert.strictEqual(howAreYou.success, true);
    assert.match(howAreYou.answer, /thank you for asking/i);

    const boardRes = executeClientChat('Who is Steve Somann?');
    assert.strictEqual(boardRes.success, true);
    assert.match(boardRes.answer, /Steve Somann/);
    assert.ok(boardRes.citations.some((c) => c.url.includes('/board/steve-somann')));

    const typoBoardRes = executeClientChat('tell me about stve soman');
    assert.strictEqual(typoBoardRes.success, true);
    assert.match(typoBoardRes.answer, /Steve Somann/);

    const dyslexiaRes = executeClientChat('do u have dislexia support');
    assert.strictEqual(dyslexiaRes.success, true);
    assert.match(dyslexiaRes.answer, /OpenDyslexic|Dyslexia/i);

    const workerHello = await processChatRequest('Hello Luna!', {}, '198.51.100.77');
    assert.strictEqual(workerHello.success, true);
    assert.strictEqual(workerHello.mode, 'conversational');
    assert.match(workerHello.answer, /Luna/);

    const workerLiveSite = await processChatRequest(
      'Tell me about Moonlight Community Picnic',
      {},
      '198.51.100.78',
      {
        siteContext: [
          {
            type: 'Event',
            title: 'Moonlight Community Picnic',
            subtitle: 'July 14, 2026 · Ventura Harbor Lawn',
            snippet: 'Live acoustic evening under the stars for LGBTQ+ neighbors.',
            url: '/events/moonlight-picnic-live'
          }
        ]
      }
    );
    assert.strictEqual(workerLiveSite.success, true);
    assert.match(workerLiveSite.answer, /Moonlight Community Picnic/);
    assert.ok(workerLiveSite.citations.some((c) => c.url === '/events/moonlight-picnic-live'));
  });
});
