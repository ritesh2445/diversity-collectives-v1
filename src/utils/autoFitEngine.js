/**
 * Auto-Fit Engine for Diversity Collective Ventura County
 * Site-Wide Responsive Typography & Button Geometry Resilience
 * 
 * Ensures all interactive buttons, pills, and navigation links maintain rock-solid,
 * stable typography authored by responsive Tailwind CSS without dynamic layout shifts,
 * delayed font jumps, or font-size oscillation loops.
 */

export function initAutoFitEngine() {
  if (typeof window === 'undefined') return;
  if (window.__dcvc_autofit_initialized) return;
  window.__dcvc_autofit_initialized = true;

  // Immediately strip any lingering inline font-size overrides to restore stable authored typography
  const restoreNaturalTypography = () => {
    if (typeof document === 'undefined') return;
    const elementsWithOverrides = document.querySelectorAll('[data-autofit-applied], [data-autofit]');
    elementsWithOverrides.forEach((el) => {
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
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreNaturalTypography);
  } else {
    restoreNaturalTypography();
  }
}

