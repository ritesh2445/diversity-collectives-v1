// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — HANDS-FREE VOICE COMMAND ENGINE
// Comprehensive Voice Control Engine (WCAG 2.2 AAA & Hands-Free Assistive Tech)
// Supports: Voice Scrolling, Tapping, Route Navigation, Audio, Search & Accessibility
// ==========================================================================

export const VOICE_ROUTES = [
  { path: '/', label: 'Home', keywords: ['home', 'homepage', 'main', 'index', 'start'] },
  { path: '/about', label: 'About Us', keywords: ['about', 'about us', 'mission', 'our story', 'history', 'who we are'] },
  { path: '/board-and-staff', label: 'Board & Staff', keywords: ['board', 'staff', 'team', 'leadership', 'board and staff', 'directors', 'executives', 'people'] },
  { path: '/sponsors', label: 'Sponsors & Alliances', keywords: ['sponsor', 'sponsors', 'partner', 'partners', 'alliance', 'alliances', 'supporter', 'supporters'] },
  { path: '/programs', label: 'Programs & Health Care', keywords: ['program', 'programs', 'service', 'services', 'healthcare', 'health care', 'clinical', 'care'] },
  { path: '/programs/diversity-shines', label: 'Diversity SHINES Clinic', keywords: ['diversity shines', 'shines', 'rapid testing', 'hiv testing', 'sti screening', 'testing clinic', 'free testing'] },
  { path: '/programs/rainbow-umbrella', label: 'Rainbow Umbrella Youth Group', keywords: ['rainbow umbrella', 'youth group', 'youth circle', 'teen group', 'teens', 'youth'] },
  { path: '/programs/little-unicorns', label: 'Little Unicorns Kids Group', keywords: ['little unicorns', 'unicorns', 'kids group', 'children', 'kids circle', 'family group'] },
  { path: '/programs/community-resource-center', label: 'Community Resource Center', keywords: ['resource center', 'crc', 'sanctuary', 'community center'] },
  { path: '/community', label: 'Community & Peer Groups', keywords: ['community', 'peer groups', 'peer group', 'groups', 'circles', 'peer support', 'gatherings'] },
  { path: '/events', label: 'Cultural Calendar & Events', keywords: ['event', 'events', 'calendar', 'cultural calendar', 'gatherings', 'upcoming events', 'schedule'] },
  { path: '/directory', label: 'Affirming Business Directory', keywords: ['directory', 'business directory', 'affirming business', 'businesses', 'local business', 'shops', 'providers'] },
  { path: '/directory/submit', label: 'Submit Business Listing', keywords: ['submit business', 'add business', 'list business', 'new business'] },
  { path: '/training', label: 'P.R.I.D.E. Training Catalog', keywords: ['training', 'pride training', 'workshop', 'workshops', 'classes', 'education'] },
  { path: '/training/book', label: 'Book Training Session', keywords: ['book training', 'schedule training', 'request training'] },
  { path: '/resources', label: 'Support & Crisis Resources', keywords: ['resource', 'resources', 'crisis', 'helpline', 'emergency', 'help', 'support hotline'] },
  { path: '/news', label: 'News & Articles', keywords: ['news', 'article', 'articles', 'blog', 'posts', 'updates', 'stories', 'press'] },
  { path: '/gallery', label: 'Community Photo Gallery', keywords: ['gallery', 'photo', 'photos', 'picture', 'pictures', 'images', 'memory lane', 'album'] },
  { path: '/volunteer', label: 'Volunteer Pathways', keywords: ['volunteer', 'volunteering', 'get involved', 'join team', 'volunteer application'] },
  { path: '/donate', label: 'Donate & Sustainer Giving', keywords: ['donate', 'donation', 'giving', 'give', 'pledge', 'support mission', 'zeffy'] },
  { path: '/appreciation-card/preview', label: 'Appreciation Cards Preview', keywords: ['appreciation card', 'donor card', 'keepsake', 'card preview'] },
  { path: '/contact', label: 'Contact & Physical Sanctuary', keywords: ['contact', 'contact us', 'phone', 'location', 'hours', 'address', 'reach out', 'where are you'] },
  { path: '/accessibility', label: 'Accessibility Statement', keywords: ['accessibility', 'accessibility statement', 'a11y', 'wcag'] },
  { path: '/accessibility-feedback', label: 'Accessibility Feedback', keywords: ['accessibility feedback', 'report barrier', 'a11y feedback'] },
  { path: '/privacy', label: 'Privacy Policy', keywords: ['privacy', 'privacy policy', 'confidentiality'] },
  { path: '/terms', label: 'Terms & Conditions', keywords: ['terms', 'terms and conditions', 'terms of service'] }
];

export const VOICE_COMMAND_CATEGORIES = [
  {
    name: 'Scrolling',
    icon: '📜',
    examples: ['scroll to top', 'scroll down', 'scroll up', 'scroll to bottom', 'scroll halfway']
  },
  {
    name: 'Tapping & Clicking',
    icon: '🎯',
    examples: ['tap donate', 'tap submit', 'tap explore free programs', 'tap close', 'tap rapid testing']
  },
  {
    name: 'Open Pages',
    icon: '🧭',
    examples: ['open page home', 'open about', 'open programs', 'open events', 'open directory', 'open contact']
  },
  {
    name: 'Reading & Audio',
    icon: '🔊',
    examples: ['read page', 'pause', 'stop speech', 'next paragraph', 'previous', 'focus music']
  },
  {
    name: 'Search & Chatbot',
    icon: '🔍',
    examples: ['search for counseling', 'clear search', 'ask alba', 'open chat', 'close chat']
  },
  {
    name: 'Display & Contrast',
    icon: '🎨',
    examples: ['larger font', 'smaller font', 'contrast', 'reading ruler', 'screen mask', 'reset all']
  },
  {
    name: 'Safety & Utility',
    icon: '🛡️',
    examples: ['quick exit', 'replay welcome', 'stop mic', 'help']
  }
];

/**
 * Parses raw speech text into a structured intent
 * @param {string} rawText 
 * @returns {object|null} Intent object or null if unrecognized
 */
export function parseVoiceIntent(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.toLowerCase().trim().replace(/[.,!?;:]/g, '');

  if (!text) return null;

  // 1. HELP & COMMANDS
  if (
    text === 'help' || 
    text === 'commands' || 
    text === 'voice help' || 
    text === 'voice commands' || 
    text === 'show commands' || 
    text === 'what can i say' ||
    text.includes('list commands')
  ) {
    return { type: 'HELP' };
  }

  // 2. SCROLLING (Top, Bottom, Halfway, Down, Up)
  if (
    text === 'scroll to top' ||
    text === 'scroll top' ||
    text === 'go to top' ||
    text === 'jump to top' ||
    text === 'top of page' ||
    text === 'page top' ||
    text === 'back to top' ||
    text === 'to top' ||
    text === 'top'
  ) {
    return { type: 'SCROLL', target: 'top' };
  }

  if (
    text === 'scroll to bottom' ||
    text === 'scroll bottom' ||
    text === 'go to bottom' ||
    text === 'jump to bottom' ||
    text === 'bottom of page' ||
    text === 'end of page' ||
    text === 'to bottom' ||
    text === 'bottom'
  ) {
    return { type: 'SCROLL', target: 'bottom' };
  }

  if (
    text === 'scroll halfway' ||
    text === 'scroll to middle' ||
    text === 'middle of page' ||
    text === 'halfway down' ||
    text === 'halfway' ||
    text === 'middle'
  ) {
    return { type: 'SCROLL', target: 'halfway' };
  }

  if (
    text.includes('fast scroll down') ||
    text.includes('scroll more') ||
    text.includes('more down')
  ) {
    return { type: 'SCROLL', target: 'fast_down' };
  }

  if (
    text.includes('scroll a little') ||
    text.includes('a bit down') ||
    text.includes('scroll slightly') ||
    text.includes('little down')
  ) {
    return { type: 'SCROLL', target: 'small_down' };
  }

  if (
    text === 'scroll down' ||
    text === 'page down' ||
    text === 'move down' ||
    text === 'go down' ||
    text.endsWith('scroll down') ||
    text === 'down'
  ) {
    return { type: 'SCROLL', target: 'down' };
  }

  if (
    text === 'scroll up' ||
    text === 'page up' ||
    text === 'move up' ||
    text === 'go up' ||
    text.endsWith('scroll up') ||
    text === 'up'
  ) {
    return { type: 'SCROLL', target: 'up' };
  }

  // 3. SEARCH & FORMS
  const searchMatch = text.match(/^(?:search for|search|find|filter)\s+(.+)$/i);
  if (searchMatch) {
    const query = searchMatch[1].trim();
    return { type: 'SEARCH', query };
  }

  if (text === 'clear search' || text === 'reset search') {
    return { type: 'CLEAR_SEARCH' };
  }

  if (text === 'submit form' || text === 'send message' || text === 'submit') {
    return { type: 'SUBMIT_FORM' };
  }

  // 4. CHATBOT CONTROLS
  if (
    text === 'open chat' ||
    text === 'open chatbot' ||
    text === 'ask alba' ||
    text === 'open alba' ||
    text === 'talk to alba' ||
    text === 'ask dcvc' ||
    text === 'talk to ai' ||
    text === 'ask ai' ||
    text === 'start chat'
  ) {
    return { type: 'CHATBOT', action: 'open' };
  }

  if (
    text === 'close chat' ||
    text === 'close chatbot' ||
    text === 'close alba' ||
    text === 'hide alba' ||
    text === 'hide chat'
  ) {
    return { type: 'CHATBOT', action: 'close' };
  }

  // 5. SAFETY & UTILITY
  if (
    text === 'quick exit' ||
    text === 'emergency exit' ||
    text === 'leave site' ||
    text === 'safety exit' ||
    text === 'exit site'
  ) {
    return { type: 'QUICK_EXIT' };
  }

  if (
    text === 'stop mic' ||
    text === 'stop listening' ||
    text === 'turn off mic' ||
    text === 'mute mic'
  ) {
    return { type: 'MIC', action: 'stop' };
  }

  if (
    text === 'replay welcome' ||
    text === 'replay animation' ||
    text === 'play welcome'
  ) {
    return { type: 'REPLAY_WELCOME' };
  }

  // 6. READING & AUDIO ALOUD
  if (
    text === 'read page' ||
    text === 'read aloud' ||
    text === 'read' ||
    text === 'speak' ||
    text === 'play audio' ||
    text === 'start reading' ||
    text === 'listen'
  ) {
    return { type: 'READ_ALOUD', action: 'play' };
  }

  if (
    text === 'pause reading' ||
    text === 'pause audio' ||
    text === 'pause speech' ||
    text === 'pause' ||
    text === 'hold'
  ) {
    return { type: 'READ_ALOUD', action: 'pause' };
  }

  if (
    text === 'stop reading' ||
    text === 'stop speech' ||
    text === 'stop audio' ||
    text === 'silence' ||
    text === 'quiet' ||
    text === 'stop'
  ) {
    return { type: 'READ_ALOUD', action: 'stop' };
  }

  if (
    text === 'next paragraph' ||
    text === 'next section' ||
    text === 'skip forward' ||
    text === 'next'
  ) {
    return { type: 'READ_ALOUD', action: 'next' };
  }

  if (
    text === 'previous paragraph' ||
    text === 'previous section' ||
    text === 'skip back' ||
    text === 'rewind' ||
    text === 'previous' ||
    text === 'back'
  ) {
    return { type: 'READ_ALOUD', action: 'prev' };
  }

  // 7. VISUAL, FONT & ACCESSIBILITY CONTROLS
  if (
    text === 'larger font' ||
    text === 'increase font' ||
    text === 'bigger font' ||
    text === 'bigger text' ||
    text === 'larger text' ||
    text === 'zoom in' ||
    text === 'make font bigger'
  ) {
    return { type: 'FONT', action: 'increase' };
  }

  if (
    text === 'smaller font' ||
    text === 'decrease font' ||
    text === 'smaller text' ||
    text === 'zoom out' ||
    text === 'make font smaller'
  ) {
    return { type: 'FONT', action: 'decrease' };
  }

  if (
    text === 'reset font' ||
    text === 'default font' ||
    text === 'normal font' ||
    text === 'normal text'
  ) {
    return { type: 'FONT', action: 'reset' };
  }

  if (
    text === 'contrast' ||
    text === 'high contrast' ||
    text === 'switch theme' ||
    text === 'toggle theme' ||
    text === 'theme' ||
    text === 'colors' ||
    text === 'dark mode' ||
    text === 'invert'
  ) {
    return { type: 'THEME', action: 'cycle' };
  }

  if (
    text === 'ruler' ||
    text === 'reading ruler' ||
    text === 'toggle ruler' ||
    text === 'show ruler' ||
    text === 'hide ruler'
  ) {
    return { type: 'TOOL', tool: 'ruler' };
  }

  if (
    text === 'mask' ||
    text === 'screen mask' ||
    text === 'toggle mask' ||
    text === 'show mask' ||
    text === 'hide mask'
  ) {
    return { type: 'TOOL', tool: 'mask' };
  }

  if (
    text === 'music' ||
    text === 'focus music' ||
    text === 'ambient sound' ||
    text === 'ambient music' ||
    text === 'play music' ||
    text === 'stop music' ||
    text === 'toggle music'
  ) {
    return { type: 'MUSIC', action: 'toggle' };
  }

  if (text === 'volume up' || text === 'louder') {
    return { type: 'MUSIC', action: 'vol_up' };
  }

  if (text === 'volume down' || text === 'quieter' || text === 'softer') {
    return { type: 'MUSIC', action: 'vol_down' };
  }

  if (
    text === 'open toolbar' ||
    text === 'show toolbar' ||
    text === 'open accessibility' ||
    text === 'show accessibility'
  ) {
    return { type: 'TOOLBAR', action: 'open' };
  }

  if (
    text === 'close toolbar' ||
    text === 'hide toolbar' ||
    text === 'close menu' ||
    text === 'dismiss'
  ) {
    return { type: 'TOOLBAR', action: 'close' };
  }

  if (
    text === 'reset all' ||
    text === 'reset settings' ||
    text === 'restore defaults'
  ) {
    return { type: 'RESET_ALL' };
  }

  // 8. TAPPING / CLICKING
  // e.g. "tap donate", "click submit", "press download", "select rapid testing"
  const tapMatch = text.match(/^(?:tap|click|press|select|choose|hit)\s+(.+)$/i);
  if (tapMatch) {
    const rawTarget = tapMatch[1].trim();
    if (rawTarget) {
      return { type: 'TAP', target: rawTarget };
    }
  }

  // 9. OPEN PAGE & NAVIGATION
  // e.g. "open page home", "go to events", "open about", "visit contact", "show programs"
  const navPrefixMatch = text.match(/^(?:open page|go to page|navigate to page|open|go to|visit|navigate to|show)\s+(.+)$/i);
  if (navPrefixMatch) {
    const query = navPrefixMatch[1].trim();
    const matchedRoute = findRouteByQuery(query);
    if (matchedRoute) {
      return { type: 'NAVIGATE', path: matchedRoute.path, label: matchedRoute.label };
    }
    // If not matched directly to a route, treat as a potential interactive tap target
    return { type: 'TAP', target: query };
  }

  // 10. Check direct single-word or phrase navigation without prefix (e.g. "donate", "programs", "events")
  const directRoute = findRouteByQuery(text);
  if (directRoute && !['read', 'stop', 'play', 'pause', 'help'].includes(text)) {
    return { type: 'NAVIGATE', path: directRoute.path, label: directRoute.label };
  }

  // Fallback: If nothing matched, try tapping as an interactive element
  return { type: 'TAP', target: text };
}

/**
 * Finds a matching route from query
 */
export function findRouteByQuery(query) {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  // 1. Exact match on label or path
  for (const r of VOICE_ROUTES) {
    if (r.label.toLowerCase() === clean || r.path.toLowerCase() === clean) {
      return r;
    }
  }

  // 2. Exact match in keywords
  for (const r of VOICE_ROUTES) {
    if (r.keywords.includes(clean)) {
      return r;
    }
  }

  // 3. Whole-phrase or word-boundary match in keywords
  for (const r of VOICE_ROUTES) {
    if (r.keywords.some((k) => {
      if (k === clean) return true;
      if (clean.startsWith(k + ' ') || clean.endsWith(' ' + k)) return true;
      if (k.length >= 5 && clean.includes(k)) return true;
      return false;
    })) {
      return r;
    }
  }

  return null;
}

/**
 * Hands-Free Element Tapper
 * Searches visible interactive elements, scrolls to match, highlights with visual pulse ring, and clicks
 */
export function tapElementByVoice(rawTarget, context = {}) {
  if (typeof document === 'undefined') return false;

  const cleanTarget = rawTarget
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/\s+(button|btn|link|tab|pill|icon)$/i, '')
    .trim()
    .toLowerCase();

  if (!cleanTarget) return false;

  const candidates = Array.from(
    document.querySelectorAll(
      'button, a, input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], [role="button"], [role="link"], [role="tab"], [tabindex="0"], label'
    )
  ).filter((el) => {
    if (el.disabled || el.getAttribute('aria-hidden') === 'true') return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  let bestMatch = null;
  let bestScore = -1;
  let matchedLabel = '';

  for (const el of candidates) {
    const textContent = (el.innerText || el.textContent || '').trim().toLowerCase();
    const ariaLabel = (el.getAttribute('aria-label') || '').trim().toLowerCase();
    const title = (el.getAttribute('title') || '').trim().toLowerCase();
    const value = (el.value || '').trim().toLowerCase();
    const alt = (el.querySelector('img')?.getAttribute('alt') || '').trim().toLowerCase();

    const texts = [textContent, ariaLabel, title, value, alt].filter(Boolean);

    for (const t of texts) {
      if (t === cleanTarget) {
        bestMatch = el;
        bestScore = 100;
        matchedLabel = t;
        break;
      }
      if (t.startsWith(cleanTarget) && bestScore < 80) {
        bestMatch = el;
        bestScore = 80;
        matchedLabel = t;
      } else if (new RegExp(`\\b${cleanTarget}\\b`, 'i').test(t) && bestScore < 70) {
        bestMatch = el;
        bestScore = 70;
        matchedLabel = t;
      } else if (t.includes(cleanTarget) && bestScore < 50) {
        bestMatch = el;
        bestScore = 50;
        matchedLabel = t;
      }
    }
    if (bestScore === 100) break;
  }

  if (bestMatch) {
    bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Golden specular ripple flash
    const origOutline = bestMatch.style.outline;
    const origBoxShadow = bestMatch.style.boxShadow;
    const origTransition = bestMatch.style.transition;
    bestMatch.style.transition = 'all 0.25s ease';
    bestMatch.style.outline = '3px solid #F59E0B';
    bestMatch.style.outlineOffset = '3px';
    bestMatch.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.95)';

    setTimeout(() => {
      try {
        bestMatch.style.outline = origOutline;
        bestMatch.style.boxShadow = origBoxShadow;
        bestMatch.style.transition = origTransition;
      } catch (e) {}
    }, 1100);

    // Trigger click
    bestMatch.click();

    const shortLabel = matchedLabel.length > 28 ? matchedLabel.slice(0, 25) + '...' : matchedLabel;
    if (context.setSpeechFeedback) {
      context.setSpeechFeedback(`Tapped: "${shortLabel || cleanTarget}" 🎯`);
    }
    if (context.announce) {
      context.announce(`Tapped ${shortLabel || cleanTarget}`);
    }
    return true;
  }

  // Fallback: Check if target matches a known page route
  const fallbackRoute = findRouteByQuery(cleanTarget);
  if (fallbackRoute && context.handleNavigate) {
    context.handleNavigate(fallbackRoute.path, fallbackRoute.label);
    return true;
  }

  return false;
}
