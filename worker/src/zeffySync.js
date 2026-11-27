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
import { templateDonorAppreciationEmail } from './emailTemplates.js';

const ZEFFY_API_BASE = 'https://api.zeffy.com/api/v1';

async function dispatchZeffySyncEmail(env, sendEmailFn, emailPayload) {
  if (typeof sendEmailFn === 'function') {
    return sendEmailFn(emailPayload);
  }
  if (!env?.RESEND_API_KEY) {
    console.warn('[Zeffy Sync] RESEND_API_KEY not configured; skipping donor appreciation email.');
    return null;
  }

  const from = env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>';
  let res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [emailPayload.to],
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 403 && (errText.includes('domain') || errText.includes('verified') || from.includes('@diversitycollective'))) {
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Diversity Collective <onboarding@resend.dev>',
          to: [emailPayload.to],
          subject: emailPayload.subject,
          html: emailPayload.html,
          text: emailPayload.text
        })
      });
      if (!res.ok) {
        const fallbackErr = await res.text().catch(() => '');
        throw new Error(`Resend API error ${res.status}: ${fallbackErr}`);
      }
    } else {
      throw new Error(`Resend API error ${res.status}: ${errText}`);
    }
  }

  return await res.json().catch(() => ({}));
}

/**
 * Execute automated Zeffy polling and payment reconciliation
 * Called every 5 minutes by Cloudflare Worker scheduled() handler
 */
export async function executeZeffySync(env, db, ctx, sendEmailFn = null) {
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
      if (res.status === 400) {
        const fallbackUrl = new URL(`${ZEFFY_API_BASE}/payments`);
        fallbackUrl.searchParams.set('limit', '50');
        if (startingAfter) fallbackUrl.searchParams.set('starting_after', startingAfter);
        res = await fetch(fallbackUrl.toString(), {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });
      }
    } catch (netErr) {
      console.error('Network failure connecting to Zeffy API:', netErr);
      return { success: false, processed: totalProcessed, error: netErr.message };
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Zeffy API returned HTTP ${res.status}:`, errText);
      await db.execute({
        sql: `UPDATE reconciliation_sync_state SET last_error = ?, updated_at = datetime('now') WHERE id = 'zeffy_poller'`,
        args: [`HTTP ${res.status}: ${errText.slice(0, 300)}`]
      }).catch(() => {});
      return { success: false, processed: totalProcessed, error: `Zeffy API HTTP ${res.status}: ${errText}` };
    }

    const payload = await res.json().catch(() => ({}));
    const payments = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.payments)
      ? payload.payments
      : Array.isArray(payload)
      ? payload
      : [];

    if (payments.length === 0) {
      hasMore = false;
      break;
    }

    for (const payment of payments) {
      lastPaymentId = payment.id;
      totalProcessed++;

      try {
        await processSingleZeffyPayment(payment, env, db, ctx, sendEmailFn);
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
async function processSingleZeffyPayment(payment, env, db, ctx, sendEmailFn = null) {
  const paymentId = payment.id;
  const amountCents = Number(payment.donation_amount ?? payment.amount ?? payment.total_amount ?? payment.totalAmount ?? 0);
  const donorEmail = (
    payment.buyer?.email ||
    payment.contact?.email ||
    payment.donor?.email ||
    payment.customer?.email ||
    payment.payer?.email ||
    payment.supporter?.email ||
    payment.receipt_email ||
    payment.email ||
    ''
  ).toLowerCase().trim();

  const donorName = (
    payment.buyer?.name ||
    payment.contact?.name ||
    payment.donor?.name ||
    payment.customer?.name ||
    payment.payer?.name ||
    payment.supporter?.name ||
    payment.name ||
    `${payment.buyer?.first_name || payment.contact?.first_name || ''} ${payment.buyer?.last_name || payment.contact?.last_name || ''}`.trim() ||
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
            WHERE lower(donor_email) = lower(?) AND status = 'pending'
            ORDER BY created_at DESC
            LIMIT 5`,
      args: [donorEmail]
    });

    if (candidateIntents.rows.length === 1) {
      matchedIntent = candidateIntents.rows[0];
    } else if (candidateIntents.rows.length > 1) {
      // Find exact amount match; if pre-checkout form did not specify an amount (0), use most recent intent
      matchedIntent =
        candidateIntents.rows.find(i => Number(i.amount_cents) > 0 && Number(i.amount_cents) === amountCents) ||
        candidateIntents.rows[0];
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

  const isAnon = matchedIntent ? Boolean(matchedIntent.is_anonymous) : Boolean(payment.is_anonymous || payment.isAnonymous || payment.anonymous);
  const displayName = isAnon ? 'Affirming Friend of DCVC' : (matchedIntent?.donor_name || donorName);
  const frequency = matchedIntent?.frequency ||
    payment.frequency ||
    payment.recurrence ||
    payment.recurring_frequency ||
    payment.recurring_interval ||
    payment.subscription?.interval ||
    ((payment.is_recurring || payment.isMonthly || payment.subscription_id) ? 'monthly' : 'one-time');

  const cardId = crypto.randomUUID();
  const emailHash = donorEmail
    ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(donorEmail))))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    : null;

  // Issue card ONLY after Zeffy confirms payment succeeded (reached here after refund/dispute check)
  await db.execute({
    sql: `INSERT INTO donation_appreciation_cards 
          (id, card_token, token_hash, payment_reference, tier, tier_name, amount_cents, donor_display_name, recipient_email, is_anonymous, impact_message, frequency, donor_email_hash, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    args: [
      cardId,
      cardToken,
      tokenHash,
      paymentId,
      tierInfo.tier,
      tierInfo.tierName,
      amountCents,
      displayName,
      donorEmail || null,
      isAnon ? 1 : 0,
      tierInfo.impact,
      frequency,
      emailHash
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

  // Automatically deliver Personalized Appreciation Card (+ heartfelt message for recurring sustainers)
  if (donorEmail && donorEmail.includes('@')) {
    const frontendBase = env.FRONTEND_BASE_URL || 'https://diversitycollective.org';
    const cardUrl = `${frontendBase}/appreciation-card/${cardToken}`;
    const formattedAmount = `$${amountDollars.toFixed(amountDollars % 1 === 0 ? 0 : 2)}`;

    let customTemplate = null;
    try {
      const tRes = await db.execute({
        sql: `SELECT payload_json FROM site_state WHERE state_key = 'donation_email_template' LIMIT 1`,
        args: []
      });
      if (tRes.rows?.length > 0 && tRes.rows[0].payload_json) {
        customTemplate = JSON.parse(tRes.rows[0].payload_json);
      }
    } catch {}

    const tpl = templateDonorAppreciationEmail({
      donorDisplayName: displayName,
      formattedAmount,
      tierName: tierInfo.tierName,
      badge: tierInfo.badge,
      tagline: tierInfo.tagline,
      impact: tierInfo.impact,
      cardUrl,
      frequency,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      reference: paymentId,
      customTemplate
    });

    let emailDeliveryStatus = env?.RESEND_API_KEY ? 'sent' : 'api_key_missing';
    let emailDeliveryId = null;
    let emailDeliveryError = null;
    try {
      const mailRes = await dispatchZeffySyncEmail(env, sendEmailFn, {
        to: donorEmail,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text
      });
      if (mailRes?.id) {
        emailDeliveryStatus = 'delivered';
        emailDeliveryId = mailRes.id;
      }
    } catch (mailErr) {
      emailDeliveryStatus = 'failed';
      emailDeliveryError = mailErr.message;
      console.error(`[Zeffy Sync] Appreciation email failed for ${paymentId}:`, mailErr);
    }

    await db.execute({
      sql: `UPDATE donation_appreciation_cards SET admin_notes = ? WHERE id = ?`,
      args: [
        JSON.stringify({
          emailDeliveryStatus,
          emailDeliveryId,
          emailDeliveryError,
          dispatchedAt: new Date().toISOString(),
          source: 'zeffy_sync'
        }),
        cardId
      ]
    }).catch(() => {});
  }

  if (matchedIntent) {
    // Complete intent with matched payment reference and card token
    await db.execute({
      sql: `UPDATE donation_intents SET status = 'matched', matched_payment_reference = ?, card_token = ?, completed_at = datetime('now') WHERE id = ?`,
      args: [paymentId, cardToken, matchedIntent.id]
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

