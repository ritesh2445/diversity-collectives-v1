import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

/**
 * DcvcApprovedBadge
 * Interactive 3D flipping corner badge for DCVC Approved Businesses.
 * Front face: Official DCVC Logo with subtle aura glow.
 * Back face: Vibrant emerald approved tick that glows green.
 * Automatically flips periodically and smoothly flips on user hover/tap.
 */
export default function DcvcApprovedBadge({ className = '' }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-flip every 3.8 seconds if not currently hovered
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered) {
        setIsFlipped((prev) => !prev);
      }
    }, 3800);
    return () => clearInterval(timer);
  }, [isHovered]);

  const flippedState = isHovered ? !isFlipped : isFlipped;

  return (
    <div
      className={`relative inline-block cursor-pointer select-none group/flip ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsFlipped((prev) => !prev);
      }}
      title="DCVC Verified & Affirming Partner — Hover or click to inspect approval status"
      style={{ perspective: '800px' }}
    >
      <div
        className="relative transition-transform duration-700 ease-out preserve-3d"
        style={{
          transform: flippedState ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* FRONT FACE: Official DCVC Logo with Glow */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-purple-200/90 shadow-[0_0_15px_rgba(90,30,101,0.3)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(90,30,101,0.48)] shrink-0"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="relative flex items-center justify-center w-5 h-5 rounded-md overflow-hidden bg-white shadow-2xs border border-purple-100 shrink-0">
            <img
              src="/images/logo-square.png"
              alt="DCVC Official Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = 'flex';
                }
              }}
            />
            <div className="hidden w-full h-full bg-[#5A1E65] text-white font-black text-[9px] items-center justify-center">
              DC
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1E65] flex items-center gap-1.5 whitespace-nowrap">
            <span>DCVC Verified</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
          </span>
        </div>

        {/* BACK FACE: DCVC Green Approved Tick with Emerald Glow */}
        <div
          className="absolute inset-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 text-white border border-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.65)] transition-all duration-300 shrink-0"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <div className="w-5 h-5 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/50 shadow-xs">
            <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-white drop-shadow-xs flex items-center gap-1.5 whitespace-nowrap">
            <span>Approved</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </span>
        </div>
      </div>
    </div>
  );
}
