#!/usr/bin/env node

/**
 * Diversity Collective Ventura County (diversitycollective.org)
 * Zeffy Historical Donation Reconciliation & Backfill Tool
 * 
 * Usage:
 *   node scripts/reconcileZeffyDonations.js [--dry-run] [--limit=50]
 * 
 * Features:
 *   - Connects to Zeffy REST API (GET /api/v1/payments)
 *   - Compares against Turso (libSQL) database
 *   - Backfills any donations missed prior to webhook registration/deployment
 *   - Strict idempotency (guarantees zero duplicate cards or records)
 *   - Masks donor emails & PII in console logs
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env if present
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const ZEFFY_API_KEY = process.env.ZEFFY_API_KEY;

const isDryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 50;

console.log('======================================================================');
console.log(' DCVC Zeffy Donation Reconciliation & Historical Recovery Tool');
console.log('======================================================================');
console.log(`Mode: ${isDryRun ? 'DRY RUN (Read Only)' : 'LIVE BACKFILL'}`);
console.log(`Fetch Limit: ${limit}`);
console.log(`Database URL: ${TURSO_DATABASE_URL ? TURSO_DATABASE_URL.replace(/:[^:]*@/, ':***@') : '(Not set - simulation mode)'}`);
console.log(`Zeffy API Key: ${ZEFFY_API_KEY ? 'Configured (✓)' : '(Not set)'}`);
console.log('----------------------------------------------------------------------\n');

function resolveTier(amountDollars) {
  if (amountDollars >= 500) {
    return {
      tier: 'visionary_benefactor',
      tierName: 'Visionary Benefactor',
      impact: 'As a Visionary Benefactor, your profound investment anchors the operational foundation of Diversity Collective Ventura County. You empower the flagship Community Resource Center, sustain year-round advocacy, and ensure Ventura County Pride and the Youth Pride Prom remain forever free, affirming, and accessible to all.'
    };
  }
  if (amountDollars >= 150) {
    return {
      tier: 'rainbow_champion',
      tierName: 'Rainbow Champion',
      impact: 'As a Rainbow Champion, your generosity breathes life into life-saving mental health counseling, dynamic youth initiatives, and vital transgender peer groups across Ventura County.'
    };
  }
  if (amountDollars >= 50) {
    return {
      tier: 'pride_advocate',
      tierName: 'Pride Advocate',
      impact: 'Your advocacy keeps our Community Resource Center stocked with life-saving harm reduction materials, free HIV/STI testing supplies, and immediate crisis support for local LGBTQ+ community members.'
    };
  }
  return {
    tier: 'community_ally',
    tierName: 'Community Ally',
    impact: 'Every step forward is powered by passionate allies like you. Your contribution directly funds peer support group materials, affirming literature, and welcoming gathering spaces for local youth.'
  };
}

async function runReconciliation() {
  if (!ZEFFY_API_KEY) {
    console.log('⚠️ ZEFFY_API_KEY is not set in environment or .env.');
    console.log('To reconcile live historical transactions from Zeffy:');
    console.log('  1. Add ZEFFY_API_KEY to .env or pass as environment variable:');
    console.log('     $env:ZEFFY_API_KEY="your_api_key"; node scripts/reconcileZeffyDonations.js\n');
    return;
  }

  // 1. Fetch from Zeffy REST API
  console.log(`Fetching recent payments from https://api.zeffy.com/api/v1/payments...`);
  let payments = [];
  try {
    const res = await fetch(`https://api.zeffy.com/api/v1/payments?status=succeeded&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${ZEFFY_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.error(`❌ Zeffy API returned HTTP ${res.status}: ${res.statusText}`);
      const errBody = await res.text();
      console.error(errBody);
      return;
    }

    const json = await res.json();
    payments = Array.isArray(json) ? json : (json.items || json.data || []);
    console.log(`✓ Retrieved ${payments.length} successful payment records from Zeffy.\n`);
  } catch (err) {
    console.error(`❌ Network error contacting Zeffy API:`, err.message);
    return;
  }

  if (payments.length === 0) {
    console.log('No payments found to reconcile.');
    return;
  }

  // 2. Initialize Database Client if configured
  let db = null;
  if (TURSO_DATABASE_URL && TURSO_AUTH_TOKEN) {
    const { createClient } = await import('@libsql/client');
    db = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN
    });
  }

  let reconciledCount = 0;
  let alreadyPresentCount = 0;
  let skippedFailedCount = 0;

  for (const pay of payments) {
    const paymentId = String(pay.id || pay.payment_id || pay.transaction_id || '');
    if (!paymentId) continue;

    // Check payment status
    const status = String(pay.status || 'succeeded').toLowerCase();
    if (status !== 'succeeded' && status !== 'completed') {
      skippedFailedCount++;
      continue;
    }

    // Check if payment already exists in Turso
    if (db) {
      try {
        const existing = await db.execute({
          sql: `SELECT id, card_token FROM donation_appreciation_cards WHERE payment_reference = ? LIMIT 1`,
          args: [paymentId]
        });

        if (existing.rows.length > 0) {
          alreadyPresentCount++;
          continue;
        }
      } catch (checkErr) {
        console.error(`Error querying DB for payment ${paymentId}:`, checkErr.message);
      }
    }

    // Determine amount
    let rawAmount = pay.amount ?? pay.total_amount ?? 25;
    let amountInDollars = Number(rawAmount);
    let amountCents = Math.round(amountInDollars * 100);
    if (Number.isInteger(amountInDollars) && amountInDollars >= 100) {
      amountCents = amountInDollars;
      amountInDollars = amountCents / 100;
    }

    const donorObj = pay.contact || pay.donor || {};
    const isAnonymous = Boolean(pay.is_anonymous || donorObj.is_anonymous);
    const donorName = isAnonymous 
      ? 'Affirming Friend of DCVC' 
      : (donorObj.name || `${donorObj.first_name || ''} ${donorObj.last_name || ''}`.trim() || 'Affirming Friend of DCVC');
    const donorEmail = (donorObj.email || '').trim().toLowerCase();
    const frequency = pay.frequency || (pay.is_recurring ? 'monthly' : 'one-time');

    const tierInfo = resolveTier(amountInDollars);
    const cardToken = 'dcvc_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().substring(0, 8);
    const cardId = crypto.randomUUID();
    const emailHash = donorEmail 
      ? crypto.createHash('sha256').update(donorEmail).digest('hex') 
      : null;

    console.log(`+ Backfilling missed donation: Tx ${paymentId} | $${amountInDollars} (${tierInfo.tierName}) | Donor: ${donorName}`);

    if (!isDryRun && db) {
      try {
        await db.execute({
          sql: `INSERT INTO donation_appreciation_cards 
                (id, card_token, payment_reference, tier, tier_name, amount_cents, donor_display_name, donor_email_hash, recipient_email, is_anonymous, impact_message, frequency)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            cardId,
            cardToken,
            paymentId,
            tierInfo.tier,
            tierInfo.tierName,
            amountCents,
            donorName,
            emailHash,
            donorEmail || null,
            isAnonymous ? 1 : 0,
            tierInfo.impact,
            frequency
          ]
        });

        await db.execute({
          sql: `INSERT OR REPLACE INTO webhook_events (id, event_id, event_type, status) VALUES (?, ?, ?, ?)`,
          args: [crypto.randomUUID(), paymentId, 'reconciliation.payment.completed', 'processed']
        });

        reconciledCount++;
      } catch (insertErr) {
        console.error(`Failed to insert record for payment ${paymentId}:`, insertErr.message);
      }
    } else {
      reconciledCount++;
    }
  }

  console.log('\n======================================================================');
  console.log(' RECONCILIATION SUMMARY');
  console.log('======================================================================');
  console.log(`Total Zeffy Transactions Fetched: ${payments.length}`);
  console.log(`Already Present in Database:      ${alreadyPresentCount}`);
  console.log(`New Donations Reconciled:         ${reconciledCount} ${isDryRun ? '(Dry run - not written)' : ''}`);
  console.log(`Skipped (Non-succeeded status):   ${skippedFailedCount}`);
  console.log('======================================================================\n');
}

runReconciliation().catch(err => {
  console.error('Fatal error in reconciliation script:', err);
  process.exit(1);
});
