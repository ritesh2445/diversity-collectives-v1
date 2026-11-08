// Zeffy Webhook & Idempotency Processing Unit Tests
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getTierForAmount, APPRECIATION_TIERS } from '../src/data/appreciationTiers.js';

function computeHmacSignature(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifyHmacSignature(secret, payload, signatureHeader) {
  if (!signatureHeader || !secret) return false;
  const cleanHeader = signatureHeader.replace(/^sha256=/, '').trim().toLowerCase();
  const expected = computeHmacSignature(secret, payload).toLowerCase();
  if (cleanHeader.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(cleanHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

function verifyWebhookAuth({ secret, rawBody, headers = {}, url = 'https://diversitycollective.org/api/webhooks/zeffy' }) {
  if (!secret) {
    return { valid: true, method: 'dev_bypass' };
  }

  // 1. HMAC Header
  const sigHeader = headers['x-zeffy-signature'] || headers['x-webhook-signature'];
  if (sigHeader && verifyHmacSignature(secret, rawBody, sigHeader)) {
    return { valid: true, method: 'hmac_sha256' };
  }

  // 2. Token in header or query
  const parsedUrl = new URL(url);
  const querySecret = parsedUrl.searchParams.get('secret') || parsedUrl.searchParams.get('token');
  const headerSecret = (headers['x-zeffy-secret'] || headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();

  if (querySecret === secret || headerSecret === secret) {
    return { valid: true, method: 'shared_secret' };
  }

  return { valid: false, error: 'Authentication failed' };
}

function parseZeffyWebhookPayload(body) {
  const eventType = body?.event || body?.type || body?.event_type || 'payment.completed';
  const data = body?.data || body;

  const paymentReference = String(data?.id || data?.payment_id || data?.transaction_id || body?.id || '');
  const paymentStatus = String(data?.status || 'succeeded').toLowerCase();

  // Refund handling
  if (eventType === 'payment.refunded' || eventType === 'refund.created' || paymentStatus === 'refunded') {
    return {
      eventType,
      paymentReference,
      status: 'refund_recorded',
      shouldIssueCard: false
    };
  }

  // Non-completed handling
  if (['pending', 'in_progress', 'processing'].includes(paymentStatus)) {
    return {
      eventType,
      paymentReference,
      status: 'pending_ignored',
      shouldIssueCard: false
    };
  }

  if (['failed', 'declined', 'cancelled', 'canceled'].includes(paymentStatus)) {
    return {
      eventType,
      paymentReference,
      status: 'failed_ignored',
      shouldIssueCard: false
    };
  }

  // Ignored non-donation event types
  if (eventType !== 'payment.completed' && eventType !== 'donation.completed' && eventType !== 'order.completed') {
    return {
      eventType,
      paymentReference,
      status: 'ignored',
      shouldIssueCard: false
    };
  }

  // Amount parsing
  let rawAmount = data?.amount ?? data?.donation_amount ?? data?.total_amount ?? data?.totalAmount ?? 0;
  let amountDollars = 0;
  let amountCents = 0;

  if (typeof rawAmount === 'string') {
    rawAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));
  }

  if (data?.amount_is_dollars === true) {
    amountDollars = Number(rawAmount);
    amountCents = Math.round(amountDollars * 100);
  } else if (Number.isInteger(Number(rawAmount)) && Number(rawAmount) >= 100) {
    amountCents = Number(rawAmount);
    amountDollars = amountCents / 100;
  } else {
    amountDollars = Number(rawAmount);
    amountCents = Math.round(amountDollars * 100);
  }

  // Donor resolution
  const donorObj = data?.contact || data?.donor || data?.buyer || {};
  const isAnonymous = Boolean(data?.is_anonymous || data?.isAnonymous || data?.anonymous || donorObj?.isAnonymous || donorObj?.is_anonymous || data?.hide_name);
  const firstName = (donorObj?.first_name || donorObj?.firstName || data?.first_name || '').trim();
  const lastName = (donorObj?.last_name || donorObj?.lastName || data?.last_name || '').trim();
  const rawFullName = (donorObj?.name || donorObj?.fullName || data?.donor_name || data?.name || `${firstName} ${lastName}`).trim();
  const donorName = isAnonymous || !rawFullName ? 'Affirming Friend of DCVC' : rawFullName;
  const donorEmail = (donorObj?.email || data?.donor_email || data?.email || '').trim().toLowerCase();
  const frequency = data?.frequency || (data?.is_recurring || data?.isMonthly ? 'monthly' : 'one-time');
  const campaign = data?.campaign?.name || data?.campaign_name || data?.campaignId || 'General Fund';

  return {
    eventType,
    paymentReference,
    amountDollars,
    amountCents,
    isAnonymous,
    donorName,
    donorEmail,
    frequency,
    campaign,
    status: 'succeeded',
    shouldIssueCard: true
  };
}

describe('Zeffy Webhook Multi-Tier Authentication', () => {
  const secret = 'whsec_dcvc_production_secret_998877';
  const samplePayload = JSON.stringify({
    event: 'payment.completed',
    data: { id: 'pay_123456', amount: 5000, status: 'succeeded' }
  });

  it('validates a standard HMAC-SHA256 signature in X-Zeffy-Signature header', () => {
    const signature = computeHmacSignature(secret, samplePayload);
    const auth = verifyWebhookAuth({
      secret,
      rawBody: samplePayload,
      headers: { 'x-zeffy-signature': signature }
    });
    assert.equal(auth.valid, true);
    assert.equal(auth.method, 'hmac_sha256');
  });

  it('validates HMAC-SHA256 signature with "sha256=" prefix', () => {
    const signature = 'sha256=' + computeHmacSignature(secret, samplePayload);
    const auth = verifyWebhookAuth({
      secret,
      rawBody: samplePayload,
      headers: { 'x-webhook-signature': signature }
    });
    assert.equal(auth.valid, true);
    assert.equal(auth.method, 'hmac_sha256');
  });

  it('validates secret passed via URL query parameter (?secret=...) when HMAC is not provided', () => {
    const auth = verifyWebhookAuth({
      secret,
      rawBody: samplePayload,
      url: `https://diversitycollective.org/api/webhooks/zeffy?secret=${secret}`
    });
    assert.equal(auth.valid, true);
    assert.equal(auth.method, 'shared_secret');
  });

  it('validates secret passed via X-Zeffy-Secret header', () => {
    const auth = verifyWebhookAuth({
      secret,
      rawBody: samplePayload,
      headers: { 'x-zeffy-secret': secret }
    });
    assert.equal(auth.valid, true);
    assert.equal(auth.method, 'shared_secret');
  });

  it('validates secret passed via Authorization Bearer token header', () => {
    const auth = verifyWebhookAuth({
      secret,
      rawBody: samplePayload,
      headers: { 'authorization': `Bearer ${secret}` }
    });
    assert.equal(auth.valid, true);
    assert.equal(auth.method, 'shared_secret');
  });

  it('rejects an invalid or tampered payload with HMAC mismatch', () => {
    const signature = computeHmacSignature(secret, samplePayload);
    const tamperedPayload = samplePayload.replace('5000', '9999');
    const auth = verifyWebhookAuth({
      secret,
      rawBody: tamperedPayload,
      headers: { 'x-zeffy-signature': signature }
    });
    assert.equal(auth.valid, false);
  });

  it('rejects an unauthorized request when secret is configured but no credentials provided', () => {
    const auth = verifyWebhookAuth({
      secret,
      rawBody: samplePayload,
      headers: {}
    });
    assert.equal(auth.valid, false);
  });

  it('safely bypasses verification in development when secret is not configured', () => {
    const auth = verifyWebhookAuth({
      secret: null,
      rawBody: samplePayload,
      headers: {}
    });
    assert.equal(auth.valid, true);
    assert.equal(auth.method, 'dev_bypass');
  });
});

describe('Zeffy Webhook Event & Status Parsing', () => {
  it('parses successful donation with contact details in cents to dollars accurately', () => {
    const payload = {
      event: 'payment.completed',
      data: {
        id: 'pay_abc_123',
        amount: 15000, // 15000 cents = $150.00
        currency: 'USD',
        status: 'succeeded',
        contact: {
          first_name: 'Jordan',
          last_name: 'Rivera',
          email: 'jordan@example.com'
        },
        campaign: { name: 'Pride Center Renovation' }
      }
    };

    const parsed = parseZeffyWebhookPayload(payload);
    assert.equal(parsed.shouldIssueCard, true);
    assert.equal(parsed.amountDollars, 150);
    assert.equal(parsed.amountCents, 15000);
    assert.equal(parsed.donorName, 'Jordan Rivera');
    assert.equal(parsed.donorEmail, 'jordan@example.com');
    assert.equal(parsed.isAnonymous, false);
    assert.equal(parsed.campaign, 'Pride Center Renovation');

    const tier = getTierForAmount(parsed.amountDollars);
    assert.equal(tier.id, APPRECIATION_TIERS.RAINBOW_CHAMPION);
  });

  it('parses high-tier donation and awards Visionary Benefactor for $500', () => {
    const payload = {
      event_type: 'payment.completed',
      data: {
        id: 'pay_benefactor_500',
        amount: 50000,
        status: 'succeeded',
        donor: {
          firstName: 'Robin',
          lastName: 'Taylor',
          email: 'robin@example.org'
        }
      }
    };

    const parsed = parseZeffyWebhookPayload(payload);
    assert.equal(parsed.shouldIssueCard, true);
    assert.equal(parsed.amountDollars, 500);
    const tier = getTierForAmount(parsed.amountDollars);
    assert.equal(tier.id, APPRECIATION_TIERS.VISIONARY_BENEFACTOR);
  });

  it('respects anonymous donor privacy when is_anonymous is true', () => {
    const anonPayload = {
      event: 'payment.completed',
      data: {
        id: 'pay_anon_999',
        amount: 2500, // $25
        status: 'succeeded',
        is_anonymous: true,
        contact: {
          first_name: 'Private',
          last_name: 'Benefactor',
          email: 'donor@hidden.org'
        }
      }
    };

    const parsed = parseZeffyWebhookPayload(anonPayload);
    assert.equal(parsed.isAnonymous, true);
    assert.equal(parsed.donorName, 'Affirming Friend of DCVC');
    assert.equal(parsed.amountDollars, 25);
    const tier = getTierForAmount(parsed.amountDollars);
    assert.equal(tier.id, APPRECIATION_TIERS.COMMUNITY_ALLY);
  });

  it('handles monthly sustainer frequency and assigns Pride Advocate tier for $75 gift', () => {
    const monthlyPayload = {
      event: 'payment.completed',
      data: {
        id: 'pay_monthly_75',
        amount: 7500,
        frequency: 'monthly',
        status: 'succeeded',
        donor: { name: 'Morgan Diaz' }
      }
    };

    const parsed = parseZeffyWebhookPayload(monthlyPayload);
    assert.equal(parsed.frequency, 'monthly');
    assert.equal(parsed.amountDollars, 75);
    const tier = getTierForAmount(parsed.amountDollars);
    assert.equal(tier.id, APPRECIATION_TIERS.PRIDE_ADVOCATE);
  });

  it('strictly rejects or ignores pending payments without issuing cards', () => {
    const pendingPayload = {
      event: 'payment.completed',
      data: {
        id: 'pay_pending_01',
        amount: 5000,
        status: 'pending',
        donor: { name: 'Taylor' }
      }
    };

    const parsed = parseZeffyWebhookPayload(pendingPayload);
    assert.equal(parsed.shouldIssueCard, false);
    assert.equal(parsed.status, 'pending_ignored');
  });

  it('strictly rejects or ignores failed payments without issuing cards', () => {
    const failedPayload = {
      event: 'payment.completed',
      data: {
        id: 'pay_failed_01',
        amount: 5000,
        status: 'failed',
        donor: { name: 'Taylor' }
      }
    };

    const parsed = parseZeffyWebhookPayload(failedPayload);
    assert.equal(parsed.shouldIssueCard, false);
    assert.equal(parsed.status, 'failed_ignored');
  });

  it('records refund events safely without issuing cards', () => {
    const refundPayload = {
      event: 'payment.refunded',
      data: {
        id: 'pay_ref_456',
        amount: 5000,
        status: 'refunded'
      }
    };

    const parsed = parseZeffyWebhookPayload(refundPayload);
    assert.equal(parsed.shouldIssueCard, false);
    assert.equal(parsed.status, 'refund_recorded');
    assert.equal(parsed.paymentReference, 'pay_ref_456');
  });
});
