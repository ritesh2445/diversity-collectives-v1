/**
 * DCVC Admin Panel — Granular Section-Level Permissions Helpers
 * Matches worker/src/sectionPermissions.js for UI filtering, automatic routing,
 * and client-side patch scoping. (Authoritative enforcement runs server-side.)
 */

export const ADMIN_SECTIONS = [
  { id: 'community', label: 'Community Groups', group: 'Website Content (CMS)', desc: 'Edit circles, announcements, stories, members & broadcasts' },
  { id: 'programs', label: 'Programs & Clinical Care', group: 'Website Content (CMS)', desc: 'Create and edit programs & clinical info' },
  { id: 'events', label: 'Events & Calendar', group: 'Website Content (CMS)', desc: 'Manage calendar events & weekly schedule' },
  { id: 'trainings', label: 'P.R.I.D.E. Trainings', group: 'Website Content (CMS)', desc: 'Manage training courses & accreditation page' },
  { id: 'sponsors', label: 'Sponsors & Documents', group: 'Website Content (CMS)', desc: 'Manage corporate partners & sponsorship PDFs' },
  { id: 'podcasts', label: 'Podcasts & Media', group: 'Website Content (CMS)', desc: 'Manage podcast episodes & media suggestions' },
  { id: 'news', label: 'News & Articles', group: 'Website Content (CMS)', desc: 'Publish news stories & press announcements' },
  { id: 'resources', label: 'Community Resources', group: 'Website Content (CMS)', desc: 'Manage regional LGBTQ+ resource listings' },
  { id: 'board_staff', label: 'Board & Operational Staff', group: 'Website Content (CMS)', desc: 'Edit Board of Directors & operational staff bios/photos' },
  { id: 'gallery', label: 'Photo Gallery & Memory Lane', group: 'Media & Content', desc: 'Upload gallery photos & timeline milestones' },
  { id: 'settings', label: 'Global Site Settings', group: 'Website Content (CMS)', desc: 'Edit org hours, emergency banners, themes & AI knowledge' },
  { id: 'hero', label: 'Homepage & Hero Design', group: 'Design & Layout', desc: 'Customize hero themes, copy & homepage section layout' },
  { id: 'appearance', label: 'Colors, Fonts & Card Order', group: 'Design & Layout', desc: 'Modify global palette, fonts & card order' },
  { id: 'features', label: 'Forms, Slots & Popups', group: 'Operations & Directory', desc: 'Configure forms builder, flex space, HIV slots & popups' },
  { id: 'donations', label: 'Donations & Email Template', group: 'Operations & Directory', desc: 'Manage Zeffy links, donor thank-you emails & manual gifts' },
  { id: 'directory', label: 'Business Directory', group: 'Operations & Directory', desc: 'Approve, edit & moderate business directory listings' },
  { id: 'inquiries', label: 'Inquiries, Voicemails & Newsletter', group: 'Operations & Directory', desc: 'View form submissions, voicemails & send newsletters' },
  { id: 'status', label: 'Site Status & Countdown', group: 'System', desc: 'Manage live site banner & maintenance timer' }
];

export const ALL_SECTION_IDS = new Set(ADMIN_SECTIONS.map((s) => s.id));
export const SECTION_LABELS = Object.fromEntries(ADMIN_SECTIONS.map((s) => [s.id, s.label]));

export const CMS_SUBTAB_TO_SECTION = {
  programs: 'programs',
  community: 'community',
  events: 'events',
  weeklySchedule: 'events',
  trainings: 'trainings',
  sponsors: 'sponsors',
  sponsorshipDocs: 'sponsors',
  podcasts: 'podcasts',
  news: 'news',
  resources: 'resources',
  cardThemes: 'settings',
  board: 'board_staff',
  staff: 'board_staff',
  gallery: 'gallery',
  settings: 'settings'
};

export const CMS_SECTIONS_LIST = [
  'programs',
  'community',
  'events',
  'trainings',
  'sponsors',
  'podcasts',
  'news',
  'resources',
  'board_staff',
  'gallery',
  'settings'
];

export const CMS_KEY_TO_SECTION = {
  programs: 'programs',
  deletedPrograms: 'programs',
  communityGroups: 'community',
  deletedCommunityGroups: 'community',
  events: 'events',
  deletedEvents: 'events',
  weeklySchedule: 'events',
  trainings: 'trainings',
  trainingPageContent: 'trainings',
  sponsors: 'sponsors',
  sponsorshipDocuments: 'sponsors',
  deletedSponsorshipDocuments: 'sponsors',
  sponsorshipPageContent: 'sponsors',
  podcasts: 'podcasts',
  deletedPodcasts: 'podcasts',
  mediaSuggestions: 'podcasts',
  news: 'news',
  deletedNews: 'news',
  resources: 'resources',
  deletedResources: 'resources',
  staff: 'board_staff',
  deletedStaff: 'board_staff',
  staffImageOverrides: 'board_staff',
  gallery: 'gallery',
  memoryLane: 'gallery',
  settings: 'settings',
  imageOverrides: 'settings',
  customKnowledge: 'settings',
  testimonials: 'settings',
  businesses: 'directory',
  deletedBusinesses: 'directory'
};

export function isSectionRestrictedUser(user) {
  return Boolean(user && user.role !== 'admin' && Array.isArray(user.allowedSections));
}

export function canAccessSection(user, sectionId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!Array.isArray(user.allowedSections)) return true; // Legacy role-wide access
  return user.allowedSections.includes(sectionId);
}

export function canAccessCmsSubTab(user, subTabId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!Array.isArray(user.allowedSections)) return true;
  const required = CMS_SUBTAB_TO_SECTION[subTabId];
  return required ? user.allowedSections.includes(required) : false;
}

export function canAccessInboxSubTab(user, inboxSubTabId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!Array.isArray(user.allowedSections)) return true;
  const allowed = new Set(user.allowedSections);
  if (inboxSubTabId === 'directory') return allowed.has('directory');
  if (inboxSubTabId === 'suggestions') return allowed.has('inquiries') || allowed.has('podcasts');
  if (['inquiries', 'voicemail', 'newsletter'].includes(inboxSubTabId)) return allowed.has('inquiries');
  return false;
}

export function canAccessAdminTab(user, tabId) {
  if (!user) return false;
  if (tabId === 'security' || tabId === 'logs') return true; // Every authenticated staff member keeps access to personal security & activity logs
  if (user.role === 'admin') return true;
  if (!Array.isArray(user.allowedSections)) return true;

  const allowed = new Set(user.allowedSections);
  switch (tabId) {
    case 'hero':
      return allowed.has('hero');
    case 'appearance':
      return allowed.has('appearance');
    case 'cms':
      return CMS_SECTIONS_LIST.some((sec) => allowed.has(sec));
    case 'sponsorships':
      return allowed.has('sponsors');
    case 'features':
      return allowed.has('features');
    case 'donations':
      return allowed.has('donations');
    case 'inbox':
      return allowed.has('directory') || allowed.has('inquiries') || allowed.has('podcasts');
    case 'gallery':
      return allowed.has('gallery');
    case 'status':
      return allowed.has('status');
    default:
      return false;
  }
}

export function getFirstAllowedAdminTab(user) {
  const ordered = ['hero', 'cms', 'sponsorships', 'inbox', 'gallery', 'donations', 'features', 'appearance', 'status', 'security'];
  for (const tab of ordered) {
    if (canAccessAdminTab(user, tab)) return tab;
  }
  return 'security';
}

export function getFirstAllowedCmsSubTab(user) {
  const ordered = ['programs', 'community', 'events', 'weeklySchedule', 'trainings', 'sponsors', 'sponsorshipDocs', 'podcasts', 'news', 'resources', 'board', 'staff', 'gallery', 'cardThemes', 'settings'];
  for (const sub of ordered) {
    if (canAccessCmsSubTab(user, sub)) return sub;
  }
  return null;
}

export function canAccessQuickSearchItem(user, tab, subTab) {
  if (!user || user.role === 'admin' || !Array.isArray(user.allowedSections)) return true;
  if (tab === 'cms' && subTab) return canAccessCmsSubTab(user, subTab);
  return canAccessAdminTab(user, tab);
}

export function formatSectionLabels(sectionIds) {
  if (!Array.isArray(sectionIds)) return 'Full Role Access';
  if (sectionIds.length === 0) return 'No Editing Sections';
  return sectionIds.map((id) => SECTION_LABELS[id] || id).join(', ');
}

/**
 * Scope an outgoing site-state patch for a section-restricted user so that
 * saving e.g. Community Groups never sends unrelated collections (which would be
 * rejected server-side with 403 Forbidden and shouldn't be overwritten anyway).
 */
export function filterSiteStatePatchForUser(patch, user) {
  if (!patch || typeof patch !== 'object') return patch;
  if (!user || user.role === 'admin' || !Array.isArray(user.allowedSections)) {
    return patch;
  }

  const allowedSet = new Set(user.allowedSections);
  const filtered = {};

  if (Object.prototype.hasOwnProperty.call(patch, 'heroTheme') && allowedSet.has('hero')) {
    filtered.heroTheme = patch.heroTheme;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'layoutBlocks') && (allowedSet.has('hero') || allowedSet.has('appearance'))) {
    filtered.layoutBlocks = patch.layoutBlocks;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'siteTheme') && allowedSet.has('appearance')) {
    filtered.siteTheme = patch.siteTheme;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'siteStatus') && allowedSet.has('status')) {
    filtered.siteStatus = patch.siteStatus;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'siteFeatures') && allowedSet.has('features')) {
    filtered.siteFeatures = patch.siteFeatures;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'cardThemes')) {
    if (patch.cardThemes === null && (allowedSet.has('appearance') || allowedSet.has('settings'))) {
      filtered.cardThemes = null;
    } else if (patch.cardThemes && typeof patch.cardThemes === 'object') {
      const cleanCardThemes = {};
      if (patch.cardThemes.resources && (allowedSet.has('appearance') || allowedSet.has('settings') || allowedSet.has('resources'))) {
        cleanCardThemes.resources = patch.cardThemes.resources;
      }
      if (patch.cardThemes.community && (allowedSet.has('appearance') || allowedSet.has('settings') || allowedSet.has('community'))) {
        cleanCardThemes.community = patch.cardThemes.community;
      }
      if (Object.keys(cleanCardThemes).length > 0) {
        filtered.cardThemes = cleanCardThemes;
      }
    }
  }

  if (patch.cmsData && typeof patch.cmsData === 'object') {
    const cleanCms = {};
    let hasCmsKeys = false;
    for (const [key, val] of Object.entries(patch.cmsData)) {
      if (key === 'lastUpdated') continue;
      const reqSection = CMS_KEY_TO_SECTION[key];
      if (reqSection && allowedSet.has(reqSection)) {
        cleanCms[key] = val;
        hasCmsKeys = true;
      }
    }
    if (hasCmsKeys) {
      cleanCms.lastUpdated = patch.cmsData.lastUpdated || new Date().toISOString();
      filtered.cmsData = cleanCms;
    }
  }

  return filtered;
}
