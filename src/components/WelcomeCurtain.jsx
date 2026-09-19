import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, X } from 'lucide-react';

export default function WelcomeCurtain() {
  const [animating, setAnimating] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setAnimating(true);

    const timer = setTimeout(() => {
      setAnimating(false);
    }, 2400);

    const handleReplay = () => {
      setKey(prev => prev + 1);
      setAnimating(true);
      setTimeout(() => {
        setAnimating(false);
      }, 2400);
    };

    window.addEventListener('replayWelcomeAnimation', handleReplay);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('replayWelcomeAnimation', handleReplay);
    };
  }, [key]);

  if (!animating) return null;

  // 9 Vibrant pride & community color ribbons that slide in, hold, and peel away to reveal the live website
  const ribbons = [
    { color: '#5A1E65', delay: '0ms' },    // Deep Amethyst Plum
    { color: '#7C3AED', delay: '40ms' },   // Royal Violet
    { color: '#2563EB', delay: '80ms' },   // Sapphire Blue
    { color: '#0284C7', delay: '120ms' },  // Ocean Azure
    { color: '#0D9488', delay: '160ms' },  // Sanctuary Teal
    { color: '#10B981', delay: '200ms' },  // Emerald Green
    { color: '#FBBF24', delay: '240ms' },  // Sunlight Gold
    { color: '#F97316', delay: '280ms' },  // Sunset Tangerine
    { color: '#E11D48', delay: '320ms' },  // Pride Crimson
  ];

  return (
    <aside 
      key={key}
      aria-label="Welcome to Diversity Collective Ventura County"
      className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden flex flex-col justify-end"
      style={{
        contain: 'strict',
        isolation: 'isolate',
      }}
    >
      {/* 9 Staggered Multi-Color Ribbons that Peel Away to Reveal the Website */}
      <div className="absolute inset-0 w-full h-full flex flex-row pointer-events-none">
        {ribbons.map((ribbon, idx) => (
          <div
            key={idx}
            className="flex-1 h-full will-change-transform animate-ribbon-reveal shadow-2xs"
            style={{
              backgroundColor: ribbon.color,
              animationDelay: ribbon.delay,
            }}
          />
        ))}
      </div>

      {/* Top Skip Button */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 pointer-events-auto">
        <button
          onClick={() => setAnimating(false)}
          className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/75 text-white border border-white/25 text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-colors hover:bg-black flex items-center gap-1.5 shadow-xl cursor-pointer"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Center Brand Emblem Framed Inside the Curtain */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none animate-welcome-pop px-4">
        <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-slate-950/95 border-2 border-white/25 shadow-2xl flex flex-col items-center gap-3 sm:gap-4 text-center w-full max-w-[92vw] sm:max-w-md mx-auto">
          
          {/* Logo Emblem */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white p-2 sm:p-2.5 shadow-2xl border-2 border-purple-300 ring-4 ring-purple-500/30 flex-shrink-0">
            <img 
              src="/images/logo-square.png" 
              alt="Diversity Collective Ventura County" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col gap-1 text-white">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] sm:tracking-[0.28em] text-amber-300 flex items-center justify-center gap-1.5 sm:gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 flex-shrink-0" />
              <span>VENTURA COUNTY · EST. 2014</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 flex-shrink-0" />
            </span>
            <h1 className="font-display text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Diversity Collective
            </h1>
            <p className="font-serif italic text-base sm:text-lg md:text-xl text-purple-200 pt-0.5">
              “You Are Always Welcome Here.”
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Community Center
            </span>
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 border border-white/15">
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
              Advocacy & Health
            </span>
          </div>

        </div>
      </div>
    </aside>
  );
}
