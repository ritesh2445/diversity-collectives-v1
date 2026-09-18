import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Clock, 
  MapPin, 
  Mail, 
  ShieldCheck, 
  Heart,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { programsList } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';

export default function Programs() {
  return (
    <div className="pt-8 md:pt-14 pb-20 bg-white text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        {/* Specular Ambient Glow */}
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            COMMUNITY CARE & CLINICAL SERVICES
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Our Programs & <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Affirming Sanctuaries.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Every program at Diversity Collective is created with a trauma-informed, culturally affirming approach to empower LGBTQ+ individuals from youth to elderhood.
          </p>
        </div>
      </section>

      {/* Program Catalog */}
      <section className="container-clean py-16">
        <div className="space-y-20">
          {programsList.map((prog, index) => {
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
                    <div className="aspect-[16/11] relative overflow-hidden">
                      <img 
                        src={prog.heroImage} 
                        alt={prog.title}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          e.target.src = "/images/crc-building.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                      
                      <div 
                        className="absolute top-4 left-4 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase shadow-md border border-slate-200"
                        style={{ color: prog.accent || '#5A1E65' }}
                      >
                        PROGRAM {prog.chapter}
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white text-xs flex items-center justify-between translate-z-10">
                        <span className="font-bold drop-shadow-md">{prog.audience}</span>
                        <span className="bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold border border-white/20">100% Free Care</span>
                      </div>
                    </div>
                  </CardSpotlight>
                </div>

                <div className={`lg:col-span-6 space-y-5 ${isEven ? 'order-2' : 'order-2 lg:order-1'}`}>
                  <div>
                    <span className="text-xs font-black tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 uppercase inline-block mb-2">
                      {prog.audience}
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
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
                      className="btn-primary text-xs py-3 px-6 shadow-md hover:shadow-xl inline-flex items-center gap-2"
                    >
                      <span>Explore Dedicated Page</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href={`mailto:${prog.contactEmail}`}
                      className="text-xs font-bold text-slate-700 hover:text-[#5A1E65] px-3.5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Inquire Directly</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Support CTA Banner in 3D Style */}
      <section className="container-clean pt-10">
        <div className="p-8 md:p-12 aurora-bg text-white rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-3 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>JOIN OUR COMMUNITY NETWORK</span>
            </span>
            <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-white">
              Want to support one of these vital programs?
            </h3>
            <p className="text-xs md:text-sm text-purple-100 max-w-xl leading-relaxed">
              From facilitating youth circles to assisting during free screening nights, our volunteer network powers everything we do.
            </p>
          </div>
          <Link
            to="/get-involved"
            className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-sm shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4)] hover:scale-103 transition-all flex-shrink-0 cursor-pointer flex items-center gap-2 relative z-10"
          >
            <span>Volunteer With DCVC</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
