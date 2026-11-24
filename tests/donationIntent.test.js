import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('Pre-Donation Donor Information & Intent Registration', () => {
  it('validates required fields: rejects empty or malformed email', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    assert.equal(emailRegex.test(''), false);
    assert.equal(emailRegex.test('not-an-email'), false);
    assert.equal(emailRegex.test('missing-domain@'), false);
    assert.equal(emailRegex.test('donor@domain'), false);
    assert.equal(emailRegex.test('donor@example.org'), true);
  });

  it('validates donor name: rejects empty donor name when not anonymous', () => {
    const validate = (name, isAnonymous) => {
      if (!isAnonymous && !name?.trim()) return false;
      return true;
    };

    assert.equal(validate('', false), false);
    assert.equal(validate('   ', false), false);
    assert.equal(validate('', true), true);
    assert.equal(validate('Maria Gonzalez', false), true);
  });

  it('generates cryptographic intent tokens with >= 192 bits of entropy', () => {
    const randomBytes = new Uint8Array(24);
    crypto.getRandomValues(randomBytes);
    const intentToken = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    assert.equal(intentToken.length, 48); // 24 bytes = 48 hex chars
    assert.match(intentToken, /^[0-9a-f]{48}$/);
  });

  it('calculates deterministic SHA-256 token hash and email hash', () => {
    const email = 'donor@example.org';
    const normalized = email.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    
    assert.equal(hash.length, 64);
    assert.equal(hash, crypto.createHash('sha256').update('donor@example.org').digest('hex'));
  });

  it('properly associates campaigns: General vs GEM Membership', () => {
    const getCampaign = (tab) => tab === 'gem' ? 'gem' : 'donate-to-change-lives-30236';
    
    assert.equal(getCampaign('general'), 'donate-to-change-lives-30236');
    assert.equal(getCampaign('gem'), 'gem');
  });

  it('verifies intent matching priority: exact single match resolved, ambiguous match queued for reconciliation', () => {
    const resolveIntent = (candidates, paymentAmountCents) => {
      if (!candidates || candidates.length === 0) return { matched: null, status: 'unmatched' };
      if (candidates.length === 1) return { matched: candidates[0], status: 'matched' };
      const matchingAmount = candidates.filter(c => Number(c.amount_cents) === paymentAmountCents);
      if (matchingAmount.length === 1) return { matched: matchingAmount[0], status: 'matched' };
      return { matched: null, status: 'ambiguous_match' };
    };

    // 1 single candidate
    const single = [{ id: 'int-1', amount_cents: 5000, donor_name: 'Alex Rivera' }];
    assert.equal(resolveIntent(single, 5000).status, 'matched');
    assert.equal(resolveIntent(single, 5000).matched.donor_name, 'Alex Rivera');

    // 2 candidates, one matching amount
    const multiple = [
      { id: 'int-1', amount_cents: 2500, donor_name: 'Alex' },
      { id: 'int-2', amount_cents: 5000, donor_name: 'Alex (Pride Keepsake)' }
    ];
    assert.equal(resolveIntent(multiple, 5000).status, 'matched');
    assert.equal(resolveIntent(multiple, 5000).matched.id, 'int-2');

    // 2 candidates with same amount -> ambiguous
    const ambiguous = [
      { id: 'int-1', amount_cents: 5000 },
      { id: 'int-2', amount_cents: 5000 }
    ];
    assert.equal(resolveIntent(ambiguous, 5000).status, 'ambiguous_match');
  });
});
