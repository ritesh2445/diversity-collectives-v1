import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, X, ArrowRight, Calendar, Info, ChevronRight, Pause, Play } from 'lucide-react';
import { cmsStore } from '../services/cmsStore';
import { liveEvents } from '../data/dcvcData';
import {
  getSiteFeatures,
  subscribeToSiteFeatures,
  getActiveBroadcastPopup,
  splitSentenceIntoSlides
} from '../services/siteFeaturesStore';
import { translationService } from '../services/translationService';
import { useScrollLock } from '../utils/scrollLock';

const DISMISS_KEY = 'dcvc_dismissed_broadcast_id';

/**
 * Standardized High-Impact Auto Broadcast Popup
 * - Guaranteed identical fixed height (74px) on both mobile phones and laptops
 * - Length-based styling strategy so long sentences NEVER cause vertical expansion
 * - Supports Auto-Sliding sentence carousel with character limits, smooth horizontal ticker, and modal reader
 */
export default function AutoBroadcastPopup() {
  const [cmsEvents, setCmsEvents] = useState(() => cmsStore.getEvents?.() || liveEvents);
  const [features, setFeatures] = useState(getSiteFeatures);
  const [dismissedId, setDismissedId] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) || '';
    } catch {
      return '';
    }
  });

  const [slideIdx, setSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  useScrollLock(showFullModal);

  useEffect(() => {
    const unsubFeatures = subscribeToSiteFeatures((next) => setFeatures(next));
    const unsubCms = cmsStore.subscribe(() => {
      setCmsEvents(cmsStore.getEvents?.() || liveEvents);
    });
    return () => {
      unsubFeatures();
      unsubCms();
    };
  }, []);

  const activePopup = getActiveBroadcastPopup(cmsEvents || liveEvents, features);

  // Strategy configuration based on admin setting and sentence length
  const styleMode = activePopup?.style || 'auto';
  const maxChars = Number(activePopup?.maxCharsPerSlide) || 58;
  const rawMessage = activePopup?.message || '';

  // Split into character-capped slides for carousel
  const slides = useMemo(() => {
    if (!rawMessage) return [];
    return splitSentenceIntoSlides(rawMessage, maxChars);
  }, [rawMessage, maxChars]);

  // Determine effective rendering mode:
  // If auto, short text (< 48 chars) stays static, longer text auto-slides
  const effectiveMode = useMemo(() => {
    if (styleMode === 'sliding_slides') return 'sliding_slides';
    if (styleMode === 'ticker') return 'ticker';
    if (styleMode === 'compact') return 'compact';
    // 'auto' strategy
    if (rawMessage.length <= 48) return 'static';
    return 'sliding_slides';
  }, [styleMode, rawMessage.length]);

  // Timer for auto-sliding carousel
  useEffect(() => {
    if (effectiveMode !== 'sliding_slides' || slides.length <= 1 || isPaused) return undefined;
    const interval = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % slides.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [effectiveMode, slides.length, isPaused]);

  if (!activePopup || dismissedId === activePopup.id) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedId(activePopup.id);
    try {
      sessionStorage.setItem(DISMISS_KEY, activePopup.id);
    } catch {
      // ignore
    }
  };

  const currentSlide = slides[slideIdx % slides.length] || rawMessage;

  return (
    <>
      <div
        role="dialog"
        aria-label={activePopup.badge || 'Community Announcement'}
        className="fixed bottom-20 left-2 right-auto max-w-[calc(100vw-88px)] sm:bottom-6 sm:left-6 sm:right-auto sm:w-[320px] sm:max-w-[330px] z-50 animate-fadeIn"
      >
        {/* Compact, sleek broadcast notification */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="h-[52px] sm:h-[48px] min-h-[52px] sm:min-h-[48px] w-full bg-white rounded-xl shadow-xl border border-[#5A1E65]/25 p-1 px-2 sm:px-2.5 relative overflow-hidden flex items-center justify-between"
        >
          {/* Top Rainbow Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#5A1E65] via-rose-500 to-amber-500" />

          {/* Left Icon Badge */}
          <div className="shrink-0 w-6 h-6 rounded-lg bg-purple-100 text-[#5A1E65] flex items-center justify-center mr-1.5 shadow-2xs">
            {activePopup.kind === 'today_event' ? (
              <Calendar className="w-3.5 h-3.5" />
            ) : (
              <Megaphone className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Center: Title + Sentence Text Box (Strictly bounded height) */}
          <div className="flex-1 min-w-0 h-full flex flex-col justify-center overflow-hidden pr-1.5">
            {/* Header Line: Badge + Title */}
            <div className="flex items-center gap-1.5 leading-none mb-0.5 overflow-hidden">
              <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                {activePopup.badge}
              </span>
              <h4 className="font-display text-[11px] sm:text-xs font-black text-slate-950 truncate">
                {activePopup.title}
              </h4>
            </div>

            {/* Content Line: Rendered according to Length Strategy */}
            <div className="h-4 sm:h-4.5 overflow-hidden relative">
              {/* MODE 1: Auto-Sliding Text Carousel */}
              {effectiveMode === 'sliding_slides' && (
                <div className="flex items-center gap-1.5 h-full">
                  <p
                    key={slideIdx}
                    className="text-[10px] text-slate-700 font-semibold leading-tight truncate animate-fadeIn flex-1"
                    title={rawMessage}
                  >
                    {currentSlide}
                  </p>
                  {slides.length > 1 && (
                    <span className="shrink-0 text-[8px] font-mono font-bold text-purple-700 bg-purple-50 px-1 rounded-sm border border-purple-200">
                      {slideIdx + 1}/{slides.length}
                    </span>
                  )}
                </div>
              )}

              {/* MODE 2: Smooth Horizontal Ticker Ribbon */}
              {effectiveMode === 'ticker' && (
                <div className="overflow-hidden whitespace-nowrap w-full">
                  <p
                    className="inline-block text-[10px] text-slate-700 font-semibold animate-marquee hover:pause-animation"
                    title={rawMessage}
                  >
                    {rawMessage}
                  </p>
                </div>
              )}

              {/* MODE 3: Compact Truncated with Quick Modal */}
              {effectiveMode === 'compact' && (
                <div className="flex items-center gap-1">
                  <p className="text-[10px] text-slate-700 font-semibold truncate flex-1">
                    {rawMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowFullModal(true)}
                    className="shrink-0 text-[9px] text-[#5A1E65] font-extrabold underline hover:text-purple-900 cursor-pointer"
                  >
                    (more)
                  </button>
                </div>
              )}

              {/* MODE 4: Static Single Line for Short Messages */}
              {effectiveMode === 'static' && (
                <p className="text-[10px] text-slate-700 font-semibold truncate">
                  {rawMessage}
                </p>
              )}
            </div>
          </div>

          {/* Right Action Cluster: Guaranteed non-wrapping compact buttons */}
          <div className="shrink-0 flex items-center gap-1 ml-1">
            {activePopup.ctaUrl?.startsWith('http') ? (
              <a
                href={activePopup.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDismiss}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#5A1E65] text-white text-[10px] font-extrabold hover:bg-purple-900 transition-colors shadow-2xs whitespace-nowrap"
              >
                <span>{activePopup.ctaLabel && activePopup.ctaLabel.length <= 10 ? activePopup.ctaLabel : 'Details'}</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </a>
            ) : (
              <Link
                to={activePopup.ctaUrl || '/events'}
                onClick={handleDismiss}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#5A1E65] text-white text-[10px] font-extrabold hover:bg-purple-900 transition-colors shadow-2xs whitespace-nowrap"
              >
                <span>{activePopup.ctaLabel && activePopup.ctaLabel.length <= 10 ? activePopup.ctaLabel : 'Details'}</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss Announcement"
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Modal Reader for Long Announcements */}
      {showFullModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowFullModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-purple-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                {activePopup.badge}
              </span>
              <button
                type="button"
                onClick={() => setShowFullModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-display text-lg font-black text-slate-950 mb-2">
                {activePopup.title}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {rawMessage}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFullModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              {activePopup.ctaUrl && (
                <Link
                  to={activePopup.ctaUrl}
                  onClick={() => {
                    setShowFullModal(false);
                    handleDismiss();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#5A1E65] text-white text-xs font-bold hover:bg-purple-900 inline-flex items-center gap-1.5"
                >
                  <span>{activePopup.ctaLabel || 'View Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
