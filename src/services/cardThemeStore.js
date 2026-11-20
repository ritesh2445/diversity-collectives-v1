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
    gradientFrom: '#2e091a',
    gradientVia: '#52102f',
    gradientTo: '#1f0612',
    accentColor: '#F59E0B',
    badgeColor: '#FBBF24',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    presetId: 'ruby-wine'
  },
  'Health & Sexual Wellness': {
    // Rich royal plum & gold (no green per request)
    gradientFrom: '#1e082b',
    gradientVia: '#3b0d46',
    gradientTo: '#160824',
    accentColor: '#FACC15',
    badgeColor: '#FDE047',
    glowColor: 'rgba(217, 70, 239, 0.35)',
    presetId: 'velvet-plum'
  },
  'Legal & Civil Advocacy': {
    gradientFrom: '#0a1838',
    gradientVia: '#132c66',
    gradientTo: '#071026',
    accentColor: '#38BDF8',
    badgeColor: '#7DD3FC',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    presetId: 'celestial-sapphire'
  },
  'Youth & Family Support': {
    gradientFrom: '#260a3a',
    gradientVia: '#47136c',
    gradientTo: '#1a0729',
    accentColor: '#F472B6',
    badgeColor: '#F9A8D4',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    presetId: 'dark-amethyst'
  },
  'Senior & Community Resources': {
    gradientFrom: '#2e1508',
    gradientVia: '#54280e',
    gradientTo: '#210f05',
    accentColor: '#F59E0B',
    badgeColor: '#FBBF24',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    presetId: 'warm-espresso'
  },
  'Housing & Essential Living': {
    gradientFrom: '#120f38',
    gradientVia: '#22165c',
    gradientTo: '#0d0b2b',
    accentColor: '#A78BFA',
    badgeColor: '#C4B5FD',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    presetId: 'midnight-indigo'
  },
  'Addiction & Recovery Navigation': {
    gradientFrom: '#082129',
    gradientVia: '#0e3e4d',
    gradientTo: '#06181e',
    accentColor: '#2DD4BF',
    badgeColor: '#5EEAD4',
    glowColor: 'rgba(45, 212, 191, 0.35)',
    presetId: 'obsidian-teal'
  }
};

export const DEFAULT_COMMUNITY_THEMES = {
  'Youth Peer Support': {
    gradientFrom: '#260a3a',
    gradientVia: '#47136c',
    gradientTo: '#1a0729',
    accentColor: '#FACC15',
    badgeColor: '#FDE047',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    presetId: 'dark-amethyst'
  },
  'Adult Peer Support': {
    gradientFrom: '#120f38',
    gradientVia: '#22165c',
    gradientTo: '#0d0b2b',
    accentColor: '#38BDF8',
    badgeColor: '#7DD3FC',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    presetId: 'midnight-indigo'
  },
  'Trans & Non-Binary Support': {
    gradientFrom: '#2f0827',
    gradientVia: '#541245',
    gradientTo: '#1e0519',
    accentColor: '#F472B6',
    badgeColor: '#F9A8D4',
    glowColor: 'rgba(244, 114, 182, 0.35)',
    presetId: 'trans-orchid'
  },
  'Seniors / 55+': {
    gradientFrom: '#240d38',
    gradientVia: '#421763',
    gradientTo: '#170824',
    accentColor: '#F59E0B',
    badgeColor: '#FBBF24',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    presetId: 'sunset-dusk'
  },
  'Professional & Personal Growth': {
    gradientFrom: '#0a1838',
    gradientVia: '#132c66',
    gradientTo: '#071026',
    accentColor: '#60A5FA',
    badgeColor: '#93C5FD',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    presetId: 'celestial-sapphire'
  },
  'Family & Ally Support': {
    gradientFrom: '#2e091a',
    gradientVia: '#52102f',
    gradientTo: '#1f0612',
    accentColor: '#FB7185',
    badgeColor: '#FDA4AF',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    presetId: 'ruby-wine'
  },
  'Recovery & Wellness': {
    gradientFrom: '#082129',
    gradientVia: '#0e3e4d',
    gradientTo: '#06181e',
    accentColor: '#2DD4BF',
    badgeColor: '#5EEAD4',
    glowColor: 'rgba(45, 212, 191, 0.35)',
    presetId: 'obsidian-teal'
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
