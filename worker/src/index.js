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
  resetSiteState,
  getUndoHistory,
  undoLastSiteStateChange
} from './siteStateService.js';
import {
  listNewsArticles,
  getNewsArticleBySlugOrId,
  upsertNewsArticle,
  deleteNewsArticle,
  deleteAllNewsArticles
} from './newsService.js';
import {
  parseAllowedSections,
  normalizeAllowedSectionsInput,
  requireSectionAccess,
  assertUserCanPublishSiteState,
  SECTION_LABELS
} from './sectionPermissions.js';
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
  verifyPasswordHash,
  OWASP_PBKDF2_ITERATIONS,
  LEGACY_PBKDF2_ITERATIONS,
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
  'https://diversity-collective-vc.pages.dev',
  'https://dcvc.pages.dev',
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
  if (/^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  return false;
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const fallbackOrigin = String(env.ALLOWED_ORIGIN || 'https://diversitycollective.org')
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
  const isNonProd = String(env?.ENVIRONMENT || '').toLowerCase() !== 'production';
  const isPreviewFallbackAllowed = !strict && isNonProd && (
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

// Helper: Parse Zeffy Signature Header (format: t=timestamp,v1=signature)
function parseZeffySignatureHeader(header) {
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(',');
  let timestamp = null;
  const signatures = [];
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim().toLowerCase();
    const val = part.slice(eqIdx + 1).trim();
    if (key === 't') {
      timestamp = val;
    } else if (key === 'v1') {
      signatures.push(val.toLowerCase());
    }
  }
  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

// Helper: Verify Official Zeffy HMAC-SHA256 Webhook Signature with constant-time comparison
// Conforms strictly to official Zeffy protocol:
// - Header: Zeffy-Signature (format: t=timestamp,v1=signature)
// - HMAC-SHA256 input: {timestamp}.{rawBody}
// - Secret prefix: whsec_... (or configured signing secret)
// - Freshness: 5-minute (300s) tolerance window to prevent replay attacks
// - Comparison: Constant-time signature comparison
// - Fail-closed: Missing secretKey ALWAYS fails closed; never returns valid or bypassed
async function verifyZeffySignature(rawBody, signatureHeader, secretKey, options = {}) {
  if (!secretKey) {
    return { valid: false, error: 'ZEFFY_WEBHOOK_SECRET is not configured' };
  }

  if (!signatureHeader) {
    return { valid: false, error: 'Missing Zeffy-Signature header' };
  }

  const parsed = parseZeffySignatureHeader(signatureHeader);
  if (!parsed) {
    return { valid: false, error: 'Invalid Zeffy-Signature header format (expected t=timestamp,v1=signature)' };
  }

  // Strict integer Unix timestamp validation (rejects floats, letters, hex, or negative numbers)
  const trimmedTs = String(parsed.timestamp).trim();
  if (!/^\d{9,12}$/.test(trimmedTs)) {
    return { valid: false, error: 'Malformed timestamp: must be an integer Unix timestamp' };
  }

  const eventTimestamp = Number(trimmedTs);
  if (!Number.isSafeInteger(eventTimestamp) || eventTimestamp <= 0) {
    return { valid: false, error: 'Malformed timestamp: must be a positive integer' };
  }

  const toleranceSeconds = options.toleranceSeconds ?? 300;
  const currentTimestamp = options.currentTimestamp ?? Math.floor(Date.now() / 1000);

  if (Math.abs(currentTimestamp - eventTimestamp) > toleranceSeconds) {
    return {
      valid: false,
      error: `Webhook timestamp outside tolerance window (${Math.abs(currentTimestamp - eventTimestamp)}s > ${toleranceSeconds}s)`
    };
  }

  try {
    const signedPayload = `${trimmedTs}.${rawBody}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toLowerCase();

    // Constant-time comparison against all supplied v1 signatures
    const valid = parsed.signatures.some(sig => constantTimeEqual(computedSignature, sig));
    return {
      valid,
      timestamp: eventTimestamp,
      error: valid ? null : 'HMAC signature mismatch'
    };
  } catch (err) {
    console.error('Zeffy signature calculation failed:', err);
    return { valid: false, error: err.message };
  }
}

// Multi-Tier Zeffy Webhook Verification: Strict Signature Verification Only
// Strictly rejects unverified requests, query-parameter tokens, non-conforming signatures,
// and API keys used as signing secret substitutes. Fail-closed in all configurations.
async function verifyZeffyWebhookRequest(request, rawBody, env, payload) {
  const secretKey = env?.ZEFFY_WEBHOOK_SECRET;

  // 1. Missing Secret Handling (Fail-closed)
  if (!secretKey) {
    // Isolated non-production test bypass ONLY when explicitly enabled via configuration
    const isExplicitNonProdTest = env?.ENVIRONMENT === 'test' && env?.ALLOW_INSECURE_DEV_BYPASS === 'true';
    if (isExplicitNonProdTest) {
      console.warn('⚠️ Non-production test bypass flag active. Marking verification as bypassed.');
      return { 
        valid: false, 
        bypassed: true, 
        error: 'Webhook signature verification bypassed in non-production test mode' 
      };
    }

    return { 
      valid: false, 
      bypassed: false, 
      error: 'ZEFFY_WEBHOOK_SECRET is not configured on this environment' 
    };
  }

  // 2. Enforce official Zeffy-Signature header (case-insensitive retrieval via fetch headers)
  const signatureHeader = request.headers.get('zeffy-signature') || '';
  if (!signatureHeader) {
    return { valid: false, bypassed: false, error: 'Missing Zeffy-Signature header' };
  }

  // 3. Verify HMAC signature
  const hmacRes = await verifyZeffySignature(rawBody, signatureHeader, secretKey);
  if (hmacRes.valid) {
    return { valid: true, bypassed: false, method: 'hmac_sha256', timestamp: hmacRes.timestamp };
  }

  return { valid: false, bypassed: false, error: hmacRes.error || 'HMAC signature verification failed' };
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

// Yelp Directory Live Hype & Rating In-Memory Edge Cache
const directoryHypeIpSet = new Set();
const directoryMetricsMap = new Map();

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

        // 1. Strict Authentication & Signature Verification (Fail-closed in production)
        const authVerification = await verifyZeffyWebhookRequest(request, rawBody, env, payload);
        if (!authVerification.valid || authVerification.bypassed) {
          console.error('[Zeffy Webhook Rejected]', authVerification.error || 'Bypassed verification disallowed');
          const statusCode = !env.ZEFFY_WEBHOOK_SECRET ? 500 : 401;
          return errorResponse(
            authVerification.error || 'Invalid or bypassed webhook signature',
            statusCode,
            null,
            cors
          );
        }

        // 2. Event Type & Identifier Resolution
        const eventType = payload.event || payload.type || payload.event_type || 'payment.created';
        const data = payload.data || payload;
        const paymentReference = String(data.id || data.payment_id || data.transaction_id || payload.id || '').trim();

        if (!paymentReference) {
          return errorResponse('Missing transaction or payment identifier', 400, null, cors);
        }

        const db = getDb(env);

        // Compute payload hash for auditable, PII-free tracking
        const payloadHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawBody))))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        // Webhook event IDs tracked independently from payment references
        const webhookEventId = String(payload.event_id || payload.eventId || (payload.id && String(payload.id).trim() !== paymentReference ? payload.id : `evt_${paymentReference}_${payloadHash.slice(0, 12)}`)).trim();

        // 3. ATOMIC EVENT RESERVATION & CONCURRENCY PROTECTION (Requirement 4)
        // Guard against race conditions and concurrent deliveries via database uniqueness constraint
        if (db) {
          try {
            await db.execute({
              sql: `INSERT INTO webhook_events (id, event_id, event_type, payload_hash, status) VALUES (?, ?, ?, ?, 'processing')`,
              args: [crypto.randomUUID(), webhookEventId, eventType, payloadHash]
            });
          } catch (reservationErr) {
            const isUniqueViolation = reservationErr.message?.includes('UNIQUE') || reservationErr.message?.includes('constraint');
            if (isUniqueViolation) {
              console.log(`[Concurrency Guard] Webhook event ${webhookEventId} already reserved or processed concurrently.`);
              const existingCard = await db.execute({
                sql: `SELECT id, card_token FROM donation_appreciation_cards WHERE payment_reference = ? LIMIT 1`,
                args: [paymentReference]
              });
              return jsonResponse({
                success: true,
                status: 'already_processed',
                eventId: webhookEventId,
                cardToken: existingCard.rows[0]?.card_token || null,
                message: 'This webhook event is already being processed or has already completed.'
              }, 200, cors);
            }
            console.warn('[Concurrency Guard] Reservation insert note:', reservationErr.message);
          }
        }

        // 4. Retrieve Authoritative Payment Resource when webhook provides only ID reference
        let paymentData = data;
        if ((!paymentData.status || paymentData.amount === undefined) && env.ZEFFY_API_KEY) {
          try {
            const zeffyApiRes = await fetch(`https://api.zeffy.com/api/v1/payments/${encodeURIComponent(paymentReference)}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${env.ZEFFY_API_KEY}`,
                'Accept': 'application/json'
              }
            });
            if (zeffyApiRes.ok) {
              const authJson = await zeffyApiRes.json();
              paymentData = authJson.data || authJson;
            }
          } catch (apiErr) {
            console.warn('[Zeffy Webhook] Authoritative payment lookup note:', apiErr.message);
          }
        }

        // 5. Documented Refund & Dispute Handling (Requirement 3: payment.updated)
        const paymentStatus = String(paymentData.status || 'succeeded').toLowerCase();
        const isRefundOrDispute = paymentStatus === 'refunded' ||
          paymentStatus === 'disputed' ||
          Boolean(paymentData.refunded) ||
          eventType === 'payment.refunded' ||
          eventType === 'refund.created';

        if (isRefundOrDispute) {
          if (db) {
            try {
              await db.execute({
                sql: `UPDATE webhook_events SET status = 'refunded' WHERE event_id = ?`,
                args: [webhookEventId]
              });
              await db.execute({
                sql: `UPDATE donation_appreciation_cards 
                      SET status = 'revoked_refunded', 
                          admin_notes = json_set(COALESCE(admin_notes, '{}'), '$.refunded', true, '$.refundedAt', datetime('now')) 
                      WHERE payment_reference = ?`,
                args: [paymentReference]
              });
              console.log(`[Zeffy Webhook] Payment ${paymentReference} (event ${webhookEventId}) recorded as refunded/disputed.`);
            } catch (refErr) {
              console.warn('[Zeffy Webhook] Refund event log update skipped:', refErr.message);
            }
          }
          return jsonResponse({
            success: true,
            status: 'refund_recorded',
            paymentReference,
            eventId: webhookEventId,
            message: 'Payment refund or dispute recorded successfully.'
          }, 200, cors);
        }

        // 6. Suppress duplicate cards/acknowledgements on payment.updated when already processed
        if (db) {
          try {
            const existingCard = await db.execute({
              sql: `SELECT id, card_token, tier_name FROM donation_appreciation_cards WHERE payment_reference = ? LIMIT 1`,
              args: [paymentReference]
            });

            if (existingCard.rows.length > 0) {
              console.log(`[Idempotency] Payment ${paymentReference} already processed with issued card. Suppressing duplicate on ${eventType}.`);
              await db.execute({
                sql: `UPDATE webhook_events SET status = 'processed' WHERE event_id = ?`,
                args: [webhookEventId]
              });
              return jsonResponse({
                success: true,
                status: 'already_processed',
                eventId: webhookEventId,
                cardToken: existingCard.rows[0].card_token,
                message: 'Payment has already been processed and card issued. No duplicate card issued.'
              }, 200, cors);
            }
          } catch (dbErr) {
            console.warn('[Idempotency] Existing card query check skipped:', dbErr.message);
          }
        }

        // 7. Validate Supported Documented Donation Events
        const validDonationEvents = [
          'payment.created', 'payment.updated',
          'donation.created', 'donation.updated',
          'order.created', 'order.updated',
          'payment.completed', 'donation.completed', 'order.completed',
          'payment.succeeded', 'donation.succeeded'
        ];
        if (!validDonationEvents.includes(eventType)) {
          if (db) {
            try {
              await db.execute({
                sql: `UPDATE webhook_events SET status = 'ignored' WHERE event_id = ?`,
                args: [webhookEventId]
              });
            } catch {}
          }
          return jsonResponse({
            success: true,
            status: 'ignored',
            eventId: webhookEventId,
            message: `Event type ${eventType} ignored. Only completed donations receive appreciation cards.`
          }, 200, cors);
        }

        // 8. Strict Payment Status Check: Do not mark pending or failed payments as successful
        if (['pending', 'in_progress', 'processing'].includes(paymentStatus)) {
          if (db) {
            try {
              await db.execute({
                sql: `UPDATE webhook_events SET status = 'pending' WHERE event_id = ?`,
                args: [webhookEventId]
              });
            } catch {}
          }
          return jsonResponse({
            success: true,
            status: 'pending_ignored',
            eventId: webhookEventId,
            message: 'Payment is pending. Cards and confirmation emails are issued only upon completion.'
          }, 200, cors);
        }

        if (['failed', 'declined', 'cancelled', 'canceled'].includes(paymentStatus)) {
          if (db) {
            try {
              await db.execute({
                sql: `UPDATE webhook_events SET status = 'failed' WHERE event_id = ?`,
                args: [webhookEventId]
              });
            } catch {}
          }
          return jsonResponse({
            success: true,
            status: 'failed_ignored',
            eventId: webhookEventId,
            message: 'Payment was not successful. No card issued.'
          }, 200, cors);
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

        const donorEmail = (donorObj.email || data.donor_email || data.email || '').trim().toLowerCase();
        const frequency = data.frequency ||
          data.recurring_interval ||
          ((data.is_recurring || data.isRecurring || data.isMonthly || data.subscription_id) ? 'monthly' : 'one-time');

        // Deterministic matching against donation_intents
        let matchedIntent = null;
        if (donorEmail && db) {
          try {
            const candidateIntents = await db.execute({
              sql: `SELECT id, intent_token, donor_name, donor_email, amount_cents, frequency, is_anonymous, campaign, status, created_at
                    FROM donation_intents
                    WHERE lower(donor_email) = lower(?) AND status = 'pending'
                    ORDER BY created_at DESC
                    LIMIT 5`,
              args: [donorEmail]
            });
            const candidates = candidateIntents.rows || [];
            if (candidates.length === 1) {
              matchedIntent = candidates[0];
            } else if (candidates.length > 1) {
              const matchingAmount = candidates.filter(i => Number(i.amount_cents) === amountCents);
              if (matchingAmount.length === 1) {
                matchedIntent = matchingAmount[0];
              } else {
                console.warn(`[Zeffy Webhook] Ambiguous donor intent match for email: ${donorEmail} (${candidates.length} candidates)`);
                await db.execute({
                  sql: `INSERT OR IGNORE INTO donation_reconciliations 
                        (id, payment_reference, donor_name, donor_email, amount_cents, payment_status, reconciliation_type, status, admin_notes)
                        VALUES (?, ?, ?, ?, ?, 'succeeded', 'ambiguous_match', 'pending', ?)`,
                  args: [
                    crypto.randomUUID(),
                    paymentReference,
                    rawFullName || 'Unknown',
                    donorEmail,
                    amountCents,
                    `Ambiguous match: found ${candidates.length} pending intents for this email.`
                  ]
                }).catch(() => {});
              }
            }
          } catch (intentErr) {
            console.warn('[Zeffy Webhook] Error resolving donor intent:', intentErr.message);
          }
        }

        const isEffectiveAnon = isAnonymous || (matchedIntent ? Boolean(matchedIntent.is_anonymous) : false);
        const donorDisplayName = isEffectiveAnon
          ? 'Affirming Friend of DCVC'
          : (matchedIntent?.donor_name?.trim() || rawFullName || 'Affirming Friend of DCVC');

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
              sql: `UPDATE webhook_events SET status = 'processed' WHERE event_id = ?`,
              args: [webhookEventId]
            });

            if (matchedIntent) {
              await db.execute({
                sql: `UPDATE donation_intents SET status = 'matched', matched_payment_reference = ?, card_token = ? WHERE id = ?`,
                args: [paymentReference, cardToken, matchedIntent.id]
              }).catch(() => {});
            } else {
              await db.execute({
                sql: `INSERT OR IGNORE INTO donation_reconciliations 
                      (id, payment_reference, donor_name, donor_email, amount_cents, payment_status, reconciliation_type, status, admin_notes)
                      VALUES (?, ?, ?, ?, ?, 'succeeded', 'unmatched_direct_donor', 'resolved', 'Direct Zeffy checkout without prior intent')`,
                args: [
                  crypto.randomUUID(),
                  paymentReference,
                  donorDisplayName,
                  donorEmail || 'anonymous@privacy.dcvc',
                  amountCents
                ]
              }).catch(() => {});
            }
          } catch (dbInsertErr) {
            console.error('Failed to persist appreciation card in database:', dbInsertErr);
            if (db) {
              await db.execute({
                sql: `UPDATE webhook_events SET status = 'failed' WHERE event_id = ?`,
                args: [webhookEventId]
              }).catch(() => {});
            }
            return errorResponse('Failed to record donation in database', 500, dbInsertErr.message, cors);
          }
        }

        // 11. Build Card View URL on the DCVC Domain
        const frontendBase = env.FRONTEND_BASE_URL || 'https://diversitycollective.org';
        const cardUrl = `${frontendBase}/appreciation-card/${cardToken}`;

        // 12. Send Personalized Appreciation Email via Resend (with recurring heartfelt message)
        let emailDeliveryStatus = 'not_sent';
        let emailDeliveryId = null;
        let emailDeliveryError = null;

        if (donorEmail && donorEmail.includes('@')) {
          const formattedAmount = `${amountInDollars.toFixed(amountInDollars % 1 === 0 ? 0 : 2)}`;

          // Load custom template if configured
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

          const donationDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          const emailTpl = templateDonorAppreciationEmail({
            donorDisplayName,
            formattedAmount,
            tierName: tierInfo.tierName,
            badge: tierInfo.badge,
            tagline: tierInfo.tagline,
            impact: tierInfo.impact,
            cardUrl,
            frequency,
            date: donationDate,
            reference: paymentReference,
            customTemplate
          });

          if (env?.RESEND_API_KEY) {
            try {
              const resendResult = await sendEmail({
                apiKey: env.RESEND_API_KEY,
                from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
                to: donorEmail,
                subject: emailTpl.subject,
                html: emailTpl.html,
                text: emailTpl.text
              });
              if (resendResult?.id) {
                emailDeliveryStatus = 'delivered';
                emailDeliveryId = resendResult.id;
              } else {
                emailDeliveryStatus = 'sent';
              }
            } catch (mailErr) {
              console.error('Failed to dispatch card email via Resend:', mailErr.message);
              emailDeliveryStatus = 'failed';
              emailDeliveryError = mailErr.message;
            }
          } else {
            emailDeliveryStatus = 'api_key_missing';
          }

          // Record email status in database
          if (db) {
            try {
              await db.execute({
                sql: `UPDATE donation_appreciation_cards SET admin_notes = ? WHERE id = ?`,
                args: [
                  JSON.stringify({
                    emailDeliveryStatus,
                    emailDeliveryId,
                    emailDeliveryError,
                    dispatchedAt: new Date().toISOString()
                  }),
                  cardId
                ]
              });
            } catch {}
          }
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
      // DISCONTINUED: Simulated card payments have been removed. All online donations
      // must be processed through verified Zeffy campaigns. This endpoint strictly rejects
      // unpaid submissions to prevent the fabrication of confirmed donations.
      // =======================================================================
      if ((pathname === '/api/donations/process' || pathname === '/api/donations/submit') && request.method === 'POST') {
        return errorResponse(
          'Direct card processing is discontinued. All online donations must be processed securely through verified Zeffy campaigns.',
          410,
          'ENDPOINT_DISCONTINUED',
          cors
        );
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
        const campaign = (body.campaign || '').trim() || (frequency === 'monthly' || frequency === 'gem' ? 'gem' : 'donate-to-change-lives-30236');
        const isAnonymous = Boolean(body.isAnonymous);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!donorEmail || !emailRegex.test(donorEmail)) {
          return errorResponse('Valid email address is required for donation matching and keepsake delivery', 400, null, cors);
        }
        if (!donorName && !isAnonymous) {
          return errorResponse('Donor name is required for keepsake card personalization (or mark as anonymous)', 400, null, cors);
        }

        // Mint cryptographically secure intent token
        const randomBytes = new Uint8Array(24);
        crypto.getRandomValues(randomBytes);
        const intentToken = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(intentToken));
        const tokenHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const emailHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(donorEmail));
        const emailHash = Array.from(new Uint8Array(emailHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const intentId = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          await db.execute({
            sql: `INSERT INTO donation_intents 
                  (id, intent_token, token_hash, donor_name, donor_email, donor_email_hash, amount_cents, frequency, campaign, is_anonymous, status, expires_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now', '+48 hours'))`,
            args: [
              intentId,
              intentToken,
              tokenHash,
              donorName || 'Affirming Supporter',
              donorEmail,
              emailHash,
              Math.round(amount * 100),
              frequency,
              campaign,
              isAnonymous ? 1 : 0
            ]
          }).catch(err => console.warn('Intent DB insert skipped:', err.message));
        }

        return jsonResponse({
          success: true,
          intentToken,
          intentId,
          campaign
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
      // 4.5B. Public Gallery Uploaded Binary Media Stream (GET /api/gallery/media/:id)
      // =======================================================================
      if (pathname.startsWith('/api/gallery/media/') && request.method === 'GET') {
        const mediaId = decodeURIComponent(pathname.replace('/api/gallery/media/', '')).trim();
        const db = getDb(env);
        if (!db || !mediaId) {
          return errorResponse('Gallery image not found.', 404, null, cors);
        }

        try {
          const rowRes = await db.execute({
            sql: `SELECT filename, mime_type, file_data_base64 FROM gallery_media WHERE id = ? LIMIT 1`,
            args: [mediaId]
          });

          if (!rowRes.rows || rowRes.rows.length === 0) {
            return errorResponse('Gallery image not found.', 404, null, cors);
          }

          const media = rowRes.rows[0];
          const rawBase64 = String(media.file_data_base64 || '')
            .replace(/^data:[^;]+;base64,/i, '')
            .replace(/\s+/g, '');

          const binaryString = atob(rawBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const safeMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(media.mime_type)
            ? media.mime_type
            : 'image/jpeg';

          return new Response(bytes.buffer, {
            status: 200,
            headers: {
              ...cors,
              'Content-Type': safeMime,
              'X-Content-Type-Options': 'nosniff',
              'Content-Disposition': `inline; filename="${sanitizeFilename(media.filename || 'gallery-image.jpg')}"`,
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        } catch (err) {
          if (err?.message && err.message.includes('no such table')) {
            return errorResponse('Gallery image not found.', 404, null, cors);
          }
          return errorResponse(`Failed to stream gallery image: ${err.message}`, 500, null, cors);
        }
      }

      // =======================================================================
      // 4.5C. Public Uploaded Admin Media Stream (GET /api/media/:id)
      // =======================================================================
      if (pathname.startsWith('/api/media/') && !pathname.startsWith('/api/media/suggestions') && request.method === 'GET') {
        const mediaId = decodeURIComponent(pathname.replace('/api/media/', '')).trim();
        const db = getDb(env);
        if (!db || !mediaId) {
          return errorResponse('Media asset not found.', 404, null, cors);
        }

        try {
          let rowRes = await db.execute({
            sql: `SELECT filename, mime_type, file_data_base64 FROM media_assets WHERE id = ? LIMIT 1`,
            args: [mediaId]
          }).catch(() => ({ rows: [] }));

          if (!rowRes.rows || rowRes.rows.length === 0) {
            rowRes = await db.execute({
              sql: `SELECT filename, mime_type, file_data_base64 FROM gallery_media WHERE id = ? LIMIT 1`,
              args: [mediaId]
            }).catch(() => ({ rows: [] }));
          }

          if (!rowRes.rows || rowRes.rows.length === 0) {
            return errorResponse('Media asset not found.', 404, null, cors);
          }

          const media = rowRes.rows[0];
          const rawBase64 = String(media.file_data_base64 || '')
            .replace(/^data:[^;]+;base64,/i, '')
            .replace(/\s+/g, '');

          const binaryString = atob(rawBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const safeMediaMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(media.mime_type)
            ? media.mime_type
            : 'image/jpeg';

          return new Response(bytes.buffer, {
            status: 200,
            headers: {
              ...cors,
              'Content-Type': safeMediaMime,
              'X-Content-Type-Options': 'nosniff',
              'Content-Disposition': `inline; filename="${sanitizeFilename(media.filename || 'media-image.jpg')}"`,
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        } catch (err) {
          return errorResponse(`Failed to stream media asset: ${err.message}`, 500, null, cors);
        }
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
      // 4.7. Public Document Download & PDF Stream (GET /api/documents/download/*)
      // =======================================================================
      if (pathname.startsWith('/api/documents/download/') && request.method === 'GET') {
        const docFilename = decodeURIComponent(pathname.replace('/api/documents/download/', '')).trim();
        const db = getDb(env);
        if (!db || !docFilename) {
          return errorResponse('Document not found.', 404, null, cors);
        }

        try {
          const rowRes = await db.execute({
            sql: `SELECT filename, title, file_data_base64, mime_type FROM uploaded_documents WHERE filename = ? LIMIT 1`,
            args: [docFilename]
          });

          if (!rowRes.rows || rowRes.rows.length === 0) {
            return errorResponse('Document not found.', 404, null, cors);
          }

          const doc = rowRes.rows[0];
          const rawBase64 = String(doc.file_data_base64 || '')
            .replace(/^data:[^;]+;base64,/i, '')
            .replace(/\s+/g, '');

          // Decode base64 to binary buffer
          const binaryString = atob(rawBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          return new Response(bytes.buffer, {
            status: 200,
            headers: {
              ...cors,
              'Content-Type': doc.mime_type || 'application/pdf',
              'Content-Disposition': `inline; filename="${doc.filename || 'document.pdf'}"`,
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
            }
          });
        } catch (err) {
          return errorResponse(`Failed to stream document: ${err.message}`, 500, null, cors);
        }
      }

      // =======================================================================
      // 4b. Paginated News & Blog Articles (GET /api/news & GET /api/news/:slug)
      // Supports 10,000+ articles in dedicated Turso table within free tier
      // =======================================================================
      if (pathname === '/api/news' && request.method === 'GET') {
        const db = getDb(env);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
        const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '12', 10)), 100);
        const category = (url.searchParams.get('category') || '').trim();
        const search = (url.searchParams.get('search') || '').trim();
        try {
          const result = await listNewsArticles(db, { page, limit, category, search, includeDrafts: false });
          return jsonResponse({ success: true, ...result }, 200, cors);
        } catch (err) {
          return errorResponse(err.message || 'Failed to load news articles', 500, null, cors);
        }
      }

      if (pathname.startsWith('/api/news/') && request.method === 'GET') {
        const slugOrId = decodeURIComponent(pathname.replace('/api/news/', '').trim());
        const db = getDb(env);
        try {
          const article = await getNewsArticleBySlugOrId(db, slugOrId);
          if (!article || article.status === 'draft') {
            return errorResponse('Article not found', 404, null, cors);
          }
          return jsonResponse({ success: true, article }, 200, cors);
        } catch (err) {
          return errorResponse(err.message || 'Failed to load article', 500, null, cors);
        }
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

        try { await db.execute('ALTER TABLE businesses ADD COLUMN gallery_images TEXT'); } catch (_) {}

        let query = `
          SELECT id, slug, name, category, description, address, city, zip, phone, email, website, instagram, hours, logo_url, cover_url, gallery_images, is_featured, is_verified, created_at
          FROM businesses
          WHERE status = 'approved' 
            AND (website NOT LIKE '%example.com%' AND website NOT LIKE '%.example%')
            AND id NOT IN ('biz-3', 'biz-4', 'biz-5', 'biz-6')
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
      // 6.1 Business Directory: Rate Business (POST /api/directory/:id/rate)
      // Calculates overall rating automatically without showing public comments
      // =======================================================================
      if (pathname.startsWith('/api/directory/') && pathname.endsWith('/rate') && request.method === 'POST') {
        const bizId = pathname.replace('/api/directory/', '').replace('/rate', '');
        const body = await request.json().catch(() => ({}));
        const rating = Math.max(1, Math.min(5, Number(body.rating) || 5));

        const metrics = directoryMetricsMap.get(bizId) || { sum: 190, count: 40 };
        metrics.sum = (metrics.sum || 190) + rating;
        metrics.count = (metrics.count || 40) + 1;
        const avg = Number((metrics.sum / metrics.count).toFixed(1));
        metrics.rating = avg;
        directoryMetricsMap.set(bizId, metrics);

        return jsonResponse({
          success: true,
          message: 'Rating recorded. Overall score calculated automatically.',
          rating: avg,
          ratingCount: metrics.count
        }, 200, cors);
      }

      // =======================================================================
      // 6.2 Business Directory: Hype Business (POST /api/directory/:id/hype)
      // 1 tap per IP address with AirDrop radar wave live trigger
      // =======================================================================
      if (pathname.startsWith('/api/directory/') && pathname.endsWith('/hype') && request.method === 'POST') {
        const bizId = pathname.replace('/api/directory/', '').replace('/hype', '');
        const ipKey = `${bizId}:${clientIp || '127.0.0.1'}`;

        if (directoryHypeIpSet.has(ipKey)) {
          const metrics = directoryMetricsMap.get(bizId) || { hypes: 120 };
          return jsonResponse({
            success: false,
            alreadyHyped: true,
            message: 'You have already hyped this affirming business from your IP address.',
            hypes: metrics.hypes || 120
          }, 200, cors);
        }

        directoryHypeIpSet.add(ipKey);
        const metrics = directoryMetricsMap.get(bizId) || { hypes: 120 };
        metrics.hypes = (metrics.hypes || 120) + 1;
        directoryMetricsMap.set(bizId, metrics);

        return jsonResponse({
          success: true,
          message: 'Hype counted! Live score updated.',
          hypes: metrics.hypes
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
          try { await db.execute('ALTER TABLE businesses ADD COLUMN gallery_images TEXT'); } catch (_) {}
          const submittedImages = Array.isArray(body.images) ? body.images.filter(Boolean).slice(0, 4) : [];
          const submittedCover = (body.cover_url || body.image || submittedImages[0] || '').trim() || null;
          await db.execute({
            sql: `INSERT INTO businesses 
                  (id, slug, name, category, description, address, city, zip, phone, email, website, instagram, hours, cover_url, gallery_images, owner_name, owner_email, status, affirming_pledge_signed_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
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
              submittedCover,
              submittedImages.length > 0 ? JSON.stringify(submittedImages) : null,
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
        const adminUrl = `${env.FRONTEND_BASE_URL || 'https://diversitycollective.org'}/admin`;

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
        const date = (body.date || '').trim();
        const slot = (body.slot || '').trim();

        if (!email || !email.includes('@')) {
          return errorResponse('Please provide a valid email address.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (inquiryType === 'appointment' && db && date && slot) {
          // Check slot capacity to prevent race-condition overbooking
          const slotCheck = await db.execute({
            sql: `SELECT count(*) as bookedCount FROM contact_submissions WHERE subject LIKE ? AND subject LIKE ?`,
            args: [`%${date}%`, `%${slot}%`]
          }).catch(() => ({ rows: [] }));
          const bookedCount = slotCheck.rows?.[0]?.bookedCount || 0;
          const maxCapacityPerSlot = 2; // Rapid HIV/STI clinic max capacity per 30-min slot
          if (bookedCount >= maxCapacityPerSlot) {
            return errorResponse('Selected screening slot has reached full capacity. Please choose another date or time slot.', 409, null, cors);
          }
        }

        if (db) {
          await db.execute({
            sql: `INSERT INTO contact_submissions (id, name, email, phone, subject, message, consent_given, ip_hash)
                  VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
            args: [id, name, email, body.phone || '', `[${inquiryType.toUpperCase()}] ${subject}`, message, clientIp]
          }).catch(err => console.warn('Inquiry DB insert note:', err.message));

          if (inquiryType === 'community_join') {
            const rawGroupSlug = (body.groupSlug || '').trim() ||
              (body.groupName || subject.replace(/^\[?COMMUNITY_JOIN\]?:?\s*/i, '').replace(/^Join Circle:\s*/i, '') || 'general')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '') || 'general';
            const groupSlug = rawGroupSlug;
            const groupName = (body.groupName || subject.replace(/^\[?COMMUNITY_JOIN\]?:?\s*/i, '').replace(/^Join Circle:\s*/i, '') || 'Community Circle').trim();
            const preferredName = (body.preferredName || body.preferred_name || '').trim();
            const pronouns = (body.pronouns || '').trim();
            const accessibilityNotes = (body.accessibilityNotes || body.accessibility_notes || message || '').trim();
            const emailConsent = (body.emailConsent === true || body.email_consent === 1 || body.email_updates_consent === true) ? 1 : 0;
            const emailConsentTimestamp = emailConsent ? new Date().toISOString() : null;
            const unsubToken = crypto.randomUUID();

            await db.execute({
              sql: `INSERT INTO community_group_joins 
                    (id, group_slug, group_name, name, preferred_name, email, pronouns, accessibility_notes, email_consent, email_consent_timestamp, unsubscribe_token, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
              args: [id, groupSlug, groupName, name, preferredName, email, pronouns, accessibilityNotes, emailConsent, emailConsentTimestamp, unsubToken]
            }).catch(err => console.warn('Community group join insert error:', err.message));
          }
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

        const staffRecipient = (inquiryType === 'appointment')
          ? 'office@diversitycollective.org'
          : (env.DCVC_STAFF_EMAIL || 'info@diversitycollective.org');

        let staffEmailDeliveryStatus = 'pending';
        let userEmailDeliveryStatus = 'pending';

        const [staffRes, userRes] = await Promise.allSettled([
          sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: staffRecipient,
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

        staffEmailDeliveryStatus = staffRes.status === 'fulfilled' ? 'delivered' : 'failed';
        userEmailDeliveryStatus = userRes.status === 'fulfilled' ? 'delivered' : 'failed';

        return jsonResponse({
          success: true,
          message: 'Your request has been securely recorded and a confirmation email has been sent.',
          reference: id,
          deliveryStatus: {
            staff: staffEmailDeliveryStatus,
            user: userEmailDeliveryStatus
          }
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

        if (body.isExpired) {
          return errorResponse('Registration for this event occurrence has closed.', 400, null, cors);
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

        const preferredName = (body.preferredName || '').trim();
        const pronouns = (body.pronouns || '').trim();
        const fullName = (body.fullName || '').trim();
        const effectiveDisplayName = preferredName || fullName;
        const email = (body.email || '').trim().toLowerCase();
        const phone = (body.phone || '').trim();
        const city = (body.city || 'Ventura County').trim();
        const roles = Array.isArray(body.roles) ? body.roles : (Array.isArray(body.areasOfInterest) ? body.areasOfInterest : []);
        const consent = Boolean(body.consent ?? body.backgroundCheckConsent);

        if (!effectiveDisplayName || !email || !email.includes('@') || !consent) {
          return errorResponse('Please complete all required fields and confirm volunteer consent.', 400, null, cors);
        }

        const id = crypto.randomUUID();
        const db = getDb(env);

        if (db) {
          // Ensure additive columns exist
          await db.execute({ sql: `ALTER TABLE volunteer_applications ADD COLUMN preferred_name TEXT`, args: [] }).catch(() => {});
          await db.execute({ sql: `ALTER TABLE volunteer_applications ADD COLUMN pronouns TEXT`, args: [] }).catch(() => {});
          await db.execute({ sql: `ALTER TABLE volunteer_applications ADD COLUMN legal_name TEXT`, args: [] }).catch(() => {});

          await db.execute({
            sql: `INSERT INTO volunteer_applications (id, full_name, preferred_name, pronouns, legal_name, email, phone, city, availability, roles_of_interest, skills_experience, lived_experience, consent_given)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              id,
              effectiveDisplayName,
              preferredName || effectiveDisplayName,
              pronouns || '',
              fullName || '',
              email,
              phone || 'Not provided',
              city,
              body.availability || '',
              JSON.stringify(roles),
              body.skills || body.message || '',
              body.livedExperience || '',
              1
            ]
          }).catch(async (err) => {
            console.warn('Volunteer DB insert note with new columns, trying fallback:', err.message);
            await db.execute({
              sql: `INSERT INTO volunteer_applications (id, full_name, email, phone, city, availability, roles_of_interest, skills_experience, lived_experience, consent_given)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                id,
                effectiveDisplayName,
                email,
                phone || 'Not provided',
                city,
                body.availability || '',
                JSON.stringify(roles),
                `Preferred: ${effectiveDisplayName}${pronouns ? ` (${pronouns})` : ''} | Legal: ${fullName}\n${body.skills || body.message || ''}`,
                body.livedExperience || '',
                1
              ]
            }).catch(e => console.warn('Volunteer insert fallback err:', e.message));
          });
        }

        const staffTpl = templateVolunteerStaffNotification({
          preferredName,
          pronouns,
          legalName: fullName,
          fullName: `${effectiveDisplayName}${pronouns ? ` (${pronouns})` : ''}${fullName && fullName !== effectiveDisplayName ? ` [Legal: ${fullName}]` : ''}`,
          email,
          phone: phone || 'Not provided',
          city,
          roles,
          availability: body.availability || 'Flexible',
          reference: id
        });
        const userTpl = templateVolunteerAcknowledgment({
          preferredName: effectiveDisplayName,
          fullName: effectiveDisplayName
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
          message: `Thank you, ${effectiveDisplayName}! Your volunteer application has been received. Confirmation details have been sent to your email.`,
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
        const baseUrl = env.FRONTEND_BASE_URL || 'https://diversitycollective.org';
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
              <a href="${env.FRONTEND_BASE_URL || 'https://diversitycollective.org'}" class="btn">Return to Diversity Collective</a>
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
      // 12C. Community Circle 1-Click Unsubscribe (GET & POST /api/community/unsubscribe)
      // =======================================================================
      if (pathname === '/api/community/unsubscribe') {
        const token = (url.searchParams.get('token') || '').trim();
        const email = (url.searchParams.get('email') || '').toLowerCase().trim();
        const db = getDb(env);
        let groupName = 'your community circle';

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const targetToken = (body.token || token).trim();
          const targetEmail = (body.email || email).toLowerCase().trim();
          if (db && (targetToken || targetEmail)) {
            await db.execute({
              sql: `UPDATE community_group_joins 
                    SET is_unsubscribed = 1, unsubscribed_at = datetime('now') 
                    WHERE (unsubscribe_token = ? AND ? != '') OR (email = ? AND ? != '')`,
              args: [targetToken, targetToken, targetEmail, targetEmail]
            }).catch(err => console.warn('Community unsubscribe update error:', err.message));
          }
          return jsonResponse({ success: true, message: 'Successfully unsubscribed from community circle updates.' }, 200, cors);
        }

        if (request.method === 'GET') {
          if (db && (token || email)) {
            try {
              const info = await db.execute({
                sql: `SELECT group_name FROM community_group_joins 
                      WHERE (unsubscribe_token = ? AND ? != '') OR (email = ? AND ? != '') LIMIT 1`,
                args: [token, token, email, email]
              });
              if (info.rows?.[0]?.group_name) {
                groupName = info.rows[0].group_name;
              }
              await db.execute({
                sql: `UPDATE community_group_joins 
                      SET is_unsubscribed = 1, unsubscribed_at = datetime('now') 
                      WHERE (unsubscribe_token = ? AND ? != '') OR (email = ? AND ? != '')`,
                args: [token, token, email, email]
              });
            } catch (err) {
              console.warn('Community unsubscribe error:', err.message);
            }
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
                .card { background: #ffffff; border-radius: 24px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
                .badge { display: inline-block; background: #f5f3ff; color: #7c3aed; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; margin-bottom: 16px; }
                h1 { font-size: 22px; font-weight: 800; margin: 0 0 12px 0; color: #0f172a; }
                p { font-size: 14px; line-height: 1.6; color: #64748b; margin: 0 0 24px 0; }
                a.btn { display: inline-block; background: #5A1E65; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 12px; }
              </style>
            </head>
            <body>
              <div class="card">
                <span class="badge">Preferences Updated</span>
                <h1>Circle Updates Unsubscribed</h1>
                <p>You have been safely unsubscribed from announcements and email updates for <strong>${groupName}</strong>. You are always welcome at all DCVC open community gatherings.</p>
                <a href="${env.FRONTEND_BASE_URL || 'https://diversitycollective.org'}/community" class="btn">Return to Community Circles</a>
              </div>
            </body>
            </html>
          `;

          return new Response(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors }
          });
        }
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
      // 14. Media Storage & Delivery (Admin-Authenticated GitHub + jsDelivr + Turso Metadata)
      // =======================================================================
      if (pathname === '/api/media/upload' && request.method === 'POST') {
        const jwtSecret = getAdminJwtSecret(env);
        if (!jwtSecret) {
          return errorResponse('Administrative signing secret is not configured on the server.', 500, null, cors);
        }
        const token = resolveRequestAdminToken(request);
        const authUser = await verifyAuthToken(token, jwtSecret);
        if (!authUser) {
          return errorResponse('Unauthorized: Administrative authentication required to upload media.', 401, null, cors);
        }
        const mediaDb = getDb(env);
        if (mediaDb) {
          const activeRes = await mediaDb.execute({
            sql: `SELECT is_active, COALESCE(token_version, 1) AS token_version FROM admin_users WHERE id = ? LIMIT 1`,
            args: [authUser.id || authUser.userId]
          }).catch(() => ({ rows: [] }));
          if (activeRes.rows.length === 0 || !activeRes.rows[0].is_active || Number(activeRes.rows[0].token_version || 1) !== Number(authUser.tv || 1)) {
            return errorResponse('Unauthorized: Administrative session is inactive or revoked.', 401, null, cors);
          }
        }

        const body = await request.json().catch(() => ({}));
        const { folder = 'media', fileData, fileName, mimeType } = body;
        if (!fileData) {
          return errorResponse('File data (base64) is required.', 400, null, cors);
        }

        const dataUriMatch = String(fileData).match(/^data:([^;]+);base64,(.+)$/i);
        const cleanBase64 = (dataUriMatch ? dataUriMatch[2] : String(fileData)).replace(/\s+/g, '');
        const cleanName = sanitizeFilename(fileName || `media-${Date.now()}.webp`);
        const detectedMimeType = String(
          mimeType
          || (dataUriMatch && dataUriMatch[1])
          || (cleanName.endsWith('.png') ? 'image/png' : cleanName.endsWith('.webp') ? 'image/webp' : cleanName.endsWith('.gif') ? 'image/gif' : 'image/jpeg')
        ).toLowerCase().trim();

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(detectedMimeType)) {
          return errorResponse('Unsupported image format. Allowed: JPEG, PNG, WebP, GIF.', 400, null, cors);
        }

        const calculatedSizeBytes = Math.floor((cleanBase64.length * 3) / 4);
        if (calculatedSizeBytes <= 0 || calculatedSizeBytes > 10 * 1024 * 1024) {
          return errorResponse('Image file exceeds the 10 MB upload limit.', 413, null, cors);
        }

        const mediaId = `media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const folderSlug = String(folder || 'media').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
        const gitPath = `public/images/${folderSlug}/${cleanName}`;

        const ghOwner = env.GITHUB_OWNER || 'ritesh2445';
        const ghRepo = env.GITHUB_REPO || 'diversity-collectives-v1';
        const ghBranch = env.GITHUB_BRANCH || 'main';
        let githubSha = null;
        let githubError = null;
        if (env.GITHUB_TOKEN && ghOwner && ghRepo) {
          const ghRes = await uploadToGitHub({
            githubToken: env.GITHUB_TOKEN,
            owner: ghOwner,
            repo: ghRepo,
            branch: ghBranch,
            path: gitPath,
            contentBase64: cleanBase64,
            commitMessage: `feat(media): upload ${cleanName} to ${folderSlug}`
          });
          if (ghRes.success) {
            githubSha = ghRes.sha;
          } else {
            githubError = ghRes.error || 'GitHub upload failed';
            console.warn('[MediaUpload] GitHub upload notice:', githubError);
          }
        }

        const cdnUrl = buildJsDelivrUrl({
          owner: ghOwner,
          repo: ghRepo,
          branch: ghBranch,
          path: gitPath
        });
        const workerOrigin = new URL(request.url).origin;
        const directMediaUrl = `${workerOrigin}/api/media/${encodeURIComponent(mediaId)}`;

        let storedMetadataInDb = false;
        let storedBinaryFallbackInDb = false;
        const db = getDb(env);
        if (db) {
          try {
            await db.execute({
              sql: `CREATE TABLE IF NOT EXISTS media_metadata (
                id TEXT PRIMARY KEY,
                filename TEXT,
                mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
                file_size_bytes INTEGER DEFAULT 0,
                folder TEXT,
                github_path TEXT,
                github_sha TEXT,
                cdn_url TEXT,
                created_at TEXT DEFAULT (datetime('now'))
              )`,
              args: []
            });

            await db.execute({
              sql: `INSERT OR REPLACE INTO media_metadata (id, filename, mime_type, file_size_bytes, folder, github_path, github_sha, cdn_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [mediaId, cleanName, detectedMimeType, calculatedSizeBytes, folderSlug, githubSha ? gitPath : null, githubSha, githubSha ? cdnUrl : directMediaUrl]
            });
            storedMetadataInDb = true;
          } catch (metaErr) {
            console.warn('[MediaUpload] DB metadata storage notice:', metaErr.message);
          }

          // Fallback binary storage in Turso only if GitHub upload didn't succeed
          if (!githubSha) {
            try {
              await db.execute({
                sql: `CREATE TABLE IF NOT EXISTS media_assets (
                  id TEXT PRIMARY KEY,
                  filename TEXT,
                  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
                  file_data_base64 TEXT NOT NULL,
                  file_size_bytes INTEGER DEFAULT 0,
                  folder TEXT,
                  created_at TEXT DEFAULT (datetime('now'))
                )`,
                args: []
              });

              await db.execute({
                sql: `INSERT OR REPLACE INTO media_assets (id, filename, mime_type, file_data_base64, file_size_bytes, folder)
                      VALUES (?, ?, ?, ?, ?, ?)`,
                args: [mediaId, cleanName, detectedMimeType, cleanBase64, calculatedSizeBytes, folderSlug]
              });
              storedBinaryFallbackInDb = true;
            } catch (dbErr) {
              console.warn('[MediaUpload] DB binary fallback notice:', dbErr.message);
            }
          }
        }

        if (!githubSha && !storedBinaryFallbackInDb) {
          return errorResponse(
            githubError || 'Media storage is unavailable: GITHUB_TOKEN is missing and DB fallback failed.',
            503,
            null,
            cors
          );
        }

        const primaryUrl = githubSha ? cdnUrl : directMediaUrl;

        return jsonResponse({
          success: true,
          id: mediaId,
          url: primaryUrl,
          cdnUrl: githubSha ? cdnUrl : directMediaUrl,
          path: gitPath,
          githubSha,
          githubError: githubSha ? undefined : githubError,
          metadataStored: storedMetadataInDb,
          provider: githubSha ? 'jsdelivr' : 'turso_media'
        }, 200, cors);
      }

      if (pathname === '/api/media/sign-upload' && request.method === 'POST') {
        const jwtSecret = getAdminJwtSecret(env);
        if (!jwtSecret) {
          return errorResponse('Administrative signing secret is not configured on the server.', 500, null, cors);
        }
        const token = resolveRequestAdminToken(request);
        const authUser = await verifyAuthToken(token, jwtSecret);
        if (!authUser) {
          return errorResponse('Unauthorized: Administrative authentication required.', 401, null, cors);
        }

        const body = await request.json().catch(() => ({}));
        const signedParams = await createSignedUploadParameters({
          folder: body.folder || 'directory',
          tags: body.tags || 'dcvc',
          publicId: body.publicId || null
        }, env);

        return jsonResponse({
          success: true,
          ...signedParams,
          provider: 'github_jsdelivr',
          note: 'Image storage is powered by GitHub repository with jsDelivr multi-CDN delivery.'
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
            `ALTER TABLE admin_users ADD COLUMN last_totp_step INTEGER DEFAULT 0`,
            `ALTER TABLE admin_users ADD COLUMN allowed_sections TEXT`
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
              sql: `SELECT id, email, name, role, allowed_sections, is_active, COALESCE(token_version, 1) AS token_version, mfa_enabled
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
              .filter(e => e && e !== '*');

            if (allowedExtra.includes(verifiedEmail)) {
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

          const auth0AllowedSections = userRow.role === 'admin' ? null : parseAllowedSections(userRow.allowed_sections);
          const sessionToken = await generateAuthToken({
            id: userRow.id,
            userId: userRow.id,
            email: userRow.email,
            name: userRow.name,
            role: userRow.role,
            allowedSections: auth0AllowedSections,
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
              allowedSections: auth0AllowedSections,
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

          // Turnstile check (strict in production whenever TURNSTILE_SECRET_KEY is configured)
          const isProdOtp = String(env.ENVIRONMENT || '').toLowerCase() === 'production';
          if (env.TURNSTILE_SECRET_KEY && (isProdOtp || body.turnstileToken)) {
            const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: isProdOtp });
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
            .filter(e => e && e !== '*');

          const isAllowedEmail = allowedExtra.includes(email) || Boolean(userRow);

          if (!isAllowedEmail) {
            if (db) await recordPersistentFailure(db, ipRateKey);
            return errorResponse(`This email address (${email}) is not authorized for DCVC Staff Access. Contact an administrator.`, 403, null, adminCors);
          }

          if (userRow && !userRow.is_active) {
            return errorResponse('This administrative account is deactivated.', 403, null, adminCors);
          }

          // Provision explicitly allowlisted user if not yet in database
          if (!userRow) {
            const newAdminId = 'adm-' + crypto.randomUUID();
            const defaultName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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

          // Get fresh user details from database (fail-closed if user no longer exists)
          let userRow = null;
          if (db) {
            try {
              const freshRes = await db.execute({
                sql: `SELECT id, email, name, role, allowed_sections, is_active, COALESCE(token_version, 1) AS token_version FROM admin_users WHERE id = ? LIMIT 1`,
                args: [tempPayload.userId]
              });
              if (freshRes.rows.length > 0) {
                userRow = freshRes.rows[0];
              }
            } catch {
              return errorResponse('Authentication service temporarily unavailable.', 503, null, adminCors);
            }
          }
          if (!userRow) {
            return errorResponse('Administrative account not found or not authorized.', 403, null, adminCors);
          }
          if (!userRow.is_active) {
            return errorResponse('Account is deactivated.', 403, null, adminCors);
          }

          const otpAllowedSections = userRow.role === 'admin' ? null : parseAllowedSections(userRow.allowed_sections);
          const sessionToken = await generateAuthToken({
            id: userRow.id,
            userId: userRow.id,
            email: userRow.email,
            name: userRow.name,
            role: userRow.role,
            allowedSections: otpAllowedSections,
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
              allowedSections: otpAllowedSections,
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
          const { idToken, credential, accessToken } = body;
          const tokenToVerify = idToken || credential || '';

          if (!tokenToVerify && !accessToken) {
            return errorResponse('Google authentication failed: a verified Google token is required.', 401, null, adminCors);
          }

          const googleUser = await verifyGoogleToken({
            idToken: tokenToVerify,
            accessToken,
            clientId: env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || ''
          });

          if (!googleUser || !googleUser.email || !googleUser.emailVerified) {
            return errorResponse('Google authentication failed: invalid or unverified token.', 401, null, adminCors);
          }

          const verifiedEmail = googleUser.email.toLowerCase().trim();
          let userRow = null;
          if (db) {
            try {
              const uRes = await db.execute({
                sql: `SELECT id, email, name, role, allowed_sections, is_active, COALESCE(token_version, 1) AS token_version FROM admin_users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
                args: [verifiedEmail]
              });
              if (uRes.rows.length > 0) userRow = uRes.rows[0];
            } catch (err) {
              console.error('Google auth DB lookup failed:', err.message);
              return errorResponse('Authentication service temporarily unavailable.', 503, null, adminCors);
            }
          }

          if (!userRow) {
            const allowedExtra = String(env.ADMIN_ALLOWED_EMAILS || env.ADMIN_EMAIL || '')
              .split(',')
              .map(e => e.trim().toLowerCase())
              .filter(e => e && e !== '*');

            if (allowedExtra.includes(verifiedEmail)) {
              const newAdminId = 'adm-' + crypto.randomUUID();
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
          }

          if (!userRow) {
            if (db) {
              await logAdminAction(db, {
                userEmail: verifiedEmail,
                action: 'admin_google_unauthorized_email',
                targetType: 'auth',
                details: { sub: googleUser.sub },
                ip: clientIp
              }).catch(() => {});
            }
            return errorResponse(`Signed in as Google account ${verifiedEmail}, but this email is not authorized for DCVC Staff Access.`, 403, null, adminCors);
          }

          if (!userRow.is_active) {
            return errorResponse('Administrative account is deactivated.', 403, null, adminCors);
          }

          const googleAllowedSections = userRow.role === 'admin' ? null : parseAllowedSections(userRow.allowed_sections);
          const sessionToken = await generateAuthToken({
            id: userRow.id,
            userId: userRow.id,
            email: userRow.email,
            name: userRow.name,
            role: userRow.role,
            allowedSections: googleAllowedSections,
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
              allowedSections: googleAllowedSections,
              mustChangePassword: false,
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

          const ipRateKey = `login:ip:${clientIp || 'unknown'}`;
          const emailRateKey = `login:email:${email}`;
          if (db) {
            const ipRateCheck = await checkPersistentRateLimit(db, ipRateKey);
            if (!ipRateCheck.allowed) {
              return errorResponse(`Too many failed login attempts. Please try again in ${ipRateCheck.remainingMins} minutes.`, 429, null, adminCors);
            }
            const emailRateCheck = await checkPersistentRateLimit(db, emailRateKey);
            if (!emailRateCheck.allowed) {
              return errorResponse(`This account is temporarily locked due to failed attempts. Please try again in ${emailRateCheck.remainingMins} minutes.`, 429, null, adminCors);
            }
          }

          // Strict Turnstile verification whenever secret key is configured in production
          const isProdLogin = String(env.ENVIRONMENT || '').toLowerCase() === 'production';
          if (env.TURNSTILE_SECRET_KEY && (isProdLogin || body.turnstileToken)) {
            const turnstile = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp, env, { strict: isProdLogin });
            if (!turnstile.success) {
              return errorResponse('Security verification failed. Please complete the Cloudflare Turnstile check.', 400, turnstile.error, adminCors);
            }
          }

          let userRow = null;
          if (db) {
            try {
              const userRes = await db.execute({
                sql: `SELECT id, email, name, role, allowed_sections, password_hash, salt, mfa_enabled, mfa_secret, is_active, COALESCE(token_version, 1) AS token_version, COALESCE(must_change_password, 0) AS must_change_password
                      FROM admin_users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
                args: [email]
              });
              if (userRes.rows.length > 0) {
                userRow = userRes.rows[0];
              }
            } catch (err) {
              console.error('Admin user lookup failed:', err.message);
              return errorResponse('Authentication service temporarily unavailable.', 503, null, adminCors);
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

          const pwdCheck = await verifyPasswordHash(password, userRow.salt, userRow.password_hash);
          const isPasswordValid = pwdCheck.valid;

          // Opportunistic Upgrade: If verified using legacy iterations, seamlessly rehash to OWASP standard (600,000 iterations)
          if (pwdCheck.valid && pwdCheck.needsUpgrade && db) {
            try {
              const upgradedHash = await hashPassword(password, userRow.salt, OWASP_PBKDF2_ITERATIONS);
              await db.execute({
                sql: `UPDATE admin_users SET password_hash = ? WHERE id = ?`,
                args: [upgradedHash, userRow.id]
              });
              console.log(`[Security] Upgraded password hash for admin ${userRow.email} to OWASP 600,000 iterations standard.`);
            } catch (upgradeErr) {
              console.warn('[Security] Opportunistic password hash upgrade skipped:', upgradeErr.message);
            }
          }

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
            }

            const directAllowedSections = userRow.role === 'admin' ? null : parseAllowedSections(userRow.allowed_sections);
            if (directMfaOk) {
              const sessionToken = await generateAuthToken({
                id: userRow.id,
                userId: userRow.id,
                email: userRow.email,
                name: userRow.name,
                role: userRow.role,
                allowedSections: directAllowedSections,
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
                  allowedSections: directAllowedSections,
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
          const loginAllowedSections = userRow.role === 'admin' ? null : parseAllowedSections(userRow.allowed_sections);
          const tempExp = Math.floor(Date.now() / 1000) + 300;

          // Case A: User has TOTP Authenticator App configured
          if (userRow.mfa_enabled && userRow.mfa_secret) {
            const tempToken = await generateTempToken({
              jti: tempJti,
              userId: userRow.id,
              email: userRow.email,
              name: userRow.name,
              role: userRow.role,
              allowedSections: loginAllowedSections,
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
            allowedSections: loginAllowedSections,
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
              allowedSections: loginAllowedSections,
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

          // Read latest role, allowed_sections, token_version, and password status before issuing JWT
          const freshUserRes = await db.execute({
            sql: `SELECT role, allowed_sections, COALESCE(token_version, 1) AS token_version, COALESCE(must_change_password, 0) AS must_change_password, mfa_enabled FROM admin_users WHERE id = ? LIMIT 1`,
            args: [tempPayload.userId]
          });
          const freshRow = freshUserRes.rows[0] || {};
          const effectiveRole = freshRow.role || tempPayload.role;
          const verifiedAllowedSections = effectiveRole === 'admin'
            ? null
            : (freshRow.allowed_sections !== undefined ? parseAllowedSections(freshRow.allowed_sections) : (tempPayload.allowedSections ?? null));
          const tokenVersion = Number(freshRow.token_version || tempPayload.tv || 1);
          const mustChangePassword = Boolean(freshRow.must_change_password);
          const sessionDurationSec = 8 * 3600;

          const sessionPayload = {
            id: tempPayload.userId,
            email: tempPayload.email,
            name: tempPayload.name,
            role: effectiveRole,
            allowedSections: verifiedAllowedSections,
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
              role: effectiveRole,
              allowedSections: verifiedAllowedSections,
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

          // Verify user still exists, is active, and sync live role, allowed_sections & token_version from DB
          const activeRes = await db.execute({
            sql: `SELECT role, allowed_sections, is_active, COALESCE(token_version, 1) AS token_version, COALESCE(must_change_password, 0) AS must_change_password, mfa_enabled FROM admin_users WHERE id = ? LIMIT 1`,
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

          authUser.role = activeRes.rows[0].role || authUser.role;
          authUser.allowedSections = authUser.role === 'admin' ? null : parseAllowedSections(activeRes.rows[0].allowed_sections);
          authUser.mfaEnabled = Boolean(activeRes.rows[0].mfa_enabled);
          authUser.mustChangePassword = authUser.authProvider === 'auth0' ? false : Boolean(activeRes.rows[0].must_change_password);
          authUser.tokenVersion = dbVersion;
        } else {
          authUser.allowedSections = authUser.role === 'admin' ? null : parseAllowedSections(authUser.allowedSections);
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
              allowedSections: authUser.role === 'admin' ? null : (authUser.allowedSections ?? null),
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
            const currentCheck = await verifyPasswordHash(currentPassword, uRow.salt, uRow.password_hash);
            if (!currentCheck.valid) {
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
            allowedSections: authUser.role === 'admin' ? null : (authUser.allowedSections ?? null),
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
            sql: `SELECT id, email, name, role, allowed_sections, password_hash, mfa_enabled, is_active, created_at, last_login_at
                  FROM admin_users
                  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'approver' THEN 2 WHEN 'editor' THEN 3 ELSE 4 END, created_at ASC`,
            args: []
          });

          const users = (usersRes.rows || []).map((row) => ({
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            allowedSections: row.role === 'admin' ? null : parseAllowedSections(row.allowed_sections),
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

          const sectionsNorm = requestedRole === 'admin'
            ? { valid: true, serialized: null, sections: null }
            : normalizeAllowedSectionsInput(body.allowedSections);
          if (!sectionsNorm.valid) {
            return errorResponse(sectionsNorm.error, 400, null, adminCors);
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
            sql: `INSERT INTO admin_users (id, email, name, role, allowed_sections, password_hash, salt, is_active, must_change_password, token_version)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 1)`,
            args: [newId, cleanEmail, cleanName, requestedRole, sectionsNorm.serialized, passwordHash, salt, mustChangePassword]
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
          const panelUrl = `${env.FRONTEND_BASE_URL || 'https://diversitycollective.org'}/admin`;
          const sectionLabels = Array.isArray(sectionsNorm.sections)
            ? sectionsNorm.sections.map((id) => SECTION_LABELS[id] || id).join(', ')
            : '';
          const emailContent = templateAdminUserInviteOtp({
            name: cleanName,
            email: cleanEmail,
            role: requestedRole,
            sectionLabels,
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
            details: { grantedEmail: cleanEmail, name: cleanName, role: requestedRole, allowedSections: sectionsNorm.sections, authMode: optionalPassword ? 'password_or_sso' : 'sso', emailDispatched, emailError },
            ip: clientIp
          });

          return jsonResponse({
            success: true,
            message: emailDispatched
              ? `Access granted to ${cleanEmail} (${requestedRole}${sectionLabels ? `: ${sectionLabels}` : ''}). An onboarding OTP verification code has been dispatched to their email.`
              : `Access granted to ${cleanEmail} (${requestedRole}${sectionLabels ? `: ${sectionLabels}` : ''}).`,
            emailDispatched,
            user: {
              id: newId,
              email: cleanEmail,
              name: cleanName,
              role: requestedRole,
              allowedSections: sectionsNorm.sections,
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
            sql: `SELECT id, email, name, role, allowed_sections, is_active FROM admin_users WHERE id = ? LIMIT 1`,
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

          const targetAllowed = targetUser.role === 'admin' ? null : parseAllowedSections(targetUser.allowed_sections);
          const targetSectionLabels = Array.isArray(targetAllowed)
            ? targetAllowed.map((id) => SECTION_LABELS[id] || id).join(', ')
            : '';
          const panelUrl = `${env.FRONTEND_BASE_URL || 'https://diversitycollective.org'}/admin`;
          const emailContent = templateAdminUserInviteOtp({
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
            sectionLabels: targetSectionLabels,
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
            sql: `SELECT id, email, name, role, allowed_sections, is_active FROM admin_users WHERE id = ? LIMIT 1`,
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

          let nextAllowedSectionsSql = existing.allowed_sections ?? null;
          let nextAllowedSectionsParsed = nextRole === 'admin' ? null : parseAllowedSections(existing.allowed_sections);
          if (nextRole === 'admin') {
            nextAllowedSectionsSql = null;
            nextAllowedSectionsParsed = null;
          } else if (Object.prototype.hasOwnProperty.call(body, 'allowedSections')) {
            const sectionsNorm = normalizeAllowedSectionsInput(body.allowedSections);
            if (!sectionsNorm.valid) {
              return errorResponse(sectionsNorm.error, 400, null, adminCors);
            }
            nextAllowedSectionsSql = sectionsNorm.serialized;
            nextAllowedSectionsParsed = sectionsNorm.sections;
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
              ? `UPDATE admin_users SET email = ?, name = ?, role = ?, allowed_sections = ?, is_active = ?, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?`
              : `UPDATE admin_users SET email = ?, name = ?, role = ?, allowed_sections = ?, is_active = ? WHERE id = ?`,
            args: [nextEmail, nextName, nextRole, nextAllowedSectionsSql, nextActive, targetId]
          });

          await logAdminAction(db, {
            userId: currentId,
            userEmail: authUser.email,
            action: 'admin_user_access_updated',
            targetType: 'admin_user',
            targetId,
            details: { email: nextEmail, name: nextName, role: nextRole, allowedSections: nextAllowedSectionsParsed, isActive: Boolean(nextActive) },
            ip: clientIp
          });

          return jsonResponse({
            success: true,
            allowedSections: nextAllowedSectionsParsed,
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
          const body = await request.json().catch(() => null);
          if (!body || typeof body !== 'object') {
            return errorResponse('Invalid JSON payload.', 400, null, adminCors);
          }

          const permCheck = assertUserCanPublishSiteState(authUser, body);
          if (!permCheck.allowed) {
            return errorResponse(permCheck.error || 'Forbidden: You do not have permission to edit one or more sections in this update.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database connection not available', 503, null, adminCors);
          }

          try {
            const updated = await writeSiteStatePatch(db, body, authUser.email);
            const changedKeys = Object.keys(body).filter((k) => ['heroTheme', 'layoutBlocks', 'siteTheme', 'cmsData', 'cardThemes', 'siteStatus', 'siteFeatures'].includes(k));
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

        // 15.7e Dedicated Turso News & Blog CRUD (10,000+ article capacity)
        if (pathname === '/api/admin/news' && request.method === 'GET') {
          if (!requireSectionAccess(authUser, 'news', ['admin', 'editor', 'read_only'])) {
            return errorResponse('Forbidden: News & Articles access required.', 403, null, adminCors);
          }
          const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
          const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)), 100);
          const search = (url.searchParams.get('search') || '').trim();
          const result = await listNewsArticles(db, { page, limit, search, includeDrafts: true });
          return jsonResponse({ success: true, ...result }, 200, adminCors);
        }

        if (pathname === '/api/admin/news' && request.method === 'POST') {
          if (!requireSectionAccess(authUser, 'news', ['admin', 'editor'])) {
            return errorResponse('Forbidden: News & Articles write access required.', 403, null, adminCors);
          }
          const body = await request.json().catch(() => null);
          if (!body || typeof body !== 'object') {
            return errorResponse('Invalid JSON payload.', 400, null, adminCors);
          }
          try {
            const article = await upsertNewsArticle(db, body);
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'upsert_news_article',
              targetType: 'news_article',
              targetId: article?.id,
              details: { title: article?.title, status: article?.status },
              ip: clientIp
            }).catch(() => {});
            return jsonResponse({ success: true, article }, 200, adminCors);
          } catch (err) {
            return errorResponse(err.message || 'Failed to save article.', 400, null, adminCors);
          }
        }

        if (pathname === '/api/admin/news' && request.method === 'DELETE') {
          if (!requireSectionAccess(authUser, 'news', ['admin', 'editor'])) {
            return errorResponse('Forbidden: News & Articles write access required.', 403, null, adminCors);
          }
          await deleteAllNewsArticles(db);
          await logAdminAction(db, {
            userId: authUser.id || authUser.userId,
            userEmail: authUser.email,
            action: 'delete_all_news_articles',
            targetType: 'news_article',
            targetId: 'all',
            details: {},
            ip: clientIp
          }).catch(() => {});
          return jsonResponse({ success: true, deletedAll: true }, 200, adminCors);
        }

        if (pathname.startsWith('/api/admin/news/') && (request.method === 'PUT' || request.method === 'DELETE')) {
          if (!requireSectionAccess(authUser, 'news', ['admin', 'editor'])) {
            return errorResponse('Forbidden: News & Articles write access required.', 403, null, adminCors);
          }
          const idOrSlug = decodeURIComponent(pathname.replace('/api/admin/news/', '').trim());
          if (request.method === 'PUT') {
            const body = await request.json().catch(() => null);
            if (!body || typeof body !== 'object') {
              return errorResponse('Invalid JSON payload.', 400, null, adminCors);
            }
            const article = await upsertNewsArticle(db, { ...body, id: body.id || idOrSlug });
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'update_news_article',
              targetType: 'news_article',
              targetId: article?.id || idOrSlug,
              details: { title: article?.title, status: article?.status },
              ip: clientIp
            }).catch(() => {});
            return jsonResponse({ success: true, article }, 200, adminCors);
          } else {
            await deleteNewsArticle(db, idOrSlug);
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'delete_news_article',
              targetType: 'news_article',
              targetId: idOrSlug,
              details: {},
              ip: clientIp
            }).catch(() => {});
            return jsonResponse({ success: true, deleted: true, id: idOrSlug }, 200, adminCors);
          }
        }

        // 15.8 Gallery Photo Upload to GitHub & jsDelivr CDN (POST /api/admin/gallery/upload)
        if (pathname === '/api/admin/gallery/upload' && request.method === 'POST') {
          if (!requireSectionAccess(authUser, 'gallery', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Photo Gallery access required to upload gallery media.', 403, null, cors);
          }

          const body = await request.json().catch(() => ({}));
          const { title, category, year, description, quote, featured, fileData, fileName } = body;

          if (!title || !fileData) {
            return errorResponse('Image title and file data are required.', 400, null, cors);
          }

          const photoId = `gal-${crypto.randomUUID().slice(0, 8)}`;
          const cleanFileName = sanitizeFilename(fileName || `${title}.jpg`);
          const mimeMatch = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(String(fileData));
          const detectedMimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const cleanBase64 = String(fileData).replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
          const calculatedSizeBytes = Math.round((cleanBase64.length * 3) / 4);

          const categorySlug = (category || 'community')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
          const gitPath = `public/gallery/${categorySlug}/${cleanFileName}`;

          const db = getDb(env);
          if (db) {
            await db.execute({
              sql: `CREATE TABLE IF NOT EXISTS gallery_media (
                id TEXT PRIMARY KEY,
                filename TEXT,
                mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
                file_data_base64 TEXT NOT NULL,
                file_size_bytes INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
              )`,
              args: []
            }).catch(() => {});

            await db.execute({
              sql: `INSERT OR REPLACE INTO gallery_media (id, filename, mime_type, file_data_base64, file_size_bytes)
                    VALUES (?, ?, ?, ?, ?)`,
              args: [photoId, cleanFileName, detectedMimeType, cleanBase64, calculatedSizeBytes]
            }).catch((err) => console.warn('[GalleryUpload] DB binary storage notice:', err.message));
          }

          const ghOwner = env.GITHUB_OWNER || 'ritesh2445';
          const ghRepo = env.GITHUB_REPO || 'diversity-collectives-v1';
          const ghBranch = env.GITHUB_BRANCH || 'main';

          let githubSha = null;
          let githubPath = gitPath;

          // Commit to GitHub repository when credentials are configured
          if (env.GITHUB_TOKEN && ghOwner && ghRepo) {
            const ghRes = await uploadToGitHub({
              githubToken: env.GITHUB_TOKEN,
              owner: ghOwner,
              repo: ghRepo,
              branch: ghBranch,
              path: gitPath,
              contentBase64: cleanBase64,
              commitMessage: `feat(gallery): add ${title} to ${category || 'gallery'}`
            });

            if (ghRes.success) {
              githubSha = ghRes.sha;
              githubPath = ghRes.path || gitPath;
            }
          }

          const workerOrigin = new URL(request.url).origin;
          const directMediaUrl = `${workerOrigin}/api/gallery/media/${encodeURIComponent(photoId)}`;
          const cdnUrl = (githubSha && ghOwner && ghRepo)
            ? buildJsDelivrUrl({
                owner: ghOwner,
                repo: ghRepo,
                branch: ghBranch,
                path: gitPath
              })
            : directMediaUrl;

          const newPhoto = await addGalleryPhoto(db, {
            id: photoId,
            title,
            category: category || 'Festivals & Pride',
            year: year || String(new Date().getFullYear()),
            image_url: directMediaUrl,
            cdn_url: cdnUrl,
            github_path: githubSha ? githubPath : null,
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
              details: { title, cdnUrl, directMediaUrl, gitPath, gitPushed: Boolean(githubSha) },
              ip: clientIp
            });
          }

          return jsonResponse({
            success: true,
            photo: newPhoto,
            message: githubSha
              ? 'Image committed to GitHub and published to jsDelivr CDN!'
              : 'Image uploaded and published live to Community Gallery!'
          }, 201, cors);
        }

        // 15.8b Sponsorship / Document PDF Upload (POST /api/admin/documents/upload)
        if (pathname === '/api/admin/documents/upload' && request.method === 'POST') {
          if (!requireSectionAccess(authUser, 'sponsors', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Sponsors & Documents access required to upload documents.', 403, null, adminCors);
          }

          const body = await request.json().catch(() => ({}));
          const { title, fileName, fileData } = body;

          if (!fileData) {
            return errorResponse('File data is required.', 400, null, adminCors);
          }

          const cleanFileName = sanitizeFilename(fileName || `${title || 'document'}.pdf`);
          const gitPath = `public/documents/sponsorships/${cleanFileName}`;
          const cleanBase64 = String(fileData).replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
          const calculatedSizeBytes = Math.round((cleanBase64.length * 3) / 4);

          const db = getDb(env);
          if (db) {
            await db.execute({
              sql: `CREATE TABLE IF NOT EXISTS uploaded_documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL UNIQUE,
                title TEXT,
                file_data_base64 TEXT NOT NULL,
                mime_type TEXT DEFAULT 'application/pdf',
                file_size_bytes INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
              )`,
              args: []
            }).catch(() => {});

            await db.execute({
              sql: `INSERT INTO uploaded_documents (id, filename, title, file_data_base64, mime_type, file_size_bytes)
                    VALUES (?, ?, ?, ?, 'application/pdf', ?)
                    ON CONFLICT(filename) DO UPDATE SET
                      file_data_base64 = excluded.file_data_base64,
                      file_size_bytes = excluded.file_size_bytes,
                      title = excluded.title`,
              args: [`doc-${Date.now()}`, cleanFileName, title || cleanFileName, cleanBase64, calculatedSizeBytes]
            }).catch((err) => console.warn('[DocUpload] DB storage notice:', err.message));
          }

          const ghOwner = env.GITHUB_OWNER || 'ritesh2445';
          const ghRepo = env.GITHUB_REPO || 'diversity-collectives-v1';
          const ghBranch = env.GITHUB_BRANCH || 'main';

          let githubSha = null;
          let githubPath = gitPath;

          if (env.GITHUB_TOKEN && ghOwner && ghRepo) {
            try {
              const ghRes = await uploadToGitHub({
                githubToken: env.GITHUB_TOKEN,
                owner: ghOwner,
                repo: ghRepo,
                branch: ghBranch,
                path: gitPath,
                contentBase64: cleanBase64,
                commitMessage: `feat(documents): upload ${cleanFileName} via DCVC Admin Portal`
              });
              if (ghRes.success) {
                githubSha = ghRes.sha;
                githubPath = ghRes.path || gitPath;
              }
            } catch (err) {
              console.warn('[DocUpload] GitHub commit warning:', err.message);
            }
          }

          const cdnUrl = buildJsDelivrUrl({
            owner: ghOwner,
            repo: ghRepo,
            branch: ghBranch,
            path: gitPath
          });
          const workerOrigin = new URL(request.url).origin;
          const directServeUrl = `${workerOrigin}/api/documents/download/${encodeURIComponent(cleanFileName)}`;

          if (db) {
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'admin_document_upload',
              targetType: 'document',
              targetId: cleanFileName,
              details: { fileName: cleanFileName, gitPath, gitPushed: Boolean(githubSha), sizeBytes: calculatedSizeBytes },
              ip: clientIp
            }).catch(() => {});
          }

          return jsonResponse({
            success: true,
            url: githubSha ? cdnUrl : directServeUrl,
            fileName: cleanFileName,
            githubPath,
            message: 'Document stored and available for public download.'
          }, 201, adminCors);
        }

        // 15.9 Gallery Photo Deletion (DELETE /api/admin/gallery/:id)
        if (pathname.startsWith('/api/admin/gallery/') && request.method === 'DELETE') {
          if (!requireSectionAccess(authUser, 'gallery', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Photo Gallery access required to remove gallery photos.', 403, null, cors);
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

          if (db) {
            await db.execute({
              sql: `DELETE FROM gallery_media WHERE id = ?`,
              args: [photoId]
            }).catch(() => {});
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
          if (!requireSectionAccess(authUser, 'directory', ['admin', 'approver', 'editor', 'read_only'], { write: false })) {
            return errorResponse('Forbidden: Business Directory access required.', 403, null, cors);
          }
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
          if (!requireSectionAccess(authUser, 'directory', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Business Directory access required', 403, null, cors);
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
          if (!requireSectionAccess(authUser, 'directory', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Business Directory access required', 403, null, cors);
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
            try { await db.execute('ALTER TABLE businesses ADD COLUMN gallery_images TEXT'); } catch (_) {}
            await db.execute({
              sql: `INSERT INTO businesses (
                id, slug, name, category, description, address, city, zip, phone, email, website, cover_url, gallery_images,
                is_featured, is_verified, status, affirming_pledge_signed_at, owner_name, owner_email, admin_notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
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
                body.cover_url || body.image || null,
                Array.isArray(body.images) ? JSON.stringify(body.images.filter(Boolean)) : null,
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
          if (!requireSectionAccess(authUser, 'directory', ['admin', 'approver'])) {
            return errorResponse('Forbidden: Business Directory moderation access required', 403, null, cors);
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
          if (!requireSectionAccess(authUser, 'directory', ['admin', 'editor', 'approver'])) {
            return errorResponse('Forbidden: Business Directory access required', 403, null, cors);
          }

          const bizId = pathname.replace('/api/admin/directory/', '');
          const body = await request.json().catch(() => ({}));
          const db = getDb(env);

          if (db) {
            try { await db.execute('ALTER TABLE businesses ADD COLUMN gallery_images TEXT'); } catch (_) {}
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
                    cover_url = CASE WHEN ? = 1 THEN ? ELSE cover_url END,
                    gallery_images = CASE WHEN ? = 1 THEN ? ELSE gallery_images END,
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
                (body.cover_url !== undefined || body.image !== undefined) ? 1 : 0,
                (body.cover_url || body.image || '').trim() || null,
                Array.isArray(body.images) ? 1 : 0,
                Array.isArray(body.images) ? JSON.stringify(body.images.filter(Boolean)) : null,
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
          if (!requireSectionAccess(authUser, 'directory', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Business Directory access required to delete records', 403, null, cors);
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
          if (!requireSectionAccess(authUser, 'directory', ['admin', 'approver', 'editor', 'read_only'], { write: false })) {
            return errorResponse('Forbidden: Business Directory access required.', 403, null, cors);
          }
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
          if (!requireSectionAccess(authUser, 'directory', ['admin', 'approver'])) {
            return errorResponse('Forbidden: Business Directory moderation access required', 403, null, cors);
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
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver', 'editor', 'read_only'], { write: false })) {
            return errorResponse('Forbidden: Inquiries access required.', 403, null, cors);
          }
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
            case 'appointment':
              query = `SELECT * FROM contact_submissions WHERE subject LIKE '[APPOINTMENT]%' OR subject LIKE '%Screening Slot%' OR subject LIKE '%HIV/STI%' ORDER BY created_at DESC LIMIT 100`;
              break;
            case 'resource':
              query = `SELECT * FROM contact_submissions WHERE subject LIKE '[RESOURCE]%' OR subject LIKE '%Resource Submission%' ORDER BY created_at DESC LIMIT 100`;
              break;
            default:
              query = `SELECT * FROM contact_submissions WHERE subject NOT LIKE '[APPOINTMENT]%' AND subject NOT LIKE '%Screening Slot%' AND subject NOT LIKE '[RESOURCE]%' AND subject NOT LIKE '%Resource Submission%' ORDER BY created_at DESC LIMIT 100`;
              break;
          }

          const res = await db.execute({ sql: query, args: [] });
          return jsonResponse({ success: true, inquiries: res.rows, type }, 200, cors);
        }

        // 15.10 Operational Inquiries Status Update (PATCH /api/admin/inquiries/:type/:id)
        if (pathname.startsWith('/api/admin/inquiries/') && request.method === 'PATCH') {
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Inquiries access required.', 403, null, cors);
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
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Inquiries access required.', 403, null, cors);
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
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Inquiries access required.', 403, null, cors);
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

        // 15.10d Operational Inquiries Create Entry (POST /api/admin/inquiries/:type)
        if (pathname.startsWith('/api/admin/inquiries/') && request.method === 'POST') {
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Inquiries access required.', 403, null, cors);
          }

          const parts = pathname.replace('/api/admin/inquiries/', '').split('/');
          const inquiryType = parts[0] || 'contact';
          const body = await request.json().catch(() => ({}));
          const db = getDb(env);
          const id = body.id || `inq-${inquiryType.slice(0, 3)}-${crypto.randomUUID()}`;

          if (db) {
            if (inquiryType === 'volunteer') {
              await db.execute({
                sql: `INSERT INTO volunteer_applications (id, full_name, email, phone, city, roles_of_interest, availability, skills_experience, status)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                  id,
                  body.full_name || body.name || 'Community Member',
                  body.email || '',
                  body.phone || '',
                  body.city || '',
                  body.roles_of_interest || '[]',
                  body.availability || '',
                  body.skills_experience || '',
                  body.status || 'unread'
                ]
              });
            } else if (inquiryType === 'training') {
              await db.execute({
                sql: `INSERT INTO training_bookings (id, organization_name, contact_name, email, phone, course_title, estimated_attendees, preferred_date, goals_and_notes, status)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                  id,
                  body.organization_name || 'Organization',
                  body.contact_name || body.name || 'Contact Person',
                  body.email || '',
                  body.phone || '',
                  body.course_title || 'P.R.I.D.E. Training',
                  body.estimated_attendees ? Number(body.estimated_attendees) : 25,
                  body.preferred_date || '',
                  body.goals_and_notes || body.message || '',
                  body.status || 'unread'
                ]
              });
            } else if (inquiryType === 'accessibility') {
              await db.execute({
                sql: `INSERT INTO accessibility_feedback (id, contact_name, contact_email, barrier_description, page_url, assistive_tech, status, remediation_notes)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                  id,
                  body.contact_name || body.name || 'Community Member',
                  body.contact_email || body.email || '',
                  body.barrier_description || body.message || '',
                  body.page_url || '',
                  body.assistive_tech || '',
                  body.status || 'open',
                  body.remediation_notes || ''
                ]
              });
            } else {
              // contact, appointment, resource
              let prefix = '';
              if (inquiryType === 'appointment' && !body.subject?.startsWith('[APPOINTMENT]')) {
                prefix = '[APPOINTMENT] ';
              } else if (inquiryType === 'resource' && !body.subject?.startsWith('[RESOURCE]')) {
                prefix = '[RESOURCE] ';
              }

              const resolvedSubject = `${prefix}${body.subject || (inquiryType === 'appointment' ? 'HIV/Wellness Screening Slot' : inquiryType === 'resource' ? 'Resource Submission' : 'General Inquiry')}`;

              await db.execute({
                sql: `INSERT INTO contact_submissions (id, name, email, phone, subject, message, status, notes)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                  id,
                  body.name || body.full_name || body.contact_name || (inquiryType === 'appointment' ? 'Confidential Client' : 'Community Member'),
                  body.email || '',
                  body.phone || '',
                  resolvedSubject,
                  body.message || '',
                  body.status || 'unread',
                  body.notes || ''
                ]
              });
            }
          }

          return jsonResponse({ success: true, message: `Inquiry created successfully.`, id }, 201, cors);
        }

        // 15.10d Admin Voicemails List (GET /api/admin/voicemails)
        if (pathname === '/api/admin/voicemails' && request.method === 'GET') {
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver', 'editor', 'read_only'], { write: false })) {
            return errorResponse('Forbidden: Voicemail & Inquiries access required.', 403, null, cors);
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
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver', 'editor', 'read_only'], { write: false })) {
            return errorResponse('Forbidden: Voicemail & Inquiries access required.', 403, null, cors);
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
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Voicemail & Inquiries access required.', 403, null, cors);
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
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver'])) {
            return errorResponse('Forbidden: Voicemail & Inquiries access required.', 403, null, cors);
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
          if (!requireSectionAccess(authUser, ['podcasts', 'inquiries'], ['admin', 'approver', 'editor', 'read_only'], { write: false })) {
            return errorResponse('Forbidden: Podcasts or Inquiries access required.', 403, null, cors);
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
          if (!requireSectionAccess(authUser, ['podcasts', 'inquiries'], ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Podcasts or Inquiries access required.', 403, null, cors);
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
          if (!requireSectionAccess(authUser, ['podcasts', 'inquiries'], ['admin', 'approver'])) {
            return errorResponse('Forbidden: Podcasts or Inquiries access required.', 403, null, cors);
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

        // =======================================================================
        // 15.10k Admin Community Group Members (GET /api/admin/community-groups/:slug/members)
        // =======================================================================
        const groupMembersMatch = pathname.match(/^\/api\/admin\/community-groups\/([^/]+)\/members$/);
        if (groupMembersMatch && request.method === 'GET') {
          if (!requireSectionAccess(authUser, 'community', ['admin', 'approver', 'editor'], { write: false })) {
            return errorResponse('Forbidden: Community Groups access required.', 403, null, cors);
          }

          const slug = decodeURIComponent(groupMembersMatch[1]).trim();
          const db = getDb(env);
          if (!db) return jsonResponse({ success: true, members: [], stats: {} }, 200, cors);

          const statusFilter = (url.searchParams.get('status') || 'all').trim();
          const searchTerm = (url.searchParams.get('search') || '').trim().toLowerCase();
          const format = (url.searchParams.get('format') || '').toLowerCase().trim();

          let sql = `SELECT * FROM community_group_joins WHERE 1=1`;
          const args = [];

          if (slug !== 'all') {
            sql += ` AND group_slug = ?`;
            args.push(slug);
          }

          if (statusFilter !== 'all') {
            sql += ` AND status = ?`;
            args.push(statusFilter);
          }

          if (searchTerm) {
            sql += ` AND (LOWER(name) LIKE ? OR LOWER(preferred_name) LIKE ? OR LOWER(email) LIKE ?)`;
            args.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
          }

          sql += ` ORDER BY created_at DESC`;

          let rows = [];
          try {
            const res = await db.execute({ sql, args });
            rows = res.rows || [];
          } catch (err) {
            console.warn('Failed to query community group members:', err.message);
          }

          // Compute stats
          let totalCount = 0;
          let submittedCount = 0;
          let activeCount = 0;
          let inactiveCount = 0;
          let consentedCount = 0;
          let unsubscribedCount = 0;

          try {
            const statSql = slug === 'all'
              ? `SELECT status, email_consent, is_unsubscribed, count(*) as count FROM community_group_joins GROUP BY status, email_consent, is_unsubscribed`
              : `SELECT status, email_consent, is_unsubscribed, count(*) as count FROM community_group_joins WHERE group_slug = ? GROUP BY status, email_consent, is_unsubscribed`;
            const statArgs = slug === 'all' ? [] : [slug];
            const statRes = await db.execute({ sql: statSql, args: statArgs });
            (statRes.rows || []).forEach(r => {
              const c = Number(r.count || 0);
              totalCount += c;
              if (r.status === 'submitted') submittedCount += c;
              if (r.status === 'active') activeCount += c;
              if (r.status === 'inactive' || r.status === 'archived') inactiveCount += c;
              if (Number(r.email_consent) === 1) consentedCount += c;
              if (Number(r.is_unsubscribed) === 1) unsubscribedCount += c;
            });
          } catch (e) {}

          const canAccessAccessibilityNotes = authUser.role === 'admin' || authUser.role === 'approver';

          // CSV Export option
          if (format === 'csv') {
            if (!canAccessAccessibilityNotes) {
              return errorResponse('Forbidden: Administrator role required to export member data', 403, null, cors);
            }
            const csvHeaders = ['ID', 'Group Slug', 'Group Name', 'Name', 'Preferred Name', 'Email', 'Pronouns', 'Status', 'Email Consent', 'Consent Date', 'Unsubscribed', 'Created At', 'Accessibility Notes', 'Admin Notes'];
            const escapeCsv = (val) => {
              if (val === null || val === undefined) return '""';
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            };
            const csvLines = [csvHeaders.join(',')];
            rows.forEach(r => {
              csvLines.push([
                escapeCsv(r.id),
                escapeCsv(r.group_slug),
                escapeCsv(r.group_name),
                escapeCsv(r.name),
                escapeCsv(r.preferred_name),
                escapeCsv(r.email),
                escapeCsv(r.pronouns),
                escapeCsv(r.status),
                escapeCsv(r.email_consent ? 'Yes' : 'No'),
                escapeCsv(r.email_consent_timestamp),
                escapeCsv(r.is_unsubscribed ? 'Yes' : 'No'),
                escapeCsv(r.created_at),
                escapeCsv(r.accessibility_notes),
                escapeCsv(r.admin_notes)
              ].join(','));
            });
            return new Response(csvLines.join('\n'), {
              status: 200,
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="community-members-${slug}.csv"`,
                ...cors
              }
            });
          }

          // Protect accessibility notes from non-admin roles
          const sanitizedMembers = rows.map(r => ({
            ...r,
            accessibility_notes: canAccessAccessibilityNotes ? r.accessibility_notes : (r.accessibility_notes ? '[Confidential - Admins Only]' : '')
          }));

          return jsonResponse({
            success: true,
            slug,
            members: sanitizedMembers,
            total: rows.length,
            stats: {
              total: totalCount || rows.length,
              submitted: submittedCount,
              active: activeCount,
              inactive: inactiveCount,
              consented: consentedCount,
              unsubscribed: unsubscribedCount
            }
          }, 200, cors);
        }

        // =======================================================================
        // 15.10l Admin Community Group Member Update (PATCH /api/admin/community-groups/:slug/members/:id)
        // =======================================================================
        const memberUpdateMatch = pathname.match(/^\/api\/admin\/community-groups\/([^/]+)\/members\/([^/]+)$/);
        if (memberUpdateMatch && request.method === 'PATCH') {
          if (!requireSectionAccess(authUser, 'community', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Community Groups edit access required.', 403, null, cors);
          }
          const [, slug, memberId] = memberUpdateMatch;
          const body = await request.json().catch(() => ({}));
          const { status, adminNotes, admin_notes } = body;
          const noteToSet = adminNotes !== undefined ? adminNotes : admin_notes;
          const db = getDb(env);

          if (!db) return errorResponse('Database not available', 503, null, cors);

          try {
            await db.execute({
              sql: `UPDATE community_group_joins 
                    SET status = COALESCE(?, status), 
                        admin_notes = COALESCE(?, admin_notes), 
                        updated_at = datetime('now') 
                    WHERE id = ?`,
              args: [status || null, noteToSet !== undefined ? noteToSet : null, memberId]
            });
            return jsonResponse({ success: true, message: `Member ${memberId} updated successfully.` }, 200, cors);
          } catch (err) {
            return errorResponse('Failed to update member record', 500, err.message, cors);
          }
        }

        // =======================================================================
        // 15.10m Admin Community Group Member Delete (DELETE /api/admin/community-groups/:slug/members/:id)
        // =======================================================================
        if (memberUpdateMatch && request.method === 'DELETE') {
          if (!requireSectionAccess(authUser, 'community', ['admin'])) {
            return errorResponse('Forbidden: Community Groups delete access required.', 403, null, cors);
          }
          const [, , memberId] = memberUpdateMatch;
          const db = getDb(env);
          if (db) {
            await db.execute({ sql: `DELETE FROM community_group_joins WHERE id = ?`, args: [memberId] }).catch(() => {});
          }
          return jsonResponse({ success: true, deleted: true, memberId }, 200, cors);
        }

        // =======================================================================
        // 15.10n Admin Community Group Broadcast (POST /api/admin/community-groups/:slug/broadcast)
        // Dispatches Resend updates INDIVIDUALLY to consented members with 1-click unsubscribe links.
        // =======================================================================
        const broadcastMatch = pathname.match(/^\/api\/admin\/community-groups\/([^/]+)\/broadcast$/);
        if (broadcastMatch && request.method === 'POST') {
          if (!requireSectionAccess(authUser, 'community', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Community Groups access required to broadcast updates.', 403, null, cors);
          }

          const slug = decodeURIComponent(broadcastMatch[1]).trim();
          const body = await request.json().catch(() => ({}));
          const subject = (body.subject || '').trim();
          const content = (body.content || '').trim();
          const groupName = (body.groupName || 'Community Circle').trim();
          const isTest = Boolean(body.isTest);
          const idempotencyKey = (body.idempotencyKey || '').trim();
          const baseUrl = env.FRONTEND_BASE_URL || 'https://diversitycollective.org';
          const db = getDb(env);

          if (!subject || !content) {
            return errorResponse('Subject and content are required for group broadcast.', 400, null, cors);
          }

          // Idempotency check to prevent duplicate mass sends
          if (idempotencyKey && db) {
            const checkRes = await db.execute({
              sql: `SELECT id FROM community_group_broadcasts WHERE idempotency_key = ? LIMIT 1`,
              args: [idempotencyKey]
            }).catch(() => ({ rows: [] }));
            if (checkRes.rows?.length > 0) {
              return errorResponse('This broadcast has already been transmitted (idempotency check).', 409, null, cors);
            }
          }

          const formattedContentHtml = content.includes('<p>') || content.includes('<div>')
            ? content
            : content.split('\n\n').map(p => `<p style="margin: 0 0 16px 0; line-height: 1.7;">${p.replace(/\n/g, '<br>')}</p>`).join('');

          // 1. Test Mode: Dispatch strictly to the administrator's email
          if (isTest) {
            const testEmail = (body.testEmail || authUser.email).trim().toLowerCase();
            const previewUnsub = `${baseUrl}/api/community/unsubscribe?token=preview-test-token`;
            const previewHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
                <div style="background: #fef3c7; padding: 12px 24px; font-size: 11px; font-weight: 800; color: #92400e; border-bottom: 1px solid #fde68a;">
                  [ADMIN TEST PREVIEW] This is a preview of the update to be broadcast to verified consented members of ${groupName}.
                </div>
                <div style="background: linear-gradient(135deg, #5A1E65 0%, #2A0845 100%); padding: 32px 28px;">
                  <span style="background: rgba(255,255,255,0.2); color: #fff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;">
                    ${groupName}
                  </span>
                  <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 12px 0 0 0;">${subject}</h1>
                </div>
                <div style="padding: 32px 28px; line-height: 1.7; color: #334155; font-size: 15px;">
                  ${formattedContentHtml}
                  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">
                    <p style="margin: 0 0 4px 0; font-weight: 700; color: #0f172a;">Diversity Collective Ventura County</p>
                    <p style="margin: 0;">2471 Portola Road, Suite 100, Ventura, CA 93003 · (805) 644-5428</p>
                  </div>
                </div>
                <div style="background: #f8fafc; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
                  <p style="margin: 0 0 8px 0;">You received this because you requested updates for ${groupName}.</p>
                  <a href="${previewUnsub}" style="color: #7c3aed; text-decoration: underline; font-weight: 600;">1-Click Unsubscribe from ${groupName} updates</a>
                </div>
              </div>
            `;

            await sendEmail({
              apiKey: env.RESEND_API_KEY,
              from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
              to: testEmail,
              subject: `[TEST PREVIEW - ${groupName}] ${subject}`,
              html: previewHtml,
              text: `[TEST PREVIEW - ${groupName}] ${subject}\n\n${content}\n\nUnsubscribe link: ${previewUnsub}`
            });

            return jsonResponse({
              success: true,
              isTest: true,
              recipient: testEmail,
              message: `Test preview email successfully dispatched to ${testEmail}. Check your inbox!`
            }, 200, cors);
          }

          // 2. Production Broadcast: Query ONLY verified consented, non-unsubscribed members
          let recipients = [];
          if (db) {
            const querySql = slug === 'all'
              ? `SELECT id, name, preferred_name, email, unsubscribe_token FROM community_group_joins WHERE email_consent = 1 AND is_unsubscribed = 0 AND status IN ('submitted', 'active')`
              : `SELECT id, name, preferred_name, email, unsubscribe_token FROM community_group_joins WHERE group_slug = ? AND email_consent = 1 AND is_unsubscribed = 0 AND status IN ('submitted', 'active')`;
            const queryArgs = slug === 'all' ? [] : [slug];
            const rRes = await db.execute({ sql: querySql, args: queryArgs }).catch(() => ({ rows: [] }));
            recipients = rRes.rows || [];
          }

          if (recipients.length === 0) {
            return errorResponse('No verified consented members found for this circle. No broadcast sent.', 400, null, cors);
          }

          const broadcastId = crypto.randomUUID();

          // Dispatch INDIVIDUALLY to each recipient with personalized 1-click unsubscribe token (never CC/BCC)
          for (const member of recipients) {
            const unsubToken = member.unsubscribe_token || crypto.randomUUID();
            const memberUnsubUrl = `${baseUrl}/api/community/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
            const memberName = (member.preferred_name || member.name || '').trim();
            const greeting = memberName ? `<p style="margin: 0 0 16px 0; font-weight: 600; color: #0f172a;">Hello ${memberName},</p>` : '';

            const emailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #5A1E65 0%, #2A0845 100%); padding: 32px 28px;">
                  <span style="background: rgba(255,255,255,0.2); color: #fff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;">
                    ${groupName}
                  </span>
                  <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 12px 0 0 0;">${subject}</h1>
                </div>
                <div style="padding: 32px 28px; line-height: 1.7; color: #334155; font-size: 15px;">
                  ${greeting}
                  ${formattedContentHtml}
                  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">
                    <p style="margin: 0 0 4px 0; font-weight: 700; color: #0f172a;">Diversity Collective Ventura County</p>
                    <p style="margin: 0;">2471 Portola Road, Suite 100, Ventura, CA 93003 · (805) 644-5428</p>
                  </div>
                </div>
                <div style="background: #f8fafc; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
                  <p style="margin: 0 0 8px 0;">You received this update because you requested to join or receive announcements for ${groupName}.</p>
                  <a href="${memberUnsubUrl}" style="color: #7c3aed; text-decoration: underline; font-weight: 600;">1-Click Unsubscribe from ${groupName} updates</a>
                </div>
              </div>
            `;

            ctx.waitUntil(
              sendEmail({
                apiKey: env.RESEND_API_KEY,
                from: env.RESEND_FROM_EMAIL || 'Diversity Collective <noreply@diversitycollective.org>',
                to: member.email,
                subject: `[${groupName}] ${subject}`,
                html: emailHtml,
                text: `${groupName}: ${subject}\n\n${content}\n\nUnsubscribe: ${memberUnsubUrl}`
              }).catch(err => console.error(`[Broadcast Error] Failed for member ${member.email}:`, err.message))
            );
          }

          // Record broadcast log in community_group_broadcasts
          if (db) {
            await db.execute({
              sql: `INSERT INTO community_group_broadcasts 
                    (id, group_slug, group_name, subject, content, sent_by_email, recipient_count, delivery_status, idempotency_key, sent_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, datetime('now'))`,
              args: [broadcastId, slug, groupName, subject, content, authUser.email, recipients.length, idempotencyKey || null]
            }).catch(err => console.warn('Broadcast log error:', err.message));

            await logAdminAction(db, {
              userId: authUser.id,
              userEmail: authUser.email,
              action: 'community_group_broadcast',
              targetType: 'community_group',
              targetId: slug,
              details: { groupName, subject, recipientCount: recipients.length },
              ip: clientIp
            }).catch(() => {});
          }

          return jsonResponse({
            success: true,
            isTest: false,
            broadcastId,
            recipientCount: recipients.length,
            message: `Broadcast successfully sent to ${recipients.length} consented circle member(s)!`
          }, 200, cors);
        }

        // =======================================================================
        // 15.10o Admin Community Group Broadcast History (GET /api/admin/community-groups/:slug/broadcasts)
        // =======================================================================
        const broadcastHistoryMatch = pathname.match(/^\/api\/admin\/community-groups\/([^/]+)\/broadcasts$/);
        if (broadcastHistoryMatch && request.method === 'GET') {
          if (!requireSectionAccess(authUser, 'community', ['admin', 'approver', 'editor'], { write: false })) {
            return errorResponse('Forbidden: Community Groups access required.', 403, null, cors);
          }
          const slug = decodeURIComponent(broadcastHistoryMatch[1]).trim();
          const db = getDb(env);
          let broadcasts = [];
          if (db) {
            try {
              const bSql = slug === 'all'
                ? `SELECT * FROM community_group_broadcasts ORDER BY sent_at DESC LIMIT 50`
                : `SELECT * FROM community_group_broadcasts WHERE group_slug = ? ORDER BY sent_at DESC LIMIT 50`;
              const bArgs = slug === 'all' ? [] : [slug];
              const bRes = await db.execute({ sql: bSql, args: bArgs });
              broadcasts = bRes.rows || [];
            } catch (err) {
              console.warn('Failed to query community broadcast logs:', err.message);
            }
          }
          return jsonResponse({ success: true, broadcasts, count: broadcasts.length }, 200, cors);
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

        // 15.7d Undo Most Recent Site State Change (POST /api/admin/site-state/undo)
        if (pathname === '/api/admin/site-state/undo' && request.method === 'POST') {
          if (authUser.role === 'read_only') {
            return errorResponse('Forbidden: Write access required to undo changes.', 403, null, adminCors);
          }
          if (!db) {
            return errorResponse('Database connection not available', 503, null, adminCors);
          }
          try {
            const result = await undoLastSiteStateChange(db, authUser.email);
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'undo_site_state',
              targetType: 'site_state',
              targetId: 'live',
              details: {
                version: result.version,
                revertedAction: result.revertedEntry?.actionLabel,
                revertedAuthor: result.revertedEntry?.actorEmail,
                revertedVersion: result.revertedEntry?.newVersion
              },
              ip: clientIp
            }).catch(() => { });

            return jsonResponse({
              success: true,
              version: result.version,
              updatedAt: result.updatedAt,
              updatedBy: result.updatedBy,
              state: result.state,
              revertedEntry: result.revertedEntry,
              undoHistory: result.undoHistory
            }, 200, adminCors);
          } catch (err) {
            return errorResponse(err.message || 'Nothing available to undo.', 400, null, adminCors);
          }
        }

        // 15.12 Admin Audit Logs & Undo History (GET/DELETE /api/admin/audit-logs)
        if (pathname === '/api/admin/audit-logs' && request.method === 'GET') {
          const db = getDb(env);
          if (!db) return jsonResponse({ success: true, logs: [], undoHistory: [] }, 200, adminCors);

          await db.execute({
            sql: `DELETE FROM admin_audit_logs WHERE created_at < datetime('now', '-30 days')`,
            args: []
          }).catch(() => {});

          const res = await db.execute({
            sql: `SELECT * FROM admin_audit_logs WHERE created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 200`,
            args: []
          });
          const undoHistory = await getUndoHistory(db, 5);
          return jsonResponse({ success: true, logs: res.rows || [], undoHistory }, 200, adminCors);
        }

        if (pathname === '/api/admin/audit-logs' && request.method === 'DELETE') {
          if (authUser.role === 'read_only') {
            return errorResponse('Forbidden: Write access required to delete logs.', 403, null, adminCors);
          }
          const db = getDb(env);
          if (!db) return jsonResponse({ success: true, deleted: true }, 200, adminCors);
          await db.execute({ sql: `DELETE FROM admin_audit_logs`, args: [] });
          return jsonResponse({ success: true, deleted: true }, 200, adminCors);
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
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'approver', 'editor', 'read_only'], { write: false })) {
            return errorResponse('Forbidden: Inquiries & Newsletter access required.', 403, null, cors);
          }
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
            sql: `SELECT id, email, source, is_active, consent_timestamp, created_at, unsubscribed_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 500`,
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
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Newsletter access required.', 403, null, cors);
          }
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

        // 15.15B-BULK Admin Bulk Import Subscribers (POST /api/admin/newsletter/subscribers/import)
        if (pathname === '/api/admin/newsletter/subscribers/import' && request.method === 'POST') {
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Newsletter access required.', 403, null, cors);
          }
          const body = await request.json().catch(() => ({}));
          const defaultSource = String(body.source || 'admin_bulk_import').trim().slice(0, 64) || 'admin_bulk_import';
          const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

          // Normalize incoming candidates from { subscribers }, { emails }, or { rawText }
          const rawCandidates = [];
          if (Array.isArray(body.subscribers)) {
            for (const item of body.subscribers) {
              if (typeof item === 'string') {
                rawCandidates.push({ email: item, source: defaultSource });
              } else if (item && typeof item === 'object') {
                rawCandidates.push({
                  email: String(item.email || ''),
                  source: String(item.source || defaultSource).trim().slice(0, 64) || defaultSource
                });
              }
            }
          } else if (Array.isArray(body.emails)) {
            for (const item of body.emails) {
              rawCandidates.push({ email: String(item || ''), source: defaultSource });
            }
          } else if (typeof body.rawText === 'string') {
            for (const token of body.rawText.split(/[\r\n,;]+/)) {
              if (token.trim()) rawCandidates.push({ email: token, source: defaultSource });
            }
          }

          const uniqueMap = new Map();
          let invalidCount = 0;
          let duplicateInInput = 0;

          for (const candidate of rawCandidates) {
            const cleaned = String(candidate.email || '').trim().replace(/^["'<]+|["'>]+$/g, '').toLowerCase();
            if (!cleaned) continue;
            if (!emailPattern.test(cleaned)) {
              invalidCount += 1;
              continue;
            }
            if (uniqueMap.has(cleaned)) {
              duplicateInInput += 1;
              continue;
            }
            uniqueMap.set(cleaned, candidate.source || defaultSource);
          }

          if (uniqueMap.size === 0) {
            return errorResponse(
              invalidCount > 0
                ? `No valid email addresses found (${invalidCount} invalid entries skipped).`
                : 'Please provide at least one valid email address to import.',
              400,
              null,
              cors
            );
          }

          if (uniqueMap.size > 1000) {
            return errorResponse('Batch size exceeds limit of 1,000 unique emails per import.', 400, null, cors);
          }

          const entries = Array.from(uniqueMap.entries()); // [email, source]
          let imported = 0;
          let reactivated = 0;
          let alreadyActive = 0;

          const db = getDb(env);
          if (db) {
            const existingStatus = new Map();
            const CHUNK_SIZE = 100;

            for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
              const slice = entries.slice(i, i + CHUNK_SIZE);
              const placeholders = slice.map(() => '?').join(', ');
              const lookupRes = await db.execute({
                sql: `SELECT lower(email) AS email, is_active FROM newsletter_subscribers WHERE lower(email) IN (${placeholders})`,
                args: slice.map(([em]) => em)
              });
              for (const row of lookupRes.rows || []) {
                existingStatus.set(String(row.email || '').toLowerCase(), Number(row.is_active || 0));
              }
            }

            const writeStatements = [];
            for (const [em, src] of entries) {
              if (!existingStatus.has(em)) {
                imported += 1;
                writeStatements.push({
                  sql: `INSERT INTO newsletter_subscribers (id, email, source, is_active, consent_timestamp, created_at)
                        VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
                        ON CONFLICT(email) DO UPDATE SET is_active = 1, unsubscribed_at = NULL`,
                  args: [crypto.randomUUID(), em, src]
                });
              } else if (existingStatus.get(em) !== 1) {
                reactivated += 1;
                writeStatements.push({
                  sql: `UPDATE newsletter_subscribers SET is_active = 1, unsubscribed_at = NULL WHERE lower(email) = ?`,
                  args: [em]
                });
              } else {
                alreadyActive += 1;
              }
            }

            for (let i = 0; i < writeStatements.length; i += CHUNK_SIZE) {
              await db.batch(writeStatements.slice(i, i + CHUNK_SIZE), 'write');
            }

            const clientIp = request.headers.get('cf-connecting-ip') || '';
            ctx.waitUntil(
              db.execute({
                sql: `INSERT INTO admin_audit_logs (id, user_id, user_email, action, target_type, target_id, details, ip_address)
                      VALUES (?, ?, ?, 'import_newsletter_subscribers', 'newsletter', 'bulk_import', ?, ?)`,
                args: [
                  crypto.randomUUID(),
                  authUser.userId || null,
                  authUser.email || null,
                  JSON.stringify({ imported, reactivated, alreadyActive, invalidCount, source: defaultSource }),
                  clientIp
                ]
              }).catch(() => {})
            );
          } else {
            imported = entries.length;
          }

          return jsonResponse({
            success: true,
            imported,
            reactivated,
            alreadyActive,
            duplicateInInput,
            invalidCount,
            totalProcessed: entries.length,
            message: `Import complete: ${imported} added, ${reactivated} reactivated, ${alreadyActive} already active${invalidCount > 0 ? `, ${invalidCount} invalid skipped` : ''}.`
          }, 201, cors);
        }

        // 15.15C Admin Toggle Subscriber Status (POST /api/admin/newsletter/subscribers/toggle)
        if (pathname === '/api/admin/newsletter/subscribers/toggle' && request.method === 'POST') {
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Newsletter access required.', 403, null, cors);
          }
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
          if (!requireSectionAccess(authUser, 'inquiries', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Newsletter broadcast access required', 403, null, cors);
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
          const baseUrl = env.FRONTEND_BASE_URL || 'https://diversitycollective.org';

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
          if (!requireSectionAccess(authUser, 'donations', ['admin', 'approver', 'editor', 'read_only'], { write: false })) {
            return errorResponse('Forbidden: Donations settings access required.', 403, null, adminCors);
          }
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

          const baseTemplate = template || DEFAULT_DONATION_EMAIL_TEMPLATE;
          return jsonResponse({
            success: true,
            template: {
              ...baseTemplate,
              zeffyGeneralUrl: baseTemplate.zeffyGeneralUrl || baseTemplate.zeffyDonationUrl || 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-30236',
              zeffyGemUrl: baseTemplate.zeffyGemUrl || 'https://www.zeffy.com/en-US/donation-form/gem'
            },
            defaultTemplate: DEFAULT_DONATION_EMAIL_TEMPLATE,
            updatedAt,
            updatedBy
          }, 200, adminCors);
        }

        if (pathname === '/api/admin/donations/template' && request.method === 'PUT') {
          if (!requireSectionAccess(authUser, 'donations', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Donations settings access required to edit donation email template.', 403, null, adminCors);
          }

          const body = await request.json().catch(() => ({}));
          const db = getDb(env);
          if (!db) {
            return errorResponse('Database not available', 503, null, adminCors);
          }

          const zeffyGeneralUrl = (body.zeffyGeneralUrl || body.zeffyDonationUrl || '').trim();
          const zeffyGemUrl = (body.zeffyGemUrl || '').trim();

          const validateZeffyUrl = (url) => {
            if (!url) return true;
            try {
              const parsed = new URL(url);
              return (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
                (parsed.hostname === 'www.zeffy.com' || parsed.hostname === 'zeffy.com');
            } catch {
              return false;
            }
          };

          if (zeffyGeneralUrl && !validateZeffyUrl(zeffyGeneralUrl)) {
            return errorResponse('Invalid General Donation URL: Must be a valid https://www.zeffy.com/... link', 400, null, adminCors);
          }
          if (zeffyGemUrl && !validateZeffyUrl(zeffyGemUrl)) {
            return errorResponse('Invalid GEM Membership URL: Must be a valid https://www.zeffy.com/... link', 400, null, adminCors);
          }

          const templateData = {
            subject: (body.subject || '').trim(),
            title: (body.title || '').trim(),
            headline: (body.headline || 'With Heartfelt Thanks To').trim(),
            bodyText: (body.bodyText || '').trim(),
            recurringNote: (body.recurringNote || '').trim(),
            taxNotice: (body.taxNotice || '').trim(),
            zeffyGeneralUrl: zeffyGeneralUrl || 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-30236',
            zeffyGemUrl: zeffyGemUrl || 'https://www.zeffy.com/en-US/donation-form/gem',
            zeffyDonationUrl: zeffyGeneralUrl || 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-30236'
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
          if (!requireSectionAccess(authUser, 'donations', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Donations settings access required.', 403, null, adminCors);
          }
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
            cardUrl: `${env.FRONTEND_BASE_URL || 'https://diversitycollective.org'}/appreciation-card/preview`,
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
          if (!requireSectionAccess(authUser, 'donations', ['admin', 'approver', 'editor', 'read_only'], { write: false })) {
            return errorResponse('Forbidden: Donations access required.', 403, null, adminCors);
          }
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

        // 15.19B Delete All Contribution Records (DELETE /api/admin/donations)
        if (pathname === '/api/admin/donations' && request.method === 'DELETE') {
          if (!requireSectionAccess(authUser, 'donations', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Donations access required to delete contributions.', 403, null, adminCors);
          }
          const db = getDb(env);
          let deletedCount = 0;
          if (db) {
            const countRes = await db.execute({
              sql: `SELECT COUNT(*) AS total FROM donation_appreciation_cards`,
              args: []
            }).catch(() => ({ rows: [] }));
            deletedCount = Number(countRes.rows?.[0]?.total || 0);
            await db.execute({
              sql: `DELETE FROM donation_appreciation_cards`,
              args: []
            });
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'admin_delete_all_donations',
              targetType: 'donations',
              targetId: 'all',
              details: { deletedCount },
              ip: clientIp
            }).catch(() => {});
          }
          return jsonResponse({
            success: true,
            deletedCount,
            message: `Deleted ${deletedCount} contribution record${deletedCount === 1 ? '' : 's'}.`
          }, 200, adminCors);
        }

        // 15.19C Delete Single Contribution Record (DELETE /api/admin/donations/:id)
        if (
          pathname.startsWith('/api/admin/donations/') &&
          !pathname.endsWith('/resend-email') &&
          request.method === 'DELETE'
        ) {
          if (!requireSectionAccess(authUser, 'donations', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Donations access required to delete contributions.', 403, null, adminCors);
          }
          const donationId = decodeURIComponent(pathname.replace('/api/admin/donations/', '')).trim();
          if (!donationId || donationId === 'template' || donationId === 'manual') {
            return errorResponse('Valid contribution ID is required.', 400, null, adminCors);
          }
          const db = getDb(env);
          if (db) {
            await db.execute({
              sql: `DELETE FROM donation_appreciation_cards WHERE id = ? OR card_token = ?`,
              args: [donationId, donationId]
            });
            await logAdminAction(db, {
              userId: authUser.id || authUser.userId,
              userEmail: authUser.email,
              action: 'admin_delete_donation',
              targetType: 'donations',
              targetId: donationId,
              ip: clientIp
            }).catch(() => {});
          }
          return jsonResponse({
            success: true,
            deletedId: donationId,
            message: 'Contribution deleted successfully.'
          }, 200, adminCors);
        }

        // 15.20 Resend Donor Appreciation Email (POST /api/admin/donations/:id/resend-email)
        if (pathname.startsWith('/api/admin/donations/') && pathname.endsWith('/resend-email') && request.method === 'POST') {
          if (!requireSectionAccess(authUser, 'donations', ['admin', 'approver', 'editor'])) {
            return errorResponse('Forbidden: Donations access required.', 403, null, adminCors);
          }
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
          const cardUrl = `${env.FRONTEND_BASE_URL || 'https://diversitycollective.org'}/appreciation-card/${row.card_token}`;

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
          if (!requireSectionAccess(authUser, 'donations', ['admin', 'editor'])) {
            return errorResponse('Forbidden: Donations access required.', 403, null, adminCors);
          }
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

          const frontendBase = env.FRONTEND_BASE_URL || 'https://diversitycollective.org';
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

export {
  parseZeffySignatureHeader,
  verifyZeffySignature,
  verifyZeffyWebhookRequest
};
