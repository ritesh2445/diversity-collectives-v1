// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — TRANSLATION SERVICE v3
//
// Architecture:
//   1. Static JSON dictionaries in /public/i18n/{lang}.json (pre-translated)
//      → loaded once per language, cached in memory + localStorage
//   2. MutationObserver re-applies translations after every React re-render
//      → debounced at 150ms, guarded by translationRunId to avoid loops
//   3. English revert: instant WeakMap restore (zero reload, zero GT)
//   4. Google Translate widget: kept as supplemental deep-pass for any
//      phrases not in the dictionary
//   5. Fallback for unlisted phrases: Worker /api/translate on demand
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
  { code: 'hy', label: 'Armenian', nativeName: 'Հայερեն', flag: '🇦🇲' },
  { code: 'id', label: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
];

// ---------------------------------------------------------------------------
// Instant UI dictionary (nav/button labels for the 7 most common languages)
// These are applied synchronously on language switch — zero network wait.
// ---------------------------------------------------------------------------
const UI_DICTIONARY = {
  en: {
    nav_about: 'About', nav_programs: 'Programs', nav_directory: 'Directory',
    nav_training: 'Training', nav_community: 'Community', nav_events: 'Events',
    nav_resources: 'Resources', nav_news: 'News', nav_gallery: 'Gallery',
    nav_donate: 'Donate', nav_donate_tax_deductible: 'Donate (Tax-Deductible)', nav_call_sanctuary: 'Call: (805) 644-LGBT', nav_get_support: 'Get Support',
    nav_quick_exit: 'Quick Exit', nav_search: 'Search',
    lang_select: 'Language', lang_switch: 'Select Language',
    a11y_companion: 'Accessibility & Audio Tools',
    search_placeholder: 'Search resources, programs, articles...',
    chatbot_welcome: "Hello! I'm Luna, your free community guide. Ask me about our free health testing, youth groups, center hours, events, or volunteer opportunities.",
    chatbot_suggestions: 'Suggested Questions',
    chatbot_send: 'Send',
    chatbot_error: "I couldn't find verified information about that on the DCVC website. Please contact the Diversity Collective team for confirmation.",
    chatbot_clear: 'Conversation cleared. Ask me about our free health testing, youth groups, center hours, events, or volunteer opportunities.',
    chatbot_loading: 'Consulting verified DCVC records...',
    chatbot_disclaimer: 'Informational only • Not medical/legal advice',
    chatbot_subtitle: 'DCVC Community Guide • Ventura County',
    chatbot_placeholder: 'Say hi or ask anything about DCVC...',
    chatbot_send_question: 'Send question',
    chatbot_q_services: 'Are your services free?',
    chatbot_q_events: 'What events are coming up?',
    chatbot_q_center: 'Where is the Community Resource Center?',
    chatbot_q_volunteer: 'How can I volunteer?',
    chatbot_q_rainbow: 'What is Rainbow Umbrella?',
    chatbot_q_training: 'Do you offer training?',
    chatbot_q_donate: 'How can I donate?',
    impact_stat1: 'years serving and advocating for Ventura County’s LGBTQ+ community.',
    impact_stat2: 'free, confidential HIV & STI screenings delivered through Diversity SHINES.',
    impact_stat3: 'LGBTQ+ youth empowered through Rainbow Umbrella peer circles & Pride Prom.',
    impact_stat4: 'free and confidential care—no insurance or fees ever required.',
    impact_stat5: 'Ventura County cities united through affirming programs and mutual aid.',
    impact_explore: 'Explore',
  },
  es: {
    nav_about: 'Acerca de', nav_programs: 'Programas', nav_directory: 'Directorio',
    nav_training: 'Capacitación', nav_community: 'Comunidad', nav_events: 'Eventos',
    nav_resources: 'Recursos', nav_news: 'Noticias', nav_gallery: 'Galería',
    nav_donate: 'Donar', nav_donate_tax_deductible: 'Donación Deducible', nav_call_sanctuary: 'Llamar: (805) 644-LGBT', nav_get_support: 'Obtener Apoyo',
    nav_quick_exit: 'Salida Rápida', nav_search: 'Buscar',
    lang_select: 'Idioma', lang_switch: 'Seleccionar Idioma',
    a11y_companion: 'Herramientas de Accesibilidad',
    search_placeholder: 'Buscar recursos, programas, artículos...',
    popup_dismiss: 'Descartar',
    popup_view_details: 'Ver Detalles',
    impact_explore: 'Explorar',
    impact_stat1: 'años sirviendo y defendiendo a la comunidad LGBTQ+ del Condado de Ventura.',
    impact_stat2: 'pruebas gratuitas y confidenciales de VIH e ITS brindadas mediante Diversity SHINES.',
    impact_stat3: 'jóvenes LGBTQ+ empoderados mediante círculos de apoyo de Rainbow Umbrella y Pride Prom.',
    impact_stat4: 'atención gratuita y confidencial—sin necesidad de seguro médico ni costos.',
    impact_stat5: 'ciudades del Condado de Ventura unidas a través de programas de afirmación y ayuda mutua.',
    chatbot_welcome: "¡Hola! Soy Luna, tu guía comunitaria gratuita. Pregúntame sobre pruebas de salud gratuitas, grupos juveniles, horario del centro, eventos u oportunidades de voluntariado.",
    chatbot_suggestions: 'Preguntas Sugeridas',
    chatbot_send: 'Enviar',
    chatbot_error: "No pude encontrar información verificada sobre eso en el sitio web de DCVC. Comuníquese con el equipo de Diversity Collective para confirmación.",
    chatbot_clear: 'Conversación borrada. Pregúntame sobre pruebas de salud gratuitas, grupos juveniles, horario del centro, eventos u oportunidades de voluntariado.',
    chatbot_loading: 'Consultando registros verificados de DCVC...',
    chatbot_disclaimer: 'Solo informativo • No es consejo médico/legal',
    chatbot_subtitle: 'Guía Comunitaria DCVC • Condado de Ventura',
    chatbot_placeholder: 'Di hola o pregúntame cualquier cosa sobre DCVC...',
    chatbot_send_question: 'Enviar pregunta',
    chatbot_q_services: '¿Sus servicios son gratuitos?',
    chatbot_q_events: '¿Qué eventos se aproximan?',
    chatbot_q_center: '¿Dónde está el Centro de Recursos?',
    chatbot_q_volunteer: '¿Cómo puedo ser voluntario?',
    chatbot_q_rainbow: '¿Qué es Rainbow Umbrella?',
    chatbot_q_training: '¿Ofrecen capacitaciones?',
    chatbot_q_donate: '¿Cómo puedo donar?',
  },
  tl: {
    nav_about: 'Tungkol', nav_programs: 'Mga Programa', nav_directory: 'Direktoryo',
    nav_training: 'Pagsasanay', nav_community: 'Komunidad', nav_events: 'Mga Kaganapan',
    nav_resources: 'Mga Mapagkukunan', nav_news: 'Balita', nav_gallery: 'Galerya',
    nav_donate: 'Mag-donate', nav_get_support: 'Kumuha ng Suporta',
    nav_quick_exit: 'Mabilisang Pag-alis', nav_search: 'Hanapin',
    lang_select: 'Wika', lang_switch: 'Pumili ng Wika',
    a11y_companion: 'Mga Kagamitan sa Accessibility',
    search_placeholder: 'Maghanap ng mga programa, artikulo...',
    popup_dismiss: 'I-dismiss',
    popup_view_details: 'Maging Tanyag ng Detalye',
    impact_explore: 'Pag-aralan',
    chatbot_welcome: "Kamusta! Ako si Luna, iyong libreng gabay sa komunidad. Tanungin ko tungkol sa libreng pagpapatupad ng pagsubok sa kalusugan, mga grupu ng kabataan, oras ng centro, mga kaganapan, o mga pagkakataong mag-volunteer.",
    chatbot_suggestions: 'Mungkahi na Tanong',
    chatbot_send: 'Ipadala',
    chatbot_error: "Hindi ko matagpuan ang nakabalidong impormasyon tungkol dito sa website ng DCVC. Makipag-ugnayan sa team ng Diversity Collective para sa konfirmasyon.",
    chatbot_clear: 'Usapin ay alisin. Tanungin ko tungkol sa libreng pagpapatupad ng pagsubok sa kalusugan, mga grupu ng kabataan, oras ng centro, mga kaganapan, o mga pagkakataong mag-volunteer.',
    chatbot_loading: 'Sinasuri ang nakabalidong rekord ng DCVC...',
    chatbot_disclaimer: 'Para sa impormasyon lamang • Hindi payo sa medikal/legal',
    chatbot_subtitle: 'Gabay sa Komunidad DCVC • Ventura County',
    chatbot_placeholder: 'Magandang araw o magtanong tungkol sa DCVC...',
    chatbot_send_question: 'Ipadala ang tanong',
  },
  vi: {
    nav_about: 'Giới thiệu', nav_programs: 'Chương trình', nav_directory: 'Danh bạ',
    nav_training: 'Đào tạo', nav_community: 'Cộng đồng', nav_events: 'Sự kiện',
    nav_resources: 'Tài nguyên', nav_news: 'Tin tức', nav_gallery: 'Thư viện',
    nav_donate: 'Quyên góp', nav_get_support: 'Nhận hỗ trợ',
    nav_quick_exit: 'Thoát nhanh', nav_search: 'Tìm kiếm',
    lang_select: 'Ngôn ngữ', lang_switch: 'Chọn ngôn ngữ',
    a11y_companion: 'Công cụ hỗ trợ tiếp cận',
    search_placeholder: 'Tìm kiếm tài nguyên, bài viết...',
    popup_dismiss: 'Bỏ qua',
    popup_view_details: 'Xem chi tiết',
    impact_explore: 'Khám phá',
    chatbot_welcome: "Xin chào! Tôi là Luna, người hướng dẫn cộng đồng miễn phí của bạn. Hỏi tôi về kiểm tra sức khỏe miễn phí, nhóm thanh thiếu niên, giờ làm việc của trung tâm, sự kiện, hoặc cơ hội tình nguyện.",
    chatbot_suggestions: 'Câu Hỏi Đề Xuất',
    chatbot_send: 'Gửi',
    chatbot_error: "Tôi không thể tìm thấy thông tin đã xác minh về điều đó trên trang web DCVC. Vui lòng liên hệ nhóm Diversity Collective để xác nhận.",
    chatbot_clear: 'Cuộc trò chuyện đã xóa. Hỏi tôi về kiểm tra sức khỏe miễn phí, nhóm thanh thiếu niên, giờ làm việc của trung tâm, sự kiện, hoặc cơ hội tình nguyện.',
    chatbot_loading: 'Tư vấn các bản ghi đã xác minh của DCVC...',
    chatbot_disclaimer: 'Chỉ mang tính tham khảo • Không phải lời khám y tế/pháp lý',
    chatbot_subtitle: 'Hướng Dẫn Cộng đồng DCVC • Ventura County',
    chatbot_placeholder: 'Xin chào hoặc hỏi tôi bất cứ điều gì về DCVC...',
    chatbot_send_question: 'Gửi câu hỏi',
  },
  'zh-CN': {
    nav_about: '关于我们', nav_programs: '项目服务', nav_directory: '企业名录',
    nav_training: '文化培训', nav_community: '社区群体', nav_events: '活动日程',
    nav_resources: '社区资源', nav_news: '最新动态', nav_gallery: '历史画廊',
    nav_donate: '立即捐助', nav_get_support: '获取支持',
    nav_quick_exit: '紧急退出', nav_search: '搜索',
    lang_select: '语言', lang_switch: '选择语言',
    a11y_companion: '无障碍辅助工具',
    search_placeholder: '搜索项目、资源、文章...',
    popup_dismiss: '关闭',
    popup_view_details: '查看详情',
    impact_explore: '探索',
    chatbot_welcome: "你好！我是 Luna，你的免费社区向导。请向我咨询免费健康检测、青年团体、中心开放时间、活动或志愿者机会。",
    chatbot_suggestions: '建议问题',
    chatbot_send: '发送',
    chatbot_error: "我在 DCVC 网站上未找到关于此事的核实信息。请联系 Diversity Collective 团队进行确认。",
    chatbot_clear: '对话已清除。请向我咨询免费健康检测、青年团体、中心开放时间、活动或志愿者机会。',
    chatbot_loading: '正在查询 DCVC 已验证记录...',
    chatbot_disclaimer: '仅供参考 • 不构成医疗/法律建议',
    chatbot_subtitle: 'DCVC 社区向导 • Ventura County',
    chatbot_placeholder: '打招呼或向我询问关于 DCVC 的任何事...',
    chatbot_send_question: '发送问题',
  },
  fr: {
    nav_about: 'À propos', nav_programs: 'Programmes', nav_directory: 'Répertoire',
    nav_training: 'Formation', nav_community: 'Communauté', nav_events: 'Événements',
    nav_resources: 'Ressources', nav_news: 'Actualités', nav_gallery: 'Galerie',
    nav_donate: 'Faire un don', nav_get_support: "Obtenir de l'aide",
    nav_quick_exit: 'Sortie rapide', nav_search: 'Rechercher',
    lang_select: 'Langue', lang_switch: 'Choisir la langue',
    a11y_companion: "Outils d'accessibilité",
    search_placeholder: 'Rechercher des ressources, programmes...',
    popup_dismiss: 'Rejeter',
    popup_view_details: 'Voir les détails',
    impact_explore: 'Explorer',
    chatbot_welcome: "Bonjour ! Je suis Luna, votre guide communautaire gratuit. Demandez-moi des informations sur nos tests de santé gratuits, groupes de jeunes, horaires du centre, événements ou opportunités de bénévolat.",
    chatbot_suggestions: 'Questions Suggérées',
    chatbot_send: 'Envoyer',
    chatbot_error: "Je n'ai pas pu trouver d'informations vérifiées à ce sujet sur le site web de DCVC. Veuillez contacter l'équipe de Diversity Collective pour confirmation.",
    chatbot_clear: 'Conversation effacée. Demandez-moi des informations sur nos tests de santé gratuits, groupes de jeunes, horaires du centre, événements ou opportunités de bénévolat.',
    chatbot_loading: 'Consultation des enregistrements vérifiés DCVC...',
    chatbot_disclaimer: 'À titre informatif uniquement • Pas un avis médical/juridique',
    chatbot_subtitle: 'Guide Communautaire DCVC • Comté de Ventura',
    chatbot_placeholder: 'Bonjour ou posez-moi n\'importe quelle question sur DCVC...',
    chatbot_send_question: 'Envoyer une question',
  },
  de: {
    nav_about: 'Über uns', nav_programs: 'Programme', nav_directory: 'Verzeichnis',
    nav_training: 'Training', nav_community: 'Gemeinschaft', nav_events: 'Veranstaltungen',
    nav_resources: 'Ressourcen', nav_news: 'Nachrichten', nav_gallery: 'Galerie',
    nav_donate: 'Spenden', nav_get_support: 'Hilfe erhalten',
    nav_quick_exit: 'Schnell raus', nav_search: 'Suchen',
    lang_select: 'Sprache', lang_switch: 'Sprache wählen',
    a11y_companion: 'Barrierefreiheitswerkzeuge',
    search_placeholder: 'Ressourcen, Programme suchen...',
    popup_dismiss: 'Verwerfen',
    popup_view_details: 'Details ansehen',
    impact_explore: 'Entdecken',
    chatbot_welcome: "Hallo! Ich bin Luna, Ihr kostenloser Community-Guide. Fragen Sie mich nach kostenlosen Gesundheitstests, Jugendgruppen, Zentrumsöffnungszeiten, Veranstaltungen oder Ehrenamtsmöglichkeiten.",
    chatbot_suggestions: 'Vorgeschlagene Fragen',
    chatbot_send: 'Senden',
    chatbot_error: "Ich konnte keine verifizierten Informationen dazu auf der DCVC-Website finden. Bitte kontaktieren Sie das Diversity Collective-Team zur Bestätigung.",
    chatbot_clear: 'Unterhaltung gelöscht. Fragen Sie mich nach kostenlosen Gesundheitstests, Jugendgruppen, Zentrumsöffnungszeiten, Veranstaltungen oder Ehrenamtsmöglichkeiten.',
    chatbot_loading: 'Überprüfe verifizierte DCVC-Datensätze...',
    chatbot_disclaimer: 'Nur zu Informationszwecken • Kein medizinischer/Rechtsrat',
    chatbot_subtitle: 'DCVC Community Guide • Ventura County',
    chatbot_placeholder: 'Hallo oder frag mich alles über DCVC...',
    chatbot_send_question: 'Frage senden',
  },
};

// ---------------------------------------------------------------------------
// React DOM patch — prevents "removeChild: not a child" errors that GT causes
// ---------------------------------------------------------------------------
function patchReactDomForTranslation() {
  if (typeof window === 'undefined' || window.__dcvc_dom_patched) return;
  window.__dcvc_dom_patched = true;
  try {
    if (typeof Node === 'function' && Node.prototype) {
      const origRemove = Node.prototype.removeChild;
      Node.prototype.removeChild = function (child) {
        if (child && child.parentNode !== this) {
          if (child.parentNode) return child.parentNode.removeChild(child);
          return child;
        }
        return origRemove.apply(this, arguments);
      };
      const origInsert = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (newNode, referenceNode) {
        if (referenceNode && referenceNode.parentNode !== this) {
          if (referenceNode.parentNode) return referenceNode.parentNode.insertBefore(newNode, referenceNode);
          return newNode;
        }
        return origInsert.apply(this, arguments);
      };
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Nodes we must NOT translate (script/style/meta, GT iframes, aria-live etc.)
// ---------------------------------------------------------------------------
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'HEAD',
  'CODE', 'PRE', 'KBD', 'SAMP', 'VAR',
  'IFRAME', 'OBJECT', 'EMBED', 'CANVAS', 'SVG',
  'INPUT', 'TEXTAREA', 'SELECT', 'OPTION',
]);

function shouldSkipNode(node) {
  if (!node) return true;
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if (node.closest && (
      node.closest('[class*="goog-"]') ||
      node.closest('#google_translate_element') ||
      node.closest('[data-notranslate]') ||
      node.closest('[translate="no"]')
    )) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Collect all translatable text nodes under a root element
// ---------------------------------------------------------------------------
function collectTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (shouldSkipNode(node.parentElement)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

// ---------------------------------------------------------------------------
// TranslationEngine
// ---------------------------------------------------------------------------
class TranslationEngine {
  constructor() {
    this.listeners = new Set();
    this.currentLanguage = 'en';

    // Per-language cache: { [lang]: { [englishText]: translatedText } }
    this._dictCache = {};

    // WeakMap: text node → original English value (for instant revert)
    this._originals = new WeakMap();

    // Run ID: increment on every language switch to cancel stale async ops
    this._runId = 0;

    // MutationObserver for React re-renders
    this._observer = null;
    this._observerDebounce = null;

    // Guard: are we currently writing to DOM?
    this._applyingNow = false;

    if (typeof window !== 'undefined') {
      patchReactDomForTranslation();
      this.currentLanguage = this._detectInitialLanguage();
      if (this.currentLanguage !== 'en') {
        // Slight delay so React mounts first
        setTimeout(() => this._applyLanguage(this.currentLanguage, ++this._runId), 400);
      }
    }
  }

  _detectInitialLanguage() {
    try {
      const stored = localStorage.getItem('dcvc_language');
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) return stored;
    } catch { /* ignore */ }
    return 'en';
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  setLanguageWithReload(code) {
    if (typeof window === 'undefined') return;
    const target = SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
    this.currentLanguage = target.code;
    try {
      localStorage.setItem('dcvc_language', target.code);
    } catch { /* ignore */ }

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', target.code);
      document.documentElement.setAttribute('dir', target.dir || 'ltr');
    }

    // If changing to English, cleanly reset Google Translate cookies across all domains
    if (target.code === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      const host = window.location.hostname;
      if (host) {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host};`;
      }
    } else {
      const cookieValue = `/en/${target.code}`;
      document.cookie = `googtrans=${cookieValue}; path=/;`;
      const host = window.location.hostname;
      if (host && !host.includes('pages.dev')) {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=${host};`;
        document.cookie = `googtrans=${cookieValue}; path=/; domain=.${host};`;
      }
    }

    // Display smooth loading animation overlay
    const overlay = document.createElement('div');
    overlay.id = 'dcvc-lang-reload-overlay';
    overlay.className = 'notranslate';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.92);backdrop-filter:blur(10px);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;opacity:0;transition:opacity 0.25s ease;font-family:system-ui,-apple-system,sans-serif;';
    overlay.innerHTML = `
      <div style="width:48px;height:48px;border:3px solid #f3e8ff;border-top-color:#5A1E65;border-radius:50%;animation:dcvc-spin 0.75s linear infinite;"></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <p style="font-size:14px;font-weight:800;color:#1e1b4b;margin:0;letter-spacing:-0.01em;">
          ${target.flag} Switching to ${target.nativeName}...
        </p>
        <p style="font-size:11px;font-weight:600;color:#6b7280;margin:0;">
          Updating full site translation & interfaces
        </p>
      </div>
      <style>
        @keyframes dcvc-spin { to { transform: rotate(360deg); } }
      </style>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    setTimeout(() => {
      window.location.reload();
    }, 450);
  }

  setLanguage(code) {
    return this.setLanguageWithReload(code);
  }

  getLanguage() { return this.currentLanguage; }

  getCurrentLanguageObj() {
    return SUPPORTED_LANGUAGES.find((l) => l.code === this.currentLanguage) || SUPPORTED_LANGUAGES[0];
  }

  t(key, fallback = '') {
    const dict = UI_DICTIONARY[this.currentLanguage] || {};
    if (dict[key]) return dict[key];
    const enDict = UI_DICTIONARY.en || {};
    if (enDict[key]) return enDict[key];
    return fallback || key;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try { listener(this.currentLanguage, this.getCurrentLanguageObj()); }
      catch (e) { console.error('[translationService] Listener error:', e); }
    }
  }

  // -------------------------------------------------------------------------
  // Core: apply language (load dict → apply DOM → watch re-renders)
  // -------------------------------------------------------------------------

  async _applyLanguage(lang, runId) {
    if (typeof document === 'undefined') return;

    // Load the dictionary (from memory cache, localStorage, or network)
    let dict;
    try {
      dict = await this._loadDict(lang);
    } catch (err) {
      console.warn(`[translationService] Dict load failed for ${lang}:`, err);
      dict = {};
    }

    // Abort if the user switched to another language while we were loading
    if (runId !== this._runId) return;

    this._dictCache[lang] = dict;

    // First pass: apply to full page
    this._applyDictToDOM(dict, document.body, runId);

    // Start MutationObserver to re-apply after React re-renders
    this._startObserver(lang, runId);
  }

  // -------------------------------------------------------------------------
  // Load dictionary: memory → localStorage → network fetch
  // -------------------------------------------------------------------------

  async _loadDict(lang) {
    // 1. Memory cache
    if (this._dictCache[lang]) return this._dictCache[lang];

    // 2. localStorage cache (persisted across sessions)
    try {
      const stored = localStorage.getItem(`dcvc_i18n_${lang}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 10) {
          return parsed;
        }
      }
    } catch { /* ignore */ }

    // 3. Static JSON file from CDN (pre-translated by scripts/pretranslate-site.mjs)
    try {
      const res = await fetch(`/i18n/${lang}.json`, { cache: 'force-cache' });
      if (res.ok) {
        const dict = await res.json();
        // Persist to localStorage for instant load next time
        try { localStorage.setItem(`dcvc_i18n_${lang}`, JSON.stringify(dict)); } catch { /* ignore */ }
        return dict;
      }
    } catch { /* ignore */ }

    // 4. Empty fallback (Google Translate widget still runs in background)
    return {};
  }

  // -------------------------------------------------------------------------
  // Apply dictionary to DOM text nodes
  // -------------------------------------------------------------------------

  _applyDictToDOM(dict, root, runId) {
    if (!root || !dict || Object.keys(dict).length === 0) return;
    if (this._applyingNow) return;

    this._applyingNow = true;
    try {
      const nodes = collectTextNodes(root);
      for (const node of nodes) {
        if (runId !== this._runId) break; // aborted

        const original = this._originals.has(node)
          ? this._originals.get(node)
          : node.nodeValue;

        const trimmed = original.trim();
        if (!trimmed) continue;

        // Save original English text the very first time we see this node
        if (!this._originals.has(node)) {
          this._originals.set(node, node.nodeValue);
        }

        // Look up translation (exact match, then trimmed match)
        const translated = dict[trimmed] || dict[original] || null;
        if (translated && translated !== trimmed) {
          // Preserve leading/trailing whitespace
          const leading = node.nodeValue.match(/^\s*/)?.[0] ?? '';
          const trailing = node.nodeValue.match(/\s*$/)?.[0] ?? '';
          node.nodeValue = leading + translated + trailing;
        }
      }
    } finally {
      this._applyingNow = false;
    }
  }

  // -------------------------------------------------------------------------
  // Instant English revert — restore from WeakMap, no reload
  // -------------------------------------------------------------------------

  _revertToEnglish() {
    this._stopObserver();
    if (typeof document === 'undefined') return;

    // Restore every node we modified
    this._applyingNow = true;
    try {
      const nodes = collectTextNodes(document.body);
      for (const node of nodes) {
        if (this._originals.has(node)) {
          node.nodeValue = this._originals.get(node);
        }
      }
    } finally {
      this._applyingNow = false;
    }

    // Also clear Google Translate cookies + reset widget to be safe
    this._clearGTCookies();
  }

  _clearGTCookies() {
    const domains = [window.location.hostname, '.' + window.location.hostname, ''];
    domains.forEach((d) => {
      const ds = d ? `; domain=${d}` : '';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${ds}`;
    });
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = '';
      try { combo.dispatchEvent(new Event('change', { bubbles: true })); } catch { /* ignore */ }
    }
  }

  // -------------------------------------------------------------------------
  // MutationObserver: re-apply translations after React re-renders
  // -------------------------------------------------------------------------

  _startObserver(lang, runId) {
    this._stopObserver();

    if (typeof MutationObserver === 'undefined') return;

    const handler = (mutations) => {
      if (this._applyingNow) return;
      if (runId !== this._runId) { this._stopObserver(); return; }

      // Check if any mutation added new nodes with text content
      const hasNewTextNodes = mutations.some((m) =>
        m.type === 'childList' && m.addedNodes.length > 0 &&
        Array.from(m.addedNodes).some((n) =>
          n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE
        )
      );

      if (!hasNewTextNodes) return;

      // Debounce: wait 150ms for React to finish its render batch
      clearTimeout(this._observerDebounce);
      this._observerDebounce = setTimeout(() => {
        if (runId !== this._runId) return;
        const dict = this._dictCache[lang] || {};
        this._applyDictToDOM(dict, document.body, runId);
      }, 150);
    };

    this._observer = new MutationObserver(handler);
    this._observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  _stopObserver() {
    clearTimeout(this._observerDebounce);
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }
}

export const translationService = new TranslationEngine();
