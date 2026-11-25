import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpRight, 
  ArrowRight, 
  Heart, 
  Award, 
  ShieldCheck, 
  Mail,
  CheckCircle2,
  Gift,
  Calendar,
  Sparkles,
  Building2,
  Package,
  Laptop,
  Phone,
  HelpCircle,
  Check
} from 'lucide-react';
import MobileCarousel from '../components/MobileCarousel';
import { sponsorsList, orgInfo } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import { usePageMeta } from '../utils/seo';

export default function Sponsors() {
  usePageMeta({
    title: 'Sponsors & Community Partners',
    description: 'Honoring the public health partners, foundations, and community sponsors funding LGBTQ+ wellness across Ventura County.',
    canonicalPath: '/sponsors'
  });

  const [sponsors, setSponsors] = useState(() => cmsStore.getSponsors?.() || sponsorsList);

  useEffect(() => {
    return cmsStore.subscribe(() => {
      setSponsors(cmsStore.getSponsors?.() || sponsorsList);
    });
  }, []);

  const sponsorshipTiers = [
    {
      tier: "Foundational Community Health Partners",
      desc: "Providing sustained, multi-year operating support and clinical integration for Diversity SHINES and Community Resource Center wellness.",
      sponsors: sponsors.slice(0, 2)
    },
    {
      tier: "Technology & Digital Accessibility Champions",
      desc: "Empowering our digital platforms, communications reach, and universal accessibility compliance.",
      sponsors: sponsors.slice(2)
    }
  ];

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            COMMUNITY SUSTAINABILITY & ALLIANCES
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Sponsors, Partners <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">& Civic Allies.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            "We do what we do, because of you." Our partners fund the vital programs, clinical testing, and youth sanctuaries that save lives across Ventura County.
          </p>
        </div>
      </section>

      {/* Main Sponsors by Tier */}
      <section className="container-clean py-16 space-y-16">
        {sponsorshipTiers.filter(t => t.sponsors.filter(Boolean).length > 0).map((tierGroup, idx) => (
          <div key={idx} className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-block mb-2">
                TIER 0{idx + 1} ALLIANCES
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
                {tierGroup.tier}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                {tierGroup.desc}
              </p>
            </div>

            <MobileCarousel cols={3} autoScrollMs={0} className="w-full items-stretch" cardClassName="h-full flex flex-col">
              {tierGroup.sponsors.filter(Boolean).map((sponsor) => (
                <a
                  key={sponsor.shortName}
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sponsor-card h-full p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-[#5A1E65] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between gap-6 group cursor-pointer overflow-hidden min-w-0 box-border"
                >
                  <div className="h-28 flex items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 shrink-0 w-full overflow-hidden">
                    <img 
                      src={sponsor.logo} 
                      alt={sponsor.name}
                      className="max-h-full max-w-[80%] object-contain group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent && !parent.querySelector('.sponsor-fallback-name')) {
                          const span = document.createElement('span');
                          span.className = 'sponsor-fallback-name text-sm font-bold text-slate-800';
                          span.textContent = sponsor.name || '';
                          parent.appendChild(span);
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2 min-w-0 w-full">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      OFFICIAL PARTNER
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-black text-slate-900 group-hover:text-[#5A1E65] transition-colors leading-snug break-words [overflow-wrap:anywhere]">
                      <span>{sponsor.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#5A1E65] shrink-0 inline-block ml-1 align-baseline" />
                    </h3>
                    <p className="text-xs text-slate-600 font-medium break-words [overflow-wrap:anywhere] leading-relaxed">
                      {sponsor.role}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#5A1E65] font-bold">
                    <span>Visit Partner Website</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </MobileCarousel>
          </div>
        ))}
      </section>

      {/* Corporate Partnerships & Strategic Community Investment (Cover Letter Message) */}
      <section className="container-clean py-14 border-t border-slate-100">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs inline-block">
            CORPORATE PARTNERSHIP OPPORTUNITIES &amp; IMPACT
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
            Invest in Equality, Health &amp; <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Ventura County Communities.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl mx-auto font-medium">
            At Diversity Collective Ventura County, we believe community leadership begins with authentic collaboration. As the sole 501(c)(3) organization operating a physical Community Resource Center and countywide LGBTQ+ health and youth safety programs across all 10 Ventura County cities, our corporate partners provide the foundational investments that turn advocacy into measurable, lifesaving action.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-800 pt-2">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> 501(c)(3) Tax Deductible</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-500" /> 100% Local Ventura County Impact</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-purple-700" /> Transparent Civic Recognition</span>
          </div>
        </div>
      </section>

      {/* Corporate Sponsorship Packages & Investment Levels */}
      <section className="container-clean py-12">
        <div className="space-y-4 mb-10 text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-block">
            INVESTMENT PACKAGES &amp; PROMOTIONAL BENEFITS
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
            Sponsorship Investment Tiers
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Tiered promotional packages provide high visibility across digital platforms, prominent event billing, and premier VIP engagement at signature DCVC events.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Presenting Sponsor */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-purple-300 hover:border-[#5A1E65] shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                PREMIER LEVEL
              </span>
            </div>
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A1E65] block">
                Official Title Sponsor
              </span>
              <h4 className="font-display text-2xl font-black text-slate-950">
                Presenting Sponsor
              </h4>
              <div className="font-display text-3xl font-black text-[#5A1E65]">
                $15,000
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Maximum visibility and leadership presence as the official presenting sponsor across marketing, stages, and community outreach.
              </p>
              <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>12 VIP Passes</strong> to Ventura County Pride &amp; Diversity Gala</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Presenting podium remarks &amp; executive stage acknowledgment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Premier logo placement on website, print banners &amp; yard signage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>10 dedicated social spotlights &amp; priority press mention</span>
                </li>
              </ul>
            </div>
            <a
              href={`mailto:${orgInfo.email}?subject=Presenting%20Sponsorship%20Inquiry%20($15,000)`}
              className="btn-primary py-3 px-4 text-xs font-bold text-center block shadow-sm"
            >
              Inquire for Presenting
            </a>
          </div>

          {/* Platinum Sponsor */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-[#5A1E65] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Signature Partner
              </span>
              <h4 className="font-display text-2xl font-black text-slate-950">
                Platinum Sponsor
              </h4>
              <div className="font-display text-3xl font-black text-slate-900">
                $10,000
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Substantial brand prominence across event marketing, key festival zones, and prominent stage presence.
              </p>
              <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>10 VIP Passes</strong> to signature DCVC celebrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Prominent logo on main stage banners &amp; marketing collateral</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Featured website partner profile with direct website link</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>8 dedicated social media spotlights &amp; newsletter feature</span>
                </li>
              </ul>
            </div>
            <a
              href={`mailto:${orgInfo.email}?subject=Platinum%20Sponsorship%20Inquiry%20($10,000)`}
              className="btn-secondary py-3 px-4 text-xs font-bold text-center block"
            >
              Inquire for Platinum
            </a>
          </div>

          {/* Gold Sponsor */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-[#5A1E65] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
                Community Champion
              </span>
              <h4 className="font-display text-2xl font-black text-slate-950">
                Gold Sponsor
              </h4>
              <div className="font-display text-3xl font-black text-slate-900">
                $5,000
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Directly funds youth peer circles and free confidential clinical testing clinics across the county.
              </p>
              <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>5 VIP Passes</strong> to Ventura County Pride</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Logo placement on event promotional materials &amp; web directory</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Verbal recognition during festival and gala programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>6 dedicated social media highlight posts</span>
                </li>
              </ul>
            </div>
            <a
              href={`mailto:${orgInfo.email}?subject=Gold%20Sponsorship%20Inquiry%20($5,000)`}
              className="btn-secondary py-3 px-4 text-xs font-bold text-center block"
            >
              Inquire for Gold
            </a>
          </div>

          {/* Silver Sponsor */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-[#5A1E65] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Civic Ally
              </span>
              <h4 className="font-display text-2xl font-black text-slate-950">
                Silver Sponsor
              </h4>
              <div className="font-display text-3xl font-black text-slate-900">
                $2,500
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Empowers local outreach, harm reduction supplies, and community education workshops.
              </p>
              <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>4 Tickets / Passes</strong> to event celebrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Logo inclusion on digital marketing &amp; website</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Program listing &amp; venue yard signage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>4 social media promotion announcements</span>
                </li>
              </ul>
            </div>
            <a
              href={`mailto:${orgInfo.email}?subject=Silver%20Sponsorship%20Inquiry%20($2,500)`}
              className="btn-secondary py-3 px-4 text-xs font-bold text-center block"
            >
              Inquire for Silver
            </a>
          </div>

          {/* Bronze Sponsor */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-[#5A1E65] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Local Business Partner
              </span>
              <h4 className="font-display text-2xl font-black text-slate-950">
                Bronze Sponsor
              </h4>
              <div className="font-display text-3xl font-black text-slate-900">
                $1,000
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                An accessible entry point for local merchants, small businesses, and community practices.
              </p>
              <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>2 Admission Tickets</strong> to signature event</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Business name listing on official sponsor page</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Event guide and program booklet acknowledgment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>2 dedicated social media acknowledgments</span>
                </li>
              </ul>
            </div>
            <a
              href={`mailto:${orgInfo.email}?subject=Bronze%20Sponsorship%20Inquiry%20($1,000)`}
              className="btn-secondary py-3 px-4 text-xs font-bold text-center block"
            >
              Inquire for Bronze
            </a>
          </div>

          {/* Corporate GEM Packages */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 border-2 border-purple-300 hover:border-[#5A1E65] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-purple-900 bg-purple-200/60 px-2.5 py-0.5 rounded-full inline-block">
                CORPORATE GEM ALLIANCES
              </span>
              <h4 className="font-display text-2xl font-black text-slate-950">
                Corporate GEM Packages
              </h4>
              <div className="font-display text-2xl font-black text-[#5A1E65]">
                Annualized / Workplace
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Year-round corporate partnership packages with employee payroll matching, customized DEI workshop credits, and permanent center recognition.
              </p>
              <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-purple-200/50">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                  <span>Continuous year-round visibility on DCVC digital hubs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                  <span>Tailored workplace cultural competency training modules</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                  <span>Cross-event recognition (Pride, Gala, Prom, AIDS Walk)</span>
                </li>
              </ul>
            </div>
            <a
              href={`mailto:${orgInfo.email}?subject=Corporate%20GEM%20Package%20Inquiry`}
              className="btn-primary py-3 px-4 text-xs font-bold text-center block"
            >
              Inquire for Corporate GEM
            </a>
          </div>
        </div>

        {/* Strategic Clarification & Confirmation Notice */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-3">
          <HelpCircle className="w-4 h-4 text-[#5A1E65] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block">
              Multi-Year &amp; Strategic Proposal Customization:
            </span>
            <p className="leading-relaxed">
              Tier pricing and asset deliverables may vary across specific signature event packets and strategic partnership proposals. Final deliverables, custom activations, and booth allocations are customized and confirmed directly in consultation with the DCVC Development Team.
            </p>
          </div>
        </div>
      </section>

      {/* Major Signature Events Supported */}
      <section className="container-clean py-12 border-t border-slate-100">
        <div className="space-y-3 mb-8 text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-block">
            SIGNATURE DCVC ACTIVATIONS
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
            Major Events Powered by Our Sponsors
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Corporate investments directly bring these flagship community traditions to life across Ventura County.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider block">FALL FESTIVAL</span>
            <h4 className="font-display text-base font-black text-slate-900">Ventura County Pride</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              The premier cultural celebration on the coast, featuring live performers, public health pavilion, and over 100 community vendors.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider block">SPRING BENEFIT</span>
            <h4 className="font-display text-base font-black text-slate-900">Annual Diversity Gala</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Our signature benefit gala honoring civic allies, community advocates, and corporate partners transforming local equity.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider block">YOUTH SANCTUARY</span>
            <h4 className="font-display text-base font-black text-slate-900">Youth Pride Prom</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              A safe, chaperoned, and affirming prom for LGBTQ+ and allied youth ages 13–23, hosted annually free of charge.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider block">COMMUNITY HEALTH</span>
            <h4 className="font-display text-base font-black text-slate-900">AIDS Walk Ventura</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Annual community remembrance walk funding Diversity SHINES confidential HIV/STI clinical screenings and PrEP navigation.
            </p>
          </div>
        </div>
      </section>

      {/* In-Kind Donations Section */}
      <section id="in-kind" className="container-clean py-14 border-t border-slate-100">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 border-2 border-emerald-200 shadow-md space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-block">
              MATERIAL &amp; SERVICE CONTRIBUTIONS
            </span>
            <h3 className="font-display text-2xl sm:text-4xl font-black text-slate-950">
              In-Kind Donations Welcome
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              Diversity Collective gladly accepts in-kind donations broadly. Material and professional contributions directly equip our physical Community Resource Center, youth peer sanctuaries, and clinical health testing programs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs flex items-start gap-3">
              <Laptop className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-slate-900">Laptops &amp; Computers</h5>
                <p className="text-[11px] text-slate-600 leading-snug">Monitors, laptops, and peripherals for our free public job and resource lab.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs flex items-start gap-3">
              <Building2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-slate-900">Furniture &amp; Desks</h5>
                <p className="text-[11px] text-slate-600 leading-snug">Office desks, ergonomic seating, couches, and meeting room furnishings.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs flex items-start gap-3">
              <Package className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-slate-900">Supplies &amp; Equipment</h5>
                <p className="text-[11px] text-slate-600 leading-snug">Art materials, youth snacks, safer-sex kits, and hygiene supplies.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs flex items-start gap-3">
              <Award className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-slate-900">Professional Services</h5>
                <p className="text-[11px] text-slate-600 leading-snug">Legal, accounting, marketing, translation, and graphic design assistance.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-slate-900">Audio / Visual &amp; Events</h5>
                <p className="text-[11px] text-slate-600 leading-snug">Sound equipment, microphones, projectors, and festival production support.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs flex items-start gap-3">
              <Gift className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-slate-900">Other Useful Goods</h5>
                <p className="text-[11px] text-slate-600 leading-snug">Books for our LGBTQ+ lending library and general center amenities.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/80 border border-emerald-200 text-slate-700 text-xs font-medium">
            <em>Note: The items listed above are representative examples—DCVC welcomes a broad range of useful business and community donations. If you have supplies, equipment, or specialized services you wish to contribute, please let us know.</em>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              to="/contact"
              className="btn-primary py-3.5 px-6 text-xs font-bold w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 shadow-md"
            >
              <Mail className="w-4 h-4" />
              <span>Submit In-Kind Donation Inquiry</span>
            </Link>
            <a
              href={`tel:${orgInfo.phoneRaw}`}
              className="btn-secondary py-3.5 px-6 text-xs font-bold w-full sm:w-auto text-center bg-white inline-flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#5A1E65]" />
              <span>Call Center: {orgInfo.phone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Become a Corporate or Civic Sponsor CTA */}
      <section className="container-clean py-14">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-md flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300 inline-block">
              GET IN TOUCH WITH DEVELOPMENT
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
              Partner with Diversity Collective
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              We offer bespoke sponsorship packages for Ventura County Pride, the annual Diversity Gala, Youth Pride Prom, and ongoing naming sponsorships for our Community Resource Center.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-900 pt-2">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> 501(c)(3) Tax Deductible</span>
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-500" /> 100% Local Impact</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <a
              href={`mailto:${orgInfo.email}?subject=Corporate%20Sponsorship%20Inquiry`}
              className="btn-primary py-3.5 px-6 text-xs font-bold w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 shadow-md"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Sponsorship Team</span>
            </a>
            <Link
              to="/donate"
              className="btn-secondary py-3.5 px-6 text-xs font-bold w-full sm:w-auto text-center bg-white"
            >
              <span>Individual Giving &amp; GEM</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

