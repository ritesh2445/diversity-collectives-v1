import { describe, it } from 'node:test';
import assert from 'node:assert';
import { optimizeImageFile, uploadAndStoreImage, DCVC_IMAGE_LIBRARY } from '../src/admin/services/imageService.js';

describe('Admin Image Upload & Optimization Service', () => {
  it('exposes authentic DCVC image library with valid categories and paths', () => {
    assert.ok(Array.isArray(DCVC_IMAGE_LIBRARY));
    assert.ok(DCVC_IMAGE_LIBRARY.length >= 10);
    for (const item of DCVC_IMAGE_LIBRARY) {
      assert.ok(item.id, 'Image item must have id');
      assert.ok(item.name, 'Image item must have name');
      assert.ok(item.path.startsWith('/images/'), 'Image path must be in /images/');
      assert.ok(item.category, 'Image must have category');
    }
  });

  it('gracefully handles standard relative & absolute URLs without crashing or re-encoding', async () => {
    const relativeUrl = '/images/youth-umbrella.jpg';
    const result = await optimizeImageFile(relativeUrl);
    assert.strictEqual(result.url, relativeUrl);
    assert.strictEqual(result.filename, 'youth-umbrella.jpg');

    const externalUrl = 'https://example.com/photo.png';
    const extResult = await optimizeImageFile(externalUrl);
    assert.strictEqual(extResult.url, externalUrl);
  });

  it('rejects safely when no file or invalid non-image file is passed', async () => {
    await assert.rejects(
      async () => optimizeImageFile(null),
      /No image file provided/
    );

    await assert.rejects(
      async () => optimizeImageFile({ type: 'application/pdf', name: 'document.pdf' }),
      /Selected file is not an image/
    );
  });

  it('safely uploads and returns consistent metadata via uploadAndStoreImage', async () => {
    const url = '/images/crc-building.jpg';
    const res = await uploadAndStoreImage(url);
    assert.ok(res);
    assert.strictEqual(res.url, url);
    assert.ok(res.filename);
  });
});
