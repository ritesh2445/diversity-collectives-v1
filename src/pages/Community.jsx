import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  Mail, 
  ArrowUpRight, 
  ArrowRight, 
  Users, 
  Sparkles,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { communityGroups, orgInfo } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';

export default function Community() {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const categories = [
    'All', 
    'Youth Peer Support', 
    'Adult Peer Support', 
    'Trans & Non-Binary Support', 
    'Seniors / 55+', 
    'Professional & Personal Growth', 
    'Family & Ally Support', 
    'Recovery & Wellness'
  ];

  const filteredGroups = selectedFilter === 'All' 
    ? communityGroups 
    : communityGroups.filter(g => g.category === selectedFilter);

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
            AFFIRMING PEER CIRCLES & GATHERINGS
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Find Your Community & <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Authentic Belonging.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            "We believe in the freedom to be your authentic self, both at home & in the community." Connect with peer support groups meeting regularly at our Community Resource Center.
          </p>
        </div>

        {/* Filter Pills with 3D Interaction */}
        <div className="flex flex-wrap items-center gap-2.5 pt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border-2 interactive-card-3d ${
                selectedFilter === cat
                  ? 'bg-slate-950 text-white border-purple-500 shadow-lg glow-amethyst'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Community Groups Grid in 3D Cards */}
      <section className="container-clean py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 perspective-1000">
          {filteredGroups.map((group) => (
            <CardSpotlight
              key={group.name}
              className="glass-card p-8 rounded-3xl border-2 border-slate-200/90 hover:border-[#5A1E65]/80 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between interactive-card-3d glow-amethyst"
              tilt={true}
              maxTilt={5}
              glare={true}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 border border-purple-200/80 px-3 py-1 rounded-full shadow-xs">
                    {group.category}
                  </span>
                  <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {group.ages}
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {group.name}
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {group.description}
                </p>

                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                    <span className="font-bold text-slate-900">Meets:</span>
                    <span className="text-slate-600 font-medium">{group.frequency}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                    <span className="font-bold text-slate-900">Location:</span>
                    <span className="text-slate-600 font-medium">{group.location}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: 100% Active & Clear */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                {group.externalLink ? (
                  <a
                    href={group.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Official Registration / Intake</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    to="/events"
                    className="btn-secondary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-1.5 bg-white"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>View Meeting Calendar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                <a
                  href={`mailto:${group.contact}?subject=Inquiry%20Regarding%20${encodeURIComponent(group.name)}`}
                  className="text-xs font-bold text-[#5A1E65] hover:underline flex items-center gap-1.5 bg-purple-50/80 px-3 py-1.5 rounded-full border border-purple-200"
                  title="Direct contact with facilitators"
                >
                  <Mail className="w-3.5 h-3.5 text-[#5A1E65]" />
                  <span>Email Facilitators</span>
                </a>
              </div>
            </CardSpotlight>
          ))}
        </div>
      </section>

      {/* Want to Start a Group Section */}
      <section className="container-clean pt-6">
        <div className="p-8 md:p-12 aurora-bg text-white rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-2.5 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>COMMUNITY SANCTUARY SPACES</span>
            </span>
            <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-white">
              Interested in hosting an LGBTQ+ meeting or workshop?
            </h3>
            <p className="text-xs md:text-sm text-purple-100 max-w-xl leading-relaxed">
              Diversity Collective’s Community Resource Center in Portola Road offers free & low-barrier meeting rooms for affirming community groups and organizing committees.
            </p>
          </div>
          <Link
            to="/contact"
            className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-sm shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5)] hover:scale-103 transition-all flex-shrink-0 cursor-pointer flex items-center gap-2 relative z-10"
          >
            <span>Inquire About Space</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
