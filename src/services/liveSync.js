/**
 * DCVC Real-Time Live Sync & Backend Site State Synchronization
 * - BroadcastChannel + localStorage storage events: 0ms instant update across open tabs (no refresh)
 * - Public GET /api/site-state polling & focus refresh: syncs Admin publishes to all visitors
 * - Protected PUT/DELETE /api/admin/site-state: persists changes securely to Cloudflare Worker + Turso
 */

import { DEFAULT_SITE_THEME, normalizePageLayoutBlocks, upgradeOrNormalizePageLayout } from '../data/siteDefaults.js';
import { normalizeCmsEventList } from '../utils/eventDates.js';
import { getStoredToken, getStoredUser } from '../admin/services/adminClient.js';
import { filterSiteStatePatchForUser } from '../admin/permissions.js';

export const STORAGE_KEYS = {
  HERO_THEME: 'dcvc_active_hero_theme',
  LAYOUT: 'dcvc_admin_custom_layout',
  SITE_THEME: 'dcvc_site_theme_settings',
  CMS_DATA: 'dcvc_live_cms_data',
  STATE_META: 'dcvc_site_state_meta',
  SITE_STATUS: 'dcvc_site_status',
  FEATURES: 'dcvc_site_features_v1',
  CARD_THEMES: 'dcvc_card_category_themes'
};

export const SYNC_EVENTS = {
  HERO_CHANGED: 'dcvc_hero_theme_updated',
  LAYOUT_CHANGED: 'dcvc_layout_updated',
  THEME_CHANGED: 'dcvc-site-theme-updated',
  CMS_CHANGED: 'dcvc-cms-updated',
  STATUS_CHANGED: 'dcvc-live-sync-status',
  SITE_STATUS_CHANGED: 'dcvc-site-status-changed',
  FEATURES_CHANGED: 'dcvc-features-updated',
  CARD_THEMES_CHANGED: 'dcvc_card_themes_updated'
};

const CHANNEL_NAME = 'dcvc_live_sync';

export function getApiBase() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
      if (envUrl) {
        return envUrl.replace(/\/+$/, '');
      }
    }
  } catch {
    // Node/SSR test environment
  }
  return '/api';
}

export function getFallbackApiBase() {
  return 'https://dcvc-api.diversity-collective-vc.workers.dev/api';
}

let sharedChannel = null;
function getChannel() {
  if (sharedChannel) return sharedChannel;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
      if (typeof window === 'undefined' && sharedChannel?.unref) {
        sharedChannel.unref();
      }
    } catch {
      sharedChannel = null;
    }
  }
  return sharedChannel;
}

export function getSiteStateMeta() {
  if (typeof localStorage === 'undefined') {
    return { version: 0, updatedAt: null, updatedBy: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATE_META);
    return raw ? JSON.parse(raw) : { version: 0, updatedAt: null, updatedBy: null };
  } catch {
    return { version: 0, updatedAt: null, updatedBy: null };
  }
}

function setSiteStateMeta(meta) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.STATE_META, JSON.stringify(meta));
  } catch {
    // Safe fallback
  }
}

export function hasPublishedSiteState() {
  const meta = getSiteStateMeta();
  return Number(meta?.version || 0) > 0;
}

function notifyWindowEvent(eventName, detail) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

export function broadcastPatch(patch) {
  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage({ type: 'SITE_PATCH', patch, ts: Date.now() });
    } catch {
      // Safe fallback
    }
  }
}

function mergeLiveSyncPrograms(incoming = [], existing = [], deleted = []) {
  const deletedSet = new Set(deleted || []);
  const result = [];
  const seenKeys = new Set();
  const isDeleted = (p) => {
    if (!p || typeof p !== 'object') return true;
    const titleSlug = p.title ? String(p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
    const rawKey = p.slug || p.id || titleSlug;
    const key = rawKey ? String(rawKey).trim() : '';
    return deletedSet.has(key) || 
      (p.slug && deletedSet.has(String(p.slug).trim())) || 
      (p.id && deletedSet.has(String(p.id).trim())) || 
      (titleSlug && deletedSet.has(titleSlug)) ||
      (p.title && deletedSet.has(String(p.title).trim().toLowerCase()));
  };

  for (const p of incoming) {
    if (!p || typeof p !== 'object' || isDeleted(p)) continue;
    const titleSlug = p.title ? String(p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
    const rawKey = p.slug || p.id || titleSlug;
    const key = rawKey ? String(rawKey).trim() : '';
    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({
        ...p,
        slug: p.slug || key,
        id: p.id || `prog-${key}`
      });
    }
  }
  for (const p of existing) {
    if (!p || typeof p !== 'object' || isDeleted(p)) continue;
    const titleSlug = p.title ? String(p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
    const rawKey = p.slug || p.id || titleSlug;
    const key = rawKey ? String(rawKey).trim() : '';
    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({
        ...p,
        slug: p.slug || key,
        id: p.id || `prog-${key}`
      });
    }
  }
  return result;
}

const APPROVED_BOARD_SET = new Set([
  'steve somann',
  'celia sandhya daniels',
  'aj holmes',
  'roland catabona',
  'luis andrade',
  'unique dowtin'
]);

function mergeLiveSyncStaff(incoming = [], existing = [], deleted = []) {
  const deletedSet = new Set(Array.isArray(deleted) ? deleted.map(d => String(d).trim().toLowerCase()) : []);
  const result = [];
  const seenKeys = new Set();
  const seenNames = new Set();

  let overrides = {};
  try {
    if (typeof localStorage !== 'undefined') {
      overrides = JSON.parse(localStorage.getItem('dcvc_staff_image_overrides') || '{}') || {};
    }
  } catch {}

  const findExistingMatch = (s) => {
    if (!s) return null;
    const name = String(s.name || '').trim().toLowerCase();
    const id = s.id ? String(s.id).trim().toLowerCase() : '';
    const slug = s.slug ? String(s.slug).trim().toLowerCase() : '';
    return existing.find((e) => {
      if (!e) return false;
      const eName = String(e.name || '').trim().toLowerCase();
      const eId = e.id ? String(e.id).trim().toLowerCase() : '';
      const eSlug = e.slug ? String(e.slug).trim().toLowerCase() : '';
      return (name && eName === name) || (id && eId === id) || (slug && eSlug === slug);
    });
  };

  const processList = (list, isIncoming = false) => {
    for (const s of list) {
      if (!s || typeof s !== 'object') continue;
      const name = String(s.name || '').trim().toLowerCase();
      const nameSlug = name.replace(/[^a-z0-9]+/g, '-');
      const rawKey = s.id || s.slug || nameSlug;
      const key = rawKey ? String(rawKey).trim().toLowerCase() : '';

      // Filter unapproved legacy members
      if (s.category === 'board' && name === 'tess allen') {
        continue;
      }

      if (
        (key && deletedSet.has(key)) ||
        (s.id && deletedSet.has(String(s.id).toLowerCase())) ||
        (name && deletedSet.has(name)) ||
        (nameSlug && deletedSet.has(nameSlug)) ||
        (nameSlug && deletedSet.has(`staff-${nameSlug}`)) ||
        (nameSlug && deletedSet.has(`board-${nameSlug}`))
      ) {
        continue;
      }

      if ((key && seenKeys.has(key)) || (name && seenNames.has(name))) {
        continue;
      }

      if (key) seenKeys.add(key);
      if (name) seenNames.add(name);
      if (s.id) seenKeys.add(String(s.id).trim().toLowerCase());
      if (nameSlug) seenKeys.add(nameSlug);

      // Check for user-uploaded custom photo override
      const overridePhoto = overrides[name] || overrides[nameSlug] || (s.id && overrides[String(s.id).toLowerCase()]);

      // If incoming from server, check if local existing record had an edited photo or bio
      const existingMatch = isIncoming ? findExistingMatch(s) : null;
      const localPhoto = existingMatch ? (existingMatch.photo || existingMatch.image) : null;

      // Authoritative server photo and explicit override take precedence over stale cached localPhoto
      const effectivePhoto = overridePhoto || (s.photo || s.image) || localPhoto || '/images/volunteers.jpg';
      const effectiveBio = (existingMatch && existingMatch.bio && existingMatch.bio !== s.bio) ? existingMatch.bio : s.bio;

      result.push({
        ...(existingMatch || {}),
        ...s,
        bio: effectiveBio || s.bio || '',
        id: s.id || key,
        photo: effectivePhoto,
        image: effectivePhoto
      });
    }
  };

  processList(incoming, true);
  processList(existing, false);
  return result;
}

export function applySiteStatePayload(state, { broadcast = false } = {}) {
  if (!state || typeof state !== 'object') return;

  if (typeof state.heroTheme === 'string' && state.heroTheme.trim()) {
    const nextHero = state.heroTheme.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.HERO_THEME, nextHero);
    }
    notifyWindowEvent(SYNC_EVENTS.HERO_CHANGED, { themeId: nextHero });
  }

  if (Array.isArray(state.layoutBlocks) && state.layoutBlocks.length > 0) {
    const normalized = upgradeOrNormalizePageLayout(state.layoutBlocks);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAYOUT, JSON.stringify(normalized));
    }
    notifyWindowEvent(SYNC_EVENTS.LAYOUT_CHANGED, { blocks: normalized });
  }

  if (state.siteTheme && typeof state.siteTheme === 'object') {
    const mergedTheme = { ...DEFAULT_SITE_THEME, ...state.siteTheme };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SITE_THEME, JSON.stringify(mergedTheme));
    }
    notifyWindowEvent(SYNC_EVENTS.THEME_CHANGED, mergedTheme);
  }

  if (state.cmsData && typeof state.cmsData === 'object') {
    let existing = {};
    if (typeof localStorage !== 'undefined') {
      try {
        existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.CMS_DATA) || '{}') || {};
      } catch {
        existing = {};
      }
    }
    const hasIncomingPrograms = Array.isArray(state.cmsData.programs);
    const incomingPrograms = hasIncomingPrograms ? state.cmsData.programs : (existing.programs || []);
    const existingPrograms = hasIncomingPrograms ? [] : (Array.isArray(existing.programs) ? existing.programs : []);
    const deletedSlugs = Array.isArray(state.cmsData.deletedPrograms)
      ? state.cmsData.deletedPrograms
      : Array.from(new Set([...(state.cmsData.deletedPrograms || []), ...(existing.deletedPrograms || [])]));
    const mergedPrograms = mergeLiveSyncPrograms(incomingPrograms, existingPrograms, deletedSlugs);

    const incomingStaff = Array.isArray(state.cmsData.staff) ? state.cmsData.staff : (existing.staff || []);
    const existingStaff = Array.isArray(existing.staff) ? existing.staff : [];
    const deletedStaff = Array.isArray(state.cmsData.deletedStaff)
      ? state.cmsData.deletedStaff
      : Array.from(new Set([...(state.cmsData.deletedStaff || []), ...(existing.deletedStaff || [])]));
    const mergedStaff = mergeLiveSyncStaff(incomingStaff, existingStaff, deletedStaff);

    // Reconcile and propagate custom uploaded staff headshots across domains
    if (state.cmsData.staffImageOverrides && typeof state.cmsData.staffImageOverrides === 'object') {
      try {
        if (typeof localStorage !== 'undefined') {
          const current = JSON.parse(localStorage.getItem('dcvc_staff_image_overrides') || '{}') || {};
          const mergedOverrides = { ...current, ...state.cmsData.staffImageOverrides };
          localStorage.setItem('dcvc_staff_image_overrides', JSON.stringify(mergedOverrides));
        }
      } catch (e) {
        // Ignore quota
      }
    }

    const deletedPodcastsList = Array.from(new Set([
      ...(existing.deletedPodcasts || []),
      ...(Array.isArray(state.cmsData.deletedPodcasts) ? state.cmsData.deletedPodcasts : [])
    ]));
    const deletedPodcastsSet = new Set(deletedPodcastsList.map(x => String(x).toLowerCase().trim()));

    const deletedNewsList = Array.from(new Set([
      ...(existing.deletedNews || []),
      ...(Array.isArray(state.cmsData.deletedNews) ? state.cmsData.deletedNews : [])
    ]));
    const deletedNewsSet = new Set(deletedNewsList.map(x => String(x).toLowerCase().trim()));

    const deletedResourcesList = Array.from(new Set([
      ...(existing.deletedResources || []),
      ...(Array.isArray(state.cmsData.deletedResources) ? state.cmsData.deletedResources : [])
    ]));
    const deletedResourcesSet = new Set(deletedResourcesList.map(x => String(x).toLowerCase().trim()));

    const deletedSponsorshipDocsList = Array.from(new Set([
      ...(existing.deletedSponsorshipDocuments || []),
      ...(Array.isArray(state.cmsData.deletedSponsorshipDocuments) ? state.cmsData.deletedSponsorshipDocuments : [])
    ]));
    const deletedSponsorshipDocsSet = new Set(deletedSponsorshipDocsList.map(x => String(x).toLowerCase().trim()));

    const deletedCommunityGroupsList = Array.from(new Set([
      ...(existing.deletedCommunityGroups || []),
      ...(Array.isArray(state.cmsData.deletedCommunityGroups) ? state.cmsData.deletedCommunityGroups : [])
    ]));
    const deletedCommunityGroupsSet = new Set(deletedCommunityGroupsList.map(x => String(x).toLowerCase().trim()));

    const mergedCms = {
      ...existing,
      ...state.cmsData,
      programs: mergedPrograms,
      deletedPrograms: deletedSlugs,
      staff: mergedStaff,
      deletedStaff: deletedStaff,
      podcasts: (Array.isArray(state.cmsData.podcasts) ? state.cmsData.podcasts : (existing.podcasts || [])).filter(p => {
        const id = p?.id ? String(p.id).toLowerCase().trim() : '';
        const slug = p?.slug ? String(p.slug).toLowerCase().trim() : '';
        return (!id || !deletedPodcastsSet.has(id)) && (!slug || !deletedPodcastsSet.has(slug));
      }),
      deletedPodcasts: deletedPodcastsList,
      news: (Array.isArray(state.cmsData.news) ? state.cmsData.news : (existing.news || [])).filter(n => {
        const id = n?.id ? String(n.id).toLowerCase().trim() : '';
        const slug = n?.slug ? String(n.slug).toLowerCase().trim() : '';
        return (!id || !deletedNewsSet.has(id)) && (!slug || !deletedNewsSet.has(slug));
      }),
      deletedNews: deletedNewsList,
      resources: (Array.isArray(state.cmsData.resources) ? state.cmsData.resources : (existing.resources || [])).filter(r => {
        const id = r?.id ? String(r.id).toLowerCase().trim() : '';
        return !id || !deletedResourcesSet.has(id);
      }),
      deletedResources: deletedResourcesList,
      sponsorshipDocuments: (Array.isArray(state.cmsData.sponsorshipDocuments) ? state.cmsData.sponsorshipDocuments : (existing.sponsorshipDocuments || [])).filter(d => {
        const id = d?.id ? String(d.id).toLowerCase().trim() : '';
        return !id || !deletedSponsorshipDocsSet.has(id);
      }),
      deletedSponsorshipDocuments: deletedSponsorshipDocsList,
      communityGroups: (Array.isArray(state.cmsData.communityGroups) ? state.cmsData.communityGroups : (existing.communityGroups || [])).filter(g => {
        const id = g?.id ? String(g.id).toLowerCase().trim() : '';
        const slug = g?.slug ? String(g.slug).toLowerCase().trim() : '';
        return (!id || !deletedCommunityGroupsSet.has(id)) && (!slug || !deletedCommunityGroupsSet.has(slug));
      }),
      deletedCommunityGroups: deletedCommunityGroupsList,
      businesses: Array.isArray(state.cmsData.businesses) ? state.cmsData.businesses : (existing.businesses || []),
      weeklySchedule: Array.isArray(state.cmsData.weeklySchedule) ? state.cmsData.weeklySchedule : (existing.weeklySchedule || []),
      settings: { ...(existing.settings || {}), ...(state.cmsData.settings || {}) }
    };
    if (Array.isArray(mergedCms.events)) {
      mergedCms.events = normalizeCmsEventList(mergedCms.events);
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.CMS_DATA, JSON.stringify(mergedCms));
      } catch (err) {
        console.warn('[LiveSync] LocalStorage write error (CMS_DATA quota):', err);
      }
    }
    notifyWindowEvent(SYNC_EVENTS.CMS_CHANGED, mergedCms);
  }

  if (state.siteStatus && typeof state.siteStatus === 'object') {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.SITE_STATUS, JSON.stringify(state.siteStatus));
      } catch (err) {
        console.warn('[LiveSync] LocalStorage write error (SITE_STATUS quota):', err);
      }
    }
    notifyWindowEvent(SYNC_EVENTS.SITE_STATUS_CHANGED, state.siteStatus);
  }

  if (state.siteFeatures && typeof state.siteFeatures === 'object') {
    if (typeof localStorage !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEATURES) || '{}') || {};
        const merged = { ...existing, ...state.siteFeatures };
        localStorage.setItem(STORAGE_KEYS.FEATURES, JSON.stringify(merged));
      } catch {
        try {
          localStorage.setItem(STORAGE_KEYS.FEATURES, JSON.stringify(state.siteFeatures));
        } catch (err) {
          console.warn('[LiveSync] LocalStorage write error (FEATURES quota):', err);
        }
      }
    }
    notifyWindowEvent(SYNC_EVENTS.FEATURES_CHANGED, state.siteFeatures);
  }

  if (state.cardThemes && typeof state.cardThemes === 'object') {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.CARD_THEMES, JSON.stringify(state.cardThemes));
      } catch (err) {
        console.warn('[LiveSync] LocalStorage write error (CARD_THEMES quota):', err);
      }
    }
    notifyWindowEvent(SYNC_EVENTS.CARD_THEMES_CHANGED, state.cardThemes);
  }

  if (broadcast) {
    broadcastPatch(state);
  }
}

let inFlightFetch = null;

export async function fetchAndApplyLiveSiteState({ force = false } = {}) {
  if (typeof fetch === 'undefined') return null;
  if (inFlightFetch && !force) return inFlightFetch;

  inFlightFetch = (async () => {
    try {
      const meta = getSiteStateMeta();
      const sinceQuery = !force && meta?.version ? `?sinceVersion=${Number(meta.version)}` : '';
      let res = null;
      try {
        res = await fetch(`${getApiBase()}/site-state${sinceQuery}`, {
          method: 'GET',
          cache: 'no-store'
        });
      } catch (e) {
        // Fallback retry
      }

      if (!res || !res.ok) {
        const fallbackBase = getFallbackApiBase();
        if (getApiBase() !== fallbackBase) {
          try {
            res = await fetch(`${fallbackBase}/site-state${sinceQuery}`, {
              method: 'GET',
              cache: 'no-store'
            });
          } catch (e) {}
        }
      }

      if (!res || !res.ok) return null;
      const data = await res.json().catch(() => null);
      if (!data?.success) return null;

      if (data.unchanged) {
        return { version: data.version, unchanged: true };
      }

      if (Number(data.version || 0) > 0 && data.state && typeof data.state === 'object') {
        setSiteStateMeta({
          version: Number(data.version),
          updatedAt: data.updatedAt || new Date().toISOString(),
          updatedBy: data.updatedBy || null
        });
        applySiteStatePayload(data.state, { broadcast: false });
        notifyWindowEvent(SYNC_EVENTS.STATUS_CHANGED, {
          status: 'synced',
          version: data.version,
          updatedAt: data.updatedAt
        });
      }
      return data;
    } catch {
      return null;
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

function getAdminSessionToken() {
  // Always purge any tokens that may have been accidentally written to storage (security hardening)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('dcvc_admin_token');
      localStorage.removeItem('dcvc_admin_token');
    } catch {}
  }
  // Use the in-memory token managed by adminClient.js (set via setStoredToken on login)
  return getStoredToken() || null;
}

export async function publishAdminSitePatch(patch) {
  // 1. Instant local & cross-tab apply (0ms live feedback)
  applySiteStatePayload(patch, { broadcast: true });
  notifyWindowEvent(SYNC_EVENTS.STATUS_CHANGED, { status: 'saving' });

  if (typeof fetch === 'undefined') {
    return { success: true, syncedToServer: false, localOnly: true };
  }

  // Include local staff image overrides in outgoing CMS patch so other domains receive them
  let effectivePatch = patch;
  if (patch && patch.cmsData && typeof patch.cmsData === 'object') {
    let localOverrides = {};
    try {
      if (typeof localStorage !== 'undefined') {
        localOverrides = JSON.parse(localStorage.getItem('dcvc_staff_image_overrides') || '{}') || {};
      }
    } catch {}
    effectivePatch = {
      ...patch,
      cmsData: {
        ...patch.cmsData,
        staffImageOverrides: {
          ...(patch.cmsData.staffImageOverrides || {}),
          ...localOverrides
        }
      }
    };
  }

  // Include card category themes in outgoing patch if not explicitly overridden
  if (!effectivePatch.cardThemes && typeof localStorage !== 'undefined') {
    try {
      const storedThemes = localStorage.getItem(STORAGE_KEYS.CARD_THEMES);
      if (storedThemes) {
        effectivePatch = {
          ...effectivePatch,
          cardThemes: JSON.parse(storedThemes)
        };
      }
    } catch {}
  }

  const token = getAdminSessionToken();
  const currentUser = getStoredUser();

  if (currentUser && currentUser.role !== 'admin' && Array.isArray(currentUser.allowedSections)) {
    effectivePatch = filterSiteStatePatchForUser(effectivePatch, currentUser);
    if (!effectivePatch || Object.keys(effectivePatch).length === 0) {
      notifyWindowEvent(SYNC_EVENTS.STATUS_CHANGED, { status: 'error', error: 'Permission denied for this section.' });
      return { success: false, syncedToServer: false, forbidden: true, error: 'Forbidden: You do not have permission to edit this section.' };
    }
  }

  try {
    let res = null;
    try {
      res = await fetch(`${getApiBase()}/admin/site-state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(effectivePatch)
      });
    } catch (e) {
      // Primary fetch failed, try fallback
    }

    if (!res || (!res.ok && (res.status === 404 || res.status >= 500))) {
      const fallbackBase = getFallbackApiBase();
      if (getApiBase() !== fallbackBase) {
        try {
          res = await fetch(`${fallbackBase}/admin/site-state`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            credentials: 'include',
            body: JSON.stringify(effectivePatch)
          });
        } catch (e) {}
      }
    }

    const data = res ? await res.json().catch(() => ({})) : {};
    if (res && res.ok && data.success) {
      setSiteStateMeta({
        version: Number(data.version || 1),
        updatedAt: data.updatedAt || new Date().toISOString(),
        updatedBy: data.updatedBy || null
      });
      // Notify sibling tabs about new server version too
      const ch = getChannel();
      if (ch) {
        try {
          ch.postMessage({
            type: 'SITE_VERSION',
            version: data.version,
            updatedAt: data.updatedAt
          });
        } catch {
          // Ignore
        }
      }
      notifyWindowEvent(SYNC_EVENTS.STATUS_CHANGED, {
        status: 'synced',
        version: data.version,
        updatedAt: data.updatedAt
      });
      return {
        success: true,
        syncedToServer: true,
        version: data.version,
        updatedAt: data.updatedAt
      };
    }

    const errMsg = data?.error || `Server returned ${res.status}`;
    console.warn('[LiveSync] Failed to publish site patch to backend:', errMsg, res.status);
    notifyWindowEvent(SYNC_EVENTS.STATUS_CHANGED, { status: res.status === 401 ? 'unauthorized' : 'local_only', error: errMsg });
    return { success: false, syncedToServer: false, localSaved: true, error: errMsg };
  } catch (err) {
    const errMsg = err?.message || 'Network unavailable';
    console.warn('[LiveSync] Network exception publishing site patch:', errMsg);
    notifyWindowEvent(SYNC_EVENTS.STATUS_CHANGED, { status: 'local_only', error: errMsg });
    return { success: false, syncedToServer: false, localSaved: true, error: errMsg };
  }
}

export async function resetAdminSiteState(scope = 'all') {
  const token = getAdminSessionToken();
  const currentUser = getStoredUser();

  if (currentUser && currentUser.role !== 'admin' && Array.isArray(currentUser.allowedSections)) {
    effectivePatch = filterSiteStatePatchForUser(effectivePatch, currentUser);
    if (!effectivePatch || Object.keys(effectivePatch).length === 0) {
      notifyWindowEvent(SYNC_EVENTS.STATUS_CHANGED, { status: 'error', error: 'Permission denied for this section.' });
      return { success: false, syncedToServer: false, forbidden: true, error: 'Forbidden: You do not have permission to edit this section.' };
    }
  }

  if (typeof localStorage !== 'undefined') {
    if (scope === 'all' || scope === 'hero') localStorage.removeItem(STORAGE_KEYS.HERO_THEME);
    if (scope === 'all' || scope === 'layout') localStorage.removeItem(STORAGE_KEYS.LAYOUT);
    if (scope === 'all' || scope === 'theme') localStorage.removeItem(STORAGE_KEYS.SITE_THEME);
    if (scope === 'all' || scope === 'cms') localStorage.removeItem(STORAGE_KEYS.CMS_DATA);
  }

  let serverResult = null;
  if (typeof fetch !== 'undefined') {
    try {
      const res = await fetch(
        `${getApiBase()}/admin/site-state?scope=${encodeURIComponent(scope)}`,
        {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include'
        }
      );
      serverResult = await res.json().catch(() => null);
      if (res.ok && serverResult?.success) {
        setSiteStateMeta({
          version: Number(serverResult.version || 0),
          updatedAt: serverResult.updatedAt || new Date().toISOString(),
          updatedBy: serverResult.updatedBy || null
        });
      }
    } catch {
      // Best-effort
    }
  }

  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage({ type: 'SITE_RESET', scope, ts: Date.now() });
    } catch {
      // Ignore
    }
  }

  return serverResult;
}

export function applySiteThemeToDOM(theme) {
  if (typeof document === 'undefined' || !theme) return;
  const merged = { ...DEFAULT_SITE_THEME, ...theme };
  const root = document.documentElement;

  root.style.setProperty('--dcvc-btn-primary-bg', merged.btnPrimaryBgGradient || merged.btnPrimaryBg);
  root.style.setProperty('--dcvc-btn-primary-text', merged.btnPrimaryText);
  root.style.setProperty('--dcvc-btn-primary-hover', merged.btnPrimaryHoverBg);
  root.style.setProperty('--dcvc-btn-radius', merged.btnPrimaryRadius);

  root.style.setProperty('--dcvc-btn-secondary-bg', merged.btnSecondaryBg);
  root.style.setProperty('--dcvc-btn-secondary-text', merged.btnSecondaryText);
  root.style.setProperty('--dcvc-btn-secondary-border', merged.btnSecondaryBorder);

  root.style.setProperty('--dcvc-btn-donate-bg', merged.btnDonateBg);
  root.style.setProperty('--dcvc-btn-donate-text', merged.btnDonateText);

  root.style.setProperty('--dcvc-nav-text', merged.navBtnText || '#000000');
  root.style.setProperty('--dcvc-nav-active-bg', merged.navBtnActiveBg || merged.btnPrimaryBg || '#5A1E65');
  root.style.setProperty('--dcvc-nav-active-text', merged.navBtnActiveText || '#FFFFFF');

  if (merged.headingFont) {
    root.style.setProperty('--font-display', `'${merged.headingFont}', sans-serif`);
  }
  if (merged.bodyFont) {
    root.style.setProperty('--font-sans', `'${merged.bodyFont}', sans-serif`);
  }
  const fontScale = Math.max(0.85, Math.min(1.25, Number(merged.fontScale) || 1));
  root.style.setProperty('--dcvc-font-scale', String(fontScale));
  root.style.fontSize = `${(16 * fontScale).toFixed(2)}px`;
  root.style.setProperty('--dcvc-card-radius', merged.cardRadius);
}

/**
 * Subscribe to live synchronization inside AppLayout.
 * Ensures public tabs AND admin tabs reflect updates instantaneously without page reload.
 */
export function initLiveSiteSync({ onThemeApply, intervalMs = 3000 } = {}) {
  if (typeof window === 'undefined') return () => {};

  const applyLatestTheme = (themeObj) => {
    if (typeof onThemeApply === 'function' && themeObj) {
      onThemeApply({ ...DEFAULT_SITE_THEME, ...themeObj });
    }
  };

  // Apply stored theme immediately if present
  try {
    const rawTheme = localStorage.getItem(STORAGE_KEYS.SITE_THEME);
    if (rawTheme) {
      applyLatestTheme(JSON.parse(rawTheme));
    }
  } catch {
    // Ignore
  }

  // Hydrate latest authoritative server state right away
  fetchAndApplyLiveSiteState({ force: true });

  const handleStorage = (e) => {
    if (e.key === STORAGE_KEYS.HERO_THEME && e.newValue) {
      notifyWindowEvent(SYNC_EVENTS.HERO_CHANGED, { themeId: e.newValue });
    } else if (e.key === STORAGE_KEYS.LAYOUT && e.newValue) {
      try {
        notifyWindowEvent(SYNC_EVENTS.LAYOUT_CHANGED, {
          blocks: normalizePageLayoutBlocks(JSON.parse(e.newValue))
        });
      } catch {
        // Ignore
      }
    } else if (e.key === STORAGE_KEYS.SITE_THEME && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        applyLatestTheme(parsed);
        notifyWindowEvent(SYNC_EVENTS.THEME_CHANGED, parsed);
      } catch {
        // Ignore
      }
    } else if (e.key === STORAGE_KEYS.CMS_DATA && e.newValue) {
      try {
        notifyWindowEvent(SYNC_EVENTS.CMS_CHANGED, JSON.parse(e.newValue));
      } catch {
        // Ignore
      }
    } else if (e.key === STORAGE_KEYS.SITE_STATUS && e.newValue) {
      try {
        notifyWindowEvent(SYNC_EVENTS.SITE_STATUS_CHANGED, JSON.parse(e.newValue));
      } catch {
        // Ignore
      }
    } else if (e.key === STORAGE_KEYS.CARD_THEMES && e.newValue) {
      try {
        notifyWindowEvent(SYNC_EVENTS.CARD_THEMES_CHANGED, JSON.parse(e.newValue));
      } catch {
        // Ignore
      }
    }
  };

  const handleThemeEvent = (e) => {
    if (e?.detail) applyLatestTheme(e.detail);
  };

  const channel = getChannel();
  const handleChannelMessage = (event) => {
    const msg = event?.data;
    if (!msg) return;
    if (msg.type === 'SITE_PATCH' && msg.patch) {
      applySiteStatePayload(msg.patch, { broadcast: false });
      if (msg.patch.siteTheme) {
        applyLatestTheme(msg.patch.siteTheme);
      }
      if (msg.patch.siteStatus) {
        notifyWindowEvent(SYNC_EVENTS.SITE_STATUS_CHANGED, msg.patch.siteStatus);
      }
      if (msg.patch.cardThemes) {
        notifyWindowEvent(SYNC_EVENTS.CARD_THEMES_CHANGED, msg.patch.cardThemes);
      }
    } else if (msg.type === 'SITE_VERSION') {
      fetchAndApplyLiveSiteState();
    } else if (msg.type === 'SITE_RESET') {
      if (msg.scope === 'all' || msg.scope === 'theme') {
        applyLatestTheme(DEFAULT_SITE_THEME);
        notifyWindowEvent(SYNC_EVENTS.THEME_CHANGED, DEFAULT_SITE_THEME);
      }
      if (msg.scope === 'all' || msg.scope === 'hero') {
        notifyWindowEvent(SYNC_EVENTS.HERO_CHANGED, { themeId: 'aurora' });
      }
      if (msg.scope === 'all' || msg.scope === 'layout') {
        notifyWindowEvent(SYNC_EVENTS.LAYOUT_CHANGED, {
          blocks: normalizePageLayoutBlocks(null)
        });
      }
      if (msg.scope === 'all' || msg.scope === 'cms') {
        fetchAndApplyLiveSiteState({ force: true });
      }
    }
  };

  const handleFocusOrVisible = () => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      fetchAndApplyLiveSiteState();
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(SYNC_EVENTS.THEME_CHANGED, handleThemeEvent);
  window.addEventListener('focus', handleFocusOrVisible);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleFocusOrVisible);
  }
  if (channel) {
    channel.addEventListener('message', handleChannelMessage);
  }

  const timer =
    intervalMs > 0
      ? window.setInterval(() => {
          if (typeof document === 'undefined' || document.visibilityState === 'visible') {
            fetchAndApplyLiveSiteState();
          }
        }, intervalMs)
      : null;

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(SYNC_EVENTS.THEME_CHANGED, handleThemeEvent);
    window.removeEventListener('focus', handleFocusOrVisible);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    }
    if (channel) {
      channel.removeEventListener('message', handleChannelMessage);
    }
    if (timer) window.clearInterval(timer);
  };
}
