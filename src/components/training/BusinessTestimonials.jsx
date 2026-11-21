import React from 'react';
import { Quote, Star, CheckCircle2, Building, Store } from 'lucide-react';
import DcvcApprovedBadge from '../DcvcApprovedBadge';

const TESTIMONIALS = [
  {
    name: 'Beacon Coffee Roasters',
    location: 'Ventura, CA',
    owner: 'Elena & Marcus R.',
    role: 'Co-Founders',
    category: 'Coffee & Cafe',
    quote: 'Becoming DCVC Approved was the best decision for our cafe culture. The 2.5-hour workshop gave our baristas genuine confidence navigating pronoun etiquette and defusing awkward interactions gracefully. Our window decal is something our patrons mention every single week.',
    rating: 5,
    badgeText: 'DCVC Approved Partner'
  },
  {
    name: 'Coastal Pediatric & Family Care',
    location: 'Oxnard, CA',
    owner: 'Dr. Sarah Lin, MD',
    role: 'Lead Pediatrician',
    category: 'Healthcare & Clinical Clinic',
    quote: 'The status-neutral clinical training transformed how our intake desk welcomes LGBTQ+ and gender-diverse youth. Our electronic health records and intake forms now honor chosen names seamlessly, creating immediate trust with families.',
    rating: 5,
    badgeText: 'Clinical Affirming Partner'
  },
  {
    name: 'Channel Islands Creative & Tech Hub',
    location: 'Camarillo, CA',
    owner: 'David Vance',
    role: 'VP of People Operations',
    category: 'Corporate & Tech',
    quote: 'Far beyond a boring compliance checkbox, DCVC delivered an interactive California SB 396 training that engaged our entire team. We audited our benefits package and created an employee ally council that has directly boosted our talent retention.',
    rating: 5,
    badgeText: 'Corporate Equality Partner'
  }
];

export default function BusinessTestimonials({ content }) {
  return (
    <div className="w-full space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="glass-pill text-xs font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 border-purple-200">
          {content?.testimonialsEyebrow || 'PROVEN COMMUNITY TRUST'}
        </span>
        <h3 className="font-display text-2xl sm:text-4xl font-black text-slate-950">
          {content?.testimonialsTitle || 'Trusted by Ventura County Commerce'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {content?.testimonialsSubtitle || 'See how local cafes, clinics, salons, and offices have elevated their patron experience with DCVC Affirming Business Accreditation.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="p-6 sm:p-7 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-md flex flex-col justify-between gap-6 transition-all relative group"
          >
            <div className="space-y-4">
              {/* Star Rating & Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {t.badgeText}
                </span>
              </div>

              {/* Quote text */}
              <div className="relative">
                <Quote className="w-8 h-8 text-purple-200 absolute -top-3 -left-2 -z-0 opacity-40" />
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium relative z-10 italic">
                  "{t.quote}"
                </p>
              </div>
            </div>

            {/* Author Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <strong className="text-xs font-black text-slate-950 block">
                  {t.name}
                </strong>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {t.owner} · {t.role}
                </span>
                <span className="text-[10px] text-[#5A1E65] font-bold block">
                  📍 {t.location}
                </span>
              </div>

              <div className="shrink-0">
                <DcvcApprovedBadge />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
