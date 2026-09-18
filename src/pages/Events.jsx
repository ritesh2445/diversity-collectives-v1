import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ArrowUpRight, 
  Filter, 
  Sparkles,
  Ticket
} from 'lucide-react';
import { liveEvents, annualSignatureEvents, orgInfo } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';

export default function Events() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Health & Wellness', 'Youth', 'Adult Support', 'Seniors', 'Professional Growth', 'Signature Event'];

  const filteredEvents = liveEvents.filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || evt.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

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
            OFFICIAL CALENDAR & CULTURAL LIFE
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Cultural Calendar & <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Upcoming Gatherings.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            From our weekly youth circles and free testing clinics to seaside Pride and annual galas, explore upcoming events across Ventura County.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search gatherings, screenings, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white focus:ring-2 focus:ring-purple-100 rounded-2xl outline-none transition-all font-medium"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex-shrink-0 cursor-pointer border-2 interactive-card-3d ${
                  selectedCategory === cat
                    ? 'bg-slate-950 text-white border-purple-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Main Calendar List in 3D Cards */}
      <section className="container-clean py-16">
        
        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
            <p className="font-display text-xl font-bold text-slate-900">No upcoming gatherings match your search.</p>
            <p className="text-xs text-slate-500">Try clearing your filters or search keywords.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="btn-primary py-2 px-5 text-xs font-bold mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6 perspective-1000">
            {filteredEvents.map((evt, idx) => {
              const dateGradients = [
                'from-purple-950 via-purple-900 to-indigo-950 text-white',
                'from-amber-600 via-amber-500 to-amber-700 text-white',
                'from-emerald-700 via-teal-700 to-emerald-800 text-white',
                'from-slate-900 via-slate-800 to-purple-950 text-white'
              ];

              return (
                <CardSpotlight 
                  key={evt.id}
                  className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-slate-200/90 hover:border-[#5A1E65]/80 transition-all duration-300 shadow-sm hover:shadow-2xl interactive-card-3d"
                  tilt={true}
                  maxTilt={5}
                  glare={true}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Large Typographic Date Badge */}
                    <div className="md:col-span-2 flex md:justify-center">
                      <div className={`flex flex-col items-center justify-center min-w-[80px] p-4 rounded-2xl bg-gradient-to-b ${dateGradients[idx % dateGradients.length]} shadow-md`}>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">{evt.month}</span>
                        <span className="font-display text-2xl sm:text-3xl font-black">{evt.day}</span>
                        <span className="text-[10px] font-mono text-white/70 mt-0.5">{evt.year}</span>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="md:col-span-7 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200">
                          {evt.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#5A1E65]" /> {evt.time}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                        <Link to={`/events/${evt.slug}`} className="hover:text-[#5A1E65] transition-colors">
                          {evt.title}
                        </Link>
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {evt.description}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{evt.location} · {evt.address}</span>
                      </div>
                    </div>

                    {/* Actions: 100% Active */}
                    <div className="md:col-span-3 flex flex-col md:items-end gap-2.5">
                      <Link
                        to={`/events/${evt.slug}`}
                        className="btn-primary py-3 px-6 text-xs font-bold w-full md:w-auto text-center shadow-md hover:shadow-xl inline-flex items-center justify-center gap-1.5"
                      >
                        <span>Details & RSVP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {evt.registrationUrl ? (
                        <a
                          href={evt.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#5A1E65] hover:underline flex items-center gap-1 py-1"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Direct Registration</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Free Drop-In · No Ticket Needed</span>
                      )}
                    </div>

                  </div>
                </CardSpotlight>
              );
            })}
          </div>
        )}

      </section>

      {/* Annual Signature Events Spotlight */}
      <section className="container-clean pt-6">
        <div className="p-8 md:p-12 aurora-bg text-white rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ANNUAL FLAGSHIPS</span>
            </span>
            <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-white">
              Signature Gatherings of Ventura County
            </h3>
            <p className="text-sm md:text-base text-purple-100 max-w-2xl leading-relaxed">
              Throughout the year, DCVC convenes our county for premier celebratory milestones — including Ventura County Pride, the Diversity Gala, and the AIDS Walk.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              {annualSignatureEvents.map((sig) => (
                <a
                  key={sig.title}
                  href={sig.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-amber-300 transition-all hover:scale-102 flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">{sig.season}</span>
                    <h4 className="font-display text-xl font-bold text-white group-hover:text-amber-200 transition-colors flex items-center justify-between">
                      <span>{sig.title}</span>
                      <ArrowUpRight className="w-4 h-4 text-amber-300" />
                    </h4>
                    <p className="text-xs text-purple-100 leading-relaxed">{sig.summary}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
