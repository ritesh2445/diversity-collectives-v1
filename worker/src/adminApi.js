/**
 * Diversity Collective Ventura County — Administrative API & RBAC Engine
 * 
 * Server-side authorization, multi-factor authentication (TOTP & Email 2FA),
 * and administrative operations for the custom staff/board dashboard.
 * Deployed independently from the public website bundle.
 * 
 * Roles:
 *  - 'admin': Full access to all operations, user management, and exports
 *  - 'approver': Can approve/reject business directory listings and resolve corrections
 *  - 'editor': Can edit business details and update operational statuses
 *  - 'read_only': Can view records and audit logs without mutating state
 */

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
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate Auth Token (HMAC-SHA256 signed bearer token)
export async function generateAuthToken(payload, secret) {
  const enc = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + (12 * 3600); // 12 hours validity
  const body = btoa(unescape(encodeURIComponent(JSON.stringify({ ...payload, exp }))));

  const dataToSign = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || 'dcvc_admin_jwt_default_secret_2026'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${dataToSign}.${sigBase64}`;
}

// Verify Auth Token and extract user session
export async function verifyAuthToken(token, secret) {
  if (!token || !token.includes('.')) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, sig] = parts;
    const enc = new TextEncoder();
    const dataToSign = `${header}.${body}`;

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret || 'dcvc_admin_jwt_default_secret_2026'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Reconstruct binary signature from base64url
    let base64 = sig.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binarySig = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify('HMAC', key, binarySig, enc.encode(dataToSign));
    if (!isValid) return null;

    const payload = JSON.parse(decodeURIComponent(escape(atob(body))));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    console.warn('Auth token verification exception:', err);
    return null;
  }
}

// Check Role Permissions
export function requireRole(userRole, allowedRoles = []) {
  if (userRole === 'admin') return true; // Superadmin has all permissions
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
  const code = (binary % (10 ** digits)).toString().padStart(digits, '0');
  return code;
}

// Verify TOTP code with time-step drift tolerance (default window = 1 => +/-30 seconds)
export async function verifyTotpCode(secretBase32, inputCode, options = {}) {
  if (!secretBase32 || !inputCode) return false;
  const clean = String(inputCode).replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;

  const window = options.window ?? 1;
  const step = options.step || 30;
  const currentSec = Math.floor((options.timestamp || Date.now()) / 1000);

  for (let w = -window; w <= window; w++) {
    const testSec = currentSec + (w * step);
    const expected = await generateTotpCode(secretBase32, testSec, step, 6);
    if (clean === expected) {
      return true;
    }
  }
  return false;
}

// Build standard Authenticator App enrollment URI (`otpauth://totp/...`)
export function getTotpUri(email, secretBase32, issuer = 'Diversity Collective VC') {
  const cleanEmail = (email || '').trim();
  const cleanIssuer = (issuer || '').trim();
  return `otpauth://totp/${encodeURIComponent(cleanIssuer)}:${encodeURIComponent(cleanEmail)}?secret=${secretBase32}&issuer=${encodeURIComponent(cleanIssuer)}&algorithm=SHA1&digits=6&period=30`;
}

// Generate random 6-digit numeric OTP for email verification fallback
export function generateEphemeralOtp(digits = 6) {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const code = (random[0] % (10 ** digits)).toString().padStart(digits, '0');
  return code;
}

// Generate short-lived ephemeral token for pending 2FA step (valid for 5 minutes)
export async function generateTempToken(payload, secret, expiresInSec = 300) {
  const enc = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'TEMP_2FA' }));
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const body = btoa(unescape(encodeURIComponent(JSON.stringify({ ...payload, exp, purpose: '2fa_login' }))));

  const dataToSign = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || 'dcvc_admin_jwt_default_secret_2026'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${dataToSign}.${sigBase64}`;
}

// Verify short-lived ephemeral token for pending 2FA step
export async function verifyTempToken(token, secret) {
  if (!token || !token.includes('.')) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, sig] = parts;
    const enc = new TextEncoder();
    const dataToSign = `${header}.${body}`;

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret || 'dcvc_admin_jwt_default_secret_2026'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let base64 = sig.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binarySig = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify('HMAC', key, binarySig, enc.encode(dataToSign));
    if (!isValid) return null;

    const payload = JSON.parse(decodeURIComponent(escape(atob(body))));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (payload.purpose !== '2fa_login') {
      return null;
    }

    return payload;
  } catch (err) {
    console.warn('Temp token verification exception:', err);
    return null;
  }
}
