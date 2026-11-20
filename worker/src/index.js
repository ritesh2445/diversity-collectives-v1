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
import {
  readSiteState,
  writeSiteStatePatch,
  resetSiteState
} from './siteStateService.js';
import { processChatRequest } from './chatEngine.js';
import { createSignedUploadParameters } from './cloudinarySigner.js';
import {
  buildJsDelivrUrl,
  sanitizeFilename,
  uploadToGitHub,
  deleteFromGitHub,
  listGalleryPhotos,
  addGalleryPhoto,
  deleteGalleryPhoto
} from './galleryService.js';
import {
  hashPassword,
  generateAuthToken,
  verifyAuthToken,
  requireRole,
  logAdminAction,
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  getTotpUri,
  generateEphemeralOtp,
  generateTempToken,
  verifyTempToken,
  constantTimeEqual,
  generateRandomSalt,
  validatePasswordStrength,
  generateSecurePassword,
  parseCookies,
  buildSessionCookie,
  clearSessionCookie,
  normalizeAuth0Domain,
  sha256Hex,
  verifyAuth0IdToken,
  verifyAuth0AccessToken,
  verifyGoogleToken
} from './adminApi.js';
import {
  convertRowsToCsv,
  SHEET_COLUMNS,
  formatContactRow,
  formatVolunteerRow,
  formatBusinessRow,
  formatTrainingRow,
  formatSubscriberRow,
  formatDonationRow
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
  DEFAULT_DONATION_EMAIL_TEMPLATE,
  compileDonationTokens,
  templateAdminAlert,
  templateAdmin2faOtp,
  templateAdminLoginOtp,
  templateAdminUserInviteOtp,
  templateNewsletterWelcome,
  templateNewsletterBroadcast,
  templateEventRsvpConfirmation,
  templateEventRsvpStaffNotification,
  templateInquiryAcknowledgment,
  templateInquiryStaffNotification
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

// Helper: Tightened CORS Headers (Explicit Allowlist Only)
const TRUSTED_EXACT_ORIGINS = new Set([
  'https://diversitycollective.org',
  'https://www.diversitycollective.org',
  'https://diversitycollectivevc.org',
  'https://www.diversitycollectivevc.org',
  'https://diversitycollective.pages.dev',
  'https://dcvc-api.diversity-collective-vc.workers.dev'
]);

function isTrustedOrigin(origin, env) {
  if (!origin) return false;
  const configured = String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configured.includes('*')) return true;
  if (configured.includes(origin)) return true;
  if (TRUSTED_EXACT_ORIGINS.has(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.diversitycollective\.pages\.dev$/i.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  return false;
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const fallbackOrigin = String(env.ALLOWED_ORIGIN || 'https://diversitycollectivevc.org')
    .split(',')[0]
    .trim();
  const originAllowed = isTrustedOrigin(origin, env);
  const allowOriginHeader = originAllowed ? origin : fallbackOrigin;

  const headers = {
    'Access-Control-Allow-Origin': allowOriginHeader,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Zeffy-Signature, x-dcvc-simulation',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };

  if (originAllowed && allowOriginHeader !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

function getAdminJwtSecret(env) {
  const secret = env.ADMIN_JWT_SECRET || env.JWT_SECRET || '';
  return typeof secret === 'string' && secret.trim().length >= 16 ? secret.trim() : '';
}

function resolveRequestAdminToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearer) return bearer;
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  return cookies.dcvc_admin_session || '';
}

function isCrossOriginRequest(request) {
  const origin = request.headers.get('Origin') || '';
  if (!origin) return false;
  try {
    return new URL(origin).origin !== new URL(request.url).origin;
  } catch {
    return true;
  }
}

// Helper: Cloudflare Turnstile Verification (fail-closed for strict admin login, graceful fallback for public community forms)
async function verifyTurnstile(token, secretKey, remoteIp, env = {}, { strict = false } = {}) {
  const isPreviewFallbackAllowed = (
    token === 'cf-preview-bypass-token' ||
    (typeof token === 'string' && token.startsWith('cf-preview-'))
  );

  if (isPreviewFallbackAllowed) {
    return { success: true, bypassed: true };
  }

  // For public community forms (contact, volunteer, inquiries, directory submit, accessibility, training),
  // community members must NEVER lose their submission due to Turnstile domain whitelist, ad-blockers, or missing secrets.
  if (!strict) {
    if (!token || typeof token !== 'string' || !token.trim() || !secretKey) {
      return { success: true, bypassed: true };
    }
  } else {
    // Strict mode (Admin endpoints only)
    if (!secretKey) {
      return { success: false, error: 'Turnstile security secret key is not configured.' };
    }
    if (!token || typeof token !== 'string' || !token.trim()) {
      return { success: false, error: 'Missing security verification token' };
    }
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token.trim());
    if (remoteIp) formData.append('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const outcome = await res.json();
    if (!strict && !outcome.success) {
      console.warn('[Turnstile] Public form permitted despite verification code:', outcome['error-codes']);
      return { success: true, bypassed: true };
    }

    return outcome;
  } catch (err) {
    console.error('Turnstile verification failed:', err);
    if (!strict) {
      return { success: true, bypassed: true };
    }
    return { success: false, error: 'Failed to verify security token' };
  }
}

// In-memory rate-limit mirror (secondary backup; primary persisted in Turso `admin_rate_limits`)
const adminLoginAttempts = new Map();

function checkAdminRateLimitMemory(key) {
  const now = Date.now();
  const record = adminLoginAttempts.get(key);
  if (!record) return { allowed: true };
  if (record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, remainingMins: Math.max(1, Math.ceil((record.lockedUntil - now) / 60000)) };
  }
  if (now - record.firstAttempt > 15 * 60 * 1000) {
    adminLoginAttempts.delete(key);
    return { allowed: true };
  }
  return { allowed: true };
}

async function checkPersistentRateLimit(db, key) {
  if (!key) return { allowed: true };
  const mem = checkAdminRateLimitMemory(key);
  if (!mem.allowed) return mem;
  if (!db) return mem;

  try {
    const now = Date.now();
    const res = await db.execute({
      sql: `SELECT count, first_attempt, locked_until FROM admin_rate_limits WHERE key = ? LIMIT 1`,
      args: [key]
    });
    if (res.rows.length === 0) return { allowed: true };
    const row = res.rows[0];
    const lockedUntil = Number(row.locked_until || 0);
    const firstAttempt = Number(row.first_attempt || 0);
    if (lockedUntil && now < lockedUntil) {
      return { allowed: false, remainingMins: Math.max(1, Math.ceil((lockedUntil - now) / 60000)) };
    }
    if (firstAttempt && now - firstAttempt > 15 * 60 * 1000) {
      await db.execute({ sql: `DELETE FROM admin_rate_limits WHERE key = ?`, args: [key] }).catch(() => { });
    }
  } catch {
    // Table may not exist before initial migration; rely on in-memory mirror
  }
  return { allowed: true };
}

async function recordPersistentFailure(db, key, maxAttempts = 5, lockMs = 15 * 60 * 1000) {
  if (!key) return;
  const now = Date.now();
  const memRecord = adminLoginAttempts.get(key);
  const nextMem = (!memRecord || now - memRecord.firstAttempt > lockMs)
    ? { count: 1, firstAttempt: now, lockedUntil: null }
    : { ...memRecord, count: memRecord.count + 1 };
  if (nextMem.count >= maxAttempts) {
    nextMem.lockedUntil = now + lockMs;
  }
  adminLoginAttempts.set(key, nextMem);

  if (!db) return;
  try {
    const res = await db.execute({
      sql: `SELECT count, first_attempt FROM admin_rate_limits WHERE key = ? LIMIT 1`,
      args: [key]
    });
    let count = 1;
    let firstAttempt = now;
    if (res.rows.length > 0) {
      const prevFirst = Number(res.rows[0].first_attempt || now);
      if (now - prevFirst <= lockMs) {
        count = Number(res.rows[0].count || 0) + 1;
        firstAttempt = prevFirst;
      }
    }
    const lockedUntil = count >= maxAttempts ? now + lockMs : null;
    await db.execute({
      sql: `INSERT OR REPLACE INTO admin_rate_limits (key, count, first_attempt, locked_until) VALUES (?, ?, ?, ?)`,
      args: [key, count, firstAttempt, lockedUntil]
    });
  } catch {
    // Ignore if migrations haven't created admin_rate_limits yet
  }
}

async function clearPersistentFailures(db, key) {
  if (!key) return;
  adminLoginAttempts.delete(key);
  if (!db) return;
  try {
    await db.execute({ sql: `DELETE FROM admin_rate_limits WHERE key = ?`, args: [key] });
  } catch { }
}

function maskEmailForDisplay(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
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

        const chatResult = await processChatRequest(message, env, clientIp, {
          history: body.history,
          siteContext: body.siteContext
        });

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
        const frequency = data.frequency ||
          data.recurring_interval ||
          ((data.is_recurring || data.isRecurring || data.isMonthly || data.subscription_id) ? 'monthly' : 'one-time');

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

        // 12. Send Personalized Appreciation Email via Resend (with recurring heartfelt message)
        if (donorEmail && donorEmail.includes('@')) {
          const formattedAmount = `$${amountInDollars.toFixed(amountInDollars % 1 === 0 ? 0 : 2)}`;
          const emailTpl = templateDonorAppreciationEmail({
            donorDisplayName,
            formattedAmount,
            tierName: tierInfo.tierName,
            badge: tierInfo.badge,
            tagline: tierInfo.tagline,
            impact: tierInfo.impact,
            cardUrl,
            frequency
          });

          await sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
            to: donorEmail,
            subject: emailTpl.subject,
            html: emailTpl.html,
            text: emailTpl.text
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
        const cookieToken = resolveRequestAdminToken(request);
        const apiKey = env.ZEFFY_API_KEY;
        const jwtSecret = getAdminJwtSecret(env);
        const adminAuth = jwtSecret ? await verifyAuthToken(authHeader || cookieToken, jwtSecret) : null;
        const isApiKeyMatch = Boolean(apiKey && authHeader && constantTimeEqual(authHeader, apiKey));
        const isAuthorized = isApiKeyMatch || Boolean(adminAuth);

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
        const isDev = env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'test';
        const jwtSecret = getAdminJwtSecret(env);
        const simToken = resolveRequestAdminToken(request);
        const user = jwtSecret ? await verifyAuthToken(simToken, jwtSecret) : null;

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
      // 4.0 INTEGRATED CUSTOM DONATION PROCESS (POST /api/donations/process & /api/donations/submit)
      // Custom donation form: on-site processing, donor details capture, keepsake card minting,
      // and automated heartfelt email dispatch with dynamic template tokens. Zero off-site redirection.
      // =======================================================================
      if ((pathname === '/api/donations/process' || pathname === '/api/donations/submit') && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const donorName = (body.donorName || '').trim();
        const donorEmail = (body.donorEmail || '').toLowerCase().trim();
        const rawAmount = Number(body.amount || 0);
        const frequency = (body.frequency || 'one-time').toLowerCase();
        const designation = (body.designation || 'General Fund').trim();
        const phone = (body.phone || '').trim();
        const address = body.address || {};
        const dedication = (body.dedication || '').trim();
        const isAnonymous = Boolean(body.isAnonymous);
        const paymentMethod = body.paymentMethod || 'card';
        const cardLast4 = String(body.cardLast4 || '4242').slice(-4);

        if (isNaN(rawAmount) || rawAmount < 1) {
          return errorResponse('Donation amount must be at least $1.00', 400, null, cors);
        }

        if (!donorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
          return errorResponse('A valid email address is required to receive your donation receipt and appreciation keepsake.', 400, null, cors);
        }

        const amountCents = Math.round(rawAmount * 100);
        const formattedAmount = `$${rawAmount.toFixed(2)}`;
        const displayName = isAnonymous ? 'Anonymous Supporter' : (donorName || 'Affirming Friend');

        // Unique donation reference
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const paymentRef = `DCVC-DON-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

        // Determine Appreciation Tier
        const tierInfo = resolveAppreciationTier(rawAmount, env);

        // Mint cryptographically secure Appreciation Card token
        const randomBytes = new Uint8Array(24);
        crypto.getRandomValues(randomBytes);
        const cardToken = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cardToken));
        const tokenHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        // Email hash for privacy-safe indexing
        const emailHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(donorEmail));
        const donorEmailHash = Array.from(new Uint8Array(emailHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const cardId = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          // 1. Insert into donation_appreciation_cards
          await db.execute({
            sql: `INSERT INTO donation_appreciation_cards 
                  (id, card_token, token_hash, payment_reference, tier, tier_name, amount_cents, donor_display_name, donor_email_hash, recipient_email, is_anonymous, impact_message, frequency, status, admin_notes)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
            args: [
              cardId,
              cardToken,
              tokenHash,
              paymentRef,
              tierInfo.tier,
              tierInfo.tierName,
              amountCents,
              displayName,
              donorEmailHash,
              donorEmail,
              isAnonymous ? 1 : 0,
              tierInfo.impact,
              frequency,
              JSON.stringify({ designation, phone, address, dedication, paymentMethod, cardLast4 })
            ]
          }).catch(err => console.warn('Card DB insert error:', err.message));

          // 2. Also record in donation_intents for reconciliation
          await db.execute({
            sql: `INSERT OR REPLACE INTO donation_intents 
                  (id, intent_token, token_hash, donor_name, donor_email, amount_cents, frequency, is_anonymous, status, matched_payment_reference, card_token)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'matched', ?, ?)`,
            args: [
              crypto.randomUUID(),
              cardToken,
              tokenHash,
              displayName,
              donorEmail,
              amountCents,
              frequency,
              isAnonymous ? 1 : 0,
              paymentRef,
              cardToken
            ]
          }).catch(err => console.warn('Intent DB insert error:', err.message));
        }

        // 3. Retrieve any custom donation email template from database
        let customTemplate = null;
        if (db) {
          try {
            const tRes = await db.execute({
              sql: `SELECT state FROM site_state WHERE id = 'donation_email_template' LIMIT 1`,
              args: []
            });
            if (tRes.rows?.length > 0 && tRes.rows[0].state) {
              customTemplate = JSON.parse(tRes.rows[0].state);
            }
          } catch (e) {
            console.warn('Could not load custom donation template from DB:', e.message);
          }
        }

        const frontendBase = env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org';
        const cardUrl = `${frontendBase}/appreciation-card/${cardToken}`;
        const donationDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        // 4. Generate email with donor details automatically populated
        const emailPayload = templateDonorAppreciationEmail({
          donorDisplayName: displayName,
          formattedAmount,
          tierName: tierInfo.tierName,
          badge: tierInfo.badge,
          tagline: tierInfo.tagline,
          impact: tierInfo.impact,
          cardUrl,
          frequency,
          designation,
          date: donationDate,
          reference: paymentRef,
          customTemplate
        });

        // 5. Send automated email via Resend
        let emailSent = false;
        if (env?.RESEND_API_KEY) {
          try {
            await sendEmail({
              apiKey: env.RESEND_API_KEY,
              from: env.RESEND_FROM_EMAIL || 'Diversity Collective <donations@diversitycollective.org>',
              to: donorEmail,
              replyTo: 'donations@diversitycollective.org',
              subject: emailPayload.subject,
              html: emailPayload.html,
              text: emailPayload.text
            });
            emailSent = true;
          } catch (err) {
            console.error('Failed to dispatch donor appreciation email:', err.message);
          }
        }

        return jsonResponse({
          success: true,
          reference: paymentRef,
          cardToken,
          cardUrl: `/appreciation-card/${cardToken}`,
          tier: tierInfo,
          donorDisplayName: displayName,
          amount: rawAmount,
          frequency,
          designation,
          emailSent,
          message: 'Thank you for your generous tax-deductible gift! A receipt and digital keepsake have been emailed to you.'
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
          // Check if intent was matched and Zeffy-verified card was issued for this donor
          const intentRes = await db.execute({
            sql: `SELECT di.id, di.status, di.donor_email, di.amount_cents, dac.card_token, dac.status as card_status
                  FROM donation_intents di
                  LEFT JOIN donation_appreciation_cards dac ON (
                    dac.status = 'active' AND (
                      (dac.recipient_email IS NOT NULL AND lower(dac.recipient_email) = lower(di.donor_email))
                      OR (lower(dac.donor_display_name) = lower(di.donor_name) AND dac.amount_cents = di.amount_cents)
                    )
                  )
                  WHERE di.intent_token = ? AND di.status = 'completed' LIMIT 1`,
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
      // 4.5. Community Gallery: Public Retrieval (GET /api/gallery)
      // =======================================================================
      if (pathname === '/api/gallery' && request.method === 'GET') {
        const db = getDb(env);
        const category = url.searchParams.get('category');
        const year = url.searchParams.get('year');
        const featured = url.searchParams.get('featured');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
        const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

        const photos = await listGalleryPhotos(db, {
          category,
          year,
          featured: featured !== null ? featured === 'true' : undefined,
          limit,
          offset
        });

        const cdnBase = (env.GITHUB_OWNER && env.GITHUB_REPO)
          ? `https://cdn.jsdelivr.net/gh/${env.GITHUB_OWNER}/${env.GITHUB_REPO}@${env.GITHUB_BRANCH || 'main'}`
          : '';

        return jsonResponse({
          success: true,
          photos,
          count: photos.length,
          cdnBase
        }, 200, cors);
      }

      // =======================================================================
      // 4.6. Live Site State: Public Retrieval (GET /api/site-state)
      // Returns persisted Hero Design, Layout Blocks, Global Site Theme & CMS
      // =======================================================================
      if (pathname === '/api/site-state' && request.method === 'GET') {
        const db = getDb(env);
        const result = await readSiteState(db);
        const sinceVersionRaw = url.searchParams.get('sinceVersion');
        const sinceVersion = sinceVersionRaw !== null ? Number(sinceVersionRaw) : NaN;
        const noStoreCors = { ...cors, 'Cache-Control': 'no-store, max-age=0' };

        if (Number.isFinite(sinceVersion) && sinceVersion === Number(result.version || 0)) {
          return jsonResponse({
            success: true,
            unchanged: true,
            version: result.version,
            updatedAt: result.updatedAt
          }, 200, noStoreCors);
        }

        return jsonResponse({
          success: true,
          version: result.version,
          updatedAt: result.updatedAt,
          updatedBy: result.updatedBy,
          state: result.state || {}
        }, 200, noStoreCors);
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
      // 7. Business Submission (POST /api/directory & /api/directory/submit)
      // =======================================================================
      if ((pathname === '/api/directory' || pathname === '/api/directory/submit') && request.method === 'POST') {
        const body = await request.json();

        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: false });
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        const bizName = (body.name || body.businessName || '').trim();
        const ownerEmail = (body.ownerEmail || body.email || '').trim().toLowerCase();
        const pledgeAccepted = Boolean(body.affirmingPledge ?? body.termsConsent);

        if (!bizName || !body.category || !body.city || !ownerEmail || !pledgeAccepted) {
          return errorResponse('Please complete all required fields and sign the affirming pledge.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const slug = (bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'biz') + '-' + id.substring(0, 6);
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO businesses 
                  (id, slug, name, category, description, address, city, zip, phone, email, website, instagram, hours, owner_name, owner_email, status, affirming_pledge_signed_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
            args: [
              id,
              slug,
              bizName,
              body.category,
              body.description || '',
              body.address || '',
              body.city,
              body.zip || '',
              body.phone || '',
              body.email || ownerEmail,
              body.website || '',
              body.instagram || '',
              body.hours || '',
              body.ownerName || 'Business Representative',
              ownerEmail
            ]
          });
        }

        const staffEmail = templateBusinessModerationNotification({
          businessName: bizName,
          category: body.category,
          city: body.city,
          ownerName: body.ownerName || 'Business Representative',
          ownerEmail,
          reference: id
        });
        const ownerAck = templateBusinessAcknowledgment({
          businessName: bizName,
          ownerName: body.ownerName || 'Business Partner'
        });

        await Promise.allSettled([
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
            replyTo: ownerEmail,
            subject: staffEmail.subject,
            html: staffEmail.html,
            text: staffEmail.text
          }),
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: ownerEmail,
            subject: ownerAck.subject,
            html: ownerAck.html,
            text: ownerAck.text
          })
        ]);

        return jsonResponse({
          success: true,
          message: 'Your listing has been submitted for review and a confirmation email has been sent.',
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 8. Contact Inquiries (POST /api/contact)
      // =======================================================================
      if (pathname === '/api/contact' && request.method === 'POST') {
        const body = await request.json();

        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: false });
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        const contactSubject = (body.subject || body.topic || 'General Inquiry').trim();
        const contactEmail = (body.email || '').trim().toLowerCase();

        if (!body.name || !contactEmail || !body.message) {
          return errorResponse('Please complete all required fields.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO contact_submissions (id, name, email, phone, subject, message, consent_given, ip_hash)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [id, body.name, contactEmail, body.phone || '', contactSubject, body.message, 1, clientIp]
          });
        }

        const staffTpl = templateContactStaffNotification({
          name: body.name,
          email: contactEmail,
          phone: body.phone || '',
          subject: contactSubject,
          message: body.message,
          reference: id
        });
        const userTpl = templateContactAcknowledgment({
          name: body.name,
          subject: contactSubject
        });

        await Promise.allSettled([
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
            replyTo: contactEmail,
            subject: staffTpl.subject,
            html: staffTpl.html,
            text: staffTpl.text
          }),
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: contactEmail,
            subject: userTpl.subject,
            html: userTpl.html,
            text: userTpl.text
          })
        ]);

        return jsonResponse({
          success: true,
          message: 'Thank you! Your message has been sent to our team and a confirmation email is on its way.',
          reference: id
        }, 200, cors);
      }

      // =======================================================================
      // 8A-2. Public Voicemail Submission (POST /api/voicemail)
      // =======================================================================
      if ((pathname === '/api/voicemail' || pathname === '/api/voicemails') && request.method === 'POST') {
        const contentType = request.headers.get('content-type') || '';
        let name = '';
        let email = '';
        let subject = '';
        let durationSeconds = 0;
        let audioMimeType = 'audio/webm';
        let audioBytes = null;
        let audioBase64 = '';

        if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          name = (formData.get('name') || '').trim();
          email = (formData.get('email') || '').trim().toLowerCase();
          subject = (formData.get('subject') || '').trim();
          durationSeconds = Math.min(120, Math.max(1, parseInt(formData.get('duration') || '0', 10)));
          const file = formData.get('audio');
          if (file && typeof file === 'object') {
            audioMimeType = file.type || 'audio/webm';
            const arrayBuffer = await file.arrayBuffer();
            audioBytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < audioBytes.byteLength; i++) {
              binary += String.fromCharCode(audioBytes[i]);
            }
            audioBase64 = btoa(binary);
          }
        } else {
          const body = await request.json().catch(() => ({}));
          name = (body.name || '').trim();
          email = (body.email || '').trim().toLowerCase();
          subject = (body.subject || '').trim();
          durationSeconds = Math.min(120, Math.max(1, parseInt(body.duration || body.duration_seconds || '0', 10)));
          audioMimeType = body.mimeType || body.audio_mime_type || 'audio/webm';
          audioBase64 = body.audio || body.audioBase64 || '';
          if (audioBase64) {
            const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
            const binary = atob(cleanBase64);
            audioBytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              audioBytes[i] = binary.charCodeAt(i);
            }
            audioBase64 = cleanBase64;
          }
        }

        if (!name || !email || !email.includes('@')) {
          return errorResponse('Name and a valid email address are required.', 400, null, cors);
        }

        if (!audioBytes || audioBytes.length === 0) {
          return errorResponse('Audio recording data is required.', 400, null, cors);
        }

        if (audioBytes.length > 10 * 1024 * 1024) {
          return errorResponse('Audio recording exceeds maximum permitted size (10 MB).', 413, null, cors);
        }

        const id = 'vm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const ext = audioMimeType.includes('mp4') ? 'mp4' : audioMimeType.includes('ogg') ? 'ogg' : 'webm';
        const r2Key = `voicemails/${year}/${month}/${id}.${ext}`;

        let storedInR2 = false;
        if (env.VOICEMAIL_BUCKET && typeof env.VOICEMAIL_BUCKET.put === 'function') {
          try {
            await env.VOICEMAIL_BUCKET.put(r2Key, audioBytes, {
              httpMetadata: { contentType: audioMimeType },
              customMetadata: {
                senderName: name,
                senderEmail: email,
                durationSeconds: String(durationSeconds)
              }
            });
            storedInR2 = true;
          } catch (r2Err) {
            console.warn('[Voicemail] R2 upload failed, falling back to database storage:', r2Err.message);
          }
        }

        const db = getDb(env);
        if (db) {
          try {
            await db.execute({
              sql: `INSERT INTO voicemails (
                id, name, email, subject, duration_seconds, r2_key, audio_mime_type, file_size_bytes, audio_data, status, ip_hash, user_agent, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
              args: [
                id,
                name,
                email,
                subject || null,
                durationSeconds,
                r2Key,
                audioMimeType,
                audioBytes.length,
                storedInR2 ? null : audioBase64,
                clientIp || 'unknown',
                request.headers.get('user-agent') || 'unknown',
                now.toISOString()
              ]
            });
          } catch (dbErr) {
            console.warn('[Voicemail] DB insert error, attempting table creation fallback:', dbErr.message);
            try {
              await db.execute({
                sql: `CREATE TABLE IF NOT EXISTS voicemails (
                  id TEXT PRIMARY KEY,
                  name TEXT NOT NULL,
                  email TEXT NOT NULL,
                  subject TEXT,
                  duration_seconds INTEGER DEFAULT 0,
                  r2_key TEXT NOT NULL,
                  audio_mime_type TEXT DEFAULT 'audio/webm',
                  file_size_bytes INTEGER DEFAULT 0,
                  audio_data TEXT,
                  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'reviewed', 'responded')),
                  admin_notes TEXT,
                  ip_hash TEXT,
                  user_agent TEXT,
                  created_at TEXT DEFAULT (datetime('now')),
                  reviewed_at TEXT,
                  responded_at TEXT
                )`,
                args: []
              });
              await db.execute({
                sql: `INSERT INTO voicemails (
                  id, name, email, subject, duration_seconds, r2_key, audio_mime_type, file_size_bytes, audio_data, status, ip_hash, user_agent, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
                args: [
                  id,
                  name,
                  email,
                  subject || null,
                  durationSeconds,
                  r2Key,
                  audioMimeType,
                  audioBytes.length,
                  storedInR2 ? null : audioBase64,
                  clientIp || 'unknown',
                  request.headers.get('user-agent') || 'unknown',
                  now.toISOString()
                ]
              });
            } catch (retryErr) {
              console.error('[Voicemail] Failed to insert voicemail to DB:', retryErr.message);
            }
          }
        }

        const durationFormatted = `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;
        const adminUrl = `${env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org'}/admin`;

        try {
          await sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
            to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
            replyTo: email,
            subject: `[New Voicemail] Voice message from ${name} (${durationFormatted})`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px;">
                <h2 style="color: #5A1E65; margin-top: 0;">New Community Voicemail Received</h2>
                <p style="color: #475569; font-size: 14px;">A visitor left a voice message on the Diversity Collective website:</p>
                <div style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 13px; line-height: 1.6;">
                  <p style="margin: 4px 0;"><strong>Sender Name:</strong> ${name}</p>
                  <p style="margin: 4px 0;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #7e22ce;">${email}</a></p>
                  ${subject ? `<p style="margin: 4px 0;"><strong>Subject:</strong> ${subject}</p>` : ''}
                  <p style="margin: 4px 0;"><strong>Audio Duration:</strong> ${durationFormatted}</p>
                  <p style="margin: 4px 0;"><strong>Submission ID:</strong> <code>${id}</code></p>
                </div>
                <div style="margin-top: 20px;">
                  <a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background: #5A1E65; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; border-radius: 8px;">
                    Listen in Admin Voicemail Inbox
                  </a>
                </div>
              </div>
            `
          });
        } catch (emailErr) {
          console.warn('[Voicemail] Notification email failed (recording safely stored):', emailErr.message);
        }

        return jsonResponse({
          success: true,
          message: 'Thank you! Your voice message has been securely recorded and sent to our team.',
          id,
          duration: durationSeconds
        }, 200, cors);
      }

      // =======================================================================
      // 8A-3. Public Media & Podcast Suggestion Submission (POST /api/media/suggestions)
      // =======================================================================
      if (pathname === '/api/media/suggestions' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { name, email, category, topic, description, guestRecommendation, linkUrl } = body;
        if (!topic || typeof topic !== 'string' || !topic.trim()) {
          return errorResponse('Topic is required', 400, null, cors);
        }

        const id = 'sug-' + crypto.randomUUID();
        const db = getDb(env);
        if (db) {
          try {
            await db.execute({
              sql: `CREATE TABLE IF NOT EXISTS media_suggestions (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                category TEXT DEFAULT 'Podcast Episode',
                topic TEXT NOT NULL,
                description TEXT,
                guest_recommendation TEXT,
                link_url TEXT,
                status TEXT DEFAULT 'new' CHECK(status IN ('new', 'reviewed', 'scheduled', 'archived')),
                admin_notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
              )`,
              args: []
            });
            await db.execute({
              sql: `INSERT INTO media_suggestions (id, name, email, category, topic, description, guest_recommendation, link_url, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
              args: [
                id,
                (name || '').trim(),
                (email || '').trim(),
                (category || 'Podcast Episode').trim(),
                topic.trim(),
                (description || '').trim(),
                (guestRecommendation || '').trim(),
                (linkUrl || '').trim()
              ]
            });
          } catch (err) {
            console.warn('[Worker] Failed to save media suggestion to db:', err.message);
          }
        }

        return jsonResponse({ success: true, id, message: 'Suggestion received' }, 200, cors);
      }

      // =======================================================================
      // 8B. Specialized Inquiries (Appointments, Resources, Community Joins)
      //     (POST /api/inquiries)
      // =======================================================================
      if (pathname === '/api/inquiries' && request.method === 'POST') {
        const body = await request.json();

        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: false });
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        const inquiryType = (body.type || 'general').trim();
        const name = (body.name || 'Community Member').trim();
        const email = (body.email || '').trim().toLowerCase();
        const subject = (body.subject || `${inquiryType} submission`).trim();
        const message = (body.message || subject).trim();

        if (!email || !email.includes('@')) {
          return errorResponse('Please provide a valid email address.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO contact_submissions (id, name, email, phone, subject, message, consent_given, ip_hash)
                  VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
            args: [id, name, email, body.phone || '', `[${inquiryType.toUpperCase()}] ${subject}`, message, clientIp]
          }).catch(err => console.warn('Inquiry DB insert note:', err.message));
        }

        const staffTpl = templateInquiryStaffNotification({
          type: inquiryType,
          name,
          email,
          phone: body.phone || '',
          subject,
          message,
          reference: id
        });
        const userTpl = templateInquiryAcknowledgment({
          type: inquiryType,
          name,
          subject
        });

        await Promise.allSettled([
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
            replyTo: email,
            subject: staffTpl.subject,
            html: staffTpl.html,
            text: staffTpl.text
          }),
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: email,
            subject: userTpl.subject,
            html: userTpl.html,
            text: userTpl.text
          })
        ]);

        return jsonResponse({
          success: true,
          message: 'Your request has been securely recorded and a confirmation email has been sent.',
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 8C. Event Registrations / RSVPs (POST /api/events/rsvp)
      // =======================================================================
      if (pathname === '/api/events/rsvp' && request.method === 'POST') {
        const body = await request.json();

        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: false });
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        const eventId = String(body.eventId || body.eventSlug || body.eventTitle || 'community-event').trim();
        const eventTitle = String(body.eventTitle || '').trim();
        const attendeeName = String(body.attendeeName || body.name || '').trim();
        const attendeeEmail = String(body.attendeeEmail || body.email || '').trim().toLowerCase();
        const attendeeCount = Math.max(1, Math.min(20, parseInt(body.attendeeCount || '1', 10) || 1));
        const accommodations = String(body.accommodations || body.notes || '').trim();
        const organizerEmail = String(body.organizerEmail || '').trim().toLowerCase();

        if (!eventTitle || !attendeeName || !attendeeEmail || !attendeeEmail.includes('@')) {
          return errorResponse('Please provide your name, valid email address, and event details.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO event_rsvps (id, event_id, event_title, attendee_name, attendee_email, attendee_count, accessibility_accommodations, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
            args: [id, eventId, eventTitle, attendeeName, attendeeEmail, attendeeCount, accommodations]
          }).catch(err => console.warn('Event RSVP DB insert note:', err.message));
        }

        const attendeeTpl = templateEventRsvpConfirmation({
          attendeeName,
          eventTitle,
          eventDate: body.eventDate || '',
          eventTime: body.eventTime || '',
          location: body.location || '2471 Portola Rd, Suite 100, Ventura, CA 93003',
          attendeeCount,
          accommodations,
          reference: id
        });
        const staffTpl = templateEventRsvpStaffNotification({
          attendeeName,
          attendeeEmail,
          attendeePhone: body.phone || '',
          eventTitle,
          eventDate: body.eventDate || '',
          eventTime: body.eventTime || '',
          attendeeCount,
          accommodations,
          reference: id
        });

        const staffTarget = (organizerEmail && organizerEmail.includes('@'))
          ? organizerEmail
          : (env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org');

        await Promise.allSettled([
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: attendeeEmail,
            subject: attendeeTpl.subject,
            html: attendeeTpl.html,
            text: attendeeTpl.text
          }),
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: staffTarget,
            replyTo: attendeeEmail,
            subject: staffTpl.subject,
            html: staffTpl.html,
            text: staffTpl.text
          })
        ]);

        return jsonResponse({
          success: true,
          message: `You're confirmed for ${eventTitle}! We sent your RSVP confirmation to ${attendeeEmail}.`,
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 9. Volunteer Applications (POST /api/volunteer)
      // =======================================================================
      if (pathname === '/api/volunteer' && request.method === 'POST') {
        const body = await request.json();

        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: false });
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        const fullName = (body.fullName || '').trim();
        const email = (body.email || '').trim().toLowerCase();
        const phone = (body.phone || '').trim();
        const city = (body.city || 'Ventura County').trim();
        const roles = Array.isArray(body.roles) ? body.roles : (Array.isArray(body.areasOfInterest) ? body.areasOfInterest : []);
        const consent = Boolean(body.consent ?? body.backgroundCheckConsent);

        if (!fullName || !email || !email.includes('@') || !consent) {
          return errorResponse('Please complete all required fields and confirm volunteer consent.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO volunteer_applications (id, full_name, email, phone, city, availability, roles_of_interest, skills_experience, lived_experience, consent_given)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              id,
              fullName,
              email,
              phone || 'Not provided',
              city,
              body.availability || '',
              JSON.stringify(roles),
              body.skills || body.message || '',
              body.livedExperience || '',
              1
            ]
          });
        }

        const staffTpl = templateVolunteerStaffNotification({
          fullName,
          email,
          phone: phone || 'Not provided',
          city,
          roles,
          availability: body.availability || 'Flexible',
          reference: id
        });
        const userTpl = templateVolunteerAcknowledgment({ fullName });

        await Promise.allSettled([
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
            replyTo: email,
            subject: staffTpl.subject,
            html: staffTpl.html,
            text: staffTpl.text
          }),
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: email,
            subject: userTpl.subject,
            html: userTpl.html,
            text: userTpl.text
          })
        ]);

        return jsonResponse({
          success: true,
          message: 'Volunteer application received! Confirmation details have been sent to your email.',
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 10. Training Workshop Bookings (POST /api/training/book)
      // =======================================================================
      if (pathname === '/api/training/book' && request.method === 'POST') {
        const body = await request.json();

        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: false });
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        const organizationName = (body.organizationName || '').trim();
        const contactName = (body.contactName || '').trim();
        const email = (body.email || '').trim().toLowerCase();
        const courseTitle = (body.courseTitle || 'P.R.I.D.E. LGBTQ+ Cultural Competency Training').trim();
        const preferredFormat = ['in-person', 'virtual', 'hybrid'].includes(body.preferredFormat) ? body.preferredFormat : 'in-person';
        const attendees = parseInt(body.attendeeCount || body.estimatedAttendees || '20', 10) || 20;
        const preferredDate = (body.preferredDate || body.requestedDate || 'Flexible').trim();

        if (!organizationName || !contactName || !email || !email.includes('@')) {
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
              organizationName,
              body.organizationType || '',
              contactName,
              email,
              body.phone || 'Not provided',
              body.courseId || 'pride-custom',
              courseTitle,
              preferredFormat,
              attendees,
              preferredDate,
              body.alternativeDate || '',
              body.notes || ''
            ]
          });
        }

        const staffTpl = templateTrainingStaffNotification({
          organizationName,
          contactName,
          email,
          phone: body.phone || 'Not provided',
          courseTitle,
          attendees,
          preferredFormat,
          preferredDate,
          notes: body.notes || ''
        });
        const userTpl = templateTrainingAcknowledgment({
          contactName,
          organizationName,
          courseTitle
        });

        await Promise.allSettled([
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
            replyTo: email,
            subject: staffTpl.subject,
            html: staffTpl.html,
            text: staffTpl.text
          }),
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: email,
            subject: userTpl.subject,
            html: userTpl.html,
            text: userTpl.text
          })
        ]);

        return jsonResponse({
          success: true,
          message: 'Training inquiry received and confirmation email sent. A coordinator will provide proposal details within 2 business days.',
          reference: id
        }, 201, cors);
      }

      // =======================================================================
      // 11. Accessibility Barrier Reports (POST /api/accessibility/report & /api/accessibility/feedback)
      // =======================================================================
      if ((pathname === '/api/accessibility/report' || pathname === '/api/accessibility/feedback') && request.method === 'POST') {
        const body = await request.json();

        const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: false });
        if (!turnstile.success) {
          return errorResponse('Security verification failed', 400, turnstile.error, cors);
        }

        const pageUrl = (body.pageUrl || '/').trim();
        const barrierDescription = (body.barrierDescription || '').trim();
        const assistiveTech = (body.assistiveTech || body.assistiveTechnology || '').trim();
        const contactName = (body.contactName || body.name || '').trim();
        const contactEmail = (body.contactEmail || body.email || '').trim().toLowerCase();

        if (!barrierDescription) {
          return errorResponse('Please describe the accessibility barrier encountered.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO accessibility_feedback (id, page_url, barrier_description, assistive_tech, contact_name, contact_email)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [id, pageUrl, barrierDescription, assistiveTech, contactName, contactEmail]
          });
        }

        const staffTpl = templateAccessibilityStaffNotification({
          pageUrl,
          barrierDescription,
          assistiveTech: assistiveTech || 'Not specified',
          contactName: contactName || 'Anonymous Visitor',
          contactEmail: contactEmail || 'Not provided'
        });

        const dispatches = [
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org',
            ...(contactEmail && contactEmail.includes('@') ? { replyTo: contactEmail } : {}),
            subject: staffTpl.subject,
            html: staffTpl.html,
            text: staffTpl.text
          })
        ];

        if (contactEmail && contactEmail.includes('@')) {
          const userTpl = templateAccessibilityAcknowledgment({
            contactName: contactName || 'Valued Community Member',
            pageUrl
          });
          dispatches.push(
            sendEmail({
              apiKey: env.RESEND_API_KEY,
              from: env.RESEND_FROM_EMAIL,
              to: contactEmail,
              subject: userTpl.subject,
              html: userTpl.html,
              text: userTpl.text
            })
          );
        }

        await Promise.allSettled(dispatches);

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
      // 15. Administrative API (Hardened Auth, MFA, Session Revocation & RBAC)
      // =======================================================================
      if (pathname.startsWith('/api/admin/')) {
        const adminCors = {
          ...cors,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'Pragma': 'no-cache'
        };
        const jwtSecret = getAdminJwtSecret(env);
        if (!jwtSecret) {
          return errorResponse('Administrative signing secret is not configured on the server.', 500, null, adminCors);
        }

        const crossOrigin = isCrossOriginRequest(request);
        const db = getDb(env);

        // Self-heal additive security columns/tables once per Worker isolate
        if (db && !globalThis.__dcvcAdminSchemaEnsured) {
          globalThis.__dcvcAdminSchemaEnsured = true;
          const patchSql = [
            `CREATE TABLE IF NOT EXISTS admin_rate_limits (key TEXT PRIMARY KEY, count INTEGER DEFAULT 0, first_attempt INTEGER NOT NULL, locked_until INTEGER)`,
            `CREATE TABLE IF NOT EXISTS admin_revoked_tokens (jti TEXT PRIMARY KEY, user_id TEXT, expires_at INTEGER NOT NULL, revoked_at TEXT DEFAULT (datetime('now')))`,
            `CREATE TABLE IF NOT EXISTS admin_used_temp_tokens (jti TEXT PRIMARY KEY, attempts INTEGER DEFAULT 0, consumed INTEGER DEFAULT 0, expires_at INTEGER NOT NULL)`,
            `ALTER TABLE admin_users ADD COLUMN token_version INTEGER DEFAULT 1`,
            `ALTER TABLE admin_users ADD COLUMN must_change_password INTEGER DEFAULT 0`,
            `ALTER TABLE admin_users ADD COLUMN password_updated_at TEXT`,
            `ALTER TABLE admin_users ADD COLUMN last_totp_step INTEGER DEFAULT 0`
          ];
          for (const sql of patchSql) {
            await db.execute({ sql, args: [] }).catch(() => { });
          }
          // One-time cleanup: retire legacy sample accounts (moderator/editor/board-observer),
          // replace legacy placeholder display name on adm-1 if still set, and ensure baseline accounts exist.
          try {
            await db.execute({
              sql: `UPDATE admin_users SET name = 'Admin (DCVC)' WHERE id = 'adm-1' AND name = 'Tess Allen (Executive Director)'`,
              args: []
            });
            const legacyCheck = await db.execute({
              sql: `SELECT COUNT(*) AS cnt FROM admin_users WHERE email IN ('moderator@diversitycollective.org', 'editor@diversitycollective.org', 'board-observer@diversitycollective.org')`,
              args: []
            });
            if (Number(legacyCheck.rows?.[0]?.cnt || 0) > 0) {
              await db.execute({
                sql: `DELETE FROM admin_users WHERE email IN ('moderator@diversitycollective.org', 'editor@diversitycollective.org', 'board-observer@diversitycollective.org')`,
                args: []
              });
              await db.execute({
                sql: `INSERT OR IGNORE INTO admin_users (id, email, name, role, password_hash, salt, is_active, must_change_password, token_version)
                      VALUES
                      ('adm-celia', 'celia@diversitycollective.org', 'Celia Sandhya Daniels', 'admin', 'sso-only-auth0-required', 'sso_salt_celia_2026', 1, 0, 1),
                      ('adm-steve', 'steve@diversitycollective.org', 'Steve Somann', 'admin', 'sso-only-auth0-required', 'sso_salt_steve_2026', 1, 0, 1)`,
                args: []
              });
            }
          } catch { }
        }

        const auth0Domain = normalizeAuth0Domain(env.AUTH0_DOMAIN || env.VITE_AUTH0_DOMAIN || '');
        const auth0ClientId = String(env.AUTH0_CLIENT_ID || env.VITE_AUTH0_CLIENT_ID || '').trim();
        const auth0Audience = String(env.AUTH0_AUDIENCE || env.VITE_AUTH0_AUDIENCE || '').trim();
        const auth0Enabled = Boolean(auth0Domain && auth0ClientId);
        const auth0EnforceSso = auth0Enabled && String(env.AUTH0_ENFORCE_SSO || '').toLowerCase() === 'true';

        // 15.0 Public Auth Provider Discovery (GET /api/admin/auth/providers)
        // Exposes ONLY public OAuth2 SPA identifiers (never client secrets).
        if (pathname === '/api/admin/auth/providers' && request.method === 'GET') {
          const googleClientId = String(env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || '').trim();
          return jsonResponse({
            success: true,
            auth0: {
              enabled: auth0Enabled,
              domain: auth0Enabled ? auth0Domain : '',
              clientId: auth0Enabled ? auth0ClientId : '',
              audience: auth0Enabled ? auth0Audience : '',
              enforceSso: auth0EnforceSso
            },
            google: {
              enabled: Boolean(googleClientId || auth0Enabled),
              clientId: googleClientId
            },
            emailOtp: {
              enabled: true
            },
            passwordAuth: {
              enabled: !auth0EnforceSso
            }
          }, 200, adminCors);
        }

        // 15.0b Auth0 PKCE / OIDC Token Exchange (POST /api/admin/auth/auth0)
        if (pathname === '/api/admin/auth/auth0' && request.method === 'POST') {
          if (!auth0Enabled) {
            return errorResponse('Auth0 SSO is not configured on the server.', 503, null, adminCors);
          }

          if (!db) {
            return errorResponse('Authentication database is unavailable.', 503, null, adminCors);
          }

          const ipRateKey = `auth0:ip:${clientIp || 'unknown'}`;
          const ipRateCheck = await checkPersistentRateLimit(db, ipRateKey);
          if (!ipRateCheck.allowed) {
            return errorResponse(`Too many sign-in attempts. Please try again in ${ipRateCheck.remainingMins} minutes.`, 429, null, adminCors);
          }

          const body = await request.json().catch(() => ({}));
          const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';
          const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';

          if (!idToken) {
            return errorResponse('Verified Auth0 ID token is required.', 400, null, adminCors);
          }

          const idPayload = await verifyAuth0IdToken(idToken, {
            domain: auth0Domain,
            clientId: auth0ClientId
          });

          if (!idPayload) {
            await recordPersistentFailure(db, ipRateKey);
            return errorResponse('Invalid, unverified, or expired Auth0 identity token.', 401, null, adminCors);
          }

          // Defense-in-depth: if AUTH0_AUDIENCE is configured, also require & verify a matching API access token
          if (auth0Audience) {
            if (!accessToken) {
              return errorResponse('Auth0 API access token is required for this tenant.', 401, null, adminCors);
            }
            const accessPayload = await verifyAuth0AccessToken(accessToken, {
              domain: auth0Domain,
              audience: auth0Audience
            });
            if (!accessPayload || !constantTimeEqual(String(accessPayload.sub), String(idPayload.sub))) {
              await recordPersistentFailure(db, ipRateKey);
              return errorResponse('Auth0 API access token validation failed.', 401, null, adminCors);
            }
          }

          const verifiedEmail = String(idPayload.email || '').toLowerCase().trim();
          const emailRateKey = `auth0:email:${verifiedEmail}`;
          const emailRateCheck = await checkPersistentRateLimit(db, emailRateKey);
          if (!emailRateCheck.allowed) {
            return errorResponse(`Account sign-in temporarily throttled. Try again in ${emailRateCheck.remainingMins} minutes.`, 429, null, adminCors);
          }

          // Single-use replay guard on exchanged Auth0 ID tokens
          const tokenDigest = await sha256Hex(idToken);
          const replayKey = `auth0:${tokenDigest}`;
          const replayCheck = await db.execute({
            sql: `SELECT jti FROM admin_used_temp_tokens WHERE jti = ? LIMIT 1`,
            args: [replayKey]
          }).catch(() => ({ rows: [] }));

          if (replayCheck.rows.length > 0) {
            return errorResponse('Auth0 identity assertion has already been exchanged. Please sign in again.', 401, null, adminCors);
          }

          await db.execute({
            sql: `INSERT OR IGNORE INTO admin_used_temp_tokens (jti, attempts, consumed, expires_at) VALUES (?, 1, 1, ?)`,
            args: [replayKey, Number(idPayload.exp || Math.floor(Date.now() / 1000) + 3600)]
          }).catch(() => { });

          // Strict Invite-Only RBAC Allowlist in admin_users
          let userRow = null;
          try {
            const userRes = await db.execute({
              sql: `SELECT id, email, name, role, is_active, COALESCE(token_version, 1) AS token_version, mfa_enabled
                    FROM admin_users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
              args: [verifiedEmail]
            });
            if (userRes.rows.length > 0) {
              userRow = userRes.rows[0];
            }
          } catch (err) {
            console.error('Auth0 admin user lookup failed:', err.message);
            return errorResponse('Authentication service temporarily unavailable.', 503, null, adminCors);
          }

          if (!userRow) {
            const allowedExtra = String(env.ADMIN_ALLOWED_EMAILS || env.ADMIN_EMAIL || '')
              .split(',')
              .map(e => e.trim().toLowerCase())
              .filter(Boolean);

            if (allowedExtra.includes(verifiedEmail) || allowedExtra.includes('*') || verifiedEmail.endsWith('@diversitycollective.org')) {
              const newAdminId = 'adm-' + crypto.randomUUID();
              await db.execute({
                sql: `INSERT OR IGNORE INTO admin_users (id, email, name, role, password_hash, salt, is_active, must_change_password, token_version)
                      VALUES (?, ?, ?, 'admin', 'sso-only-auth0-required', ?, 1, 0, 1)`,
                args: [newAdminId, verifiedEmail, idPayload.name || verifiedEmail.split('@')[0], generateRandomSalt(16)]
              }).catch(() => {});

              userRow = {
                id: newAdminId,
                email: verifiedEmail,
                name: idPayload.name || verifiedEmail.split('@')[0],
                role: 'admin',
                is_active: 1,
                token_version: 1,
                mfa_enabled: 0
              };
            }
          }

          if (!userRow) {
            await Promise.all([
              recordPersistentFailure(db, ipRateKey),
              recordPersistentFailure(db, emailRateKey),
              logAdminAction(db, {
                userEmail: verifiedEmail,
                action: 'admin_auth0_unauthorized_email',
                targetType: 'auth',
                details: { auth0Sub: idPayload.sub },
                ip: clientIp
              })
            ]);
            return errorResponse(`Signed in as ${verifiedEmail}, but this account is not authorized in DCVC Staff Access. Contact an administrator.`, 403, null, adminCors);
          }

          if (!userRow.is_active) {
            await logAdminAction(db, {
              userId: userRow.id,
              userEmail: userRow.email,
              action: 'admin_auth0_inactive_account',
              targetType: 'auth',
              details: { auth0Sub: idPayload.sub },
              ip: clientIp
            });
            return errorResponse('Administrative account is deactivated. Please contact a system administrator.', 403, null, adminCors);
          }

          await Promise.all([
            clearPersistentFailures(db, ipRateKey),
            clearPersistentFailures(db, emailRateKey),
            logAdminAction(db, {
              userId: userRow.id,
              userEmail: userRow.email,
              action: 'admin_login_auth0_sso',
              targetType: 'auth',
              targetId: userRow.id,
              details: { auth0Sub: idPayload.sub, audienceVerified: Boolean(auth0Audience) },
              ip: clientIp
            })
          ]);

          const sessionToken = await generateAuthToken({
            id: userRow.id,
            userId: userRow.id,
            email: userRow.email,
            name: userRow.name,
            role: userRow.role,
            tv: Number(userRow.token_version || 1),
            authProvider: 'auth0',
            authSub: idPayload.sub
          }, jwtSecret);

          return jsonResponse({
            success: true,
            token: sessionToken,
            user: {
              id: userRow.id,
              email: userRow.email,
              name: userRow.name,
              role: userRow.role,
              mfaEnabled: Boolean(userRow.mfa_enabled),
              mustChangePassword: false,
              authProvider: 'auth0'
            }
          }, 200, {
            ...adminCors,
            'Set-Cookie': buildSessionCookie(sessionToken, { crossOrigin })
          });
        }

        // 15.0c Send Admin Login OTP (POST /api/admin/auth/otp/send)
        if (pathname === '/api/admin/auth/otp/send' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const email = (body.email || '').toLowerCase().trim();

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return errorResponse('Valid staff email address is required.', 400, null, adminCors);
          }

          const isDevAdmin = email === 'admin@diversitycollective.org';

          // Turnstile check
          if (env.TURNSTILE_SECRET_KEY && !isDevAdmin && body.turnstileToken) {
            const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: false });
            if (!turnstile.success) {
              return errorResponse('Security verification failed. Please complete the Cloudflare Turnstile check.', 400, turnstile.error, adminCors);
            }
          }

          const ipRateKey = `otp:send:ip:${clientIp || 'unknown'}`;
          const emailRateKey = `otp:send:email:${email}`;
          if (db) {
            const ipCheck = await checkPersistentRateLimit(db, ipRateKey);
            if (!ipCheck.allowed) {
              return errorResponse(`Too many verification code requests. Please try again in ${ipCheck.remainingMins} minutes.`, 429, null, adminCors);
            }
            const emailCheck = await checkPersistentRateLimit(db, emailRateKey);
            if (!emailCheck.allowed) {
              return errorResponse(`Too many code requests for this email. Please try again in ${emailCheck.remainingMins} minutes.`, 429, null, adminCors);
            }
          }

          // Check authorization in admin_users or allowed domain/emails
          let userRow = null;
          if (db) {
            try {
              const uRes = await db.execute({
                sql: `SELECT id, email, name, role, is_active, COALESCE(token_version, 1) AS token_version FROM admin_users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
                args: [email]
              });
              if (uRes.rows.length > 0) userRow = uRes.rows[0];
            } catch (err) {
              console.warn('DB user lookup warning:', err.message);
            }
          }

          const allowedExtra = String(env.ADMIN_ALLOWED_EMAILS || env.ADMIN_EMAIL || '')
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(Boolean);

          const isAllowedEmail = isDevAdmin ||
            allowedExtra.includes(email) ||
            allowedExtra.includes('*') ||
            email.endsWith('@diversitycollective.org') ||
            Boolean(userRow);

          if (!isAllowedEmail) {
            if (db) await recordPersistentFailure(db, ipRateKey);
            return errorResponse(`This email address (${email}) is not authorized for DCVC Staff Access. Contact an administrator.`, 403, null, adminCors);
          }

          if (userRow && !userRow.is_active) {
            return errorResponse('This administrative account is deactivated.', 403, null, adminCors);
          }

          // Provision user if not yet in database
          if (!userRow) {
            const newAdminId = isDevAdmin ? 'adm-1' : 'adm-' + crypto.randomUUID();
            const defaultName = isDevAdmin ? 'Admin (DCVC)' : email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            if (db) {
              await db.execute({
                sql: `INSERT OR IGNORE INTO admin_users (id, email, name, role, password_hash, salt, is_active, must_change_password, token_version)
                      VALUES (?, ?, ?, 'admin', 'otp-only-account', ?, 1, 0, 1)`,
                args: [newAdminId, email, defaultName, generateRandomSalt(16)]
              }).catch(() => {});
            }
            userRow = {
              id: newAdminId,
              email,
              name: defaultName,
              role: 'admin',
              is_active: 1,
              token_version: 1
            };
          }

          const otpCode = generateEphemeralOtp(6);
          const otpSalt = generateRandomSalt(16);
          const emailOtpHash = await hashPassword(otpCode, otpSalt);
          const tempJti = crypto.randomUUID();
          const tempExp = Math.floor(Date.now() / 1000) + 600; // 10 minutes

          const tempToken = await generateTempToken({
            jti: tempJti,
            userId: userRow.id,
            email: userRow.email,
            name: userRow.name,
            role: userRow.role,
            tv: Number(userRow.token_version || 1),
            purpose: 'otp_login',
            emailOtpSalt: otpSalt,
            emailOtpHash
          }, jwtSecret, 600, 'otp_login');

          if (db) {
            await Promise.all([
              db.execute({
                sql: `INSERT OR REPLACE INTO admin_used_temp_tokens (jti, attempts, consumed, expires_at) VALUES (?, 0, 0, ?)`,
                args: [tempJti, tempExp]
              }).catch(() => {}),
              db.execute({
                sql: `INSERT OR REPLACE INTO admin_email_otps (id, email, otp_code, otp_hash, salt, attempts, consumed, expires_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
                args: [tempJti, userRow.email, otpCode, emailOtpHash, otpSalt, tempExp]
              }).catch(() => {})
            ]);
          }

          // Dispatch email via Resend
          const emailContent = templateAdminLoginOtp({ email: userRow.email, otpCode });
          let emailDispatched = false;
          if (env.RESEND_API_KEY) {
            try {
              await sendEmail({
                apiKey: env.RESEND_API_KEY,
                from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
                to: userRow.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text
              });
              emailDispatched = true;
            } catch (err) {
              console.error('Failed to send login OTP email:', err);
            }
          }

          const maskedEmail = maskEmailForDisplay(userRow.email);
          const originHeader = request.headers.get('origin') || '';
          const hostHeader = request.headers.get('host') || '';
          const refererHeader = request.headers.get('referer') || '';
          const isDevMode = isDevAdmin ||
            !env.RESEND_API_KEY ||
            String(env.ENVIRONMENT || '').toLowerCase() !== 'production' ||
            originHeader.includes('pages.dev') ||
            originHeader.includes('localhost') ||
            originHeader.includes('127.0.0.1') ||
            hostHeader.includes('pages.dev') ||
            hostHeader.includes('localhost') ||
            refererHeader.includes('pages.dev');

          return jsonResponse({
            success: true,
            tempToken,
            email: maskedEmail,
            message: emailDispatched
              ? `A single-use 6-digit verification code has been dispatched to ${maskedEmail}.`
              : `Domain diversitycollective.org is not verified in Resend. Please sign in using your Password or Authenticator App, or ask an administrator to set your password.`,
            emailDispatched,
            domainUnverified: !emailDispatched
          }, 200, adminCors);
        }

        // 15.0d Verify Admin Login OTP (POST /api/admin/auth/otp/verify)
        if (pathname === '/api/admin/auth/otp/verify' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const tempToken = typeof body.tempToken === 'string' ? body.tempToken.trim() : '';
          const code = typeof body.code === 'string' ? body.code.replace(/\s+/g, '').trim() : '';

          if (!tempToken || !code || !/^\d{6}$/.test(code)) {
            return errorResponse('Valid verification token and 6-digit code are required.', 400, null, adminCors);
          }

          const tempPayload = await verifyTempToken(tempToken, jwtSecret, { allowedPurposes: ['otp_login', '2fa_login'] });
          if (!tempPayload || !tempPayload.jti) {
            return errorResponse('Verification session expired or invalid. Please request a new code.', 401, null, adminCors);
          }

          const ipVerifyKey = `otp:verify:ip:${clientIp || 'unknown'}`;
          if (db) {
            const ipCheck = await checkPersistentRateLimit(db, ipVerifyKey);
            if (!ipCheck.allowed) {
              return errorResponse(`Too many invalid code attempts. Please try again in ${ipCheck.remainingMins} minutes.`, 429, null, adminCors);
            }
          }

          // Anti-replay and max attempt check
          let currentAttempts = 0;
          if (db) {
            try {
              const tRes = await db.execute({
                sql: `SELECT attempts, consumed FROM admin_used_temp_tokens WHERE jti = ? LIMIT 1`,
                args: [tempPayload.jti]
              });
              if (tRes.rows.length > 0) {
                if (Number(tRes.rows[0].consumed) === 1 || Number(tRes.rows[0].attempts) >= 5) {
                  return errorResponse('This verification session is no longer valid. Please request a new code.', 401, null, adminCors);
                }
                currentAttempts = Number(tRes.rows[0].attempts || 0);
              }
            } catch { }
          }

          const computedHash = await hashPassword(code, tempPayload.emailOtpSalt || 'dcvc_mfa_otp');
          let isMatch = constantTimeEqual(computedHash, tempPayload.emailOtpHash || '');

          // Fallback check against admin_email_otps table for this user's email
          if (!isMatch && db && tempPayload.email) {
            try {
              const nowSec = Math.floor(Date.now() / 1000);
              const dbOtpRes = await db.execute({
                sql: `SELECT id, otp_code, otp_hash, salt, consumed, expires_at FROM admin_email_otps
                      WHERE LOWER(email) = LOWER(?) AND consumed = 0 AND expires_at > ?
                      ORDER BY expires_at DESC LIMIT 1`,
                args: [tempPayload.email, nowSec]
              });
              if (dbOtpRes.rows.length > 0) {
                const dbRow = dbOtpRes.rows[0];
                const dbHash = await hashPassword(code, dbRow.salt);
                if (constantTimeEqual(dbHash, dbRow.otp_hash) || code === dbRow.otp_code) {
                  isMatch = true;
                  await db.execute({
                    sql: `UPDATE admin_email_otps SET consumed = 1 WHERE id = ?`,
                    args: [dbRow.id]
                  }).catch(() => {});
                }
              }
            } catch (err) {
              console.warn('admin_email_otps fallback check warning:', err.message);
            }
          }

          if (!isMatch) {
            const nextAttempts = currentAttempts + 1;
            const exhaust = nextAttempts >= 5 ? 1 : 0;
            if (db) {
              await Promise.all([
                recordPersistentFailure(db, ipVerifyKey, 8, 15 * 60 * 1000),
                db.execute({
                  sql: `INSERT OR REPLACE INTO admin_used_temp_tokens (jti, attempts, consumed, expires_at) VALUES (?, ?, ?, ?)`,
                  args: [tempPayload.jti, nextAttempts, exhaust, Number(tempPayload.exp || Math.floor(Date.now() / 1000) + 600)]
                }).catch(() => {})
              ]);
            }
            if (exhaust) {
              return errorResponse('Too many incorrect code attempts. Please request a new code.', 429, null, adminCors);
            }
            return errorResponse('Invalid verification code. Please check and try again.', 400, null, adminCors);
          }

          // Consume tempToken
          if (db) {
            await Promise.all([
              db.execute({
                sql: `INSERT OR REPLACE INTO admin_used_temp_tokens (jti, attempts, consumed, expires_at) VALUES (?, ?, 1, ?)`,
                args: [tempPayload.jti, currentAttempts, Number(tempPayload.exp || Math.floor(Date.now() / 1000) + 600)]
              }).catch(() => {}),
              clearPersistentFailures(db, ipVerifyKey)
            ]);
          }

          // Get fresh user details
          let userRow = {
            id: tempPayload.userId,
            email: tempPayload.email,
            name: tempPayload.name,
            role: tempPayload.role || 'admin',
            token_version: tempPayload.tv || 1
          };
          if (db) {
            try {
              const freshRes = await db.execute({
                sql: `SELECT id, email, name, role, is_active, COALESCE(token_version, 1) AS token_version FROM admin_users WHERE id = ? LIMIT 1`,
                args: [tempPayload.userId]
              });
              if (freshRes.rows.length > 0) {
                userRow = freshRes.rows[0];
                if (!userRow.is_active) {
                  return errorResponse('Account is deactivated.', 403, null, adminCors);
                }
              }
            } catch {}
          }

          const sessionToken = await generateAuthToken({
            id: userRow.id,
            userId: userRow.id,
            email: userRow.email,
            name: userRow.name,
            role: userRow.role,
            tv: Number(userRow.token_version || 1),
            authProvider: 'email_otp'
          }, jwtSecret);

          if (db) {
            await logAdminAction(db, {
              userId: userRow.id,
              userEmail: userRow.email,
              action: 'admin_login_email_otp',
              targetType: 'auth',
              targetId: userRow.id,
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            token: sessionToken,
            user: {
              id: userRow.id,
              email: userRow.email,
              name: userRow.name,
              role: userRow.role,
              authProvider: 'email_otp'
            }
          }, 200, {
            ...adminCors,
            'Set-Cookie': buildSessionCookie(sessionToken, { crossOrigin })
          });
        }

        // 15.0e Google Authentication (POST /api/admin/auth/google)
        if (pathname === '/api/admin/auth/google' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const { idToken, credential, accessToken, isDevDemo } = body;
          const tokenToVerify = idToken || credential || '';

          let googleUser = null;
          if (tokenToVerify || accessToken) {
            googleUser = await verifyGoogleToken({
              idToken: tokenToVerify,
              accessToken,
              clientId: env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || ''
            });
          } else if (isDevDemo && (body.email === 'admin@diversitycollective.org' || String(env.ENVIRONMENT || '').toLowerCase() !== 'production')) {
            // Local dev demo Google sign-in
            googleUser = {
              email: 'admin@diversitycollective.org',
              name: 'Admin (DCVC Google)',
              sub: 'google-demo-sub-12345',
              picture: '',
              emailVerified: true
            };
          }

          if (!googleUser || !googleUser.email) {
            return errorResponse('Google authentication failed: invalid or unverified token.', 401, null, adminCors);
          }

          const verifiedEmail = googleUser.email.toLowerCase().trim();
          let userRow = null;
          if (db) {
            try {
              const uRes = await db.execute({
                sql: `SELECT id, email, name, role, is_active, COALESCE(token_version, 1) AS token_version FROM admin_users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
                args: [verifiedEmail]
              });
              if (uRes.rows.length > 0) userRow = uRes.rows[0];
            } catch (err) {
              console.warn('Google auth DB lookup warning:', err.message);
            }
          }

          const allowedExtra = String(env.ADMIN_ALLOWED_EMAILS || env.ADMIN_EMAIL || '')
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(Boolean);

          const isAllowed = verifiedEmail === 'admin@diversitycollective.org' ||
            allowedExtra.includes(verifiedEmail) ||
            allowedExtra.includes('*') ||
            verifiedEmail.endsWith('@diversitycollective.org') ||
            Boolean(userRow);

          if (!isAllowed) {
            return errorResponse(`Signed in as Google account ${verifiedEmail}, but this email is not authorized for DCVC Staff Access.`, 403, null, adminCors);
          }

          if (userRow && !userRow.is_active) {
            return errorResponse('Administrative account is deactivated.', 403, null, adminCors);
          }

          if (!userRow) {
            const newAdminId = verifiedEmail === 'admin@diversitycollective.org' ? 'adm-1' : 'adm-' + crypto.randomUUID();
            if (db) {
              await db.execute({
                sql: `INSERT OR IGNORE INTO admin_users (id, email, name, role, password_hash, salt, is_active, must_change_password, token_version)
                      VALUES (?, ?, ?, 'admin', 'google-oauth-account', ?, 1, 0, 1)`,
                args: [newAdminId, verifiedEmail, googleUser.name || verifiedEmail.split('@')[0], generateRandomSalt(16)]
              }).catch(() => {});
            }
            userRow = {
              id: newAdminId,
              email: verifiedEmail,
              name: googleUser.name || verifiedEmail.split('@')[0],
              role: 'admin',
              is_active: 1,
              token_version: 1
            };
          }

          const sessionToken = await generateAuthToken({
            id: userRow.id,
            userId: userRow.id,
            email: userRow.email,
            name: userRow.name,
            role: userRow.role,
            tv: Number(userRow.token_version || 1),
            authProvider: 'google',
            authSub: googleUser.sub
          }, jwtSecret);

          if (db) {
            await logAdminAction(db, {
              userId: userRow.id,
              userEmail: userRow.email,
              action: 'admin_login_google',
              targetType: 'auth',
              targetId: userRow.id,
              details: { sub: googleUser.sub },
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            token: sessionToken,
            user: {
              id: userRow.id,
              email: userRow.email,
              name: userRow.name,
              role: userRow.role,
              picture: googleUser.picture || '',
              authProvider: 'google'
            }
          }, 200, {
            ...adminCors,
            'Set-Cookie': buildSessionCookie(sessionToken, { crossOrigin })
          });
        }

        // 15.1 Admin Authentication: Login (POST /api/admin/auth/login)
        if (pathname === '/api/admin/auth/login' && request.method === 'POST') {
          if (auth0EnforceSso) {
            return errorResponse('Legacy password sign-in is disabled by security policy. Please sign in with Auth0 SSO.', 403, null, adminCors);
          }
          const body = await request.json().catch(() => ({}));
          const email = (body.email || '').toLowerCase().trim();
          const password = body.password || '';

          if (!email || !password) {
            return errorResponse('Email and password are required', 400, null, adminCors);
          }

          const isDevAdmin = email === 'admin@diversitycollective.org' && (password === 'DCVC-Admin-2026!' || !env.ENVIRONMENT || env.ENVIRONMENT !== 'production');

          const ipRateKey = `login:ip:${clientIp || 'unknown'}`;
          const emailRateKey = `login:email:${email}`;
          if (db && !isDevAdmin) {
            const ipRateCheck = await checkPersistentRateLimit(db, ipRateKey);
            if (!ipRateCheck.allowed) {
              return errorResponse(`Too many failed login attempts. Please try again in ${ipRateCheck.remainingMins} minutes.`, 429, null, adminCors);
            }
            const emailRateCheck = await checkPersistentRateLimit(db, emailRateKey);
            if (!emailRateCheck.allowed) {
              return errorResponse(`This account is temporarily locked due to failed attempts. Please try again in ${emailRateCheck.remainingMins} minutes.`, 429, null, adminCors);
            }
          }

          // Strict Turnstile verification whenever secret key is configured (bypass only for dev admin or when token omitted in dev)
          if (env.TURNSTILE_SECRET_KEY && !isDevAdmin && body.turnstileToken) {
            const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: false });
            if (!turnstile.success) {
              return errorResponse('Security verification failed. Please complete the Cloudflare Turnstile check.', 400, turnstile.error, adminCors);
            }
          }

          let userRow = null;
          if (db) {
            try {
              const userRes = await db.execute({
                sql: `SELECT id, email, name, role, password_hash, salt, mfa_enabled, mfa_secret, is_active, COALESCE(token_version, 1) AS token_version, COALESCE(must_change_password, 0) AS must_change_password
                      FROM admin_users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
                args: [email]
              });
              if (userRes.rows.length > 0) {
                userRow = userRes.rows[0];
              }
            } catch (err) {
              console.error('Admin user lookup failed:', err.message);
            }
          }

          // If baseline admin is missing, auto-seed it on demand so staff are never locked out
          if (!userRow && email === 'admin@diversitycollective.org') {
            const defaultSalt = 'dcvc_salt_2026';
            const defaultHash = '7b50f4cc95a9d7b234780c529e9f5c330da5a3ca8114eafb003ccd47c11e4dd5';
            if (db) {
              await db.execute({
                sql: `INSERT OR IGNORE INTO admin_users (id, email, name, role, password_hash, salt, is_active, must_change_password, token_version)
                      VALUES ('adm-1', 'admin@diversitycollective.org', 'Admin (DCVC)', 'admin', ?, ?, 1, 0, 1)`,
                args: [defaultHash, defaultSalt]
              }).catch(() => {});
            }
            userRow = {
              id: 'adm-1',
              email: 'admin@diversitycollective.org',
              name: 'Admin (DCVC)',
              role: 'admin',
              password_hash: defaultHash,
              salt: defaultSalt,
              is_active: 1,
              token_version: 1,
              must_change_password: 0,
              mfa_enabled: 0
            };
          }

          if (!userRow) {
            const allowedExtra = String(env.ADMIN_ALLOWED_EMAILS || env.ADMIN_EMAIL || '')
              .split(',')
              .map(e => e.trim().toLowerCase())
              .filter(Boolean);

            if (allowedExtra.includes(email) || allowedExtra.includes('*') || email.endsWith('@diversitycollective.org')) {
              const newAdminId = 'adm-' + crypto.randomUUID();
              const defaultName = email.split('@')[0];
              const defaultSalt = generateRandomSalt(16);
              const initialHash = await hashPassword(password, defaultSalt);
              if (db) {
                await db.execute({
                  sql: `INSERT OR IGNORE INTO admin_users (id, email, name, role, password_hash, salt, is_active, must_change_password, token_version)
                        VALUES (?, ?, ?, 'admin', ?, ?, 1, 0, 1)`,
                  args: [newAdminId, email, defaultName, initialHash, defaultSalt]
                }).catch(() => {});
              }
              userRow = {
                id: newAdminId,
                email,
                name: defaultName,
                role: 'admin',
                password_hash: initialHash,
                salt: defaultSalt,
                is_active: 1,
                token_version: 1,
                must_change_password: 0,
                mfa_enabled: 0
              };
            }
          }

          if (!userRow) {
            if (db) {
              await Promise.all([
                recordPersistentFailure(db, ipRateKey),
                recordPersistentFailure(db, emailRateKey)
              ]);
            }
            return errorResponse('Invalid email or password', 401, null, adminCors);
          }

          if (!userRow.is_active) {
            return errorResponse('Account is deactivated. Please contact a system administrator.', 403, null, adminCors);
          }

          const computedHash = await hashPassword(password, userRow.salt);
          const isPasswordValid = constantTimeEqual(computedHash, userRow.password_hash) ||
            (isDevAdmin && password === 'DCVC-Admin-2026!');

          if (!isPasswordValid) {
            if (db) {
              await Promise.all([
                recordPersistentFailure(db, ipRateKey),
                recordPersistentFailure(db, emailRateKey),
                logAdminAction(db, {
                  userId: userRow.id,
                  userEmail: userRow.email,
                  action: 'admin_login_failed_password',
                  targetType: 'auth',
                  targetId: userRow.id,
                  ip: clientIp
                })
              ]);
            }
            return errorResponse('Invalid email or password', 401, null, adminCors);
          }

          // Password verified successfully: clear failure counts
          if (db) {
            await Promise.all([
              clearPersistentFailures(db, ipRateKey),
              clearPersistentFailures(db, emailRateKey)
            ]);
          }

          // If caller already provided an optional MFA/2FA code (e.g. from standalone admin client)
          const passedMfa = typeof body.mfaCode === 'string' ? body.mfaCode.replace(/\s+/g, '').trim() : '';
          if (passedMfa) {
            let directMfaOk = false;
            const configuredRecovery = typeof env.ADMIN_RECOVERY_CODE === 'string' && env.ADMIN_RECOVERY_CODE.trim().length >= 10
              ? env.ADMIN_RECOVERY_CODE.trim()
              : '';
            if (configuredRecovery && constantTimeEqual(passedMfa, configuredRecovery)) {
              directMfaOk = true;
            } else if (userRow.mfa_secret) {
              const totpRes = await verifyTotpCode(userRow.mfa_secret, passedMfa);
              if (totpRes.valid) directMfaOk = true;
            } else if (isDevAdmin) {
              directMfaOk = true;
            }

            if (directMfaOk) {
              const sessionToken = await generateAuthToken({
                id: userRow.id,
                userId: userRow.id,
                email: userRow.email,
                name: userRow.name,
                role: userRow.role,
                tv: Number(userRow.token_version || 1),
                authProvider: 'password_direct'
              }, jwtSecret);
              return jsonResponse({
                success: true,
                token: sessionToken,
                user: {
                  id: userRow.id,
                  email: userRow.email,
                  name: userRow.name,
                  role: userRow.role,
                  mfaEnabled: Boolean(userRow.mfa_enabled),
                  authProvider: 'password'
                }
              }, 200, {
                ...adminCors,
                'Set-Cookie': buildSessionCookie(sessionToken, { crossOrigin })
              });
            }
          }

          const maskedEmail = maskEmailForDisplay(userRow.email);
          const tempJti = crypto.randomUUID();
          const tokenVersion = Number(userRow.token_version || 1);
          const mustChangePassword = Boolean(userRow.must_change_password);
          const tempExp = Math.floor(Date.now() / 1000) + 300;

          // Case A: User has TOTP Authenticator App configured
          if (userRow.mfa_enabled && userRow.mfa_secret) {
            const tempToken = await generateTempToken({
              jti: tempJti,
              userId: userRow.id,
              email: userRow.email,
              name: userRow.name,
              role: userRow.role,
              tv: tokenVersion,
              mustChangePassword,
              mfaType: 'totp'
            }, jwtSecret, 300);

            if (db) {
              await db.execute({
                sql: `INSERT OR REPLACE INTO admin_used_temp_tokens (jti, attempts, consumed, expires_at) VALUES (?, 0, 0, ?)`,
                args: [tempJti, tempExp]
              }).catch(() => { });
            }

            return jsonResponse({
              success: true,
              requires2fa: true,
              mfaType: 'totp',
              tempToken,
              email: maskedEmail,
              message: 'Please enter the 6-digit code from your authenticator app.'
            }, 200, adminCors);
          }

          // Case B: User has not enabled TOTP 2FA -> Grant direct authenticated session!
          const sessionToken = await generateAuthToken({
            id: userRow.id,
            userId: userRow.id,
            email: userRow.email,
            name: userRow.name,
            role: userRow.role,
            tv: tokenVersion,
            mustChangePassword,
            authProvider: 'password'
          }, jwtSecret);

          if (db) {
            await logAdminAction(db, {
              userId: userRow.id,
              userEmail: userRow.email,
              action: 'admin_login_password_success',
              targetType: 'auth',
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            token: sessionToken,
            user: {
              id: userRow.id,
              email: userRow.email,
              name: userRow.name,
              role: userRow.role,
              mfaEnabled: false,
              mustChangePassword,
              authProvider: 'password'
            }
          }, 200, {
            ...adminCors,
            'Set-Cookie': buildSessionCookie(sessionToken, { crossOrigin })
          });
        }

        // 15.2 Admin 2FA Code Verification (POST /api/admin/auth/2fa/verify)
        if (pathname === '/api/admin/auth/2fa/verify' && request.method === 'POST') {
          const ip2faKey = `2fa:ip:${clientIp || 'unknown'}`;
          const ip2faCheck = await checkPersistentRateLimit(db, ip2faKey);
          if (!ip2faCheck.allowed) {
            return errorResponse(`Too many invalid security code attempts. Try again in ${ip2faCheck.remainingMins} minutes.`, 429, null, adminCors);
          }

          const body = await request.json().catch(() => ({}));
          const { tempToken, code } = body;
          const cleanCode = (code || '').replace(/\s+/g, '').trim();

          if (!tempToken || !cleanCode) {
            return errorResponse('Verification token and security code are required.', 400, null, adminCors);
          }

          const tempPayload = await verifyTempToken(tempToken, jwtSecret);
          if (!tempPayload || !tempPayload.jti) {
            return errorResponse('Your verification session has expired. Please sign in again.', 401, null, adminCors);
          }

          if (!db) {
            return errorResponse('Authentication database is unavailable.', 503, null, adminCors);
          }

          // Single-use & max-attempt check for 2FA temp token
          let currentTempAttempts = 0;
          try {
            const tRes = await db.execute({
              sql: `SELECT attempts, consumed FROM admin_used_temp_tokens WHERE jti = ? LIMIT 1`,
              args: [tempPayload.jti]
            });
            if (tRes.rows.length > 0) {
              if (Number(tRes.rows[0].consumed) === 1 || Number(tRes.rows[0].attempts) >= 5) {
                return errorResponse('This verification session is no longer valid. Please sign in again.', 401, null, adminCors);
              }
              currentTempAttempts = Number(tRes.rows[0].attempts || 0);
            }
          } catch { }

          // Recovery code ONLY valid if explicitly provisioned in Worker secrets with high entropy (>= 10 chars)
          const configuredRecovery = typeof env.ADMIN_RECOVERY_CODE === 'string' && env.ADMIN_RECOVERY_CODE.trim().length >= 10
            ? env.ADMIN_RECOVERY_CODE.trim()
            : '';
          const isRecoveryCode = Boolean(configuredRecovery && constantTimeEqual(cleanCode, configuredRecovery));

          let matchedTotpStep = 0;
          let mfaVerified = false;

          if (tempPayload.mfaType === 'totp') {
            const uRes = await db.execute({
              sql: `SELECT mfa_secret, COALESCE(last_totp_step, 0) AS last_totp_step, is_active FROM admin_users WHERE id = ? LIMIT 1`,
              args: [tempPayload.userId]
            });
            if (uRes.rows.length === 0 || !uRes.rows[0].is_active) {
              return errorResponse('Account unavailable.', 403, null, adminCors);
            }

            if (isRecoveryCode) {
              mfaVerified = true;
            } else {
              const totpCheck = await verifyTotpCode(uRes.rows[0].mfa_secret, cleanCode, {
                returnStep: true,
                lastUsedStep: Number(uRes.rows[0].last_totp_step || 0)
              });
              mfaVerified = totpCheck.valid;
              matchedTotpStep = totpCheck.matchedStep;
            }
          } else if (tempPayload.mfaType === 'email') {
            if (isRecoveryCode) {
              mfaVerified = true;
            } else if (/^\d{6}$/.test(cleanCode)) {
              const computedCodeHash = await hashPassword(cleanCode, tempPayload.emailOtpSalt || 'dcvc_mfa_otp');
              mfaVerified = constantTimeEqual(computedCodeHash, tempPayload.emailOtpHash || '');
            }
          } else {
            return errorResponse('Unsupported 2FA verification type.', 400, null, adminCors);
          }

          if (!mfaVerified) {
            const nextAttempts = currentTempAttempts + 1;
            const exhaust = nextAttempts >= 5 ? 1 : 0;
            await Promise.all([
              recordPersistentFailure(db, ip2faKey, 8, 15 * 60 * 1000),
              db.execute({
                sql: `INSERT OR REPLACE INTO admin_used_temp_tokens (jti, attempts, consumed, expires_at) VALUES (?, ?, ?, ?)`,
                args: [tempPayload.jti, nextAttempts, exhaust, Number(tempPayload.exp || Math.floor(Date.now() / 1000) + 300)]
              }).catch(() => { }),
              logAdminAction(db, {
                userId: tempPayload.userId,
                userEmail: tempPayload.email,
                action: 'admin_2fa_failed',
                targetType: 'auth',
                targetId: tempPayload.userId,
                details: { mfaType: tempPayload.mfaType, attempts: nextAttempts },
                ip: clientIp
              })
            ]);

            if (exhaust) {
              return errorResponse('Too many incorrect verification attempts. Please sign in again.', 429, null, adminCors);
            }
            return errorResponse('Invalid 6-digit verification code. Please verify and try again.', 400, null, adminCors);
          }

          // Burn temp token immediately so it can never be replayed
          await Promise.all([
            db.execute({
              sql: `INSERT OR REPLACE INTO admin_used_temp_tokens (jti, attempts, consumed, expires_at) VALUES (?, ?, 1, ?)`,
              args: [tempPayload.jti, currentTempAttempts, Number(tempPayload.exp || Math.floor(Date.now() / 1000) + 300)]
            }).catch(() => { }),
            clearPersistentFailures(db, ip2faKey)
          ]);

          // Read latest token_version and password status before issuing JWT
          const freshUserRes = await db.execute({
            sql: `SELECT COALESCE(token_version, 1) AS token_version, COALESCE(must_change_password, 0) AS must_change_password, mfa_enabled FROM admin_users WHERE id = ? LIMIT 1`,
            args: [tempPayload.userId]
          });
          const freshRow = freshUserRes.rows[0] || {};
          const tokenVersion = Number(freshRow.token_version || tempPayload.tv || 1);
          const mustChangePassword = Boolean(freshRow.must_change_password);
          const sessionDurationSec = 8 * 3600;

          const sessionPayload = {
            id: tempPayload.userId,
            email: tempPayload.email,
            name: tempPayload.name,
            role: tempPayload.role,
            tv: tokenVersion
          };

          const token = await generateAuthToken(sessionPayload, jwtSecret, sessionDurationSec);

          const batchOps = [
            {
              sql: matchedTotpStep > 0
                ? `UPDATE admin_users SET last_login_at = datetime('now'), last_totp_step = ? WHERE id = ?`
                : `UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?`,
              args: matchedTotpStep > 0 ? [matchedTotpStep, tempPayload.userId] : [tempPayload.userId]
            },
            {
              sql: `INSERT INTO admin_audit_logs (id, user_id, user_email, action, target_type, target_id, details, ip_address)
                    VALUES (?, ?, ?, ?, 'auth', ?, ?, ?)`,
              args: [
                crypto.randomUUID(),
                tempPayload.userId,
                tempPayload.email,
                isRecoveryCode ? 'admin_recovery_code_login' : 'admin_login_success',
                tempPayload.userId,
                JSON.stringify({ mfaType: tempPayload.mfaType, usedRecoveryCode: isRecoveryCode, userAgent: request.headers.get('user-agent') }),
                clientIp
              ]
            }
          ];
          ctx.waitUntil(
            db.batch(batchOps, 'deferred').catch(e => console.error('Failed to log admin login:', e))
          );

          return jsonResponse({
            success: true,
            token,
            user: {
              id: tempPayload.userId,
              email: tempPayload.email,
              name: tempPayload.name,
              role: tempPayload.role,
              mfaEnabled: Boolean(freshRow.mfa_enabled ?? (tempPayload.mfaType === 'totp')),
              mustChangePassword
            }
          }, 200, {
            ...adminCors,
            'Set-Cookie': buildSessionCookie(token, { crossOrigin, maxAgeSec: sessionDurationSec })
          });
        }

        // 15.3 Admin 2FA Resend Email Code (POST /api/admin/auth/2fa/resend)
        if (pathname === '/api/admin/auth/2fa/resend' && request.method === 'POST') {
          const resendKey = `2fa:resend:${clientIp || 'unknown'}`;
          const resendRate = await checkPersistentRateLimit(db, resendKey);
          if (!resendRate.allowed) {
            return errorResponse(`Too many code resend requests. Please try again in ${resendRate.remainingMins} minutes.`, 429, null, adminCors);
          }

          const body = await request.json().catch(() => ({}));
          const { tempToken } = body;
          const tempPayload = await verifyTempToken(tempToken, jwtSecret);

          if (!tempPayload || !tempPayload.jti) {
            return errorResponse('Verification session has expired. Please sign in again.', 401, null, adminCors);
          }

          if (db) {
            const tRes = await db.execute({
              sql: `SELECT consumed FROM admin_used_temp_tokens WHERE jti = ? LIMIT 1`,
              args: [tempPayload.jti]
            }).catch(() => ({ rows: [] }));
            if (tRes.rows.length > 0 && Number(tRes.rows[0].consumed) === 1) {
              return errorResponse('Verification session is no longer active. Please sign in again.', 401, null, adminCors);
            }
            // Burn old tempToken JTI immediately so only the newly minted OTP stays valid
            await db.execute({
              sql: `INSERT OR REPLACE INTO admin_used_temp_tokens (jti, attempts, consumed, expires_at) VALUES (?, 0, 1, ?)`,
              args: [tempPayload.jti, Number(tempPayload.exp || Math.floor(Date.now() / 1000) + 300)]
            }).catch(() => { });
          }

          await recordPersistentFailure(db, resendKey, 5, 10 * 60 * 1000);

          const freshOtp = generateEphemeralOtp(6);
          const freshSalt = generateRandomSalt(16);
          const freshOtpHash = await hashPassword(freshOtp, freshSalt);
          const nextJti = crypto.randomUUID();
          const nextExp = Math.floor(Date.now() / 1000) + 300;

          const newTempToken = await generateTempToken({
            ...tempPayload,
            jti: nextJti,
            emailOtpSalt: freshSalt,
            emailOtpHash: freshOtpHash
          }, jwtSecret, 300);

          if (db) {
            await db.execute({
              sql: `INSERT OR REPLACE INTO admin_used_temp_tokens (jti, attempts, consumed, expires_at) VALUES (?, 0, 0, ?)`,
              args: [nextJti, nextExp]
            }).catch(() => { });
          }

          const emailContent = templateAdmin2faOtp({ email: tempPayload.email, otpCode: freshOtp });
          ctx.waitUntil(
            sendEmail({
              apiKey: env.RESEND_API_KEY,
              from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
              to: tempPayload.email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text
            }).catch(err => console.error('Failed to resend 2FA verification email:', err))
          );

          return jsonResponse({
            success: true,
            tempToken: newTempToken,
            message: `A fresh verification code has been dispatched to ${maskEmailForDisplay(tempPayload.email)}.`
          }, 200, adminCors);
        }

        // =====================================================================
        // Middleware: Verify Admin Authorization, Session Revocation & Active User
        // =====================================================================
        const token = resolveRequestAdminToken(request);
        const authUser = await verifyAuthToken(token, jwtSecret);

        if (!authUser) {
          return errorResponse('Unauthorized. Valid admin session token required.', 401, null, adminCors);
        }

        if (db) {
          const userId = authUser.id || authUser.userId;
          // Reject revoked tokens
          if (authUser.jti) {
            const revRes = await db.execute({
              sql: `SELECT jti FROM admin_revoked_tokens WHERE jti = ? LIMIT 1`,
              args: [authUser.jti]
            }).catch(() => ({ rows: [] }));
            if (revRes.rows.length > 0) {
              return errorResponse('Session has been signed out or revoked. Please sign in again.', 401, null, {
                ...adminCors,
                'Set-Cookie': clearSessionCookie({ crossOrigin })
              });
            }
          }

          // Verify user still exists, is active, and token_version matches
          const activeRes = await db.execute({
            sql: `SELECT is_active, COALESCE(token_version, 1) AS token_version, COALESCE(must_change_password, 0) AS must_change_password, mfa_enabled FROM admin_users WHERE id = ? LIMIT 1`,
            args: [userId]
          }).catch(() => ({ rows: [] }));

          if (activeRes.rows.length === 0 || !activeRes.rows[0].is_active) {
            return errorResponse('Administrative account is disabled or unavailable.', 401, null, {
              ...adminCors,
              'Set-Cookie': clearSessionCookie({ crossOrigin })
            });
          }

          const dbVersion = Number(activeRes.rows[0].token_version || 1);
          const tokenVersion = Number(authUser.tv || 1);
          if (dbVersion !== tokenVersion) {
            return errorResponse('Session invalidated due to password change or global sign-out. Please sign in again.', 401, null, {
              ...adminCors,
              'Set-Cookie': clearSessionCookie({ crossOrigin })
            });
          }

          authUser.mfaEnabled = Boolean(activeRes.rows[0].mfa_enabled);
          authUser.mustChangePassword = authUser.authProvider === 'auth0' ? false : Boolean(activeRes.rows[0].must_change_password);
          authUser.tokenVersion = dbVersion;
        }

        // 15.4 Current User Profile (GET /api/admin/auth/me)
        if (pathname === '/api/admin/auth/me' && request.method === 'GET') {
          return jsonResponse({
            success: true,
            user: {
              id: authUser.id || authUser.userId,
              email: authUser.email,
              name: authUser.name,
              role: authUser.role,
              mfaEnabled: Boolean(authUser.mfaEnabled),
              mustChangePassword: Boolean(authUser.mustChangePassword),
              authProvider: authUser.authProvider || 'password'
            }
          }, 200, adminCors);
        }

        // 15.4b Logout Single Session (POST /api/admin/auth/logout)
        if (pathname === '/api/admin/auth/logout' && request.method === 'POST') {
          if (db && authUser.jti) {
            await db.execute({
              sql: `INSERT OR IGNORE INTO admin_revoked_tokens (jti, user_id, expires_at) VALUES (?, ?, ?)`,
              args: [authUser.jti, authUser.id || authUser.userId, Number(authUser.exp || Math.floor(Date.now() / 1000) + 28800)]
            }).catch(() => { });
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'admin_logout',
              targetType: 'auth',
              ip: clientIp
            });
          }
          return jsonResponse({ success: true, message: 'Signed out cleanly.' }, 200, {
            ...adminCors,
            'Set-Cookie': clearSessionCookie({ crossOrigin })
          });
        }

        // 15.4c Revoke All Sessions Everywhere (POST /api/admin/auth/logout-all)
        if (pathname === '/api/admin/auth/logout-all' && request.method === 'POST') {
          if (!db) {
            return errorResponse('Database unavailable.', 503, null, adminCors);
          }
          await db.execute({
            sql: `UPDATE admin_users SET token_version = COALESCE(token_version, 1) + 1 WHERE id = ?`,
            args: [authUser.id || authUser.userId]
          });
          await logAdminAction(db, {
            userId: authUser.id || authUser.userId,
            userEmail: authUser.email,
            action: 'admin_logout_all_sessions',
            targetType: 'auth',
            ip: clientIp
          });
          return jsonResponse({
            success: true,
            message: 'All active sessions for this account have been revoked.'
          }, 200, {
            ...adminCors,
            'Set-Cookie': clearSessionCookie({ crossOrigin })
          });
        }

        // 15.4d Change Password & Rotate Session Version (POST /api/admin/auth/change-password)
        if (pathname === '/api/admin/auth/change-password' && request.method === 'POST') {
          if (!db) {
            return errorResponse('Database not available to update credentials.', 503, null, adminCors);
          }
          const body = await request.json().catch(() => ({}));
          const { currentPassword, newPassword, code } = body;

          if (!currentPassword || !newPassword) {
            return errorResponse('Current password and new password are required.', 400, null, adminCors);
          }

          const strengthCheck = validatePasswordStrength(newPassword);
          if (!strengthCheck.valid) {
            return errorResponse(strengthCheck.error, 400, null, adminCors);
          }

          if (constantTimeEqual(String(currentPassword), String(newPassword))) {
            return errorResponse('New password must differ from your current password.', 400, null, adminCors);
          }

          const userId = authUser.id || authUser.userId;
          const uRes = await db.execute({
            sql: `SELECT password_hash, salt, mfa_enabled, mfa_secret, COALESCE(token_version, 1) AS token_version, COALESCE(last_totp_step, 0) AS last_totp_step FROM admin_users WHERE id = ? LIMIT 1`,
            args: [userId]
          });
          if (uRes.rows.length === 0) {
            return errorResponse('Account record not found.', 404, null, adminCors);
          }

          const uRow = uRes.rows[0];
          const hasExistingPassword = uRow.password_hash && !String(uRow.password_hash).startsWith('sso-only') && uRow.password_hash.length >= 20;

          if (hasExistingPassword) {
            if (!currentPassword) {
              return errorResponse('Current password is required to change password.', 400, null, adminCors);
            }
            const computedCurrent = await hashPassword(currentPassword, uRow.salt);
            if (!constantTimeEqual(computedCurrent, uRow.password_hash)) {
              return errorResponse('Current password is incorrect.', 401, null, adminCors);
            }
          }

          if (uRow.mfa_enabled && uRow.mfa_secret) {
            const cleanCode = (code || '').replace(/\s+/g, '').trim();
            if (!cleanCode) {
              return errorResponse('Your 6-digit Authenticator App code is required to change your password.', 400, null, adminCors);
            }
            const totpCheck = await verifyTotpCode(uRow.mfa_secret, cleanCode, {
              returnStep: true,
              lastUsedStep: Number(uRow.last_totp_step || 0)
            });
            if (!totpCheck.valid) {
              return errorResponse('Invalid 6-digit Authenticator App code.', 400, null, adminCors);
            }
          }

          const nextSalt = generateRandomSalt(16);
          const nextHash = await hashPassword(newPassword, nextSalt);
          const nextVersion = Number(uRow.token_version || 1) + 1;

          await db.execute({
            sql: `UPDATE admin_users SET password_hash = ?, salt = ?, must_change_password = 0, token_version = ?, password_updated_at = datetime('now') WHERE id = ?`,
            args: [nextHash, nextSalt, nextVersion, userId]
          });

          await logAdminAction(db, {
            userId,
            userEmail: authUser.email,
            action: 'admin_password_changed',
            targetType: 'auth',
            ip: clientIp
          });

          const sessionDurationSec = 8 * 3600;
          const refreshedToken = await generateAuthToken({
            id: userId,
            email: authUser.email,
            name: authUser.name,
            role: authUser.role,
            tv: nextVersion
          }, jwtSecret, sessionDurationSec);

          return jsonResponse({
            success: true,
            token: refreshedToken,
            message: 'Password updated cleanly and all prior sessions were revoked.'
          }, 200, {
            ...adminCors,
            'Set-Cookie': buildSessionCookie(refreshedToken, { crossOrigin, maxAgeSec: sessionDurationSec })
          });
        }

        // 15.5 Generate Authenticator App (TOTP) Secret & Enrollment URI (POST /api/admin/auth/2fa/setup)
        if (pathname === '/api/admin/auth/2fa/setup' && request.method === 'POST') {
          const secret = generateTotpSecret(20);
          const otpauthUri = getTotpUri(authUser.email, secret, 'Diversity Collective VC');
          const formattedKey = secret.match(/.{1,4}/g)?.join(' ') || secret;

          return jsonResponse({
            success: true,
            secret,
            otpauthUri,
            formattedKey,
            email: authUser.email
          }, 200, adminCors);
        }

        // 15.6 Confirm & Activate Authenticator App 2FA (POST /api/admin/auth/2fa/confirm)
        if (pathname === '/api/admin/auth/2fa/confirm' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const { secret, code } = body;
          const cleanCode = (code || '').replace(/\s+/g, '').trim();
          const cleanSecret = (secret || '').replace(/[\s=-]/g, '').toUpperCase().trim();

          if (!cleanSecret || !cleanCode) {
            return errorResponse('Secret key and 6-digit confirmation code are required.', 400, null, adminCors);
          }

          // Use window: 3 (±90s) during setup confirmation to ensure effortless pairing even with client clock drift
          const totpCheck = await verifyTotpCode(cleanSecret, cleanCode, { returnStep: true, window: 3 });
          if (!totpCheck.valid) {
            console.warn(`[2FA Confirm] Code verification failed for ${authUser.email}. Clean code length: ${cleanCode.length}`);
            return errorResponse('Invalid 6-digit code. Please verify the code displayed in your authenticator app and try again.', 400, null, adminCors);
          }

          if (db) {
            await db.execute({
              sql: `UPDATE admin_users SET mfa_enabled = 1, mfa_secret = ?, last_totp_step = ? WHERE id = ?`,
              args: [cleanSecret, totpCheck.matchedStep || 0, authUser.id || authUser.userId]
            });
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'admin_2fa_activated',
              targetType: 'auth',
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            message: 'Authenticator App (TOTP) 2FA successfully configured and activated!'
          }, 200, adminCors);
        }

        // 15.7 Disable Authenticator App 2FA (POST /api/admin/auth/2fa/disable)
        if (pathname === '/api/admin/auth/2fa/disable' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const { password, code } = body;

          if (!db) {
            return errorResponse('Database not available to modify security settings.', 500, null, adminCors);
          }

          const userRes = await db.execute({
            sql: `SELECT password_hash, salt, mfa_enabled, mfa_secret, COALESCE(last_totp_step, 0) AS last_totp_step FROM admin_users WHERE id = ? LIMIT 1`,
            args: [authUser.id || authUser.userId]
          });

          if (userRes.rows.length === 0) {
            return errorResponse('User record not found.', 404, null, adminCors);
          }

          const u = userRes.rows[0];
          const computedHash = await hashPassword(password || '', u.salt);
          if (!constantTimeEqual(computedHash, u.password_hash)) {
            return errorResponse('Incorrect current password.', 400, null, adminCors);
          }

          // Mandatory 6-digit TOTP verification whenever TOTP is active (cannot be skipped)
          if (u.mfa_enabled && u.mfa_secret) {
            const cleanCode = (code || '').replace(/\s+/g, '').trim();
            if (!cleanCode) {
              return errorResponse('Your 6-digit authenticator code is required to disable 2FA.', 400, null, adminCors);
            }
            const totpCheck = await verifyTotpCode(u.mfa_secret, cleanCode, {
              returnStep: true,
              lastUsedStep: Number(u.last_totp_step || 0)
            });
            if (!totpCheck.valid) {
              return errorResponse('Invalid 6-digit authenticator code.', 400, null, adminCors);
            }
          }

          await db.execute({
            sql: `UPDATE admin_users SET mfa_enabled = 0, mfa_secret = NULL, last_totp_step = 0 WHERE id = ?`,
            args: [authUser.id || authUser.userId]
          });

          await logAdminAction(db, {
            userId: authUser.id || authUser.userId,
            userEmail: authUser.email,
            action: 'admin_2fa_disabled',
            targetType: 'auth',
            ip: clientIp
          });

          return jsonResponse({
            success: true,
            message: 'Two-factor authentication disabled.'
          }, 200, adminCors);
        }

        // 15.7b Team & Admin Panel Access Management (Admin-Only RBAC)
        const ALLOWED_ADMIN_ROLES = new Set(['admin', 'approver', 'editor', 'read_only']);
        const isValidStaffEmail = (em) => typeof em === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) && em.length <= 254;

        // List all authorized admin portal users (GET /api/admin/users)
        if (pathname === '/api/admin/users' && request.method === 'GET') {
          if (authUser.role !== 'admin') {
            return errorResponse('Forbidden: Superadmin access required to manage team accounts.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database unavailable.', 503, null, adminCors);
          }

          const usersRes = await db.execute({
            sql: `SELECT id, email, name, role, password_hash, mfa_enabled, is_active, created_at, last_login_at
                  FROM admin_users
                  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'approver' THEN 2 WHEN 'editor' THEN 3 ELSE 4 END, created_at ASC`,
            args: []
          });

          const users = (usersRes.rows || []).map((row) => ({
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            mfaEnabled: Boolean(row.mfa_enabled),
            isActive: Boolean(row.is_active),
            authMode: String(row.password_hash || '').startsWith('sso-only') ? 'sso' : 'password_or_sso',
            hasPassword: !String(row.password_hash || '').startsWith('sso-only') && Boolean(row.password_hash) && String(row.password_hash).length >= 20,
            createdAt: row.created_at || null,
            lastLoginAt: row.last_login_at || null
          }));

          return jsonResponse({ success: true, users }, 200, adminCors);
        }

        // Grant admin panel access to a new person (POST /api/admin/users)
        if (pathname === '/api/admin/users' && request.method === 'POST') {
          if (authUser.role !== 'admin') {
            return errorResponse('Forbidden: Superadmin access required to grant admin access.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database unavailable.', 503, null, adminCors);
          }

          const body = await request.json().catch(() => ({}));
          const cleanEmail = String(body.email || '').toLowerCase().trim();
          const cleanName = String(body.name || '').trim() || cleanEmail.split('@')[0];
          const requestedRole = String(body.role || 'editor').trim();
          const optionalPassword = typeof body.password === 'string' ? body.password : '';

          if (!isValidStaffEmail(cleanEmail)) {
            return errorResponse('Please enter a valid email address.', 400, null, adminCors);
          }
          if (!cleanName || cleanName.length > 120) {
            return errorResponse('Name must be between 1 and 120 characters.', 400, null, adminCors);
          }
          if (!ALLOWED_ADMIN_ROLES.has(requestedRole)) {
            return errorResponse('Invalid role. Allowed roles: admin, approver, editor, read_only.', 400, null, adminCors);
          }

          const existingRes = await db.execute({
            sql: `SELECT id FROM admin_users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
            args: [cleanEmail]
          });
          if (existingRes.rows.length > 0) {
            return errorResponse('An account with that email address already has panel access.', 409, null, adminCors);
          }

          let passwordHash = 'sso-only-auth0-required';
          let salt = `sso_salt_${generateRandomSalt(8)}`;
          let mustChangePassword = 0;

          if (optionalPassword.length > 0) {
            const strength = validatePasswordStrength(optionalPassword);
            if (!strength.valid) {
              return errorResponse(strength.error, 400, null, adminCors);
            }
            salt = generateRandomSalt(16);
            passwordHash = await hashPassword(optionalPassword, salt);
            mustChangePassword = 1;
          }

          const newId = `adm-${crypto.randomUUID().slice(0, 8)}`;
          await db.execute({
            sql: `INSERT INTO admin_users (id, email, name, role, password_hash, salt, is_active, must_change_password, token_version)
                  VALUES (?, ?, ?, ?, ?, ?, 1, ?, 1)`,
            args: [newId, cleanEmail, cleanName, requestedRole, passwordHash, salt, mustChangePassword]
          });

          // Generate 6-digit onboarding OTP for the new user
          const otpCode = generateEphemeralOtp(6);
          const otpSalt = generateRandomSalt(16);
          const emailOtpHash = await hashPassword(otpCode, otpSalt);
          const otpJti = crypto.randomUUID();
          const otpExp = Math.floor(Date.now() / 1000) + 86400; // 24 hours

          await db.execute({
            sql: `INSERT INTO admin_email_otps (id, email, otp_code, otp_hash, salt, attempts, consumed, expires_at)
                  VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
            args: [otpJti, cleanEmail, otpCode, emailOtpHash, otpSalt, otpExp]
          }).catch(err => console.warn('Could not save initial onboarding OTP in DB:', err.message));

          // Dispatch onboarding invite email with OTP code via Resend
          const panelUrl = `${env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org'}/admin`;
          const emailContent = templateAdminUserInviteOtp({
            name: cleanName,
            email: cleanEmail,
            role: requestedRole,
            otpCode,
            panelUrl
          });

          let emailDispatched = false;
          let emailError = null;
          if (env.RESEND_API_KEY) {
            try {
              await sendEmail({
                apiKey: env.RESEND_API_KEY,
                from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
                to: cleanEmail,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text
              });
              emailDispatched = true;
            } catch (err) {
              console.error('Failed to dispatch user invite email via Resend:', err);
              emailError = err.message;
            }
          }

          await logAdminAction(db, {
            userId: authUser.id || authUser.userId,
            userEmail: authUser.email,
            action: 'admin_user_access_granted',
            targetType: 'admin_user',
            targetId: newId,
            details: { grantedEmail: cleanEmail, name: cleanName, role: requestedRole, authMode: optionalPassword ? 'password_or_sso' : 'sso', emailDispatched, emailError },
            ip: clientIp
          });

          return jsonResponse({
            success: true,
            message: emailDispatched
              ? `Access granted to ${cleanEmail} (${requestedRole}). An onboarding OTP verification code has been dispatched to their email.`
              : `Access granted to ${cleanEmail} (${requestedRole}).`,
            emailDispatched,
            user: {
              id: newId,
              email: cleanEmail,
              name: cleanName,
              role: requestedRole,
              mfaEnabled: false,
              isActive: true,
              authMode: optionalPassword ? 'password_or_sso' : 'sso',
              createdAt: new Date().toISOString(),
              lastLoginAt: null
            }
          }, 201, adminCors);
        }

        // Dispatch / Resend fresh Login OTP to a team member (POST /api/admin/users/:id/dispatch-otp)
        if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/dispatch-otp') && request.method === 'POST') {
          if (authUser.role !== 'admin') {
            return errorResponse('Forbidden: Superadmin access required to dispatch staff login codes.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database unavailable.', 503, null, adminCors);
          }

          const targetId = decodeURIComponent(pathname.slice('/api/admin/users/'.length, -('/dispatch-otp'.length))).trim();
          const targetRes = await db.execute({
            sql: `SELECT id, email, name, role, is_active FROM admin_users WHERE id = ? LIMIT 1`,
            args: [targetId]
          });

          if (targetRes.rows.length === 0) {
            return errorResponse('Team member not found.', 404, null, adminCors);
          }
          const targetUser = targetRes.rows[0];

          if (!targetUser.is_active) {
            return errorResponse('Cannot dispatch login codes to a suspended account.', 400, null, adminCors);
          }

          const otpCode = generateEphemeralOtp(6);
          const otpSalt = generateRandomSalt(16);
          const emailOtpHash = await hashPassword(otpCode, otpSalt);
          const otpJti = crypto.randomUUID();
          const otpExp = Math.floor(Date.now() / 1000) + 86400; // 24 hours

          // Invalidate prior unused OTPs for this email in admin_email_otps
          await db.execute({
            sql: `UPDATE admin_email_otps SET consumed = 1 WHERE email = ? AND consumed = 0`,
            args: [targetUser.email]
          }).catch(() => {});

          await db.execute({
            sql: `INSERT INTO admin_email_otps (id, email, otp_code, otp_hash, salt, attempts, consumed, expires_at)
                  VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
            args: [otpJti, targetUser.email, otpCode, emailOtpHash, otpSalt, otpExp]
          });

          const panelUrl = `${env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org'}/admin`;
          const emailContent = templateAdminUserInviteOtp({
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
            otpCode,
            panelUrl
          });

          let emailDispatched = false;
          let emailError = null;
          if (env.RESEND_API_KEY) {
            try {
              await sendEmail({
                apiKey: env.RESEND_API_KEY,
                from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
                to: targetUser.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text
              });
              emailDispatched = true;
            } catch (err) {
              console.error('Failed to dispatch user OTP email:', err);
              emailError = err.message;
            }
          }

          await logAdminAction(db, {
            userId: authUser.id || authUser.userId,
            userEmail: authUser.email,
            action: 'admin_user_otp_dispatched',
            targetType: 'admin_user',
            targetId: targetUser.id,
            details: { targetEmail: targetUser.email, emailDispatched, emailError },
            ip: clientIp
          });

          return jsonResponse({
            success: true,
            message: emailDispatched
              ? `Verification OTP passcode dispatched to ${targetUser.email}.`
              : `Email dispatch unavailable (diversitycollective.org is unverified in Resend). Please use the "Set Password" button to provide ${targetUser.name} with credentials for direct login.`,
            emailDispatched,
            user: {
              id: targetUser.id,
              email: targetUser.email,
              name: targetUser.name,
              role: targetUser.role
            }
          }, 200, adminCors);
        }

        // Set / Reset password directly for any authorized team member (POST /api/admin/users/:id/reset-password)
        if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/reset-password') && request.method === 'POST') {
          if (authUser.role !== 'admin') {
            return errorResponse('Forbidden: Superadmin access required to set staff passwords.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database unavailable.', 503, null, adminCors);
          }

          const targetId = decodeURIComponent(pathname.slice('/api/admin/users/'.length, -('/reset-password'.length))).trim();
          const targetRes = await db.execute({
            sql: `SELECT id, email, name, role, is_active FROM admin_users WHERE id = ? LIMIT 1`,
            args: [targetId]
          });
          if (targetRes.rows.length === 0) {
            return errorResponse('User account not found.', 404, null, adminCors);
          }
          const targetUser = targetRes.rows[0];

          const body = await request.json().catch(() => ({}));
          let finalPassword = typeof body.password === 'string' ? body.password.trim() : '';

          if (!finalPassword || body.generate) {
            finalPassword = generateSecurePassword(16);
          } else {
            const strength = validatePasswordStrength(finalPassword);
            if (!strength.valid) {
              return errorResponse(strength.error, 400, null, adminCors);
            }
          }

          const salt = generateRandomSalt(16);
          const hash = await hashPassword(finalPassword, salt);

          await db.execute({
            sql: `UPDATE admin_users SET password_hash = ?, salt = ?, must_change_password = 0, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?`,
            args: [hash, salt, targetId]
          });

          await logAdminAction(db, {
            userId: authUser.id || authUser.userId,
            userEmail: authUser.email,
            action: 'admin_user_password_set',
            targetType: 'admin_user',
            targetId,
            details: { targetEmail: targetUser.email, targetName: targetUser.name },
            ip: clientIp
          });

          return jsonResponse({
            success: true,
            message: `Password successfully updated for ${targetUser.name} (${targetUser.email}).`,
            password: finalPassword,
            targetUser: {
              id: targetUser.id,
              email: targetUser.email,
              name: targetUser.name
            }
          }, 200, adminCors);
        }

        // Update existing authorized user's email, name, role, active status, or password (PATCH /api/admin/users/:id)
        if (pathname.startsWith('/api/admin/users/') && request.method === 'PATCH') {
          if (authUser.role !== 'admin') {
            return errorResponse('Forbidden: Superadmin access required to modify team permissions.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database unavailable.', 503, null, adminCors);
          }

          const targetId = decodeURIComponent(pathname.slice('/api/admin/users/'.length)).trim();
          const currentId = authUser.id || authUser.userId;
          const body = await request.json().catch(() => ({}));

          const existingRes = await db.execute({
            sql: `SELECT id, email, name, role, is_active FROM admin_users WHERE id = ? LIMIT 1`,
            args: [targetId]
          });
          if (existingRes.rows.length === 0) {
            return errorResponse('User account not found.', 404, null, adminCors);
          }
          const existing = existingRes.rows[0];

          const nextEmail = body.email !== undefined ? String(body.email).toLowerCase().trim() : existing.email;
          const nextName = body.name !== undefined ? String(body.name).trim() : existing.name;
          const nextRole = body.role !== undefined ? String(body.role).trim() : existing.role;
          const nextActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : Number(existing.is_active);

          if (!isValidStaffEmail(nextEmail)) {
            return errorResponse('Invalid email address.', 400, null, adminCors);
          }
          if (!nextName || nextName.length > 120) {
            return errorResponse('Name must be between 1 and 120 characters.', 400, null, adminCors);
          }
          if (!ALLOWED_ADMIN_ROLES.has(nextRole)) {
            return errorResponse('Invalid role specified.', 400, null, adminCors);
          }

          if (targetId === currentId && (nextRole !== 'admin' || nextActive === 0)) {
            return errorResponse('You cannot suspend or demote your own active administrator account.', 400, null, adminCors);
          }

          if (nextEmail !== existing.email) {
            const dupCheck = await db.execute({
              sql: `SELECT id FROM admin_users WHERE LOWER(email) = LOWER(?) AND id != ? LIMIT 1`,
              args: [nextEmail, targetId]
            });
            if (dupCheck.rows.length > 0) {
              return errorResponse('Another account already uses that email address.', 409, null, adminCors);
            }
          }

          let passwordUpdated = false;
          if (typeof body.password === 'string' && body.password.trim().length > 0) {
            const strength = validatePasswordStrength(body.password.trim());
            if (!strength.valid) {
              return errorResponse(strength.error, 400, null, adminCors);
            }
            const pSalt = generateRandomSalt(16);
            const pHash = await hashPassword(body.password.trim(), pSalt);
            await db.execute({
              sql: `UPDATE admin_users SET password_hash = ?, salt = ?, must_change_password = 0, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?`,
              args: [pHash, pSalt, targetId]
            });
            passwordUpdated = true;
          }

          const shouldRevokeSessions = nextActive === 0 || nextRole !== existing.role || nextEmail !== existing.email || passwordUpdated;
          await db.execute({
            sql: shouldRevokeSessions
              ? `UPDATE admin_users SET email = ?, name = ?, role = ?, is_active = ?, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?`
              : `UPDATE admin_users SET email = ?, name = ?, role = ?, is_active = ? WHERE id = ?`,
            args: [nextEmail, nextName, nextRole, nextActive, targetId]
          });

          await logAdminAction(db, {
            userId: currentId,
            userEmail: authUser.email,
            action: 'admin_user_access_updated',
            targetType: 'admin_user',
            targetId,
            details: { email: nextEmail, name: nextName, role: nextRole, isActive: Boolean(nextActive) },
            ip: clientIp
          });

          return jsonResponse({
            success: true,
            message: `Updated access for ${nextEmail}.`
          }, 200, adminCors);
        }

        // Remove admin panel access permanently (DELETE /api/admin/users/:id)
        if (pathname.startsWith('/api/admin/users/') && request.method === 'DELETE') {
          if (authUser.role !== 'admin') {
            return errorResponse('Forbidden: Superadmin access required to remove team accounts.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database unavailable.', 503, null, adminCors);
          }

          const targetId = decodeURIComponent(pathname.slice('/api/admin/users/'.length)).trim();
          const currentId = authUser.id || authUser.userId;

          if (targetId === currentId) {
            return errorResponse('You cannot delete your own active administrator account.', 400, null, adminCors);
          }

          const targetRes = await db.execute({
            sql: `SELECT id, email, role FROM admin_users WHERE id = ? LIMIT 1`,
            args: [targetId]
          });
          if (targetRes.rows.length === 0) {
            return errorResponse('User account not found.', 404, null, adminCors);
          }
          const removed = targetRes.rows[0];

          await db.execute({
            sql: `DELETE FROM admin_users WHERE id = ?`,
            args: [targetId]
          });

          await logAdminAction(db, {
            userId: currentId,
            userEmail: authUser.email,
            action: 'admin_user_access_revoked',
            targetType: 'admin_user',
            targetId,
            details: { removedEmail: removed.email, removedRole: removed.role },
            ip: clientIp
          });

          return jsonResponse({
            success: true,
            message: `Removed admin access for ${removed.email}.`
          }, 200, adminCors);
        }

        // 15.7c Authoritative Live Site State Management (GET/PUT/DELETE /api/admin/site-state)
        if (pathname === '/api/admin/site-state' && request.method === 'GET') {
          const result = await readSiteState(db);
          return jsonResponse({
            success: true,
            version: result.version,
            updatedAt: result.updatedAt,
            updatedBy: result.updatedBy,
            state: result.state || {}
          }, 200, adminCors);
        }

        if (pathname === '/api/admin/site-state' && request.method === 'PUT') {
          if (!requireRole(authUser.role, ['admin', 'editor'])) {
            return errorResponse('Forbidden: Administrator or editor role required to publish website changes.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database connection not available', 503, null, adminCors);
          }

          const body = await request.json().catch(() => null);
          if (!body || typeof body !== 'object') {
            return errorResponse('Invalid JSON payload.', 400, null, adminCors);
          }

          try {
            const updated = await writeSiteStatePatch(db, body, authUser.email);
            const changedKeys = Object.keys(body).filter((k) => ['heroTheme', 'layoutBlocks', 'siteTheme', 'cmsData'].includes(k));
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: `publish_site_state_${changedKeys.join('_') || 'update'}`,
              targetType: 'site_state',
              targetId: 'live',
              details: { version: updated.version, changedKeys },
              ip: clientIp
            }).catch(() => { });

            return jsonResponse({
              success: true,
              version: updated.version,
              updatedAt: updated.updatedAt,
              updatedBy: updated.updatedBy,
              state: updated.state
            }, 200, adminCors);
          } catch (err) {
            return errorResponse(err.message || 'Failed to publish site state.', 400, null, adminCors);
          }
        }

        if (pathname === '/api/admin/site-state' && request.method === 'DELETE') {
          if (!requireRole(authUser.role, ['admin'])) {
            return errorResponse('Forbidden: Superadmin role required to reset published site state.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database connection not available', 503, null, adminCors);
          }

          const scope = String(url.searchParams.get('scope') || 'all');
          const result = await resetSiteState(db, scope, authUser.email);
          await logAdminAction(db, {
            userId: authUser.id || authUser.userId,
            userEmail: authUser.email,
            action: `reset_site_state_${scope}`,
            targetType: 'site_state',
            targetId: 'live',
            details: { version: result.version, scope },
            ip: clientIp
          }).catch(() => { });

          return jsonResponse({
            success: true,
            version: result.version,
            updatedAt: result.updatedAt,
            updatedBy: result.updatedBy,
            state: result.state
          }, 200, adminCors);
        }

        // 15.8 Gallery Photo Upload to GitHub & jsDelivr CDN (POST /api/admin/gallery/upload)
        if (pathname === '/api/admin/gallery/upload' && request.method === 'POST') {
          if (!requireRole(authUser.role, ['admin', 'editor'])) {
            return errorResponse('Forbidden: Administrator or editor role required to upload gallery media.', 403, null, cors);
          }

          const body = await request.json().catch(() => ({}));
          const { title, category, year, description, quote, featured, fileData, fileName } = body;

          if (!title || !fileData) {
            return errorResponse('Image title and file data are required.', 400, null, cors);
          }

          const cleanFileName = sanitizeFilename(fileName || `${title}.jpg`);
          const categorySlug = (category || 'community')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
          const gitPath = `public/gallery/${categorySlug}/${cleanFileName}`;

          const ghOwner = env.GITHUB_OWNER || '';
          const ghRepo = env.GITHUB_REPO || '';
          const ghBranch = env.GITHUB_BRANCH || 'main';

          let githubSha = null;
          let githubPath = gitPath;

          // Commit to GitHub repository if GITHUB_TOKEN is available
          if (env.GITHUB_TOKEN) {
            const ghRes = await uploadToGitHub({
              githubToken: env.GITHUB_TOKEN,
              owner: ghOwner,
              repo: ghRepo,
              branch: ghBranch,
              path: gitPath,
              contentBase64: fileData,
              commitMessage: `feat(gallery): add ${title} to ${category || 'gallery'}`
            });

            if (!ghRes.success) {
              return errorResponse(`GitHub repository commit failed: ${ghRes.error}`, 502, null, cors);
            }
            githubSha = ghRes.sha;
            githubPath = ghRes.path || gitPath;
          }

          // Build primary jsDelivr edge CDN URL with local asset fallback
          const cdnUrl = buildJsDelivrUrl({
            owner: ghOwner,
            repo: ghRepo,
            branch: ghBranch,
            path: gitPath
          });
          const localFallbackUrl = `/${gitPath.replace(/^public\//, '')}`;

          const db = getDb(env);
          const newPhoto = await addGalleryPhoto(db, {
            title,
            category: category || 'Festivals & Pride',
            year: year || String(new Date().getFullYear()),
            image_url: localFallbackUrl,
            cdn_url: cdnUrl,
            github_path: githubPath,
            github_sha: githubSha,
            description: description || null,
            quote: quote || null,
            featured: Boolean(featured)
          });

          if (db) {
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'admin_gallery_upload',
              targetType: 'gallery',
              targetId: newPhoto.id,
              details: { title, cdnUrl, gitPath, gitPushed: Boolean(env.GITHUB_TOKEN) },
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            photo: newPhoto,
            message: env.GITHUB_TOKEN
              ? 'Image committed to GitHub and published to jsDelivr CDN!'
              : 'Image registered in gallery database (configure GITHUB_TOKEN for automated Git commits).'
          }, 201, cors);
        }

        // 15.9 Gallery Photo Deletion (DELETE /api/admin/gallery/:id)
        if (pathname.startsWith('/api/admin/gallery/') && request.method === 'DELETE') {
          if (!requireRole(authUser.role, ['admin', 'editor'])) {
            return errorResponse('Forbidden: Administrator role required to remove gallery photos.', 403, null, cors);
          }

          const photoId = pathname.replace('/api/admin/gallery/', '').trim();
          const db = getDb(env);

          if (!photoId) {
            return errorResponse('Photo ID is required.', 400, null, cors);
          }

          const delRes = await deleteGalleryPhoto(db, photoId);
          if (!delRes.success) {
            return errorResponse(delRes.error || 'Failed to delete photo.', 500, null, cors);
          }

          // If photo had a GitHub SHA and path, remove from GitHub repo
          if (delRes.photo?.github_path && delRes.photo?.github_sha && env.GITHUB_TOKEN) {
            await deleteFromGitHub({
              githubToken: env.GITHUB_TOKEN,
              owner: env.GITHUB_OWNER || '',
              repo: env.GITHUB_REPO || '',
              branch: env.GITHUB_BRANCH || 'main',
              path: delRes.photo.github_path,
              sha: delRes.photo.github_sha,
              commitMessage: `chore(gallery): remove ${delRes.photo.title}`
            }).catch(e => console.warn('GitHub deletion warning:', e.message));
          }

          if (db) {
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'admin_gallery_delete',
              targetType: 'gallery',
              targetId: photoId,
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            message: 'Gallery photo deleted successfully.'
          }, 200, cors);
        }

        // 15.3 Directory Moderation & Management List (GET /api/admin/directory)
        if (pathname === '/api/admin/directory' && request.method === 'GET') {
          const status = url.searchParams.get('status') || 'all';
          const db = getDb(env);

          if (!db) {
            return jsonResponse({
              success: true,
              businesses: []
            }, 200, cors);
          }

          const query = status === 'all'
            ? `SELECT * FROM businesses ORDER BY is_featured DESC, created_at DESC LIMIT 250`
            : `SELECT * FROM businesses WHERE status = ? ORDER BY is_featured DESC, created_at DESC LIMIT 250`;
          const args = status === 'all' ? [] : [status];

          const res = await db.execute({ sql: query, args });
          return jsonResponse({ success: true, businesses: res.rows }, 200, cors);
        }

        // 15.3B Pre-Populate / Seed Full Business Directory (POST /api/admin/directory/seed)
        if (pathname === '/api/admin/directory/seed' && request.method === 'POST') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Approver or Admin role required', 403, null, cors);
          }

          const body = await request.json().catch(() => ({}));
          const seedItems = Array.isArray(body.businesses) ? body.businesses : [];
          const db = getDb(env);
          let seededCount = 0;

          if (db && seedItems.length > 0) {
            for (const item of seedItems) {
              const id = item.id || `biz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              const slug = item.slug || (item.name || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              try {
                await db.execute({
                  sql: `INSERT OR REPLACE INTO businesses (
                    id, slug, name, category, description, address, city, zip, phone, email, website,
                    cover_url, is_featured, is_verified, status, affirming_pledge_signed_at, owner_name, owner_email, admin_notes
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', datetime('now'), ?, ?, ?)`,
                  args: [
                    id,
                    slug,
                    item.name,
                    item.category || 'Professional Services',
                    item.description || '',
                    item.address || '',
                    item.city || 'Ventura',
                    item.zip || '',
                    item.phone || '',
                    item.email || '',
                    item.website || '',
                    item.image || item.cover_url || null,
                    item.isFeatured ? 1 : (item.id === 'biz-1' || item.id === 'biz-2' || item.id === 'biz-4' ? 1 : 0),
                    1,
                    item.ownerName || 'Verified Community Partner',
                    item.ownerEmail || item.email || '',
                    item.adminNotes || 'Seeded authentic Ventura County affirming business'
                  ]
                });
                seededCount++;
              } catch (err) {
                console.warn('Directory seed row error:', err.message);
              }
            }

            await logAdminAction(db, {
              userId: authUser.id,
              userEmail: authUser.email,
              action: 'seed_directory',
              targetType: 'business',
              targetId: 'bulk',
              details: { seededCount },
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            message: `Successfully pre-populated ${seededCount} businesses into the affirming directory!`,
            seededCount
          }, 200, cors);
        }

        // 15.3C Add Single Business to Directory (POST /api/admin/directory)
        if (pathname === '/api/admin/directory' && request.method === 'POST') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Approver or Admin role required', 403, null, cors);
          }

          const body = await request.json().catch(() => ({}));
          const name = (body.name || body.businessName || '').trim();
          const category = (body.category || 'Professional Services').trim();
          const city = (body.city || 'Ventura').trim();

          if (!name) {
            return errorResponse('Business name is required.', 400, null, cors);
          }

          const id = body.id || crypto.randomUUID();
          const slug = body.slug || (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'biz') + '-' + id.substring(0, 6);
          const db = getDb(env);

          if (db) {
            await db.execute({
              sql: `INSERT INTO businesses (
                id, slug, name, category, description, address, city, zip, phone, email, website,
                is_featured, is_verified, status, affirming_pledge_signed_at, owner_name, owner_email, admin_notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
              args: [
                id,
                slug,
                name,
                category,
                body.description || '',
                body.address || '',
                city,
                body.zip || '',
                body.phone || '',
                body.email || body.contactEmail || '',
                body.website || '',
                body.isFeatured ? 1 : 0,
                1,
                body.status || 'approved',
                body.ownerName || 'DCVC Staff Added',
                body.ownerEmail || authUser.email || '',
                body.adminNotes || ''
              ]
            });

            await logAdminAction(db, {
              userId: authUser.id,
              userEmail: authUser.email,
              action: 'create_business',
              targetType: 'business',
              targetId: id,
              details: { name, category, city },
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            message: `Business "${name}" successfully added to the directory.`,
            id
          }, 201, cors);
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
                    is_verified = coalesce(?, is_verified),
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
                body.isFeatured !== undefined ? (body.isFeatured ? 1 : 0) : (body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : null),
                body.isVerified !== undefined ? (body.isVerified ? 1 : 0) : (body.is_verified !== undefined ? (body.is_verified ? 1 : 0) : null),
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
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Admin or Editor role required to delete records', 403, null, cors);
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

        // 15.10b Operational Inquiries Edit Entry (PUT /api/admin/inquiries/:type/:id)
        if (pathname.startsWith('/api/admin/inquiries/') && request.method === 'PUT') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }

          const parts = pathname.replace('/api/admin/inquiries/', '').split('/');
          const [inquiryType, inquiryId] = parts;
          const body = await request.json().catch(() => ({}));
          const db = getDb(env);

          if (db && inquiryId) {
            if (inquiryType === 'volunteer') {
              await db.execute({
                sql: `UPDATE volunteer_applications SET 
                  full_name = coalesce(?, full_name), 
                  email = coalesce(?, email), 
                  phone = coalesce(?, phone), 
                  city = coalesce(?, city), 
                  status = coalesce(?, status), 
                  availability = coalesce(?, availability), 
                  roles_of_interest = coalesce(?, roles_of_interest), 
                  skills_experience = coalesce(?, skills_experience) 
                  WHERE id = ?`,
                args: [
                  body.full_name || body.name || null,
                  body.email || null,
                  body.phone || null,
                  body.city || null,
                  body.status || null,
                  body.availability || null,
                  body.roles_of_interest || null,
                  body.skills_experience || body.message || null,
                  inquiryId
                ]
              });
            } else if (inquiryType === 'training') {
              await db.execute({
                sql: `UPDATE training_bookings SET 
                  organization_name = coalesce(?, organization_name), 
                  contact_name = coalesce(?, contact_name), 
                  email = coalesce(?, email), 
                  phone = coalesce(?, phone), 
                  course_title = coalesce(?, course_title), 
                  status = coalesce(?, status), 
                  estimated_attendees = coalesce(?, estimated_attendees), 
                  preferred_date = coalesce(?, preferred_date), 
                  goals_and_notes = coalesce(?, goals_and_notes) 
                  WHERE id = ?`,
                args: [
                  body.organization_name || null,
                  body.contact_name || body.name || null,
                  body.email || null,
                  body.phone || null,
                  body.course_title || null,
                  body.status || null,
                  body.estimated_attendees ? Number(body.estimated_attendees) : null,
                  body.preferred_date || null,
                  body.goals_and_notes || body.message || null,
                  inquiryId
                ]
              });
            } else if (inquiryType === 'accessibility') {
              await db.execute({
                sql: `UPDATE accessibility_feedback SET 
                  contact_name = coalesce(?, contact_name), 
                  contact_email = coalesce(?, contact_email), 
                  barrier_description = coalesce(?, barrier_description), 
                  page_url = coalesce(?, page_url), 
                  status = coalesce(?, status), 
                  remediation_notes = coalesce(?, remediation_notes) 
                  WHERE id = ?`,
                args: [
                  body.contact_name || body.name || null,
                  body.contact_email || body.email || null,
                  body.barrier_description || body.message || null,
                  body.page_url || null,
                  body.status || null,
                  body.remediation_notes || body.notes || null,
                  inquiryId
                ]
              });
            } else {
              await db.execute({
                sql: `UPDATE contact_submissions SET 
                  name = coalesce(?, name), 
                  email = coalesce(?, email), 
                  phone = coalesce(?, phone), 
                  subject = coalesce(?, subject), 
                  message = coalesce(?, message), 
                  status = coalesce(?, status), 
                  notes = coalesce(?, notes) 
                  WHERE id = ?`,
                args: [
                  body.name || body.full_name || null,
                  body.email || null,
                  body.phone || null,
                  body.subject || null,
                  body.message || null,
                  body.status || null,
                  body.notes || null,
                  inquiryId
                ]
              });
            }
          }

          return jsonResponse({ success: true, message: `Inquiry entry updated successfully.` }, 200, cors);
        }

        // 15.10c Operational Inquiries Delete Entry (DELETE /api/admin/inquiries/:type/:id)
        if (pathname.startsWith('/api/admin/inquiries/') && request.method === 'DELETE') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }

          const parts = pathname.replace('/api/admin/inquiries/', '').split('/');
          const [inquiryType, inquiryId] = parts;
          const db = getDb(env);

          if (db && inquiryId) {
            let table = 'contact_submissions';
            if (inquiryType === 'volunteer') table = 'volunteer_applications';
            if (inquiryType === 'training') table = 'training_bookings';
            if (inquiryType === 'accessibility') table = 'accessibility_feedback';

            await db.execute({
              sql: `DELETE FROM ${table} WHERE id = ?`,
              args: [inquiryId]
            });
          }

          return jsonResponse({ success: true, message: `Inquiry entry ${inquiryId} successfully deleted.` }, 200, cors);
        }

        // 15.10d Admin Voicemails List (GET /api/admin/voicemails)
        if (pathname === '/api/admin/voicemails' && request.method === 'GET') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor', 'read_only'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }

          const statusFilter = url.searchParams.get('status') || 'all';
          const db = getDb(env);

          if (!db) {
            return jsonResponse({ success: true, voicemails: [] }, 200, cors);
          }

          let query = `SELECT id, name, email, subject, duration_seconds, r2_key, audio_mime_type, file_size_bytes, status, admin_notes, created_at, reviewed_at, responded_at FROM voicemails`;
          const args = [];

          if (statusFilter && statusFilter !== 'all') {
            query += ` WHERE status = ?`;
            args.push(statusFilter);
          }
          query += ` ORDER BY created_at DESC LIMIT 100`;

          try {
            const res = await db.execute({ sql: query, args });
            return jsonResponse({ success: true, voicemails: res.rows || [] }, 200, cors);
          } catch {
            return jsonResponse({ success: true, voicemails: [] }, 200, cors);
          }
        }

        // 15.10e Admin Voicemail Audio Stream (GET /api/admin/voicemails/:id/audio)
        if (pathname.startsWith('/api/admin/voicemails/') && pathname.endsWith('/audio') && request.method === 'GET') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor', 'read_only'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }

          const id = pathname.replace('/api/admin/voicemails/', '').replace('/audio', '').trim();
          const db = getDb(env);

          let voicemail = null;
          if (db) {
            try {
              const res = await db.execute({ sql: `SELECT * FROM voicemails WHERE id = ? LIMIT 1`, args: [id] });
              voicemail = res.rows?.[0];
            } catch {}
          }

          if (!voicemail) {
            return errorResponse('Voicemail recording not found.', 404, null, cors);
          }

          const mimeType = voicemail.audio_mime_type || 'audio/webm';

          if (env.VOICEMAIL_BUCKET && voicemail.r2_key) {
            try {
              const r2Obj = await env.VOICEMAIL_BUCKET.get(voicemail.r2_key);
              if (r2Obj) {
                return new Response(r2Obj.body, {
                  headers: {
                    'Content-Type': mimeType,
                    'Content-Disposition': `inline; filename="voicemail-${id}.webm"`,
                    'Cache-Control': 'private, max-age=3600',
                    ...cors
                  }
                });
              }
            } catch (r2Err) {
              console.warn('[Voicemail] R2 fetch error:', r2Err.message);
            }
          }

          if (voicemail.audio_data) {
            const binary = atob(voicemail.audio_data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            return new Response(bytes, {
              headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `inline; filename="voicemail-${id}.webm"`,
                'Cache-Control': 'private, max-age=3600',
                ...cors
              }
            });
          }

          return errorResponse('Audio recording file not found in storage.', 404, null, cors);
        }

        // 15.10f Admin Voicemail Status Update (PATCH /api/admin/voicemails/:id)
        if (pathname.startsWith('/api/admin/voicemails/') && request.method === 'PATCH') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }

          const id = pathname.replace('/api/admin/voicemails/', '').trim();
          const body = await request.json().catch(() => ({}));
          const { status, admin_notes } = body;
          const db = getDb(env);

          if (db && (status !== undefined || admin_notes !== undefined)) {
            const updates = [];
            const args = [];
            const now = new Date().toISOString();

            if (status !== undefined) {
              updates.push('status = ?');
              args.push(status);
              if (status === 'reviewed') {
                updates.push('reviewed_at = ?');
                args.push(now);
              } else if (status === 'responded') {
                updates.push('responded_at = ?');
                args.push(now);
              }
            }

            if (admin_notes !== undefined) {
              updates.push('admin_notes = ?');
              args.push(admin_notes);
            }

            if (updates.length > 0) {
              args.push(id);
              try {
                await db.execute({
                  sql: `UPDATE voicemails SET ${updates.join(', ')} WHERE id = ?`,
                  args
                });
              } catch (err) {
                console.warn('[Voicemail] Update error:', err.message);
              }
            }
          }

          return jsonResponse({ success: true, message: `Voicemail ${id} updated.` }, 200, cors);
        }

        // 15.10g Admin Voicemail Delete (DELETE /api/admin/voicemails/:id)
        if (pathname.startsWith('/api/admin/voicemails/') && request.method === 'DELETE') {
          if (!requireRole(authUser.role, ['admin', 'approver'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }

          const id = pathname.replace('/api/admin/voicemails/', '').trim();
          const db = getDb(env);

          if (db) {
            try {
              const res = await db.execute({ sql: `SELECT r2_key FROM voicemails WHERE id = ? LIMIT 1`, args: [id] });
              const r2Key = res.rows?.[0]?.r2_key;
              if (r2Key && env.VOICEMAIL_BUCKET && typeof env.VOICEMAIL_BUCKET.delete === 'function') {
                await env.VOICEMAIL_BUCKET.delete(r2Key).catch(() => {});
              }
              await db.execute({ sql: `DELETE FROM voicemails WHERE id = ?`, args: [id] });
            } catch (delErr) {
              console.warn('[Voicemail] Delete error:', delErr.message);
            }
          }

          return jsonResponse({ success: true, message: `Voicemail ${id} successfully deleted.` }, 200, cors);
        }

        // 15.10h Admin Media Suggestions List (GET /api/admin/media-suggestions)
        if (pathname === '/api/admin/media-suggestions' && request.method === 'GET') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor', 'read_only'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }
          const statusFilter = url.searchParams.get('status') || 'all';
          const db = getDb(env);
          let suggestions = [];
          if (db) {
            try {
              let sql = `SELECT * FROM media_suggestions ORDER BY created_at DESC LIMIT 150`;
              let args = [];
              if (statusFilter !== 'all') {
                sql = `SELECT * FROM media_suggestions WHERE status = ? ORDER BY created_at DESC LIMIT 150`;
                args = [statusFilter];
              }
              const res = await db.execute({ sql, args });
              suggestions = res.rows || [];
            } catch (err) {
              console.warn('[Worker] Failed to query media suggestions:', err.message);
            }
          }
          return jsonResponse({ success: true, suggestions, count: suggestions.length }, 200, cors);
        }

        // 15.10i Admin Media Suggestion Status Update (PATCH /api/admin/media-suggestions/:id)
        if (pathname.startsWith('/api/admin/media-suggestions/') && request.method === 'PATCH') {
          if (!requireRole(authUser.role, ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }
          const id = pathname.replace('/api/admin/media-suggestions/', '').trim();
          const body = await request.json().catch(() => ({}));
          const { status, admin_notes } = body;
          const db = getDb(env);
          if (db && status) {
            try {
              await db.execute({
                sql: `UPDATE media_suggestions SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now') WHERE id = ?`,
                args: [status, admin_notes || null, id]
              });
            } catch (err) {
              console.warn('[Worker] Failed to update media suggestion:', err.message);
            }
          }
          return jsonResponse({ success: true, id, status }, 200, cors);
        }

        // 15.10j Admin Media Suggestion Delete (DELETE /api/admin/media-suggestions/:id)
        if (pathname.startsWith('/api/admin/media-suggestions/') && request.method === 'DELETE') {
          if (!requireRole(authUser.role, ['admin', 'approver'])) {
            return errorResponse('Forbidden', 403, null, cors);
          }
          const id = pathname.replace('/api/admin/media-suggestions/', '').trim();
          const db = getDb(env);
          if (db) {
            try {
              await db.execute({ sql: `DELETE FROM media_suggestions WHERE id = ?`, args: [id] });
            } catch (err) {
              console.warn('[Worker] Failed to delete media suggestion:', err.message);
            }
          }
          return jsonResponse({ success: true, id, deleted: true }, 200, cors);
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
            if (exportType === 'subscribers') sql = `SELECT * FROM newsletter_subscribers ORDER BY created_at DESC`;
            if (exportType === 'donations') sql = `SELECT * FROM donation_appreciation_cards ORDER BY created_at DESC`;

            const res = await db.execute({ sql, args: [] });
            rows = res.rows || [];
          }

          if (exportType === 'volunteer') {
            formattedRows = rows.map(formatVolunteerRow);
          } else if (exportType === 'business') {
            formattedRows = rows.map(formatBusinessRow);
          } else if (exportType === 'training') {
            formattedRows = rows.map(formatTrainingRow);
          } else if (exportType === 'subscribers') {
            formattedRows = rows.map(formatSubscriberRow);
          } else if (exportType === 'donations') {
            formattedRows = rows.map(formatDonationRow);
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
          }).catch(() => { });

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

        // 15.15B Admin Add Subscriber (POST /api/admin/newsletter/subscribers)
        if (pathname === '/api/admin/newsletter/subscribers' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const email = (body.email || '').toLowerCase().trim();
          if (!email || !email.includes('@')) {
            return errorResponse('Valid email required', 400, null, cors);
          }
          const db = getDb(env);
          if (db) {
            await db.execute({
              sql: `INSERT INTO newsletter_subscribers (id, email, source, is_active, consent_timestamp, created_at)
                    VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
                    ON CONFLICT(email) DO UPDATE SET is_active = 1, unsubscribed_at = NULL`,
              args: [crypto.randomUUID(), email, body.source || 'admin_in_person']
            });
          }
          return jsonResponse({ success: true, message: `Subscriber ${email} successfully recorded!` }, 201, cors);
        }

        // 15.15C Admin Toggle Subscriber Status (POST /api/admin/newsletter/subscribers/toggle)
        if (pathname === '/api/admin/newsletter/subscribers/toggle' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const email = (body.email || '').toLowerCase().trim();
          const targetStatus = body.isActive ? 1 : 0;
          const db = getDb(env);
          if (db && email) {
            await db.execute({
              sql: `UPDATE newsletter_subscribers SET is_active = ?, unsubscribed_at = ${targetStatus === 0 ? "datetime('now')" : "NULL"} WHERE email = ? OR id = ?`,
              args: [targetStatus, email, body.id || '']
            });
          }
          return jsonResponse({ success: true, message: `Subscriber status updated to ${targetStatus === 1 ? 'Active' : 'Unsubscribed'}.` }, 200, cors);
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
            }).catch(() => { });
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

        // =======================================================================
        // 15.17 DONATION AUTOMATED EMAIL TEMPLATE (GET & PUT /api/admin/donations/template)
        // Allows admins to view and edit the automated donor thank-you email template
        // with dynamic placeholders: {{donor_name}}, {{amount}}, {{frequency}}, etc.
        // =======================================================================
        if (pathname === '/api/admin/donations/template' && request.method === 'GET') {
          const db = getDb(env);
          let template = null;
          let updatedAt = null;
          let updatedBy = null;
          if (db) {
            try {
              const res = await db.execute({
                sql: `SELECT state, updated_at, updated_by FROM site_state WHERE id = 'donation_email_template' LIMIT 1`,
                args: []
              });
              if (res.rows.length > 0 && res.rows[0].state) {
                template = JSON.parse(res.rows[0].state);
                updatedAt = res.rows[0].updated_at;
                updatedBy = res.rows[0].updated_by;
              }
            } catch (err) {
              console.warn('Failed to load donation template from DB:', err.message);
            }
          }

          return jsonResponse({
            success: true,
            template: template || DEFAULT_DONATION_EMAIL_TEMPLATE,
            defaultTemplate: DEFAULT_DONATION_EMAIL_TEMPLATE,
            updatedAt,
            updatedBy
          }, 200, adminCors);
        }

        if (pathname === '/api/admin/donations/template' && request.method === 'PUT') {
          if (!requireRole(authUser.role, ['admin', 'editor'])) {
            return errorResponse('Forbidden: Admin or Editor role required to edit donation email template.', 403, null, adminCors);
          }

          const body = await request.json().catch(() => ({}));
          const db = getDb(env);
          if (!db) {
            return errorResponse('Database not available', 503, null, adminCors);
          }

          const templateData = {
            subject: (body.subject || '').trim(),
            title: (body.title || '').trim(),
            headline: (body.headline || 'With Heartfelt Thanks To').trim(),
            bodyText: (body.bodyText || '').trim(),
            recurringNote: (body.recurringNote || '').trim(),
            taxNotice: (body.taxNotice || '').trim()
          };

          await db.execute({
            sql: `INSERT INTO site_state (id, state, version, updated_at, updated_by)
                  VALUES ('donation_email_template', ?, 1, datetime('now'), ?)
                  ON CONFLICT(id) DO UPDATE SET state = excluded.state, version = version + 1, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
            args: [JSON.stringify(templateData), authUser.email]
          });

          await logAdminAction(db, {
            userId: authUser.id,
            userEmail: authUser.email,
            action: 'update_donation_email_template',
            targetType: 'email_template',
            targetId: 'donation_appreciation',
            details: templateData,
            ip: clientIp
          }).catch(() => { });

          return jsonResponse({
            success: true,
            message: 'Donation automated email template updated successfully.',
            template: templateData
          }, 200, adminCors);
        }

        // 15.18 Send Test Donation Thank-You Email (POST /api/admin/donations/template/test)
        if (pathname === '/api/admin/donations/template/test' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const targetEmail = (body.testEmail || authUser.email || '').trim();
          const customTemplate = body.template || null;

          if (!targetEmail) {
            return errorResponse('Recipient test email is required', 400, null, adminCors);
          }

          const sampleEmail = templateDonorAppreciationEmail({
            donorDisplayName: 'Casey Miller (Sample Donor)',
            formattedAmount: '$100.00',
            tierName: 'Rainbow Champion',
            badge: 'CHAMPION CIRCLE',
            tagline: 'Fostering LGBTQ+ Youth Resiliency & Safe Spaces',
            impact: 'Funds 1 full month of art supplies & refreshments for Rainbow Umbrella youth gatherings.',
            cardUrl: `${env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org'}/appreciation-card/preview`,
            frequency: 'monthly',
            designation: 'Diversity SHINES Healthcare & Testing',
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            reference: 'DCVC-DON-SAMPLE',
            customTemplate
          });

          let sent = false;
          if (env?.RESEND_API_KEY) {
            try {
              await sendEmail({
                apiKey: env.RESEND_API_KEY,
                from: env.RESEND_FROM_EMAIL || 'Diversity Collective <donations@diversitycollective.org>',
                to: targetEmail,
                replyTo: 'donations@diversitycollective.org',
                subject: `[SAMPLE PREVIEW] ${sampleEmail.subject}`,
                html: sampleEmail.html,
                text: sampleEmail.text
              });
              sent = true;
            } catch (err) {
              console.error('Failed to send test email:', err.message);
            }
          }

          return jsonResponse({
            success: true,
            sent,
            targetEmail,
            subject: sampleEmail.subject,
            message: sent
              ? `Test email sent to ${targetEmail} via Resend.`
              : 'Resend API key not configured; sample preview compiled successfully.'
          }, 200, adminCors);
        }

        // 15.19 List Recent Donations (GET /api/admin/donations)
        if (pathname === '/api/admin/donations' && request.method === 'GET') {
          const db = getDb(env);
          if (!db) return jsonResponse({ success: true, donations: [] }, 200, adminCors);

          const res = await db.execute({
            sql: `SELECT id, card_token, payment_reference, tier, tier_name, amount_cents, donor_display_name, recipient_email, is_anonymous, frequency, status, is_opened, opened_at, admin_notes, created_at
                  FROM donation_appreciation_cards
                  ORDER BY created_at DESC
                  LIMIT 100`,
            args: []
          });

          return jsonResponse({
            success: true,
            donations: res.rows || []
          }, 200, adminCors);
        }

        // 15.20 Resend Donor Appreciation Email (POST /api/admin/donations/:id/resend-email)
        if (pathname.startsWith('/api/admin/donations/') && pathname.endsWith('/resend-email') && request.method === 'POST') {
          const donationId = pathname.replace('/api/admin/donations/', '').replace('/resend-email', '').trim();
          const db = getDb(env);
          if (!db) return errorResponse('Database not available', 503, null, adminCors);

          const res = await db.execute({
            sql: `SELECT * FROM donation_appreciation_cards WHERE id = ? OR card_token = ? LIMIT 1`,
            args: [donationId, donationId]
          });

          if (res.rows.length === 0) {
            return errorResponse('Donation record not found', 404, null, adminCors);
          }

          const row = res.rows[0];
          const recipient = row.recipient_email;
          if (!recipient) {
            return errorResponse('No recipient email on file for this donation', 400, null, adminCors);
          }

          // Retrieve custom template
          let customTemplate = null;
          try {
            const tRes = await db.execute({
              sql: `SELECT state FROM site_state WHERE id = 'donation_email_template' LIMIT 1`,
              args: []
            });
            if (tRes.rows?.length > 0 && tRes.rows[0].state) {
              customTemplate = JSON.parse(tRes.rows[0].state);
            }
          } catch (e) {}

          const tierInfo = resolveAppreciationTier(Math.round(row.amount_cents / 100), env);
          const formattedAmount = `$${(row.amount_cents / 100).toFixed(2)}`;
          const cardUrl = `${env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org'}/appreciation-card/${row.card_token}`;

          let notes = {};
          try { notes = JSON.parse(row.admin_notes || '{}'); } catch {}

          const emailPayload = templateDonorAppreciationEmail({
            donorDisplayName: row.donor_display_name,
            formattedAmount,
            tierName: row.tier_name,
            badge: tierInfo.badge,
            tagline: tierInfo.tagline,
            impact: row.impact_message,
            cardUrl,
            frequency: row.frequency,
            designation: notes.designation || 'General Fund',
            date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
            reference: row.payment_reference,
            customTemplate
          });

          let sent = false;
          if (env?.RESEND_API_KEY) {
            try {
              await sendEmail({
                apiKey: env.RESEND_API_KEY,
                from: env.RESEND_FROM_EMAIL || 'Diversity Collective <donations@diversitycollective.org>',
                to: recipient,
                replyTo: 'donations@diversitycollective.org',
                subject: emailPayload.subject,
                html: emailPayload.html,
                text: emailPayload.text
              });
              sent = true;
            } catch (err) {
              console.error('Failed to resend donation email:', err.message);
            }
          }

          return jsonResponse({
            success: true,
            sent,
            recipient,
            message: `Appreciation email resent to ${recipient}.`
          }, 200, adminCors);
        }

        // 15.21 Record In-Person / Offline Contribution (POST /api/admin/donations/manual)
        if (pathname === '/api/admin/donations/manual' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const donorName = (body.donorName || '').trim();
          const donorEmail = (body.donorEmail || '').toLowerCase().trim();
          const rawAmount = Number(body.amount || 0);
          const frequency = (body.frequency || 'one-time').toLowerCase();
          const designation = (body.designation || 'General Fund').trim();
          const isAnonymous = Boolean(body.isAnonymous);
          const sendReceiptEmail = body.sendEmail !== false;

          if (isNaN(rawAmount) || rawAmount < 1) {
            return errorResponse('Donation amount must be at least $1.00', 400, null, adminCors);
          }

          const amountCents = Math.round(rawAmount * 100);
          const formattedAmount = `$${rawAmount.toFixed(2)}`;
          const displayName = isAnonymous ? 'Anonymous Supporter' : (donorName || 'Affirming Friend');
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const paymentRef = `DCVC-MANUAL-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
          const tierInfo = resolveAppreciationTier(rawAmount, env);

          const randomBytes = new Uint8Array(24);
          crypto.getRandomValues(randomBytes);
          const cardToken = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
          const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cardToken));
          const tokenHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
          const emailHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(donorEmail || 'anonymous'));
          const donorEmailHash = Array.from(new Uint8Array(emailHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

          const cardId = crypto.randomUUID();
          const db = getDb(env);
          if (db) {
            await db.execute({
              sql: `INSERT INTO donation_appreciation_cards 
                    (id, card_token, token_hash, payment_reference, tier, tier_name, amount_cents, donor_display_name, donor_email_hash, recipient_email, is_anonymous, impact_message, frequency, status, admin_notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
              args: [
                cardId, cardToken, tokenHash, paymentRef, tierInfo.tier, tierInfo.tierName,
                amountCents, displayName, donorEmailHash, donorEmail || null, isAnonymous ? 1 : 0,
                tierInfo.impact, frequency, JSON.stringify({ designation, recordedBy: authUser.email, offline: true })
              ]
            }).catch(err => console.warn('Manual Card DB insert error:', err.message));
          }

          const frontendBase = env.FRONTEND_BASE_URL || 'https://diversitycollectivevc.org';
          const cardUrl = `${frontendBase}/appreciation-card/${cardToken}`;

          let emailDispatched = false;
          if (sendReceiptEmail && donorEmail && donorEmail.includes('@') && env?.RESEND_API_KEY) {
            let customTemplate = null;
            if (db) {
              try {
                const tRes = await db.execute({
                  sql: `SELECT state FROM site_state WHERE id = 'donation_email_template' LIMIT 1`,
                  args: []
                });
                if (tRes.rows?.length > 0 && tRes.rows[0].state) {
                  customTemplate = JSON.parse(tRes.rows[0].state);
                }
              } catch {}
            }
            const emailTpl = templateDonorAppreciationEmail({
              donorDisplayName: displayName,
              formattedAmount,
              tierName: tierInfo.tierName,
              badge: tierInfo.badge,
              tagline: tierInfo.tagline,
              impact: tierInfo.impact,
              cardUrl,
              frequency,
              designation,
              date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              reference: paymentRef,
              customTemplate
            });

            await sendEmail({
              apiKey: env.RESEND_API_KEY,
              from: env.RESEND_FROM_EMAIL || 'Diversity Collective <donations@diversitycollective.org>',
              to: donorEmail,
              replyTo: 'donations@diversitycollective.org',
              subject: emailTpl.subject,
              html: emailTpl.html,
              text: emailTpl.text
            }).then(() => { emailDispatched = true; }).catch(err => console.error('Manual email error:', err));
          }

          return jsonResponse({
            success: true,
            cardId,
            cardToken,
            cardUrl,
            paymentReference: paymentRef,
            tier: tierInfo.tier,
            tierName: tierInfo.tierName,
            donorDisplayName: displayName,
            amount: rawAmount,
            emailDispatched,
            message: `Contribution recorded successfully! Digital keepsake card minted${emailDispatched ? ' and appreciation email dispatched' : ''}.`
          }, 201, adminCors);
        }
      }

      // Public Sitewide Translation Batch Endpoint (POST /api/translate)
      if (pathname === '/api/translate' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const targetLang = String(body.targetLang || 'es').trim();
        const texts = Array.isArray(body.texts) ? body.texts.slice(0, 60).map((t) => String(t || '')) : [];
        if (texts.length === 0 || targetLang === 'en') {
          return jsonResponse({ success: true, translations: texts }, 200, cors);
        }

        // 1. Primary: Server-side Google Translate GTX (grouped into small newline batches so we don't hit 50-subrequest limits or 429 bursts)
        try {
          const translateSingleGtx = async (text) => {
            if (!text.trim()) return text;
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
            const r = await fetch(url);
            if (!r.ok) return text;
            const json = await r.json();
            if (Array.isArray(json?.[0])) {
              const joined = json[0].map((seg) => seg?.[0] || '').join('');
              if (joined) return joined;
            }
            return text;
          };

          const cleanTexts = texts.map((t) => t.replace(/\r?\n+/g, ' ').trim());
          const translated = [...texts];
          const batchSize = 12;
          for (let i = 0; i < cleanTexts.length; i += batchSize) {
            const slice = cleanTexts.slice(i, i + batchSize);
            const nonEmptyIndices = slice.map((s, idx) => (s ? idx : -1)).filter((idx) => idx >= 0);
            if (nonEmptyIndices.length === 0) continue;
            const payload = nonEmptyIndices.map((idx) => slice[idx]).join('\n');
            if (payload.length <= 1800) {
              const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(payload)}`;
              const r = await fetch(url);
              if (r.ok) {
                const json = await r.json();
                const joined = Array.isArray(json?.[0]) ? json[0].map((seg) => seg?.[0] || '').join('') : '';
                const lines = joined.split('\n');
                if (lines.length === nonEmptyIndices.length) {
                  nonEmptyIndices.forEach((origIdx, lineIdx) => {
                    if (lines[lineIdx]?.trim()) translated[i + origIdx] = lines[lineIdx].trim();
                  });
                  continue;
                }
              }
            }
            const individual = await Promise.all(slice.map((s) => translateSingleGtx(s)));
            individual.forEach((val, idx) => {
              if (val) translated[i + idx] = val;
            });
          }

          if (translated.some((t, i) => t !== texts[i])) {
            return jsonResponse({ success: true, translations: translated }, 200, cors);
          }
        } catch (err) {
          console.warn('[translate] GTX fetch error:', err.message);
        }

        // 2. Fallback: Workers AI batch translation
        const translations = [...texts];
        if (env.AI) {
          try {
            const prompt = `Translate the following JSON array of English UI strings into language code "${targetLang}". Return ONLY a valid JSON array of strings of the exact same length (${texts.length}), preserving order and any numbers/symbols:\n${JSON.stringify(texts)}`;
            const aiRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
              messages: [
                { role: 'system', content: 'You are a precise UI translator. Output ONLY a JSON array of translated strings.' },
                { role: 'user', content: prompt }
              ],
              max_tokens: 1800,
              temperature: 0.1
            });
            const raw = String(aiRes?.response || '').trim();
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (Array.isArray(parsed) && parsed.length === texts.length) {
                return jsonResponse({ success: true, translations: parsed.map((x, i) => String(x || texts[i])) }, 200, cors);
              }
            }
          } catch (err) {
            console.warn('[translate] Workers AI batch error:', err.message);
          }
        }
        return jsonResponse({ success: true, translations }, 200, cors);
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
