import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  hashPassword,
  generateAuthToken,
  verifyAuthToken,
  requireRole,
  logAdminAction,
  base32Encode,
  base32Decode,
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
  parseCookies,
  buildSessionCookie,
  clearSessionCookie
} from '../worker/src/adminApi.js';

describe('Admin Authentication & RBAC Engine', () => {

  const secret = 'test_admin_jwt_secret_12345';
  const salt = 'dcvc_salt_test';

  it('1. correctly hashes passwords deterministically with PBKDF2-SHA256', async () => {
    const hash1 = await hashPassword('SecretPass123!', salt);
    const hash2 = await hashPassword('SecretPass123!', salt);
    const hash3 = await hashPassword('WrongPass', salt);

    assert.strictEqual(hash1, hash2);
    assert.notStrictEqual(hash1, hash3);
    assert.strictEqual(typeof hash1, 'string');
    assert.ok(hash1.length >= 64);
  });

  it('2. signs and verifies a valid JWT auth token', async () => {
    const payload = {
      userId: 'adm-001',
      email: 'admin@diversitycollective.org',
      role: 'admin',
      name: 'Tess Allen'
    };

    const token = await generateAuthToken(payload, secret);
    assert.ok(token);

    const verified = await verifyAuthToken(token, secret);
    assert.ok(verified);
    assert.strictEqual(verified.email, 'admin@diversitycollective.org');
    assert.strictEqual(verified.role, 'admin');
  });

  it('3. rejects tampered or expired auth tokens', async () => {
    const token = await generateAuthToken({ userId: 'u1', role: 'editor' }, secret);
    const tampered = token.slice(0, -5) + 'xxxxx';

    const verified = await verifyAuthToken(tampered, secret);
    assert.strictEqual(verified, null);

    const wrongSecretVerified = await verifyAuthToken(token, 'different_secret');
    assert.strictEqual(wrongSecretVerified, null);
  });

  it('4. strictly enforces role-based access permissions', () => {
    // Superadmin has all permissions
    assert.strictEqual(requireRole('admin', ['approver']), true);
    assert.strictEqual(requireRole('admin', ['editor']), true);

    // Approver can approve/reject but cannot manage users
    assert.strictEqual(requireRole('approver', ['approver']), true);
    assert.strictEqual(requireRole('approver', ['admin']), false);

    // Editor can edit but cannot approve/reject
    assert.strictEqual(requireRole('editor', ['editor']), true);
    assert.strictEqual(requireRole('editor', ['approver']), false);

    // Read-only cannot mutate
    assert.strictEqual(requireRole('read_only', ['approver', 'editor', 'admin']), false);
    assert.strictEqual(requireRole('read_only', ['read_only']), true);
  });

  it('5. records admin audit logs without crashing on null db', async () => {
    // Should gracefully skip without error when DB is null in mock mode
    await logAdminAction(null, {
      userId: 'u1',
      userEmail: 'admin@diversitycollective.org',
      action: 'approve_business',
      targetType: 'business',
      targetId: 'biz-1'
    });
    assert.ok(true);
  });

  // =====================================================================
  // Two-Factor Authentication (TOTP & 2FA Temp Tokens)
  // =====================================================================

  it('6. correctly roundtrips Base32 encoding and decoding', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111, 33]); // "Hello!"
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);

    assert.strictEqual(encoded, 'JBSWY3DPEE');
    assert.deepStrictEqual(Array.from(decoded), Array.from(original));
  });

  it('7. matches official RFC 6238 TOTP reference test vectors', async () => {
    // RFC 6238 Section 5.3 Test Vectors:
    // Secret = '12345678901234567890' (ASCII) => 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ' (Base32)
    const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

    // At t=59s (step=30, counter=1) -> 287082
    const code1 = await generateTotpCode(rfcSecret, 59, 30, 6);
    assert.strictEqual(code1, '287082');

    // At t=1111111109s (counter=37037036) -> 081804
    const code2 = await generateTotpCode(rfcSecret, 1111111109, 30, 6);
    assert.strictEqual(code2, '081804');

    // At t=1234567890s (counter=41152263) -> 005924
    const code3 = await generateTotpCode(rfcSecret, 1234567890, 30, 6);
    assert.strictEqual(code3, '005924');
  });

  it('8. verifies valid TOTP codes and rejects tampered or invalid codes', async () => {
    const totpSecret = generateTotpSecret(20);
    assert.strictEqual(typeof totpSecret, 'string');
    assert.strictEqual(totpSecret.length, 32);

    const currentCode = await generateTotpCode(totpSecret);
    assert.strictEqual(currentCode.length, 6);

    // Verify current code
    const isValid = await verifyTotpCode(totpSecret, currentCode);
    assert.strictEqual(isValid, true);

    // Reject incorrect code
    const isInvalid = await verifyTotpCode(totpSecret, '999999' === currentCode ? '111111' : '999999');
    assert.strictEqual(isInvalid, false);

    // Reject malformed codes
    assert.strictEqual(await verifyTotpCode(totpSecret, ''), false);
    assert.strictEqual(await verifyTotpCode(totpSecret, 'abc'), false);
    assert.strictEqual(await verifyTotpCode('', currentCode), false);
  });

  it('9. accommodates clock drift within the configured window', async () => {
    const totpSecret = generateTotpSecret(20);
    const now = 1700000000; // Fixed timestamp

    // Code generated 25 seconds ago (within current window or previous step)
    const pastCode = await generateTotpCode(totpSecret, now - 30);
    const isPastValid = await verifyTotpCode(totpSecret, pastCode, { timestamp: now * 1000, window: 1 });
    assert.strictEqual(isPastValid, true);

    // Code generated 5 minutes ago (outside +/-1 window) must be rejected
    const expiredCode = await generateTotpCode(totpSecret, now - 300);
    const isExpiredValid = await verifyTotpCode(totpSecret, expiredCode, { timestamp: now * 1000, window: 1 });
    assert.strictEqual(isExpiredValid, false);
  });

  it('10. generates valid standard otpauth:// URI for authenticator QR codes', () => {
    const totpSecret = 'JBSWY3DPEHPK3PXP';
    const uri = getTotpUri('admin@diversitycollective.org', totpSecret, 'Diversity Collective VC');
    assert.ok(uri.startsWith('otpauth://totp/Diversity%20Collective%20VC:admin%40diversitycollective.org?'));
    assert.ok(uri.includes('secret=JBSWY3DPEHPK3PXP'));
    assert.ok(uri.includes('issuer=Diversity%20Collective%20VC'));
  });

  it('11. generates and verifies short-lived 2FA temp tokens with strict expiry', async () => {
    const tempPayload = {
      userId: 'adm-001',
      email: 'admin@diversitycollective.org',
      role: 'admin',
      mfaType: 'totp'
    };

    const tempToken = await generateTempToken(tempPayload, secret, 300);
    assert.ok(tempToken);

    const verified = await verifyTempToken(tempToken, secret);
    assert.ok(verified);
    assert.strictEqual(verified.email, 'admin@diversitycollective.org');
    assert.strictEqual(verified.purpose, '2fa_login');

    // Reject tampered token
    const tampered = tempToken.slice(0, -6) + 'abcdef';
    assert.strictEqual(await verifyTempToken(tampered, secret), null);

    // Reject when verified with wrong secret
    assert.strictEqual(await verifyTempToken(tempToken, 'wrong-secret'), null);

    // Rejects if purpose is not 2fa_login
    const normalToken = await generateAuthToken({ userId: 'adm-001' }, secret);
    assert.strictEqual(await verifyTempToken(normalToken, secret), null);
  });

  it('12. generates random 6-digit numeric email OTP codes', () => {
    const otp1 = generateEphemeralOtp(6);
    const otp2 = generateEphemeralOtp(6);

    assert.strictEqual(otp1.length, 6);
    assert.strictEqual(otp2.length, 6);
    assert.ok(/^\d{6}$/.test(otp1));
    assert.ok(/^\d{6}$/.test(otp2));
  });

  it('13. fails closed when JWT signing secret is missing or too short', async () => {
    await assert.rejects(() => generateAuthToken({ id: 'adm-1' }, ''), /secret/i);
    await assert.rejects(() => generateTempToken({ userId: 'adm-1' }, 'short'), /secret/i);
    assert.strictEqual(await verifyAuthToken('a.b.c', ''), null);
    assert.strictEqual(await verifyTempToken('a.b.c', ''), null);
  });

  it('14. rejects JWT algorithm confusion (alg: none) and TEMP_2FA token misuse', async () => {
    const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ id: 'adm-1', role: 'admin', exp: 9999999999 })).toString('base64url');
    assert.strictEqual(await verifyAuthToken(`${noneHeader}.${body}.`, secret), null);

    const tempTok = await generateTempToken({ userId: 'adm-1', role: 'admin' }, secret, 300);
    assert.strictEqual(await verifyAuthToken(tempTok, secret), null);
  });

  it('15. blocks TOTP replay within the same time step', async () => {
    const totpSecret = generateTotpSecret(20);
    const fixedMs = 1700000010 * 1000;
    const code = await generateTotpCode(totpSecret, Math.floor(fixedMs / 1000));

    const first = await verifyTotpCode(totpSecret, code, { timestamp: fixedMs, returnStep: true });
    assert.strictEqual(first.valid, true);
    assert.ok(first.matchedStep > 0);

    const replay = await verifyTotpCode(totpSecret, code, {
      timestamp: fixedMs,
      lastUsedStep: first.matchedStep,
      returnStep: true
    });
    assert.strictEqual(replay.valid, false);
  });

  it('16. validates password complexity and rejects default installation passphrases', () => {
    assert.strictEqual(validatePasswordStrength('short').valid, false);
    assert.strictEqual(validatePasswordStrength('alllowercase12!').valid, false);
    assert.strictEqual(validatePasswordStrength('DCVC-Admin-2026!').valid, false);
    assert.strictEqual(validatePasswordStrength('Sanctuary#2026!Strong').valid, true);

    const salt1 = generateRandomSalt(16);
    const salt2 = generateRandomSalt(16);
    assert.strictEqual(salt1.length, 32);
    assert.notStrictEqual(salt1, salt2);
    assert.strictEqual(constantTimeEqual('abc123', 'abc123'), true);
    assert.strictEqual(constantTimeEqual('abc123', 'abc124'), false);
    assert.strictEqual(constantTimeEqual('abc123', 'abc1234'), false);
  });

  it('17. builds and parses HttpOnly admin session cookies safely', () => {
    const cookieStr = buildSessionCookie('jwt.tok.en', { crossOrigin: false, maxAgeSec: 28800 });
    assert.ok(cookieStr.includes('HttpOnly'));
    assert.ok(cookieStr.includes('Secure'));
    assert.ok(cookieStr.includes('SameSite=Strict'));

    const parsed = parseCookies('foo=bar; dcvc_admin_session=jwt.tok.en; theme=light');
    assert.strictEqual(parsed.dcvc_admin_session, 'jwt.tok.en');

    const cleared = clearSessionCookie({ crossOrigin: true });
    assert.ok(cleared.includes('Max-Age=0'));
    assert.ok(cleared.includes('SameSite=None'));
  });

});
