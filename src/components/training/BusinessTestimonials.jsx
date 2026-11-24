import React from 'react';
import { Quote, Star, CheckCircle2, Building, Store } from 'lucide-react';
import DcvcApprovedBadge from '../DcvcApprovedBadge';

const TESTIMONIALS = [];

export default function BusinessTestimonials({ content }) {
  const testimonials = content?.testimonials || TESTIMONIALS;

  return (
    <div className="w-full space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="glass-pill text-xs font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 border-purple-200">
          {content?.testimonialsEyebrow || 'COMMUNITY REVIEWS & TRUST'}
        </span>
        <h3 className="font-display text-2xl sm:text-4xl font-black text-slate-950">
          {content?.testimonialsTitle || 'Trusted by Ventura County Commerce'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {content?.testimonialsSubtitle || 'See how local cafes, clinics, salons, and offices have elevated their patron experience with DCVC Affirming Business Accreditation.'}
        </p>
      </div>

      {testimonials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-md flex flex-col justify-between gap-6 transition-all relative group"
            >
              <div className="space-y-4">
                {/* Star Rating & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  {t.badgeText && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {t.badgeText}
                    </span>
                  )}
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
      ) : (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-purple-50/70 border border-purple-200/80 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center mx-auto text-[#5A1E65]">
            <Store className="w-6 h-6" />
          </div>
          <h4 className="font-display text-lg font-bold text-slate-900">
            Authentic Community Reviews Coming Soon
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Accredited business reviews and partner testimonials will appear here as local organizations complete their P.R.I.D.E. training. Interested in becoming accredited? Contact our team.
          </p>
          <div className="pt-2">
            <a
              href="mailto:training@diversitycollective.org?subject=DCVC%20Business%20Accreditation%20Inquiry"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5A1E65] text-white font-bold text-xs hover:bg-[#471850] transition-colors"
            >
              Contact Our Training Team →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
