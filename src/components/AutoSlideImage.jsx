import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

/**
 * AutoSlideImage
 * A resilient, accessible, auto-sliding image slideshow component.
 * Supports single images (no timer overhead) or multiple images (auto-sliding with smooth cross-fade,
 * pause on hover, interactive dot indicators, manual arrow controls, and blur backdrop for contain-fit).
 */
export default function AutoSlideImage({
  images,
  fallbackSrc = '/images/community-gathering.jpg',
  alt = 'Diversity Collective Ventura County',
  className = '',
  imageClassName = '',
  aspectRatio = '',
  interval = 3500,
  imageFit = 'cover',
  showDots = true,
  showArrows = true,
  pauseOnHover = true,
  blurBackdrop = false,
  badge = null,
  onClick = null
}) {
  // Normalize images into a clean list of non-empty URLs
  const imageList = useMemo(() => {
    let rawList = [];
    if (Array.isArray(images)) {
      rawList = images;
    } else if (typeof images === 'string' && images.trim()) {
      rawList = [images];
    }

    // Filter out falsy or empty values
    const cleaned = rawList
      .map((img) => (typeof img === 'string' ? img.trim() : ''))
      .filter(Boolean);

    // Remove immediate sequential duplicates
    const unique = [];
    for (const url of cleaned) {
      if (!unique.includes(url)) {
        unique.push(url);
      }
    }

    return unique.length > 0 ? unique : [fallbackSrc];
  }, [images, fallbackSrc]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const timerRef = useRef(null);

  const hasMultiple = imageList.length > 1;

  // Auto-slide effect
  useEffect(() => {
    if (!hasMultiple) return;
    if (pauseOnHover && isHovered) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }, Math.max(1500, interval));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasMultiple, isHovered, pauseOnHover, interval, imageList.length]);

  // Keep index within bounds if imageList changes
  useEffect(() => {
    if (currentIndex >= imageList.length) {
      setCurrentIndex(0);
    }
  }, [imageList.length, currentIndex]);

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const handleDotClick = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const handleImageError = (index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const currentSrc = imageErrors[currentIndex]
    ? fallbackSrc
    : imageList[currentIndex] || fallbackSrc;

  const shouldBlurBackdrop =
    blurBackdrop ||
    imageFit === 'contain' ||
    currentSrc.includes('crc-building') ||
    currentSrc.includes('unicorns') ||
    currentSrc.includes('logo');

  return (
    <div
      className={`relative overflow-hidden group select-none ${aspectRatio} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      onClick={onClick}
      role={hasMultiple ? 'region' : undefined}
      aria-roledescription={hasMultiple ? 'carousel' : undefined}
      aria-label={hasMultiple ? `${alt} (Slide ${currentIndex + 1} of ${imageList.length})` : alt}
    >
      {/* Blurred Backdrop for contain-fit images */}
      {shouldBlurBackdrop && (
        <img
          src={currentSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 pointer-events-none transition-all duration-700"
        />
      )}

      {/* Render slides */}
      {hasMultiple ? (
        imageList.map((src, idx) => {
          const isCurrent = idx === currentIndex;
          const displaySrc = imageErrors[idx] ? fallbackSrc : src;
          return (
            <div
              key={`${src}-${idx}`}
              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-700 ease-in-out ${
                isCurrent
                  ? 'opacity-100 z-10 scale-100'
                  : 'opacity-0 z-0 scale-[1.03] pointer-events-none'
              }`}
              aria-hidden={!isCurrent}
            >
              <img
                src={displaySrc}
                alt={`${alt} ${idx + 1}`}
                loading={idx === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={idx === 0 ? 'high' : 'low'}
                onError={() => handleImageError(idx)}
                className={`w-full h-full ${
                  imageFit === 'contain'
                    ? 'object-contain relative z-10'
                    : 'object-cover'
                } ${imageClassName}`}
              />
            </div>
          );
        })
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          decoding="async"
          onError={() => handleImageError(0)}
          className={`w-full h-full ${
            imageFit === 'contain'
              ? 'object-contain relative z-10'
              : 'object-cover'
          } ${imageClassName}`}
        />
      )}

      {/* Multi-image Count Badge */}
      {hasMultiple && (
        <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-black flex items-center gap-1 shadow-sm border border-white/20 pointer-events-none">
          <Layers className="w-2.5 h-2.5 text-amber-300" />
          <span>{currentIndex + 1}/{imageList.length}</span>
        </div>
      )}

      {/* Optional Custom Corner Badge */}
      {badge && (
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
          {badge}
        </div>
      )}

      {/* Manual Step Arrows (visible on hover or focus when >1 image) */}
      {hasMultiple && showArrows && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer shadow-md border border-white/20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer shadow-md border border-white/20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Interactive Dot Indicators */}
      {hasMultiple && showDots && (
        <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
          {imageList.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleDotClick(e, idx)}
                aria-label={`Jump to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-5 h-1.5 bg-white shadow-md'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white hover:scale-125'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
