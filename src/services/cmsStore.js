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
  newsArticles,
  galleryPhotos,
  memoryLaneMilestones
} from '../data/dcvcData';
import {
  fetchAllSanityWebsiteData,
  optimizeSanityImageUrl,
  preloadImageUrls
} from '../lib/sanity';
import { setActiveHeroTheme } from './heroThemeStore';

const CMS_STORAGE_KEY = 'dcvc_live_cms_data';
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
    email: orgInfo.email || "info@diversitycollective.org",
    address: orgInfo.address?.full || "2471 Portola Road, Suite 100, Ventura, CA 93003",
    googleMapsUrl: orgInfo.address?.googleMapsUrl || "",
    hours: orgInfo.hours || "1:00 PM – 5:00 PM Weekdays (Drop-ins & Testing)",
    emergencyCrisisNotice: "24/7 LGBTQ+ Suicide & Crisis Lifeline: Dial 988 or text 'START' to 678-678 (Trevor Project).",
    bannerAlertActive: true,
    bannerAlertText: "Sanctuary Open Today · Mon–Fri 1:00 PM – 5:00 PM · Free HIV/STI Screenings",
    bannerAlertLink: "/events",
    donationUrl: orgInfo.donationUrl || "/donate",
    volunteerUrl: orgInfo.volunteerUrl || "/volunteer",
    facebook: orgInfo.socials?.facebook || "https://www.facebook.com/diversitycollectivevc",
    instagram: orgInfo.socials?.instagram || "https://www.instagram.com/diversitycollectivevc",
    youtube: orgInfo.socials?.youtube || "https://www.youtube.com/@diversitycollectivevc"
  },
  programs: programsList || [],
  events: liveEvents || [],
  news: newsArticles || [],
  resources: resourcesDirectory || [],
  sponsors: sponsorsList || [],
  trainings: trainingCourses || [],
  staff: [
    ...(staffMembers || []).map(s => ({ ...s, category: 'staff' })),
    ...(boardMembers || []).map(b => ({ ...b, category: 'board' }))
  ],
  gallery: galleryPhotos || [],
  memoryLane: memoryLaneMilestones || []
};

class CmsStoreEngine {
  constructor() {
    this.listeners = new Set();
    this.data = this.loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === CMS_STORAGE_KEY && e.newValue) {
          try {
            this.data = JSON.parse(e.newValue);
            this.notify();
          } catch (err) {
            console.error('[CMS Store] Cross-tab parse error:', err);
          }
        }
      });

      // Automatically hydrate from Sanity Edge APICDN in the background on load
      setTimeout(() => {
        this.syncFromSanity().catch(() => {});
      }, 0);
    }
  }

  /**
   * Hydrate live website content, hero, theme, section order, and Sanity CDN images
   * directly from Sanity's Edge APICDN (`apicdn.sanity.io`).
   */
  async syncFromSanity(force = false) {
    if (typeof window === 'undefined') return null;
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
        nextData.programs = sanityData.programs.map((p) => {
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
      }

      // 2. Events
      if (Array.isArray(sanityData.events) && sanityData.events.length > 0) {
        nextData.events = sanityData.events.map((e) => {
          const fb = evtFallbacks.get(e.slug) || {};
          const img = e.image
            ? optimizeSanityImageUrl(e.image, { width: 1200, quality: 85 })
            : fb.image || '/images/community-gathering.jpg';
          if (img.includes('cdn.sanity.io')) preloadUrls.push(img);
          const dateTokens = String(e.date || '').replace(/,/g, '').split(/\s+/);
          return {
            ...fb,
            id: e._id,
            slug: e.slug,
            title: e.title,
            date: e.date,
            month: e.month || fb.month || (dateTokens[0] ? dateTokens[0].slice(0, 3).toUpperCase() : 'TBD'),
            day: e.day || fb.day || (dateTokens[1] ? dateTokens[1].padStart(2, '0') : '01'),
            year: e.year || fb.year || '2026',
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
          };
        });
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
              name: b.name,
              role: b.role,
              bio: b.bio || fb.bio || '',
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
            category: g.eventTag || fb.category || 'Sanctuary & Community',
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
          duration: t.duration || '2 to 4 Hours',
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

        // Sync Hero Props & Section Order from Sanity
        try {
          const existingRaw = localStorage.getItem(LAYOUT_STORAGE_KEY);
          const existingBlocks = existingRaw ? JSON.parse(existingRaw) : [];
          let nextBlocks = Array.isArray(existingBlocks) ? [...existingBlocks] : [];

          if (Array.isArray(ss.sections) && ss.sections.length > 0) {
            const heroExistingProps = nextBlocks.find((b) => b.type === 'hero_banner')?.props || {};
            nextBlocks = ss.sections.map((sec, idx) => ({
              id: `block-${sec.sectionId || idx}`,
              type: sec.sectionId,
              label: sec.label || sec.sectionId,
              enabled: sec.visible !== false,
              props: sec.sectionId === 'hero_banner' ? { ...heroExistingProps } : undefined
            }));
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
              ...(ss.hero.subtitle ? { subtitle: ss.hero.subtitle } : {}),
              ...(ss.hero.primaryCtaText ? { primaryCtaText: ss.hero.primaryCtaText } : {}),
              ...(ss.hero.primaryCtaLink ? { primaryCtaLink: ss.hero.primaryCtaLink } : {}),
              ...(ss.hero.secondaryCtaText ? { secondaryCtaText: ss.hero.secondaryCtaText } : {}),
              ...(ss.hero.secondaryCtaLink ? { secondaryCtaLink: ss.hero.secondaryCtaLink } : {}),
              ...(ss.hero.emailAddress ? { emailAddress: ss.hero.emailAddress } : {}),
              ...(heroImg ? { spotlightImage: heroImg } : {}),
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
            } else {
              nextBlocks.unshift({
                id: 'block-hero_banner',
                type: 'hero_banner',
                label: 'Hero Sanctuary Banner',
                enabled: true,
                props: heroPatch
              });
            }

            if (ss.hero.heroTheme) {
              setActiveHeroTheme(ss.hero.heroTheme);
            }
          }

          if (nextBlocks.length > 0) {
            localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(nextBlocks));
            window.dispatchEvent(new Event('dcvc_layout_updated'));
          }
        } catch (err) {
          console.warn('[Sanity Sync] Layout merge skipped:', err.message);
        }

        // Sync Colors, Buttons & Fonts from Sanity
        if (ss.theme) {
          try {
            const rawTheme = localStorage.getItem(THEME_STORAGE_KEY);
            const curTheme = rawTheme ? JSON.parse(rawTheme) : {};
            const mergedTheme = {
              ...curTheme,
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
            const root = document.documentElement;
            if (mergedTheme.btnPrimaryBg) root.style.setProperty('--dcvc-btn-primary-bg', mergedTheme.btnPrimaryBg);
            if (mergedTheme.btnPrimaryText) root.style.setProperty('--dcvc-btn-primary-text', mergedTheme.btnPrimaryText);
            if (mergedTheme.btnPrimaryRadius) root.style.setProperty('--dcvc-btn-radius', mergedTheme.btnPrimaryRadius);
            if (mergedTheme.btnSecondaryBg) root.style.setProperty('--dcvc-btn-secondary-bg', mergedTheme.btnSecondaryBg);
            if (mergedTheme.btnSecondaryText) root.style.setProperty('--dcvc-btn-secondary-text', mergedTheme.btnSecondaryText);
            if (mergedTheme.btnDonateBg) root.style.setProperty('--dcvc-btn-donate-bg', mergedTheme.btnDonateBg);
            if (mergedTheme.btnDonateText) root.style.setProperty('--dcvc-btn-donate-text', mergedTheme.btnDonateText);
            if (mergedTheme.navBtnText) root.style.setProperty('--dcvc-nav-text', mergedTheme.navBtnText);
            if (mergedTheme.navBtnActiveBg) root.style.setProperty('--dcvc-nav-active-bg', mergedTheme.navBtnActiveBg);
            if (mergedTheme.navBtnActiveText) root.style.setProperty('--dcvc-nav-active-text', mergedTheme.navBtnActiveText);
            if (mergedTheme.headingFont) root.style.setProperty('--font-display', `'${mergedTheme.headingFont}', sans-serif`);
            if (mergedTheme.bodyFont) root.style.setProperty('--font-sans', `'${mergedTheme.bodyFont}', sans-serif`);
            if (mergedTheme.cardRadius) root.style.setProperty('--dcvc-card-radius', mergedTheme.cardRadius);
            window.dispatchEvent(new CustomEvent('SITE_THEME_UPDATED', { detail: mergedTheme }));
          } catch (err) {
            console.warn('[Sanity Sync] Theme merge skipped:', err.message);
          }
        }
      }

      if (preloadUrls.length > 0) preloadImageUrls(preloadUrls);
      this.saveData(nextData);
      return nextData;
    })();

    return this._syncPromise;
  }

  getSponsors() {
    return this.data.sponsors || sponsorsList || [];
  }

  getTrainings() {
    return this.data.trainings || trainingCourses || [];
  }

  getBoardMembers() {
    const board = (this.data.staff || []).filter((s) => s.category === 'board');
    return board.length > 0 ? board : (boardMembers || []);
  }

  getStaffMembers() {
    const st = (this.data.staff || []).filter((s) => s.category === 'staff');
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
      const parsed = JSON.parse(stored);
      // Ensure all primary collections exist
      return {
        ...INITIAL_CMS_DATA,
        ...parsed,
        settings: { ...INITIAL_CMS_DATA.settings, ...(parsed.settings || {}) },
        programs: parsed.programs || INITIAL_CMS_DATA.programs,
        events: parsed.events || INITIAL_CMS_DATA.events,
        news: parsed.news || INITIAL_CMS_DATA.news,
        resources: parsed.resources || INITIAL_CMS_DATA.resources,
        staff: parsed.staff || INITIAL_CMS_DATA.staff,
        gallery: parsed.gallery || INITIAL_CMS_DATA.gallery,
        memoryLane: parsed.memoryLane || INITIAL_CMS_DATA.memoryLane
      };
    } catch {
      return INITIAL_CMS_DATA;
    }
  }

  saveData(data) {
    this.data = { ...data, lastUpdated: new Date().toISOString() };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(this.data));
      } catch (err) {
        console.warn('[CMS Store] LocalStorage write error:', err);
      }
    }
    this.notify();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dcvc-cms-updated', { detail: this.data }));
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
    return this.data.programs;
  }

  saveProgram(program) {
    const existing = [...this.data.programs];
    const index = existing.findIndex(p => p.slug === program.slug || p.id === program.id);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...program };
    } else {
      const newProgram = {
        ...program,
        id: program.id || `prog-${Date.now()}`,
        slug: program.slug || (program.title || 'new-program').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      };
      existing.unshift(newProgram);
    }
    this.saveData({ ...this.data, programs: existing });
    return existing;
  }

  deleteProgram(slugOrId) {
    const existing = this.data.programs.filter(p => p.slug !== slugOrId && p.id !== slugOrId);
    this.saveData({ ...this.data, programs: existing });
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
      existing[index] = { ...existing[index], ...event };
    } else {
      const newEvent = {
        ...event,
        id: event.id || `evt-${Date.now()}`,
        slug: event.slug || (event.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      };
      existing.unshift(newEvent);
    }
    this.saveData({ ...this.data, events: existing });
    return existing;
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
    const existing = [...this.data.news];
    const index = existing.findIndex(n => n.id === article.id || n.slug === article.slug);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...article };
    } else {
      const newArticle = {
        ...article,
        id: article.id || `news-${Date.now()}`,
        slug: article.slug || (article.title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      };
      existing.unshift(newArticle);
    }
    this.saveData({ ...this.data, news: existing });
    return existing;
  }

  deleteNews(articleId) {
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

  deleteResource(resourceId) {
    const existing = this.data.resources.filter(r => r.id !== resourceId);
    this.saveData({ ...this.data, resources: existing });
    return existing;
  }

  // --------------------------------------------------------------------------
  // Staff & Board Members CRUD
  // --------------------------------------------------------------------------
  getStaff() {
    return this.data.staff;
  }

  saveStaff(member) {
    const existing = [...this.data.staff];
    const index = existing.findIndex(s => s.id === member.id || (s.name === member.name && s.category === member.category));
    if (index >= 0) {
      existing[index] = { ...existing[index], ...member };
    } else {
      const newMember = {
        ...member,
        id: member.id || `staff-${Date.now()}`
      };
      existing.push(newMember);
    }
    this.saveData({ ...this.data, staff: existing });
    return existing;
  }

  deleteStaff(memberId) {
    const existing = this.data.staff.filter(s => s.id !== memberId);
    this.saveData({ ...this.data, staff: existing });
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

  deleteMilestone(year) {
    const existing = this.data.memoryLane.filter(m => m.year !== year);
    this.saveData({ ...this.data, memoryLane: existing });
    return existing;
  }
}

export const cmsStore = new CmsStoreEngine();

