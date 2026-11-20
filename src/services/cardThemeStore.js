/**
 * DCVC Card Gradient & Category Theme Engine
 * Provides aesthetic, cool-calm atmospheric gradient styling for Resources and Community cards.
 * All category palettes are 100% editable from the Admin Studio and sync live in real-time.
 */

const STORAGE_KEY = 'dcvc_card_category_themes';
const BROADCAST_CHANNEL = 'dcvc_card_themes_sync';

export const LUXURY_GRADIENT_PRESETS = [
  {
    id: 'velvet-plum',
    name: 'Twilight Indigo & Azure',
    gradientFrom: '#101a36',
    gradientVia: '#1b2a54',
    gradientTo: '#0b1124',
    accentColor: '#60A5FA',
    badgeColor: '#93C5FD',
    btnBg: '#2563EB',
    btnText: '#FFFFFF',
    glowColor: 'rgba(96, 165, 250, 0.2)'
  },
  {
    id: 'celestial-sapphire',
    name: 'Celestial Sapphire & Cyan',
    gradientFrom: '#0c1d33',
    gradientVia: '#142e4f',
    gradientTo: '#081424',
    accentColor: '#38BDF8',
    badgeColor: '#7DD3FC',
    btnBg: '#0284C7',
    btnText: '#FFFFFF',
    glowColor: 'rgba(56, 189, 248, 0.2)'
  },
  {
    id: 'ruby-wine',
    name: 'Calming Ruby Dusk & Rose',
    gradientFrom: '#24121b',
    gradientVia: '#361928',
    gradientTo: '#180c12',
    accentColor: '#FB7185',
    badgeColor: '#FDA4AF',
    btnBg: '#E11D48',
    btnText: '#FFFFFF',
    glowColor: 'rgba(244, 63, 94, 0.2)'
  },
  {
    id: 'obsidian-teal',
    name: 'Coastal Teal & Seafoam',
    gradientFrom: '#0c2124',
    gradientVia: '#123338',
    gradientTo: '#081618',
    accentColor: '#2DD4BF',
    badgeColor: '#5EEAD4',
    btnBg: '#0D9488',
    btnText: '#FFFFFF',
    glowColor: 'rgba(45, 212, 191, 0.2)'
  },
  {
    id: 'warm-espresso',
    name: 'Calm Terracotta Dusk & Peach',
    gradientFrom: '#261814',
    gradientVia: '#3b251e',
    gradientTo: '#19100d',
    accentColor: '#FB923C',
    badgeColor: '#FDBA74',
    btnBg: '#EA580C',
    btnText: '#FFFFFF',
    glowColor: 'rgba(251, 146, 60, 0.2)'
  },
  {
    id: 'midnight-indigo',
    name: 'Nordic Slate & Periwinkle',
    gradientFrom: '#141b29',
    gradientVia: '#1e293d',
    gradientTo: '#0d121c',
    accentColor: '#818CF8',
    badgeColor: '#A5B4FC',
    btnBg: '#4F46E5',
    btnText: '#FFFFFF',
    glowColor: 'rgba(129, 140, 248, 0.2)'
  },
  {
    id: 'trans-orchid',
    name: 'Cool Orchid Dusk & Rose',
    gradientFrom: '#271228',
    gradientVia: '#3d1a3e',
    gradientTo: '#190b1a',
    accentColor: '#F472B6',
    badgeColor: '#F9A8D4',
    btnBg: '#DB2777',
    btnText: '#FFFFFF',
    glowColor: 'rgba(244, 114, 182, 0.2)'
  },
  {
    id: 'pine-emerald',
    name: 'Deep Pine & Soothing Mint',
    gradientFrom: '#0c211b',
    gradientVia: '#13332a',
    gradientTo: '#081612',
    accentColor: '#34D399',
    badgeColor: '#6EE7B7',
    btnBg: '#059669',
    btnText: '#FFFFFF',
    glowColor: 'rgba(52, 211, 153, 0.2)'
  },
  {
    id: 'sunset-dusk',
    name: 'Cool Twilight Dusk & Coral',
    gradientFrom: '#241421',
    gradientVia: '#361c2e',
    gradientTo: '#170c15',
    accentColor: '#FB7185',
    badgeColor: '#FDA4AF',
    btnBg: '#E11D48',
    btnText: '#FFFFFF',
    glowColor: 'rgba(251, 113, 133, 0.2)'
  },
  {
    id: 'midnight-eclipse',
    name: 'Midnight Eclipse & Ice Azure',
    gradientFrom: '#0b1329',
    gradientVia: '#122042',
    gradientTo: '#070c1a',
    accentColor: '#38BDF8',
    badgeColor: '#7DD3FC',
    btnBg: '#0284C7',
    btnText: '#FFFFFF',
    glowColor: 'rgba(56, 189, 248, 0.2)'
  }
];

export const DEFAULT_RESOURCE_THEMES = {
  'Crisis & Immediate Helplines': {
    // Calming ruby dusk / wine slate (soothing, reassuring)
    gradientFrom: '#24121b',
    gradientVia: '#361928',
    gradientTo: '#180c12',
    accentColor: '#FB7185',
    badgeColor: '#FDA4AF',
    glowColor: 'rgba(244, 63, 94, 0.2)',
    presetId: 'ruby-wine',
    btnBg: '#E11D48',
    btnText: '#FFFFFF'
  },
  'Health & Sexual Wellness': {
    // Cool calm midnight indigo & azure (reassuring, medical, trusted — NO green, not purple!)
    gradientFrom: '#101a36',
    gradientVia: '#1b2a54',
    gradientTo: '#0b1124',
    accentColor: '#60A5FA',
    badgeColor: '#93C5FD',
    glowColor: 'rgba(96, 165, 250, 0.2)',
    presetId: 'velvet-plum',
    btnBg: '#2563EB',
    btnText: '#FFFFFF'
  },
  'Legal & Civil Advocacy': {
    // Deep oceanic sapphire & cool sky cyan
    gradientFrom: '#0c1d33',
    gradientVia: '#142e4f',
    gradientTo: '#081424',
    accentColor: '#38BDF8',
    badgeColor: '#7DD3FC',
    glowColor: 'rgba(56, 189, 248, 0.2)',
    presetId: 'celestial-sapphire',
    btnBg: '#0284C7',
    btnText: '#FFFFFF'
  },
  'Youth & Family Support': {
    // Calm terracotta dusk & warm peach
    gradientFrom: '#261814',
    gradientVia: '#3b251e',
    gradientTo: '#19100d',
    accentColor: '#FB923C',
    badgeColor: '#FDBA74',
    glowColor: 'rgba(251, 146, 60, 0.2)',
    presetId: 'warm-espresso',
    btnBg: '#EA580C',
    btnText: '#FFFFFF'
  },
  'Senior & Community Resources': {
    // Calming coastal teal & seafoam
    gradientFrom: '#0c2124',
    gradientVia: '#123338',
    gradientTo: '#081618',
    accentColor: '#2DD4BF',
    badgeColor: '#5EEAD4',
    glowColor: 'rgba(45, 212, 191, 0.2)',
    presetId: 'obsidian-teal',
    btnBg: '#0D9488',
    btnText: '#FFFFFF'
  },
  'Housing & Essential Living': {
    // Nordic slate & periwinkle
    gradientFrom: '#141b29',
    gradientVia: '#1e293d',
    gradientTo: '#0d121c',
    accentColor: '#818CF8',
    badgeColor: '#A5B4FC',
    glowColor: 'rgba(129, 140, 248, 0.2)',
    presetId: 'midnight-indigo',
    btnBg: '#4F46E5',
    btnText: '#FFFFFF'
  },
  'Addiction & Recovery Navigation': {
    // Deep pine & soothing mint
    gradientFrom: '#0c211b',
    gradientVia: '#13332a',
    gradientTo: '#081612',
    accentColor: '#34D399',
    badgeColor: '#6EE7B7',
    glowColor: 'rgba(52, 211, 153, 0.2)',
    presetId: 'obsidian-teal',
    btnBg: '#059669',
    btnText: '#FFFFFF'
  }
};

export const DEFAULT_COMMUNITY_THEMES = {
  'Youth Peer Support': {
    gradientFrom: '#261814',
    gradientVia: '#3b251e',
    gradientTo: '#19100d',
    accentColor: '#FB923C',
    badgeColor: '#FDBA74',
    glowColor: 'rgba(251, 146, 60, 0.2)',
    presetId: 'warm-espresso',
    btnBg: '#EA580C',
    btnText: '#FFFFFF'
  },
  'Adult Peer Support': {
    gradientFrom: '#101a36',
    gradientVia: '#1b2a54',
    gradientTo: '#0b1124',
    accentColor: '#60A5FA',
    badgeColor: '#93C5FD',
    glowColor: 'rgba(96, 165, 250, 0.2)',
    presetId: 'midnight-indigo',
    btnBg: '#2563EB',
    btnText: '#FFFFFF'
  },
  'Trans & Non-Binary Support': {
    gradientFrom: '#271228',
    gradientVia: '#3d1a3e',
    gradientTo: '#190b1a',
    accentColor: '#F472B6',
    badgeColor: '#F9A8D4',
    glowColor: 'rgba(244, 114, 182, 0.2)',
    presetId: 'trans-orchid',
    btnBg: '#DB2777',
    btnText: '#FFFFFF'
  },
  'Seniors / 55+': {
    gradientFrom: '#0c2124',
    gradientVia: '#123338',
    gradientTo: '#081618',
    accentColor: '#2DD4BF',
    badgeColor: '#5EEAD4',
    glowColor: 'rgba(45, 212, 191, 0.2)',
    presetId: 'obsidian-teal',
    btnBg: '#0D9488',
    btnText: '#FFFFFF'
  },
  'Professional & Personal Growth': {
    gradientFrom: '#0c1d33',
    gradientVia: '#142e4f',
    gradientTo: '#081424',
    accentColor: '#38BDF8',
    badgeColor: '#7DD3FC',
    glowColor: 'rgba(56, 189, 248, 0.2)',
    presetId: 'celestial-sapphire',
    btnBg: '#0284C7',
    btnText: '#FFFFFF'
  },
  'Family & Ally Support': {
    gradientFrom: '#24121b',
    gradientVia: '#361928',
    gradientTo: '#180c12',
    accentColor: '#FB7185',
    badgeColor: '#FDA4AF',
    glowColor: 'rgba(244, 63, 94, 0.2)',
    presetId: 'ruby-wine',
    btnBg: '#E11D48',
    btnText: '#FFFFFF'
  },
  'Recovery & Wellness': {
    gradientFrom: '#0c211b',
    gradientVia: '#13332a',
    gradientTo: '#081612',
    accentColor: '#34D399',
    badgeColor: '#6EE7B7',
    glowColor: 'rgba(52, 211, 153, 0.2)',
    presetId: 'obsidian-teal',
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
