/**
 * Diversity Collective Ventura County — Granular Admin Section Permissions (Authoritative Server Engine)
 *
 * Allows Superadmins to restrict non-admin team accounts to one or more specific
 * Admin Panel / CMS Studio sections (e.g. ONLY Community Groups, ONLY Events, etc.)
 * with strict server-side enforcement across every API endpoint.
 */

export const ADMIN_SECTIONS = [
  { id: 'community', label: 'Community Groups', group: 'Website Content (CMS)', desc: 'Circles, announcements, stories, members & broadcasts' },
  { id: 'programs', label: 'Programs & Clinical Care', group: 'Website Content (CMS)', desc: 'Manage DCVC programs & services' },
  { id: 'events', label: 'Events & Calendar', group: 'Website Content (CMS)', desc: 'Calendar events & weekly schedule' },
  { id: 'trainings', label: 'P.R.I.D.E. Trainings', group: 'Website Content (CMS)', desc: 'Training courses & accreditation content' },
  { id: 'sponsors', label: 'Sponsors & Documents', group: 'Website Content (CMS)', desc: 'Partners, sponsors & sponsorship PDFs' },
  { id: 'podcasts', label: 'Podcasts & Media', group: 'Website Content (CMS)', desc: 'Podcast episodes & community media suggestions' },
  { id: 'news', label: 'News & Articles', group: 'Website Content (CMS)', desc: 'News stories & press announcements' },
  { id: 'resources', label: 'Community Resources', group: 'Website Content (CMS)', desc: 'Regional LGBTQ+ directory resources' },
  { id: 'board_staff', label: 'Board & Operational Staff', group: 'Website Content (CMS)', desc: 'Board of Directors & staff bios/photos' },
  { id: 'gallery', label: 'Photo Gallery & Memory Lane', group: 'Media & Content', desc: 'Gallery uploads & timeline milestones' },
  { id: 'settings', label: 'Global Site Settings', group: 'Website Content (CMS)', desc: 'Org hours, emergency banners, themes & AI knowledge' },
  { id: 'hero', label: 'Homepage & Hero Design', group: 'Design & Layout', desc: 'Hero themes, homepage copy & section layout' },
  { id: 'appearance', label: 'Colors, Fonts & Card Order', group: 'Design & Layout', desc: 'Global palette, fonts & card order' },
  { id: 'features', label: 'Forms, Slots & Popups', group: 'Operations & Directory', desc: 'Forms builder, flex space, HIV slots & popups' },
  { id: 'donations', label: 'Donations & Email Template', group: 'Operations & Directory', desc: 'Zeffy links, donor email template & manual gifts' },
  { id: 'directory', label: 'Business Directory', group: 'Operations & Directory', desc: 'Approve, edit & moderate business directory' },
  { id: 'inquiries', label: 'Inquiries, Voicemails & Newsletter', group: 'Operations & Directory', desc: 'Contact submissions, voicemails & newsletters' },
  { id: 'status', label: 'Site Status & Countdown', group: 'System', desc: 'Maintenance banner & launch countdown' }
];

export const ALL_SECTION_IDS = new Set(ADMIN_SECTIONS.map((s) => s.id));
export const SECTION_LABELS = Object.fromEntries(ADMIN_SECTIONS.map((s) => [s.id, s.label]));

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

/**
 * Parse stored allowed_sections (JSON string or array).
 * Returns null if unrestricted (full default role access), or a sanitized string[] of section IDs.
 */
export function parseAllowedSections(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  let parsed = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '*' || trimmed === '["*"]') return null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(parsed)) return null;
  if (parsed.includes('*')) return null;

  const unique = [];
  const seen = new Set();
  for (const item of parsed) {
    const clean = String(item || '').trim();
    if (ALL_SECTION_IDS.has(clean) && !seen.has(clean)) {
      seen.add(clean);
      unique.push(clean);
    }
  }
  return unique;
}

/**
 * Serialize allowedSections input from an Admin API request.
 * Returns { valid: true, serialized: string|null, sections: string[]|null } or { valid: false, error: string }.
 */
export function normalizeAllowedSectionsInput(raw) {
  if (raw === null || raw === undefined || raw === '' || raw === '*') {
    return { valid: true, serialized: null, sections: null };
  }
  if (!Array.isArray(raw)) {
    return { valid: false, error: 'allowedSections must be an array of section IDs or null.' };
  }
  if (raw.includes('*')) {
    return { valid: true, serialized: null, sections: null };
  }
  const unique = [];
  const seen = new Set();
  for (const item of raw) {
    const clean = String(item || '').trim();
    if (!ALL_SECTION_IDS.has(clean)) {
      return { valid: false, error: `Unknown admin section identifier: "${clean}".` };
    }
    if (!seen.has(clean)) {
      seen.add(clean);
      unique.push(clean);
    }
  }
  return {
    valid: true,
    serialized: JSON.stringify(unique),
    sections: unique
  };
}

/**
 * Unified server-side RBAC + granular section authorization check.
 *
 * - 'admin' role always passes regardless of allowedSections.
 * - 'read_only' role can NEVER perform write operations.
 * - When a non-admin user has a custom allowedSections array (Array.isArray(user.allowedSections)),
 *   they are STRICTLY limited to those sections.
 * - When allowedSections is null/undefined, falls back to legacyAllowedRoles for backward compatibility.
 */
export function requireSectionAccess(user, requiredSections, legacyAllowedRoles = ['admin'], { write = true } = {}) {
  if (!user || !user.role) return false;
  if (user.role === 'admin') return true;
  if (write && user.role === 'read_only') return false;

  const reqList = (Array.isArray(requiredSections) ? requiredSections : [requiredSections]).filter(Boolean);

  if (Array.isArray(user.allowedSections)) {
    if (reqList.length === 0) return false;
    return reqList.some((sec) => user.allowedSections.includes(sec));
  }

  return Array.isArray(legacyAllowedRoles) && legacyAllowedRoles.includes(user.role);
}

/**
 * Determine if a user is allowed to modify a PUT /api/admin/site-state payload.
 * Returns { allowed: true } or { allowed: false, deniedSections: string[], error: string }.
 */
export function assertUserCanPublishSiteState(user, patchBody) {
  if (!user || !user.role) {
    return { allowed: false, deniedSections: ['all'], error: 'Unauthorized.' };
  }
  if (user.role === 'admin') {
    return { allowed: true, deniedSections: [] };
  }
  if (user.role === 'read_only') {
    return { allowed: false, deniedSections: ['read_only'], error: 'Forbidden: Read-only accounts cannot publish changes.' };
  }

  // Legacy users without custom section restrictions retain ['admin', 'editor'] behavior
  if (!Array.isArray(user.allowedSections)) {
    if (['admin', 'editor'].includes(user.role)) {
      return { allowed: true, deniedSections: [] };
    }
    return { allowed: false, deniedSections: ['role'], error: 'Forbidden: Administrator or editor role required to publish website changes.' };
  }

  if (!patchBody || typeof patchBody !== 'object') {
    return { allowed: false, deniedSections: [], error: 'Invalid site state payload.' };
  }

  const allowedSet = new Set(user.allowedSections);
  const denied = new Set();

  const requireOneOf = (candidates, fallbackLabel) => {
    if (!candidates.some((c) => allowedSet.has(c))) {
      denied.add(fallbackLabel || candidates[0]);
    }
  };

  if (Object.prototype.hasOwnProperty.call(patchBody, 'heroTheme')) requireOneOf(['hero'], 'hero');
  if (Object.prototype.hasOwnProperty.call(patchBody, 'layoutBlocks')) requireOneOf(['hero', 'appearance'], 'hero');
  if (Object.prototype.hasOwnProperty.call(patchBody, 'siteTheme')) requireOneOf(['appearance'], 'appearance');
  if (Object.prototype.hasOwnProperty.call(patchBody, 'siteStatus')) requireOneOf(['status'], 'status');
  if (Object.prototype.hasOwnProperty.call(patchBody, 'siteFeatures')) requireOneOf(['features'], 'features');

  if (Object.prototype.hasOwnProperty.call(patchBody, 'cardThemes') && patchBody.cardThemes !== null) {
    const ct = patchBody.cardThemes;
    if (typeof ct === 'object') {
      const hasRes = ct.resources && Object.keys(ct.resources).length > 0;
      const hasCom = ct.community && Object.keys(ct.community).length > 0;
      if (hasRes) requireOneOf(['appearance', 'settings', 'resources'], 'resources');
      if (hasCom) requireOneOf(['appearance', 'settings', 'community'], 'community');
      if (!hasRes && !hasCom) requireOneOf(['appearance', 'settings'], 'appearance');
    } else {
      requireOneOf(['appearance', 'settings'], 'appearance');
    }
  }

  if (Object.prototype.hasOwnProperty.call(patchBody, 'cmsData') && patchBody.cmsData && typeof patchBody.cmsData === 'object') {
    for (const key of Object.keys(patchBody.cmsData)) {
      if (key === 'lastUpdated') continue;
      const requiredSec = CMS_KEY_TO_SECTION[key];
      if (!requiredSec) {
        denied.add(key);
      } else if (!allowedSet.has(requiredSec)) {
        denied.add(requiredSec);
      }
    }
  }

  if (denied.size > 0) {
    const deniedList = Array.from(denied);
    const deniedNames = deniedList.map((id) => SECTION_LABELS[id] || id).join(', ');
    const allowedNames = user.allowedSections.map((id) => SECTION_LABELS[id] || id).join(', ') || 'None';
    return {
      allowed: false,
      deniedSections: deniedList,
      error: `Forbidden: Your account does not have permission to edit (${deniedNames}). Allowed sections: ${allowedNames}.`
    };
  }

  return { allowed: true, deniedSections: [] };
}
