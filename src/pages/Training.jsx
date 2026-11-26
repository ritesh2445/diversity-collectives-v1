import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  ShieldCheck, 
  FileText,
  Calendar,
  Building,
  Store,
  Search,
  Award,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Package,
  Layers,
  PhoneCall,
  X
} from 'lucide-react';
import { trainingCourses } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import CardSpotlight from '../components/CardSpotlight';
import MobileCarousel from '../components/MobileCarousel';
import DcvcApprovedBadge from '../components/DcvcApprovedBadge';
import AffirmingReadinessQuiz from '../components/training/AffirmingReadinessQuiz';
import AccreditationPathwayRoadmap from '../components/training/AccreditationPathwayRoadmap';
import ApprovedWelcomeKitShowcase from '../components/training/ApprovedWelcomeKitShowcase';
import TrainingRoiCalculator from '../components/training/TrainingRoiCalculator';
import QuickSyllabusModal from '../components/training/QuickSyllabusModal';
import BusinessTestimonials from '../components/training/BusinessTestimonials';
import TrainingFaqAccordion from '../components/training/TrainingFaqAccordion';
import { usePageMeta } from '../utils/seo';

const SECTOR_FILTERS = [
  { id: 'all', label: 'All Workshops & Tracks' },
  { id: 'business', label: '🏪 Business Accreditation (DCVC Approved)' },
  { id: 'corporate', label: '💼 Corporate & SB 396' },
  { id: 'healthcare', label: '🏥 Healthcare & Clinics' },
  { id: 'youth', label: '🎓 Schools & Youth Mentors' },
  { id: 'wellness', label: '💇 Salons & Wellness' }
];

export default function Training() {
  usePageMeta({
    title: 'P.R.I.D.E. Educational Training & DCVC Affirming Business Accreditation',
    description: 'Ventura County cultural competency and LGBTQ+ equity workshops. Train your storefront or corporate team beforehand to earn the official DCVC Approved Business badge and window cling.',
    canonicalPath: '/training'
  });

  const [courses, setCourses] = useState(() => cmsStore.getTrainings?.() || trainingCourses);
  const [trainingContent, setTrainingContent] = useState(() => cmsStore.getTrainingPageContent?.() || {});
  const [activeSector, setActiveSector] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);

  useEffect(() => {
    return cmsStore.subscribe(() => {
      const next = cmsStore.getTrainings?.();
      if (Array.isArray(next) && next.length > 0) setCourses(next);
      const nextContent = cmsStore.getTrainingPageContent?.();
      if (nextContent && typeof nextContent === 'object') setTrainingContent(nextContent);
    });
  }, []);

  // Filter courses by sector & search query
  const filteredCourses = courses.filter((course) => {
    const matchesSector = 
      activeSector === 'all' || 
      course.sector === activeSector ||
      (activeSector === 'business' && course.isBusinessAccreditation);

    if (!matchesSector) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const title = (course.title || '').toLowerCase();
    const summary = (course.summary || '').toLowerCase();
    const audience = (course.targetAudience || '').toLowerCase();
    const badge = (course.badge || '').toLowerCase();
    const objectives = (course.learningObjectives || []).join(' ').toLowerCase();

    return (
      title.includes(q) ||
      summary.includes(q) ||
      audience.includes(q) ||
      badge.includes(q) ||
      objectives.includes(q)
    );
  });

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800 space-y-20 sm:space-y-28">
      
      {/* HERO SECTION */}
      <section className="container-clean relative overflow-hidden">
        {/* Glow orb background */}
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/30 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-emerald-200/25 blur-3xl pointer-events-none -ml-20" 
          aria-hidden="true" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Hero Left Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
                {trainingContent.heroEyebrow || 'P.R.I.D.E. EDUCATION & ACCREDITATION'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                PATHWAY TO DCVC APPROVED STATUS
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.1]">
              {trainingContent.heroTitle ? (
                <span>
                  {trainingContent.heroTitle
                    .replace(/\s*&\s*(Earn the\s*)?DCVC Approved Seal/gi, '')
                    .trim() || 'LGBTQ+ Competency'}
                </span>
              ) : (
                <>
                  Transforming Spaces. <br />
                  <span className="bg-gradient-to-r from-[#5A1E65] via-purple-700 to-emerald-600 bg-clip-text text-transparent">
                    Accrediting Businesses.
                  </span>
                </>
              )}
            </h1>

            <p className="font-serif italic text-lg sm:text-2xl text-slate-700 leading-relaxed max-w-2xl">
              {trainingContent.heroSubtitle || "Parents & Professionals' Responsibility for Inclusion, Diversity, and Equity. We train local businesses and organizations beforehand to build genuinely welcoming spaces and earn official DCVC Approved Partner status."}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection('readiness-audit')}
                className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Take 60-Second Business Audit</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('course-catalog')}
                className="btn-secondary py-3 px-6 text-xs sm:text-sm font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <span>Browse Training Catalog</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/80 max-w-xl">
              <div className="space-y-0.5">
                <span className="font-display text-2xl font-black text-[#5A1E65]">{trainingContent.stat1Number || '40+'}</span>
                <span className="text-[11px] text-slate-500 font-medium block">{trainingContent.stat1Label || 'Accredited Local Businesses'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-display text-2xl font-black text-emerald-600">{trainingContent.stat2Number || '98%'}</span>
                <span className="text-[11px] text-slate-500 font-medium block">{trainingContent.stat2Label || 'Trainee Satisfaction & Confidence'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-display text-2xl font-black text-amber-600">{trainingContent.stat3Number || '100%'}</span>
                <span className="text-[11px] text-slate-500 font-medium block">{trainingContent.stat3Label || 'Customized for Local Realities'}</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Spotlight Accreditation Card with Live 3D Badge */}
          <div className="lg:col-span-5">
            <div className="p-8 rounded-3xl bg-white border-2 border-purple-200/90 shadow-2xl space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-purple-100 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    FLAGSHIP ACCREDITATION
                  </span>
                  <DcvcApprovedBadge />
                </div>
                <h3 className="font-display text-2xl font-black text-slate-950 leading-tight">
                  Earn the DCVC Approved Partner Credential
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  DCVC Approved status isn't just handed out. Local businesses complete our tailored cultural competency workshop beforehand to ensure genuine, affirming hospitality for every patron.
                </p>
              </div>

              {/* What You Receive Bullet Points */}
              <div className="space-y-2.5 text-xs text-slate-700 font-medium pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Physical Storefront Window Decal shipped to your door</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Interactive 3D Holographic Approved Badge in Business Directory</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Rainbow Edge Lighting & 1-tap live community Hype Meter</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full California SB 396 & FEHA compliance documentation</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/training/dcvc-affirming-business"
                  className="btn-primary py-2.5 px-5 text-xs font-bold text-center justify-center inline-flex items-center gap-1.5 shadow-md"
                >
                  <span>Explore Accreditation Track</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/directory"
                  className="text-center text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1"
                >
                  See DCVC Approved Businesses in Directory →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Jump Anchor Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-10 pb-2 scrollbar-none border-t border-slate-200/80 mt-12">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Jump to:
          </span>
          <button
            type="button"
            onClick={() => scrollToSection('pathway-roadmap')}
            className="py-1.5 px-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-purple-100 hover:text-[#5A1E65] transition-colors shrink-0 cursor-pointer"
          >
            🗺️ Accreditation Roadmap
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('readiness-audit')}
            className="py-1.5 px-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-purple-100 hover:text-[#5A1E65] transition-colors shrink-0 cursor-pointer"
          >
            📋 60-Sec Readiness Audit
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('welcome-kit')}
            className="py-1.5 px-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-purple-100 hover:text-[#5A1E65] transition-colors shrink-0 cursor-pointer"
          >
            📦 Storefront Welcome Kit
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('roi-calculator')}
            className="py-1.5 px-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-purple-100 hover:text-[#5A1E65] transition-colors shrink-0 cursor-pointer"
          >
            📈 Impact & ROI Calculator
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('course-catalog')}
            className="py-1.5 px-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-purple-100 hover:text-[#5A1E65] transition-colors shrink-0 cursor-pointer"
          >
            📚 Course Catalog
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('training-faqs')}
            className="py-1.5 px-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-purple-100 hover:text-[#5A1E65] transition-colors shrink-0 cursor-pointer"
          >
            ❓ FAQs
          </button>
        </div>
      </section>

      {/* SECTION 1: THE ACCREDITATION PATHWAY ROADMAP */}
      <section id="pathway-roadmap" className="container-clean scroll-mt-24">
        <AccreditationPathwayRoadmap content={trainingContent} />
      </section>

      {/* SECTION 2: 60-SECOND READINESS SELF-AUDIT QUIZ */}
      <section id="readiness-audit" className="container-clean scroll-mt-24">
        <AffirmingReadinessQuiz content={trainingContent} />
      </section>

      {/* SECTION 3: WHAT'S INSIDE THE WELCOME KIT SHOWCASE */}
      <section id="welcome-kit" className="container-clean scroll-mt-24">
        <ApprovedWelcomeKitShowcase content={trainingContent} />
      </section>

      {/* SECTION 4: ROI & IMPACT CALCULATOR */}
      <section id="roi-calculator" className="container-clean scroll-mt-24">
        <TrainingRoiCalculator content={trainingContent} />
      </section>

      {/* SECTION 5: FILTERABLE & SEARCHABLE COURSE CATALOG */}
      <section id="course-catalog" className="container-clean space-y-10 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
              WORKSHOP & CERTIFICATION CATALOG
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Curriculum Tracks & Specialized Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
              From storefront accreditation to clinical intake and youth advocacy, every workshop is led by certified educators and customized to your sector.
            </p>
          </div>

          {/* Live Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, laws, sectors..."
              className="w-full pl-10 pr-9 py-2.5 rounded-full border-2 border-slate-200 text-xs font-medium text-slate-900 bg-white placeholder-slate-400 focus:border-[#5A1E65] outline-none shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sector Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SECTOR_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveSector(filter.id)}
              className={`py-2 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                activeSector === filter.id
                  ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-md scale-105'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Course Cards Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CardSpotlight
                key={course.slug}
                className={`p-7 rounded-3xl bg-white border-2 ${
                  course.isFlagship 
                    ? 'border-purple-400 ring-2 ring-purple-200/60 shadow-xl' 
                    : 'border-slate-200 hover:border-purple-300 shadow-md'
                } flex flex-col justify-between gap-6 h-full transition-all`}
                contentClassName="flex flex-col justify-between gap-6 h-full"
                tilt={true}
                maxTilt={3}
                glare={true}
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                      {course.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{course.duration}</span>
                    </span>
                  </div>

                  {course.isBusinessAccreditation && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200">
                      <Award className="w-3 h-3 text-emerald-600" />
                      <span>DCVC Approved Accreditation Track</span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                    {course.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                    {course.summary}
                  </p>

                  {/* Objectives Preview */}
                  {Array.isArray(course.learningObjectives) && course.learningObjectives.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-slate-500">
                        Key Competencies:
                      </span>
                      <ul className="space-y-1.5 text-slate-600">
                        {course.learningObjectives.slice(0, 3).map((obj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 mt-auto border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedCourseForModal(course)}
                      className="btn-secondary py-2 px-3 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer whitespace-nowrap"
                    >
                      Quick Overview
                    </button>

                    <Link
                      to={`/training/${course.slug}`}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors px-2 py-1"
                    >
                      Details
                    </Link>
                  </div>

                  <Link
                    to={`/training/${course.slug}/book`}
                    className="btn-primary py-2 px-3.5 text-xs font-bold inline-flex items-center gap-1 shadow-sm whitespace-nowrap"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardSpotlight>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-white border-2 border-slate-200 text-center space-y-4 max-w-lg mx-auto">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-display text-lg font-black text-slate-900">
              No matching workshops found
            </h4>
            <p className="text-xs text-slate-600">
              We couldn't find any courses matching "{searchQuery}". Try searching for terms like "SB 396", "storefront", or "clinical".
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setActiveSector('all'); }}
              className="btn-secondary py-2 px-4 text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* SECTION 6: BUSINESS TESTIMONIALS */}
      <section className="container-clean">
        <BusinessTestimonials content={trainingContent} />
      </section>

      {/* SECTION 7: TRAINING FAQS */}
      <section id="training-faqs" className="container-clean scroll-mt-24">
        <TrainingFaqAccordion content={trainingContent} faqs={trainingContent.faqs} />
      </section>

      {/* SECTION 8: BOTTOM CONSULTATION & BOOKING BANNER */}
      <section className="container-clean">
        <div className="training-purple-banner rounded-3xl bg-gradient-to-r from-[#5A1E65] via-purple-900 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-purple-400/30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              <span className="glass-pill text-xs font-bold text-amber-300 bg-amber-400/10 border-amber-400/30">
                {trainingContent.bottomBannerTag || 'VENTURA COUNTY COMMERCE & EQUITY'}
              </span>
              <h2
                className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white !text-white"
                style={{ color: '#FFFFFF' }}
              >
                {trainingContent.bottomBannerHeading || 'Bring DCVC Accreditation to Your Team'}
              </h2>
              <p className="text-xs sm:text-sm text-purple-200 font-medium leading-relaxed">
                {trainingContent.bottomBannerText || 'Whether you run an independent coffee shop on Main Street or a healthcare clinic in Oxnard, our certified educators are ready to tailor an engaging workshop for your team.'}
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-purple-200 pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {trainingContent.bottomBannerBullet1 || 'Sliding scale for local small businesses'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {trainingContent.bottomBannerBullet2 || 'On-site or interactive virtual'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href={trainingContent.bottomBannerPhoneRaw || 'tel:8056445428'}
                className="py-3.5 px-6 text-xs font-bold bg-white text-slate-900 border border-white hover:bg-slate-100 rounded-full w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-102"
              >
                <PhoneCall className="w-4 h-4 text-[#5A1E65]" />
                <span className="text-slate-900 font-bold">{trainingContent.bottomBannerPhone || 'Call (805) 644-5428'}</span>
              </a>

              <Link
                to="/training/book"
                className="training-cta-btn py-3.5 px-8 text-xs font-black tracking-wide rounded-full text-white !text-white bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 border border-purple-300/40 shadow-xl hover:shadow-2xl transition-all inline-flex items-center justify-center gap-2 w-full sm:w-auto text-center whitespace-nowrap cursor-pointer hover:scale-102 shrink-0"
                style={{ color: '#FFFFFF' }}
              >
                <span className="text-white !text-white font-black" style={{ color: '#FFFFFF' }}>{trainingContent.bottomBannerButtonText || 'Request Workshop Proposal'}</span>
                <ArrowRight className="w-4 h-4 text-white !text-white" style={{ color: '#FFFFFF' }} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK SYLLABUS MODAL */}
      <QuickSyllabusModal
        course={selectedCourseForModal}
        isOpen={Boolean(selectedCourseForModal)}
        onClose={() => setSelectedCourseForModal(null)}
      />

    </div>
  );
}
