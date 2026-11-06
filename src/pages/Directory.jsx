import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Phone, 
  Globe, 
  ArrowRight, 
  ShieldCheck, 
  PlusCircle, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { businessDirectorySeed } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';
import { usePageMeta } from '../utils/seo';

export default function Directory() {
  usePageMeta({
    title: 'LGBTQ+ Affirming Business Directory',
    description: 'Explore verified LGBTQ+ owned and affirming businesses across Ventura County. Find welcoming dining, healthcare, legal services, retail, and more.',
    canonicalPath: '/directory'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

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

  const filteredBusinesses = useMemo(() => {
    return businessDirectorySeed.filter((biz) => {
      const matchesSearch = 
        biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'All' || biz.category === selectedCategory;
      const matchesCity = selectedCity === 'All' || biz.city === selectedCity;

      return matchesSearch && matchesCat && matchesCity;
    });
  }, [searchQuery, selectedCategory, selectedCity]);

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

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="max-w-2xl flex flex-col gap-4">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
              VENTURA COUNTY AFFIRMING NETWORK
            </span>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
              LGBTQ+ Business <br />
              <span className="font-serif italic font-normal text-[#5A1E65]">Directory.</span>
            </h1>
            <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
              Discover verified welcoming spaces, healthcare providers, and local services across all 10 Ventura County cities.
            </p>
          </div>

          <Link
            to="/directory/submit"
            className="btn-primary py-3.5 px-6 text-xs font-bold inline-flex items-center gap-2 shadow-lg hover:shadow-xl self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>Submit Your Business</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-10 pt-8 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Box */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search businesses, coffee, healthcare, legal..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white focus:ring-2 focus:ring-purple-100 rounded-2xl outline-none font-medium"
              />
            </div>

            {/* City Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white rounded-2xl outline-none font-medium"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>City: {city}</option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white rounded-2xl outline-none font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>Category: {cat}</option>
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
            <h3 className="font-display text-xl font-bold text-slate-900">No businesses match your current filters.</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or clearing your city/category filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedCity('All');
                setCurrentPage(1);
              }}
              className="btn-primary py-2.5 px-5 text-xs font-bold"
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = "/images/community-gathering.jpg"; }}
                    />
                    {biz.isLGBTQOwned && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 font-bold text-[10px] border border-amber-300/40">
                        🌈 LGBTQ+ Owned
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        {biz.category}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>{biz.city}</span>
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-black text-slate-950 tracking-tight leading-tight group-hover:text-[#5A1E65] transition-colors">
                      {biz.name}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                      {biz.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {biz.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {biz.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Affirming Verified</span>
                  </span>
                  <Link
                    to={`/directory/${biz.slug}`}
                    className="text-xs font-bold text-[#5A1E65] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Full Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardSpotlight>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-8 border-t border-slate-100">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
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

