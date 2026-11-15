// MobileCarousel — wraps children in a horizontal scroll snap container on mobile
// On desktop (sm:), renders as a normal grid
// Props:
//   children — the cards to render
//   cols — desktop grid columns (default 3): "2" | "3" | "4"
//   autoScrollMs — interval in ms for auto-scroll (default 4000, 0 to disable)
//   className — extra classes on the wrapper
//   cardClassName — classes for each card wrapper
//   showDots — show dot indicators below (default true)

import { useRef, useState, useEffect, Children } from 'react';

export default function MobileCarousel({
  children,
  cols = 3,
  autoScrollMs = 4000,
  className = '',
  cardClassName = '',
  showDots = true
}) {
  const scrollRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const validChildren = Children.toArray(children).filter(Boolean);
  const childCount = validChildren.length;

  // Auto-scroll on mobile only
  useEffect(() => {
    if (!autoScrollMs || typeof window === 'undefined') return;
    const isMobile = () => window.innerWidth < 640;
    if (!isMobile()) return;

    const container = scrollRef.current;
    if (!container) return;

    const timer = setInterval(() => {
      if (window.innerWidth >= 640) return;
      const cards = container.querySelectorAll(':scope > *');
      if (!cards.length) return;
      const cardW = cards[0].offsetWidth + parseInt(getComputedStyle(container).gap || '16', 10);
      const maxScroll = container.scrollWidth - container.clientWidth;
      const nextScroll = container.scrollLeft + cardW;
      container.scrollTo({ left: nextScroll > maxScroll - 10 ? 0 : nextScroll, behavior: 'smooth' });
    }, autoScrollMs);

    return () => clearInterval(timer);
  }, [autoScrollMs]);

  // Track active dot
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const cards = container.querySelectorAll(':scope > *');
      if (!cards.length) return;
      const cardW = cards[0].offsetWidth;
      if (!cardW) return;
      const idx = Math.round(container.scrollLeft / cardW);
      setActiveIdx(Math.max(0, Math.min(idx, childCount - 1)));
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [childCount]);

  const colsClass = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[String(cols)] || 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div>
      <div
        ref={scrollRef}
        className={`flex items-stretch overflow-x-auto gap-4 snap-x snap-mandatory pb-2 scroll-smooth mobile-card-scroll -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid ${colsClass} sm:auto-rows-fr sm:overflow-visible ${className}`}
        style={{ touchAction: 'pan-y pan-x', overscrollBehaviorX: 'contain' }}
      >
        {validChildren.map((child, i) => (
          <div key={child.key ?? i} className={`shrink-0 snap-center w-[85vw] sm:w-auto flex flex-col ${cardClassName}`}>
            {child}
          </div>
        ))}
      </div>
      {showDots && childCount > 1 && (
        <div className="carousel-dots sm:hidden">
          {Array.from({ length: childCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`carousel-dot${i === activeIdx ? ' active' : ''}`}
              onClick={() => {
                const container = scrollRef.current;
                const cards = container?.querySelectorAll(':scope > *');
                if (!cards?.[i]) return;
                cards[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
