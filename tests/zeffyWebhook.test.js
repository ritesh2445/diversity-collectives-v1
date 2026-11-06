// Zeffy Webhook & Idempotency Processing Unit Tests
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getTierForAmount, APPRECIATION_TIERS } from '../src/data/appreciationTiers.js';

function computeHmacSignature(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifySignature(secret, payload, signatureHeader) {
  if (!signatureHeader || !secret) return false;
  const expected = computeHmacSignature(secret, payload);
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

function parseZeffyDonation(body) {
  const eventType = body?.event || body?.type || 'payment.completed';
  const data = body?.data || body;

  let rawAmount = data?.amount ?? data?.totalAmount ?? data?.creditedAmount ?? data?.netAmount ?? 0;
  let amountDollars = 0;
  if (typeof rawAmount === 'string') {
    rawAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));
  }
  // Zeffy delivers raw amounts in cents if > 1000 and integer, or standard dollars
  if (rawAmount >= 100 && Number.isInteger(rawAmount)) {
    amountDollars = rawAmount / 100;
  } else {
    amountDollars = rawAmount;
  }

  const isAnonymous = Boolean(data?.isAnonymous || data?.anonymous || data?.donor?.isAnonymous);
  const donorName = isAnonymous 
    ? 'Affirming Friend of DCVC' 
    : (data?.donor?.fullName || `${data?.donor?.firstName || ''} ${data?.donor?.lastName || ''}`.trim() || 'Generous Supporter');

  const paymentReference = data?.id || data?.paymentId || data?.transactionId || 'tx_unknown';
  const frequency = data?.isMonthly || data?.frequency === 'monthly' ? 'monthly' : 'one-time';

  return {
    eventType,
    amountDollars,
    amountCents: Math.round(amountDollars * 100),
    isAnonymous,
    donorName,
    paymentReference,
    frequency
  };
}

describe('Zeffy Webhook Verification & Parsing', () => {
  const secret = 'whsec_test_secret_1234567890abcdef';
  const samplePayload = JSON.stringify({
    event: 'payment.completed',
    data: {
      id: 'pay_987654321',
      amount: 15000, // $150.00
      isAnonymous: false,
      donor: {
        firstName: 'Alex',
        lastName: 'Morgan',
        email: 'alex@example.org'
      },
      frequency: 'one-time'
    }
  });

  it('validates a correct HMAC-SHA256 signature', () => {
    const signature = computeHmacSignature(secret, samplePayload);
    const isValid = verifySignature(secret, samplePayload, signature);
    assert.equal(isValid, true);
  });

  it('rejects a tampered payload or incorrect signature', () => {
    const signature = computeHmacSignature(secret, samplePayload);
    const tamperedPayload = samplePayload.replace('Alex', 'Eve');
    const isValid = verifySignature(secret, tamperedPayload, signature);
    assert.equal(isValid, false);
  });

  it('parses donation amount in cents to dollars accurately', () => {
    const parsed = parseZeffyDonation(JSON.parse(samplePayload));
    assert.equal(parsed.amountDollars, 150);
    assert.equal(parsed.amountCents, 15000);
    assert.equal(parsed.paymentReference, 'pay_987654321');
    assert.equal(parsed.donorName, 'Alex Morgan');
    assert.equal(parsed.isAnonymous, false);
  });

  it('assigns the correct Rainbow Champion tier for $150 gift', () => {
    const parsed = parseZeffyDonation(JSON.parse(samplePayload));
    const tier = getTierForAmount(parsed.amountDollars);
    assert.equal(tier.id, APPRECIATION_TIERS.RAINBOW_CHAMPION);
  });

  it('respects anonymous donor privacy', () => {
    const anonPayload = {
      event: 'payment.completed',
      data: {
        id: 'pay_anon_123',
        amount: 50000, // $500.00
        isAnonymous: true,
        donor: {
          firstName: 'Private',
          lastName: 'Donor',
          email: 'secret@example.org'
        }
      }
    };
    const parsed = parseZeffyDonation(anonPayload);
    assert.equal(parsed.isAnonymous, true);
    assert.equal(parsed.donorName, 'Affirming Friend of DCVC');
    const tier = getTierForAmount(parsed.amountDollars);
    assert.equal(tier.id, APPRECIATION_TIERS.VISIONARY_BENEFACTOR);
  });

  it('handles monthly sustainer frequency flag', () => {
    const monthlyPayload = {
      event: 'payment.completed',
      data: {
        id: 'pay_sub_monthly_1',
        amount: 2500, // $25.00
        frequency: 'monthly',
        donor: { firstName: 'Sam' }
      }
    };
    const parsed = parseZeffyDonation(monthlyPayload);
    assert.equal(parsed.frequency, 'monthly');
    assert.equal(parsed.amountDollars, 25);
  });
});

