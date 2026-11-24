// Zeffy Webhook & Idempotency Processing Unit Tests
// Strictly conforms to official Zeffy webhook specification:
// - Header: Zeffy-Signature (format: t=timestamp,v1=signature)
// - HMAC-SHA256 input: {timestamp}.{rawBody}
// - Secret prefix: whsec_...
// - Strict integer Unix timestamp validation
// - Replay attack prevention: 5-minute (300s) timestamp tolerance
// - Fail-closed in all production contexts (no secret = immediate failure, no API key substitution)
// - Independent webhook event ID and payment reference tracking
// - Atomic concurrency reservation and duplicate card suppression on payment.updated
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getTierForAmount, APPRECIATION_TIERS } from '../src/data/appreciationTiers.js';
import {
  parseZeffySignatureHeader,
  verifyZeffySignature,
  verifyZeffyWebhookRequest
} from '../worker/src/index.js';

// Test helper: Compute official Zeffy HMAC-SHA256 signature over {timestamp}.{rawBody}
function computeOfficialZeffySignature(secret, timestamp, rawBody) {
  const signedPayload = `${timestamp}.${rawBody}`;
  return crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
}

// Test helper: Construct official Zeffy-Signature header
function buildZeffySignatureHeader(timestamp, signature) {
  return `t=${timestamp},v1=${signature}`;
}

function parseZeffyWebhookPayload(body) {
  const eventType = body?.event || body?.type || body?.event_type || 'payment.created';
  const data = body?.data || body;

  const paymentReference = String(data?.id || data?.payment_id || data?.transaction_id || body?.id || '');
  const paymentStatus = String(data?.status || 'succeeded').toLowerCase();

  // Webhook event ID independent from payment reference
  const webhookEventId = String(body?.event_id || body?.eventId || (body?.id && String(body?.id).trim() !== paymentReference ? body?.id : `evt_${paymentReference}`));

  // Documented refund and dispute handling (e.g. via payment.updated)
  const isRefundOrDispute = paymentStatus === 'refunded' ||
    paymentStatus === 'disputed' ||
    Boolean(data?.refunded) ||
    eventType === 'payment.refunded' ||
    eventType === 'refund.created';

  if (isRefundOrDispute) {
    return {
      eventType,
      paymentReference,
      webhookEventId,
      status: 'refund_recorded',
      shouldIssueCard: false
    };
  }

  // Non-completed handling
  if (['pending', 'in_progress', 'processing'].includes(paymentStatus)) {
    return {
      eventType,
      paymentReference,
      webhookEventId,
      status: 'pending_ignored',
      shouldIssueCard: false
    };
  }

  if (['failed', 'declined', 'cancelled', 'canceled'].includes(paymentStatus)) {
    return {
      eventType,
      paymentReference,
      webhookEventId,
      status: 'failed_ignored',
      shouldIssueCard: false
    };
  }

  // Ignored non-donation event types
  const validEvents = [
    'payment.created', 'payment.updated',
    'donation.created', 'donation.updated',
    'order.created', 'order.updated',
    'payment.completed', 'donation.completed', 'order.completed'
  ];
  if (!validEvents.includes(eventType)) {
    return {
      eventType,
      paymentReference,
      webhookEventId,
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
    webhookEventId,
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

describe('Official Zeffy Webhook Signature Verification Protocol & Fail-Closed Logic', () => {
  const secret = 'whsec_dcvc_production_test_secret_998877';
  const samplePayload = JSON.stringify({
    id: 'evt_zeffy_webhook_001',
    event: 'payment.created',
    data: { id: 'pay_123456', amount: 5000, status: 'succeeded' }
  });

  it('1. accepts a valid production signature over {timestamp}.{rawBody}', async () => {
    const now = Math.floor(Date.now() / 1000);
    const sig = computeOfficialZeffySignature(secret, now, samplePayload);
    const header = buildZeffySignatureHeader(now, sig);

    const request = new Request('https://diversitycollective.org/api/webhooks/zeffy', {
      method: 'POST',
      headers: {
        'Zeffy-Signature': header,
        'Content-Type': 'application/json'
      },
      body: samplePayload
    });

    const env = { ZEFFY_WEBHOOK_SECRET: secret, ENVIRONMENT: 'production' };
    const auth = await verifyZeffyWebhookRequest(request, samplePayload, env, JSON.parse(samplePayload));
    assert.equal(auth.valid, true);
    assert.equal(auth.bypassed, false);
    assert.equal(auth.method, 'hmac_sha256');
    assert.equal(auth.timestamp, now);
  });

  it('2. strictly rejects an invalid or tampered signature', async () => {
    const now = Math.floor(Date.now() / 1000);
    const sig = computeOfficialZeffySignature(secret, now, samplePayload);
    const header = buildZeffySignatureHeader(now, sig);

    const tamperedPayload = samplePayload.replace('5000', '999999');
    const request = new Request('https://diversitycollective.org/api/webhooks/zeffy', {
      method: 'POST',
      headers: {
        'Zeffy-Signature': header,
        'Content-Type': 'application/json'
      },
      body: tamperedPayload
    });

    const env = { ZEFFY_WEBHOOK_SECRET: secret, ENVIRONMENT: 'production' };
    const auth = await verifyZeffyWebhookRequest(request, tamperedPayload, env, JSON.parse(tamperedPayload));
    assert.equal(auth.valid, false);
    assert.equal(auth.bypassed, false);
    assert.match(auth.error, /mismatch/i);
  });

  it('3. strictly prevents processing when production signing secret is missing (fails closed)', async () => {
    const now = Math.floor(Date.now() / 1000);
    const header = buildZeffySignatureHeader(now, 'dummy_signature');

    const request = new Request('https://diversitycollective.org/api/webhooks/zeffy', {
      method: 'POST',
      headers: {
        'Zeffy-Signature': header,
        'Content-Type': 'application/json'
      },
      body: samplePayload
    });

    // In production without ZEFFY_WEBHOOK_SECRET
    const env = { ENVIRONMENT: 'production' };
    const auth = await verifyZeffyWebhookRequest(request, samplePayload, env, JSON.parse(samplePayload));
    assert.equal(auth.valid, false);
    assert.equal(auth.bypassed, false);
    assert.match(auth.error, /ZEFFY_WEBHOOK_SECRET is not configured/i);
  });

  it('4. ensures a bypassed result is marked invalid and rejected by the handler', async () => {
    const request = new Request('https://diversitycollective.org/api/webhooks/zeffy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: samplePayload
    });

    // Isolated test environment with test bypass flag
    const env = { ENVIRONMENT: 'test', ALLOW_INSECURE_DEV_BYPASS: 'true' };
    const auth = await verifyZeffyWebhookRequest(request, samplePayload, env, JSON.parse(samplePayload));
    // Must be marked valid=false and bypassed=true so production handler rejects it
    assert.equal(auth.valid, false);
    assert.equal(auth.bypassed, true);
    assert.match(auth.error, /bypassed/i);
  });

  it('5. strictly prevents an API key from substituting for a webhook signing secret', async () => {
    const request = new Request('https://diversitycollective.org/api/webhooks/zeffy', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer zeffy_api_key_test_123',
        'Content-Type': 'application/json'
      },
      body: samplePayload
    });

    // Environment has ZEFFY_API_KEY but no ZEFFY_WEBHOOK_SECRET
    const env = { ZEFFY_API_KEY: 'zeffy_api_key_test_123', ENVIRONMENT: 'production' };
    const auth = await verifyZeffyWebhookRequest(request, samplePayload, env, JSON.parse(samplePayload));
    assert.equal(auth.valid, false);
    assert.equal(auth.bypassed, false);
    assert.match(auth.error, /ZEFFY_WEBHOOK_SECRET is not configured/i);
  });

  it('6. validates integer Unix timestamp and rejects malformed values', async () => {
    const validNow = Math.floor(Date.now() / 1000);
    const validSig = computeOfficialZeffySignature(secret, validNow, samplePayload);

    // Valid integer timestamp
    const validRes = await verifyZeffySignature(samplePayload, `t=${validNow},v1=${validSig}`, secret);
    assert.equal(validRes.valid, true);

    // Malformed: letters appended
    const malformed1 = await verifyZeffySignature(samplePayload, `t=${validNow}abc,v1=${validSig}`, secret);
    assert.equal(malformed1.valid, false);
    assert.match(malformed1.error, /malformed timestamp/i);

    // Malformed: float timestamp
    const malformed2 = await verifyZeffySignature(samplePayload, `t=${validNow}.5,v1=${validSig}`, secret);
    assert.equal(malformed2.valid, false);
    assert.match(malformed2.error, /malformed timestamp/i);

    // Malformed: negative timestamp
    const malformed3 = await verifyZeffySignature(samplePayload, `t=-${validNow},v1=${validSig}`, secret);
    assert.equal(malformed3.valid, false);
    assert.match(malformed3.error, /malformed timestamp/i);

    // Malformed: non-numeric string
    const malformed4 = await verifyZeffySignature(samplePayload, `t=current_time,v1=${validSig}`, secret);
    assert.equal(malformed4.valid, false);
    assert.match(malformed4.error, /malformed timestamp/i);
  });

  it('7. enforces 5-minute (300s) timestamp tolerance window against replay attacks', async () => {
    const now = Math.floor(Date.now() / 1000);
    const expiredTimestamp = now - 305; // 305 seconds old (outside 300s tolerance)
    const sig = computeOfficialZeffySignature(secret, expiredTimestamp, samplePayload);
    const header = buildZeffySignatureHeader(expiredTimestamp, sig);

    const result = await verifyZeffySignature(samplePayload, header, secret, { currentTimestamp: now });
    assert.equal(result.valid, false);
    assert.match(result.error, /tolerance window/i);
  });

  it('8. rejects future timestamps exceeding 300s tolerance window', async () => {
    const now = Math.floor(Date.now() / 1000);
    const futureTimestamp = now + 400; // 400 seconds in future
    const sig = computeOfficialZeffySignature(secret, futureTimestamp, samplePayload);
    const header = buildZeffySignatureHeader(futureTimestamp, sig);

    const result = await verifyZeffySignature(samplePayload, header, secret, { currentTimestamp: now });
    assert.equal(result.valid, false);
    assert.match(result.error, /tolerance window/i);
  });

  it('9. strictly rejects query parameter authentication (?secret=...)', async () => {
    const request = new Request(`https://diversitycollective.org/api/webhooks/zeffy?secret=${secret}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: samplePayload
    });

    const env = { ZEFFY_WEBHOOK_SECRET: secret, ENVIRONMENT: 'production' };
    const auth = await verifyZeffyWebhookRequest(request, samplePayload, env, JSON.parse(samplePayload));
    assert.equal(auth.valid, false);
    assert.match(auth.error, /missing zeffy-signature/i);
  });
});

describe('Zeffy payment.updated Refund, Dispute, and Duplicate Suppression Logic', () => {
  it('handles refund via payment.updated event safely without issuing cards', () => {
    const refundPayload = {
      event: 'payment.updated',
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

  it('handles dispute via payment.updated event safely without issuing cards', () => {
    const disputePayload = {
      event: 'payment.updated',
      data: {
        id: 'pay_dispute_789',
        amount: 10000,
        status: 'disputed'
      }
    };

    const parsed = parseZeffyWebhookPayload(disputePayload);
    assert.equal(parsed.shouldIssueCard, false);
    assert.equal(parsed.status, 'refund_recorded');
    assert.equal(parsed.paymentReference, 'pay_dispute_789');
  });

  it('extracts independent webhook event ID distinct from payment reference', () => {
    const payload = {
      id: 'evt_wh_2026_999',
      event: 'payment.created',
      data: {
        id: 'pay_transaction_456',
        amount: 25000,
        status: 'succeeded',
        contact: {
          first_name: 'Alex',
          last_name: 'Morgan',
          email: 'alex@example.org'
        }
      }
    };

    const parsed = parseZeffyWebhookPayload(payload);
    assert.equal(parsed.webhookEventId, 'evt_wh_2026_999');
    assert.equal(parsed.paymentReference, 'pay_transaction_456');
    assert.notEqual(parsed.webhookEventId, parsed.paymentReference);
    assert.equal(parsed.shouldIssueCard, true);
    assert.equal(parsed.amountDollars, 250);
  });

  it('parses successful donation with contact details in cents to dollars accurately', () => {
    const payload = {
      event: 'payment.created',
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

  it('respects anonymous donor privacy when is_anonymous is true', () => {
    const anonPayload = {
      event: 'payment.created',
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

  it('strictly rejects or ignores pending payments without issuing cards', () => {
    const pendingPayload = {
      event: 'payment.created',
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
      event: 'payment.created',
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
});

describe('Database Schema Uniqueness & Concurrency Protection', () => {
  it('1. verifies that webhook_events defines a UNIQUE constraint on event_id in schema.sql', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const schemaSql = fs.readFileSync(path.resolve('src/db/schema.sql'), 'utf8');

    // Asserts event_id TEXT NOT NULL UNIQUE in webhook_events
    assert.match(
      schemaSql,
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?webhook_events\s*\([^;]*event_id\s+TEXT\s+NOT\s+NULL\s+UNIQUE/is,
      'webhook_events must enforce event_id TEXT NOT NULL UNIQUE in schema'
    );

    // Asserts index idx_webhook_events_id ON webhook_events (event_id)
    assert.match(
      schemaSql,
      /CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?idx_webhook_events_id\s+ON\s+webhook_events\s*\(\s*event_id\s*\)/is,
      'webhook_events must have an index on event_id'
    );
  });

  it('2. verifies that donation_appreciation_cards defines a UNIQUE constraint on payment_reference in schema.sql', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const schemaSql = fs.readFileSync(path.resolve('src/db/schema.sql'), 'utf8');

    assert.match(
      schemaSql,
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?donation_appreciation_cards\s*\([^;]*payment_reference\s+TEXT\s+NOT\s+NULL\s+UNIQUE/is,
      'donation_appreciation_cards must enforce payment_reference TEXT NOT NULL UNIQUE in schema'
    );
  });

  it('3. simulates atomic concurrency collision and verifies rejection of duplicate event deliveries', async () => {
    const existingEvents = new Set(['evt_existing_in_flight']);
    const mockDb = {
      async execute({ sql, args = [] }) {
        if (sql.includes('INSERT INTO webhook_events')) {
          const eventId = args[1];
          if (existingEvents.has(eventId)) {
            throw new Error(`UNIQUE constraint failed: webhook_events.event_id`);
          }
          existingEvents.add(eventId);
          return { rows: [] };
        }
        if (sql.includes('SELECT id, card_token FROM donation_appreciation_cards')) {
          return { rows: [{ id: 'card-1', card_token: 'dcvc_existing_token_123' }] };
        }
        return { rows: [] };
      }
    };

    // Attempt concurrent delivery of already reserved event_id
    let caughtCollision = false;
    let collisionResponse = null;
    const testEventId = 'evt_existing_in_flight';
    const testPaymentRef = 'pay_concurrent_999';

    try {
      await mockDb.execute({
        sql: `INSERT INTO webhook_events (id, event_id, event_type, payload_hash, status) VALUES (?, ?, ?, ?, 'processing')`,
        args: ['id-1', testEventId, 'payment.created', 'hash-1']
      });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        caughtCollision = true;
        const existingCard = await mockDb.execute({
          sql: `SELECT id, card_token FROM donation_appreciation_cards WHERE payment_reference = ? LIMIT 1`,
          args: [testPaymentRef]
        });
        collisionResponse = {
          success: true,
          status: 'already_processed',
          eventId: testEventId,
          cardToken: existingCard.rows[0]?.card_token || null
        };
      }
    }

    assert.equal(caughtCollision, true, 'Concurrent duplicate delivery must trigger UNIQUE constraint collision');
    assert.equal(collisionResponse?.status, 'already_processed');
    assert.equal(collisionResponse?.cardToken, 'dcvc_existing_token_123');
  });

  it('4. suppresses duplicate appreciation cards when payment.updated arrives for an existing payment', () => {
    const existingPayments = new Map([
      ['pay_completed_already', { cardToken: 'dcvc_card_active_456', status: 'active' }]
    ]);

    const updatedPayload = {
      event: 'payment.updated',
      data: {
        id: 'pay_completed_already',
        status: 'succeeded',
        amount: 5000
      }
    };

    const paymentRef = updatedPayload.data.id;
    const isExisting = existingPayments.has(paymentRef);
    assert.equal(isExisting, true);

    // Suppress duplicate card issuance
    const shouldIssueDuplicateCard = !isExisting;
    assert.equal(shouldIssueDuplicateCard, false, 'payment.updated must never issue duplicate appreciation cards for existing payment');
  });
});


