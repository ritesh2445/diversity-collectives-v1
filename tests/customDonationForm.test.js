import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  templateDonorAppreciationEmail,
  compileDonationTokens,
  DEFAULT_DONATION_EMAIL_TEMPLATE
} from '../worker/src/emailTemplates.js';
import { resolveAppreciationTier } from '../worker/src/appreciationTiers.js';

describe('Custom Integrated Donation Form & Dynamic Automated Email Engine', () => {

  it('1. Compiles dynamic tokens into donor emails with full substitution', () => {
    const rawTemplate = "Hello {{donor_name}}! Thank you for your {{amount}} {{frequency}} donation to {{designation}}. Ref: {{reference}} on {{date}}.";
    const compiled = compileDonationTokens(rawTemplate, {
      donorDisplayName: 'Taylor Swift',
      formattedAmount: '$500.00',
      frequencyLabel: 'Monthly Sustainer',
      designation: 'Rainbow Umbrella Youth',
      reference: 'DCVC-DON-TEST-123',
      date: 'November 14, 2026'
    });

    assert.strictEqual(
      compiled,
      'Hello Taylor Swift! Thank you for your $500.00 Monthly Sustainer donation to Rainbow Umbrella Youth. Ref: DCVC-DON-TEST-123 on November 14, 2026.'
    );
  });

  it('2. Defaults to "Valued Friend" and $0.00 when donor information is missing', () => {
    const rawTemplate = "Dear {{donor_name}}, you gave {{amount}} ({{frequency}}).";
    const compiled = compileDonationTokens(rawTemplate, {});
    assert.strictEqual(compiled, 'Dear Valued Friend, you gave $0.00 (One-Time).');
  });

  it('3. Renders complete custom thank-you email with custom subject, title, body, and sustainer note', () => {
    const customTemplate = {
      subject: '🌟 Deep Appreciation for Your Gift, {{donor_name}}!',
      title: 'You Are Making a Difference, {{donor_name}}!',
      headline: 'Official Donor Partner Recognition',
      bodyText: 'Dear {{donor_name}},\n\nYour contribution of {{amount}} is allocated to {{designation}}.\nYour reference is {{reference}}.',
      recurringNote: '{{donor_name}}, as a {{frequency}}, your warmth touches lives every single day! 💜',
      taxNotice: 'DCVC 501(c)(3) EIN: {{ein}}'
    };

    const res = templateDonorAppreciationEmail({
      donorDisplayName: 'Alex Morgan',
      formattedAmount: '$150.00',
      tierName: 'Rainbow Champion',
      badge: 'CHAMPION CIRCLE',
      tagline: 'Fostering LGBTQ+ Youth Resiliency',
      impact: 'Provides monthly peer group supplies and youth drop-in hours.',
      cardUrl: 'https://diversitycollectivevc.org/appreciation-card/tok_alex123',
      frequency: 'monthly',
      designation: 'Diversity SHINES Healthcare Clinic',
      date: 'November 14, 2026',
      reference: 'DCVC-DON-ALEX99',
      customTemplate
    });

    assert.strictEqual(res.subject, '🌟 Deep Appreciation for Your Gift, Alex Morgan!');
    assert.match(res.html, /You Are Making a Difference, Alex Morgan!/);
    assert.match(res.html, /Official Donor Partner Recognition/);
    assert.match(res.html, /allocated to Diversity SHINES Healthcare Clinic/);
    assert.match(res.html, /DCVC-DON-ALEX99/);
    assert.match(res.html, /Alex Morgan, as a Monthly Sustainer, your warmth touches lives every single day!/);
    assert.match(res.html, /DCVC 501\(c\)\(3\) EIN: 46-1234567/);
    assert.match(res.html, /https:\/\/diversitycollectivevc\.org\/appreciation-card\/tok_alex123/);
  });

  it('4. Correctly resolves appreciation tiers for diverse gift amounts', () => {
    assert.strictEqual(resolveAppreciationTier(25).tier, 'community_ally');
    assert.strictEqual(resolveAppreciationTier(50).tier, 'pride_advocate');
    assert.strictEqual(resolveAppreciationTier(150).tier, 'rainbow_champion');
    assert.strictEqual(resolveAppreciationTier(500).tier, 'visionary_benefactor');
    assert.strictEqual(resolveAppreciationTier(1000).tier, 'visionary_benefactor');
  });

  it('5. Generates valid and beautiful fallback email when customTemplate is null', () => {
    const res = templateDonorAppreciationEmail({
      donorDisplayName: 'Sam Houston',
      formattedAmount: '$50.00',
      tierName: 'Pride Advocate',
      badge: 'ADVOCATE CIRCLE',
      tagline: 'Empowering Wellness & Free Testing',
      impact: 'Funds 2 rapid HIV/STI screenings.',
      cardUrl: 'https://diversitycollectivevc.org/appreciation-card/tok_sam',
      frequency: 'one-time'
    });

    assert.match(res.subject, /Your DCVC Appreciation Card has arrived/);
    assert.match(res.html, /Thank You, Sam Houston!/);
    assert.match(res.html, /\$50\.00/);
    assert.match(res.html, /Pride Advocate/);
  });

});
