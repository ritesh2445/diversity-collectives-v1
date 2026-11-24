import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Info,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  FolderOpen,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Gamepad2,
  LayoutGrid,
  Tv,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { galleryPhotos, memoryLaneMilestones } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import { getOptimizedImageUrl } from '../lib/cloudinary';
import { usePageMeta } from '../utils/seo';
import { useScrollLock } from '../utils/scrollLock';

export default function Gallery() {
  usePageMeta({
    title: 'Community Image Gallery & Photographic Archives',
    description: 'Explore interactive 3D photographs celebrating Ventura County Pride, Rainbow Umbrella youth circles, volunteer outreach, and community events.',
    canonicalPath: '/gallery'
  });

  const [photos, setPhotos] = useState(() => cmsStore.getGallery());
  
  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      if (data?.gallery) setPhotos(data.gallery);
          });
    return unsubscribe;
  }, []);

  // Fetch live photos from GitHub + jsDelivr CDN Gallery API
  useEffect(() => {
    let isMounted = true;
    const fetchLiveGallery = async () => {
      try {
        const apiBase = typeof window !== 'undefined' && window.location.origin
          ? (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || '/api')
          : '/api';
        const res = await fetch(`${apiBase}/gallery`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            setPhotos(data.photos.map(p => ({
              ...p,
              image: p.cdn_url || p.image_url || p.image
            })));
          }
        }
      } catch (err) {
        console.warn('Live gallery fetch fallback to store:', err);
      }
    };
    fetchLiveGallery();
    return () => { isMounted = false; };
  }, []);

  // Search Params & Social Deep Link Handling (?photo=<id>)
  const [searchParams, setSearchParams] = useSearchParams();
  const [shareToast, setShareToast] = useState('');

  // 3D Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState(null); // When a card is tapped to expand

  // Photo Wall State
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  useScrollLock(Boolean(expandedPhoto || selectedPhotoIndex !== null));
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'wall'

  // Deep link handler on load
  useEffect(() => {
    const photoParam = searchParams.get('photo');
    if (photoParam && photos.length > 0) {
      const found = photos.find(p => p.id === photoParam || p.slug === photoParam);
      if (found) {
        setExpandedPhoto(found);
      }
    }
  }, [searchParams, photos]);

  const handleSharePhoto = (photo, platform) => {
    if (!photo) return;
    const photoId = photo.id || photo.slug || encodeURIComponent(photo.title);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://diversitycollective.pages.dev';
    const shareUrl = `${origin}/gallery?photo=${photoId}`;
    const title = `Diversity Collective VC: ${photo.title}`;
    const text = `${photo.title} (${photo.year || 'Archive'}) — ${photo.description || 'Explore the DCVC historical moments archive'}`;

    if (platform === 'copy') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        setShareToast('Link copied to clipboard!');
        setTimeout(() => setShareToast(''), 3500);
      }
    } else if (platform === 'twitter') {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (platform === 'facebook') {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (platform === 'whatsapp') {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + shareUrl)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (platform === 'native' && navigator.share) {
      navigator.share({ title, text, url: shareUrl }).catch(() => {});
    }
  };

  const categories = ['All', 'Festivals & Pride', 'Youth & Community', 'Volunteers & Action', 'Center & CRC', 'Health & Wellness', 'Kids & Families'];

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

  // Lock background body scroll whenever Archival Record modal or Lightbox is active
  useEffect(() => {
    const isModalOpen = Boolean(expandedPhoto || selectedPhotoIndex !== null);
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [expandedPhoto, selectedPhotoIndex]);

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
              <Link
                to="/about#memory-lane"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white/80 px-3 py-1 rounded-full border border-purple-200 hover:border-purple-300 shadow-2xs transition-all"
              >
                <span>Explore Memory Lane (About Us)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
              Moments of Joy, <br />
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#5A1E65] via-[#D91B5C] to-[#EA580C]">
                Center & Community.
              </span>
            </h1>
            <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-slate-700 leading-relaxed pt-1">
              Twelve years of courage, youth empowerment, oceanfront Pride, and grassroots mutual aid across all ten Ventura County cities.
            </p>
          </div>

          {/* Quick jump to Memory Lane on mobile */}
          <div className="sm:hidden">
            <Link
              to="/about#memory-lane"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100/80 text-purple-950 font-bold text-xs border border-purple-300"
            >
              <span>Explore Memory Lane (2014 – 2026)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
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
              Featured Center Spotlights
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
                className={`absolute w-[290px] sm:w-[380px] h-[390px] sm:h-[450px] rounded-3xl p-3 bg-white/95 backdrop-blur-xl border-2 transition-all cursor-pointer group shadow-xl ${isCenter
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
                  <div className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${isCenter
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
              className={`h-2 rounded-full transition-all cursor-pointer ${carouselIndex === dotIdx
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
          className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-300 overscroll-contain"
          onClick={() => setExpandedPhoto(null)}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="max-w-4xl w-full max-h-[88vh] bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-purple-200/80 animate-in zoom-in-95 duration-200 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-purple-950 via-[#5A1E65] to-indigo-950 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
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
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Split Layout */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">

              {/* Photo Area with Ambient Dynamic Aura (Framed Archival Showcase) */}
              <div className="md:col-span-6 lg:col-span-7 bg-gradient-to-br from-slate-900 via-purple-950/70 to-slate-900 flex items-center justify-center relative overflow-hidden min-h-[240px] md:min-h-0 p-3 sm:p-5">
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-60 scale-125 pointer-events-none"
                  style={{ backgroundImage: `url(${getOptimizedImageUrl(expandedPhoto.image, { width: 400 })})` }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" aria-hidden="true" />
                <img
                  src={getOptimizedImageUrl(expandedPhoto.image, { width: 1200 })}
                  alt={expandedPhoto.title}
                  className="w-full h-full object-contain relative z-10 max-h-[38vh] md:max-h-[50vh] rounded-2xl shadow-2xl drop-shadow-lg"
                />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold z-20 shadow-md">
                  📍 Ventura County, CA
                </span>
              </div>

              {/* Story & Metadata: Smooth Scrollable Column */}
              <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-between overflow-hidden bg-slate-50/60 border-l border-purple-100">

                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
                  <div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5A1E65] font-black text-[11px] mb-2">
                      Verified Archival Record
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                      {expandedPhoto.title}
                    </h3>
                  </div>

                  {expandedPhoto.quote && (
                    <blockquote className="p-3 rounded-xl bg-white border-l-4 border-amber-400 shadow-2xs italic font-serif text-slate-800 text-xs sm:text-sm leading-relaxed">
                      "{expandedPhoto.quote}"
                    </blockquote>
                  )}

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-serif">
                    {expandedPhoto.description}
                  </p>

                  {expandedPhoto.details && (
                    <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 text-xs text-slate-700 leading-relaxed text-left">
                      <span className="font-extrabold text-[#5A1E65] uppercase tracking-wider block text-[10px] mb-1">
                        Archival Context & County Impact
                      </span>
                      <p>{expandedPhoto.details}</p>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-3 border-t border-slate-200 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500 text-[11px]">Program Area:</span>
                      <span className="font-bold text-slate-900 text-[11px]">{expandedPhoto.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500 text-[11px]">Documented Year:</span>
                      <span className="font-bold text-slate-900 text-[11px]">{expandedPhoto.year}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500 text-[11px]">Center License:</span>
                      <span className="font-bold text-purple-700 text-[11px]">Community Commons</span>
                    </div>
                  </div>
                </div>

                {/* Social Sharing & Action Footer */}
                <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-col gap-3 flex-shrink-0">
                  
                  {shareToast && (
                    <div className="bg-emerald-600 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl text-center flex items-center justify-center gap-1.5 animate-fade-in shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>{shareToast}</span>
                    </div>
                  )}

                  {/* Multi-Platform Social Share Row */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">
                      Share Moment:
                    </span>

                    <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end">
                      {/* Copy Direct Link */}
                      <button
                        type="button"
                        onClick={() => handleSharePhoto(expandedPhoto, 'copy')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-[#5A1E65] text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Copy direct shareable link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </button>

                      {/* X / Twitter */}
                      <button
                        type="button"
                        onClick={() => handleSharePhoto(expandedPhoto, 'twitter')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Share on X (Twitter)"
                      >
                        <span>𝕏 Post</span>
                      </button>

                      {/* Facebook */}
                      <button
                        type="button"
                        onClick={() => handleSharePhoto(expandedPhoto, 'facebook')}
                        className="py-1.5 px-2.5 rounded-lg bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Share on Facebook"
                      >
                        <span>Facebook</span>
                      </button>

                      {/* WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleSharePhoto(expandedPhoto, 'whatsapp')}
                        className="py-1.5 px-2.5 rounded-lg bg-[#25D366] hover:bg-emerald-600 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <span>WhatsApp</span>
                      </button>

                      {/* Native Mobile Share */}
                      {typeof navigator !== 'undefined' && navigator.share && (
                        <button
                          type="button"
                          onClick={() => handleSharePhoto(expandedPhoto, 'native')}
                          className="p-1.5 rounded-lg bg-purple-100 text-[#5A1E65] hover:bg-purple-200 transition-colors cursor-pointer"
                          title="Open native device share"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setExpandedPhoto(null)}
                      className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Close Record
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Deep link: /gallery?photo={expandedPhoto.id || expandedPhoto.slug}
                    </span>
                  </div>

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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Grid View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('wall')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'wall' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border ${selectedCategory === cat
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
                className="w-[82vw] sm:w-80 md:w-96 flex-shrink-0 snap-center p-3 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-md hover:shadow-xl transition-all cursor-pointer group space-y-3"
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
          ACCESSIBLE FULL-SCREEN LIGHTBOX MODAL (Responsive for All Devices)
          ================================================================ */}
      {activeLightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeLightboxPhoto.title}
          className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200 overscroll-contain"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-30"
            aria-label="Close image lightbox (Esc)"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Previous image */}
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length)}
            className="absolute left-2 sm:left-6 p-2 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-30"
            aria-label="Previous image (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Lightbox Card */}
          <div className="max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-700">
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black min-h-[220px] max-h-[60vh] sm:max-h-[65vh]">
              <img
                src={getOptimizedImageUrl(activeLightboxPhoto.image, { width: 1200 })}
                alt={activeLightboxPhoto.title}
                className="max-h-[60vh] sm:max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  {activeLightboxPhoto.category} · {activeLightboxPhoto.year}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  {activeLightboxPhoto.title}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  {activeLightboxPhoto.description}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSharePhoto(activeLightboxPhoto, 'copy')}
                  className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSharePhoto(activeLightboxPhoto, 'twitter')}
                  className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer transition-colors"
                  title="Share on X"
                >
                  𝕏
                </button>
                <button
                  type="button"
                  onClick={() => handleSharePhoto(activeLightboxPhoto, 'facebook')}
                  className="py-1.5 px-2.5 rounded-lg bg-[#1877F2] text-white text-xs font-bold cursor-pointer transition-colors"
                  title="Share on Facebook"
                >
                  Facebook
                </button>
                <span className="text-xs text-slate-400 font-bold whitespace-nowrap ml-2">
                  {selectedPhotoIndex + 1} of {filteredPhotos.length}
                </span>
              </div>
            </div>
          </div>

          {/* Next image */}
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex((prev) => (prev + 1) % filteredPhotos.length)}
            className="absolute right-2 sm:right-6 p-2 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-30"
            aria-label="Next image (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}

    </div>
  );
}
