import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  parseVoiceIntent, 
  findRouteByQuery, 
  VOICE_ROUTES, 
  VOICE_COMMAND_CATEGORIES 
} from '../src/accessibility/voiceCommands.js';

test('Voice Command Engine: Scrolling Actions', async (t) => {
  await t.test('detects scroll to top from various natural phrasing', () => {
    assert.deepEqual(parseVoiceIntent('scroll to top'), { type: 'SCROLL', target: 'top' });
    assert.deepEqual(parseVoiceIntent('scroll top'), { type: 'SCROLL', target: 'top' });
    assert.deepEqual(parseVoiceIntent('go to top'), { type: 'SCROLL', target: 'top' });
    assert.deepEqual(parseVoiceIntent('top of page'), { type: 'SCROLL', target: 'top' });
    assert.deepEqual(parseVoiceIntent('top'), { type: 'SCROLL', target: 'top' });
  });

  await t.test('detects scroll to bottom and halfway', () => {
    assert.deepEqual(parseVoiceIntent('scroll to bottom'), { type: 'SCROLL', target: 'bottom' });
    assert.deepEqual(parseVoiceIntent('bottom of page'), { type: 'SCROLL', target: 'bottom' });
    assert.deepEqual(parseVoiceIntent('scroll halfway'), { type: 'SCROLL', target: 'halfway' });
    assert.deepEqual(parseVoiceIntent('middle of page'), { type: 'SCROLL', target: 'halfway' });
  });

  await t.test('detects incremental and fast directional scrolling', () => {
    assert.deepEqual(parseVoiceIntent('scroll down'), { type: 'SCROLL', target: 'down' });
    assert.deepEqual(parseVoiceIntent('page down'), { type: 'SCROLL', target: 'down' });
    assert.deepEqual(parseVoiceIntent('scroll up'), { type: 'SCROLL', target: 'up' });
    assert.deepEqual(parseVoiceIntent('page up'), { type: 'SCROLL', target: 'up' });
    assert.deepEqual(parseVoiceIntent('fast scroll down'), { type: 'SCROLL', target: 'fast_down' });
    assert.deepEqual(parseVoiceIntent('scroll a little'), { type: 'SCROLL', target: 'small_down' });
  });
});

test('Voice Command Engine: Tapping & Clicking Interactive Elements', async (t) => {
  await t.test('parses tap command with target button / link name', () => {
    assert.deepEqual(parseVoiceIntent('tap donate'), { type: 'TAP', target: 'donate' });
    assert.deepEqual(parseVoiceIntent('tap submit a resource'), { type: 'TAP', target: 'submit a resource' });
    assert.deepEqual(parseVoiceIntent('tap explore free programs'), { type: 'TAP', target: 'explore free programs' });
    assert.deepEqual(parseVoiceIntent('tap rapid testing'), { type: 'TAP', target: 'rapid testing' });
  });

  await t.test('parses alternative verbs: click, press, select, choose', () => {
    assert.deepEqual(parseVoiceIntent('click close'), { type: 'TAP', target: 'close' });
    assert.deepEqual(parseVoiceIntent('press download'), { type: 'TAP', target: 'download' });
    assert.deepEqual(parseVoiceIntent('select monthly'), { type: 'TAP', target: 'monthly' });
    assert.deepEqual(parseVoiceIntent('choose youth'), { type: 'TAP', target: 'youth' });
  });
});

test('Voice Command Engine: Route & Page Navigation', async (t) => {
  await t.test('finds all core routes via query or keyword', () => {
    assert.equal(findRouteByQuery('home')?.path, '/');
    assert.equal(findRouteByQuery('about')?.path, '/about');
    assert.equal(findRouteByQuery('staff')?.path, '/board-and-staff');
    assert.equal(findRouteByQuery('programs')?.path, '/programs');
    assert.equal(findRouteByQuery('events')?.path, '/events');
    assert.equal(findRouteByQuery('calendar')?.path, '/events');
    assert.equal(findRouteByQuery('directory')?.path, '/directory');
    assert.equal(findRouteByQuery('news')?.path, '/news');
    assert.equal(findRouteByQuery('gallery')?.path, '/gallery');
    assert.equal(findRouteByQuery('volunteer')?.path, '/volunteer');
    assert.equal(findRouteByQuery('donate')?.path, '/donate');
    assert.equal(findRouteByQuery('contact')?.path, '/contact');
    assert.equal(findRouteByQuery('accessibility')?.path, '/accessibility');
  });

  await t.test('parses "open page" and "go to" navigation commands', () => {
    const home = parseVoiceIntent('open page home');
    assert.equal(home?.type, 'NAVIGATE');
    assert.equal(home?.path, '/');

    const events = parseVoiceIntent('go to events');
    assert.equal(events?.type, 'NAVIGATE');
    assert.equal(events?.path, '/events');

    const programs = parseVoiceIntent('open programs');
    assert.equal(programs?.type, 'NAVIGATE');
    assert.equal(programs?.path, '/programs');

    const contact = parseVoiceIntent('navigate to contact');
    assert.equal(contact?.type, 'NAVIGATE');
    assert.equal(contact?.path, '/contact');
  });
});

test('Voice Command Engine: Search & Form Controls', async (t) => {
  await t.test('parses search queries with keywords', () => {
    assert.deepEqual(parseVoiceIntent('search for youth counseling'), { 
      type: 'SEARCH', 
      query: 'youth counseling' 
    });
    assert.deepEqual(parseVoiceIntent('search testing'), { 
      type: 'SEARCH', 
      query: 'testing' 
    });
    assert.deepEqual(parseVoiceIntent('find clinic'), { 
      type: 'SEARCH', 
      query: 'clinic' 
    });
  });

  await t.test('parses clear search and form submission', () => {
    assert.deepEqual(parseVoiceIntent('clear search'), { type: 'CLEAR_SEARCH' });
    assert.deepEqual(parseVoiceIntent('submit form'), { type: 'SUBMIT_FORM' });
  });
});

test('Voice Command Engine: Chatbot, Audio & Accessibility', async (t) => {
  await t.test('parses chatbot commands', () => {
    assert.deepEqual(parseVoiceIntent('open chat'), { type: 'CHATBOT', action: 'open' });
    assert.deepEqual(parseVoiceIntent('ask dcvc'), { type: 'CHATBOT', action: 'open' });
    assert.deepEqual(parseVoiceIntent('close chat'), { type: 'CHATBOT', action: 'close' });
  });

  await t.test('parses text-to-speech audio controls', () => {
    assert.deepEqual(parseVoiceIntent('read page'), { type: 'READ_ALOUD', action: 'play' });
    assert.deepEqual(parseVoiceIntent('pause reading'), { type: 'READ_ALOUD', action: 'pause' });
    assert.deepEqual(parseVoiceIntent('stop speech'), { type: 'READ_ALOUD', action: 'stop' });
    assert.deepEqual(parseVoiceIntent('next paragraph'), { type: 'READ_ALOUD', action: 'next' });
    assert.deepEqual(parseVoiceIntent('previous paragraph'), { type: 'READ_ALOUD', action: 'prev' });
  });

  await t.test('parses visual and accessibility mode toggles', () => {
    assert.deepEqual(parseVoiceIntent('larger font'), { type: 'FONT', action: 'increase' });
    assert.deepEqual(parseVoiceIntent('smaller font'), { type: 'FONT', action: 'decrease' });
    assert.deepEqual(parseVoiceIntent('contrast'), { type: 'THEME', action: 'cycle' });
    assert.deepEqual(parseVoiceIntent('reading ruler'), { type: 'TOOL', tool: 'ruler' });
    assert.deepEqual(parseVoiceIntent('screen mask'), { type: 'TOOL', tool: 'mask' });
    assert.deepEqual(parseVoiceIntent('focus music'), { type: 'MUSIC', action: 'toggle' });
    assert.deepEqual(parseVoiceIntent('reset all'), { type: 'RESET_ALL' });
  });

  await t.test('parses safety, mic control, and help', () => {
    assert.deepEqual(parseVoiceIntent('quick exit'), { type: 'QUICK_EXIT' });
    assert.deepEqual(parseVoiceIntent('stop mic'), { type: 'MIC', action: 'stop' });
    assert.deepEqual(parseVoiceIntent('help'), { type: 'HELP' });
    assert.deepEqual(parseVoiceIntent('commands'), { type: 'HELP' });
  });
});
