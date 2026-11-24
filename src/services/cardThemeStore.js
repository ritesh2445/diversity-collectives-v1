/**
 * DCVC Card Gradient & Category Theme Engine
 * Provides calm light color palettes with soft gradients for Resources and Community cards.
 * High contrast, crystal-clear typography and prominent phone numbers for WCAG AAA accessibility.
 * All category palettes are 100% editable from the Admin Studio and sync live in real-time.
 */

import { publishAdminSitePatch } from './liveSync.js';

const STORAGE_KEY = 'dcvc_card_category_themes';
const BROADCAST_CHANNEL = 'dcvc_card_themes_sync';

export const LUXURY_GRADIENT_PRESETS = [
  {
    id: 'velvet-plum',
    name: 'Soft Lavender & Royal Plum',
    gradientFrom: '#FAF5FF',
    gradientVia: '#FDFBFF',
    gradientTo: '#FFFFFF',
    borderColor: '#DDD6FE',
    accentColor: '#5A1E65',
    badgeColor: '#45124E',
    badgeBg: '#F3E8FF',
    btnBg: '#5A1E65',
    btnText: '#FFFFFF',
    glowColor: 'rgba(90, 30, 101, 0.08)'
  },
  {
    id: 'celestial-sapphire',
    name: 'Soft Sky & Oceanic Azure',
    gradientFrom: '#F0F9FF',
    gradientVia: '#F8FCFF',
    gradientTo: '#FFFFFF',
    borderColor: '#BAE6FD',
    accentColor: '#0284C7',
    badgeColor: '#0369A1',
    badgeBg: '#E0F2FE',
    btnBg: '#0284C7',
    btnText: '#FFFFFF',
    glowColor: 'rgba(2, 132, 199, 0.08)'
  },
  {
    id: 'ruby-wine',
    name: 'Soft Blush & Crimson Rose',
    gradientFrom: '#FFF0F3',
    gradientVia: '#FFF8F9',
    gradientTo: '#FFFFFF',
    borderColor: '#FECDD3',
    accentColor: '#BE123C',
    badgeColor: '#9F1239',
    badgeBg: '#FFE4E6',
    btnBg: '#BE123C',
    btnText: '#FFFFFF',
    glowColor: 'rgba(190, 18, 60, 0.08)'
  },
  {
    id: 'obsidian-teal',
    name: 'Soft Seafoam & Coastal Teal',
    gradientFrom: '#F0FDFA',
    gradientVia: '#F7FEFD',
    gradientTo: '#FFFFFF',
    borderColor: '#99F6E4',
    accentColor: '#0D9488',
    badgeColor: '#0F766E',
    badgeBg: '#CCFBF1',
    btnBg: '#0D9488',
    btnText: '#FFFFFF',
    glowColor: 'rgba(13, 148, 136, 0.08)'
  },
  {
    id: 'warm-espresso',
    name: 'Soft Cream & Warm Amber',
    gradientFrom: '#FFFBEB',
    gradientVia: '#FFFDF5',
    gradientTo: '#FFFFFF',
    borderColor: '#FDE68A',
    accentColor: '#D97706',
    badgeColor: '#B45309',
    badgeBg: '#FEF3C7',
    btnBg: '#D97706',
    btnText: '#FFFFFF',
    glowColor: 'rgba(217, 119, 6, 0.08)'
  },
  {
    id: 'midnight-indigo',
    name: 'Soft Periwinkle & Slate Indigo',
    gradientFrom: '#F5F3FF',
    gradientVia: '#FAF9FF',
    gradientTo: '#FFFFFF',
    borderColor: '#C7D2FE',
    accentColor: '#4F46E5',
    badgeColor: '#3730A3',
    badgeBg: '#E0E7FF',
    btnBg: '#4F46E5',
    btnText: '#FFFFFF',
    glowColor: 'rgba(79, 70, 229, 0.08)'
  },
  {
    id: 'trans-orchid',
    name: 'Soft Rose Petal & Radiant Orchid',
    gradientFrom: '#FDF2F8',
    gradientVia: '#FEF9FC',
    gradientTo: '#FFFFFF',
    borderColor: '#FBCFE8',
    accentColor: '#DB2777',
    badgeColor: '#BE185D',
    badgeBg: '#FCE7F3',
    btnBg: '#DB2777',
    btnText: '#FFFFFF',
    glowColor: 'rgba(219, 39, 119, 0.08)'
  },
  {
    id: 'pine-emerald',
    name: 'Soft Sage & Deep Mint',
    gradientFrom: '#F0FDF4',
    gradientVia: '#F7FEFA',
    gradientTo: '#FFFFFF',
    borderColor: '#A7F3D0',
    accentColor: '#059669',
    badgeColor: '#047857',
    badgeBg: '#D1FAE5',
    btnBg: '#059669',
    btnText: '#FFFFFF',
    glowColor: 'rgba(5, 150, 105, 0.08)'
  },
  {
    id: 'sunset-dusk',
    name: 'Soft Peach & Sunset Coral',
    gradientFrom: '#FFF7ED',
    gradientVia: '#FFFAF5',
    gradientTo: '#FFFFFF',
    borderColor: '#FED7AA',
    accentColor: '#EA580C',
    badgeColor: '#C2410C',
    badgeBg: '#FFEDD5',
    btnBg: '#EA580C',
    btnText: '#FFFFFF',
    glowColor: 'rgba(234, 88, 12, 0.08)'
  },
  {
    id: 'midnight-eclipse',
    name: 'Soft Nordic Frost & Royal Cobalt',
    gradientFrom: '#EFF6FF',
    gradientVia: '#F7FAFF',
    gradientTo: '#FFFFFF',
    borderColor: '#BFDBFE',
    accentColor: '#2563EB',
    badgeColor: '#1D4ED8',
    badgeBg: '#DBEAFE',
    btnBg: '#2563EB',
    btnText: '#FFFFFF',
    glowColor: 'rgba(37, 99, 235, 0.08)'
  }
];

export const DEFAULT_RESOURCE_THEMES = {
  'Crisis & Immediate Helplines': {
    // Soft calm blush with crimson rose accent
    gradientFrom: '#FFF0F3',
    gradientVia: '#FFF8F9',
    gradientTo: '#FFFFFF',
    borderColor: '#FECDD3',
    accentColor: '#BE123C',
    badgeColor: '#9F1239',
    badgeBg: '#FFE4E6',
    glowColor: 'rgba(190, 18, 60, 0.08)',
    presetId: 'ruby-wine',
    btnBg: '#BE123C',
    btnText: '#FFFFFF'
  },
  'Health & Sexual Wellness': {
    // Calm soft lavender with DCVC signature plum (NO green, not flashy)
    gradientFrom: '#FAF5FF',
    gradientVia: '#FDFBFF',
    gradientTo: '#FFFFFF',
    borderColor: '#DDD6FE',
    accentColor: '#5A1E65',
    badgeColor: '#45124E',
    badgeBg: '#F3E8FF',
    glowColor: 'rgba(90, 30, 101, 0.08)',
    presetId: 'velvet-plum',
    btnBg: '#5A1E65',
    btnText: '#FFFFFF'
  },
  'Legal & Civil Advocacy': {
    // Soft calm sky with oceanic azure
    gradientFrom: '#F0F9FF',
    gradientVia: '#F8FCFF',
    gradientTo: '#FFFFFF',
    borderColor: '#BAE6FD',
    accentColor: '#0284C7',
    badgeColor: '#0369A1',
    badgeBg: '#E0F2FE',
    glowColor: 'rgba(2, 132, 199, 0.08)',
    presetId: 'celestial-sapphire',
    btnBg: '#0284C7',
    btnText: '#FFFFFF'
  },
  'Youth & Family Support': {
    // Soft calm cream with warm amber
    gradientFrom: '#FFFBEB',
    gradientVia: '#FFFDF5',
    gradientTo: '#FFFFFF',
    borderColor: '#FDE68A',
    accentColor: '#D97706',
    badgeColor: '#B45309',
    badgeBg: '#FEF3C7',
    glowColor: 'rgba(217, 119, 6, 0.08)',
    presetId: 'warm-espresso',
    btnBg: '#D97706',
    btnText: '#FFFFFF'
  },
  'Senior & Community Resources': {
    // Soft calm seafoam with coastal teal
    gradientFrom: '#F0FDFA',
    gradientVia: '#F7FEFD',
    gradientTo: '#FFFFFF',
    borderColor: '#99F6E4',
    accentColor: '#0D9488',
    badgeColor: '#0F766E',
    badgeBg: '#CCFBF1',
    glowColor: 'rgba(13, 148, 136, 0.08)',
    presetId: 'obsidian-teal',
    btnBg: '#0D9488',
    btnText: '#FFFFFF'
  },
  'Housing & Essential Living': {
    // Soft calm periwinkle with slate indigo
    gradientFrom: '#F5F3FF',
    gradientVia: '#FAF9FF',
    gradientTo: '#FFFFFF',
    borderColor: '#C7D2FE',
    accentColor: '#4F46E5',
    badgeColor: '#3730A3',
    badgeBg: '#E0E7FF',
    glowColor: 'rgba(79, 70, 229, 0.08)',
    presetId: 'midnight-indigo',
    btnBg: '#4F46E5',
    btnText: '#FFFFFF'
  },
  'Addiction & Recovery Navigation': {
    // Soft calm sage with deep mint
    gradientFrom: '#F0FDF4',
    gradientVia: '#F7FEFA',
    gradientTo: '#FFFFFF',
    borderColor: '#A7F3D0',
    accentColor: '#059669',
    badgeColor: '#047857',
    badgeBg: '#D1FAE5',
    glowColor: 'rgba(5, 150, 105, 0.08)',
    presetId: 'pine-emerald',
    btnBg: '#059669',
    btnText: '#FFFFFF'
  }
};

export const DEFAULT_COMMUNITY_THEMES = {
  'Youth Peer Support': {
    gradientFrom: '#FFFBEB',
    gradientVia: '#FFFDF5',
    gradientTo: '#FFFFFF',
    borderColor: '#FDE68A',
    accentColor: '#D97706',
    badgeColor: '#B45309',
    badgeBg: '#FEF3C7',
    glowColor: 'rgba(217, 119, 6, 0.08)',
    presetId: 'warm-espresso',
    btnBg: '#D97706',
    btnText: '#FFFFFF'
  },
  'Adult Peer Support': {
    gradientFrom: '#F0F9FF',
    gradientVia: '#F8FCFF',
    gradientTo: '#FFFFFF',
    borderColor: '#BAE6FD',
    accentColor: '#0284C7',
    badgeColor: '#0369A1',
    badgeBg: '#E0F2FE',
    glowColor: 'rgba(2, 132, 199, 0.08)',
    presetId: 'celestial-sapphire',
    btnBg: '#0284C7',
    btnText: '#FFFFFF'
  },
  'Trans & Non-Binary Support': {
    gradientFrom: '#FDF2F8',
    gradientVia: '#FEF9FC',
    gradientTo: '#FFFFFF',
    borderColor: '#FBCFE8',
    accentColor: '#DB2777',
    badgeColor: '#BE185D',
    badgeBg: '#FCE7F3',
    glowColor: 'rgba(219, 39, 119, 0.08)',
    presetId: 'trans-orchid',
    btnBg: '#DB2777',
    btnText: '#FFFFFF'
  },
  'Seniors / 55+': {
    gradientFrom: '#F0FDFA',
    gradientVia: '#F7FEFD',
    gradientTo: '#FFFFFF',
    borderColor: '#99F6E4',
    accentColor: '#0D9488',
    badgeColor: '#0F766E',
    badgeBg: '#CCFBF1',
    glowColor: 'rgba(13, 148, 136, 0.08)',
    presetId: 'obsidian-teal',
    btnBg: '#0D9488',
    btnText: '#FFFFFF'
  },
  'Professional & Personal Growth': {
    gradientFrom: '#EFF6FF',
    gradientVia: '#F7FAFF',
    gradientTo: '#FFFFFF',
    borderColor: '#BFDBFE',
    accentColor: '#2563EB',
    badgeColor: '#1D4ED8',
    badgeBg: '#DBEAFE',
    glowColor: 'rgba(37, 99, 235, 0.08)',
    presetId: 'midnight-eclipse',
    btnBg: '#2563EB',
    btnText: '#FFFFFF'
  },
  'Family & Ally Support': {
    gradientFrom: '#FFF0F3',
    gradientVia: '#FFF8F9',
    gradientTo: '#FFFFFF',
    borderColor: '#FECDD3',
    accentColor: '#BE123C',
    badgeColor: '#9F1239',
    badgeBg: '#FFE4E6',
    glowColor: 'rgba(190, 18, 60, 0.08)',
    presetId: 'ruby-wine',
    btnBg: '#BE123C',
    btnText: '#FFFFFF'
  },
  'Recovery & Wellness': {
    gradientFrom: '#F0FDF4',
    gradientVia: '#F7FEFA',
    gradientTo: '#FFFFFF',
    borderColor: '#A7F3D0',
    accentColor: '#059669',
    badgeColor: '#047857',
    badgeBg: '#D1FAE5',
    glowColor: 'rgba(5, 150, 105, 0.08)',
    presetId: 'pine-emerald',
    btnBg: '#059669',
    btnText: '#FFFFFF'
  }
};

/**
 * Get all stored category themes (resources + community)
 */
export function getAllCardThemes() {
  if (typeof window === 'undefined') {
    return {
      resources: { ...DEFAULT_RESOURCE_THEMES },
      community: { ...DEFAULT_COMMUNITY_THEMES }
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        resources: { ...DEFAULT_RESOURCE_THEMES },
        community: { ...DEFAULT_COMMUNITY_THEMES }
      };
    }
    const parsed = JSON.parse(raw);
    return {
      resources: { ...DEFAULT_RESOURCE_THEMES, ...(parsed.resources || {}) },
      community: { ...DEFAULT_COMMUNITY_THEMES, ...(parsed.community || {}) }
    };
  } catch {
    return {
      resources: { ...DEFAULT_RESOURCE_THEMES },
      community: { ...DEFAULT_COMMUNITY_THEMES }
    };
  }
}

/**
 * Save all category themes to localStorage and broadcast
 */
export function saveAllCardThemes(themes, { broadcast = true, publish = true } = {}) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
    if (broadcast) {
      notifyCardThemesChanged();
    }
    if (publish) {
      publishAdminSitePatch({ cardThemes: themes }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to save card themes:', err);
  }
}

/**
 * Update a specific category theme
 */
export function updateCategoryTheme(type, category, themeData, { publish = true } = {}) {
  const current = getAllCardThemes();
  const targetGroup = type === 'community' ? 'community' : 'resources';
  current[targetGroup][category] = {
    ...(current[targetGroup][category] || {}),
    ...themeData
  };
  saveAllCardThemes(current, { broadcast: true, publish });
  return current[targetGroup][category];
}

/**
 * Reset card themes to default factory values
 */
export function resetCardThemes({ publish = true } = {}) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyCardThemesChanged();
    if (publish) {
      publishAdminSitePatch({ cardThemes: null }).catch(() => {});
    }
  } catch {}
}

/**
 * Resolve theme for a Resource Card
 */
export function getResourceCardTheme(category, itemOverride = null) {
  const all = getAllCardThemes();
  const base = all.resources[category] || DEFAULT_RESOURCE_THEMES[category] || DEFAULT_RESOURCE_THEMES['Health & Sexual Wellness'];
  if (itemOverride && (itemOverride.gradientFrom || itemOverride.cardTheme)) {
    return { ...base, ...itemOverride };
  }
  return base;
}

/**
 * Resolve theme for a Community Group Card
 */
export function getCommunityCardTheme(category, itemOverride = null) {
  const all = getAllCardThemes();
  const base = all.community[category] || DEFAULT_COMMUNITY_THEMES[category] || DEFAULT_COMMUNITY_THEMES['Youth Peer Support'];
  if (itemOverride && (itemOverride.gradientFrom || itemOverride.cardTheme)) {
    return { ...base, ...itemOverride };
  }
  return base;
}

/**
 * Broadcast change to other tabs & listeners
 */
function notifyCardThemesChanged() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('dcvc_card_themes_updated'));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL);
      bc.postMessage({ type: 'CARD_THEMES_UPDATED', timestamp: Date.now() });
      bc.close();
    }
  } catch {}
}

/**
 * Subscribe to card theme updates
 */
export function subscribeToCardThemes(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    callback(getAllCardThemes());
  };

  window.addEventListener('dcvc_card_themes_updated', handleUpdate);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) handleUpdate();
  });

  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(BROADCAST_CHANNEL);
      bc.onmessage = handleUpdate;
    } catch {}
  }

  return () => {
    window.removeEventListener('dcvc_card_themes_updated', handleUpdate);
    if (bc) bc.close();
  };
}
