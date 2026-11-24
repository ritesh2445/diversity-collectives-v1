import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cmsStore } from '../src/services/cmsStore.js';
import { sanitizePublicUrl, sanitizeSiteStatePatch } from '../worker/src/siteStateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Story CMS: creates a new story with normalized fields', () => {
  const newStory = {
    title: 'New Community Center Opening in Ventura',
    category: 'Community & Advocacy',
    author: 'Elena Rostova',
    publishedAt: 'October 15, 2026',
    readingTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
    body: '<p>A major milestone for Ventura County LGBTQ+ families.</p>',
    status: 'published',
    tags: ['Advocacy', 'Community', 'Ventura']
  };

  const updatedNews = cmsStore.saveNews(newStory);
  const found = updatedNews.find(n => n.title === 'New Community Center Opening in Ventura');

  assert.ok(found, 'New article should be stored in cmsStore');
  assert.equal(found.category, 'Community & Advocacy');
  assert.equal(found.author, 'Elena Rostova');
  assert.equal(found.publishedAt, 'October 15, 2026');
  assert.equal(found.readingTime, '4 min read');
  assert.equal(found.body, '<p>A major milestone for Ventura County LGBTQ+ families.</p>');
  assert.equal(found.content, '<p>A major milestone for Ventura County LGBTQ+ families.</p>');
  assert.equal(found.status, 'published');
  assert.ok(found.slug, 'Slug should be automatically generated');
  assert.equal(found.image, newStory.image);
});

test('Story CMS: updates an existing story without clearing fields', () => {
  const original = {
    id: 'test-story-update-1',
    title: 'Historic Pride Parade 2026',
    category: 'Pride & Culture',
    author: 'DCVC Team',
    publishedAt: 'August 1, 2026',
    readingTime: '5 min read',
    image: '/images/pride-parade.jpg',
    images: ['/images/pride-parade.jpg', '/images/pride-2.jpg'],
    body: 'Initial body description',
    tags: ['Pride', '2026']
  };

  cmsStore.saveNews(original);

  // Edit with only title and body updated
  const editPayload = {
    id: 'test-story-update-1',
    title: 'Historic Pride Parade 2026 - Record Turnout',
    body: 'Updated body description with parade turnout details.'
  };

  const afterEdit = cmsStore.saveNews(editPayload);
  const updated = afterEdit.find(n => n.id === 'test-story-update-1');

  assert.ok(updated, 'Article should exist after update');
  assert.equal(updated.title, 'Historic Pride Parade 2026 - Record Turnout');
  assert.equal(updated.body, 'Updated body description with parade turnout details.');
  // Existing fields must be preserved
  assert.equal(updated.category, 'Pride & Culture');
  assert.equal(updated.publishedAt, 'August 1, 2026');
  assert.equal(updated.readingTime, '5 min read');
  assert.equal(updated.image, '/images/pride-parade.jpg');
  assert.deepEqual(updated.images, ['/images/pride-parade.jpg', '/images/pride-2.jpg']);
});

test('Worker Sanitization: allows base64 data URLs and standard image URLs', () => {
  const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const sanitized = sanitizePublicUrl(validDataUrl);
  assert.equal(sanitized, validDataUrl, 'Valid base64 data URL should be preserved');

  const httpsUrl = 'https://diversitycollective.org/images/community.jpg';
  assert.equal(sanitizePublicUrl(httpsUrl), httpsUrl, 'HTTPS URL should be preserved');

  const relativeUrl = '/images/community-gathering.jpg';
  assert.equal(sanitizePublicUrl(relativeUrl), relativeUrl, 'Root-relative URL should be preserved');

  // Verify patch sanitization preserves news article with data URL
  const patch = {
    cmsData: {
      news: [
        {
          id: 'art-1',
          title: 'Test Article',
          image: validDataUrl
        }
      ]
    }
  };
  const sanitizedPatch = sanitizeSiteStatePatch(patch, {});
  assert.ok(sanitizedPatch.cmsData.news, 'News articles should be present in sanitized patch');
  assert.equal(sanitizedPatch.cmsData.news[0].image, validDataUrl, 'Base64 image should be preserved');
});

test('Public Story Cards: News.jsx enforces uniform card height, aspect ratio, and footer alignment', () => {
  const newsJsxPath = path.resolve(__dirname, '../src/pages/News.jsx');
  const newsJsx = fs.readFileSync(newsJsxPath, 'utf8');

  // CardSpotlight aspect ratio
  assert.ok(newsJsx.includes('aspect-[16/10]'), 'Card image container must use aspect-[16/10]');
  // Fixed card heights and flex column
  assert.ok(newsJsx.includes('contentClassName="flex flex-col h-full justify-between"'), 'CardSpotlight content wrapper must be flex flex-col h-full justify-between');
  // Title height normalization
  assert.ok(newsJsx.includes('line-clamp-2') && newsJsx.includes('min-h-[3.25rem]'), 'Headline must use line-clamp-2 and min-h-[3.25rem]');
  // Bottom footer alignment
  assert.ok(newsJsx.includes('mt-auto'), 'Card footer must use mt-auto to align with bottom of row');
  // Draft filtering
  assert.ok(newsJsx.includes("art.status === 'draft'"), 'News.jsx must filter out draft articles from public listing');
});

test('Memory Lane Relocation: present in About.jsx and completely removed from Gallery.jsx', () => {
  const aboutJsxPath = path.resolve(__dirname, '../src/pages/About.jsx');
  const galleryJsxPath = path.resolve(__dirname, '../src/pages/Gallery.jsx');
  const memoryLanePath = path.resolve(__dirname, '../src/components/MemoryLaneSection.jsx');

  const aboutJsx = fs.readFileSync(aboutJsxPath, 'utf8');
  const galleryJsx = fs.readFileSync(galleryJsxPath, 'utf8');

  assert.ok(fs.existsSync(memoryLanePath), 'MemoryLaneSection.jsx component must exist');
  assert.ok(aboutJsx.includes('<MemoryLaneSection'), 'About.jsx must render <MemoryLaneSection />');

  // Verify position in About.jsx: after Mission/DEI and before Board
  const missionIdx = aboutJsx.indexOf('OUR MISSION');
  const memoryLaneIdx = aboutJsx.indexOf('<MemoryLaneSection');
  const boardIdx = aboutJsx.indexOf('LEADERSHIP & GOVERNANCE');

  assert.ok(missionIdx !== -1, 'Mission section must exist in About.jsx');
  assert.ok(memoryLaneIdx !== -1, 'MemoryLaneSection must exist in About.jsx');
  assert.ok(boardIdx !== -1, 'Board section must exist in About.jsx');
  assert.ok(memoryLaneIdx > missionIdx, 'Memory Lane must be placed after Mission/History');
  assert.ok(memoryLaneIdx < boardIdx, 'Memory Lane must be placed before Leadership/Board');

  // Verify Gallery.jsx does NOT contain the memory lane section
  assert.ok(!galleryJsx.includes('id="memory-lane"'), 'Gallery.jsx must NOT contain id="memory-lane" section');
  assert.ok(galleryJsx.includes('to="/about#memory-lane"'), 'Gallery.jsx must link to /about#memory-lane instead');
});
