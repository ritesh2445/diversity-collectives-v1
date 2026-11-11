import React, { useState } from 'react';
import {
  GripVertical,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Sparkles,
  Heart,
  Users,
  Layers,
  Sliders,
  Compass,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  Calendar,
  BookOpen,
  Building2,
  MessageSquareHeart,
  ExternalLink
} from 'lucide-react';
import {
  DEFAULT_PAGE_BLOCKS,
  getSavedPageLayout,
  savePageLayout
} from '../services/adminClient.js';
import {
  getActiveHeroTheme,
  setActiveHeroTheme,
  HERO_THEMES
} from '../../services/heroThemeStore';

export default function DesignEditor({ onPublishSuccess }) {
  const [blocks, setBlocks] = useState(getSavedPageLayout);
  const [selectedBlockId, setSelectedBlockId] = useState(
    () => getSavedPageLayout()[0]?.id || 'block-hero'
  );
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [heroTheme, setHeroTheme] = useState(getActiveHeroTheme);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0];

  // Drag & Drop handlers
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
  };

  const toggleBlockVisibility = (id) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  };

  const updateSelectedBlockProps = (propKey, value) => {
    setBlocks(
      blocks.map((b) =>
        b.id === selectedBlockId
          ? { ...b, props: { ...b.props, [propKey]: value } }
          : b
      )
    );
  };

  const handleHeroThemeSwitch = (themeId) => {
    setHeroTheme(themeId);
    setActiveHeroTheme(themeId);
  };

  const handleResetToLive = () => {
    if (window.confirm('Reset homepage sections and hero copy to the live default layout?')) {
      setBlocks(DEFAULT_PAGE_BLOCKS);
      setSelectedBlockId(DEFAULT_PAGE_BLOCKS[0].id);
      savePageLayout(DEFAULT_PAGE_BLOCKS);
      setSaveStatus('Reset & synced with the live homepage layout.');
      setTimeout(() => setSaveStatus(''), 3500);
    }
  };

  const handleSave = () => {
    savePageLayout(blocks);
    setSaveStatus('Saved! Live homepage hero & section order updated.');
    if (onPublishSuccess) onPublishSuccess();
    setTimeout(() => setSaveStatus(''), 4000);
  };

  return (
    <div className="flex flex-col gap-5 text-slate-900 font-sans">
      {/* Compact Top Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5A1E65] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-950 leading-tight">
              Homepage Hero & Section Order Editor
            </h2>
            <p className="text-xs text-slate-600">
              Click any section to edit text & buttons, or drag sections to rearrange the live site.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Viewport Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewport === 'desktop'
                  ? 'bg-white text-[#5A1E65] shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewport === 'tablet'
                  ? 'bg-white text-[#5A1E65] shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-white text-[#5A1E65] shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            <span>Open Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleResetToLive}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            title="Reset to Live Homepage Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync Default</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save & Publish</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2.5 px-4 rounded-xl shadow-xs">
          {saveStatus}
        </div>
      )}

      {/* Main Editor Grid: Left Section Order (3) + Center Live Preview (6) + Right Simple Properties (3) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Section Order */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#5A1E65]" />
                <span>Homepage Sections ({blocks.length})</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Drag or arrows</span>
            </div>

            <div className="space-y-2">
              {blocks.map((block, idx) => {
                const isSelected = block.id === selectedBlock?.id;
                const isDragging = draggedIdx === idx;
                const isOver = dragOverIdx === idx;

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isDragging
                        ? 'opacity-40 scale-95 border-purple-400 bg-purple-50'
                        : isOver
                        ? 'border-purple-600 bg-purple-100 shadow-md translate-y-0.5'
                        : isSelected
                        ? 'border-[#5A1E65] bg-purple-50 shadow-xs ring-1 ring-[#5A1E65]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-[#5A1E65]">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {block.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(idx, -1);
                        }}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 cursor-pointer"
                        title="Move Section Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(idx, 1);
                        }}
                        disabled={idx === blocks.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 cursor-pointer"
                        title="Move Section Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBlockVisibility(block.id);
                        }}
                        className={`p-1 cursor-pointer ${
                          block.enabled ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                        title={block.enabled ? 'Visible on site (click to hide)' : 'Hidden on site (click to show)'}
                      >
                        {block.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hero Seasonal Preset Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
              Seasonal Hero Mode
            </label>
            <select
              value={heroTheme}
              onChange={(e) => handleHeroThemeSwitch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#5A1E65]"
            >
              {(HERO_THEMES || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Switches homepage atmosphere between Default Sanctuary and seasonal Pride themes.
            </p>
          </div>
        </div>

        {/* CENTER COLUMN: Live-Matched Interactive Preview */}
        <div className="xl:col-span-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white rounded-t-2xl text-xs font-bold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Live Preview ({viewport.toUpperCase()})
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              Matches diversitycollective.pages.dev
            </span>
          </div>

          <div className="w-full bg-slate-200/80 p-3 sm:p-5 rounded-b-2xl flex justify-center overflow-x-auto">
            <div
              className={`w-full bg-[#FAF7F2] text-slate-900 shadow-xl rounded-2xl overflow-hidden border border-purple-200 transition-all duration-300 ${
                viewport === 'mobile'
                  ? 'max-w-[390px]'
                  : viewport === 'tablet'
                  ? 'max-w-[740px]'
                  : 'w-full'
              }`}
            >
              {/* Mock Site Header */}
              <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/images/logo-square.png" alt="Logo" className="w-6 h-6 object-contain" />
                  <span className="text-xs font-black text-slate-900">Diversity Collective</span>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold text-black">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#5A1E65] text-white">Home</span>
                  <span>Programs</span>
                  <span>Events</span>
                  <span>Directory</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-300 text-slate-950 text-[10px] font-black">
                  Donate
                </span>
              </div>

              {/* Ordered Sections */}
              <div className="flex flex-col">
                {blocks.map((block) => {
                  if (!block.enabled) return null;
                  const isSelected = block.id === selectedBlock?.id;

                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#5A1E65] ring-inset z-10'
                          : 'hover:ring-1 hover:ring-purple-400'
                      }`}
                    >
                      {/* LIVE-MATCHED HERO BANNER */}
                      {block.type === 'hero_banner' && (
                        <div className="p-4 sm:p-6 bg-[#FAF7F2] border-b border-purple-200/60 space-y-4">
                          {/* Top Command Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-purple-200 font-bold text-[#5A1E65] shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>
                                {block.props.statusHeadline} · {block.props.schedule || block.props.statusSchedule} · {block.props.statusTag}
                              </span>
                            </div>
                            {viewport !== 'mobile' && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-purple-200 text-slate-700 font-semibold">
                                <Phone className="w-3 h-3 text-purple-700" />
                                <span>{block.props.helplineText}</span>
                              </div>
                            )}
                          </div>

                          {/* Live 2-Column Hero Layout */}
                          <div className={`grid gap-5 items-center ${viewport === 'desktop' ? 'grid-cols-12' : 'grid-cols-1'}`}>
                            {/* Left Column */}
                            <div className={`${viewport === 'desktop' ? 'col-span-7' : ''} space-y-3`}>
                              <span className="inline-block text-[9px] font-bold text-[#5A1E65] py-0.5 px-2.5 bg-purple-50 border border-purple-200 rounded-full">
                                {block.props.eyebrow}
                              </span>

                              <h1 className={`${viewport === 'mobile' ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-black text-slate-950 leading-tight`}>
                                <span className="block">{block.props.titleLine1}</span>
                                <span className="block">
                                  <span className="font-serif italic font-semibold bg-gradient-to-r from-[#4A0E4E] via-[#D91B5C] to-[#F59E0B] bg-clip-text text-transparent mr-2">
                                    {block.props.titleAccentWord}
                                  </span>
                                  <span>{block.props.titleLine2}</span>
                                </span>
                              </h1>

                              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                                {block.props.description}
                              </p>

                              {/* Exact 3 Live CTAs: Explore Free Programs (White Text), Visit Sanctuary, Email Circle */}
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#5A1E65] via-purple-700 to-indigo-600 text-white text-[11px] font-extrabold shadow-sm">
                                  <span>{block.props.primaryCtaText}</span>
                                  <ArrowRight className="w-3 h-3 text-white" />
                                </span>
                                <span className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-white border border-purple-200 text-slate-800 text-[11px] font-bold">
                                  <MapPin className="w-3 h-3 text-[#5A1E65]" />
                                  <span>{block.props.secondaryCtaText}</span>
                                </span>
                                <span
                                  className="w-8 h-8 rounded-full bg-white border border-purple-200 text-[#5A1E65] flex items-center justify-center"
                                  title={block.props.emailAddress}
                                >
                                  <Mail className="w-3.5 h-3.5 text-[#5A1E65]" />
                                </span>
                              </div>

                              {/* Mini Instant Sanctuary Navigator Preview */}
                              <div className="p-2.5 rounded-xl bg-white border border-purple-100 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-[9px] font-black text-slate-800">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    INSTANT SANCTUARY NAVIGATOR
                                  </span>
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    100% Confidential
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 text-[9px] font-bold text-center">
                                  <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-400 text-teal-900">🩺 Rapid Testing</div>
                                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700">🌈 Youth (13–23)</div>
                                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700">📚 Drop-In Hub</div>
                                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700">❤️ Give or Join</div>
                                </div>
                              </div>
                            </div>

                            {/* Right Column: Spotlight Photo Card */}
                            <div className={`${viewport === 'desktop' ? 'col-span-5' : ''}`}>
                              <div className="rounded-2xl overflow-hidden bg-white border border-purple-200 shadow-md">
                                <div className="relative aspect-[4/3] bg-slate-900">
                                  <img
                                    src={block.props.photoUrl || '/images/community-gathering.jpg'}
                                    alt="Hero Sanctuary"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 text-[9px] text-white">
                                    <span className="bg-black/60 px-2 py-0.5 rounded-full truncate">
                                      📍 {block.props.locationBadge}
                                    </span>
                                    <span className="bg-emerald-950/90 text-emerald-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                                      Open Today
                                    </span>
                                  </div>
                                </div>
                                <div className="p-2.5 bg-white flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img src="/images/logo-square.png" alt="" className="w-6 h-6 object-contain shrink-0" />
                                    <div className="truncate">
                                      <p className="text-[10px] font-bold text-slate-900 truncate">{block.props.cardTitle}</p>
                                      <p className="text-[9px] text-slate-500 truncate">{block.props.cardSubtitle}</p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-bold text-[#5A1E65] shrink-0">About Us ↗</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === 'impact_stats' && (
                        <div className="p-4 bg-white border-b border-slate-200">
                          <div className="text-[10px] font-extrabold text-[#5A1E65] uppercase mb-2 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> Impact Milestones
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-purple-50 border border-purple-100">
                              <span className="block text-sm font-black text-[#5A1E65]">{block.props.stat1Number}</span>
                              <span className="text-[9px] text-slate-600">{block.props.stat1Label}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-teal-50 border border-teal-100">
                              <span className="block text-sm font-black text-teal-700">{block.props.stat2Number}</span>
                              <span className="text-[9px] text-slate-600">{block.props.stat2Label}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                              <span className="block text-sm font-black text-amber-700">{block.props.stat3Number}</span>
                              <span className="text-[9px] text-slate-600">{block.props.stat3Label}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === 'directory_cta' && (
                        <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#5A1E65]" />
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">Affirming Business Directory</p>
                              <p className="text-[10px] text-slate-500">{block.props.headline}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-[#5A1E65] text-white text-[10px] font-bold">
                            {block.props.ctaText}
                          </span>
                        </div>
                      )}

                      {block.type === 'programs_section' && (
                        <div className="px-4 py-3 bg-purple-50/40 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[#5A1E65]" />
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">Free Programs (Age-Group Sorted)</p>
                              <p className="text-[10px] text-slate-500">{block.props.headline}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-[#5A1E65]">Little Unicorns → CRC</span>
                        </div>
                      )}

                      {block.type === 'events_section' && (
                        <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-rose-600" />
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">Upcoming Gatherings & Calendar</p>
                              <p className="text-[10px] text-slate-500">{block.props.headline}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-700">{block.props.ctaText}</span>
                        </div>
                      )}

                      {block.type === 'zeffy_giving' && (
                        <div className="px-4 py-3 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-amber-700" />
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">{block.props.headline}</p>
                              <p className="text-[10px] text-slate-600 line-clamp-1">{block.props.description}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shrink-0">
                            {block.props.ctaText}
                          </span>
                        </div>
                      )}

                      {block.type === 'training_cta' && (
                        <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-teal-700" />
                            <p className="text-xs font-extrabold text-slate-900">Community Resource Center & Training</p>
                          </div>
                          <span className="text-[10px] font-bold text-teal-700">Portola Road Hub</span>
                        </div>
                      )}

                      {block.type === 'community_voices' && (
                        <div className="px-4 py-3 bg-purple-50/40 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquareHeart className="w-4 h-4 text-[#5A1E65]" />
                            <p className="text-xs font-extrabold text-slate-900">Community Stories & Voices</p>
                          </div>
                          <span className="text-[10px] text-slate-500">3 Featured Testimonials</span>
                        </div>
                      )}

                      {block.type === 'newsletter_section' && (
                        <div className="px-4 py-3 bg-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#5A1E65]" />
                            <p className="text-xs font-extrabold text-slate-900">Newsletter & Sanctuary Invitation</p>
                          </div>
                          <span className="text-[10px] text-slate-500">Subscribe Footer</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Context Properties Inspector */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Edit Selected Section
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-[#5A1E65]">
                {selectedBlock?.title}
              </span>
            </div>

            {selectedBlock?.type === 'hero_banner' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Top Badge (Eyebrow)</label>
                  <input
                    type="text"
                    value={selectedBlock.props.eyebrow || ''}
                    onChange={(e) => updateSelectedBlockProps('eyebrow', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#5A1E65] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Line 1</label>
                    <input
                      type="text"
                      value={selectedBlock.props.titleLine1 || ''}
                      onChange={(e) => updateSelectedBlockProps('titleLine1', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Line 2 Ending</label>
                    <input
                      type="text"
                      value={selectedBlock.props.titleLine2 || ''}
                      onChange={(e) => updateSelectedBlockProps('titleLine2', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gradient Highlight Text</label>
                  <input
                    type="text"
                    value={selectedBlock.props.titleAccentWord || ''}
                    onChange={(e) => updateSelectedBlockProps('titleAccentWord', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-[#5A1E65] bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hero Description</label>
                  <textarea
                    rows={3}
                    value={selectedBlock.props.description || ''}
                    onChange={(e) => updateSelectedBlockProps('description', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Button</label>
                    <input
                      type="text"
                      value={selectedBlock.props.primaryCtaText || ''}
                      onChange={(e) => updateSelectedBlockProps('primaryCtaText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Secondary Button</label>
                    <input
                      type="text"
                      value={selectedBlock.props.secondaryCtaText || ''}
                      onChange={(e) => updateSelectedBlockProps('secondaryCtaText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Icon Button Target</label>
                  <input
                    type="email"
                    value={selectedBlock.props.emailAddress || ''}
                    onChange={(e) => updateSelectedBlockProps('emailAddress', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hero Photo URL</label>
                  <input
                    type="text"
                    value={selectedBlock.props.photoUrl || ''}
                    onChange={(e) => updateSelectedBlockProps('photoUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Location Badge on Photo</label>
                  <input
                    type="text"
                    value={selectedBlock.props.locationBadge || ''}
                    onChange={(e) => updateSelectedBlockProps('locationBadge', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Top Helpline Banner</label>
                  <input
                    type="text"
                    value={selectedBlock.props.helplineText || ''}
                    onChange={(e) => updateSelectedBlockProps('helplineText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  />
                </div>
              </div>
            )}

            {selectedBlock?.type === 'impact_stats' && (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={selectedBlock.props[`stat${n}Number`] || ''}
                      onChange={(e) => updateSelectedBlockProps(`stat${n}Number`, e.target.value)}
                      className="px-2.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                      placeholder={`Stat ${n}`}
                    />
                    <input
                      type="text"
                      value={selectedBlock.props[`stat${n}Label`] || ''}
                      onChange={(e) => updateSelectedBlockProps(`stat${n}Label`, e.target.value)}
                      className="px-2.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                      placeholder="Label"
                    />
                  </div>
                ))}
              </div>
            )}

            {selectedBlock?.type !== 'hero_banner' && selectedBlock?.type !== 'impact_stats' && (
              <div className="space-y-3">
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Button Label</label>
                    <input
                      type="text"
                      value={selectedBlock.props.ctaText || ''}
                      onChange={(e) => updateSelectedBlockProps('ctaText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                    />
                  </div>
                )}
                <p className="text-[11px] text-slate-500 pt-1">
                  Use the eye toggle on the left to show or hide this section, or drag it up/down to change where it appears on the homepage.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
