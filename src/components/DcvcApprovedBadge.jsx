import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

/**
 * DcvcApprovedBadge
 * Compact micro-capsule 3D gyroscope badge for DCVC Verified & Approved Businesses.
 * Auto-flips between DCVC official seal and Emerald Verified "APPROVED" badge.
 * Perfectly calibrated typography and padding to guarantee ZERO truncation.
 */
export default function DcvcApprovedBadge({ className = '' }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-flip every 3.6 seconds if not currently hovered
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered) {
        setIsFlipped((prev) => !prev);
      }
    }, 3600);
    return () => clearInterval(timer);
  }, [isHovered]);

  const flippedState = isHovered ? !isFlipped : isFlipped;

  return (
    <div
      className={`relative inline-block cursor-pointer select-none badge-3d-wrapper group/badge ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsFlipped((prev) => !prev);
      }}
      title="DCVC Verified & Affirming Partner — Hover or tap to toggle status"
    >
      <div className={`grid grid-cols-1 grid-rows-1 w-[110px] h-[23px] badge-3d-card ${flippedState ? 'is-flipped' : ''}`}>
        {/* FRONT FACE: Official DCVC Logo + Holographic Sheen + Amethyst Glow */}
        <div
          className="col-start-1 row-start-1 w-[110px] h-[23px] flex items-center justify-center gap-1.5 px-2.5 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-purple-200/90 dark:border-purple-500/40 badge-violet-glow transition-all duration-300 relative select-none overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Prismatic Holographic Sweep */}
          <div className="badge-holo-shimmer" />

          {/* DCVC Logo Coin */}
          <div className="relative z-10 flex items-center justify-center w-3.5 h-3.5 rounded-full overflow-hidden bg-white shadow-2xs border border-purple-200/80 shrink-0">
            <img
              src="/images/logo-square.png"
              alt="DCVC Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = 'flex';
                }
              }}
            />
            <div className="hidden w-full h-full bg-[#5A1E65] text-white font-black text-[7px] items-center justify-center">
              DC
            </div>
          </div>

          {/* Micro Typography */}
          <div className="relative z-10 flex items-center gap-1 shrink-0 whitespace-nowrap">
            <span className="text-[9.5px] font-black tracking-wider text-[#5A1E65] dark:text-purple-200 leading-none">
              DCVC
            </span>
            <span className="relative flex h-1.5 w-1.5 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-600" />
            </span>
          </div>
        </div>

        {/* BACK FACE: Emerald Neon Approved Checkmark + Prism Sheen */}
        <div
          className="col-start-1 row-start-1 w-[110px] h-[23px] flex items-center justify-center gap-1.5 px-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white border border-emerald-300/80 badge-emerald-glow transition-all duration-300 relative select-none overflow-hidden"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {/* Prismatic Holographic Sweep */}
          <div className="badge-holo-shimmer" />

          {/* Emerald Checkmark Coin */}
          <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/60 shadow-xs">
            <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
          </div>

          {/* Micro Typography */}
          <div className="relative z-10 flex items-center gap-1 shrink-0 whitespace-nowrap">
            <span className="text-[9px] font-black tracking-wider text-white drop-shadow-xs leading-none">
              APPROVED
            </span>
            <span className="relative flex h-1.5 w-1.5 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-200" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
