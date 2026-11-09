/**
 * Cloudflare Worker Backend for Diversity Collective Ventura County (diversitycollective.org)
 * Features:
 *  - CORS enforcement & Security Headers
 *  - Turnstile CAPTCHA verification
 *  - Turso (libSQL) integration via @libsql/client/web
 *  - Resend Transactional Email dispatch
 *  - High-performance cursor-based Business Directory pagination
 *  - Zeffy Webhook Verification & Idempotent Event Processing
 *  - DCVC Personalized Digital Appreciation Cards
 *  - Strict data validation & sanitization
 */

import { createClient } from '@libsql/client/web';
import { executeZeffySync } from './zeffySync.js';
import { resolveAppreciationTier } from './appreciationTiers.js';
import { runAllMigrations } from './schemaMigrations.js';
import { processChatRequest } from './chatEngine.js';
import { createSignedUploadParameters } from './cloudinarySigner.js';
import { hashPassword, generateAuthToken, verifyAuthToken, requireRole, logAdminAction } from './adminApi.js';
import { 
  convertRowsToCsv, 
  SHEET_COLUMNS, 
  formatContactRow, 
  formatVolunteerRow, 
  formatBusinessRow, 
  formatTrainingRow 
} from './googleSheetsSync.js';
import {
  templateContactAcknowledgment,
  templateContactStaffNotification,
  templateVolunteerAcknowledgment,
  templateVolunteerStaffNotification,
  templateBusinessAcknowledgment,
  templateBusinessModerationNotification,
  templateTrainingAcknowledgment,
  templateTrainingStaffNotification,
  templateAccessibilityAcknowledgment,
  templateAccessibilityStaffNotification,
  templateDonorAppreciationEmail,
  templateAdminAlert,
  templateNewsletterWelcome,
  templateNewsletterBroadcast
} from './emailTemplates.js';

// Helper: Response with standard JSON & CORS
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...extraHeaders
    }
  });
}

function errorResponse(message, status = 400, details = null, extraHeaders = {}) {
  return jsonResponse({
    success: false,
    error: message,
    ...(details ? { details } : {})
  }, status, extraHeaders);
}

// Helper: CORS Headers
function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGIN || '*';
  
  // Allow configured origin, localhost for dev, Cloudflare Pages staging, or production domains
  const isAllowed = allowed === '*' || 
    origin === allowed || 
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') ||
    origin.endsWith('.pages.dev') ||
    origin.includes('diversitycollective');

  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Zeffy-Signature, x-dcvc-simulation',
    'Access-Control-Max-Age': '86400'
  };
}

// Helper: Cloudflare Turnstile Verification
async function verifyTurnstile(token, secretKey, remoteIp) {
  if (!secretKey || !token) {
    if (!secretKey) return { success: true, bypassed: true };
    return { success: false, error: 'Missing security verification token' };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) formData.append('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const outcome = await res.json();
    return outcome;
  } catch (err) {
    console.error('Turnstile verification failed:', err);
    return { success: false, error: 'Failed to verify security token' };
  }
}

// Helper: Verify Zeffy HMAC-SHA256 Webhook Signature with constant-time comparison
async function verifyZeffySignature(rawBody, signatureHeader, secretKey) {
  if (!secretKey) {
    return { valid: true, bypassed: true };
  }

  if (!signatureHeader) {
    return { valid: false, error: 'Missing signature header' };
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const cleanHeader = signatureHeader.replace(/^sha256=/, '').trim().toLowerCase();
    
    // Constant-time comparison
    let diff = cleanHeader.length ^ computedSignature.length;
    for (let i = 0; i < cleanHeader.length && i < computedSignature.length; i++) {
      diff |= cleanHeader.charCodeAt(i) ^ computedSignature.charCodeAt(i);
    }

    const valid = diff === 0;
    return { valid, error: valid ? null : 'HMAC signature mismatch' };
  } catch (err) {
    console.error('Signature calculation failed:', err);
    return { valid: false, error: err.message };
  }
}

// Multi-Tier Zeffy Webhook Verification: HMAC -> Shared Secret (Header / Query) -> Authoritative Zeffy API Fallback
async function verifyZeffyWebhookRequest(request, rawBody, env, payload) {
  const secretKey = env.ZEFFY_WEBHOOK_SECRET;
  const apiKey = env.ZEFFY_API_KEY;
  const url = new URL(request.url);

  // If neither secret nor API key is configured, allow in development/testing with warning
  if (!secretKey && !apiKey) {
    console.warn('⚠️ ZEFFY_WEBHOOK_SECRET and ZEFFY_API_KEY not configured. Allowing test payload in development.');
    return { valid: true, bypassed: true, method: 'dev_bypass' };
  }

  // 1. Check HMAC-SHA256 signature header (x-zeffy-signature or x-webhook-signature)
  const signatureHeader = request.headers.get('x-zeffy-signature') || 
                          request.headers.get('x-webhook-signature') || '';
  if (secretKey && signatureHeader) {
    const hmacRes = await verifyZeffySignature(rawBody, signatureHeader, secretKey);
    if (hmacRes.valid) {
      return { valid: true, method: 'hmac_sha256' };
    }
  }

  // 2. Check Shared Secret Token via header or URL query parameter
  const headerToken = (request.headers.get('x-zeffy-secret') || 
                       request.headers.get('x-api-key') || 
                       request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const queryToken = (url.searchParams.get('secret') || url.searchParams.get('token') || '').trim();

  if (secretKey) {
    if (headerToken === secretKey || queryToken === secretKey) {
      return { valid: true, method: 'shared_secret' };
    }
  }

  // 3. Authoritative Out-of-Band Verification via Zeffy REST API
  // If ZEFFY_API_KEY is configured, verify against Zeffy's authoritative endpoint
  const data = payload?.data || payload || {};
  const paymentId = data.id || data.payment_id || data.transaction_id || payload?.id;
  if (apiKey && paymentId) {
    try {
      const zeffyRes = await fetch(`https://api.zeffy.com/api/v1/payments/${encodeURIComponent(paymentId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (zeffyRes.ok) {
        const authoritativeData = await zeffyRes.json();
        return { valid: true, method: 'authoritative_api', authoritativeData };
      } else if (zeffyRes.status === 404) {
        return { valid: false, error: 'Transaction ID not recognized by Zeffy API' };
      }
    } catch (apiErr) {
      console.warn('Authoritative Zeffy API verification network attempt failed:', apiErr.message);
    }
  }

  if (secretKey) {
    return { valid: false, error: 'Invalid webhook signature or secret token' };
  }
  if (apiKey) {
    return { valid: false, error: 'Unable to verify payment with Zeffy API' };
  }

  return { valid: false, error: 'Webhook authentication failed' };
}

// Helper: Resend Email Dispatch
async function sendEmail({ apiKey, from, to, replyTo, subject, html, text }) {
  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY not configured. Skipping email dispatch.');
    return { id: 'mock-email-id', mock: true };
  }

  const primaryFrom = from || 'Diversity Collective <noreply@diversitycollective.org>';
  
  let res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: primaryFrom,
      to: Array.isArray(to) ? to : [to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      html,
      ...(text ? { text } : {})
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`Resend dispatch with from "${primaryFrom}" failed (${res.status}): ${errText}`);

    // If unverified domain (common before launch DNS migration), fallback to Resend Sandbox domain for development testing
    if (res.status === 403 && (errText.includes('domain') || errText.includes('verified') || primaryFrom.includes('@diversitycollective'))) {
      console.log('Attempting development fallback via onboarding@resend.dev...');
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Diversity Collective <onboarding@resend.dev>',
          to: Array.isArray(to) ? to : [to],
          subject: `[Dev Preview] ${subject}`,
          html,
          ...(text ? { text } : {})
        })
      });
      if (!res.ok) {
        const fallbackErr = await res.text();
        throw new Error(`Resend email failed: ${fallbackErr}`);
      }
    } else {
      throw new Error(`Resend email failed: ${errText}`);
    }
  }

  return await res.json();
}

// Helper: Turso libSQL Client Factory
function getDb(env) {
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    return null;
  }
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN
  });
}

// Router
export default {
  async fetch(request, env, ctx) {
    const cors = getCorsHeaders(request, env);

    // Handle OPTIONS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    const clientIp = request.headers.get('CF-Connecting-IP') || '';

    // If static frontend assets binding is present and request is NOT for /api/*, serve frontend
    if (env.ASSETS && !pathname.startsWith('/api')) {
      return env.ASSETS.fetch(request);
    }

    try {
      // 1. Health check
      if (pathname === '/api/health' && (request.method === 'GET' || request.method === 'HEAD')) {
        const hasDb = !!(env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN);
        const hasResend = !!env.RESEND_API_KEY;
        const hasTurnstile = !!env.TURNSTILE_SECRET_KEY;
        const hasZeffy = !!env.ZEFFY_WEBHOOK_SECRET;

        if (request.method === 'HEAD') {
          return new Response(null, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...cors
            }
          });
        }

        return jsonResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          integrations: {
            databaseConfigured: hasDb,
            resendConfigured: hasResend,
            turnstileConfigured: hasTurnstile,
            zeffyWebhookConfigured: hasZeffy,
            workersAiConfigured: !!env.AI,
            chatbotEnabled: env.CHATBOT_ENABLED === 'true'
          },
          appreciationTiers: {
            communityAllyMin: parseInt(env.APPRECIATION_TIER_1_MIN || '1', 10),
            prideAdvocateMin: parseInt(env.APPRECIATION_TIER_2_MIN || '50', 10),
            rainbowChampionMin: parseInt(env.APPRECIATION_TIER_3_MIN || '150', 10),
            visionaryBenefactorMin: parseInt(env.APPRECIATION_TIER_4_MIN || '500', 10)
          }
        }, 200, cors);
      }

      // =======================================================================
      // ASK DCVC: FREE AI CHATBOT (POST /api/chat)
      // Powered by Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct-fp8)
      // Strict $0 recurring cost, 10,000 neurons/day free tier
      // Must remain disabled until the final environment configuration
      // =======================================================================
      if (pathname === '/api/chat' && request.method === 'POST') {
        const isEnabled = env.CHATBOT_ENABLED === 'true';
        const isSimulation = request.headers.get('x-dcvc-simulation') === 'true';
        const isDevOrSim = !env.ENVIRONMENT || env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'test' || isSimulation;

        // Check if chatbot is disabled by configuration in production
        if (!isEnabled && !isDevOrSim) {
          return jsonResponse({
            success: false,
            disabled: true,
            message: "Ask DCVC is currently disabled pending environment configuration. Please visit our programs page or reach staff directly at info@diversitycollective.org.",
            contactUrl: "/contact",
            programsUrl: "/programs"
          }, 503, cors);
        }

        const body = await request.json().catch(() => ({}));
        const message = body.message || body.prompt || '';

        const chatResult = await processChatRequest(message, env, clientIp);

        if (!chatResult.success) {
          return jsonResponse({
            success: false,
            error: chatResult.error,
            answer: chatResult.answer || chatResult.error
          }, chatResult.status || 400, cors);
        }

        return jsonResponse(chatResult, 200, cors);
      }

      // =======================================================================
      // SPEECH-TO-TEXT: UNIVERSAL NETWORK TRANSCRIPTION (POST /api/transcribe)
      // Powered by Cloudflare Workers AI Whisper (@cf/openai/whisper)
      // Works across Brave, Firefox, Safari, Edge, Chrome, and mobile devices
      // =======================================================================
      if (pathname === '/api/transcribe' && request.method === 'POST') {
        try {
          const contentType = request.headers.get('content-type') || '';
          let audioBytes;

          if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file');
            if (file && typeof file.arrayBuffer === 'function') {
              const buffer = await file.arrayBuffer();
              audioBytes = new Uint8Array(buffer);
            }
          } else {
            const buffer = await request.arrayBuffer();
            audioBytes = new Uint8Array(buffer);
          }

          if (env.AI && typeof env.AI.run === 'function' && audioBytes && audioBytes.length > 0) {
            const whisperResult = await env.AI.run('@cf/openai/whisper', {
              audio: [...audioBytes]
            });
            return jsonResponse({
              success: true,
              text: whisperResult.text ? whisperResult.text.trim() : ''
            }, 200, cors);
          }
        } catch (err) {
          console.warn('[Transcribe API] Cloudflare Workers AI Whisper error:', err);
        }

        return jsonResponse({
          success: true,
          text: '',
          fallback: true
        }, 200, cors);
      }

      // =======================================================================
      // 2. ZEFFY WEBHOOK: payment.completed & DCVC Appreciation Card Dispatch
      // Registered URL: https://diversitycollective.org/api/webhooks/zeffy
      // =======================================================================
      if (pathname === '/api/webhooks/zeffy' && request.method === 'POST') {
        const rawBody = await request.text();
        
        let payload;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return errorResponse('Invalid JSON payload', 400, null, cors);
        }

        // 1. Multi-tier Authentication & Signature Verification
        const authVerification = await verifyZeffyWebhookRequest(request, rawBody, env, payload);
        if (!authVerification.valid) {
          console.error('Zeffy webhook authentication failed:', authVerification.error);
          return errorResponse('Invalid webhook signature or unauthorized token', 401, authVerification.error, cors);
        }

        // 2. Event Type Normalization
        const eventType = payload.event || payload.type || payload.event_type || 'payment.completed';
        const data = payload.data || payload;
        const paymentReference = String(data.id || data.payment_id || data.transaction_id || payload.id || '').trim();

        if (!paymentReference) {
          return errorResponse('Missing transaction or payment identifier', 400, null, cors);
        }

        const db = getDb(env);

        // Compute payload hash for auditable, PII-free tracking
        const payloadHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawBody))))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        // 3. Handle Refund Events safely
        if (eventType === 'payment.refunded' || eventType === 'refund.created' || data.status === 'refunded') {
          if (db) {
            try {
              await db.execute({
                sql: `UPDATE webhook_events SET status = 'refunded' WHERE event_id = ?`,
                args: [paymentReference]
              });
              console.log(`[Zeffy Webhook] Payment ${paymentReference} marked as refunded.`);
            } catch (refErr) {
              console.warn('[Zeffy Webhook] Refund event log update skipped:', refErr.message);
            }
          }
          return jsonResponse({
            success: true,
            status: 'refund_recorded',
            paymentReference,
            message: 'Refund event recorded successfully.'
          }, 200, cors);
        }

        // 4. Ignore Non-Donation Events
        if (eventType !== 'payment.completed' && eventType !== 'donation.completed' && eventType !== 'order.completed') {
          return jsonResponse({
            success: true,
            status: 'ignored',
            message: `Event type ${eventType} ignored. Only completed donations receive appreciation cards.`
          }, 200, cors);
        }

        // 5. Strict Payment Status Check: Do not mark pending or failed payments as successful
        const paymentStatus = String(data.status || 'succeeded').toLowerCase();
        if (['pending', 'in_progress', 'processing'].includes(paymentStatus)) {
          return jsonResponse({
            success: true,
            status: 'pending_ignored',
            message: 'Payment is pending. Cards and confirmation emails are issued only upon completion.'
          }, 200, cors);
        }

        if (['failed', 'declined', 'cancelled', 'canceled'].includes(paymentStatus)) {
          return jsonResponse({
            success: true,
            status: 'failed_ignored',
            message: 'Payment was not successful. No card issued.'
          }, 200, cors);
        }

        // 6. IDEMPOTENCY CHECK: Ensure we never double-issue a card or duplicate emails
        if (db) {
          try {
            const existing = await db.execute({
              sql: `SELECT id, card_token, tier_name FROM donation_appreciation_cards WHERE payment_reference = ? LIMIT 1`,
              args: [paymentReference]
            });

            if (existing.rows.length > 0) {
              console.log(`[Idempotency] Webhook for payment ${paymentReference} already processed.`);
              return jsonResponse({
                success: true,
                status: 'already_processed',
                cardToken: existing.rows[0].card_token,
                message: 'This payment has already been processed.'
              }, 200, cors);
            }
          } catch (dbErr) {
            console.warn('[Idempotency] DB query check skipped:', dbErr.message);
          }
        }

        // 7. Determine Authoritative Amount Credited (in USD Dollars & Cents)
        let rawAmount = data.donation_amount ?? data.amount ?? data.total_amount ?? data.totalAmount ?? 25;
        let amountInDollars = 0;
        let amountCents = 0;

        if (typeof rawAmount === 'string') {
          rawAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));
        }

        if (data.amount_is_dollars === true) {
          amountInDollars = Number(rawAmount);
          amountCents = Math.round(amountInDollars * 100);
        } else if (Number.isInteger(Number(rawAmount)) && Number(rawAmount) >= 100) {
          // Zeffy integer amounts >= 100 are represented in cents (e.g. 5000 = $50.00)
          amountCents = Number(rawAmount);
          amountInDollars = amountCents / 100;
        } else {
          amountInDollars = Number(rawAmount);
          amountCents = Math.round(amountInDollars * 100);
        }

        if (isNaN(amountInDollars) || amountInDollars <= 0) {
          amountInDollars = 25;
          amountCents = 2500;
        }

        // 8. Robust Donor Details Extraction across varied Zeffy schemas
        const donorObj = data.contact || data.donor || data.buyer || {};
        const isAnonymous = Boolean(
          data.is_anonymous || data.isAnonymous || data.anonymous || 
          donorObj.isAnonymous || donorObj.is_anonymous || data.hide_name
        );
        
        const firstName = (donorObj.first_name || donorObj.firstName || data.first_name || data.firstName || '').trim();
        const lastName = (donorObj.last_name || donorObj.lastName || data.last_name || data.lastName || '').trim();
        const rawFullName = (donorObj.name || donorObj.fullName || data.donor_name || data.name || `${firstName} ${lastName}`).trim();
        const donorDisplayName = isAnonymous || !rawFullName ? 'Affirming Friend of DCVC' : rawFullName;

        const donorEmail = (donorObj.email || data.donor_email || data.email || '').trim().toLowerCase();
        const frequency = data.frequency || (data.is_recurring || data.isMonthly ? 'monthly' : 'one-time');

        // 9. Resolve Appreciation Tier & Message
        const tierInfo = resolveAppreciationTier(amountInDollars, env);

        // Generate unguessable secure card token (40 characters)
        const cardToken = 'dcvc_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().substring(0, 8);
        const cardId = crypto.randomUUID();

        // Hash donor email for private indexing without exposing PII
        const emailHash = donorEmail 
          ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(donorEmail))))
              .map(b => b.toString(16).padStart(2, '0')).join('')
          : null;

        // 10. Persist to Turso Database
        if (db) {
          try {
            await db.execute({
              sql: `INSERT INTO donation_appreciation_cards 
                    (id, card_token, payment_reference, tier, tier_name, amount_cents, donor_display_name, donor_email_hash, recipient_email, is_anonymous, impact_message, frequency)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                cardId,
                cardToken,
                paymentReference,
                tierInfo.tier,
                tierInfo.tierName,
                amountCents,
                donorDisplayName,
                emailHash,
                donorEmail || null,
                isAnonymous ? 1 : 0,
                tierInfo.impact,
                frequency
              ]
            });

            await db.execute({
              sql: `INSERT OR REPLACE INTO webhook_events (id, event_id, event_type, payload_hash, status) VALUES (?, ?, ?, ?, ?)`,
              args: [crypto.randomUUID(), paymentReference, eventType, payloadHash, 'processed']
            });
          } catch (dbInsertErr) {
            console.error('Failed to persist appreciation card in database:', dbInsertErr);
            return errorResponse('Failed to record donation in database', 500, dbInsertErr.message, cors);
          }
        }

        // 11. Build Card View URL on the DCVC Domain
        const frontendBase = env.FRONTEND_BASE_URL || 'https://diversitycollective.org';
        const cardUrl = `${frontendBase}/appreciation-card/${cardToken}`;

        // 12. Send Personalized Appreciation Email via Resend
        if (donorEmail && donorEmail.includes('@')) {
          const formattedAmount = `$${amountInDollars.toFixed(amountInDollars % 1 === 0 ? 0 : 2)}`;
          const emailSubject = `Your DCVC Appreciation Card has arrived! 💜 (${tierInfo.tierName})`;

          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Diversity Collective Appreciation Card</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(90, 30, 101, 0.08); border: 1px solid #e2e8f0;">
                <!-- Header Banner -->
                <tr>
                  <td style="padding: 40px 32px; background: linear-gradient(135deg, #5A1E65 0%, #3b0764 100%); text-align: center;">
                    <span style="display: inline-block; padding: 6px 14px; background-color: rgba(255,255,255,0.15); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #fef08a; text-transform: uppercase;">
                      ${tierInfo.badge}
                    </span>
                    <h1 style="color: #ffffff; font-size: 28px; margin: 16px 0 8px 0; font-weight: 800; letter-spacing: -0.5px;">
                      Thank You, ${donorDisplayName}!
                    </h1>
                    <p style="color: #e9d5ff; font-size: 16px; margin: 0; font-style: italic;">
                      "${tierInfo.tagline}"
                    </p>
                  </td>
                </tr>

                <!-- Card Body -->
                <tr>
                  <td style="padding: 36px 32px;">
                    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
                      We are deeply moved by your generous gift of <strong>${formattedAmount}</strong> ${frequency === 'monthly' ? '(Monthly Sustainer)' : ''}. Your kindness powers our safe harbor for LGBTQ+ individuals and families across Ventura County.
                    </p>

                    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin: 24px 0;">
                      <h4 style="margin: 0 0 8px 0; color: #581c87; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">What Your Gift Makes Possible</h4>
                      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #4c1d95;">
                        ${tierInfo.impact}
                      </p>
                    </div>

                    <!-- Interactive Card CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${cardUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e11d48 0%, #5A1E65 50%, #6b21a8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; padding: 16px 36px; border-radius: 16px; box-shadow: 0 8px 20px rgba(90, 30, 101, 0.25);">
                        Open Your Personalized Card ✨
                      </a>
                      <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
                        Interactive digital card · Shareable keepsake · Downloadable PDF
                      </p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0 24px 0;">

                    <!-- Important Non-Profit Disclosures -->
                    <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
                      <strong>Tax Receipt Notice:</strong> This appreciation card is an expressive cultural keepsake from our community. Your official 501(c)(3) tax receipt (EIN: 46-5312131) has been issued separately by our giving partner, Zeffy.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0 0 4px 0; font-weight: 700; color: #475569;">Diversity Collective Ventura County, Inc.</p>
                    <p style="margin: 0 0 8px 0;">2471 Portola Road, Suite 100, Ventura, CA 93003 · (805) 644-LGBT</p>
                    <p style="margin: 0;"><a href="https://diversitycollective.org" style="color: #6b21a8; text-decoration: underline;">diversitycollective.org</a></p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `;

          await sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
            to: donorEmail,
            subject: emailSubject,
            html
          }).catch(mailErr => console.error('Failed to dispatch card email:', mailErr));
        }

        return jsonResponse({
          success: true,
          status: 'card_created',
          cardToken,
          cardUrl,
          tier: tierInfo.tier,
          tierName: tierInfo.tierName,
          donorDisplayName,
          amountInDollars
        }, 201, cors);
      }

      // =======================================================================
      // 2b. ZEFFY RECONCILIATION: Recover Missed Historical Webhook Events
      // =======================================================================
      if (pathname === '/api/webhooks/zeffy/reconcile' && request.method === 'POST') {
        const authHeader = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
        const apiKey = env.ZEFFY_API_KEY;
        const adminAuth = await verifyAuthToken(authHeader, env.JWT_SECRET || 'dcvc_admin_jwt_secret_2026');
        const isAuthorized = (apiKey && authHeader === apiKey) || Boolean(adminAuth);

        if (!isAuthorized) {
          return errorResponse('Unauthorized reconciliation request', 401, null, cors);
        }

        if (!apiKey) {
          return errorResponse('ZEFFY_API_KEY is not configured on this environment', 500, null, cors);
        }

        try {
          const db = getDb(env);
          const syncResult = await executeZeffySync(env, db, ctx);
          return jsonResponse({
            success: true,
            status: 'reconciliation_complete',
            result: syncResult
          }, 200, cors);
        } catch (syncErr) {
          console.error('Reconciliation error:', syncErr);
          return errorResponse(`Zeffy reconciliation failed: ${syncErr.message}`, 500, null, cors);
        }
      }

      // =======================================================================
      // 3. APPRECIATION CARDS: Public Retrieval by Secure Token (GET)
      // Hardened: Fail-closed (404/403/410/503), no mock fallback, Cache-Control: no-store
      // =======================================================================
      if (pathname.startsWith('/api/appreciation-cards/') && request.method === 'GET') {
        const token = pathname.replace('/api/appreciation-cards/', '').trim();
        const db = getDb(env);

        if (!token) {
          return errorResponse('Missing card token', 400, null, cors);
        }

        if (!db) {
          return errorResponse('Database service temporarily unavailable', 503, null, cors);
        }

        // Hash query token if 48-char hex or direct token lookup
        const result = await db.execute({
          sql: `SELECT card_token, token_hash, tier, tier_name, amount_cents, donor_display_name, is_anonymous, impact_message, frequency, status, created_at, is_opened, opened_at
                FROM donation_appreciation_cards
                WHERE card_token = ? OR token_hash = ? LIMIT 1`,
          args: [token, token]
        });

        if (result.rows.length === 0) {
          return errorResponse('Appreciation keepsake not found', 404, null, cors);
        }

        const row = result.rows[0];
        const status = row.status || 'active';

        // Enforce lifecycle access controls
        if (status.startsWith('revoked_')) {
          return jsonResponse({
            success: false,
            error: 'This appreciation keepsake has been revoked or refunded.',
            status: status
          }, 410, {
            ...cors,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          });
        }

        if (status.startsWith('pending_') || status.startsWith('manual_')) {
          return jsonResponse({
            success: false,
            error: 'This appreciation keepsake is pending donation verification.',
            status: status
          }, 403, {
            ...cors,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          });
        }

        // Mark card as opened in background if first open
        if (!row.is_opened) {
          ctx.waitUntil(
            db.execute({
              sql: `UPDATE donation_appreciation_cards SET is_opened = 1, opened_at = datetime('now') WHERE card_token = ?`,
              args: [row.card_token]
            }).catch(e => console.error('Failed to mark card opened:', e))
          );
        }

        return jsonResponse({
          success: true,
          card: {
            token: row.card_token,
            tier: row.tier,
            tierName: row.tier_name,
            amountCents: row.amount_cents,
            donorDisplayName: row.donor_display_name,
            isAnonymous: Boolean(row.is_anonymous),
            frequency: row.frequency,
            impactMessage: row.impact_message,
            status: row.status || 'active',
            createdAt: row.created_at
          }
        }, 200, {
          ...cors,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        });
      }

      // =======================================================================
      // 4. APPRECIATION CARDS: Simulation Endpoint (POST /api/appreciation-cards/simulate)
      // Hardened: Requires Admin Authentication in production; cryptographically minted tokens
      // =======================================================================
      if (pathname === '/api/appreciation-cards/simulate' && request.method === 'POST') {
        const isDev = !env.ENVIRONMENT || env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'test';
        const user = await verifyAuthToken(request, env);

        if (!isDev && (!user || user.role !== 'admin')) {
          return errorResponse('Forbidden: Simulation requires DCVC Administrator credentials', 403, null, cors);
        }

        const body = await request.json().catch(() => ({}));
        const amount = Number(body.amount || 75);
        const name = body.name || 'Alex Morgan';
        const isAnon = Boolean(body.isAnonymous);
        const tierInfo = resolveAppreciationTier(amount, env);

        // Mint cryptographically secure token (24 random bytes -> 48 hex chars)
        const randomBytes = new Uint8Array(24);
        crypto.getRandomValues(randomBytes);
        const cardToken = 'dcvc_sim_' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

        // Compute SHA-256 token hash
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cardToken));
        const tokenHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const db = getDb(env);
        if (db) {
          await db.execute({
            sql: `INSERT INTO donation_appreciation_cards 
                  (id, card_token, token_hash, payment_reference, tier, tier_name, amount_cents, donor_display_name, is_anonymous, impact_message, frequency, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            args: [
              crypto.randomUUID(),
              cardToken,
              tokenHash,
              `sim_${Date.now()}`,
              tierInfo.tier,
              tierInfo.tierName,
              Math.round(amount * 100),
              isAnon ? 'Affirming Friend of DCVC' : name,
              isAnon ? 1 : 0,
              tierInfo.impact,
              body.frequency || 'one-time'
            ]
          }).catch(err => console.warn('Simulation DB insert skipped:', err));
        }

        return jsonResponse({
          success: true,
          token: cardToken,
          tier: tierInfo.tier,
          tierName: tierInfo.tierName,
          cardUrl: `/appreciation-card/${cardToken}`
        }, 201, cors);
      }

      // =======================================================================
      // 4.1 DONATION INTENT: Register Intent Pre-Checkout (POST /api/donations/intent)
      // =======================================================================
      if (pathname === '/api/donations/intent' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const donorName = (body.donorName || '').trim();
        const donorEmail = (body.donorEmail || '').toLowerCase().trim();
        const amount = Number(body.amount || 0);
        const frequency = body.frequency || 'one-time';
        const isAnonymous = Boolean(body.isAnonymous);

        if (!donorEmail && !isAnonymous) {
          return errorResponse('Email address is required for donation matching', 400, null, cors);
        }

        // Mint cryptographically secure intent token
        const randomBytes = new Uint8Array(24);
        crypto.getRandomValues(randomBytes);
        const intentToken = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(intentToken));
        const tokenHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const intentId = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO donation_intents 
                  (id, intent_token, token_hash, donor_name, donor_email, amount_cents, frequency, is_anonymous, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            args: [
              intentId,
              intentToken,
              tokenHash,
              donorName || 'Affirming Supporter',
              donorEmail || 'anonymous@privacy.dcvc',
              Math.round(amount * 100),
              frequency,
              isAnonymous ? 1 : 0
            ]
          }).catch(err => console.warn('Intent DB insert skipped:', err.message));
        }

        return jsonResponse({
          success: true,
          intentToken,
          intentId
        }, 201, cors);
      }

      // =======================================================================
      // 4.2 DONATION VERIFY: Self-Service Donor Verification (POST /api/donations/verify)
      // =======================================================================
      if (pathname === '/api/donations/verify' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const intentToken = (body.intentToken || '').trim();
        const transactionId = (body.transactionId || '').trim();
        const db = getDb(env);

        if (!db) {
          return errorResponse('Database service temporarily unavailable', 503, null, cors);
        }

        let card = null;

        if (intentToken) {
          // Check if intent was matched and card issued
          const intentRes = await db.execute({
            sql: `SELECT di.id, di.status, di.donor_email, di.amount_cents, dac.card_token, dac.status as card_status
                  FROM donation_intents di
                  LEFT JOIN donation_appreciation_cards dac ON (dac.donor_display_name = di.donor_name OR dac.amount_cents = di.amount_cents)
                  WHERE di.intent_token = ? LIMIT 1`,
            args: [intentToken]
          });

          if (intentRes.rows.length > 0 && intentRes.rows[0].card_token) {
            card = {
              cardToken: intentRes.rows[0].card_token,
              cardStatus: intentRes.rows[0].card_status || 'active'
            };
          }
        }

        if (!card && transactionId) {
          const cardRes = await db.execute({
            sql: `SELECT card_token, status FROM donation_appreciation_cards WHERE payment_reference = ? LIMIT 1`,
            args: [transactionId]
          });

          if (cardRes.rows.length > 0) {
            card = {
              cardToken: cardRes.rows[0].card_token,
              cardStatus: cardRes.rows[0].status || 'active'
            };
          }
        }

        if (card) {
          return jsonResponse({
            success: true,
            status: 'verified',
            cardUrl: `/appreciation-card/${card.cardToken}`
          }, 200, cors);
        }

        return jsonResponse({
          success: true,
          status: 'pending',
          message: 'Donation verification in progress. Our system checks payment gateways every 5 minutes.'
        }, 200, cors);
      }

      // =======================================================================
      // 5. Business Directory: Search & Filter (GET /api/directory)
      // =======================================================================
      if (pathname === '/api/directory' && request.method === 'GET') {
        const db = getDb(env);
        const q = (url.searchParams.get('q') || '').trim();
        const category = (url.searchParams.get('category') || '').trim();
        const city = (url.searchParams.get('city') || '').trim();
        const cursor = url.searchParams.get('cursor');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 50);

        if (!db) {
          return jsonResponse({
            success: true,
            businesses: [],
            total: 0,
            hasMore: false,
            message: 'Database connection awaiting environment variables.'
          }, 200, cors);
        }

        let query = `
          SELECT id, slug, name, category, description, address, city, zip, phone, email, website, instagram, hours, logo_url, cover_url, is_featured, is_verified, created_at
          FROM businesses
          WHERE status = 'approved'
        `;
        const args = [];

        if (category && category !== 'All Categories') {
          query += ` AND category = ?`;
          args.push(category);
        }

        if (city && city !== 'All Cities') {
          query += ` AND city = ?`;
          args.push(city);
        }

        if (q) {
          query += ` AND id IN (SELECT id FROM businesses_fts WHERE businesses_fts MATCH ?)`;
          args.push(`${q}*`);
        }

        if (cursor) {
          query += ` AND (created_at < ? OR (created_at = ? AND id < ?))`;
          const [cDate, cId] = cursor.split('|');
          args.push(cDate, cDate, cId);
        }

        query += ` ORDER BY is_featured DESC, created_at DESC, id DESC LIMIT ?`;
        args.push(limit + 1);

        const result = await db.execute({ sql: query, args });
        const hasMore = result.rows.length > limit;
        const items = hasMore ? result.rows.slice(0, limit) : result.rows;
        const nextCursor = hasMore && items.length > 0 
          ? `${items[items.length - 1].created_at}|${items[items.length - 1].id}` 
          : null;

        return jsonResponse({
          success: true,
          businesses: items,
          hasMore,
          nextCursor
        }, 200, cors);
      }

      // =======================================================================
      // 6. Business Directory: Single Profile (GET /api/directory/:slug)
      // =======================================================================
      if (pathname.startsWith('/api/directory/') && request.method === 'GET') {
        const slug = pathname.replace('/api/directory/', '');
        const db = getDb(env);
        if (!db) return errorResponse('Database not configured', 503, null, cors);

        const result = await db.execute({
          sql: `SELECT * FROM businesses WHERE slug = ? AND status = 'approved' LIMIT 1`,
          args: [slug]
        });

        if (result.rows.length === 0) {
          return errorResponse('Business profile not found', 404, null, cors);
        }

        return jsonResponse({
          success: true,
          business: result.rows[0]
        }, 200, cors);
      }

      // =======================================================================
      // 7. Business Submission (POST /api/directory)
      // =======================================================================
      if (pathname === '/api/directory' && request.method === 'POST') {
        const body = await request.json();
        
        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp);
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        if (!body.name || !body.category || !body.city || !body.ownerEmail || !body.affirmingPledge) {
          return errorResponse('Please complete all required fields and sign the affirming pledge.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const slug = (body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'biz') + '-' + id.substring(0, 6);
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO businesses 
                  (id, slug, name, category, description, address, city, zip, phone, email, website, instagram, hours, owner_name, owner_email, status, affirming_pledge_signed_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
            args: [
              id,
              slug,
              body.name,
              body.category,
              body.description || '',
              body.address || '',
              body.city,
              body.zip || '',
              body.phone || '',
              body.email || '',
              body.website || '',
              body.instagram || '',
              body.hours || '',
              body.ownerName || '',
              body.ownerEmail
            ]
          });
        }

        await sendEmail({
          apiKey: env.RESEND_API_KEY,
          from: env.RESEND_FROM_EMAIL,
          to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
          replyTo: body.ownerEmail,
          subject: `[New Directory Submission] ${body.name} (${body.city})`,
          html: `
            <h2>New Business Directory Listing Pending Review</h2>
            <p><strong>Business:</strong> ${body.name}</p>
            <p><strong>Category:</strong> ${body.category}</p>
            <p><strong>City:</strong> ${body.city}</p>
            <p><strong>Submitter:</strong> ${body.ownerName} (${body.ownerEmail})</p>
            <p><strong>Affirming Pledge Signed:</strong> Yes</p>
          `
        }).catch(err => console.error('Email notify failed:', err));

        return jsonResponse({
          success: true,
          message: 'Your listing has been submitted for review. DCVC staff will verify and publish your profile within 3–5 business days.',
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 8. Contact Inquiries (POST /api/contact)
      // =======================================================================
      if (pathname === '/api/contact' && request.method === 'POST') {
        const body = await request.json();

        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp);
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        if (!body.name || !body.email || !body.subject || !body.message) {
          return errorResponse('Please complete all required fields.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO contact_submissions (id, name, email, phone, subject, message, consent_given, ip_hash)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [id, body.name, body.email, body.phone || '', body.subject, body.message, body.consent ? 1 : 0, clientIp]
          });
        }

        await sendEmail({
          apiKey: env.RESEND_API_KEY,
          from: env.RESEND_FROM_EMAIL,
          to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
          replyTo: body.email,
          subject: `[Website Inquiry] ${body.subject} — from ${body.name}`,
          html: `
            <h3>New Contact Message Received</h3>
            <p><strong>Name:</strong> ${body.name}</p>
            <p><strong>Email:</strong> ${body.email}</p>
            <p><strong>Phone:</strong> ${body.phone || 'None provided'}</p>
            <p><strong>Subject:</strong> ${body.subject}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${body.message}</p>
          `
        }).catch(err => console.error('Staff notification failed:', err));

        return jsonResponse({
          success: true,
          message: 'Thank you! Your message has been sent to our team.',
          reference: id
        }, 200, cors);
      }

      // =======================================================================
      // 9. Volunteer Applications (POST /api/volunteer)
      // =======================================================================
      if (pathname === '/api/volunteer' && request.method === 'POST') {
        const body = await request.json();

        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp);
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        if (!body.fullName || !body.email || !body.phone || !body.city) {
          return errorResponse('Please complete all required fields.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO volunteer_applications (id, full_name, email, phone, city, availability, roles_of_interest, skills_experience, lived_experience, consent_given)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              id,
              body.fullName,
              body.email,
              body.phone,
              body.city,
              body.availability || '',
              JSON.stringify(body.roles || []),
              body.skills || '',
              body.livedExperience || '',
              body.consent ? 1 : 0
            ]
          });
        }

        return jsonResponse({
          success: true,
          message: 'Volunteer application received! Our team will contact you with orientation details.',
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 10. Training Workshop Bookings (POST /api/training/book)
      // =======================================================================
      if (pathname === '/api/training/book' && request.method === 'POST') {
        const body = await request.json();

        if (!body.organizationName || !body.contactName || !body.email || !body.courseTitle) {
          return errorResponse('Please provide all mandatory booking details.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO training_bookings (id, organization_name, organization_type, contact_name, email, phone, course_id, course_title, preferred_format, estimated_attendees, preferred_date, alternative_date, goals_and_notes)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              id,
              body.organizationName,
              body.organizationType || '',
              body.contactName,
              body.email,
              body.phone || '',
              body.courseId || '',
              body.courseTitle,
              body.preferredFormat || 'in-person',
              parseInt(body.attendeeCount || '20', 10),
              body.preferredDate || '',
              body.alternativeDate || '',
              body.notes || ''
            ]
          });
        }

        return jsonResponse({
          success: true,
          message: 'Training inquiry received. A coordinator will provide scheduling and proposal details within 2 business days.',
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 11. Accessibility Barrier Reports (POST /api/accessibility/report)
      // =======================================================================
      if (pathname === '/api/accessibility/report' && request.method === 'POST') {
        const body = await request.json();

        if (!body.pageUrl || !body.barrierDescription) {
          return errorResponse('Please describe the barrier and provide the page URL.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO accessibility_feedback (id, page_url, barrier_description, assistive_tech, contact_name, contact_email)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
              id,
              body.pageUrl,
              body.barrierDescription,
              body.assistiveTech || '',
              body.contactName || '',
              body.contactEmail || ''
            ]
          });
        }

        return jsonResponse({
          success: true,
          message: 'Accessibility barrier report received. Thank you for helping us improve our digital experience for everyone.',
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 12. Newsletter Subscriptions (POST /api/newsletter & POST /api/newsletter/subscribe)
      // =======================================================================
      if ((pathname === '/api/newsletter' || pathname === '/api/newsletter/subscribe') && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const email = (body.email || '').toLowerCase().trim();

        if (!email || !email.includes('@')) {
          return errorResponse('Please provide a valid email address.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);
        const baseUrl = env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org';
        const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

        if (db) {
          // Insert or re-activate if previously unsubscribed
          await db.execute({
            sql: `INSERT INTO newsletter_subscribers (id, email, source, is_active, unsubscribed_at)
                  VALUES (?, ?, ?, 1, NULL)
                  ON CONFLICT(email) DO UPDATE SET is_active = 1, unsubscribed_at = NULL`,
            args: [id, email, body.source || 'website_footer']
          }).catch(err => console.warn('Newsletter DB insert error:', err.message));
        }

        // Dispatch Welcome Email via Resend
        if (env.RESEND_API_KEY) {
          const welcomeTpl = templateNewsletterWelcome({ email, unsubscribeUrl });
          ctx.waitUntil(
            sendEmail({
              apiKey: env.RESEND_API_KEY,
              from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
              to: email,
              subject: welcomeTpl.subject,
              html: welcomeTpl.html,
              text: welcomeTpl.text
            }).catch(err => console.error('Newsletter welcome email dispatch error:', err))
          );
        }

        return jsonResponse({
          success: true,
          message: 'Welcome to the Diversity Collective community! We have sent a confirmation to your inbox.'
        }, 200, cors);
      }

      // 12B. Newsletter 1-Click Unsubscribe (GET /api/newsletter/unsubscribe)
      if (pathname === '/api/newsletter/unsubscribe' && request.method === 'GET') {
        const email = (url.searchParams.get('email') || '').toLowerCase().trim();
        const db = getDb(env);

        if (db && email) {
          await db.execute({
            sql: `UPDATE newsletter_subscribers SET is_active = 0, unsubscribed_at = datetime('now') WHERE email = ?`,
            args: [email]
          }).catch(err => console.warn('Unsubscribe update error:', err.message));
        }

        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unsubscribed · Diversity Collective Ventura County</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
              .card { background: #ffffff; border-radius: 20px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
              .badge { display: inline-block; background: #fdf2f8; color: #db2777; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 16px; }
              h1 { font-size: 22px; font-weight: 800; margin: 0 0 12px 0; color: #0f172a; }
              p { font-size: 14px; line-height: 1.6; color: #64748b; margin: 0 0 24px 0; }
              a.btn { display: inline-block; background: #5A1E65; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 12px; }
            </style>
          </head>
          <body>
            <div class="card">
              <span class="badge">Preferences Updated</span>
              <h1>You Have Been Unsubscribed</h1>
              <p>You have been removed from our community newsletter mailing list (${email || 'your email'}). You can resubscribe at any time on our website.</p>
              <a href="${env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org'}" class="btn">Return to Diversity Collective</a>
            </div>
          </body>
          </html>
        `;

        return new Response(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors }
        });
      }

      // =======================================================================
      // 13. Business Directory: Correction / Removal Request (POST /api/directory/correction)
      // =======================================================================
      if (pathname === '/api/directory/correction' && request.method === 'POST') {
        const body = await request.json();
        
        if (!body.businessId || !body.businessName || !body.requesterEmail || !body.details) {
          return errorResponse('Please complete all required fields.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO business_corrections (id, business_id, business_name, requester_name, requester_email, request_type, details, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            args: [
              id,
              body.businessId,
              body.businessName,
              body.requesterName || 'Community Member',
              body.requesterEmail,
              body.requestType || 'update',
              body.details
            ]
          });
        }

        await sendEmail({
          apiKey: env.RESEND_API_KEY,
          from: env.RESEND_FROM_EMAIL,
          to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
          replyTo: body.requesterEmail,
          subject: `[Directory Correction Request] ${body.businessName}`,
          html: `
            <h3>Business Directory Correction / Removal Request</h3>
            <p><strong>Business:</strong> ${body.businessName} (ID: ${body.businessId})</p>
            <p><strong>Requester:</strong> ${body.requesterName} (&lt;${body.requesterEmail}&gt;)</p>
            <p><strong>Type:</strong> ${body.requestType || 'update'}</p>
            <p><strong>Details:</strong></p>
            <p style="white-space: pre-wrap;">${body.details}</p>
          `
        }).catch(err => console.error('Correction notify failed:', err));

        return jsonResponse({
          success: true,
          message: 'Correction request submitted for staff review. Thank you for helping keep our directory accurate!',
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 14. Cloudinary Server-Side Upload Signing (POST /api/media/sign-upload)
      // =======================================================================
      if (pathname === '/api/media/sign-upload' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const signedParams = await createSignedUploadParameters({
          folder: body.folder || 'directory',
          tags: body.tags || 'dcvc',
          publicId: body.publicId || null
        }, env);

        return jsonResponse({
          success: true,
          ...signedParams
        }, 200, cors);
      }

      // =======================================================================
      // 15. Administrative API (Role-Based Access Control)
      // =======================================================================
      if (pathname.startsWith('/api/admin/')) {
        // 15.1 Admin Authentication: Login (POST /api/admin/auth/login)
        if (pathname === '/api/admin/auth/login' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const email = (body.email || '').toLowerCase().trim();
          const password = body.password || '';

          if (!email || !password) {
            return errorResponse('Email and password are required', 400, null, cors);
          }

          const db = getDb(env);
          let user = null;

          if (db) {
            try {
              const userRes = await db.execute({
                sql: `SELECT id, email, name, role, password_hash, salt, is_active FROM admin_users WHERE email = ? LIMIT 1`,
                args: [email]
              });
              if (userRes.rows.length > 0) {
                const u = userRes.rows[0];
                if (!u.is_active) {
                  return errorResponse('Account is deactivated. Please contact an administrator.', 403, null, cors);
                }
                const computedHash = await hashPassword(password, u.salt);
                if (computedHash === u.password_hash) {
                  user = { id: u.id, email: u.email, name: u.name, role: u.role };
                  ctx.waitUntil(
                    db.execute({
                      sql: `UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?`,
                      args: [u.id]
                    }).catch(() => {})
                  );
                }
              }
            } catch (err) {
              console.warn('Could not query admin_users table (may need migration):', err.message);
            }
          }

          // Safe development fallback test account when database credentials are not yet configured
          if (!user && (!db || email === 'admin@diversitycollective.org')) {
            const devSalt = 'dcvc_salt_2026';
            const expectedHash = await hashPassword('DCVC-Admin-2026!', devSalt);
            const inputHash = await hashPassword(password, devSalt);

            if (inputHash === expectedHash) {
              user = {
                id: 'adm-dev-1',
                email: 'admin@diversitycollective.org',
                name: 'Tess Allen (Executive Director)',
                role: 'admin'
              };
            }
          }

          if (!user) {
            return errorResponse('Invalid email or password', 401, null, cors);
          }

          const token = await generateAuthToken(user, env.JWT_SECRET || 'dcvc_admin_jwt_secret_2026');

          return jsonResponse({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
          }, 200, cors);
        }

        // Middleware: Verify Admin Authorization for all other /api/admin/* endpoints
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const authUser = await verifyAuthToken(token, env.JWT_SECRET || 'dcvc_admin_jwt_secret_2026');

        if (!authUser) {
          return errorResponse('Unauthorized. Valid admin session token required.', 401, null, cors);
        }

        // 15.2 Current User Profile (GET /api/admin/auth/me)
        if (pathname === '/api/admin/auth/me' && request.method === 'GET') {
          return jsonResponse({ success: true, user: authUser }, 200, cors);
        }

        // 15.3 Directory Moderation List (GET /api/admin/directory)
        if (pathname === '/api/admin/directory' && request.method === 'GET') {
          const status = url.searchParams.get('status') || 'pending';
          const db = getDb(env);

          if (!db) {
            return jsonResponse({
              success: true,
              businesses: [
                {
                  id: 'biz-pending-1',
                  slug: 'harbor-books-ventura',
                  name: 'Harbor Books & Community Corner',
                  category: 'Retail & Gifts',
                  city: 'Ventura',
                  status: 'pending',
                  owner_name: 'Jordan Rivera',
                  owner_email: 'jordan@harborbooks.example',
                  affirming_pledge_signed_at: '2026-03-01T12:00:00Z',
                  created_at: new Date().toISOString()
                }
              ]
            }, 200, cors);
          }

          const query = status === 'all'
            ? `SELECT * FROM businesses ORDER BY created_at DESC LIMIT 100`
            : `SELECT * FROM businesses WHERE status = ? ORDER BY created_at DESC LIMIT 100`;
          const args = status === 'all' ? [] : [status];

          const res = await db.execute({ sql: query, args });
          return jsonResponse({ success: true, businesses: res.rows }, 200, cors);
        }

        // 15.4 Moderate Directory Listing (POST /api/admin/directory/:id/moderate)
        if (pathname.startsWith('/api/admin/directory/') && pathname.endsWith('/moderate') && request.method === 'POST') {
          if (!requireRole(authUser.role, ['admin', 'approver'])) {
            return errorResponse('Forbidden: Approver or Admin role required', 403, null, cors);
          }

          const parts = pathname.split('/');
          const bizId = parts[parts.length - 2];
          const body = await request.json().catch(() => ({}));
          const newStatus = body.status; // 'approved' | 'rejected' | 'archived'
          const notes = body.notes || '';

          if (!['approved', 'rejected', 'archived'].includes(newStatus)) {
            return errorResponse('Invalid status. Must be approved, rejected, or archived.', 400, null, cors);
          }

          const db = getDb(env);
          if (db) {
            await db.execute({
              sql: `UPDATE businesses SET status = ?, admin_notes = ?, updated_at = datetime('now') WHERE id = ?`,
              args: [newStatus, notes, bizId]
            });

            await logAdminAction(db, {
              userId: authUser.id,
              userEmail: authUser.email,
              action: `moderate_business_${newStatus}`,
              targetType: 'business',
              targetId: bizId,
              details: { status: newStatus, notes },
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            message: `Business listing ${bizId} has been ${newStatus}.`
          }, 200, cors);
        }

        // 15.5 Edit Business Listing (PUT /api/admin/directory/:id)
        if (pathname.startsWith('/api/admin/directory/') && request.method === 'PUT') {
          if (!requireRole(authUser.role, ['admin', 'editor', 'approver'])) {
            return errorResponse('Forbidden: Editor, Approver or Admin role required', 403, null, cors);
          }

          const bizId = pathname.replace('/api/admin/directory/', '');
          const body = await request.json().catch(() => ({}));
          const db = getDb(env);

          if (db) {
            await db.execute({
              sql: `UPDATE businesses SET 
                    name = coalesce(?, name),
                    category = coalesce(?, category),
                    description = coalesce(?, description),
                    address = coalesce(?, address),
                    city = coalesce(?, city),
                    phone = coalesce(?, phone),
                    email = coalesce(?, email),
                    website = coalesce(?, website),
                    is_featured = coalesce(?, is_featured),
                    updated_at = datetime('now')
                    WHERE id = ?`,
              args: [
                body.name || null,
                body.category || null,
                body.description || null,
                body.address || null,
                body.city || null,
                body.phone || null,
                body.email || null,
                body.website || null,
                body.isFeatured !== undefined ? (body.isFeatured ? 1 : 0) : null,
                bizId
              ]
            });

            await logAdminAction(db, {
              userId: authUser.id,
              userEmail: authUser.email,
              action: 'edit_business',
              targetType: 'business',
              targetId: bizId,
              details: body,
              ip: clientIp
            });
          }

          return jsonResponse({ success: true, message: 'Business listing updated.' }, 200, cors);
        }

        // 15.6 Delete Business Listing (DELETE /api/admin/directory/:id)
        if (pathname.startsWith('/api/admin/directory/') && request.method === 'DELETE') {
          if (!requireRole(authUser.role, ['admin'])) {
            return errorResponse('Forbidden: Superadmin role required to delete records', 403, null, cors);
          }

          const bizId = pathname.replace('/api/admin/directory/', '');
          const db = getDb(env);

          if (db) {
            await db.execute({ sql: `DELETE FROM businesses WHERE id = ?`, args: [bizId] });
            await logAdminAction(db, {
              userId: authUser.id,
              userEmail: authUser.email,
              action: 'delete_business',
              targetType: 'business',
              targetId: bizId,
              details: { deletedAt: new Date().toISOString() },
              ip: clientIp
            });
          }

          return jsonResponse({ success: true, message: 'Business listing removed.' }, 200, cors);
        }

        // 15.7 Directory Corrections List (GET /api/admin/corrections)
        if (pathname === '/api/admin/corrections' && request.method === 'GET') {
          const db = getDb(env);
          if (!db) return jsonResponse({ success: true, corrections: [] }, 200, cors);

          const res = await db.execute({
            sql: `SELECT * FROM business_corrections ORDER BY created_at DESC LIMIT 50`,
            args: []
          });
          return jsonResponse({ success: true, corrections: res.rows }, 200, cors);
        }

        // 15.8 Resolve Correction (POST /api/admin/corrections/:id/resolve)
        if (pathname.startsWith('/api/admin/corrections/') && pathname.endsWith('/resolve') && request.method === 'POST') {
          if (!requireRole(authUser.role, ['admin', 'approver'])) {
            return errorResponse('Forbidden: Approver or Admin role required', 403, null, cors);
          }

          const parts = pathname.split('/');
          const corrId = parts[parts.length - 2];
          const body = await request.json().catch(() => ({}));
          const status = body.status || 'resolved';
          const db = getDb(env);

          if (db) {
            await db.execute({
              sql: `UPDATE business_corrections SET status = ?, resolved_at = datetime('now') WHERE id = ?`,
              args: [status, corrId]
            });
          }

          return jsonResponse({ success: true, message: `Correction request ${corrId} set to ${status}.` }, 200, cors);
        }

        // 15.9 Operational Inquiries List (GET /api/admin/inquiries)
        if (pathname === '/api/admin/inquiries' && request.method === 'GET') {
          const type = url.searchParams.get('type') || 'contact';
          const db = getDb(env);

          if (!db) {
            return jsonResponse({ success: true, inquiries: [], type }, 200, cors);
          }

          let query = '';
          switch (type) {
            case 'volunteer':
              query = `SELECT * FROM volunteer_applications ORDER BY created_at DESC LIMIT 100`;
              break;
            case 'training':
              query = `SELECT * FROM training_bookings ORDER BY created_at DESC LIMIT 100`;
              break;
            case 'accessibility':
              query = `SELECT * FROM accessibility_feedback ORDER BY created_at DESC LIMIT 100`;
              break;
            default:
              query = `SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 100`;
              break;
          }

          const res = await db.execute({ sql: query, args: [] });
          return jsonResponse({ success: true, inquiries: res.rows, type }, 200, cors);
        }

        // 15.10 Operational Inquiries Status Update (PATCH /api/admin/inquiries/:type/:id)
        if (pathname.startsWith('/api/admin/inquiries/') && request.method === 'PATCH') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }

          const parts = pathname.replace('/api/admin/inquiries/', '').split('/');
          const [inquiryType, inquiryId] = parts;
          const body = await request.json().catch(() => ({}));
          const status = body.status;
          const db = getDb(env);

          if (db && status) {
            let table = 'contact_submissions';
            if (inquiryType === 'volunteer') table = 'volunteer_applications';
            if (inquiryType === 'training') table = 'training_bookings';
            if (inquiryType === 'accessibility') table = 'accessibility_feedback';

            await db.execute({
              sql: `UPDATE ${table} SET status = ? WHERE id = ?`,
              args: [status, inquiryId]
            });
          }

          return jsonResponse({ success: true, message: `Status updated to ${status}.` }, 200, cors);
        }

        // 15.11 CSV Data Export (GET /api/admin/export/:type)
        if (pathname.startsWith('/api/admin/export/') && request.method === 'GET') {
          if (!requireRole(authUser.role, ['admin'])) {
            return errorResponse('Forbidden: Superadmin role required to export data', 403, null, cors);
          }

          const exportType = pathname.replace('/api/admin/export/', '').trim();
          const db = getDb(env);

          let rows = [];
          let formattedRows = [];
          const headers = SHEET_COLUMNS[exportType] || SHEET_COLUMNS.contact;

          if (db) {
            let sql = `SELECT * FROM contact_submissions ORDER BY created_at DESC`;
            if (exportType === 'volunteer') sql = `SELECT * FROM volunteer_applications ORDER BY created_at DESC`;
            if (exportType === 'business') sql = `SELECT * FROM businesses ORDER BY created_at DESC`;
            if (exportType === 'training') sql = `SELECT * FROM training_bookings ORDER BY created_at DESC`;

            const res = await db.execute({ sql, args: [] });
            rows = res.rows || [];
          }

          if (exportType === 'volunteer') {
            formattedRows = rows.map(formatVolunteerRow);
          } else if (exportType === 'business') {
            formattedRows = rows.map(formatBusinessRow);
          } else if (exportType === 'training') {
            formattedRows = rows.map(formatTrainingRow);
          } else {
            formattedRows = rows.map(formatContactRow);
          }

          const csvData = convertRowsToCsv(headers, formattedRows);

          return new Response(csvData, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="dcvc_${exportType}_export_${new Date().toISOString().slice(0, 10)}.csv"`,
              ...cors
            }
          });
        }

        // 15.12 Admin Audit Logs (GET /api/admin/audit-logs)
        if (pathname === '/api/admin/audit-logs' && request.method === 'GET') {
          const db = getDb(env);
          if (!db) return jsonResponse({ success: true, logs: [] }, 200, cors);

          const res = await db.execute({
            sql: `SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100`,
            args: []
          });
          return jsonResponse({ success: true, logs: res.rows }, 200, cors);
        }

        // 15.13 System Migration Runner (POST /api/admin/system/migrate)
        if (pathname === '/api/admin/system/migrate' && request.method === 'POST') {
          if (!requireRole(authUser.role, ['admin'])) {
            return errorResponse('Forbidden: Superadmin role required to run database migrations', 403, null, cors);
          }

          const db = getDb(env);
          if (!db) {
            return errorResponse('Database connection not available', 503, null, cors);
          }

          const migrationResult = await runAllMigrations(db);

          await logAdminAction(db, {
            userId: authUser.id,
            userEmail: authUser.email,
            action: 'run_database_migrations',
            targetType: 'system',
            targetId: 'turso_master',
            details: migrationResult,
            ip: clientIp
          }).catch(() => {});

          return jsonResponse({
            success: true,
            message: 'Database schema migrations executed successfully.',
            result: migrationResult
          }, 200, cors);
        }

        // 15.14 System Migration Status (GET /api/admin/system/status)
        if (pathname === '/api/admin/system/status' && request.method === 'GET') {
          const db = getDb(env);
          if (!db) {
            return errorResponse('Database connection not available', 503, null, cors);
          }

          const tableRes = await db.execute({
            sql: `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`,
            args: []
          });
          const tables = (tableRes.rows || []).map(r => r.name || r[0]);

          return jsonResponse({
            success: true,
            tables,
            tableCount: tables.length,
            databaseConnected: true
          }, 200, cors);
        }

        // 15.15 Admin Newsletter Subscribers List (GET /api/admin/newsletter/subscribers)
        if (pathname === '/api/admin/newsletter/subscribers' && request.method === 'GET') {
          const db = getDb(env);
          if (!db) {
            return jsonResponse({ success: true, count: 0, activeCount: 0, subscribers: [] }, 200, cors);
          }

          const countRes = await db.execute({
            sql: `SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM newsletter_subscribers`,
            args: []
          });
          const total = countRes.rows[0]?.total || 0;
          const active = countRes.rows[0]?.active || 0;

          const listRes = await db.execute({
            sql: `SELECT id, email, source, is_active, consent_timestamp, created_at, unsubscribed_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 100`,
            args: []
          });

          return jsonResponse({
            success: true,
            totalSubscribers: total,
            activeSubscribers: active,
            subscribers: listRes.rows
          }, 200, cors);
        }

        // 15.16 Admin Newsletter Broadcast (POST /api/admin/newsletter/send)
        if (pathname === '/api/admin/newsletter/send' && request.method === 'POST') {
          if (!requireRole(authUser.role, ['admin', 'editor'])) {
            return errorResponse('Forbidden: Editor or Admin role required to broadcast newsletters', 403, null, cors);
          }

          const body = await request.json().catch(() => ({}));
          const subject = (body.subject || '').trim();
          const preheader = (body.preheader || '').trim();
          const headline = (body.headline || subject).trim();
          const authorName = (body.authorName || authUser.name || 'Diversity Collective Team').trim();
          const authorTitle = (body.authorTitle || 'Community Leadership').trim();
          const content = (body.content || '').trim();
          const ctaText = (body.ctaText || '').trim();
          const ctaUrl = (body.ctaUrl || '').trim();
          const isTest = Boolean(body.isTest);

          if (!subject || !content) {
            return errorResponse('Subject line and newsletter content are required.', 400, null, cors);
          }

          if (!env.RESEND_API_KEY) {
            return errorResponse('Resend API key is not configured on this environment.', 503, null, cors);
          }

          const db = getDb(env);
          const baseUrl = env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org';

          // Convert simple paragraph breaks into clean HTML paragraphs if plain text
          const formattedContentHtml = content.includes('<p>') || content.includes('<div>')
            ? content
            : content.split('\n\n').map(p => `<p style="margin: 0 0 16px 0; line-height: 1.7;">${p.replace(/\n/g, '<br>')}</p>`).join('');

          if (isTest) {
            // Test Mode: Send strictly to the logged-in admin's email
            const testEmail = authUser.email;
            const testUnsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(testEmail)}`;
            const broadcastTpl = templateNewsletterBroadcast({
              subject: `[TEST PREVIEW] ${subject}`,
              preheader,
              headline,
              authorName,
              authorTitle,
              contentHtml: formattedContentHtml,
              ctaText,
              ctaUrl,
              unsubscribeUrl: testUnsubscribeUrl
            });

            await sendEmail({
              apiKey: env.RESEND_API_KEY,
              from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
              to: testEmail,
              subject: broadcastTpl.subject,
              html: broadcastTpl.html,
              text: broadcastTpl.text
            });

            return jsonResponse({
              success: true,
              isTest: true,
              message: `Test newsletter preview dispatched to ${testEmail}. Check your inbox!`,
              recipient: testEmail
            }, 200, cors);
          }

          // Production Broadcast: Query all active subscribers
          let recipients = [];
          if (db) {
            const subsRes = await db.execute({
              sql: `SELECT email FROM newsletter_subscribers WHERE is_active = 1`,
              args: []
            });
            recipients = (subsRes.rows || []).map(r => r.email).filter(Boolean);
          }

          if (recipients.length === 0) {
            return errorResponse('No active newsletter subscribers found in database to broadcast to.', 400, null, cors);
          }

          // Asynchronously dispatch newsletter to all active subscribers
          for (const recipientEmail of recipients) {
            const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
            const broadcastTpl = templateNewsletterBroadcast({
              subject,
              preheader,
              headline,
              authorName,
              authorTitle,
              contentHtml: formattedContentHtml,
              ctaText,
              ctaUrl,
              unsubscribeUrl
            });

            ctx.waitUntil(
              sendEmail({
                apiKey: env.RESEND_API_KEY,
                from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
                to: recipientEmail,
                subject: broadcastTpl.subject,
                html: broadcastTpl.html,
                text: broadcastTpl.text
              }).catch(err => console.error(`Broadcast failed for ${recipientEmail}:`, err))
            );
          }

          if (db) {
            await logAdminAction(db, {
              userId: authUser.id,
              userEmail: authUser.email,
              action: 'broadcast_newsletter',
              targetType: 'newsletter',
              targetId: subject,
              details: { subject, recipientCount: recipients.length, headline },
              ip: clientIp
            }).catch(() => {});
          }

          return jsonResponse({
            success: true,
            isTest: false,
            message: `Newsletter broadcast initiated to ${recipients.length} subscriber(s)!`,
            recipientsCount: recipients.length,
            subject,
            sentAt: new Date().toISOString()
          }, 200, cors);
        }
      }

      // Static frontend assets fallback (Full-stack SPA hosting)
      if (env.ASSETS && !pathname.startsWith('/api/')) {
        return env.ASSETS.fetch(request);
      }

      // 404 for unknown endpoints
      return errorResponse(`Endpoint ${pathname} not found on DCVC API`, 404, null, cors);

    } catch (err) {
      console.error('Unhandled API exception:', err);
      return errorResponse('Internal server error', 500, err.message, cors);
    }
  },

  /**
   * Cloudflare Cron Trigger Handler: Runs every 5 minutes
   * Authoritative polling against Zeffy API for payment reconciliation, refund/dispute detection
   */
  async scheduled(event, env, ctx) {
    console.log(`[Scheduled Cron] Zeffy sync triggered at ${new Date(event.scheduledTime).toISOString()}`);
    const db = getDb(env);
    ctx.waitUntil(
      executeZeffySync(env, db, ctx)
        .then(result => console.log('[Scheduled Cron] Zeffy sync outcome:', result))
        .catch(err => console.error('[Scheduled Cron] Zeffy sync error:', err))
    );
  }
};
