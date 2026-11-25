import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowRight, CheckCircle2, AlertCircle, Wifi, ShieldCheck } from 'lucide-react';
import {
  getSiteFeatures,
  subscribeToSiteFeatures,
  computeFlexSpaceStatus
} from '../services/siteFeaturesStore';
import { fetchAndApplyLiveSiteState } from '../services/liveSync';

/**
 * Section #11: Flex Space Overview Card (Home Page)
 * Compact info + live availability status; clicking Book Slot opens dedicated /flex-space page.
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
      className="py-12 md:py-16 bg-gradient-to-b from-slate-50 via-purple-50/40 to-white border-b border-purple-200/60 relative overflow-hidden"
    >
      <div className="container-clean">
        <div className="rounded-3xl bg-white border border-purple-200/80 shadow-md p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Flex Space Overview */}
          <div className="lg:col-span-7 space-y-4">
            <span className="glass-pill w-fit">
              {props.eyebrow || 'FLEX SPACE · SLOT BOOKING'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 leading-tight">
              {flexCfg?.title || props.headline || 'Community Flex Space'}
            </h2>
            <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
              {flexCfg?.description || props.description || 'Need a quiet, affirming space for peer support, telehealth, study, or community organizing? Check real-time availability and reserve a Flex Space time slot.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[#5A1E65]">
                <ShieldCheck className="w-3.5 h-3.5" /> Quiet &amp; Affirming
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Free Wi-Fi
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" /> Telehealth &amp; Study Ready
              </span>
            </div>
          </div>

          {/* Right: Live Status & Dedicated Booking Page CTA */}
          <div className="lg:col-span-5 flex flex-col gap-4 p-5 sm:p-6 rounded-2xl bg-slate-50/90 border border-slate-200/90">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                liveStatus.isAvailable
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                  liveStatus.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div className="space-y-1 min-w-0">
                <p className="font-extrabold text-sm">{liveStatus.label}</p>
                <p className="text-xs font-medium opacity-90 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Hours: {flexCfg?.autoHours?.openTime || '13:00'} – {flexCfg?.autoHours?.closeTime || '17:00'} (Mon–Fri)</span>
                </p>
                <p className="text-xs font-medium opacity-90 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>2471 Portola Road, Suite 100, Ventura</span>
                </p>
              </div>
            </div>

            {isManuallyClosed ? (
              <Link
                to="/flex-space"
                className="w-full py-3.5 px-5 rounded-xl bg-slate-200 hover:bg-slate-300/80 text-slate-800 border border-slate-300 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Bookings Unavailable · View Schedule</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            ) : (
              <Link
                to="/flex-space"
                className="btn-primary w-full py-3.5 px-5 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-md"
              >
                <span>{props.ctaText || 'Book Flex Space Slot'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

