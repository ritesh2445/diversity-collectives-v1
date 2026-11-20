/**
 * DCVC Card Gradient & Category Theme Engine
 * Provides deep, luxurious jewel-toned gradient styling for Resources and Community cards.
 * All category gradients are 100% editable from the Admin Studio and sync live in real-time.
 */

const STORAGE_KEY = 'dcvc_card_category_themes';
const BROADCAST_CHANNEL = 'dcvc_card_themes_sync';

export const LUXURY_GRADIENT_PRESETS = [
  {
    id: 'velvet-plum',
    name: 'Velvet Plum & Gold',
    gradientFrom: '#1e082b',
    gradientVia: '#3b0d46',
    gradientTo: '#160824',
    accentColor: '#F59E0B',
    badgeColor: '#FBBF24',
    glowColor: 'rgba(217, 70, 239, 0.35)'
  },
  {
    id: 'midnight-indigo',
    name: 'Midnight Indigo & Cyan',
    gradientFrom: '#120f38',
    gradientVia: '#22165c',
    gradientTo: '#0d0b2b',
    accentColor: '#38BDF8',
    badgeColor: '#7DD3FC',
    glowColor: 'rgba(99, 102, 241, 0.35)'
  },
  {
    id: 'ruby-wine',
    name: 'Ruby Wine & Amber',
    gradientFrom: '#2e091a',
    gradientVia: '#52102f',
    gradientTo: '#1f0612',
    accentColor: '#F59E0B',
    badgeColor: '#FBBF24',
    glowColor: 'rgba(244, 63, 94, 0.35)'
  },
  {
    id: 'celestial-sapphire',
    name: 'Celestial Sapphire & Gold',
    gradientFrom: '#0a1838',
    gradientVia: '#132c66',
    gradientTo: '#071026',
    accentColor: '#FACC15',
    badgeColor: '#FDE047',
    glowColor: 'rgba(56, 189, 248, 0.35)'
  },
  {
    id: 'dark-amethyst',
    name: 'Dark Amethyst & Lavender',
    gradientFrom: '#260a3a',
    gradientVia: '#47136c',
    gradientTo: '#1a0729',
    accentColor: '#E879F9',
    badgeColor: '#F0ABFC',
    glowColor: 'rgba(168, 85, 247, 0.35)'
  },
  {
    id: 'warm-espresso',
    name: 'Warm Espresso & Amber Gold',
    gradientFrom: '#2e1508',
    gradientVia: '#54280e',
    gradientTo: '#210f05',
    accentColor: '#F59E0B',
    badgeColor: '#FBBF24',
    glowColor: 'rgba(245, 158, 11, 0.35)'
  },
  {
    id: 'obsidian-teal',
    name: 'Obsidian Teal & Sunbeam',
    gradientFrom: '#082129',
    gradientVia: '#0e3e4d',
    gradientTo: '#06181e',
    accentColor: '#2DD4BF',
    badgeColor: '#5EEAD4',
    glowColor: 'rgba(45, 212, 191, 0.35)'
  },
  {
    id: 'trans-orchid',
    name: 'Trans Affirming Orchid & Rose',
    gradientFrom: '#2f0827',
    gradientVia: '#541245',
    gradientTo: '#1e0519',
    accentColor: '#F472B6',
    badgeColor: '#F9A8D4',
    glowColor: 'rgba(244, 114, 182, 0.35)'
  },
  {
    id: 'sunset-dusk',
    name: 'Sunset Dusk & Peach Gold',
    gradientFrom: '#330c2d',
    gradientVia: '#5e163d',
    gradientTo: '#21081d',
    accentColor: '#FB923C',
    badgeColor: '#FDBA74',
    glowColor: 'rgba(251, 146, 60, 0.35)'
  },
  {
    id: 'midnight-eclipse',
    name: 'Midnight Eclipse & Platinum',
    gradientFrom: '#0f172a',
    gradientVia: '#1e293b',
    gradientTo: '#020617',
    accentColor: '#FACC15',
    badgeColor: '#FDE047',
    glowColor: 'rgba(148, 163, 184, 0.35)'
  }
];

export const DEFAULT_RESOURCE_THEMES = {
  'Crisis & Immediate Helplines': {
    gradientFrom: '#BE123C',
    gradientVia: '#9F1239',
    gradientTo: '#881337',
    accentColor: '#BE123C',
    badgeColor: '#E11D48',
    glowColor: 'rgba(190, 18, 60, 0.15)',
    presetId: 'ruby-wine',
    bgFrom: '#FFF1F2',
    bgTo: '#FFF5F5',
    borderColor: '#FDA4AF',
    badgeText: '#9F1239',
    badgeBg: '#FFE4E6',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#BE123C',
    btnText: '#FFFFFF',
    iconColor: '#BE123C'
  },
  'Health & Sexual Wellness': {
    // Rich royal plum & gold (no green per request)
    gradientFrom: '#5A1E65',
    gradientVia: '#45124E',
    gradientTo: '#2E0B35',
    accentColor: '#5A1E65',
    badgeColor: '#7E22CE',
    glowColor: 'rgba(90, 30, 101, 0.15)',
    presetId: 'velvet-plum',
    bgFrom: '#FAF5FF',
    bgTo: '#F3E8FF',
    borderColor: '#D8B4FE',
    badgeText: '#5A1E65',
    badgeBg: '#F3E8FF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#5A1E65',
    btnText: '#FFFFFF',
    iconColor: '#5A1E65'
  },
  'Legal & Civil Advocacy': {
    gradientFrom: '#1E40AF',
    gradientVia: '#1E3A8A',
    gradientTo: '#172554',
    accentColor: '#1E40AF',
    badgeColor: '#2563EB',
    glowColor: 'rgba(30, 64, 175, 0.15)',
    presetId: 'celestial-sapphire',
    bgFrom: '#EFF6FF',
    bgTo: '#DBEAFE',
    borderColor: '#93C5FD',
    badgeText: '#1E40AF',
    badgeBg: '#DBEAFE',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#1E40AF',
    btnText: '#FFFFFF',
    iconColor: '#2563EB'
  },
  'Youth & Family Support': {
    gradientFrom: '#B45309',
    gradientVia: '#92400E',
    gradientTo: '#78350F',
    accentColor: '#B45309',
    badgeColor: '#D97706',
    glowColor: 'rgba(180, 83, 9, 0.15)',
    presetId: 'warm-espresso',
    bgFrom: '#FFFBEB',
    bgTo: '#FEF3C7',
    borderColor: '#FCD34D',
    badgeText: '#92400E',
    badgeBg: '#FEF3C7',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#B45309',
    btnText: '#FFFFFF',
    iconColor: '#B45309'
  },
  'Senior & Community Resources': {
    gradientFrom: '#0F766E',
    gradientVia: '#115E59',
    gradientTo: '#134E4A',
    accentColor: '#0F766E',
    badgeColor: '#0D9488',
    glowColor: 'rgba(15, 118, 110, 0.15)',
    presetId: 'obsidian-teal',
    bgFrom: '#F0FDFA',
    bgTo: '#CCFBF1',
    borderColor: '#5EEAD4',
    badgeText: '#115E59',
    badgeBg: '#CCFBF1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#0F766E',
    btnText: '#FFFFFF',
    iconColor: '#0D9488'
  },
  'Housing & Essential Living': {
    gradientFrom: '#3730A3',
    gradientVia: '#312E81',
    gradientTo: '#1E1B4B',
    accentColor: '#3730A3',
    badgeColor: '#4338CA',
    glowColor: 'rgba(55, 48, 163, 0.15)',
    presetId: 'midnight-indigo',
    bgFrom: '#F5F3FF',
    bgTo: '#EDE9FE',
    borderColor: '#C4B5FD',
    badgeText: '#3730A3',
    badgeBg: '#EDE9FE',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#3730A3',
    btnText: '#FFFFFF',
    iconColor: '#4338CA'
  },
  'Addiction & Recovery Navigation': {
    gradientFrom: '#15803D',
    gradientVia: '#166534',
    gradientTo: '#14532D',
    accentColor: '#15803D',
    badgeColor: '#16A34A',
    glowColor: 'rgba(21, 128, 61, 0.15)',
    presetId: 'obsidian-teal',
    bgFrom: '#F0FDF4',
    bgTo: '#DCFCE7',
    borderColor: '#86EFAC',
    badgeText: '#166534',
    badgeBg: '#DCFCE7',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#15803D',
    btnText: '#FFFFFF',
    iconColor: '#15803D'
  }
};

export const DEFAULT_COMMUNITY_THEMES = {
  'Youth Peer Support': {
    gradientFrom: '#B45309',
    gradientVia: '#92400E',
    gradientTo: '#78350F',
    accentColor: '#B45309',
    badgeColor: '#D97706',
    glowColor: 'rgba(180, 83, 9, 0.15)',
    presetId: 'warm-espresso',
    bgFrom: '#FFFBEB',
    bgTo: '#FEF3C7',
    borderColor: '#FCD34D',
    badgeText: '#92400E',
    badgeBg: '#FEF3C7',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#B45309',
    btnText: '#FFFFFF',
    iconColor: '#B45309'
  },
  'Adult Peer Support': {
    gradientFrom: '#1D4ED8',
    gradientVia: '#1E40AF',
    gradientTo: '#172554',
    accentColor: '#1D4ED8',
    badgeColor: '#2563EB',
    glowColor: 'rgba(29, 78, 216, 0.15)',
    presetId: 'celestial-sapphire',
    bgFrom: '#EFF6FF',
    bgTo: '#DBEAFE',
    borderColor: '#93C5FD',
    badgeText: '#1E40AF',
    badgeBg: '#DBEAFE',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#1D4ED8',
    btnText: '#FFFFFF',
    iconColor: '#2563EB'
  },
  'Trans & Non-Binary Support': {
    gradientFrom: '#BE185D',
    gradientVia: '#9D174D',
    gradientTo: '#831843',
    accentColor: '#BE185D',
    badgeColor: '#DB2777',
    glowColor: 'rgba(190, 24, 93, 0.15)',
    presetId: 'trans-orchid',
    bgFrom: '#FDF2F8',
    bgTo: '#FCE7F3',
    borderColor: '#F472B6',
    badgeText: '#9D174D',
    badgeBg: '#FCE7F3',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#BE185D',
    btnText: '#FFFFFF',
    iconColor: '#BE185D'
  },
  'Seniors / 55+': {
    gradientFrom: '#0F766E',
    gradientVia: '#115E59',
    gradientTo: '#134E4A',
    accentColor: '#0F766E',
    badgeColor: '#0D9488',
    glowColor: 'rgba(15, 118, 110, 0.15)',
    presetId: 'obsidian-teal',
    bgFrom: '#F0FDFA',
    bgTo: '#CCFBF1',
    borderColor: '#5EEAD4',
    badgeText: '#115E59',
    badgeBg: '#CCFBF1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#0F766E',
    btnText: '#FFFFFF',
    iconColor: '#0D9488'
  },
  'Professional & Personal Growth': {
    gradientFrom: '#5A1E65',
    gradientVia: '#45124E',
    gradientTo: '#2E0B35',
    accentColor: '#5A1E65',
    badgeColor: '#7E22CE',
    glowColor: 'rgba(90, 30, 101, 0.15)',
    presetId: 'velvet-plum',
    bgFrom: '#FAF5FF',
    bgTo: '#F3E8FF',
    borderColor: '#D8B4FE',
    badgeText: '#5A1E65',
    badgeBg: '#F3E8FF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#5A1E65',
    btnText: '#FFFFFF',
    iconColor: '#5A1E65'
  },
  'Family & Ally Support': {
    gradientFrom: '#BE123C',
    gradientVia: '#9F1239',
    gradientTo: '#881337',
    accentColor: '#BE123C',
    badgeColor: '#E11D48',
    glowColor: 'rgba(190, 18, 60, 0.15)',
    presetId: 'ruby-wine',
    bgFrom: '#FFF1F2',
    bgTo: '#FFE4E6',
    borderColor: '#FDA4AF',
    badgeText: '#9F1239',
    badgeBg: '#FFE4E6',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#BE123C',
    btnText: '#FFFFFF',
    iconColor: '#BE123C'
  },
  'Recovery & Wellness': {
    gradientFrom: '#15803D',
    gradientVia: '#166534',
    gradientTo: '#14532D',
    accentColor: '#15803D',
    badgeColor: '#16A34A',
    glowColor: 'rgba(21, 128, 61, 0.15)',
    presetId: 'obsidian-teal',
    bgFrom: '#F0FDF4',
    bgTo: '#DCFCE7',
    borderColor: '#86EFAC',
    badgeText: '#166534',
    badgeBg: '#DCFCE7',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    btnBg: '#15803D',
    btnText: '#FFFFFF',
    iconColor: '#15803D'
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
export function saveAllCardThemes(themes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
    notifyCardThemesChanged();
  } catch (err) {
    console.error('Failed to save card themes:', err);
  }
}

/**
 * Update a specific category theme
 */
export function updateCategoryTheme(type, category, themeData) {
  const current = getAllCardThemes();
  const targetGroup = type === 'community' ? 'community' : 'resources';
  current[targetGroup][category] = {
    ...(current[targetGroup][category] || {}),
    ...themeData
  };
  saveAllCardThemes(current);
  return current[targetGroup][category];
}

/**
 * Reset card themes to default factory values
 */
export function resetCardThemes() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyCardThemesChanged();
  } catch {}
}

/**
 * Resolve theme for a Resource Card
 */
export function getResourceCardTheme(category, itemOverride = null) {
  const all = getAllCardThemes();
  const base = all.resources[category] || DEFAULT_RESOURCE_THEMES[category] || DEFAULT_RESOURCE_THEMES['Health & Sexual Wellness'];
  if (itemOverride && (itemOverride.bgFrom || itemOverride.gradientFrom || itemOverride.cardTheme)) {
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
  if (itemOverride && (itemOverride.bgFrom || itemOverride.gradientFrom || itemOverride.cardTheme)) {
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
