/**
 * Card Gradient & Color Themes Utility
 * Provides curated, accessible gradient themes for Resources and Community cards.
 * Supports custom admin-edited gradients with seamless fallback to curated defaults.
 */

export const DEFAULT_CATEGORY_THEMES = {
  // Resources Categories
  'Health & Sexual Wellness': {
    name: 'Ocean Calming (Healthcare)',
    fromColor: '#e0f2fe', // soft sky
    viaColor: '#ecfeff',  // soft cyan
    toColor: '#e0e7ff',   // soft indigo/periwinkle
    gradient: 'linear-gradient(135deg, #e0f2fe 0%, #ecfeff 50%, #e0e7ff 100%)',
    borderColor: '#7dd3fc',
    borderHoverColor: '#0284c7',
    textColor: '#0c4a6e',
    accentColor: '#0284c7',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
    badgeBorder: '#bae6fd'
  },
  'Crisis & Immediate Helplines': {
    name: 'Warm Rose & Amber (Crisis Care)',
    fromColor: '#ffe4e6',
    viaColor: '#fff1f2',
    toColor: '#fef3c7',
    gradient: 'linear-gradient(135deg, #ffe4e6 0%, #fff1f2 50%, #fef3c7 100%)',
    borderColor: '#fda4af',
    borderHoverColor: '#e11d48',
    textColor: '#881337',
    accentColor: '#e11d48',
    badgeBg: '#ffe4e6',
    badgeText: '#9f1239',
    badgeBorder: '#fecdd3'
  },
  'Youth & Family Support': {
    name: 'Lavender Vitality (Youth & Families)',
    fromColor: '#f3e8ff',
    viaColor: '#ede9fe',
    toColor: '#fce7f3',
    gradient: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #fce7f3 100%)',
    borderColor: '#d8b4fe',
    borderHoverColor: '#9333ea',
    textColor: '#581c87',
    accentColor: '#9333ea',
    badgeBg: '#f3e8ff',
    badgeText: '#7e22ce',
    badgeBorder: '#e9d5ff'
  },
  'Senior & Community Resources': {
    name: 'Golden Amber (Seniors & Elders)',
    fromColor: '#fef3c7',
    viaColor: '#ffedd5',
    toColor: '#fef9c3',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #ffedd5 50%, #fef9c3 100%)',
    borderColor: '#fcd34d',
    borderHoverColor: '#d97706',
    textColor: '#78350f',
    accentColor: '#d97706',
    badgeBg: '#fef3c7',
    badgeText: '#b45309',
    badgeBorder: '#fde68a'
  },

  // Community Group Categories
  'Youth Peer Support': {
    name: 'Electric Purple & Indigo',
    fromColor: '#f5f3ff',
    viaColor: '#ede9fe',
    toColor: '#fae8ff',
    gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #fae8ff 100%)',
    borderColor: '#c4b5fd',
    borderHoverColor: '#7c3aed',
    textColor: '#4c1d95',
    accentColor: '#7c3aed',
    badgeBg: '#f5f3ff',
    badgeText: '#6d28d9',
    badgeBorder: '#ddd6fe'
  },
  'Adult Peer Support': {
    name: 'Azure Twilight',
    fromColor: '#e0f2fe',
    viaColor: '#e0e7ff',
    toColor: '#f3e8ff',
    gradient: 'linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 50%, #f3e8ff 100%)',
    borderColor: '#93c5fd',
    borderHoverColor: '#2563eb',
    textColor: '#1e3a8a',
    accentColor: '#2563eb',
    badgeBg: '#e0f2fe',
    badgeText: '#1d4ed8',
    badgeBorder: '#bfdbfe'
  },
  'Trans & Non-Binary Support': {
    name: 'Affirming Orchid & Cloud',
    fromColor: '#fce7f3',
    viaColor: '#f0f9ff',
    toColor: '#f5f3ff',
    gradient: 'linear-gradient(135deg, #fce7f3 0%, #f0f9ff 50%, #f5f3ff 100%)',
    borderColor: '#f9a8d4',
    borderHoverColor: '#db2777',
    textColor: '#831843',
    accentColor: '#db2777',
    badgeBg: '#fce7f3',
    badgeText: '#be185d',
    badgeBorder: '#fbcfe8'
  },
  'Seniors / 55+': {
    name: 'Sunset Gold & Honey',
    fromColor: '#fef3c7',
    viaColor: '#fee2e2',
    toColor: '#ffedd5',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fee2e2 50%, #ffedd5 100%)',
    borderColor: '#fde047',
    borderHoverColor: '#ca8a04',
    textColor: '#713f12',
    accentColor: '#ca8a04',
    badgeBg: '#fef9c3',
    badgeText: '#a16207',
    badgeBorder: '#fef08a'
  },
  'Professional & Personal Growth': {
    name: 'Royal Amethyst & Slate',
    fromColor: '#ede9fe',
    viaColor: '#f5f3ff',
    toColor: '#e0e7ff',
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #e0e7ff 100%)',
    borderColor: '#a78bfa',
    borderHoverColor: '#6d28d9',
    textColor: '#3b0764',
    accentColor: '#6d28d9',
    badgeBg: '#ede9fe',
    badgeText: '#5b21b6',
    badgeBorder: '#ddd6fe'
  },
  'Family & Ally Support': {
    name: 'Coral Radiance',
    fromColor: '#ffe4e6',
    viaColor: '#ffedd5',
    toColor: '#fdf2f8',
    gradient: 'linear-gradient(135deg, #ffe4e6 0%, #ffedd5 50%, #fdf2f8 100%)',
    borderColor: '#fca5a5',
    borderHoverColor: '#dc2626',
    textColor: '#7f1d1d',
    accentColor: '#dc2626',
    badgeBg: '#ffe4e6',
    badgeText: '#b91c1c',
    badgeBorder: '#fecaca'
  },
  'Recovery & Wellness': {
    name: 'Mindful Teal & Aquamarine',
    fromColor: '#ccfbf1',
    viaColor: '#e0f2fe',
    toColor: '#ecfeff',
    gradient: 'linear-gradient(135deg, #ccfbf1 0%, #e0f2fe 50%, #ecfeff 100%)',
    borderColor: '#5eead4',
    borderHoverColor: '#0d9488',
    textColor: '#134e4a',
    accentColor: '#0d9488',
    badgeBg: '#ccfbf1',
    badgeText: '#0f766e',
    badgeBorder: '#99f6e4'
  }
};

export const GRADIENT_PALETTE_PRESETS = [
  {
    id: 'ocean-cyan',
    name: 'Ocean Cyan & Sky (Medical / Healthcare)',
    fromColor: '#e0f2fe',
    viaColor: '#ecfeff',
    toColor: '#e0e7ff',
    gradient: 'linear-gradient(135deg, #e0f2fe 0%, #ecfeff 50%, #e0e7ff 100%)',
    borderColor: '#7dd3fc',
    textColor: '#0c4a6e',
    accentColor: '#0284c7'
  },
  {
    id: 'warm-rose',
    name: 'Gentle Rose & Peach (Crisis Care)',
    fromColor: '#ffe4e6',
    viaColor: '#fff1f2',
    toColor: '#fef3c7',
    gradient: 'linear-gradient(135deg, #ffe4e6 0%, #fff1f2 50%, #fef3c7 100%)',
    borderColor: '#fda4af',
    textColor: '#881337',
    accentColor: '#e11d48'
  },
  {
    id: 'lavender-purple',
    name: 'Lavender & Fuchsia (Youth / Peer)',
    fromColor: '#f3e8ff',
    viaColor: '#ede9fe',
    toColor: '#fce7f3',
    gradient: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #fce7f3 100%)',
    borderColor: '#d8b4fe',
    textColor: '#581c87',
    accentColor: '#9333ea'
  },
  {
    id: 'golden-amber',
    name: 'Golden Sun & Honey (Seniors)',
    fromColor: '#fef3c7',
    viaColor: '#ffedd5',
    toColor: '#fef9c3',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #ffedd5 50%, #fef9c3 100%)',
    borderColor: '#fcd34d',
    textColor: '#78350f',
    accentColor: '#d97706'
  },
  {
    id: 'trans-affirming',
    name: 'Affirming Orchid & Pastel Sky',
    fromColor: '#fce7f3',
    viaColor: '#f0f9ff',
    toColor: '#f5f3ff',
    gradient: 'linear-gradient(135deg, #fce7f3 0%, #f0f9ff 50%, #f5f3ff 100%)',
    borderColor: '#f9a8d4',
    textColor: '#831843',
    accentColor: '#db2777'
  },
  {
    id: 'mindful-teal',
    name: 'Mindful Teal & Mint (Recovery)',
    fromColor: '#ccfbf1',
    viaColor: '#e0f2fe',
    toColor: '#ecfeff',
    gradient: 'linear-gradient(135deg, #ccfbf1 0%, #e0f2fe 50%, #ecfeff 100%)',
    borderColor: '#5eead4',
    textColor: '#134e4a',
    accentColor: '#0d9488'
  },
  {
    id: 'amethyst-slate',
    name: 'Deep Amethyst & Indigo',
    fromColor: '#ede9fe',
    viaColor: '#f5f3ff',
    toColor: '#e0e7ff',
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #e0e7ff 100%)',
    borderColor: '#a78bfa',
    textColor: '#3b0764',
    accentColor: '#6d28d9'
  },
  {
    id: 'dcvc-signature',
    name: 'DCVC Signature Plum & Gold',
    fromColor: '#fae8ff',
    viaColor: '#f3e8ff',
    toColor: '#fef3c7',
    gradient: 'linear-gradient(135deg, #fae8ff 0%, #f3e8ff 50%, #fef3c7 100%)',
    borderColor: '#d8b4fe',
    textColor: '#581c87',
    accentColor: '#5A1E65'
  }
];

export const CATEGORY_THEME_STORAGE_KEY = 'dcvc_category_card_themes';

/**
 * Loads category themes from localStorage, merged with defaults
 */
export function loadCategoryThemes() {
  if (typeof window === 'undefined') return DEFAULT_CATEGORY_THEMES;
  try {
    const raw = localStorage.getItem(CATEGORY_THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORY_THEMES;
    const custom = JSON.parse(raw);
    return { ...DEFAULT_CATEGORY_THEMES, ...custom };
  } catch {
    return DEFAULT_CATEGORY_THEMES;
  }
}

/**
 * Saves updated category themes to localStorage
 */
export function saveCategoryThemesToStorage(themes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORY_THEME_STORAGE_KEY, JSON.stringify(themes));
    window.dispatchEvent(new CustomEvent('dcvc:category-themes-updated', { detail: themes }));
  } catch {}
}

/**
 * Resolves the gradient theme for a specific category or custom card override.
 */
export function resolveCategoryTheme(category, customCardTheme = null, themesMap = null) {
  const allThemes = themesMap || loadCategoryThemes();

  // If item has a custom direct gradient override
  if (customCardTheme && typeof customCardTheme === 'object') {
    return {
      gradient: customCardTheme.gradient || (customCardTheme.fromColor && customCardTheme.toColor
        ? `linear-gradient(135deg, ${customCardTheme.fromColor} 0%, ${customCardTheme.viaColor || customCardTheme.fromColor} 50%, ${customCardTheme.toColor} 100%)`
        : null),
      borderColor: customCardTheme.borderColor || '#cbd5e1',
      textColor: customCardTheme.textColor || '#0f172a',
      accentColor: customCardTheme.accentColor || '#5A1E65',
      badgeBg: customCardTheme.fromColor || '#f1f5f9',
      badgeText: customCardTheme.accentColor || '#0f172a',
      badgeBorder: customCardTheme.borderColor || '#e2e8f0'
    };
  }

  // Exact match
  if (category && allThemes[category]) {
    return allThemes[category];
  }

  // Fuzzy match (e.g. "Health" in "Health & Sexual Wellness")
  if (category) {
    const normalized = category.toLowerCase();
    for (const [key, theme] of Object.entries(allThemes)) {
      if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
        return theme;
      }
    }
    if (normalized.includes('health') || normalized.includes('clinic') || normalized.includes('testing')) {
      return allThemes['Health & Sexual Wellness'];
    }
    if (normalized.includes('crisis') || normalized.includes('helpline') || normalized.includes('suicide') || normalized.includes('emergency')) {
      return allThemes['Crisis & Immediate Helplines'];
    }
    if (normalized.includes('youth') || normalized.includes('kid') || normalized.includes('teen') || normalized.includes('family')) {
      return allThemes['Youth & Family Support'];
    }
    if (normalized.includes('senior') || normalized.includes('55+') || normalized.includes('elder')) {
      return allThemes['Senior & Community Resources'];
    }
    if (normalized.includes('trans') || normalized.includes('gender') || normalized.includes('non-binary')) {
      return allThemes['Trans & Non-Binary Support'];
    }
    if (normalized.includes('recovery') || normalized.includes('sober')) {
      return allThemes['Recovery & Wellness'];
    }
  }

  // Default fallback (DCVC Signature Plum)
  return allThemes['Youth Peer Support'] || DEFAULT_CATEGORY_THEMES['Youth Peer Support'];
}
