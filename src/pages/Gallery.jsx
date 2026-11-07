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
  CheckCircle2
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

  // Memory Lane State & Game Experience
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);
  const [memoryLaneViewMode, setMemoryLaneViewMode] = useState('stage'); // 'stage' (Game Console) | 'grid' (All Checkpoints)
  const [isAutoPlayingMilestones, setIsAutoPlayingMilestones] = useState(false);
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [slideDirection, setSlideDirection] = useState('forward'); // 'forward' | 'backward'
  const [flareKey, setFlareKey] = useState(0);
  const [expandedMilestones, setExpandedMilestones] = useState({ '2014': true, '2020': true, '2026': true });
  const [activeFolderPhotoIdx, setActiveFolderPhotoIdx] = useState(null);

  const mlTouchStartXRef = useRef(0);
  const mlTouchEndXRef = useRef(0);
  const memoryLaneSectionRef = useRef(null);

  const milestoneThemes = [
    {
      year: '2014',
      aura: 'from-amber-500/30 via-purple-700/30 to-rose-600/30',
      badgeBg: 'bg-amber-100 text-amber-950 border-amber-300',
      accentColor: 'text-amber-500',
      gradientText: 'from-amber-400 via-rose-500 to-purple-600',
      borderGlow: 'border-amber-400/40 shadow-amber-500/20'
    },
    {
      year: '2016',
      aura: 'from-cyan-500/30 via-blue-600/30 to-purple-700/30',
      badgeBg: 'bg-cyan-100 text-cyan-950 border-cyan-300',
      accentColor: 'text-cyan-500',
      gradientText: 'from-cyan-400 via-blue-500 to-purple-600',
      borderGlow: 'border-cyan-400/40 shadow-cyan-500/20'
    },
    {
      year: '2018',
      aura: 'from-rose-500/30 via-pink-600/30 to-amber-500/30',
      badgeBg: 'bg-rose-100 text-rose-950 border-rose-300',
      accentColor: 'text-rose-500',
      gradientText: 'from-rose-400 via-pink-500 to-amber-400',
      borderGlow: 'border-rose-400/40 shadow-rose-500/20'
    },
    {
      year: '2020',
      aura: 'from-emerald-500/30 via-teal-600/30 to-purple-700/30',
      badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      accentColor: 'text-emerald-500',
      gradientText: 'from-emerald-400 via-teal-500 to-purple-600',
      borderGlow: 'border-emerald-400/40 shadow-emerald-500/20'
    },
    {
      year: '2022',
      aura: 'from-red-500/30 via-rose-600/30 to-amber-500/30',
      badgeBg: 'bg-red-100 text-red-950 border-red-300',
      accentColor: 'text-rose-500',
      gradientText: 'from-red-400 via-rose-500 to-amber-400',
      borderGlow: 'border-red-400/40 shadow-red-500/20'
    },
    {
      year: '2024',
      aura: 'from-amber-400/35 via-yellow-500/30 to-purple-700/35',
      badgeBg: 'bg-amber-100 text-amber-950 border-amber-300',
      accentColor: 'text-amber-500',
      gradientText: 'from-amber-300 via-orange-500 to-purple-600',
      borderGlow: 'border-amber-400/40 shadow-amber-500/20'
    },
    {
      year: '2026',
      aura: 'from-purple-500/30 via-pink-500/30 to-cyan-400/30',
      badgeBg: 'bg-purple-100 text-purple-950 border-purple-300',
      accentColor: 'text-purple-500',
      gradientText: 'from-purple-400 via-pink-500 to-cyan-400',
      borderGlow: 'border-purple-400/40 shadow-purple-500/20'
    }
  ];

  const playMilestoneChime = (pitchModifier = 1) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = 523.25 * pitchModifier;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch {
      // Audio optional
    }
  };

  const laneScrollRef = useRef(null);
  const cardRefs = useRef([]);
  const [activeFolderPics, setActiveFolderPics] = useState({});

  const scrollToMilestone = (idx) => {
    if (idx < 0 || idx >= milestones.length) return;
    setActiveMilestoneIdx(idx);
    setFlareKey(k => k + 1);
    setAutoPlayProgress(0);
    playMilestoneChime(1 + (idx * 0.08));

    const card = cardRefs.current[idx];
    if (card && laneScrollRef.current) {
      card.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  };

  const handleNextMilestone = () => {
    const nextIdx = (activeMilestoneIdx + 1) % milestones.length;
    scrollToMilestone(nextIdx);
  };

  const handlePrevMilestone = () => {
    const prevIdx = (activeMilestoneIdx - 1 + milestones.length) % milestones.length;
    scrollToMilestone(prevIdx);
  };

  const handleLaneScroll = () => {
    if (!laneScrollRef.current) return;
    const container = laneScrollRef.current;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;

    let closestIdx = 0;
    let minDistance = Infinity;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const elCenter = el.offsetLeft + el.clientWidth / 2;
      const distance = Math.abs(containerCenter - elCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    });

    if (closestIdx !== activeMilestoneIdx) {
      setActiveMilestoneIdx(closestIdx);
    }
  };

  // Auto-play timeline progression
  useEffect(() => {
    if (!isAutoPlayingMilestones) {
      setAutoPlayProgress(0);
      return;
    }
    const INTERVAL_MS = 6500;
    const STEP_MS = 100;
    const timer = setInterval(() => {
      setAutoPlayProgress(prev => {
        if (prev >= 100) {
          handleNextMilestone();
          return 0;
        }
        return prev + (STEP_MS / INTERVAL_MS) * 100;
      });
    }, STEP_MS);

    return () => clearInterval(timer);
  }, [isAutoPlayingMilestones, activeMilestoneIdx, milestones.length]);

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

  const activeMilestone = milestones[activeMilestoneIdx] || milestones[0] || {};
  const currentTheme = milestoneThemes[activeMilestoneIdx % milestoneThemes.length] || milestoneThemes[0];
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

                  {expandedPhoto.details && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 text-xs text-slate-700 leading-relaxed text-left">
                      <span className="font-extrabold text-[#5A1E65] uppercase tracking-wider block text-[10px] mb-1">
                        Archival Context & County Impact
                      </span>
                      <p>{expandedPhoto.details}</p>
                    </div>
                  )}

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
          DCVC MEMORY LANE (2014 – 2026): GAME ARCADE & CINEMATIC ODYSSEY
          ================================================================ */}
      <section 
        id="memory-lane"
        ref={memoryLaneSectionRef}
        className="container-clean pt-16 pb-24 border-t-2 border-purple-100 relative overflow-hidden"
        aria-label="DCVC Historical Memory Lane 2014 to 2026"
      >
        {/* Dynamic Multi-Color Volumetric Light Mesh that shifts per milestone */}
        <div 
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[520px] rounded-full bg-gradient-to-r ${currentTheme.aura} blur-3xl pointer-events-none transition-all duration-700 milestone-aurora-glow opacity-80`}
          aria-hidden="true" 
        />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-100 via-pink-100 to-amber-100 border border-purple-200 text-[#5A1E65] text-xs font-black shadow-xs mb-3">
            <Gamepad2 className="w-4 h-4 text-[#D91B5C] animate-pulse" />
            <span>INTERACTIVE MEMORY LANE • 12-YEAR COMMUNITY ODYSSEY</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            DCVC Memory Lane: <br />
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#5A1E65] via-[#D91B5C] to-[#EA580C]">
              Twelve Years of Courage & Sanctuary.
            </span>
          </h2>
          <p className="font-serif italic text-base sm:text-xl text-slate-700 leading-relaxed mt-3">
            Jump into our historical checkpoints from 2014 grassroots origins to Ventura County's premier LGBTQ+ sanctuary. Swipe or tap milestones to warp through time.
          </p>
        </div>

        {/* GAME HUD / CONTROL BAR */}
        <div className="max-w-5xl mx-auto mb-8 relative z-20">
          <div className="p-4 sm:p-5 rounded-3xl bg-white/90 backdrop-blur-md border-2 border-purple-200 shadow-xl flex flex-col gap-4">
            
            {/* Top Row: Level Counter + Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-xl bg-purple-900 text-white font-black text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>CHAPTER 0{activeMilestoneIdx + 1} OF 0{milestones.length}</span>
                </span>
                <span className="hidden sm:inline-block font-mono text-xs font-extrabold text-[#5A1E65]">
                  YEAR {activeMilestone.year} • {activeMilestone.badge || 'Milestone'}
                </span>
              </div>

              {/* Action Buttons: Sound, Auto-Play, View Toggle */}
              <div className="flex items-center gap-2">
                {/* Sound SFX Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    if (next) playMilestoneChime(1.2);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    soundEnabled 
                      ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  }`}
                  title={soundEnabled ? 'Mute Game SFX' : 'Enable Interactive Game SFX'}
                  aria-label={soundEnabled ? 'Mute Game SFX' : 'Enable Interactive Game SFX'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <span className="hidden md:inline">{soundEnabled ? 'SFX ON' : 'SFX'}</span>
                </button>

                {/* Auto-Play Story Mode */}
                <button
                  type="button"
                  onClick={() => setIsAutoPlayingMilestones(!isAutoPlayingMilestones)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isAutoPlayingMilestones 
                      ? 'bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white border-purple-600 shadow-md animate-pulse' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title={isAutoPlayingMilestones ? 'Pause Time Odyssey' : 'Auto-Play Time Odyssey'}
                  aria-label={isAutoPlayingMilestones ? 'Pause Time Odyssey' : 'Auto-Play Time Odyssey'}
                >
                  {isAutoPlayingMilestones ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />}
                  <span>{isAutoPlayingMilestones ? 'PLAYING' : 'AUTO-TOUR'}</span>
                  {isAutoPlayingMilestones && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
                  )}
                </button>

                {/* View Mode Toggle: Stage vs Grid */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMemoryLaneViewMode('stage')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      memoryLaneViewMode === 'stage' 
                        ? 'bg-white text-[#5A1E65] shadow-xs font-black' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Interactive Cinematic Stage"
                    aria-label="Interactive Cinematic Stage"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Stage</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoryLaneViewMode('grid')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      memoryLaneViewMode === 'grid' 
                        ? 'bg-white text-[#5A1E65] shadow-xs font-black' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="All Milestones Grid"
                    aria-label="All Milestones Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">All</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Checkpoint Timeline Track (Electric Wire Master Lane) */}
            <div className="relative pt-3 pb-1">
              {/* Electric Wire Highway Track */}
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-2.5 rounded-full overflow-hidden bg-slate-900/10 border border-purple-200">
                <div 
                  className="h-full electric-wire-track transition-all duration-500 ease-out rounded-full shadow-[0_0_12px_rgba(217,27,92,0.8)]"
                  style={{ width: `${Math.max(12, ((activeMilestoneIdx) / (milestones.length - 1)) * 100)}%` }}
                />
              </div>

              {/* Milestone Checkpoint Nodes */}
              <div className="relative flex items-center justify-between gap-1 sm:gap-2">
                {milestones.map((m, idx) => {
                  const isActive = idx === activeMilestoneIdx;
                  const isPassed = idx < activeMilestoneIdx;

                  return (
                    <button
                      key={m.year}
                      type="button"
                      onClick={() => scrollToMilestone(idx)}
                      className={`group relative flex flex-col items-center cursor-pointer transition-all duration-300 focus:outline-none ${
                        isActive ? 'scale-115 z-10' : 'hover:scale-105'
                      }`}
                      aria-label={`Jump to Milestone ${m.year}: ${m.title}`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {/* Node Circle with Electric Ping */}
                      <div className="relative">
                        {isActive && (
                          <div 
                            className="absolute -inset-2 rounded-full border-2 border-amber-400 checkpoint-radar-ring pointer-events-none"
                            aria-hidden="true" 
                          />
                        )}
                        <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 shadow-md ${
                          isActive
                            ? 'bg-gradient-to-tr from-[#5A1E65] via-rose-500 to-amber-400 text-white ring-4 ring-amber-300/80 shadow-xl electric-node-glow'
                            : isPassed
                            ? 'bg-purple-900 text-white hover:bg-purple-800'
                            : 'bg-white text-slate-600 border-2 border-slate-300 hover:border-purple-400'
                        }`}>
                          {isActive ? (
                            <Zap className="w-4 h-4 fill-amber-300 text-amber-300 animate-bounce" />
                          ) : isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <span>{m.year.slice(2)}</span>
                          )}
                        </div>
                      </div>

                      {/* Year Label */}
                      <span className={`mt-1.5 text-[11px] sm:text-xs font-black transition-colors ${
                        isActive 
                          ? 'text-[#5A1E65] font-extrabold' 
                          : 'text-slate-500 group-hover:text-purple-700'
                      }`}>
                        {m.year}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-Play Progress Bar (shown when playing) */}
            {isAutoPlayingMilestones && (
              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden mt-1">
                <div 
                  className="bg-gradient-to-r from-emerald-400 via-amber-400 to-[#D91B5C] h-full transition-all duration-100"
                  style={{ width: `${autoPlayProgress}%` }}
                />
              </div>
            )}

          </div>
        </div>

        {/* VIEW 1: SCROLLABLE FLOW WITH WIRE-LIKE LANE & CENTER-ALIGNED IMAGES */}
        {memoryLaneViewMode === 'stage' && (
          <div className="relative w-full overflow-hidden my-6 z-10">

            {/* THE CONTINUOUS ELECTRIC WIRE THREADING HORIZONTALLY THROUGH THE CARDS */}
            <div 
              className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-2.5 electric-wire-track pointer-events-none rounded-full z-0 opacity-80"
              aria-hidden="true" 
            />

            {/* Floating Navigation Chevrons on Left and Right edges */}
            <button
              type="button"
              onClick={handlePrevMilestone}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-[#5A1E65] border-2 border-purple-300 shadow-2xl flex items-center justify-center hover:scale-115 active:scale-95 transition-all cursor-pointer hover:bg-purple-50 group hover:border-[#5A1E65]"
              aria-label="Scroll to Previous Milestone"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={handleNextMilestone}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-[#5A1E65] border-2 border-purple-300 shadow-2xl flex items-center justify-center hover:scale-115 active:scale-95 transition-all cursor-pointer hover:bg-purple-50 group hover:border-[#5A1E65]"
              aria-label="Scroll to Next Milestone"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* The Continuous Scrollable Stream (Compact, Fits Screen Without Blank Space) */}
            <div
              ref={laneScrollRef}
              onScroll={handleLaneScroll}
              className="flex items-center gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth py-6 px-[calc(50vw-42.5vw)] sm:px-[calc(50vw-210px)] md:px-[calc(50vw-240px)] relative z-10 no-scrollbar"
              tabIndex={0}
              aria-label="DCVC Historical Milestones Scrollable Lane"
            >
              {milestones.map((milestone, idx) => {
                const isActive = idx === activeMilestoneIdx;
                const theme = milestoneThemes[idx % milestoneThemes.length];
                const selectedPicIdx = activeFolderPics[milestone.year];
                const currentImage = (selectedPicIdx !== undefined && milestone.pictureFolder?.[selectedPicIdx])
                  ? milestone.pictureFolder[selectedPicIdx].url
                  : milestone.image;

                return (
                  <div
                    key={milestone.year}
                    ref={el => (cardRefs.current[idx] = el)}
                    className={`w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[440px] h-fit self-center flex-shrink-0 snap-center rounded-3xl bg-white border-2 p-3.5 sm:p-4 transition-all duration-500 relative flex flex-col items-center text-center overflow-hidden opacity-100 ${
                      isActive 
                        ? 'scale-100 border-[#5A1E65] ring-4 ring-amber-300/80 shadow-2xl z-20' 
                        : 'scale-95 border-purple-200/90 shadow-md hover:scale-98 hover:border-purple-300 z-10'
                    }`}
                  >
                    {/* Subtle Dimmer Overlay for Inactive Cards (Does NOT affect solid white backing) */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-slate-900/[0.04] pointer-events-none z-20 rounded-3xl" aria-hidden="true" />
                    )}
                    {/* Cinematic Lens Flare Streak Wipe on Active Card */}
                    {isActive && (
                      <div 
                        key={`flare-${flareKey}`}
                        className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none z-40 memory-lane-flare -skew-x-12"
                        aria-hidden="true" 
                      />
                    )}

                    {/* Ambient Internal Glow for Active Milestone */}
                    {isActive && (
                      <div 
                        className={`absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br ${theme.aura} blur-3xl pointer-events-none opacity-60`}
                        aria-hidden="true" 
                      />
                    )}

                    {/* Year & Badge Header: CENTER-ALIGNED */}
                    <div className="flex items-center justify-center gap-2 flex-wrap mx-auto z-10">
                      <span className={`font-display text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientText}`}>
                        {milestone.year}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5A1E65] font-black text-[10px] uppercase tracking-wider">
                        {milestone.badge}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200">
                        {milestone.stat}
                      </span>
                    </div>

                    {/* Title & Subtitle: CENTER-ALIGNED */}
                    <div className="space-y-0.5 max-w-sm mx-auto mt-1 z-10">
                      <h3 
                        style={{
                          color: milestone.fontColor || undefined,
                          fontSize: milestone.fontSize === '2xl' ? '1.25rem' :
                                    milestone.fontSize === '3xl' ? '1.35rem' :
                                    milestone.fontSize === 'xl' ? '1.15rem' :
                                    milestone.fontSize === 'sm' ? '1rem' : undefined
                        }}
                        className="font-display text-base sm:text-lg font-black text-slate-950 leading-snug text-center"
                      >
                        {milestone.title}
                      </h3>
                      <p className="text-[10px] font-bold text-[#5A1E65] uppercase tracking-wider text-center">
                        {milestone.subtitle}
                      </p>
                    </div>

                    {/* MILESTONE PHOTOGRAPH: PROMINENTLY CENTER-ALIGNED */}
                    <div className="w-full max-w-sm sm:max-w-md mx-auto rounded-2xl overflow-hidden aspect-[16/9] max-h-44 sm:max-h-48 bg-slate-950 shadow-xl border-2 border-purple-200/90 group/img relative my-2 z-10">
                      <img
                        src={getOptimizedImageUrl(currentImage, { width: 800 })}
                        alt={milestone.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 mx-auto cursor-pointer"
                        loading="lazy"
                        onClick={() => setExpandedPhoto({
                          id: `ml-${milestone.year}-${selectedPicIdx ?? 'main'}`,
                          title: `${milestone.year}: ${milestone.title}`,
                          image: currentImage,
                          category: 'Historical Archive',
                          year: milestone.year,
                          description: milestone.description,
                          quote: milestone.quote,
                          details: milestone.details
                        })}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/community-gathering.jpg';
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                      {/* Fullscreen Magnifier pill */}
                      <button
                        type="button"
                        onClick={() => setExpandedPhoto({
                          id: `ml-${milestone.year}-${selectedPicIdx ?? 'main'}`,
                          title: `${milestone.year}: ${milestone.title}`,
                          image: currentImage,
                          category: 'Historical Archive',
                          year: milestone.year,
                          description: milestone.description,
                          quote: milestone.quote,
                          details: milestone.details
                        })}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
                        title="Open Fullscreen Archival View"
                        aria-label="Open Fullscreen Archival View"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Viewport Caption Bar */}
                      <div className="absolute inset-x-0 bottom-0 p-2.5 text-white flex items-center justify-between text-[11px]">
                        <span className="font-extrabold truncate pr-2 text-[10px] sm:text-[11px]">
                          {selectedPicIdx !== undefined && milestone.pictureFolder?.[selectedPicIdx]?.caption
                            ? milestone.pictureFolder[selectedPicIdx].caption
                            : `${milestone.year} Archive Photograph`}
                        </span>
                        <span className="text-[9px] text-amber-300 font-mono font-bold flex-shrink-0">
                          TAP TO EXPAND
                        </span>
                      </div>
                    </div>

                    {/* ARCHIVAL PICTURE FOLDER: CENTER-ALIGNED */}
                    {milestone.pictureFolder && milestone.pictureFolder.length > 0 && (
                      <div className="w-full max-w-sm sm:max-w-md mx-auto p-2 rounded-xl bg-purple-50/70 border border-purple-200/80 my-1 z-10">
                        <div className="flex items-center justify-between mb-1.5 px-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] flex items-center gap-1">
                            <FolderOpen className="w-3 h-3 text-amber-600" />
                            <span>Archival Folder ({milestone.pictureFolder.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFolderPics(prev => ({ ...prev, [milestone.year]: undefined }));
                            }}
                            className={`text-[9px] font-bold cursor-pointer ${
                              selectedPicIdx === undefined ? 'text-[#5A1E65] underline' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Main Photo
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {milestone.pictureFolder.map((pic, pIdx) => {
                            const isSelected = selectedPicIdx === pIdx;
                            return (
                              <button
                                key={pic.id || pIdx}
                                type="button"
                                onClick={() => {
                                  setActiveFolderPics(prev => ({ ...prev, [milestone.year]: pIdx }));
                                  playMilestoneChime(1.3);
                                }}
                                className={`w-11 h-8 rounded-lg overflow-hidden bg-slate-900 border-2 cursor-pointer transition-all shadow-2xs ${
                                  isSelected
                                    ? 'border-amber-400 ring-2 ring-amber-300 scale-105 z-10'
                                    : 'border-purple-200 hover:border-purple-400 hover:scale-102'
                                }`}
                                title={pic.caption || `Photo ${pIdx + 1}`}
                              >
                                <img
                                  src={getOptimizedImageUrl(pic.url, { width: 160 })}
                                  alt={pic.caption || milestone.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Narrative Story: CENTER-ALIGNED */}
                    <p className="font-serif text-slate-700 text-xs sm:text-sm leading-snug text-center max-w-sm sm:max-w-md mx-auto mt-1.5 line-clamp-3 z-10">
                      {milestone.description}
                    </p>

                    {/* Historical Quote Box: CENTER-ALIGNED */}
                    {milestone.quote && (
                      <blockquote className="max-w-sm sm:max-w-md mx-auto text-center p-2 rounded-xl bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50/50 border-y border-purple-300 font-serif italic text-purple-950 text-[11px] leading-snug mt-1.5 shadow-2xs z-10 line-clamp-2">
                        "{milestone.quote}"
                      </blockquote>
                    )}

                    {/* Archival Context & Field Notes: CENTER-ALIGNED */}
                    <div className="pt-2 w-full max-w-sm sm:max-w-md mx-auto z-10">
                      <button
                        type="button"
                        onClick={() => setExpandedPhoto({
                          id: `ml-${milestone.year}-${selectedPicIdx ?? 'main'}`,
                          title: `${milestone.year}: ${milestone.title}`,
                          image: currentImage,
                          category: 'Historical Archive',
                          year: milestone.year,
                          description: milestone.description,
                          quote: milestone.quote,
                          details: milestone.details
                        })}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100/90 text-[#5A1E65] font-bold text-[11px] transition-colors cursor-pointer mx-auto shadow-2xs border border-purple-200/80"
                        title="Explore Archival Context & County Impact"
                      >
                        <Info className="w-3.5 h-3.5 text-[#5A1E65]" />
                        <span>Archival Notes</span>
                        <ExternalLink className="w-3 h-3 text-[#5A1E65]/70" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Scroll/Swipe Directional Guidance */}
            <div className="text-center pt-2">
              <p className="text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                <span>⚡</span>
                <span>Scroll or swipe along the electric wire lane to explore each milestone</span>
                <span>⚡</span>
              </p>
            </div>

          </div>
        )}

        {/* VIEW 2: CHRONOLOGICAL ALL-MILESTONES GRID (ZERO DEAD GAPS) */}
        {memoryLaneViewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto z-10 relative">
            {milestones.map((milestone, idx) => {
              const isCurrent = idx === activeMilestoneIdx;
              const theme = milestoneThemes[idx % milestoneThemes.length];

              return (
                <div
                  key={milestone.year}
                  className={`rounded-3xl bg-white border-2 p-6 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between space-y-4 group ${
                    isCurrent 
                      ? 'border-[#5A1E65] ring-2 ring-purple-300' 
                      : 'border-purple-100 hover:border-purple-300'
                  }`}
                >
                  <div className="space-y-3 text-center">
                    {/* Top Row: Year + Badge Centered */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className={`font-display text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientText}`}>
                        {milestone.year}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-purple-100 text-[#5A1E65] font-black text-[10px] uppercase">
                        {milestone.badge}
                      </span>
                    </div>

                    {/* Centered Image */}
                    <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-slate-950 relative mx-auto max-w-sm">
                      <img
                        src={getOptimizedImageUrl(milestone.image, { width: 600 })}
                        alt={milestone.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mx-auto"
                        loading="lazy"
                      />
                    </div>

                    {/* Title Centered */}
                    <h4 className="font-display text-lg font-black text-slate-950 group-hover:text-[#5A1E65] transition-colors leading-snug">
                      {milestone.title}
                    </h4>

                    {/* Description Centered */}
                    <p className="text-xs text-slate-600 leading-relaxed font-serif">
                      {milestone.description}
                    </p>

                    {/* Stat */}
                    <div className="pt-1">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                        ⭐ {milestone.stat}
                      </span>
                    </div>
                  </div>

                  {/* Select & Jump Button */}
                  <button
                    type="button"
                    onClick={() => {
                      scrollToMilestone(idx);
                      setMemoryLaneViewMode('stage');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-[#5A1E65] text-[#5A1E65] hover:text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Launch in Wire Lane</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* End of Journey Anchor */}
        <div className="text-center pt-16 relative z-10 max-w-4xl mx-auto">
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
