// API Client Validation Tests
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { submitContact, submitVolunteer, submitBusinessListing } from '../src/services/api.js';

describe('Centralized API Client Validation', () => {
  it('submitContact rejects empty name', async () => {
    const res = await submitContact({ name: '', email: 'test@example.com', message: 'Hello DCVC team!' });
    assert.equal(res.success, false);
    assert.ok(res.errors?.name);
  });

  it('submitContact rejects invalid email', async () => {
    const res = await submitContact({ name: 'Jordan Doe', email: 'invalid-email', message: 'Hello DCVC team!' });
    assert.equal(res.success, false);
    assert.ok(res.errors?.email);
  });

  it('submitContact rejects short message', async () => {
    const res = await submitContact({ name: 'Jordan Doe', email: 'jordan@example.com', message: 'Hi' });
    assert.equal(res.success, false);
    assert.ok(res.errors?.message);
  });

  it('submitVolunteer requires consent and phone', async () => {
    const res = await submitVolunteer({
      fullName: 'Sam Rivers',
      email: 'sam@example.com',
      phone: '',
      backgroundCheckConsent: false
    });
    assert.equal(res.success, false);
  });

  it('submitBusinessListing requires affirming pledge signature', async () => {
    const res = await submitBusinessListing({
      businessName: 'Ventura Bakery',
      category: 'Dining & Food',
      city: 'Ventura',
      email: 'owner@venturabakery.com',
      affirmingPledge: false
    });
    assert.equal(res.success, false);
    assert.ok(res.errors?.affirmingPledge);
  });
});
