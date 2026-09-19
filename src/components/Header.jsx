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
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-xl ${
          scrolled ? 'border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] py-2.5' : 'border-b border-slate-100/80 py-3.5'
        }`}
      >
        <div className="container-clean">
          <div className="flex items-center justify-between gap-2 sm:gap-6">
            
            <Link 
              to="/" 
              className="flex items-center gap-2.5 sm:gap-4.5 group focus:outline-none flex-shrink-0 min-w-0"
              aria-label="Diversity Collective Ventura County"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border-2 border-purple-100/80 bg-white flex-shrink-0 flex items-center justify-center p-1 group-hover:scale-105 group-hover:border-[#5A1E65] transition-all duration-200">
                <img 
                  src="/images/logo-square.png" 
                  alt="Diversity Collective Ventura County Official Logo" 
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-display font-extrabold text-base sm:text-2xl md:text-[1.65rem] tracking-tight leading-tight text-slate-900 group-hover:text-[#5A1E65] transition-colors truncate">
                  Diversity Collective
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                  <span className="text-[10px] sm:text-sm font-bold tracking-[0.16em] sm:tracking-[0.18em] text-[#5A1E65] uppercase">
                    Ventura County
                  </span>
                  <span className="hidden xl:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200/60 leading-none">
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

            {/* Right CTAs */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Discreet Quick Exit */}
              <button
                onClick={handleQuickExit}
                className="btn-exit-clean hidden sm:inline-flex"
                title="Quickly exit to Google for your privacy"
              >
                <Shield className="w-3 h-3" />
                <span>Quick Exit</span>
              </button>

              {/* Get Support */}
              <Link
                to="/programs"
                className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#692976] border border-slate-200 hover:border-slate-300 rounded-full transition-colors"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-[#692976]" />
                <span>Get Support</span>
              </Link>

              {/* Official Donate Action */}
              <a
                href={orgInfo.donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-1.5 sm:py-2 px-3 sm:px-5 text-xs font-semibold tracking-wide inline-flex items-center gap-1.5 shadow-xs flex-shrink-0"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Donate</span>
              </a>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none rounded-lg"
                aria-label={mobileMenuOpen ? "Close Menu" : "Open Navigation Menu"}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 pb-12 px-6 flex flex-col justify-between overflow-y-auto lg:hidden">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="badge-clean">NAVIGATION</span>
              <button onClick={handleQuickExit} className="btn-exit-clean">
                <Shield className="w-3 h-3" />
                <span>Quick Exit</span>
              </button>
            </div>

            <nav className="flex flex-col space-y-3">
              <Link to="/" className="font-display text-2xl font-bold text-slate-900 py-1">
                Home
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="font-display text-2xl font-bold text-slate-800 hover:text-[#692976] py-1 flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-5 h-5 text-slate-400" />
                </Link>
              ))}
              <Link to="/contact" className="font-display text-2xl font-bold text-slate-800 hover:text-[#692976] py-1 flex items-center justify-between">
                <span>Contact & Visit</span>
                <ArrowUpRight className="w-5 h-5 text-slate-400" />
              </Link>
            </nav>
          </div>

          <div className="pt-8 border-t border-slate-100 space-y-4">
            <a
              href={orgInfo.donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center"
            >
              Make a Donation
            </a>
            <div className="text-xs text-slate-500 pt-2 space-y-1 text-center">
              <p className="font-semibold text-slate-700">Community Resource Center</p>
              <p>2471 Portola Road, Suite 100, Ventura, CA</p>
              <p className="text-[#692976] font-semibold">{orgInfo.phone}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


