import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, X } from 'lucide-react';

export default function WelcomeCurtain() {
  const [animating, setAnimating] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setAnimating(true);

    const timer = setTimeout(() => {
      setAnimating(false);
    }, 2800);

    const handleReplay = () => {
      setKey(prev => prev + 1);
      setAnimating(true);
      setTimeout(() => {
        setAnimating(false);
      }, 2800);
    };

    window.addEventListener('replayWelcomeAnimation', handleReplay);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('replayWelcomeAnimation', handleReplay);
    };
  }, [key]);

  if (!animating) return null;

  // 9 Vibrant, distinct pride & community color bands arranged in concentric 180° to 0° arc lanes.
  const bands = [
    { color: '#5A1E65', r: 760, strokeWidth: 46, delay: '0ms' },    // Deep Amethyst Plum
    { color: '#7C3AED', r: 712, strokeWidth: 46, delay: '25ms' },   // Royal Violet
    { color: '#2563EB', r: 664, strokeWidth: 46, delay: '50ms' },   // Sapphire Blue
    { color: '#0284C7', r: 616, strokeWidth: 46, delay: '75ms' },   // Ocean Azure
    { color: '#0D9488', r: 568, strokeWidth: 46, delay: '100ms' },  // Sanctuary Teal
    { color: '#10B981', r: 520, strokeWidth: 46, delay: '125ms' },  // Emerald Green
    { color: '#FBBF24', r: 472, strokeWidth: 46, delay: '150ms' },  // Sunlight Gold
    { color: '#F97316', r: 424, strokeWidth: 46, delay: '175ms' },  // Sunset Tangerine
    { color: '#E11D48', r: 376, strokeWidth: 46, delay: '200ms' },  // Pride Crimson
  ];

  const cx = 800;
  const cy = 880;

  return (
    <aside 
      key={key}
      aria-label="Welcome to Diversity Collective Ventura County"
      className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden flex flex-col justify-end animate-curtain-fade"
      style={{
        contain: 'strict',
        isolation: 'isolate',
      }}
    >
      {/* Base Backdrop Dimmer */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] transition-opacity duration-700" 
        style={{ willChange: 'opacity' }}
      />

      {/* Sweeping Full-Screen Multi-Color Background Rainbow Fan (180° to 0°) */}
      {/* Sized with vmax so it occupies 100% full screen on all mobile portrait & landscape screens */}
      <div className="absolute inset-0 w-full h-full overflow-hidden flex items-end justify-center pointer-events-none">
        {/* Ambient Multi-Color Glow Fan */}
        <div 
          className="absolute w-[260vmax] h-[130vmax] rounded-t-full will-change-transform animate-fan-sweep rainbow-conic-glow blur-2xl opacity-60"
          style={{
            transformOrigin: '50% 100%',
            animationDelay: '0ms',
          }}
        />

        {/* Primary Full-Bleed Semicircular Rainbow Fan */}
        <div 
          className="absolute w-[260vmax] h-[130vmax] rounded-t-full will-change-transform animate-fan-sweep rainbow-conic-fan opacity-90 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
          style={{
            transformOrigin: '50% 100%',
            animationDelay: '20ms',
          }}
        />
      </div>

      {/* High-Fidelity SVG Concentric Rainbow Arcs (180° to 0°) */}
      {/* Uses slice so it fills 100% of the screen on both mobile and desktop */}
      <div className="absolute inset-0 w-full h-full pointer-events-none flex items-end justify-center">
        <svg 
          viewBox="0 0 1600 900" 
          className="w-full h-full object-cover pointer-events-none"
          preserveAspectRatio="xMidYMax slice"
          style={{
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        >
          {/* Concentric Semicircle Arcs from 180° (left) around to 0° (right) */}
          {bands.map((band, idx) => {
            const arcLen = Math.PI * band.r;
            // Arc path from 180° (cx - r, cy) curving up over 90° (cx, cy - r) down to 0° (cx + r, cy)
            const pathD = `M ${cx - band.r} ${cy} A ${band.r} ${band.r} 0 0 1 ${cx + band.r} ${cy}`;

            return (
              <g key={idx}>
                {/* Luminous Halo Stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={band.color}
                  strokeWidth={band.strokeWidth + 12}
                  strokeLinecap="round"
                  opacity={0.35}
                  style={{
                    '--arc-len': `${arcLen}px`,
                    strokeDasharray: `${arcLen}px`,
                    animationDelay: band.delay,
                  }}
                  className="animate-rainbow-sweep"
                />

                {/* Crisp Primary Color Band */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={band.color}
                  strokeWidth={band.strokeWidth}
                  strokeLinecap="round"
                  style={{
                    '--arc-len': `${arcLen}px`,
                    strokeDasharray: `${arcLen}px`,
                    animationDelay: band.delay,
                  }}
                  className="animate-rainbow-sweep"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Top Skip Button */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 pointer-events-auto">
        <button
          onClick={() => setAnimating(false)}
          className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/60 backdrop-blur-md text-white/90 hover:text-white border border-white/20 text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all hover:bg-black/90 flex items-center gap-1.5 shadow-2xl cursor-pointer"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Center Brand Emblem Framed Inside the Semicircle */}
      {/* Fully responsive on all mobile portrait & landscape screens */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none animate-welcome-pop px-3 sm:px-4">
        <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-slate-950/85 backdrop-blur-md border-2 border-white/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col items-center gap-3 sm:gap-4 text-center w-full max-w-[92vw] sm:max-w-md mx-auto">
          
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
