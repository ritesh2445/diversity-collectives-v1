// Cloudinary Helper Tests
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getOptimizedImageUrl } from '../src/lib/cloudinary.js';

describe('Cloudinary Media Helper', () => {
  it('returns fallback image if publicIdOrPath is null or empty', () => {
    assert.equal(getOptimizedImageUrl(null), '/images/hero-community.jpg');
    assert.equal(getOptimizedImageUrl(''), '/images/hero-community.jpg');
  });

  it('preserves absolute URLs without rewriting', () => {
    const external = 'https://images.unsplash.com/photo-123456';
    assert.equal(getOptimizedImageUrl(external), external);
  });

  it('preserves local /images/ paths when cloud name is not set', () => {
    const local = '/images/crc-building.jpg';
    assert.equal(getOptimizedImageUrl(local), local);
  });
});
