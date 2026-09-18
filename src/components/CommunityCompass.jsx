import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  HeartHandshake,
  Heart,
  ShieldCheck,
  Users,
  Star
} from 'lucide-react';
import CardSpotlight from './CardSpotlight';

export default function CommunityCompass() {
  const [activePersona, setActivePersona] = useState('youth');
  const [activeNeed, setActiveNeed] = useState('circles');

  const personas = [
    { 
      id: 'youth', 
      label: 'Youth & Teens (13–23)', 
      badge: 'Ages 13–23',
      icon: Sparkles,
      color: 'from-purple-600 to-indigo-600',
      activeBorder: 'border-purple-500',
      glow: 'glow-amethyst'
    },
    { 
      id: 'family', 
      label: 'Parents & Pre-Teens (9–13)', 
      badge: 'Families & Kids',
      icon: Users,
      color: 'from-amber-500 to-rose-500',
      activeBorder: 'border-amber-500',
      glow: 'glow-amber'
    },
    { 
      id: 'health', 
      label: 'Sexual Health & Wellness', 
      badge: 'Confidential Care',
      icon: ShieldCheck,
      color: 'from-emerald-600 to-teal-600',
      activeBorder: 'border-emerald-500',
      glow: 'glow-emerald'
    },
    { 
      id: 'ally', 
      label: 'Supporters & Volunteers', 
      badge: 'Get Involved',
      icon: HeartHandshake,
      color: 'from-indigo-600 to-purple-700',
      activeBorder: 'border-indigo-500',
      glow: 'glow-indigo'
    }
  ];

  const needsByPersona = {
    youth: [
      { id: 'circles', label: 'Safe peer circles & friendship', program: 'rainbow-umbrella' },
      { id: 'events', label: 'Youth Pride Prom & creative arts', program: 'rainbow-umbrella' },
      { id: 'crisis', label: 'Mental health & crisis navigation', program: 'resources' }
    ],
    family: [
      { id: 'little-u', label: 'Playful socialization for ages 9–13', program: 'little-unicorns' },
      { id: 'parents', label: 'Affirming parenting guidance', program: 'community-resource-center' }
    ],
    health: [
      { id: 'testing', label: 'Free rapid HIV & STI testing', program: 'diversity-shines' },
      { id: 'prep', label: 'PrEP & PEP linkage navigation', program: 'diversity-shines' },
      { id: 'supplies', label: 'Safer sex supplies & harm reduction', program: 'diversity-shines' }
    ],
    ally: [
      { id: 'volunteer', label: 'Volunteer at our Drop-in Center', program: 'get-involved' },
      { id: 'library', label: 'Donate books to LGBTQ+ library', program: 'community-resource-center' },
      { id: 'events-team', label: 'Join Diversity Gala / Pride committee', program: 'get-involved' }
    ]
  };

  const results = {
    'youth-circles': {
      title: 'Rainbow Umbrella Weekly Gathering',
      programSlug: 'rainbow-umbrella',
      tagline: 'Safe, affirming community space for LGBTQ+ youth & allies.',
      schedule: 'Every Friday, 5:30 PM – 7:30 PM',
      location: 'Diversity Collective CRC, 2471 Portola Rd, Suite 100, Ventura',
      badge: 'Youth Program · 100% Free',
      ctaText: 'Explore Rainbow Umbrella'
    },
    'youth-events': {
      title: 'Youth Pride Prom & Cultural Fellowship',
      programSlug: 'rainbow-umbrella',
      tagline: 'Annual affirming formal dance and seasonal youth leadership summits.',
      schedule: 'Seasonal & Annual Events',
      location: 'Ventura County Event Sanctuaries',
      badge: 'Special Youth Gatherings',
      ctaText: 'View Youth Event Calendar'
    },
    'youth-crisis': {
      title: 'Confidential Youth Support & Crisis Resources',
      programSlug: 'resources',
      tagline: 'Immediate, affirming peer support, Trevor Project linkage, and intake.',
      schedule: 'Drop-ins Mon–Fri 1–5 PM · 24/7 Lifelines available',
      location: 'DCVC Center or Confidential Phone',
      badge: 'Immediate Sanctuary',
      ctaText: 'Access Crisis Resources'
    },
    'family-little-u': {
      title: 'Little Unicorns Peer Group',
      programSlug: 'little-unicorns',
      tagline: 'Gentle, playful connection for young LGBTQ+ and ally youth ages 9–13.',
      schedule: 'Last Saturday of the month, 1:00 PM – 3:00 PM',
      location: 'Diversity Collective Community Resource Center',
      badge: 'Pre-Teens (9–13) & Families',
      ctaText: 'Discover Little Unicorns'
    },
    'family-parents': {
      title: 'Family & Parent Affirmation Sanctuary',
      programSlug: 'community-resource-center',
      tagline: 'Supportive resources, book loans, and peer conversations for caregivers.',
      schedule: 'Monday – Friday, 1:00 PM – 5:00 PM',
      location: '2471 Portola Road, Suite 100, Ventura',
      badge: 'Family Support',
      ctaText: 'Visit Community Resource Center'
    },
    'health-testing': {
      title: 'Diversity SHINES: Rapid HIV/STI Screenings',
      programSlug: 'diversity-shines',
      tagline: 'Free, confidential 15-minute rapid testing with non-judgmental providers.',
      schedule: '1st Monday of every month, 3:00 PM – 7:00 PM (or by appointment)',
      location: 'Clinical Suite at DCVC Center',
      badge: 'No Insurance Needed · 100% Free',
      ctaText: 'Schedule or Walk-in for Testing'
    },
    'health-prep': {
      title: 'PrEP & PEP Navigation & Linkage',
      programSlug: 'diversity-shines',
      tagline: 'Personalized assistance navigating biomedical prevention and coverage.',
      schedule: 'By Appointment & Center Hours',
      location: 'Diversity Collective CRC',
      badge: 'Healthcare Navigation',
      ctaText: 'Connect with a Health Navigator'
    },
    'health-supplies': {
      title: 'Free Safer-Sex & Harm Reduction Station',
      programSlug: 'diversity-shines',
      tagline: 'Grab-and-go safer sex supplies, barrier methods, and wellness packs.',
      schedule: 'Monday – Friday, 1:00 PM – 5:00 PM',
      location: 'Front Desk Sanctuary, 2471 Portola Road',
      badge: 'Walk-in Anytime',
      ctaText: 'Learn About Harm Reduction'
    },
    'ally-volunteer': {
      title: 'Community Resource Center Volunteer Network',
      programSlug: 'get-involved',
      tagline: 'Help staff our lending library, assist front desk check-ins, and support events.',
      schedule: 'Flexible weekday afternoon and weekend shifts',
      location: 'Ventura Center & Community Outreach Sites',
      badge: 'Volunteer Pathways',
      ctaText: 'Start Volunteer Application'
    },
    'ally-library': {
      title: 'LGBTQ+ Lending Library Book Contributions',
      programSlug: 'community-resource-center',
      tagline: 'Donate queer literature, memoirs, youth fiction, and reference materials.',
      schedule: 'Drop-off Mon–Fri 1:00 PM – 5:00 PM',
      location: '2471 Portola Road, Suite 100, Ventura',
      badge: 'Library Program',
      ctaText: 'See Library Wishlist'
    },
    'ally-events-team': {
      title: 'Diversity Gala & Pride Festival Committees',
      programSlug: 'get-involved',
      tagline: 'Plan and execute Ventura County’s premier LGBTQ+ visibility events.',
      schedule: 'Monthly Committee Meetings',
      location: 'Hybrid (In-person & Zoom)',
      badge: 'Cultural Leadership',
      ctaText: 'Join an Event Committee'
    }
  };

  const currentNeeds = needsByPersona[activePersona] || [];
  const activeKey = `${activePersona}-${activeNeed}`;
  const matchResult = results[activeKey] || results['youth-circles'];

  const handlePersonaChange = (id) => {
    setActivePersona(id);
    const firstNeed = needsByPersona[id]?.[0]?.id || 'circles';
    setActiveNeed(firstNeed);
  };

  return (
    <div className="glass-card rounded-3xl p-6 md:p-10 shadow-xl border-2 border-purple-200/70 relative overflow-hidden preserve-3d">
      
      {/* Ambient Specular Gradient Orbs */}
      <div 
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-400/15 blur-3xl pointer-events-none animate-pulse duration-1000"
        aria-hidden="true" 
      />
      <div 
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-300/15 blur-3xl pointer-events-none"
        aria-hidden="true" 
      />

      <div className="relative z-10 flex flex-col gap-8">
        
        {/* Step 1 Header */}
        <div className="flex flex-col gap-3 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5A1E65] mx-auto px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 shadow-xs">
            <Compass className="w-4 h-4 text-[#5A1E65] animate-spin duration-3000" />
            <span>Interactive Care & Community Compass</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
            Find your exact sanctuary in <span className="gradient-text-amethyst">two clicks</span>.
          </h3>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Select who you are and what you need — our navigator immediately connects you to the exact room, schedule, and affirming team member.
          </p>
        </div>

        {/* Step 1: Who You Are Tabs */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#5A1E65] text-white flex items-center justify-center text-[10px] font-black">1</span>
            <span>I am looking on behalf of...</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {personas.map((p) => {
              const isSelected = activePersona === p.id;
              const IconComponent = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePersonaChange(p.id)}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 interactive-card-3d relative overflow-hidden group ${
                    isSelected
                      ? `bg-slate-950 text-white ${p.activeBorder} ${p.glow} shadow-xl scale-[1.02]`
                      : 'bg-white text-slate-800 border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isSelected 
                        ? 'bg-white/20 text-purple-200' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-700'
                    }`}>
                      {p.badge}
                    </span>
                    <IconComponent className={`w-4 h-4 ${
                      isSelected ? 'text-amber-300' : 'text-slate-400 group-hover:text-[#5A1E65]'
                    }`} />
                  </div>
                  <span className="text-sm font-bold block leading-snug">
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: What You Need Chips */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#5A1E65] text-white flex items-center justify-center text-[10px] font-black">2</span>
            <span>What I need most is...</span>
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {currentNeeds.map((need) => {
              const isSelected = activeNeed === need.id;
              return (
                <button
                  key={need.id}
                  onClick={() => setActiveNeed(need.id)}
                  className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer border-2 interactive-card-3d ${
                    isSelected
                      ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-lg shadow-purple-900/20 scale-[1.03]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                >
                  {need.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result Match Box with 3D Tilt & Specular Light */}
        <CardSpotlight
          className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950 text-white p-6 sm:p-8 md:p-10 shadow-2xl border-2 border-purple-500/40 transition-all duration-300 relative overflow-hidden"
          contentClassName="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          tilt={true}
          maxTilt={5}
          glare={true}
        >
          {/* Ambient Sheen */}
          <div 
            className="absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />

          {/* Left Column: Full Match Details */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 relative z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs">
                {matchResult.badge}
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Verified Match</span>
              </span>
            </div>

            <h4 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.1]">
              {matchResult.title}
            </h4>

            <p className="text-sm sm:text-base text-purple-200 italic font-serif leading-relaxed">
              "{matchResult.tagline}"
            </p>

            {/* Schedule & Location Glass Strip */}
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-200">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Schedule / Hours:</span>
                  <span className="text-slate-300 font-medium">{matchResult.schedule}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Sanctuary Room:</span>
                  <span className="text-slate-300 font-medium">{matchResult.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dedicated Elevated Action Panel */}
          <div className="lg:col-span-5 xl:col-span-4 relative z-10">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 shadow-xl flex flex-col gap-4 text-center justify-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 py-1.5 px-3 rounded-full border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Drop-In Welcome · No Paperwork</span>
              </div>

              <Link
                to={matchResult.programSlug.startsWith('/') ? matchResult.programSlug : `/programs/${matchResult.programSlug}`}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_15px_35px_-5px_rgba(245,158,11,0.65)] hover:scale-102 transition-all cursor-pointer"
              >
                <span>{matchResult.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent('2471 Portola Road, Suite 100, Ventura, CA 93003')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-200 hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>Get Directions to CRC Sanctuary</span>
              </a>

              <p className="text-[11px] text-slate-300/90 border-t border-white/10 pt-2 font-medium">
                100% Free & Confidential Care
              </p>
            </div>
          </div>

        </CardSpotlight>

      </div>

    </div>
  );
}
