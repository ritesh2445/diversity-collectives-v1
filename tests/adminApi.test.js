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
  generateSecurePassword,
  parseCookies,
  buildSessionCookie,
  clearSessionCookie,
  normalizeAuth0Domain,
  sha256Hex,
  verifyAuth0IdToken,
  verifyAuth0AccessToken,
  verifyGoogleToken
} from '../worker/src/adminApi.js';
import { templateAdminLoginOtp, templateAdminUserInviteOtp } from '../worker/src/emailTemplates.js';

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

    // Formatted key with spaces and lowercase matches seamlessly with window 2/3
    const spacedSecret = totpSecret.match(/.{1,4}/g).join(' ').toLowerCase();
    const currentCode = await generateTotpCode(totpSecret, now);
    const isSpacedValid = await verifyTotpCode(spacedSecret, currentCode, { timestamp: now * 1000, window: 2 });
    assert.strictEqual(isSpacedValid, true);
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
    assert.strictEqual(validatePasswordStrength('CommunityCenter#2026!Strong').valid, true);

    // Test generated secure passwords meet all criteria
    for (let i = 0; i < 20; i++) {
      const generated = generateSecurePassword(16);
      assert.strictEqual(generated.length, 16);
      const check = validatePasswordStrength(generated);
      assert.strictEqual(check.valid, true, `Generated password "${generated}" must be valid: ${check.error}`);
    }

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

  // =====================================================================
  // Auth0 RS256 OIDC / JWKS Cryptographic Verification Tests
  // =====================================================================

  async function createTestRsaPair(kid = 'test-key-1') {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    );
    const pubJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    return {
      privateKey: keyPair.privateKey,
      jwk: {
        ...pubJwk,
        kid,
        use: 'sig',
        alg: 'RS256'
      }
    };
  }

  async function signTestRs256Jwt(privateKey, headerObj, payloadObj) {
    const h = Buffer.from(JSON.stringify(headerObj)).toString('base64url');
    const p = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
    const input = new TextEncoder().encode(`${h}.${p}`);
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, input);
    const s = Buffer.from(sig).toString('base64url');
    return `${h}.${p}.${s}`;
  }

  it('18. normalizes safe Auth0 domains and rejects SSRF / malformed domains', () => {
    assert.strictEqual(normalizeAuth0Domain('https://dcvc-prod.us.auth0.com/'), 'dcvc-prod.us.auth0.com');
    assert.strictEqual(normalizeAuth0Domain('DCVC-Prod.us.auth0.com'), 'dcvc-prod.us.auth0.com');
    assert.strictEqual(normalizeAuth0Domain('evil.com/path'), '');
    assert.strictEqual(normalizeAuth0Domain('user@evil.com'), '');
    assert.strictEqual(normalizeAuth0Domain('localhost'), '');
  });

  it('19. verifies valid Auth0 RS256 ID token against JWKS and rejects unverified email / wrong issuer / expired', async () => {
    const { privateKey, jwk } = await createTestRsaPair('kid-valid-1');
    const domain = 'dcvc-test.us.auth0.com';
    const clientId = 'client_abc_123';
    const nowSec = Math.floor(Date.now() / 1000);

    const validJwt = await signTestRs256Jwt(
      privateKey,
      { alg: 'RS256', typ: 'JWT', kid: 'kid-valid-1' },
      {
        iss: `https://${domain}/`,
        sub: 'google-oauth2|1001',
        aud: clientId,
        email: 'admin@diversitycollective.org',
        email_verified: true,
        iat: nowSec - 10,
        exp: nowSec + 3600
      }
    );

    const verified = await verifyAuth0IdToken(validJwt, {
      domain,
      clientId,
      jwks: [jwk],
      nowSec
    });
    assert.ok(verified);
    assert.strictEqual(verified.email, 'admin@diversitycollective.org');

    // Unverified email must fail closed
    const unverifiedJwt = await signTestRs256Jwt(
      privateKey,
      { alg: 'RS256', typ: 'JWT', kid: 'kid-valid-1' },
      {
        iss: `https://${domain}/`,
        sub: 'auth0|999',
        aud: clientId,
        email: 'admin@diversitycollective.org',
        email_verified: false,
        iat: nowSec,
        exp: nowSec + 3600
      }
    );
    assert.strictEqual(await verifyAuth0IdToken(unverifiedJwt, { domain, clientId, jwks: [jwk], nowSec }), null);

    // Wrong audience must fail
    assert.strictEqual(await verifyAuth0IdToken(validJwt, { domain, clientId: 'other_client', jwks: [jwk], nowSec }), null);

    // Wrong issuer must fail
    const badIssJwt = await signTestRs256Jwt(
      privateKey,
      { alg: 'RS256', typ: 'JWT', kid: 'kid-valid-1' },
      {
        iss: 'https://attacker.auth0.com/',
        sub: 'auth0|1',
        aud: clientId,
        email: 'admin@diversitycollective.org',
        email_verified: true,
        exp: nowSec + 3600
      }
    );
    assert.strictEqual(await verifyAuth0IdToken(badIssJwt, { domain, clientId, jwks: [jwk], nowSec }), null);

    // Expired token must fail
    const expiredJwt = await signTestRs256Jwt(
      privateKey,
      { alg: 'RS256', typ: 'JWT', kid: 'kid-valid-1' },
      {
        iss: `https://${domain}/`,
        sub: 'auth0|1',
        aud: clientId,
        email: 'admin@diversitycollective.org',
        email_verified: true,
        exp: nowSec - 120
      }
    );
    assert.strictEqual(await verifyAuth0IdToken(expiredJwt, { domain, clientId, jwks: [jwk], nowSec }), null);
  });

  it('20. blocks alg:none, HS256 key confusion, and tampered RS256 payloads', async () => {
    const { privateKey, jwk } = await createTestRsaPair('kid-tamper-1');
    const domain = 'dcvc-test.us.auth0.com';
    const clientId = 'client_abc_123';
    const nowSec = Math.floor(Date.now() / 1000);

    const validJwt = await signTestRs256Jwt(
      privateKey,
      { alg: 'RS256', typ: 'JWT', kid: 'kid-tamper-1' },
      {
        iss: `https://${domain}/`,
        sub: 'auth0|1',
        aud: clientId,
        email: 'editor@diversitycollective.org',
        email_verified: true,
        exp: nowSec + 3600
      }
    );

    // Tamper payload claim while preserving signature
    const parts = validJwt.split('.');
    const evilPayload = Buffer.from(JSON.stringify({
      iss: `https://${domain}/`,
      sub: 'auth0|1',
      aud: clientId,
      email: 'superadmin@diversitycollective.org',
      email_verified: true,
      exp: nowSec + 3600
    })).toString('base64url');
    assert.strictEqual(
      await verifyAuth0IdToken(`${parts[0]}.${evilPayload}.${parts[2]}`, { domain, clientId, jwks: [jwk], nowSec }),
      null
    );

    // Reject HS256 downgrade attempt
    const hsHeader = Buffer.from(JSON.stringify({ alg: 'HS256', kid: 'kid-tamper-1' })).toString('base64url');
    assert.strictEqual(
      await verifyAuth0IdToken(`${hsHeader}.${parts[1]}.${parts[2]}`, { domain, clientId, jwks: [jwk], nowSec }),
      null
    );
  });

  it('21. validates API access tokens with audience & automatically refreshes JWKS on kid rotation', async () => {
    const firstKey = await createTestRsaPair('kid-old');
    const rotatedKey = await createTestRsaPair('kid-rotated');
    const domain = 'dcvc-rotate-test.us.auth0.com';
    const audience = 'https://api.diversitycollectivevc.org';
    const nowSec = Math.floor(Date.now() / 1000);

    let fetchCount = 0;
    const mockFetch = async () => {
      fetchCount += 1;
      return {
        ok: true,
        json: async () => ({
          keys: fetchCount === 1 ? [firstKey.jwk] : [firstKey.jwk, rotatedKey.jwk]
        })
      };
    };

    const firstToken = await signTestRs256Jwt(
      firstKey.privateKey,
      { alg: 'RS256', kid: 'kid-old' },
      { iss: `https://${domain}/`, sub: 'auth0|staff', aud: audience, exp: nowSec + 1800 }
    );
    const ok1 = await verifyAuth0AccessToken(firstToken, { domain, audience, fetchImpl: mockFetch, nowSec });
    assert.ok(ok1);
    assert.strictEqual(fetchCount, 1);

    // Token signed with new rotated kid triggers single JWKS refresh
    const rotatedToken = await signTestRs256Jwt(
      rotatedKey.privateKey,
      { alg: 'RS256', kid: 'kid-rotated' },
      { iss: `https://${domain}/`, sub: 'auth0|staff', aud: audience, exp: nowSec + 1800 }
    );
    const ok2 = await verifyAuth0AccessToken(rotatedToken, { domain, audience, fetchImpl: mockFetch, nowSec });
    assert.ok(ok2);
    assert.strictEqual(fetchCount, 2);

    // SHA-256 replay digest determinism check
    assert.strictEqual(await sha256Hex(rotatedToken), await sha256Hex(rotatedToken));
    assert.notStrictEqual(await sha256Hex(rotatedToken), await sha256Hex(firstToken));
  });

  it('22. supports passwordless email OTP temp token generation and verification', async () => {
    const payload = {
      userId: 'adm-otp-test',
      email: 'staff@diversitycollective.org',
      name: 'Community Staff',
      role: 'admin',
      purpose: 'otp_login',
      emailOtpHash: 'mock_hash',
      emailOtpSalt: 'mock_salt'
    };
    const tempToken = await generateTempToken(payload, secret, 600, 'otp_login');
    assert.ok(tempToken);

    // Verifies with otp_login purpose
    const verified = await verifyTempToken(tempToken, secret, { allowedPurposes: ['otp_login'] });
    assert.ok(verified);
    assert.strictEqual(verified.email, 'staff@diversitycollective.org');
    assert.strictEqual(verified.purpose, 'otp_login');

    // Rejects if purpose is not allowed
    const wrongPurpose = await verifyTempToken(tempToken, secret, { allowedPurposes: ['2fa_login'] });
    assert.strictEqual(wrongPurpose, null);
  });

  it('23. formats branded HTML and plaintext email OTP for admin sign-in', () => {
    const emailData = templateAdminLoginOtp({ email: 'director@diversitycollective.org', otpCode: '849201' });
    assert.ok(emailData.subject.includes('849201'));
    assert.ok(emailData.html.includes('849201'));
    assert.ok(emailData.html.includes('director@diversitycollective.org'));
    assert.ok(emailData.text.includes('849201'));
  });

  it('24. verifies Google ID tokens and access tokens with tokeninfo/userinfo verification', async () => {
    const mockGoogleFetch = async (url) => {
      if (url.includes('tokeninfo')) {
        return {
          ok: true,
          json: async () => ({
            email: 'board@diversitycollective.org',
            email_verified: 'true',
            name: 'Board Member',
            sub: 'google-sub-999',
            aud: 'test-google-client-id'
          })
        };
      }
      if (url.includes('userinfo')) {
        return {
          ok: true,
          json: async () => ({
            email: 'board@diversitycollective.org',
            email_verified: true,
            name: 'Board Member',
            sub: 'google-sub-888'
          })
        };
      }
      return { ok: false, status: 400 };
    };

    const idTokenUser = await verifyGoogleToken({
      idToken: 'mock.google.idtoken',
      clientId: 'test-google-client-id',
      fetchImpl: mockGoogleFetch
    });
    assert.ok(idTokenUser);
    assert.strictEqual(idTokenUser.email, 'board@diversitycollective.org');
    assert.strictEqual(idTokenUser.sub, 'google-sub-999');

    const accessTokenUser = await verifyGoogleToken({
      accessToken: 'mock_google_access_token',
      fetchImpl: mockGoogleFetch
    });
    assert.ok(accessTokenUser);
    assert.strictEqual(accessTokenUser.email, 'board@diversitycollective.org');
    assert.strictEqual(accessTokenUser.sub, 'google-sub-888');

    // Rejects mismatched clientId
    const wrongAud = await verifyGoogleToken({
      idToken: 'mock.google.idtoken',
      clientId: 'wrong-client-id',
      fetchImpl: mockGoogleFetch
    });
    assert.strictEqual(wrongAud, null);
  });

  it('25. formats branded HTML and plaintext onboarding invite email with OTP code for newly added staff', () => {
    const inviteData = templateAdminUserInviteOtp({
      name: 'Jordan Rivera',
      email: 'jordan@diversitycollective.org',
      role: 'editor',
      otpCode: '592814',
      panelUrl: 'https://diversitycollectivevc.org/admin'
    });
    assert.ok(inviteData.subject.includes('592814'));
    assert.ok(inviteData.html.includes('592814'));
    assert.ok(inviteData.html.includes('Jordan Rivera'));
    assert.ok(inviteData.html.includes('jordan@diversitycollective.org'));
    assert.ok(inviteData.html.includes('Editor'));
    assert.ok(inviteData.text.includes('592814'));
    assert.ok(inviteData.text.includes('https://diversitycollectivevc.org/admin'));
  });

});
