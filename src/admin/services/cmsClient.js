/**
 * DCVC Admin Dashboard — Full CMS Client
 * Unified adapter over canonical `cmsStore` (`src/services/cmsStore.js`) + `liveSync`
 * so Admin edits pre-populate directly from the live website, update open tabs
 * in 0ms without page refresh, and persist securely to Cloudflare Worker + Turso.
 */

import { cmsStore } from '../../services/cmsStore.js';
import { normalizeCmsEvent, normalizeCmsEventList } from '../../utils/eventDates.js';
import { publishAdminSitePatch, resetAdminSiteState } from '../../services/liveSync.js';
import { getStoredUser, getStoredToken } from './adminClient.js';

const ADMIN_API_BASE = typeof window !== 'undefined' && window.location.origin
  ? (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || '/api')
  : '/api';

export const DEFAULT_CMS_SEED = cmsStore.getAllData();

export function getLiveCmsData() {
  return cmsStore.getData();
}

export function saveLiveCmsData(data, { publish = true } = {}) {
  const normalized = {
    ...cmsStore.getData(),
    ...data,
    events: normalizeCmsEventList(data.events || cmsStore.getEvents() || []),
    lastUpdated: new Date().toISOString()
  };

  cmsStore.saveData(normalized, { broadcast: !publish });

  if (publish) {
    publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  }

  return cmsStore.getData();
}

export async function resetCmsToDefault() {
  const reset = cmsStore.resetToFactoryDefaults();
  await resetAdminSiteState('cms').catch(() => {});
  return reset;
}

export function saveCmsProgram(program) {
  const list = cmsStore.saveProgram(program);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsProgram(id) {
  const list = cmsStore.deleteProgram(id);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function saveCmsEvent(event) {
  const normalized = normalizeCmsEvent(event);
  const list = cmsStore.saveEvent(normalized);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsEvent(id, extraIdentifiers = []) {
  const list = cmsStore.deleteEvent(id, extraIdentifiers);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function toggleCmsEventCancel(id, notice = '') {
  const list = cmsStore.toggleEventCancellation(id, notice);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export async function saveCmsArticle(article) {
  const list = cmsStore.saveNews(article);
  try {
    const token = getStoredToken();
    const res = await fetch(`${ADMIN_API_BASE}/admin/news`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(article)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || `Server returned ${res.status}`, list };
    }
    return { success: true, article: data.article, list };
  } catch (err) {
    console.warn('[cmsClient] Failed to save article to Turso:', err);
    return { success: false, error: err.message, list };
  }
}

export async function deleteCmsArticle(id) {
  const list = cmsStore.deleteNews(id);
  try {
    const token = getStoredToken();
    const res = await fetch(`${ADMIN_API_BASE}/admin/news/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || `Server returned ${res.status}`, list };
    }
    return { success: true, list };
  } catch (err) {
    console.warn('[cmsClient] Failed to delete article from Turso:', err);
    return { success: false, error: err.message, list };
  }
}

export async function deleteAllCmsArticles() {
  const list = cmsStore.deleteAllNews();
  try {
    const token = getStoredToken();
    const res = await fetch(`${ADMIN_API_BASE}/admin/news`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || `Server returned ${res.status}`, list };
    }
    return { success: true, list };
  } catch (err) {
    console.warn('[cmsClient] Failed to delete all articles from Turso:', err);
    return { success: false, error: err.message, list };
  }
}

export function saveCmsResource(resource) {
  const list = cmsStore.saveResource(resource);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsResource(id) {
  const list = cmsStore.deleteResource(id);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function saveCmsStaff(member) {
  const list = cmsStore.saveStaff(member);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsStaff(id) {
  const list = cmsStore.deleteStaff(id);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function saveCmsGalleryPhoto(photo) {
  const list = cmsStore.saveGalleryPhoto(photo);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsGalleryPhoto(id) {
  const list = cmsStore.deleteGalleryPhoto(id);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function saveCmsMilestone(milestone) {
  const list = cmsStore.saveMilestone(milestone);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsMilestone(year) {
  const list = cmsStore.deleteMilestone(year);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function saveCmsSettings(settingsUpdates) {
  const user = getStoredUser();
  const hasExplicitSettingsAccess = Array.isArray(user?.allowedSections) && user.allowedSections.includes('settings') && user?.role !== 'read_only';
  if (user && user.role && user.role !== 'admin' && !hasExplicitSettingsAccess) {
    throw new Error('Unauthorized: Only administrators with the Admin role can update CRC operating hours and site settings.');
  }
  const updated = cmsStore.saveSettings(settingsUpdates);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return updated;
}

export function saveCmsSponsor(sponsor) {
  const list = cmsStore.saveSponsor(sponsor);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsSponsor(idOrName) {
  const list = cmsStore.deleteSponsor(idOrName);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function saveCmsTraining(training) {
  const list = cmsStore.saveTraining(training);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsTraining(slugOrId) {
  const list = cmsStore.deleteTraining(slugOrId);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function getCmsTrainingPageContent() {
  return cmsStore.getTrainingPageContent();
}

export function saveCmsTrainingPageContent(updates) {
  const updated = cmsStore.saveTrainingPageContent(updates);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return updated;
}

export function saveCmsCommunityGroup(group) {
  const list = cmsStore.saveCommunityGroup(group);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsCommunityGroup(slugOrId) {
  const list = cmsStore.deleteCommunityGroup(slugOrId);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function saveCmsPodcast(podcast) {
  const list = cmsStore.savePodcast(podcast);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsPodcast(slugOrId) {
  const list = cmsStore.deletePodcast(slugOrId);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteAllCmsPodcasts() {
  const list = cmsStore.deleteAllPodcasts();
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function getMediaSuggestions() {
  return cmsStore.getMediaSuggestions();
}

export function saveMediaSuggestion(suggestion) {
  return cmsStore.saveMediaSuggestion(suggestion);
}

export function updateMediaSuggestion(id, patch) {
  const list = cmsStore.updateMediaSuggestion(id, patch);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteMediaSuggestion(id) {
  const list = cmsStore.deleteMediaSuggestion(id);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

// ----------------------------------------------------------------------------
// Sponsorship Document Library & Page Content
// ----------------------------------------------------------------------------
export function getSponsorshipDocuments(includeDrafts = true) {
  return cmsStore.getSponsorshipDocuments(includeDrafts);
}

export function getPublishedSponsorshipDocuments() {
  return cmsStore.getPublishedSponsorshipDocuments();
}

export function saveCmsSponsorshipDocument(doc) {
  const list = cmsStore.saveSponsorshipDocument(doc);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsSponsorshipDocument(id) {
  const list = cmsStore.deleteSponsorshipDocument(id);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function reorderCmsSponsorshipDocuments(orderedIds) {
  const list = cmsStore.reorderSponsorshipDocuments(orderedIds);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function getSponsorshipPageContent() {
  return cmsStore.getSponsorshipPageContent();
}

export function saveCmsSponsorshipPageContent(content) {
  const updated = cmsStore.saveSponsorshipPageContent(content);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return updated;
}
