import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Filter,
  Star,
  Flame,
  Clock,
  Navigation,
  LayoutGrid,
  Map as MapIcon,
  SlidersHorizontal,
  Building2
} from 'lucide-react';
import { businessDirectorySeed } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';
import SendVoicemailButton from '../components/SendVoicemailButton';
import MobileCarousel from '../components/MobileCarousel';
import DcvcApprovedBadge from '../components/DcvcApprovedBadge';
import AirDropPulseWaves from '../components/AirDropPulseWaves';
import DirectoryRateModal from '../components/DirectoryRateModal';
import DirectoryClaimModal from '../components/DirectoryClaimModal';
import DirectoryMapView from '../components/DirectoryMapView';
import { directoryService } from '../services/directoryService';
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

export function isValidBusinessWebsite(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().trim();
  if (lower === '' || lower.includes('example.com') || lower.includes('example.org') || lower.includes('.example') || lower === '#' || lower === 'http://' || lower === 'https://') {
    return false;
  }
  return lower.startsWith('http://') || lower.startsWith('https://');
}

export function isRealApprovedBusiness(biz) {
  if (!biz || !biz.name) return false;
  // Exclude demo placeholders biz-2 through biz-6 with example.com
  if (['biz-2', 'biz-3', 'biz-4', 'biz-5', 'biz-6'].includes(biz.id)) return false;
  const website = String(biz.website || '').toLowerCase();
  if (website.includes('example.com') || website.includes('.example')) return false;
  const phone = String(biz.phone || '');
  if (phone.includes('555-01')) return false;
  return true;
}

const LOCAL_STORAGE_KEY = 'dcvc_live_directory_businesses';

function getLiveBusinesses() {
  if (typeof window === 'undefined') return businessDirectorySeed.filter(isRealApprovedBusiness);
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      const cleanList = businessDirectorySeed.filter(isRealApprovedBusiness);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanList));
      return cleanList;
    }
    const parsed = JSON.parse(stored);
    const valid = Array.isArray(parsed) && parsed.length > 0 ? parsed.filter(isRealApprovedBusiness) : businessDirectorySeed.filter(isRealApprovedBusiness);
    return valid;
  } catch (err) {
    console.warn('[Directory] Failed to read live businesses from localStorage:', err);
    return businessDirectorySeed.filter(isRealApprovedBusiness);
  }
}

export default function Directory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCity = searchParams.get('city');

  usePageMeta({
    title: 'LGBTQ+ Affirming Business Directory',
    description: 'Explore verified LGBTQ+ owned and affirming businesses across Ventura County. Find welcoming dining, healthcare, legal services, retail, and more.',
    canonicalPath: '/directory'
  });

  const [businessesList, setBusinessesList] = useState(getLiveBusinesses);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState(urlCity || 'All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Keep selectedCity in sync if query param changes
  useEffect(() => {
    if (urlCity) {
      setSelectedCity(urlCity);
      setCurrentPage(1);
    }
  }, [urlCity]);

  // Yelp-Style View Modes & Filters
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'open_now' | 'approved' | 'lgbtq_owned' | 'top_rated' | 'most_hyped' | 'saved'
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'rating' | 'hypes' | 'newest' | 'alphabetical'
  const [savedCount, setSavedCount] = useState(() => directoryService.getSavedBusinesses().length);

  // Modals & AirDrop Hype State
  const [ratingModalBiz, setRatingModalBiz] = useState(null);
  const [claimModalBiz, setClaimModalBiz] = useState(null);
  const [activeHypeId, setActiveHypeId] = useState(null);
  const [hypeRandomSeed, setHypeRandomSeed] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const handleSync = () => {
      setBusinessesList(getLiveBusinesses());
      setSavedCount(directoryService.getSavedBusinesses().length);
    };
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

  // Trigger AirDrop Radar Animation & Record Hype
  const handleTriggerHype = async (biz) => {
    const id = biz.id || biz.slug;
    setHypeRandomSeed(Math.floor(Math.random() * 1000) + 1);
    setActiveHypeId(id);
    await directoryService.hypeBusiness(id);
    setTimeout(() => {
      setActiveHypeId(null);
    }, 2200);
  };

  const filteredBusinesses = useMemo(() => {
    const savedIds = new Set(directoryService.getSavedBusinesses());

    const result = businessesList.filter((biz) => {
      // Prune dummy/example placeholder businesses
      const site = String(biz.website || '').toLowerCase();
      const id = String(biz.id || '').toLowerCase();
      if (site.includes('example.com') || site.includes('.example') || id === 'biz-3' || id === 'biz-4' || id === 'biz-5' || id === 'biz-6') {
        return false;
      }

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

      // Yelp Quick Filter Pill matching
      let matchesQuick = true;
      const isApproved = Boolean(biz.is_verified || biz.isVerifiedAffirming || biz.verified);
      const stats = directoryService.getBusinessStats(biz);

      if (quickFilter === 'open_now') {
        matchesQuick = directoryService.getOpenStatus(biz).isOpen;
      } else if (quickFilter === 'approved') {
        matchesQuick = isApproved;
      } else if (quickFilter === 'lgbtq_owned') {
        matchesQuick = Boolean(biz.isLGBTQOwned);
      } else if (quickFilter === 'top_rated') {
        matchesQuick = stats.ratingCount > 0 && stats.rating >= 4.0;
      } else if (quickFilter === 'most_hyped') {
        matchesQuick = stats.hypes > 0;
      } else if (quickFilter === 'saved') {
        matchesQuick = savedIds.has(biz.id || biz.slug);
      }

      return matchesSearch && matchesCat && matchesCity && matchesDate && matchesQuick;
    });

    // Yelp-Style Sorting
    return result.sort((a, b) => {
      const statsA = directoryService.getBusinessStats(a);
      const statsB = directoryService.getBusinessStats(b);

      if (sortBy === 'rating') {
        return statsB.rating - statsA.rating || statsB.ratingCount - statsA.ratingCount;
      }
      if (sortBy === 'hypes') {
        return statsB.hypes - statsA.hypes;
      }
      if (sortBy === 'newest') {
        const yearA = parseInt(a.dateLaunched || a.yearEstablished || '2020', 10);
        const yearB = parseInt(b.dateLaunched || b.yearEstablished || '2020', 10);
        return yearB - yearA;
      }
      if (sortBy === 'alphabetical') {
        return (a.name || '').localeCompare(b.name || '');
      }

      // Default: Featured / DCVC Approved first
      const appA = Boolean(a.is_verified || a.isVerifiedAffirming || a.verified);
      const appB = Boolean(b.is_verified || b.isVerifiedAffirming || b.verified);
      if (appA && !appB) return -1;
      if (!appA && appB) return 1;
      return statsB.hypes - statsA.hypes;
    });
  }, [businessesList, searchQuery, selectedCategory, selectedCity, selectedDateFilter, quickFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredBusinesses.length / pageSize) || 1;
  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBusinesses.slice(start, start + pageSize);
  }, [filteredBusinesses, currentPage, pageSize]);

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-8 md:pb-10 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Responsive Fluid Header */}
        <div className="flex flex-col gap-5 relative z-10">
          <div className="max-w-4xl flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
                VENTURA COUNTY AFFIRMING NETWORK
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                100% Verified
              </span>
            </div>
            <h1 className="font-display text-[clamp(2rem,4.6vw,3.75rem)] font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              LGBTQ+ Business{' '}
              <span className="font-serif italic font-normal text-[#5A1E65]">Directory.</span>
            </h1>
            <p className="font-serif italic text-[clamp(1rem,1.65vw,1.35rem)] text-slate-700 leading-relaxed">
              Discover verified welcoming spaces, healthcare providers, and local services across all 10 Ventura County cities.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* View Mode Toggle: Grid vs Map */}
            <div className="inline-flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#5A1E65] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-[#5A1E65] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Regional Map</span>
              </button>
            </div>

            <Link
              to="/directory/submit"
              className="btn-primary py-3 px-5 rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-purple-900/10 hover:shadow-purple-900/20 text-center whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-amber-300 shrink-0" />
              <span>List Your Business</span>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar & Yelp Search Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-4">
          {/* Main Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by business name, category, owner, tags, or keywords (e.g. coffee, therapy, books)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-28 py-3.5 text-xs sm:text-sm bg-white border border-slate-200 focus:border-[#5A1E65] rounded-2xl shadow-sm outline-none font-medium text-slate-900 placeholder:text-slate-400 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 hover:bg-[#5A1E65] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Yelp-Style Quick Filter Pills & Sorting Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <SlidersHorizontal className="w-3 h-3 text-[#5A1E65]" />
                <span>Filter:</span>
              </span>
              {[
                { id: 'all', label: 'All Listings' },
                { id: 'open_now', label: '🟢 Open Now' },
                { id: 'approved', label: '✨ DCVC Approved' },
                { id: 'lgbtq_owned', label: '🌈 LGBTQ+ Owned' },
                { id: 'top_rated', label: '★ Highest Rated' },
                { id: 'most_hyped', label: '🔥 Most Hyped' },
                { id: 'saved', label: `❤️ Saved (${savedCount})` }
              ].map(pill => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    setQuickFilter(pill.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    quickFilter === pill.id
                      ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                      : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 focus:border-[#5A1E65] rounded-xl outline-none font-bold text-slate-900 cursor-pointer shadow-2xs"
              >
                <option value="featured">Featured & Approved</option>
                <option value="rating">Highest Rated (★)</option>
                <option value="hypes">Most Hyped (🔥)</option>
                <option value="newest">Newest Launched</option>
                <option value="alphabetical">Alphabetical (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Secondary Filters: City, Category & Launch Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* City Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Filter by City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white rounded-xl outline-none font-medium text-slate-800 shadow-2xs"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>{city === 'All' ? 'All Cities' : `${city}, CA`}</option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white rounded-xl outline-none font-medium text-slate-800 shadow-2xs"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>

            {/* Date Launched Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Date Launched / Heritage
              </label>
              <select
                value={selectedDateFilter}
                onChange={(e) => {
                  setSelectedDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white rounded-xl outline-none font-medium text-slate-800 shadow-2xs"
              >
                {dateFilters.map((df) => (
                  <option key={df.value} value={df.value}>{df.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Directory Content Section (Cards Grid or Regional Map) */}
      <section className="container-clean py-14 space-y-10">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
          <span>Showing {filteredBusinesses.length} Verified Affirming Listings</span>
          {viewMode === 'grid' && <span>Page {currentPage} of {totalPages}</span>}
        </div>

        {viewMode === 'map' ? (
          /* ================================================================
             1. INTERACTIVE REGIONAL MAP VIEW
             ================================================================ */
          <DirectoryMapView
            businesses={filteredBusinesses}
            onHype={handleTriggerHype}
            activeHypeId={activeHypeId}
          />
        ) : filteredBusinesses.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-display text-xl font-bold text-slate-900">No businesses match your current filters.</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try clearing your filters or selecting a different city to discover more affirming spaces.</p>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedCity('All');
                setSelectedDateFilter('All');
                setQuickFilter('all');
                setCurrentPage(1);
              }}
              className="btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          /* ================================================================
             2. YELP-STYLE CARDS GRID WITH AIRDROP PULSE & LIVE METRICS
             ================================================================ */
          <MobileCarousel cols={3} autoScrollMs={0} cardClassName="h-full flex flex-col">
            {paginatedBusinesses.map((biz) => {
              const isApproved = biz.is_verified !== undefined
                ? Boolean(biz.is_verified)
                : (biz.isVerifiedAffirming !== undefined
                    ? Boolean(biz.isVerifiedAffirming)
                    : (biz.affirmingPledgeSignedAt || Boolean(biz.ownerName)));
              const grad = getDirectoryCardGradient(biz.category);

              const stats = directoryService.getBusinessStats(biz);
              const openStatus = directoryService.getOpenStatus(biz);
              const directionsUrl = directoryService.getDirectionsUrl(biz);
              const isCardHyped = activeHypeId === (biz.id || biz.slug);

              const cardContent = (
                <CardSpotlight
                  key={biz.id}
                  className={`p-6 sm:p-7 rounded-[23px] transition-all flex flex-col justify-between gap-4 group h-full w-full relative overflow-hidden ${
                    isApproved ? '' : 'border-2'
                  }`}
                  contentClassName="h-full w-full flex flex-col justify-between gap-4"
                  style={{
                    background: `linear-gradient(155deg, ${grad.from} 0%, ${grad.via} 48%, ${grad.to} 100%)`,
                    borderColor: isApproved ? 'transparent' : (grad.border || '#E2E8F0'),
                    boxShadow: isApproved
                      ? undefined
                      : '0 4px 20px -2px rgba(90, 30, 101, 0.08), 0 2px 8px -1px rgba(0, 0, 0, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)'
                  }}
                  tilt={true}
                  maxTilt={2.8}
                  glare={true}
                >
                  {/* AirDrop Soft Ambient Light Wave Overlay (borderless diffuse glow, GPU-composited) */}
                  <AirDropPulseWaves 
                    active={isCardHyped} 
                    bizId={biz.id || biz.slug}
                    category={biz.category}
                    seed={hypeRandomSeed}
                  />

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

                      {/* Top-Right: Favorite Heart Button & LGBTQ+ Owned Pill */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                        {biz.isLGBTQOwned && (
                          <span className="glass-pill text-[10px] font-black uppercase tracking-wider text-purple-900 bg-white/95 border-purple-200 shadow-xs">
                            🌈 LGBTQ+ Owned
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            directoryService.toggleFavorite(biz.id || biz.slug);
                          }}
                          className="p-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xs hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                          title={stats.isSaved ? 'Remove from favorites' : 'Save to favorites'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${stats.isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-500'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1">
                      {/* Category, Price & City Bar */}
                      <div className="flex items-center justify-between gap-2 text-xs font-bold mb-1.5 h-6">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs truncate"
                            style={{
                              backgroundColor: `${grad.accent}14`,
                              color: grad.accent,
                              border: `1px solid ${grad.border}`
                            }}
                          >
                            {biz.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white text-slate-700 border border-slate-200 shadow-2xs shrink-0">
                            {stats.price}
                          </span>
                        </div>
                        <span className="text-slate-600 font-bold whitespace-nowrap shrink-0">{biz.city}, CA</span>
                      </div>

                      <div className="h-[3.5rem] sm:h-[4rem] flex items-center">
                        <h3 className="font-display text-lg sm:text-xl font-black text-slate-950 tracking-tight group-hover:text-[#5A1E65] transition-colors leading-snug line-clamp-2">
                          <Link to={`/directory/${biz.slug}`}>
                            {biz.name}
                          </Link>
                        </h3>
                      </div>

                      {/* Yelp-Style Star Rating & Hype Action Bar */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-200/50">
                        {/* Rating Pill */}
                        <button
                          type="button"
                          onClick={() => setRatingModalBiz(biz)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/90 hover:bg-amber-100 border border-amber-200 text-amber-950 font-black text-xs transition-colors cursor-pointer group/rate shadow-2xs"
                          title="Click to rate this business"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 group-hover/rate:scale-110 transition-transform" />
                          <span>{stats.rating}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">({stats.ratingCount})</span>
                        </button>

                        {/* Hype Button with AirDrop Wave Trigger */}
                        <button
                          type="button"
                          onClick={() => handleTriggerHype(biz)}
                          disabled={stats.isHyped}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            stats.isHyped
                              ? 'bg-purple-100 text-purple-900 border border-purple-300 opacity-90 cursor-default'
                              : 'bg-gradient-to-r from-purple-700 via-pink-600 to-amber-500 text-white shadow-xs hover:shadow-md hover:scale-102 active:scale-95'
                          }`}
                          title={stats.isHyped ? 'Already hyped from this IP' : 'Tap to Hype this affirming business!'}
                        >
                          <Flame className={`w-3.5 h-3.5 ${stats.isHyped ? 'text-orange-500 fill-orange-400' : 'text-amber-200 fill-amber-200'}`} />
                          <span>{stats.hypes}</span>
                          <span className="text-[10px] opacity-90">{stats.isHyped ? 'Hyped!' : 'Hype'}</span>
                        </button>
                      </div>

                      {/* Real-time Open / Closed Status Badge */}
                      <div className="flex items-center gap-2 mt-2 text-[11px] h-6 overflow-hidden">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                          openStatus.isOpen 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <span>{openStatus.statusText}</span>
                        </span>
                        <span className="text-slate-500 text-[10.5px] truncate">
                          {openStatus.detailText}
                        </span>
                      </div>

                      {/* Owner / Launch Details (uniform height slot) */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-2 h-5 overflow-hidden">
                        {(biz.ownerName || biz.owner || biz.owner_name) && (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-bold truncate">
                            <User className="w-3 h-3 text-[#5A1E65] shrink-0" />
                            <span className="truncate">{biz.ownerName || biz.owner || biz.owner_name}</span>
                          </span>
                        )}
                        {biz.dateLaunched && (
                          <span className="inline-flex items-center gap-1 text-slate-500 shrink-0">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>Launched {biz.dateLaunched}</span>
                          </span>
                        )}
                      </div>

                      {/* Description in uniform-height refined card container */}
                      <div className="mt-2.5 p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs h-[4.85rem] flex items-center overflow-hidden">
                        <p className="text-xs text-slate-700 leading-relaxed font-serif italic line-clamp-3">
                          &ldquo;{biz.description}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Tags (fixed single-row slot so tags never stretch cards unevenly) */}
                    <div className="flex flex-nowrap items-center gap-1.5 pt-1 h-7 overflow-hidden">
                      {(Array.isArray(biz.tags) ? biz.tags.slice(0, 3) : []).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-slate-700 bg-white/90 border border-slate-200/80 shadow-2xs whitespace-nowrap shrink-0"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs font-bold mt-auto shrink-0">
                    <Link
                      to={`/directory/${biz.slug}`}
                      className="text-[#5A1E65] hover:underline inline-flex items-center gap-1 font-extrabold whitespace-nowrap shrink-0"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-slate-700 hover:text-[#5A1E65] transition-colors shrink-0"
                        title="Get Directions on Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>

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
                            className="text-slate-700 hover:text-slate-950 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors whitespace-nowrap"
                            title={biz.phone}
                          >
                            <Phone className="w-3.5 h-3.5 text-[#5A1E65] shrink-0" />
                            <span className="font-bold hidden sm:inline">{biz.phone}</span>
                            <span className="font-bold sm:hidden">Call</span>
                          </a>
                        )
                      )}

                      {isValidBusinessWebsite(biz.website) && (
                        <a
                          href={biz.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-700 hover:text-slate-950 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors font-bold whitespace-nowrap"
                        >
                          <Globe className="w-3.5 h-3.5 text-[#5A1E65] shrink-0" />
                          <span>Web</span>
                        </a>
                      )}
                    </div>
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

        {/* Pagination Controls (Grid View only) */}
        {viewMode === 'grid' && totalPages > 1 && (
          <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                    currentPage === idx + 1
                      ? 'bg-slate-900 text-white shadow-xs font-black'
                      : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* Community Stewardship & Affirming Standards Banner */}
      <section className="container-clean pt-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl relative z-10">
            <span className="glass-pill text-[10px] font-black uppercase tracking-wider text-amber-300 bg-white/10 border-white/20">
              Community Standard & Pledge
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
              Every business verified affirming.
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 leading-relaxed font-medium">
              Every partner pledges zero-tolerance for discrimination, all-gender facility access, and respectful affirmation of all gender identities and orientations.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
            <Link
              to="/directory/submit"
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg transition-all text-center cursor-pointer"
            >
              Apply to Be Listed
            </Link>
          </div>
        </div>
      </section>

      {/* Modals */}
      <DirectoryRateModal
        business={ratingModalBiz}
        isOpen={Boolean(ratingModalBiz)}
        onClose={() => setRatingModalBiz(null)}
      />

      <DirectoryClaimModal
        business={claimModalBiz}
        isOpen={Boolean(claimModalBiz)}
        onClose={() => setClaimModalBiz(null)}
      />

    </div>
  );
}
