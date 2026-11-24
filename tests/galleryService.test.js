import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildJsDelivrUrl,
  sanitizeFilename,
  uploadToGitHub,
  deleteFromGitHub,
  listGalleryPhotos,
  addGalleryPhoto,
  deleteGalleryPhoto,
  FALLBACK_GALLERY_PHOTOS,
  DEFAULT_GITHUB_OWNER,
  DEFAULT_GITHUB_REPO,
  DEFAULT_GITHUB_BRANCH
} from '../worker/src/galleryService.js';
import { generateAuthToken } from '../worker/src/adminApi.js';
import worker from '../worker/src/index.js';

describe('GitHub & jsDelivr CDN Gallery Engine', () => {

  it('1. builds accurate jsDelivr CDN URLs for GitHub assets', () => {
    const url1 = buildJsDelivrUrl({
      path: 'public/images/community-gathering.jpg'
    });
    assert.strictEqual(
      url1,
      `https://cdn.jsdelivr.net/gh/${DEFAULT_GITHUB_OWNER}/${DEFAULT_GITHUB_REPO}@${DEFAULT_GITHUB_BRANCH}/public/images/community-gathering.jpg`
    );

    // Handles leading slashes and custom branches
    const url2 = buildJsDelivrUrl({
      owner: 'custom-org',
      repo: 'custom-repo',
      branch: 'v1.0.0',
      path: '/gallery/pride/main-stage.webp'
    });
    assert.strictEqual(
      url2,
      'https://cdn.jsdelivr.net/gh/custom-org/custom-repo@v1.0.0/gallery/pride/main-stage.webp'
    );

    // Returns empty string on empty path
    assert.strictEqual(buildJsDelivrUrl({ path: '' }), '');
  });

  it('2. sanitizes image filenames into clean, safe kebab-case with extensions', () => {
    assert.strictEqual(sanitizeFilename('Ventura Pride 2026 Stage.PNG'), 'ventura-pride-2026-stage.png');
    assert.strictEqual(sanitizeFilename('  youth_circle--art @ CRC!.jpeg '), 'youth-circle-art-crc.jpeg');
    assert.strictEqual(sanitizeFilename('photo-without-ext'), 'photo-without-ext.jpg');
    assert.strictEqual(sanitizeFilename(''), 'gallery-image.jpg');
  });

  it('3. safely validates parameters before invoking GitHub API', async () => {
    // Missing token
    const resNoToken = await uploadToGitHub({
      path: 'gallery/test.jpg',
      contentBase64: 'abc1234'
    });
    assert.strictEqual(resNoToken.success, false);
    assert.ok(resNoToken.error.includes('GITHUB_TOKEN'));

    // Missing path or content
    const resNoPath = await uploadToGitHub({
      githubToken: 'ghp_fake_token_123',
      contentBase64: 'abc'
    });
    assert.strictEqual(resNoPath.success, false);

    // Delete validation
    const resDel = await deleteFromGitHub({
      githubToken: '',
      path: 'gallery/test.jpg',
      sha: '12345'
    });
    assert.strictEqual(resDel.success, false);
  });

  it('4. provides curated fallback gallery photos with CDN links when DB is offline', async () => {
    const photos = await listGalleryPhotos(null);
    assert.ok(Array.isArray(photos));
    assert.ok(photos.length >= 8);

    // Verifies all photos have title, category, image_url and cdn_url
    for (const photo of photos) {
      assert.ok(photo.title);
      assert.ok(photo.category);
      assert.ok(photo.image_url);
      assert.ok(photo.cdn_url.includes('cdn.jsdelivr.net') || photo.cdn_url.startsWith('/'));
    }

    // Category filter on fallback
    const pridePhotos = await listGalleryPhotos(null, { category: 'Festivals & Pride' });
    assert.ok(pridePhotos.length >= 2);
    assert.ok(pridePhotos.every(p => p.category === 'Festivals & Pride'));

    // Year filter on fallback
    const photos2026 = await listGalleryPhotos(null, { year: '2026' });
    assert.ok(photos2026.every(p => p.year === '2026'));
  });

  it('5. adds and deletes gallery photos cleanly without crashing on null db', async () => {
    const newPhoto = {
      title: 'New Community Celebration',
      category: 'Festivals & Pride',
      year: '2026',
      image_url: '/images/new-photo.jpg',
      cdn_url: 'https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public/images/new-photo.jpg',
      description: 'Joyful community moment.'
    };

    const added = await addGalleryPhoto(null, newPhoto);
    assert.ok(added.id);
    assert.strictEqual(added.title, newPhoto.title);

    const deleted = await deleteGalleryPhoto(null, added.id);
    assert.strictEqual(deleted.success, true);
  });

  it('6. stores uploaded gallery photo binaries & serves /api/gallery/media/:id even without GITHUB_TOKEN', async () => {
    const secret = 'test_gallery_worker_jwt_secret_12345';
    const token = await generateAuthToken(
      { userId: 'u_gal', email: 'gallery@diversitycollective.org', role: 'admin', name: 'Admin', allowedSections: null },
      secret
    );
    const res = await worker.fetch(
      new Request('https://dcvc-api.diversity-collective-vc.workers.dev/api/admin/gallery/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: 'TDOR Candlelight',
          category: 'Center & Community',
          year: '2026',
          fileName: 'tdor.png',
          fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
        })
      }),
      { ADMIN_JWT_SECRET: secret },
      { waitUntil: () => {} }
    );
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(!String(data.message).includes('GITHUB_TOKEN'), 'Must not tell user to configure GITHUB_TOKEN');
    assert.ok(data.photo.cdn_url.includes('/api/gallery/media/'), 'Must provide live Worker media URL when GitHub push is skipped');
    assert.strictEqual(data.photo.image_url, data.photo.cdn_url);

    // Ensure Volunteer showcase pathways have vibrant glow styling while keeping dark legible text
    const volunteerSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/Volunteer.jsx'), 'utf8');
    assert.ok(volunteerSrc.includes('VOLUNTEER_PATHWAYS') && volunteerSrc.includes('group-hover:opacity-100') && volunteerSrc.includes('text-slate-950'));
  });

});

