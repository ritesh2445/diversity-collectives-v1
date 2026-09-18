import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, X } from 'lucide-react';

export default function WelcomeCurtain() {
  const [animating, setAnimating] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setAnimating(true);

    // Snappy, fast dismiss so phone users aren't delayed (1.6s total)
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 1600);

    const handleReplay = () => {
      setKey(prev => prev + 1);
      setAnimating(true);
      setTimeout(() => {
        setAnimating(false);
      }, 1600);
    };

    window.addEventListener('replayWelcomeAnimation', handleReplay);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('replayWelcomeAnimation', handleReplay);
    };
  }, [key]);

  if (!animating) return null;

  // 7 Pure Pride Color Bands (180° left to 0° right)
  // Tight 25ms stagger delays for a fast, silky swoosh on mobile phones
  const bands = [
    { color: '#5A1E65', r: 620, strokeWidth: 32, delay: '0ms' },    // Amethyst Violet
    { color: '#7C3AED', r: 586, strokeWidth: 32, delay: '25ms' },   // Royal Violet
    { color: '#0284C7', r: 552, strokeWidth: 32, delay: '50ms' },   // Ocean Azure
    { color: '#059669', r: 518, strokeWidth: 32, delay: '75ms' },   // Emerald Green
    { color: '#EAB308', r: 484, strokeWidth: 32, delay: '100ms' },  // Sunlight Yellow
    { color: '#EA580C', r: 450, strokeWidth: 32, delay: '125ms' },  // Sunset Tangerine
    { color: '#E11D48', r: 416, strokeWidth: 32, delay: '150ms' },  // Crimson Pride
  ];

  const cx = 700;
  const cy = 720;

  return (
    <aside 
      key={key}
      aria-label="Welcome to Diversity Collective Ventura County"
      className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden flex flex-col justify-end"
    >
      {/* High-Performance Smooth Curtain Wave */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300" 
        style={{ willChange: 'opacity' }}
      />

      {/* GPU-Accelerated Crisp SVG Semicircle Arcs (180° to 0°) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
        <svg 
          viewBox="0 0 1400 800" 
          className="w-full h-full max-h-screen object-cover"
          preserveAspectRatio="xMidYMax slice"
          style={{ 
            willChange: 'transform',
            filter: 'drop-shadow(0 0 14px rgba(124, 58, 237, 0.35))'
          }}
        >
          {/* Pure Vector Semicircle Arcs tracing 180° (left) to 0° (right) */}
          {bands.map((band, idx) => {
            const arcLength = Math.PI * band.r;
            // Arc path: starts at 180° (cx - r, cy) and sweeps to 0° (cx + r, cy)
            const pathD = `M ${cx - band.r} ${cy} A ${band.r} ${band.r} 0 0 1 ${cx + band.r} ${cy}`;

            return (
              <path
                key={idx}
                d={pathD}
                fill="none"
                stroke={band.color}
                strokeWidth={band.strokeWidth}
                strokeLinecap="round"
                style={{
                  '--arc-length': `${arcLength}px`,
                  strokeDasharray: `${arcLength}px`,
                  animationDelay: band.delay,
                  willChange: 'stroke-dashoffset',
                }}
                className="animate-arc-draw"
              />
            );
          })}
        </svg>
      </div>

      {/* Top Touch-Friendly Skip Button */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-50 pointer-events-auto">
        <button
          onClick={() => setAnimating(false)}
          className="h-9 px-3.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/25 text-xs font-bold tracking-wider uppercase active:scale-95 transition-all hover:bg-black/80 flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Center Brand Emblem & Greeting (Optimized for all phone screens) */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none animate-welcome-pop px-3">
        <div className="p-4 xs:p-5 sm:p-7 md:p-9 rounded-2xl sm:rounded-3xl bg-slate-950/90 backdrop-blur-xl border border-white/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] flex flex-col items-center gap-2.5 sm:gap-3.5 text-center max-w-[310px] xs:max-w-sm sm:max-w-md mx-auto">
          
          {/* Logo Emblem */}
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-18 sm:h-18 rounded-xl sm:rounded-2xl bg-white p-1.5 sm:p-2 shadow-xl border border-purple-200 ring-4 ring-purple-500/25 flex-shrink-0">
            <img 
              src="/images/logo-square.png" 
              alt="Diversity Collective Ventura County" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col gap-0.5 text-white">
            <span className="text-[9px] xs:text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-amber-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300 flex-shrink-0" />
              <span>VENTURA COUNTY · EST. 2014</span>
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300 flex-shrink-0" />
            </span>
            <h1 className="font-display text-lg xs:text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Diversity Collective
            </h1>
            <p className="font-serif italic text-xs xs:text-sm sm:text-base text-purple-200 pt-0.5">
              “You Are Always Welcome Here.”
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-0.5 text-[10px] xs:text-[11px] font-semibold text-slate-200">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Community Center
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
              Advocacy & Health
            </span>
          </div>

        </div>
      </div>
    </aside>
  );
}
