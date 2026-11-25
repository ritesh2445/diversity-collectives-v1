import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutGrid,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Check,
  AlertCircle,
  Users,
  Heart,
  Calendar,
  BookOpen,
  Compass,
  Mail,
  Building2,
  ExternalLink,
  Megaphone,
  Maximize2,
  Minimize2,
  Menu,
  X,
  Phone,
  Activity,
  Award,
  ShieldCheck,
  Layers,
  Palette
} from 'lucide-react';
import {
  DEFAULT_PAGE_BLOCKS,
  getSavedPageLayout,
  savePageLayout,
  resetPageLayoutAndHero
} from '../services/adminClient.js';
import {
  getActiveHeroTheme,
  setActiveHeroTheme,
  subscribeToHeroTheme,
  HERO_THEMES,
  resolveHeroTheme
} from '../../services/heroThemeStore';
import { SYNC_EVENTS, applySiteThemeToDOM, publishAdminSitePatch } from '../../services/liveSync';
import { loadSiteTheme, THEME_STORAGE_KEY } from './SiteThemeStudio.jsx';
import { cmsStore } from '../../services/cmsStore';
import { saveCmsSettings } from '../services/cmsClient.js';
import HeroShowcase from '../../components/HeroShowcase';
import DevicePreviewFrame, { VIEWPORT_WIDTHS } from './DevicePreviewFrame';
import { uploadAndStoreImage } from '../services/imageService';

const SITE_PAGES_CONFIG = [
  { key: 'home', label: 'Homepage (Drag & Drop)', path: '/' },
  {
    key: 'events',
    label: 'Events Page',
    path: '/events',
    eyebrow: 'OFFICIAL CALENDAR & CULTURAL LIFE',
    headline: 'Cultural Calendar & Upcoming Events.',
    description: 'From weekly youth circles and free testing clinics to seaside Pride and annual galas, explore upcoming events across Ventura County.'
  },
  {
    key: 'news',
    label: 'News & Blog Page',
    path: '/news',
    eyebrow: 'EDITORIAL & ADVOCACY DISPATCHES',
    headline: 'Stories, Updates & Advocacy.',
    description: 'Dispatches from the front lines of LGBTQ+ wellness, youth empowerment, and community celebration across Ventura County.'
  },
  {
    key: 'directory',
    label: 'Business Directory',
    path: '/directory',
    eyebrow: 'VENTURA COUNTY AFFIRMING NETWORK',
    headline: 'LGBTQ+ Business Directory.',
    description: 'Discover verified welcoming spaces, healthcare providers, and local services across all 10 Ventura County cities.'
  },
  {
    key: 'programs',
    label: 'Programs Page',
    path: '/programs',
    eyebrow: 'COMMUNITY CARE & CLINICAL SERVICES',
    headline: 'Our Programs & Affirming Spaces.',
    description: 'Every program at Diversity Collective is created with a trauma-informed, culturally affirming approach to empower LGBTQ+ individuals from youth to elderhood.'
  },
  {
    key: 'training',
    label: 'P.R.I.D.E. Trainings',
    path: '/training',
    eyebrow: 'P.R.I.D.E. EDUCATION & ACCREDITATION',
    headline: 'LGBTQ+ Competency',
    description: "Ventura County's accredited workshops transforming workplaces, clinics, educators, and local storefronts into authentically affirming spaces."
  },
  {
    key: 'resources',
    label: 'Resources Page',
    path: '/resources',
    eyebrow: 'VERIFIED DIRECTORY & COMMUNITY CARE',
    headline: 'Care & Crisis Resource Directory.',
    description: 'A vetted network of affirming mental health clinicians, healthcare navigators, legal clinics, and basic needs programs serving Ventura County.'
  },
  {
    key: 'about',
    label: 'About Us Page',
    path: '/about',
    eyebrow: 'ESTABLISHED 2014 · 501(C)(3) NONPROFIT',
    headline: 'Advocacy, safety & celebration since 2014.',
    description: '"We believe that all people deserve a diverse, inclusive, accepting, and welcoming safe space. In lifting each other up even when it\'s hard, we build allies, opportunities, and resources to live our best lives."'
  },
  {
    key: 'community',
    label: 'Community Circles',
    path: '/community',
    eyebrow: 'AFFIRMING PEER CIRCLES & GATHERINGS',
    headline: 'Find Your Community & Authentic Belonging.',
    description: '"We believe in the freedom to be your authentic self, both at home & in the community." Connect with peer support groups meeting regularly at our Community Resource Center.'
  },
  {
    key: 'getInvolved',
    label: 'Get Involved Page',
    path: '/get-involved',
    eyebrow: 'PARTICIPATION & SUSTAINABILITY',
    headline: 'Get Involved & Support Our Mission.',
    description: '"We do what we do, because of you." Join our passionate network of sponsors, donors, and grassroots volunteers building safety, care, and visibility across Ventura County.'
  },
  {
    key: 'contact',
    label: 'Contact Page',
    path: '/contact',
    eyebrow: 'LOCATION & CONTACT',
    headline: 'Get in Touch & Visit Our Center.',
    description: 'Whether you have questions about our youth peer groups, want to book an HIV/STI screening, or wish to connect with our team, we are here for you.'
  },
  {
    key: 'donate',
    label: 'Donate Page',
    path: '/donate',
    eyebrow: 'TAX-DEDUCTIBLE 501(C)(3) SUPPORT · 0% PLATFORM FEES',
    headline: 'Powering Center & Lifesaving Care.',
    description: 'Every dollar directly funds free rapid health screenings, weekly youth peer circles, harm reduction supplies, and community advocacy across Ventura County.'
  }
];

const DISPLAYABLE_HERO_THEMES = HERO_THEMES.filter((t) => t.id !== 'default');
const CORE_HERO_THEMES = DISPLAYABLE_HERO_THEMES.filter((t) => t.category !== 'festival');
const FESTIVAL_HERO_THEMES = DISPLAYABLE_HERO_THEMES.filter((t) => t.category === 'festival');

const QUICK_HERO_PHOTOS = [
  { label: 'Volunteers (Live Flagship)', url: '/images/volunteers.jpg' },
  { label: 'Community Gathering', url: '/images/community-gathering.jpg' },
  { label: 'CRC Portola Center', url: '/images/crc-building.jpg' },
  { label: 'Youth Circle', url: '/images/youth-umbrella.jpg' },
  { label: 'SHINES Clinic', url: '/images/shines-screening.jpg' }
];

export default function DesignEditor({ onPublishSuccess }) {
  const [selectedPageKey, setSelectedPageKey] = useState('home');
  const [cmsSettings, setCmsSettings] = useState(() => cmsStore.getSettings() || {});
  const [siteThemeState, setSiteThemeState] = useState(() => loadSiteTheme());
  const [blocks, setBlocks] = useState(getSavedPageLayout);
  const [selectedBlockId, setSelectedBlockId] = useState(
    () => getSavedPageLayout()[0]?.id || 'block-hero'
  );
  const [sidebarTab, setSidebarTab] = useState('themes'); // 'themes' | 'content'
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [canvasMode, setCanvasMode] = useState('standard'); // 'standard' | 'wide'
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  const [heroTheme, setHeroTheme] = useState(getActiveHeroTheme);
  const [publishedHeroTheme, setPublishedHeroTheme] = useState(getActiveHeroTheme);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [saveToast, setSaveToast] = useState(null); // { type: 'success' | 'warn', text: string }

  useEffect(() => {
    const syncBlocks = () => {
      setBlocks(getSavedPageLayout());
    };
    window.addEventListener(SYNC_EVENTS.LAYOUT_CHANGED, syncBlocks);
    const unsubHero = subscribeToHeroTheme((nextId) => {
      setPublishedHeroTheme(nextId);
      setHeroTheme(nextId);
    });
    return () => {
      window.removeEventListener(SYNC_EVENTS.LAYOUT_CHANGED, syncBlocks);
      unsubHero();
    };
  }, []);

  useEffect(() => {
    if (!isFullScreenPreview) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullScreenPreview(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenPreview]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0];
  const heroBlock = blocks.find((b) => b.type === 'hero_banner') || DEFAULT_PAGE_BLOCKS[0];
  const previewThemeObj = resolveHeroTheme(heroTheme);
  const liveThemeObj = resolveHeroTheme(publishedHeroTheme);

  const iframeRef = useRef(null);
  const fullScreenIframeRef = useRef(null);

  const handleSelectBlock = (id) => {
    setSelectedBlockId(id);
    setSidebarTab('content');
  };

  const postPreviewSync = useCallback((pageKey) => {
    // Only sync homepage blocks/theme — non-home pages load their own content
    const effectivePage = pageKey ?? selectedPageKey;
    if (effectivePage !== 'home') return;
    const payload = {
      type: 'DCVC_PREVIEW_SYNC',
      themeId: heroTheme,
      blocks: blocks,
      viewport: viewport
    };
    try {
      iframeRef.current?.contentWindow?.postMessage(payload, '*');
    } catch {}
    try {
      fullScreenIframeRef.current?.contentWindow?.postMessage(payload, '*');
    } catch {}
  }, [heroTheme, blocks, viewport, selectedPageKey]);

  useEffect(() => {
    postPreviewSync();
    const t = setTimeout(postPreviewSync, 200);
    return () => clearTimeout(t);
  }, [postPreviewSync]);

  useEffect(() => {
    const handleFrameMsg = (e) => {
      if (e.data?.type === 'DCVC_PREVIEW_READY') {
        postPreviewSync();
      } else if (e.data?.type === 'DCVC_SELECT_BLOCK' && e.data.blockId) {
        handleSelectBlock(e.data.blockId);
      }
    };
    window.addEventListener('message', handleFrameMsg);
    return () => window.removeEventListener('message', handleFrameMsg);
  }, [postPreviewSync]);

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) setDragOverIdx(index);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const reordered = [...blocks];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setBlocks(reordered);
    setHasUnsavedChanges(true);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const moveBlock = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setBlocks(reordered);
    setHasUnsavedChanges(true);
  };

  const toggleBlockVisibility = (id) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
    setHasUnsavedChanges(true);
  };

  const updateSelectedBlockProps = (propKey, value) => {
    const targetId = selectedBlock?.id;
    if (!targetId) return;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === targetId
          ? { ...b, props: { ...(b.props || {}), [propKey]: value } }
          : b
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleSelectHeroPreview = (themeId) => {
    setHeroTheme(themeId);
    setHasUnsavedChanges(true);
  };

  const handlePublish = async (overrideHeroTheme = null) => {
    const targetTheme = overrideHeroTheme || heroTheme;
    setIsPublishing(true);
    try {
      setActiveHeroTheme(targetTheme);
      try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(siteThemeState)); } catch {}
      applySiteThemeToDOM(siteThemeState);
      await publishAdminSitePatch({ siteTheme: siteThemeState }).catch(() => {});
      saveCmsSettings(cmsSettings);
      const res = await savePageLayout(blocks, targetTheme);
      setPublishedHeroTheme(targetTheme);
      setHasUnsavedChanges(false);

      if (res?.syncedToServer) {
        setSaveToast({
          type: 'success',
          text: `Published live! "${resolveHeroTheme(targetTheme).name}" & all sections synced (v${res.version}).`
        });
      } else {
        setSaveToast({
          type: 'warn',
          text: `Updated open tabs locally, but cloud sync reported: ${res?.error || 'session not authorized'}`
        });
      }
      if (onPublishSuccess) onPublishSuccess(res);
    } finally {
      setIsPublishing(false);
      setTimeout(() => setSaveToast(null), 5000);
    }
  };

  const handleResetToLive = async () => {
    if (!window.confirm('Reset homepage hero design, copy, and section order to original live code defaults?')) {
      return;
    }
    setIsPublishing(true);
    try {
      const fresh = await resetPageLayoutAndHero();
      setBlocks(fresh);
      setHeroTheme('aurora');
      setPublishedHeroTheme('aurora');
      setSelectedBlockId(fresh[0]?.id || 'block-hero');
      setHasUnsavedChanges(false);
      setSaveToast({
        type: 'success',
        text: 'Reset & published original Design 1 (Flagship Aurora Ribbon) defaults live.'
      });
    } finally {
      setIsPublishing(false);
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Studio Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5A1E65] to-purple-700 text-amber-300 flex items-center justify-center shadow-sm">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <span>Hero & Homepage Visual Studio</span>
              {hasUnsavedChanges ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  Previewing Draft — Click Publish
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live on Website · {liveThemeObj.number} {liveThemeObj.id === 'aurora' ? 'Aurora' : liveThemeObj.badge}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Preview any hero design, edit live text/images/buttons, reorder sections, and publish instantly with zero page refresh.
            </p>
          </div>
        </div>

        {/* Viewport & Publish Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'desktop', icon: Monitor, label: 'Desktop' },
              { id: 'tablet', icon: Tablet, label: 'Tablet' },
              { id: 'mobile', icon: Smartphone, label: 'Mobile' }
            ].map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewport(v.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewport === v.id
                      ? 'bg-white text-[#5A1E65] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setCanvasMode((prev) => (prev === 'wide' ? 'standard' : 'wide'))}
            className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
              canvasMode === 'wide'
                ? 'bg-[#5A1E65] text-white shadow-xs ring-2 ring-purple-300'
                : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
            }`}
            title={canvasMode === 'wide' ? 'Dock sidebar back to studio view' : 'Expand preview canvas to wide screen width'}
          >
            {canvasMode === 'wide' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{canvasMode === 'wide' ? 'Studio View' : 'Wide Canvas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullScreenPreview(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full-Screen Preview</span>
          </button>

          <button
            type="button"
            onClick={handleResetToLive}
            disabled={isPublishing}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#5A1E65] text-xs font-bold inline-flex items-center gap-1.5"
          >
            <span>Open Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => handlePublish()}
            disabled={isPublishing}
            className={`px-4 py-2 rounded-xl text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-all disabled:opacity-50 ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-[#5A1E65] to-rose-600 ring-2 ring-amber-300 animate-pulse'
                : 'bg-[#5A1E65] hover:bg-purple-900'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isPublishing ? 'Publishing...' : 'Publish Live to Website'}</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm ${
            saveToast.type === 'warn'
              ? 'bg-amber-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {saveToast.type === 'warn' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>{saveToast.text}</span>
        </div>
      )}

      {/* Unified 2-Column Visual Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Unified Studio Sidebar with Tab Switcher */}
        <div className={`${canvasMode === 'wide' ? 'hidden' : 'xl:col-span-4'} space-y-4`}>
          {/* Page Selector (Switch between Homepage & All Sub-Pages) */}
          <div className="bg-white rounded-2xl border-2 border-purple-200 p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">
                Editing Website Page
              </label>
              <span className="text-[10px] font-bold text-slate-500">Live Preview + Tap to Edit</span>
            </div>
            <select
              value={selectedPageKey}
              onChange={(e) => setSelectedPageKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-extrabold text-slate-900 bg-purple-50/40 focus:border-[#5A1E65] outline-none cursor-pointer"
            >
              {SITE_PAGES_CONFIG.map((pg) => (
                <option key={pg.key} value={pg.key}>
                  {pg.label} ({pg.path})
                </option>
              ))}
            </select>

            {/* Quick Global Font Size & Primary Color Controls */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Text:</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextScale = Math.max(0.85, Number(((Number(siteThemeState.fontScale) || 1) - 0.05).toFixed(2)));
                    const updated = { ...siteThemeState, fontScale: nextScale };
                    setSiteThemeState(updated);
                    setHasUnsavedChanges(true);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 text-[11px] font-black text-slate-700 cursor-pointer"
                  title="Decrease Website Font Size"
                >
                  A-
                </button>
                <span className="text-[11px] font-black text-[#5A1E65] px-1">
                  {Math.round((Number(siteThemeState.fontScale) || 1) * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextScale = Math.min(1.2, Number(((Number(siteThemeState.fontScale) || 1) + 0.05).toFixed(2)));
                    const updated = { ...siteThemeState, fontScale: nextScale };
                    setSiteThemeState(updated);
                    setHasUnsavedChanges(true);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 text-[11px] font-black text-slate-700 cursor-pointer"
                  title="Increase Website Font Size"
                >
                  A+
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Color:</span>
                <input
                  type="color"
                  value={siteThemeState.btnPrimaryBg || '#5A1E65'}
                  onChange={(e) => {
                    const updated = {
                      ...siteThemeState,
                      btnPrimaryBg: e.target.value,
                      btnPrimaryBgGradient: e.target.value,
                      navBtnActiveBg: e.target.value
                    };
                    setSiteThemeState(updated);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-6 h-6 rounded-md border border-slate-300 cursor-pointer p-0"
                  title="Primary Brand Color"
                />
              </div>
            </div>
          </div>

          {selectedPageKey !== 'home' ? (
            (() => {
              const activePg = SITE_PAGES_CONFIG.find((p) => p.key === selectedPageKey) || SITE_PAGES_CONFIG[1];
              const currentCopy = cmsSettings?.pageCopy?.[activePg.key] || {};
              const updatePageCopyField = (field, val) => {
                const nextSettings = {
                  ...cmsSettings,
                  pageCopy: {
                    ...(cmsSettings?.pageCopy || {}),
                    [activePg.key]: {
                      ...currentCopy,
                      [field]: val
                    }
                  }
                };
                setCmsSettings(nextSettings);
                setHasUnsavedChanges(true);
              };
              const publishPageCopy = async () => {
                saveCmsSettings(cmsSettings);
                setHasUnsavedChanges(false);
                setSaveToast({ type: 'success', text: `Published ${activePg.label} live!` });
                setTimeout(() => setSaveToast(null), 3500);
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.location.reload();
                }
              };
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        {activePg.label}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">{activePg.path}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPageKey('home')}
                      className="text-[11px] font-bold text-[#5A1E65] hover:underline cursor-pointer"
                    >
                      ← Homepage
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Eyebrow Pill</label>
                    <input
                      type="text"
                      value={currentCopy.eyebrow !== undefined ? currentCopy.eyebrow : activePg.eyebrow}
                      onChange={(e) => updatePageCopyField('eyebrow', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Main Headline</label>
                    <input
                      type="text"
                      value={currentCopy.headline !== undefined ? currentCopy.headline : activePg.headline}
                      onChange={(e) => updatePageCopyField('headline', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Intro Paragraph</label>
                    <textarea
                      rows={4}
                      value={currentCopy.description !== undefined ? currentCopy.description : activePg.description}
                      onChange={(e) => updatePageCopyField('description', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white leading-relaxed"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={publishPageCopy}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Publish {activePg.label} Live</span>
                  </button>

                  {activePg.key === 'training' && (
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('dcvc_navigate_admin_tab', {
                            detail: { tab: 'cms', subTab: 'trainings' }
                          })
                        );
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-[#5A1E65] text-xs font-extrabold cursor-pointer"
                    >
                      Edit Welcome Kit Images &amp; Training Sections →
                    </button>
                  )}
                </div>
              );
            })()
          ) : (
          <>
          {/* Tab Navigation: [1. Hero Themes & Sections] | [2. Edit Content] */}
          <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSidebarTab('themes')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sidebarTab === 'themes'
                  ? 'bg-[#5A1E65] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Theme & Sections</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('content')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sidebarTab === 'content'
                  ? 'bg-[#5A1E65] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="truncate">Edit: {selectedBlock?.title?.split(' ')[0] || 'Content'}</span>
            </button>
          </div>

          {/* TAB 1: HERO THEMES, SWATCHES & HOMEPAGE SECTIONS */}
          {sidebarTab === 'themes' && (
            <>
              {/* Hero Design Picker */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#5A1E65]" />
                <span>Hero Design Style</span>
              </div>
              <span className="text-[10px] font-bold text-[#5A1E65] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                18 Styles
              </span>
            </div>

            <select
              aria-label="Hero Design Style"
              value={heroTheme}
              onChange={(e) => handleSelectHeroPreview(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 text-xs font-bold text-slate-900 bg-white focus:border-[#5A1E65] outline-none cursor-pointer"
            >
              <optgroup label="Core Website Hero Designs">
                {CORE_HERO_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.number}. {t.name}
                    {t.id === publishedHeroTheme ? ' ★ (LIVE)' : ''}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Seasonal & LGBTQ+ Festival Modes">
                {FESTIVAL_HERO_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.number}. {t.name} ({t.badge})
                    {t.id === publishedHeroTheme ? ' ★ (LIVE)' : ''}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Quick Visual Swatch Cards for Top 3 Most Used */}
            <div className="space-y-1.5">
              {[
                CORE_HERO_THEMES[0], // Aurora (Live Flagship)
                CORE_HERO_THEMES[1], // Spotlight Design 2
                CORE_HERO_THEMES[9]  // Night Center
              ]
                .filter(Boolean)
                .map((preset) => {
                  const isPreviewing = heroTheme === preset.id;
                  const isLive = publishedHeroTheme === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectHeroPreview(preset.id)}
                      className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isPreviewing
                          ? 'bg-purple-50 border-[#5A1E65] ring-1 ring-[#5A1E65]'
                          : 'bg-slate-50/70 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-extrabold text-slate-900 truncate">
                          {preset.number}. {preset.id === 'aurora' ? 'Flagship Aurora (Default)' : preset.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {preset.palette.slice(0, 4).map((hex, i) => (
                            <span
                              key={i}
                              className="w-3 h-3 rounded-full border border-black/10"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>
                      {isLive ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                          LIVE
                        </span>
                      ) : isPreviewing ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 shrink-0">
                          PREVIEW
                        </span>
                      ) : null}
                    </button>
                  );
                })}
            </div>

            {heroTheme !== publishedHeroTheme && (
              <button
                type="button"
                onClick={() => handlePublish(heroTheme)}
                disabled={isPublishing}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#5A1E65] to-indigo-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Publish “{previewThemeObj.name.split(':')[0]}” Live Now</span>
              </button>
            )}
          </div>

          {/* Section Order & Visibility */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Homepage Sections
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Drag or Arrows</span>
            </div>

            <div className="space-y-1.5">
              {blocks.map((block, index) => {
                const isSelected = block.id === selectedBlock?.id;
                const isDragging = draggedIdx === index;
                const isDragOver = dragOverIdx === index;

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleSelectBlock(block.id)}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-purple-50 border-[#5A1E65] ring-1 ring-[#5A1E65]'
                        : 'bg-white border-slate-200 hover:border-purple-300'
                    } ${isDragging ? 'opacity-40' : ''} ${
                      isDragOver ? 'border-t-4 border-t-purple-600' : ''
                    } ${block.enabled === false ? 'opacity-50 bg-slate-50' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{block.title}</p>
                        <p className="text-[10px] text-slate-500">Order #{index + 1}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, -1)}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-[#5A1E65] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 1)}
                        disabled={index === blocks.length - 1}
                        className="p-1 text-slate-400 hover:text-[#5A1E65] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBlockVisibility(block.id)}
                        className={`p-1 rounded-md cursor-pointer ${
                          block.enabled === false ? 'text-slate-400' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={block.enabled === false ? 'Hidden — click to show' : 'Visible — click to hide'}
                      >
                        {block.enabled === false ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* TAB 2: PROPERTIES INSPECTOR FOR SELECTED BLOCK */}
      {sidebarTab === 'content' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Edit Section
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-[#5A1E65] truncate max-w-[130px]">
                {selectedBlock?.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarTab('themes')}
              className="text-[11px] font-bold text-[#5A1E65] hover:underline cursor-pointer shrink-0"
            >
              ← All Sections
            </button>
          </div>

            {selectedBlock?.type === 'hero_banner' && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">
                        Hero Status Pill (Open Now • Hours)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Floating status pill above the Hero headline
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={!selectedBlock.props?.hideStatusPill}
                        onChange={(e) => updateSelectedBlockProps('hideStatusPill', !e.target.checked)}
                        className="rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65]"
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer bg-white/80 px-2 py-1 rounded-lg border border-purple-100">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedBlock.props?.statusPillUseCustom)}
                      onChange={(e) => updateSelectedBlockProps('statusPillUseCustom', e.target.checked)}
                      className="rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65]"
                    />
                    <span>Override live auto-status &amp; org hours with custom text below</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Status Headline
                      </label>
                      <input
                        type="text"
                        value={selectedBlock.props?.statusHeadline || ''}
                        onChange={(e) => updateSelectedBlockProps('statusHeadline', e.target.value)}
                        placeholder="Center Open Today"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Hours / Schedule
                      </label>
                      <input
                        type="text"
                        value={selectedBlock.props?.statusSchedule || ''}
                        onChange={(e) => updateSelectedBlockProps('statusSchedule', e.target.value)}
                        placeholder="Mon–Fri 1:00 PM – 5:00 PM"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Highlight Tag
                      </label>
                      <input
                        type="text"
                        value={selectedBlock.props?.statusTag || ''}
                        onChange={(e) => updateSelectedBlockProps('statusTag', e.target.value)}
                        placeholder="HIV/STI Screenings 1st Mon 3–7 PM"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Pill Click Link
                      </label>
                      <input
                        type="text"
                        value={selectedBlock.props?.statusPillLink || '/programs/community-resource-center'}
                        onChange={(e) => updateSelectedBlockProps('statusPillLink', e.target.value)}
                        placeholder="/programs/community-resource-center"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-200/70">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Mobile Char Limit
                      </label>
                      <input
                        type="number"
                        min={16}
                        max={80}
                        value={selectedBlock.props?.statusMobileMaxChars ?? 36}
                        onChange={(e) =>
                          updateSelectedBlockProps(
                            'statusMobileMaxChars',
                            Math.max(16, Math.min(80, Number(e.target.value) || 36))
                          )
                        }
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-300 text-[11px] bg-white font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Desktop Char Limit
                      </label>
                      <input
                        type="number"
                        min={30}
                        max={140}
                        value={selectedBlock.props?.statusDesktopMaxChars ?? 72}
                        onChange={(e) =>
                          updateSelectedBlockProps(
                            'statusDesktopMaxChars',
                            Math.max(30, Math.min(140, Number(e.target.value) || 72))
                          )
                        }
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-300 text-[11px] bg-white font-bold text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Eyebrow Label</label>
                  <input
                    type="text"
                    value={selectedBlock.props?.eyebrow || ''}
                    onChange={(e) => updateSelectedBlockProps('eyebrow', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#5A1E65]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Line 1</label>
                    <input
                      type="text"
                      value={selectedBlock.props?.titleLine1 || ''}
                      onChange={(e) => updateSelectedBlockProps('titleLine1', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Line 2 Ending</label>
                    <input
                      type="text"
                      value={selectedBlock.props?.titleLine2 || ''}
                      onChange={(e) => updateSelectedBlockProps('titleLine2', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gradient Accent Words</label>
                  <input
                    type="text"
                    value={selectedBlock.props?.titleAccentWord || ''}
                    onChange={(e) => updateSelectedBlockProps('titleAccentWord', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-[#5A1E65] bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hero Description</label>
                  <textarea
                    rows={3}
                    value={selectedBlock.props?.description || ''}
                    onChange={(e) => updateSelectedBlockProps('description', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Button</label>
                    <input
                      type="text"
                      value={selectedBlock.props?.primaryCtaText || ''}
                      onChange={(e) => updateSelectedBlockProps('primaryCtaText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Link</label>
                    <input
                      type="text"
                      value={selectedBlock.props?.primaryCtaUrl || '/programs'}
                      onChange={(e) => updateSelectedBlockProps('primaryCtaUrl', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Secondary Button</label>
                    <input
                      type="text"
                      value={selectedBlock.props?.secondaryCtaText || ''}
                      onChange={(e) => updateSelectedBlockProps('secondaryCtaText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Secondary Link</label>
                    <input
                      type="text"
                      value={selectedBlock.props?.secondaryCtaUrl || '/contact'}
                      onChange={(e) => updateSelectedBlockProps('secondaryCtaUrl', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email CTA Button Target (mailto: — displays “Send us an email”)
                  </label>
                  <input
                    type="email"
                    value={selectedBlock.props?.emailAddress || ''}
                    onChange={(e) => updateSelectedBlockProps('emailAddress', e.target.value)}
                    placeholder="info@diversitycollective.org"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">Hero Photo (URL or Upload from Device)</label>
                  <input
                    type="text"
                    value={selectedBlock.props?.photoUrl || ''}
                    onChange={(e) => updateSelectedBlockProps('photoUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  />
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/70 hover:bg-purple-100/70 text-[11px] font-extrabold text-[#5A1E65] cursor-pointer transition-colors">
                    <span>Upload Photo from Local Storage</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          setSaveToast({ type: 'success', text: 'Uploading hero photo...' });
                          const result = await uploadAndStoreImage(file, 'hero');
                          if (result?.url) {
                            updateSelectedBlockProps('photoUrl', result.url);
                            updateSelectedBlockProps('spotlightImage', result.url);
                            setSaveToast({ type: 'success', text: 'Hero photo uploaded! Click Publish Live to Website to save.' });
                            setTimeout(() => setSaveToast(null), 4000);
                          }
                        } catch (err) {
                          setSaveToast({ type: 'warn', text: 'Photo upload failed: ' + (err?.message || 'Unknown error') });
                          setTimeout(() => setSaveToast(null), 5000);
                        }
                      }}
                    />
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {QUICK_HERO_PHOTOS.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => {
                          updateSelectedBlockProps('photoUrl', img.url);
                          updateSelectedBlockProps('spotlightImage', img.url);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer ${
                          selectedBlock.props?.photoUrl === img.url
                            ? 'bg-[#5A1E65] text-white border-[#5A1E65]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Helpline Banner Text</label>
                  <input
                    type="text"
                    value={selectedBlock.props?.helplineText || ''}
                    onChange={(e) => updateSelectedBlockProps('helplineText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  />
                </div>
              </div>
            )}

            {selectedBlock?.type === 'impact_popups' && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[#5A1E65]" />
                    <span className="text-xs font-bold text-[#5A1E65]">Rotating Impact Highlights Bar</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Live rotating milestones displayed directly beneath the hero header. Each milestone highlights a number and complete community achievement sentence.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Popup Rotation Speed</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1500}
                      max={12000}
                      step={200}
                      value={selectedBlock.props?.intervalMs || 3800}
                      onChange={(e) => updateSelectedBlockProps('intervalMs', Number(e.target.value) || 3800)}
                      className="w-28 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                    />
                    <span className="text-xs text-slate-500 font-medium">ms ({((selectedBlock.props?.intervalMs || 3800) / 1000).toFixed(1)}s per slide)</span>
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {[
                      { ms: 2800, label: 'Fast (2.8s)' },
                      { ms: 3800, label: 'Default (3.8s)' },
                      { ms: 5000, label: 'Gentle (5.0s)' }
                    ].map((spd) => (
                      <button
                        key={spd.ms}
                        type="button"
                        onClick={() => updateSelectedBlockProps('intervalMs', spd.ms)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          (selectedBlock.props?.intervalMs || 3800) === spd.ms
                            ? 'bg-[#5A1E65] text-white border-[#5A1E65]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        {spd.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    Impact Milestones (1 – 5)
                  </span>

                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#5A1E65] bg-purple-100 px-2 py-0.5 rounded-full uppercase">
                          Impact Milestone #{n}
                        </span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Number / Metric Badge</label>
                        <input
                          type="text"
                          value={selectedBlock.props?.[`stat${n}Number`] || ''}
                          onChange={(e) => updateSelectedBlockProps(`stat${n}Number`, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                          placeholder="e.g. 10+, 5,000+, 1,200+, 100%"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Impact Highlight Sentence</label>
                        <textarea
                          rows={2}
                          value={selectedBlock.props?.[`stat${n}Label`] || ''}
                          onChange={(e) => updateSelectedBlockProps(`stat${n}Label`, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white leading-relaxed resize-none"
                          placeholder="e.g. years serving and advocating for Ventura County's LGBTQ+ community."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBlock?.type === 'impact_stats' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Eyebrow Tag</label>
                  <input
                    type="text"
                    value={selectedBlock.props?.eyebrow || ''}
                    onChange={(e) => updateSelectedBlockProps('eyebrow', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                    placeholder="e.g. 10-YEAR TRACK RECORD"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Section Headline</label>
                  <input
                    type="text"
                    value={selectedBlock.props?.headline || ''}
                    onChange={(e) => updateSelectedBlockProps('headline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                    placeholder="e.g. Trusted community support across Ventura County."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Section Description</label>
                  <textarea
                    rows={2}
                    value={selectedBlock.props?.description || ''}
                    onChange={(e) => updateSelectedBlockProps('description', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white resize-none"
                    placeholder="e.g. Since 2014, we have provided barrier-free, non-judgmental services..."
                  />
                </div>

                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    Detailed Milestone Cards (1 – 4)
                  </span>
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[10px] font-black text-[#5A1E65] bg-purple-100 px-2 py-0.5 rounded-full uppercase">
                        Card #{n}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Stat Number</label>
                          <input
                            type="text"
                            value={selectedBlock.props?.[`stat${n}Number`] || ''}
                            onChange={(e) => updateSelectedBlockProps(`stat${n}Number`, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                            placeholder="e.g. 10+"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Metric Title</label>
                          <input
                            type="text"
                            value={selectedBlock.props?.[`stat${n}Label`] || ''}
                            onChange={(e) => updateSelectedBlockProps(`stat${n}Label`, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                            placeholder="e.g. Years of Service"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Metric Subtitle / Impact Narrative</label>
                        <textarea
                          rows={2}
                          value={selectedBlock.props?.[`stat${n}Sub`] || ''}
                          onChange={(e) => updateSelectedBlockProps(`stat${n}Sub`, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white resize-none"
                          placeholder="e.g. Defending rights and providing safe harbor in Ventura County since 2014."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBlock?.type !== 'hero_banner' && selectedBlock?.type !== 'impact_stats' && selectedBlock?.type !== 'impact_popups' && (
              <div className="space-y-3">
                {selectedBlock?.props?.eyebrow !== undefined && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Eyebrow Tag</label>
                    <input
                      type="text"
                      value={selectedBlock.props.eyebrow || ''}
                      onChange={(e) => updateSelectedBlockProps('eyebrow', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                )}
                {selectedBlock?.props?.headline !== undefined && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Section Headline</label>
                    <input
                      type="text"
                      value={selectedBlock.props.headline || ''}
                      onChange={(e) => updateSelectedBlockProps('headline', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                )}
                {selectedBlock?.props?.headlineLine1 !== undefined && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Quote Line 1</label>
                      <input
                        type="text"
                        value={selectedBlock.props.headlineLine1 || ''}
                        onChange={(e) => updateSelectedBlockProps('headlineLine1', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Accent Quote</label>
                      <input
                        type="text"
                        value={selectedBlock.props.headlineAccent || ''}
                        onChange={(e) => updateSelectedBlockProps('headlineAccent', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
                {selectedBlock?.props?.description !== undefined && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={selectedBlock.props.description || ''}
                      onChange={(e) => updateSelectedBlockProps('description', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                )}
                {selectedBlock?.props?.ctaText !== undefined && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Button Label</label>
                    <input
                      type="text"
                      value={selectedBlock.props.ctaText || ''}
                      onChange={(e) => updateSelectedBlockProps('ctaText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                )}
                {selectedBlock?.props?.primaryCtaText !== undefined && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Button Label</label>
                    <input
                      type="text"
                      value={selectedBlock.props.primaryCtaText || ''}
                      onChange={(e) => updateSelectedBlockProps('primaryCtaText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                )}
                {selectedBlock?.type === 'flex_space' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#5A1E65]" />
                      <span className="text-xs font-bold text-[#5A1E65]">
                        Community Flex Booking Form & Slots
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Customize reservation form fields (Name, Email, Purpose, etc.), operating hours, and bookable time windows in the dedicated Forms & Slots Studio.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('dcvc_navigate_admin_tab', {
                            detail: { tab: 'features', subTab: 'flex' }
                          })
                        );
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Edit Flex Form Fields, Slots & Timings →</span>
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 pt-1">
                  Click any section on the live preview to inspect and edit its contents, or switch to Theme & Sections above.
                </p>
              </div>
            )}
          </div>
        )}
          </>
          )}
      </div>

      {/* RIGHT PREVIEW COLUMN: Expansive Responsive Live Canvas */}
      <div className={canvasMode === 'wide' ? 'xl:col-span-12' : 'xl:col-span-8'}>
        <div className="bg-slate-200/70 rounded-3xl p-3 sm:p-5 border border-slate-300/80 shadow-inner flex flex-col items-center">
          <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 text-[11px] font-bold text-slate-700 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Previewing: <strong className="text-[#5A1E65]">{previewThemeObj.name}</strong>
                <span className="ml-1.5 text-[10px] font-semibold text-slate-500">
                  ({VIEWPORT_WIDTHS[viewport]}px {viewport})
                </span>
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] text-slate-500">
                Click any section to edit →
              </span>
              <button
                type="button"
                onClick={() => setIsFullScreenPreview(true)}
                className="px-2.5 py-1 rounded-lg bg-[#5A1E65] hover:bg-purple-900 text-white text-[10px] font-extrabold inline-flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Full Screen</span>
              </button>
            </div>
          </div>

          <div
            className="w-full transition-all duration-300 flex justify-center"
            style={{
              maxWidth:
                viewport === 'mobile'
                  ? '375px'
                  : viewport === 'tablet'
                  ? '768px'
                  : '100%'
            }}
          >
            <DevicePreviewFrame
              key={selectedPageKey}
              viewport={viewport}
              title="Admin Live Website Preview"
              previewUrl={`${(SITE_PAGES_CONFIG.find((p) => p.key === selectedPageKey)?.path || '/')}?admin_preview=1`}
              iframeRef={iframeRef}
              onIframeLoad={() => postPreviewSync(selectedPageKey)}
            />
          </div>
        </div>
      </div>
    </div>

      {/* FULL-SCREEN LIVE PREVIEW OVERLAY */}
      {isFullScreenPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full-Screen Live Hero and Homepage Preview"
          className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-sm flex flex-col"
        >
          {/* Sticky Top Control Bar */}
          <div className="px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-white shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                  Full-Screen Preview
                </span>
                <span className="hidden md:inline text-[11px] text-slate-300">
                  · {VIEWPORT_WIDTHS[viewport]}px ({viewport})
                </span>
              </div>

              <select
                aria-label="Hero Design Preset"
                value={heroTheme}
                onChange={(e) => handleSelectHeroPreview(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-purple-400"
              >
                <optgroup label="Core Website Designs">
                  {CORE_HERO_THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.number}. {t.id === 'aurora' ? 'Flagship Aurora (Default)' : t.name}
                      {t.id === publishedHeroTheme ? ' ★ (LIVE)' : ''}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Seasonal & LGBTQ+ Festival Modes">
                  {FESTIVAL_HERO_THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.number}. {t.name} ({t.badge})
                      {t.id === publishedHeroTheme ? ' ★ (LIVE)' : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                {[
                  { id: 'desktop', icon: Monitor, label: 'Desktop' },
                  { id: 'tablet', icon: Tablet, label: 'Tablet' },
                  { id: 'mobile', icon: Smartphone, label: 'Mobile' }
                ].map((v) => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setViewport(v.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewport === v.id
                          ? 'bg-white text-[#5A1E65] shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{v.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handlePublish(heroTheme)}
                disabled={isPublishing}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#5A1E65] to-rose-600 hover:opacity-95 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isPublishing ? 'Publishing...' : 'Publish Live to Website'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreenPreview(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Full Screen</span>
              </button>

              <button
                type="button"
                aria-label="Close Full-Screen Preview"
                onClick={() => setIsFullScreenPreview(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview Stage */}
          <div className="dcvc-preview-stage flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 flex justify-center items-start">
            <div
              className="w-full my-2 flex justify-center"
              style={{
                maxWidth:
                  viewport === 'mobile'
                    ? '375px'
                    : viewport === 'tablet'
                    ? '768px'
                    : '100%'
              }}
            >
              <DevicePreviewFrame
                key={`fullscreen-${selectedPageKey}`}
                viewport={viewport}
                title="Full-Screen Device Preview"
                previewUrl={`${(SITE_PAGES_CONFIG.find((p) => p.key === selectedPageKey)?.path || '/')}?admin_preview=1`}
                iframeRef={fullScreenIframeRef}
                onIframeLoad={() => postPreviewSync(selectedPageKey)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
