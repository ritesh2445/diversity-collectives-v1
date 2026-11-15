import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  templateNewsletterWelcome,
  templateNewsletterBroadcast,
  templateDonorAppreciationEmail,
  compileDonationTokens,
  DEFAULT_DONATION_EMAIL_TEMPLATE
} from '../worker/src/emailTemplates.js';
import {
  SHEET_COLUMNS,
  formatSubscriberRow,
  formatDonationRow
} from '../worker/src/googleSheetsSync.js';

describe('Newsletter & Automated Donor Appreciation Suite', () => {

  it('1. compiles newsletter welcome email with CAN-SPAM compliant unsubscribe link', () => {
    const email = 'alex@example.org';
    const unsubscribeUrl = 'https://diversitycollectivevc.org/api/newsletter/unsubscribe?email=alex%40example.org';
    const welcome = templateNewsletterWelcome({ email, unsubscribeUrl });

    assert.ok(welcome.subject.includes('Welcome to Diversity Collective Ventura County'));
    assert.ok(welcome.html.includes(email));
    assert.ok(welcome.html.includes(unsubscribeUrl));
    assert.ok(welcome.text.includes(unsubscribeUrl));
  });

  it('2. compiles one-time donor appreciation email with keepsake card & certificate link', () => {
    const emailPayload = templateDonorAppreciationEmail({
      donorDisplayName: 'Jordan Vance',
      formattedAmount: '$150.00',
      tierName: 'Rainbow Champion',
      badge: 'Rainbow Champion',
      tagline: 'Guiding Light for Ventura County Youth',
      impact: 'Covers 3 full months of Rainbow Umbrella art and peer group supplies.',
      cardUrl: 'https://diversitycollectivevc.org/appreciation-card/token123',
      frequency: 'one-time',
      designation: 'Rainbow Umbrella Youth',
      date: 'November 14, 2026',
      reference: 'DCVC-DON-9281'
    });

    assert.ok(emailPayload.subject.includes('Jordan Vance') || emailPayload.subject.includes('Rainbow Champion'));
    assert.ok(emailPayload.html.includes('Jordan Vance'));
    assert.ok(emailPayload.html.includes('$150.00'));
    assert.ok(emailPayload.html.includes('https://diversitycollectivevc.org/appreciation-card/token123'));
    assert.ok(emailPayload.html.includes('Open &amp; Unwrap Your Interactive Card') || emailPayload.html.includes('Interactive Card'));
    // One-time gift should NOT have the recurring note header
    assert.strictEqual(emailPayload.html.includes('Recurring Sustainer Family'), false);
  });

  it('3. compiles recurring sustainer thank you email with heartfelt recurring note and sustaining confirmation', () => {
    const recurringPayload = templateDonorAppreciationEmail({
      donorDisplayName: 'Sam Taylor',
      formattedAmount: '$50.00',
      tierName: 'Pride Advocate',
      badge: 'Pride Advocate',
      tagline: 'Sustaining Ventura County Community Sanctuary',
      impact: 'Provides weekly warm snacks and rapid health screening kits.',
      cardUrl: 'https://diversitycollectivevc.org/appreciation-card/recur456',
      frequency: 'monthly',
      designation: 'Diversity SHINES'
    });

    assert.ok(recurringPayload.subject.includes('Recurring Sustainer') || recurringPayload.subject.includes('Pride Advocate'));
    assert.ok(recurringPayload.html.includes('Sam Taylor'));
    assert.ok(recurringPayload.html.includes('Monthly Sustainer'));
    // Must include the cute heartfelt note for recurring donors
    assert.ok(recurringPayload.html.includes('Recurring Sustainer Family'));
    assert.ok(recurringPayload.html.includes('Every single cycle your recurring gift arrives'));
    assert.ok(recurringPayload.html.includes('https://diversitycollectivevc.org/appreciation-card/recur456'));
  });

  it('4. compiles dynamic custom donation tokens accurately', () => {
    const template = 'Dear {{donor_name}}, thank you for your {{frequency}} gift of {{amount}} to {{designation}}!';
    const compiled = compileDonationTokens(template, {
      donorDisplayName: 'Maria Santos',
      formattedAmount: '$75.00',
      frequencyLabel: 'Monthly Sustainer',
      designation: 'Community Resource Center'
    });

    assert.strictEqual(compiled, 'Dear Maria Santos, thank you for your Monthly Sustainer gift of $75.00 to Community Resource Center!');
  });

  it('5. formats subscriber and donation rows accurately for CSV export', () => {
    assert.ok(Array.isArray(SHEET_COLUMNS.subscribers));
    assert.ok(Array.isArray(SHEET_COLUMNS.donations));

    const subRow = formatSubscriberRow({
      id: 'sub-1',
      email: 'supporter@dcvc.org',
      source: 'pride_prom_2026',
      is_active: 1,
      consent_timestamp: '2026-11-14T10:00:00Z',
      created_at: '2026-11-14T10:00:00Z'
    });

    assert.strictEqual(subRow[1], 'supporter@dcvc.org');
    assert.strictEqual(subRow[3], 'Active');

    const donRow = formatDonationRow({
      id: 'card-99',
      payment_reference: 'DCVC-DON-8812',
      donor_display_name: 'Casey Morgan',
      recipient_email: 'casey@dcvc.org',
      amount_cents: 50000,
      frequency: 'monthly',
      tier_name: 'Visionary Benefactor',
      status: 'active',
      created_at: '2026-11-14T11:00:00Z'
    });

    assert.strictEqual(donRow[1], 'DCVC-DON-8812');
    assert.strictEqual(donRow[2], 'Casey Morgan');
    assert.strictEqual(donRow[4], '$500.00');
    assert.strictEqual(donRow[5], 'monthly');
    assert.strictEqual(donRow[6], 'Visionary Benefactor');
  });

});
