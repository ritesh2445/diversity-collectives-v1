import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  ArrowRight, 
  ArrowUpRight, 
  MapPin, 
  Clock, 
  Phone, 
  Heart, 
  Shield,
  ShieldCheck, 
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Award,
  Check,
  Lock,
  Gift,
  Star,
  Activity
} from 'lucide-react';
import { 
  orgInfo, 
  programsList, 
  liveEvents,
  businessDirectorySeed 
} from '../data/dcvcData';
import AnimatedCounter from '../components/AnimatedCounter';
import CardSpotlight from '../components/CardSpotlight';
import NewsletterSignup from '../components/NewsletterSignup';
import { usePageMeta } from '../utils/seo';
import { 
  getActiveHeroTheme, 
  subscribeToHeroTheme, 
  HERO_THEMES 
} from '../services/heroThemeStore';

function LotusIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4c-1.8 3-2.5 6.5-2.5 9.5a2.5 2.5 0 0 0 5 0c0-3-.7-6.5-2.5-9.5z" />
      <path d="M9.5 13.5C7.5 11 5 10 2.5 11c1 3.2 3.2 5.8 7 6.5" />
      <path d="M14.5 13.5C16.5 11 19 10 21.5 11c-1 3.2-3.2 5.8-7 6.5" />
      <path d="M7 17.5c-2.5.8-4.5 0-5.5-1 1.2 2.2 3.8 3 6.5 2" />
      <path d="M17 17.5c2.5.8 4.5 0 5.5-1-1.2 2.2-3.8 3-6.5 2" />
      <path d="M8.5 20c2.3 1 4.7 1 7 0" />
    </svg>
  );
}

// ============================================================================
// ANIMATED FESTIVAL ATMOSPHERE PARTICLES & GLOWS
// ============================================================================
function AnimatedFestivalAtmosphere({ themeId }) {
  if (themeId === 'fest-pride') {
    const confettiColors = ['#EF4444', '#F97316', '#FBBF24', '#10B981', '#06B6D4', '#8B5CF6', '#F472B6', '#38BDF8'];
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, idx) => (
          <span
            key={idx}
            className="absolute -top-6 w-3 h-3 rounded-xs opacity-75 animate-confetti-drift shadow-xs"
            style={{
              backgroundColor: confettiColors[idx % confettiColors.length],
              left: `${(idx * 7.5 + 4)}%`,
              animationDuration: `${6 + (idx % 5) * 1.2}s`,
              animationDelay: `${(idx % 4) * 1.1}s`,
              transform: `rotate(${idx * 35}deg)`
            }}
          />
        ))}
      </div>
    );
  }

  if (themeId === 'fest-prom') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        {[
          { top: '15%', left: '10%', size: 'text-2xl', delay: '0s' },
          { top: '25%', left: '88%', size: 'text-3xl', delay: '1.2s' },
          { top: '55%', left: '6%', size: 'text-xl', delay: '2.1s' },
          { top: '65%', left: '92%', size: 'text-2xl', delay: '0.8s' },
          { top: '78%', left: '32%', size: 'text-lg', delay: '1.7s' },
          { top: '22%', left: '52%', size: 'text-3xl', delay: '2.6s' },
          { top: '42%', left: '78%', size: 'text-xl', delay: '1.9s' }
        ].map((s, idx) => (
          <span
            key={idx}
            className={`absolute ${s.size} select-none animate-star-twinkle text-amber-300 drop-shadow-md`}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >
            ✨
          </span>
        ))}
      </div>
    );
  }

  if (themeId === 'fest-spirit') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-purple-600/30 via-fuchsia-500/20 to-purple-900/35 blur-3xl animate-glow-pulse" />
      </div>
    );
  }

  if (themeId === 'fest-tvd') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-12 -left-12 w-[32rem] h-[32rem] rounded-full bg-sky-200/50 blur-3xl animate-aurora-drift-1" />
        <div className="absolute -bottom-12 -right-12 w-[32rem] h-[32rem] rounded-full bg-pink-200/50 blur-3xl animate-aurora-drift-2" />
      </div>
    );
  }

  if (themeId === 'fest-world-aids') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-red-400/25 blur-3xl animate-glow-pulse" />
      </div>
    );
  }

  if (themeId === 'fest-coming-out') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-10 left-1/3 w-[34rem] h-[34rem] rounded-full bg-gradient-to-r from-amber-300/30 via-rose-300/25 to-orange-300/30 blur-3xl animate-aurora-drift-1" />
      </div>
    );
  }

  if (themeId === 'fest-lesbian') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-orange-400/25 via-pink-400/20 to-amber-200/30 blur-3xl animate-glow-pulse" />
      </div>
    );
  }

  if (themeId === 'fest-bi') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-10 left-10 w-[30rem] h-[30rem] rounded-full bg-fuchsia-400/25 blur-3xl animate-aurora-drift-1" />
        <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] rounded-full bg-blue-500/25 blur-3xl animate-aurora-drift-2" />
      </div>
    );
  }

  return null;
}

export default function Home() {
  usePageMeta({
    title: 'You Are Welcome Here',
    description: 'Diversity Collective Ventura County is a 501(c)(3) nonprofit providing advocacy, visibility, safety, and wellness for the LGBTQ+ community throughout Ventura County.',
    canonicalPath: '/'
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDonationTier, setSelectedDonationTier] = useState(50);
  const [donationFreq, setDonationFreq] = useState('once');
  const [customDonation, setCustomDonation] = useState('');
  const [heroService, setHeroService] = useState('testing');
  const [selectedEventCategory, setSelectedEventCategory] = useState('all');
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [activeThemeId, setActiveThemeId] = useState(getActiveHeroTheme);

  useEffect(() => {
    const unsubscribe = subscribeToHeroTheme((themeId) => {
      setActiveThemeId(themeId);
    });
    return unsubscribe;
  }, []);

  const activeThemeObj = HERO_THEMES.find(t => t.id === activeThemeId) || HERO_THEMES[0];
  const isDesign2 = activeThemeId === 'spotlight' || activeThemeId === 'default';

  // Dynamic sanctuary schedule & live status
  const getSanctuaryStatus = () => {
    try {
      const now = new Date();
      const ptString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
      const ptDate = new Date(ptString);
      const day = ptDate.getDay();
      const hour = ptDate.getHours();
      const isWeekday = day >= 1 && day <= 5;
      const isOpenNow = isWeekday && hour >= 13 && hour < 17;
      return {
        isOpenNow,
        isWeekday,
        statusText: isOpenNow 
          ? "Sanctuary Open Now · Mon–Fri 1:00 PM – 5:00 PM · Free HIV/STI Screenings"
          : isWeekday && hour < 13
          ? "Sanctuary Opens Today 1:00 PM · Mon–Fri 1:00 PM – 5:00 PM · Free HIV/STI Screenings"
          : "Sanctuary Open Today · Mon–Fri 1:00 PM – 5:00 PM · Free HIV/STI Screenings"
      };
    } catch {
      return {
        isOpenNow: true,
        isWeekday: true,
        statusText: "Sanctuary Open Today · Mon–Fri 1:00 PM – 5:00 PM · Free HIV/STI Screenings"
      };
    }
  };
  const sanctuaryStatus = getSanctuaryStatus();

  const impactStats = [
    {
      value: "10+",
      label: "Years of Community Service",
      sub: "Defending rights and providing safe harbor in Ventura County since 2014.",
      icon: Award,
      colorClass: "gradient-text-amethyst",
      cardTheme: "card-vibrant-purple",
      borderClass: "border-purple-300 hover:border-[#5A1E65]",
      glowClass: "glow-amethyst",
      iconBg: "bg-purple-100 text-[#5A1E65]"
    },
    {
      value: "5,000+",
      label: "Health Screenings",
      sub: "Free, confidential HIV/STI testing and care navigation through Diversity SHINES.",
      icon: Activity,
      colorClass: "gradient-text-coastal",
      cardTheme: "card-vibrant-teal",
      borderClass: "border-teal-300 hover:border-teal-600",
      glowClass: "glow-teal",
      iconBg: "bg-teal-100 text-teal-800"
    },
    {
      value: "1,200+",
      label: "Youth Empowered",
      sub: "Safe peer circles, Pride Prom, and mentorship through Rainbow Umbrella.",
      icon: Users,
      colorClass: "gradient-text-sunset",
      cardTheme: "card-vibrant-amber",
      borderClass: "border-amber-300 hover:border-amber-600",
      glowClass: "glow-amber",
      iconBg: "bg-amber-100 text-amber-800"
    },
    {
      value: "100%",
      label: "Free & Confidential",
      sub: "No insurance or fees required. Complete privacy and affirming care for all.",
      icon: ShieldCheck,
      colorClass: "gradient-text-indigo",
      cardTheme: "card-vibrant-indigo",
      borderClass: "border-indigo-300 hover:border-indigo-600",
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
    } catch {
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
    <div className="bg-transparent text-slate-800">

      {/* ====================================================================
          HERO SECTION: DYNAMIC MULTI-THEME DISPATCHER
          Vibrant Multi-Color Aurora Canvas with Rich Gradients & Eye-Catchy Aesthetics
          ==================================================================== */}
      <section className="relative overflow-hidden pt-3 sm:pt-6 bg-[#FAF7F2] border-b border-purple-200/60">
        
        {/* Full-Bleed Ambient Radiant Aurora Atmosphere & Back Ribbon Stream (z-0) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          {/* Ambient Glowing Aurora Orbs */}
          <div className="absolute -top-24 -left-20 w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/15 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
          <div className="absolute -top-20 -right-20 w-[42rem] h-[42rem] rounded-full bg-gradient-to-bl from-amber-400/30 via-rose-400/25 to-purple-400/20 blur-3xl animate-aurora-drift-1" />
          <div className="absolute bottom-10 left-1/4 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-teal-400/20 via-sky-400/18 to-transparent blur-3xl animate-aurora-drift-2" />

          {/* Sweeping Back Aurora Wave Stream looping from upper-right down behind the photo frame */}
          <svg className="w-full h-full min-h-[700px] opacity-80" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="aurora-stream-back" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.55" />
                <stop offset="25%" stopColor="#FB7185" stopOpacity="0.5" />
                <stop offset="55%" stopColor="#D946EF" stopOpacity="0.45" />
                <stop offset="80%" stopColor="#8B5CF6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d="M 1440,0 C 1200,80 1000,240 920,440 C 840,640 680,780 400,850 C 200,890 0,900 0,900 L 1440,900 Z"
              fill="url(#aurora-stream-back)"
            />
          </svg>
        </div>

        {/* Content Container (z-10) */}
        <div className="container-clean relative z-10 flex flex-col gap-5 sm:gap-6 md:gap-7">
          
          {/* Top Command Bar: Dual Ribbon for Design 2, Single Alert for Design 1 */}
          {isDesign2 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs w-full">
              <Link 
                to="/programs/community-resource-center" 
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 hover:bg-white border border-purple-200/90 font-bold text-[#5A1E65] shadow-xs hover:border-purple-400 transition-colors"
                title="View Community Resource Center hours and free clinical services"
              >
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>{sanctuaryStatus.statusText}</span>
              </Link>

              <div className="hidden sm:inline-flex items-center gap-2 text-slate-700 bg-white/90 px-4 py-1.5 rounded-full border border-purple-200/70 text-xs font-semibold shadow-2xs">
                <Phone className="w-3.5 h-3.5 text-purple-700" />
                <span>Helpline: <strong className="text-purple-900">(805) 644-5428</strong> · 24/7 Crisis: <strong className="text-rose-700">Dial 988</strong></span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-start">
              <Link 
                to="/programs/community-resource-center" 
                className="group w-full max-w-2xl flex items-center justify-between gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/95 hover:bg-white border-2 border-purple-200/90 hover:border-purple-400 shadow-md shadow-purple-500/10 hover:shadow-lg transition-all"
                title="View Community Resource Center hours and free clinical services"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span className="relative flex h-3.5 w-3.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]"></span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug truncate">
                    {sanctuaryStatus.isOpenNow ? (
                      <>
                        <strong className="text-emerald-700 font-extrabold">Sanctuary Open Now</strong>{' '}
                        <span className="text-purple-300 font-bold">•</span>{' '}
                        <span className="text-slate-800 font-semibold">Mon–Fri 1:00 PM – 5:00 PM</span>{' '}
                        <span className="text-purple-300 font-bold">•</span>{' '}
                        <strong className="bg-gradient-to-r from-purple-700 via-pink-600 to-[#5A1E65] bg-clip-text text-transparent font-extrabold">Free HIV/STI Screenings</strong>
                      </>
                    ) : (
                      <>
                        <strong className="text-purple-900 font-bold">Sanctuary Open Today</strong>{' '}
                        <span className="text-purple-300 font-bold">•</span>{' '}
                        <span className="text-slate-800 font-semibold">Mon–Fri 1:00 PM – 5:00 PM</span>{' '}
                        <span className="text-purple-300 font-bold">•</span>{' '}
                        <strong className="bg-gradient-to-r from-purple-700 via-pink-600 to-[#5A1E65] bg-clip-text text-transparent font-extrabold">Free HIV/STI Screenings</strong>
                      </>
                    )}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-purple-100/80 group-hover:bg-[#5A1E65] flex items-center justify-center transition-all flex-shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-purple-800 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </div>
          )}

          {/* ==================================================================
              LAYOUT THEME B / DESIGN 2: CIVIC SANCTUARY & 3D SPOTLIGHT PATHFINDER
              - Exact reference design from media_1793970741843_38a9c6a3.jpg:
              - Eyebrow pill: "ESTABLISHED 2014 · VENTURA COUNTY 501(C)(3) NONPROFIT"
              - Bold sans "You Are", Lora serif italic warm sunset "Always Welcome" with wave underline, and "Here."
              - Authentic mission copy
              - 3 horizontal action pills: Explore Free Programs →, Visit Sanctuary, (805) 644-LGBT (5428)
              - 4-tab Instant Sanctuary Navigator with 100% Confidential badge and dynamic schedule triage
              - Right Column: 3D Spotlight Card with community photo, Portola Rd tag, Open Today, and CRC emblem footer
              ================================================================== */}
          {isDesign2 && activeThemeObj.category !== 'festival' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pb-8 sm:pb-12 z-10">
              
              {/* Left Column: Eyebrow + Headline + Copy + 3 CTAs + Instant Sanctuary Navigator */}
              <div className="lg:col-span-7 flex flex-col gap-6 z-10">
                <div className="flex flex-col gap-3 sm:gap-3.5">
                  <span className="inline-flex items-center text-[11px] sm:text-xs font-bold text-[#5A1E65] py-1 px-3.5 bg-purple-50/95 border border-purple-200/90 rounded-full shadow-2xs self-start">
                    ESTABLISHED 2014 · VENTURA COUNTY 501(C)(3) NONPROFIT
                  </span>

                  <h1 className="font-display text-4xl sm:text-6xl md:text-7xl xl:text-[5.15rem] font-black tracking-tight text-slate-950 leading-[1.08] sm:leading-[1.04]">
                    <span className="block">You Are</span>
                    <span className="block mt-1 sm:mt-1.5">
                      <span className="font-serif italic font-semibold tracking-[-0.015em] bg-gradient-to-r from-[#4A0E4E] via-[#8B1A8F] via-[#D91B5C] via-[#E11D48] via-[#EA580C] via-[#F97316] to-[#F59E0B] bg-clip-text text-transparent relative inline-block mr-2.5 sm:mr-3.5 pb-1 sm:pb-1.5">
                        Always Welcome
                        <svg 
                          className="absolute -bottom-1 sm:-bottom-1.5 left-0 w-full h-2 sm:h-3 overflow-visible pointer-events-none" 
                          viewBox="0 0 100 8" 
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient id="headline-bend-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#C026D3" stopOpacity="0.9" />
                              <stop offset="28%" stopColor="#E11D48" stopOpacity="0.95" />
                              <stop offset="70%" stopColor="#F97316" stopOpacity="0.9" />
                              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.85" />
                            </linearGradient>
                          </defs>
                          <path 
                            d="M 1 2 Q 50 7, 99 2" 
                            stroke="url(#headline-bend-gradient-2)" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            fill="none" 
                          />
                        </svg>
                      </span>
                      <span className="font-display font-black text-slate-950 inline-block">Here.</span>
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed font-normal max-w-xl pt-0.5">
                    Diversity Collective is Ventura County's premier cultural sanctuary and clinical wellness home — delivering free rapid health testing, youth peer programs, mutual aid, and intersectional advocacy across all 10 county cities.
                  </p>
                </div>

                {/* 3 Action Buttons (Horizontal layout matching reference mockup) */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link 
                    to="/programs" 
                    className="inline-flex items-center justify-center gap-2 text-sm font-extrabold text-white bg-gradient-to-r from-[#5A1E65] via-purple-700 to-indigo-600 hover:from-purple-900 hover:to-indigo-700 py-3 sm:py-3.5 px-6 sm:px-7 rounded-full shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Explore Free Programs</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link 
                    to="/contact" 
                    className="inline-flex items-center justify-center gap-2 text-sm font-extrabold text-slate-800 bg-white hover:bg-purple-50/50 py-3 sm:py-3.5 px-5 sm:px-6 rounded-full border-2 border-purple-200/90 shadow-2xs hover:shadow-sm hover:border-purple-400 transition-all"
                  >
                    <MapPin className="w-4 h-4 text-[#5A1E65]" />
                    <span>Visit Sanctuary</span>
                  </Link>

                  <a
                    href={`tel:${orgInfo.phone.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center justify-center gap-2 text-sm font-extrabold text-slate-800 bg-white hover:bg-purple-50/50 py-3 sm:py-3.5 px-5 sm:px-6 rounded-full border-2 border-purple-200/90 shadow-2xs hover:shadow-sm hover:border-purple-400 transition-all"
                  >
                    <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3 h-3 text-rose-600" />
                    </div>
                    <span>(805) 644-LGBT (5428)</span>
                  </a>
                </div>

                {/* Interactive "What Brings You In Today?" Quick Pathfinder */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-purple-100 shadow-md flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>Instant Sanctuary Navigator — What Brings You In Today?</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      100% Confidential
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setHeroService('testing')}
                      className={`p-2.5 sm:p-3 rounded-xl text-left transition-all border-2 text-xs font-semibold cursor-pointer ${
                        heroService === 'testing'
                          ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-500 text-teal-950 shadow-sm ring-2 ring-teal-400/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50/30'
                      }`}
                    >
                      <div className="font-extrabold flex items-center gap-1.5 text-teal-700">
                        <span>🩺</span> Rapid Testing
                      </div>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Diversity SHINES</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHeroService('youth')}
                      className={`p-2.5 sm:p-3 rounded-xl text-left transition-all border-2 text-xs font-semibold cursor-pointer ${
                        heroService === 'youth'
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-400/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/30'
                      }`}
                    >
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-700">
                        <span>🌈</span> Youth (13–23)
                      </div>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Rainbow Umbrella</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHeroService('hub')}
                      className={`p-2.5 sm:p-3 rounded-xl text-left transition-all border-2 text-xs font-semibold cursor-pointer ${
                        heroService === 'hub'
                          ? 'bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-500 text-purple-950 shadow-sm ring-2 ring-purple-400/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/30'
                      }`}
                    >
                      <div className="font-extrabold flex items-center gap-1.5 text-purple-700">
                        <span>📚</span> Drop-In Hub
                      </div>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Library & Lounge</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHeroService('give')}
                      className={`p-2.5 sm:p-3 rounded-xl text-left transition-all border-2 text-xs font-semibold cursor-pointer ${
                        heroService === 'give'
                          ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-500 text-rose-950 shadow-sm ring-2 ring-rose-400/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50/30'
                      }`}
                    >
                      <div className="font-extrabold flex items-center gap-1.5 text-rose-700">
                        <span>❤️</span> Give or Join
                      </div>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5">501(c)(3) Support</span>
                    </button>
                  </div>

                  {/* Dynamic Triage Message Row */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    {heroService === 'testing' && (
                      <>
                        <span className="text-slate-700">
                          <strong className="text-teal-900">Diversity SHINES:</strong> Free, confidential rapid HIV & Hepatitis C testing with immediate results. Walk-ins Mon–Fri 1–5 PM.
                        </span>
                        <Link to="/programs/diversity-shines" className="font-extrabold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 whitespace-nowrap">
                          <span>View Testing Hours</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}
                    {heroService === 'youth' && (
                      <>
                        <span className="text-slate-700">
                          <strong className="text-amber-900">Rainbow Umbrella:</strong> Safe, affirming weekly peer circles, youth mentorship, and creative arts for ages 13–23 every Friday 5:30–7:30 PM.
                        </span>
                        <Link to="/programs/rainbow-umbrella" className="font-extrabold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 whitespace-nowrap">
                          <span>Join Youth Circle</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}
                    {heroService === 'hub' && (
                      <>
                        <span className="text-slate-700">
                          <strong className="text-purple-900">Community Resource Center:</strong> Safe harbor, lending library, free computer workstations, gender-affirming closet, and peer care.
                        </span>
                        <Link to="/programs/community-resource-center" className="font-extrabold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 whitespace-nowrap">
                          <span>Explore Center</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}
                    {heroService === 'give' && (
                      <>
                        <span className="text-slate-700">
                          <strong className="text-rose-900">Community Support:</strong> 100% of tax-deductible gifts directly fund free local screenings, youth programs, and community safety.
                        </span>
                        <Link to="/donate" className="font-extrabold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 whitespace-nowrap">
                          <span>Support Our Mission</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Layer 3D Card Spotlight Visual */}
              <div className="lg:col-span-5 relative perspective-1000 preserve-3d">
                <div 
                  className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-rose-500 via-amber-400 to-teal-500 rounded-3xl blur-2xl opacity-35 pointer-events-none" 
                  aria-hidden="true" 
                />

                <CardSpotlight 
                  className="glass-card rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-2xl border-2 border-purple-200/90 relative"
                  tilt={true}
                  maxTilt={6}
                  glare={true}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
                    
                    {/* Floating In-Frame Physical Location Tag */}
                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-white text-xs pointer-events-none">
                      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                        <MapPin className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                        <span className="font-semibold text-white drop-shadow-md text-[11px] sm:text-xs">2471 Portola Road, Suite 100, Ventura</span>
                      </div>
                      <span className="text-emerald-300 drop-shadow-md font-bold text-[11px] bg-emerald-950/85 px-2.5 py-1 rounded-full border border-emerald-400/50 shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
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
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                          Community Resource Center
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Physical safe harbor & clinical navigation
                        </p>
                      </div>
                    </div>
                    <Link 
                      to="/programs/community-resource-center" 
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#5A1E65] hover:text-purple-700 p-2 hover:bg-purple-50 rounded-lg transition-colors group/link"
                    >
                      <span>About Us</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                </CardSpotlight>
              </div>
            </div>
          )}

          {/* ==================================================================
              LAYOUT THEME A / DESIGN 1: FLAGSHIP AURORA SANCTUARY (Vibrant & Eye-Catchy)
              - Serif Fraunces headline + Living rainbow gradient "Always"
              - Strictly ZERO orange cursive text per user instruction
              - Authentic site photography (/images/volunteers.jpg)
              - 3 full-width / rounded-full stacked action pills with vibrant gradients
              - Single unified flowing full-bleed aurora ribbon wave crossing from back to break line
              ================================================================== */}
          {!isDesign2 && activeThemeObj.category !== 'festival' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center">
              
              {/* Left Column: Eyebrow + Headline + Copy + 3 Stacked Action Pills */}
              <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center gap-5 sm:gap-6 z-10 pb-6 sm:pb-8 lg:pb-12">
                <div className="flex flex-col gap-2.5 sm:gap-3.5">
                  
                  {/* Authentic Unboxed Eyebrow Typography Matching Reference Mockup */}
                  <div className="text-[10.5px] sm:text-xs font-black uppercase tracking-[0.22em] text-slate-800/90 self-start">
                    ESTABLISHED 2014 • VENTURA COUNTY 501(C)(3) NONPROFIT
                  </div>

                  {/* Editorial Headline: Bold Sans "You Are", Enhanced Italic Serif Gradient "Always Welcome" with Gentle Curved Bend Underline, and Bold Sans "Here." */}
                  <h1 className="font-display text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-[4.25rem] xl:text-[4.85rem] font-black tracking-tight text-slate-950 leading-[1.08] sm:leading-[1.04]">
                    <span className="block">You Are</span>
                    <span className="block mt-1 sm:mt-1.5">
                      <span className="font-serif italic font-semibold tracking-[-0.015em] bg-gradient-to-r from-[#4A0E4E] via-[#8B1A8F] via-[#D91B5C] via-[#E11D48] via-[#EA580C] via-[#F97316] to-[#F59E0B] bg-clip-text text-transparent relative inline-block mr-2.5 sm:mr-3.5 pb-1 sm:pb-1.5">
                        Always Welcome
                        <svg 
                          className="absolute -bottom-1 sm:-bottom-1.5 left-0 w-full h-2 sm:h-3 overflow-visible pointer-events-none" 
                          viewBox="0 0 100 8" 
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient id="headline-bend-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#C026D3" stopOpacity="0.9" />
                              <stop offset="28%" stopColor="#E11D48" stopOpacity="0.95" />
                              <stop offset="70%" stopColor="#F97316" stopOpacity="0.9" />
                              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.85" />
                            </linearGradient>
                          </defs>
                          <path 
                            d="M 1 2 Q 50 7, 99 2" 
                            stroke="url(#headline-bend-gradient-1)" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            fill="none" 
                          />
                        </svg>
                      </span>
                      <span className="font-display font-black text-slate-950 inline-block">Here.</span>
                    </span>
                  </h1>

                  {/* Verified Non-AI Authentic DCVC Mission Copy with Highlighted Accents */}
                  <p className="text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed font-normal max-w-xl pt-0.5">
                    Diversity Collective is Ventura County's premier cultural sanctuary and clinical wellness home — delivering <span className="font-bold text-[#5A1E65]">free rapid health testing</span>, <span className="font-bold text-rose-700">youth peer programs</span>, <span className="font-bold text-amber-700">mutual aid</span>, and intersectional advocacy across all 10 county cities.
                  </p>
                </div>

                {/* 3 Action Pill Buttons (Stacked with Rich Gradients & High Contrast, Safe Z-Index) */}
                <div className="flex flex-col gap-3 w-full sm:max-w-md pt-1 relative z-30">
                  {/* 1. Primary CTA - Explore Free Programs */}
                  <Link 
                    to="/programs" 
                    className="w-full inline-flex items-center justify-center gap-2.5 text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-[#5A1E65] via-[#8B1A8F] via-[#C026D3] to-[#7C3AED] hover:from-[#4A0E4F] hover:to-[#6D28D9] active:scale-[0.99] py-3.5 sm:py-4 px-7 rounded-full shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-700/40 hover:scale-[1.01] transition-all text-center group btn-shimmer"
                  >
                    <span>Explore Free Programs</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </Link>

                  {/* 2. Secondary CTA - Visit Sanctuary */}
                  <Link 
                    to="/contact" 
                    className="w-full inline-flex items-center justify-center gap-2.5 text-sm sm:text-base font-extrabold text-slate-800 bg-white/95 hover:bg-white active:scale-[0.99] py-3.5 px-6 rounded-full border-2 border-purple-200/90 hover:border-purple-400 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all text-center group"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-[#5A1E65]" />
                    </div>
                    <span>Visit Sanctuary</span>
                  </Link>

                  {/* 3. Tertiary CTA - Direct Phone Call */}
                  <a
                    href={`tel:${orgInfo.phone.replace(/[^0-9]/g, '')}`}
                    className="w-full inline-flex items-center justify-center gap-2.5 text-sm sm:text-base font-extrabold text-slate-800 bg-white/95 hover:bg-white active:scale-[0.99] py-3.5 px-6 rounded-full border-2 border-purple-200/90 hover:border-purple-400 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all text-center group"
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 text-rose-700" />
                    </div>
                    <span>(805) 644-LGBT (5428)</span>
                  </a>
                </div>

              </div>

              {/* Right Column: Authentic Site Community Showcase */}
              <div className="lg:col-span-5 xl:col-span-6 relative flex flex-col justify-center">
                
                {/* Image Container with Organic Rounded Frame & Radiant Glow */}
                <div className="relative z-10 w-full select-none">
                  
                  {/* Radiant Glow Atmosphere around Image Frame */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/25 via-pink-400/25 to-amber-300/30 blur-2xl pointer-events-none rounded-3xl" />

                  <div className="relative w-full rounded-3xl sm:rounded-[2.25rem] overflow-hidden bg-slate-100 shadow-xl border-2 border-white/80 group">
                    
                    {/* Authentic Site Photography from diversitycollectivevc.org */}
                    <img 
                      src="/images/volunteers.jpg"
                      alt="Diversity Collective Ventura County community volunteers"
                      className="w-full h-full min-h-[280px] sm:min-h-[360px] lg:min-h-[440px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      onError={(e) => {
                        e.target.src = "/images/community-gathering.jpg";
                      }}
                    />

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==================================================================
              LAYOUT THEME B: US LGBTQ+ FESTIVAL HERO (When activeTheme is a Festival)
              Specialized event themes: Pride Month, Transgender Visibility,
              Spirit Day, National Coming Out Day, World AIDS Day, etc.
              ================================================================== */}
          {activeThemeObj.category === 'festival' && (
            <div className="relative flex flex-col gap-6">
              <AnimatedFestivalAtmosphere themeId={activeThemeId} />
              {/* Festival Calendar Event Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900 text-white text-xs font-bold shadow-md">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>{activeThemeObj.badge}</span>
                  <span className="text-purple-300">•</span>
                  <span className="text-purple-200 font-medium">{activeThemeObj.eventDates}</span>
                </div>
                <button
                  onClick={(e) => triggerMilestoneConfetti(e)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-[#5A1E65] bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-full transition-all cursor-pointer shadow-2xs"
                  title="Celebrate this community milestone with confetti!"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Celebrate Event 🎉</span>
                </button>
              </div>

              {/* Festival Headline & Callout */}
              <div className="max-w-3xl flex flex-col gap-3">
                <span className="text-xs font-extrabold tracking-[0.2em] text-[#5A1E65] uppercase block">
                  SPECIAL EVENT SEASON · VENTURA COUNTY 501(C)(3) NONPROFIT
                </span>
                <h1 className="font-fraunces text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-950 leading-[1.1]">
                  {activeThemeObj.headline}
                </h1>
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal pt-1">
                  {activeThemeObj.description}
                </p>
              </div>

              {/* Festival CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/events"
                  className="btn-primary py-3 px-7 text-sm font-bold shadow-md flex items-center gap-2 group"
                >
                  <span>View Event Calendar & Schedules</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/volunteer"
                  className="btn-secondary py-3 px-6 text-sm font-bold bg-white flex items-center gap-2"
                >
                  <span>Volunteer at Event</span>
                </Link>
                <Link
                  to="/donate"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-950 bg-[#FDE047] hover:bg-[#FACC15] rounded-full border border-amber-300 shadow-sm transition-all"
                >
                  <Heart className="w-4 h-4 fill-current text-slate-950" />
                  <span>Support Event Fund</span>
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* ====================================================================
            FULL-BLEED FOREGROUND WAVE CROSSOVER EXTENDING FLUSH TO BREAK LINE (DESIGN 1)
            - Sweeps across the bottom of the photo frame from left to right.
            - Saturated, high-contrast, rich Pride gradients with white luminous crest.
            - Connects seamlessly with ZERO gaps directly to the first break line.
            ==================================================================== */}
        {!isDesign2 && activeThemeObj.category !== 'festival' && (
          <div className="relative w-full -mt-6 sm:-mt-8 md:-mt-10 lg:-mt-12 pointer-events-none z-10 overflow-hidden leading-none select-none">
            <svg 
              className="w-full h-24 sm:h-32 md:h-44 lg:h-52 block filter drop-shadow-[0_-8px_18px_rgba(217,70,239,0.28)]" 
              viewBox="0 0 1440 220" 
              fill="none" 
              preserveAspectRatio="none"
            >
              <defs>
                {/* Wave Ribbon 1: Amber Gold to Sunset Rose */}
                <linearGradient id="vibrant-wave-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#FB7185" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#C084FC" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.65" />
                </linearGradient>

                {/* Wave Ribbon 2: Saturated Magenta to Ultraviolet (Main Crest) */}
                <linearGradient id="vibrant-wave-magenta" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E11D48" stopOpacity="0.9" />
                  <stop offset="30%" stopColor="#EC4899" stopOpacity="0.88" />
                  <stop offset="65%" stopColor="#A855F7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
                </linearGradient>

                {/* Wave Ribbon 3: Oceanic Emerald to Coastal Cyan */}
                <linearGradient id="vibrant-wave-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#06B6D4" stopOpacity="0.82" />
                  <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.82" />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.75" />
                </linearGradient>
              </defs>

              {/* Ribbon 1: Golden Amber base flowing edge-to-edge (Guaranteed low on left for 100% button clearance) */}
              <path
                d="M 0,210 C 300,210 580,200 750,150 C 950,95 1180,75 1440,105 L 1440,220 L 0,220 Z"
                fill="url(#vibrant-wave-amber)"
              />

              {/* Ribbon 2: Saturated Magenta crest sweeping over photo with luminous white stroke */}
              <g className="animate-ribbon-undulate">
                <path
                  d="M 0,200 C 300,200 560,185 740,125 C 920,68 1160,50 1440,80 L 1440,220 L 0,220 Z"
                  fill="url(#vibrant-wave-magenta)"
                />
                <path
                  d="M 0,200 C 300,200 560,185 740,125 C 920,68 1160,50 1440,80"
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* Ribbon 3: Oceanic Cyan & Emerald with flowing highlight */}
              <g className="animate-ribbon-wave-slow">
                <path
                  d="M 0,212 C 320,212 590,205 770,145 C 960,88 1200,68 1440,95 L 1440,220 L 0,220 Z"
                  fill="url(#vibrant-wave-cyan)"
                />
                <path
                  d="M 0,212 C 320,212 590,205 770,145 C 960,88 1200,68 1440,95"
                  stroke="rgba(255, 255, 255, 0.85)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            </svg>
          </div>
        )}

        {/* ====================================================================
            4-PILLAR ACCENT STRIP: PEOPLE • SAFETY • WELLNESS • OPPORTUNITY
            Grounded cleanly right at the first break line.
            Matches reference design: clean outline icons + uppercase tracking labels.
            ==================================================================== */}
        <div className="w-full border-t border-purple-200/90 bg-white/70 backdrop-blur-xs relative z-30">
          <div className="container-clean py-3.5 sm:py-4">
            <div className="grid grid-cols-4 divide-x divide-purple-200/80 text-center">
              
              {/* Pillar 1: PEOPLE */}
              <Link 
                to="/community" 
                className="pillar-card group flex flex-col items-center justify-center gap-1.5 py-1.5 px-1 sm:px-4 hover:bg-purple-50/80 rounded-xl transition-all cursor-pointer"
                title="People — Affirming community circles & peer gatherings"
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#5A1E65] stroke-[1.8] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[#5A1E65] group-hover:text-purple-900 transition-colors">
                  PEOPLE
                </span>
              </Link>

              {/* Pillar 2: SAFETY */}
              <Link 
                to="/programs/community-resource-center" 
                className="pillar-card group flex flex-col items-center justify-center gap-1.5 py-1.5 px-1 sm:px-4 hover:bg-sky-50/80 rounded-xl transition-all cursor-pointer"
                title="Safety — Cultural sanctuary, crisis navigation & drop-in safe harbor"
              >
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-sky-700 stroke-[1.8] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] text-sky-900 group-hover:text-sky-700 transition-colors">
                  SAFETY
                </span>
              </Link>

              {/* Pillar 3: WELLNESS */}
              <Link 
                to="/programs/diversity-shines" 
                className="pillar-card group flex flex-col items-center justify-center gap-1.5 py-1.5 px-1 sm:px-4 hover:bg-emerald-50/80 rounded-xl transition-all cursor-pointer"
                title="Wellness — Diversity SHINES free rapid health testing & mental health"
              >
                <LotusIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 stroke-[1.8] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] text-emerald-900 group-hover:text-emerald-700 transition-colors">
                  WELLNESS
                </span>
              </Link>

              {/* Pillar 4: OPPORTUNITY */}
              <Link 
                to="/donate" 
                className="pillar-card group flex flex-col items-center justify-center gap-1.5 py-1.5 px-1 sm:px-4 hover:bg-rose-50/80 rounded-xl transition-all cursor-pointer"
                title="Opportunity — Mutual aid, youth leadership & community giving"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-700 stroke-[1.8] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] text-rose-900 group-hover:text-rose-700 transition-colors">
                  OPPORTUNITY
                </span>
              </Link>

            </div>
          </div>
        </div>

        {/* Civic Alliances & Public Health Logos Container */}
        <div className="container-clean relative z-10 pb-6 sm:pb-8">

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
                Official Ventura County Agency & Public Health Partners
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-2">
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

              {/* Partner 4: Little Unicorns */}
              <Link 
                to="/programs" 
                className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white shadow-sm hover:shadow-2xl border-2 border-slate-200/90 hover:border-[#5A1E65] transition-all interactive-card-3d cursor-pointer relative overflow-hidden"
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
      <section className="py-14 md:py-20 bg-gradient-to-b from-purple-100/40 via-teal-100/30 to-amber-100/30 border-b border-purple-200/60 relative overflow-hidden">
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
                  className={`${stat.cardTheme} p-6 md:p-8 ${stat.glowClass} interactive-card-3d relative overflow-hidden`}
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
          LGBTQ+ AFFIRMING BUSINESS DIRECTORY SPOTLIGHT
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-white border-b border-slate-100">
        <div className="container-clean">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
                VENTURA COUNTY AFFIRMING NETWORK
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Shop, Dine & Connect Safely.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                Discover verified LGBTQ+ owned and affirming businesses across Ventura, Oxnard, Ojai, Camarillo, and the Conejo Valley.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/directory" className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                <span>Browse Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/directory/submit" className="btn-secondary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-1.5 bg-white">
                <span>Submit Your Business</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {businessDirectorySeed.slice(0, 3).map((biz) => (
              <div key={biz.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-purple-300 transition-all shadow-xs hover:shadow-lg flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                      {biz.category}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{biz.city}</span>
                  </div>
                  <h3 className="font-display text-xl font-black text-slate-900">{biz.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">{biz.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Affirming Vetted</span>
                  </span>
                  <Link to={`/directory/${biz.slug}`} className="text-[#5A1E65] font-black hover:underline inline-flex items-center gap-1">
                    <span>View Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          PROGRAMS DIRECTORY: COLLISION-PROOF EXPANDABLE CARDS
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-gradient-to-b from-amber-100/30 via-rose-100/30 to-purple-100/40 border-b border-purple-200/60 relative overflow-hidden">
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

          {/* Clean Category Tabs with Vibrant Active Gradients */}
          <div className="flex flex-wrap items-center gap-2.5 my-6">
            {programCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-[#5A1E65] via-purple-700 to-indigo-600 text-white shadow-md shadow-purple-500/25 scale-[1.03]'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/60 shadow-2xs'
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
              
              // Dynamic jewel-toned card themes & badge colors
              let cardTheme = "card-vibrant-purple";
              let audienceBadgeColor = "text-purple-900 bg-purple-100 border-purple-300";
              if (program.slug === 'little-unicorns') {
                cardTheme = "card-vibrant-rose";
                audienceBadgeColor = "text-rose-900 bg-rose-100 border-rose-300";
              }
              if (program.slug === 'diversity-shines') {
                cardTheme = "card-vibrant-teal";
                audienceBadgeColor = "text-teal-900 bg-teal-100 border-teal-300";
              }
              if (program.slug === 'rainbow-umbrella') {
                cardTheme = "card-vibrant-amber";
                audienceBadgeColor = "text-amber-900 bg-amber-100 border-amber-300";
              }
              if (program.slug === 'community-resource-center') {
                cardTheme = "card-vibrant-indigo";
                audienceBadgeColor = "text-indigo-900 bg-indigo-100 border-indigo-300";
              }

              return (
                <CardSpotlight 
                  key={program.slug}
                  className={`${cardTheme} overflow-hidden flex flex-col justify-between interactive-card-3d shadow-md hover:shadow-2xl`}
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
      <section className="py-14 md:py-20 bg-gradient-to-b from-purple-100/40 via-indigo-100/30 to-teal-100/30 border-b border-purple-200/60 relative overflow-hidden">
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
          FLAGSHIP COMMUNITY RESOURCE CENTER & SANCTUARY
          ==================================================================== */}
      <section className="py-14 md:py-20 bg-gradient-to-b from-teal-100/30 via-purple-100/40 to-amber-100/30 border-b border-purple-200/60 relative overflow-hidden">
        <div className="container-clean">
          <div className="p-8 sm:p-12 rounded-3xl bg-white/95 border-2 border-purple-200/80 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
                PHYSICAL SANCTUARY · DROP-IN HUB
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Our Community Resource Center in Ventura
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                Located at 2471 Portola Road, Suite 100 in Ventura, our Center is the cultural and wellness hub of LGBTQ+ Ventura County. Stop in during weekday hours for computer and printing access, lending library browsing, safer-sex supplies, or confidential peer support.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#5A1E65]" />
                  <span>Mon–Fri 1:00 PM – 5:00 PM</span>
                </div>
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#5A1E65]" />
                  <span>Helpline: (805) 644-5428</span>
                </div>
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link to="/contact" className="btn-primary py-2.5 px-6 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                  <span>Plan Your Visit & Directions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href={orgInfo.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-1.5 bg-white"
                >
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>Google Maps</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3]">
              <img
                src="/images/crc-building.jpg"
                alt="Diversity Collective Community Resource Center Building"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          HIGHLY EYE-CATCHING & BEAUTIFUL GIVING STUDIO (Addressing User Feedback)
          ==================================================================== */}
      <section id="giving" className="py-16 md:py-24 bg-gradient-to-b from-amber-100/30 via-purple-100/50 to-purple-950/25 border-b border-purple-200/60 relative overflow-hidden">
        
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
              <div className="lg:col-span-5 p-5 xs:p-6 sm:p-10 bg-gradient-to-br from-slate-950 via-[#33083F] to-slate-950 text-white flex flex-col justify-between gap-6 sm:gap-8 relative overflow-hidden preserve-3d">
                
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
                    <div className="font-display text-3xl sm:text-5xl font-black text-white flex items-baseline gap-2">
                      <span className="text-amber-300">${customDonation ? customDonation : selectedDonationTier}</span>
                      {donationFreq === 'monthly' && <span className="text-sm font-semibold text-purple-200">/ month</span>}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col gap-2 shadow-inner">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-300 flex-shrink-0" />
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
                <div className="flex flex-col gap-3 relative z-10 w-full">
                  <a
                    href={orgInfo.donationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={triggerMilestoneConfetti}
                    className="w-full py-3.5 sm:py-4 px-4 sm:px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-xs sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_30px_-5px_rgba(245,158,11,0.45)] hover:shadow-[0_16px_40px_-5px_rgba(245,158,11,0.6)] hover:scale-102 transition-all cursor-pointer text-center"
                  >
                    <Heart className="w-4 h-4 fill-current text-rose-700 animate-bounce flex-shrink-0" />
                    <span>Complete ${customDonation ? customDonation : selectedDonationTier} Gift Online</span>
                    <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                  </a>
                  <p className="text-[10px] xs:text-[11px] text-center text-slate-300 flex items-center justify-center gap-1.5 font-medium flex-wrap">
                    <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
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
      <section className="py-14 md:py-20 bg-gradient-to-b from-purple-100/40 via-rose-100/30 to-amber-100/30 border-b border-purple-200/60 relative overflow-hidden">
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

          {/* Filter Pills with Vibrant Active State */}
          <div className="flex flex-wrap items-center gap-2.5 my-6">
            {eventCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedEventCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedEventCategory === cat.id
                    ? 'bg-gradient-to-r from-[#5A1E65] to-purple-700 text-white shadow-md shadow-purple-500/20 scale-[1.03]'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/60 shadow-2xs'
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
                'from-purple-800 via-[#5A1E65] to-indigo-900 text-white shadow-purple-500/25',
                'from-amber-500 via-orange-500 to-rose-600 text-white shadow-amber-500/25',
                'from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-teal-500/25',
                'from-rose-600 via-pink-600 to-purple-800 text-white shadow-rose-500/25'
              ];

              let catBadge = "text-purple-800 bg-purple-100/70 border-purple-200";
              if (evt.category?.toLowerCase().includes('youth')) catBadge = "text-amber-800 bg-amber-100/70 border-amber-200";
              if (evt.category?.toLowerCase().includes('health')) catBadge = "text-teal-800 bg-teal-100/70 border-teal-200";
              if (evt.category?.toLowerCase().includes('pride') || evt.category?.toLowerCase().includes('gala')) catBadge = "text-rose-800 bg-rose-100/70 border-rose-200";

              return (
                <CardSpotlight
                  key={evt.id}
                  className="card-vibrant-purple p-5 sm:p-6 md:p-7 interactive-card-3d shadow-sm hover:shadow-xl"
                  tilt={true}
                  maxTilt={4}
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
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${catBadge}`}>
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
      <section className="py-14 md:py-20 bg-gradient-to-b from-amber-100/30 via-purple-100/40 to-indigo-100/35 border-b border-purple-200/60 relative overflow-hidden">
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
              className="card-vibrant-purple p-6 md:p-8 flex flex-col justify-between gap-5 interactive-card-3d glow-amethyst"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif text-[#5A1E65] leading-none">“</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">Youth Voice</span>
              </div>
              <p className="font-serif italic text-sm md:text-base text-slate-800 leading-relaxed">
                "Rainbow Umbrella gave our teenager the first space where they felt completely accepted and understood. It changed our family's life."
              </p>
              <div className="pt-3 border-t border-purple-100 flex items-center gap-3">
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
              className="card-vibrant-amber p-6 md:p-8 flex flex-col justify-between gap-5 interactive-card-3d glow-amber"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif text-amber-600 leading-none">“</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">Parent Voice</span>
              </div>
              <p className="font-serif italic text-sm md:text-base text-slate-800 leading-relaxed">
                "Having a physical Community Resource Center right here in Portola Road gives our families a trusted place to find healthcare navigation, peer support, and affirming community."
              </p>
              <div className="pt-3 border-t border-amber-100 flex items-center gap-3">
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
              className="card-vibrant-teal p-6 md:p-8 flex flex-col justify-between gap-5 interactive-card-3d glow-teal"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif text-teal-700 leading-none">“</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-300">Volunteer Voice</span>
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
          NEWSLETTER SIGNUP DISPATCH
          ==================================================================== */}
      <section className="py-12 bg-white">
        <div className="container-clean">
          <NewsletterSignup />
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
            <Link
              to="/donate"
              className="py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_30px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_15px_40px_-5px_rgba(245,158,11,0.7)] hover:scale-103 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-current text-rose-700 animate-bounce" />
              <span>Make a Community Gift Online</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/volunteer"
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
