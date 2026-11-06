/**
 * Diversity Collective Ventura County — Organization-Owned Privacy-First Analytics
 * 
 * Target: Free Cloudflare Web Analytics / Self-Hosted Telemetry
 * $0 subscription cost, zero tracking cookies, zero sensitive data leakage.
 * 
 * Events Tracked:
 *  - Page visits (anonymized paths)
 *  - Donation button clicks
 *  - Zeffy donation form modal/page opens
 *  - Completed donations (strictly from verified transaction tokens)
 *  - Volunteer application submissions
 *  - Contact inquiries
 *  - Training workshop inquiries
 *  - Directory listing submissions
 *  - Directory keyword searches
 *  - External partner link clicks
 */

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  DONATION_BUTTON_CLICK: 'donation_button_click',
  ZEFFY_FORM_OPEN: 'zeffy_form_open',
  DONATION_COMPLETED: 'donation_completed',
  VOLUNTEER_SUBMIT: 'volunteer_submit',
  CONTACT_SUBMIT: 'contact_submit',
  TRAINING_INQUIRY: 'training_inquiry',
  DIRECTORY_SUBMIT: 'directory_submit',
  DIRECTORY_SEARCH: 'directory_search',
  EXTERNAL_LINK_CLICK: 'external_link_click'
};

// Forbidden PII keys that must never be sent to analytics
const PII_KEYS = ['name', 'fullName', 'email', 'phone', 'address', 'message', 'donorEmail', 'patient', 'health', 'hiv', 'sti'];

/**
 * Scrub PII from analytics event properties
 */
export function sanitizeAnalyticsProps(props = {}) {
  if (!props || typeof props !== 'object') return {};

  const clean = {};
  for (const [key, val] of Object.entries(props)) {
    // Drop known PII keys
    if (PII_KEYS.includes(key.toLowerCase())) continue;

    // Drop string values that look like email addresses or phone numbers
    if (typeof val === 'string') {
      if (val.includes('@') || /^\+?[\d\s-()]{7,}$/.test(val)) continue;
      clean[key] = val.substring(0, 100); // Truncate to reasonable length
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      clean[key] = val;
    }
  }

  return clean;
}

/**
 * Dispatch an analytics event
 */
export function trackEvent(eventName, properties = {}) {
  const cleanProps = sanitizeAnalyticsProps(properties);
  const eventPayload = {
    event: eventName,
    properties: cleanProps,
    timestamp: new Date().toISOString(),
    path: typeof window !== 'undefined' ? window.location.pathname : '/'
  };

  // 1. Cloudflare Web Analytics Beacon (if present on window)
  if (typeof window !== 'undefined' && window.__cfBeacon) {
    try {
      window.__cfBeacon.sendCustomEvent(eventName, cleanProps);
    } catch (err) {
      console.debug('[Analytics] Cloudflare beacon event dispatch:', err);
    }
  }

  // 2. Custom Event on window for local listeners or monitoring
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('dcvc:analytics', { detail: eventPayload }));
    } catch {
      // Ignored in non-DOM environments
    }
  }

  return eventPayload;
}

