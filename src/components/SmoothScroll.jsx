import React, { useEffect } from 'react';

/**
 * Native Smooth Scroll Provider & Global Scroll Reveal Engine
 * Smooth staggered reveal animations on scroll for high vibrance.
 * Honors prefers-reduced-motion automatically.
 */
export default function SmoothScroll({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.08,
      }
    );

    const observeElements = () => {
      const targets = document.querySelectorAll('.scroll-reveal:not(.is-revealed)');
      targets.forEach((el) => observer.observe(el));
    };

    observeElements();

    // Re-check on dynamic route transitions with debounced scheduling
    let debounceTimer = null;
    const debouncedObserve = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        observeElements();
      }, 150);
    };

    const mutationObserver = new MutationObserver(debouncedObserve);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return <>{children}</>;
}
