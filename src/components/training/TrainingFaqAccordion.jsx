import React, { useState } from 'react';
import { ChevronDown, HelpCircle, CheckCircle2 } from 'lucide-react';

const FAQS = [
  {
    q: "How does training help our business become a 'DCVC Approved' partner?",
    a: "Diversity Collective requires businesses to complete an affirming cultural competency workshop before earning the official DCVC Approved badge. This ensures that the rainbow glow and 3D verified badge in our Business Directory represent authentic, trained welcoming standards — not just self-declarations. Upon completing the workshop and affirming our space charter, you unlock storefront window clings, framed certificates, and directory verification."
  },
  {
    q: "Can the training be hosted on-site at our storefront or is it virtual?",
    a: "We offer both! DCVC educators routinely travel on-site to local cafes, restaurants, health clinics, and corporate offices across Ventura, Oxnard, Camarillo, Simi Valley, Thousand Oaks, and Ojai. We also host engaging, interactive virtual workshops via Zoom for remote or hybrid teams."
  },
  {
    q: "Do all staff members need to attend, or can managers train-the-trainer?",
    a: "For small businesses (under 15 staff), we strongly recommend having all frontline and management staff attend together for maximum team cohesion. For mid-size and enterprise organizations (50+ staff), we provide a certified 'Train-the-Trainer' and shift-lead curriculum so your supervisors can onboard new hires consistently."
  },
  {
    q: "What are the fees for local small businesses versus corporate teams?",
    a: "DCVC is a local 501(c)(3) nonprofit dedicated to community wellbeing. We offer generous sliding-scale pricing for independent Ventura County small businesses, co-ops, and grassroots nonprofits. For mid-size and enterprise corporate teams, training fees support DCVC's free youth circles and HIV/STI community wellness clinics."
  },
  {
    q: "What California legal mandates do your workshops cover?",
    a: "Our corporate and business tracks cover California SB 396 (transgender, gender identity, and gender expression rights in employment), the California Fair Employment and Housing Act (FEHA), and California Health and Safety Code § 118600 (all-gender single-user restroom signage)."
  },
  {
    q: "How long does our DCVC Approved status stay active?",
    a: "Accreditation is valid for 1 full calendar year. Each year, certified partners receive a free 45-minute annual refresher and an updated annual window cling to keep their storefront and directory status active."
  }
];

export default function TrainingFaqAccordion({ content, faqs }) {
  const [openIdx, setOpenIdx] = useState(0);

  const activeFaqs = (Array.isArray(faqs) && faqs.length > 0)
    ? faqs
    : (Array.isArray(content?.faqs) && content.faqs.length > 0)
      ? content.faqs
      : FAQS;

  const toggleIdx = (idx) => {
    setOpenIdx(prev => (prev === idx ? -1 : idx));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-6">
        <span className="glass-pill text-xs font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 border-purple-200">
          {content?.faqEyebrow || 'COMMON QUESTIONS'}
        </span>
        <h3 className="font-display text-2xl sm:text-4xl font-black text-slate-950">
          {content?.faqTitle || 'Frequently Asked Questions'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {content?.faqSubtitle || 'Everything you need to know about certifying your business and booking a DCVC workshop.'}
        </p>
      </div>

      <div className="space-y-3">
        {activeFaqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden transition-all shadow-xs"
            >
              <button
                type="button"
                onClick={() => toggleIdx(idx)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-display font-black text-sm sm:text-base text-slate-950 pr-2">
                  {faq.q}
                </span>
                <div className={`p-1.5 rounded-full bg-slate-100 text-slate-600 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-purple-100 text-[#5A1E65]' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium border-t border-slate-100 pt-3 animate-fadeIn">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
