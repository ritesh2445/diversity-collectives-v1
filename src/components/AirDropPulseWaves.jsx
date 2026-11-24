import React, { useMemo } from 'react';

/**
 * 8 Distinct Radiant Light Palettes for AirDrop Hype Waves
 * Crafted with borderless, feathered radial gradients for realistic soft-light propagation.
 */
const AIRDROP_PALETTES = [
  // 0. Aurora Cyan & Electric Azure
  {
    name: 'aurora-cyan',
    wave1: 'radial-gradient(circle, rgba(6, 182, 212, 0.60) 0%, rgba(59, 130, 246, 0.30) 45%, rgba(139, 92, 246, 0.12) 70%, transparent 88%)',
    wave2: 'radial-gradient(circle, rgba(14, 165, 233, 0.48) 0%, rgba(6, 182, 212, 0.22) 50%, transparent 85%)',
    wave3: 'radial-gradient(circle, rgba(59, 130, 246, 0.38) 0%, rgba(147, 51, 234, 0.14) 60%, transparent 90%)',
    ambient: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.32) 0%, rgba(59, 130, 246, 0.16) 45%, transparent 80%)',
    pillBg: 'from-cyan-500 via-sky-600 to-indigo-600'
  },
  // 1. Sunset Rose & Peach Coral
  {
    name: 'sunset-rose',
    wave1: 'radial-gradient(circle, rgba(244, 63, 94, 0.62) 0%, rgba(251, 146, 60, 0.30) 45%, rgba(245, 158, 11, 0.12) 70%, transparent 88%)',
    wave2: 'radial-gradient(circle, rgba(236, 72, 153, 0.50) 0%, rgba(251, 113, 133, 0.22) 50%, transparent 85%)',
    wave3: 'radial-gradient(circle, rgba(244, 63, 94, 0.38) 0%, rgba(249, 115, 22, 0.14) 60%, transparent 90%)',
    ambient: 'radial-gradient(circle at center, rgba(244, 63, 94, 0.32) 0%, rgba(251, 146, 60, 0.16) 45%, transparent 80%)',
    pillBg: 'from-rose-500 via-pink-600 to-amber-500'
  },
  // 2. Emerald Neon & Mint Glow
  {
    name: 'emerald-mint',
    wave1: 'radial-gradient(circle, rgba(16, 185, 129, 0.60) 0%, rgba(20, 184, 166, 0.30) 45%, rgba(52, 211, 153, 0.12) 70%, transparent 88%)',
    wave2: 'radial-gradient(circle, rgba(52, 211, 153, 0.48) 0%, rgba(16, 185, 129, 0.22) 50%, transparent 85%)',
    wave3: 'radial-gradient(circle, rgba(20, 184, 166, 0.38) 0%, rgba(6, 182, 212, 0.14) 60%, transparent 90%)',
    ambient: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.32) 0%, rgba(52, 211, 153, 0.16) 45%, transparent 80%)',
    pillBg: 'from-emerald-500 via-teal-600 to-cyan-600'
  },
  // 3. Royal Amethyst & Magenta Stardust
  {
    name: 'amethyst-magenta',
    wave1: 'radial-gradient(circle, rgba(168, 85, 247, 0.62) 0%, rgba(217, 70, 239, 0.32) 45%, rgba(147, 51, 234, 0.14) 70%, transparent 88%)',
    wave2: 'radial-gradient(circle, rgba(192, 132, 252, 0.50) 0%, rgba(168, 85, 247, 0.24) 50%, transparent 85%)',
    wave3: 'radial-gradient(circle, rgba(217, 70, 239, 0.38) 0%, rgba(236, 72, 153, 0.14) 60%, transparent 90%)',
    ambient: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.34) 0%, rgba(217, 70, 239, 0.18) 45%, transparent 80%)',
    pillBg: 'from-purple-600 via-fuchsia-600 to-pink-500'
  },
  // 4. Solar Amber & Warm Tangerine
  {
    name: 'solar-amber',
    wave1: 'radial-gradient(circle, rgba(245, 158, 11, 0.65) 0%, rgba(249, 115, 22, 0.32) 45%, rgba(251, 191, 36, 0.14) 70%, transparent 88%)',
    wave2: 'radial-gradient(circle, rgba(251, 191, 36, 0.52) 0%, rgba(245, 158, 11, 0.24) 50%, transparent 85%)',
    wave3: 'radial-gradient(circle, rgba(249, 115, 22, 0.40) 0%, rgba(239, 68, 68, 0.14) 60%, transparent 90%)',
    ambient: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.35) 0%, rgba(249, 115, 22, 0.18) 45%, transparent 80%)',
    pillBg: 'from-amber-500 via-orange-500 to-rose-500'
  },
  // 5. Deep Ocean Sapphire & Cosmic Indigo
  {
    name: 'ocean-indigo',
    wave1: 'radial-gradient(circle, rgba(99, 102, 241, 0.62) 0%, rgba(56, 189, 248, 0.30) 45%, rgba(79, 70, 229, 0.12) 70%, transparent 88%)',
    wave2: 'radial-gradient(circle, rgba(79, 70, 229, 0.50) 0%, rgba(99, 102, 241, 0.22) 50%, transparent 85%)',
    wave3: 'radial-gradient(circle, rgba(56, 189, 248, 0.38) 0%, rgba(14, 165, 233, 0.14) 60%, transparent 90%)',
    ambient: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.32) 0%, rgba(56, 189, 248, 0.16) 45%, transparent 80%)',
    pillBg: 'from-indigo-600 via-blue-600 to-sky-500'
  },
  // 6. Prismatic Rainbow Iridescence (DCVC Signature)
  {
    name: 'prismatic-rainbow',
    wave1: 'radial-gradient(circle, rgba(236, 72, 153, 0.55) 0%, rgba(168, 85, 247, 0.35) 35%, rgba(6, 182, 212, 0.20) 65%, transparent 88%)',
    wave2: 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(16, 185, 129, 0.25) 45%, rgba(59, 130, 246, 0.15) 70%, transparent 85%)',
    wave3: 'radial-gradient(circle, rgba(168, 85, 247, 0.38) 0%, rgba(236, 72, 153, 0.20) 55%, transparent 90%)',
    ambient: 'radial-gradient(circle at center, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.20) 35%, rgba(6, 182, 212, 0.15) 60%, transparent 85%)',
    pillBg: 'from-purple-600 via-pink-500 to-amber-400'
  },
  // 7. Lavender Mint Ethereal
  {
    name: 'lavender-mint',
    wave1: 'radial-gradient(circle, rgba(192, 132, 252, 0.60) 0%, rgba(52, 211, 153, 0.28) 45%, rgba(147, 51, 234, 0.12) 70%, transparent 88%)',
    wave2: 'radial-gradient(circle, rgba(52, 211, 153, 0.48) 0%, rgba(192, 132, 252, 0.22) 50%, transparent 85%)',
    wave3: 'radial-gradient(circle, rgba(168, 85, 247, 0.38) 0%, rgba(20, 184, 166, 0.14) 60%, transparent 90%)',
    ambient: 'radial-gradient(circle at center, rgba(192, 132, 252, 0.30) 0%, rgba(52, 211, 153, 0.15) 45%, transparent 80%)',
    pillBg: 'from-purple-500 via-teal-500 to-emerald-400'
  }
];

/**
 * AirDropPulseWaves
 * Renders an authentic Apple AirDrop / iOS device pairing light wave animation.
 * Completely borderless (zero visible circles or outlines), using soft, diffuse radial light fields
 * that seamlessly illuminate the card surface with zero device lag.
 */
export default function AirDropPulseWaves({ active = false, bizId = '', category = '', seed = 0 }) {
  // Derive a distinct, consistent color palette per business card, or randomize on tap
  const palette = useMemo(() => {
    let hash = seed || 0;
    const str = `${bizId || ''}-${category || ''}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % AIRDROP_PALETTES.length;
    return AIRDROP_PALETTES[index];
  }, [bizId, category, seed]);

  if (!active) return null;

  return (
    <div className="airdrop-pulse-wrapper pointer-events-none" aria-hidden="true">
      {/* 1. Translucent ambient card light swell (no borders) */}
      <div 
        className="airdrop-ambient-swell" 
        style={{ background: palette.ambient }} 
      />

      {/* 2. Three Soft Concentric AirDrop Radiant Light Waves (borderless diffuse glow) */}
      <div 
        className="airdrop-light-wave airdrop-light-wave-1" 
        style={{ background: palette.wave1 }} 
      />
      <div 
        className="airdrop-light-wave airdrop-light-wave-2" 
        style={{ background: palette.wave2 }} 
      />
      <div 
        className="airdrop-light-wave airdrop-light-wave-3" 
        style={{ background: palette.wave3 }} 
      />

      {/* 3. Floating Apple-Style Spring Badge */}
      <div className="hype-spring-badge">
        <div className={`px-3.5 py-1.5 rounded-full bg-gradient-to-r ${palette.pillBg} text-white font-black text-xs shadow-2xl border border-white/90 flex items-center gap-1.5 whitespace-nowrap`}>
          <span className="text-sm">🔥</span>
          <span className="tracking-wide">+1 HYPE!</span>
        </div>
      </div>
    </div>
  );
}
