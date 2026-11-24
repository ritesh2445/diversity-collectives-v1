// Cloudinary Helper Tests
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getOptimizedImageUrl, buildJsDelivrUrl } from '../src/lib/cloudinary.js';

describe('GitHub & jsDelivr Media CDN Helper', () => {
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

  it('builds jsDelivr CDN URLs from GitHub repository', () => {
    const cdnUrl = buildJsDelivrUrl({
      owner: 'diversity-collective',
      repo: 'diversity-collectives-v1',
      branch: 'main',
      path: 'public/images/crc-building.jpg'
    });
    assert.equal(cdnUrl, 'https://cdn.jsdelivr.net/gh/diversity-collective/diversity-collectives-v1@main/public/images/crc-building.jpg');

    const generated = getOptimizedImageUrl('/images/crc-building.jpg', {
      cdn: true,
      owner: 'diversity-collective',
      repo: 'diversity-collectives-v1',
      branch: 'main'
    });
    assert.equal(generated, 'https://cdn.jsdelivr.net/gh/diversity-collective/diversity-collectives-v1@main/public/images/crc-building.jpg');
  });
});
