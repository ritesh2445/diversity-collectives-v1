/**
 * Diversity Collective Ventura County — Administrative API & RBAC Engine
 *
 * Hardened server-side authentication, constant-time cryptographic verification,
 * RFC 6238 TOTP & Email 2FA, session revocation tokens, and RBAC enforcement.
 *
 * Roles:
 *  - 'admin': Full access to all operations, user management, and exports
 *  - 'approver': Can approve/reject business directory listings and resolve corrections
 *  - 'editor': Can edit business details and update operational statuses
 *  - 'read_only': Can view records and audit logs without mutating state
 */

const MIN_SECRET_LENGTH = 16;

function encodeBase64Url(bytesOrString) {
  let binary = '';
  if (typeof bytesOrString === 'string') {
    const utf8 = new TextEncoder().encode(bytesOrString);
    for (let i = 0; i < utf8.length; i++) binary += String.fromCharCode(utf8[i]);
  } else {
    const arr = bytesOrString instanceof Uint8Array ? bytesOrString : new Uint8Array(bytesOrString);
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64UrlToString(b64u) {
  let base64 = String(b64u || '').replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// Constant-time string/byte comparison (resists timing side-channel attacks)
export function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  const maxLen = Math.max(bufA.length, bufB.length);
  let diff = bufA.length ^ bufB.length;
  for (let i = 0; i < maxLen; i++) {
    const byteA = i < bufA.length ? bufA[i] : 0;
    const byteB = i < bufB.length ? bufB[i] : 0;
    diff |= byteA ^ byteB;
  }
  return diff === 0;
}

export function generateRandomSalt(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function validatePasswordStrength(password) {
  const pwd = typeof password === 'string' ? password : '';
  if (pwd.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters long.' };
  }
  if (pwd.length > 128) {
    return { valid: false, error: 'Password must not exceed 128 characters.' };
  }
  if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd) || !/[^A-Za-z0-9]/.test(pwd)) {
    return {
      valid: false,
      error: 'Password must include uppercase, lowercase, a number, and a special character.'
    };
  }
  if (/DCVC-Admin-2026/i.test(pwd)) {
    return { valid: false, error: 'Cannot reuse default installation passwords.' };
  }
  return { valid: true };
}

export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}

export function buildSessionCookie(token, { crossOrigin = false, maxAgeSec = 28800 } = {}) {
  const parts = [
    `dcvc_admin_session=${encodeURIComponent(token)}`,
    'Path=/api/admin',
    `Max-Age=${maxAgeSec}`,
    'HttpOnly',
    'Secure',
    crossOrigin ? 'SameSite=None' : 'SameSite=Strict'
  ];
  return parts.join('; ');
}

export function clearSessionCookie({ crossOrigin = false } = {}) {
  const parts = [
    'dcvc_admin_session=',
    'Path=/api/admin',
    'Max-Age=0',
    'HttpOnly',
    'Secure',
    crossOrigin ? 'SameSite=None' : 'SameSite=Strict'
  ];
  return parts.join('; ');
}

// PBKDF2 Password Hashing & Verification via Web Crypto API
export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Fail-closed signing secret check (no hardcoded fallback)
function assertSigningSecret(secret) {
  if (!secret || typeof secret !== 'string' || secret.trim().length < MIN_SECRET_LENGTH) {
    throw new Error('Administrative JWT signing secret is missing or below minimum entropy.');
  }
  return secret;
}

// Generate Auth Token (HMAC-SHA256 signed JWT with jti + iat + exp)
export async function generateAuthToken(payload, secret, expiresInSec = 8 * 3600) {
  const validSecret = assertSigningSecret(secret);
  const enc = new TextEncoder();
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const nowSec = Math.floor(Date.now() / 1000);
  const jti = payload?.jti || crypto.randomUUID();
  const body = encodeBase64Url(
    JSON.stringify({
      ...payload,
      jti,
      iat: nowSec,
      exp: nowSec + expiresInSec
    })
  );

  const dataToSign = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(validSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const sigBase64 = encodeBase64Url(signature);
  return `${dataToSign}.${sigBase64}`;
}

// Verify Auth Token strictly (checks HS256 header, typ=JWT, HMAC signature, exp, non-empty secret)
export async function verifyAuthToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, bodyB64, sigB64] = parts;
    const header = JSON.parse(decodeBase64UrlToString(headerB64));
    if (!header || header.alg !== 'HS256' || header.typ !== 'JWT') {
      return null;
    }

    const enc = new TextEncoder();
    const dataToSign = `${headerB64}.${bodyB64}`;

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let base64 = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binarySig = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify('HMAC', key, binarySig, enc.encode(dataToSign));
    if (!isValid) return null;

    const payload = JSON.parse(decodeBase64UrlToString(bodyB64));
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload || !payload.exp || payload.exp < nowSec) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Check Role Permissions
export function requireRole(userRole, allowedRoles = []) {
  if (userRole === 'admin') return true;
  return allowedRoles.includes(userRole);
}

// Record Audit Log entry
export async function logAdminAction(db, { userId, userEmail, action, targetType, targetId, details, ip }) {
  if (!db) return;
  try {
    await db.execute({
      sql: `INSERT INTO admin_audit_logs (id, user_id, user_email, action, target_type, target_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        userId || null,
        userEmail || 'system',
        action,
        targetType,
        targetId || null,
        typeof details === 'object' ? JSON.stringify(details) : details,
        ip || null
      ]
    });
  } catch (err) {
    console.error('Audit log failed to write:', err);
  }
}

// =======================================================================
// Multi-Factor Authentication (MFA / 2FA) Engine (RFC 6238 TOTP + Email OTP)
// =======================================================================

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer) {
  let bits = 0;
  let val = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    val = (val << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += B32_ALPHABET[(val >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += B32_ALPHABET[(val << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(inputStr) {
  const str = (inputStr || '').toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let val = 0;
  const out = [];
  for (let i = 0; i < str.length; i++) {
    const idx = B32_ALPHABET.indexOf(str[i]);
    if (idx === -1) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((val >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

// Generate high-entropy Base32 secret for TOTP enrollment (default 160 bits / 20 bytes)
export function generateTotpSecret(byteLength = 20) {
  const randomBytes = new Uint8Array(byteLength);
  crypto.getRandomValues(randomBytes);
  return base32Encode(randomBytes);
}

// Generate RFC 6238 TOTP code (HMAC-SHA1, 30-sec interval, 6 digits)
export async function generateTotpCode(secretBase32, timeSec = Math.floor(Date.now() / 1000), step = 30, digits = 6) {
  const secretKey = base32Decode(secretBase32);
  const counter = Math.floor(timeSec / step);
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setBigUint64(0, BigInt(counter));

  const key = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const hmac = new Uint8Array(sig);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  );
  return (binary % (10 ** digits)).toString().padStart(digits, '0');
}

// Verify TOTP code returning matched counter step (>0) if options.returnStep is set, else boolean
export async function verifyTotpCode(secretBase32, inputCode, options = {}) {
  const failResult = options.returnStep ? { valid: false, matchedStep: 0 } : false;
  if (!secretBase32 || !inputCode) return failResult;
  const clean = String(inputCode).replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return failResult;

  const window = options.window ?? 1;
  const step = options.step || 30;
  const currentSec = Math.floor((options.timestamp || Date.now()) / 1000);
  const minAcceptedStep = Number(options.lastUsedStep || 0);

  for (let w = -window; w <= window; w++) {
    const testSec = currentSec + (w * step);
    const stepCounter = Math.floor(testSec / step);
    if (minAcceptedStep > 0 && stepCounter <= minAcceptedStep) {
      continue; // Block TOTP code replay within already-consumed or earlier steps
    }
    const expected = await generateTotpCode(secretBase32, testSec, step, 6);
    if (constantTimeEqual(clean, expected)) {
      return options.returnStep ? { valid: true, matchedStep: stepCounter } : true;
    }
  }
  return failResult;
}

// Build standard Authenticator App enrollment URI (`otpauth://totp/...`)
export function getTotpUri(email, secretBase32, issuer = 'Diversity Collective VC') {
  const cleanEmail = (email || '').trim();
  const cleanIssuer = (issuer || '').trim();
  return `otpauth://totp/${encodeURIComponent(cleanIssuer)}:${encodeURIComponent(cleanEmail)}?secret=${secretBase32}&issuer=${encodeURIComponent(cleanIssuer)}&algorithm=SHA1&digits=6&period=30`;
}

// Generate random 6-digit numeric OTP using unbiased rejection sampling
export function generateEphemeralOtp(digits = 6) {
  const mod = 10 ** digits;
  const maxUnbiased = Math.floor(0xffffffff / mod) * mod;
  const random = new Uint32Array(1);
  let val = 0;
  do {
    crypto.getRandomValues(random);
    val = random[0];
  } while (val >= maxUnbiased);
  return (val % mod).toString().padStart(digits, '0');
}

// Generate short-lived ephemeral token for pending 2FA step (valid for 5 minutes)
export async function generateTempToken(payload, secret, expiresInSec = 300) {
  const validSecret = assertSigningSecret(secret);
  const enc = new TextEncoder();
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'TEMP_2FA' }));
  const nowSec = Math.floor(Date.now() / 1000);
  const jti = payload?.jti || crypto.randomUUID();
  const body = encodeBase64Url(
    JSON.stringify({
      ...payload,
      jti,
      iat: nowSec,
      exp: nowSec + expiresInSec,
      purpose: '2fa_login'
    })
  );

  const dataToSign = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(validSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const sigBase64 = encodeBase64Url(signature);
  return `${dataToSign}.${sigBase64}`;
}

// Verify short-lived ephemeral token strictly
export async function verifyTempToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, bodyB64, sigB64] = parts;
    const header = JSON.parse(decodeBase64UrlToString(headerB64));
    if (!header || header.alg !== 'HS256' || header.typ !== 'TEMP_2FA') {
      return null;
    }

    const enc = new TextEncoder();
    const dataToSign = `${headerB64}.${bodyB64}`;

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let base64 = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binarySig = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify('HMAC', key, binarySig, enc.encode(dataToSign));
    if (!isValid) return null;

    const payload = JSON.parse(decodeBase64UrlToString(bodyB64));
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload || !payload.exp || payload.exp < nowSec) {
      return null;
    }
    if (payload.purpose !== '2fa_login') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
