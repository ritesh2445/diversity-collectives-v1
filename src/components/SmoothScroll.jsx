import { useEffect } from 'react';
import Lenis from 'lenis';
import { a11yStore } from '../accessibility/a11yStore';

export default function SmoothScroll({ children }) {
  useEffect(() => {
    const isPaused = a11yStore.getState().pauseAnimations;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Respect user's motion preferences and pause animations setting
    if (isPaused || prefersReducedMotion) {
      return;
    }

    // Never hijack touch scrolling on mobile or tablet devices.
    const isTouchOrMobile = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.innerWidth < 1024;

    if (isTouchOrMobile) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 0,
    });

    window.lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    const unsubscribe = a11yStore.subscribe((settings) => {
      if (settings.pauseAnimations) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    return () => {
      unsubscribe();
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.lenis;
    };
  }, []);

  return children;
}
