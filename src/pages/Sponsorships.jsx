import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Eye, 
  ShieldCheck, 
  HeartHandshake, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  Search,
  CheckCircle2,
  Info,
  Award,
  Users,
  Globe,
  Building2,
  Gift,
  Check,
  Minus,
  Layers
} from 'lucide-react';
import { cmsStore } from '../services/cmsStore';
import { fetchAndApplyLiveSiteState, getFallbackApiBase } from '../services/liveSync';
import { usePageMeta } from '../utils/seo';

const CATEGORY_COLORS = {
  'Cover Letter': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Sponsorship Package': 'bg-purple-50 text-[#5A1E65] border-purple-200',
  'Strategic Proposal': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Other': 'bg-slate-100 text-slate-700 border-slate-200'
};

const SPONSORSHIP_TIERS_2027 = [
  {
    id: 'premier-corporate',
    number: '01',
    name: 'Premier Corporate Partner',
    price: '$25,000+',
    cadence: 'Annual Title Partnership',
    badge: 'Flagship Tier',
    featured: true,
    accentBar: 'from-[#5A1E65] via-fuchsia-600 to-amber-400',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    borderClass: 'border-[#5A1E65] ring-2 ring-[#5A1E65]/15 shadow-xl',
    summary: 'Top-tier title alignment across Ventura County Pride, Health & Wellness Fairs, and year-round Community Resource Center recognition.',
    benefits: [
      'Title alignment at Ventura County Pride & Health & Wellness Fairs',
      'Year-round Community Resource Center naming recognition',
      'VIP executive gala passes & prime banner placement',
      'Dedicated social spotlights to 25,000+ followers'
    ]
  },
  {
    id: 'major-community',
    number: '02',
    name: 'Major Community Sponsor',
    price: '$10,000 – $24,999',
    cadence: 'Program Track Sponsor',
    badge: 'High Impact',
    featured: false,
    accentBar: 'from-indigo-600 to-purple-600',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    borderClass: 'border-indigo-200 hover:border-indigo-400 shadow-md',
    summary: 'Official sponsor of key program tracks—Youth Safe Sanctuaries or Diversity SHINES clinical suites—with prominent stage presence.',
    benefits: [
      'Sponsor of Youth Safe Sanctuaries or Diversity SHINES suites',
      'Prominent stage recognition at signature DCVC events',
      'Premium festival exhibition booth placement',
      'Feature spotlight in quarterly DCVC newsletters'
    ]
  },
  {
    id: 'specialty-event',
    number: '03',
    name: 'Specialty & Event Partner',
    price: '$5,000 – $9,999',
    cadence: 'Signature Program Activation',
    badge: 'Event Focus',
    featured: false,
    accentBar: 'from-rose-500 to-amber-500',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    borderClass: 'border-rose-200 hover:border-rose-400 shadow-md',
    summary: 'Targeted activation sponsorship for signature DCVC programs such as Pride Prom, AIDS Walk Ventura, or Diversity Toastmasters.',
    benefits: [
      'Targeted sponsorship of Pride Prom, AIDS Walk, or Toastmasters',
      'Co-branded event signage across activation zones',
      'Employee volunteer engagement packages'
    ]
  },
  {
    id: 'community-ally',
    number: '04',
    name: 'Community Ally',
    price: '$1,500 – $4,999',
    cadence: 'Local Business & Storefront',
    badge: 'Local Ally',
    featured: false,
    accentBar: 'from-emerald-500 to-teal-500',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderClass: 'border-emerald-200 hover:border-emerald-400 shadow-sm',
    summary: 'Storefront and local business sponsorship connecting neighborhood allies with Ventura County’s LGBTQ+ community.',
    benefits: [
      'Official DCVC Approved badge accreditation',
      'Community partner directory listing',
      'Recognition in official event digital guides'
    ]
  },
  {
    id: 'in-kind',
    number: '05',
    name: 'In-Kind Partnership',
    price: 'Valued Gift-in-Kind',
    cadence: 'Goods, Tech & Pro-Bono',
    badge: 'Operational Support',
    featured: false,
    accentBar: 'from-amber-500 to-orange-500',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    borderClass: 'border-amber-200 hover:border-amber-400 shadow-sm',
    summary: 'Essential hardware, clinic supplies, event hospitality, and professional services that directly power DCVC operations.',
    benefits: [
      'Hardware, technology workstations & clinic supplies',
      'Event catering & hospitality support',
      'Professional pro-bono services & media production'
    ]
  }
];

const COMPARISON_ROWS = [
  {
    feature: '2027 Investment Level',
    values: ['$25,000+', '$10,000 – $24,999', '$5,000 – $9,999', '$1,500 – $4,999']
  },
  {
    feature: 'Title & Program Track Alignment',
    values: ['Pride & Wellness Fairs Title', 'Youth or SHINES Track', 'Signature Event Activation', 'Storefront & Ally']
  },
  {
    feature: 'Resource Center & Stage Recognition',
    values: ['Year-Round Center Naming', 'Prominent Stage Billing', 'Event Zone Signage', false]
  },
  {
    feature: 'Festival Booth & Exhibition',
    values: ['Prime Placement & Banners', 'Premium Exhibition Booth', 'Program Activation Booth', false]
  },
  {
    feature: 'Digital, Newsletter & Social Reach',
    values: ['Spotlights (25,000+ Reach)', 'Quarterly Newsletter Feature', 'Event Digital Recognition', 'Directory & Digital Guide']
  },
  {
    feature: 'VIP Passes & Team Engagement',
    values: ['VIP Executive Gala Passes', 'VIP Event Access', 'Employee Volunteer Package', 'DCVC Approved Badge']
  }
];

const IMPACT_METRICS = [
  {
    value: '20,000+',
    label: 'Annual Community Reach',
    detail: 'Individuals engaged across Ventura, Oxnard, Camarillo, Thousand Oaks, Simi Valley, Ojai & Moorpark.',
    icon: Users,
    accent: 'text-[#5A1E65] bg-purple-50 border-purple-200'
  },
  {
    value: '25,000+',
    label: 'Digital Audience',
    detail: 'Followers and regional subscribers reached through partner spotlights and campaign storytelling.',
    icon: Globe,
    accent: 'text-indigo-700 bg-indigo-50 border-indigo-200'
  },
  {
    value: '10 Cities',
    label: 'Countywide Footprint',
    detail: 'Sole 501(c)(3) operating a physical LGBTQ+ Community Resource Center across Ventura County.',
    icon: Building2,
    accent: 'text-rose-700 bg-rose-50 border-rose-200'
  },
  {
    value: '501(c)(3)',
    label: 'EIN 46-5312131',
    detail: '100% local tax-deductible investment powering free HIV/STI screenings and Rainbow Umbrella youth spaces.',
    icon: ShieldCheck,
    accent: 'text-emerald-700 bg-emerald-50 border-emerald-200'
  }
];

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
    fetchAndApplyLiveSiteState({ force: true }).catch(() => {});
    return cmsStore.subscribe(() => {
      setPageContent(cmsStore.getSponsorshipPageContent());
      setDocuments(cmsStore.getPublishedSponsorshipDocuments());
    });
  }, []);

  const resolveDocUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('/api/')) {
      const workerBase = getFallbackApiBase().replace(/\/api\/?$/, '');
      return `${workerBase}${url}`;
    }
    return url;
  };

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

  const contactEmail = pageContent.contactEmail || 'info@diversitycollective.org';

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
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#5A1E65] text-white shadow-xs">
              2027 Sponsorship Campaign
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

          {/* Quick Jump CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="#tiers-2027"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
            >
              <span>Explore 2027 Tiers</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#document-library"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-[#5A1E65] border border-purple-200 text-xs sm:text-sm font-bold transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>2027 Packets &amp; PDFs</span>
            </a>
          </div>

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

      {/* 2027 Sponsorship Investment Tiers */}
      <section id="tiers-2027" className="container-clean py-14 space-y-10 border-b border-purple-100/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-xs font-bold text-[#5A1E65] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              2027 SPONSORSHIP OPPORTUNITIES
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 mt-1">
              2027 Sponsorship Tiers &amp; Partner Benefits
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Structured investment levels designed for meaningful brand alignment, premier recognition at major regional events, and direct community impact.
            </p>
          </div>
          <a
            href="#tier-comparison"
            className="text-xs font-bold text-[#5A1E65] hover:underline flex items-center gap-1 shrink-0"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Compare all tiers below</span>
          </a>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {SPONSORSHIP_TIERS_2027.map((tier) => (
            <article
              key={tier.id}
              className={`group relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm border-2 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tier.borderClass} ${
                tier.featured ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              {/* PDF-inspired top accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tier.accentBar}`} aria-hidden="true" />

              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black font-mono uppercase tracking-wider text-slate-400">
                    TIER {tier.number} · {tier.cadence}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tier.badgeClass}`}>
                    {tier.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-950 leading-tight">
                    {tier.name}
                  </h3>
                  <div className="mt-2 font-display text-2xl sm:text-3xl font-black text-[#5A1E65]">
                    {tier.price}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {tier.summary}
                </p>

                <ul className="space-y-2.5 pt-3 border-t border-slate-100">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <a
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(`DCVC 2027 ${tier.name} (${tier.price}) Sponsorship Inquiry`)}`}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                    tier.featured
                      ? 'bg-[#5A1E65] hover:bg-purple-900 text-white shadow-sm'
                      : 'bg-purple-50 hover:bg-[#5A1E65] text-[#5A1E65] hover:text-white border border-purple-200'
                  }`}
                >
                  <span>Inquire for {tier.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Structured Tier Comparison Table */}
        <div id="tier-comparison" className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-950">
                2027 Tier Benefits Comparison
              </h3>
              <p className="text-xs text-slate-600">
                Side-by-side overview of monetary sponsorship tiers. Looking for goods or pro-bono services? See our{' '}
                <span className="font-bold text-amber-800">In-Kind Partnership</span> tier above.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-purple-200/90 bg-white/95 shadow-md overflow-hidden">
            {/* PDF-style header bar */}
            <div className="bg-gradient-to-r from-[#5A1E65] via-purple-800 to-indigo-900 text-white px-5 py-3.5 border-b-4 border-amber-400 flex items-center justify-between gap-4">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                DCVC 2027 Corporate Sponsorship Matrix
              </span>
              <span className="text-[11px] text-amber-200 font-semibold hidden sm:inline">
                Scroll horizontally on mobile if needed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-extrabold text-slate-900">
                    <th scope="col" className="py-4 px-4 sm:px-5 w-52 bg-slate-50/90 border-b-2 border-slate-300">
                      Benefit &amp; Alignment
                    </th>
                    <th scope="col" className="py-4 px-4 bg-purple-100/80 text-[#5A1E65] border-b-2 border-[#5A1E65]">
                      Premier Corporate
                      <span className="block text-[11px] font-bold text-amber-700 mt-0.5">$25,000+</span>
                    </th>
                    <th scope="col" className="py-4 px-4 bg-indigo-50/90 text-indigo-950 border-b-2 border-indigo-400">
                      Major Community
                      <span className="block text-[11px] font-bold text-indigo-700 mt-0.5">$10,000 – $24,999</span>
                    </th>
                    <th scope="col" className="py-4 px-4 bg-rose-50/90 text-rose-950 border-b-2 border-rose-400">
                      Specialty &amp; Event
                      <span className="block text-[11px] font-bold text-rose-700 mt-0.5">$5,000 – $9,999</span>
                    </th>
                    <th scope="col" className="py-4 px-4 bg-emerald-50/90 text-emerald-950 border-b-2 border-emerald-400">
                      Community Ally
                      <span className="block text-[11px] font-bold text-emerald-700 mt-0.5">$1,500 – $4,999</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {COMPARISON_ROWS.map((row, idx) => {
                    const colBg = [
                      idx % 2 === 0 ? 'bg-purple-50/45' : 'bg-purple-50/75',
                      idx % 2 === 0 ? 'bg-indigo-50/20' : 'bg-indigo-50/40',
                      idx % 2 === 0 ? 'bg-rose-50/20' : 'bg-rose-50/40',
                      idx % 2 === 0 ? 'bg-emerald-50/20' : 'bg-emerald-50/40'
                    ];
                    const checkColors = ['text-[#5A1E65]', 'text-indigo-600', 'text-rose-600', 'text-emerald-600'];

                    return (
                      <tr
                        key={row.feature}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                      >
                        <th scope="row" className="py-3.5 px-4 sm:px-5 font-bold text-slate-900 align-top">
                          {row.feature}
                        </th>
                        {row.values.map((val, colIdx) => (
                          <td
                            key={`${row.feature}-${colIdx}`}
                            className={`py-3.5 px-4 text-slate-800 align-top ${colBg[colIdx] || ''}`}
                          >
                            {val === false ? (
                              <span className="inline-flex items-center text-slate-300" aria-label="Not included">
                                <Minus className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="inline-flex items-start gap-1.5">
                                <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${checkColors[colIdx] || 'text-emerald-600'}`} />
                                <span className={colIdx === 0 ? 'font-semibold text-slate-950' : ''}>{val}</span>
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 2027 Community Impact & Partnership Pathways */}
      <section id="impact-2027" className="container-clean py-14 space-y-8 border-b border-purple-100/80">
        <div className="max-w-3xl">
          <span className="text-xs font-bold text-[#5A1E65] uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            REGIONAL IMPACT &amp; ACTIVATIONS
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 mt-1">
            Measurable Community Impact Across Ventura County
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            Your 2027 sponsorship directly funds free confidential HIV/STI screenings, Rainbow Umbrella youth drop-in sanctuaries, transgender support circles, and countywide Pride programming.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {IMPACT_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="p-5 rounded-2xl bg-white/95 border border-slate-200/90 shadow-xs flex flex-col gap-2.5"
              >
                <span className={`w-9 h-9 rounded-xl border flex items-center justify-center ${metric.accent}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="font-display text-2xl sm:text-3xl font-black text-slate-950">
                  {metric.value}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#5A1E65]">
                  {metric.label}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {metric.detail}
                </p>
              </div>
            );
          })}
        </div>

        {/* Custom Partnership Activations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Employee DEI & Volunteering',
              desc: 'Engage your workforce with tailored DEI workshops, corporate volunteer days, and Pride mobilization.',
              icon: HeartHandshake
            },
            {
              title: 'Signature Program Underwriting',
              desc: 'Align directly with Rainbow Umbrella youth mentorship, Diversity SHINES clinical care, or Pride Prom.',
              icon: Award
            },
            {
              title: 'Multi-Year Strategic Alliances',
              desc: 'Co-create custom multi-year agreements aligned with your CSR goals, foundation guidelines, and regional footprint.',
              icon: Gift
            }
          ].map((pathway) => {
            const Icon = pathway.icon;
            return (
              <div
                key={pathway.title}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-white to-amber-50/40 border border-purple-100 flex items-start gap-3.5"
              >
                <span className="p-2 rounded-xl bg-white border border-purple-200 text-[#5A1E65] shrink-0 shadow-2xs">
                  <Icon className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-extrabold text-slate-950">
                    {pathway.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {pathway.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Document Library Section */}
      <section id="document-library" className="container-clean py-14 space-y-8">
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
                        href={resolveDocUrl(doc.fileUrl)}
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
                        href={resolveDocUrl(doc.fileUrl)}
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
                    <p className="text-purple-100">{pageContent.contactAddress || '2471 Portola Road, Suite 100, Ventura, CA 93003'}</p>
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
