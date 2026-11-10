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
  Users
} from 'lucide-react';
import { cmsStore } from '../services/cmsStore';
import CardSpotlight from '../components/CardSpotlight';
import { usePageMeta } from '../utils/seo';

const AGE_GROUP_ORDER = {
  'little-unicorns': 1,         // Kids & Pre-Teens (Ages 9–13)
  'rainbow-umbrella': 2,        // Youth & Teens (Ages 13–23)
  'trans-affinity': 3,          // Teens, Young Adults & Adults
  'diversity-shines': 4,        // Adults & Wellness
  'community-resource-center': 5 // Multigenerational / All Ages Sanctuary
};

const AGE_FILTERS = [
  'All Age Groups',
  'Kids & Pre-Teens (Ages 9–13)',
  'Youth & Teens (Ages 13–23)',
  'Young Adults & Adults',
  'All Ages Sanctuary'
];

export default function Programs() {
  usePageMeta({
    title: 'LGBTQ+ Programs & Sanctuaries Sorted by Age',
    description: 'Explore youth peer circles, children sanctuaries, adult wellness clinics, and community drop-in hours across Ventura County.',
    canonicalPath: '/programs'
  });

  const [programs, setPrograms] = useState(() => cmsStore.getPrograms());
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('All Age Groups');

  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      if (data?.programs) setPrograms(data.programs);
    });
    return unsubscribe;
  }, []);

  // Default Sort by Age Progression: Youngest to Eldest / All Ages
  const sortedAndFilteredPrograms = useMemo(() => {
    const list = [...programs].sort((a, b) => {
      const rankA = a.ageRank || AGE_GROUP_ORDER[a.slug] || 99;
      const rankB = b.ageRank || AGE_GROUP_ORDER[b.slug] || 99;
      return rankA - rankB;
    });

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
      if (selectedAgeFilter === 'All Ages Sanctuary') {
        return slug === 'community-resource-center';
      }
      return true;
    });
  }, [programs, selectedAgeFilter]);

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
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

        {/* Age Group Filter Chips */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-2">
            <Users className="w-3.5 h-3.5 text-[#5A1E65]" />
            <span>Age Progression:</span>
          </span>
          {AGE_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedAgeFilter(filter)}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border ${
                selectedAgeFilter === filter
                  ? 'bg-slate-900 text-white border-purple-500 shadow-sm font-extrabold'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Program Catalog (Ordered by Age: Kids -> Teens -> Adults -> All Ages) */}
      <section className="container-clean py-16">
        <div className="space-y-20">
          {sortedAndFilteredPrograms.map((prog, index) => {
            const isEven = index % 2 === 0;
            return (
              <div 
                key={prog.slug}
                id={prog.slug}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-10 border-t border-slate-100"
              >
                <div className={`lg:col-span-6 ${isEven ? 'order-1' : 'order-1 lg:order-2'} perspective-1000`}>
                  <CardSpotlight
                    className="rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200/90 hover:border-purple-300 relative group interactive-card-3d"
                    tilt={true}
                    maxTilt={7}
                    glare={true}
                  >
                    {(() => {
                      const isContain = prog.imageFit === 'contain' || 
                        prog.heroImage?.includes('crc-building') || 
                        prog.heroImage?.includes('unicorns') || 
                        prog.heroImage?.includes('logo');
                      return (
                        <div className="aspect-[16/11] relative overflow-hidden bg-slate-50 flex items-center justify-center">
                          {isContain && (
                            <img 
                              src={prog.heroImage} 
                              alt="" 
                              aria-hidden="true"
                              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-125 pointer-events-none"
                            />
                          )}
                          <img 
                            src={prog.heroImage} 
                            alt={prog.title}
                            className={`w-full h-full ${isContain ? 'object-contain p-6 relative z-10' : 'object-cover'} group-hover:scale-106 transition-transform duration-700 ease-out`}
                            onError={(e) => {
                              e.target.src = "/images/crc-building.jpg";
                            }}
                          />
                          <div className={`absolute inset-0 ${isContain ? 'bg-gradient-to-t from-slate-950/40 via-transparent to-transparent' : 'bg-gradient-to-t from-slate-950/70 via-transparent to-transparent'} z-10`} />
                          
                          <div 
                            className="absolute top-4 left-4 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase shadow-md border border-slate-200 z-20"
                            style={{ color: prog.accent || '#5A1E65' }}
                          >
                            PROGRAM {prog.chapter || `0${index + 1}`}
                          </div>

                          <div className="absolute bottom-4 left-4 right-4 text-white text-xs flex items-center justify-between translate-z-10 z-20">
                            <span className="font-bold drop-shadow-md">{prog.audience}</span>
                            <span className="bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold border border-white/20">100% Free Care</span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardSpotlight>
                </div>

                <div className={`lg:col-span-6 space-y-5 ${isEven ? 'order-2' : 'order-2 lg:order-1'}`}>
                  <div>
                    <span className="text-xs font-black tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 uppercase inline-block mb-2">
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
                    <p className="font-serif italic text-lg text-[#5A1E65] mt-1.5 font-medium">
                      "{prog.tagline}"
                    </p>
                  </div>

                  <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
                    {prog.description}
                  </p>

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

                  <div className="pt-2 flex flex-wrap items-center gap-4">
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
            );
          })}
        </div>
      </section>

    </div>
  );
}
