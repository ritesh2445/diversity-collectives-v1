import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Star, 
  Flame, 
  Clock, 
  ArrowRight,
  Heart,
  ShieldCheck,
  Check
} from 'lucide-react';
import { directoryService } from '../services/directoryService';
import DcvcApprovedBadge from './DcvcApprovedBadge';
import AirDropPulseWaves from './AirDropPulseWaves';

// Approximate normalized coordinates (x: 0-100%, y: 0-100%) for Ventura County cities
const CITY_COORDINATES = {
  Ventura: { x: 26, y: 50 },
  Oxnard: { x: 38, y: 68 },
  Camarillo: { x: 55, y: 62 },
  Ojai: { x: 30, y: 22 },
  'Thousand Oaks': { x: 76, y: 72 },
  'Simi Valley': { x: 80, y: 44 }
};

export default function DirectoryMapView({ businesses = [], onHype, activeHypeId }) {
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedBiz, setSelectedBiz] = useState(() => businesses[0] || null);

  const cities = ['All', 'Ventura', 'Oxnard', 'Camarillo', 'Ojai', 'Thousand Oaks', 'Simi Valley'];

  const displayedBusinesses = selectedCity === 'All' 
    ? businesses 
    : businesses.filter(b => (b.city || '').toLowerCase() === selectedCity.toLowerCase());

  // Distribute pins slightly around their city center to prevent overlapping
  const getPinPosition = (biz, index) => {
    const base = CITY_COORDINATES[biz.city] || { x: 50, y: 50 };
    const offsetAngle = (index * 75) * (Math.PI / 180);
    const offsetDistance = 2.8 + (index % 3) * 1.8;
    return {
      x: Math.max(10, Math.min(90, base.x + Math.cos(offsetAngle) * offsetDistance)),
      y: Math.max(12, Math.min(88, base.y + Math.sin(offsetAngle) * offsetDistance))
    };
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* City Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 p-3 rounded-2xl border border-slate-200/80 shadow-xs backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <Navigation className="w-3.5 h-3.5 text-[#5A1E65]" />
          <span>Filter Map by City:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCity === city
                  ? 'bg-[#5A1E65] text-white shadow-xs font-extrabold'
                  : 'bg-slate-100 hover:bg-purple-50 text-slate-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[580px]">
        {/* Interactive Vector Regional Map Canvas */}
        <div className="lg:col-span-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-2 border-purple-900/40 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6">
          {/* Pacific Coastline & Topographic SVG Accent Overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 800 600" preserveAspectRatio="none">
            <path
              d="M 0,280 Q 200,320 280,420 T 500,580 L 0,600 Z"
              fill="rgba(56, 189, 248, 0.25)"
            />
            <path
              d="M 50,0 Q 220,180 320,220 T 700,180 L 800,0 Z"
              fill="rgba(168, 85, 247, 0.15)"
            />
            {/* Ventura County Geographic Contour Lines */}
            <circle cx="260" cy="300" r="140" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="4 6" />
            <circle cx="550" cy="370" r="180" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeDasharray="4 6" />
          </svg>

          {/* Map Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-200">
                Interactive Ventura County Affirming Map
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Showing {displayedBusinesses.length} affirming locations
            </span>
          </div>

          {/* City Geographic Landmarks Labels */}
          <div className="absolute inset-0 pointer-events-none z-10 text-[10px] font-black tracking-widest uppercase text-white/30">
            <span className="absolute left-[26%] top-[45%]">Ventura</span>
            <span className="absolute left-[38%] top-[74%]">Oxnard</span>
            <span className="absolute left-[54%] top-[57%]">Camarillo</span>
            <span className="absolute left-[30%] top-[17%]">Ojai</span>
            <span className="absolute left-[74%] top-[77%]">Thousand Oaks</span>
            <span className="absolute left-[78%] top-[39%]">Simi Valley</span>
            <span className="absolute left-[8%] bottom-[8%] text-sky-400/40 tracking-normal font-sans text-xs italic">
              Pacific Ocean 🌊
            </span>
          </div>

          {/* Interactive Business Location Pins */}
          <div className="relative z-20 w-full h-[440px]">
            {displayedBusinesses.map((biz, idx) => {
              const pos = getPinPosition(biz, idx);
              const isSelected = selectedBiz?.id === biz.id;
              const isApproved = Boolean(biz.is_verified || biz.isVerifiedAffirming || biz.verified);

              return (
                <button
                  key={biz.id || idx}
                  type="button"
                  onClick={() => setSelectedBiz(biz)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all duration-300 ${
                    isSelected ? 'scale-125 z-40' : 'hover:scale-115 z-30'
                  }`}
                  title={`${biz.name} (${biz.city})`}
                >
                  {/* Pin Halo */}
                  <span
                    className={`absolute inset-0 rounded-full blur-sm transition-all ${
                      isSelected 
                        ? 'bg-amber-400 opacity-90 scale-150 animate-ping' 
                        : isApproved 
                          ? 'bg-purple-500 opacity-60' 
                          : 'bg-indigo-500 opacity-40'
                    }`}
                  />

                  {/* Pin Body */}
                  <div
                    className={`relative flex items-center justify-center p-2 rounded-2xl shadow-xl transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 text-slate-950 border-white ring-4 ring-amber-400/40 font-black'
                        : isApproved
                          ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white border-purple-300'
                          : 'bg-slate-800 text-white border-slate-600'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>

                  {/* Pin Label Hover Pill */}
                  <span className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 -top-7 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950 text-white border border-slate-700 shadow-xl whitespace-nowrap z-50">
                    {biz.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map Footer Instruction */}
          <div className="relative z-10 pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Tap any pin to view Yelp-style details, live hours & directions.</span>
            <span className="text-purple-300 font-bold">Ventura County Coastal Region</span>
          </div>
        </div>

        {/* Selected Business Preview Card (Yelp-style side inspection drawer) */}
        <div className="lg:col-span-4 flex flex-col">
          {selectedBiz ? (() => {
            const stats = directoryService.getBusinessStats(selectedBiz);
            const openStatus = directoryService.getOpenStatus(selectedBiz);
            const directionsUrl = directoryService.getDirectionsUrl(selectedBiz);
            const isApproved = Boolean(selectedBiz.is_verified || selectedBiz.isVerifiedAffirming || selectedBiz.verified);
            const amenities = directoryService.getAmenities(selectedBiz);

            return (
              <div className="h-full rounded-3xl bg-white border border-purple-200/80 shadow-xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
                <AirDropPulseWaves active={activeHypeId === (selectedBiz.id || selectedBiz.slug)} />

                <div className="space-y-4">
                  {/* Photo Header with Badges */}
                  <div className="h-44 rounded-2xl overflow-hidden bg-slate-100 relative border border-slate-200">
                    <img
                      src={selectedBiz.image || selectedBiz.cover_url || '/images/community-gathering.jpg'}
                      alt={selectedBiz.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/community-gathering.jpg'; }}
                    />
                    <div className="absolute top-2.5 left-2.5 z-10">
                      {isApproved && <DcvcApprovedBadge />}
                    </div>
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/95 text-slate-800 shadow-xs border border-slate-200">
                        {stats.price}
                      </span>
                    </div>
                  </div>

                  {/* Header Title & Ratings */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                      <span className="text-[#5A1E65] font-extrabold uppercase tracking-wider text-[10px]">
                        {selectedBiz.category}
                      </span>
                      <span>{selectedBiz.city}, CA</span>
                    </div>

                    <h3 className="font-display text-xl font-black text-slate-950 leading-tight">
                      {selectedBiz.name}
                    </h3>

                    {/* Yelp-style Stars & Review Metrics */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{stats.rating}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        ({stats.ratingCount} community ratings)
                      </span>
                      <span className="text-slate-300">·</span>
                      {/* Live Hypes */}
                      <div className="flex items-center gap-1 text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                        <Flame className="w-3 h-3 text-orange-500 fill-orange-400" />
                        <span>{stats.hypes} Hypes</span>
                      </div>
                    </div>

                    {/* Live Open / Closed Status Pill */}
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold ${
                        openStatus.isOpen 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span>{openStatus.statusText}</span>
                      </span>
                      <span className="text-slate-500 text-[11px] font-medium">
                        {openStatus.detailText}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {selectedBiz.description}
                  </p>

                  {/* Amenities Highlights */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {amenities.slice(0, 3).map((amenity, i) => (
                      <span key={i} className="text-[10px] font-medium bg-slate-50 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-800 hover:text-[#5A1E65] text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#5A1E65]" />
                    <span>Get Directions</span>
                  </a>

                  <Link
                    to={`/directory/${selectedBiz.slug || selectedBiz.id}`}
                    className="flex-1 py-2 px-3 rounded-xl btn-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })() : (
            <div className="h-full rounded-3xl bg-white border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400">
              <MapPin className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold">Select a map pin to view business profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
