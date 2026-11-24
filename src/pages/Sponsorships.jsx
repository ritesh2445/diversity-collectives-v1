import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Eye, 
  ShieldCheck, 
  HeartHandshake, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  Calendar, 
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Info
} from 'lucide-react';
import { cmsStore, DEFAULT_SPONSORSHIP_PAGE_CONTENT } from '../services/cmsStore';
import { usePageMeta } from '../utils/seo';

const CATEGORY_COLORS = {
  'Cover Letter': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Sponsorship Package': 'bg-purple-50 text-[#5A1E65] border-purple-200',
  'Strategic Proposal': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Other': 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function Sponsorships() {
  usePageMeta({
    title: 'Sponsorship & Corporate Partnerships | Diversity Collective Ventura County',
    description: 'Explore DCVC corporate sponsorship opportunities, investment packets, and strategic partnership proposals advancing LGBTQ+ advocacy, health, and youth safety across Ventura County.',
    canonicalPath: '/sponsorships'
  });

  const [pageContent, setPageContent] = useState(() => cmsStore.getSponsorshipPageContent());
  const [documents, setDocuments] = useState(() => cmsStore.getPublishedSponsorshipDocuments());
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return cmsStore.subscribe(() => {
      setPageContent(cmsStore.getSponsorshipPageContent());
      setDocuments(cmsStore.getPublishedSponsorshipDocuments());
    });
  }, []);

  // Category counts based on published documents
  const categories = useMemo(() => {
    const counts = {
      'Cover Letter': 0,
      'Sponsorship Package': 0,
      'Strategic Proposal': 0,
      'Other': 0
    };
    documents.forEach(doc => {
      const cat = doc.category || 'Other';
      if (counts[cat] !== undefined) counts[cat]++;
      else counts['Other']++;
    });
    return counts;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.year && String(doc.year).includes(searchQuery));
      return matchesCategory && matchesSearch;
    });
  }, [documents, activeCategory, searchQuery]);

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-24 bg-transparent text-slate-800">

      {/* Hero & Introduction */}
      <section className="container-clean pb-14 border-b border-purple-100/80 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/30 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-4xl relative z-10 flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200 shadow-xs flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-[#5A1E65]" />
              {pageContent.heroEyebrow || "PARTNER WITH DIVERSITY COLLECTIVE"}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
              Official Document Library
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.06]">
            {pageContent.headline || "Corporate Partnerships & Sponsorship Opportunities"}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-serif italic text-[#5A1E65] leading-relaxed">
            {pageContent.subtitle || "Investing in LGBTQ+ Advocacy, Community Health, and Youth Sanctuaries Across Ventura County"}
          </p>

          <p className="text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed max-w-3xl">
            {pageContent.introduction || "Diversity Collective Ventura County welcomes corporate sponsors, civic foundations, regional employers, and community partners committed to making a lasting impact. Your partnership directly champions our four foundational pillars: Community Advocacy, Cultural Visibility, Safe Peer Sanctuaries, and Equitable Public Health Access across all ten cities of Ventura County."}
          </p>

          {/* 4 Core Pillars of DCVC Sponsorship */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4">
            {[
              {
                pillar: 'Pillar I',
                title: 'Advocacy',
                desc: 'Civic representation & policy',
                cardBg: 'bg-gradient-to-br from-purple-50 via-white to-fuchsia-50/80 border-purple-200/80 hover:border-purple-400 hover:shadow-purple-500/15',
                badge: 'bg-purple-100/90 text-purple-800 border-purple-200',
                bar: 'from-purple-500 to-fuchsia-500'
              },
              {
                pillar: 'Pillar II',
                title: 'Visibility',
                desc: 'Pride & community culture',
                cardBg: 'bg-gradient-to-br from-amber-50 via-white to-orange-50/80 border-amber-200/80 hover:border-amber-400 hover:shadow-amber-500/15',
                badge: 'bg-amber-100/90 text-amber-800 border-amber-200',
                bar: 'from-amber-500 to-orange-500'
              },
              {
                pillar: 'Pillar III',
                title: 'Safety',
                desc: 'Affirming youth peer centers',
                cardBg: 'bg-gradient-to-br from-rose-50 via-white to-pink-50/80 border-rose-200/80 hover:border-rose-400 hover:shadow-rose-500/15',
                badge: 'bg-rose-100/90 text-rose-800 border-rose-200',
                bar: 'from-rose-500 to-pink-500'
              },
              {
                pillar: 'Pillar IV',
                title: 'Wellness',
                desc: 'Free confidential clinical care',
                cardBg: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 border-emerald-200/80 hover:border-emerald-400 hover:shadow-emerald-500/15',
                badge: 'bg-emerald-100/90 text-emerald-800 border-emerald-200',
                bar: 'from-emerald-500 to-teal-500'
              }
            ].map((item) => (
              <div
                key={item.pillar}
                className={`group relative overflow-hidden p-4 rounded-2xl border shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] flex flex-col gap-1.5 cursor-default ${item.cardBg}`}
              >
                <span className={`inline-block w-fit text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border transition-transform duration-300 group-hover:scale-105 ${item.badge}`}>
                  {item.pillar}
                </span>
                <span className="font-display font-black text-base text-slate-900 group-hover:translate-x-0.5 transition-transform duration-300">
                  {item.title}
                </span>
                <span className="text-[11px] font-medium text-slate-600 leading-snug">
                  {item.desc}
                </span>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.bar} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Document Library Section */}
      <section className="container-clean py-14 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-xs font-bold text-[#5A1E65] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              DOWNLOADS & MATERIALS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 mt-1">
              {pageContent.sectionTitle || "Official Sponsorship Documents & Packets"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              {pageContent.sectionSubtitle || "Explore our official 2027 corporate partnership opportunities, investment tier breakdowns, and strategic community impact blueprints. View online or download official PDFs."}
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents or year..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter documents by category">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-[#5A1E65] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-[#5A1E65] border border-slate-200'
            }`}
          >
            All Documents ({documents.length})
          </button>

          {Object.entries(categories).map(([cat, count]) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#5A1E65] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-[#5A1E65] border border-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Document Cards Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-200 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-display text-lg font-bold text-slate-900">No sponsorship documents found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery ? `No documents matched "${searchQuery}". Try a different keyword.` : "There are currently no documents published in this category."}
            </p>
            {(activeCategory !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                className="text-xs font-bold text-[#5A1E65] hover:underline pt-2"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredDocuments.map((doc) => {
              const categoryBadgeClass = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS['Other'];
              const hasFile = Boolean(doc.fileUrl);

              return (
                <article
                  key={doc.id}
                  className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="space-y-4">
                    {/* Badges: Category & Year */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${categoryBadgeClass}`}>
                        {doc.category || 'Sponsorship'}
                      </span>
                      {doc.year && (
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-mono">
                          {doc.year} Campaign
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-xl font-extrabold text-slate-950 group-hover:text-[#5A1E65] transition-colors leading-snug">
                      {doc.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-4">
                      {doc.description || "Official sponsorship publication from Diversity Collective Ventura County."}
                    </p>
                  </div>

                  {/* Actions & File Metadata */}
                  <div className="pt-6 mt-6 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1 text-slate-600 font-semibold">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        PDF Document
                      </span>
                      <span>{doc.fileSize || 'Standard PDF'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* View Action */}
                      <a
                        href={doc.fileUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 text-[#5A1E65] border-purple-200 hover:bg-purple-50 transition-colors"
                        title={`View ${doc.title} in new browser tab`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </a>

                      {/* Download Action */}
                      <a
                        href={doc.fileUrl || '#'}
                        download={doc.fileName || `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`}
                        className="py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 bg-[#5A1E65] text-white hover:bg-purple-900 shadow-sm transition-colors"
                        title={`Download ${doc.title}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Contact / Partnership Enquiry Section */}
      <section className="container-clean pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-[#5A1E65] to-indigo-950 text-white p-8 sm:p-12 shadow-2xl border border-purple-800/80">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                BESPOKE PARTNERSHIP ACTIVATIONS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {pageContent.contactHeading || "Ready to Discuss a Corporate Partnership?"}
              </h2>
              <p className="text-sm sm:text-base text-purple-100 leading-relaxed max-w-xl">
                {pageContent.contactSubtitle || "Our leadership and community development team works directly with corporate sponsors to create tailored engagement packages, employee volunteer days, and premier brand recognition."}
              </p>

              {/* Note about GEM distinction */}
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-xs text-purple-200 flex items-start gap-2.5 max-w-xl">
                <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Corporate sponsorship packages are distinct from our individual <Link to="/donate" className="text-amber-300 underline font-bold hover:text-white">GEM Membership</Link> recurring donor program. Corporate packages include event branding, volunteer activations, and marketing alignments.
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4">
              <h3 className="font-display text-base font-bold text-white">Direct Partnership Contacts</h3>
              
              <div className="space-y-3 text-xs">
                <a
                  href={`mailto:${pageContent.contactEmail || 'info@diversitycollective.org'}?subject=DCVC%202027%20Corporate%20Partnership%20Inquiry`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                >
                  <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="truncate">{pageContent.contactEmail || 'info@diversitycollective.org'}</span>
                </a>

                <a
                  href="tel:+18056445428"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                >
                  <Phone className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{pageContent.contactPhone || '(805) 644-LGBT (5428)'}</span>
                </a>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 text-white/90">
                  <MapPin className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Community Resource Center</p>
                    <p>{pageContent.contactAddress || '2471 Portola Road, Suite 100, Ventura, CA 93003'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`mailto:${pageContent.contactEmail || 'info@diversitycollective.org'}?subject=DCVC%202027%20Corporate%20Partnership%20Inquiry`}
                  className="w-full py-3 px-4 rounded-xl text-center font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <span>{pageContent.contactCtaText || "Email Partnership Inquiry"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <Link
                  to="/contact"
                  className="w-full py-2.5 px-4 rounded-xl text-center font-bold text-xs bg-transparent hover:bg-white/10 text-white border border-white/20 transition-colors"
                >
                  View Center Hours & Location
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
