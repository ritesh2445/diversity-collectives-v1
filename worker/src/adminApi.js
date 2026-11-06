/**
 * Diversity Collective Ventura County — Administrative API & RBAC Engine
 * 
 * Server-side authorization and administrative operations for the custom staff/board dashboard.
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
  const body = btoa(JSON.stringify({ ...payload, exp }));

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

    const payload = JSON.parse(atob(body));
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

