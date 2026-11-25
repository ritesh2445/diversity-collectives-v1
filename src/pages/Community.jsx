import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  Mail, 
  ArrowUpRight, 
  ArrowRight, 
  Sparkles,
  Calendar,
  X,
  Check,
  Bell,
  BookOpen,
  Users,
  Shield,
  Heart,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Star,
  Lock
} from 'lucide-react';
import { useLiveCommunityGroups } from '../hooks/useCmsLive';
import { getCommunityGroupData } from '../data/communityData';
import { submitInquiry } from '../services/api';
import CardSpotlight from '../components/CardSpotlight';
import MobileCarousel from '../components/MobileCarousel';
import { useScrollLock } from '../utils/scrollLock';
import { cmsStore } from '../services/cmsStore';
import { sanitizeHtml } from '../utils/sanitizeHtml';

export default function Community() {
  const communityGroups = useLiveCommunityGroups();
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  // Modals state
  const [activeGroupModal, setActiveGroupModal] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState('details'); // 'details' | 'announcements' | 'blog'
  const [activeJoinModal, setActiveJoinModal] = useState(null);
  const [joinForm, setJoinForm] = useState({ name: '', preferredName: '', email: '', pronouns: '', notes: '', emailConsent: false });
  const [joinSubmitted, setJoinSubmitted] = useState(false);

  // Propose a Group Modal state
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeForm, setProposeForm] = useState({
    groupTitle: '',
    causeOrGoal: '',
    targetAudience: '',
    cadence: 'Bi-Weekly',
    format: 'In-Person at Community Resource Center',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    supportNeeded: 'Meeting space and community promotion'
  });
  const [proposeSubmitted, setProposeSubmitted] = useState(false);

  const categories = [
    'All', 
    'Youth Peer Support', 
    'Adult Peer Support', 
    'Trans & Non-Binary Support', 
    'Seniors / 55+', 
    'Professional & Personal Growth', 
    'Family & Ally Support', 
    'Recovery & Wellness'
  ];

  const filteredGroups = selectedFilter === 'All' 
    ? communityGroups 
    : communityGroups.filter(g => g.category === selectedFilter);

  // Open Details Modal
  const handleOpenDetails = (group, defaultTab = 'details') => {
    const seed = getCommunityGroupData(group.name) || {};
    const rawGuidelines = group.guidelines || seed.guidelines || [];
    const formattedGuidelines = Array.isArray(rawGuidelines) 
      ? rawGuidelines 
      : (typeof rawGuidelines === 'string' && rawGuidelines.trim() ? rawGuidelines.split('\n').map(s => s.trim()).filter(Boolean) : []);

    const enriched = {
      ...seed,
      ...group,
      overview: group.overview || seed.overview || group.description,
      facilitator: group.facilitator || seed.facilitator || 'DCVC Staff & Mentors',
      guidelines: formattedGuidelines,
      announcements: Array.isArray(group.announcements) && group.announcements.length > 0
        ? group.announcements.filter(a => a.published !== false && a.active !== false)
        : (seed.announcements || []),
      blogPosts: Array.isArray(group.stories || group.blogPosts) && (group.stories || group.blogPosts).length > 0
        ? (group.stories || group.blogPosts).filter(s => s.published !== false && s.active !== false)
        : (seed.blogPosts || [])
    };
    setActiveGroupModal(enriched);
    setModalActiveTab(defaultTab);
  };

  // Open Join Modal
  const handleOpenJoin = (group) => {
    const seed = getCommunityGroupData(group.name) || {};
    const enriched = { ...seed, ...group };
    setActiveJoinModal(enriched);
    setJoinSubmitted(false);
    setJoinForm({ name: '', preferredName: '', email: '', pronouns: '', notes: '', emailConsent: false });
  };

  // Handle Join Submit (Emails facilitator + confirmation to member)
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    const groupSlug = activeJoinModal?.slug || (activeJoinModal?.name || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    try {
      const existing = JSON.parse(localStorage.getItem('dcvc_community_joins') || '[]');
      existing.push({
        id: `join-${Date.now()}`,
        groupSlug,
        groupName: activeJoinModal?.name,
        name: joinForm.name,
        preferredName: joinForm.preferredName || joinForm.name,
        email: joinForm.email,
        pronouns: joinForm.pronouns,
        accessibilityNotes: joinForm.notes,
        emailConsent: Boolean(joinForm.emailConsent),
        status: 'submitted',
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('dcvc_community_joins', JSON.stringify(existing));
    } catch {
      // Fallback
    }

    await submitInquiry({
      type: 'community_join',
      groupSlug,
      groupName: activeJoinModal?.name,
      name: joinForm.name,
      preferredName: joinForm.preferredName,
      email: joinForm.email,
      pronouns: joinForm.pronouns,
      accessibilityNotes: joinForm.notes,
      emailConsent: Boolean(joinForm.emailConsent),
      email_updates_consent: Boolean(joinForm.emailConsent),
      subject: `Join Circle: ${activeJoinModal?.name || 'DCVC Community Circle'}`,
      message: `Circle: ${activeJoinModal?.name}\nPreferred Name: ${joinForm.preferredName || joinForm.name}\nPronouns: ${joinForm.pronouns || 'Not provided'}\nAccommodations / Notes: ${joinForm.notes || 'None'}\nEmail Updates Consent: ${joinForm.emailConsent ? 'Yes (Opt-in confirmed)' : 'No'}`
    });
    setJoinSubmitted(true);
  };

  // Handle Propose Submit (Emails proposal confirmation + DCVC operations team)
  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    try {
      const existing = JSON.parse(localStorage.getItem('dcvc_group_proposals') || '[]');
      existing.push({
        ...proposeForm,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('dcvc_group_proposals', JSON.stringify(existing));
    } catch {
      // Fallback
    }

    await submitInquiry({
      type: 'group_proposal',
      name: proposeForm.organizerName,
      email: proposeForm.organizerEmail,
      phone: proposeForm.organizerPhone,
      subject: `New Community Circle Proposal: ${proposeForm.groupTitle}`,
      message: `Circle Name: ${proposeForm.groupTitle}\nCause/Goal: ${proposeForm.causeOrGoal}\nTarget Audience: ${proposeForm.targetAudience}\nCadence: ${proposeForm.cadence}\nFormat: ${proposeForm.format}\nSupport Needed: ${proposeForm.supportNeeded}`
    });
    setProposeSubmitted(true);
  };

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800 font-sans">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        {/* Specular Ambient Glow */}
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs w-fit">
            {cmsStore.getSettings()?.pageCopy?.community?.eyebrow || 'AFFIRMING PEER CIRCLES & GATHERINGS'}
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            {cmsStore.getSettings()?.pageCopy?.community?.headline || (
              <>
                Find Your Community &amp; <br />
                <span className="font-serif italic font-normal text-[#5A1E65]">Authentic Belonging.</span>
              </>
            )}
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            {cmsStore.getSettings()?.pageCopy?.community?.description || '"We believe in the freedom to be your authentic self, both at home & in the community." Connect with peer support groups meeting regularly at our Community Resource Center.'}
          </p>
        </div>

        {/* Filter Pills with Stable Interaction */}
        <div className="flex flex-wrap items-center gap-2.5 pt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border-2 ${
                selectedFilter === cat
                  ? 'bg-slate-950 text-white border-purple-500 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Community Groups Grid in Stable Spotlight Cards */}
      <section className="container-clean py-16">
        <MobileCarousel cols={2} autoScrollMs={0} className="items-stretch" cardClassName="h-full flex flex-col">
          {filteredGroups.map((group) => {
            const enriched = getCommunityGroupData(group.name);
            const annCount = enriched?.announcements?.length || 0;
            const blogCount = enriched?.blogPosts?.length || 0;
            const groupImg = group.image || (Array.isArray(group.images) && group.images[0]) || '/images/community-gathering.jpg';

            return (
              <div
                key={group.id || group.slug || group.name}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-purple-300 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full w-full overflow-hidden group"
              >
                {/* Featured Picture with edge-to-edge 16:10 aspect ratio */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-900 shrink-0">
                  <img
                    src={groupImg}
                    alt={group.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = '/images/community-gathering.jpg';
                    }}
                  />
                  {/* Subtle gradient vignette for badge legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30 pointer-events-none" />

                  {/* Badges on Picture */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#5A1E65]/90 backdrop-blur-md text-white shadow-sm flex items-center gap-1.5 border border-white/20">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{group.category}</span>
                    </span>
                    {group.ages && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white shadow-sm border border-white/10">
                        {group.ages}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 sm:p-7 flex flex-col flex-1 gap-4">
                  {/* Title & Tagline */}
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider block mb-1 text-[#5A1E65]">
                      AFFIRMING COMMUNITY CIRCLE
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-[#5A1E65] transition-colors tracking-tight leading-tight line-clamp-2">
                      {group.name}
                    </h2>
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed line-clamp-3">
                    {group.description}
                  </p>

                  {/* Schedule & Location Box */}
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 space-y-2 text-xs sm:text-sm shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-[#5A1E65] shrink-0" />
                      <span className="font-bold text-slate-900">Meets:</span>
                      <span className="text-slate-700 font-medium">{group.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#5A1E65] shrink-0" />
                      <span className="font-bold text-slate-900">Location:</span>
                      <span className="text-slate-700 font-medium">{group.location}</span>
                    </div>
                  </div>

                  {/* Sub-page quick indicators (Announcements & Blog Stories) */}
                  {(annCount > 0 || blogCount > 0) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1">
                      {annCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(group, 'announcements')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5A1E65] border border-purple-200 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{annCount} Active {annCount === 1 ? 'Announcement' : 'Announcements'}</span>
                        </button>
                      )}
                      {blogCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(group, 'blog')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#5A1E65]" />
                          <span>{blogCount} {blogCount === 1 ? 'Story' : 'Stories'} &amp; Blog</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Primary Action Buttons pinned to bottom with mt-auto */}
                  <div className="pt-4 mt-auto border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(group, 'details')}
                        className="py-2.5 px-4 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-purple-50 text-slate-800 hover:text-[#5A1E65] border border-slate-200 hover:border-purple-200 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5 text-[#5A1E65]" />
                        <span>Explore Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenJoin(group)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#5A1E65] hover:bg-[#43144A] text-white shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-white" />
                        <span className="font-bold text-white text-xs sm:text-sm tracking-wide">Join Circle Online</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {group.externalLink && (
                        <a
                          href={group.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Visit external group page"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#5A1E65]" />
                          <span className="hidden sm:inline">Info</span>
                        </a>
                      )}
                      <a
                        href={`mailto:${group.contact || 'info@diversitycollective.org'}?subject=Inquiry%20Regarding%20${encodeURIComponent(group.name)}`}
                        className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Direct contact with facilitators"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#5A1E65]" />
                        <span className="hidden sm:inline">Contact</span>
                      </a>
                    </div>
                  </div>

                  {/* Community footnote */}
                  <div className="text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5 pt-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Free, Affirming LGBTQ+ Community Circle • Drop-in Welcomed</span>
                  </div>
                </div>
              </div>
            );
          })}
        </MobileCarousel>

      </section>

      {/* Propose / Request a Small Group Section */}
      <section className="container-clean pt-4 pb-12">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-[#5A1E65] via-purple-900 to-[#31103B] text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          
          <div className="space-y-3 relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>GRASSROOTS INITIATIVES & MUTUAL AID</span>
            </span>
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              Want to Build a Group for a Good Cause or Shared Interest?
            </h3>
            <p className="text-xs sm:text-sm text-purple-100 leading-relaxed font-medium">
              Diversity Collective welcomes community-led ideas! Whether you want to start a neurodivergent LGBTQ+ circle, parents of trans youth meetup, arts & craft collective, or book club, we offer free meeting space at Portola Road, guidance, and outreach.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowProposeModal(true);
              setProposeSubmitted(false);
            }}
            className="py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 !text-slate-950 font-black text-sm shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5)] hover:scale-103 transition-all flex-shrink-0 cursor-pointer flex items-center gap-2 relative z-10 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 !text-slate-950 stroke-current" />
            <span className="!text-slate-950 font-black">Request DCVC to Build a Group</span>
            <ArrowRight className="w-4 h-4 !text-slate-950 stroke-current" />
          </button>
        </div>
      </section>

      {/* ====================================================================
          MODAL 1: COMPREHENSIVE GROUP DETAILS, ANNOUNCEMENTS & BLOG
          ==================================================================== */}
      {activeGroupModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99995] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-purple-50 via-slate-50 to-amber-50/40 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase text-[#5A1E65] bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                    {activeGroupModal.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {activeGroupModal.ages}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-black text-slate-950 tracking-tight">
                  {activeGroupModal.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveGroupModal(null)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs (Details / Announcements / Blog) */}
            <div className="flex items-center px-6 bg-slate-100/70 border-b border-slate-200 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalActiveTab('details')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  modalActiveTab === 'details'
                    ? 'border-[#5A1E65] text-[#5A1E65] bg-white shadow-2xs rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Overview & Guidelines</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('announcements')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  modalActiveTab === 'announcements'
                    ? 'border-[#5A1E65] text-[#5A1E65] bg-white shadow-2xs rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Announcements ({activeGroupModal.announcements?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('blog')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  modalActiveTab === 'blog'
                    ? 'border-[#5A1E65] text-[#5A1E65] bg-white shadow-2xs rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Stories & Blog ({activeGroupModal.blogPosts?.length || 0})</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow leading-relaxed">
              
              {/* TAB 1: DETAILS */}
              {modalActiveTab === 'details' && (
                <div className="space-y-5 text-xs text-slate-700">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">About This Peer Circle</h4>
                    <p className="leading-relaxed font-medium">
                      {activeGroupModal.overview || activeGroupModal.description}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                      <span className="font-bold text-slate-900">Meeting Frequency:</span>
                      <span className="font-semibold text-slate-700">{activeGroupModal.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                      <span className="font-bold text-slate-900">Meeting Location:</span>
                      <span className="font-semibold text-slate-700">{activeGroupModal.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                      <span className="font-bold text-slate-900">Facilitated By:</span>
                      <span className="font-semibold text-slate-700">{activeGroupModal.facilitator || 'DCVC Staff & Mentors'}</span>
                    </div>
                  </div>

                  {activeGroupModal.guidelines && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Community Agreements & Safe Space Guidelines</span>
                      </h4>
                      <ul className="space-y-1.5 pl-2">
                        {activeGroupModal.guidelines.map((g, idx) => (
                          <li key={idx} className="flex items-start gap-2 font-medium">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ANNOUNCEMENTS */}
              {modalActiveTab === 'announcements' && (
                <div className="space-y-4">
                  {activeGroupModal.announcements && activeGroupModal.announcements.length > 0 ? (
                    [...activeGroupModal.announcements]
                      .sort((a, b) => (b.isPinned || b.pinned ? 1 : 0) - (a.isPinned || a.pinned ? 1 : 0))
                      .map((ann) => (
                        <div 
                          key={ann.id} 
                          className={`p-5 rounded-2xl border space-y-2 ${
                            ann.isPinned || ann.pinned 
                              ? 'bg-purple-50/70 border-purple-200 shadow-2xs' 
                              : 'bg-amber-50/60 border-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className={ann.isPinned || ann.pinned ? 'text-purple-800 flex items-center gap-1' : 'text-amber-800'}>
                              {ann.isPinned || ann.pinned ? '📌 Pinned Update' : '📢 Community Update'}
                            </span>
                            <span className="text-slate-500">{ann.date || ''}</span>
                          </div>
                          <h4 className="font-display font-black text-slate-950 text-sm">
                            {ann.title}
                          </h4>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                            {ann.content}
                          </p>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No active announcements posted at this time. Check back soon!
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COMMUNITY BLOG */}
              {modalActiveTab === 'blog' && (
                <div className="space-y-6">
                  {activeGroupModal.blogPosts && activeGroupModal.blogPosts.length > 0 ? (
                    activeGroupModal.blogPosts.map((post) => (
                      <article key={post.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        {(post.coverImage || post.image) && (
                          <div className="w-full h-44 rounded-xl overflow-hidden mb-3 bg-slate-100">
                            <img 
                              src={post.coverImage || post.image} 
                              alt={post.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-purple-700 font-bold">
                          <span>By {post.author || 'DCVC Community'}</span>
                          <span>{post.date || ''} {post.readTime ? `· ${post.readTime}` : ''}</span>
                        </div>
                        <h4 className="font-display font-black text-slate-950 text-base">
                          {post.title}
                        </h4>
                        {post.excerpt && (
                          <p className="text-xs font-semibold text-purple-900/80 italic">
                            {post.excerpt}
                          </p>
                        )}
                        {post.content?.includes('<') ? (
                          <div 
                            className="prose prose-sm text-xs text-slate-700 leading-relaxed font-medium space-y-2"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                          />
                        ) : (
                          <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                            {post.content}
                          </p>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No community reflections published yet. Members can submit stories to info@diversitycollective.org!
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer CTAs */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const grp = activeGroupModal;
                  setActiveGroupModal(null);
                  handleOpenJoin(grp);
                }}
                className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Join This Community</span>
              </button>

              <a
                href={`mailto:${activeGroupModal.contact}?subject=Inquiry%20Regarding%20${encodeURIComponent(activeGroupModal.name)}`}
                className="btn-secondary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-1.5 bg-white"
              >
                <Mail className="w-3.5 h-3.5 text-[#5A1E65]" />
                <span>Email Facilitator</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: JOIN COMMUNITY / RSVP MODAL
          ==================================================================== */}
      {activeJoinModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99995] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-purple-100 space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Welcome to the Circle
                </span>
                <h3 className="font-display font-black text-2xl text-slate-950 tracking-tight mt-1">
                  Join {activeJoinModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveJoinModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinSubmitted ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                  ✓
                </div>
                <h4 className="font-display font-black text-emerald-950 text-lg">
                  You're on the Gathering List!
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Thank you for connecting with {activeJoinModal.name}. Our facilitators will email you meeting reminders and calendar links. We look forward to welcoming you!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveJoinModal(null)}
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-xs hover:bg-emerald-800"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-900 border border-purple-100">
                  <p><strong>Meets:</strong> {activeJoinModal.frequency}</p>
                  <p><strong>Location:</strong> {activeJoinModal.location}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={joinForm.name}
                      onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                      placeholder="e.g. Jordan River"
                      className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred / Chosen Name (Optional)</label>
                    <input
                      type="text"
                      value={joinForm.preferredName}
                      onChange={(e) => setJoinForm({ ...joinForm, preferredName: e.target.value })}
                      placeholder="e.g. Jo"
                      className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={joinForm.email}
                      onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                      placeholder="you@domain.org"
                      className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pronouns (Optional)</label>
                    <input
                      type="text"
                      value={joinForm.pronouns}
                      onChange={(e) => setJoinForm({ ...joinForm, pronouns: e.target.value })}
                      placeholder="e.g. they/them, she/her"
                      className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Questions or Accommodations for Facilitator</label>
                  <textarea
                    rows={2}
                    value={joinForm.notes}
                    onChange={(e) => setJoinForm({ ...joinForm, notes: e.target.value })}
                    placeholder="Any accessibility requirements or questions you have before coming?"
                    className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="email-updates-consent"
                    name="email_updates_consent"
                    checked={Boolean(joinForm.emailConsent)}
                    onChange={(e) => setJoinForm({ ...joinForm, emailConsent: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="email-updates-consent" className="text-xs text-slate-600 leading-tight cursor-pointer select-none">
                    I would like to receive email updates and announcements for this community circle. (Optional)
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveJoinModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md"
                  >
                    <span>Confirm & Join Community</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: REQUEST DCVC TO BUILD A NEW COMMUNITY GROUP
          ==================================================================== */}
      {showProposeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99995] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-purple-100 space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Community Proposal
                </span>
                <h3 className="font-display font-black text-2xl text-slate-950 tracking-tight mt-1">
                  Propose a New Community Group
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProposeModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {proposeSubmitted ? (
              <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200 text-center space-y-3">
                <div className="w-12 h-12 bg-[#5A1E65] text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl shadow-md">
                  ✓
                </div>
                <h4 className="font-display font-black text-slate-950 text-lg">
                  Proposal Received!
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Thank you for stepping up to create affirming connection in Ventura County! Our Community Programs Director will review your proposal and contact you within 2 business days to discuss space and scheduling.
                </p>
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#5A1E65] text-white text-xs font-bold shadow-md hover:bg-[#43144A]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleProposeSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proposed Group / Circle Name *</label>
                  <input
                    type="text"
                    required
                    value={proposeForm.groupTitle}
                    onChange={(e) => setProposeForm({ ...proposeForm, groupTitle: e.target.value })}
                    placeholder="e.g. LGBTQ+ Neurodiversity Circle, Queer Arts & Crafts"
                    className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purpose / Good Cause / Social Goal *</label>
                  <textarea
                    rows={2}
                    required
                    value={proposeForm.causeOrGoal}
                    onChange={(e) => setProposeForm({ ...proposeForm, causeOrGoal: e.target.value })}
                    placeholder="What need does this group meet? How will it affirm local members?"
                    className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                    <input
                      type="text"
                      value={proposeForm.targetAudience}
                      onChange={(e) => setProposeForm({ ...proposeForm, targetAudience: e.target.value })}
                      placeholder="e.g. All Adults 18+, Youth 13-18, Parents"
                      className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Frequency</label>
                    <select
                      value={proposeForm.cadence}
                      onChange={(e) => setProposeForm({ ...proposeForm, cadence: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl font-bold bg-slate-50 focus:outline-none"
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-Weekly">Bi-Weekly (Twice a Month)</option>
                      <option value="Monthly">Monthly</option>
                      <option value="One-Time Workshop">One-Time Workshop</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={proposeForm.organizerName}
                      onChange={(e) => setProposeForm({ ...proposeForm, organizerName: e.target.value })}
                      placeholder="Your Name"
                      className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={proposeForm.organizerEmail}
                      onChange={(e) => setProposeForm({ ...proposeForm, organizerEmail: e.target.value })}
                      placeholder="email@domain.com"
                      className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={proposeForm.organizerPhone}
                      onChange={(e) => setProposeForm({ ...proposeForm, organizerPhone: e.target.value })}
                      placeholder="(805) 555-0199"
                      className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">What Support Do You Need from DCVC?</label>
                  <input
                    type="text"
                    value={proposeForm.supportNeeded}
                    onChange={(e) => setProposeForm({ ...proposeForm, supportNeeded: e.target.value })}
                    placeholder="e.g. Free room at Portola Road, flyer printing, mentorship"
                    className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProposeModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 !text-slate-950 font-black text-xs shadow-md hover:scale-102 transition-all cursor-pointer"
                  >
                    <span className="!text-slate-950 font-black">Submit Group Proposal</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
