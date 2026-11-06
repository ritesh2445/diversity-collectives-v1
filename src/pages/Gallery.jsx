import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Camera,
  Layers,
  ArrowRight,
  Heart,
  Calendar,
  Clock,
  Award,
  Compass,
  Share2,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  Volume2
} from 'lucide-react';
import { galleryPhotos, memoryLaneMilestones } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import { getOptimizedImageUrl } from '../lib/cloudinary';
import { usePageMeta } from '../utils/seo';

export default function Gallery() {
  usePageMeta({
    title: 'Community Image Gallery & Memory Lane Archives',
    description: 'Explore interactive 3D photographs celebrating Ventura County Pride, Rainbow Umbrella youth circles, volunteer outreach, and our 12-year historical Memory Lane.',
    canonicalPath: '/gallery'
  });

  const [photos, setPhotos] = useState(() => cmsStore.getGallery());
  const [milestones, setMilestones] = useState(() => cmsStore.getMemoryLane());

  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      if (data?.gallery) setPhotos(data.gallery);
      if (data?.memoryLane) setMilestones(data.memoryLane);
    });
    return unsubscribe;
  }, []);

  // 3D Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState(null); // When a card is tapped to expand

  // Photo Wall State
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'wall'

  // Memory Lane State
  const [expandedMilestones, setExpandedMilestones] = useState({ '2014': true, '2020': true, '2026': true });

  const categories = ['All', 'Festivals & Pride', 'Youth & Community', 'Volunteers & Action', 'Sanctuary & CRC', 'Health & Wellness', 'Kids & Families'];

  const filteredPhotos = selectedCategory === 'All'
    ? photos
    : photos.filter(p => p.category === selectedCategory);

  const carouselPhotos = photos;

  // Auto-advance 3D Carousel every 4.5 seconds unless user is hovering
  useEffect(() => {
    if (isHovered || expandedPhoto) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselPhotos.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovered, expandedPhoto, carouselPhotos.length]);

  // Keyboard navigation for Carousel and Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (expandedPhoto) {
        if (e.key === 'Escape') setExpandedPhoto(null);
        return;
      }
      if (selectedPhotoIndex !== null) {
        if (e.key === 'Escape') {
          setSelectedPhotoIndex(null);
        } else if (e.key === 'ArrowRight') {
          setSelectedPhotoIndex((prev) => (prev + 1) % filteredPhotos.length);
        } else if (e.key === 'ArrowLeft') {
          setSelectedPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        setCarouselIndex((prev) => (prev + 1) % carouselPhotos.length);
      } else if (e.key === 'ArrowLeft') {
        setCarouselIndex((prev) => (prev - 1 + carouselPhotos.length) % carouselPhotos.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, expandedPhoto, filteredPhotos.length, carouselPhotos.length]);

  // Touch Swipe for 3D Carousel on Mobile
  const touchStartXRef = useRef(0);
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (diff > 50) {
      setCarouselIndex((prev) => (prev + 1) % carouselPhotos.length);
    } else if (diff < -50) {
      setCarouselIndex((prev) => (prev - 1 + carouselPhotos.length) % carouselPhotos.length);
    }
  };

  const toggleMilestone = (year) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const activeLightboxPhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  return (
    <div className="pt-6 md:pt-10 pb-24 bg-transparent text-slate-800 selection:bg-[#5A1E65] selection:text-white">
      
      {/* ================================================================
          HERO TITLE & INTRODUCTION
          ================================================================ */}
      <section className="container-clean pb-8 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-300/30 via-pink-200/20 to-amber-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="max-w-3xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="glass-pill text-xs font-black text-[#5A1E65] bg-purple-50/90 border-purple-200/90 shadow-2xs">
                ✨ 3D SPOTLIGHT & HISTORICAL ARCHIVES
              </span>
              <a 
                href="#memory-lane"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white/80 px-3 py-1 rounded-full border border-purple-200 hover:border-purple-300 shadow-2xs transition-all"
              >
                <span>Jump to Memory Lane</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </a>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
              Moments of Joy, <br />
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#5A1E65] via-[#D91B5C] to-[#EA580C]">
                Sanctuary & Community.
              </span>
            </h1>
            <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-slate-700 leading-relaxed pt-1">
              Twelve years of courage, youth empowerment, oceanfront Pride, and grassroots mutual aid across all ten Ventura County cities.
            </p>
          </div>

          {/* Quick jump to Memory Lane on mobile */}
          <div className="sm:hidden">
            <a 
              href="#memory-lane"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100/80 text-purple-950 font-bold text-xs border border-purple-300"
            >
              <span>Explore Memory Lane (2014 – 2026)</span>
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================
          3D PERSPECTIVE CAROUSEL: ROUNDED CARDS (EXPAND WHEN TAPPED)
          ================================================================ */}
      <section 
        className="py-10 md:py-14 relative overflow-hidden bg-gradient-to-b from-purple-50/40 via-transparent to-pink-50/30 border-y border-purple-100/60"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Interactive 3D Community Photo Carousel"
      >
        <div className="container-clean mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#5A1E65]">
                INTERACTIVE 3D CAROUSEL
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                Tap card to expand
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 mt-0.5">
              Featured Sanctuary Spotlights
            </h2>
          </div>

          {/* Navigation Controls & Slide Counter */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 font-mono">
              {String(carouselIndex + 1).padStart(2, '0')} / {String(carouselPhotos.length).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCarouselIndex((prev) => (prev - 1 + carouselPhotos.length) % carouselPhotos.length)}
                className="w-10 h-10 rounded-full bg-white hover:bg-purple-50 text-slate-800 hover:text-[#5A1E65] border border-slate-200/90 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Previous Spotlight (Left Arrow)"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselPhotos.length)}
                className="w-10 h-10 rounded-full bg-white hover:bg-purple-50 text-slate-800 hover:text-[#5A1E65] border border-slate-200/90 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Next Spotlight (Right Arrow)"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3D Perspective Stage */}
        <div 
          className="relative w-full h-[460px] sm:h-[520px] flex items-center justify-center overflow-visible select-none"
          style={{ perspective: '1200px' }}
        >
          {carouselPhotos.map((photo, index) => {
            const count = carouselPhotos.length;
            // Calculate normalized offset (-2 to +2)
            let offset = (index - carouselIndex) % count;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;

            const isCenter = offset === 0;
            const isVisible = Math.abs(offset) <= 2;

            if (!isVisible) return null;

            // Compute exact 3D positioning
            const translateX = offset * (window.innerWidth < 640 ? 170 : 260);
            const translateZ = isCenter ? 60 : -Math.abs(offset) * 85;
            const rotateY = offset * -20;
            const scale = isCenter ? 1.05 : Math.max(0.72, 0.9 - Math.abs(offset) * 0.1);
            const opacity = isCenter ? 1 : Math.max(0.4, 0.85 - Math.abs(offset) * 0.25);
            const zIndex = 30 - Math.abs(offset) * 10;

            return (
              <div
                key={photo.id}
                onClick={() => {
                  if (isCenter) {
                    setExpandedPhoto(photo);
                  } else {
                    setCarouselIndex(index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${photo.title} - Tap to expand story`}
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  zIndex,
                  opacity,
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease',
                  transformStyle: 'preserve-3d'
                }}
                className={`absolute w-[290px] sm:w-[380px] h-[390px] sm:h-[450px] rounded-3xl p-3 bg-white/95 backdrop-blur-xl border-2 transition-all cursor-pointer group shadow-xl ${
                  isCenter 
                    ? 'border-purple-400/90 ring-4 ring-purple-500/20 shadow-purple-900/25 hover:shadow-2xl hover:scale-[1.07]' 
                    : 'border-slate-200/80 hover:border-purple-300'
                }`}
              >
                {/* Image Container with Rounded Corners */}
                <div className="relative w-full h-[62%] rounded-2xl overflow-hidden bg-slate-900">
                  <img
                    src={getOptimizedImageUrl(photo.image, { width: 800 })}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  
                  {/* Category & Year Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider">
                      {photo.category}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      {photo.year}
                    </span>
                  </div>

                  {/* Tap to Expand Glow Pill */}
                  <div className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
                    isCenter 
                      ? 'bg-[#5A1E65] text-white opacity-100 ring-2 ring-amber-300/60' 
                      : 'bg-slate-950/70 text-white opacity-0 group-hover:opacity-100'
                  }`}>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{isCenter ? 'Tap to Expand' : 'View'}</span>
                  </div>
                </div>

                {/* Card Content & Quotes */}
                <div className="pt-3 px-2 flex flex-col justify-between h-[38%]">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-black text-slate-950 group-hover:text-[#5A1E65] transition-colors line-clamp-1">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {photo.quote ? `"${photo.quote}"` : photo.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-purple-700">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Ventura County Archives</span>
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      <span>Full Story</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Dot Indicators */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {carouselPhotos.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setCarouselIndex(dotIdx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                carouselIndex === dotIdx 
                  ? 'w-8 bg-[#5A1E65]' 
                  : 'w-2 bg-slate-300 hover:bg-purple-300'
              }`}
              aria-label={`Go to slide ${dotIdx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ================================================================
          TAP-TO-EXPAND SPOTLIGHT MODAL (With Rich Story & High-Res View)
          ================================================================ */}
      {expandedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={expandedPhoto.title}
          className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300"
          onClick={() => setExpandedPhoto(null)}
        >
          <div 
            className="max-w-4xl w-full bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-purple-200/80 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-950 via-[#5A1E65] to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  {expandedPhoto.category} · {expandedPhoto.year} Archive
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedPhoto(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Spotlight"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 max-h-[80vh] overflow-y-auto">
              
              {/* Photo Area */}
              <div className="md:col-span-7 bg-slate-950 flex items-center justify-center relative min-h-[300px] md:min-h-[460px]">
                <img
                  src={getOptimizedImageUrl(expandedPhoto.image, { width: 1200 })}
                  alt={expandedPhoto.title}
                  className="w-full h-full max-h-[500px] object-cover"
                />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold">
                  📍 Ventura County, CA
                </span>
              </div>

              {/* Story & Metadata */}
              <div className="md:col-span-5 p-6 flex flex-col justify-between bg-slate-50/60 space-y-6">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-[#5A1E65] font-black text-xs mb-3">
                    Verified Archival Record
                  </div>
                  <h3 className="font-display text-2xl font-black text-slate-950 leading-tight">
                    {expandedPhoto.title}
                  </h3>
                  
                  {expandedPhoto.quote && (
                    <blockquote className="my-4 p-4 rounded-2xl bg-white border-l-4 border-amber-400 shadow-xs italic font-serif text-slate-700 text-sm leading-relaxed">
                      "{expandedPhoto.quote}"
                    </blockquote>
                  )}

                  <p className="text-sm text-slate-600 leading-relaxed mt-3">
                    {expandedPhoto.description}
                  </p>

                  <div className="mt-6 space-y-2 pt-4 border-t border-slate-200/90 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500">Program Area:</span>
                      <span className="font-bold text-slate-900">{expandedPhoto.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500">Documented Year:</span>
                      <span className="font-bold text-slate-900">{expandedPhoto.year}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500">Sanctuary License:</span>
                      <span className="font-bold text-purple-700">Community Commons</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <a
                    href={expandedPhoto.image}
                    download={`${expandedPhoto.title}.jpg`}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Photo</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: expandedPhoto.title,
                          text: expandedPhoto.description,
                          url: window.location.href
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      }
                    }}
                    className="p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                    title="Share this moment"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          PHOTO WALL: CATEGORY FILTERS & MULTI-VIEW GRID
          ================================================================ */}
      <section className="container-clean py-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950">
              Community Gallery Collection
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Browse by program area or explore the entire photograph vault.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grid View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('wall')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'wall' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Horizontal Wall
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pt-6 pb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedPhotoIndex(null);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-purple-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid or Horizontal Wall */}
        {viewMode === 'wall' ? (
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin snap-x snap-mandatory">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className="w-80 sm:w-96 flex-shrink-0 snap-center p-3 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-md hover:shadow-xl transition-all cursor-pointer group space-y-3"
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={getOptimizedImageUrl(photo.image, { width: 640 })}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/70 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="px-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">
                    {photo.category} · {photo.year}
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-950 mt-0.5 line-clamp-1">
                    {photo.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {photo.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className="p-3 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-xl transition-all cursor-pointer group space-y-3"
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={getOptimizedImageUrl(photo.image, { width: 640 })}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-md text-white text-[10px] font-bold">
                    {photo.category}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-slate-950/70 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="px-1.5 pb-1">
                  <span className="text-[10px] font-bold text-purple-700">
                    {photo.year} Archive
                  </span>
                  <h3 className="font-display text-sm font-bold text-slate-950 group-hover:text-[#5A1E65] transition-colors leading-snug line-clamp-1 mt-0.5">
                    {photo.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    {photo.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================================================================
          DCVC MEMORY LANE (2014 – 2026): A DECADE OF QUEER RESILIENCE
          ================================================================ */}
      <section 
        id="memory-lane"
        className="container-clean pt-16 pb-20 border-t-2 border-purple-100 relative"
        aria-label="DCVC Historical Memory Lane 2014 to 2026"
      >
        {/* Glow ambient background */}
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 rounded-full bg-gradient-to-r from-purple-200/20 via-pink-200/25 to-amber-100/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-100 via-pink-100 to-amber-100 border border-purple-200 text-[#5A1E65] text-xs font-black shadow-xs mb-3">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>COMMUNITY HISTORY & ARCHIVES</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            DCVC Memory Lane: <br />
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#5A1E65] via-[#D91B5C] to-[#EA580C]">
              Twelve Years of Courage & Sanctuary.
            </span>
          </h2>
          <p className="font-serif italic text-base sm:text-xl text-slate-700 leading-relaxed mt-3">
            Trace the transformative path from our 2014 grassroots origins to Ventura County's premier LGBTQ+ cultural sanctuary and clinical wellness home.
          </p>

          {/* Quick Year Navigation Jump Bar */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-8 pt-6 border-t border-slate-200/60">
            <span className="text-[11px] font-black uppercase text-slate-400 mr-2">Jump to Milestone:</span>
            {milestones.map((m) => (
              <a
                key={m.year}
                href={`#milestone-${m.year}`}
                className="px-3 py-1 rounded-full text-xs font-bold bg-white hover:bg-purple-50 text-slate-700 hover:text-[#5A1E65] border border-slate-200 hover:border-purple-300 shadow-2xs transition-all"
              >
                {m.year}
              </a>
            ))}
          </div>
        </div>

        {/* Vertical Serpentine Timeline Path */}
        <div className="relative max-w-5xl mx-auto z-10">
          
          {/* Glowing Center Line Spine */}
          <div 
            className="absolute left-6 md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-gradient-to-b from-[#5A1E65] via-[#D91B5C] to-[#EA580C] rounded-full shadow-sm"
            aria-hidden="true"
          />

          {/* Milestones */}
          <div className="space-y-12 sm:space-y-16">
            {milestones.map((milestone, idx) => {
              const isEven = idx % 2 === 0;
              const isExpanded = expandedMilestones[milestone.year];

              return (
                <div
                  key={milestone.year}
                  id={`milestone-${milestone.year}`}
                  className={`relative flex flex-col md:flex-row items-start ${
                    isEven ? 'md:flex-row-reverse' : ''
                  } gap-6 sm:gap-10 pl-14 md:pl-0`}
                >
                  {/* Glowing Milestone Marker Node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-4 z-20 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white border-4 border-[#5A1E65] shadow-lg flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Milestone Content Card */}
                  <div className={`w-full md:w-[calc(50%-2.5rem)] ${isEven ? 'md:text-left' : 'md:text-left'}`}>
                    <div className="p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-300 shadow-md hover:shadow-xl transition-all duration-300 group space-y-4">
                      
                      {/* Top Badges & Year */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-display text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#5A1E65] to-[#D91B5C]">
                          {milestone.year}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-[#5A1E65] font-black text-[10px] uppercase tracking-wider">
                            {milestone.badge}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                            {milestone.stat}
                          </span>
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 group-hover:text-[#5A1E65] transition-colors leading-tight">
                          {milestone.title}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                          {milestone.subtitle}
                        </p>
                      </div>

                      {/* Photo Thumbnail */}
                      <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-slate-900 shadow-inner relative">
                        <img
                          src={getOptimizedImageUrl(milestone.image, { width: 800 })}
                          alt={milestone.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      </div>

                      {/* Narrative */}
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {milestone.description}
                      </p>

                      {/* Historical Quote */}
                      {milestone.quote && (
                        <blockquote className="p-3.5 rounded-2xl bg-purple-50/70 border-l-3 border-[#5A1E65] text-xs font-serif italic text-purple-950 leading-relaxed">
                          "{milestone.quote}"
                        </blockquote>
                      )}

                      {/* Expandable Archival Notes */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-purple-100 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl space-y-2 animate-in fade-in duration-200">
                          <span className="font-black text-[#5A1E65] uppercase tracking-wider block text-[10px]">
                            Archival Context & Impact
                          </span>
                          <p className="leading-relaxed">
                            {milestone.details}
                          </p>
                        </div>
                      )}

                      {/* Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleMilestone(milestone.year)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-purple-100/70 text-slate-800 hover:text-[#5A1E65] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Archival Notes' : 'Explore Milestone Archives'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                    </div>
                  </div>

                  {/* Empty Spacer Column for Desktop alternating layout */}
                  <div className="hidden md:block md:w-[calc(50%-2.5rem)]" aria-hidden="true" />
                </div>
              );
            })}
          </div>

          {/* End of Journey Anchor */}
          <div className="text-center pt-16 relative z-10">
            <div className="inline-flex flex-col items-center gap-3 p-6 sm:p-8 rounded-3xl bg-white border-2 border-purple-200 shadow-xl max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5A1E65] via-rose-500 to-amber-400 text-white flex items-center justify-center shadow-md">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <h3 className="font-display text-2xl font-black text-slate-950">
                You Are Part of Our Living History.
              </h3>
              <p className="font-serif italic text-sm text-slate-600">
                Help us write the next decade of affirming care, LGBTQ+ youth sanctuary, and countywide advocacy.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href="/donate"
                  className="px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  Sustain Our Future (Zeffy)
                </a>
                <a
                  href="/volunteer"
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                >
                  Join as Volunteer
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================================================================
          ACCESSIBLE FULL-SCREEN LIGHTBOX MODAL
          ================================================================ */}
      {activeLightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeLightboxPhoto.title}
          className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-5 right-5 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close image lightbox (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous image */}
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length)}
            className="absolute left-4 sm:left-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Previous image (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Lightbox Card */}
          <div className="max-w-4xl w-full max-h-[90vh] bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-700">
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black min-h-[300px] max-h-[65vh]">
              <img
                src={getOptimizedImageUrl(activeLightboxPhoto.image, { width: 1200 })}
                alt={activeLightboxPhoto.title}
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  {activeLightboxPhoto.category} · {activeLightboxPhoto.year}
                </span>
                <h3 className="font-display text-xl font-bold text-white mt-1">
                  {activeLightboxPhoto.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {activeLightboxPhoto.description}
                </p>
              </div>

              <span className="text-xs text-slate-400 font-bold whitespace-nowrap">
                {selectedPhotoIndex + 1} of {filteredPhotos.length}
              </span>
            </div>
          </div>

          {/* Next image */}
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex((prev) => (prev + 1) % filteredPhotos.length)}
            className="absolute right-4 sm:right-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Next image (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
}
