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
  newsArticles,
  galleryPhotos,
  memoryLaneMilestones
} from '../data/dcvcData';

const CMS_STORAGE_KEY = 'dcvc_live_cms_data';

export const INITIAL_CMS_DATA = {
  version: '3.0',
  lastUpdated: new Date().toISOString(),
  settings: {
    name: orgInfo.name || "Diversity Collective Ventura County",
    tagline: orgInfo.tagline || "You Are Always Welcome Here.",
    mission: orgInfo.mission || "Providing advocacy, visibility, safety, and wellness for the LGBTQ+ community.",
    phone: orgInfo.phone || "(805) 644-LGBT (5428)",
    phoneRaw: orgInfo.phoneRaw || "+18056445428",
    email: orgInfo.email || "info@diversitycollective.org",
    address: orgInfo.address?.full || "2471 Portola Road, Suite 100, Ventura, CA 93003",
    hours: orgInfo.hours || "1:00 PM – 5:00 PM Weekdays (Drop-ins & Testing)",
    emergencyCrisisNotice: "24/7 LGBTQ+ Suicide & Crisis Lifeline: Dial 988 or text 'START' to 678-678 (Trevor Project).",
    bannerAlertActive: true,
    bannerAlertText: "Sanctuary Open Today · Mon–Fri 1:00 PM – 5:00 PM · Free HIV/STI Screenings",
    donationUrl: orgInfo.donationUrl || "https://www.diversitycollectivevc.org/get-involved/#donate",
    volunteerUrl: orgInfo.volunteerUrl || "https://www.diversitycollectivevc.org/volunteer/",
    facebook: orgInfo.socials?.facebook || "https://www.facebook.com/diversitycollectivevc",
    instagram: orgInfo.socials?.instagram || "https://www.instagram.com/diversitycollectivevc",
    youtube: orgInfo.socials?.youtube || "https://www.youtube.com/@diversitycollectivevc"
  },
  programs: programsList || [],
  events: liveEvents || [],
  news: newsArticles || [],
  resources: resourcesDirectory || [],
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
    }
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

