// MobileCarousel — wraps children in a horizontal scroll snap container on mobile and tablet
// On desktop (lg:), renders as a normal grid
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

  // Auto-scroll on mobile and tablet (< 1024px)
  useEffect(() => {
    if (!autoScrollMs || typeof window === 'undefined') return;
    const isSwipable = () => window.innerWidth < 1024;
    if (!isSwipable()) return;

    const container = scrollRef.current;
    if (!container) return;

    const timer = setInterval(() => {
      if (window.innerWidth >= 1024) return;
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

  // Mouse drag-to-scroll support for tablet device preview & emulators
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e) => {
      if (window.innerWidth >= 1024) return;
      // Don't drag if clicking directly on a button or link
      if (e.target.closest('button, a, input, select')) return;
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onMouseLeave = () => { isDown = false; };
    const onMouseUp = () => { isDown = false; };
    const onMouseMove = (e) => {
      if (!isDown || window.innerWidth >= 1024) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const colsClass = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4'
  }[String(cols)] || 'lg:grid-cols-3';

  return (
    <div className="w-full">
      <div
        ref={scrollRef}
        className={`flex items-stretch overflow-x-auto gap-4 sm:gap-6 snap-x snap-mandatory pb-3 scroll-smooth mobile-card-scroll -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:grid ${colsClass} lg:auto-rows-fr lg:overflow-visible ${className}`}
        style={{ touchAction: 'pan-y pan-x', overscrollBehaviorX: 'contain' }}
      >
        {validChildren.map((child, i) => (
          <div
            key={child.key ?? i}
            className={`shrink-0 snap-center w-[85vw] sm:w-[50vw] md:w-[44vw] lg:w-auto flex flex-col ${cardClassName}`}
          >
            {child}
          </div>
        ))}
      </div>
      {showDots && childCount > 1 && (
        <div className="carousel-dots lg:hidden">
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
