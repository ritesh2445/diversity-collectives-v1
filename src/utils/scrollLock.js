import { useEffect } from 'react';

/**
 * Global Reference-Counted Scroll Lock Manager.
 * Ensures the background page NEVER scrolls on mobile phones or desktop
 * whenever any modal, drawer, lightbox, or popover window is open.
 *
 * Simultaneously locks both `document.documentElement` and `document.body`
 * to prevent iOS Safari elastic bounce and touch bleed.
 */
let lockCount = 0;
let prevHtmlOverflow = '';
let prevHtmlOverscroll = '';
let prevBodyOverflow = '';
let prevBodyTouchAction = '';
let prevBodyOverscroll = '';

export function lockScroll() {
  if (typeof document === 'undefined') return;

  lockCount++;
  if (lockCount === 1) {
    if (document.documentElement?.style) {
      prevHtmlOverflow = document.documentElement.style.overflow || '';
      prevHtmlOverscroll = document.documentElement.style.overscrollBehavior || '';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
    }

    if (document.body?.style) {
      prevBodyOverflow = document.body.style.overflow || '';
      prevBodyTouchAction = document.body.style.touchAction || '';
      prevBodyOverscroll = document.body.style.overscrollBehavior || '';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.overscrollBehavior = 'none';
    }
  }
}

export function unlockScroll() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    if (document.documentElement?.style) {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
    }

    if (document.body?.style) {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.touchAction = prevBodyTouchAction === 'none' ? '' : prevBodyTouchAction;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
    }
  }
}

/**
 * Resets all global scroll locks unconditionally.
 * Essential on route changes to ensure no unmounted modal or drawer leaves the page unscrollable.
 */
export function forceResetScrollLock() {
  if (typeof document === 'undefined') return;
  lockCount = 0;
  if (document.documentElement?.style) {
    document.documentElement.style.overflow = '';
    document.documentElement.style.overscrollBehavior = '';
  }
  if (document.body?.style) {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.body.style.overscrollBehavior = '';
  }
}

/**
 * React Hook for automatic scroll locking on mount / active state
 */
export function useScrollLock(isActive) {
  useEffect(() => {
    if (!isActive) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isActive]);
}
