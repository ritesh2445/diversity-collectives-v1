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
  ExternalLink
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

  const activeEmbedUrl = activeTab === 'gem' ? gemEmbedUrl : generalEmbedUrl;
  const activeDirectUrl = activeTab === 'gem' 
    ? toZeffyDirectUrl(gemRawUrl, 'https://www.zeffy.com/en-US/donation-form/gem') 
    : toZeffyDirectUrl(generalRawUrl, 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-30236');

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-12 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-rose-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-rose-700 bg-rose-50 border-rose-200/90 shadow-xs self-start">
            {liveDonationContent?.eyebrow || 'TAX-DEDUCTIBLE 501(C)(3) SUPPORT · 0% PLATFORM FEES'}
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
      <section className="container-clean py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
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

            {/* Embedded Zeffy Checkout Container */}
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

              {/* In-Kind Donations */}
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
