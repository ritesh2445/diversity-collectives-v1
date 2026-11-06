import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ShieldCheck, 
  Lock, 
  ArrowUpRight, 
  Sparkles,
  Gift,
  Award,
  ArrowRight,
  Eye,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { orgInfo } from '../data/dcvcData';
import { APPRECIATION_TIERS, TIER_CONFIGS, getTierForAmount } from '../data/appreciationTiers';
import { usePageMeta } from '../utils/seo';

export default function Donate() {
  usePageMeta({
    title: 'Donate & Sustainer Giving | Diversity Collective Ventura County',
    description: 'Support Diversity Collective Ventura County. Tax-deductible contributions fund free HIV/STI screenings, youth peer sanctuaries, and LGBTQ+ community mutual aid. Every gift unlocks a personalized Appreciation Card.',
    canonicalPath: '/donate'
  });

  const [frequency, setFrequency] = useState('monthly'); // 'monthly' | 'once'
  const [selectedTier, setSelectedTier] = useState(50);
  const [customAmount, setCustomAmount] = useState('');

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const tiers = [
    { amount: 25, title: "Wellness & Harm Reduction", impact: "Provides 5 comprehensive safer-sex and hygiene wellness packages." },
    { amount: 50, title: "Confidential Health Screening", impact: "Funds 2 free rapid HIV/STI screenings and status-neutral care navigation." },
    { amount: 100, title: "Youth Circle Sustainer", impact: "Sponsors refreshments and art supplies for a full month of Rainbow Umbrella youth gatherings." },
    { amount: 250, title: "Resource Center Sanctuary", impact: "Subsidizes community computer workstations, lending library, and daily drop-in hours." },
    { amount: 500, title: "Community Champion", impact: "Sponsors attendance and travel for low-income youth at the annual Youth Pride Prom." }
  ];

  const effectiveAmount = customAmount ? Number(customAmount) : selectedTier;
  const currentAppreciationTier = getTierForAmount(effectiveAmount);

  const handleConfetti = () => {
    if (!prefersReducedMotion) {
      try {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5A1E65', '#F59E0B', '#10B981', '#38BDF8']
        });
      } catch {
        // Fallback
      }
    }
  };

  // Official Zeffy Giving URL (from environment or default campaign)
  const baseZeffyUrl = import.meta.env?.VITE_ZEFFY_DONATION_FORM_URL || 'https://www.zeffy.com/donation-form/diversity-collective-general-fund';
  const zeffyUrl = `${baseZeffyUrl}${baseZeffyUrl.includes('?') ? '&' : '?'}frequency=${frequency}&amount=${effectiveAmount}`;

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-rose-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-rose-700 bg-rose-50 border-rose-200/90 shadow-xs">
            TAX-DEDUCTIBLE 501(C)(3) SUPPORT
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Powering Sanctuary & <br />
            <span className="font-serif italic font-normal text-rose-600">Lifesaving Care.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Every dollar directly funds free rapid health screenings, weekly youth peer circles, harm reduction supplies, and community advocacy across Ventura County.
          </p>
        </div>
      </section>

      {/* Main Donation Gateway Interface */}
      <section className="container-clean py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Interactive Giving Builder */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-12 rounded-3xl border-2 border-purple-200 shadow-2xl space-y-8">
            
            {/* Frequency Selector */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                01. CHOOSE FREQUENCY
              </span>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFrequency('monthly')}
                  className={`py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    frequency === 'monthly'
                      ? 'bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Monthly Sustainer (Most Impact)
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency('once')}
                  className={`py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    frequency === 'once'
                      ? 'bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  One-Time Gift
                </button>
              </div>
            </div>

            {/* Donation Tiers */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                02. SELECT GIFT AMOUNT
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tiers.map((tier) => {
                  const isSelected = selectedTier === tier.amount && !customAmount;
                  return (
                    <button
                      key={tier.amount}
                      type="button"
                      onClick={() => {
                        setSelectedTier(tier.amount);
                        setCustomAmount('');
                        handleConfetti();
                      }}
                      className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-[#5A1E65] bg-purple-50/70 ring-2 ring-purple-300'
                          : 'border-slate-200 hover:border-purple-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-2xl font-black text-slate-950">
                          ${tier.amount}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#5A1E65] text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {tier.title}
                      </span>
                      <span className="text-[11px] text-slate-500 line-clamp-2">
                        {tier.impact}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Or enter custom gift ($):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter any amount (e.g. 75, 150, 1000)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Appreciation Card Unlock Spotlight */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-fuchsia-50/50 to-amber-50/50 border border-purple-200 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-900 text-amber-300 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-950">
                    Unlocks: {currentAppreciationTier.title} ({currentAppreciationTier.circleName})
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every donor receives a personalized digital DCVC Appreciation Card delivered to their inbox. Your gift of ${effectiveAmount} unlocks the <strong>{currentAppreciationTier.title}</strong> tier keepsake.
                </p>
                <Link
                  to="/appreciation-card/preview"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 hover:text-purple-950 underline pt-0.5"
                >
                  <span>Preview all 4 Appreciation Card Tiers</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Zero Fee & Security Guarantee */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <span className="font-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Free Processing via Zeffy</span>
              </span>
              <p className="text-[11px] text-emerald-800">
                Diversity Collective uses Zeffy, the only zero-fee fundraising platform for nonprofits. 100% of your gift reaches our programs without merchant credit card deduction.
              </p>
            </div>

            {/* Master Donation Call to Action */}
            <div className="space-y-3 pt-2">
              <a
                href={zeffyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleConfetti}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-rose-600 via-[#5A1E65] to-purple-800 !text-white font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-102 transition-all cursor-pointer text-center"
              >
                <Heart className="w-5 h-5 fill-current text-rose-300 animate-bounce" />
                <span className="!text-white font-black">Give ${effectiveAmount} {frequency === 'monthly' ? 'Monthly' : 'Now'} Securely via Zeffy</span>
                <ArrowUpRight className="w-5 h-5 !text-white stroke-white" />
              </a>

              <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Bank-grade 256-bit encryption · Immediate IRS tax receipt provided</span>
              </p>
            </div>

          </div>

          {/* Right Column: Tax Status & Alternative Ways to Give */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Tax Exemption & Governance Box */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                501(C)(3) PUBLIC CHARITY DISCLOSURES
              </span>
              <h3 className="font-display text-2xl font-black text-white">
                Financial Integrity & Transparency
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Diversity Collective Ventura County, Inc. is recognized by the IRS as a 501(c)(3) public benefit nonprofit corporation. All donations are tax-deductible to the fullest extent permitted by California and federal law.
              </p>

              <div className="pt-2 border-t border-slate-800 text-xs space-y-1.5 text-slate-300">
                <p><strong>Federal EIN:</strong> <span className="font-mono text-amber-300">{orgInfo.ein}</span></p>
                <p><strong>California Corp ID:</strong> <span className="font-mono text-amber-300">{orgInfo.caCorpNumber}</span></p>
                <p><strong>Physical Address:</strong> {orgInfo.address.full}</p>
              </div>
            </div>

            {/* Appreciation Cards Feature Card */}
            <div className="p-8 rounded-3xl bg-purple-50 border-2 border-purple-200 space-y-4">
              <div className="flex items-center gap-2 text-purple-900">
                <Award className="w-5 h-5 text-purple-700" />
                <h3 className="font-display text-lg font-black">
                  DCVC Appreciation Circles
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                As a token of our community's appreciation, all donors unlock an animated keepsake card featuring artwork, impact quotes, and leadership signatures:
              </p>
              <div className="space-y-2 text-xs">
                {Object.values(TIER_CONFIGS).map(t => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-white border border-purple-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{t.title}</span>
                      <span className="text-[11px] text-slate-500">{t.circleName}</span>
                    </div>
                    <span className="font-bold text-purple-800">${t.minAmount}+</span>
                  </div>
                ))}
              </div>
              <Link
                to="/appreciation-card/preview"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-900 !text-white text-xs font-bold hover:bg-purple-800 transition-colors shadow-sm"
              >
                <Eye className="w-4 h-4 !text-white stroke-white" />
                <span className="!text-white font-bold">Explore Interactive Card Preview</span>
              </Link>
            </div>

            {/* Alternative Giving Pathways */}
            <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-4">
              <h3 className="font-display text-lg font-black text-slate-950">
                Other Ways to Support
              </h3>
              <div className="space-y-3 text-xs text-slate-600 font-medium">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">By Mail / Physical Check:</span>
                  <p>Make checks payable to: <strong>Diversity Collective Ventura County, Inc.</strong></p>
                  <p>Mail to: 2471 Portola Road, Suite 100, Ventura, CA 93003</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Corporate Match & DAF Gifts:</span>
                  <p>Many Ventura County employers double community gifts. Ask your HR portal or reach out to <a href={`mailto:${orgInfo.email}`} className="text-[#5A1E65] font-bold underline">{orgInfo.email}</a> for direct DAF bank transfer instructions.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
