import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Heart, Award, ShieldCheck, Mail } from 'lucide-react';
import { sponsorsList, orgInfo } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';

export default function Sponsors() {
  usePageMeta({
    title: 'Sponsors & Community Partners',
    description: 'Honoring the public health partners, foundations, and community sponsors funding LGBTQ+ wellness across Ventura County.',
    canonicalPath: '/sponsors'
  });

  const sponsorshipTiers = [
    {
      tier: "Foundational Community Health Partners",
      desc: "Providing sustained, multi-year operating support and clinical integration for Diversity SHINES and Community Resource Center wellness.",
      sponsors: [sponsorsList[0], sponsorsList[1]]
    },
    {
      tier: "Technology & Digital Accessibility Champions",
      desc: "Empowering our digital platforms, communications reach, and universal accessibility compliance.",
      sponsors: [sponsorsList[2]]
    }
  ];

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
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
        {sponsorshipTiers.map((tierGroup, idx) => (
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tierGroup.sponsors.filter(Boolean).map((sponsor) => (
                <a
                  key={sponsor.shortName}
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-[#5A1E65] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between gap-6 group cursor-pointer"
                >
                  <div className="h-28 flex items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <img 
                      src={sponsor.logo} 
                      alt={sponsor.name}
                      className="max-h-full max-w-[80%] object-contain group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span class="text-sm font-bold text-slate-800">${sponsor.name}</span>`;
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      OFFICIAL PARTNER
                    </span>
                    <h3 className="font-display text-lg font-black text-slate-900 group-hover:text-[#5A1E65] transition-colors flex items-center gap-1.5">
                      <span>{sponsor.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#5A1E65]" />
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {sponsor.role}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#5A1E65] font-bold">
                    <span>Visit Partner Website</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Become a Corporate or Civic Sponsor */}
      <section className="container-clean py-14">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-md flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300 inline-block">
              CORPORATE & CIVIC SPONSORSHIP OPPORTUNITIES
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
              Partner with Diversity Collective in 2026
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
              href={`mailto:${orgInfo.email}?subject=Corporate%20Sponsorship%20Inquiry%202026`}
              className="btn-primary py-3.5 px-6 text-xs font-bold w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 shadow-md"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Sponsorship Team</span>
            </a>
            <Link
              to="/donate"
              className="btn-secondary py-3.5 px-6 text-xs font-bold w-full sm:w-auto text-center bg-white"
            >
              <span>Individual Giving</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

