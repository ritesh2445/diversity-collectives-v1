/**
 * Unified Smart Sitewide Search, Fuzzy Spell-Correction & Live CMS Retrieval Engine
 *
 * Indexes LIVE content from cmsStore (Sanity Edge APICDN + fallback datasets) alongside
 * static routes, Community Circle announcements/blogs, Board & Staff profiles,
 * Training workshops, Events, Programs, Resources, News, and Sponsors.
 *
 * Powers BOTH the Navbar Smart Search Modal AND Luna AI conversational grounding.
 */

import { cmsStore } from '../services/cmsStore.js';
import {
  orgInfo,
  programsList,
  liveEvents,
  resourcesDirectory,
  boardMembers,
  staffMembers,
  sponsorsList,
  trainingCourses,
  newsArticles,
  communityGroups,
  getBoardMemberSlug
} from '../data/dcvcData.js';
import { communityDetailsData } from '../data/communityData.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'does', 'for',
  'from', 'get', 'got', 'has', 'have', 'how', 'i', 'in', 'is', 'it', 'me', 'my',
  'of', 'on', 'or', 'our', 'tell', 'that', 'the', 'their', 'there', 'they', 'this',
  'to', 'us', 'want', 'we', 'what', 'when', 'where', 'which', 'who', 'why', 'with', 'you', 'your'
]);

/**
 * Common colloquial synonyms & frequent domain abbreviations / phonetic variants
 */
const SYNONYM_GROUPS = [
  ['hiv', 'sti', 'std', 'shines', 'testing', 'screening', 'prep', 'pep', 'clinic', 'health', 'wellness'],
  ['youth', 'teen', 'teens', 'student', 'students', '13', '23', 'umbrella', 'rainbow'],
  ['kid', 'kids', 'child', 'children', 'unicorn', 'unicorns', 'parent', 'caregiver'],
  ['trans', 'transgender', 'nonbinary', 'gender', 'binder', 'clothing', 'closet'],
  ['donate', 'donation', 'donations', 'give', 'giving', 'zeffy', 'fund', 'fundraiser', 'charity', 'tax'],
  ['appreciation', 'card', 'keepsake', 'thank', 'tier', 'benefactor', 'champion'],
  ['volunteer', 'volunteering', 'mentor', 'advisor', 'intern', 'involvement'],
  ['event', 'events', 'pride', 'gala', 'prom', 'festival', 'calendar', 'rsvp', 'ticket'],
  ['training', 'workshop', 'workshops', 'education', 'cultural', 'competency', 'corporate', 'ceus'],
  ['board', 'member', 'director', 'trustee', 'leader', 'leadership', 'executive', 'staff', 'team'],
  ['resource', 'resources', 'help', 'crisis', 'hotline', 'lifeline', '988', 'trevor', 'housing', 'food', 'legal', 'therapy', 'counseling', 'therapist'],
  ['directory', 'business', 'doctor', 'physician', 'dentist', 'shop', 'vendor', 'pledge', 'affirming'],
  ['dyslexia', 'dyslexic', 'bionic', 'opendyslexic', 'lexend', 'accessibility', 'a11y', 'audio', 'speech', 'font'],
  ['contact', 'address', 'location', 'portola', 'hours', 'open', 'phone', 'email', 'map', 'directions'],
  ['sponsor', 'sponsors', 'partner', 'partners', 'vcbh', 'vcph', 'grant']
];

const SYNONYM_LOOKUP = new Map();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    SYNONYM_LOOKUP.set(word, group);
  }
}

/**
 * Curated typo dictionary for instant high-confidence autocorrection of common queries
 * (alongside dynamic vocabulary edit-distance matching over the live site index)
 */
const CURATED_TYPOS = {
  traning: 'training',
  trainng: 'training',
  trainig: 'training',
  trainnig: 'training',
  dislexia: 'dyslexia',
  dyslexya: 'dyslexia',
  dyslexic: 'dyslexia',
  donat: 'donate',
  doante: 'donate',
  donaton: 'donation',
  donashun: 'donation',
  evetn: 'event',
  evetns: 'events',
  evnts: 'events',
  helth: 'health',
  heath: 'health',
  testin: 'testing',
  testng: 'testing',
  progam: 'program',
  progarms: 'programs',
  progams: 'programs',
  volunter: 'volunteer',
  volnteer: 'volunteer',
  volenteer: 'volunteer',
  conatct: 'contact',
  contct: 'contact',
  abotu: 'about',
  bout: 'about',
  raibnow: 'rainbow',
  rainbw: 'rainbow',
  umbela: 'umbrella',
  umbrela: 'umbrella',
  unicron: 'unicorn',
  unicorns: 'unicorns',
  prdie: 'pride',
  pirde: 'pride',
  ventrua: 'ventura',
  vetura: 'ventura',
  yooth: 'youth',
  yuth: 'youth',
  therpy: 'therapy',
  counceling: 'counseling',
  counselling: 'counseling',
  bords: 'board',
  borad: 'board',
  rolnd: 'roland',
  catabna: 'catabona',
  alenn: 'allen',
  shnies: 'shines',
  appreciaton: 'appreciation',
  apreciation: 'appreciation',
  apointment: 'appointment',
  appointmnt: 'appointment',
  resorces: 'resources',
  resourcs: 'resources',
  directry: 'directory',
  direcotry: 'directory',
  comunity: 'community',
  communtiy: 'community',
  sponser: 'sponsor',
  sponsers: 'sponsors',
  galla: 'gala',
  zeffey: 'zeffy',
  zeffi: 'zeffy'
};

export function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(str, removeStopWords = false) {
  const normalized = normalizeText(str);
  if (!normalized) return [];
  const raw = normalized.split(' ').filter(Boolean);
  if (!removeStopWords) return raw;
  return raw.filter((t) => !STOP_WORDS.has(t));
}

/**
 * Optimal String Alignment / Damerau-Levenshtein distance with adjacent transposition cost = 1.
 * Includes fast bailout when length diff exceeds maxDist.
 */
export function damerauLevenshtein(a, b, maxDist = 3) {
  if (a === b) return 0;
  const alen = a.length;
  const blen = b.length;
  if (Math.abs(alen - blen) > maxDist) return maxDist + 1;
  if (alen === 0) return blen;
  if (blen === 0) return alen;

  const dp = Array.from({ length: alen + 1 }, () => new Array(blen + 1).fill(0));
  for (let i = 0; i <= alen; i++) dp[i][0] = i;
  for (let j = 0; j <= blen; j++) dp[0][j] = j;

  for (let i = 1; i <= alen; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, dp[i - 2][j - 2] + 1);
      }
      dp[i][j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDist) return maxDist + 1;
  }
  return dp[alen][blen];
}

/**
 * Build searchable items dynamically from the latest live CMS snapshot + site routes.
 */
export function buildLiveSiteIndex(customSnapshot = null) {
  const data = customSnapshot || (cmsStore && cmsStore.getAllData ? cmsStore.getAllData() : {});
  const settings = data.settings || {};
  const livePrograms = data.programs || programsList || [];
  const liveEventsList = data.events || liveEvents || [];
  const liveBoard = (cmsStore && cmsStore.getBoardMembers && !customSnapshot)
    ? cmsStore.getBoardMembers()
    : ((data.staff || []).filter((s) => s.category === 'board').length > 0
      ? data.staff.filter((s) => s.category === 'board')
      : (boardMembers || []));
  const liveStaff = (cmsStore && cmsStore.getStaffMembers && !customSnapshot)
    ? cmsStore.getStaffMembers()
    : ((data.staff || []).filter((s) => s.category === 'staff').length > 0
      ? data.staff.filter((s) => s.category === 'staff')
      : (staffMembers || []));
  const liveTrainings = (cmsStore && cmsStore.getTrainings && !customSnapshot)
    ? cmsStore.getTrainings()
    : (data.trainings || trainingCourses || []);
  const liveNews = data.news || newsArticles || [];
  const liveResources = data.resources || resourcesDirectory || [];
  const liveSponsors = data.sponsors || sponsorsList || [];

  const items = [];

  // 1. Static / Core Hub Pages & Special Features
  const corePages = [
    {
      id: 'page-home',
      type: 'Page',
      title: 'Home · Diversity Collective Ventura County',
      subtitle: settings.tagline || 'You Are Always Welcome Here.',
      snippet: `${settings.name || 'Diversity Collective Ventura County'} — 501(c)(3) nonprofit center in Ventura, CA (${settings.address || '2471 Portola Road, Suite 100'}). Hours: ${settings.hours || 'Mon–Fri 1:00 PM – 5:00 PM'}.`,
      url: '/',
      keywords: ['home', 'center', 'hours', 'address', 'welcome', 'portola', 'mission', 'phone', settings.email || 'info@diversitycollective.org']
    },
    {
      id: 'page-about',
      type: 'Page',
      title: 'About Diversity Collective & Mission',
      subtitle: 'Founded 2014 · Federal EIN 46-5312131',
      snippet: settings.mission || 'Promoting advocacy, visibility, safety, and wellness for the LGBTQ+ community across all 10 Ventura County cities.',
      url: '/about',
      keywords: ['about', 'mission', 'history', 'ein', '501c3', 'nonprofit', 'cities', 'ventura']
    },
    {
      id: 'page-donate',
      type: 'Giving',
      title: 'Donate & Support (100% Zero-Fee via Zeffy)',
      subtitle: 'One-Time & Recurring Monthly Sustainers',
      snippet: 'Give via Zeffy with zero platform fees. Every confirmed donation earns an official personalized DCVC Appreciation Card, and recurring sustainers automatically receive heartfelt email keepsakes.',
      url: '/donate',
      keywords: ['donate', 'donation', 'give', 'zeffy', 'monthly', 'recurring', 'sustainer', 'appreciation card', 'tax deductible']
    },
    {
      id: 'page-appreciation',
      type: 'Feature',
      title: 'Public Appreciation Card Showcase Preview',
      subtitle: 'Interactive Donor Keepsake Experience',
      snippet: 'Preview the 4 official appreciation card tiers (Community Ally, Pride Advocate, Rainbow Champion, Visionary Benefactor). Real named cards unlock automatically after Zeffy payment confirmation.',
      url: '/appreciation-card/preview',
      keywords: ['appreciation card', 'keepsake', 'preview', 'community ally', 'pride advocate', 'rainbow champion', 'visionary benefactor']
    },
    {
      id: 'page-accessibility',
      type: 'Accessibility',
      title: 'Accessibility & Dyslexia Support Tools',
      subtitle: 'OpenDyslexic, Lexend, Bionic Anchor Reading, Focus Audio & Color Overlays',
      snippet: 'Open the Accessibility Companion (Alt + A) for Dyslexia Center Mode, OpenDyslexic & Lexend fonts, Bionic reading anchors, ambient focus audio tracks, screen reader, and Irlen overlays.',
      url: '/accessibility',
      keywords: ['accessibility', 'dyslexia', 'dyslexic', 'opendyslexic', 'lexend', 'bionic', 'focus audio', 'rain', 'screen reader', 'irlen', 'font']
    },
    {
      id: 'page-volunteer',
      type: 'Engagement',
      title: 'Volunteer With Diversity Collective',
      subtitle: 'Center Desk, Events, Youth Mentorship & Outreach',
      snippet: 'Apply to volunteer at our Resource Center, Ventura County Pride, health outreach, or Rainbow Umbrella (ages 21+ with Live Scan clearance).',
      url: '/volunteer',
      keywords: ['volunteer', 'get involved', 'help', 'live scan', 'mentor', 'pride crew']
    },
    {
      id: 'page-directory',
      type: 'Directory',
      title: 'LGBTQ+ Affirming Business & Provider Directory',
      subtitle: 'Pledge-Verified Clinics, Therapists, Shops & Services',
      snippet: 'Find LGBTQ+-affirming doctors, mental health therapists, legal allies, and welcoming local businesses across Ventura County.',
      url: '/directory',
      keywords: ['directory', 'business', 'doctor', 'therapist', 'provider', 'affirming pledge', 'dentist', 'shop']
    },
    {
      id: 'page-appointments',
      type: 'Wellness',
      title: 'Schedule Confidential Health or Intake Appointment',
      subtitle: 'Free Rapid HIV/STI Screening & Wellness Navigation',
      snippet: 'Book a free, confidential visit for Diversity SHINES rapid HIV/STI testing, PrEP/PEP navigation, or care intake.',
      url: '/appointments',
      keywords: ['appointment', 'book', 'schedule', 'intake', 'testing', 'hiv', 'sti', 'prep']
    },
    {
      id: 'page-contact',
      type: 'Contact',
      title: 'Contact DCVC & Community Resource Center',
      subtitle: `${settings.phone || '(805) 644-5428'} · ${settings.email || 'info@diversitycollective.org'}`,
      snippet: `Visit us at ${settings.address || '2471 Portola Road, Suite 100, Ventura, CA 93003'} (${settings.hours || 'Mon–Fri 1:00 PM – 5:00 PM PT'}). Call ${settings.phone || '(805) 644-5428'} or send an inquiry online.`,
      url: '/contact',
      keywords: ['contact', 'phone', 'email', 'address', 'location', 'portola', 'hours', 'call', 'visit']
    },
    {
      id: 'page-community',
      type: 'Community',
      title: 'Community Circles & Peer Support Groups',
      subtitle: 'Youth, Trans Adults, Caregivers, Latine/Queer Circles',
      snippet: 'Explore weekly and monthly peer support circles in Ventura County or submit a proposal to start a new affirming group.',
      url: '/community',
      keywords: ['community', 'circles', 'support group', 'peer', 'meetup', 'join', 'propose']
    }
  ];
  items.push(...corePages);

  // 2. Programs
  for (const p of livePrograms) {
    const slug = p.slug || normalizeText(p.title).replace(/\s+/g, '-');
    items.push({
      id: `prog-${slug}`,
      type: 'Program',
      title: p.title,
      subtitle: p.tagline || p.schedule || 'Free DCVC Program',
      snippet: `${p.summary || ''} ${p.description || ''} Schedule: ${p.schedule || 'See details'}. Location: ${p.location || 'Ventura CRC'}`.trim(),
      url: `/programs/${slug}`,
      keywords: [p.audience, p.schedule, p.location, ...(p.amenities || [])].filter(Boolean),
      meta: { schedule: p.schedule, location: p.location, contactEmail: p.contactEmail, contactPhone: p.contactPhone }
    });
  }

  // 3. Events
  for (const ev of liveEventsList) {
    const slug = ev.slug || normalizeText(ev.title).replace(/\s+/g, '-');
    items.push({
      id: `evt-${slug}`,
      type: 'Event',
      title: ev.title,
      subtitle: [ev.date, ev.time, ev.location].filter(Boolean).join(' · '),
      snippet: `${ev.summary || ev.description || ''} Hosted at ${ev.location || 'Ventura County'}. ${ev.isFree ? 'Free admission.' : (ev.ticketPrice || '')}`.trim(),
      url: `/events/${slug}`,
      keywords: [ev.category, ev.date, ev.location, ev.highlights, 'event', 'rsvp', 'tickets'].flat().filter(Boolean),
      meta: { date: ev.date, time: ev.time, location: ev.location, isFree: ev.isFree }
    });
  }

  // 4. Board Members (Full Editorial Profiles `/board/:slug`)
  for (const bm of liveBoard) {
    const slug = bm.slug || getBoardMemberSlug(bm);
    items.push({
      id: `board-${slug}`,
      type: 'Board Member',
      title: bm.name,
      subtitle: `${bm.role}${bm.committee ? ` · ${bm.committee}` : ''}`,
      snippet: `${bm.bio || ''} ${Array.isArray(bm.extendedBio) ? bm.extendedBio[0] || '' : ''} ${bm.quote ? `"${bm.quote}"` : ''}`.trim(),
      url: `/board/${slug}`,
      keywords: [bm.name, bm.role, bm.committee, bm.city, bm.pronouns, ...(bm.focusAreas || []), 'board', 'leadership', 'director'].filter(Boolean),
      meta: { role: bm.role, committee: bm.committee, quote: bm.quote, focusAreas: bm.focusAreas }
    });
  }

  // 5. Staff Members
  for (const st of liveStaff) {
    items.push({
      id: `staff-${normalizeText(st.name).replace(/\s+/g, '-')}`,
      type: 'Staff',
      title: st.name,
      subtitle: st.role || 'DCVC Operations & Care Staff',
      snippet: st.bio || `${st.name} serves as ${st.role} at Diversity Collective Ventura County.`,
      url: '/board-and-staff',
      keywords: [st.name, st.role, 'staff', 'team', 'leadership'].filter(Boolean)
    });
  }

  // 6. Training Courses
  for (const tr of liveTrainings) {
    const slug = tr.slug || normalizeText(tr.title).replace(/\s+/g, '-');
    items.push({
      id: `train-${slug}`,
      type: 'Training',
      title: tr.title,
      subtitle: [tr.badge, tr.format, tr.duration].filter(Boolean).join(' · '),
      snippet: `${tr.summary || ''} Target audience: ${tr.targetAudience || 'Organizations & educators'}. ${tr.feeStructure || ''}`.trim(),
      url: `/training/${slug}`,
      keywords: [tr.title, tr.targetAudience, tr.feeStructure, ...(tr.learningObjectives || []), 'training', 'workshop', 'pride'].filter(Boolean),
      meta: { format: tr.format, duration: tr.duration, feeStructure: tr.feeStructure }
    });
  }

  // 7. Community Circles & Sub-page Updates
  for (const grp of communityGroups || []) {
    const detail = Object.values(communityDetailsData || {}).find(
      (d) => normalizeText(d.name) === normalizeText(grp.name)
    );
    const announcementText = detail?.announcements?.map((a) => `${a.title}: ${a.content}`).join(' ') || '';
    items.push({
      id: `comm-${normalizeText(grp.name).replace(/\s+/g, '-')}`,
      type: 'Community Circle',
      title: grp.name,
      subtitle: [grp.frequency, grp.ages, grp.location].filter(Boolean).join(' · '),
      snippet: `${grp.description || ''} ${announcementText}`.trim(),
      url: '/community',
      keywords: [grp.category, grp.ages, grp.frequency, grp.location, 'group', 'circle', 'support'].filter(Boolean),
      meta: { frequency: grp.frequency, ages: grp.ages, location: grp.location }
    });
  }

  // 8. Resources & Crisis Lines
  for (const catGroup of liveResources) {
    const catName = catGroup.category || 'Community Resource';
    for (const resItem of catGroup.items || []) {
      items.push({
        id: `res-${normalizeText(resItem.name).replace(/\s+/g, '-')}`,
        type: 'Resource',
        title: resItem.name,
        subtitle: `${catName}${resItem.phone ? ` · ${resItem.phone}` : ''}`,
        snippet: `${resItem.notes || ''} ${resItem.phone ? `Call/Text: ${resItem.phone}` : ''} ${resItem.address || ''}`.trim(),
        url: '/resources',
        keywords: [catName, resItem.name, resItem.phone, resItem.city, resItem.notes, 'resource', 'help', 'line'].filter(Boolean)
      });
    }
  }

  // 9. News Articles
  for (const art of liveNews) {
    const slug = art.slug || normalizeText(art.title).replace(/\s+/g, '-');
    items.push({
      id: `news-${slug}`,
      type: 'News',
      title: art.title,
      subtitle: [art.date, art.author].filter(Boolean).join(' · '),
      snippet: art.excerpt || (typeof art.content === 'string' ? art.content.slice(0, 220) : ''),
      url: `/news/${slug}`,
      keywords: [art.title, art.author, art.excerpt, 'news', 'article', 'story'].filter(Boolean)
    });
  }

  // 10. Sponsors & Partners
  for (const sp of liveSponsors) {
    items.push({
      id: `sponsor-${normalizeText(sp.name).replace(/\s+/g, '-')}`,
      type: 'Partner',
      title: sp.name,
      subtitle: `${sp.tier || 'Partner'}${sp.role ? ` · ${sp.role}` : ''}`,
      snippet: `${sp.name} partners with Diversity Collective Ventura County (${sp.role || sp.tier || 'Community Partner'}).`,
      url: '/sponsors',
      keywords: [sp.name, sp.shortName, sp.tier, sp.role, 'sponsor', 'partner'].filter(Boolean)
    });
  }

  // Precompute searchable blobs & tokens once per build
  for (const item of items) {
    item._titleNorm = normalizeText(item.title);
    item._subNorm = normalizeText(item.subtitle);
    item._kwNorm = normalizeText((item.keywords || []).join(' '));
    item._bodyNorm = normalizeText(item.snippet);
    item._allText = `${item._titleNorm} ${item._subNorm} ${item._kwNorm} ${item._bodyNorm}`;
    item._tokens = new Set(tokenize(item._allText, false));
  }

  return items;
}

/**
 * Extract domain vocabulary sorted by document frequency so spell-correction prioritizes real site concepts
 */
function buildVocabulary(items) {
  const freq = new Map();
  for (const item of items) {
    for (const tok of item._tokens) {
      if (tok.length >= 3 && !/^\d+$/.test(tok)) {
        freq.set(tok, (freq.get(tok) || 0) + 1);
      }
    }
  }
  for (const group of SYNONYM_GROUPS) {
    for (const w of group) {
      if (w.length >= 3) freq.set(w, (freq.get(w) || 0) + 3);
    }
  }
  return freq;
}

/**
 * Correct misspelled tokens using curated typos + live index vocabulary Damerau-Levenshtein matching
 */
export function spellCorrectQuery(rawQuery, vocabFreq) {
  const tokens = tokenize(rawQuery, false);
  const corrections = [];
  const correctedTokens = [];

  for (const tok of tokens) {
    if (tok.length < 3 || /^\d+$/.test(tok) || STOP_WORDS.has(tok)) {
      correctedTokens.push(tok);
      continue;
    }

    if (CURATED_TYPOS[tok]) {
      const fix = CURATED_TYPOS[tok];
      if (fix !== tok) corrections.push({ original: tok, corrected: fix });
      correctedTokens.push(fix);
      continue;
    }

    // If the exact word exists cleanly in the live index, keep it as-is
    if (vocabFreq.has(tok)) {
      correctedTokens.push(tok);
      continue;
    }

    // Check if tok is a strong prefix of an existing word (length >= 4), else find closest edit match
    const maxDist = tok.length <= 4 ? 1 : 2;
    let bestWord = tok;
    let bestScore = Infinity; // lower is better

    for (const [candidate, count] of vocabFreq.entries()) {
      if (Math.abs(candidate.length - tok.length) > maxDist) continue;
      // Same first character gets slight priority unless transposed at char 0-1
      const dist = damerauLevenshtein(tok, candidate, maxDist);
      if (dist <= maxDist) {
        const prefixBonus = candidate.startsWith(tok.slice(0, 2)) ? -0.35 : 0;
        const freqBonus = -Math.min(count, 10) * 0.03;
        const rank = dist + prefixBonus + freqBonus;
        if (rank < bestScore) {
          bestScore = rank;
          bestWord = candidate;
        }
      }
    }

    if (bestWord !== tok) {
      corrections.push({ original: tok, corrected: bestWord });
    }
    correctedTokens.push(bestWord);
  }

  const correctedQuery = correctedTokens.join(' ').trim();
  const rawNorm = tokenize(rawQuery, false).join(' ').trim();

  return {
    correctedQuery: correctedQuery && correctedQuery !== rawNorm ? correctedQuery : null,
    correctedTokens,
    corrections
  };
}

function expandWithSynonyms(tokens) {
  const expanded = new Set(tokens);
  for (const tok of tokens) {
    const group = SYNONYM_LOOKUP.get(tok);
    if (group) {
      for (const g of group) expanded.add(g);
    }
  }
  return Array.from(expanded);
}

/**
 * Score an individual indexed item against primary tokens + expanded synonyms
 */
function scoreItem(item, primaryTokens, expandedTokens, phrase) {
  let score = 0;

  if (phrase.length >= 3) {
    if (item._titleNorm === phrase) score += 160;
    else if (item._titleNorm.includes(phrase)) score += 95;
    else if (item._subNorm.includes(phrase)) score += 60;
    else if (item._allText.includes(phrase)) score += 35;
  }

  let matchedPrimary = 0;
  for (const tok of primaryTokens) {
    if (tok.length < 2) continue;
    let tokenMatched = false;

    if (item._titleNorm.includes(tok)) {
      score += item._tokens.has(tok) ? 45 : 28;
      tokenMatched = true;
    } else if (item._subNorm.includes(tok)) {
      score += 24;
      tokenMatched = true;
    } else if (item._kwNorm.includes(tok)) {
      score += 22;
      tokenMatched = true;
    } else if (item._bodyNorm.includes(tok)) {
      score += 12;
      tokenMatched = true;
    } else if (tok.length >= 4) {
      // Last-resort fuzzy token check inside item vocabulary
      for (const itemTok of item._tokens) {
        if (itemTok.length >= 4 && damerauLevenshtein(tok, itemTok, 1) <= 1) {
          score += 14;
          tokenMatched = true;
          break;
        }
      }
    }

    if (tokenMatched) matchedPrimary++;
  }

  // Reward covering all meaningful tokens of multi-word query
  if (primaryTokens.length > 1 && matchedPrimary === primaryTokens.length) {
    score += 35;
  }

  // Gentle boost from domain synonyms
  for (const syn of expandedTokens) {
    if (primaryTokens.includes(syn)) continue;
    if (item._titleNorm.includes(syn)) score += 10;
    else if (item._kwNorm.includes(syn)) score += 7;
    else if (item._bodyNorm.includes(syn)) score += 4;
  }

  return score;
}

/**
 * Execute Smart Sitewide Search + Generate Spell-Corrected Suggestions
 */
export function searchSiteWithSuggestions(rawQuery = '', options = {}) {
  const { limit = 10, category = 'All', customSnapshot = null } = options;
  const items = buildLiveSiteIndex(customSnapshot);
  const cleaned = String(rawQuery || '').trim();

  if (!cleaned) {
    const featuredIds = [
      'prog-diversity-shines',
      'prog-rainbow-umbrella',
      'page-donate',
      'page-accessibility',
      'page-directory',
      'page-contact',
      'page-volunteer'
    ];
    const defaults = items
      .filter((i) => featuredIds.includes(i.id) || i.type === 'Event')
      .filter((i) => category === 'All' || i.type === category)
      .slice(0, limit);

    return {
      query: '',
      correctedQuery: null,
      corrections: [],
      suggestions: ['Free HIV/STI Testing', 'Youth Groups', 'Upcoming Events', 'Dyslexia Support', 'Board Members', 'Donate'],
      results: defaults,
      isEmptyQuery: true
    };
  }

  const vocabFreq = buildVocabulary(items);
  const { correctedQuery, correctedTokens, corrections } = spellCorrectQuery(cleaned, vocabFreq);

  const meaningfulRaw = tokenize(cleaned, true);
  const meaningfulCorrected = correctedTokens.filter((t) => !STOP_WORDS.has(t));
  const activeTokens = meaningfulCorrected.length > 0 ? meaningfulCorrected : correctedTokens;
  const searchPhrase = correctedQuery || normalizeText(cleaned);
  const expanded = expandWithSynonyms(activeTokens);

  // Score every candidate item
  const scored = items
    .filter((i) => category === 'All' || i.type === category)
    .map((item) => {
      const s = scoreItem(item, activeTokens.length ? activeTokens : meaningfulRaw, expanded, searchPhrase);
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        snippet: item.snippet,
        url: item.url,
        meta: item.meta || {},
        score: s
      };
    })
    .filter((r) => r.score > 14)
    .sort((a, b) => b.score - a.score);

  // Build smart clickable suggestions (spell correction + top related page/entity titles)
  const suggestions = [];
  if (correctedQuery) {
    suggestions.push(correctedQuery);
  }
  for (const hit of scored.slice(0, 3)) {
    const shortTitle = hit.title.split('·')[0].trim();
    if (
      shortTitle.length <= 42 &&
      shortTitle.toLowerCase() !== cleaned.toLowerCase() &&
      !suggestions.some((s) => s.toLowerCase() === shortTitle.toLowerCase())
    ) {
      suggestions.push(shortTitle);
    }
  }

  return {
    query: cleaned,
    correctedQuery,
    corrections,
    suggestions: suggestions.slice(0, 4),
    results: scored.slice(0, limit),
    isEmptyQuery: false
  };
}

