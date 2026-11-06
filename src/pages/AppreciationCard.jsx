import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Sparkles, 
  Share2, 
  Download, 
  Check, 
  Copy, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Star, 
  Eye, 
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { orgInfo } from '../data/dcvcData';
import { 
  APPRECIATION_TIERS, 
  TIER_CONFIGS, 
  getTierForAmount, 
  formatDonationAmount 
} from '../data/appreciationTiers';
import { usePageMeta } from '../utils/seo';

export default function AppreciationCard() {
  const { token } = useParams();
  const isPreview = !token || token === 'preview';

  // Preview tier switcher state
  const [activeTierId, setActiveTierId] = useState(APPRECIATION_TIERS.PRIDE_ADVOCATE);
  
  // Card state
  const [cardData, setCardData] = useState(() => {
    if (isPreview) {
      return {
        donorDisplayName: 'Jordan Rivers',
        tier: APPRECIATION_TIERS.PRIDE_ADVOCATE,
        tierName: TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE].title,
        amountCents: TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE].minAmount * 100,
        frequency: 'monthly',
        isAnonymous: false,
        impactMessage: TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE].impactNarrative,
        createdAt: '2026-01-01T00:00:00.000Z'
      };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!isPreview);
  const [isOpened, setIsOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  usePageMeta({
    title: 'Your DCVC Appreciation Card | Diversity Collective Ventura County',
    description: 'A personalized digital thank-you card honoring your generous investment in LGBTQ+ sanctuary and wellness across Ventura County.',
    canonicalPath: `/appreciation-card/${token || 'preview'}`
  });

  // Fetch real card data by token
  useEffect(() => {
    if (isPreview) {
      setCardData({
        donorDisplayName: 'Jordan Rivers',
        tier: activeTierId,
        tierName: TIER_CONFIGS[activeTierId].title,
        amountCents: TIER_CONFIGS[activeTierId].minAmount * 100,
        frequency: 'monthly',
        isAnonymous: false,
        impactMessage: TIER_CONFIGS[activeTierId].impactNarrative,
        createdAt: new Date().toISOString()
      });
      setIsLoading(false);
      return;
    }

    const fetchCard = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const res = await fetch(`${apiBase}/appreciation-cards/${token}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.card) {
            setCardData(json.card);
            setActiveTierId(json.card.tier || APPRECIATION_TIERS.COMMUNITY_ALLY);
          }
        } else {
          // Graceful fallback for mock/demo cards
          setCardData({
            donorDisplayName: 'Affirming Community Supporter',
            tier: APPRECIATION_TIERS.PRIDE_ADVOCATE,
            tierName: 'Pride Advocate',
            amountCents: 5000,
            frequency: 'one-time',
            isAnonymous: false,
            impactMessage: TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE].impactNarrative,
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Card lookup fallback:', err);
        setCardData({
          donorDisplayName: 'Affirming Community Supporter',
          tier: APPRECIATION_TIERS.PRIDE_ADVOCATE,
          tierName: 'Pride Advocate',
          amountCents: 5000,
          frequency: 'one-time',
          isAnonymous: false,
          impactMessage: TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE].impactNarrative,
          createdAt: new Date().toISOString()
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCard();
  }, [token, isPreview, activeTierId]);

  // Handle opening interaction + confetti
  const handleOpenCard = () => {
    setIsOpened(true);

    if (!prefersReducedMotion) {
      try {
        const count = activeTierId === APPRECIATION_TIERS.VISIONARY_BENEFACTOR ? 120 : 60;
        confetti({
          particleCount: count,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#5A1E65', '#F59E0B', '#10B981', '#E11D48', '#8B5CF6']
        });
      } catch (e) {
        // Fallback gracefully
      }
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const currentTier = TIER_CONFIGS[cardData?.tier || activeTierId] || TIER_CONFIGS[APPRECIATION_TIERS.COMMUNITY_ALLY];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Retrieving your appreciation card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 selection:bg-purple-900 selection:text-white">
      
      {/* Interactive Tier Switcher (Visible in Preview Mode or for Exploration) */}
      {isPreview && (
        <div className="max-w-2xl mx-auto mb-8 bg-white/90 backdrop-blur p-4 rounded-2xl border border-purple-200 shadow-md print:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-700" />
              <span>Appreciation Card Tier Previewer</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Interactive Tier Demonstration
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.values(TIER_CONFIGS).map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => {
                  setActiveTierId(tier.id);
                  setIsOpened(false);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                  activeTierId === tier.id
                    ? 'bg-purple-900 text-white shadow-sm ring-2 ring-purple-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tier.title} (${tier.minAmount}+)
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        
        {/* =================================================================== */}
        {/* STATE 1: SEALED ENVELOPE (Unopened)                                 */}
        {/* =================================================================== */}
        {!isOpened ? (
          <div className="bg-white rounded-3xl border-2 border-purple-200 shadow-2xl p-8 sm:p-14 text-center relative overflow-hidden transition-all">
            {/* Ambient Background Aura */}
            <div 
              className={`absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gradient-to-tr ${currentTier.themeGradient} opacity-20 blur-3xl pointer-events-none`}
              aria-hidden="true" 
            />

            {/* Envelope Presentation Box */}
            <div className="relative z-10 max-w-lg mx-auto space-y-6">
              
              {/* Sealed Envelope Graphic */}
              <div className="relative mx-auto w-48 h-36 bg-gradient-to-b from-purple-50 to-slate-100 rounded-2xl border-2 border-purple-200 shadow-inner flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/50 to-amber-100/50 rounded-2xl pointer-events-none" />
                
                {/* Wax / Hologram Seal */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${currentTier.themeGradient} text-white flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform border-2 border-white`}>
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>

              {/* Envelope Greeting */}
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-900">
                  {currentTier.circleName}
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
                  A Gift of Gratitude for You
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  Presented to <strong className="text-purple-950 font-bold">{cardData?.donorDisplayName}</strong> in heartfelt recognition of your support.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleOpenCard}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-[#5A1E65] to-purple-800 text-white font-extrabold text-base shadow-xl hover:shadow-2xl hover:scale-102 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-300"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Break the Seal & Open Card</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Privacy Guarantee Note */}
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Confidential Keepsake · Zero Private Billing Data Stored</span>
              </p>
            </div>
          </div>
        ) : (

          /* ================================================================= */
          /* STATE 2: REVEALED APPRECIATION CARD (Opened)                       */
          /* ================================================================= */
          <div className="space-y-6">
            
            {/* The Digital Card Canvas */}
            <div 
              ref={cardRef}
              className={`relative rounded-3xl p-8 sm:p-12 border-2 ${currentTier.borderStyle} ${currentTier.cardBackground} shadow-2xl overflow-hidden transition-all duration-700`}
            >
              {/* Tier Filigree Top Border */}
              <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${currentTier.themeGradient}`} />

              {/* Visual Decorative Insignia */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8">
                <div>
                  <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-slate-500 block mb-1">
                    DIVERSITY COLLECTIVE VENTURA COUNTY • COMMUNITY SANCTUARY
                  </span>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider bg-white/90 border border-slate-200 shadow-xs text-purple-950">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{currentTier.badgeText}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 block">Certificate Date</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {new Date(cardData?.createdAt || '2026-01-01T00:00:00.000Z').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Main Card Inscription */}
              <div className="space-y-6 mb-10">
                <h2 className="text-sm font-bold uppercase tracking-wider text-purple-900">
                  Certificate of Authentic Gratitude
                </h2>

                <h3 className="font-serif text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                  With Heartfelt Thanks To <br />
                  <span className="bg-gradient-to-r from-purple-800 via-fuchsia-700 to-rose-600 bg-clip-text text-transparent">
                    {cardData?.donorDisplayName}
                  </span>
                </h3>

                <p className="font-serif italic text-lg sm:text-xl text-slate-700 leading-relaxed max-w-2xl">
                  {currentTier.quote}
                </p>

                {/* Impact Statement Box */}
                <div className="p-6 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-current" />
                    <span>Your Community Impact</span>
                  </h4>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                    {cardData?.impactMessage || currentTier.impactNarrative}
                  </p>
                </div>
              </div>

              {/* Formal Leadership Signatures & Non-Profit Seal */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                
                {/* Executive Director Signature */}
                <div className="space-y-1">
                  <span className="font-serif italic text-xl text-slate-800 block">Tess Allen</span>
                  <p className="text-xs font-bold text-slate-900">Tess Allen</p>
                  <p className="text-[11px] text-slate-500">Executive Director</p>
                </div>

                {/* Board President Signature */}
                <div className="space-y-1">
                  <span className="font-serif italic text-xl text-slate-800 block">Roland Catabona</span>
                  <p className="text-xs font-bold text-slate-900">Roland Catabona</p>
                  <p className="text-[11px] text-slate-500">President, Board of Directors</p>
                </div>

                {/* Official 501(c)(3) Seal */}
                <div className="text-left sm:text-right space-y-1">
                  <div className="inline-block p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-left">
                    <p className="text-[10px] font-mono font-bold">EIN: {orgInfo.ein}</p>
                    <p className="text-[10px] font-mono">501(c)(3) Non-Profit</p>
                    <p className="text-[9px] text-purple-700">Ventura County, CA</p>
                  </div>
                </div>

              </div>

              {/* Bottom Subtle Disclaimer */}
              <div className="mt-8 pt-4 border-t border-slate-200/60 text-[11px] text-slate-500 text-center">
                This digital keepsake honors your support. Your official tax receipt was delivered separately by Zeffy.
              </div>

            </div>

            {/* =============================================================== */}
            {/* ACTIONS TOOLBAR: Download, Share, Replay                        */}
            {/* =============================================================== */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm print:hidden">
              
              <div className="flex flex-wrap gap-2">
                {/* Download / Print Button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Download / Print Keepsake</span>
                </button>

                {/* Copy Clean Share Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Replay Opening Animation */}
                <button
                  type="button"
                  onClick={() => setIsOpened(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-900 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Seal</span>
                </button>

                <Link
                  to="/programs"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-900 text-white text-xs font-bold hover:bg-purple-800 transition-colors"
                >
                  <span>See Your Impact in Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

