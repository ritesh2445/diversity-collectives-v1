import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { communityGroups, orgInfo } from '../data/dcvcData';
import { getCommunityGroupData } from '../data/communityData';
import CardSpotlight from '../components/CardSpotlight';

export default function Community() {
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  // Modals state
  const [activeGroupModal, setActiveGroupModal] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState('details'); // 'details' | 'announcements' | 'blog'
  const [activeJoinModal, setActiveJoinModal] = useState(null);
  const [joinForm, setJoinForm] = useState({ name: '', email: '', pronouns: '', notes: '' });
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
    const enriched = getCommunityGroupData(group.name) || group;
    setActiveGroupModal(enriched);
    setModalActiveTab(defaultTab);
  };

  // Open Join Modal
  const handleOpenJoin = (group) => {
    const enriched = getCommunityGroupData(group.name) || group;
    setActiveJoinModal(enriched);
    setJoinSubmitted(false);
    setJoinForm({ name: '', email: '', pronouns: '', notes: '' });
  };

  // Handle Join Submit
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    try {
      const existing = JSON.parse(localStorage.getItem('dcvc_community_joins') || '[]');
      existing.push({
        groupName: activeJoinModal?.name,
        ...joinForm,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('dcvc_community_joins', JSON.stringify(existing));
    } catch {
      // Fallback
    }
    setJoinSubmitted(true);
  };

  // Handle Propose Submit
  const handleProposeSubmit = (e) => {
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
    setProposeSubmitted(true);
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800 font-sans">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        {/* Specular Ambient Glow */}
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            AFFIRMING PEER CIRCLES & GATHERINGS
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Find Your Community & <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Authentic Belonging.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            "We believe in the freedom to be your authentic self, both at home & in the community." Connect with peer support groups meeting regularly at our Community Resource Center.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredGroups.map((group) => {
            const enriched = getCommunityGroupData(group.name);
            const annCount = enriched?.announcements?.length || 0;
            const blogCount = enriched?.blogPosts?.length || 0;

            return (
              <CardSpotlight
                key={group.name}
                className="glass-card p-7 sm:p-8 rounded-3xl border-2 border-slate-200/90 hover:border-[#5A1E65]/80 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
                tilt={false}
                glare={false}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 border border-purple-200/80 px-3 py-1 rounded-full shadow-xs">
                      {group.category}
                    </span>
                    <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {group.ages}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {group.name}
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {group.description}
                  </p>

                  <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                      <span className="font-bold text-slate-900">Meets:</span>
                      <span className="text-slate-600 font-medium">{group.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                      <span className="font-bold text-slate-900">Location:</span>
                      <span className="text-slate-600 font-medium">{group.location}</span>
                    </div>
                  </div>

                  {/* Sub-page quick indicators */}
                  {(annCount > 0 || blogCount > 0) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold">
                      {annCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(group, 'announcements')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          <Bell className="w-3 h-3 text-amber-700" />
                          <span>{annCount} Active {annCount === 1 ? 'Announcement' : 'Announcements'}</span>
                        </button>
                      )}
                      {blogCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(group, 'blog')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-[#5A1E65] border border-purple-200 hover:bg-purple-100 transition-colors"
                        >
                          <BookOpen className="w-3 h-3 text-purple-600" />
                          <span>{blogCount} {blogCount === 1 ? 'Story' : 'Stories'} & Blog</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons: Read Details & Join Community */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 relative z-20">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Read Details Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(group, 'details')}
                      className="btn-secondary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-purple-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-[#5A1E65]" />
                      <span>Read Details</span>
                    </button>

                    {/* Join Community Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenJoin(group)}
                      className="btn-primary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-white" />
                      <span>Join Community</span>
                    </button>
                  </div>

                  {/* Direct Facilitator Email */}
                  <a
                    href={`mailto:${group.contact}?subject=Inquiry%20Regarding%20${encodeURIComponent(group.name)}`}
                    className="text-xs font-bold text-[#5A1E65] hover:underline flex items-center gap-1 bg-purple-50/80 px-3 py-2 rounded-xl border border-purple-200"
                    title="Direct contact with facilitators"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#5A1E65]" />
                    <span className="hidden sm:inline">Facilitators</span>
                  </a>
                </div>
              </CardSpotlight>
            );
          })}
        </div>
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
                    activeGroupModal.announcements.map((ann) => (
                      <div key={ann.id} className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold">
                          <span>📢 Community Update</span>
                          <span>{ann.date}</span>
                        </div>
                        <h4 className="font-display font-black text-slate-950 text-sm">
                          {ann.title}
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
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
                        <div className="flex items-center justify-between text-[11px] text-purple-700 font-bold">
                          <span>By {post.author}</span>
                          <span>{post.date} · {post.readTime}</span>
                        </div>
                        <h4 className="font-display font-black text-slate-950 text-base">
                          {post.title}
                        </h4>
                        <div 
                          className="prose prose-sm text-xs text-slate-700 leading-relaxed font-medium space-y-2"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name or Chosen Name *</label>
                  <input
                    type="text"
                    required
                    value={joinForm.name}
                    onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                    placeholder="e.g. Jordan River"
                    className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                  />
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
