import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowRight, CheckCircle2, AlertCircle, Wifi, ShieldCheck, Sparkles } from 'lucide-react';
import {
  getSiteFeatures,
  subscribeToSiteFeatures,
  computeFlexSpaceStatus
} from '../services/siteFeaturesStore';
import { fetchAndApplyLiveSiteState } from '../services/liveSync';

/**
 * Section #11: Flex Space Overview Card (Home Page)
 * Compact 3D info card with animated thick electric-blue edge lighting;
 * clicking Book Slot opens the dedicated /flex-space booking page.
 */
export default function FlexSpaceBookingSection({ props = {}, style = {} }) {
  const [features, setFeatures] = useState(getSiteFeatures);

  useEffect(() => {
    fetchAndApplyLiveSiteState({ force: true }).catch(() => {});
    return subscribeToSiteFeatures((next) => setFeatures(next));
  }, []);

  const flexCfg = features.flexSpace;
  const liveStatus = computeFlexSpaceStatus(flexCfg);
  const isManuallyClosed = flexCfg?.manualStatus === 'closed';

  return (
    <section
      id="flex-space"
      style={style}
      className="py-12 md:py-16 bg-gradient-to-b from-slate-50 via-sky-50/40 to-white border-b border-sky-200/60 relative overflow-hidden"
    >
      <style>{`
        @keyframes flexElectricOrbit {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .flex-electric-beam {
          animation: flexElectricOrbit 4.5s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .flex-electric-beam { animation: none; }
        }
      `}</style>

      <div className="container-clean relative z-10">
        {/* 3D Floating Card with Thick Electric-Blue Moving Edge Lighting */}
        <div className="relative rounded-[28px] p-[3.5px] overflow-hidden shadow-[0_24px_60px_-15px_rgba(37,99,235,0.42),0_0_32px_rgba(0,212,255,0.28)] hover:-translate-y-1 transition-transform duration-300">
          {/* Moving Electric Blue Edge Light Layer */}
          <div
            aria-hidden="true"
            className="flex-electric-beam pointer-events-none absolute left-1/2 top-1/2 w-[220%] aspect-square"
            style={{
              background:
                'conic-gradient(from 0deg, #0ea5e9 0deg, #00f0ff 55deg, #2563eb 115deg, #0f172a 175deg, #38bdf8 235deg, #00e5ff 295deg, #3b82f6 335deg, #0ea5e9 360deg)'
            }}
          />

          {/* Inner 3D Card Surface */}
          <div
            className="relative rounded-[24.5px] bg-gradient-to-br from-[#070b1e] via-[#0f1738] to-[#1a1446] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center overflow-hidden"
            style={{
              boxShadow:
                'inset 0 1px 0 rgba(125, 211, 252, 0.35), inset 0 -10px 28px rgba(2, 6, 23, 0.7)'
            }}
          >
            {/* Subtle Ambient Electric Glow Orbs */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl"
            />

            {/* Left: Flex Space Overview */}
            <div className="lg:col-span-7 space-y-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-400/15 border border-cyan-300/40 text-cyan-200 text-[11px] font-extrabold uppercase tracking-widest shadow-[0_4px_14px_rgba(0,212,255,0.2)]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                {props.eyebrow || 'FLEX SPACE · SLOT BOOKING'}
              </span>

              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black leading-tight bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(56,189,248,0.25)]">
                {flexCfg?.title || props.headline || 'Community Flex Space'}
              </h2>

              <p className="text-slate-200/90 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
                {flexCfg?.description ||
                  props.description ||
                  'Need a quiet, affirming space for peer support, telehealth, study, or community organizing? Check real-time availability and reserve a Flex Space time slot.'}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-cyan-300/30 text-cyan-100 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> Quiet &amp; Affirming
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-emerald-300/30 text-emerald-100 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]">
                  <Wifi className="w-3.5 h-3.5 text-emerald-300" /> Free Wi-Fi
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-sky-300/30 text-sky-100 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Telehealth &amp; Study Ready
                </span>
              </div>
            </div>

            {/* Right: 3D Glass Status Panel & Dedicated Booking Page CTA */}
            <div
              className="lg:col-span-5 relative z-10 flex flex-col gap-4 p-5 sm:p-6 rounded-2xl bg-white/[0.07] backdrop-blur-md border border-cyan-300/25"
              style={{
                boxShadow:
                  '0 18px 36px -10px rgba(2, 6, 23, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 shadow-inner ${
                  liveStatus.isAvailable
                    ? 'bg-emerald-500/15 border-emerald-400/45 text-emerald-50'
                    : 'bg-amber-400/15 border-amber-300/45 text-amber-50'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                    liveStatus.isAvailable
                      ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]'
                      : 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
                  }`}
                />
                <div className="space-y-1.5 min-w-0">
                  <p className="font-extrabold text-sm tracking-tight text-white">
                    {liveStatus.label}
                  </p>
                  <p className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                    <span>
                      Hours: {flexCfg?.autoHours?.openTime || '13:00'} –{' '}
                      {flexCfg?.autoHours?.closeTime || '17:00'} (Mon–Fri)
                    </span>
                  </p>
                  <p className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                    <span>2471 Portola Road, Suite 100, Ventura</span>
                  </p>
                </div>
              </div>

              {isManuallyClosed ? (
                <Link
                  to="/flex-space"
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 hover:from-slate-700 hover:to-slate-600 !text-white border border-cyan-300/35 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all shadow-[0_5px_0_0_#0f172a,0_10px_20px_rgba(14,165,233,0.2)] active:translate-y-0.5"
                >
                  <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="text-white">Bookings Unavailable · View Schedule</span>
                  <ArrowRight className="w-4 h-4 text-cyan-300 shrink-0" />
                </Link>
              ) : (
                <Link
                  to="/flex-space"
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 !text-white border border-cyan-300/50 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all shadow-[0_5px_0_0_#1e3a8a,0_12px_26px_rgba(0,212,255,0.4)] active:translate-y-0.5"
                >
                  <span className="text-white">{props.ctaText || 'Book Flex Space Slot'}</span>
                  <ArrowRight className="w-4 h-4 text-white shrink-0" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

