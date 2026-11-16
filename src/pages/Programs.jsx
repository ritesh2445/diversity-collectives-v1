import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  MapPin,
  Mail,
  ShieldCheck,
  Heart,
  Sparkles,
  ArrowUpRight,
  Filter,
  Users,
  LayoutGrid,
  List
} from 'lucide-react';
import { cmsStore } from '../services/cmsStore';
import CardSpotlight from '../components/CardSpotlight';
import MobileCarousel from '../components/MobileCarousel';
import { usePageMeta } from '../utils/seo';

const AGE_GROUP_ORDER = {
  'little-unicorns': 1,         // Kids & Pre-Teens (Ages 9–13)
  'rainbow-umbrella': 2,        // Youth & Teens (Ages 13–23)
  'trans-affinity': 3,          // Teens, Young Adults & Adults
  'diversity-shines': 4,        // Adults & Wellness
  'community-resource-center': 5 // Multigenerational / All Ages Center
};

const AGE_FILTERS = [
  'All Age Groups',
  'Kids & Pre-Teens (Ages 9–13)',
  'Youth & Teens (Ages 13–23)',
  'Young Adults & Adults',
  'All Ages Center'
];

export default function Programs() {
  usePageMeta({
    title: 'LGBTQ+ Programs & Sanctuaries Sorted by Age',
    description: 'Explore youth peer circles, children sanctuaries, adult wellness clinics, and community drop-in hours across Ventura County.',
    canonicalPath: '/programs'
  });

  const [programs, setPrograms] = useState(() => cmsStore.getPrograms());
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('All Age Groups');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'detailed'

  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      if (data?.programs) setPrograms(data.programs);
    });
    return unsubscribe;
  }, []);

  // Preserve custom CardOrderManager arrangement / CMS store order
  const sortedAndFilteredPrograms = useMemo(() => {
    const list = [...programs];

    if (selectedAgeFilter === 'All Age Groups') return list;

    return list.filter(prog => {
      const slug = prog.slug;
      if (selectedAgeFilter === 'Kids & Pre-Teens (Ages 9–13)') {
        return slug === 'little-unicorns';
      }
      if (selectedAgeFilter === 'Youth & Teens (Ages 13–23)') {
        return slug === 'rainbow-umbrella' || slug === 'trans-affinity';
      }
      if (selectedAgeFilter === 'Young Adults & Adults') {
        return slug === 'diversity-shines' || slug === 'trans-affinity';
      }
      if (selectedAgeFilter === 'All Ages Center') {
        return slug === 'community-resource-center';
      }
      return true;
    });
  }, [programs, selectedAgeFilter]);

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">

      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        {/* Specular Ambient Glow */}
        <div
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
              COMMUNITY CARE & CLINICAL SERVICES
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Sorted by Age Groups
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Our Programs & <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Affirming Sanctuaries.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Every program at Diversity Collective is created with a trauma-informed, culturally affirming approach to empower LGBTQ+ individuals from youth to elderhood.
          </p>
        </div>

        {/* Controls Toolbar: Age Group Filters & View Mode */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-2">
              <Users className="w-3.5 h-3.5 text-[#5A1E65]" />
              <span>Age Groups:</span>
            </span>
            {AGE_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedAgeFilter(filter)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border ${selectedAgeFilter === filter
                  ? 'bg-slate-900 text-white border-purple-500 shadow-sm font-extrabold'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-white text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Showcase Rows</span>
            </button>
          </div>
        </div>
      </section>

      {/* Program Catalog */}
      <section className="container-clean py-14">
        {viewMode === 'grid' ? (
          /* ================================================================
             1. UNIFIED CARD GRID (Exact Same Height & Width on All Cards)
             ================================================================ */
          <MobileCarousel cols={3} autoScrollMs={0} className="items-stretch gap-6 lg:gap-8" cardClassName="h-full flex flex-col">
            {sortedAndFilteredPrograms.map((prog, index) => {
              const isContain = prog.imageFit === 'contain' ||
                prog.heroImage?.includes('crc-building') ||
                prog.heroImage?.includes('unicorns') ||
                prog.heroImage?.includes('logo');

              return (
                <CardSpotlight
                  key={prog.slug}
                  className="h-full w-full rounded-3xl bg-white shadow-xl hover:shadow-2xl border-2 border-slate-200/90 hover:border-purple-300 transition-all flex flex-col justify-between overflow-hidden interactive-card-3d group"
                  contentClassName="h-full w-full flex flex-col justify-between"
                  tilt={true}
                  maxTilt={4}
                  scale={1.01}
                  glare={true}
                >
                  <div className="flex flex-col flex-1">
                    {/* Uniform 16:10 Aspect Ratio Image Header */}
                    <div className="w-full aspect-[16/10] bg-slate-100 relative overflow-hidden flex items-center justify-center shrink-0">
                      {isContain && (
                        <>
                          <img
                            src={prog.heroImage}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/70 via-white/80 to-amber-50/70 backdrop-blur-xs" />
                        </>
                      )}
                      <img
                        src={prog.heroImage}
                        alt={prog.title}
                        className={`w-full h-full ${isContain ? 'object-contain max-h-[82%] max-w-[82%] relative z-10 p-3' : 'object-cover'} group-hover:scale-105 transition-transform duration-500 ease-out`}
                        onError={(e) => {
                          e.target.src = "/images/crc-building.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

                      {/* Header Badges */}
                      <div
                        className="absolute top-3.5 left-3.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[11px] font-black tracking-wider uppercase shadow-md border border-slate-200 z-20"
                        style={{ color: prog.accent || '#5A1E65' }}
                      >
                        PROGRAM {prog.chapter || `0${index + 1}`}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex flex-col gap-2.5 flex-1">
                      <span 
                        className="text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-full border uppercase w-fit transition-colors"
                        style={{
                          color: prog.audienceColor || '#7E22CE',
                          backgroundColor: prog.audienceColor ? `${prog.audienceColor}14` : 'rgb(250 245 255)',
                          borderColor: prog.audienceColor ? `${prog.audienceColor}33` : 'rgb(233 213 255)'
                        }}
                      >
                        {prog.audience}
                      </span>
                      <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug line-clamp-1 min-h-[1.75rem]">
                        {prog.title}
                      </h2>
                      <p className="font-serif italic text-xs sm:text-sm text-[#5A1E65] font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">
                        "{prog.tagline}"
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed line-clamp-3 min-h-[3.75rem] pt-1">
                        {prog.description}
                      </p>

                      {/* Compact Logistics Card */}
                      <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-1.5 text-xs mt-2 min-h-[5.25rem]">
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#5A1E65] shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900">Schedule: </span>
                            <span className="text-slate-600 line-clamp-1">{prog.schedule}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#5A1E65] shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900">Location: </span>
                            <span className="text-slate-600 line-clamp-1">{prog.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions (Always Pinned at Bottom) */}
                  <div className="p-6 pt-0 flex flex-wrap items-center gap-2.5 mt-auto">
                    <Link
                      to={`/programs/${prog.slug}`}
                      className="btn-primary py-2.5 px-4 text-xs font-bold shadow-md hover:shadow-lg flex-1 inline-flex items-center justify-center gap-1.5 text-center"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {prog.slug === 'diversity-shines' ? (
                      <Link
                        to="/appointments"
                        className="btn-secondary py-2.5 px-3.5 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Screening</span>
                      </Link>
                    ) : (
                      <Link
                        to="/contact"
                        className="btn-secondary py-2.5 px-3.5 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Connect</span>
                      </Link>
                    )}
                  </div>
                </CardSpotlight>
              );
            })}
          </MobileCarousel>
        ) : (
          /* ================================================================
             2. EDITORIAL ROWS (Equal-Height Balanced Layout)
             ================================================================ */
          <div className="space-y-16">
            {sortedAndFilteredPrograms.map((prog, index) => {
              const isEven = index % 2 === 0;
              const isContain = prog.imageFit === 'contain' ||
                prog.heroImage?.includes('crc-building') ||
                prog.heroImage?.includes('unicorns') ||
                prog.heroImage?.includes('logo');

              return (
                <div
                  key={prog.slug}
                  id={prog.slug}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch pt-10 border-t border-slate-100"
                >
                  <div className={`lg:col-span-6 ${isEven ? 'order-1' : 'order-1 lg:order-2'} flex flex-col`}>
                    <CardSpotlight
                      className="rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200/90 hover:border-purple-300 relative group interactive-card-3d w-full h-full min-h-[340px] flex flex-col justify-center"
                      contentClassName="w-full h-full flex flex-col justify-center"
                      tilt={true}
                      maxTilt={7}
                      glare={true}
                    >
                      <div className="w-full h-full min-h-[340px] aspect-[16/10] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        {isContain && (
                          <>
                            <img
                              src={prog.heroImage}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/70 via-white/80 to-amber-50/70 backdrop-blur-xs" />
                          </>
                        )}
                        <img
                          src={prog.heroImage}
                          alt={prog.title}
                          className={`w-full h-full ${isContain ? 'object-contain max-h-[82%] max-w-[82%] relative z-10 p-4' : 'object-cover'} group-hover:scale-105 transition-transform duration-500 ease-out`}
                          onError={(e) => {
                            e.target.src = "/images/crc-building.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

                        <div
                          className="absolute top-4 left-4 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase shadow-md border border-slate-200 z-20"
                          style={{ color: prog.accent || '#5A1E65' }}
                        >
                          PROGRAM {prog.chapter || `0${index + 1}`}
                        </div>
                      </div>
                    </CardSpotlight>
                  </div>

                  <div className={`lg:col-span-6 flex flex-col justify-between gap-5 ${isEven ? 'order-2' : 'order-2 lg:order-1'}`}>
                    <div className="space-y-4">
                      <span 
                        className="text-xs font-black tracking-wider px-3 py-1 rounded-full border uppercase inline-block transition-colors"
                        style={{
                          color: prog.audienceColor || '#7E22CE',
                          backgroundColor: prog.audienceColor ? `${prog.audienceColor}14` : 'rgb(250 245 255)',
                          borderColor: prog.audienceColor ? `${prog.audienceColor}33` : 'rgb(233 213 255)'
                        }}
                      >
                        {prog.audience}
                      </span>
                      <h2
                        style={{
                          color: prog.fontColor || undefined,
                          fontSize: prog.fontSize === '2xl' ? '2rem' :
                            prog.fontSize === '3xl' ? '2.5rem' :
                              prog.fontSize === 'xl' ? '1.75rem' :
                                prog.fontSize === 'sm' ? '1.25rem' : undefined
                        }}
                        className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight leading-[1.12]"
                      >
                        {prog.title}
                      </h2>
                      <p className="font-serif italic text-lg text-[#5A1E65] font-medium">
                        "{prog.tagline}"
                      </p>
                      <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
                        {prog.description}
                      </p>
                    </div>

                    <div className="space-y-4 mt-auto">
                      <div className="p-5 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/90 space-y-2.5 text-xs sm:text-sm">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                          <span className="font-bold text-slate-900">Schedule:</span>
                          <span className="text-slate-600">{prog.schedule}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                          <span className="font-bold text-slate-900">Location:</span>
                          <span className="text-slate-600">{prog.location}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <Link
                          to={`/programs/${prog.slug}`}
                          className="btn-primary py-3.5 px-7 text-xs font-bold shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                        >
                          <span>Explore {prog.title}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        {prog.slug === 'diversity-shines' ? (
                          <Link
                            to="/appointments"
                            className="btn-secondary py-3.5 px-6 text-xs font-bold inline-flex items-center gap-2"
                          >
                            <Heart className="w-4 h-4 text-rose-500" />
                            <span>Book Confidential Screening</span>
                          </Link>
                        ) : (
                          <Link
                            to="/contact"
                            className="btn-secondary py-3.5 px-6 text-xs font-bold inline-flex items-center gap-2"
                          >
                            <Heart className="w-4 h-4 text-rose-500" />
                            <span>Get Connected</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
