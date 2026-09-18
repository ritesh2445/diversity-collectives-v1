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

  // 9 Vibrant pride & community color bands arranged from 180° (left) to 0° (right)
  const bands = [
    { color: '#4A154B', r: 640, strokeWidth: 38, delay: '0ms' },    // Deep Amethyst
    { color: '#6D28D9', r: 602, strokeWidth: 38, delay: '60ms' },   // Royal Violet
    { color: '#2563EB', r: 564, strokeWidth: 38, delay: '120ms' },  // Sapphire Blue
    { color: '#0284C7', r: 526, strokeWidth: 38, delay: '180ms' },  // Ocean Azure
    { color: '#0D9488', r: 488, strokeWidth: 38, delay: '240ms' },  // Sanctuary Teal
    { color: '#16A34A', r: 450, strokeWidth: 38, delay: '300ms' },  // Emerald Life
    { color: '#EAB308', r: 412, strokeWidth: 38, delay: '360ms' },  // Sunlight Yellow
    { color: '#EA580C', r: 374, strokeWidth: 38, delay: '420ms' },  // Sunset Amber
    { color: '#E11D48', r: 336, strokeWidth: 38, delay: '480ms' },  // Pride Crimson
  ];

  const cx = 700;
  const cy = 720;

  return (
    <aside 
      key={key}
      aria-label="Welcome to Diversity Collective Ventura County"
      className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden flex flex-col justify-end"
    >
      {/* Darkened Backdrop Overlay */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-700" />

      {/* Rotating Semicircle Fan Sector Layers (Sweeping from 180° to 0°) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden flex items-end justify-center">
        {bands.map((band, idx) => (
          <div
            key={idx}
            className="absolute w-[220vmax] h-[110vmax] rounded-t-full will-change-transform shadow-2xl animate-fan-sweep"
            style={{
              backgroundColor: band.color,
              animationDelay: band.delay,
              transformOrigin: '50% 100%',
              opacity: 0.95 - idx * 0.05,
            }}
          />
        ))}
      </div>

      {/* High-Fidelity SVG Concentric Semicircle Arcs (180° to 0°) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
        <svg 
          viewBox="0 0 1400 800" 
          className="w-full h-full max-h-screen object-cover"
          preserveAspectRatio="xMidYMax meet"
        >
          <defs>
            <filter id="glow-arc" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Semicircle Arcs tracing 180° (left) to 0° (right) */}
          {bands.map((band, idx) => {
            const arcLength = Math.PI * band.r;
            // Arc path from 180° (cx - r, cy) to 0° (cx + r, cy)
            const pathD = `M ${cx - band.r} ${cy} A ${band.r} ${band.r} 0 0 1 ${cx + band.r} ${cy}`;

            return (
              <g key={idx}>
                {/* Outer Glow Halo */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={band.color}
                  strokeWidth={band.strokeWidth + 12}
                  strokeLinecap="round"
                  opacity={0.35}
                  filter="url(#glow-arc)"
                  style={{
                    '--arc-length': `${arcLength}px`,
                    strokeDasharray: `${arcLength}px`,
                    animationDelay: band.delay,
                  }}
                  className="animate-arc-draw"
                />

                {/* Primary Semicircle Arc Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={band.color}
                  strokeWidth={band.strokeWidth}
                  strokeLinecap="round"
                  style={{
                    '--arc-length': `${arcLength}px`,
                    strokeDasharray: `${arcLength}px`,
                    animationDelay: band.delay,
                  }}
                  className="animate-arc-draw"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Top Skip Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 pointer-events-auto">
        <button
          onClick={() => setAnimating(false)}
          className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-white border border-white/25 text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all hover:bg-black/80 flex items-center gap-1.5 shadow-2xl cursor-pointer"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Center Brand Emblem & Greeting Inside the Semicircle */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none animate-welcome-pop px-3 sm:px-4">
        <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-slate-950/85 backdrop-blur-2xl border-2 border-white/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col items-center gap-3 sm:gap-4 text-center max-w-sm sm:max-w-lg mx-auto">
          
          {/* Logo Emblem */}
          <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-white p-2 sm:p-2.5 shadow-2xl border-2 border-purple-300 ring-4 ring-purple-500/30 flex-shrink-0">
            <img 
              src="/images/logo-square.png" 
              alt="Diversity Collective Ventura County" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col gap-1 text-white">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] sm:tracking-[0.28em] text-amber-300 flex items-center justify-center gap-1.5 sm:gap-2">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 flex-shrink-0" />
              <span>VENTURA COUNTY · EST. 2014</span>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 flex-shrink-0" />
            </span>
            <h1 className="font-display text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Diversity Collective
            </h1>
            <p className="font-serif italic text-sm sm:text-lg md:text-xl text-purple-200 pt-0.5">
              “You Are Always Welcome Here.”
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-0.5 text-[11px] sm:text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 border border-white/15">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
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
