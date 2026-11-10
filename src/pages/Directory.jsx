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
import { usePageMeta } from '../utils/seo';

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
    const handleSync = () => setBusinessesList(getLiveBusinesses());
    window.addEventListener('storage', handleSync);
    window.addEventListener('dcvc-directory-updated', handleSync);
    return () => {
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
        (biz.owner && biz.owner.toLowerCase().includes(q)) ||
        (biz.description && biz.description.toLowerCase().includes(q)) ||
        (biz.city && biz.city.toLowerCase().includes(q)) ||
        (biz.tags && biz.tags.some(t => t.toLowerCase().includes(q)));

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
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedBusinesses.map((biz) => (
              <CardSpotlight
                key={biz.id}
                className="p-7 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between gap-6 group"
                tilt={true}
                maxTilt={4}
                glare={true}
              >
                <div className="space-y-4">
                  {/* Photo Thumbnail */}
                  <div className="h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                    <img
                      src={biz.image || "/images/community-gathering.jpg"}
                      alt={biz.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = "/images/community-gathering.jpg"; }}
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {biz.isLGBTQOwned && (
                        <span className="glass-pill text-[10px] font-black uppercase tracking-wider text-purple-900 bg-white/95 border-purple-200 shadow-xs">
                          🌈 LGBTQ+ Owned
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                      <span className="text-[#5A1E65]">{biz.category}</span>
                      <span>{biz.city}, CA</span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight group-hover:text-[#5A1E65] transition-colors">
                      <Link to={`/directory/${biz.slug}`}>
                        {biz.name}
                      </Link>
                    </h3>

                    {/* Owner / Launch Details */}
                    {(biz.ownerName || biz.owner || biz.dateLaunched) && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium mt-1">
                        {(biz.ownerName || biz.owner) && (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                            <User className="w-3 h-3 text-[#5A1E65]" />
                            <span>{biz.ownerName || biz.owner}</span>
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

                    <p className="text-xs text-slate-600 leading-relaxed font-medium mt-2 line-clamp-3">
                      {biz.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {biz.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {biz.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 bg-slate-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs font-bold">
                  <Link
                    to={`/directory/${biz.slug}`}
                    className="text-[#5A1E65] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {biz.phone && (
                    <a
                      href={`tel:${biz.phone.replace(/[^0-9]/g, '')}`}
                      className="text-slate-600 hover:text-slate-950 inline-flex items-center gap-1"
                      title={biz.phone}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  )}

                  {biz.website && (
                    <a
                      href={biz.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-950 inline-flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Web</span>
                    </a>
                  )}
                </div>
              </CardSpotlight>
            ))}
          </div>
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
