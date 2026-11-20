import React from 'react';

/**
 * AirDropPulseWaves
 * Renders an authentic Apple AirDrop / iOS device pairing radar wave animation.
 * Features 3 concentric ethereal radiant waves expanding outward with soft aura blur,
 * paired with a translucent iridescent card wash and a floating '+1 Hype! 🔥' badge.
 */
export default function AirDropPulseWaves({ active = false }) {
  if (!active) return null;

  return (
    <div className="airdrop-pulse-wrapper pointer-events-none" aria-hidden="true">
      {/* Translucent iridescent card wash */}
      <div className="airdrop-ambient-flash" />

      {/* 3 Concentric AirDrop Radar Light Waves */}
      <div className="airdrop-wave-circle airdrop-wave-1" />
      <div className="airdrop-wave-circle airdrop-wave-2" />
      <div className="airdrop-wave-circle airdrop-wave-3" />

      {/* Floating '+1 Hype!' Beacon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 hype-float-badge">
        <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-amber-500 text-white font-black text-xs shadow-xl border border-white/80 flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-sm">🔥</span>
          <span>+1 HYPE!</span>
        </div>
      </div>
    </div>
  );
}
