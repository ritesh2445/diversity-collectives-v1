import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Home, 
  Sparkles, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  LifeBuoy,
  Phone
} from 'lucide-react';
import { orgInfo } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';

export default function NotFound() {
  usePageMeta({
    title: 'Page Not Found (404)',
    description: 'The requested page could not be found. Find your way back to Diversity Collective Ventura County programs and resources.',
    canonicalPath: '/404'
  });

  return (
    <div className="pt-16 md:pt-24 pb-28 bg-transparent text-slate-800">
      <div className="container-clean max-w-3xl text-center space-y-8">
        
        {/* Visual Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#5A1E65] text-xs font-black tracking-widest uppercase">
          <Compass className="w-4 h-4 text-[#5A1E65]" />
          <span>ERROR 404 · LET'S FIND YOUR WAY HOME</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-slate-950 tracking-tight leading-tight">
          You Are Still <br />
          <span className="font-serif italic font-normal text-[#5A1E65]">Welcome Here.</span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
          The link you followed may have moved or no longer exists. Let's get you back to the programs, events, and community resources you are seeking.
        </p>

        {/* Helpful Pathway Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
          <Link
            to="/programs"
            className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all group block space-y-1.5"
          >
            <Sparkles className="w-5 h-5 text-[#5A1E65]" />
            <span className="font-bold text-slate-900 text-sm block group-hover:text-[#5A1E65] transition-colors">
              Programs & Health
            </span>
            <span className="text-xs text-slate-500">Free screenings, youth circles, drop-in center.</span>
          </Link>

          <Link
            to="/events"
            className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all group block space-y-1.5"
          >
            <Calendar className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-slate-900 text-sm block group-hover:text-[#5A1E65] transition-colors">
              Cultural Calendar
            </span>
            <span className="text-xs text-slate-500">Upcoming gatherings, circles, and festivals.</span>
          </Link>

          <Link
            to="/directory"
            className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all group block space-y-1.5"
          >
            <Compass className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900 text-sm block group-hover:text-[#5A1E65] transition-colors">
              Business Directory
            </span>
            <span className="text-xs text-slate-500">Verified LGBTQ+ affirming local spaces.</span>
          </Link>
        </div>

        {/* Home & Directions Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="btn-primary py-3.5 px-8 text-xs font-bold inline-flex items-center gap-2 shadow-lg"
          >
            <Home className="w-4 h-4" />
            <span>Return to Sanctuary Homepage</span>
          </Link>
          <Link
            to="/contact"
            className="btn-secondary py-3.5 px-6 text-xs font-bold inline-flex items-center gap-2 bg-white"
          >
            <MapPin className="w-4 h-4 text-purple-600" />
            <span>Visit Sanctuary (2471 Portola Rd)</span>
          </Link>
        </div>

        {/* Crisis Support Footnote */}
        <div className="pt-8 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-center gap-2">
          <LifeBuoy className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>Need immediate help? Call <strong className="text-slate-900">{orgInfo.phone}</strong> or dial <a href="tel:988" className="font-bold text-rose-600 underline">988</a> for 24/7 crisis support.</span>
        </div>

      </div>
    </div>
  );
}

