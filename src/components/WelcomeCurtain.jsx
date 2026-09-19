import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, X } from 'lucide-react';

export default function WelcomeCurtain() {
  const [animating, setAnimating] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setAnimating(true);

    const timer = setTimeout(() => {
      setAnimating(false);
    }, 2500);

    const handleReplay = () => {
      setKey(prev => prev + 1);
      setAnimating(true);
      setTimeout(() => {
        setAnimating(false);
      }, 2500);
    };

    window.addEventListener('replayWelcomeAnimation', handleReplay);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('replayWelcomeAnimation', handleReplay);
    };
  }, [key]);

  if (!animating) return null;

  // 9 Vibrant pride & community color wedges arranged in an exact 180° to 0° semicircle fan.
  // Rendered as pure SVG vector geometry for 100% GPU-accelerated 60-120fps rotation on mobile.
  const wedges = [
    { color: '#5A1E65', startDeg: 180, endDeg: 160 }, // Amethyst Plum
    { color: '#7C3AED', startDeg: 160, endDeg: 140 }, // Royal Violet
    { color: '#2563EB', startDeg: 140, endDeg: 120 }, // Sapphire Blue
    { color: '#0284C7', startDeg: 120, endDeg: 100 }, // Ocean Azure
    { color: '#0D9488', startDeg: 100, endDeg: 80 },  // Sanctuary Teal
    { color: '#10B981', startDeg: 80, endDeg: 60 },   // Emerald Green
    { color: '#FBBF24', startDeg: 60, endDeg: 40 },   // Sunlight Gold
    { color: '#F97316', startDeg: 40, endDeg: 20 },   // Sunset Tangerine
    { color: '#E11D48', startDeg: 20, endDeg: 0 },    // Pride Crimson
  ];

  const cx = 800;
  const cy = 900;
  const r = 1500;

  // Generate vector path for a 20° sector from 180° to 0°
  const getWedgePath = (startDeg, endDeg) => {
    const rad1 = (startDeg * Math.PI) / 180;
    const rad2 = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad1);
    const y1 = cy - r * Math.sin(rad1);
    const x2 = cx + r * Math.cos(rad2);
    const y2 = cy - r * Math.sin(rad2);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  // Concentric arc dividers
  const concentricRadii = [420, 520, 620, 740, 880, 1040, 1220];

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
      {/* Darkened Backdrop Dimmer */}
      <div 
        className="absolute inset-0 bg-slate-950/80 transition-opacity duration-500" 
        style={{ willChange: 'opacity' }}
      />

      {/* 100% GPU-Accelerated Semicircle Rainbow Fan (180° to 0°) */}
      {/* Slices across 100% of the screen on all mobile portrait and landscape devices */}
      <div className="absolute inset-0 w-full h-full pointer-events-none flex items-end justify-center">
        <svg 
          viewBox="0 0 1600 900" 
          className="w-full h-full object-cover pointer-events-none"
          preserveAspectRatio="xMidYMax slice"
        >
          {/* Rotating Fan Group: Sweeps from 180° to 0° on the GPU compositor thread */}
          <g 
            className="animate-fan-sweep"
            style={{ 
              transformOrigin: '800px 900px',
              willChange: 'transform',
            }}
          >
            {/* 9 Solid Rainbow Wedges (No gradient shader lag on mobile) */}
            {wedges.map((w, idx) => (
              <path
                key={idx}
                d={getWedgePath(w.startDeg, w.endDeg)}
                fill={w.color}
                opacity={0.92}
              />
            ))}

            {/* Concentric Arc Divider Lines */}
            {concentricRadii.map((arcR, idx) => (
              <path
                key={`arc-${idx}`}
                d={`M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth={3}
              />
            ))}
          </g>
        </svg>
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

      {/* Floating Center Brand Emblem Framed Inside the Semicircle */}
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
