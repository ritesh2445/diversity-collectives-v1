import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Heart, LifeBuoy, Phone, Shield } from 'lucide-react';
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

  const navItems = [
    { label: "About", to: "/about" },
    { label: "Programs", to: "/programs" },
    { label: "Community", to: "/community" },
    { label: "Events", to: "/events" },
    { label: "Resources", to: "/resources" },
    { label: "Get Involved", to: "/get-involved" }
  ];

  return (
    <>
      <header 
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-xl ${
          scrolled ? 'border-b border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] py-2' : 'border-b border-slate-100/90 py-2.5 sm:py-3.5'
        }`}
      >
        <div className="container-clean">
          <div className="flex items-center justify-between gap-2 sm:gap-6">
            
            {/* Left Brand Identity */}
            <Link 
              to="/" 
              className="flex items-center gap-2 sm:gap-3 group focus:outline-none flex-shrink-0 min-w-0"
              aria-label="Diversity Collective Ventura County"
            >
              <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-2xs border border-purple-100 bg-white flex-shrink-0 flex items-center justify-center p-0.5 sm:p-1 group-hover:scale-105 group-hover:border-[#5A1E65] transition-all duration-200">
                <img 
                  src="/images/logo-square.png" 
                  alt="Diversity Collective Ventura County Official Logo" 
                  className="w-full h-full object-contain filter drop-shadow-2xs"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-display font-extrabold text-sm xs:text-base sm:text-xl md:text-2xl tracking-tight leading-tight text-slate-900 group-hover:text-[#5A1E65] transition-colors truncate max-w-[155px] xs:max-w-[210px] sm:max-w-none">
                  Diversity Collective
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold tracking-[0.14em] sm:tracking-[0.18em] text-[#5A1E65] uppercase truncate">
                    Ventura County
                  </span>
                  <span className="hidden sm:inline-flex text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200/60 leading-none flex-shrink-0">
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
                    className={`px-3.5 py-2 text-sm font-medium rounded-full transition-colors ${
                      isActive 
                        ? 'text-[#692976] bg-purple-50 font-semibold' 
                        : 'text-slate-640 hover:text-[#692976] hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Buttons Cluster */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Discreet Quick Exit (Desktop/Tablet) */}
              <button
                onClick={handleQuickExit}
                className="hidden md:inline-flex h-9 sm:h-10 px-3.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 items-center gap-1.5 transition-colors cursor-pointer"
                title="Quickly exit to Google for your privacy"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Quick Exit</span>
              </button>

              {/* Get Support Link (Desktop XL) */}
              <Link
                to="/programs"
                className="hidden xl:inline-flex items-center gap-1.5 h-10 px-4 text-xs font-semibold text-slate-700 hover:text-[#692976] border border-slate-200 hover:border-slate-300 rounded-full transition-colors"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-[#692976]" />
                <span>Get Support</span>
              </Link>

              {/* Uniform Donate Button (Mobile & Desktop) */}
              <a
                href={orgInfo.donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 sm:h-10 px-3 xs:px-3.5 sm:px-5 rounded-full bg-[#5A1E65] hover:bg-[#45124E] text-white text-xs sm:text-sm font-bold tracking-wide inline-flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all flex-shrink-0 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-300 flex-shrink-0" />
                <span>Donate</span>
              </a>

              {/* Uniform Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 flex items-center justify-center border border-slate-200/90 active:scale-95 transition-all flex-shrink-0 cursor-pointer shadow-2xs"
                aria-label={mobileMenuOpen ? "Close Menu" : "Open Navigation Menu"}
              >
                {mobileMenuOpen ? <X className="w-4.5 h-4.5 text-slate-800" /> : <Menu className="w-4.5 h-4.5 text-slate-800" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-18 pb-8 px-5 flex flex-col justify-between overflow-y-auto lg:hidden shadow-2xl animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                NAVIGATION
              </span>
              <button 
                onClick={handleQuickExit} 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Quick Exit</span>
              </button>
            </div>

            <nav className="flex flex-col space-y-1">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-display text-lg font-bold text-slate-900 py-3 px-3.5 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-between"
              >
                <span>Home</span>
                <ArrowUpRight className="w-4 h-4 text-slate-300" />
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-display text-lg font-bold text-slate-800 hover:text-[#5A1E65] py-3 px-3.5 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </Link>
              ))}
              <Link 
                to="/contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-display text-lg font-bold text-slate-800 hover:text-[#5A1E65] py-3 px-3.5 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-between"
              >
                <span>Contact & Visit Sanctuary</span>
                <ArrowUpRight className="w-4 h-4 text-slate-300" />
              </Link>
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-3">
            <a
              href={orgInfo.donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-full bg-[#5A1E65] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <Heart className="w-4 h-4 fill-rose-300 text-rose-300" />
              <span>Make a Tax-Deductible Gift</span>
            </a>
            <div className="text-xs text-slate-500 pt-1 space-y-0.5 text-center">
              <p className="font-semibold text-slate-800">Community Resource Center (CRC)</p>
              <p>2471 Portola Road, Suite 100, Ventura, CA</p>
              <a href={`tel:${orgInfo.phone.replace(/[^0-9]/g, '')}`} className="text-[#5A1E65] font-bold block pt-1">
                Helpline: {orgInfo.phone}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
