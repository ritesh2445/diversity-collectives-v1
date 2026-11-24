import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Heart, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  Award, 
  ArrowRight, 
  Eye, 
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Printer,
  ChevronDown,
  Info,
  Gift,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLiveOrgInfo } from '../hooks/useCmsLive';
import { cmsStore } from '../services/cmsStore';
import { APPRECIATION_TIERS, TIER_CONFIGS, getTierForAmount } from '../data/appreciationTiers';
import { usePageMeta } from '../utils/seo';

const DESIGNATION_OPTIONS = [
  { id: 'general', title: 'Greatest Need & General Fund', desc: 'Directs funds where our community needs them most urgently.' },
  { id: 'shines', title: 'Diversity SHINES Healthcare Clinics', desc: 'Provides 100% free confidential rapid HIV/STI screenings & harm reduction.' },
  { id: 'rainbow_umbrella', title: 'Rainbow Umbrella Youth Sanctuary', desc: 'Underwrites peer circles, warm meals, and safe harbor for LGBTQ+ youth.' },
  { id: 'resource_center', title: 'Ventura Community Resource Center', desc: 'Maintains free public computers, library, support groups & community space.' }
];

const DEFAULT_TIERS = [
  { amount: 25, title: "Wellness & Harm Reduction", impact: "Provides 5 comprehensive safer-sex and hygiene wellness packages." },
  { amount: 50, title: "Confidential Health Screening", impact: "Funds 2 free rapid HIV/STI screenings and status-neutral care navigation." },
  { amount: 75, title: "Community Ally", impact: "Supports frontline customer dignity, safe space supplies, and peer check-ins." },
  { amount: 100, title: "Youth Circle Sustainer", impact: "Sponsors refreshments and art supplies for a full month of Rainbow Umbrella youth gatherings." },
  { amount: 250, title: "Resource Center Sanctuary", impact: "Subsidizes community computer workstations, lending library, and daily drop-in hours." },
  { amount: 500, title: "Community Champion", impact: "Sponsors attendance and travel for low-income youth at the annual Youth Pride Prom." }
];

export default function Donate() {
  const orgInfo = useLiveOrgInfo();
  const [liveDonationContent, setLiveDonationContent] = useState(() => cmsStore.getSettings?.()?.donationPageContent);

  useEffect(() => {
    return cmsStore.subscribe((data) => {
      if (data?.settings?.donationPageContent) {
        setLiveDonationContent(data.settings.donationPageContent);
      }
    });
  }, []);

  const fundsList = liveDonationContent?.funds?.length > 0 ? liveDonationContent.funds : DESIGNATION_OPTIONS;
  const tiers = liveDonationContent?.tiers?.length > 0 ? liveDonationContent.tiers : DEFAULT_TIERS;

  usePageMeta({
    title: 'Donate & GEM Membership | Diversity Collective Ventura County',
    description: 'Support Diversity Collective Ventura County. Tax-deductible contributions and recurring GEM Memberships fund free HIV/STI screenings, youth peer sanctuaries, and LGBTQ+ community mutual aid. Every gift unlocks a personalized Appreciation Card.',
    canonicalPath: '/donate'
  });

  const [searchParams] = useSearchParams();
  const initialAmountParam = searchParams.get('amount');
  const initialFreqParam = searchParams.get('frequency');

  const parsedFreq = initialFreqParam === 'once' || initialFreqParam === 'one-time'
    ? 'once'
    : 'monthly';

  const parsedAmountNum = initialAmountParam ? parseFloat(initialAmountParam) : null;
  const isStandardTier = parsedAmountNum && [25, 50, 75, 100, 250, 500, 1000].includes(parsedAmountNum);

  const [frequency, setFrequency] = useState(parsedFreq);
  const [selectedTier, setSelectedTier] = useState(isStandardTier ? parsedAmountNum : 50);
  const [customAmount, setCustomAmount] = useState(
    parsedAmountNum && !isStandardTier && parsedAmountNum > 0 ? String(parsedAmountNum) : ''
  );
  const [designation, setDesignation] = useState(() => fundsList[0]?.title || 'Greatest Need & General Fund');
  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : selectedTier || 50;
  const currentAppreciationTier = getTierForAmount(effectiveAmount);

  // Synchronize state if URL query params change
  useEffect(() => {
    const amt = searchParams.get('amount');
    const freq = searchParams.get('frequency');
    if (freq) {
      setFrequency(freq === 'once' || freq === 'one-time' ? 'once' : 'monthly');
    }
    if (amt) {
      const num = parseFloat(amt);
      if (!isNaN(num) && num > 0) {
        if ([25, 50, 75, 100, 250, 500, 1000].includes(num)) {
          setSelectedTier(num);
          setCustomAmount('');
        } else {
          setCustomAmount(String(num));
          setSelectedTier(num);
        }
      }
    }
  }, [searchParams]);
  
  // Donor details
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('CA');
  const [zipCode, setZipCode] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showDedication, setShowDedication] = useState(false);
  const [dedicationType, setDedicationType] = useState('honor'); // 'honor' | 'memory'
  const [honoreeName, setHonoreeName] = useState('');
  const [dedicationNote, setDedicationNote] = useState('');

  // Destination campaign URL (managed independently in Admin Donation Settings)
  const destinationUrl = useMemo(() => {
    let base = frequency === 'monthly'
      ? (orgInfo?.zeffyGemUrl || 'https://www.zeffy.com/donation-form/diversity-collective-gem-membership')
      : (orgInfo?.zeffyGeneralUrl || orgInfo?.zeffyDonationUrl || 'https://www.zeffy.com/donation-form/diversity-collective-general-fund');

    base = (base || '').trim();
    if (!base) {
      base = frequency === 'monthly'
        ? 'https://www.zeffy.com/donation-form/diversity-collective-gem-membership'
        : 'https://www.zeffy.com/donation-form/diversity-collective-general-fund';
    } else if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://www.zeffy.com/donation-form/${base}`;
    }
    // Clean regular Zeffy campaign redirect (zero iframe / embed)
    base = base.replace('/embed/donation-form/', '/donation-form/');

    const queryChar = base.includes('?') ? '&' : '?';
    const params = [];
    if (effectiveAmount > 0) {
      params.push(`amount=${encodeURIComponent(effectiveAmount)}`);
    }
    if (donorEmail && donorEmail.includes('@')) {
      params.push(`email=${encodeURIComponent(donorEmail.trim())}`);
    }
    const nameParts = donorName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    if (firstName && !isAnonymous) {
      params.push(`firstName=${encodeURIComponent(firstName)}`);
      if (lastName) {
        params.push(`lastName=${encodeURIComponent(lastName)}`);
      }
    }
    return params.length > 0 ? `${base}${queryChar}${params.join('&')}` : base;
  }, [orgInfo, frequency, effectiveAmount, donorEmail, donorName, isAnonymous]);

  // Synchronize donation intent with worker for deterministic certificate name matching
  useEffect(() => {
    if (!donorEmail || !donorEmail.includes('@')) return;
    const timer = setTimeout(async () => {
      try {
        const apiUrl = import.meta.env?.VITE_API_URL || '/api';
        await fetch(`${apiUrl}/donations/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donorName: isAnonymous ? 'Anonymous Supporter' : (donorName.trim() || 'Affirming Friend of DCVC'),
            donorEmail: donorEmail.trim().toLowerCase(),
            amount: effectiveAmount,
            frequency: frequency === 'monthly' ? 'monthly' : 'one-time',
            isAnonymous
          })
        });
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [donorName, donorEmail, effectiveAmount, frequency, isAnonymous]);

  const handleConfetti = () => {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      try {
        confetti({
          particleCount: 50,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#5A1E65', '#F59E0B', '#10B981', '#38BDF8', '#EC4899']
        });
      } catch {}
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-rose-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-rose-700 bg-rose-50 border-rose-200/90 shadow-xs">
            {liveDonationContent?.eyebrow || 'TAX-DEDUCTIBLE 501(C)(3) SUPPORT'}
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            {liveDonationContent?.title || (
              <>
                Powering Center &amp; <br />
                <span className="font-serif italic font-normal text-rose-600">Lifesaving Care.</span>
              </>
            )}
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            {liveDonationContent?.subtitle || 'Every dollar directly funds free rapid health screenings, weekly youth peer circles, harm reduction supplies, and community advocacy across Ventura County.'}
          </p>
        </div>
      </section>

      {/* Main Donation Gateway Interface */}
      <section className="container-clean py-16">
        
        {/* =================================================================== */}
        {/* STATE A: CELEBRATORY INSTANT CONFIRMATION SCREEN (NO OFFSITE LEAVE) */}
        {/* =================================================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Interactive Giving Builder & Integrated Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-12 rounded-3xl border-2 border-purple-200 shadow-2xl space-y-8">
              
              {/* Frequency Selector */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  01. CHOOSE FREQUENCY (ONE-TIME OR GEM MEMBERSHIP)
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
                    GEM Membership (Give Every Month)
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

              {/* Program Designation */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  03. DIRECT MY CONTRIBUTION
                </span>
                <select
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none bg-white cursor-pointer"
                >
                  {fundsList.map((opt, i) => (
                    <option key={opt.id || i} value={opt.title}>
                      {opt.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 pl-1">
                  100% of your gift is restricted directly to this purpose.
                </p>
              </div>

              {/* 04. PERSONALIZED APPRECIATION CERTIFICATE */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                    04. YOUR NAME ON APPRECIATION CERTIFICATE &amp; RECEIPT
                  </span>
                  <span className="text-[11px] text-purple-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Inscribed on Keepsake Card</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your name exactly as you would like it to appear on your official digital certificate keepsake. We will automatically generate your certificate and send it to your email via Resend upon completion.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Full Name for Certificate:
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Roland Catabona or The Somann Family"
                        value={isAnonymous ? '' : donorName}
                        disabled={isAnonymous}
                        onChange={(e) => setDonorName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none text-sm font-bold ${
                          isAnonymous ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Email Address (for certificate delivery &amp; official tax receipt):
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none text-sm font-bold bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Anonymous Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none pt-1">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-slate-300 text-[#5A1E65] focus:ring-purple-200"
                    />
                    <span>Keep my name anonymous (certificate will read "Affirming Friend of DCVC")</span>
                  </label>
                </div>
              </div>

              {/* Official Zeffy Campaign Checkout Redirection */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-purple-50 via-white to-amber-50/30 border-2 border-purple-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100/80 pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#5A1E65]" />
                      05. SECURE CHECKOUT VIA ZEFFY (0% PLATFORM FEES)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full self-start sm:self-auto shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      100% Tax-Deductible · 0% Fees
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    100% of your gift directly empowers Diversity Collective Ventura County. Zeffy covers all payment processing costs, ensuring every dollar funds local LGBTQ+ health, sanctuaries, and community mutual aid.
                  </p>

                  {/* Selected Contribution Summary Card */}
                  <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Selected Gift:</span>{' '}
                      <span className="font-black text-slate-950 text-sm sm:text-base">${effectiveAmount}</span>{' '}
                      <span className="font-bold text-[#5A1E65] uppercase text-[11px] px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200/60 ml-1">
                        {frequency === 'monthly' ? 'Monthly GEM Sustainer' : 'One-Time Contribution'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 font-medium">Designation:</span>{' '}
                      <span className="font-bold text-slate-800">{designation}</span>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <a
                    href={destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#5A1E65] via-purple-800 to-indigo-900 hover:from-purple-950 hover:to-indigo-950 text-white font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer text-center group"
                  >
                    <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>
                      {frequency === 'monthly'
                        ? `Proceed to GEM Monthly Membership on Zeffy ($${effectiveAmount}/mo)`
                        : `Proceed to One-Time Donation on Zeffy ($${effectiveAmount})`}
                    </span>
                    <ExternalLink className="w-4 h-4 text-purple-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                  </a>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>256-Bit SSL Encrypted • Processed on Zeffy PCI Level 1 Portal</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-600">
                      <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                      <span>Credit/Debit Card, Apple Pay, Google Pay &amp; ACH accepted</span>
                    </div>
                  </div>
                </div>
              </div>

                            {/* Appreciation Card Unlock Spotlight */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-fuchsia-50/50 to-amber-50/50 border border-purple-200 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-purple-900 text-amber-300 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-purple-950">
                      Unlocks: {currentAppreciationTier?.title || 'Community Ally'} ({currentAppreciationTier?.circleName || 'Friend Circle'})
                    </span>
                    <span className="text-[11px] font-bold text-[#5A1E65] bg-purple-100/80 px-2 py-0.5 rounded-md">
                      Certificate Inscription: <strong>{isAnonymous ? 'Affirming Friend of DCVC' : (donorName.trim() || 'Your Name')}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your personalized digital DCVC Appreciation Card featuring your inscribed name will be minted &amp; automatically delivered to your inbox via Resend upon completion.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 font-medium pt-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>100% Tax-Deductible 501(c)(3) Contribution · EIN: 46-5312131 · Instant Zeffy receipt emailed</span>
              </p>
            </div>

            {/* Right Column: Tax Status & Community Recognition Circles */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Tax Exemption & Governance Box */}
              <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                  501(C)(3) PUBLIC CHARITY DISCLOSURES
                </span>
                <h3 className="font-display text-2xl font-black text-white">
                  Financial Integrity &amp; Transparency
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  Diversity Collective Ventura County, Inc. is recognized by the IRS as a 501(c)(3) public benefit nonprofit corporation. All donations are tax-deductible to the fullest extent permitted by California and federal law.
                </p>

                <div className="pt-2 border-t border-slate-800 text-xs space-y-1.5 text-slate-200">
                  <p><strong className="text-white font-bold">Federal EIN:</strong> <span className="font-mono text-amber-300 font-semibold">{orgInfo.ein}</span></p>
                  <p><strong className="text-white font-bold">California Corp ID:</strong> <span className="font-mono text-amber-300 font-semibold">{orgInfo.caCorpNumber}</span></p>
                  <p><strong className="text-white font-bold">Physical Center:</strong> <span className="text-white">{orgInfo.address.full}</span></p>
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
                  Every donor unlocks an animated digital keepsake card featuring artwork, impact quotes, and leadership signatures:
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
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-50 to-purple-50/30 border border-purple-100 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-[#5A1E65] shadow-2xs">
                    <Heart className="w-4 h-4 fill-[#5A1E65]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-black text-slate-950">
                      Other Ways to Support
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Flexible giving pathways powering local Ventura County programs
                    </p>
                  </div>
                </div>

                {/* HERO SPOTLIGHT: In-Kind Donations */}
                <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#5A1E65] via-purple-900 to-indigo-950 text-white shadow-lg border border-purple-400/30">
                  <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-fuchsia-500/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 space-y-3.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-sm">
                        <Sparkles className="w-3 h-3 text-amber-900 fill-amber-900" />
                        Community Spotlight
                      </span>
                      <span className="text-[11px] font-bold text-purple-200">
                        100% Tax-Deductible Gifts
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-amber-300 flex-shrink-0" />
                        <h4 className="font-display text-base sm:text-lg font-black text-white">
                          In-Kind Community Donations
                        </h4>
                      </div>
                      <p className="text-xs text-purple-100/90 font-medium mt-1.5 leading-relaxed">
                        Non-monetary contributions directly equip our Community Resource Center, youth peer sanctuaries, and free health clinics. DCVC broadly welcomes practical supplies, equipment, and professional talents:
                      </p>
                    </div>

                    {/* Non-exhaustive category chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-white border border-white/15">
                        💻 Laptops &amp; Tablets
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-white border border-white/15">
                        🪑 Center Desks &amp; Chairs
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-white border border-white/15">
                        🩺 Clinic &amp; Rapid Testing Supplies
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-white border border-white/15">
                        🎨 Youth Art &amp; Craft Materials
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-white border border-white/15">
                        ⚖️ Pro Bono Services (Legal, CPA, AV)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-[11px] font-bold text-amber-200 border border-amber-300/30">
                        + And More
                      </span>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <Link
                        to="/contact"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                      >
                        <span>Arrange an In-Kind Gift</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to="/sponsors#in-kind"
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs text-center border border-white/20 transition-colors"
                      >
                        Review In-Kind Guidelines
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Secondary Pathways: Physical Checks & Corporate Matching */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-600">
                  {/* By Mail / Check */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-200 transition-colors flex flex-col justify-between space-y-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-50 text-[#5A1E65] flex items-center justify-center flex-shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-900 block">By Mail / Physical Check</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Make checks payable to: <strong className="text-slate-800">Diversity Collective Ventura County, Inc.</strong>
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-mono">
                      2471 Portola Road, Suite 100<br />Ventura, CA 93003
                    </div>
                  </div>

                  {/* Corporate Match & DAF */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-200 transition-colors flex flex-col justify-between space-y-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <Building className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-900 block">Corporate Match &amp; DAF</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Many Ventura County employers match gifts 1:1. Check with your HR portal or donate via your Donor-Advised Fund.
                      </p>
                    </div>
                    <a
                      href={`mailto:${orgInfo.email}?subject=Corporate%20Match%20%2F%20DAF%20Inquiry`}
                      className="inline-flex items-center gap-1.5 text-[11px] text-[#5A1E65] hover:text-purple-800 font-bold mt-auto"
                    >
                      <span>Inquire at {orgInfo.email}</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

            </div>

          </div>

      </section>

    </div>
  );
}
