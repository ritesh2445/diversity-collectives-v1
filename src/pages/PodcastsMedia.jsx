import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Play,
  Pause,
  ExternalLink,
  Search,
  Sparkles,
  Share2,
  Clock,
  Calendar,
  Users,
  Lightbulb,
  CheckCircle2,
  X,
  Radio,
  Tag,
  Volume2,
  ChevronRight,
  Headphones,
  Maximize2
} from 'lucide-react';
import { cmsStore } from '../services/cmsStore';
import { saveMediaSuggestion } from '../admin/services/cmsClient';
import ProfessionalMediaPlayerFrame from '../components/ProfessionalMediaPlayerFrame';

export default function PodcastsMedia() {
  const [podcasts, setPodcasts] = useState(() => cmsStore.getPodcasts());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [theaterMode, setTheaterMode] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const playerFrameRef = useRef(null);

  // Suggest Ideas Modal State
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    name: '',
    email: '',
    category: 'Podcast Episode',
    topic: '',
    description: '',
    guestRecommendation: '',
    linkUrl: ''
  });
  const [suggestStatus, setSuggestStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [suggestMsg, setSuggestMsg] = useState('');

  // Subscribe to live CMS updates
  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      setPodcasts(data.podcasts || []);
    });
    return () => unsubscribe();
  }, []);

  // Filter categories
  const categories = useMemo(() => {
    const set = new Set(['All']);
    podcasts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [podcasts]);

  // Filtered podcasts
  const filteredPodcasts = useMemo(() => {
    return podcasts.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.summary && p.summary.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.guests && p.guests.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [podcasts, selectedCategory, searchQuery]);

  const handleShare = (e, podcast) => {
    e.stopPropagation();
    const url = window.location.origin + '/media#' + podcast.slug;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedSlug(podcast.slug);
        setTimeout(() => setCopiedSlug(null), 2500);
      });
    }
  };

  const handlePlayEpisode = (podcast) => {
    setActiveEpisode(podcast);
    setTimeout(() => {
      if (playerFrameRef.current) {
        playerFrameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  const handleSuggestSubmit = async (e) => {
    e.preventDefault();
    if (!suggestForm.topic.trim()) {
      setSuggestMsg('Please provide a topic or idea title.');
      setSuggestStatus('error');
      return;
    }

    setSuggestStatus('submitting');
    try {
      // 1. Save locally to CMS reactive store
      saveMediaSuggestion({
        ...suggestForm,
        createdAt: new Date().toISOString()
      });

      // 2. Submit to backend API if available
      try {
        await fetch('/api/media/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(suggestForm)
        });
      } catch {
        // Safe offline fallback
      }

      setSuggestStatus('success');
      setSuggestMsg('Thank you! Your idea has been sent to our media & production team.');
      setSuggestForm({
        name: '',
        email: '',
        category: 'Podcast Episode',
        topic: '',
        description: '',
        guestRecommendation: '',
        linkUrl: ''
      });
      setTimeout(() => {
        setShowSuggestModal(false);
        setSuggestStatus('idle');
        setSuggestMsg('');
      }, 3000);
    } catch {
      setSuggestStatus('error');
      setSuggestMsg('Failed to submit suggestion. Please try again or email info@diversitycollective.org.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 via-white to-purple-50/20 text-slate-900 pb-20">
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-[#5A1E65] transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <span className="text-[#5A1E65] font-bold">Podcasts & Media</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#4A154B] via-[#5A1E65] to-[#2E0854] text-white p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden border border-purple-500/20">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide text-amber-300 uppercase mb-4">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span>DCVC Community Audio & Media</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Podcasts & Authentic Community Media
              </h1>

              <p className="mt-4 text-sm sm:text-base md:text-lg text-purple-100/90 leading-relaxed max-w-2xl">
                Amplifying LGBTQ+ voices, healthcare equity, youth leadership, and grassroots stories across Ventura County. Listen to interviews, discussions, and updates from the Community Resource Center.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-900/30 active:scale-95 cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4 text-slate-950" />
                  <span>Suggest Ideas for New Content</span>
                </button>

                <a
                  href="#episodes"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Browse Episodes ({podcasts.length})</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Episodes */}
      <section id="episodes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Controls: Search & Category Chips */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-purple-100">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#5A1E65] text-white shadow-md shadow-purple-900/20'
                    : 'bg-white hover:bg-purple-50 text-slate-700 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search episodes, guests..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results Info */}
        <div className="py-4 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing {filteredPodcasts.length} of {podcasts.length} episodes
            {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
          </span>
          <button
            type="button"
            onClick={() => setShowSuggestModal(true)}
            className="text-[#5A1E65] hover:underline font-bold inline-flex items-center gap-1"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Have a topic or guest in mind? Suggest an idea</span>
          </button>
        </div>

        {/* Dynamic In-Site Media Player Frame */}
        {activeEpisode && (
          <div ref={playerFrameRef} className="pt-2 pb-8 scroll-mt-20">
            <ProfessionalMediaPlayerFrame
              episode={activeEpisode}
              onClose={() => setActiveEpisode(null)}
              theaterMode={theaterMode}
              onToggleTheater={() => setTheaterMode(!theaterMode)}
            />
          </div>
        )}

        {/* Episodes Grid */}
        {filteredPodcasts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-purple-200 p-8">
            <Mic className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-base">No podcasts found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any episodes matching your current filter. Try searching for something else or suggest an idea!
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-100 text-[#5A1E65] text-xs font-bold hover:bg-purple-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-4">
            {filteredPodcasts.map((podcast) => (
              <article
                key={podcast.id || podcast.slug}
                id={podcast.slug}
                className={`group relative bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  activeEpisode?.slug === podcast.slug
                    ? 'border-purple-600 ring-2 ring-purple-600/25 shadow-xl'
                    : 'border-purple-100/80 shadow-md hover:shadow-xl'
                }`}
              >
                {/* Top Image / Media Cover Banner */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                  <img
                    src={podcast.coverImage || '/images/community-gathering.jpg'}
                    alt={podcast.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Badge & Category */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-white/10 uppercase tracking-wider">
                      Episode {podcast.episodeNumber || 1}
                    </span>
                    {podcast.category && (
                      <span className="px-2.5 py-1 rounded-full bg-purple-900/70 backdrop-blur-md text-[10px] font-bold text-purple-200 border border-purple-400/20">
                        {podcast.category}
                      </span>
                    )}
                  </div>

                  {/* Play Trigger Overlay */}
                  {(podcast.link || podcast.audioUrl) && (
                    <button
                      type="button"
                      onClick={() => handlePlayEpisode(podcast)}
                      className={`absolute bottom-3 right-3 w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform group-hover:scale-110 cursor-pointer ${
                        activeEpisode?.slug === podcast.slug
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 ring-4 ring-amber-400/40 scale-105'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                      title={activeEpisode?.slug === podcast.slug ? 'Playing now in site frame' : 'Play episode directly on site'}
                    >
                      {activeEpisode?.slug === podcast.slug ? (
                        <Radio className="w-5 h-5 text-slate-950 animate-pulse" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                  )}

                  {/* Date & Duration Info */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[11px] text-white/90 font-medium">
                    {podcast.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-300" />
                        {podcast.duration}
                      </span>
                    )}
                    {podcast.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-300" />
                        {podcast.date}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-slate-950 group-hover:text-[#5A1E65] transition-colors leading-snug">
                      {podcast.title}
                    </h2>

                    {podcast.guests && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-600">
                        <Users className="w-3.5 h-3.5 text-[#5A1E65] flex-shrink-0" />
                        <span className="truncate">Guests: {podcast.guests}</span>
                      </div>
                    )}

                    <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {podcast.summary || podcast.description}
                    </p>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    {(podcast.link || podcast.audioUrl) ? (
                      <button
                        type="button"
                        onClick={() => handlePlayEpisode(podcast)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                          activeEpisode?.slug === podcast.slug
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-900/20'
                            : 'bg-[#5A1E65] hover:bg-purple-900 text-white'
                        }`}
                      >
                        {activeEpisode?.slug === podcast.slug ? (
                          <>
                            <Radio className="w-3.5 h-3.5 animate-pulse" />
                            <span>Playing in Site Frame</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Play Episode in Frame</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Media coming soon</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {podcast.link && (
                        <a
                          href={podcast.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-slate-500 hover:text-[#5A1E65] hover:bg-purple-50 transition-colors"
                          title="Open original external link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleShare(e, podcast)}
                        className="p-2 rounded-xl text-slate-500 hover:text-[#5A1E65] hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Share episode"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      {copiedSlug === podcast.slug && (
                        <span className="text-[10px] font-bold text-emerald-600 animate-fadeIn">
                          Link copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Sticky Floating Mini Player Bar at bottom */}
      {activeEpisode && !theaterMode && (
        <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto z-40 bg-slate-950/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl shadow-2xl p-3 px-5 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={activeEpisode.coverImage || '/images/community-gathering.jpg'}
              alt=""
              className="w-10 h-10 rounded-lg object-cover border border-purple-400/30 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Now Playing</span>
              <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">{activeEpisode.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                playerFrameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-700/60 hover:bg-purple-600 text-[11px] font-bold text-white transition-colors cursor-pointer"
            >
              View Frame
            </button>
            <button
              type="button"
              onClick={() => setTheaterMode(true)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:inline"
              title="Expand Theater Frame"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveEpisode(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Suggest Ideas Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="rounded-3xl bg-gradient-to-r from-purple-100 via-pink-50 to-amber-50 p-8 sm:p-12 border border-purple-200/80 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-200/60 text-[#5A1E65] text-xs font-black uppercase tracking-wider mb-2">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Community Powered</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950">
              Have a Story or Topic We Should Feature?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              We welcome guest recommendations, interview topics, mutual aid stories, and community discussions. Send your ideas directly to our media team.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSuggestModal(true)}
            className="px-6 py-3.5 rounded-2xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
          >
            Suggest Content Idea
          </button>
        </div>
      </section>

      {/* Suggest Ideas Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-amber-300">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg leading-tight">
                    Suggest Ideas for New Content
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Help shape future DCVC podcast episodes & media discussions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSuggestModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSuggestSubmit} className="p-6 space-y-4">
              {suggestStatus === 'success' ? (
                <div className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Idea Received!</h4>
                  <p className="text-xs text-slate-600">{suggestMsg}</p>
                </div>
              ) : (
                <>
                  {suggestStatus === 'error' && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {suggestMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={suggestForm.name}
                        onChange={(e) => setSuggestForm({ ...suggestForm, name: e.target.value })}
                        placeholder="e.g. Alex Rivera"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#5A1E65]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Your Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={suggestForm.email}
                        onChange={(e) => setSuggestForm({ ...suggestForm, email: e.target.value })}
                        placeholder="alex@example.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#5A1E65]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Content Format
                    </label>
                    <select
                      value={suggestForm.category}
                      onChange={(e) => setSuggestForm({ ...suggestForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#5A1E65] bg-white"
                    >
                      <option value="Podcast Episode">Podcast Episode</option>
                      <option value="Guest Interview">Guest Interview</option>
                      <option value="Youth Discussion">Youth Voices Discussion</option>
                      <option value="Healthcare Feature">Healthcare & Wellness Feature</option>
                      <option value="Community Story">Community Story</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Topic or Title Idea <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={suggestForm.topic}
                      onChange={(e) => setSuggestForm({ ...suggestForm, topic: e.target.value })}
                      placeholder="e.g. LGBTQ+ Mental Health in Ventura County Schools"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#5A1E65]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Description / What should we cover?
                    </label>
                    <textarea
                      rows={3}
                      value={suggestForm.description}
                      onChange={(e) => setSuggestForm({ ...suggestForm, description: e.target.value })}
                      placeholder="Share details, key questions to ask, or why this matters to our local community..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#5A1E65]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recommended Guest, Speaker or Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={suggestForm.guestRecommendation}
                      onChange={(e) => setSuggestForm({ ...suggestForm, guestRecommendation: e.target.value })}
                      placeholder="e.g. Dr. Jordan Smith, or link to article/social profile"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#5A1E65]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSuggestModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={suggestStatus === 'submitting'}
                      className="px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {suggestStatus === 'submitting' ? 'Submitting...' : 'Submit Suggestion'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
