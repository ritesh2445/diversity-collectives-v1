import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  ArrowRight, 
  ArrowUpRight, 
  MapPin, 
  Clock, 
  Phone, 
  Heart, 
  ShieldCheck, 
  Calendar,
  LifeBuoy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Compass,
  Users,
  Shield,
  Award,
  Check,
  Lock,
  Gift,
  HeartHandshake,
  Star,
  Activity
} from 'lucide-react';
import { 
  orgInfo, 
  programsList, 
  liveEvents,
  sponsorsList 
} from '../data/dcvcData';
import AnimatedCounter from '../components/AnimatedCounter';
import CardSpotlight from '../components/CardSpotlight';
import CommunityCompass from '../components/CommunityCompass';
import RegionalHubExplorer from '../components/RegionalHubExplorer';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDonationTier, setSelectedDonationTier] = useState(50);
  const [donationFreq, setDonationFreq] = useState('once');
  const [customDonation, setCustomDonation] = useState('');
  const [heroService, setHeroService] = useState('testing');
  const [selectedEventCategory, setSelectedEventCategory] = useState('all');
  const [expandedProgram, setExpandedProgram] = useState(null);

  const impactStats = [
    {
      value: "10+",
      label: "Years of Community Service",
      sub: "Defending rights and providing safe harbor in Ventura County since 2014.",
      icon: Award,
      colorClass: "gradient-text-amethyst",
      borderClass: "border-purple-200/90 hover:border-[#5A1E65]",
      glowClass: "glow-amethyst",
      iconBg: "bg-purple-100 text-[#5A1E65]"
    },
    {
      value: "5,000+",
      label: "Health Screenings",
      sub: "Free, confidential HIV/STI testing and care navigation through Diversity SHINES.",
      icon: Activity,
      colorClass: "gradient-text-coastal",
      borderClass: "border-teal-200/90 hover:border-teal-500",
      glowClass: "glow-teal",
      iconBg: "bg-teal-100 text-teal-800"
    },
    {
      value: "1,200+",
      label: "Youth Empowered",
      sub: "Safe peer circles, Pride Prom, and mentorship through Rainbow Umbrella.",
      icon: Users,
      colorClass: "gradient-text-sunset",
      borderClass: "border-amber-200/90 hover:border-amber-500",
      glowClass: "glow-amber",
      iconBg: "bg-amber-100 text-amber-800"
    },
    {
      value: "100%",
      label: "Free & Confidential",
      sub: "No insurance or fees required. Complete privacy and affirming care for all.",
      icon: ShieldCheck,
      colorClass: "gradient-text-indigo",
      borderClass: "border-indigo-200/90 hover:border-indigo-500",
      glowClass: "glow-indigo",
      iconBg: "bg-indigo-100 text-indigo-800"
    }
  ];

  const donationTiers = [
    {
      amount: 25,
      title: "Wellness & Harm Reduction",
      impact: "Provides 5 comprehensive safer-sex and personal wellness packages for local community members."
    },
    {
      amount: 50,
      title: "Confidential Health Screening",
      impact: "Funds 2 free rapid HIV/STI screenings along with personalized health and prevention navigation."
    },
    {
      amount: 100,
      title: "Youth Peer Circle Sponsor",
      impact: "Covers creative workshop supplies and refreshments for a full month of Rainbow Umbrella youth gatherings."
    },
    {
      amount: 250,
      title: "Resource Center Sanctuary",
      impact: "Supports public computer workstations, lending library operations, and free drop-in community hours."
    },
    {
      amount: 500,
      title: "Community Program Champion",
      impact: "Subsidizes attendance for low-income youth at the annual Youth Pride Prom and crisis support initiatives."
    }
  ];

  const programCategories = [
    { id: 'all', label: 'All Programs' },
    { id: 'youth', label: 'Youth & Teens (13–23)' },
    { id: 'kids', label: 'Kids & Families (9–13)' },
    { id: 'health', label: 'Health & Screenings' },
    { id: 'center', label: 'Drop-In Center' }
  ];

  const filteredPrograms = programsList.filter(program => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'youth') return program.slug === 'rainbow-umbrella';
    if (selectedCategory === 'kids') return program.slug === 'little-unicorns';
    if (selectedCategory === 'health') return program.slug === 'diversity-shines';
    if (selectedCategory === 'center') return program.slug === 'community-resource-center';
    return true;
  });

  const eventCategories = [
    { id: 'all', label: 'All Gatherings' },
    { id: 'youth', label: 'Youth Circles' },
    { id: 'health', label: 'Health & Wellness' },
    { id: 'culture', label: 'Social & Cultural' }
  ];

  const filteredEvents = liveEvents.filter(evt => {
    if (selectedEventCategory === 'all') return true;
    if (selectedEventCategory === 'youth') return evt.category.toLowerCase().includes('youth') || evt.category.toLowerCase().includes('umbrella');
    if (selectedEventCategory === 'health') return evt.category.toLowerCase().includes('health') || evt.category.toLowerCase().includes('wellness');
    if (selectedEventCategory === 'culture') return evt.category.toLowerCase().includes('cultural') || evt.category.toLowerCase().includes('social') || evt.category.toLowerCase().includes('pride');
    return true;
  });

  const activeTierObj = donationTiers.find(t => t.amount === selectedDonationTier) || donationTiers[1];

  const triggerMilestoneConfetti = (e) => {
    try {
      const rect = e?.currentTarget?.getBoundingClientRect();
      const originX = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
      const originY = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.7;

      confetti({
        particleCount: 45,
        spread: 70,
        origin: { x: originX, y: originY },
        colors: ['#5A1E65', '#B45309', '#0F172A', '#FAF5FF', '#38BDF8'],
        disableForReducedMotion: true
      });
    } catch (err) {
      // Graceful fallback
    }
  };

  const handleSelectDonationTier = (amount, e) => {
    setSelectedDonationTier(amount);
    triggerMilestoneConfetti(e);
  };

  const toggleProgramPeek = (slug) => {
    setExpandedProgram(prev => prev === slug ? null : slug);
  };

  return (
    <div className="bg-white text-slate-800">

      {/* ====================================================================
          HERO: HIGH-IMPACT EDITORIAL FLAGSHIP WITH INTERACTIVE DISCOVERY & CIVIC LOGOS
          ==================================================================== */}
      <section className="pt-8 md:pt-12 pb-14 md:pb-18 border-b border-slate-100 bg-gradient-to-b from-purple-50/40 via-slate-50/30 to-white relative overflow-hidden">
        
        {/* Ambient Specular Gradient Orbs */}
        <div 
          className="absolute -top-32 right-10 w-[32rem] h-[32rem] rounded-full bg-purple-200/25 blur-3xl pointer-events-none animate-pulse duration-1000" 
          aria-hidden="true" 
        />
        <div 
          className="absolute top-1/2 -left-32 w-[28rem] h-[28rem] rounded-full bg-amber-100/30 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-emerald-100/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="container-clean relative z-10 flex flex-col gap-10">
          
          {/* Top Live Sanctuary & Crisis Alert Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 border border-purple-200/80 backdrop-blur-md font-semibold text-[#5A1E65] shadow-xs">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Sanctuary Open Today · Mon–Fri 1:00 PM – 5:00 PM · Free HIV/STI Screenings</span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-2 text-slate-500 bg-slate-50/80 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-medium">
              <Phone className="w-3.5 h-3.5 text-purple-700" />
              <span>Helpline: <strong>(805) 644-5428</strong> · 24/7 Crisis: <strong>Dial 988</strong></span>
            </div>
          </div>

          {/* Main Hero Split: Editorial Headline + Multi-Layer Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Bold Headline & Interactive Portals */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="flex flex-col gap-3.5">
                <span className="glass-pill text-xs font-bold text-[#5A1E65] py-1 px-3.5 bg-purple-50/90 border-purple-200/80">
                  ESTABLISHED 2014 · VENTURA COUNTY 501(C)(3) NONPROFIT
                </span>

                <h1 className="font-display text-3xl sm:text-5xl md:text-7xl xl:text-[5rem] font-extrabold tracking-tight text-slate-950 leading-[1.08] sm:leading-[1.05]">
                  You Are <span className="font-serif italic font-normal text-[#5A1E65] relative inline-block">
                    Always Welcome
                    <svg className="absolute -bottom-1 left-0 w-full h-2.5 text-[#5A1E65]/35" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" />
                    </svg>
                  </span> Here.
                </h1>

                <p className="text-sm sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl pt-1">
                  Diversity Collective is Ventura County's premier cultural sanctuary and clinical wellness home — delivering free rapid health testing, youth peer programs, mutual aid, and intersectional advocacy across all 10 county cities.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <Link 
                  to="/programs" 
                  className="btn-primary group shadow-md hover:shadow-lg text-sm py-3 sm:py-3.5 px-6 sm:px-8 text-center justify-center"
                >
                  <span>Explore Free Programs</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/contact" 
                  className="btn-secondary group backdrop-blur-md bg-white/90 text-sm py-3 sm:py-3.5 px-6 sm:px-8 border-slate-300 text-center justify-center"
                >
                  <MapPin className="w-4 h-4 text-purple-700 group-hover:scale-110 transition-transform" />
                  <span>Visit Sanctuary</span>
                </Link>
                <a
                  href={`tel:${orgInfo.phone.replace(/[^0-9]/g, '')}`}
                  className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors self-start sm:self-auto"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{orgInfo.phone}</span>
                </a>
              </div>

              {/* Interactive "What Brings You In Today?" Quick Pathfinder */}
              <div className="mt-4 p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#5A1E65]" />
                    <span>Instant Sanctuary Navigator — What brings you in today?</span>
                  </span>
                  <span className="text-[11px] text-slate-400">100% Confidential</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setHeroService('testing')}
                    className={`p-2.5 rounded-xl text-left transition-all border text-xs font-semibold cursor-pointer ${
                      heroService === 'testing'
                        ? 'bg-purple-50 border-[#5A1E65] text-[#5A1E65] shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🩺</span> Rapid Testing
                    </div>
                    <span className="text-[10px] text-slate-500 block font-normal">Diversity SHINES</span>
                  </button>

                  <button
                    onClick={() => setHeroService('youth')}
                    className={`p-2.5 rounded-xl text-left transition-all border text-xs font-semibold cursor-pointer ${
                      heroService === 'youth'
                        ? 'bg-purple-50 border-[#5A1E65] text-[#5A1E65] shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🌈</span> Youth (13–23)
                    </div>
                    <span className="text-[10px] text-slate-500 block font-normal">Rainbow Umbrella</span>
                  </button>

                  <button
                    onClick={() => setHeroService('center')}
                    className={`p-2.5 rounded-xl text-left transition-all border text-xs font-semibold cursor-pointer ${
                      heroService === 'center'
                        ? 'bg-purple-50 border-[#5A1E65] text-[#5A1E65] shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🏠</span> Drop-In Hub
                    </div>
                    <span className="text-[10px] text-slate-500 block font-normal">Library & Lounge</span>
                  </button>

                  <button
                    onClick={() => setHeroService('donate')}
                    className={`p-2.5 rounded-xl text-left transition-all border text-xs font-semibold cursor-pointer ${
                      heroService === 'donate'
                        ? 'bg-purple-50 border-[#5A1E65] text-[#5A1E65] shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>💖</span> Give or Join
                    </div>
                    <span className="text-[10px] text-slate-500 block font-normal">501(c)(3) Support</span>
                  </button>
                </div>

                {/* Dynamic Pathfinder Detail Card */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {heroService === 'testing' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                      <span className="text-slate-600">
                        <strong>Diversity SHINES:</strong> Free, confidential rapid HIV & Hepatitis C testing with immediate results. Walk-ins Mon–Fri 1–5 PM.
                      </span>
                      <Link to="/programs" className="text-[#5A1E65] font-bold hover:underline sm:ml-3 flex-shrink-0">
                        View Testing Hours →
                      </Link>
                    </div>
                  )}
                  {heroService === 'youth' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                      <span className="text-slate-600">
                        <strong>Rainbow Umbrella:</strong> Affirming peer circles for youth ages 13–23 every Friday from 5:30 PM to 7:30 PM.
                      </span>
                      <Link to="/programs" className="text-[#5A1E65] font-bold hover:underline sm:ml-3 flex-shrink-0">
                        Youth Info →
                      </Link>
                    </div>
                  )}
                  {heroService === 'center' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                      <span className="text-slate-600">
                        <strong>Community Resource Center:</strong> 2471 Portola Rd, Suite 100, Ventura. Free computer lab, queer lending library, and coffee.
                      </span>
                      <Link to="/contact" className="text-[#5A1E65] font-bold hover:underline sm:ml-3 flex-shrink-0">
                        Directions →
                      </Link>
                    </div>
                  )}
                  {heroService === 'donate' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                      <span className="text-slate-600">
                        <strong>Community Philanthropy:</strong> Your tax-deductible gift directly funds free youth meals, safe spaces, and vital screenings.
                      </span>
                      <a href="#giving" className="text-[#5A1E65] font-bold hover:underline sm:ml-3 flex-shrink-0">
                        Donate Now →
                      </a>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Right Column: Multi-Layer 3D Editorial Visual Collage */}
            <div className="lg:col-span-5 relative perspective-1000 preserve-3d">
              
              {/* Primary Visual Frame with Interactive 3D Card */}
              <div className="relative group/card rounded-3xl transition-transform duration-300 ease-out hover:-translate-y-1.5">
                <CardSpotlight 
                  className="glass-card rounded-3xl overflow-hidden shadow-2xl border-2 border-white/95 relative"
                  tilt={false}
                  scale={1}
                  glare={false}
                >
                  <div className="relative overflow-hidden aspect-[4/3] group">
                    <img 
                      src="/images/community-gathering.jpg" 
                      alt="Diversity Collective Ventura County community members gathering"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      onError={(e) => {
                        e.target.src = "/images/hero-community.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent pointer-events-none" />
                    
                    {/* Floating In-Frame Physical Location Tag */}
                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-white text-xs pointer-events-none">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-300 flex-shrink-0" />
                        <span className="font-semibold text-white drop-shadow-md">2471 Portola Road, Suite 100, Ventura</span>
                      </div>
                      <span className="text-emerald-300 drop-shadow-md font-bold text-[11px] bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-400/50 shadow-sm">
                        Open Today
                      </span>
                    </div>
                  </div>

                  {/* Bottom Bar with Prominent DCVC Emblem */}
                  <div className="p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white p-1 border-2 border-purple-100 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <img 
                          src="/images/logo-square.png" 
                          alt="Diversity Collective Emblem" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block leading-tight">Community Resource Center</span>
                        <span className="text-xs text-slate-500 font-medium">Physical safe harbor & clinical navigation</span>
                      </div>
                    </div>
                    <Link 
                      to="/about"
                      className="text-xs font-extrabold text-[#5A1E65] hover:text-purple-700 hover:underline inline-flex items-center gap-1 group/link"
                    >
                      <span>About Us</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                </CardSpotlight>

                {/* Floating Credential Badge 1 (Top Left) - Locked within screen bounds, pointer-events-none to eliminate flicker */}
                <div className="hidden sm:flex absolute -top-4 left-2 sm:-top-5 sm:left-4 glass-card p-3 rounded-2xl shadow-xl border-2 border-white/95 items-center gap-2.5 z-30 bg-white/95 backdrop-blur-md animate-float-slow glow-amethyst pointer-events-none select-none max-w-[85vw]">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 text-[#5A1E65] flex items-center justify-center font-bold text-sm shadow-xs border border-purple-300/80 flex-shrink-0">
                    <Star className="w-4.5 h-4.5 fill-[#5A1E65] text-[#5A1E65]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-950 leading-tight">10+ Years of Sanctuary</span>
                    <span className="text-[11px] text-[#5A1E65] font-bold">Serving Ventura County Since 2014</span>
                  </div>
                </div>

                {/* Floating Credential Badge 2 (Bottom Right) - Anchored inside screen container, pointer-events-none to eliminate flicker */}
                <div className="hidden sm:flex absolute -bottom-4 right-2 sm:-bottom-5 sm:right-4 glass-card p-3 rounded-2xl shadow-xl border-2 border-white/95 items-center gap-2.5 z-30 bg-white/95 backdrop-blur-md animate-float-reverse glow-teal pointer-events-none select-none max-w-[85vw]">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-300/80 flex-shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-700" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-950 leading-tight">100% Free & Confidential</span>
                    <span className="text-[11px] text-emerald-800 font-bold">Zero Insurance or Fees Required</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* ====================================================================
              HIGH-VISIBILITY CIVIC & PUBLIC HEALTH LOGOS SHOWCASE
              Addressing: "logos here needs to be bigger and more visible"
              ==================================================================== */}
          <div className="pt-8 border-t border-slate-200 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#5A1E65]" />
                <span>Verified Civic Alliances & Public Health Leadership</span>
              </span>
              <span className="text-xs text-slate-400">
                Official Ventura County Agency & Accessibility Partners
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 pt-2">
              {/* Partner 1: VCBH */}
              <a 
                href="https://vchca.org/behavioral-health/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white shadow-sm hover:shadow-2xl border-2 border-slate-200/90 hover:border-[#5A1E65] transition-all interactive-card-3d cursor-pointer relative overflow-hidden"
                title="Ventura County Behavioral Health"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="h-16 md:h-20 w-full flex items-center justify-center">
                  <img 
                    src="/images/vcbh-logo.jpg" 
                    alt="Ventura County Behavioral Health Logo" 
                    className="max-h-14 md:max-h-16 max-w-[85%] object-contain group-hover:scale-108 transition-transform duration-300" 
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-2 text-center block group-hover:text-[#5A1E65] leading-tight">
                  Behavioral Health
                </span>
                <span className="text-[11px] text-slate-400 text-center font-medium">County of Ventura</span>
              </a>

              {/* Partner 2: VCPH */}
              <a 
                href="https://vchca.org/public-health/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white shadow-sm hover:shadow-2xl border-2 border-slate-200/90 hover:border-[#5A1E65] transition-all interactive-card-3d cursor-pointer relative overflow-hidden"
                title="Ventura County Public Health"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/0 via-teal-500/0 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="h-16 md:h-20 w-full flex items-center justify-center">
                  <img 
                    src="/images/vcph-logo.png" 
                    alt="Ventura County Public Health Logo" 
                    className="max-h-14 md:max-h-16 max-w-[85%] object-contain group-hover:scale-108 transition-transform duration-300" 
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-2 text-center block group-hover:text-[#5A1E65] leading-tight">
                  Public Health
                </span>
                <span className="text-[11px] text-slate-400 text-center font-medium">STI Screening Partner</span>
              </a>

              {/* Partner 3: Diversity SHINES */}
              <Link 
                to="/programs" 
                className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white shadow-sm hover:shadow-2xl border-2 border-slate-200/90 hover:border-[#5A1E65] transition-all interactive-card-3d cursor-pointer relative overflow-hidden"
                title="Diversity SHINES HIV/STI Testing Clinic"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="h-16 md:h-20 w-full flex items-center justify-center">
                  <img 
                    src="/images/shines-logo.jpg" 
                    alt="Diversity SHINES Logo" 
                    className="max-h-14 md:max-h-16 max-w-[85%] object-contain group-hover:scale-108 transition-transform duration-300" 
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-2 text-center block group-hover:text-[#5A1E65] leading-tight">
                  Diversity SHINES
                </span>
                <span className="text-[11px] text-slate-400 text-center font-medium">Clinical Rapid Testing</span>
              </Link>

              {/* Partner 4: Recite Me */}
              <a 
                href="https://www.w3.org/WAI/WCAG2AA-Conformance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white shadow-sm hover:shadow-2xl border-2 border-slate-200/90 hover:border-[#5A1E65] transition-all interactive-card-3d cursor-pointer relative overflow-hidden"
                title="Recite Me Digital Accessibility"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="h-16 md:h-20 w-full flex items-center justify-center">
                  <img 
                    src="/images/accessibility-badge.png" 
                    alt="Recite Me Accessibility Certified Logo" 
                    className="max-h-14 md:max-h-16 max-w-[85%] object-contain group-hover:scale-108 transition-transform duration-300" 
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-2 text-center block group-hover:text-[#5A1E65] leading-tight">
                  Recite Me Certified
                </span>
                <span className="text-[11px] text-slate-400 text-center font-medium">Accessibility Champion</span>
              </a>

              {/* Partner 5: Little Unicorns */}
              <Link 
                to="/programs" 
                className="group col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-5 rounded-2xl bg-white shadow-sm hover:shadow-2xl border-2 border-slate-200/90 hover:border-[#5A1E65] transition-all interactive-card-3d cursor-pointer relative overflow-hidden"
                title="Little Unicorns Kids & Family Initiative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/0 via-rose-500/0 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="h-16 md:h-20 w-full flex items-center justify-center">
                  <img 
                    src="/images/little-unicorns.png" 
                    alt="Little Unicorns Initiative Logo" 
                    className="max-h-14 md:max-h-16 max-w-[85%] object-contain group-hover:scale-108 transition-transform duration-300" 
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-2 text-center block group-hover:text-[#5A1E65] leading-tight">
                  Little Unicorns
                </span>
                <span className="text-[11px] text-slate-400 text-center font-medium">Youth Ages 9–13</span>
              </Link>
            </div>
          </div>

          {/* County Regional Cities Ribbon */}
          <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-400">
            <span className="text-slate-500 uppercase tracking-widest text-[11px] font-bold">
              Serving Ventura County Communities:
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600 text-xs font-medium">
              <span className="hover:text-[#5A1E65] transition-colors">Ventura</span>
              <span className="text-slate-300">·</span>
              <span className="hover:text-[#5A1E65] transition-colors">Oxnard</span>
              <span className="text-slate-300">·</span>
              <span className="hover:text-[#5A1E65] transition-colors">Camarillo</span>
              <span className="text-slate-300">·</span>
              <span className="hover:text-[#5A1E65] transition-colors">Thousand Oaks</span>
              <span className="text-slate-300">·</span>
              <span className="hover:text-[#5A1E65] transition-colors">Simi Valley</span>
              <span className="text-slate-300">·</span>
              <span className="hover:text-[#5A1E65] transition-colors">Ojai Valley</span>
              <span className="text-slate-300">·</span>
              <span className="hover:text-[#5A1E65] transition-colors">Moorpark</span>
              <span className="text-slate-300">·</span>
              <span className="hover:text-[#5A1E65] transition-colors">Santa Paula</span>
              <span className="text-slate-300">·</span>
              <span className="hover:text-[#5A1E65] transition-colors">Port Hueneme</span>
            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          IMPACT NUMBERS: ANIMATED COUNT-UP WITH GLASS SPOTLIGHT
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-slate-50/50 border-b border-slate-100">
        <div className="container-clean">
          
          <div className="max-w-2xl mb-10 flex flex-col gap-3">
            <span className="glass-pill">
              10-YEAR TRACK RECORD
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
              Trusted community support across Ventura County.
            </h2>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              Since 2014, we have provided barrier-free, non-judgmental services to LGBTQ+ individuals, youth, and families.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 perspective-1000">
            {impactStats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <CardSpotlight 
                  key={stat.label}
                  className={`glass-card p-6 md:p-8 border-2 ${stat.borderClass} ${stat.glowClass} interactive-card-3d relative overflow-hidden`}
                  tilt={true}
                  maxTilt={8}
                  glare={true}
                >
                  <div className="flex flex-col gap-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center font-bold shadow-xs border border-white/60`}>
                        <StatIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">100% Verified</span>
                    </div>
                    <div className={`font-display text-4xl sm:text-5xl font-black tracking-tight ${stat.colorClass}`}>
                      <AnimatedCounter value={stat.value} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 pt-0.5">
                      {stat.label}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {stat.sub}
                    </p>
                  </div>
                </CardSpotlight>
              );
            })}
          </div>

        </div>
      </section>

      {/* ====================================================================
          INTERACTIVE MODULE: CARE & COMMUNITY COMPASS
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-white border-b border-slate-100">
        <div className="container-clean">
          <CommunityCompass />
        </div>
      </section>

      {/* ====================================================================
          PROGRAMS DIRECTORY: COLLISION-PROOF EXPANDABLE CARDS
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-slate-50/50 border-b border-slate-100">
        <div className="container-clean">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex flex-col gap-3 max-w-xl">
              <span className="glass-pill">
                CORE INITIATIVES
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                Programs for every chapter of life.
              </h2>
            </div>
            <p className="text-slate-600 max-w-md text-sm leading-relaxed">
              Explore peer support groups, clinical health screenings, and cultural fellowship programs below.
            </p>
          </div>

          {/* Clean Category Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 my-6">
            {programCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'glass-pill hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Cards Grid with Quick Peek Accordion & 3D Tilt */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 perspective-1000">
            {filteredPrograms.map((program) => {
              const isPeekOpen = expandedProgram === program.slug;
              
              // Dynamic jewel-toned badge colors
              let audienceBadgeColor = "text-purple-700 bg-purple-50 border-purple-200/80";
              if (program.slug === 'little-unicorns') audienceBadgeColor = "text-amber-700 bg-amber-50 border-amber-200/80";
              if (program.slug === 'diversity-shines') audienceBadgeColor = "text-teal-700 bg-teal-50 border-teal-200/80";
              if (program.slug === 'community-resource-center') audienceBadgeColor = "text-indigo-700 bg-indigo-50 border-indigo-200/80";

              return (
                <CardSpotlight 
                  key={program.slug}
                  className="glass-card overflow-hidden flex flex-col justify-between interactive-card-3d border-2 border-slate-200/80 hover:border-[#5A1E65]/60 shadow-sm hover:shadow-2xl"
                  tilt={true}
                  maxTilt={6}
                  scale={1.02}
                  glare={true}
                >
                  <div>
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative group">
                      <img 
                        src={program.heroImage} 
                        alt={program.title}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
                        onError={(e) => {
                          e.target.src = "/images/crc-building.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-6 md:p-8 flex flex-col gap-2.5">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border w-fit block shadow-2xs ${audienceBadgeColor}`}>
                        {program.audience}
                      </span>
                      <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 group-hover:text-[#5A1E65] transition-colors">
                        {program.title}
                      </h3>
                      <p className="text-xs italic font-serif text-[#5A1E65] font-medium">
                        "{program.tagline}"
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        {program.summary}
                      </p>

                      {/* Interactive Quick Peek Toggle Button */}
                      <button
                        onClick={() => toggleProgramPeek(program.slug)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#5A1E65] cursor-pointer py-1"
                      >
                        <span>{isPeekOpen ? 'Hide meeting details' : 'What happens at a gathering?'}</span>
                        {isPeekOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Smooth Expandable Drawer */}
                      {isPeekOpen && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5 mt-1 transition-all duration-200">
                          <p className="font-semibold text-slate-900">Program Highlights:</p>
                          <ul className="space-y-1 text-slate-600">
                            <li>• Safe, facilitated check-in circle with trained mentors</li>
                            <li>• Refreshments, art supplies, and book lending access</li>
                            <li>• Zero fee, drop-in welcome with complete confidentiality</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 md:p-8 pt-0 flex flex-col gap-4">
                      <div className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-900">When: </span>
                          <span>{program.schedule}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-900">Where: </span>
                          <span>{program.location}</span>
                        </div>
                      </div>

                    <Link 
                      to={`/programs/${program.slug}`}
                      className="inline-flex items-center justify-between text-xs font-bold text-slate-900 hover:text-[#5A1E65] pt-2 border-t border-slate-100 group"
                    >
                      <span>Read Program Details</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </CardSpotlight>
              );
            })}
          </div>

        </div>
      </section>

      {/* ====================================================================
          RESOURCE CENTER SANCTUARY: CALM 2-COLUMN ARCHITECTURE
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-white border-b border-slate-100">
        <div className="container-clean">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-7 flex flex-col gap-5">
              <span className="glass-pill">
                PHYSICAL COMMUNITY HUB
              </span>
              
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                Community Resource Center
              </h2>

              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                Our physical center in Ventura is an affirming, discrimination-free space for LGBTQ+ individuals and allies. We offer free drop-in community hours, peer group meeting spaces, a curated lending library, and confidential health screenings.
              </p>

              {/* Key Amenities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  <span>Free Computer & Printing Lab</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  <span>Curated LGBTQ+ Lending Library</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  <span>Free Safer-Sex & Harm Reduction</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  <span>Private Consultation & Intake</span>
                </div>
              </div>

              {/* Hours Box */}
              <div className="p-5 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Physical Address:</span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900">2471 Portola Road, Suite 100</p>
                    <p className="text-[11px] text-slate-500">Ventura, CA 93003</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Drop-In Center Hours:</span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900">Monday – Friday: 1:00 PM – 5:00 PM</p>
                    <p className="text-[11px] text-slate-500">Drop-ins and appointments welcome</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent('2471 Portola Road, Suite 100, Ventura, CA 93003')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary group"
                >
                  <span>Directions on Google Maps</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
                <a
                  href={`tel:${orgInfo.phone.replace(/[^0-9]/g, '')}`}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2"
                >
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>Call {orgInfo.phone}</span>
                </a>
              </div>

            </div>

            {/* Photo / Facility Representation */}
            <div className="lg:col-span-5 perspective-1000">
              <CardSpotlight 
                className="glass-card rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-200/80 relative group interactive-card-3d glow-amethyst"
                tilt={true}
                maxTilt={8}
                scale={1.02}
                glare={true}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src="/images/crc-building.jpg" 
                    alt="Community Resource Center in Ventura" 
                    className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  {/* Floating Pill Badge in 3D Depth */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-[#5A1E65] shadow-lg border border-purple-200/80 flex items-center gap-1.5 translate-z-20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Physical Safe Space Sanctuary</span>
                  </div>

                  {/* Bottom Address In-Frame */}
                  <div className="absolute bottom-4 left-4 right-4 text-white text-xs flex items-center justify-between translate-z-10">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-300 animate-bounce" />
                      <span className="font-semibold drop-shadow-md">2471 Portola Road, Suite 100</span>
                    </div>
                    <span className="text-white/90 font-bold text-[11px] drop-shadow-md bg-slate-900/60 px-2 py-0.5 rounded-full border border-white/20">Ventura, CA</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 text-white flex items-center justify-between text-xs translate-z-10">
                  <span className="font-medium text-slate-300">Drop-In Hours: Monday–Friday 1–5 PM</span>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent('2471 Portola Road, Suite 100, Ventura, CA 93003')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5 group/nav"
                  >
                    <span>Get Directions</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/nav:translate-x-0.5 group-hover/nav:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </CardSpotlight>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================================
          INTERACTIVE MODULE: VENTURA COUNTY REGIONAL HUB EXPLORER
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-slate-50/50 border-b border-slate-100">
        <div className="container-clean">
          <div className="max-w-2xl mx-auto text-center mb-10 flex flex-col items-center gap-3">
            <span className="glass-pill">
              REGIONAL PRESENCE
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
              Serving every corner of Ventura County.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              From the coastal communities of Ventura and Oxnard to the inland valleys of Simi, Thousand Oaks, and Ojai — discover where we meet you.
            </p>
          </div>

          <RegionalHubExplorer />
        </div>
      </section>

      {/* ====================================================================
          HIGHLY EYE-CATCHING & BEAUTIFUL GIVING STUDIO (Addressing User Feedback)
          ==================================================================== */}
      <section id="giving" className="py-16 md:py-24 bg-gradient-to-b from-white via-slate-50/50 to-purple-50/30 border-b border-slate-100 relative overflow-hidden">
        
        {/* Ambient Specular Backdrops */}
        <div 
          className="absolute top-10 left-1/4 w-[36rem] h-[36rem] bg-purple-200/20 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-amber-100/25 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="container-clean relative z-10">
          
          <div className="max-w-3xl mx-auto text-center mb-12 flex flex-col items-center gap-3.5">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] py-1 px-4 bg-purple-50/90 border-purple-200/80 shadow-xs">
              ❤️ 501(C)(3) COMMUNITY PHILANTHROPY
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Every Gift Directly Sustains Our Safe Harbor.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              We never charge fees or require insurance for testing, drop-in care, or youth circles. Community contributions keep our doors open for anyone seeking care and belonging.
            </p>

            {/* Frequency Switcher */}
            <div className="inline-flex items-center p-1.5 rounded-full bg-slate-200/80 border border-slate-300/80 shadow-inner mt-2">
              <button
                onClick={() => setDonationFreq('once')}
                className={`py-2 px-6 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  donationFreq === 'once'
                    ? 'bg-white text-slate-900 shadow-md scale-102'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                One-Time Gift
              </button>
              <button
                onClick={() => setDonationFreq('monthly')}
                className={`py-2 px-6 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  donationFreq === 'monthly'
                    ? 'bg-[#5A1E65] text-white shadow-md scale-102'
                    : 'text-slate-600 hover:text-[#5A1E65]'
                }`}
              >
                <span>Monthly Sustainer</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  donationFreq === 'monthly' ? 'bg-amber-400 text-slate-950' : 'bg-purple-100 text-[#5A1E65]'
                }`}>
                  ★ Most Needed
                </span>
              </button>
            </div>
          </div>

          {/* Master Giving Studio Card with 3D Depth & Specular Glow */}
          <div className="max-w-6xl mx-auto rounded-3xl bg-white shadow-2xl border-2 border-purple-200/90 overflow-hidden preserve-3d glow-amethyst">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Left Column: Interactive Tiers & Custom Amount */}
              <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-slate-100 bg-white/95">
                
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-[#5A1E65]" />
                      <span>Select Gift Tier {donationFreq === 'monthly' ? '(Monthly Sustainer)' : ''}</span>
                    </span>
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                      100% Tax-Deductible
                    </span>
                  </div>

                  {/* Dynamic Tier Cards Grid with 3D Interaction */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {donationTiers.map((tier) => {
                      const isSelected = selectedDonationTier === tier.amount && !customDonation;
                      return (
                        <button
                          key={tier.amount}
                          onClick={(e) => {
                            setCustomDonation('');
                            handleSelectDonationTier(tier.amount, e);
                          }}
                          className={`p-4 rounded-2xl text-left transition-all border-2 flex flex-col justify-between gap-2 cursor-pointer interactive-card-3d relative overflow-hidden ${
                            isSelected
                              ? 'bg-gradient-to-br from-purple-50 via-white to-purple-50/60 border-[#5A1E65] shadow-lg scale-102 ring-2 ring-purple-400/30'
                              : 'bg-slate-50/80 border-slate-200/90 hover:bg-white hover:border-purple-300 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`font-display text-2xl font-black ${isSelected ? 'text-[#5A1E65]' : 'text-slate-900'}`}>
                              ${tier.amount}
                            </span>
                            {isSelected ? (
                              <span className="w-6 h-6 rounded-full bg-[#5A1E65] text-white flex items-center justify-center text-xs shadow-xs">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400">
                                {tier.amount === 50 ? 'Recommended' : ''}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              {tier.title}
                            </span>
                            <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                              {tier.impact}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Amount Field */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      Or Enter Custom Amount ($):
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">$</span>
                      <input
                        type="number"
                        min="5"
                        placeholder="Enter any custom amount (e.g. 75, 150, 500)"
                        value={customDonation}
                        onChange={(e) => {
                          setCustomDonation(e.target.value);
                          if (e.target.value && Number(e.target.value) > 0) {
                            setSelectedDonationTier(Number(e.target.value));
                          }
                        }}
                        className="w-full pl-9 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-[#5A1E65] focus:ring-4 focus:ring-purple-200/50 text-sm font-bold text-slate-900 outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Trust & Transparency Footnote */}
                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 flex items-center gap-3 text-xs text-slate-700">
                  <ShieldCheck className="w-6 h-6 text-[#5A1E65] flex-shrink-0" />
                  <div>
                    <span>Official 501(c)(3) Federal Non-Profit · Tax ID (EIN): <strong className="text-slate-950">{orgInfo.ein}</strong></span>
                    <span className="block text-[11px] text-slate-500 font-medium">Every contribution is tax-deductible to the full extent of the law.</span>
                  </div>
                </div>

              </div>

              {/* Right Column: High-Impact Visual Real-World Preview in 3D Atmosphere */}
              <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-slate-950 via-[#33083F] to-slate-950 text-white flex flex-col justify-between gap-8 relative overflow-hidden preserve-3d">
                
                {/* Specular Violet Ambient Aura */}
                <div 
                  className="absolute -top-20 -right-20 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" 
                  aria-hidden="true" 
                />
                <div 
                  className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" 
                  aria-hidden="true" 
                />

                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-widest uppercase text-amber-300 bg-amber-400/15 px-3 py-1 rounded-full border border-amber-400/40 shadow-xs">
                      LIVE IMPACT PREVIEW
                    </span>
                    <span className="text-xs font-semibold text-purple-200">
                      {donationFreq === 'monthly' ? 'Recurring Monthly' : 'One-Time Direct'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-purple-200 uppercase font-bold tracking-wider">Your Community Gift:</span>
                    <div className="font-display text-4xl sm:text-5xl font-black text-white flex items-baseline gap-2">
                      <span className="text-amber-300">${customDonation ? customDonation : selectedDonationTier}</span>
                      {donationFreq === 'monthly' && <span className="text-sm font-semibold text-purple-200">/ month</span>}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col gap-2 shadow-inner">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      <span>{customDonation ? 'Custom Community Sustainer Gift' : activeTierObj.title}</span>
                    </span>
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-serif italic">
                      "{customDonation 
                        ? `Your generous gift of $${customDonation} provides flexible barrier-free support, hot meals for youth, and free health testing navigation across Ventura County.`
                        : activeTierObj.impact}"
                    </p>
                  </div>

                  {/* Impact Metrics List */}
                  <div className="space-y-2.5 text-xs text-slate-200 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>100% of gift supports local community programs</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Instant tax receipt delivered to your email</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Bank-grade 256-bit encrypted official processing</span>
                    </div>
                  </div>
                </div>

                {/* Master Action Button with Amber Glow */}
                <div className="flex flex-col gap-3 relative z-10">
                  <a
                    href={orgInfo.donationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={triggerMilestoneConfetti}
                    className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_30px_-5px_rgba(245,158,11,0.45)] hover:shadow-[0_16px_40px_-5px_rgba(245,158,11,0.6)] hover:scale-102 transition-all cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-current text-rose-700 animate-bounce" />
                    <span>Complete ${customDonation ? customDonation : selectedDonationTier} Gift Online</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                  <p className="text-[11px] text-center text-slate-300 flex items-center justify-center gap-1.5 font-medium">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Secure redirect to Official Diversity Collective Donor Portal</span>
                  </p>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          UPCOMING EVENTS: BALANCED ROWS WITH GLASS CARDS
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-slate-50/50 border-b border-slate-100">
        <div className="container-clean">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex flex-col gap-3 max-w-xl">
              <span className="glass-pill">
                GATHERINGS & CALENDAR
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                Upcoming Community Gatherings
              </h2>
            </div>
            <Link 
              to="/events" 
              className="btn-secondary"
            >
              <span>View Full Calendar</span>
              <Calendar className="w-4 h-4 text-slate-500" />
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2.5 my-6">
            {eventCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedEventCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedEventCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'glass-pill hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Events List in 3D Perspective */}
          <div className="flex flex-col gap-4 perspective-1000">
            {filteredEvents.slice(0, 4).map((evt, idx) => {
              const dateGradients = [
                'from-purple-950 via-purple-900 to-indigo-950 text-white',
                'from-amber-600 via-amber-500 to-amber-700 text-white',
                'from-emerald-700 via-teal-700 to-emerald-800 text-white',
                'from-slate-900 via-slate-800 to-purple-950 text-white'
              ];
              return (
                <CardSpotlight
                  key={evt.id}
                  className="glass-card p-5 sm:p-6 md:p-7 border-2 border-slate-200/80 hover:border-purple-300/90 interactive-card-3d"
                  tilt={true}
                  maxTilt={5}
                  glare={true}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    <div className="md:col-span-2 flex md:justify-center">
                      <div className={`flex flex-col items-center justify-center min-w-[76px] p-3.5 rounded-2xl bg-gradient-to-b ${dateGradients[idx % dateGradients.length]} shadow-md`}>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">{evt.month}</span>
                        <span className="font-display text-2xl font-black">{evt.day}</span>
                      </div>
                    </div>

                    <div className="md:col-span-7 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          {evt.category}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#5A1E65]" /> {evt.time}
                        </span>
                      </div>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 pt-0.5">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    <div className="md:col-span-3 flex md:justify-end">
                      <Link 
                        to={`/events/${evt.slug}`}
                        className="btn-secondary text-xs py-2.5 px-5 w-full md:w-auto text-center font-bold"
                      >
                        <span>Details & RSVP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>
                </CardSpotlight>
              );
            })}
          </div>

        </div>
      </section>

      {/* ====================================================================
          TESTIMONIALS & COMMUNITY VOICES: 3D EDITORIAL GRID
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-white border-b border-slate-100">
        <div className="container-clean">
          
          <div className="max-w-2xl mx-auto text-center mb-10 flex flex-col items-center gap-3">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
              COMMUNITY VOICES
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
              In our community's words.
            </h2>
            <p className="text-sm text-slate-600">
              Real stories of care, belonging, and connection from every city in Ventura County.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 perspective-1000">
            <CardSpotlight 
              className="glass-card p-6 md:p-8 flex flex-col justify-between gap-5 border-2 border-purple-200/70 hover:border-[#5A1E65] interactive-card-3d glow-amethyst"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif text-[#5A1E65] leading-none">“</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">Youth Voice</span>
              </div>
              <p className="font-serif italic text-sm md:text-base text-slate-800 leading-relaxed">
                "Rainbow Umbrella gave our teenager the first space where they felt completely accepted and understood. It changed our family's life."
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  YP
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs sm:text-sm text-slate-950">Youth Program Participant</span>
                  <span className="text-[11px] text-slate-500 font-medium">Ventura, CA</span>
                </div>
              </div>
            </CardSpotlight>

            <CardSpotlight 
              className="glass-card p-6 md:p-8 flex flex-col justify-between gap-5 border-2 border-amber-200/70 hover:border-amber-500 interactive-card-3d glow-amber"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif text-amber-600 leading-none">“</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Parent Voice</span>
              </div>
              <p className="font-serif italic text-sm md:text-base text-slate-800 leading-relaxed">
                "Having a physical Community Resource Center right here in Portola Road gives our families a trusted place to find healthcare navigation, peer support, and affirming community."
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  PO
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs sm:text-sm text-slate-950">Parent of Youth Attendee</span>
                  <span className="text-[11px] text-slate-500 font-medium">Oxnard, CA</span>
                </div>
              </div>
            </CardSpotlight>

            <CardSpotlight 
              className="glass-card p-6 md:p-8 flex flex-col justify-between gap-5 border-2 border-emerald-200/70 hover:border-emerald-500 interactive-card-3d glow-teal"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif text-emerald-700 leading-none">“</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Volunteer Voice</span>
              </div>
              <p className="font-serif italic text-sm md:text-base text-slate-800 leading-relaxed">
                "Diversity Collective is the cultural backbone of LGBTQ+ Ventura County. From Pride to harm reduction, they show up for our community 365 days a year."
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  CV
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs sm:text-sm text-slate-950">Community Volunteer</span>
                  <span className="text-[11px] text-slate-500 font-medium">Camarillo, CA</span>
                </div>
              </div>
            </CardSpotlight>
          </div>

        </div>
      </section>

      {/* ====================================================================
          FINAL CALL TO ACTION: LUXURY 3D AURORA ARCHITECTURE
          ==================================================================== */}
      <section className="py-20 md:py-28 aurora-bg text-white relative overflow-hidden">
        
        {/* Specular Ambient Glow Orbs */}
        <div 
          className="absolute -bottom-24 left-1/3 w-[36rem] h-[36rem] rounded-full bg-purple-500/20 blur-3xl pointer-events-none animate-pulse duration-1000" 
          aria-hidden="true" 
        />
        <div 
          className="absolute -top-24 right-1/4 w-[30rem] h-[30rem] rounded-full bg-amber-400/15 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="container-clean text-center flex flex-col items-center gap-6 max-w-3xl mx-auto relative z-10">
          
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-xs font-bold text-amber-300 border border-amber-400/30 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>SUPPORT OUR 501(C)(3) MISSION</span>
          </span>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            "We do what we do, <br className="hidden sm:inline" />
            <span className="font-serif italic font-normal text-amber-300">because of you.</span>"
          </h2>

          <p className="text-sm md:text-base text-purple-100 leading-relaxed font-serif italic max-w-xl mx-auto">
            Diversity Collective of Ventura County is solely dedicated to advocating for and caring for our local LGBTQ+ community. Your generosity ensures our doors remain open, safe, and free for all.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            <a
              href={orgInfo.donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={triggerMilestoneConfetti}
              className="py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_30px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_15px_40px_-5px_rgba(245,158,11,0.7)] hover:scale-103 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-current text-rose-700 animate-bounce" />
              <span>Make a Community Gift Online</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <Link
              to="/get-involved"
              className="py-4 px-8 rounded-2xl border-2 border-white/20 hover:border-white/50 bg-white/10 hover:bg-white/15 text-white text-sm font-bold transition-all backdrop-blur-md interactive-card-3d"
            >
              <span>Explore Volunteer Roles</span>
            </Link>
          </div>

          <p className="text-xs text-purple-200/80 pt-2 font-medium">
            Federal EIN: {orgInfo.ein} · California Registered 501(c)(3) Nonprofit · 100% Tax-Deductible
          </p>

        </div>
      </section>

    </div>
  );
}
