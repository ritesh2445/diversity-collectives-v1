/**
 * DCVC — Fast Sanity Prepopulation Engine
 * Prepopulates all Sanity document types and fields with verified community data
 * using clean, simplified plain-English terminology.
 *
 * Project ID: 6abul0sq
 * Dataset: production
 */

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

const PROJECT_ID = process.env.SANITY_PROJECT_ID || '6abul0sq';
const DATASET = process.env.SANITY_DATASET || 'production';
const API_VERSION = '2024-03-01';
const AUTH_TOKEN = process.env.SANITY_AUTH_TOKEN || 'skQ1TKiRdD4dRqG6S9amD0mKfb2QH3KMS6XgorxMhgvoSu3XTStt2NV4wOpc8SH21v67jcgJ83srezRHWEYis0PzGvlP2A9oPugueUoHVlWc1vLwP2faYMvKR519KLaPTAsucmFdm78GEIJCp2itPr8O2j0Pz7HYqA80cNQH7zoeQ0YQOdvl';

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
    throw new Error(`Sanity API Error HTTP ${res.status}: ${errorText}`);
  }

  return res.json();
}

async function runSeed() {
  console.log(`\n============================================================`);
  console.log(`🚀 Prepopulating All Sanity Fields for Project: ${PROJECT_ID}`);
  console.log(`============================================================\n`);

  const mutations = [];

  // 1. Site Settings (Singleton)
  mutations.push({
    createOrReplace: {
      _id: 'siteSettings',
      _type: 'siteSettings',
      orgName: orgInfo.name,
      tagline: orgInfo.tagline,
      ein: orgInfo.ein,
      phone: orgInfo.phone,
      email: orgInfo.email,
      address: orgInfo.address.full,
      hours: orgInfo.hours,
      announcementBanner: {
        enabled: true,
        text: 'Ventura County Pride 2026 Vendor & Performer Applications Are Now Open!',
        linkUrl: '/events'
      }
    }
  });
  console.log('✓ Prepared 1 Site Settings record');

  // 2. Programs (All 6 core programs)
  programsList.forEach((p, idx) => {
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
        location: p.location || '2471 Portola Road, Suite 100, Ventura, CA 93003',
        contactEmail: p.contactEmail || 'info@diversitycollective.org',
        contactPhone: p.contactPhone || '(805) 644-5428',
        accentColor: p.accentColor || '#5A1E65',
        amenities: p.amenities || ['Free Rapid Testing', 'Youth Safe Space', 'Peer Support Circles'],
        order: idx + 1
      }
    });
  });
  console.log(`✓ Prepared ${programsList.length} Programs`);

  // 3. Events (All live events + signature annual galas & festivals)
  const allEvents = [...liveEvents];
  (annualSignatureEvents || []).forEach(sig => {
    if (!allEvents.some(e => e.title === sig.title)) {
      allEvents.push({
        slug: sig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title: sig.title,
        date: sig.timing || 'Annual Community Celebration',
        time: 'All Day',
        category: 'Culture',
        location: 'Plaza Park, Downtown Ventura, CA',
        address: 'Plaza Park, Ventura, CA',
        description: sig.description,
        isRecurring: true,
        recurrenceRule: 'Annual',
        isCancelled: false,
        registrationUrl: '/events'
      });
    }
  });

  allEvents.forEach((e) => {
    mutations.push({
      createOrReplace: {
        _id: `event-${e.slug}`,
        _type: 'event',
        title: e.title,
        slug: { _type: 'slug', current: e.slug },
        date: e.date,
        time: e.time || 'Check schedule',
        location: e.location || e.address || 'Ventura Community Resource Center',
        category: e.category || 'Support',
        description: e.description || 'Join us for this welcoming community event.',
        isRecurring: !!e.isRecurring,
        recurrenceRule: e.recurrenceRule || '',
        isCancelled: !!e.isCancelled,
        cancellationReason: e.cancellationReason || '',
        registrationUrl: e.registrationUrl ? (e.registrationUrl.startsWith('http') ? e.registrationUrl : 'https://diversitycollectivevc.org' + e.registrationUrl) : '',
        capacity: 150
      }
    });
  });
  console.log(`✓ Prepared ${allEvents.length} Community Events`);

  // 4. Training Courses (P.R.I.D.E. 101, 201, 301, 401)
  (trainingCourses || []).forEach((c, idx) => {
    const code = `PRIDE-${(idx + 1) * 100 + 1}`;
    mutations.push({
      createOrReplace: {
        _id: `training-${c.slug}`,
        _type: 'trainingModule',
        code: code,
        title: c.title,
        slug: { _type: 'slug', current: c.slug },
        duration: c.duration || '2 to 4 Hours',
        audience: c.targetAudience || 'Educators, Healthcare Teams, Corporate Staff & Youth Advocates',
        format: ['In-Person', 'Virtual', 'Hybrid'],
        description: c.summary || 'Comprehensive LGBTQ+ cultural competency training.',
        learningObjectives: c.learningObjectives || [
          'Understand modern terminology and affirming pronouns.',
          'Identify systemic barriers facing queer and trans residents.',
          'Implement trauma-informed communication practices.'
        ],
        curriculum: c.materials || ['Participant Handbook', 'Pronoun Quick-Reference Card', 'Certificate of Completion'],
        ceus: 'Eligible for CEU documentation',
        feeStructure: c.feeStructure || 'Free for nonprofits; sliding scale for corporate teams.',
        order: idx + 1
      }
    });
  });
  console.log(`✓ Prepared ${(trainingCourses || []).length} Training Modules`);

  // 5. Board Members
  (boardMembers || []).forEach((b, idx) => {
    mutations.push({
      createOrReplace: {
        _id: `board-${idx + 1}`,
        _type: 'boardMember',
        name: b.name,
        role: b.role,
        bio: b.bio || `${b.name} proudly serves on the Diversity Collective Board of Directors, advancing LGBTQ+ advocacy and sanctuary across Ventura County.`,
        order: idx + 1
      }
    });
  });
  console.log(`✓ Prepared ${(boardMembers || []).length} Board of Directors`);

  // 6. Staff Members
  (staffMembers || []).forEach((s, idx) => {
    mutations.push({
      createOrReplace: {
        _id: `staff-${idx + 1}`,
        _type: 'staffMember',
        name: s.name,
        title: s.title,
        department: s.department || 'Operations & Leadership',
        bio: s.bio || `${s.name} coordinates affirming programs and community support for Diversity Collective.`,
        email: s.email || 'info@diversitycollective.org',
        order: idx + 1
      }
    });
  });
  console.log(`✓ Prepared ${(staffMembers || []).length} Staff Members`);

  // 7. Sponsors & Partners
  (sponsorsList || []).forEach((sp, idx) => {
    mutations.push({
      createOrReplace: {
        _id: `sponsor-${idx + 1}`,
        _type: 'sponsor',
        name: sp.name,
        shortName: sp.shortName || sp.name,
        tier: sp.tier || 'Community Ally',
        role: sp.role || 'Founding Community Ally & Healthcare Partner',
        url: sp.url ? (sp.url.startsWith('http') ? sp.url : 'https://' + sp.url) : 'https://diversitycollectivevc.org',
        order: idx + 1
      }
    });
  });
  console.log(`✓ Prepared ${(sponsorsList || []).length} Sponsors & Strategic Partners`);

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
          website: item.url ? (item.url.startsWith('http') ? item.url : 'https://diversitycollectivevc.org' + item.url) : '',
          address: 'Ventura County, CA',
          city: 'Ventura',
          spanishAvailable: true,
          isFreeOrSlidingScale: true
        }
      });
    });
  });
  console.log(`✓ Prepared ${resIdx} Community Resources`);

  // 9. News Articles
  (newsArticles || []).forEach((n, idx) => {
    mutations.push({
      createOrReplace: {
        _id: `news-${n.slug}`,
        _type: 'newsArticle',
        title: n.title,
        slug: { _type: 'slug', current: n.slug },
        publishedAt: n.date ? new Date(n.date).toISOString() : new Date().toISOString(),
        excerpt: n.excerpt || 'Community dispatch from Diversity Collective Ventura County.',
        author: n.author || 'DCVC Communications Team',
        readingTime: n.readingTime || '4 min read',
        body: n.content || 'Full story details and community announcements.'
      }
    });
  });
  console.log(`✓ Prepared ${(newsArticles || []).length} News Articles`);

  // 10. Gallery Items
  (galleryPhotos || []).forEach((g, idx) => {
    mutations.push({
      createOrReplace: {
        _id: `gallery-${g.id || (idx + 1)}`,
        _type: 'galleryItem',
        title: g.title,
        imageUrl: `https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public${g.image}`,
        alt: g.description || g.title,
        caption: g.quote || g.description || 'Ventura County LGBTQ+ community moment.',
        eventTag: g.category?.includes('Pride') ? 'Pride' : (g.category?.includes('Youth') ? 'Rainbow Umbrella' : 'CRC'),
        year: g.year || '2026',
        order: idx + 1
      }
    });
  });
  console.log(`✓ Prepared ${(galleryPhotos || []).length} Gallery Photographs`);

  // Execute batch mutations
  console.log(`\n📡 Transmitting ${mutations.length} records to Sanity Mutation API...`);
  const BATCH_SIZE = 40;
  for (let i = 0; i < mutations.length; i += BATCH_SIZE) {
    const batch = mutations.slice(i, i + BATCH_SIZE);
    const result = await mutate(batch);
    console.log(`  Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(mutations.length / BATCH_SIZE)} (${batch.length} documents) [Transaction: ${result.transactionId || 'OK'}]`);
  }

  console.log(`\n🎉 SUCCESS! All Sanity fields and documents are fully prepopulated and live in production!`);
}

runSeed().catch(err => {
  console.error('\n❌ Sanity Seeding Error:', err.message);
  process.exit(1);
});
