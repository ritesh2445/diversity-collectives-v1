/**
 * DCVC Admin Dashboard — Full CMS Client
 * Unified adapter over canonical `cmsStore` (`src/services/cmsStore.js`) + `liveSync`
 * so Admin edits pre-populate directly from the live website, update open tabs
 * in 0ms without page refresh, and persist securely to Cloudflare Worker + Turso.
 */

import { cmsStore } from '../../services/cmsStore.js';
import { normalizeCmsEvent, normalizeCmsEventList } from '../../utils/eventDates.js';
import { publishAdminSitePatch, resetAdminSiteState } from '../../services/liveSync.js';

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

export function deleteCmsEvent(id) {
  const list = cmsStore.deleteEvent(id);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function toggleCmsEventCancel(id, notice = '') {
  const list = cmsStore.toggleEventCancellation(id, notice);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function saveCmsArticle(article) {
  const list = cmsStore.saveNews(article);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
}

export function deleteCmsArticle(id) {
  const list = cmsStore.deleteNews(id);
  publishAdminSitePatch({ cmsData: cmsStore.getData() }).catch(() => {});
  return list;
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
