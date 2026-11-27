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
  CreditCard,
  Building,
  Mail,
  RefreshCw,
  Gift,
  ExternalLink,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLiveOrgInfo } from '../hooks/useCmsLive';
import { cmsStore } from '../services/cmsStore';
import { TIER_CONFIGS } from '../data/appreciationTiers';
import { usePageMeta } from '../utils/seo';

function toZeffyEmbedUrl(url, fallback) {
  let clean = (url || fallback || '').trim();
  if (!clean) return fallback;
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://www.zeffy.com/donation-form/${clean}`;
  }
  if (clean.includes('/donation-form/') && !clean.includes('/embed/donation-form/')) {
    clean = clean.replace('/donation-form/', '/embed/donation-form/');
  }
  return clean;
}

function toZeffyDirectUrl(url, fallback) {
  let clean = (url || fallback || '').trim();
  if (!clean) return fallback;
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://www.zeffy.com/donation-form/${clean}`;
  }
  clean = clean.replace('/embed/donation-form/', '/donation-form/');
  return clean;
}

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

  usePageMeta({
    title: 'Donate & GEM Membership | Diversity Collective Ventura County',
    description: 'Support Diversity Collective Ventura County. Tax-deductible contributions and recurring GEM Memberships fund free HIV/STI screenings, youth peer sanctuaries, and LGBTQ+ community mutual aid. Every gift unlocks a personalized Appreciation Card.',
    canonicalPath: '/donate'
  });

  const [searchParams] = useSearchParams();
  const initialFreqParam = searchParams.get('frequency');
  const [activeTab, setActiveTab] = useState(
    initialFreqParam === 'monthly' || initialFreqParam === 'gem' ? 'gem' : 'general'
  );
  const [iframeLoading, setIframeLoading] = useState(true);

  // Pre-donation donor information state (Requirement 7.A)
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmittingIntent, setIsSubmittingIntent] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [registeredIntent, setRegisteredIntent] = useState(null);
  const [checkingVerify, setCheckingVerify] = useState(false);
  const [verifyStatusMsg, setVerifyStatusMsg] = useState(null);
  const [verifiedCardUrl, setVerifiedCardUrl] = useState('');

  const handleCheckKeepsakeStatus = async () => {
    if (!registeredIntent?.intentToken) return;
    setCheckingVerify(true);
    setVerifyStatusMsg(null);
    try {
      const apiBase = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) || '/api';
      const cleanApiBase = apiBase.replace(/\/+$/, '');
      const res = await fetch(`${cleanApiBase}/donations/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentToken: registeredIntent.intentToken })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'verified' && data.cardUrl) {
        setVerifiedCardUrl(data.cardUrl);
        setVerifyStatusMsg('Your gift is verified and your Keepsake Card is ready! We also sent it to your email.');
      } else {
        setVerifyStatusMsg(data.message || 'Verification in progress. Once Zeffy finishes confirming your gift, your personalized Keepsake Card is emailed automatically.');
      }
    } catch {
      setVerifyStatusMsg('Unable to check status right now. Your Keepsake Card will be delivered to your email automatically once Zeffy confirms payment.');
    } finally {
      setCheckingVerify(false);
    }
  };

  const handleProceedToZeffy = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError('');

    const trimmedName = donorName.trim();
    const trimmedEmail = donorEmail.trim().toLowerCase();

    if (!isAnonymous && !trimmedName) {
      setFormError('Please enter your name as you would like it to appear on your keepsake card, or select Anonymous.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid email address so we can associate your donation and deliver your keepsake card.');
      return;
    }

    setIsSubmittingIntent(true);
    try {
      const apiBase = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) || '/api';
      const cleanApiBase = apiBase.replace(/\/+$/, '');
      const response = await fetch(`${cleanApiBase}/donations/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: isAnonymous ? 'Affirming Supporter' : trimmedName,
          donorEmail: trimmedEmail,
          frequency: activeTab === 'gem' ? 'monthly' : 'one-time',
          campaign: activeTab === 'gem' ? 'gem' : 'donate-to-change-lives-30236',
          isAnonymous
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to prepare donation session.');
      }
      setRegisteredIntent({
        donorName: isAnonymous ? 'Affirming Supporter' : trimmedName,
        donorEmail: trimmedEmail,
        intentToken: data.intentToken,
        intentId: data.intentId,
        campaign: data.campaign
      });
      setCheckoutReady(true);
    } catch (err) {
      setFormError(err.message || 'Unable to register keepsake details. You may proceed directly or retry.');
    } finally {
      setIsSubmittingIntent(false);
    }
  };

  const handleDirectSkip = () => {
    setRegisteredIntent(null);
    setCheckoutReady(true);
  };

  // Synchronize state if URL query params change
  useEffect(() => {
    const freq = searchParams.get('frequency');
    if (freq) {
      setActiveTab(freq === 'monthly' || freq === 'gem' ? 'gem' : 'general');
    }
  }, [searchParams]);

  // Reset loading state when switching tabs
  useEffect(() => {
    setIframeLoading(true);
  }, [activeTab]);

  const generalRawUrl = orgInfo?.zeffyGeneralUrl || orgInfo?.zeffyDonationUrl || 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-30236';
  const gemRawUrl = orgInfo?.zeffyGemUrl || 'https://www.zeffy.com/en-US/donation-form/gem';

  const generalEmbedUrl = useMemo(
    () => toZeffyEmbedUrl(generalRawUrl, 'https://www.zeffy.com/en-US/embed/donation-form/donate-to-change-lives-30236'),
    [generalRawUrl]
  );
  const gemEmbedUrl = useMemo(
    () => toZeffyEmbedUrl(gemRawUrl, 'https://www.zeffy.com/en-US/embed/donation-form/gem'),
    [gemRawUrl]
  );

  const activeEmbedUrlBase = activeTab === 'gem' ? gemEmbedUrl : generalEmbedUrl;
  const activeDirectUrlBase = activeTab === 'gem'
    ? toZeffyDirectUrl(gemRawUrl, 'https://www.zeffy.com/en-US/donation-form/gem')
    : toZeffyDirectUrl(generalRawUrl, 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-30236');

  const appendZeffyPrefill = (baseUrl) => {
    if (!registeredIntent) return baseUrl;
    try {
      const u = new URL(baseUrl);
      if (registeredIntent.donorEmail) u.searchParams.set('email', registeredIntent.donorEmail);
      const nameParts = (registeredIntent.donorName || '').trim().split(/\s+/).filter(Boolean);
      if (nameParts[0] && !isAnonymous) u.searchParams.set('firstName', nameParts[0]);
      if (nameParts.length > 1 && !isAnonymous) u.searchParams.set('lastName', nameParts.slice(1).join(' '));
      return u.toString();
    } catch {
      return baseUrl;
    }
  };

  const activeEmbedUrl = appendZeffyPrefill(activeEmbedUrlBase);
  const activeDirectUrl = appendZeffyPrefill(activeDirectUrlBase);

  return (
    <div className="w-full max-w-full overflow-x-clip pt-6 md:pt-12 pb-16 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-8 md:pb-10 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-rose-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-rose-700 bg-rose-50 border-rose-200/90 shadow-xs self-start">
            {cmsStore.getSettings()?.pageCopy?.donate?.eyebrow || liveDonationContent?.eyebrow || 'TAX-DEDUCTIBLE 501(C)(3) SUPPORT · 0% PLATFORM FEES'}
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            {cmsStore.getSettings()?.pageCopy?.donate?.headline || liveDonationContent?.title || (
              <>
                Powering Center &amp; <br />
                <span className="font-serif italic font-normal text-rose-600">Lifesaving Care.</span>
              </>
            )}
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            {cmsStore.getSettings()?.pageCopy?.donate?.description || liveDonationContent?.subtitle || 'Every dollar directly funds free rapid health screenings, weekly youth peer circles, harm reduction supplies, and community advocacy across Ventura County.'}
          </p>
        </div>
      </section>

      {/* Main Donation Gateway Interface */}
      <section className="container-clean py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Embedded Zeffy Portal */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border-2 border-purple-200 shadow-2xl space-y-6">
            
            {/* Header & Campaign Selector */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#5A1E65]" />
                  SELECT CONTRIBUTION TYPE
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  100% Tax-Deductible · 0% Fees
                </span>
              </div>

              {/* Campaign Tabs */}
              <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className={`py-3 px-3 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${
                    activeTab === 'general'
                      ? 'bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                  }`}
                >
                  General Donation
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gem')}
                  className={`py-3 px-3 text-xs font-black rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    activeTab === 'gem'
                      ? 'bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${activeTab === 'gem' ? 'fill-rose-300 text-rose-300' : 'text-rose-500'}`} />
                  <span>GEM Monthly Membership</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                {activeTab === 'gem' 
                  ? 'Give Every Month (GEM) Sustainers provide dependable, year-round funding for youth peer sanctuaries and rapid healthcare testing.'
                  : '100% of your tax-deductible gift directly funds Diversity Collective Ventura County programs. Zero platform fees deducted.'}
              </p>
            </div>

            {!checkoutReady ? (
              /* Pre-Donation Donor Information Form (Requirement 7.A) */
              <form onSubmit={handleProceedToZeffy} className="space-y-5">
                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <h3 className="text-sm font-extrabold text-purple-950 uppercase tracking-wide">
                      Step 1 of 2: Keepsake Card Personalization
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Every gift unlocks a customized digital DCVC Appreciation Card. Please provide your name and email so our system can prepare your keepsake and match your completed gift.
                  </p>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="donor-name-input" className="block text-xs font-bold text-slate-700 mb-1">
                      Donor Name (as it should appear on your Keepsake Card) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        id="donor-name-input"
                        type="text"
                        disabled={isAnonymous}
                        value={isAnonymous ? 'Anonymous' : donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="e.g. Maria Gonzalez or The Rivera Family"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="donor-email-input" className="block text-xs font-bold text-slate-700 mb-1">
                      Donor Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        id="donor-email-input"
                        type="email"
                        required
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Please enter the same email you plan to enter at Zeffy checkout to guarantee automatic keepsake matching.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="anonymous-checkbox"
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-700 focus:ring-purple-600 border-slate-300"
                    />
                    <label htmlFor="anonymous-checkbox" className="text-xs text-slate-600 font-medium select-none cursor-pointer">
                      Keep my name anonymous on public recognition rolls (card will still be issued to your email)
                    </label>
                  </div>
                </div>

                {/* Privacy & Payment Security Note */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Privacy &amp; Payment Security Assurance</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    DCVC respects your privacy. Details provided here are strictly used to associate your donation with your digital keepsake card and deliver your tax acknowledgment. No credit card numbers or banking credentials are collected on this site; all transactions take place through Zeffy&apos;s PCI Level 1 encrypted payment gateway.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingIntent}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 hover:from-purple-900 hover:to-purple-950 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                  >
                    {isSubmittingIntent ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Preparing Keepsake Intent...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Secure Zeffy Checkout</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleDirectSkip}
                      className="text-xs text-slate-500 hover:text-purple-800 underline cursor-pointer"
                    >
                      Skip personalization and proceed directly to Zeffy checkout &rarr;
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Embedded Zeffy Checkout Container & Intent Confirmation */
              <div className="space-y-4">
                {registeredIntent ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950">Keepsake Reserved: </span>
                        <span className="text-emerald-900 font-medium">{registeredIntent.donorName}</span>
                        <span className="text-emerald-700 text-[11px] block">
                          Checkout with <strong className="font-mono">{registeredIntent.donorEmail}</strong> to link your card
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutReady(false)}
                      className="text-xs font-bold text-purple-900 hover:text-purple-950 underline shrink-0 cursor-pointer"
                    >
                      Edit Info
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                    <span>Direct checkout mode</span>
                    <button
                      type="button"
                      onClick={() => setCheckoutReady(false)}
                      className="text-xs font-bold text-purple-900 hover:text-purple-950 underline cursor-pointer"
                    >
                      Add Keepsake Personalization
                    </button>
                  </div>
                )}

                <div className="relative rounded-2xl overflow-hidden border border-purple-100 bg-slate-50 shadow-inner min-h-[640px]">
                  {iframeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs z-10 space-y-3 p-6 text-center">
                      <RefreshCw className="w-8 h-8 text-[#5A1E65] animate-spin" />
                      <p className="text-xs font-bold text-slate-700">
                        Connecting to secure Zeffy donation gateway...
                      </p>
                      <span className="text-[11px] text-slate-500">
                        PCI Level 1 Compliant · 256-Bit SSL
                      </span>
                    </div>
                  )}
                  
                  <iframe
                    title="Diversity Collective Secure Donation via Zeffy"
                    src={activeEmbedUrl}
                    onLoad={() => setIframeLoading(false)}
                    className="w-full border-0 rounded-2xl min-h-[640px] h-[720px] bg-white"
                    allow="payment"
                    allowPaymentRequest
                    allowTransparency="true"
                  />
                </div>

                {/* Post-Checkout Keepsake Verification Bar */}
                {registeredIntent && (
                  <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-700">
                        <strong className="text-[#5A1E65] block">Already finished Zeffy checkout?</strong>
                        <span>Your keepsake card will arrive in your email automatically, or check its live status here.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCheckKeepsakeStatus}
                        disabled={checkingVerify}
                        className="px-4 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${checkingVerify ? 'animate-spin' : ''}`} />
                        <span>{checkingVerify ? 'Checking...' : 'Check My Keepsake Card'}</span>
                      </button>
                    </div>
                    {verifyStatusMsg && (
                      <div className="p-2.5 rounded-xl bg-white border border-purple-200 text-xs text-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <span>{verifyStatusMsg}</span>
                        {verifiedCardUrl && (
                          <Link
                            to={verifiedCardUrl}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1"
                          >
                            <span>Open Keepsake Card</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* External Direct Fallback */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 text-xs text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span>Credit/Debit Card, Apple Pay, Google Pay &amp; ACH accepted</span>
                  </div>
                  <a
                    href={activeDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#5A1E65] hover:text-purple-900 font-bold transition-colors"
                  >
                    <span>Having trouble? Open full screen checkout</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Appreciation Card Unlock Note */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-fuchsia-50/50 to-amber-50/50 border border-purple-200 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-900 text-amber-300 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-950 block">
                  Automatic DCVC Appreciation Keepsake
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every donor receives a personalized digital Appreciation Card keepsake featuring community quotes, artist designs, and leadership signatures, delivered automatically to your email via Resend upon gift completion.
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
          </div>

        </div>

        {/* Full-Width Alternative Giving Pathways (Balanced Multi-Column Band) */}
        <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-50 to-purple-50/30 border border-purple-100 shadow-sm space-y-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Band: In-Kind Donations Spotlight */}
            <div className="lg:col-span-7 relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#5A1E65] via-purple-900 to-indigo-950 text-white shadow-lg border border-purple-400/30 flex flex-col justify-between">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-fuchsia-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
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
                    <h4 className="font-display text-base sm:text-xl font-black text-white">
                      In-Kind Community Donations
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-100/90 font-medium mt-1.5 leading-relaxed">
                    Non-monetary contributions directly equip our Community Resource Center, youth peer sanctuaries, and free health clinics. DCVC broadly welcomes practical supplies, equipment, and professional talents:
                  </p>
                </div>

                {/* Category chips */}
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
              </div>

              <div className="relative z-10 pt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <Link
                  to="/contact"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                >
                  <span>Arrange an In-Kind Gift</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/sponsors#in-kind"
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs text-center border border-white/20 transition-colors"
                >
                  Review In-Kind Guidelines
                </Link>
              </div>
            </div>

            {/* Right Band: Physical Checks & Corporate Matching */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 text-xs text-slate-600">
              {/* By Mail / Check */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-200 transition-colors flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#5A1E65] flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">By Mail / Physical Check</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Make checks payable to: <strong className="text-slate-800">Diversity Collective Ventura County, Inc.</strong>
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-mono">
                  2471 Portola Road, Suite 100 · Ventura, CA 93003
                </div>
              </div>

              {/* Corporate Match & DAF */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-200 transition-colors flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">Corporate Match &amp; DAF</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Many Ventura County employers match gifts 1:1. Check with your HR portal or donate via your Donor-Advised Fund.
                  </p>
                </div>
                <a
                  href={`mailto:${orgInfo.email}?subject=Corporate%20Match%20%2F%20DAF%20Inquiry`}
                  className="inline-flex items-center gap-1.5 text-xs text-[#5A1E65] hover:text-purple-800 font-bold break-all"
                >
                  <span>Inquire at {orgInfo.email}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
