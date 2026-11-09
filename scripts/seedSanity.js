/**
 * DCVC — Sanity Initial Content Seeder & Migration Script
 * Imports verified programs, events, board, staff, news, sponsors, and resources
 * from dcvcData.js into the live Sanity production dataset via the Mutation API.
 * 
 * Usage:
 *   SANITY_AUTH_TOKEN="sk..." node scripts/seedSanity.js
 */

import { 
  orgInfo, 
  programsList, 
  liveEvents, 
  resourcesDirectory, 
  boardMembers, 
  staffMembers, 
  sponsorsList, 
  newsArticles, 
  galleryPhotos 
} from '../src/data/dcvcData.js';

const PROJECT_ID = process.env.SANITY_PROJECT_ID || '6abul0sq';
const DATASET = process.env.SANITY_DATASET || 'production';
const API_VERSION = '2024-03-01';
const AUTH_TOKEN = process.env.SANITY_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('\n❌ Missing SANITY_AUTH_TOKEN environment variable.');
  console.log('To run this seeder, generate an Editor token in:');
  console.log(`  https://www.sanity.io/manage/project/${PROJECT_ID}/api#tokens\n`);
  console.log('Then execute:');
  console.log('  $env:SANITY_AUTH_TOKEN="your-token"; node scripts/seedSanity.js\n');
  process.exit(1);
}

async function mutate(mutations) {
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({ mutations })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Sanity Mutation Error HTTP ${res.status}: ${errorText}`);
  }

  return res.json();
}

async function runSeed() {
  console.log(`🌱 Seeding Sanity Project: ${PROJECT_ID} (${DATASET})...\n`);

  const mutations = [];

  // 1. Programs
  for (const p of programsList) {
    mutations.push({
      createOrReplace: {
        _id: `program-${p.slug}`,
        _type: 'program',
        title: p.title,
        slug: { _type: 'slug', current: p.slug },
        chapter: p.chapter || 1,
        tagline: p.tagline || '',
        summary: p.summary || '',
        description: p.description || '',
        audience: p.audience || '',
        schedule: p.schedule || '',
        location: p.location || '',
        contactEmail: p.contactEmail || 'info@diversitycollective.org',
        contactPhone: p.contactPhone || '(805) 644-LGBT',
        amenities: p.amenities || []
      }
    });
  }
  console.log(`✓ Prepared ${programsList.length} programs`);

  // 2. Events
  for (const e of liveEvents) {
    mutations.push({
      createOrReplace: {
        _id: `event-${e.slug}`,
        _type: 'event',
        title: e.title,
        slug: { _type: 'slug', current: e.slug },
        date: e.date,
        time: e.time,
        category: e.category,
        location: e.location,
        address: e.address,
        description: e.description,
        registrationUrl: e.registrationUrl || '',
        contactEmail: e.contactEmail || 'events@diversitycollective.org',
        isCancelled: e.isCancelled || false
      }
    });
  }
  console.log(`✓ Prepared ${liveEvents.length} calendar events`);

  // 3. Board Members
  (boardMembers || []).forEach((b, idx) => {
    mutations.push({
      createOrReplace: {
        _id: `board-${idx + 1}`,
        _type: 'boardMember',
        name: b.name,
        role: b.role,
        bio: b.bio || '',
        order: idx + 1
      }
    });
  });
  console.log(`✓ Prepared ${(boardMembers || []).length} board members`);

  // 4. Staff Members
  (staffMembers || []).forEach((s, idx) => {
    mutations.push({
      createOrReplace: {
        _id: `staff-${idx + 1}`,
        _type: 'staffMember',
        name: s.name,
        title: s.title,
        department: s.department || 'Operations',
        bio: s.bio || '',
        email: s.email || '',
        order: idx + 1
      }
    });
  });
  console.log(`✓ Prepared ${(staffMembers || []).length} staff members`);

  // 5. Sponsors
  (sponsorsList || []).forEach((sp, idx) => {
    mutations.push({
      createOrReplace: {
        _id: `sponsor-${idx + 1}`,
        _type: 'sponsor',
        name: sp.name,
        shortName: sp.shortName,
        tier: sp.tier || 'Community Partner',
        role: sp.role,
        url: sp.url
      }
    });
  });
  console.log(`✓ Prepared ${(sponsorsList || []).length} sponsors & alliances`);

  // 6. News Articles
  for (const n of newsArticles) {
    mutations.push({
      createOrReplace: {
        _id: `news-${n.slug}`,
        _type: 'newsArticle',
        title: n.title,
        slug: { _type: 'slug', current: n.slug },
        publishedAt: n.date || new Date().toISOString(),
        excerpt: n.excerpt || '',
        author: n.author || 'DCVC Staff',
        readingTime: n.readingTime || '4 min read',
        body: n.content || ''
      }
    });
  }
  console.log(`✓ Prepared ${newsArticles.length} news articles`);

  // Batch execute mutations in chunks of 50
  console.log(`\n🚀 Uploading ${mutations.length} records to Sanity...`);
  const CHUNK_SIZE = 50;
  for (let i = 0; i < mutations.length; i += CHUNK_SIZE) {
    const chunk = mutations.slice(i, i + CHUNK_SIZE);
    await mutate(chunk);
    console.log(`  Uploaded batch ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} items)...`);
  }

  console.log('\n✨ Sanity dataset successfully populated! All records are live.');
}

runSeed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});

