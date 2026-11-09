/**
 * DCVC Zeffy Automated Synchronization & Reconciliation Engine
 *
 * Implements authoritative polling via official Zeffy API (https://api.zeffy.com/api/docs):
 * - GET /api/v1/payments (cursor pagination using starting_after, currency=usd, campaign)
 * - Deterministic matching against donation_intents
 * - Ambiguity handling via donation_reconciliations queue
 * - High-water mark state in reconciliation_sync_state
 * - Refund & dispute revocation checks
 */

import { resolveAppreciationTier } from './appreciationTiers.js';

const ZEFFY_API_BASE = 'https://api.zeffy.com/api/v1';

/**
 * Execute automated Zeffy polling and payment reconciliation
 * Called every 5 minutes by Cloudflare Worker scheduled() handler
 */
export async function executeZeffySync(env, db, ctx) {
  if (!db) {
    return { skipped: true, reason: 'Database not configured' };
  }

  const apiKey = env.ZEFFY_API_KEY;
  if (!apiKey) {
    return { skipped: true, reason: 'ZEFFY_API_KEY not configured' };
  }

  const campaignId = env.ZEFFY_CAMPAIGN_ID || '';
  const now = new Date().toISOString();

  // 1. Fetch current sync state / high-water mark
  let syncState = {
    last_cursor: null,
    last_sync_timestamp: null
  };

  try {
    const stateRes = await db.execute({
      sql: `SELECT * FROM reconciliation_sync_state WHERE id = 'zeffy_poller' LIMIT 1`,
      args: []
    });
    if (stateRes.rows.length > 0) {
      syncState = stateRes.rows[0];
    } else {
      await db.execute({
        sql: `INSERT OR IGNORE INTO reconciliation_sync_state (id, last_sync_timestamp, sync_count)
              VALUES ('zeffy_poller', ?, 0)`,
        args: [now]
      });
    }
  } catch (err) {
    console.warn('Could not read reconciliation_sync_state (table may need migration):', err.message);
  }

  // 2. Fetch payments from official Zeffy API
  let hasMore = true;
  let startingAfter = syncState.last_cursor || null;
  let totalProcessed = 0;
  let lastPaymentId = null;

  while (hasMore && totalProcessed < 200) {
    const url = new URL(`${ZEFFY_API_BASE}/payments`);
    url.searchParams.set('currency', 'usd');
    url.searchParams.set('status', 'succeeded');
    url.searchParams.set('limit', '50');
    if (campaignId) url.searchParams.set('campaign', campaignId);
    if (startingAfter) url.searchParams.set('starting_after', startingAfter);

    let res;
    try {
      res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
    } catch (netErr) {
      console.error('Network failure connecting to Zeffy API:', netErr);
      break;
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Zeffy API returned HTTP ${res.status}:`, errText);
      break;
    }

    const payload = await res.json().catch(() => ({}));
    const payments = Array.isArray(payload.data) ? payload.data : [];

    if (payments.length === 0) {
      hasMore = false;
      break;
    }

    for (const payment of payments) {
      lastPaymentId = payment.id;
      totalProcessed++;

      try {
        await processSingleZeffyPayment(payment, env, db, ctx);
      } catch (procErr) {
        console.error(`Failed processing payment ${payment.id}:`, procErr);
      }
    }

    if (payload.has_more && lastPaymentId) {
      startingAfter = lastPaymentId;
    } else {
      hasMore = false;
    }
  }

  // 3. Update sync state
  if (lastPaymentId) {
    try {
      await db.execute({
        sql: `UPDATE reconciliation_sync_state
              SET last_sync_timestamp = ?, last_cursor = ?, sync_count = sync_count + ?, updated_at = datetime('now')
              WHERE id = 'zeffy_poller'`,
        args: [now, lastPaymentId, totalProcessed]
      });
    } catch (updateErr) {
      console.warn('Failed to update sync state watermark:', updateErr.message);
    }
  }

  // 4. Revalidate active cards to detect refunds and disputes
  await checkActiveCardsForRevocation(env, db, apiKey);

  return { success: true, processed: totalProcessed, lastPaymentId };
}

/**
 * Process a single Zeffy payment, match to intent, and issue appreciation card
 */
async function processSingleZeffyPayment(payment, env, db, ctx) {
  const paymentId = payment.id;
  const amountCents = Number(payment.amount || 0);
  const donorEmail = (
    payment.buyer?.email ||
    payment.contact?.email ||
    payment.donor?.email ||
    payment.email ||
    ''
  ).toLowerCase().trim();

  const donorName = (
    payment.buyer?.name ||
    payment.contact?.name ||
    payment.donor?.name ||
    payment.name ||
    'Affirming Supporter'
  ).trim();

  // Check if card already exists for this payment reference
  const existingCard = await db.execute({
    sql: `SELECT id, card_token, status FROM donation_appreciation_cards WHERE payment_reference = ? LIMIT 1`,
    args: [paymentId]
  });

  if (existingCard.rows.length > 0) {
    return; // Already durably recorded
  }

  // 1. Check if payment is refunded or disputed
  const isRefunded = Boolean(
    payment.refund ||
    payment.refund_status === 'refunded' ||
    payment.refunded ||
    (Array.isArray(payment.refunds) && payment.refunds.length > 0)
  );

  const isDisputed = Boolean(payment.dispute || payment.status === 'disputed');

  if (isRefunded || isDisputed) {
    // Record in donations table as refunded/disputed without issuing card
    await db.execute({
      sql: `INSERT OR IGNORE INTO donations (id, zeffy_transaction_id, donor_name, donor_email, amount_cents, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        paymentId,
        donorName,
        donorEmail || 'anonymous@privacy.dcvc',
        amountCents,
        isRefunded ? 'refunded' : 'disputed'
      ]
    });
    return;
  }

  // 2. Deterministic matching against donation_intents
  let matchedIntent = null;
  if (donorEmail) {
    const candidateIntents = await db.execute({
      sql: `SELECT id, intent_token, donor_name, donor_email, amount_cents, frequency, is_anonymous, status, created_at
            FROM donation_intents
            WHERE donor_email = ? AND status = 'pending'
            ORDER BY created_at DESC
            LIMIT 5`,
      args: [donorEmail]
    });

    if (candidateIntents.rows.length === 1) {
      matchedIntent = candidateIntents.rows[0];
    } else if (candidateIntents.rows.length > 1) {
      // Find closest amount match
      matchedIntent = candidateIntents.rows.find(i => Number(i.amount_cents) === amountCents) || null;
    }
  }

  const amountDollars = amountCents / 100;
  const tierInfo = resolveAppreciationTier(amountDollars, env);

  // Mint cryptographically secure token
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const cardToken = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Compute SHA-256 token hash
  const tokenHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cardToken));
  const tokenHash = Array.from(new Uint8Array(tokenHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const isAnon = matchedIntent ? Boolean(matchedIntent.is_anonymous) : Boolean(payment.is_anonymous);
  const displayName = isAnon ? 'Affirming Friend of DCVC' : (matchedIntent?.donor_name || donorName);
  const frequency = matchedIntent?.frequency || payment.frequency || 'one-time';

  // Issue card
  await db.execute({
    sql: `INSERT INTO donation_appreciation_cards 
          (id, card_token, token_hash, payment_reference, tier, tier_name, amount_cents, donor_display_name, is_anonymous, impact_message, frequency, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    args: [
      crypto.randomUUID(),
      cardToken,
      tokenHash,
      paymentId,
      tierInfo.tier,
      tierInfo.tierName,
      amountCents,
      displayName,
      isAnon ? 1 : 0,
      tierInfo.impact,
      frequency
    ]
  });

  // Also record in donations table
  await db.execute({
    sql: `INSERT OR IGNORE INTO donations (id, zeffy_transaction_id, donor_name, donor_email, amount_cents, status)
          VALUES (?, ?, ?, ?, ?, 'succeeded')`,
    args: [
      crypto.randomUUID(),
      paymentId,
      displayName,
      donorEmail || 'anonymous@privacy.dcvc',
      amountCents
    ]
  });

  if (matchedIntent) {
    // Complete intent
    await db.execute({
      sql: `UPDATE donation_intents SET status = 'completed', completed_at = datetime('now') WHERE id = ?`,
      args: [matchedIntent.id]
    });
  } else {
    // Unmatched donor or direct checkout: create reconciliation record for audit trail
    await db.execute({
      sql: `INSERT OR IGNORE INTO donation_reconciliations 
            (id, provider, provider_payment_id, donor_email, amount_cents, status, reconciliation_type)
            VALUES (?, 'zeffy', ?, ?, ?, 'auto_matched', 'unmatched_intent_auto_issued')`,
      args: [
        crypto.randomUUID(),
        paymentId,
        donorEmail || 'unknown@privacy.dcvc',
        amountCents
      ]
    });
  }
}

/**
 * Periodically re-verify active cards to detect post-issuance refunds or chargebacks
 */
async function checkActiveCardsForRevocation(env, db, apiKey) {
  try {
    // Check up to 10 active cards linked to real payment references
    const activeCards = await db.execute({
      sql: `SELECT id, card_token, payment_reference, status
            FROM donation_appreciation_cards
            WHERE status = 'active' 
              AND payment_reference NOT LIKE 'sim_%'
              AND payment_reference NOT LIKE 'test_%'
            ORDER BY created_at DESC
            LIMIT 10`,
      args: []
    });

    for (const row of activeCards.rows) {
      if (!row.payment_reference) continue;

      const res = await fetch(`${ZEFFY_API_BASE}/payments/${encodeURIComponent(row.payment_reference)}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      }).catch(() => null);

      if (!res || !res.ok) continue;

      const payment = await res.json().catch(() => null);
      if (!payment) continue;

      const isRefunded = Boolean(
        payment.refund ||
        payment.refund_status === 'refunded' ||
        payment.refunded ||
        (Array.isArray(payment.refunds) && payment.refunds.length > 0)
      );

      const isDisputed = Boolean(payment.dispute || payment.status === 'disputed');

      if (isRefunded) {
        await db.execute({
          sql: `UPDATE donation_appreciation_cards SET status = 'revoked_refunded', revoked_at = datetime('now'), revocation_reason = 'Zeffy payment refunded' WHERE id = ?`,
          args: [row.id]
        });
      } else if (isDisputed) {
        await db.execute({
          sql: `UPDATE donation_appreciation_cards SET status = 'revoked_disputed', revoked_at = datetime('now'), revocation_reason = 'Zeffy payment disputed' WHERE id = ?`,
          args: [row.id]
        });
      }
    }
  } catch (err) {
    console.warn('Revocation check encountered error:', err.message);
  }
}

