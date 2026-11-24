import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { cmsStore } from '../services/cmsStore';
import CardSpotlight from '../components/CardSpotlight';
import MobileCarousel from '../components/MobileCarousel';
import { usePageMeta } from '../utils/seo';

export default function News() {
  usePageMeta({
    title: 'News & Community Advocacy Updates',
    description: 'Read the latest stories, public health updates, pride festival announcements, and youth perspectives from Diversity Collective Ventura County.',
    canonicalPath: '/news'
  });

  const [articles, setArticles] = useState(() => cmsStore.getNews());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      if (data?.news && totalArticles === 0) setArticles(data.news);
    });
    return unsubscribe;
  }, [totalArticles]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    let active = true;
    const apiBase = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || '/api';
    const params = new URLSearchParams({
      page: String(page),
      limit: '12',
      ...(selectedCategory !== 'All' ? { category: selectedCategory } : {}),
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {})
    });
    fetch(`${apiBase}/news?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.success) return;
        if (Array.isArray(data.articles) && (data.total > 0 || page > 1)) {
          setArticles(data.articles);
          setTotalPages(Number(data.totalPages || 1));
          setTotalArticles(Number(data.total || data.articles.length));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [page, searchQuery, selectedCategory]);

  const categories = ['All', 'Community & Culture', 'Health & Wellness', 'Youth Empowerment', 'Advocacy & Business'];

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (art.status === 'draft' || art.isDraft === true) return false;
      const matchesSearch = 
        (art.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [articles, searchQuery, selectedCategory]);

  const featured = useMemo(() => {
    return articles.find(art => art.status !== 'draft' && art.isDraft !== true) || null;
  }, [articles]);

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            EDITORIAL & ADVOCACY DISPATCHES
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Stories, Updates <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">& Advocacy.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Dispatches from the front lines of LGBTQ+ wellness, youth empowerment, and community celebration across Ventura County.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search articles and announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white rounded-2xl outline-none font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-slate-950 text-white border-purple-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Lead Article */}
      {featured && selectedCategory === 'All' && !searchQuery && (
        <section className="container-clean py-12">
          <Link
            to={`/news/${featured.slug}`}
            className="p-8 md:p-12 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-xl transition-all grid grid-cols-1 lg:grid-cols-12 gap-8 items-center group block"
          >
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  {featured.category}
                </span>
                <span className="text-slate-400 font-bold">{featured.publishedAt || featured.publishDate || featured.date}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-bold">{featured.readingTime || featured.readTime || '3 min read'}</span>
              </div>

              <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-950 group-hover:text-[#5A1E65] transition-colors tracking-tight leading-tight">
                {featured.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                {featured.excerpt}
              </p>

              <div className="pt-2 text-xs font-bold text-[#5A1E65] inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                <span>Read Full Article</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="lg:col-span-5 h-64 md:h-80 rounded-2xl overflow-hidden shadow-md bg-slate-900">
              <img
                src={featured.image || featured.images?.[0] || '/images/community-gathering.jpg'}
                alt={featured.title}
                onError={(e) => { e.currentTarget.src = '/images/community-gathering.jpg'; }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>
        </section>
      )}

      {/* Articles Grid */}
      <section className="container-clean py-12">
        {filteredArticles.length > 0 ? (
          <MobileCarousel cols={3} autoScrollMs={0} cardClassName="h-full flex flex-col">
            {filteredArticles.map((art) => (
              <CardSpotlight
                key={art.slug || art.id}
                className="h-full w-full p-7 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                contentClassName="flex flex-col h-full justify-between"
                tilt={true}
                maxTilt={4}
                glare={true}
              >
                <div className="flex flex-col flex-1">
                  <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 shrink-0 relative mb-4">
                    <img
                      src={art.image || art.images?.[0] || '/images/community-gathering.jpg'}
                      alt={art.title}
                      onError={(e) => { e.currentTarget.src = '/images/community-gathering.jpg'; }}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex flex-col flex-1 gap-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                      <span className="text-[#5A1E65] uppercase text-[10px] font-black">{art.category}</span>
                      <span>{art.readingTime || art.readTime || '3 min read'}</span>
                    </div>

                    <h3 className="font-display text-xl font-black text-slate-950 group-hover:text-[#5A1E65] transition-colors leading-snug line-clamp-2 min-h-[3.25rem]">
                      {art.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3 flex-1">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#5A1E65]">
                  <span>{art.publishedAt || art.publishDate || art.date}</span>
                  <Link
                    to={`/news/${art.slug}`}
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Read Story</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardSpotlight>
            ))}
          </MobileCarousel>
        ) : (
          <div className="max-w-xl mx-auto p-10 md:p-14 text-center rounded-3xl bg-purple-50/70 border-2 border-purple-200/80 space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs flex items-center justify-center mx-auto text-[#5A1E65]">
              <BookOpen className="w-7 h-7" />
            </div>
            <h4 className="font-display text-xl font-bold text-slate-900">
              No News Stories or Press Releases Published Yet
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Official announcements, community dispatches, and advocacy updates from Diversity Collective Ventura County will appear here once published by administrators.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-purple-50 disabled:opacity-40 cursor-pointer"
            >
              ← Previous
            </button>
            <span className="text-xs font-bold text-slate-600">
              Page {page} of {totalPages} ({totalArticles.toLocaleString()} articles)
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-purple-50 disabled:opacity-40 cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}
      </section>

    </div>
  );
}

