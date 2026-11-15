/**
 * Auto-Fit Engine for Diversity Collective Ventura County
 * Site-Wide Responsive Typography & Button Geometry Resilience
 * 
 * Automatically ensures that when text expands upon translation
 * (Spanish, German, Tagalog, Vietnamese, etc.) or when screen sizes narrow:
 * 1. Text font-size shrinks dynamically if character count exceeds button/card capacity.
 * 2. Words break and wrap gracefully instead of spilling out horizontally.
 * 3. Button, card, and box layouts stay identical and rock-solid across all languages.
 */

let observer = null;
let resizeTimer = null;

function scanAndFitButtons() {
  if (typeof document === 'undefined') return;

  // Target all interactive CTAs, button pills, and navigation action badges across the entire site
  const targets = document.querySelectorAll(`
    button:not([data-no-autofit]),
    a.btn-primary:not([data-no-autofit]),
    a.btn-secondary:not([data-no-autofit]),
    a.btn-vibrant-coral:not([data-no-autofit]),
    a.btn-dark:not([data-no-autofit]),
    .btn-primary:not([data-no-autofit]),
    .btn-secondary:not([data-no-autofit]),
    .btn-vibrant-coral:not([data-no-autofit]),
    .btn-dark:not([data-no-autofit]),
    .nav-bar-btn:not([data-no-autofit]),
    .nav-donate-btn:not([data-no-autofit]),
    .nav-support-btn:not([data-no-autofit]),
    [data-autofit],
    [role="button"]:not([data-no-autofit]),
    a[class*="rounded-"][class*="py-"]:not([data-no-autofit]),
    button[class*="rounded-"]:not([data-no-autofit])
  `);

  targets.forEach((el) => {
    // Strictly skip any element opted out of auto-fit, toolbar isolated, or notranslate container
    if (
      el.hasAttribute('data-no-autofit') ||
      el.closest('[data-no-autofit]') ||
      el.closest('.a11y-toolbar-isolated') ||
      el.closest('#native-accessibility-companion-ribbon') ||
      el.classList.contains('notranslate') ||
      el.closest('.notranslate')
    ) return;

    // Skip tiny icon-only buttons (< 40px width and height with no visible text)
    const text = el.textContent ? el.textContent.trim() : '';
    if (!text || (text.length < 4 && el.clientWidth < 48)) return;

    // Check character count
    const len = text.length;

    // Measure bounding box & scroll overflow
    const hasHorizontalOverflow = el.scrollWidth > el.clientWidth + 2;

    // Remove any previously set inline styles if short text and no overflow
    if (len <= 20 && !hasHorizontalOverflow) {
      if (el.dataset.autofitApplied) {
        el.style.fontSize = '';
        el.style.lineHeight = '';
        el.style.whiteSpace = '';
        el.style.wordBreak = '';
        el.style.overflowWrap = '';
        el.style.textWrap = '';
        el.querySelectorAll('span, font, div').forEach((child) => {
          child.style.fontSize = '';
          child.style.lineHeight = '';
          child.style.whiteSpace = '';
          child.style.overflowWrap = '';
          child.style.wordBreak = '';
        });
        delete el.dataset.autofitApplied;
      }
      return;
    }

    if (len > 36 || hasHorizontalOverflow) {
      el.style.fontSize = 'clamp(9.5px, 2vw, 11px)';
      el.style.lineHeight = '1.18';
      el.style.whiteSpace = 'normal';
      el.style.wordBreak = 'normal';
      el.style.overflowWrap = 'break-word';
      el.style.textWrap = 'balance';
      el.dataset.autofitApplied = 'true';
      el.querySelectorAll('span, font, div').forEach((child) => {
        child.style.fontSize = 'inherit';
        child.style.lineHeight = 'inherit';
        child.style.whiteSpace = 'normal';
        child.style.overflowWrap = 'break-word';
        child.style.wordBreak = 'normal';
      });
    } else if (len > 22) {
      el.style.fontSize = 'clamp(11px, 2.2vw, 12.5px)';
      el.style.lineHeight = '1.22';
      el.style.whiteSpace = 'normal';
      el.style.wordBreak = 'normal';
      el.style.overflowWrap = 'break-word';
      el.style.textWrap = 'balance';
      el.dataset.autofitApplied = 'true';
      el.querySelectorAll('span, font, div').forEach((child) => {
        child.style.fontSize = 'inherit';
        child.style.lineHeight = 'inherit';
        child.style.whiteSpace = 'normal';
        child.style.overflowWrap = 'break-word';
        child.style.wordBreak = 'normal';
      });
    }
  });
}

export function initAutoFitEngine() {
  if (typeof window === 'undefined') return;
  if (window.__dcvc_autofit_initialized) return;
  window.__dcvc_autofit_initialized = true;

  // Initial run after page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(scanAndFitButtons, 100);
    });
  } else {
    setTimeout(scanAndFitButtons, 100);
  }

  // Listen to window resize with debouncing
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(scanAndFitButtons, 150);
  }, { passive: true });

  // Listen to custom DCVC language changes
  window.addEventListener('dcvc_language_changed', () => {
    setTimeout(scanAndFitButtons, 150);
  });

  // Observe DOM mutations caused by Google Translate or React state transitions
  if (typeof MutationObserver !== 'undefined') {
    let mutationTimer = null;
    observer = new MutationObserver((mutations) => {
      // Check if mutations contain text or child changes
      let shouldScan = false;
      for (const m of mutations) {
        if (m.type === 'characterData' || m.type === 'childList') {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        clearTimeout(mutationTimer);
        mutationTimer = setTimeout(scanAndFitButtons, 200);
      }
    });

    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    } catch {
      // Fallback: poll safely on intervals if observer fails
      setInterval(scanAndFitButtons, 2000);
    }
  }
}
