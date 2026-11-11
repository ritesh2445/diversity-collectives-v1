/**
 * DCVC — Complete Sanity Prepopulation & Asset CDN Uploader
 * Prepopulates ALL Sanity schemas and uploads website images directly to Sanity Assets CDN
 * (`cdn.sanity.io/images/6abul0sq/production/...`) for instant, edge-cached rendering.
 *
 * Project ID: 6abul0sq
 * Dataset: production
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  orgInfo,
  programsList,
  liveEvents,
  annualSignatureEvents,
  trainingCourses,
  resourcesDirectory,
  boardMembers,
  staffMembers,
  sponsorsList,
  newsArticles,
  galleryPhotos
} from '../src/data/dcvcData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PROJECT_ID = process.env.SANITY_PROJECT_ID || '6abul0sq';
const DATASET = process.env.SANITY_DATASET || 'production';
const API_VERSION = '2024-03-01';
const AUTH_TOKEN =
  process.env.SANITY_AUTH_TOKEN ||
  'skQ1TKiRdD4dRqG6S9amD0mKfb2QH3KMS6XgorxMhgvoSu3XTStt2NV4wOpc8SH21v67jcgJ83srezRHWEYis0PzGvlP2A9oPugueUoHVlWc1vLwP2faYMvKR519KLaPTAsucmFdm78GEIJCp2itPr8O2j0Pz7HYqA80cNQH7zoeQ0YQOdvl';

const uploadedAssetCache = new Map();

function guessMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

async function uploadImageAsset(sourcePathOrUrl, hintName = 'image.jpg') {
  if (!sourcePathOrUrl) return null;
  if (uploadedAssetCache.has(sourcePathOrUrl)) {
    return uploadedAssetCache.get(sourcePathOrUrl);
  }

  let buffer = null;
  let filename = hintName;
  let contentType = 'image/jpeg';

  try {
    if (sourcePathOrUrl.startsWith('/')) {
      const localPath = path.join(ROOT_DIR, 'public', sourcePathOrUrl);
      if (!fs.existsSync(localPath)) {
        console.warn(`  [warn] Missing local image: ${localPath}`);
        return null;
      }
      buffer = fs.readFileSync(localPath);
      filename = path.basename(localPath);
      contentType = guessMimeType(filename);
    } else if (sourcePathOrUrl.startsWith('http')) {
      const imgRes = await fetch(sourcePathOrUrl);
      if (!imgRes.ok) {
        console.warn(`  [warn] Failed downloading image ${sourcePathOrUrl}: HTTP ${imgRes.status}`);
        return null;
      }
      const arr = await imgRes.arrayBuffer();
      buffer = Buffer.from(arr);
      contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      filename = `${hintName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()}.jpg`;
    } else {
      return null;
    }

    const uploadUrl = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/assets/images/${DATASET}?filename=${encodeURIComponent(filename)}`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${AUTH_TOKEN}`
      },
      body: buffer
    });

    if (!res.ok) {
      const txt = await res.text();
      console.warn(`  [warn] Sanity asset upload failed (${filename}): HTTP ${res.status} ${txt}`);
      return null;
    }

    const json = await res.json();
    const assetDoc = json.document;
    const ref = {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: assetDoc._id
      }
    };
    uploadedAssetCache.set(sourcePathOrUrl, ref);
    console.log(`  + Uploaded CDN Asset: ${filename} -> ${assetDoc.url}`);
    return ref;
  } catch (err) {
    console.warn(`  [warn] Asset upload error for ${sourcePathOrUrl}:`, err.message);
    return null;
  }
}

async function mutate(mutations) {
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({ mutations })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Sanity API Error HTTP ${res.status}: ${errorText}`);
  }

  return res.json();
}

async function querySanity(groq) {
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.result;
}

async function runSeed() {
  console.log(`\n============================================================`);
  console.log(`Prepopulating All Sanity Schemas + CDN Assets (${PROJECT_ID}/${DATASET})`);
  console.log(`============================================================\n`);

  const mutations = [];

  // Upload Hero Spotlight Image first
  console.log('1. Uploading website images to Sanity Assets CDN...');
  const heroSpotlightRef = await uploadImageAsset('/images/community-gathering.jpg', 'hero-community-gathering');

  // 1. Site Settings (Singleton — full website control!)
  mutations.push({
    createOrReplace: {
      _id: 'siteSettings',
      _type: 'siteSettings',
      orgName: orgInfo.name,
      tagline: orgInfo.tagline,
      mission: orgInfo.mission,
      ein: orgInfo.ein,
      phone: orgInfo.phone,
      email: orgInfo.email,
      address: orgInfo.address.full,
      hours: orgInfo.hours,
      socials: {
        facebook: orgInfo.socials.facebook,
        instagram: orgInfo.socials.instagram,
        youtube: orgInfo.socials.youtube
      },
      announcementBanner: {
        enabled: true,
        text: 'Ventura County Pride 2026 Vendor & Performer Applications Are Now Open!',
        linkUrl: '/events'
      },
      hero: {
        titleLine1: 'You Are',
        titleAccentWord: 'Always Welcome',
        titleLine2: 'Here.',
        subtitle:
          "Diversity Collective is Ventura County's premier cultural sanctuary and clinical wellness home — delivering free rapid health testing, youth peer programs, mutual aid, and intersectional advocacy across all 10 county cities.",
        primaryCtaText: 'Explore Free Programs',
        primaryCtaLink: '/programs',
        secondaryCtaText: 'Visit Sanctuary',
        secondaryCtaLink: '/contact',
        emailAddress: orgInfo.email || 'info@diversitycollective.org',
        ...(heroSpotlightRef ? { spotlightImage: heroSpotlightRef } : {}),
        cardTitle: 'Community Resource Center',
        cardSubtitle: '2471 Portola Rd, Suite 100 · Open Mon–Fri 1:00–5:00 PM',
        helplineText: 'Helpline: (805) 644-5428 · 24/7 Crisis: Dial 988',
        heroTheme: 'aurora'
      },
      theme: {
        btnPrimaryBg: '#5A1E65',
        btnPrimaryText: '#FFFFFF',
        btnSecondaryBg: '#FFFFFF',
        btnSecondaryText: '#0F172A',
        btnDonateBg: '#FDE047',
        btnPrimaryRadius: '9999px',
        cardRadius: '24px',
        headingFont: 'Plus Jakarta Sans',
        bodyFont: 'Plus Jakarta Sans'
      },
      sections: [
        { _key: 'sec-hero', sectionId: 'hero_banner', label: 'Hero Sanctuary Banner', visible: true },
        { _key: 'sec-impact', sectionId: 'impact_stats', label: 'Impact Stats Band', visible: true },
        { _key: 'sec-dir', sectionId: 'directory_cta', label: 'Affirming Business Directory CTA', visible: true },
        { _key: 'sec-prog', sectionId: 'programs_section', label: 'Core Programs Showcase', visible: true },
        { _key: 'sec-evt', sectionId: 'events_section', label: 'Upcoming Community Events', visible: true },
        { _key: 'sec-give', sectionId: 'zeffy_giving', label: 'Zeffy 0% Fee Giving Appeal', visible: true },
        { _key: 'sec-train', sectionId: 'training_cta', label: 'P.R.I.D.E. Training CTA', visible: true },
        { _key: 'sec-voice', sectionId: 'community_voices', label: 'Voices & Sponsors Strip', visible: true },
        { _key: 'sec-news', sectionId: 'newsletter_section', label: 'Community Newsletter Signup', visible: true }
      ]
    }
  });
  console.log('✓ Prepared full Site Settings (Hero, Theme, Section Order, Banner, Org Info)');

  // 2. Programs
  for (let idx = 0; idx < programsList.length; idx++) {
    const p = programsList[idx];
    const heroImageRef = await uploadImageAsset(p.heroImage, `program-${p.slug}`);
    mutations.push({
      createOrReplace: {
        _id: `program-${p.slug}`,
        _type: 'program',
        title: p.title,
        slug: { _type: 'slug', current: p.slug },
        chapter: String(idx + 1).padStart(2, '0'),
        tagline: p.tagline || 'Affirming Care, Safe Harbor & Community Connection',
        summary: p.summary || p.tagline || '',
        description: p.description || p.summary || '',
        audience: p.audience || 'All LGBTQ+ community members, youth, and affirming allies',
        schedule: p.schedule || 'Weekly & Monthly Gatherings',
        location: p.location || orgInfo.address.full,
        contactEmail: p.contactEmail || orgInfo.email,
        contactPhone: p.contactPhone || '(805) 644-5428',
        accentColor: p.accent || '#5A1E65',
        imageFit: p.imageFit || 'cover',
        ...(heroImageRef ? { heroImage: heroImageRef } : {}),
        amenities: p.amenities || ['Free Rapid Testing', 'Youth Safe Space', 'Peer Support Circles'],
        order: idx + 1
      }
    });
  }
  console.log(`✓ Prepared ${programsList.length} Programs with Sanity CDN images`);

  // 3. Events (Live + Annual Signature Events)
  const allEvents = [...liveEvents];
  (annualSignatureEvents || []).forEach((sig) => {
    if (!allEvents.some((e) => e.title === sig.title)) {
      allEvents.push({
        slug: sig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title: sig.title,
        month: 'ANNUAL',
        day: '01',
        year: '2026',
        date: 'Annual Community Celebration',
        time: 'All Day',
        category: 'Culture',
        location: 'Plaza Park, Downtown Ventura, CA',
        address: 'Plaza Park, Ventura, CA',
        image: '/images/community-gathering.jpg',
        description: sig.description,
        isRecurring: true,
        recurrenceRule: 'Annual',
        isCancelled: false,
        featured: true,
        registrationUrl: '/events'
      });
    }
  });

  for (let idx = 0; idx < allEvents.length; idx++) {
    const e = allEvents[idx];
    const evtImageRef = await uploadImageAsset(e.image || '/images/community-gathering.jpg', `event-${e.slug}`);
    const dateLabel = e.date || `${e.month || 'OCT'} ${e.day || '01'}, ${e.year || '2026'}`;
    mutations.push({
      createOrReplace: {
        _id: `event-${e.slug}`,
        _type: 'event',
        title: e.title,
        slug: { _type: 'slug', current: e.slug },
        date: dateLabel,
        month: e.month || 'OCT',
        day: e.day || '01',
        year: e.year || '2026',
        time: e.time || 'Check schedule',
        location: e.location || 'Ventura Community Resource Center',
        address: e.address || orgInfo.address.full,
        category: e.category || 'Support',
        ...(evtImageRef ? { image: evtImageRef } : {}),
        description: e.description || 'Join us for this welcoming community event.',
        isRecurring: !!e.isRecurring,
        recurrenceRule: e.recurrenceRule || '',
        isCancelled: !!e.isCancelled,
        cancellationReason: e.cancellationReason || '',
        registrationUrl: e.registrationUrl
          ? e.registrationUrl.startsWith('http')
            ? e.registrationUrl
            : `https://diversitycollective.pages.dev${e.registrationUrl}`
          : '',
        capacity: 150,
        featured: !!e.featured,
        order: idx + 1
      }
    });
  }
  console.log(`✓ Prepared ${allEvents.length} Community Events with Sanity CDN images`);

  // 4. Training Courses
  (trainingCourses || []).forEach((c, idx) => {
    const code = `PRIDE-${(idx + 1) * 100 + 1}`;
    mutations.push({
      createOrReplace: {
        _id: `training-${c.slug}`,
        _type: 'trainingModule',
        code,
        title: c.title,
        slug: { _type: 'slug', current: c.slug },
        duration: c.duration || '2 to 4 Hours',
        audience: c.targetAudience || 'Educators, Healthcare Teams, Corporate Staff & Youth Advocates',
        format: ['In-Person', 'Virtual', 'Hybrid'],
        description: c.summary || 'Comprehensive LGBTQ+ cultural competency training.',
        learningObjectives: c.learningObjectives || [],
        curriculum: c.materials || [],
        ceus: 'Eligible for CEU documentation',
        feeStructure: c.feeStructure || 'Free for nonprofits; sliding scale for corporate teams.',
        order: idx + 1
      }
    });
  });
  console.log(`✓ Prepared ${(trainingCourses || []).length} Training Modules`);

  // 5. Board Members (Steve first, circular portraits uploaded to Sanity CDN!)
  for (let idx = 0; idx < (boardMembers || []).length; idx++) {
    const b = boardMembers[idx];
    const photoRef = await uploadImageAsset(b.photo || b.image || '/images/volunteers.jpg', `board-${idx + 1}-${b.name}`);
    mutations.push({
      createOrReplace: {
        _id: `board-${idx + 1}`,
        _type: 'boardMember',
        name: b.name,
        role: b.role,
        bio:
          b.bio ||
          `${b.name} proudly serves on the Diversity Collective Board of Directors, advancing LGBTQ+ advocacy and sanctuary across Ventura County.`,
        ...(photoRef ? { photo: photoRef } : {}),
        order: idx + 1
      }
    });
  }
  // Remove any removed stale board docs (e.g. Roland if an older board-6 doc exists)
  const existingBoardIds = (await querySanity('*[_type == "boardMember"]._id')) || [];
  const validBoardIds = new Set(boardMembers.map((_, idx) => `board-${idx + 1}`));
  existingBoardIds.forEach((oldId) => {
    if (!validBoardIds.has(oldId)) {
      mutations.push({ delete: { id: oldId } });
    }
  });
  console.log(`✓ Prepared ${(boardMembers || []).length} Board of Directors with uploaded portraits`);

  // 6. Staff Members
  for (let idx = 0; idx < (staffMembers || []).length; idx++) {
    const s = staffMembers[idx];
    const photoRef = await uploadImageAsset(s.photo || s.image || '/images/volunteers.jpg', `staff-${idx + 1}-${s.name}`);
    mutations.push({
      createOrReplace: {
        _id: `staff-${idx + 1}`,
        _type: 'staffMember',
        name: s.name,
        title: s.role || s.title,
        department: s.department || 'Operations & Leadership',
        bio: s.bio || `${s.name} coordinates affirming programs and community support for Diversity Collective.`,
        email: s.email || orgInfo.email,
        ...(photoRef ? { photo: photoRef } : {}),
        order: idx + 1
      }
    });
  }
  console.log(`✓ Prepared ${(staffMembers || []).length} Staff Members with uploaded photos`);

  // 7. Sponsors & Partners
  for (let idx = 0; idx < (sponsorsList || []).length; idx++) {
    const sp = sponsorsList[idx];
    const logoRef = await uploadImageAsset(sp.logo || '/images/logo-square.png', `sponsor-${sp.shortName || idx + 1}`);
    mutations.push({
      createOrReplace: {
        _id: `sponsor-${idx + 1}`,
        _type: 'sponsor',
        name: sp.name,
        shortName: sp.shortName || sp.name,
        tier: sp.tier || 'Community Ally',
        role: sp.role || 'Founding Community Ally & Healthcare Partner',
        url: sp.url ? (sp.url.startsWith('http') ? sp.url : `https://${sp.url}`) : 'https://diversitycollective.pages.dev',
        ...(logoRef ? { logo: logoRef } : {}),
        order: idx + 1
      }
    });
  }
  console.log(`✓ Prepared ${(sponsorsList || []).length} Sponsors with uploaded logos`);

  // 8. Community Resources
  let resIdx = 0;
  (resourcesDirectory || []).forEach((group) => {
    let cat = 'Support';
    if (group.category.includes('Crisis')) cat = 'Crisis';
    else if (group.category.includes('Health')) cat = 'Healthcare';
    else if (group.category.includes('Legal')) cat = 'Legal';
    else if (group.category.includes('Youth')) cat = 'Youth';
    else if (group.category.includes('Housing')) cat = 'Housing';
    else if (group.category.includes('Senior')) cat = 'Seniors';

    (group.items || []).forEach((item) => {
      resIdx++;
      mutations.push({
        createOrReplace: {
          _id: `resource-${resIdx}`,
          _type: 'resource',
          title: item.name,
          category: cat,
          description: item.notes || 'Verified affirming service provider in Ventura County.',
          phone: item.phone || '',
          website: item.url
            ? item.url.startsWith('http')
              ? item.url
              : `https://diversitycollective.pages.dev${item.url}`
            : '',
          address: 'Ventura County, CA',
          city: 'Ventura',
          spanishAvailable: true,
          isFreeOrSlidingScale: true
        }
      });
    });
  });
  console.log(`✓ Prepared ${resIdx} Community Resources`);

  // 9. News Articles (full body text + real dates + cover images!)
  for (let idx = 0; idx < (newsArticles || []).length; idx++) {
    const n = newsArticles[idx];
    const coverRef = await uploadImageAsset(n.image || '/images/community-gathering.jpg', `news-${n.slug}`);
    const rawDate = n.publishedAt || n.date;
    let isoDate = new Date().toISOString();
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!Number.isNaN(parsed.getTime())) isoDate = parsed.toISOString();
    }
    const bodyText = Array.isArray(n.body) ? n.body.join('\n\n') : n.body || n.content || '';
    mutations.push({
      createOrReplace: {
        _id: `news-${n.slug}`,
        _type: 'newsArticle',
        title: n.title,
        slug: { _type: 'slug', current: n.slug },
        publishedAt: isoDate,
        ...(coverRef ? { coverImage: coverRef } : {}),
        excerpt: n.excerpt || 'Community dispatch from Diversity Collective Ventura County.',
        author: n.author || 'DCVC Communications Team',
        readingTime: n.readingTime || '4 min read',
        body: bodyText
      }
    });
  }
  console.log(`✓ Prepared ${(newsArticles || []).length} News Articles with Sanity CDN cover images`);

  // 10. Gallery Items (uploaded to Sanity Asset CDN!)
  for (let idx = 0; idx < (galleryPhotos || []).length; idx++) {
    const g = galleryPhotos[idx];
    const imgRef = await uploadImageAsset(g.image || '/images/community-gathering.jpg', `gallery-${idx + 1}-${g.title}`);
    mutations.push({
      createOrReplace: {
        _id: `gallery-${g.id || idx + 1}`,
        _type: 'galleryItem',
        title: g.title,
        ...(imgRef ? { image: imgRef } : {}),
        imageUrl: `https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public${g.image}`,
        alt: g.description || g.title,
        caption: g.quote || g.description || 'Ventura County LGBTQ+ community moment.',
        eventTag: g.category?.includes('Pride')
          ? 'Pride'
          : g.category?.includes('Youth')
          ? 'Rainbow Umbrella'
          : g.category?.includes('Health')
          ? 'SHINES'
          : g.category?.includes('Volunteer')
          ? 'Volunteers'
          : 'CRC',
        year: g.year || '2026',
        order: idx + 1
      }
    });
  }
  console.log(`✓ Prepared ${(galleryPhotos || []).length} Gallery Photographs with Sanity CDN assets`);

  console.log(`\nTransmitting ${mutations.length} mutations to Sanity API...`);
  const BATCH_SIZE = 30;
  for (let i = 0; i < mutations.length; i += BATCH_SIZE) {
    const batch = mutations.slice(i, i + BATCH_SIZE);
    const result = await mutate(batch);
    console.log(
      `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(mutations.length / BATCH_SIZE)} (${batch.length} mutations) -> Tx: ${result.transactionId || 'OK'}`
    );
  }

  console.log(`\nDONE! All Sanity documents and CDN image assets are populated in ${PROJECT_ID}/${DATASET}.`);
}

runSeed().catch((err) => {
  console.error('\nSanity Seeding Error:', err.message);
  process.exit(1);
});
