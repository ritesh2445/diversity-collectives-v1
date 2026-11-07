// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — TRANSLATION SERVICE
// Combines an instant high-fidelity bilingual UI dictionary with
// Google Translate's deep full-page translation engine for 10+ languages.
// Includes React 19 DOM patch for seamless translation without hydration errors.
// ==========================================================================

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', nativeName: 'Español', flag: '🇲🇽' },
  { code: 'tl', label: 'Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'vi', label: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh-CN', label: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳' },
  { code: 'fr', label: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ko', label: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  // 15 additional global & community languages
  { code: 'pt', label: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', label: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'it', label: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'uk', label: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'fa', label: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  { code: 'he', label: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', dir: 'rtl' },
  { code: 'th', label: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'pl', label: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'nl', label: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'tr', label: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'el', label: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'hy', label: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲' },
  { code: 'id', label: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
];

const UI_DICTIONARY = {
  en: {
    nav_about: 'About',
    nav_programs: 'Programs',
    nav_directory: 'Directory',
    nav_training: 'Training',
    nav_community: 'Community',
    nav_events: 'Events',
    nav_resources: 'Resources',
    nav_news: 'News',
    nav_gallery: 'Gallery',
    nav_donate: 'Donate',
    nav_get_support: 'Get Support',
    nav_quick_exit: 'Quick Exit',
    lang_select: 'Language',
    lang_switch: 'Select Language',
    a11y_companion: 'Accessibility & Audio Tools',
    search_placeholder: 'Search resources, programs, articles...',
  },
  es: {
    nav_about: 'Acerca de',
    nav_programs: 'Programas',
    nav_directory: 'Directorio',
    nav_training: 'Capacitación',
    nav_community: 'Comunidad',
    nav_events: 'Eventos',
    nav_resources: 'Recursos',
    nav_news: 'Noticias',
    nav_gallery: 'Galería',
    nav_donate: 'Donar',
    nav_get_support: 'Obtener Apoyo',
    nav_quick_exit: 'Salida Rápida',
    lang_select: 'Idioma',
    lang_switch: 'Seleccionar Idioma',
    a11y_companion: 'Herramientas de Accesibilidad',
    search_placeholder: 'Buscar recursos, programas, artículos...',
  },
  tl: {
    nav_about: 'Tungkol',
    nav_programs: 'Mga Programa',
    nav_directory: 'Direktoryo',
    nav_training: 'Pagsasanay',
    nav_community: 'Komunidad',
    nav_events: 'Mga Kaganapan',
    nav_resources: 'Mga Mapagkukunan',
    nav_news: 'Balita',
    nav_gallery: 'Galerya',
    nav_donate: 'Mag-donate',
    nav_get_support: 'Kumuha ng Suporta',
    nav_quick_exit: 'Mabilisang Pag-alis',
    lang_select: 'Wika',
    lang_switch: 'Pumili ng Wika',
    a11y_companion: 'Mga Kagamitan sa Accessibility',
    search_placeholder: 'Maghanap ng mga programa, artikulo...',
  },
  vi: {
    nav_about: 'Giới thiệu',
    nav_programs: 'Chương trình',
    nav_directory: 'Danh bạ',
    nav_training: 'Đào tạo',
    nav_community: 'Cộng đồng',
    nav_events: 'Sự kiện',
    nav_resources: 'Tài nguyên',
    nav_news: 'Tin tức',
    nav_gallery: 'Thư viện',
    nav_donate: 'Quyên góp',
    nav_get_support: 'Nhận hỗ trợ',
    nav_quick_exit: 'Thoát nhanh',
    lang_select: 'Ngôn ngữ',
    lang_switch: 'Chọn ngôn ngữ',
    a11y_companion: 'Công cụ hỗ trợ tiếp cận',
    search_placeholder: 'Tìm kiếm tài nguyên, bài viết...',
  },
  'zh-CN': {
    nav_about: '关于我们',
    nav_programs: '项目服务',
    nav_directory: '企业名录',
    nav_training: '文化培训',
    nav_community: '社区群体',
    nav_events: '活动日程',
    nav_resources: '社区资源',
    nav_news: '最新动态',
    nav_gallery: '历史画廊',
    nav_donate: '立即捐助',
    nav_get_support: '获取支持',
    nav_quick_exit: '紧急退出',
    lang_select: '语言',
    lang_switch: '选择语言',
    a11y_companion: '无障碍辅助工具',
    search_placeholder: '搜索项目、资源、文章...',
  }
};

// Safe React 19 DOM patch for Google Translate node manipulation
function patchReactDomForTranslation() {
  if (typeof window === 'undefined' || window.__dcvc_dom_patched) return;
  window.__dcvc_dom_patched = true;

  try {
    if (typeof Node === 'function' && Node.prototype) {
      const origRemove = Node.prototype.removeChild;
      Node.prototype.removeChild = function(child) {
        if (child && child.parentNode !== this) {
          if (child.parentNode) {
            return child.parentNode.removeChild(child);
          }
          return child;
        }
        return origRemove.apply(this, arguments);
      };

      const origInsert = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function(newNode, referenceNode) {
        if (referenceNode && referenceNode.parentNode !== this) {
          if (referenceNode.parentNode) {
            return referenceNode.parentNode.insertBefore(newNode, referenceNode);
          }
          return newNode;
        }
        return origInsert.apply(this, arguments);
      };
    }
  } catch (e) {
    console.warn('[translationService] DOM patch notice:', e);
  }
}

class TranslationEngine {
  constructor() {
    this.listeners = new Set();
    this.currentLanguage = 'en';
    this.isInitialized = false;

    if (typeof window !== 'undefined') {
      patchReactDomForTranslation();
      this.currentLanguage = this.detectInitialLanguage();
      this.initGoogleTranslate();
    }
  }

  detectInitialLanguage() {
    try {
      // 1. Check localStorage
      const stored = localStorage.getItem('dcvc_language');
      if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
        return stored;
      }

      // 2. Check googtrans cookie: googtrans=/en/es
      const match = document.cookie.match(/googtrans=\/[a-zA-Z-]+\/([a-zA-Z-]+)/);
      if (match && match[1]) {
        const found = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === match[1].toLowerCase());
        if (found) return found.code;
      }
    } catch {
      // Ignore in strict contexts
    }
    return 'en';
  }

  initGoogleTranslate() {
    if (typeof window === 'undefined') return;

    // Define the global Google Translate callback
    window.googleTranslateElementInit = () => {
      try {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: SUPPORTED_LANGUAGES.map(l => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          }, 'google_translate_element');

          this.isInitialized = true;

          // If a non-English language was pre-selected, apply it once ready
          if (this.currentLanguage && this.currentLanguage !== 'en') {
            setTimeout(() => this.applyGoogleTranslate(this.currentLanguage), 500);
          }
        }
      } catch (err) {
        console.warn('[translationService] Init error:', err);
      }
    };

    // Ensure container exists
    let container = document.getElementById('google_translate_element');
    if (!container) {
      container = document.createElement('div');
      container.id = 'google_translate_element';
      container.style.display = 'none';
      container.setAttribute('aria-hidden', 'true');
      document.body.appendChild(container);
    }

    // Inject Google Translate script if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }
  }

  setLanguage(code) {
    const target = SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
    this.currentLanguage = target.code;

    try {
      localStorage.setItem('dcvc_language', target.code);
    } catch {
      // Ignore
    }

    // Set document lang and dir attributes
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', target.code);
      document.documentElement.setAttribute('dir', target.dir || 'ltr');
    }

    // Apply Google Translate
    this.applyGoogleTranslate(target.code);

    // Notify listeners
    this.notify();
  }

  applyGoogleTranslate(langCode) {
    if (typeof document === 'undefined') return;

    if (langCode === 'en') {
      // Clear cookies for all domains and paths
      const domains = [
        window.location.hostname,
        '.' + window.location.hostname,
        ''
      ];
      domains.forEach(d => {
        const domainStr = d ? `; domain=${d}` : '';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${domainStr}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=""${domainStr}`;
      });

      // Reset the select combo if present
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = 'en';
        combo.dispatchEvent(new Event('change'));
      }

      // Check if translation banner is present; if so, trigger revert or soft reload if needed
      const banner = document.querySelector('.goog-te-banner-frame');
      if (banner && combo) {
        try {
          const revertBtn = banner.contentDocument?.querySelector('.goog-te-button button');
          if (revertBtn) revertBtn.click();
        } catch {
          // Cross-origin iframe guard
        }
      }
      return;
    }

    // Set cookie for Google Translate
    const cookieValue = `/en/${langCode}`;
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    if (window.location.hostname) {
      document.cookie = `googtrans=${cookieValue}; domain=${window.location.hostname}; path=/;`;
    }

    // Try finding Google's dropdown combo
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change'));
    } else {
      // Poll briefly if script is still initializing
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const delayedCombo = document.querySelector('.goog-te-combo');
        if (delayedCombo) {
          clearInterval(interval);
          delayedCombo.value = langCode;
          delayedCombo.dispatchEvent(new Event('change'));
        } else if (attempts > 12) {
          clearInterval(interval);
        }
      }, 250);
    }
  }

  getLanguage() {
    return this.currentLanguage;
  }

  getCurrentLanguageObj() {
    return SUPPORTED_LANGUAGES.find(l => l.code === this.currentLanguage) || SUPPORTED_LANGUAGES[0];
  }

  t(key, fallback = '') {
    const dict = UI_DICTIONARY[this.currentLanguage] || UI_DICTIONARY.en;
    if (dict && dict[key]) return dict[key];
    if (UI_DICTIONARY.en && UI_DICTIONARY.en[key]) return UI_DICTIONARY.en[key];
    return fallback || key;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentLanguage, this.getCurrentLanguageObj());
      } catch (e) {
        console.error('[translationService] Listener error:', e);
      }
    }
  }
}

export const translationService = new TranslationEngine();

