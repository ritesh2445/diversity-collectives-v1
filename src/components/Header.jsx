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
  ChevronDown
} from 'lucide-react';
import TraditionalAccessibilityIcon from './icons/TraditionalAccessibilityIcon';
import LanguageSelector from './LanguageSelector';
import { orgInfo } from '../data/dcvcData';
import { a11yStore } from '../accessibility/a11yStore';
import { translationService } from '../services/translationService';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(() => translationService.getLanguage());
  const location = useLocation();
  const moreDropdownRef = useRef(null);

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

  // Close mobile drawer and dropdown upon route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreOpen(false);
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

  // Lock body scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  // Global Alt + A hotkey for toggling Accessibility Companion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        a11yStore.toggleToolbar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

  const primaryNavItems = [
    { label: translationService.t('nav_about', 'About'), to: "/about", icon: Info, desc: "Mission, history & 10-year leadership" },
    { label: translationService.t('nav_programs', 'Programs'), to: "/programs", icon: Sparkles, desc: "Free HIV/STI testing & youth groups" },
    { label: translationService.t('nav_community', 'Community'), to: "/community", icon: Users, desc: "Affirming peer circles & gatherings" },
    { label: translationService.t('nav_events', 'Events'), to: "/events", icon: Calendar, desc: "Pride prom, galas & workshops" },
    { label: translationService.t('nav_resources', 'Resources'), to: "/resources", icon: Compass, desc: "Crisis lines & regional mutual aid" }
  ];

  const secondaryNavItems = [
    { label: translationService.t('nav_directory', 'Directory'), to: "/directory", icon: Compass, desc: "LGBTQ+ affirming business network" },
    { label: translationService.t('nav_training', 'Training'), to: "/training", icon: Sparkles, desc: "P.R.I.D.E. cultural competency" },
    { label: translationService.t('nav_news', 'News'), to: "/news", icon: Info, desc: "Stories, updates & advocacy" },
    { label: translationService.t('nav_gallery', 'Gallery'), to: "/gallery", icon: Sparkles, desc: "Celebration & memories" }
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const isSecondaryActive = secondaryNavItems.some(
    (item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
  );

  return (
    <>
      {/* Primary Sticky Header Bar */}
      <header 
        id="main-header"
        className="sticky top-0 left-0 right-0 z-50 transition-all duration-200 bg-[#FAF5FF]/95 backdrop-blur-md border-b border-purple-200/70 shadow-xs"
      >
        {/* Pride Rainbow Accent Ribbon integrated at header top */}
        <div className="h-0.5 sm:h-1 pride-rainbow-bar w-full" aria-hidden="true" />

        <div className={`w-full max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 transition-all duration-200 ${
          scrolled ? 'py-1.5 sm:py-2.5' : 'py-2 sm:py-3'
        }`}>
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 lg:gap-6">
            
            {/* Logo & Brand Identity - Never truncated on mobile or desktop */}
            <Link 
              to="/" 
              className="flex items-center gap-2 sm:gap-3 group focus:outline-none flex-shrink-0 min-w-0"
              aria-label="Diversity Collective Ventura County"
            >
              <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl overflow-hidden shadow-xs border border-purple-200 bg-white flex-shrink-0 flex items-center justify-center p-0.5 sm:p-1 group-hover:scale-105 group-hover:border-[#5A1E65] transition-all duration-200">
                <img 
                  src="/images/logo-square.png" 
                  alt="Diversity Collective Ventura County Official Logo" 
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="flex flex-col justify-center flex-shrink-0">
                {/* On mobile: compact stacked two lines matching mockup */}
                <div className="flex flex-col sm:hidden leading-none">
                  <span className="font-display font-black text-[13px] tracking-tight text-slate-950 group-hover:text-[#5A1E65] transition-colors">
                    diversity
                  </span>
                  <span className="font-display font-black text-[13px] tracking-tight text-slate-950 group-hover:text-[#5A1E65] transition-colors mt-0.5">
                    collective
                  </span>
                </div>

                {/* On sm+: single line with subtitle */}
                <span className="hidden sm:block font-display font-extrabold text-base md:text-xl tracking-tight leading-tight text-slate-950 group-hover:text-[#5A1E65] transition-colors whitespace-nowrap">
                  Diversity Collective
                </span>
                <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] md:text-xs font-bold tracking-[0.14em] text-[#5A1E65] uppercase whitespace-nowrap">
                    Ventura County
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100/70 text-[#5A1E65] border border-purple-300/80 leading-none whitespace-nowrap">
                    501(c)(3)
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Center Navigation - Clean 5 Pillars + "More" Dropdown to Guarantee Zero Collision */}
            <nav id="main-navigation" className="hidden xl:flex items-center gap-1 xl:gap-1.5 2xl:gap-2 flex-shrink min-w-0 mr-2 lg:mr-4" aria-label="Main Navigation">
              {/* Primary 5 Pillars */}
              {primaryNavItems.map((item) => {
                const isActive = location.pathname === item.to || 
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-2.5 2xl:px-3 py-1.5 2xl:py-2 text-xs 2xl:text-sm font-bold rounded-full transition-all whitespace-nowrap ${
                      isActive 
                        ? 'text-white bg-gradient-to-r from-[#5A1E65] to-purple-700 shadow-md shadow-purple-500/20' 
                        : 'text-black hover:text-white hover:bg-gradient-to-r hover:from-[#5A1E65] hover:to-purple-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* "More" Dropdown on desktop (Directory, Training, News, Gallery) */}
              <div className="relative" ref={moreDropdownRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen(!moreOpen)}
                  onMouseEnter={() => setMoreOpen(true)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap inline-flex items-center gap-1 cursor-pointer ${
                    isSecondaryActive || moreOpen
                      ? 'text-white bg-gradient-to-r from-[#5A1E65] to-purple-700 shadow-md shadow-purple-500/20'
                      : 'text-black hover:text-white hover:bg-gradient-to-r hover:from-[#5A1E65] hover:to-purple-700'
                  }`}
                >
                  <span>More</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreOpen && (
                  <div
                    onMouseLeave={() => setMoreOpen(false)}
                    className="absolute left-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-purple-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ring-4 ring-purple-500/10"
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
                            onClick={() => setMoreOpen(false)}
                            className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-[#5A1E65] to-purple-700 text-white font-bold shadow-xs'
                                : 'text-black font-bold hover:bg-purple-100 hover:text-[#5A1E65]'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-purple-100/70 text-[#5A1E65]'}`}>
                              <ItemIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-black'}`}>{item.label}</span>
                              <span className={`text-[10px] leading-tight mt-0.5 truncate ${isActive ? 'text-purple-100' : 'text-slate-500'}`}>{item.desc}</span>
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
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-fit">
              {/* Language Selector Dropdown (Desktop & Tablet: hidden on mobile < sm, available in mobile drawer) */}
              <div className="hidden sm:block">
                <LanguageSelector variant="header" />
              </div>

              {/* Accessibility Companion Launcher Button (Desktop & Tablet: hidden on mobile < sm, floating ReciteLauncher is present) */}
              <button
                type="button"
                onClick={() => a11yStore.toggleToolbar()}
                className="hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-300/90 bg-white hover:bg-purple-50 items-center justify-center text-slate-800 hover:text-[#5A1E65] transition-all flex-shrink-0 cursor-pointer shadow-2xs"
                title="Launch DCVC Accessibility Companion (Alt + A)"
                aria-label="Launch Accessibility & Audio Tools"
              >
                <TraditionalAccessibilityIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5A1E65] flex-shrink-0" />
              </button>

              {/* Quick Exit Shield Button (Always visible on mobile & desktop for crisis safety) */}
              <button
                onClick={handleQuickExit}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-rose-700 bg-rose-50/95 hover:bg-rose-100 border border-rose-200/90 rounded-full transition-all shadow-2xs cursor-pointer flex-shrink-0 whitespace-nowrap"
                title="Quickly exit to Google for your privacy and safety"
              >
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 flex-shrink-0" />
                <span className="hidden min-[400px]:inline">{translationService.t('nav_quick_exit', 'Quick Exit')}</span>
                <span className="min-[400px]:hidden">Exit</span>
              </button>

              {/* Get Support (Large desktop screens 1600px+) */}
              <Link
                to="/programs"
                className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-[#5A1E65] border border-slate-200 hover:border-purple-300 rounded-full transition-colors bg-white shadow-2xs flex-shrink-0 whitespace-nowrap"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-[#5A1E65]" />
                <span>{translationService.t('nav_get_support', 'Get Support')}</span>
              </Link>

              {/* Official Donate Action - Warm Gold Pill (Never Cropped) */}
              <Link
                to="/donate"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold tracking-wide text-slate-950 bg-[#FDE047] hover:bg-[#FACC15] active:bg-[#EAB308] border border-amber-300/80 rounded-full shadow-xs hover:shadow-md transition-all flex-shrink-0 whitespace-nowrap z-10"
              >
                <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-slate-950 flex-shrink-0" />
                <span className="font-extrabold">{translationService.t('nav_donate', 'Donate')}</span>
              </Link>

              {/* Mobile & Tablet Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-drawer"
                className="xl:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-800 hover:text-slate-950 focus:outline-none rounded-lg hover:bg-purple-100/60 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-slate-900" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Drawer (Layered at z-[100]) */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation" className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm xl:hidden flex flex-col justify-end animate-fadeIn">
          
          <div className="bg-white w-full h-[95vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
            
            {/* Drawer Header Bar */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-purple-200 bg-white p-0.5 shadow-2xs flex-shrink-0">
                  <img 
                    src="/images/logo-square.png" 
                    alt="DCVC Emblem" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-display font-extrabold text-sm text-slate-950 block leading-tight">
                    Diversity Collective
                  </span>
                  <span className="text-[10px] font-bold text-[#5A1E65] uppercase tracking-wider block">
                    Ventura County Sanctuary
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickExit}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-950 rounded-full border border-slate-200 bg-white inline-flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  <span>Exit</span>
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 divide-y divide-slate-100">
              
              {/* Mobile Language Selector Chips */}
              <LanguageSelector variant="mobile" className="pb-3" />

              {/* Chat with Luna (AI Community Guide) Quick Action */}
              <button 
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('openAskDcvc'));
                }}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-amber-50/50 border border-purple-200/90 hover:border-purple-400 transition-all group w-full text-left cursor-pointer shadow-2xs pt-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5A1E65] to-purple-800 text-amber-300 flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 group-hover:text-[#5A1E65] text-sm block">Ask Luna</span>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Free AI Guide
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">Ask about testing, hours, youth circles & resources</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5A1E65] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-purple-50/60 transition-colors group pt-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100/80 text-[#5A1E65] flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 group-hover:text-[#5A1E65] text-sm block">Home</span>
                    <span className="text-[11px] text-slate-500">Sanctuary homepage & announcements</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
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
                    className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-all group ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-bold shadow-md' 
                        : 'text-black font-bold hover:bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 group-hover:bg-purple-100 group-hover:text-[#5A1E65]'
                      }`}>
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className={`font-bold text-sm block ${
                          isActive ? 'text-white' : 'text-black'
                        }`}>
                          {item.label}
                        </span>
                        <span className={`text-[11px] block ${
                          isActive ? 'text-purple-100' : 'text-slate-500'
                        }`}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`} />
                  </Link>
                );
              })}

              <Link 
                to="/contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-purple-50/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 group-hover:text-teal-800 text-sm block">Contact & Directions</span>
                    <span className="text-[11px] text-slate-500">2471 Portola Road, Suite 100, Ventura</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Mobile Accessibility Companion Toggle */}
              <button 
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  a11yStore.toggleToolbar();
                }}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-amber-50/70 transition-colors group w-full text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-[#5A1E65] flex items-center justify-center flex-shrink-0">
                    <TraditionalAccessibilityIcon className="w-4 h-4 text-[#5A1E65]" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 group-hover:text-[#5A1E65] text-sm block">Accessibility Companion</span>
                    <span className="text-[11px] text-slate-500">Speech reader, focus audio, dyslexia fonts & contrast</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

            </div>

            {/* Bottom Mobile Action Drawer Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/90 flex flex-col gap-2.5">
              <Link
                to="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full py-3 text-center text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Make a Tax-Deductible Donation</span>
              </Link>

              <a
                href={`tel:${orgInfo.phone.replace(/[^0-9]/g, '')}`}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#5A1E65]" />
                <span>Call Sanctuary: {orgInfo.phone}</span>
              </a>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
