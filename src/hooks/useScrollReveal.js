import { useEffect, useRef, useState } from 'react';

/**
 * Hook to reveal an element smoothly when it scrolls into view
 * @param {Object} options - { threshold: number, rootMargin: string, triggerOnce: boolean }
 */
export function useScrollReveal(options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px', triggerOnce = true } = options;
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) {
          observer.unobserve(el);
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    }, { threshold, rootMargin });

    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
}
