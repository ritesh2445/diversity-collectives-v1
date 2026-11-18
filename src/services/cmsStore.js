
export function mergeProgramsWithDefaults(savedPrograms = [], defaultPrograms = programsList, deletedSlugs = []) {
  const seed = Array.isArray(defaultPrograms) && defaultPrograms.length > 0 ? defaultPrograms : programsList;
  const deletedSet = new Set(Array.isArray(deletedSlugs) ? deletedSlugs : []);
  
  if (!Array.isArray(savedPrograms) || savedPrograms.length === 0) {
    return seed.filter(p => !deletedSet.has(p.slug) && !deletedSet.has(p.id));
  }

  const result = [];
  const seenKeys = new Set();

  // 1. First, preserve all saved programs (including new additions and edits) in their exact saved order
  for (const prog of savedPrograms) {
    if (!prog || typeof prog !== 'object') continue;
    const titleSlug = prog.title ? String(prog.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
    const rawKey = prog.slug || prog.id || titleSlug;
    const key = rawKey ? String(rawKey).trim() : '';
    if (key && !deletedSet.has(key) && !deletedSet.has(prog.slug) && !deletedSet.has(prog.id) && !seenKeys.has(key)) {
      seenKeys.add(key);
      const seedMatch = seed.find(s => (s.slug && s.slug === key) || (s.id && s.id === key) || (s.slug && prog.slug && s.slug === prog.slug));
      result.push({
        ...(seedMatch || {}),
        ...prog,
        slug: prog.slug || (seedMatch && seedMatch.slug) || key,
        id: prog.id || (seedMatch && seedMatch.id) || `prog-${key}`
      });
    }
  }

  // 2. Append any missing seed programs that have not been explicitly deleted
  for (const prog of seed) {
    const key = prog.slug || prog.id;
    if (key && !deletedSet.has(key) && !deletedSet.has(prog.slug) && !deletedSet.has(prog.id) && !seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({
        ...prog,
        slug: prog.slug || key,
        id: prog.id || `prog-${key}`
      });
    }
  }

  return result;
}

export function mergeStaffWithDefaults(savedStaff = [], defaultStaff = null, deletedIds = []) {
  const seed = Array.isArray(defaultStaff) && defaultStaff.length > 0 ? defaultStaff : [
    ...(staffMembers || []).map((s, idx) => ({
      id: s.id || `staff-${(s.slug || s.name || idx).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      slug: s.slug || (s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: 'staff',
      title: s.title || s.role || 'Staff Member',
      role: s.role || s.title || 'Staff Member',
      photo: s.photo || s.image || '/images/volunteers.jpg',
      ...s
    })),
    ...(boardMembers || []).map((b, idx) => ({
      id: b.id || `board-${(b.slug || b.name || idx).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      slug: b.slug || (b.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: 'board',
      title: b.title || b.role || 'Board Member',
      role: b.role || b.title || 'Board Member',
      photo: b.photo || b.image || '/images/volunteers.jpg',
      ...b
    }))
  ];

  const deletedSet = new Set(Array.isArray(deletedIds) ? deletedIds : []);

  if (!Array.isArray(savedStaff) || savedStaff.length === 0) {
    return seed.filter(s => !deletedSet.has(s.id) && !deletedSet.has(s.name) && !deletedSet.has(s.slug));
  }

  const result = [];
  const seenKeys = new Set();

  // 1. Preserve all saved staff/board in their exact order
  for (const member of savedStaff) {
    if (!member || typeof member !== 'object') continue;
    const memName = (member.name || '').trim();
    const rawKey = member.id || member.slug || (memName ? `${member.category || 'staff'}-${memName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '');
    const key = rawKey ? String(rawKey).trim() : '';

    if (key && !deletedSet.has(key) && !deletedSet.has(member.id) && !deletedSet.has(memName) && !seenKeys.has(key)) {
      seenKeys.add(key);
      const seedMatch = seed.find(s => (s.id && s.id === key) || (s.slug && member.slug && s.slug === member.slug) || (s.name && memName && s.name.toLowerCase().trim() === memName.toLowerCase()));
      result.push({
        ...(seedMatch || {}),
        ...member,
        id: member.id || (seedMatch && seedMatch.id) || key,
        title: member.title || member.role || (seedMatch && (seedMatch.title || seedMatch.role)) || 'Team Member',
        photo: member.photo || member.image || (seedMatch && (seedMatch.photo || seedMatch.image)) || '/images/volunteers.jpg'
      });
    }
  }

  // 2. Append any missing seed members not explicitly deleted
  for (const member of seed) {
    const memName = (member.name || '').trim();
    const key = member.id || member.slug || (memName ? `${member.category || 'staff'}-${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '');
    if (key && !deletedSet.has(key) && !deletedSet.has(member.id) && !deletedSet.has(memName) && !seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({ ...member });
    }
  }

  return result;
}

/**
 * DCVC Centralized Content Management System (CMS) Reactive Store
 * Provides complete reactive CRUD operations, local persistence, multi-tab sync,
 * and seamless fallback to authentic seed data from dcvcData.js.
 */

import {
  orgInfo,
  programsList,
  liveEvents,
  resourcesDirectory,
  boardMembers,
  staffMembers,
  sponsorsList,
  trainingCourses,
  communityGroups,
  newsArticles,
  galleryPhotos,
  memoryLaneMilestones,
  businessDirectorySeed,
  podcastsSeed,
  getBoardMemberSlug
} from '../data/dcvcData.js';
import {
  fetchAllSanityWebsiteData,
  optimizeSanityImageUrl,
  preloadImageUrls
} from '../lib/sanity.js';
import { setActiveHeroTheme } from './heroThemeStore.js';
import {
  DEFAULT_PAGE_BLOCKS,
  normalizePageLayoutBlocks,
  replaceSanctuaryWithCenter
} from '../data/siteDefaults.js';
import { normalizeCmsEvent, normalizeCmsEventList } from '../utils/eventDates.js';
import { SYNC_EVENTS, hasPublishedSiteState, broadcastPatch, fetchAndApplyLiveSiteState } from './liveSync.js';

const CMS_STORAGE_KEY = 'dcvc_live_cms_data';
const HERO_THEME_STORAGE_KEY = 'dcvc_active_hero_theme';
const LAYOUT_STORAGE_KEY = 'dcvc_admin_custom_layout';
const THEME_STORAGE_KEY = 'dcvc_site_theme_settings';

function mapSanityCategoryLabel(rawCat) {
  switch ((rawCat || '').toLowerCase()) {
    case 'crisis':
      return 'Crisis & Immediate Helplines';
    case 'healthcare':
      return 'Health & Sexual Wellness';
    case 'youth':
      return 'Youth & Family Support';
    case 'housing':
      return 'Housing & Food Assistance';
    case 'legal':
      return 'Legal & Advocacy';
    case 'seniors':
      return 'Senior & Community Resources';
    default:
      return rawCat || 'Community Resources';
  }
}

function groupSanityResources(resources = []) {
  const groups = new Map();
  resources.forEach((r) => {
    const label = mapSanityCategoryLabel(r.category);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push({
      id: r._id,
      name: r.title,
      phone: r.phone || null,
      url: r.website || '',
      notes: r.description || '',
      address: r.address || '',
      city: r.city || '',
      spanishAvailable: !!r.spanishAvailable,
      isFreeOrSlidingScale: r.isFreeOrSlidingScale !== false
    });
  });
  return Array.from(groups.entries()).map(([category, items]) => ({ category, items }));
}

export const INITIAL_CMS_DATA = {
  version: '3.1',
  lastUpdated: new Date().toISOString(),
  settings: {
    name: orgInfo.name || "Diversity Collective Ventura County",
    tagline: orgInfo.tagline || "You Are Always Welcome Here.",
    mission: orgInfo.mission || "Providing advocacy, visibility, safety, and wellness for the LGBTQ+ community.",
    ein: orgInfo.ein || "46-5312131",
    caCorpNumber: orgInfo.caCorpNumber || "C3666108",
    phone: orgInfo.phone || "(805) 644-LGBT (5428)",
    phoneRaw: orgInfo.phoneRaw || "+18056445428",
    voicemailOnly: Boolean(orgInfo.voicemailOnly || false),
    email: orgInfo.email || "info@diversitycollective.org",
    address: orgInfo.address?.full || "2471 Portola Road, Suite 100, Ventura, CA 93003",
    googleMapsUrl: orgInfo.address?.googleMapsUrl || "",
    hours: orgInfo.hours || "1:00 PM – 5:00 PM Weekdays (Drop-ins & Supplies; HIV/STI Screenings 1st Mon 3–7 PM)",
    emergencyCrisisNotice: "24/7 LGBTQ+ Suicide & Crisis Lifeline: Dial 988 or text 'START' to 678-678 (Trevor Project).",
    bannerAlertActive: true,
    bannerAlertText: "Center Open Today · Mon–Fri 1:00 PM – 5:00 PM · HIV/STI Screenings 1st Mon 3–7 PM",
    bannerAlertLink: "/events",
    donationUrl: orgInfo.donationUrl || "/donate",
    volunteerUrl: orgInfo.volunteerUrl || "/volunteer",
    facebook: orgInfo.socials?.facebook || "https://www.facebook.com/diversitycollectivevc",
    instagram: orgInfo.socials?.instagram || "https://www.instagram.com/diversitycollectivevc",
    youtube: orgInfo.socials?.youtube || "https://www.youtube.com/@diversitycollectivevc"
  },
  programs: programsList || [],
  events: normalizeCmsEventList(liveEvents || []),
  news: (newsArticles || []).map((n, i) => ({
    id: n.id || n.slug || `news-${i}`,
    ...n,
    body: n.body || n.content || '',
    content: n.content || (Array.isArray(n.body) ? n.body.join('\n\n') : (n.body || n.excerpt || ''))
  })),
  resources: resourcesDirectory || [],
  sponsors: sponsorsList || [],
  trainings: trainingCourses || [],
  communityGroups: communityGroups || [],
  staff: [
    ...(staffMembers || []).map((s, idx) => ({
      id: s.id || `staff-${(s.slug || s.name || idx).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      slug: s.slug || (s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: 'staff',
      title: s.title || s.role || 'Staff Member',
      role: s.role || s.title || 'Staff Member',
      photo: s.photo || s.image || '/images/volunteers.jpg',
      ...s
    })),
    ...(boardMembers || []).map((b, idx) => ({
      id: b.id || `board-${(b.slug || b.name || idx).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      slug: b.slug || (b.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: 'board',
      title: b.title || b.role || 'Board Member',
      role: b.role || b.title || 'Board Member',
      photo: b.photo || b.image || '/images/volunteers.jpg',
      ...b
    }))
  ],
  businesses: businessDirectorySeed || [],
  customKnowledge: [],
  gallery: galleryPhotos || [],
  memoryLane: memoryLaneMilestones || [],
  podcasts: podcastsSeed || [],
  mediaSuggestions: []
};

class CmsStoreEngine {
  constructor() {
    this.listeners = new Set();
    this.data = this.loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === CMS_STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.data = {
              ...INITIAL_CMS_DATA,
              ...parsed,
              events: normalizeCmsEventList(parsed.events || INITIAL_CMS_DATA.events)
            };
            this.notify();
          } catch (err) {
            console.error('[CMS Store] Cross-tab parse error:', err);
          }
        }
      });

      window.addEventListener(SYNC_EVENTS.CMS_CHANGED, (e) => {
        if (e.detail && e.detail._fromCmsStore) return;
        this.data = this.loadData();
        this.notify();
      });

      // 1. Fetch live published site state from Cloudflare Worker backend on startup
      fetchAndApplyLiveSiteState().catch(() => {});

      // 2. Poll server state on tab focus / visibility
      window.addEventListener('focus', () => {
        fetchAndApplyLiveSiteState().catch(() => {});
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          fetchAndApplyLiveSiteState().catch(() => {});
        }
      });

      // 3. Hydrate from Sanity Edge APICDN only when Admin has NOT published custom live state
      setTimeout(() => {
        if (!hasPublishedSiteState()) {
          this.syncFromSanity().catch(() => {});
        }
      }, 350);
    }
  }

  /**
   * Hydrate live website content, hero, theme, section order, and Sanity CDN images
   * directly from Sanity's Edge APICDN (`apicdn.sanity.io`).
   */
  async syncFromSanity(force = false) {
    if (typeof window === 'undefined') return null;
    if (!force && hasPublishedSiteState()) return this.data;
    if (this._syncPromise && !force) return this._syncPromise;

    this._syncPromise = (async () => {
      const sanityData = await fetchAllSanityWebsiteData();
      if (!sanityData) return null;

      const preloadUrls = [];
      const fallbackMap = (arr = [], key = 'slug') =>
        new Map(arr.map((item) => [item[key] || item.name || item.title, item]));

      const progFallbacks = fallbackMap(programsList, 'slug');
      const evtFallbacks = fallbackMap(liveEvents, 'slug');
      const boardFallbacks = fallbackMap(boardMembers, 'name');
      const staffFallbacks = fallbackMap(staffMembers, 'name');
      const sponsorFallbacks = fallbackMap(sponsorsList, 'name');
      const newsFallbacks = fallbackMap(newsArticles, 'slug');
      const galFallbacks = fallbackMap(galleryPhotos, 'title');

      const nextData = { ...this.data };

      // 1. Programs
      if (Array.isArray(sanityData.programs) && sanityData.programs.length > 0) {
        const sanityPrograms = sanityData.programs.map((p) => {
          const fb = progFallbacks.get(p.slug) || {};
          const img = p.heroImage
            ? optimizeSanityImageUrl(p.heroImage, { width: 1200, quality: 85 })
            : fb.heroImage || '/images/hero-community.jpg';
          if (img.includes('cdn.sanity.io')) preloadUrls.push(img);
          return {
            ...fb,
            id: p._id,
            slug: p.slug,
            title: p.title,
            chapter: p.chapter || fb.chapter,
            tagline: p.tagline || fb.tagline,
            summary: p.summary || fb.summary,
            description: p.description || fb.description,
            audience: p.audience || fb.audience,
            audienceColor: p.audienceColor || fb.audienceColor || fb.accent || '#7E22CE',
            schedule: p.schedule || fb.schedule,
            location: p.location || fb.location,
            contactEmail: p.contactEmail || fb.contactEmail,
            contactPhone: p.contactPhone || fb.contactPhone,
            accent: p.accentColor || fb.accent || '#5A1E65',
            imageFit: p.imageFit || fb.imageFit || 'cover',
            heroImage: img,
            amenities: Array.isArray(p.amenities) && p.amenities.length > 0 ? p.amenities : (fb.amenities || []),
            ctaText: fb.ctaText || `Explore ${p.title}`,
            ctaLink: `/programs/${p.slug}`
          };
        });

        // Retain custom programs created by users, merged with Sanity seed programs
        nextData.programs = mergeProgramsWithDefaults(
          this.data.programs,
          sanityPrograms,
          this.data.deletedPrograms || []
        );
      }

      // 2. Events
      if (Array.isArray(sanityData.events) && sanityData.events.length > 0) {
        nextData.events = normalizeCmsEventList(sanityData.events.map((e) => {
          const fb = evtFallbacks.get(e.slug) || {};
          const img = e.image
            ? optimizeSanityImageUrl(e.image, { width: 1200, quality: 85 })
            : fb.image || '/images/community-gathering.jpg';
          if (img.includes('cdn.sanity.io')) preloadUrls.push(img);
          return normalizeCmsEvent({
            ...fb,
            id: e._id,
            slug: e.slug,
            title: e.title,
            date: e.date,
            month: e.month || fb.month,
            day: e.day || fb.day,
            year: e.year || fb.year,
            time: e.time || fb.time || 'Check schedule',
            category: e.category || fb.category || 'Support',
            location: e.location || fb.location,
            address: e.address || fb.address || e.location,
            description: e.description || fb.description,
            registrationUrl: e.registrationUrl || fb.registrationUrl || null,
            contactEmail: e.contactEmail || fb.contactEmail || 'info@diversitycollective.org',
            isRecurring: !!e.isRecurring,
            recurrenceRule: e.recurrenceRule || '',
            isCancelled: !!e.isCancelled,
            cancellationNotice: e.cancellationReason || '',
            featured: typeof e.featured === 'boolean' ? e.featured : !!fb.featured,
            image: img
          });
        }));
      }

      // 3. Board & Staff
      const nextBoard = (Array.isArray(sanityData.boardMembers) && sanityData.boardMembers.length > 0)
        ? sanityData.boardMembers.map((b) => {
            const fb = boardFallbacks.get(b.name) || {};
            const photo = b.photo
              ? optimizeSanityImageUrl(b.photo, { width: 600, quality: 85 })
              : fb.photo || fb.image || '/images/volunteers.jpg';
            if (photo.includes('cdn.sanity.io')) preloadUrls.push(photo);
            return {
              ...fb,
              id: b._id,
              slug: b.slug?.current || b.slug || fb.slug || getBoardMemberSlug(b),
              name: b.name,
              role: b.role,
              bio: b.bio || fb.bio || '',
              quote: b.quote || fb.quote || '',
              committee: b.committee || fb.committee || 'Board Governance & Stewardship',
              tenure: b.tenure || fb.tenure || 'Board of Directors',
              photo,
              image: photo,
              category: 'board',
              order: b.order || 99
            };
          })
        : (boardMembers || []).map((b) => ({ ...b, category: 'board' }));

      const nextStaff = (Array.isArray(sanityData.staffMembers) && sanityData.staffMembers.length > 0)
        ? sanityData.staffMembers.map((s) => {
            const fb = staffFallbacks.get(s.name) || {};
            const photo = s.photo
              ? optimizeSanityImageUrl(s.photo, { width: 600, quality: 85 })
              : fb.photo || '/images/volunteers.jpg';
            if (photo.includes('cdn.sanity.io')) preloadUrls.push(photo);
            return {
              ...fb,
              id: s._id,
              name: s.name,
              title: s.title,
              role: s.title,
              department: s.department || fb.department || 'Operations',
              bio: s.bio || fb.bio || '',
              email: s.email || fb.email || 'info@diversitycollective.org',
              photo,
              category: 'staff',
              order: s.order || 99
            };
          })
        : (staffMembers || []).map((s) => ({ ...s, category: 'staff' }));

      nextData.staff = [...nextStaff, ...nextBoard];

      // 4. Sponsors
      if (Array.isArray(sanityData.sponsors) && sanityData.sponsors.length > 0) {
        nextData.sponsors = sanityData.sponsors.map((sp) => {
          const fb = sponsorFallbacks.get(sp.name) || {};
          const logo = sp.logo
            ? optimizeSanityImageUrl(sp.logo, { width: 600, quality: 90 })
            : fb.logo || '/images/logo-square.png';
          return {
            ...fb,
            id: sp._id,
            name: sp.name,
            shortName: sp.shortName || fb.shortName || sp.name,
            tier: sp.tier || fb.tier || 'Community Ally',
            role: sp.role || fb.role || '',
            url: sp.url || fb.url || 'https://diversitycollective.pages.dev',
            logo
          };
        });
      }

      // 5. News Articles
      if (Array.isArray(sanityData.newsArticles) && sanityData.newsArticles.length > 0) {
        nextData.news = sanityData.newsArticles.map((n) => {
          const fb = newsFallbacks.get(n.slug) || {};
          const img = n.mainImage
            ? optimizeSanityImageUrl(n.mainImage, { width: 1200, quality: 85 })
            : fb.image || fb.heroImage || '/images/community-gathering.jpg';
          return {
            ...fb,
            id: n._id,
            slug: n.slug,
            title: n.title,
            date: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : fb.date,
            excerpt: n.excerpt || fb.excerpt || '',
            author: n.author || fb.author || 'DCVC Communications Team',
            readingTime: n.readingTime || fb.readingTime || '4 min read',
            content: n.body || fb.content || '',
            image: img
          };
        });
      }

      // 6. Gallery Items (Instant Sanity CDN!)
      if (Array.isArray(sanityData.galleryItems) && sanityData.galleryItems.length > 0) {
        nextData.gallery = sanityData.galleryItems.map((g, idx) => {
          const fb = galFallbacks.get(g.title) || {};
          const img = g.image
            ? optimizeSanityImageUrl(g.image, { width: 1400, quality: 85 })
            : fb.image || '/images/community-gathering.jpg';
          if (idx < 4 && img.includes('cdn.sanity.io')) preloadUrls.push(img);
          return {
            ...fb,
            id: g._id || fb.id || `gal-${idx + 1}`,
            title: g.title,
            category: g.eventTag || fb.category || 'Center & Community',
            year: g.year || fb.year || '2026',
            quote: g.caption || fb.quote || '',
            description: g.alt || g.caption || fb.description || g.title,
            image: img
          };
        });
      }

      // 7. Resources
      if (Array.isArray(sanityData.resources) && sanityData.resources.length > 0) {
        nextData.resources = groupSanityResources(sanityData.resources);
      }

      // 8. Training Modules
      if (Array.isArray(sanityData.trainingModules) && sanityData.trainingModules.length > 0) {
        nextData.trainings = sanityData.trainingModules.map((t) => ({
          id: t._id,
          code: t.code,
          slug: t.slug,
          title: t.title,
          duration: t.duration || 'Tailored Session',
          targetAudience: t.audience || '',
          format: t.format || ['In-Person', 'Virtual', 'Hybrid'],
          summary: t.description || '',
          learningObjectives: t.learningObjectives || [],
          materials: t.curriculum || [],
          ceus: t.ceus || '',
          feeStructure: t.feeStructure || ''
        }));
      }

      // 9. Site Settings, Hero, Theme Colors & Section Order
      const ss = sanityData.siteSettings;
      if (ss) {
        nextData.settings = {
          ...nextData.settings,
          name: ss.orgName || nextData.settings.name,
          tagline: ss.tagline || nextData.settings.tagline,
          mission: ss.mission || nextData.settings.mission,
          ein: ss.ein || nextData.settings.ein,
          phone: ss.phone || nextData.settings.phone,
          email: ss.email || nextData.settings.email,
          address: ss.address || nextData.settings.address,
          hours: ss.hours || nextData.settings.hours,
          facebook: ss.socials?.facebook || nextData.settings.facebook,
          instagram: ss.socials?.instagram || nextData.settings.instagram,
          youtube: ss.socials?.youtube || nextData.settings.youtube,
          bannerAlertActive:
            typeof ss.announcementBanner?.enabled === 'boolean'
              ? ss.announcementBanner.enabled
              : nextData.settings.bannerAlertActive,
          bannerAlertText: ss.announcementBanner?.text || nextData.settings.bannerAlertText,
          bannerAlertLink: ss.announcementBanner?.linkUrl || nextData.settings.bannerAlertLink
        };

        // Sync Hero Props & Section Order from Sanity only if no Admin layout/hero exists locally
        const hasLocalLayout = Boolean(localStorage.getItem(LAYOUT_STORAGE_KEY));
        const hasLocalHero = Boolean(localStorage.getItem(HERO_THEME_STORAGE_KEY));
        if (!hasLocalLayout) {
          try {
            let nextBlocks = normalizePageLayoutBlocks(DEFAULT_PAGE_BLOCKS);
            const existingByType = new Map(nextBlocks.map((b) => [b.type, b]));

            const sanityHasPartnerships = Array.isArray(ss.sections) && ss.sections.some((s) => s.sectionId === 'partnerships_section');
            if (Array.isArray(ss.sections) && ss.sections.length > 0 && sanityHasPartnerships) {
              nextBlocks = ss.sections.map((sec, idx) => {
                const matched = existingByType.get(sec.sectionId);
                return {
                  id: matched?.id || `block-${sec.sectionId || idx}`,
                  type: sec.sectionId,
                  title: sec.label || matched?.title || sec.sectionId,
                  label: sec.label || matched?.label || matched?.title || sec.sectionId,
                  enabled: sec.visible !== false,
                  props: { ...(matched?.props || {}) }
                };
              });
            } else if (Array.isArray(ss.sections) && ss.sections.length > 0) {
              // Legacy Sanity document predates partnerships_section — keep updated homepage order
              // while syncing label & visibility overrides cleanly for matching blocks
              const sanityById = new Map(ss.sections.map((s) => [s.sectionId, s]));
              nextBlocks = nextBlocks.map((block) => {
                const sec = sanityById.get(block.type);
                if (!sec) return block;
                return {
                  ...block,
                  title: sec.label || block.title,
                  label: sec.label || block.label || block.title,
                  enabled: sec.visible !== false
                };
              });
            }

            if (ss.hero) {
              const heroImg = ss.hero.spotlightImage
                ? optimizeSanityImageUrl(ss.hero.spotlightImage, { width: 1400, quality: 88 })
                : null;
              if (heroImg) preloadUrls.unshift(heroImg);

              const heroPatch = {
                ...(ss.hero.titleLine1 ? { titleLine1: ss.hero.titleLine1 } : {}),
                ...(ss.hero.titleAccentWord ? { titleAccentWord: ss.hero.titleAccentWord } : {}),
                ...(ss.hero.titleLine2 ? { titleLine2: ss.hero.titleLine2 } : {}),
                ...(ss.hero.subtitle ? { subtitle: ss.hero.subtitle, description: ss.hero.subtitle } : {}),
                ...(ss.hero.primaryCtaText ? { primaryCtaText: ss.hero.primaryCtaText } : {}),
                ...(ss.hero.primaryCtaLink ? { primaryCtaLink: ss.hero.primaryCtaLink } : {}),
                ...(ss.hero.secondaryCtaText ? { secondaryCtaText: ss.hero.secondaryCtaText } : {}),
                ...(ss.hero.secondaryCtaLink ? { secondaryCtaLink: ss.hero.secondaryCtaLink } : {}),
                ...(ss.hero.emailAddress ? { emailAddress: ss.hero.emailAddress } : {}),
                ...(heroImg ? { spotlightImage: heroImg, photoUrl: heroImg } : {}),
                ...(ss.hero.cardTitle ? { cardTitle: ss.hero.cardTitle } : {}),
                ...(ss.hero.cardSubtitle ? { cardSubtitle: ss.hero.cardSubtitle } : {}),
                ...(ss.hero.helplineText ? { helplineText: ss.hero.helplineText } : {})
              };

              const heroIdx = nextBlocks.findIndex((b) => b.type === 'hero_banner');
              if (heroIdx >= 0) {
                nextBlocks[heroIdx] = {
                  ...nextBlocks[heroIdx],
                  props: { ...(nextBlocks[heroIdx].props || {}), ...heroPatch }
                };
              }
            }

            nextBlocks = normalizePageLayoutBlocks(nextBlocks);
            if (nextBlocks.length > 0) {
              localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(nextBlocks));
              window.dispatchEvent(new Event(SYNC_EVENTS.LAYOUT_CHANGED));
            }
          } catch (err) {
            console.warn('[Sanity Sync] Layout merge skipped:', err.message);
          }
        }

        if (!hasLocalHero && ss.hero?.heroTheme) {
          setActiveHeroTheme(ss.hero.heroTheme);
        }

        // Sync Colors, Buttons & Fonts from Sanity only if no Admin theme is saved locally
        if (ss.theme && !localStorage.getItem(THEME_STORAGE_KEY)) {
          try {
            const mergedTheme = {
              ...(ss.theme.btnPrimaryBg ? { btnPrimaryBg: ss.theme.btnPrimaryBg, btnPrimaryBgGradient: ss.theme.btnPrimaryBg } : {}),
              ...(ss.theme.btnPrimaryText ? { btnPrimaryText: ss.theme.btnPrimaryText } : {}),
              ...(ss.theme.btnSecondaryBg ? { btnSecondaryBg: ss.theme.btnSecondaryBg } : {}),
              ...(ss.theme.btnSecondaryText ? { btnSecondaryText: ss.theme.btnSecondaryText } : {}),
              ...(ss.theme.btnDonateBg ? { btnDonateBg: ss.theme.btnDonateBg } : {}),
              ...(ss.theme.btnDonateText ? { btnDonateText: ss.theme.btnDonateText } : {}),
              ...(ss.theme.navBtnText ? { navBtnText: ss.theme.navBtnText } : {}),
              ...(ss.theme.navBtnActiveBg ? { navBtnActiveBg: ss.theme.navBtnActiveBg } : {}),
              ...(ss.theme.navBtnActiveText ? { navBtnActiveText: ss.theme.navBtnActiveText } : {}),
              ...(ss.theme.btnPrimaryRadius ? { btnPrimaryRadius: ss.theme.btnPrimaryRadius } : {}),
              ...(ss.theme.cardRadius ? { cardRadius: ss.theme.cardRadius } : {}),
              ...(ss.theme.headingFont ? { headingFont: ss.theme.headingFont } : {}),
              ...(ss.theme.bodyFont ? { bodyFont: ss.theme.bodyFont } : {})
            };
            localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(mergedTheme));
            window.dispatchEvent(new CustomEvent('SITE_THEME_UPDATED', { detail: mergedTheme }));
            window.dispatchEvent(new CustomEvent(SYNC_EVENTS.THEME_CHANGED, { detail: mergedTheme }));
          } catch (err) {
            console.warn('[Sanity Sync] Theme merge skipped:', err.message);
          }
        }
      }

      if (preloadUrls.length > 0) preloadImageUrls(preloadUrls);
      this.saveData(nextData, { broadcast: false });
      return nextData;
    })();

    return this._syncPromise;
  }

  getAllData() {
    return this.data;
  }

  getSponsors() {
    return this.data.sponsors || sponsorsList || [];
  }

  getTrainings() {
    return this.data.trainings || trainingCourses || [];
  }

  getBoardMembers() {
    const board = this.getStaff().filter((s) => s.category === 'board');
    return board.length > 0 ? board : (boardMembers || []);
  }

  getStaffMembers() {
    const st = this.getStaff().filter((s) => s.category === 'staff');
    return st.length > 0 ? st : (staffMembers || []);
  }

  loadData() {
    if (typeof localStorage === 'undefined') return INITIAL_CMS_DATA;
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEY);
      if (!stored) {
        this.saveData(INITIAL_CMS_DATA);
        return INITIAL_CMS_DATA;
      }
      const parsed = replaceSanctuaryWithCenter(JSON.parse(stored));
      if (stored.includes('anctuary')) {
        try {
          localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(parsed));
        } catch {}
      }
      // Ensure all primary collections exist
      return {
        ...INITIAL_CMS_DATA,
        ...parsed,
        settings: { ...INITIAL_CMS_DATA.settings, ...(parsed.settings || {}) },
        programs: mergeProgramsWithDefaults(parsed.programs, INITIAL_CMS_DATA.programs, parsed.deletedPrograms || []),
        deletedPrograms: parsed.deletedPrograms || [],
        events: normalizeCmsEventList(parsed.events || INITIAL_CMS_DATA.events),
        sponsors: parsed.sponsors || INITIAL_CMS_DATA.sponsors,
        trainings: parsed.trainings || INITIAL_CMS_DATA.trainings,
        communityGroups: parsed.communityGroups || INITIAL_CMS_DATA.communityGroups,
        news: (parsed.news && Array.isArray(parsed.news) && parsed.news.length > 0)
          ? parsed.news.map((n, i) => ({
              id: n.id || n.slug || `news-${i}`,
              ...n,
              body: n.body || n.content || '',
              content: n.content || (Array.isArray(n.body) ? n.body.join('\n\n') : (n.body || n.excerpt || ''))
            }))
          : INITIAL_CMS_DATA.news,
        resources: parsed.resources || INITIAL_CMS_DATA.resources,
        staff: mergeStaffWithDefaults(parsed.staff, INITIAL_CMS_DATA.staff, parsed.deletedStaff || []),
        deletedStaff: parsed.deletedStaff || [],
        gallery: parsed.gallery || INITIAL_CMS_DATA.gallery,
        memoryLane: parsed.memoryLane || INITIAL_CMS_DATA.memoryLane,
        podcasts: parsed.podcasts || INITIAL_CMS_DATA.podcasts,
        mediaSuggestions: parsed.mediaSuggestions || []
      };
    } catch {
      return INITIAL_CMS_DATA;
    }
  }

  saveData(data, { broadcast = true } = {}) {
    const cleanData = {
      ...data,
      events: normalizeCmsEventList(data.events || this.data.events || []),
      lastUpdated: new Date().toISOString()
    };
    this.data = cleanData;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(this.data));
      } catch (err) {
        console.warn('[CMS Store] LocalStorage write error:', err);
      }
    }
    this.notify();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.CMS_CHANGED, {
        detail: { ...this.data, _fromCmsStore: true }
      }));
    }
    if (broadcast) {
      broadcastPatch({ cmsData: this.data });
    }
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.data);
      } catch (e) {
        console.error('[CMS Store] Listener error:', e);
      }
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getData() {
    return this.data;
  }

  // --------------------------------------------------------------------------
  // Reset & Serialization
  // --------------------------------------------------------------------------
  resetToFactoryDefaults() {
    this.saveData(INITIAL_CMS_DATA);
    return INITIAL_CMS_DATA;
  }

  exportJson() {
    return JSON.stringify(this.data, null, 2);
  }

  importJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON structure');
      this.saveData(parsed);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // --------------------------------------------------------------------------
  // Settings
  // --------------------------------------------------------------------------
  getSettings() {
    return this.data.settings;
  }

  saveSettings(updates) {
    const newSettings = { ...this.data.settings, ...updates };
    this.saveData({ ...this.data, settings: newSettings });
    return newSettings;
  }

  // --------------------------------------------------------------------------
  // Programs CRUD
  // --------------------------------------------------------------------------
  getPrograms() {
    return mergeProgramsWithDefaults(this.data.programs, INITIAL_CMS_DATA.programs, this.data.deletedPrograms || []);
  }

  saveProgram(program) {
    if (!program || typeof program !== 'object') return this.getPrograms();

    const existing = mergeProgramsWithDefaults(this.data.programs, INITIAL_CMS_DATA.programs, this.data.deletedPrograms || []);

    const targetId = (program.id || program.originalId) ? String(program.id || program.originalId).trim() : null;
    const targetSlug = (program.slug || program.originalSlug) ? String(program.slug || program.originalSlug).trim() : null;

    const cleanTitle = (program.title || '').trim();
    const fallbackSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const progSlug = targetSlug || fallbackSlug || `program-${Date.now()}`;
    const progId = targetId || (progSlug ? `prog-${progSlug}` : `prog-${Date.now()}`);

    const normalizedProgram = {
      ...program,
      id: progId,
      slug: progSlug,
      title: cleanTitle || program.title || 'Untitled Program',
      tagline: program.tagline || '',
      chapter: program.chapter || `0${existing.length + 1}`,
      heroImage: program.heroImage || '/images/crc-building.jpg',
      imageFit: program.imageFit || 'contain',
      accent: program.accent || '#5A1E65',
      fontSize: program.fontSize || 'base',
      fontColor: program.fontColor || '#5A1E65',
      audience: program.audience || 'All LGBTQ+ community members and affirming allies',
      audienceColor: program.audienceColor || program.accent || '#7E22CE',
      schedule: program.schedule || 'Monday – Friday, 1:00 PM – 5:00 PM',
      location: program.location || '2471 Portola Road, Suite 100, Ventura, CA 93003',
      summary: program.summary || '',
      description: program.description || program.summary || '',
      amenities: Array.isArray(program.amenities) ? program.amenities : [],
      contactEmail: program.contactEmail || 'info@diversitycollective.org',
      contactPhone: program.contactPhone || '(805) 644-5428',
      ctaText: program.ctaText || 'Learn More',
      ctaLink: program.ctaLink || `/programs/${progSlug}`,
      active: program.active !== false
    };

    // STRICT matching: NEVER compare empty strings or undefined!
    const index = existing.findIndex(p => {
      if (targetId && p.id && String(p.id) === targetId) return true;
      if (targetSlug && p.slug && String(p.slug) === targetSlug) return true;
      if (cleanTitle && p.title && p.title.toLowerCase().trim() === cleanTitle.toLowerCase()) return true;
      if (progSlug && p.slug && String(p.slug) === progSlug) return true;
      return false;
    });

    if (index >= 0) {
      existing[index] = { ...existing[index], ...normalizedProgram };
    } else {
      existing.unshift(normalizedProgram);
    }

    const deleted = (this.data.deletedPrograms || []).filter(s => s !== normalizedProgram.slug && s !== normalizedProgram.id && s !== targetSlug && s !== targetId);
    this.saveData({ ...this.data, programs: existing, deletedPrograms: deleted });
    return existing;
  }

  savePrograms(programs) {
    if (!Array.isArray(programs)) return this.data.programs;
    this.saveData({ ...this.data, programs });
    return programs;
  }

  deleteProgram(slugOrId) {
    if (!slugOrId) return this.getPrograms();
    const existing = this.getPrograms().filter(p => p.slug !== slugOrId && p.id !== slugOrId);
    const deleted = Array.from(new Set([...(this.data.deletedPrograms || []), slugOrId]));
    this.saveData({ ...this.data, programs: existing, deletedPrograms: deleted });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Events CRUD
  // --------------------------------------------------------------------------
  getEvents() {
    return this.data.events;
  }

  saveEvent(event) {
    const existing = [...this.data.events];
    const index = existing.findIndex(e => e.id === event.id || e.slug === event.slug);
    if (index >= 0) {
      existing[index] = normalizeCmsEvent({ ...existing[index], ...event });
    } else {
      const newEvent = normalizeCmsEvent({
        ...event,
        id: event.id || `evt-${Date.now()}`,
        slug: event.slug || (event.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      });
      existing.unshift(newEvent);
    }
    this.saveData({ ...this.data, events: existing });
    return existing;
  }

  saveEvents(events) {
    if (!Array.isArray(events)) return this.data.events;
    const normalized = normalizeCmsEventList(events);
    this.saveData({ ...this.data, events: normalized });
    return normalized;
  }

  toggleEventCancellation(eventId, cancellationNotice = '') {
    const existing = this.data.events.map(evt => {
      if (evt.id === eventId || evt.slug === eventId) {
        const nextCancelled = !evt.isCancelled;
        return {
          ...evt,
          isCancelled: nextCancelled,
          cancellationNotice: nextCancelled ? (cancellationNotice || 'This event has been rescheduled or cancelled. Please contact info@diversitycollective.org for assistance.') : ''
        };
      }
      return evt;
    });
    this.saveData({ ...this.data, events: existing });
    return existing;
  }

  deleteEvent(eventId) {
    const existing = this.data.events.filter(e => e.id !== eventId && e.slug !== eventId);
    this.saveData({ ...this.data, events: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // News / Blog Articles CRUD
  // --------------------------------------------------------------------------
  getNews() {
    return this.data.news;
  }

  saveNews(article) {
    if (!article) return this.data.news;
    const existing = [...this.data.news];
    const targetId = article.id || article.originalId;
    const targetSlug = article.slug || article.originalSlug;

    // Safely match without allowing undefined === undefined
    const index = existing.findIndex(n => {
      if (targetId && n.id && n.id === targetId) return true;
      if (targetSlug && n.slug && n.slug === targetSlug) return true;
      if (article.slug && n.slug && n.slug === article.slug) return true;
      if (article.title && n.title && n.title.toLowerCase().trim() === article.title.toLowerCase().trim()) return true;
      return false;
    });

    const normalizedArticle = {
      ...article,
      id: article.id || (index >= 0 ? existing[index].id : null) || article.slug || `news-${Date.now()}`,
      slug: article.slug || (index >= 0 ? existing[index].slug : null) || (article.title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      body: article.body || article.content || '',
      content: article.content || article.body || '',
      publishedAt: article.publishedAt || article.date || (index >= 0 ? existing[index].publishedAt : null) || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };

    if (index >= 0) {
      existing[index] = { ...existing[index], ...normalizedArticle };
    } else {
      existing.unshift(normalizedArticle);
    }
    this.saveData({ ...this.data, news: existing });
    return existing;
  }

  deleteNews(articleId) {
    if (!articleId) return this.data.news;
    const existing = this.data.news.filter(n => n.id !== articleId && n.slug !== articleId);
    this.saveData({ ...this.data, news: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Community Resources Directory CRUD
  // --------------------------------------------------------------------------
  getResources() {
    return this.data.resources;
  }

  saveResource(resource) {
    const existing = [...this.data.resources];
    const index = existing.findIndex(r => r.id === resource.id);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...resource };
    } else {
      const newRes = {
        ...resource,
        id: resource.id || `res-${Date.now()}`
      };
      existing.unshift(newRes);
    }
    this.saveData({ ...this.data, resources: existing });
    return existing;
  }

  saveResources(resources) {
    if (!Array.isArray(resources)) return this.data.resources;
    this.saveData({ ...this.data, resources });
    return resources;
  }

  deleteResource(resourceId) {
    const existing = this.data.resources.filter(r => r.id !== resourceId);
    this.saveData({ ...this.data, resources: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Affirming Business Directory CRUD (Auto-Learned by Luna)
  // --------------------------------------------------------------------------
  getBusinesses() {
    return this.data.businesses || [];
  }

  saveBusiness(business) {
    const existing = [...(this.data.businesses || [])];
    const index = existing.findIndex(b => b.id === business.id || (b.slug && b.slug === business.slug));
    if (index >= 0) {
      existing[index] = { ...existing[index], ...business };
    } else {
      const newBiz = {
        ...business,
        id: business.id || `biz-${Date.now()}`,
        slug: business.slug || (business.name || 'new-business').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      };
      existing.unshift(newBiz);
    }
    this.saveData({ ...this.data, businesses: existing });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dcvc_live_directory_businesses', JSON.stringify(existing));
      } catch {
        // fallback
      }
    }
    return existing;
  }

  saveBusinesses(businesses) {
    if (!Array.isArray(businesses)) return this.data.businesses || [];
    this.saveData({ ...this.data, businesses });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dcvc_live_directory_businesses', JSON.stringify(businesses));
      } catch {
        // fallback
      }
    }
    return businesses;
  }

  deleteBusiness(businessId) {
    const existing = (this.data.businesses || []).filter(b => b.id !== businessId && b.slug !== businessId);
    this.saveData({ ...this.data, businesses: existing });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dcvc_live_directory_businesses', JSON.stringify(existing));
      } catch {
        // fallback
      }
    }
    return existing;
  }

  // --------------------------------------------------------------------------
  // Custom Knowledge / FAQs CRUD (Auto-Learned by Luna)
  // --------------------------------------------------------------------------
  getCustomKnowledge() {
    return this.data.customKnowledge || [];
  }

  saveCustomKnowledge(item) {
    const existing = [...(this.data.customKnowledge || [])];
    const index = existing.findIndex(k => k.id === item.id);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...item, updatedAt: new Date().toISOString() };
    } else {
      const newK = {
        ...item,
        id: item.id || `custom-${Date.now()}`,
        updatedAt: new Date().toISOString()
      };
      existing.unshift(newK);
    }
    this.saveData({ ...this.data, customKnowledge: existing });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dcvc_luna_custom_knowledge', JSON.stringify(existing));
      } catch {
        // fallback
      }
    }
    return existing;
  }

  deleteCustomKnowledge(itemId) {
    const existing = (this.data.customKnowledge || []).filter(k => k.id !== itemId);
    this.saveData({ ...this.data, customKnowledge: existing });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dcvc_luna_custom_knowledge', JSON.stringify(existing));
      } catch {
        // fallback
      }
    }
    return existing;
  }

  // --------------------------------------------------------------------------
  // Staff & Board Members CRUD
  // --------------------------------------------------------------------------
  getStaff() {
    return mergeStaffWithDefaults(this.data.staff, INITIAL_CMS_DATA.staff, this.data.deletedStaff || []);
  }

  saveStaff(memberOrList) {
    if (Array.isArray(memberOrList)) {
      this.saveData({ ...this.data, staff: memberOrList });
      return memberOrList;
    }
    const existing = mergeStaffWithDefaults(this.data.staff, INITIAL_CMS_DATA.staff, this.data.deletedStaff || []);

    const targetId = memberOrList.id ? String(memberOrList.id).trim() : null;
    const cleanName = (memberOrList.name || '').trim();
    const targetCategory = memberOrList.category || 'staff';
    const memberSlug = memberOrList.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const memberId = targetId || `${targetCategory}-${memberSlug || Date.now()}`;

    const normalizedMember = {
      ...memberOrList,
      id: memberId,
      slug: memberSlug,
      name: cleanName || 'Unnamed Member',
      title: memberOrList.title || memberOrList.role || (targetCategory === 'board' ? 'Board Member' : 'Staff Member'),
      role: memberOrList.role || memberOrList.title || (targetCategory === 'board' ? 'Board Member' : 'Staff Member'),
      category: targetCategory,
      email: memberOrList.email || 'info@diversitycollective.org',
      photo: memberOrList.photo || memberOrList.image || '/images/volunteers.jpg',
      bio: memberOrList.bio || ''
    };

    // STRICT MATCHING - NEVER compare empty strings or undefined!
    const index = existing.findIndex(s => {
      if (targetId && s.id && String(s.id) === targetId) return true;
      if (cleanName && s.name && s.name.toLowerCase().trim() === cleanName.toLowerCase() && s.category === targetCategory) return true;
      if (memberSlug && s.slug && String(s.slug) === memberSlug && s.category === targetCategory) return true;
      return false;
    });

    if (index >= 0) {
      existing[index] = { ...existing[index], ...normalizedMember };
    } else {
      existing.push(normalizedMember);
    }

    const deleted = (this.data.deletedStaff || []).filter(d => d !== normalizedMember.id && d !== normalizedMember.name && d !== targetId);
    this.saveData({ ...this.data, staff: existing, deletedStaff: deleted });
    return existing;
  }

  deleteStaff(memberId) {
    if (!memberId) return this.getStaff();
    const existing = this.getStaff().filter(s => s.id !== memberId && s.name !== memberId && s.slug !== memberId);
    const deleted = Array.from(new Set([...(this.data.deletedStaff || []), memberId]));
    this.saveData({ ...this.data, staff: existing, deletedStaff: deleted });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Gallery Photos CRUD
  // --------------------------------------------------------------------------
  getGallery() {
    return this.data.gallery;
  }

  saveGalleryPhoto(photo) {
    const existing = [...this.data.gallery];
    const index = existing.findIndex(g => g.id === photo.id);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...photo };
    } else {
      const newPhoto = {
        ...photo,
        id: photo.id || `gal-${Date.now()}`
      };
      existing.unshift(newPhoto);
    }
    this.saveData({ ...this.data, gallery: existing });
    return existing;
  }

  deleteGalleryPhoto(photoId) {
    const existing = this.data.gallery.filter(g => g.id !== photoId);
    this.saveData({ ...this.data, gallery: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Memory Lane Milestones CRUD
  // --------------------------------------------------------------------------
  getMemoryLane() {
    return this.data.memoryLane;
  }

  saveMilestone(milestone) {
    const existing = [...this.data.memoryLane];
    const index = existing.findIndex(m => m.year === milestone.year);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...milestone };
    } else {
      existing.push(milestone);
      existing.sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10));
    }
    this.saveData({ ...this.data, memoryLane: existing });
    return existing;
  }

  saveMemoryLane(milestones) {
    if (!Array.isArray(milestones)) return this.data.memoryLane;
    this.saveData({ ...this.data, memoryLane: milestones });
    return milestones;
  }

  deleteMilestone(year) {
    const existing = this.data.memoryLane.filter(m => m.year !== year);
    this.saveData({ ...this.data, memoryLane: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Sponsors & Partnerships CRUD
  // --------------------------------------------------------------------------
  saveSponsor(sponsor) {
    const existing = [...(this.data.sponsors || sponsorsList || [])];
    const targetId = sponsor.id || sponsor.name;
    const index = existing.findIndex(
      (s) => (s.id && s.id === sponsor.id) || (s.name && s.name === targetId)
    );
    if (index >= 0) {
      existing[index] = { ...existing[index], ...sponsor };
    } else {
      existing.unshift({
        ...sponsor,
        id: sponsor.id || `sp-${Date.now()}`
      });
    }
    this.saveData({ ...this.data, sponsors: existing });
    return existing;
  }

  saveSponsors(sponsors) {
    if (!Array.isArray(sponsors)) return this.getSponsors();
    this.saveData({ ...this.data, sponsors });
    return sponsors;
  }

  deleteSponsor(idOrName) {
    const existing = (this.data.sponsors || sponsorsList || []).filter(
      (s) => s.id !== idOrName && s.name !== idOrName
    );
    this.saveData({ ...this.data, sponsors: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // P.R.I.D.E. Trainings CRUD
  // --------------------------------------------------------------------------
  saveTraining(training) {
    const existing = [...(this.data.trainings || trainingCourses || [])];
    const slug =
      training.slug ||
      (training.title || 'training').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const index = existing.findIndex(
      (t) => (t.id && t.id === training.id) || t.slug === slug
    );
    if (index >= 0) {
      existing[index] = { ...existing[index], ...training, slug };
    } else {
      existing.unshift({
        ...training,
        id: training.id || `trn-${Date.now()}`,
        slug,
        learningObjectives: Array.isArray(training.learningObjectives)
          ? training.learningObjectives
          : [],
        materials: Array.isArray(training.materials) ? training.materials : []
      });
    }
    this.saveData({ ...this.data, trainings: existing });
    return existing;
  }

  saveTrainings(trainings) {
    if (!Array.isArray(trainings)) return this.getTrainings();
    this.saveData({ ...this.data, trainings });
    return trainings;
  }

  deleteTraining(slugOrId) {
    const existing = (this.data.trainings || trainingCourses || []).filter(
      (t) => t.slug !== slugOrId && t.id !== slugOrId
    );
    this.saveData({ ...this.data, trainings: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Community Peer Groups CRUD
  // --------------------------------------------------------------------------
  getCommunityGroups() {
    return this.data.communityGroups || communityGroups || [];
  }

  saveCommunityGroup(group) {
    const existing = [...this.getCommunityGroups()];
    const slug =
      group.slug ||
      (group.name || group.title || 'group').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const index = existing.findIndex(
      (g) => (g.id && g.id === group.id) || g.slug === slug
    );
    if (index >= 0) {
      existing[index] = { ...existing[index], ...group, slug };
    } else {
      existing.unshift({ ...group, id: group.id || `grp-${Date.now()}`, slug });
    }
    this.saveData({ ...this.data, communityGroups: existing });
    return existing;
  }

  deleteCommunityGroup(slugOrId) {
    const existing = this.getCommunityGroups().filter(
      (g) => g.slug !== slugOrId && g.id !== slugOrId
    );
    this.saveData({ ...this.data, communityGroups: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Podcasts & Media CRUD
  // --------------------------------------------------------------------------
  getPodcasts() {
    return this.data.podcasts || podcastsSeed || [];
  }

  savePodcast(podcast) {
    const existing = [...this.getPodcasts()];
    const slug = podcast.slug || (podcast.title || 'new-episode').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const index = existing.findIndex(p => p.id === podcast.id || p.slug === slug);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...podcast, slug };
    } else {
      existing.unshift({
        ...podcast,
        id: podcast.id || `pod-${Date.now()}`,
        slug,
        episodeNumber: podcast.episodeNumber || (existing.length + 1)
      });
    }
    this.saveData({ ...this.data, podcasts: existing });
    return existing;
  }

  savePodcasts(podcasts) {
    if (!Array.isArray(podcasts)) return this.getPodcasts();
    this.saveData({ ...this.data, podcasts });
    return podcasts;
  }

  deletePodcast(slugOrId) {
    const existing = this.getPodcasts().filter(p => p.slug !== slugOrId && p.id !== slugOrId);
    this.saveData({ ...this.data, podcasts: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Media & Podcast Content Suggestions CRUD
  // --------------------------------------------------------------------------
  getMediaSuggestions() {
    return this.data.mediaSuggestions || [];
  }

  saveMediaSuggestion(suggestion) {
    const existing = [...this.getMediaSuggestions()];
    const newSuggestion = {
      ...suggestion,
      id: suggestion.id || `sug-${Date.now()}`,
      status: suggestion.status || 'new',
      createdAt: suggestion.createdAt || new Date().toISOString()
    };
    existing.unshift(newSuggestion);
    this.saveData({ ...this.data, mediaSuggestions: existing });
    return newSuggestion;
  }

  updateMediaSuggestion(id, patch) {
    const existing = [...this.getMediaSuggestions()];
    const index = existing.findIndex(s => s.id === id);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...patch, updatedAt: new Date().toISOString() };
      this.saveData({ ...this.data, mediaSuggestions: existing });
    }
    return existing;
  }

  deleteMediaSuggestion(id) {
    const existing = this.getMediaSuggestions().filter(s => s.id !== id);
    this.saveData({ ...this.data, mediaSuggestions: existing });
    return existing;
  }
}

export const cmsStore = new CmsStoreEngine();

