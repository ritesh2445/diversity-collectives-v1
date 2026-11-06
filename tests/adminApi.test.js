import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  hashPassword,
  generateAuthToken,
  verifyAuthToken,
  requireRole,
  logAdminAction
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

});

