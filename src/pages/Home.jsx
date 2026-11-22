import React, { useState, useEffect, useMemo } from 'react';
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
  communityGroups,
  liveEvents,
  annualSignatureEvents,
  specialEngagements,
  sponsorsList,
  businessDirectorySeed 
} from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import AnimatedCounter from '../components/AnimatedCounter';
import CardSpotlight from '../components/CardSpotlight';
import AutoSlideImage from '../components/AutoSlideImage.jsx';
import NewsletterSignup from '../components/NewsletterSignup';
import ImpactAutoPopups from '../components/ImpactAutoPopups';
import HomeCalendarSection from '../components/HomeCalendarSection';
import UpcomingWeekSection from '../components/UpcomingWeekSection';
import FlexSpaceBookingSection from '../components/FlexSpaceBookingSection';
import { usePageMeta } from '../utils/seo';
import {
  getActiveHeroTheme,
  subscribeToHeroTheme
} from '../services/heroThemeStore';
import HeroShowcase from '../components/HeroShowcase';
import MobileCarousel from '../components/MobileCarousel.jsx';
import { DEFAULT_PAGE_BLOCKS, upgradeOrNormalizePageLayout } from '../data/siteDefaults';
import { parseEventDate, getLocalizedMonthAbbr, isUpcomingEvent } from '../utils/eventDates';
import { translationService } from '../services/translationService';

export default function Home() {
  usePageMeta({
    title: 'You Are Welcome Here',
    description: 'Diversity Collective Ventura County is a 501(c)(3) nonprofit providing advocacy, visibility, safety, and wellness for the LGBTQ+ community throughout Ventura County.',
    canonicalPath: '/'
  });

  const [currentLang, setCurrentLang] = useState(() => translationService.getLanguage?.() || 'en');

  useEffect(() => {
    return translationService.subscribe((lang) => setCurrentLang(lang));
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDonationTier, setSelectedDonationTier] = useState(50);
  const [donationFreq, setDonationFreq] = useState('once');
  const [customDonation, setCustomDonation] = useState('');
  const [selectedEventCategory, setSelectedEventCategory] = useState('all');
  const [cmsPrograms, setCmsPrograms] = useState(() => cmsStore.getPrograms() || programsList);
  const [cmsEvents, setCmsEvents] = useState(() => cmsStore.getEvents() || liveEvents);
  const [cmsSponsors, setCmsSponsors] = useState(() => cmsStore.getSponsors() || sponsorsList);
  const [cmsSettings, setCmsSettings] = useState(() => cmsStore.getSettings() || orgInfo);
  const [activeThemeId, setActiveThemeId] = useState(getActiveHeroTheme);

  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      setCmsPrograms(cmsStore.getPrograms());
      setCmsEvents(cmsStore.getEvents());
      setCmsSponsors(cmsStore.getSponsors());
      setCmsSettings(cmsStore.getSettings());
    });
    return unsubscribe;
  }, []);
  const readStoredLayoutBlocks = () => {
    if (typeof window === 'undefined') return DEFAULT_PAGE_BLOCKS;
    try {
      const stored = localStorage.getItem('dcvc_admin_custom_layout');
      if (!stored) return DEFAULT_PAGE_BLOCKS;
      const upgraded = upgradeOrNormalizePageLayout(JSON.parse(stored));
      if (stored.includes('anctuary')) {
        try {
          localStorage.setItem('dcvc_admin_custom_layout', JSON.stringify(upgraded));
        } catch {}
      }
      return upgraded;
    } catch {
      return DEFAULT_PAGE_BLOCKS;
    }
  };

  const [customLayoutBlocks, setCustomLayoutBlocks] = useState(readStoredLayoutBlocks);

  const customHeroProps = (() => {
    const heroBlock = (customLayoutBlocks || []).find(
      (b) => b.type === 'hero_banner' && b.enabled !== false
    );
    return heroBlock?.props || null;
  })();

  useEffect(() => {
    const handleLayoutUpdate = (e) => {
      if (e?.detail?.blocks) {
        setCustomLayoutBlocks(upgradeOrNormalizePageLayout(e.detail.blocks));
      } else {
        setCustomLayoutBlocks(readStoredLayoutBlocks());
      }
    };
    window.addEventListener('storage', handleLayoutUpdate);
    window.addEventListener('dcvc_layout_updated', handleLayoutUpdate);
    return () => {
      window.removeEventListener('storage', handleLayoutUpdate);
      window.removeEventListener('dcvc_layout_updated', handleLayoutUpdate);
    };
  }, []);

  const [previewViewport, setPreviewViewport] = useState(() => {
    if (typeof window === 'undefined') return undefined;
    return new URLSearchParams(window.location.search).get('viewport') || undefined;
  });

  // Real-time synchronization for Admin Studio Preview iframe
  useEffect(() => {
    const isPreviewFrame = typeof window !== 'undefined' && 
      (window.location.search.includes('admin_preview=1') || window !== window.parent);
    
    if (!isPreviewFrame) return undefined;

    const handlePreviewMsg = (e) => {
      const data = e.data;
      if (!data || data.type !== 'DCVC_PREVIEW_SYNC') return;

      if (data.themeId) {
        setActiveThemeId(data.themeId);
      }
      if (Array.isArray(data.blocks)) {
        setCustomLayoutBlocks(upgradeOrNormalizePageLayout(data.blocks));
      }
      if (data.viewport) {
        setPreviewViewport(data.viewport);
      }
    };

    window.addEventListener('message', handlePreviewMsg);

    // Notify parent admin studio that the preview iframe is ready
    try {
      window.parent?.postMessage({ type: 'DCVC_PREVIEW_READY' }, '*');
    } catch {}

    // In preview mode, intercept link navigation and forward block selection to parent
    const handlePreviewClick = (e) => {
      const link = e.target.closest('a');
      if (link) {
        e.preventDefault();
      }

      const sectionEl = e.target.closest('[data-block-id], header, footer, section');
      if (!sectionEl) return;

      const blockId = sectionEl.getAttribute('data-block-id') ||
        (sectionEl.tagName.toLowerCase() === 'header' ? 'block-hero' : null) ||
        (sectionEl.tagName.toLowerCase() === 'footer' ? 'block-final-cta' : null);

      if (blockId) {
        try {
          window.parent?.postMessage({ type: 'DCVC_SELECT_BLOCK', blockId }, '*');
        } catch {}
      }
    };

    document.addEventListener('click', handlePreviewClick, { capture: true });

    return () => {
      window.removeEventListener('message', handlePreviewMsg);
      document.removeEventListener('click', handlePreviewClick, { capture: true });
    };
  }, []);

  const getBlockProps = (blockType) => {
    const match = (customLayoutBlocks || []).find((b) => b.type === blockType);
    const fallback = DEFAULT_PAGE_BLOCKS.find((b) => b.type === blockType);
    return { ...(fallback?.props || {}), ...(match?.props || {}) };
  };

  const getSectionStyle = (blockType, fallbackOrder) => {
    if (!Array.isArray(customLayoutBlocks) || customLayoutBlocks.length === 0) {
      return { order: fallbackOrder * 10 };
    }
    const idx = customLayoutBlocks.findIndex((b) => b.type === blockType);
    if (idx === -1) {
      if (blockType === 'partnerships_section') {
        const eventsIdx = customLayoutBlocks.findIndex((b) => b.type === 'events_section');
        return { order: eventsIdx >= 0 ? (eventsIdx + 1) * 10 + 5 : fallbackOrder * 10 };
      }
      return { order: fallbackOrder * 10 };
    }
    if (customLayoutBlocks[idx].enabled === false) {
      return { display: 'none' };
    }
    return { order: (idx + 1) * 10 };
  };

  useEffect(() => {
    const unsubscribe = subscribeToHeroTheme((themeId) => {
      setActiveThemeId(themeId);
    });
    return unsubscribe;
  }, []);

  // Dynamic center schedule & live status
  const getCenterStatus = () => {
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
          ? "Center Open Now · Mon–Fri 1:00 PM – 5:00 PM · HIV/STI Screenings 1st Mon 3–7 PM"
          : isWeekday && hour < 13
          ? "Center Opens Today 1:00 PM · Mon–Fri 1:00 PM – 5:00 PM · HIV/STI Screenings 1st Mon 3–7 PM"
          : "Center Open Today · Mon–Fri 1:00 PM – 5:00 PM · HIV/STI Screenings 1st Mon 3–7 PM"
      };
    } catch {
      return {
        isOpenNow: true,
        isWeekday: true,
        statusText: "Center Open Today · Mon–Fri 1:00 PM – 5:00 PM · HIV/STI Screenings 1st Mon 3–7 PM"
      };
    }
  };
  const centerStatus = getCenterStatus();

  const impactPopupsProps = getBlockProps('impact_popups');
  const statsProps = getBlockProps('impact_stats');
  const upcomingWeekProps = getBlockProps('upcoming_week');
  const directoryProps = getBlockProps('directory_cta');
  const programsProps = getBlockProps('programs_section');
  const signatureEventsProps = getBlockProps('signature_events');
  const calendarProps = getBlockProps('calendar_section');
  const specialEngagementsProps = getBlockProps('special_engagements');
  const flexSpaceProps = getBlockProps('flex_space');
  const givingProps = getBlockProps('zeffy_giving');
  const eventsProps = getBlockProps('events_section');
  const partnershipsProps = getBlockProps('partnerships_section');
  const voicesProps = getBlockProps('community_voices');
  const finalCtaProps = getBlockProps('final_cta');

  const impactStats = [
    {
      value: statsProps.stat1Number || "10+",
      label: statsProps.stat1Label || "Years of Community Service",
      sub: statsProps.stat1Sub || "Defending rights and providing safe harbor in Ventura County since 2014.",
      icon: Award,
      colorClass: "gradient-text-amethyst",
      cardTheme: "card-vibrant-purple",
      borderClass: "border-purple-300 hover:border-[#5A1E65]",
      glowClass: "glow-amethyst",
      iconBg: "bg-purple-100 text-[#5A1E65]"
    },
    {
      value: statsProps.stat2Number || "5,000+",
      label: statsProps.stat2Label || "Health Screenings",
      sub: statsProps.stat2Sub || "Free, confidential HIV/STI testing and care navigation through Diversity SHINES.",
      icon: Activity,
      colorClass: "gradient-text-coastal",
      cardTheme: "card-vibrant-teal",
      borderClass: "border-teal-300 hover:border-teal-600",
      glowClass: "glow-teal",
      iconBg: "bg-teal-100 text-teal-800"
    },
    {
      value: statsProps.stat3Number || "1,200+",
      label: statsProps.stat3Label || "Youth Empowered",
      sub: statsProps.stat3Sub || "Safe peer circles, Pride Prom, and mentorship through Rainbow Umbrella.",
      icon: Users,
      colorClass: "gradient-text-sunset",
      cardTheme: "card-vibrant-amber",
      borderClass: "border-amber-300 hover:border-amber-600",
      glowClass: "glow-amber",
      iconBg: "bg-amber-100 text-amber-800"
    },
    {
      value: statsProps.stat4Number || "100%",
      label: statsProps.stat4Label || "Free & Confidential",
      sub: statsProps.stat4Sub || "No insurance or fees required. Complete privacy and affirming care for all.",
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
      title: "Community Resource Center",
      impact: "Supports public computer workstations, lending library operations, and free drop-in community hours."
    },
    {
      amount: 500,
      title: "Community Program Champion",
      impact: "Subsidizes attendance for low-income youth at the annual Youth Pride Prom and crisis support initiatives."
    }
  ];

  const allSourcePrograms = cmsPrograms || programsList;
  const findProg = (slugPart) => allSourcePrograms.find((p) => p.slug?.includes(slugPart));
  const mapGroupToCard = (item, fallbackImg, bucket) => {
    const matchedProg = allSourcePrograms.find(
      (p) => (p.slug && item.name && p.slug.includes(item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) ||
             (p.title && item.name && p.title.toLowerCase().trim() === item.name.toLowerCase().trim())
    );
    const heroImg = matchedProg?.heroImage || fallbackImg;
    const images = matchedProg?.images?.length ? matchedProg.images : [heroImg];
    return {
      slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      title: item.name,
      audience: item.ages,
      tagline: item.category,
      summary: item.description,
      schedule: item.frequency,
      location: item.location,
      heroImage: heroImg,
      images,
      programGroup: bucket,
      ctaLink: item.externalLink || item.link || '/community',
      isExternal: Boolean(item.externalLink)
    };
  };
  const findGroup = (needle, fallbackImg, bucket) => {
    const match = communityGroups.find((g) => g.name.toLowerCase().includes(needle.toLowerCase()));
    return match ? mapGroupToCard(match, fallbackImg, bucket) : null;
  };

  const inferProgramGroup = (prog) => {
    if (prog.programGroup) return prog.programGroup;
    const text = `${prog.category || ''} ${prog.audience || ''} ${prog.title || ''} ${prog.tagline || ''} ${prog.summary || ''} ${prog.slug || ''}`.toLowerCase();
    if (text.includes('youth') || text.includes('unicorn') || text.includes('umbrella') || text.includes('kid') || text.includes('teen') || text.includes('child') || text.includes('family') || text.includes('families')) {
      return 'youth';
    }
    if (text.includes('health') || text.includes('wellness') || text.includes('hiv') || text.includes('testing') || text.includes('shines') || text.includes('recovery') || text.includes('sober')) {
      return 'health';
    }
    if (text.includes('train') || text.includes('educat') || text.includes('workshop')) {
      return 'education';
    }
    return 'adults';
  };

  const mapProgramToCard = (p) => {
    const slug = p.slug || (p.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let group = p.programGroup;
    if (!group) {
      if (slug.includes('little-unicorns') || slug.includes('rainbow-umbrella')) group = 'youth';
      else if (slug.includes('diversity-shines')) group = 'health';
      else if (slug.includes('pride-training') || slug.includes('training')) group = 'education';
      else if (slug.includes('community-resource-center')) group = 'adults';
      else group = inferProgramGroup(p);
    }
    const heroImg = p.heroImage || '/images/crc-building.jpg';
    const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [heroImg];
    return {
      ...p,
      slug,
      title: p.title || 'Untitled Program',
      audience: p.audience || 'All LGBTQ+ community members and affirming allies',
      tagline: p.tagline || p.category || '',
      summary: p.summary || p.description || '',
      schedule: p.schedule || 'See program details',
      location: p.location || 'DCVC Community Resource Center',
      heroImage: heroImg,
      images,
      imageFit: p.imageFit || (slug === 'little-unicorns' || slug === 'community-resource-center' ? 'contain' : 'cover'),
      programGroup: group,
      ctaLink: p.ctaLink || `/programs/${slug}`,
      ctaText: p.ctaText || 'Learn More & Join',
      isExternal: Boolean(p.isExternal)
    };
  };

  // Official Programs matching dedicated /programs page directly from CMS
  const orderedAllPrograms = useMemo(() => {
    return (cmsPrograms || programsList)
      .filter((p) => p && p.active !== false)
      .map(mapProgramToCard);
  }, [cmsPrograms]);

  const programCategories = useMemo(() => [
    { id: 'all', label: `All Programs (${orderedAllPrograms.length})` },
    { id: 'youth', label: 'Youth & Families' },
    { id: 'adults', label: 'Adults & Community' },
    { id: 'health', label: 'Health & Wellness' },
    { id: 'education', label: 'Training & Education' }
  ], [orderedAllPrograms.length]);

  const filteredPrograms = useMemo(() => {
    if (selectedCategory === 'all') return orderedAllPrograms;
    return orderedAllPrograms.filter((program) => {
      const g = (program.programGroup || '').toLowerCase();
      const cat = (program.category || '').toLowerCase();
      const aud = (program.audience || '').toLowerCase();
      const slug = (program.slug || '').toLowerCase();

      if (selectedCategory === 'youth') {
        return g === 'youth' || cat.includes('youth') || cat.includes('kid') || aud.includes('youth') || aud.includes('9') || slug.includes('unicorns') || slug.includes('umbrella');
      }
      if (selectedCategory === 'adults') {
        return g === 'adults' || cat.includes('adult') || cat.includes('center') || aud.includes('adult') || aud.includes('all ages') || aud.includes('all lgbtq') || slug.includes('resource-center');
      }
      if (selectedCategory === 'health') {
        return g === 'health' || g === 'recovery' || cat.includes('health') || cat.includes('wellness') || cat.includes('screening') || cat.includes('recovery') || slug.includes('shines');
      }
      if (selectedCategory === 'education') {
        return g === 'education' || cat.includes('train') || cat.includes('educat') || aud.includes('educat') || slug.includes('pride-training') || slug.includes('training');
      }
      return g === selectedCategory || cat === selectedCategory;
    });
  }, [orderedAllPrograms, selectedCategory]);

  const eventCategories = useMemo(() => [
    { id: 'all', label: 'All Events' },
    { id: 'Health & Wellness', label: 'Health & Wellness' },
    { id: 'Youth', label: 'Youth' },
    { id: 'Adult Support', label: 'Adult Support' },
    { id: 'Seniors', label: 'Seniors' },
    { id: 'Professional Growth', label: 'Professional Growth' },
    { id: 'Signature Event', label: 'Signature Event' }
  ], []);

  const [showAllEvents, setShowAllEvents] = useState(false);

  const filteredEvents = useMemo(() => {
    const list = cmsEvents || liveEvents || [];
    // Strictly filter out past events so that no past events appear in upcoming gatherings
    const upcomingList = list.filter((evt) => isUpcomingEvent(evt));
    if (selectedEventCategory === 'all') return upcomingList;
    return upcomingList.filter(evt => {
      const cat = (evt.category || '').toLowerCase();
      const target = selectedEventCategory.toLowerCase();
      return cat === target || cat.includes(target) || target.includes(cat);
    });
  }, [cmsEvents, selectedEventCategory]);

  const displayedEvents = useMemo(() => {
    if (showAllEvents) return filteredEvents;
    // Exactly 2 rows of 3 columns = 6 events
    return filteredEvents.slice(0, 6);
  }, [filteredEvents, showAllEvents]);

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

  return (
    <div className="bg-transparent text-slate-800 flex flex-col w-full max-w-full overflow-x-clip">

      {/* ====================================================================
          1. IMPACT QUICK AUTO-SLIDING POP-UPS (NUMBERS ONLY)
          ==================================================================== */}
      <ImpactAutoPopups
        props={impactPopupsProps}
        style={getSectionStyle('impact_popups', 1)}
      />

      {/* ====================================================================
          2. HERO SECTION: DYNAMIC MULTI-THEME DISPATCHER (Synced with Admin Studio)
          ==================================================================== */}
      <div data-block-id="block-hero" style={getSectionStyle('hero_banner', 1)} className="w-full">
        <HeroShowcase
          themeId={activeThemeId}
          heroProps={customHeroProps}
          centerStatus={centerStatus}
          viewport={previewViewport}
          onTriggerConfetti={triggerMilestoneConfetti}
        />
      </div>

      {/* ====================================================================
          IMPACT NUMBERS: ANIMATED COUNT-UP WITH GLASS SPOTLIGHT
          ==================================================================== */}
      <section data-block-id="block-stats" style={getSectionStyle('impact_stats', 2)} className="py-14 md:py-20 bg-gradient-to-b from-purple-100/40 via-teal-100/30 to-amber-100/30 border-b border-purple-200/60 relative overflow-hidden scroll-reveal">
        <div className="container-clean">
          
          <div className="max-w-2xl mb-10 flex flex-col gap-3">
            <span className="glass-pill">
              {statsProps.eyebrow || '10-YEAR TRACK RECORD'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
              {statsProps.headline || 'Trusted community support across Ventura County.'}
            </h2>
            <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
              {statsProps.description || 'Since 2014, we have provided barrier-free, non-judgmental services to LGBTQ+ individuals, youth, and families.'}
            </p>
          </div>

          <MobileCarousel cols={4} autoScrollMs={5000} className="perspective-1000">
            {impactStats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <CardSpotlight 
                  key={stat.label}
                  className={`${stat.cardTheme} p-6 md:p-8 ${stat.glowClass} interactive-card-3d relative overflow-hidden h-full`}
                  tilt={true}
                  maxTilt={8}
                  glare={true}
                >
                  <div className="flex flex-col gap-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center font-bold shadow-xs border border-white/60`}>
                        <StatIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">100% Verified</span>
                    </div>
                    <div className={`font-display text-4xl sm:text-5xl font-black tracking-tight ${stat.colorClass}`}>
                      <AnimatedCounter value={stat.value} />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 pt-0.5">
                      {stat.label}
                    </h3>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {stat.sub}
                    </p>
                  </div>
                </CardSpotlight>
              );
            })}
          </MobileCarousel>

        </div>
      </section>

      {/* ====================================================================
          UPCOMING PROGRAMS & EVENTS THIS WEEK
          Positioned directly after "Trusted community" Impact Section
          ==================================================================== */}
      <UpcomingWeekSection
        props={upcomingWeekProps}
        style={getSectionStyle('upcoming_week', 2.5)}
        events={cmsEvents}
      />

      {/* ====================================================================
          LGBTQ+ AFFIRMING BUSINESS DIRECTORY SPOTLIGHT
          ==================================================================== */}
      <section data-block-id="block-directory" style={getSectionStyle('directory_cta', 6)} className="py-14 md:py-20 bg-white border-b border-slate-100 scroll-reveal">
        <div className="container-clean">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
                {directoryProps.eyebrow || 'VENTURA COUNTY AFFIRMING NETWORK'}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                {directoryProps.headline || 'Shop, Dine & Connect Safely.'}
              </h2>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                {directoryProps.description || 'Discover verified LGBTQ+ owned and affirming businesses across Ventura, Oxnard, Ojai, Camarillo, and the Conejo Valley.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Link to="/directory" className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm text-center">
                <span>{directoryProps.ctaText || 'Browse Full Directory'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/directory/submit" className="btn-secondary py-2.5 px-4 text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-white text-center">
                <span>{directoryProps.secondaryCtaText || 'Submit Your Business'}</span>
              </Link>
            </div>
          </div>

          <MobileCarousel cols={3} autoScrollMs={4500}>
            {businessDirectorySeed.slice(0, 3).map((biz) => (
              <div key={biz.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-purple-300 transition-all shadow-xs hover:shadow-lg flex flex-col justify-between gap-4 h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                      {biz.category}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-700">{biz.city}</span>
                  </div>
                  <h3 className="font-display text-xl font-black text-slate-950">{biz.name}</h3>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium line-clamp-3">{biz.description}</p>
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
          </MobileCarousel>
        </div>
      </section>

      {/* ====================================================================
          PROGRAMS DIRECTORY: COLLISION-PROOF EXPANDABLE CARDS
          ==================================================================== */}
      <section data-block-id="block-programs" style={getSectionStyle('programs_section', 3)} className="py-14 md:py-20 bg-gradient-to-b from-amber-100/30 via-rose-100/30 to-purple-100/40 border-b border-purple-200/60 relative overflow-hidden scroll-reveal">
        <div className="container-clean">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex flex-col gap-3 max-w-xl">
              <span className="glass-pill">
                {programsProps.eyebrow || 'CORE INITIATIVES'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                {programsProps.headline || 'Programs for every chapter of life.'}
              </h2>
              <p className="text-slate-600 max-w-xl text-sm leading-relaxed">
                {programsProps.description || 'Explore peer support groups, clinical health screenings, and cultural fellowship programs below.'}
              </p>
            </div>
            <Link to="/programs" className="btn-secondary shrink-0">
              <span>{programsProps.ctaText || 'View All Programs'}</span>
              <ArrowRight className="w-4 h-4 text-[#5A1E65]" />
            </Link>
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

          {/* Cards Grid with Unified Equal-Height Cards & 3D Tilt */}
          <MobileCarousel cols={3} autoScrollMs={4500} className="pt-2 perspective-1000 items-stretch sm:auto-rows-fr" cardClassName="h-full flex flex-col">
            {filteredPrograms.map((program) => {
              // Dynamic jewel-toned card themes & badge colors
              let cardTheme = "card-vibrant-purple";
              let audienceBadgeColor = "text-purple-900 bg-purple-100 border-purple-300";
              if (program.slug === 'little-unicorns') {
                cardTheme = "card-vibrant-rose";
                audienceBadgeColor = "text-rose-900 bg-rose-100 border-rose-300";
              } else if (program.slug === 'diversity-shines') {
                cardTheme = "card-vibrant-teal";
                audienceBadgeColor = "text-teal-900 bg-teal-100 border-teal-300";
              } else if (program.slug === 'rainbow-umbrella') {
                cardTheme = "card-vibrant-amber";
                audienceBadgeColor = "text-amber-900 bg-amber-100 border-amber-300";
              } else if (program.slug === 'community-resource-center') {
                cardTheme = "card-vibrant-indigo";
                audienceBadgeColor = "text-indigo-900 bg-indigo-100 border-indigo-300";
              } else if (program.programGroup === 'youth') {
                cardTheme = "card-vibrant-rose";
                audienceBadgeColor = "text-rose-900 bg-rose-100 border-rose-300";
              } else if (program.programGroup === 'recovery') {
                cardTheme = "card-vibrant-teal";
                audienceBadgeColor = "text-teal-900 bg-teal-100 border-teal-300";
              } else {
                cardTheme = "card-vibrant-purple";
                audienceBadgeColor = "text-purple-900 bg-purple-100 border-purple-300";
              }

              return (
                <CardSpotlight 
                  key={program.slug}
                  className={`${cardTheme} h-full w-full overflow-hidden flex flex-col justify-between interactive-card-3d shadow-md hover:shadow-xl`}
                  contentClassName="h-full w-full flex flex-col justify-between"
                  tilt={true}
                  maxTilt={2.2}
                  scale={1.006}
                  glare={true}
                >
                  <div className="flex flex-col flex-1">
                    <div className="w-full aspect-[16/10] overflow-hidden bg-slate-50 relative shrink-0">
                      <AutoSlideImage
                        images={program.images?.length ? program.images : [program.heroImage || '/images/crc-building.jpg']}
                        alt={program.title}
                        aspectRatio="aspect-[16/10]"
                        className="w-full h-full"
                        imageFit={program.imageFit || 'cover'}
                        fallbackSrc="/images/crc-building.jpg"
                        showDots={true}
                        showArrows={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                    </div>

                    <div className="p-6 md:p-8 flex flex-col gap-2.5 flex-1">
                      <div className="h-6 flex items-center">
                        <span 
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border w-fit block shadow-2xs ${program.audienceColor ? '' : audienceBadgeColor}`}
                          style={program.audienceColor ? {
                            color: program.audienceColor,
                            backgroundColor: `${program.audienceColor}15`,
                            borderColor: `${program.audienceColor}35`
                          } : undefined}
                        >
                          {program.audience}
                        </span>
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 group-hover:text-[#5A1E65] transition-colors line-clamp-1 min-h-[2rem] flex items-center">
                        {program.title}
                      </h3>
                      <p className="text-sm sm:text-[15px] italic font-serif text-[#5A1E65] font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">
                        "{program.tagline}"
                      </p>
                      <p className="text-sm text-slate-800 font-medium leading-relaxed pt-1 line-clamp-3 min-h-[4rem]">
                        {program.summary}
                      </p>

                      {/* Compact Standardized Logistics Box */}
                      <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-1.5 text-xs mt-2 min-h-[5.25rem]">
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#5A1E65] shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-950">When: </span>
                            <span className="text-slate-800 line-clamp-1">{program.schedule}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#5A1E65] shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-950">Where: </span>
                            <span className="text-slate-800 line-clamp-1">{program.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 pt-0 flex flex-col gap-3 mt-auto">
                    {program.isExternal ? (
                      <a
                        href={program.ctaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary py-2.5 px-4 text-xs font-bold shadow-md hover:shadow-lg inline-flex items-center justify-center gap-1.5 text-center group"
                      >
                        <span>Visit Program Resource</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    ) : (
                      <Link 
                        to={program.ctaLink || `/programs/${program.slug}`}
                        className="btn-primary py-2.5 px-4 text-xs font-bold shadow-md hover:shadow-lg inline-flex items-center justify-center gap-1.5 text-center group"
                      >
                        <span>{program.programGroup === 'signature' ? 'Read Program Details' : 'Explore Program & Times'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}
                  </div>
                </CardSpotlight>
              );
            })}
          </MobileCarousel>

        </div>
      </section>

      {/* ====================================================================
          11. FLEX SPACE: LIVE AVAILABILITY, TIMINGS & SLOT BOOKING SYSTEM
          ==================================================================== */}
      <FlexSpaceBookingSection
        props={flexSpaceProps}
        style={getSectionStyle('flex_space', 11)}
      />

      {/* ====================================================================
          5. SIGNATURE ANNUAL EVENTS (AIDS WALK, PRIDE PROM, VENTURA COUNTY PRIDE)
          ==================================================================== */}
      <section data-block-id="block-signature-events" style={getSectionStyle('signature_events', 5)} className="py-14 md:py-20 bg-gradient-to-b from-white via-purple-50/40 to-amber-50/30 border-b border-purple-200/60 relative overflow-hidden scroll-reveal">
        <div className="container-clean">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex flex-col gap-3 max-w-xl">
              <span className="glass-pill">
                {signatureEventsProps.eyebrow || 'SIGNATURE ANNUAL EVENTS'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                {signatureEventsProps.headline || 'Events That Unite Ventura County.'}
              </h2>
              <p className="text-slate-700 max-w-xl text-sm font-medium leading-relaxed">
                {signatureEventsProps.description || 'Celebrate, remember, and advocate together at our flagship annual community gatherings.'}
              </p>
            </div>
            <Link to="/events" className="btn-secondary shrink-0">
              <span>{signatureEventsProps.ctaText || 'Explore All Events'}</span>
              <ArrowRight className="w-4 h-4 text-[#5A1E65]" />
            </Link>
          </div>

          <MobileCarousel cols={3} autoScrollMs={5000} className="items-stretch" cardClassName="h-full flex flex-col">
            {annualSignatureEvents.map((sigEvt, idx) => (
              <CardSpotlight
                key={sigEvt.id || sigEvt.title}
                className={`${['card-vibrant-rose', 'card-vibrant-purple', 'card-vibrant-amber', 'card-vibrant-teal', 'card-vibrant-indigo'][idx % 5]} overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl`}
                contentClassName="flex flex-col justify-between h-full"
                tilt={true}
                maxTilt={5}
                scale={1.015}
                glare={true}
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                    <img
                      src={sigEvt.image || '/images/community-gathering.jpg'}
                      alt={sigEvt.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/community-gathering.jpg'; }}
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <span className="inline-block text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 text-[#5A1E65] border border-purple-200">
                      0{idx + 1} · {sigEvt.schedule || 'Signature Event'}
                    </span>
                    <h3 className="font-display text-xl font-black text-slate-950">{sigEvt.title}</h3>
                    <p className="text-sm italic font-serif text-[#5A1E65] font-bold">"{sigEvt.tagline}"</p>
                    <p className="text-sm text-slate-900 font-semibold leading-relaxed">{sigEvt.description}</p>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <Link to={sigEvt.link || '/events'} className="btn-secondary w-full justify-center text-xs font-bold">
                    <span>Event Details & Info</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardSpotlight>
            ))}
          </MobileCarousel>
        </div>
      </section>

      {/* ====================================================================
          7. DEDICATED INTERACTIVE COMMUNITY CALENDAR
          ==================================================================== */}
      <HomeCalendarSection
        events={cmsEvents || liveEvents}
        props={calendarProps}
        style={getSectionStyle('calendar_section', 7)}
      />

      {/* ====================================================================
          8. SPECIAL ENGAGEMENTS (HOSTED GROUPS LIKE AMPLIFY ARTS)
          ==================================================================== */}
      <section data-block-id="block-special-engagements" style={getSectionStyle('special_engagements', 8)} className="py-14 md:py-20 bg-gradient-to-b from-indigo-50/40 via-purple-50/40 to-white border-b border-purple-200/60 relative overflow-hidden scroll-reveal">
        <div className="container-clean">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex flex-col gap-3 max-w-xl">
              <span className="glass-pill">
                {specialEngagementsProps.eyebrow || 'HOSTED AT DCVC'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                {specialEngagementsProps.headline || 'Special Engagements & Hosted Collectives'}
              </h2>
              <p className="text-slate-700 max-w-xl text-sm font-medium leading-relaxed">
                {specialEngagementsProps.description || 'Partner organizations and creative youth collectives we are currently hosting inside our Community Resource Center.'}
              </p>
            </div>
            <Link to="/contact" className="btn-secondary shrink-0">
              <span>{specialEngagementsProps.ctaText || 'Inquire About Hosting'}</span>
              <ArrowRight className="w-4 h-4 text-[#5A1E65]" />
            </Link>
          </div>

          <MobileCarousel cols={2} autoScrollMs={5000} className="items-stretch" cardClassName="h-full flex flex-col">
            {specialEngagements.map((eng) => (
              <CardSpotlight
                key={eng.id}
                className="card-vibrant-indigo overflow-hidden h-full w-full flex flex-col shadow-md hover:shadow-xl"
                contentClassName="flex flex-col justify-between h-full"
                tilt={true}
                maxTilt={2.2}
                scale={1.006}
                glare={true}
              >
                <div className="flex flex-col flex-1">
                  <div className="w-full h-56 sm:h-64 shrink-0 overflow-hidden bg-slate-100 relative">
                    <img
                      src={eng.image || '/images/youth-umbrella.jpg'}
                      alt={eng.title}
                      className="w-full h-full object-cover object-center block"
                      onError={(e) => { e.target.src = '/images/crc-building.jpg'; }}
                    />
                  </div>
                  <div className="p-6 sm:p-7 flex-1 flex flex-col gap-2.5">
                    <div>
                      <span className="inline-block text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-950 border border-indigo-300">
                        {eng.host}
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 leading-snug line-clamp-1 min-h-[1.75rem]">{eng.title}</h3>
                    <p className="text-xs sm:text-sm font-bold text-[#5A1E65] line-clamp-1">{eng.schedule} · {eng.audience}</p>
                    <p className="text-sm text-slate-900 font-medium leading-relaxed line-clamp-3 min-h-[4.5rem]">{eng.description}</p>
                  </div>
                </div>
                <div className="px-6 sm:px-7 pb-6 sm:pb-7 pt-2 mt-auto">
                  <Link to={eng.link || '/programs'} className="btn-secondary w-full justify-center text-xs font-bold">
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardSpotlight>
            ))}
          </MobileCarousel>
        </div>
      </section>

      {/* ====================================================================
          HIGHLY EYE-CATCHING & BEAUTIFUL GIVING STUDIO (Streamlined & Re-optimized)
          ==================================================================== */}
      <section id="giving" data-block-id="block-giving" style={getSectionStyle('zeffy_giving', 8)} className="py-10 sm:py-14 md:py-16 bg-gradient-to-b from-amber-100/30 via-purple-100/50 to-purple-950/25 border-b border-purple-200/60 relative overflow-hidden scroll-reveal">
        
        {/* Ambient Specular Backdrops */}
        <div 
          className="absolute top-10 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute bottom-10 right-10 w-80 h-80 bg-amber-100/25 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="container-clean relative z-10">
          
          <div className="max-w-2xl mx-auto text-center mb-6 sm:mb-8 flex flex-col items-center gap-2.5">
            <span className="glass-pill text-[11px] sm:text-xs font-bold text-[#5A1E65] py-0.5 sm:py-1 px-3.5 bg-purple-50/90 border-purple-200/80 shadow-xs">
              {givingProps.eyebrow || '❤️ 501(C)(3) COMMUNITY PHILANTHROPY'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
              {givingProps.headline || 'Every Gift Directly Sustains Our Safe Harbor.'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              {givingProps.description || 'We never charge fees for rapid HIV testing, drop-in care, or youth circles. Community contributions keep our doors open.'}
            </p>

            {/* Compact Frequency Switcher */}
            <div className="inline-flex items-center p-1 rounded-full bg-slate-200/80 border border-slate-300/80 shadow-inner mt-1">
              <button
                type="button"
                onClick={() => setDonationFreq('once')}
                className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  donationFreq === 'once'
                    ? 'bg-white text-slate-900 shadow-xs scale-102'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                One-Time Gift
              </button>
              <button
                type="button"
                onClick={() => setDonationFreq('monthly')}
                className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  donationFreq === 'monthly'
                    ? 'bg-[#5A1E65] text-white shadow-xs scale-102'
                    : 'text-slate-600 hover:text-[#5A1E65]'
                }`}
              >
                <span>GEM Membership</span>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                  donationFreq === 'monthly' ? 'bg-amber-400 text-slate-950' : 'bg-purple-100 text-[#5A1E65]'
                }`}>
                  ★ Give Every Month
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Master Giving Studio Card with 3D Depth & Specular Glow (Restored for Desktop View) */}
          <div className="hidden lg:block max-w-6xl mx-auto rounded-3xl bg-white shadow-2xl border-2 border-purple-200/90 overflow-hidden preserve-3d glow-amethyst">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Left Column: Interactive Tiers & Custom Amount */}
              <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-slate-100 bg-white/95">
                
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-[#5A1E65]" />
                      <span>Select Gift Tier {donationFreq === 'monthly' ? '(GEM Membership)' : ''}</span>
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
                          type="button"
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
                      {donationFreq === 'monthly' ? 'Recurring Monthly (GEM Membership)' : 'One-Time Direct'}
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
                    <span>Complete ${customDonation ? customDonation : selectedDonationTier} Gift Online {donationFreq === 'monthly' ? '/ Month' : ''}</span>
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

          {/* Mobile/Tablet Streamlined Giving Studio Card */}
          <div className="block lg:hidden max-w-3xl mx-auto rounded-3xl bg-white shadow-xl border border-purple-200/90 p-5 sm:p-7 overflow-hidden">
            <div className="flex flex-col gap-4">

              {/* Tier Selection Pills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-[#5A1E65]" />
                    <span>Select Amount {donationFreq === 'monthly' ? '(Monthly)' : ''}</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    100% Tax-Deductible
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {donationTiers.map((tier) => {
                    const isSelected = selectedDonationTier === tier.amount && !customDonation;
                    return (
                      <button
                        key={tier.amount}
                        type="button"
                        onClick={(e) => {
                          setCustomDonation('');
                          handleSelectDonationTier(tier.amount, e);
                        }}
                        className={`py-2.5 px-2 rounded-xl font-bold transition-all border text-center cursor-pointer flex flex-col items-center justify-center relative ${
                          isSelected
                            ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-md scale-102 ring-2 ring-purple-300'
                            : 'bg-slate-50 hover:bg-purple-50 text-slate-800 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <span className="text-base sm:text-lg font-black leading-none">${tier.amount}</span>
                        {tier.amount === 50 && (
                          <span className={`text-[8px] font-extrabold uppercase mt-0.5 tracking-tight ${isSelected ? 'text-amber-300' : 'text-purple-700'}`}>
                            Popular
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      if (!customDonation) setCustomDonation('75');
                    }}
                    className={`py-2.5 px-2 rounded-xl font-bold transition-all border text-center cursor-pointer flex flex-col items-center justify-center col-span-4 sm:col-span-1 ${
                      customDonation
                        ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-md ring-2 ring-purple-300'
                        : 'bg-slate-50 hover:bg-purple-50 text-slate-800 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-black">Custom</span>
                    <span className={`text-[8px] font-semibold ${customDonation ? 'text-purple-200' : 'text-slate-400'}`}>Any $</span>
                  </button>
                </div>
              </div>

              {/* Custom Input Field (shown if Custom selected or filled) */}
              {customDonation && (
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Custom Amount:</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        min="5"
                        placeholder="Enter gift amount"
                        value={customDonation}
                        onChange={(e) => {
                          setCustomDonation(e.target.value);
                          if (e.target.value && Number(e.target.value) > 0) {
                            setSelectedDonationTier(Number(e.target.value));
                          }
                        }}
                        className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-purple-300 bg-white text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Impact Callout Banner */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-amber-50/50 border border-purple-200/90 flex items-start gap-2.5 shadow-2xs">
                <span className="w-6 h-6 rounded-lg bg-[#5A1E65] text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    {customDonation ? `Custom Gift of $${customDonation}` : activeTierObj.title}
                    {donationFreq === 'monthly' ? ' (GEM Membership)' : ''}
                  </span>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-snug mt-0.5">
                    {customDonation
                      ? `Your $${customDonation} gift provides flexible barrier-free support, hot meals for youth, and free health testing navigation across Ventura County.`
                      : activeTierObj.impact}
                  </p>
                </div>
              </div>

              {/* Prominent Action Button with Confetti */}
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={orgInfo.donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={triggerMilestoneConfetti}
                  className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_25px_-5px_rgba(245,158,11,0.45)] hover:shadow-[0_12px_30px_-5px_rgba(245,158,11,0.6)] hover:scale-101 transition-all cursor-pointer text-center"
                >
                  <Heart className="w-4 h-4 fill-current text-rose-700 animate-bounce shrink-0" />
                  <span className="truncate max-w-[80%] text-center">
                    Complete ${customDonation ? customDonation : selectedDonationTier} Gift Online {donationFreq === 'monthly' ? '/ Month' : ''}
                  </span>
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </a>

                {/* Trust and Non-profit Footnote in 1 line */}
                <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] text-slate-500 flex-wrap text-center pt-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#5A1E65]" />
                    <span>Official 501(c)(3)</span>
                  </span>
                  <span>·</span>
                  <span>Tax ID (EIN): <strong className="text-slate-800">{orgInfo.ein}</strong></span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Bank-grade 256-bit encrypted donor portal</span>
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          UPCOMING EVENTS: BALANCED ROWS WITH GLASS CARDS
          ==================================================================== */}
      <section data-block-id="block-events" style={getSectionStyle('events_section', 4)} className="py-14 md:py-20 bg-gradient-to-b from-purple-100/40 via-rose-100/30 to-amber-100/30 border-b border-purple-200/60 relative overflow-hidden scroll-reveal">
        <div className="container-clean">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex flex-col gap-3 max-w-xl">
              <span className="glass-pill">
                {eventsProps.eyebrow || 'GATHERINGS & CALENDAR'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                {eventsProps.headline || 'Upcoming Community Gatherings'}
              </h2>
            </div>
            <Link 
              to="/events" 
              className="btn-secondary"
            >
              <span>{eventsProps.ctaText || 'View Full Calendar'}</span>
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

          {/* Events List in 3D Perspective (2 balanced rows of 3 on desktop, expandable) */}
          <MobileCarousel cols={3} autoScrollMs={5000} className="perspective-1000 items-stretch" cardClassName="h-full flex flex-col">
            {displayedEvents.map((evt, idx) => {
              const dateGradients = [
                'from-purple-800 via-[#5A1E65] to-indigo-900 text-white shadow-purple-500/25',
                'from-amber-500 via-orange-500 to-rose-600 text-white shadow-amber-500/25',
                'from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-teal-500/25',
                'from-rose-600 via-pink-600 to-purple-800 text-white shadow-rose-500/25',
                'from-blue-600 via-indigo-600 to-purple-700 text-white shadow-blue-500/25',
                'from-violet-600 via-purple-700 to-fuchsia-800 text-white shadow-violet-500/25',
                'from-emerald-700 via-teal-700 to-slate-900 text-white shadow-emerald-500/25'
              ];

              let catBadge = "text-purple-800 bg-purple-100/70 border-purple-200";
              const catLower = (evt.category || '').toLowerCase();
              if (catLower.includes('youth')) catBadge = "text-amber-800 bg-amber-100/70 border-amber-200";
              else if (catLower.includes('health') || catLower.includes('screen')) catBadge = "text-teal-800 bg-teal-100/70 border-teal-200";
              else if (catLower.includes('senior') || catLower.includes('55')) catBadge = "text-emerald-800 bg-emerald-100/70 border-emerald-200";
              else if (catLower.includes('growth') || catLower.includes('toastmaster')) catBadge = "text-indigo-800 bg-indigo-100/70 border-indigo-200";
              else if (catLower.includes('pride') || catLower.includes('signature') || catLower.includes('walk') || catLower.includes('gala')) catBadge = "text-rose-800 bg-rose-100/70 border-rose-200";

              return (
                <CardSpotlight
                  key={evt.id}
                  className="card-vibrant-purple p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-200 h-full flex flex-col justify-between"
                  contentClassName="flex flex-col justify-between h-full"
                  tilt={true}
                  maxTilt={2.2}
                  scale={1.008}
                  glare={true}
                >
                  <div className="flex flex-col justify-between h-full gap-4">
                    
                    <div className="flex items-center justify-between gap-2">
                      {(() => {
                        const parsed = parseEventDate(evt);
                        const badgeMonth = parsed
                          ? getLocalizedMonthAbbr(parsed.monthIndex, currentLang)
                          : (evt.month || 'EVT');
                        const badgeDay = evt.day || parsed?.dayStr || '—';
                        return (
                          <div className={`flex flex-col items-center justify-center min-w-[70px] p-2.5 rounded-2xl bg-gradient-to-b ${dateGradients[idx % dateGradients.length]} shadow-md`}>
                            <span
                              className="text-[10px] font-black uppercase tracking-wider text-amber-200 notranslate"
                              translate="no"
                            >
                              {badgeMonth}
                            </span>
                            <span className="font-display text-2xl font-black leading-none pt-0.5">{badgeDay}</span>
                          </div>
                        );
                      })()}

                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${catBadge}`}>
                          {evt.category}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-900 flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 text-[#5A1E65]" /> {evt.time}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1">
                      <h3 className="font-display text-lg font-black text-slate-950 pt-0.5 line-clamp-2">
                        {evt.title}
                      </h3>
                      <p className="text-sm text-slate-800 font-medium leading-relaxed line-clamp-3">
                        {evt.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-purple-100 mt-auto flex items-center justify-end relative z-20">
                      <Link 
                        to={`/events/${evt.slug}`}
                        className="btn-secondary text-xs py-2 px-4 w-full text-center font-bold justify-center"
                      >
                        <span>Details & RSVP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>
                </CardSpotlight>
              );
            })}
          </MobileCarousel>

          {/* Centered View All Action */}
          {filteredEvents.length > 6 && (
            <div className="flex flex-col items-center justify-center pt-8 text-center">
              <button
                type="button"
                onClick={() => setShowAllEvents((prev) => !prev)}
                className="btn-primary py-3 px-8 text-sm font-extrabold shadow-md hover:shadow-xl inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <span>
                  {showAllEvents
                    ? 'Show Less Events'
                    : `View All Events (${filteredEvents.length - 6} More)`}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAllEvents ? 'rotate-180' : ''}`} />
              </button>
              <p className="text-xs text-slate-500 font-medium mt-2">
                {showAllEvents
                  ? `Showing all ${filteredEvents.length} upcoming gatherings`
                  : `Showing 2 rows (${displayedEvents.length} events) · Click to reveal the remaining ${filteredEvents.length - 6} events`}
              </p>
            </div>
          )}

        </div>
      </section>

      {/* ====================================================================
          PARTNERSHIPS & OFFICIAL SPONSORS SHOWCASE
          ==================================================================== */}
      <section data-block-id="block-partnerships" style={getSectionStyle('partnerships_section', 5)} className="py-14 md:py-20 bg-gradient-to-b from-purple-50/60 via-white to-purple-50/40 border-b border-purple-200/60 relative overflow-hidden scroll-reveal">
        <div className="container-clean">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
                {partnershipsProps.eyebrow || 'CIVIC & COMMUNITY ALLIANCES'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                {partnershipsProps.headline || 'Partnerships & Official Sponsors.'}
              </h2>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                {partnershipsProps.description || 'Collaboration with public health agencies, philanthropic foundations, and regional allies powers free programs across all 10 Ventura County cities.'}
              </p>
            </div>
            <Link to="/sponsors" className="btn-secondary shrink-0">
              <span>{partnershipsProps.ctaText || 'View All Sponsors & Partners'}</span>
              <ArrowRight className="w-4 h-4 text-[#5A1E65]" />
            </Link>
          </div>

          {/* Horizontal Auto-Moving Partnerships Strip */}
          <div className="partners-marquee-wrap py-2">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-[#faf5ff] to-transparent z-10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-[#faf5ff] to-transparent z-10"
              aria-hidden="true"
            />

            <div className="partners-marquee-track">
              {[0, 1].map((dupIndex) => {
                const isDuplicate = dupIndex === 1;
                return (
                  <div
                    key={dupIndex}
                    aria-hidden={isDuplicate ? 'true' : undefined}
                    className="flex items-stretch gap-5 shrink-0"
                  >
                    {(cmsSponsors || sponsorsList).map((partner, idx) => (
                      <div
                        key={`${dupIndex}-${partner.shortName || partner.name || idx}`}
                        className="w-[290px] sm:w-[320px] shrink-0 rounded-2xl bg-white/95 border border-purple-200/80 hover:border-[#5A1E65] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-13 h-13 rounded-xl bg-white border border-purple-100 shadow-2xs overflow-hidden flex items-center justify-center shrink-0 p-1">
                            <img
                              src={partner.logo || '/images/crc-building.jpg'}
                              alt={isDuplicate ? '' : partner.name}
                              className="w-full h-full object-contain rounded-lg"
                              onError={(e) => {
                                e.target.src = '/images/crc-building.jpg';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            {partner.shortName && (
                              <span className="inline-block text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-100/80 border border-purple-200 px-2 py-0.5 rounded-full mb-1">
                                {partner.shortName}
                              </span>
                            )}
                            <h3 className="font-display text-sm sm:text-base font-extrabold text-slate-950 leading-snug line-clamp-2">
                              {partner.name}
                            </h3>
                          </div>
                        </div>

                        <p className="text-sm text-slate-800 font-medium leading-relaxed line-clamp-2">
                          {partner.role}
                        </p>

                        {partner.url && (
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-purple-800 font-bold inline-flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-[#5A1E65]" />
                              <span>Official Partner</span>
                            </span>
                            <a
                              href={partner.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              tabIndex={isDuplicate ? -1 : undefined}
                              className="inline-flex items-center gap-1 font-bold text-[#5A1E65] hover:underline"
                            >
                              <span>Learn More</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          TESTIMONIALS & COMMUNITY VOICES: 3D EDITORIAL GRID
          ==================================================================== */}
      <section data-block-id="block-voices" style={getSectionStyle('community_voices', 9)} className="py-14 md:py-20 bg-gradient-to-b from-amber-100/30 via-purple-100/40 to-indigo-100/35 border-b border-purple-200/60 relative overflow-hidden scroll-reveal">
        <div className="container-clean">
          
          <div className="max-w-2xl mx-auto text-center mb-10 flex flex-col items-center gap-3">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
              {voicesProps.eyebrow || 'COMMUNITY VOICES'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
              {voicesProps.headline || "In our community's words."}
            </h2>
            <p className="text-sm sm:text-base text-slate-800 font-medium">
              Real stories of care, belonging, and connection from every city in Ventura County.
            </p>
          </div>

          <MobileCarousel cols={3} autoScrollMs={5000} className="perspective-1000 items-stretch">
            <CardSpotlight 
              className="card-vibrant-purple p-6 md:p-8 h-full interactive-card-3d glow-amethyst"
              contentClassName="flex flex-col justify-between gap-5 h-full"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif text-[#5A1E65] leading-none">“</span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">Youth Voice</span>
              </div>
              <p className="font-serif italic text-sm md:text-base text-slate-950 font-medium leading-relaxed">
                "Rainbow Umbrella gave our teenager the first space where they felt completely accepted and understood. It changed our family's life."
              </p>
              <div className="pt-3 border-t border-purple-200/80 flex items-center gap-3 mt-auto">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  YP
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-950">Youth Program Participant</span>
                  <span className="text-xs text-slate-800 font-semibold">Ventura, CA</span>
                </div>
              </div>
            </CardSpotlight>

            <CardSpotlight 
              className="card-vibrant-amber p-6 md:p-8 h-full interactive-card-3d glow-amber"
              contentClassName="flex flex-col justify-between gap-5 h-full"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif text-amber-700 leading-none">“</span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">Parent Voice</span>
              </div>
              <p className="font-serif italic text-sm md:text-base text-slate-950 font-medium leading-relaxed">
                "Having a physical Community Resource Center right here in Portola Road gives our families a trusted place to find healthcare navigation, peer support, and affirming community."
              </p>
              <div className="pt-3 border-t border-amber-200/80 flex items-center gap-3 mt-auto">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  PO
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-950">Parent of Youth Attendee</span>
                  <span className="text-xs text-slate-800 font-semibold">Oxnard, CA</span>
                </div>
              </div>
            </CardSpotlight>

            <CardSpotlight 
              className="card-vibrant-teal p-6 md:p-8 h-full interactive-card-3d glow-teal"
              contentClassName="flex flex-col justify-between gap-5 h-full"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif text-teal-800 leading-none">“</span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-950 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-300">Volunteer Voice</span>
              </div>
              <p className="font-serif italic text-sm md:text-base text-slate-950 font-medium leading-relaxed">
                "Diversity Collective is the cultural backbone of LGBTQ+ Ventura County. From Pride to harm reduction, they show up for our community 365 days a year."
              </p>
              <div className="pt-3 border-t border-teal-200/80 flex items-center gap-3 mt-auto">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  CV
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-950">Community Volunteer</span>
                  <span className="text-xs text-slate-800 font-semibold">Camarillo, CA</span>
                </div>
              </div>
            </CardSpotlight>
          </MobileCarousel>

        </div>
      </section>

      {/* ====================================================================
          NEWSLETTER SIGNUP DISPATCH
          ==================================================================== */}
      <section data-block-id="block-newsletter" style={getSectionStyle('newsletter_section', 10)} className="py-12 bg-white">
        <div className="container-clean">
          <NewsletterSignup />
        </div>
      </section>

      {/* ====================================================================
          FINAL CALL TO ACTION: LUXURY 3D AURORA ARCHITECTURE
          ==================================================================== */}
      <section data-block-id="block-final-cta" style={getSectionStyle('final_cta', 11)} className="py-20 md:py-28 aurora-bg text-white relative overflow-hidden scroll-reveal">
        
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
            <span>{finalCtaProps.eyebrow || 'SUPPORT OUR 501(C)(3) MISSION'}</span>
          </span>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            {finalCtaProps.headlineLine1 || '"We do what we do,'} <br className="hidden sm:inline" />
            <span className="font-serif italic font-normal text-amber-300">{finalCtaProps.headlineAccent || 'because of you."'}</span>
          </h2>

          <p className="text-sm md:text-base text-purple-100 leading-relaxed font-serif italic max-w-xl mx-auto">
            {finalCtaProps.description || 'Diversity Collective of Ventura County is solely dedicated to advocating for and caring for our local LGBTQ+ community. Your generosity ensures our doors remain open, safe, and free for all.'}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
            <Link
              to="/donate"
              className="w-full sm:w-auto py-3.5 sm:py-4 px-5 sm:px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-xs sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_30px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_15px_40px_-5px_rgba(245,158,11,0.7)] hover:scale-103 transition-all cursor-pointer text-center max-w-full"
            >
              <Heart className="w-4 h-4 fill-current text-rose-700 animate-bounce flex-shrink-0" />
              <span className="truncate max-w-[280px] sm:max-w-none text-center">{finalCtaProps.primaryCtaText || 'Make a Community Gift Online'}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </Link>
            <Link
              to="/volunteer"
              className="w-full sm:w-auto py-3.5 sm:py-4 px-5 sm:px-8 rounded-2xl border-2 border-white/20 hover:border-white/50 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold transition-all backdrop-blur-md interactive-card-3d flex items-center justify-center text-center max-w-full"
            >
              <span className="truncate max-w-[280px] sm:max-w-none text-center">{finalCtaProps.secondaryCtaText || 'Explore Volunteer Roles'}</span>
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
