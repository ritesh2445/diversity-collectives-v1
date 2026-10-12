// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — RECITE ME ACCESSIBILITY STORE
// Full companion state management, persistence, live DOM attribute sync,
// audio paragraph tracking, and WCAG luminance calculations.
// ==========================================================================

const STORAGE_KEY = 'dcvc_recite_settings';

export const DEFAULT_SETTINGS = {
  // Toolbar State
  toolbarOpen: false,

  // 1. Text & Styling (Recite Me: A-, Aa, A+, Spacing, Fonts)
  fontSize: 100, // 100, 110, 125, 150, 175, 200 (%)
  fontFamily: 'default', // 'default', 'opendyslexic', 'atkinson', 'arial', 'comicsans', 'verdana'
  lineHeight: 'normal', // 'normal', '1.5', '1.8', '2.0'
  letterSpacing: 'normal', // 'normal', '0.12em', '0.16em', '0.2em'
  wordSpacing: 'normal', // 'normal', '0.16em', '0.24em', '0.32em'
  textAlign: 'normal', // 'normal', 'left', 'center', 'right', 'justify'
  highlightLinks: false,
  highlightHeadings: false,

  // 2. Color Themes & Palette (Recite Me Colour Wheel)
  colorTheme: 'default', // 'default', 'yellow-on-black', 'black-on-yellow', 'white-on-blue', 'black-on-peach', 'inverted', 'monochrome', 'custom'
  customColors: false,
  textColor: '#0f172a',
  bgColor: '#ffffff',
  linkColor: '#5a1e65',

  // 3. Focus & Reading Aids (Ruler, Mask, Magnifier, Margins, Cursor)
  ruler: false,
  screenMask: false,
  magnifier: false,
  plainTextMode: false,
  margins: 'default', // 'default', 'narrow', 'wide'
  cursorSize: 'normal', // 'normal', 'large-black', 'large-white'
  cursorHighlight: false,
  enhancedFocus: false,
  pauseAnimations: false,

  // 4. Speech & Translation (Player, Speed, Auto-read)
  speechRate: 1.0,
  autoReadHover: true,
  selectedVoice: '',
  currentLanguage: 'en', // 'en', 'es', 'tl', 'vi', 'zh'
};

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[ReciteStore] LocalStorage error:', e);
    return null;
  }
}

function saveStoredSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('[ReciteStore] Failed to save settings:', e);
  }
}

function getOSPreferences() {
  const prefs = {};
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      prefs.pauseAnimations = true;
    }
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      prefs.colorTheme = 'yellow-on-black';
    }
  }
  return prefs;
}

class ReciteAccessibilityStore {
  constructor() {
    this.listeners = new Set();
    const stored = loadStoredSettings();
    const osDefaults = getOSPreferences();

    this.state = {
      ...DEFAULT_SETTINGS,
      ...osDefaults,
      ...(stored || {}),
    };

    if (typeof window !== 'undefined') {
      this.applyToDOM();
      this.initEventListeners();
    }
  }

  initEventListeners() {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const newSettings = JSON.parse(event.newValue);
          this.state = { ...DEFAULT_SETTINGS, ...newSettings };
          this.applyToDOM();
          this.notify();
        } catch (e) {
          console.error('[ReciteStore] Sync error:', e);
        }
      }
    });

    // OS reduced motion listener
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener?.('change', (e) => {
      const stored = loadStoredSettings();
      if (!stored || stored.pauseAnimations === undefined) {
        this.update('pauseAnimations', e.matches);
      }
    });
  }

  getState() {
    return { ...this.state };
  }

  update(key, value) {
    this.state = {
      ...this.state,
      [key]: value,
    };
    saveStoredSettings(this.state);
    this.applyToDOM();
    this.notify();
  }

  updateMultiple(updates) {
    this.state = {
      ...this.state,
      ...updates,
    };
    saveStoredSettings(this.state);
    this.applyToDOM();
    this.notify();
  }

  toggleToolbar() {
    this.update('toolbarOpen', !this.state.toolbarOpen);
    this.announce(this.state.toolbarOpen ? 'Recite Me accessibility toolbar opened' : 'Accessibility toolbar closed');
  }

  resetAll() {
    // Keep toolbar open so user can continue navigating
    const wasOpen = this.state.toolbarOpen;
    this.state = { 
      ...DEFAULT_SETTINGS, 
      toolbarOpen: wasOpen,
      ...getOSPreferences() 
    };
    saveStoredSettings(this.state);
    this.applyToDOM();
    this.notify();
    this.announce('All accessibility settings have been reset to defaults.');
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  applyToDOM() {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;
    const s = this.state;

    // Toolbar status (pads body down when ribbon is open)
    html.setAttribute('data-recite-toolbar-open', s.toolbarOpen ? 'true' : 'false');

    // Font size scaling
    html.setAttribute('data-a11y-font-size', s.fontSize.toString());

    // Font Family
    html.setAttribute('data-a11y-font-family', s.fontFamily);

    // Spacing
    html.setAttribute('data-a11y-line-height', s.lineHeight);
    html.setAttribute('data-a11y-letter-spacing', s.letterSpacing);
    html.setAttribute('data-a11y-word-spacing', s.wordSpacing);
    html.setAttribute('data-a11y-text-align', s.textAlign);

    // Highlights
    html.setAttribute('data-a11y-highlight-links', s.highlightLinks ? 'true' : 'false');
    html.setAttribute('data-a11y-highlight-headings', s.highlightHeadings ? 'true' : 'false');

    // Themes & Colors
    html.setAttribute('data-a11y-theme', s.colorTheme);
    if (s.colorTheme === 'custom' && s.customColors) {
      html.style.setProperty('--recite-custom-text', s.textColor);
      html.style.setProperty('--recite-custom-bg', s.bgColor);
      html.style.setProperty('--recite-custom-link', s.linkColor);
    } else {
      html.style.removeProperty('--recite-custom-text');
      html.style.removeProperty('--recite-custom-bg');
      html.style.removeProperty('--recite-custom-link');
    }

    // Reading & Focus Aids
    html.setAttribute('data-a11y-ruler', s.ruler ? 'true' : 'false');
    html.setAttribute('data-a11y-mask', s.screenMask ? 'true' : 'false');
    html.setAttribute('data-a11y-magnifier', s.magnifier ? 'true' : 'false');
    html.setAttribute('data-a11y-plain-text', s.plainTextMode ? 'true' : 'false');
    html.setAttribute('data-a11y-margins', s.margins);
    html.setAttribute('data-a11y-cursor', s.cursorSize);
    html.setAttribute('data-a11y-cursor-highlight', s.cursorHighlight ? 'true' : 'false');
    html.setAttribute('data-a11y-enhanced-focus', s.enhancedFocus ? 'true' : 'false');
    html.setAttribute('data-a11y-pause-animations', s.pauseAnimations ? 'true' : 'false');

    // Dispatch event for smooth scroll and animations
    window.dispatchEvent(new CustomEvent('a11ySettingsChanged', { detail: s }));
  }

  announce(message) {
    if (typeof document === 'undefined') return;
    let announcer = document.getElementById('a11y-live-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'a11y-live-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
}

export const a11yStore = new ReciteAccessibilityStore();

// Contrast ratio helpers
function hexToRgb(hex) {
  const sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    return {
      r: parseInt(sanitized[0] + sanitized[0], 16),
      g: parseInt(sanitized[1] + sanitized[1], 16),
      b: parseInt(sanitized[2] + sanitized[2], 16),
    };
  }
  return {
    r: parseInt(sanitized.substring(0, 2), 16) || 0,
    g: parseInt(sanitized.substring(2, 4), 16) || 0,
    b: parseInt(sanitized.substring(4, 6), 16) || 0,
  };
}

function getChannelLuminance(value) {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  return 0.2126 * getChannelLuminance(rgb.r) + 0.7152 * getChannelLuminance(rgb.g) + 0.0722 * getChannelLuminance(rgb.b);
}

export function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 10) / 10;
}
