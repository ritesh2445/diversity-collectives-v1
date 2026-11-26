import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ArrowUpRight, 
  ShieldCheck, 
  CheckCircle2,
  Calendar,
  Share2,
  RefreshCw,
  Star,
  Flame,
  Clock,
  Heart,
  Navigation,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2,
  Check
} from 'lucide-react';
import { businessDirectorySeed } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';
import SendVoicemailButton from '../components/SendVoicemailButton';
import DcvcApprovedBadge from '../components/DcvcApprovedBadge';
import AirDropPulseWaves from '../components/AirDropPulseWaves';
import DirectoryRateModal from '../components/DirectoryRateModal';
import DirectoryClaimModal from '../components/DirectoryClaimModal';
import { directoryService } from '../services/directoryService';

const LOCAL_STORAGE_KEY = 'dcvc_live_directory_businesses';

function getStoredBusinesses() {
  if (typeof window === 'undefined') return businessDirectorySeed;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return businessDirectorySeed;
}

function isValidBusinessWebsite(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().trim();
  if (lower === '' || lower.includes('example.com') || lower.includes('example.org') || lower.includes('.example') || lower === '#' || lower === 'http://' || lower === 'https://') {
    return false;
  }
  return lower.startsWith('http://') || lower.startsWith('https://');
}

export default function DirectoryProfile() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(() => {
    const list = getStoredBusinesses();
    return list.find(b => b.slug === slug || b.id === slug) || null;
  });
  const [loading, setLoading] = useState(!business);

  // Yelp-Style Interactive States
  const [stats, setStats] = useState(() => directoryService.getBusinessStats(business));
  const [openStatus, setOpenStatus] = useState(() => directoryService.getOpenStatus(business));
  const [showWeeklyHours, setShowWeeklyHours] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [hypeWaveActive, setHypeWaveActive] = useState(false);
  const [hypeRandomSeed, setHypeRandomSeed] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (!business) {
      let isMounted = true;
      const apiBase = typeof window !== 'undefined' && window.location.origin.includes('localhost')
        ? 'http://localhost:8787'
        : 'https://dcvc-api.diversity-collective-vc.workers.dev';
      fetch(`${apiBase}/api/directory/${slug}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (isMounted && data?.business) {
            setBusiness(data.business);
            setStats(directoryService.getBusinessStats(data.business));
            setOpenStatus(directoryService.getOpenStatus(data.business));
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });
      return () => { isMounted = false; };
    }
  }, [slug, business]);

  useEffect(() => {
    const handleSync = () => {
      if (business) {
        setStats(directoryService.getBusinessStats(business));
        setOpenStatus(directoryService.getOpenStatus(business));
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('dcvc-directory-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('dcvc-directory-updated', handleSync);
    };
  }, [business]);

  usePageMeta({
    title: business ? `${business.name} — Affirming Business Directory` : 'Business Profile',
    description: business ? business.description : 'LGBTQ+ Affirming Business Profile in Ventura County.',
    canonicalPath: business ? `/directory/${business.slug || slug}` : '/directory',
    ogImage: business?.image || business?.cover_url
  });

  if (loading) {
    return (
      <div className="pt-20 pb-20 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-purple-900">
          <RefreshCw className="w-8 h-8 animate-spin text-[#5A1E65]" />
          <span className="text-xs font-bold text-slate-500">Loading business profile...</span>
        </div>
      </div>
    );
  }

  if (!business) {
    return <Navigate to="/directory" replace />;
  }

  const isApproved = Boolean(business.is_verified || business.isVerifiedAffirming || business.verified);
  const weeklyHours = directoryService.getWeeklyHours(business);
  const amenities = directoryService.getAmenities(business);
  const directionsUrl = directoryService.getDirectionsUrl(business);

  const parsedGalleryImages = (() => {
    if (Array.isArray(business.images)) return business.images.filter(Boolean);
    if (typeof business.gallery_images === 'string' && business.gallery_images.trim()) {
      try {
        const arr = JSON.parse(business.gallery_images);
        if (Array.isArray(arr)) return arr.filter(Boolean);
      } catch (_) {}
    }
    return [];
  })();
  const getWebsiteBrandLogoUrl = (website) => {
    if (!website || typeof website !== 'string') return '';
    try {
      const normalized = /^https?:\/\//i.test(website.trim()) ? website.trim() : `https://${website.trim()}`;
      const hostname = new URL(normalized).hostname.replace(/^www\./i, '');
      if (!hostname) return '';
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=256`;
    } catch (_) {
      return '';
    }
  };

  const primaryCover = business.image || business.cover_url || parsedGalleryImages[0] || '';
  const websiteBrandLogo = !primaryCover ? getWebsiteBrandLogoUrl(business.website) : '';
  const heroDisplaySrc = primaryCover || websiteBrandLogo || '/images/community-gathering.jpg';
  const isBrandLogoFallback = Boolean(!primaryCover && websiteBrandLogo);
  const galleryPhotos = parsedGalleryImages.length > 0
    ? parsedGalleryImages
    : (primaryCover ? [primaryCover] : []);

  const handleTriggerHype = async () => {
    if (stats.isHyped) return;
    setHypeRandomSeed(Math.floor(Math.random() * 1000) + 1);
    setHypeWaveActive(true);
    await directoryService.hypeBusiness(business.id || business.slug);
    setTimeout(() => {
      setHypeWaveActive(false);
    }, 2200);
  };

  const handleToggleFavorite = () => {
    directoryService.toggleFavorite(business.id || business.slug);
    setStats(prev => ({ ...prev, isSaved: !prev.isSaved }));
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800 relative">
      
      {/* Back button & Action Header Bar */}
      <div className="container-clean mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link 
          to="/directory" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Business Directory</span>
        </Link>

        {/* Favorite & Share Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              stats.isSaved
                ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${stats.isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            <span>{stats.isSaved ? 'Saved in Favorites' : 'Save to Favorites'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClaimModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-purple-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-[#5A1E65]" />
            <span>Claim or Suggest Edit</span>
          </button>
        </div>
      </div>

      <article className="container-clean">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200">
                  {business.category}
                </span>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  {stats.price}
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{business.city}, CA</span>
                </span>
                {isApproved && <DcvcApprovedBadge />}
                {business.isLGBTQOwned && (
                  <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    🌈 LGBTQ+ Owned Enterprise
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-[1.08]">
                {business.name}
              </h1>

              {/* Yelp-Style Ratings, Hype & Live Status Header */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* 5-Star Rating Pill */}
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 font-black text-xs transition-colors cursor-pointer shadow-xs group"
                  title="Click to submit an authentic community rating"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">{stats.rating}</span>
                  <span className="text-slate-500 font-semibold text-xs">({stats.ratingCount} ratings)</span>
                  <span className="text-[10px] text-purple-700 font-bold ml-1 hover:underline">Rate</span>
                </button>

                {/* Live AirDrop Hype Button */}
                <button
                  type="button"
                  onClick={handleTriggerHype}
                  disabled={stats.isHyped}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    stats.isHyped
                      ? 'bg-purple-100 text-purple-900 border border-purple-300 opacity-90 cursor-default'
                      : 'bg-gradient-to-r from-purple-700 via-pink-600 to-amber-500 text-white shadow-md hover:shadow-lg hover:scale-102 active:scale-95'
                  }`}
                  title={stats.isHyped ? 'Already hyped from this IP' : 'Tap to Hype this affirming business!'}
                >
                  <Flame className={`w-4 h-4 ${stats.isHyped ? 'text-orange-500 fill-orange-400' : 'text-amber-200 fill-amber-200 animate-pulse'}`} />
                  <span className="text-sm">{stats.hypes}</span>
                  <span>{stats.isHyped ? 'Hyped! 🔥' : 'HYPE'}</span>
                </button>

                {/* Live Open / Closed Pill */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  openStatus.isOpen 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span>{openStatus.statusText}</span>
                  <span className="text-slate-400 font-normal">·</span>
                  <span className="text-slate-600 font-medium">{openStatus.detailText}</span>
                </div>
              </div>
            </div>

            {/* Profile Hero Photo Showcase with AirDrop soft ambient light wave overlay */}
            <div className={`rounded-3xl overflow-hidden aspect-[16/9] shadow-xl border-2 border-slate-200 relative ${
              isBrandLogoFallback ? 'bg-gradient-to-br from-purple-50 via-white to-amber-50/70' : ''
            }`}>
              <AirDropPulseWaves 
                active={hypeWaveActive} 
                bizId={business.id || business.slug}
                category={business.category}
                seed={hypeRandomSeed}
              />
              <img
                src={heroDisplaySrc}
                alt={business.name}
                className={isBrandLogoFallback ? 'w-full h-full object-contain p-10 sm:p-14' : 'w-full h-full object-cover'}
                onLoad={(e) => {
                  if (isBrandLogoFallback && e.currentTarget.naturalWidth > 0 && e.currentTarget.naturalWidth <= 16 && e.currentTarget.dataset.fallbackApplied !== 'true') {
                    e.currentTarget.dataset.fallbackApplied = 'true';
                    e.currentTarget.className = 'w-full h-full object-cover';
                    e.currentTarget.src = '/images/community-gathering.jpg';
                  }
                }}
                onError={(e) => {
                  if (e.currentTarget.dataset.fallbackApplied === 'true') return;
                  e.currentTarget.dataset.fallbackApplied = 'true';
                  e.currentTarget.className = 'w-full h-full object-cover';
                  e.currentTarget.src = '/images/community-gathering.jpg';
                }}
              />
            </div>

            {/* Multi-Photo Gallery Showcase (Yelp Standard) */}
            {galleryPhotos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Photo Showcase &amp; Atmosphere
                  </span>
                  <span className="text-xs text-slate-400">
                    {galleryPhotos.length} Verified {galleryPhotos.length === 1 ? 'Photo' : 'Photos'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {galleryPhotos.map((photo, idx) => (
                    <button
                      key={`${photo}-${idx}`}
                      type="button"
                      onClick={() => setSelectedPhoto(photo)}
                      className="h-28 rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:border-purple-400 hover:scale-102 transition-all cursor-pointer relative group"
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        View
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Business Description */}
            <div className="space-y-4 text-base text-slate-600 leading-relaxed font-medium">
              <h2 className="font-display text-2xl font-black text-slate-950">
                About {business.name}
              </h2>
              <p>{business.description}</p>
            </div>

            {/* Yelp-Style Amenities & More Business Info Checklist */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-display text-lg font-black text-slate-950">
                More Business Info & Affirming Amenities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-800 font-bold">
                {amenities.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 stroke-[3]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Affirming Standards Checklist */}
            <div className="p-6 rounded-3xl bg-emerald-50/70 border-2 border-emerald-200 space-y-4">
              <div className="flex items-center gap-2 text-emerald-950 font-display font-black text-lg">
                <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <span>Diversity Collective Affirming Pledge</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                This business has formally pledged adherence to Ventura County non-discrimination standards:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-emerald-900 font-bold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Zero-tolerance for discrimination</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>All-gender welcoming environment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Respect for customer pronouns</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Support for LGBTQ+ community wellbeing</span>
                </li>
              </ul>
            </div>

            {/* Tags */}
            {business.tags && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {business.tags.map((tag) => (
                    <span key={tag} className="text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logistics & Contact Card (Yelp Right Rail) */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="p-7 sm:p-8 rounded-3xl bg-white border-2 border-purple-200 shadow-xl space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  LOCATION & HOURS
                </span>
                <h3 className="font-display text-xl font-black text-slate-950">
                  Connect & Visit
                </h3>
              </div>

              {/* Operating Hours Accordion */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowWeeklyHours(prev => !prev)}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#5A1E65]" />
                    <span className="text-xs font-black text-slate-950">Operating Hours</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#5A1E65]">
                    <span>{openStatus.statusText}</span>
                    {showWeeklyHours ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                <div className="text-xs text-slate-600 font-medium pt-1">
                  Today: <strong className="text-slate-900">{openStatus.todayHours}</strong>
                </div>

                {/* Expandable Mon-Sun Table */}
                {showWeeklyHours && (
                  <div className="pt-3 border-t border-purple-200/60 space-y-1.5 text-xs">
                    {[
                      { day: 'Monday', val: weeklyHours.mon },
                      { day: 'Tuesday', val: weeklyHours.tue },
                      { day: 'Wednesday', val: weeklyHours.wed },
                      { day: 'Thursday', val: weeklyHours.thu },
                      { day: 'Friday', val: weeklyHours.fri },
                      { day: 'Saturday', val: weeklyHours.sat },
                      { day: 'Sunday', val: weeklyHours.sun }
                    ].map(h => (
                      <div key={h.day} className="flex items-center justify-between py-0.5">
                        <span className="text-slate-600">{h.day}</span>
                        <span className="font-bold text-slate-900">{h.val || 'Closed'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 text-xs font-medium">
                {business.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Address</span>
                      <span className="text-slate-600">{business.address}</span>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5A1E65] font-bold hover:underline block pt-1 inline-flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Get Directions on Google Maps</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {business.phone && (
                  business.voicemailOnly ? (
                    <div className="flex items-start gap-3">
                      <div>
                        <span className="font-bold text-slate-900 block mb-1">Direct Contact</span>
                        <SendVoicemailButton
                          label="Send Voice Message"
                          subject={`Inquiry for ${business.name}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-[#5A1E65] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block">Telephone</span>
                        <a href={`tel:${business.phone}`} className="text-slate-600 hover:text-[#5A1E65]">
                          {business.phone}
                        </a>
                      </div>
                    </div>
                  )
                )}

                {business.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-[#5A1E65] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Email</span>
                      <a href={`mailto:${business.email}`} className="text-slate-600 hover:text-[#5A1E65]">
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}

                {isValidBusinessWebsite(business.website) && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Website</span>
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#5A1E65] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Visit Website</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>Rate This Business (★ {stats.rating})</span>
                </button>

                {isValidBusinessWebsite(business.website) && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full py-3 text-center text-xs font-bold inline-flex items-center justify-center gap-2 shadow-md hover:shadow-xl"
                  >
                    <span>Visit Business Website</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Verified in Ventura County</span>
                <button 
                  type="button" 
                  onClick={() => setIsClaimModalOpen(true)}
                  className="hover:underline text-[#5A1E65] font-bold cursor-pointer"
                >
                  Claim or Suggest Edit
                </button>
              </div>
            </div>
          </div>

        </div>
      </article>

      {/* Modals & Photo Lightbox */}
      <DirectoryRateModal
        business={business}
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        onRated={(res) => setStats(prev => ({ ...prev, rating: res.rating, ratingCount: res.ratingCount }))}
      />

      <DirectoryClaimModal
        business={business}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl relative">
            <img src={selectedPhoto} alt="Showcase" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

    </div>
  );
}
