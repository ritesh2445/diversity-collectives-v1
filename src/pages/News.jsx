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

  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      if (data?.news) setArticles(data.news);
    });
    return unsubscribe;
  }, []);

  const categories = ['All', 'Community & Culture', 'Health & Wellness', 'Youth Empowerment', 'Advocacy & Business'];

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesSearch = 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [articles, searchQuery, selectedCategory]);

  const featured = articles[0] || articles[0];

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
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
                <span className="text-slate-400 font-bold">{featured.publishedAt}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-bold">{featured.readingTime}</span>
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

            <div className="lg:col-span-5 h-64 md:h-80 rounded-2xl overflow-hidden shadow-md">
              <img
                src={featured.image}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>
        </section>
      )}

      {/* Articles Grid */}
      <section className="container-clean py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((art) => (
            <CardSpotlight
              key={art.slug}
              className="p-7 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between gap-6 group"
              tilt={true}
              maxTilt={4}
              glare={true}
            >
              <div className="space-y-4">
                <div className="h-48 rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                    <span className="text-[#5A1E65] uppercase text-[10px] font-black">{art.category}</span>
                    <span>{art.readingTime}</span>
                  </div>

                  <h3 className="font-display text-xl font-black text-slate-950 group-hover:text-[#5A1E65] transition-colors leading-tight">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#5A1E65]">
                <span>{art.publishedAt}</span>
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
        </div>
      </section>

    </div>
  );
}

