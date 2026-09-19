import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ArrowUpRight, 
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
  ChevronRight
} from 'lucide-react';
import { orgInfo } from '../data/dcvcData';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer upon route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

  const navItems = [
    { label: "About", to: "/about", icon: Info, desc: "Mission, history & 10-year leadership" },
    { label: "Programs", to: "/programs", icon: Sparkles, desc: "Free HIV/STI testing & youth groups" },
    { label: "Community", to: "/community", icon: Users, desc: "Affirming peer circles & gatherings" },
    { label: "Events", to: "/events", icon: Calendar, desc: "Pride prom, galas & workshops" },
    { label: "Resources", to: "/resources", icon: Compass, desc: "Crisis lines & regional mutual aid" },
    { label: "Get Involved", to: "/get-involved", icon: HeartHandshake, desc: "Volunteer & community support" }
  ];

  return (
    <>
      {/* Primary Sticky Header Bar */}
      <header 
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-200 bg-white/95 backdrop-blur-md ${
          scrolled 
            ? 'border-b border-slate-200 shadow-sm py-2 sm:py-2.5' 
            : 'border-b border-slate-100 py-2.5 sm:py-3.5'
        }`}
      >
        <div className="container-clean px-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-1.5 sm:gap-6 min-w-0">
            
            {/* Logo & Brand Identity */}
            <Link 
              to="/" 
              className="flex items-center gap-1.5 sm:gap-3.5 group focus:outline-none min-w-0 flex-shrink"
              aria-label="Diversity Collective Ventura County"
            >
              <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-xs border-2 border-purple-100 bg-white flex-shrink-0 flex items-center justify-center p-0.5 sm:p-1 group-hover:scale-105 group-hover:border-[#5A1E65] transition-all duration-200">
                <img 
                  src="/images/logo-square.png" 
                  alt="Diversity Collective Ventura County Official Logo" 
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-display font-extrabold text-xs xs:text-sm sm:text-xl md:text-2xl tracking-tight leading-tight text-slate-950 group-hover:text-[#5A1E65] transition-colors truncate">
                  Diversity Collective
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
                  <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold tracking-[0.08em] sm:tracking-[0.18em] text-[#5A1E65] uppercase truncate">
                    Ventura County
                  </span>
                  <span className="hidden xl:inline-flex text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200 leading-none">
                    501(c)(3)
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Center Navigation */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to || 
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3.5 py-2 text-sm font-semibold rounded-full transition-colors ${
                      isActive 
                        ? 'text-[#5A1E65] bg-purple-50 font-bold' 
                        : 'text-slate-600 hover:text-[#5A1E65] hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right CTAs */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Discreet Quick Exit (Tablet & Desktop) */}
              <button
                onClick={handleQuickExit}
                className="btn-exit-clean hidden md:inline-flex"
                title="Quickly exit to Google for your privacy"
              >
                <Shield className="w-3 h-3" />
                <span>Quick Exit</span>
              </button>

              {/* Get Support */}
              <Link
                to="/programs"
                className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#5A1E65] border border-slate-200 hover:border-slate-300 rounded-full transition-colors"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-[#5A1E65]" />
                <span>Get Support</span>
              </Link>

              {/* Official Donate Action */}
              <a
                href={orgInfo.donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-1.5 sm:py-2 px-2.5 xs:px-3 sm:px-5 text-[11px] sm:text-xs font-bold tracking-wide inline-flex items-center gap-1 sm:gap-1.5 shadow-xs flex-shrink-0"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Donate</span>
              </a>

              {/* Mobile Menu Toggle Button (Strict 44x44px Touch Target) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-800 hover:text-slate-950 focus:outline-none rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex-shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Drawer (Layered at z-[100]) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm lg:hidden flex flex-col justify-end animate-fadeIn">
          
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
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 divide-y divide-slate-100">
              
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-purple-50/60 transition-colors group"
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

              {navItems.map((item) => {
                const ItemIcon = item.icon;
                const isActive = location.pathname === item.to || 
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors group ${
                      isActive ? 'bg-purple-50' : 'hover:bg-purple-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-[#5A1E65] text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-purple-100 group-hover:text-[#5A1E65]'
                      }`}>
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className={`font-bold text-sm block ${
                          isActive ? 'text-[#5A1E65]' : 'text-slate-900 group-hover:text-[#5A1E65]'
                        }`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-500">{item.desc}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
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

            </div>

            {/* Bottom Mobile Action Drawer Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/90 flex flex-col gap-2.5">
              <a
                href={orgInfo.donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-3 text-center text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Make a Tax-Deductible Donation</span>
              </a>

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
