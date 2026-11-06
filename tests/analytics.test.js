import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  trackEvent,
  sanitizeAnalyticsProps,
  ANALYTICS_EVENTS
} from '../src/utils/analytics.js';

describe('Privacy-Preserving Organization Analytics', () => {

  it('1. defines all required event types', () => {
    assert.strictEqual(ANALYTICS_EVENTS.DONATION_BUTTON_CLICK, 'donation_button_click');
    assert.strictEqual(ANALYTICS_EVENTS.ZEFFY_FORM_OPEN, 'zeffy_form_open');
    assert.strictEqual(ANALYTICS_EVENTS.DONATION_COMPLETED, 'donation_completed');
    assert.strictEqual(ANALYTICS_EVENTS.VOLUNTEER_SUBMIT, 'volunteer_submit');
    assert.strictEqual(ANALYTICS_EVENTS.CONTACT_SUBMIT, 'contact_submit');
    assert.strictEqual(ANALYTICS_EVENTS.DIRECTORY_SEARCH, 'directory_search');
  });

  it('2. strictly scrubs PII and clinical data from event properties', () => {
    const dirtyProps = {
      buttonLocation: 'hero',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      phone: '805-555-1234',
      message: 'Need help with healthcare',
      tier: 'Rainbow Champion',
      amountDollars: 150
    };

    const clean = sanitizeAnalyticsProps(dirtyProps);

    assert.strictEqual(clean.buttonLocation, 'hero');
    assert.strictEqual(clean.tier, 'Rainbow Champion');
    assert.strictEqual(clean.amountDollars, 150);

    // Assert PII was purged
    assert.strictEqual(clean.name, undefined);
    assert.strictEqual(clean.email, undefined);
    assert.strictEqual(clean.phone, undefined);
    assert.strictEqual(clean.message, undefined);
  });

  it('3. distinguishes between donation click and completed transaction', () => {
    const clickEvent = trackEvent(ANALYTICS_EVENTS.DONATION_BUTTON_CLICK, { location: 'navbar' });
    assert.strictEqual(clickEvent.event, 'donation_button_click');
    assert.strictEqual(clickEvent.properties.location, 'navbar');

    const completedEvent = trackEvent(ANALYTICS_EVENTS.DONATION_COMPLETED, {
      tier: 'visionary_benefactor',
      frequency: 'one-time'
    });
    assert.strictEqual(completedEvent.event, 'donation_completed');
    assert.strictEqual(completedEvent.properties.tier, 'visionary_benefactor');
  });

});

