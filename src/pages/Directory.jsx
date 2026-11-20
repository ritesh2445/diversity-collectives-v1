import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Phone, 
  Globe, 
  CheckCircle2, 
  Sparkles, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { businessDirectorySeed } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';
import SendVoicemailButton from '../components/SendVoicemailButton';
import MobileCarousel from '../components/MobileCarousel';
import DcvcApprovedBadge from '../components/DcvcApprovedBadge';
import { usePageMeta } from '../utils/seo';

function getDirectoryCardGradient(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('coffee') || cat.includes('dining') || cat.includes('food')) {
    return {
      from: '#FFF7ED',
      via: '#FFFAF5',
      to: '#FFFFFF',
      accent: '#EA580C',
      border: '#FED7AA'
    };
  }
  if (cat.includes('health') || cat.includes('wellness') || cat.includes('therapy')) {
    return {
      from: '#FAF5FF',
      via: '#FDFBFF',
      to: '#FFFFFF',
      accent: '#5A1E65',
      border: '#DDD6FE'
    };
  }
  if (cat.includes('legal') || cat.includes('financial') || cat.includes('law')) {
    return {
      from: '#F0F9FF',
      via: '#F8FCFF',
      to: '#FFFFFF',
      accent: '#0284C7',
      border: '#BAE6FD'
    };
  }
  if (cat.includes('arts') || cat.includes('media') || cat.includes('culture')) {
    return {
      from: '#FDF2F8',
      via: '#FEF9FC',
      to: '#FFFFFF',
      accent: '#DB2777',
      border: '#FBCFE8'
    };
  }
  if (cat.includes('retail') || cat.includes('shopping') || cat.includes('books')) {
    return {
      from: '#F5F3FF',
      via: '#FAF9FF',
      to: '#FFFFFF',
      accent: '#4F46E5',
      border: '#C7D2FE'
    };
  }
  return {
    from: '#FAF7FD',
    via: '#FDFBFF',
    to: '#FFFFFF',
    accent: '#5A1E65',
    border: '#E9D5FF'
  };
}

const LOCAL_STORAGE_KEY = 'dcvc_live_directory_businesses';

function getLiveBusinesses() {
  if (typeof window === 'undefined') return businessDirectorySeed;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(businessDirectorySeed));
      return businessDirectorySeed;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : businessDirectorySeed;
  } catch (err) {
    console.warn('[Directory] Failed to read live businesses from localStorage:', err);
    return businessDirectorySeed;
  }
}

export default function Directory() {
  usePageMeta({
    title: 'LGBTQ+ Affirming Business Directory',
    description: 'Explore verified LGBTQ+ owned and affirming businesses across Ventura County. Find welcoming dining, healthcare, legal services, retail, and more.',
    canonicalPath: '/directory'
  });

  const [businessesList, setBusinessesList] = useState(getLiveBusinesses);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All'); // 'All' | '2025-2026' | '2020-2024' | 'pre-2020'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    let isMounted = true;
    const handleSync = () => setBusinessesList(getLiveBusinesses());
    window.addEventListener('storage', handleSync);
    window.addEventListener('dcvc-directory-updated', handleSync);

    // Fetch approved businesses live from cloud API on mount
    const fetchCloudDirectory = async () => {
      try {
        const apiBase = typeof window !== 'undefined' && window.location.origin.includes('localhost')
          ? 'http://localhost:8787'
          : 'https://dcvc-api.diversity-collective-vc.workers.dev';
        const res = await fetch(`${apiBase}/api/directory?limit=100`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.businesses) && data.businesses.length > 0 && isMounted) {
            setBusinessesList(data.businesses);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.businesses));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('[Directory] Cloud fetch fallback to local:', err);
      }
    };
    fetchCloudDirectory();

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('dcvc-directory-updated', handleSync);
    };
  }, []);

  const categories = [
    'All',
    'Dining & Coffee',
    'Health & Wellness',
    'Legal & Financial',
    'Retail & Gifts',
    'Fitness & Recreation',
    'Professional Services'
  ];

  const cities = [
    'All',
    'Ventura',
    'Oxnard',
    'Camarillo',
    'Ojai',
    'Thousand Oaks',
    'Simi Valley'
  ];

  const dateFilters = [
    { label: 'All Launch Dates', value: 'All' },
    { label: 'Newest (2025 – 2026)', value: '2025-2026' },
    { label: 'Established (2020 – 2024)', value: '2020-2024' },
    { label: 'Heritage / Pre-2020', value: 'pre-2020' }
  ];

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const filteredBusinesses = useMemo(() => {
    return businessesList.filter((biz) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (biz.name && biz.name.toLowerCase().includes(q)) ||
        (biz.category && biz.category.toLowerCase().includes(q)) ||
        (biz.ownerName && biz.ownerName.toLowerCase().includes(q)) ||
        (biz.owner_name && biz.owner_name.toLowerCase().includes(q)) ||
        (biz.owner && biz.owner.toLowerCase().includes(q)) ||
        (biz.description && biz.description.toLowerCase().includes(q)) ||
        (biz.city && biz.city.toLowerCase().includes(q)) ||
        (Array.isArray(biz.tags) && biz.tags.some(t => t.toLowerCase().includes(q)));

      const matchesCat = selectedCategory === 'All' || biz.category === selectedCategory;
      const matchesCity = selectedCity === 'All' || biz.city === selectedCity;

      // Date launched filter matching
      let matchesDate = true;
      const launchYear = parseInt(biz.dateLaunched || biz.yearEstablished || '2022', 10);
      if (selectedDateFilter === '2025-2026') {
        matchesDate = launchYear >= 2025;
      } else if (selectedDateFilter === '2020-2024') {
        matchesDate = launchYear >= 2020 && launchYear <= 2024;
      } else if (selectedDateFilter === 'pre-2020') {
        matchesDate = launchYear < 2020;
      }

      return matchesSearch && matchesCat && matchesCity && matchesDate;
    });
  }, [businessesList, searchQuery, selectedCategory, selectedCity, selectedDateFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredBusinesses.length / pageSize) || 1;
  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBusinesses.slice(start, start + pageSize);
  }, [filteredBusinesses, currentPage, pageSize]);

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Mobile-Friendly Action Header: Guaranteed zero cutoff in mobile view */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="max-w-2xl flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
                VENTURA COUNTY AFFIRMING NETWORK
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                100% Verified
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
              LGBTQ+ Business <br />
              <span className="font-serif italic font-normal text-[#5A1E65]">Directory.</span>
            </h1>
            <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-slate-700 leading-relaxed pt-1">
              Discover verified welcoming spaces, healthcare providers, and local services across all 10 Ventura County cities.
            </p>
          </div>

          {/* Submit Your Business CTA - Prominent & Fully Visible on Mobile Screens */}
          <div className="w-full sm:w-auto flex-shrink-0">
            <Link
              to="/directory/submit"
              className="btn-primary py-3.5 px-6 text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl w-full sm:w-auto text-center cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>Submit Your Business</span>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
          
          {/* Search Box with Search Business Button */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by business name, category, owner name, or city..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white focus:ring-2 focus:ring-purple-100 rounded-2xl outline-none font-medium text-slate-900"
              />
            </div>
            
            <button
              type="submit"
              className="btn-primary py-3 px-6 text-xs font-extrabold shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search Business</span>
            </button>

            {(searchQuery || selectedCategory !== 'All' || selectedCity !== 'All' || selectedDateFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedCity('All');
                  setSelectedDateFilter('All');
                  setCurrentPage(1);
                }}
                className="py-3 px-4 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer text-center"
              >
                Reset Filters
              </button>
            )}
          </form>

          {/* Secondary Filter Dropdowns (Category, City, Date Launched) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            
            {/* Category Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white rounded-xl outline-none font-medium text-slate-800"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>Category: {cat}</option>
                ))}
              </select>
            </div>

            {/* City Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                City / Region
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white rounded-xl outline-none font-medium text-slate-800"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>City: {city}</option>
                ))}
              </select>
            </div>

            {/* Date Launched / Added Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Date Launched / Added
              </label>
              <select
                value={selectedDateFilter}
                onChange={(e) => {
                  setSelectedDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white rounded-xl outline-none font-medium text-slate-800"
              >
                {dateFilters.map((df) => (
                  <option key={df.value} value={df.value}>{df.label}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Category Quick Pills */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border-purple-500 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Directory Grid */}
      <section className="container-clean py-16 space-y-12">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
          <span>Showing {filteredBusinesses.length} Verified Affirming Listings</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>

        {paginatedBusinesses.length === 0 ? (
          <div className="p-16 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-display text-xl font-bold text-slate-900">No businesses match your current search.</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or clearing your city, category, or launch date filters.</p>
            <button
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedCity('All');
                setSelectedDateFilter('All');
                setCurrentPage(1);
              }}
              className="btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <MobileCarousel cols={3} autoScrollMs={0} cardClassName="h-full flex flex-col">
            {paginatedBusinesses.map((biz) => {
              const isApproved = biz.is_verified !== undefined
                ? Boolean(biz.is_verified)
                : (biz.isVerifiedAffirming !== undefined
                    ? Boolean(biz.isVerifiedAffirming)
                    : (biz.affirmingPledgeSignedAt || Boolean(biz.ownerName)));
              const grad = getDirectoryCardGradient(biz.category);

              const cardContent = (
                <CardSpotlight
                  key={biz.id}
                  className={`p-6 sm:p-7 rounded-[23px] transition-all flex flex-col justify-between gap-6 group h-full w-full ${
                    isApproved ? '' : 'border-2'
                  }`}
                  style={{
                    background: `linear-gradient(155deg, ${grad.from} 0%, ${grad.via} 48%, ${grad.to} 100%)`,
                    borderColor: isApproved ? 'transparent' : (grad.border || '#E2E8F0'),
                    boxShadow: isApproved
                      ? undefined
                      : '0 4px 20px -2px rgba(90, 30, 101, 0.08), 0 2px 8px -1px rgba(0, 0, 0, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)'
                  }}
                  tilt={true}
                  maxTilt={3}
                  glare={true}
                >
                  <div className="space-y-4">
                    {/* Photo Thumbnail */}
                    <div className="h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative shadow-inner">
                      <img
                        src={biz.image || biz.cover_url || "/images/community-gathering.jpg"}
                        alt={biz.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.src = "/images/community-gathering.jpg"; }}
                      />

                      {/* Top-Left: DCVC Approved Flipping Badge with Glow */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        {isApproved && <DcvcApprovedBadge />}
                      </div>

                      {/* Top-Right: LGBTQ+ Owned Badge */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                        {biz.isLGBTQOwned && (
                          <span className="glass-pill text-[10px] font-black uppercase tracking-wider text-purple-900 bg-white/95 border-purple-200 shadow-xs">
                            🌈 LGBTQ+ Owned
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs"
                          style={{
                            backgroundColor: `${grad.accent}14`,
                            color: grad.accent,
                            border: `1px solid ${grad.border}`
                          }}
                        >
                          {biz.category}
                        </span>
                        <span className="text-slate-600 font-bold">{biz.city}, CA</span>
                      </div>

                      <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight group-hover:text-[#5A1E65] transition-colors leading-snug">
                        <Link to={`/directory/${biz.slug}`}>
                          {biz.name}
                        </Link>
                      </h3>

                      {/* Owner / Launch Details */}
                      {(biz.ownerName || biz.owner || biz.owner_name || biz.dateLaunched) && (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium mt-1.5">
                          {(biz.ownerName || biz.owner || biz.owner_name) && (
                            <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                              <User className="w-3 h-3 text-[#5A1E65]" />
                              <span>{biz.ownerName || biz.owner || biz.owner_name}</span>
                            </span>
                          )}
                          {biz.dateLaunched && (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              <span>Launched {biz.dateLaunched}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description in refined card container */}
                      <div className="mt-2.5 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                        <p className="text-xs text-slate-700 leading-relaxed font-serif italic line-clamp-3">
                          &ldquo;{biz.description}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {Array.isArray(biz.tags) && biz.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {biz.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-slate-700 bg-white/90 border border-slate-200/80 shadow-2xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-3 text-xs font-bold mt-auto">
                    <Link
                      to={`/directory/${biz.slug}`}
                      className="text-[#5A1E65] hover:underline inline-flex items-center gap-1 font-extrabold"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {biz.phone && (
                      biz.voicemailOnly ? (
                        <SendVoicemailButton
                          label="Voicemail"
                          subject={`Directory Inquiry: ${biz.name}`}
                          compact
                        />
                      ) : (
                        <a
                          href={`tel:${biz.phone.replace(/[^0-9]/g, '')}`}
                          className="text-slate-700 hover:text-slate-950 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
                          title={biz.phone}
                        >
                          <Phone className="w-3.5 h-3.5 text-[#5A1E65]" />
                          <span className="font-bold">{biz.phone}</span>
                        </a>
                      )
                    )}

                    {biz.website && (
                      <a
                        href={biz.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-700 hover:text-slate-950 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors font-bold"
                      >
                        <Globe className="w-3.5 h-3.5 text-[#5A1E65]" />
                        <span>Visit Web</span>
                      </a>
                    )}
                  </div>
                </CardSpotlight>
              );

              return (
                <div key={biz.id} className="h-full flex flex-col">
                  {isApproved ? (
                    <div className="p-[2.5px] rounded-[26px] rainbow-edge-glow-wrapper transition-all duration-300 h-full flex flex-col">
                      {cardContent}
                    </div>
                  ) : (
                    cardContent
                  )}
                </div>
              );
            })}
          </MobileCarousel>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-purple-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-purple-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </section>

    </div>
  );
}
