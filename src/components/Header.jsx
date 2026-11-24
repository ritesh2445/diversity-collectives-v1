import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Heart,
  LifeBuoy,
  Phone,
  Shield,
  Home,
  Info,
  Sparkles,
  Users,
  Calendar,
  Compass,
  HeartHandshake,
  MapPin,
  ChevronRight,
  ChevronDown,
  Search,
  Mic,
  PhoneCall,
  HandHeart
} from 'lucide-react';
import TraditionalAccessibilityIcon from './icons/TraditionalAccessibilityIcon';
import LanguageSelector from './LanguageSelector';
import SmartSearchModal from './SmartSearchModal';
import MiniCalendarPopover from './MiniCalendarPopover';
import { useScrollLock } from '../utils/scrollLock';
import { orgInfo } from '../data/dcvcData';
import { useLiveOrgInfo } from '../hooks/useCmsLive';
import SendVoicemailButton from './SendVoicemailButton';
import { a11yStore } from '../accessibility/a11yStore';
import { translationService } from '../services/translationService';
import AutoFitText from './ui/AutoFitText';
import '../services/cmsStore';

export default function Header() {
  const liveOrg = useLiveOrgInfo();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(() => translationService.getLanguage());
  const location = useLocation();
  const moreDropdownRef = useRef(null);
  const mobileMenuTriggerRef = useRef(null);

  useEffect(() => {
    const unsub = translationService.subscribe((lang) => {
      setCurrentLang(lang);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer, search modal, calendar, and dropdown upon route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreOpen(false);
    setSearchOpen(false);
    setCalendarOpen(false);
  }, [location.pathname]);

  // Close "More" dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!moreOpen) return;
    const handleClickOutside = (e) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  // Close mobile drawer on Escape and return focus to toggle button (WCAG 2.1)
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileMenuOpen(false);
        mobileMenuTriggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Bulletproof background scroll lock when mobile drawer is open
  useScrollLock(mobileMenuOpen);

  // Global Alt + A hotkey (Accessibility) and Ctrl/Cmd + K hotkey (Site Search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        a11yStore.toggleToolbar();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    const handleOpenSearch = () => setSearchOpen(true);
    const handleOpenCalendar = () => setCalendarOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openSiteSearch', handleOpenSearch);
    window.addEventListener('openMiniCalendar', handleOpenCalendar);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openSiteSearch', handleOpenSearch);
      window.removeEventListener('openMiniCalendar', handleOpenCalendar);
    };
  }, []);

  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

  const primaryNavItems = [
    { label: translationService.t('nav_about', 'About'), to: "/about", icon: Info, desc: translationService.t('nav_desc_about', "Mission, history & 10-year leadership") },
    { label: translationService.t('nav_programs', 'Programs'), to: "/programs", icon: Sparkles, desc: translationService.t('nav_desc_programs', "Free HIV/STI testing & youth groups") },
    { label: translationService.t('nav_community', 'Community'), to: "/community", icon: Users, desc: translationService.t('nav_desc_community', "Affirming peer circles & gatherings") },
    { label: translationService.t('nav_training', 'Trainings'), to: "/training", icon: Sparkles, desc: translationService.t('nav_desc_training', "P.R.I.D.E. cultural competency & workshops") },
    { label: translationService.t('nav_events', 'Events'), to: "/events", icon: Calendar, desc: translationService.t('nav_desc_events', "Pride prom, galas & workshops") },
    { label: translationService.t('nav_resources', 'Resources'), to: "/resources", icon: Compass, desc: translationService.t('nav_desc_resources', "Crisis lines & regional mutual aid") }
  ];

  const secondaryNavItems = [
    { label: translationService.t('nav_directory', 'Directory'), to: "/directory", icon: Compass, desc: translationService.t('nav_desc_directory', "LGBTQ+ affirming business network") },
    { label: translationService.t('nav_volunteer', 'Volunteer'), to: "/volunteer", icon: HandHeart, desc: translationService.t('nav_desc_volunteer', "Get involved, support events & community care") },
    { label: translationService.t('nav_sponsorships', 'Sponsorships'), to: "/sponsorships", icon: HeartHandshake, desc: translationService.t('nav_desc_sponsorships', "Corporate partnerships & packets") },
    { label: translationService.t('nav_news', 'News'), to: "/news", icon: Info, desc: translationService.t('nav_desc_news', "Stories, updates & advocacy") },
    { label: translationService.t('nav_gallery', 'Gallery'), to: "/gallery", icon: Sparkles, desc: translationService.t('nav_desc_gallery', "Celebration & memories") },
    { label: translationService.t('nav_podcasts', 'Podcasts & Media'), to: "/media", icon: Mic, desc: translationService.t('nav_desc_podcasts', "Conversations, stories & community media") },
    { label: translationService.t('nav_contact', 'Get in Touch'), to: "/contact", icon: PhoneCall, desc: translationService.t('nav_desc_contact', "Reach our team, voicemails & location") }
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const isSecondaryActive = secondaryNavItems.some(
    (item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
  );

  return (
    <>
      {/* Universal Announcement & Emergency Crisis Hotline Banner */}
      {liveOrg.bannerAlertActive !== false && (Boolean(liveOrg.bannerAlertText?.trim()) || Boolean(liveOrg.emergencyCrisisNotice?.trim())) && (
        <aside
          id="site-announcement-banner"
          aria-label="Universal Site Announcement & Emergency Crisis Support"
          className="bg-[#3b0764] text-white py-1.5 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold border-b border-purple-900/60 relative z-50 transition-all duration-200"
        >
          <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 w-full">
            {liveOrg.bannerAlertText?.trim() ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" aria-hidden="true" />
                {liveOrg.bannerAlertLink ? (
                  <Link to={liveOrg.bannerAlertLink} className="truncate hover:text-amber-300 transition-colors underline decoration-amber-400/50 underline-offset-2">
                    {liveOrg.bannerAlertText}
                  </Link>
                ) : (
                  <span className="truncate">{liveOrg.bannerAlertText}</span>
                )}
              </div>
            ) : <div />}
            {liveOrg.emergencyCrisisNotice?.trim() && (
              <div className="flex items-center gap-1.5 shrink-0 text-amber-200 text-[10px] sm:text-[11px] font-bold">
                <span className="hidden sm:inline text-purple-300/80">·</span>
                <span>{liveOrg.emergencyCrisisNotice}</span>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Primary Sticky Header Bar */}
      <header
        id="main-header"
        className="sticky top-0 left-0 right-0 z-50 transition-all duration-200 bg-[#FAF5FF]/95 backdrop-blur-md border-b border-purple-200/70 shadow-xs w-full max-w-full overflow-visible"
      >
        {/* Pride Rainbow Accent Ribbon integrated at header top */}
        <div className="h-0.5 sm:h-1 pride-rainbow-bar w-full" aria-hidden="true" />

        <div className={`w-full max-w-full sm:max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 transition-all duration-200 overflow-visible ${scrolled ? 'py-1.5 sm:py-2.5' : 'py-2 sm:py-3'
          }`}>
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 lg:gap-6 w-full max-w-full min-w-0">

            {/* Logo & Brand Identity - Never truncated on mobile or desktop */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group focus:outline-none shrink min-w-0 max-w-[48vw] sm:max-w-none"
              aria-label="Diversity Collective Ventura County"
            >
              <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl overflow-hidden shadow-xs border border-purple-200 bg-white flex-shrink-0 flex items-center justify-center p-0.5 sm:p-1 group-hover:scale-105 group-hover:border-[#5A1E65] transition-all duration-200">
                <img
                  src="/images/logo-square.png"
                  alt="Diversity Collective Ventura County Official Logo"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="flex flex-col justify-center flex-shrink-0 min-w-0 max-w-[150px] sm:max-w-[190px] md:max-w-none">
                {/* On mobile: compact stacked two lines matching mockup */}
                <div className="flex flex-col md:hidden leading-none">
                  <span className="font-display font-black text-[13px] tracking-tight text-slate-950 group-hover:text-[#5A1E65] transition-colors truncate">
                    diversity
                  </span>
                  <span className="font-display font-black text-[13px] tracking-tight text-slate-950 group-hover:text-[#5A1E65] transition-colors mt-0.5 truncate">
                    collective
                  </span>
                </div>

                {/* On md+: single line with subtitle */}
                <span className="hidden md:block font-display font-extrabold text-base md:text-xl tracking-tight leading-tight text-slate-950 group-hover:text-[#5A1E65] transition-colors truncate max-w-full">
                  Diversity Collective
                </span>
                <div className="hidden md:flex items-center gap-1.5 mt-0.5 min-w-0 max-w-full">
                  <span className="text-[10px] md:text-xs font-bold tracking-[0.14em] text-[#5A1E65] uppercase truncate">
                    Ventura County
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100/70 text-[#5A1E65] border border-purple-300/80 leading-none shrink-0">
                    501(c)(3)
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Center Navigation - Clean 5 Pillars + "More" Dropdown to Guarantee Zero Collision */}
            <nav id="main-navigation" className="hidden xl:flex items-center gap-1 xl:gap-1.5 2xl:gap-2 flex-shrink min-w-0 mr-2 lg:mr-4" aria-label="Main Navigation">
              {/* Primary Pillars */}
              {primaryNavItems.map((item) => {
                const isActive = location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`nav-bar-btn px-2.5 2xl:px-3 py-1.5 2xl:py-2 text-xs 2xl:text-sm font-bold rounded-full transition-all whitespace-nowrap inline-block ${isActive
                        ? 'nav-bar-btn-active shadow-md shadow-purple-500/20'
                        : ''
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* "More" Dropdown on desktop (Directory, Training, News, Gallery, Podcasts & Media, Get in Touch) */}
              <div className="relative" ref={moreDropdownRef} data-no-autofit="true">
                <button
                  type="button"
                  data-no-autofit="true"
                  onClick={() => setMoreOpen(!moreOpen)}
                  onMouseEnter={() => setMoreOpen(true)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  className={`nav-bar-btn px-2.5 py-1.5 text-xs font-bold rounded-full transition-colors duration-150 whitespace-nowrap inline-flex items-center gap-1 cursor-pointer ${isSecondaryActive || moreOpen
                      ? 'nav-bar-btn-active shadow-md shadow-purple-500/20'
                      : ''
                    }`}
                >
                  <span data-no-autofit="true">{translationService.t('nav_more', 'More')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${moreOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreOpen && (
                  <div
                    data-no-autofit="true"
                    onMouseLeave={() => setMoreOpen(false)}
                    className="absolute left-0 mt-2 w-72 sm:w-80 min-w-[18rem] sm:min-w-[20rem] max-w-[90vw] rounded-2xl bg-white/95 backdrop-blur-xl border border-purple-200 shadow-2xl p-2.5 z-50 animate-in fade-in duration-100 origin-top-left"
                  >
                    <div className="space-y-1">
                      {secondaryNavItems.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = location.pathname === item.to ||
                          (item.to !== '/' && location.pathname.startsWith(item.to));
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            data-no-autofit="true"
                            onClick={() => setMoreOpen(false)}
                            className={`w-full flex items-start gap-2.5 p-2 rounded-xl transition-colors duration-150 group cursor-pointer ${isActive
                                ? 'bg-[#5A1E65] text-white font-bold shadow-xs'
                                : 'text-slate-800 hover:bg-purple-50 hover:text-[#5A1E65]'
                              }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-purple-100/70 text-[#5A1E65] group-hover:bg-[#5A1E65] group-hover:text-white transition-colors'}`}>
                              <ItemIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0 pr-1">
                              <span className={`text-xs font-bold leading-snug break-words ${isActive ? 'text-white' : 'text-slate-900 group-hover:text-[#5A1E65]'}`}>{item.label}</span>
                              <span className={`text-[11px] leading-snug mt-0.5 line-clamp-2 break-words ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{item.desc}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right CTAs - Guaranteed zero cropping */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink min-w-0 max-w-[50vw] sm:max-w-none justify-end">
              {/* Smart Sitewide Search Trigger (Desktop & Tablet) */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden md:inline-flex items-center justify-center w-7 h-7 sm:w-auto sm:h-8 sm:px-2.5 rounded-full border border-purple-200/90 bg-white hover:bg-purple-50 hover:border-[#5A1E65] text-slate-800 hover:text-[#5A1E65] transition-all flex-shrink-0 cursor-pointer shadow-2xs"
                title="Search Website"
                aria-label="Search across Diversity Collective website"
              >
                <Search className="w-3.5 h-3.5 text-[#5A1E65] flex-shrink-0" />
                <span className="hidden min-[1800px]:inline text-xs font-bold ml-1.5">{translationService.t('nav_search', 'Search')}</span>
              </button>

              {/* Quick Events Calendar Button (Desktop & Tablet) */}
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="hidden md:inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-purple-200/90 bg-white hover:bg-purple-50 hover:border-[#5A1E65] text-slate-800 hover:text-[#5A1E65] transition-all flex-shrink-0 cursor-pointer shadow-2xs"
                title="Events Calendar"
                aria-label="Open Events Calendar Quick View"
              >
                <Calendar className="w-3.5 h-3.5 text-[#5A1E65] flex-shrink-0" />
              </button>

              {/* Language Selector Dropdown (Desktop: hidden on mobile & small tablet, available in mobile drawer) */}
              <div className="hidden lg:block">
                <LanguageSelector variant="header" />
              </div>

              {/* Accessibility Companion Launcher Button (Desktop: hidden on mobile & small tablet, floating ReciteLauncher is present) */}
              <button
                type="button"
                onClick={() => a11yStore.toggleToolbar()}
                className="hidden lg:flex w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-300/90 bg-white hover:bg-purple-50 items-center justify-center text-slate-800 hover:text-[#5A1E65] transition-all flex-shrink-0 cursor-pointer shadow-2xs"
                title="Launch DCVC Accessibility Companion (Alt + A)"
                aria-label="Launch Accessibility & Audio Tools"
              >
                <TraditionalAccessibilityIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5A1E65] flex-shrink-0" />
              </button>

              {/* Quick Exit Shield Button (Always visible on mobile & desktop for crisis safety) */}
              <button
                onClick={handleQuickExit}
                className="inline-flex items-center justify-center w-7 h-7 sm:w-auto sm:h-8 sm:px-2.5 py-0 text-[10px] sm:text-xs font-bold text-rose-700 bg-rose-50/95 hover:bg-rose-100 border border-rose-200/90 rounded-full transition-all shadow-2xs cursor-pointer flex-shrink-0 whitespace-nowrap"
                title="Quickly exit to Google for your privacy and safety"
                aria-label="Quick Exit"
              >
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 flex-shrink-0" />
                <span className="hidden min-[1800px]:inline ml-1">{translationService.t('nav_quick_exit', 'Quick Exit')}</span>
              </button>

              {/* Get Support (Large desktop screens 1900px+; Programs is in main navigation) */}
              <Link
                to="/programs"
                className="nav-support-btn hidden min-[1900px]:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold hover:text-[#5A1E65] border border-slate-200 hover:border-purple-300 rounded-full transition-colors shadow-2xs flex-shrink-0 whitespace-nowrap"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-[#5A1E65]" />
                <span>{translationService.t('nav_get_support', 'Get Support')}</span>
              </Link>

              {/* Official Donate Action - Warm Gold Pill (Never Cropped) */}
              <Link
                to="/donate"
                className="nav-donate-btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-extrabold tracking-wide hover:brightness-95 border border-amber-300/80 rounded-full shadow-xs hover:shadow-md transition-all flex-shrink-0 min-w-0 max-w-[110px] md:max-w-none z-10"
              >
                <Heart className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current flex-shrink-0" />
                <span className="font-extrabold truncate">{translationService.t('nav_donate', 'Donate')}</span>
              </Link>

              {/* Mobile & Tablet Menu Toggle Button */}
              <button
                ref={mobileMenuTriggerRef}
                id="mobile-nav-toggle"
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-drawer"
                className="xl:hidden w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-slate-800 hover:text-slate-950 focus:outline-none rounded-lg hover:bg-purple-100/60 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Drawer (Layered at z-[100]) */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation" className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm xl:hidden flex flex-col justify-end animate-fadeIn overflow-hidden max-w-[100vw]" style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}>

          <div className="bg-white w-full max-w-full h-[95vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">

            {/* Drawer Header Bar */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-purple-200 bg-white p-0.5 shadow-2xs flex-shrink-0">
                  <img
                    src="/images/logo-square.png"
                    alt="DCVC Emblem"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-display font-extrabold text-sm text-slate-950 block leading-tight truncate">
                    Diversity Collective
                  </span>
                  <span className="text-[10px] font-bold text-[#5A1E65] uppercase tracking-wider block truncate">
                    Ventura County Community Center
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleQuickExit}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-950 rounded-full border border-slate-200 bg-white inline-flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  <span>Exit</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    mobileMenuTriggerRef.current?.focus();
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Navigation List */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-3 divide-y divide-slate-100 overscroll-contain"
              style={{ touchAction: 'pan-y' }}
            >

              {/* Mobile Language Selector Chips */}
              <LanguageSelector variant="mobile" className="pb-3" />

              {/* Mobile Smart Search Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center gap-2.5 w-full py-2.5 px-3.5 rounded-xl bg-white border border-purple-200 hover:border-[#5A1E65] text-slate-600 text-xs font-semibold shadow-2xs cursor-pointer text-left min-w-0"
              >
                <Search className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                <span className="truncate min-w-0">Search programs, events, board, resources...</span>
              </button>

              {/* Mobile Quick Calendar Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCalendarOpen(true);
                }}
                className="flex items-center gap-2.5 w-full py-2.5 px-3.5 rounded-xl bg-white border border-purple-200 hover:border-[#5A1E65] text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer text-left min-w-0"
              >
                <Calendar className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                <span className="truncate min-w-0">Events Calendar Quick View & Dates...</span>
              </button>

              {/* Chat with Luna (Virtual Friend & Community Guide) Quick Action */}
              <button
                type="button"
                id="mobile-ask-luna-nav-button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('openAskDcvc'));
                }}
                className="mobile-ask-luna-btn flex items-center justify-between py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-amber-50/50 border border-purple-200/90 hover:border-purple-400 transition-all group w-full text-left cursor-pointer shadow-2xs pt-3 min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5A1E65] to-purple-800 text-amber-300 flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="mobile-luna-title font-bold text-slate-900 group-hover:text-[#5A1E65] text-sm block">Ask Luna</span>
                    </div>
                    <span className="mobile-luna-desc text-[11px] text-slate-500 block truncate">Ask about testing, hours, youth circles & resources</span>
                  </div>
                </div>
                <ChevronRight className="mobile-luna-chevron w-4 h-4 text-[#5A1E65] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </button>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-purple-50/60 transition-colors group pt-3 min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-100/80 text-[#5A1E65] flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 group-hover:text-[#5A1E65] text-sm block truncate">Home</span>
                    <span className="text-[11px] text-slate-500 block truncate">Sanctuary homepage & announcements</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>

              {allNavItems.map((item) => {
                const ItemIcon = item.icon;
                const isActive = location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-bar-btn flex items-center justify-between py-2.5 px-3 rounded-xl transition-all group min-w-0 ${isActive
                        ? 'nav-bar-btn-active font-bold shadow-md'
                        : 'font-bold'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-800 group-hover:bg-white/20'
                        }`}>
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`nav-title font-bold text-sm block truncate ${isActive ? '!text-white text-white' : 'text-slate-900 group-hover:text-white'}`}>
                          {item.label}
                        </span>
                        <span className={`nav-desc text-[11px] block mt-0.5 truncate ${isActive ? '!text-white/90 text-white/90 font-medium' : 'text-slate-500 group-hover:text-white/90'
                          }`}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 flex-shrink-0 ${isActive ? '!text-white text-white' : 'text-slate-400 group-hover:text-white'
                      }`} />
                  </Link>
                );
              })}

              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-purple-50/60 transition-colors group min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 group-hover:text-teal-800 text-sm block truncate">Contact & Directions</span>
                    <span className="text-[11px] text-slate-500 block truncate">2471 Portola Road, Suite 100, Ventura</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>

              {/* Mobile Accessibility Companion Toggle */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  a11yStore.toggleToolbar();
                }}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-amber-50/70 transition-colors group w-full text-left cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-[#5A1E65] flex items-center justify-center flex-shrink-0">
                    <TraditionalAccessibilityIcon className="w-4 h-4 text-[#5A1E65]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 group-hover:text-[#5A1E65] text-sm block truncate">Accessibility Companion</span>
                    <span className="text-[11px] text-slate-500 block truncate">Speech reader, focus audio, dyslexia fonts & contrast</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </button>

            </div>

            {/* Bottom Mobile Action Drawer Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/90 flex flex-col gap-2.5 shrink-0 overflow-hidden max-w-full">
              <Link
                to="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full py-3 px-4 text-center text-xs font-extrabold normal-case leading-snug shadow-sm flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-current shrink-0" />
                <AutoFitText maxChars={24}>
                  <span>{translationService.t('nav_donate_tax_deductible', 'Make a Tax-Deductible Donation')}</span>
                </AutoFitText>
              </Link>

              {liveOrg.voicemailOnly ? (
                <SendVoicemailButton
                  className="w-full py-2.5 px-4 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-[#5A1E65] text-xs font-bold flex items-center justify-center gap-2 transition-colors text-center shadow-xs"
                  label="Send Voice Message"
                />
              ) : (
                <a
                  href={`tel:${(liveOrg.phone || orgInfo.phone).replace(/[^0-9]/g, '')}`}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors text-center"
                >
                  <Phone className="w-3.5 h-3.5 text-[#5A1E65] shrink-0" />
                  <AutoFitText maxChars={28}>
                    <span>{translationService.t('nav_call_sanctuary', `Call: ${liveOrg.phone || orgInfo.phone}`)}</span>
                  </AutoFitText>
                </a>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Smart Sitewide Search & Spell-Check Modal */}
      <SmartSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Responsive Minimized Calendar Modal / Quick View */}
      <MiniCalendarPopover isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </>
  );
}
