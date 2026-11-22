import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  ArrowRight,
  Sparkles,
  CornerDownLeft,
  Wand2
} from 'lucide-react';
import { cmsStore } from '../services/cmsStore';
import { searchSiteWithSuggestions } from '../utils/smartSiteSearch';
import { useScrollLock } from '../utils/scrollLock';

const TYPE_FILTERS = ['All', 'Program', 'Event', 'Board Member', 'Training', 'Resource', 'Community Circle', 'News', 'Page'];

const BADGE_STYLES = {
  Program: 'bg-purple-100 text-[#5A1E65] border-purple-200',
  Event: 'bg-amber-100 text-amber-900 border-amber-200',
  'Board Member': 'bg-indigo-100 text-indigo-900 border-indigo-200',
  Staff: 'bg-slate-100 text-slate-800 border-slate-200',
  Training: 'bg-sky-100 text-sky-900 border-sky-200',
  Resource: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  'Community Circle': 'bg-pink-100 text-pink-900 border-pink-200',
  News: 'bg-violet-100 text-violet-900 border-violet-200',
  Partner: 'bg-teal-100 text-teal-900 border-teal-200',
  Accessibility: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200',
  Giving: 'bg-rose-100 text-rose-900 border-rose-200',
  Page: 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function SmartSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [activeIndex, setActiveIndex] = useState(0);
  const [cmsTick, setCmsTick] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Re-index immediately when live Sanity CMS updates arrive
  useEffect(() => {
    return cmsStore.subscribe(() => setCmsTick((t) => t + 1));
  }, []);

  // Bulletproof cross-platform background scroll lock while open
  useScrollLock(isOpen);

  // Focus search input on open
  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [isOpen]);

  const trimmedQuery = query.trim();
  const hasTypedQuery = trimmedQuery.length > 0;

  const searchOutput = useMemo(() => {
    void cmsTick;
    if (!hasTypedQuery) {
      return { results: [], suggestions: [], correctedQuery: null, isEmptyQuery: true };
    }
    return searchSiteWithSuggestions(query, { category, limit: 12 });
  }, [query, category, cmsTick, hasTypedQuery]);

  const results = searchOutput.results || [];

  useEffect(() => {
    setActiveIndex(0);
  }, [query, category]);

  if (!isOpen) return null;

  const handleSelectResult = (item) => {
    onClose();
    if (item?.url) {
      navigate(item.url);
    }
  };

  const handleAskLuna = () => {
    const q = query.trim();
    onClose();
    window.dispatchEvent(new CustomEvent('openAskDcvc', { detail: { query: q } }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (results.length ? (prev + 1) % results.length : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (results.length ? (prev - 1 + results.length) % results.length : 0));
      return;
    }
    if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      handleSelectResult(results[activeIndex]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/65 backdrop-blur-sm flex items-start justify-center pt-10 sm:pt-16 px-3 sm:px-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Search across Diversity Collective website"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[84vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-gradient-to-r from-[#FAF5FF] via-white to-[#FFF7ED] flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#5A1E65] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs, events, board members, training, dyslexia tools..."
            aria-label="Search Diversity Collective"
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Search"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Spell-Correction & Smart Suggestions Strip (ONLY when user has typed something) */}
        {hasTypedQuery && (searchOutput.correctedQuery || (searchOutput.suggestions && searchOutput.suggestions.length > 0)) && (
          <div className="px-4 py-2.5 bg-purple-50/70 border-b border-purple-100 flex flex-wrap items-center gap-1.5 text-xs">
            {searchOutput.correctedQuery ? (
              <span className="inline-flex items-center gap-1 text-[#5A1E65] font-bold mr-1">
                <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Did you mean:</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Suggestions:
              </span>
            )}

            {searchOutput.suggestions.map((sug, i) => {
              const isCorrection = searchOutput.correctedQuery && i === 0;
              return (
                <button
                  key={`${sug}-${i}`}
                  type="button"
                  onClick={() => setQuery(sug)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                    isCorrection
                      ? 'bg-[#5A1E65] text-white border-[#5A1E65] hover:bg-purple-800 shadow-2xs'
                      : 'bg-white text-slate-700 border-purple-200 hover:border-[#5A1E65] hover:text-[#5A1E65]'
                  }`}
                >
                  {sug}
                </button>
              );
            })}
          </div>
        )}

        {/* Type Filter Chips */}
        <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white">
          {TYPE_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                category === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-[#5A1E65]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1.5 bg-slate-50/50">
          {!hasTypedQuery ? (
            <div className="py-10 px-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#5A1E65] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Search Diversity Collective
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start typing above to search programs, events, team members, resources, training, or any page across the site.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 px-6 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">
                No direct page match found for "{query}"
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try fewer words, check a different category tab, or ask your friend Luna to help find what you need.
              </p>
              <button
                type="button"
                onClick={handleAskLuna}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white text-xs font-extrabold shadow-sm hover:brightness-110 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Ask Luna about "{query}"</span>
              </button>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === activeIndex;
              const badgeCls = BADGE_STYLES[item.type] || BADGE_STYLES.Page;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelectResult(item)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#5A1E65] shadow-sm ring-2 ring-purple-200/70'
                      : 'bg-white/90 border-slate-200/80 hover:border-purple-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badgeCls}`}>
                        {item.type}
                      </span>
                      <span className="font-display font-bold text-sm text-slate-900 truncate">
                        {item.title}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] font-semibold text-[#5A1E65] truncate">
                        {item.subtitle}
                      </p>
                    )}
                    {item.snippet && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.snippet}
                      </p>
                    )}
                  </div>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${isSelected ? 'bg-[#5A1E65] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {isSelected ? <CornerDownLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints & Luna Handoff */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="hidden sm:flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">Enter</kbd> Open</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">Esc</kbd> Close</span>
          </div>
          <button
            type="button"
            onClick={handleAskLuna}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#5A1E65] font-bold border border-purple-200 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{query.trim() ? `Ask Luna: "${query.trim().slice(0, 24)}${query.trim().length > 24 ? '…' : ''}"` : 'Chat with Luna'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

