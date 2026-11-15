import React, { useState, useEffect } from 'react';
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
  ShieldCheck
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
import { SYNC_EVENTS } from '../../services/liveSync';
import HeroShowcase from '../../components/HeroShowcase';
import DevicePreviewFrame, { VIEWPORT_WIDTHS } from './DevicePreviewFrame';

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
  const [blocks, setBlocks] = useState(getSavedPageLayout);
  const [selectedBlockId, setSelectedBlockId] = useState(
    () => getSavedPageLayout()[0]?.id || 'block-hero'
  );
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

  const renderPreviewCanvas = ({ fullScreen = false } = {}) => (
    <div className="bg-white w-full flex flex-col font-sans select-none">
      {/* 1. AUTHENTIC LIVE HEADER PREVIEW */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#FAF5FF]/95 backdrop-blur-md border-b border-purple-200/80 shadow-xs w-full">
        {/* Pride Rainbow Accent Ribbon */}
        <div className="h-1 pride-rainbow-bar w-full" aria-hidden="true" />

        {/* Top Utility Helpline Bar (Hidden on Mobile) */}
        {viewport !== 'mobile' && (
          <div className="bg-[#5A1E65] text-white/95 text-[11px] font-bold px-4 sm:px-6 py-1 flex items-center justify-between border-b border-purple-900/40">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-amber-300 font-extrabold">
                <Phone className="w-3 h-3 text-amber-300" />
                <span>Crisis: (805) 644-5428 · Dial 988</span>
              </span>
              <span className="text-white/30">|</span>
              <span className="text-white/80">Ventura County 501(c)(3) Nonprofit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-bold">
                🌐 English (US)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-[10px] font-black tracking-wide shadow-2xs">
                🛡 Quick Exit
              </span>
            </div>
          </div>
        )}

        {/* Main Navbar */}
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-xs border border-purple-200 bg-white flex-shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/images/logo-square.png"
                alt="DCVC Official Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-display font-extrabold text-sm sm:text-base tracking-tight leading-tight text-slate-950 truncate">
                Diversity Collective
              </span>
              <span className="text-[10px] font-bold tracking-[0.14em] text-[#5A1E65] uppercase truncate">
                Ventura County
              </span>
            </div>
          </div>

          {viewport !== 'mobile' ? (
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 text-xs font-bold text-slate-800">
              <span className="px-2.5 py-1 rounded-lg hover:text-[#5A1E65] hover:bg-purple-50/60 cursor-pointer">About</span>
              <span className="px-2.5 py-1 rounded-lg hover:text-[#5A1E65] hover:bg-purple-50/60 cursor-pointer">Programs</span>
              <span className="px-2.5 py-1 rounded-lg hover:text-[#5A1E65] hover:bg-purple-50/60 cursor-pointer">Community</span>
              <span className="px-2.5 py-1 rounded-lg hover:text-[#5A1E65] hover:bg-purple-50/60 cursor-pointer">Events</span>
              <span className="px-2.5 py-1 rounded-lg hover:text-[#5A1E65] hover:bg-purple-50/60 cursor-pointer">Resources</span>
              <span className="px-2.5 py-1 rounded-lg hover:text-[#5A1E65] hover:bg-purple-50/60 cursor-pointer">Directory</span>
              <div className="px-4 py-1.5 rounded-full bg-[#FDE047] text-slate-950 font-black text-xs shadow-xs hover:bg-amber-300 ml-1 cursor-pointer">
                Donate
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-[#FDE047] text-slate-950 font-black text-[11px] shadow-xs">
                Donate
              </div>
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
                <Menu className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. HOMEPAGE SECTIONS WITH LIVE FIDELITY */}
      <div className="flex flex-col">
        {blocks.map((rawBlock) => {
          if (!rawBlock || rawBlock.enabled === false) return null;
          const block = { ...rawBlock, props: rawBlock.props || {} };
          const isSelected = !fullScreen && block.id === selectedBlock?.id;

          return (
            <div
              key={block.id}
              data-block-id={block.id}
              onClick={() => setSelectedBlockId(block.id)}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? 'ring-4 ring-[#5A1E65] ring-inset z-10'
                  : 'hover:ring-2 hover:ring-purple-400/80'
              }`}
            >
              {/* Live Hero Showcase */}
              {block.type === 'hero_banner' && (
                <HeroShowcase
                  themeId={heroTheme}
                  heroProps={heroBlock.props}
                  previewMode={true}
                  compact={viewport === 'mobile'}
                  viewport={viewport}
                />
              )}

              {/* Impact Numbers */}
              {block.type === 'impact_stats' && (
                <section className="py-10 sm:py-14 bg-gradient-to-b from-purple-100/40 via-teal-100/30 to-amber-100/30 border-b border-purple-200/60 relative overflow-hidden">
                  <div className="container-clean">
                    <div className="max-w-2xl mb-8 flex flex-col gap-2.5">
                      <span className="glass-pill self-start">
                        {block.props.eyebrow || '10-YEAR TRACK RECORD'}
                      </span>
                      <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
                        {block.props.headline || 'Trusted community support across Ventura County.'}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                        {block.props.description || 'Since 2014, we have provided barrier-free, non-judgmental services to LGBTQ+ individuals, youth, and families.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="p-4 sm:p-5 rounded-2xl bg-white/95 border-2 border-purple-300 shadow-sm flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#5A1E65] flex items-center justify-center mb-2">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xl sm:text-2xl font-black text-[#5A1E65]">{block.props.stat1Number || '10+'}</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">{block.props.stat1Label || 'Years of Impact'}</span>
                          <span className="text-[10px] text-slate-500 mt-1 block">Dedicated community presence</span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-white/95 border-2 border-teal-300 shadow-sm flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-2">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xl sm:text-2xl font-black text-teal-700">{block.props.stat2Number || '5,000+'}</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">{block.props.stat2Label || 'Health Screenings'}</span>
                          <span className="text-[10px] text-slate-500 mt-1 block">Free confidential HIV/STI tests</span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-white/95 border-2 border-amber-300 shadow-sm flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xl sm:text-2xl font-black text-amber-700">{block.props.stat3Number || '1,200+'}</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">{block.props.stat3Label || 'Youth Empowered'}</span>
                          <span className="text-[10px] text-slate-500 mt-1 block">Rainbow Umbrella safe circles</span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-white/95 border-2 border-indigo-300 shadow-sm flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center mb-2">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xl sm:text-2xl font-black text-indigo-700">{block.props.stat4Number || '100%'}</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">{block.props.stat4Label || 'Free & Confidential'}</span>
                          <span className="text-[10px] text-slate-500 mt-1 block">Zero fees, complete privacy</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Directory CTA */}
              {block.type === 'directory_cta' && (
                <section className="py-8 sm:py-12 bg-white border-b border-purple-200/60">
                  <div className="container-clean">
                    <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50/50 to-amber-50/60 border-2 border-purple-200/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#5A1E65] text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-[#5A1E65] uppercase tracking-wider mb-1.5 inline-block">
                            Affirming Network
                          </span>
                          <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                            {block.props.headline || 'Find Verified LGBTQ+ Affirming Businesses in Ventura County'}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 leading-relaxed">
                            {block.props.description || 'Discover vetted healthcare providers, affirming therapists, safe spaces, and allied professionals across Ventura, Oxnard, Camarillo, and beyond.'}
                          </p>
                        </div>
                      </div>
                      <div className="px-5 py-2.5 rounded-full bg-[#5A1E65] text-white font-extrabold text-xs shadow-md shrink-0 flex items-center gap-1.5 self-start md:self-center">
                        <span>{block.props.ctaText || 'Explore Directory →'}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Programs Showcase */}
              {block.type === 'programs_section' && (
                <section className="py-10 sm:py-14 bg-[#FAF7F2] border-b border-purple-200/60">
                  <div className="container-clean space-y-6">
                    <div className="flex flex-col gap-2">
                      <span className="glass-pill self-start">LIFESAVING PROGRAMS</span>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                        {block.props.headline || 'Comprehensive Support Across All Generations'}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium">
                        {block.props.description || 'Weekly peer groups, clinical wellness testing, youth empowerment, and advocacy circles.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-white border border-purple-200/80 shadow-xs space-y-2">
                        <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">Youth (13–23)</span>
                        <h4 className="font-bold text-sm text-slate-900">Rainbow Umbrella</h4>
                        <p className="text-xs text-slate-600">Weekly affirming youth drop-in circle with snacks, creative workshops, and mentorship.</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-teal-200/80 shadow-xs space-y-2">
                        <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">Clinical Care</span>
                        <h4 className="font-bold text-sm text-slate-900">Diversity SHINES Clinic</h4>
                        <p className="text-xs text-slate-600">Free, rapid, 100% confidential HIV/STI health screenings and harm-reduction navigation.</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-indigo-200/80 shadow-xs space-y-2">
                        <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">Allies & Trans</span>
                        <h4 className="font-bold text-sm text-slate-900">Trans & Non-Binary Circles</h4>
                        <p className="text-xs text-slate-600">Peer-led support groups providing a safe sanctuary for gender-expansive individuals.</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Cultural Training CTA */}
              {block.type === 'training_cta' && (
                <section className="py-8 sm:py-12 bg-gradient-to-r from-teal-50 via-sky-50 to-purple-50 border-b border-teal-200/60">
                  <div className="container-clean">
                    <div className="p-5 sm:p-7 rounded-3xl bg-white/95 border-2 border-teal-200 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-teal-700 text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                          <Compass className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 uppercase tracking-wider mb-1.5 inline-block">
                            {block.props.eyebrow || 'Workplace & Healthcare Accreditation'}
                          </span>
                          <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                            {block.props.headline || 'P.R.I.D.E. Cultural Competency Training'}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 leading-relaxed">
                            Interactive diversity education for healthcare systems, school districts, law enforcement, and corporate employers.
                          </p>
                        </div>
                      </div>
                      <div className="px-5 py-2.5 rounded-full bg-teal-700 text-white font-extrabold text-xs shadow-md shrink-0 self-start md:self-center">
                        {block.props.ctaText || 'Book Training Session →'}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Zeffy Fee-Free Giving */}
              {block.type === 'zeffy_giving' && (
                <section className="py-10 sm:py-14 bg-gradient-to-b from-amber-50/70 via-purple-50/40 to-white border-b border-amber-200/70">
                  <div className="container-clean space-y-6">
                    <div className="max-w-2xl flex flex-col gap-2">
                      <span className="glass-pill self-start bg-amber-100 text-amber-900 border-amber-300">100% COMMUNITY FUNDED</span>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                        {block.props.headline || 'Every Dollar Goes Directly to Lifesaving Local Programs'}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                        {block.props.description || 'Through Zeffy, 100% of your donation reaches our community center with 0% deducted for transaction fees.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs text-center">
                        <span className="block text-lg font-black text-amber-700">$25</span>
                        <span className="text-[11px] font-bold text-slate-800">Safer Sex & Wellness</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs text-center">
                        <span className="block text-lg font-black text-amber-700">$50</span>
                        <span className="text-[11px] font-bold text-slate-800">2 Health Screenings</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs text-center">
                        <span className="block text-lg font-black text-amber-700">$100</span>
                        <span className="text-[11px] font-bold text-slate-800">Youth Circle Month</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs text-center">
                        <span className="block text-lg font-black text-amber-700">$250</span>
                        <span className="text-[11px] font-bold text-slate-800">Resource Center</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Events & Gatherings */}
              {block.type === 'events_section' && (
                <div className="px-4 sm:px-6 py-6 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 truncate">{block.props.headline || 'Upcoming Community Gatherings'}</p>
                      <p className="text-xs text-slate-500">Pride Prom, Galas, Workshops & Youth Nights</p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0">{block.props.ctaText || 'View Events Calendar'}</span>
                </div>
              )}

              {/* Partnerships */}
              {block.type === 'partnerships_section' && (
                <div className="px-4 sm:px-6 py-6 bg-purple-50/60 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 truncate">{block.props.headline || 'Community Coalition & Alliances'}</p>
                      <p className="text-[11px] text-slate-600 truncate">{block.props.eyebrow || 'Standing together with Ventura County organizations'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#5A1E65] shrink-0">{block.props.ctaText || 'Partner With Us'}</span>
                </div>
              )}

              {/* Community Voices */}
              {block.type === 'community_voices' && (
                <div className="px-4 sm:px-6 py-6 bg-purple-50/40 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 truncate">{block.props.headline || 'Voices from Our Community'}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 shrink-0">Community Testimonials</span>
                </div>
              )}

              {/* Newsletter */}
              {block.type === 'newsletter_section' && (
                <div className="px-4 sm:px-6 py-6 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 truncate">{block.props.headline || 'Stay Connected with DCVC'}</p>
                      <p className="text-xs text-slate-500">Bi-weekly community updates, wellness clinic dates & announcements</p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-[#5A1E65] text-white text-xs font-bold shrink-0">Subscribe</span>
                </div>
              )}

              {/* Final CTA */}
              {block.type === 'final_cta' && (
                <div className="px-4 sm:px-8 py-8 bg-slate-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold truncate">
                        {block.props.headlineLine1 || 'You Are Always'} <span className="text-amber-300">{block.props.headlineAccent || 'Welcome Here.'}</span>
                      </p>
                      <p className="text-xs text-slate-400">Join Ventura County's premier LGBTQ+ community center.</p>
                    </div>
                  </div>
                  <span className="px-5 py-2.5 rounded-full bg-amber-300 text-slate-950 text-xs font-black shadow-md shrink-0">
                    {block.props.primaryCtaText || 'Get In Touch With Us'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. AUTHENTIC LIVE FOOTER PREVIEW */}
      <footer className="bg-slate-950 text-white/90 border-t border-purple-900/50 pt-10 pb-8 px-4 sm:px-8 select-none">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className={`grid ${viewport === 'mobile' ? 'grid-cols-1 gap-6' : 'grid-cols-1 md:grid-cols-4 gap-8'} text-left`}>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5">
                  <img src="/images/logo-square.png" alt="DCVC" className="w-full h-full object-contain" />
                </div>
                <span className="font-display font-extrabold text-sm text-white">
                  Diversity Collective VC
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ventura County's designated 501(c)(3) nonprofit cultural home & wellness center. Safe, affirming, and barrier-free since 2014.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">Direct Care</p>
              <p className="text-slate-300">Free Rapid HIV/STI Screening</p>
              <p className="text-slate-300">Rainbow Umbrella Youth (13–23)</p>
              <p className="text-slate-300">Trans & Non-Binary Peer Circles</p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-purple-300 uppercase tracking-wider text-[11px]">Visit Our Center</p>
              <p className="text-slate-300">2471 Portola Road, Suite 100</p>
              <p className="text-slate-300">Ventura, CA 93003</p>
              <p className="text-slate-400">Mon–Fri 1:00 PM – 5:00 PM</p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">Immediate Crisis</p>
              <p className="text-white font-bold">Helpline: (805) 644-5428</p>
              <p className="text-amber-300 font-extrabold">24/7 Lifeline: Dial 988</p>
              <p className="text-slate-400">Trevor Project: 1-866-488-7386</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Diversity Collective Ventura County · 501(c)(3) Non-Profit</span>
            <span>You Are Always Welcome Here 💜</span>
          </div>
        </div>
      </footer>
    </div>
  );

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
    setBlocks(
      blocks.map((b) =>
        b.id === selectedBlock.id
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
            title={canvasMode === 'wide' ? 'Dock sidebars back to 3-column studio' : 'Expand preview canvas to wide screen width'}
          >
            {canvasMode === 'wide' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{canvasMode === 'wide' ? '3-Column View' : 'Wide Canvas'}</span>
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

      {/* 3-Column Visual Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Hero Design Selector + Section Order List */}
        <div className={`${canvasMode === 'wide' ? 'hidden' : 'xl:col-span-3'} space-y-4`}>
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
                    onClick={() => setSelectedBlockId(block.id)}
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
        </div>

        {/* CENTER COLUMN: Exact Live Hero & Homepage Canvas */}
        <div className={canvasMode === 'wide' ? 'xl:col-span-9' : 'xl:col-span-6'}>
          <div className="bg-slate-200/70 rounded-3xl p-3 sm:p-4 border border-slate-300/80 shadow-inner flex flex-col items-center">
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2.5 text-[11px] font-bold text-slate-700 px-1">
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
                    ? '440px'
                    : viewport === 'tablet'
                    ? '840px'
                    : '100%'
              }}
            >
              <DevicePreviewFrame
                viewport={viewport}
                title="Admin Live Homepage Preview"
                onSelectBlock={setSelectedBlockId}
              >
                {renderPreviewCanvas({ fullScreen: false })}
              </DevicePreviewFrame>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Context Properties Inspector */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Edit Section
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-[#5A1E65] truncate max-w-[140px]">
                {selectedBlock?.title}
              </span>
            </div>

            {selectedBlock?.type === 'hero_banner' && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">
                    Top Center Bar
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={selectedBlock.props?.statusHeadline || ''}
                      onChange={(e) => updateSelectedBlockProps('statusHeadline', e.target.value)}
                      placeholder="Center Open Today"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white"
                    />
                    <input
                      type="text"
                      value={selectedBlock.props?.statusSchedule || ''}
                      onChange={(e) => updateSelectedBlockProps('statusSchedule', e.target.value)}
                      placeholder="Mon–Fri 1:00 PM – 5:00 PM"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={selectedBlock.props?.statusTag || ''}
                    onChange={(e) => updateSelectedBlockProps('statusTag', e.target.value)}
                    placeholder="Free HIV/STI Screenings"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white"
                  />
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const img = new Image();
                          img.onload = () => {
                            const maxW = 1400;
                            const scale = img.width > maxW ? maxW / img.width : 1;
                            const canvas = document.createElement('canvas');
                            canvas.width = Math.round(img.width * scale);
                            canvas.height = Math.round(img.height * scale);
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                            updateSelectedBlockProps('photoUrl', dataUrl);
                            updateSelectedBlockProps('spotlightImage', dataUrl);
                          };
                          img.src = String(reader.result || '');
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
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

            {selectedBlock?.type === 'impact_stats' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Section Headline</label>
                  <input
                    type="text"
                    value={selectedBlock.props?.headline || ''}
                    onChange={(e) => updateSelectedBlockProps('headline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                  />
                </div>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Milestone #{n}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={selectedBlock.props?.[`stat${n}Number`] || ''}
                        onChange={(e) => updateSelectedBlockProps(`stat${n}Number`, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                        placeholder="Number"
                      />
                      <input
                        type="text"
                        value={selectedBlock.props?.[`stat${n}Label`] || ''}
                        onChange={(e) => updateSelectedBlockProps(`stat${n}Label`, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                        placeholder="Title"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedBlock?.type !== 'hero_banner' && selectedBlock?.type !== 'impact_stats' && (
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
                <p className="text-[11px] text-slate-500 pt-1">
                  Use the eye toggle or drag handles on the left to show/hide or reorder sections, then click <strong>Publish Live to Website</strong>.
                </p>
              </div>
            )}
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
                    ? '440px'
                    : viewport === 'tablet'
                    ? '840px'
                    : '1440px'
              }}
            >
              <DevicePreviewFrame
                viewport={viewport}
                title="Full-Screen Device Preview"
                onSelectBlock={setSelectedBlockId}
              >
                {renderPreviewCanvas({ fullScreen: true })}
              </DevicePreviewFrame>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
