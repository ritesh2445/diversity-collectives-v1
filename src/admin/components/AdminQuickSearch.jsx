import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Sliders, Globe, ArrowRight, X, Replace, CheckCircle2 } from 'lucide-react';
import { searchSiteWithSuggestions } from '../../utils/smartSiteSearch';
import { cmsStore } from '../../services/cmsStore';
import { getSiteFeatures, saveSiteFeatures } from '../../services/siteFeaturesStore';

/**
 * Curated Admin Control Directory + Cross-Section Global Word Search & Replace
 */
const ADMIN_CONTROLS = [
  { id: 'ctrl-hero-theme', title: 'Hero Design & Style Switcher (Aurora, Portal, etc.)', subtitle: 'Homepage & Hero -> Hero Design', tab: 'hero', keywords: 'hero design theme aurora portal spotlight mosaic festival preview' },
  { id: 'ctrl-hero-copy', title: 'Hero Headline, Subtext & Buttons', subtitle: 'Homepage & Hero -> Content Editor', tab: 'hero', keywords: 'hero headline title subtitle description cta button copy' },
  { id: 'ctrl-hero-email', title: 'Hero Email Icon Target (mailto:)', subtitle: 'Homepage & Hero -> Email Icon Button Target', tab: 'hero', keywords: 'hero email icon mailto contact address edit' },
  { id: 'ctrl-hero-photo', title: 'Hero Feature Photograph & Local Upload', subtitle: 'Homepage & Hero -> Hero Photo', tab: 'hero', keywords: 'hero photo image volunteers picture upload file local' },
  { id: 'ctrl-impact', title: 'Impact Stats, Popups & Milestone Numbers', subtitle: 'Homepage & Hero -> Impact Milestones', tab: 'hero', keywords: 'impact stats popups 10+ 5000+ 1200+ milestones numbers' },
  { id: 'ctrl-sections', title: 'Homepage Section Order & Visibility', subtitle: 'Homepage & Hero -> Section Order', tab: 'hero', keywords: 'section order reorder hide show homepage partnerships directory flex space calendar special engagements' },
  { id: 'ctrl-forms', title: 'Universal Form Builder (Edit All Site Forms)', subtitle: 'Forms, Slots & Popups -> Form Builder', tab: 'features', keywords: 'forms builder fields contact volunteer training directory hiv screening flex space edit' },
  { id: 'ctrl-flex', title: 'Flex Space Availability, Timings & Slot Bookings', subtitle: 'Forms, Slots & Popups -> Flex Space', tab: 'features', keywords: 'flex space workspace availability timings hours slot booking' },
  { id: 'ctrl-hiv', title: 'HIV Screening Limited-Slot Quotas', subtitle: 'Forms, Slots & Popups -> HIV Slots', tab: 'features', keywords: 'hiv screening testing limited slots capacity quota booking' },
  { id: 'ctrl-broadcast', title: 'Auto Broadcast Popups (Today Events & Custom)', subtitle: 'Forms, Slots & Popups -> Auto Broadcast Popups', tab: 'features', keywords: 'broadcast popup alert modal today event announcement' },
  { id: 'ctrl-theme-colors', title: 'Global Button Colors & Fonts', subtitle: 'Colors, Fonts & Cards -> Theme Studio', tab: 'appearance', subTab: 'theme', keywords: 'colors palette button purple font heading body radius theme' },
  { id: 'ctrl-card-order', title: 'Program, Event & Board Card Ordering', subtitle: 'Colors, Fonts & Cards -> Arrange Card Order', tab: 'appearance', subTab: 'cards', keywords: 'card order sort drag drop sequence' },
  { id: 'ctrl-cms-programs', title: 'Manage Programs (Queer Adulting, Rainbow Umbrella, etc.)', subtitle: 'Website Content (CMS) -> Programs', tab: 'cms', subTab: 'programs', keywords: 'programs queer adulting little unicorns rainbow umbrella pflag narcotics anonymous transverse toastmasters mens collective silver collective' },
  { id: 'ctrl-cms-events', title: 'Events & Auto-Syncing Calendar Manager', subtitle: 'Website Content (CMS) -> Events & Calendar', tab: 'cms', subTab: 'events', keywords: 'event calendar date aids walk pride prom ventura county pride' },
  { id: 'ctrl-cms-trainings', title: 'P.R.I.D.E. Educational Trainings & Workshops', subtitle: 'Website Content (CMS) -> P.R.I.D.E. Trainings', tab: 'cms', subTab: 'trainings', keywords: 'pride training workshop cultural competency educator booking' },
  { id: 'ctrl-cms-sponsors', title: 'Official Sponsors & Community Partnerships', subtitle: 'Website Content (CMS) -> Sponsors & Partners', tab: 'cms', subTab: 'sponsors', keywords: 'sponsors partners civic allies marquee logo strip' },
  { id: 'ctrl-cms-news', title: 'News & Blog Articles', subtitle: 'Website Content (CMS) -> News & Articles', tab: 'cms', subTab: 'news', keywords: 'news blog articles stories' },
  { id: 'ctrl-cms-resources', title: 'Community Resources Directory', subtitle: 'Website Content (CMS) -> Community Resources', tab: 'cms', subTab: 'resources', keywords: 'resources housing crisis health therapy' },
  { id: 'ctrl-cms-staff', title: 'Board of Directors & Staff Roster', subtitle: 'Website Content (CMS) -> Board & Staff', tab: 'cms', subTab: 'staff', keywords: 'board staff executive team bio photo' },
  { id: 'ctrl-cms-settings', title: 'Global Organization Settings & Emergency Banner', subtitle: 'Website Content (CMS) -> Global Site Settings', tab: 'cms', subTab: 'settings', keywords: 'settings phone hours address banner alert crisis social' },
  { id: 'ctrl-inbox', title: 'Business Directory Moderation & Email Newsletter', subtitle: 'Directory, Inquiries & Email', tab: 'inbox', keywords: 'directory approve pending business inquiry newsletter broadcast' },
  { id: 'ctrl-gallery', title: 'Photo Gallery Manager', subtitle: 'Photo Gallery Tab', tab: 'gallery', keywords: 'gallery upload image photo album' },
  { id: 'ctrl-donations', title: 'Donations Gateway & Automated Email Studio', subtitle: 'Donations & Email Template Tab', tab: 'donations', keywords: 'donation donor thank you email template zeffy receipt placeholder tokens contribution gifts' },
  { id: 'ctrl-security', title: 'Team Access, RBAC Roles & 2FA Security', subtitle: 'Team Access & Security Tab', tab: 'security', keywords: 'team users access role admin editor celia steve 2fa totp password auth0' }
];

const SITE_TYPE_TO_ADMIN_TARGET = {
  Program: { tab: 'cms', subTab: 'programs' },
  Event: { tab: 'cms', subTab: 'events' },
  'Board Member': { tab: 'cms', subTab: 'staff' },
  Staff: { tab: 'cms', subTab: 'staff' },
  Resource: { tab: 'cms', subTab: 'resources' },
  News: { tab: 'cms', subTab: 'news' },
  Partner: { tab: 'hero' }
};

function scanObjectForWord(obj, queryLower, pathLabel, tab, subTab, results) {
  if (!obj || results.length >= 14) return;
  if (typeof obj === 'string') {
    if (obj.toLowerCase().includes(queryLower)) {
      results.push({ pathLabel, snippet: obj.slice(0, 110), tab, subTab });
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => scanObjectForWord(item, queryLower, `${pathLabel}[${idx}]`, tab, subTab, results));
    return;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (['image', 'heroImage', 'photoUrl', 'spotlightImage', 'avatar'].includes(k)) continue;
      scanObjectForWord(v, queryLower, `${pathLabel} -> ${k}`, tab, subTab, results);
    }
  }
}

function deepReplaceString(obj, findText, replaceText) {
  if (typeof obj === 'string') {
    if (!obj.includes(findText)) return { value: obj, count: 0 };
    const parts = obj.split(findText);
    return { value: parts.join(replaceText), count: parts.length - 1 };
  }
  if (Array.isArray(obj)) {
    let total = 0;
    const next = obj.map((item) => {
      const r = deepReplaceString(item, findText, replaceText);
      total += r.count;
      return r.value;
    });
    return { value: next, count: total };
  }
  if (obj && typeof obj === 'object') {
    let total = 0;
    const next = {};
    for (const [k, v] of Object.entries(obj)) {
      if (['image', 'heroImage', 'photoUrl', 'spotlightImage', 'avatar', 'id', 'slug'].includes(k)) {
        next[k] = v;
      } else {
        const r = deepReplaceString(v, findText, replaceText);
        total += r.count;
        next[k] = r.value;
      }
    }
    return { value: next, count: total };
  }
  return { value: obj, count: 0 };
}

export default function AdminQuickSearch({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [replaceNotice, setReplaceNotice] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const trimmed = query.trim();
  const hasTyped = trimmed.length > 0;

  useEffect(() => {
    const onOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const onEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onOutsideClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const { adminMatches, siteMatches, crossSectionMatches } = useMemo(() => {
    if (!hasTyped) {
      return { adminMatches: [], siteMatches: [], crossSectionMatches: [] };
    }
    const q = trimmed.toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    const controls = ADMIN_CONTROLS.filter((ctrl) => {
      const hay = `${ctrl.title} ${ctrl.subtitle} ${ctrl.keywords}`.toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    }).slice(0, 6);

    const siteOut = searchSiteWithSuggestions(trimmed, { limit: 6 });

    // Cross-section deep word search across ALL Homepage Layout, CMS, Settings, and Forms
    const deepHits = [];
    try {
      const cmsData = cmsStore.getData?.() || {};
      scanObjectForWord(cmsData.settings, q, 'Global Settings', 'cms', 'settings', deepHits);
      scanObjectForWord(cmsData.programs, q, 'Programs', 'cms', 'programs', deepHits);
      scanObjectForWord(cmsData.events, q, 'Events', 'cms', 'events', deepHits);
      scanObjectForWord(cmsData.news, q, 'News', 'cms', 'news', deepHits);
      scanObjectForWord(cmsData.resources, q, 'Resources', 'cms', 'resources', deepHits);
      scanObjectForWord(cmsData.sponsors, q, 'Sponsors', 'cms', 'sponsors', deepHits);
      const rawLayout = localStorage.getItem('dcvc_admin_custom_layout');
      if (rawLayout) {
        scanObjectForWord(JSON.parse(rawLayout), q, 'Homepage Sections', 'hero', undefined, deepHits);
      }
      const feats = getSiteFeatures();
      scanObjectForWord(feats.formSchemas, q, 'Site Forms', 'features', undefined, deepHits);
      scanObjectForWord(feats.broadcastPopup, q, 'Broadcast Popup', 'features', undefined, deepHits);
    } catch {
      // ignore read errors
    }

    return {
      adminMatches: controls,
      siteMatches: siteOut.results || [],
      crossSectionMatches: deepHits.slice(0, 10)
    };
  }, [hasTyped, trimmed]);

  const handleGlobalReplace = () => {
    if (!trimmed) return;
    let totalReplacements = 0;

    try {
      const cmsData = cmsStore.getData?.();
      if (cmsData) {
        const res = deepReplaceString(cmsData, trimmed, replaceWith);
        if (res.count > 0 && cmsStore.saveData) {
          cmsStore.saveData(res.value);
          totalReplacements += res.count;
        }
      }
      const rawLayout = localStorage.getItem('dcvc_admin_custom_layout');
      if (rawLayout) {
        const parsed = JSON.parse(rawLayout);
        const res = deepReplaceString(parsed, trimmed, replaceWith);
        if (res.count > 0) {
          localStorage.setItem('dcvc_admin_custom_layout', JSON.stringify(res.value));
          window.dispatchEvent(new CustomEvent('dcvc_layout_updated', { detail: { blocks: res.value } }));
          totalReplacements += res.count;
        }
      }
      const feats = getSiteFeatures();
      const featRes = deepReplaceString(feats, trimmed, replaceWith);
      if (featRes.count > 0) {
        saveSiteFeatures(featRes.value);
        totalReplacements += featRes.count;
      }
    } catch {
      // ignore
    }

    setReplaceNotice(`Replaced ${totalReplacements} occurrence(s) across sections.`);
    setTimeout(() => setReplaceNotice(''), 3500);
  };

  const handleSelectAdmin = (ctrl) => {
    onNavigate?.(ctrl.tab, ctrl.subTab);
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectSiteItem = (item) => {
    const mapped = SITE_TYPE_TO_ADMIN_TARGET[item.type];
    if (mapped) {
      onNavigate?.(mapped.tab, mapped.subTab);
    } else if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-72 md:w-88">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 focus-within:bg-white border border-slate-200 focus-within:border-[#5A1E65] focus-within:ring-2 focus-within:ring-purple-200 transition-all">
        <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search any word or section across site..."
          aria-label="Search Admin fields and all website sections"
          className="w-full bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && hasTyped && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-[420px] mt-2 bg-white rounded-2xl border border-purple-200 shadow-2xl z-50 max-h-[75vh] overflow-y-auto divide-y divide-slate-100">
          {/* Global Find & Replace Bar */}
          <div className="p-2.5 bg-purple-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">
                Cross-Section Word Search ({crossSectionMatches.length} text hits)
              </span>
              <button
                type="button"
                onClick={() => setShowReplace((v) => !v)}
                className="text-[10px] font-extrabold text-[#5A1E65] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Replace className="w-3 h-3" /> {showReplace ? 'Hide Replace' : 'Find & Replace'}
              </button>
            </div>
            {showReplace && (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={replaceWith}
                  onChange={(e) => setReplaceWith(e.target.value)}
                  placeholder={`Replace "${trimmed}" with...`}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white text-xs text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={handleGlobalReplace}
                  className="px-2.5 py-1.5 rounded-lg bg-[#5A1E65] text-white text-[11px] font-extrabold cursor-pointer"
                >
                  Replace All
                </button>
              </div>
            )}
            {replaceNotice && (
              <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {replaceNotice}
              </p>
            )}
          </div>

          {adminMatches.length === 0 && siteMatches.length === 0 && crossSectionMatches.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching field or word found for &ldquo;{trimmed}&rdquo;.
            </div>
          ) : (
            <>
              {crossSectionMatches.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Exact Word Locations Across Sections
                  </div>
                  {crossSectionMatches.map((hit, i) => (
                    <button
                      key={`${hit.pathLabel}-${i}`}
                      type="button"
                      onClick={() => {
                        onNavigate?.(hit.tab, hit.subTab);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-amber-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-extrabold text-slate-900 truncate">{hit.pathLabel}</p>
                        <p className="text-[10px] text-slate-600 truncate">{hit.snippet}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {adminMatches.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#5A1E65] flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    <span>Admin Fields & Controls</span>
                  </div>
                  {adminMatches.map((ctrl) => (
                    <button
                      key={ctrl.id}
                      type="button"
                      onClick={() => handleSelectAdmin(ctrl)}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{ctrl.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{ctrl.subtitle}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#5A1E65] shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {siteMatches.length > 0 && (
                <div className="p-2 space-y-1 bg-slate-50/50">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>Website Content & Pages</span>
                  </div>
                  {siteMatches.map((item) => {
                    const hasEditor = Boolean(SITE_TYPE_TO_ADMIN_TARGET[item.type]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSiteItem(item)}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#5A1E65] text-[9px] font-extrabold uppercase">
                              {item.type}
                            </span>
                            <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">
                            {hasEditor ? 'Edit in Admin CMS' : `Open ${item.url}`}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
