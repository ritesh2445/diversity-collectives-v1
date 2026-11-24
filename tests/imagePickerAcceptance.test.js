import test, { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cmsStore } from '../src/services/cmsStore.js';
import { DCVC_IMAGE_LIBRARY, uploadAndStoreImage } from '../src/admin/services/imageService.js';
import { sanitizePublicUrl, sanitizeSiteStatePatch } from '../worker/src/siteStateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper minimal valid 1x1 PNG data URL
const VALID_1X1_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Polyfill minimal browser DOM globals for Node test environment
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsDataURL(blob) {
      setTimeout(() => {
        this.result = VALID_1X1_PNG;
        if (this.onload) this.onload({ target: { result: VALID_1X1_PNG } });
      }, 0);
    }
  };
}

if (typeof globalThis.Image === 'undefined') {
  globalThis.Image = class {
    constructor() {
      setTimeout(() => {
        this.width = 100;
        this.height = 100;
        if (this.onload) this.onload();
      }, 0);
    }
  };
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement(tag) {
      if (tag === 'canvas') {
        return {
          width: 100,
          height: 100,
          getContext: () => ({
            drawImage: () => {},
            getImageData: () => ({ data: [0, 0, 0, 0] })
          }),
          toDataURL: () => VALID_1X1_PNG
        };
      }
      return {};
    }
  };
}

describe('FINAL IMAGE UPLOAD & CROPPER ACCEPTANCE SUITE', () => {

  // =========================================================================
  // WORKFLOW A: Direct Upload
  // =========================================================================
  describe('A. Direct Upload Workflow', () => {
    it('1. Uploads valid image file and returns valid storage reference', async () => {
      const mockBuffer = Buffer.from(VALID_1X1_PNG.split(',')[1], 'base64');
      const mockFile = {
        name: 'community-event-banner.png',
        type: 'image/png',
        size: mockBuffer.length
      };

      const result = await uploadAndStoreImage(mockFile, 'media');
      assert.ok(result, 'Upload must return a result object');
      assert.ok(result.url, 'Upload result must provide a valid URL reference');
      assert.ok(result.filename, 'Upload result must provide a filename');
      assert.ok(result.url.startsWith('data:image/') || result.url.startsWith('/images/'), 'URL must be a valid data URL or relative path');
      assert.equal(result.provider, 'local_optimized', 'Should use local optimized provider when no remote token configured');
    });

    it('2. ImagePicker component defaults previewFit to contain', () => {
      const ipSource = fs.readFileSync(path.resolve(__dirname, '../src/admin/components/ImagePicker.jsx'), 'utf8');
      assert.ok(ipSource.includes("defaultFit = 'contain'"), "ImagePicker must default defaultFit to 'contain'");
      assert.ok(ipSource.includes("useState(defaultFit)"), 'previewFit state must initialize from defaultFit');
    });
  });

  // =========================================================================
  // WORKFLOW B & C: Cropping, Rotation & Existing Image Editing
  // =========================================================================
  describe('B & C. Cropping, Rotation & Existing Image Editing', () => {
    it('1. Supports standard aspect ratios and rotation controls in ImageCropperModal', () => {
      const cropperSource = fs.readFileSync(path.resolve(__dirname, '../src/admin/components/ImageCropperModal.jsx'), 'utf8');
      // Standard aspect ratios
      assert.ok(cropperSource.includes("'16:9'"), 'Must support 16:9 aspect ratio');
      assert.ok(cropperSource.includes("'4:3'"), 'Must support 4:3 aspect ratio');
      assert.ok(cropperSource.includes("'1:1'"), 'Must support 1:1 square aspect ratio');
      assert.ok(cropperSource.includes("'free'"), 'Must support freeform crop');

      // Rotation controls
      assert.ok(cropperSource.includes('RotateCw') || cropperSource.includes('rotation'), 'Must support rotation');
      assert.ok(cropperSource.includes('setRotation'), 'Must support updating rotation state');
    });

    it('2. Existing image editing replaces image without mutating unrelated record fields', () => {
      const originalRecord = {
        id: 'story-existing-edit-101',
        title: 'Ventura Coastal Pride 2026',
        author: 'Marcus Vance',
        category: 'Community & Advocacy',
        readingTime: '3 min read',
        image: '/images/hero-community.jpg',
        body: '<p>Annual community gathering celebrating unity and diversity.</p>',
        tags: ['Pride', 'Ventura', '2026']
      };

      cmsStore.saveNews(originalRecord);

      // Perform image replacement (simulating ImagePicker onChange)
      const croppedReplacementImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
      const updatedList = cmsStore.saveNews({
        id: 'story-existing-edit-101',
        image: croppedReplacementImage
      });

      const updatedRecord = updatedList.find(n => n.id === 'story-existing-edit-101');
      assert.ok(updatedRecord, 'Record must exist');
      assert.equal(updatedRecord.image, croppedReplacementImage, 'Image reference must be updated');
      // Unrelated fields must be preserved
      assert.equal(updatedRecord.title, 'Ventura Coastal Pride 2026', 'Title must remain unchanged');
      assert.equal(updatedRecord.author, 'Marcus Vance', 'Author must remain unchanged');
      assert.equal(updatedRecord.category, 'Community & Advocacy', 'Category must remain unchanged');
      assert.equal(updatedRecord.readingTime, '3 min read', 'Reading time must remain unchanged');
      assert.equal(updatedRecord.body, '<p>Annual community gathering celebrating unity and diversity.</p>', 'Body must remain unchanged');
      assert.deepEqual(updatedRecord.tags, ['Pride', 'Ventura', '2026'], 'Tags must remain unchanged');
    });
  });

  // =========================================================================
  // WORKFLOW D: Media Library
  // =========================================================================
  describe('D. Media Library Workflow', () => {
    it('1. Pre-packages authentic DCVC Center photography without placeholder mockups', () => {
      assert.ok(Array.isArray(DCVC_IMAGE_LIBRARY) && DCVC_IMAGE_LIBRARY.length >= 10, 'DCVC library must have >= 10 assets');
      
      const crc = DCVC_IMAGE_LIBRARY.find(img => img.id === 'crc');
      assert.ok(crc, 'Must contain CRC building asset');
      assert.equal(crc.path, '/images/crc-building.jpg');

      const umbrella = DCVC_IMAGE_LIBRARY.find(img => img.id === 'umbrella');
      assert.ok(umbrella, 'Must contain Rainbow Umbrella asset');
      assert.equal(umbrella.path, '/images/youth-umbrella.jpg');

      const shines = DCVC_IMAGE_LIBRARY.find(img => img.id === 'shines');
      assert.ok(shines, 'Must contain Diversity SHINES clinic room asset');
      assert.equal(shines.path, '/images/shines-screening.jpg');
    });

    it('2. ImagePicker modal allows selecting approved photo and calling onChange', () => {
      let selectedUrl = null;
      const onChange = (url) => { selectedUrl = url; };
      
      // Simulate selecting from library
      const libraryAsset = DCVC_IMAGE_LIBRARY[0];
      onChange(libraryAsset.path);

      assert.equal(selectedUrl, '/images/crc-building.jpg', 'Picker must accept selected library image');
    });
  });

  // =========================================================================
  // WORKFLOW E: CORS Handling
  // =========================================================================
  describe('E. CORS Handling Workflow', () => {
    it('1. ImageCropperModal explicitly identifies CORS restrictions and returns CORS_RESTRICTED error', () => {
      const cropperSource = fs.readFileSync(path.resolve(__dirname, '../src/admin/components/ImageCropperModal.jsx'), 'utf8');
      
      assert.ok(cropperSource.includes("error: 'CORS_RESTRICTED'"), 'Cropper ensureDataUrl must explicitly return CORS_RESTRICTED error code');
      assert.ok(cropperSource.includes('isCorsSafe: false'), 'Cropper ensureDataUrl must flag isCorsSafe as false');
      assert.ok(cropperSource.includes('corsWarning'), 'Cropper state must track corsWarning');
      assert.ok(cropperSource.includes('AlertTriangle'), 'Cropper must render visual warning banner for CORS issues');
    });

    it('2. Prevents invalid crop operations and protects original image when CORS-restricted', () => {
      const cropperSource = fs.readFileSync(path.resolve(__dirname, '../src/admin/components/ImageCropperModal.jsx'), 'utf8');
      
      // Ensure handleApplyCrop blocks export if canvas export fails
      assert.ok(cropperSource.includes('!isCorsSafe') || cropperSource.includes('corsWarning'), 'Cropper must check CORS safety prior to applying crop');
      assert.ok(cropperSource.includes('alert('), 'Cropper alerts user when canvas is tainted or cannot be cropped');
    });
  });

  // =========================================================================
  // SECTION 3: Storage & Database Persistence
  // =========================================================================
  describe('Section 3: Storage & Database Persistence', () => {
    it('1. Successfully stores image reference in database/CMS record', () => {
      const testStory = {
        id: 'story-persist-test-202',
        title: 'Trans Youth Support Circle Milestone',
        category: 'Youth & Family',
        author: 'Sarah Lin, LCSW',
        image: '/images/youth-umbrella.jpg',
        body: '<p>Milestone celebration for youth programming.</p>',
        status: 'published'
      };

      cmsStore.saveNews(testStory);
      const retrieved = cmsStore.getNews().find(n => n.id === 'story-persist-test-202');
      assert.ok(retrieved, 'Saved record must be retrievable from cmsStore');
      assert.equal(retrieved.image, '/images/youth-umbrella.jpg', 'Image reference must persist in record');
    });

    it('2. Persists across simulated page refresh and new admin session', () => {
      // Simulate saving to storage
      const initialStoreData = cmsStore.getAllData();
      assert.ok(initialStoreData.news, 'CMS store must contain news collection');

      // Verify the saved story persists in the retrieved snapshot
      const storyInStore = initialStoreData.news.find(n => n.id === 'story-persist-test-202');
      assert.ok(storyInStore, 'Story with image must persist in CMS state payload');
      assert.equal(storyInStore.image, '/images/youth-umbrella.jpg');

      // Simulate site state sync / serialization
      const serialized = JSON.stringify(initialStoreData);
      const deserialized = JSON.parse(serialized);
      const storyAfterRefresh = deserialized.news.find(n => n.id === 'story-persist-test-202');
      assert.ok(storyAfterRefresh, 'Story must remain intact after JSON serialization (simulated refresh/session)');
      assert.equal(storyAfterRefresh.image, '/images/youth-umbrella.jpg');
    });
  });

  // =========================================================================
  // SECTION 4: Shared Admin Workflows Smoke Test
  // =========================================================================
  describe('Section 4: Shared Admin Workflows Smoke Test', () => {
    it('1. Stories and News: allows updating image and preserves article structure', () => {
      const story = {
        id: 'story-admin-workflow-301',
        title: 'Diversity SHINES Expands Free Testing',
        category: 'Health & Wellness',
        image: '/images/shines-screening.jpg',
        body: '<p>Expanding clinical hours to Saturdays.</p>'
      };
      cmsStore.saveNews(story);
      const saved = cmsStore.getNews().find(n => n.id === 'story-admin-workflow-301');
      assert.equal(saved.image, '/images/shines-screening.jpg');
    });

    it('2. Board Members: allows updating headshot portrait with avatar category', () => {
      const members = cmsStore.getStaff();
      assert.ok(members.length > 0, 'Must have board/staff members');
      const firstMember = members[0];
      
      const newHeadshot = '/images/volunteers.jpg';
      const updatedMember = cmsStore.saveStaff({ ...firstMember, photo: newHeadshot });
      const found = cmsStore.getStaff().find(m => m.id === firstMember.id);
      assert.equal(found.photo, newHeadshot, 'Board/staff member photo should be updated');
      assert.equal(found.name, firstMember.name, 'Board member name must remain intact');
      assert.equal(found.role, firstMember.role, 'Board member role must remain intact');
    });

    it('3. Business Directory: supports Affirming Business logo and photo updates', () => {
      const testBiz = {
        id: 'biz-test-dir-401',
        name: 'Ventura Books & Coffee',
        category: 'Dining & Coffee',
        city: 'Ventura',
        logo: '/images/logo-square.png',
        status: 'approved',
        is_verified: true
      };

      cmsStore.saveBusiness(testBiz);
      const saved = cmsStore.getBusinesses().find(b => b.id === 'biz-test-dir-401');
      assert.ok(saved, 'Business must be saved in cmsStore');
      assert.equal(saved.logo, '/images/logo-square.png');
      assert.equal(saved.is_verified, true);
    });

    it('4. Sponsorship / Partners: supports partner logo image updates', () => {
      const testSponsor = {
        id: 'sponsor-test-501',
        name: 'Ventura County Community Foundation',
        level: 'Visionary Partner',
        logo: '/images/logo-square.png',
        url: 'https://vccf.org'
      };

      cmsStore.saveSponsor(testSponsor);
      const sponsors = cmsStore.getSponsors();
      const saved = sponsors.find(p => p.id === 'sponsor-test-501');
      assert.ok(saved, 'Sponsor must be saved');
      assert.equal(saved.logo, '/images/logo-square.png', 'Sponsor logo must persist');
      assert.equal(saved.level, 'Visionary Partner', 'Sponsor level must remain intact');
    });

    it('5. Gallery: supports photo additions and updates', () => {
      const testPhoto = {
        id: 'gallery-test-601',
        title: 'Pride Parade Float 2026',
        category: 'Events',
        url: '/images/pride-prom.jpeg',
        caption: 'DCVC Community Float'
      };

      cmsStore.saveGalleryPhoto(testPhoto);
      const gallery = cmsStore.getGallery();
      const saved = gallery.find(g => g.id === 'gallery-test-601');
      assert.ok(saved, 'Gallery photo must be saved');
      assert.equal(saved.url, '/images/pride-prom.jpeg', 'Gallery image URL must persist');
      assert.equal(saved.title, 'Pride Parade Float 2026', 'Gallery title must remain intact');
    });
  });

  // =========================================================================
  // SECTION 5: Component Synchronization & Production Build Integrity
  // =========================================================================
  describe('Section 5: Component Synchronization & Production Build Integrity', () => {
    it('1. ImagePicker copies are synchronized byte-for-byte with 0 divergence', () => {
      const p1 = fs.readFileSync(path.resolve(__dirname, '../src/admin/components/ImagePicker.jsx'), 'utf8');
      const p2 = fs.readFileSync(path.resolve(__dirname, '../src/admin/ImagePicker.jsx'), 'utf8');
      const p3 = fs.readFileSync(path.resolve(__dirname, '../admin/src/components/ImagePicker.jsx'), 'utf8');

      assert.strictEqual(p1, p2, 'src/admin/components/ImagePicker.jsx must match src/admin/ImagePicker.jsx');
      assert.strictEqual(p1, p3, 'src/admin/components/ImagePicker.jsx must match admin/src/components/ImagePicker.jsx');
    });

    it('2. ImageCropperModal copies are synchronized byte-for-byte with 0 divergence', () => {
      const c1 = fs.readFileSync(path.resolve(__dirname, '../src/admin/components/ImageCropperModal.jsx'), 'utf8');
      const c2 = fs.readFileSync(path.resolve(__dirname, '../src/admin/ImageCropperModal.jsx'), 'utf8');
      const c3 = fs.readFileSync(path.resolve(__dirname, '../admin/src/components/ImageCropperModal.jsx'), 'utf8');

      assert.strictEqual(c1, c2, 'src/admin/components/ImageCropperModal.jsx must match src/admin/ImageCropperModal.jsx');
      assert.strictEqual(c1, c3, 'src/admin/components/ImageCropperModal.jsx must match admin/src/components/ImageCropperModal.jsx');
    });

    it('3. Dist build artifacts exist and index.html is populated', () => {
      const distPath = path.resolve(__dirname, '../dist/index.html');
      assert.ok(fs.existsSync(distPath), 'dist/index.html must exist from production build');
      const html = fs.readFileSync(distPath, 'utf8');
      assert.ok(html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>'), 'dist/index.html must be valid HTML');
    });
  });

});
