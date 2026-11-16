import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Phone,
  Heart,
  Shield,
  Calendar,
  Sparkles,
  Users,
  Mail,
  Stethoscope
} from 'lucide-react';
import { resolveHeroTheme } from '../services/heroThemeStore';
import { DEFAULT_PAGE_BLOCKS } from '../data/siteDefaults';
import CardSpotlight from './CardSpotlight';

const DEFAULT_HERO_PROPS =
  DEFAULT_PAGE_BLOCKS.find((b) => b.type === 'hero_banner')?.props || {};

function sanitizeSanctuaryText(val) {
  if (typeof val === 'string') {
    return val
      .replace(/\bVisit Sanctuary\b/gi, 'Visit Center')
      .replace(/\bSanctuary\b/g, 'Center')
      .replace(/\bsanctuary\b/g, 'center')
      .replace(/\bSANCTUARY\b/g, 'CENTER');
  }
  return val;
}

const HERO_SUBTEXT_HIGHLIGHTS = [
  { phrase: 'free rapid health testing', className: 'font-extrabold text-[#5A1E65]' },
  { phrase: 'youth peer programs', className: 'font-extrabold text-slate-950' },
  { phrase: 'safe youth spaces', className: 'font-extrabold text-slate-950' },
  { phrase: 'mutual aid', className: 'font-extrabold text-[#5A1E65]' },
  { phrase: 'intersectional advocacy', className: 'font-extrabold text-purple-800' },
  { phrase: 'LGBTQ+ advocacy', className: 'font-extrabold text-[#5A1E65]' },
  { phrase: 'cultural center', className: 'font-extrabold text-[#5A1E65]' },
  { phrase: 'clinical wellness home', className: 'font-extrabold text-slate-950' },
  { phrase: 'trauma-informed community wellness', className: 'font-extrabold text-slate-950' },
  { phrase: 'all 10 county cities', className: 'font-extrabold text-[#5A1E65]' },
  { phrase: 'every city in Ventura County', className: 'font-extrabold text-[#5A1E65]' }
];

const HERO_HIGHLIGHT_REGEX = new RegExp(
  `(${HERO_SUBTEXT_HIGHLIGHTS.map((h) => h.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'gi'
);

export function renderHighlightedHeroSubtext(text, { dark = false } = {}) {
  const safeText =
    typeof text === 'string' && text.trim() ? text : DEFAULT_HERO_PROPS.description;
  return safeText.split(HERO_HIGHLIGHT_REGEX).map((part, idx) => {
    const match = HERO_SUBTEXT_HIGHLIGHTS.find(
      (h) => h.phrase.toLowerCase() === part.toLowerCase()
    );
    if (match) {
      return (
        <span
          key={idx}
          className={dark ? 'font-extrabold text-purple-200' : match.className}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function LotusIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4c-1.8 3-2.5 6.5-2.5 9.5a2.5 2.5 0 0 0 5 0c0-3-.7-6.5-2.5-9.5z" />
      <path d="M9.5 13.5C7.5 11 5 10 2.5 11c1 3.2 3.2 5.8 7 6.5" />
      <path d="M14.5 13.5C16.5 11 19 10 21.5 11c-1 3.2-3.2 5.8-7 6.5" />
      <path d="M7 17.5c-2.5.8-4.5 0-5.5-1 1.2 2.2 3.8 3 6.5 2" />
      <path d="M17 17.5c2.5.8 4.5 0 5.5-1-1.2 2.2-3.8 3-6.5 2" />
      <path d="M8.5 20c2.3 1 4.7 1 7 0" />
    </svg>
  );
}

function SafeNav({ to, href, previewMode, className, title, children, ...rest }) {
  if (previewMode) {
    return (
      <div role="presentation" className={className} title={title} {...rest}>
        {children}
      </div>
    );
  }
  if (href) {
    return (
      <a href={href} className={className} title={title} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to || '/'} className={className} title={title} {...rest}>
      {children}
    </Link>
  );
}

export function AnimatedFestivalAtmosphere({ themeId }) {
  if (themeId === 'fest-pride') {
    const confettiColors = [
      '#EF4444',
      '#F97316',
      '#FBBF24',
      '#10B981',
      '#06B6D4',
      '#8B5CF6',
      '#F472B6',
      '#38BDF8'
    ];
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, idx) => (
          <span
            key={idx}
            className="absolute -top-6 w-3 h-3 rounded-xs opacity-75 animate-confetti-drift shadow-xs"
            style={{
              backgroundColor: confettiColors[idx % confettiColors.length],
              left: `${idx * 7.5 + 4}%`,
              animationDuration: `${6 + (idx % 5) * 1.2}s`,
              animationDelay: `${(idx % 4) * 1.1}s`,
              transform: `rotate(${idx * 35}deg)`
            }}
          />
        ))}
      </div>
    );
  }

  if (themeId === 'fest-prom') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        {[
          { top: '15%', left: '10%', size: 'text-2xl', delay: '0s' },
          { top: '25%', left: '88%', size: 'text-3xl', delay: '1.2s' },
          { top: '55%', left: '6%', size: 'text-xl', delay: '2.1s' },
          { top: '65%', left: '92%', size: 'text-2xl', delay: '0.8s' },
          { top: '78%', left: '32%', size: 'text-lg', delay: '1.7s' },
          { top: '22%', left: '52%', size: 'text-3xl', delay: '2.6s' },
          { top: '42%', left: '78%', size: 'text-xl', delay: '1.9s' }
        ].map((s, idx) => (
          <span
            key={idx}
            className={`absolute ${s.size} select-none animate-star-twinkle text-amber-300 drop-shadow-md`}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >
            ✨
          </span>
        ))}
      </div>
    );
  }

  if (themeId === 'fest-spirit') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-purple-600/30 via-fuchsia-500/20 to-purple-900/35 blur-3xl animate-glow-pulse" />
      </div>
    );
  }

  if (themeId === 'fest-tvd') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-12 -left-12 w-[32rem] h-[32rem] rounded-full bg-sky-200/50 blur-3xl animate-aurora-drift-1" />
        <div className="absolute -bottom-12 -right-12 w-[32rem] h-[32rem] rounded-full bg-pink-200/50 blur-3xl animate-aurora-drift-2" />
      </div>
    );
  }

  if (themeId === 'fest-world-aids') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-red-400/25 blur-3xl animate-glow-pulse" />
      </div>
    );
  }

  if (themeId === 'fest-coming-out') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-10 left-1/3 w-[34rem] h-[34rem] rounded-full bg-gradient-to-r from-amber-300/30 via-rose-300/25 to-orange-300/30 blur-3xl animate-aurora-drift-1" />
      </div>
    );
  }

  if (themeId === 'fest-lesbian') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-orange-400/25 via-pink-400/20 to-amber-200/30 blur-3xl animate-glow-pulse" />
      </div>
    );
  }

  if (themeId === 'fest-bi') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-10 left-10 w-[30rem] h-[30rem] rounded-full bg-fuchsia-400/25 blur-3xl animate-aurora-drift-1" />
        <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] rounded-full bg-blue-500/25 blur-3xl animate-aurora-drift-2" />
      </div>
    );
  }

  return null;
}

const SERVICE_PATHS = [
  {
    id: 'testing',
    emoji: '🩺',
    label: 'Rapid Testing',
    sub: 'Diversity SHINES',
    badgeClass: 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-500 text-teal-950',
    titleColor: 'text-teal-700',
    msg: 'Free confidential HIV & STI testing every 1st Mon 3:00–7:00 PM. Book online or walk-in.',
    ctaLabel: 'Book Screening Slot',
    to: '/appointments'
  },
  {
    id: 'youth',
    emoji: '🌈',
    label: 'Youth (13–23)',
    sub: 'Rainbow Umbrella',
    badgeClass: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-500 text-amber-950',
    titleColor: 'text-amber-700',
    msg: 'Safe, affirming weekly peer circles, youth mentorship, and creative arts every Friday 5:30–7:30 PM.',
    ctaLabel: 'Join Youth Circle',
    to: '/programs/rainbow-umbrella'
  },
  {
    id: 'hub',
    emoji: '📚',
    label: 'Drop-In Hub',
    sub: 'Library & Lounge',
    badgeClass: 'bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-500 text-purple-950',
    titleColor: 'text-purple-700',
    msg: 'Safe harbor, lending library, free computer workstations, gender-affirming closet, and peer care.',
    ctaLabel: 'Explore Center',
    to: '/programs/community-resource-center'
  },
  {
    id: 'give',
    emoji: '❤️',
    label: 'Give or Join',
    sub: '501(c)(3) Support',
    badgeClass: 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-500 text-rose-950',
    titleColor: 'text-rose-700',
    msg: '100% of tax-deductible gifts directly fund free local screenings, youth programs, and community safety.',
    ctaLabel: 'Support Our Mission',
    to: '/donate'
  }
];

function getHeroContainerStyle(themeId, activeThemeObj) {
  switch (themeId) {
    case 'night':
      return {
        sectionClass: 'bg-[#0B0F19] text-white border-b border-purple-900/60',
        dark: true
      };
    case 'sunset':
      return {
        sectionClass:
          'bg-gradient-to-br from-[#2E0854] via-[#9D174D] to-[#EA580C] text-white border-b border-amber-400/30',
        dark: true
      };
    case 'architectural':
      return {
        sectionClass: 'bg-white text-slate-950 border-b-2 border-slate-900',
        dark: false
      };
    case 'magazine':
      return {
        sectionClass: 'bg-[#FAF6F0] text-slate-950 border-b border-stone-300',
        dark: false
      };
    case 'bento':
      return {
        sectionClass: 'bg-[#F8FAFC] text-slate-950 border-b border-indigo-200/70',
        dark: false
      };
    case 'portal':
      return {
        sectionClass: 'bg-gradient-to-b from-teal-50/70 via-[#FAF7F2] to-white text-slate-950 border-b border-teal-200/70',
        dark: false
      };
    case 'constellation':
      return {
        sectionClass: 'bg-gradient-to-br from-[#F5EEFB] via-white to-emerald-50/70 text-slate-950 border-b border-purple-200',
        dark: false
      };
    case 'dual':
      return {
        sectionClass: 'bg-[#FAF8F5] text-slate-950 border-b border-slate-200',
        dark: false
      };
    default:
      if (activeThemeObj?.category === 'festival') {
        if (themeId === 'fest-prom') {
          return {
            sectionClass:
              'bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E1B4B] text-white border-b border-amber-400/40',
            dark: true
          };
        }
        if (themeId === 'fest-world-aids') {
          return {
            sectionClass: 'bg-gradient-to-br from-rose-50 via-white to-red-50/70 text-slate-950 border-b border-red-200',
            dark: false
          };
        }
        if (themeId === 'fest-tvd') {
          return {
            sectionClass: 'bg-gradient-to-br from-sky-50 via-white to-pink-50 text-slate-950 border-b border-sky-200',
            dark: false
          };
        }
        if (themeId === 'fest-lesbian') {
          return {
            sectionClass: 'bg-gradient-to-br from-orange-50 via-[#FFF7ED] to-pink-50 text-slate-950 border-b border-orange-200',
            dark: false
          };
        }
        if (themeId === 'fest-bi') {
          return {
            sectionClass: 'bg-gradient-to-br from-fuchsia-50 via-purple-50 to-blue-50 text-slate-950 border-b border-fuchsia-200',
            dark: false
          };
        }
        if (themeId === 'fest-spirit') {
          return {
            sectionClass: 'bg-gradient-to-br from-purple-100/70 via-fuchsia-50 to-purple-50 text-slate-950 border-b border-purple-300',
            dark: false
          };
        }
        return {
          sectionClass: 'bg-gradient-to-br from-amber-50/60 via-[#FAF7F2] to-purple-50/70 text-slate-950 border-b border-purple-200/70',
          dark: false
        };
      }
      return {
        sectionClass: 'bg-[#FAF7F2] text-slate-950 border-b border-purple-200/60',
        dark: false
      };
  }
}

export default function HeroShowcase({
  themeId = 'aurora',
  heroProps = {},
  centerStatus = null,
  sectionStyle = undefined,
  previewMode = false,
  compact = false,
  viewport: propViewport = undefined,
  onTriggerConfetti = undefined,
  afterWaveContent = null
}) {
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const urlViewport = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('viewport')
    : null;

  const effectiveViewport = propViewport || urlViewport || (
    windowWidth < 768 ? 'mobile' : windowWidth < 1024 ? 'tablet' : 'desktop'
  );

  const isMobile = effectiveViewport === 'mobile' || compact || windowWidth < 768;
  const isTablet = effectiveViewport === 'tablet' || (windowWidth >= 768 && windowWidth < 1024 && effectiveViewport !== 'mobile');
  const [heroService, setHeroService] = useState('testing');
  const activeThemeObj = resolveHeroTheme(themeId);
  const resolvedId = activeThemeObj.id;
  const isSpotlight = resolvedId === 'spotlight' || resolvedId === 'default';
  const isFestival = activeThemeObj.category === 'festival';

  const rawMerged = { ...DEFAULT_HERO_PROPS, ...(heroProps || {}) };
  const merged = {};
  for (const [k, v] of Object.entries(rawMerged)) {
    merged[k] = sanitizeSanctuaryText(v);
  }
  const idPrefix = previewMode ? 'preview' : 'live';
  const themeStyle = getHeroContainerStyle(resolvedId, activeThemeObj);
  const isDark = themeStyle.dark;

  const statusHeadline = centerStatus?.isOpenNow
    ? 'Center Open Now'
    : merged.statusHeadline || 'Center Open Today';
  const statusSchedule = merged.statusSchedule || 'Mon–Fri 1:00 PM – 5:00 PM';
  const statusTag = merged.statusTag || 'HIV/STI Screenings 1st Mon 3–7 PM';
  const helplineText = merged.helplineText || 'Helpline: (805) 644-5428 · 24/7 Crisis: Dial 988';
  const auroraPhoto = merged.photoUrl || '/images/volunteers.jpg';
  const spotlightPhoto = merged.spotlightImage || merged.photoUrl || '/images/community-gathering.jpg';
  const primaryLink = merged.primaryCtaUrl || merged.primaryCtaLink || '/programs';
  const secondaryLink = merged.secondaryCtaUrl || merged.secondaryCtaLink || '/contact';
  const emailAddr = merged.emailAddress || 'info@diversitycollective.org';
  const activeServiceObj = SERVICE_PATHS.find((s) => s.id === heroService) || SERVICE_PATHS[0];

  const renderAuroraHeadline = ({ compactSize = false, darkMode = isDark } = {}) => {
    const isComp = compactSize || isMobile;
    return (
      <h1
        className={`font-display ${
          isComp
            ? 'text-2xl leading-tight'
            : isTablet
            ? 'text-3xl sm:text-4xl'
            : previewMode
            ? 'text-3xl sm:text-4xl lg:text-5xl xl:text-[3.5rem]'
            : 'text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-[4.25rem] xl:text-[4.85rem]'
        } font-black tracking-tight ${
          darkMode ? 'text-white' : 'text-slate-950'
        } leading-[1.08] sm:leading-[1.04] max-w-full break-normal [overflow-wrap:normal]`}
      >
      <span className="block max-w-full break-normal">{merged.titleLine1}</span>
      <span className="block mt-1 sm:mt-1.5 max-w-full">
        <span
          className={`font-serif italic font-semibold tracking-[-0.015em] ${
            darkMode
              ? 'bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300'
              : 'animate-liquid-flow'
          } bg-clip-text text-transparent relative inline max-w-full break-normal mr-2.5 sm:mr-3.5 pb-1 sm:pb-1.5`}
        >
          {merged.titleAccentWord}
          <svg
            className="absolute -bottom-1 sm:-bottom-1.5 left-0 w-full h-2 sm:h-3 overflow-visible pointer-events-none"
            viewBox="0 0 100 8"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`${idPrefix}-headline-bend`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={darkMode ? '#FDE047' : '#C026D3'} stopOpacity="0.95" />
                <stop offset="50%" stopColor="#EC4899" stopOpacity="0.95" />
                <stop offset="100%" stopColor={darkMode ? '#22D3EE' : '#F59E0B'} stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d="M 1 2 Q 50 7, 99 2"
              stroke={`url(#${idPrefix}-headline-bend)`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </span>
        <span className={`font-display font-black inline max-w-full break-normal ${darkMode ? 'text-white' : 'text-slate-950'}`}>
          {merged.titleLine2}
        </span>
      </span>
    </h1>
  );
};

  const renderStandardCtas = ({ horizontal = false, darkMode = isDark } = {}) => {
    if (horizontal) {
      return (
        <div className="flex flex-wrap items-center gap-3 pt-1 relative z-20">
          <SafeNav
            previewMode={previewMode}
            to={primaryLink}
            className="inline-flex items-center justify-center gap-2 text-sm font-extrabold !text-white text-white bg-gradient-to-r from-[#5A1E65] via-purple-700 to-indigo-600 hover:from-purple-900 hover:to-indigo-700 py-3 sm:py-3.5 px-6 sm:px-7 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer max-w-full text-center"
          >
            <span className="!text-white text-white font-extrabold truncate max-w-[220px] sm:max-w-none">{merged.primaryCtaText}</span>
            <ArrowRight className="w-4 h-4 !text-white text-white shrink-0" />
          </SafeNav>

          <SafeNav
            previewMode={previewMode}
            to={secondaryLink}
            className={`inline-flex items-center justify-center gap-2 text-sm font-extrabold py-3 sm:py-3.5 px-5 sm:px-6 rounded-full border-2 transition-all cursor-pointer max-w-full text-center ${
              darkMode
                ? 'bg-white/15 hover:bg-white/25 text-white border-white/30'
                : 'text-slate-800 bg-white hover:bg-purple-50/50 border-purple-200/90 shadow-2xs hover:shadow-sm hover:border-purple-400'
            }`}
          >
            <MapPin className={`w-4 h-4 shrink-0 ${darkMode ? 'text-amber-300' : 'text-[#5A1E65]'}`} />
            <span className="truncate max-w-[200px] sm:max-w-none">{merged.secondaryCtaText}</span>
          </SafeNav>

          <SafeNav
            previewMode={previewMode}
            href={`mailto:${emailAddr}?subject=Community%20Inquiry%20-%20Diversity%20Collective`}
            aria-label="Send us an email"
            title="Send us an email"
            className={`inline-flex items-center justify-center gap-2 text-sm font-extrabold py-3 sm:py-3.5 px-6 sm:px-7 rounded-full border-2 transition-all cursor-pointer max-w-full text-center ${
              darkMode
                ? 'border-white/30 bg-white/10 text-amber-300 hover:bg-white/20'
                : 'border-purple-200/90 bg-white hover:bg-purple-50 hover:border-[#5A1E65] text-[#5A1E65] shadow-2xs hover:shadow-sm'
            }`}
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate max-w-[180px] sm:max-w-none">Send us an email</span>
          </SafeNav>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full max-w-full md:max-w-2xl pt-1 relative z-30">
        <SafeNav
          previewMode={previewMode}
          to={primaryLink}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-sm sm:text-base font-extrabold !text-white text-white bg-gradient-to-r from-[#5A1E65] via-[#8B1A8F] via-[#C026D3] to-[#7C3AED] hover:from-[#4A0E4F] hover:to-[#6D28D9] active:scale-[0.99] py-3.5 sm:py-4 px-5 sm:px-7 rounded-full shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-700/40 hover:scale-[1.01] transition-all text-center group btn-shimmer cursor-pointer"
        >
          <span className="!text-white text-white font-extrabold break-words max-w-full text-center">{merged.primaryCtaText}</span>
          <ArrowRight className="w-4 h-4 !text-white text-white group-hover:translate-x-1.5 transition-transform shrink-0" />
        </SafeNav>

        <SafeNav
          previewMode={previewMode}
          to={secondaryLink}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-sm sm:text-base font-extrabold text-slate-800 bg-white/95 hover:bg-white active:scale-[0.99] py-3.5 sm:py-4 px-5 sm:px-7 rounded-full border-2 border-purple-200/90 hover:border-purple-400 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all text-center group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#5A1E65]" />
          </div>
          <span className="break-words max-w-full text-center">{merged.secondaryCtaText}</span>
        </SafeNav>

        <SafeNav
          previewMode={previewMode}
          href={`mailto:${emailAddr}?subject=Community%20Inquiry%20-%20Diversity%20Collective`}
          aria-label="Send us an email"
          title="Send us an email"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-sm sm:text-base font-extrabold text-[#5A1E65] bg-white/95 hover:bg-purple-50 active:scale-[0.99] py-3.5 sm:py-4 px-5 sm:px-7 rounded-full border-2 border-purple-200/90 hover:border-[#5A1E65] shadow-xs hover:shadow-md hover:scale-[1.01] transition-all text-center group cursor-pointer"
        >
          <Mail className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
          <span className="break-words max-w-full text-center">Send us an email</span>
        </SafeNav>
      </div>
    );
  };

  return (
    <section
      style={sectionStyle}
      className={`relative overflow-hidden pt-3 sm:pt-6 w-full max-w-full ${themeStyle.sectionClass}`}
    >
      {/* Back Aurora Atmosphere (for Aurora & Spotlight defaults) */}
      {(resolvedId === 'aurora' || isSpotlight) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div
            className="absolute -top-24 -left-20 w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/15 to-transparent blur-3xl animate-pulse"
            style={{ animationDuration: '7s' }}
          />
          <div className="absolute -top-20 -right-20 w-[42rem] h-[42rem] rounded-full bg-gradient-to-bl from-amber-400/30 via-rose-400/25 to-purple-400/20 blur-3xl animate-aurora-drift-1" />
          <div className="absolute bottom-10 left-1/4 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-teal-400/20 via-sky-400/18 to-transparent blur-3xl animate-aurora-drift-2" />

          <svg className="w-full h-full min-h-[500px] opacity-40 sm:opacity-50 lg:opacity-80" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`${idPrefix}-aurora-stream-back`} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.55" />
                <stop offset="25%" stopColor="#FB7185" stopOpacity="0.5" />
                <stop offset="55%" stopColor="#D946EF" stopOpacity="0.45" />
                <stop offset="80%" stopColor="#8B5CF6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d="M 1440,0 C 1200,80 1000,240 920,440 C 840,640 680,780 400,850 C 200,890 0,900 0,900 L 1440,900 Z"
              fill={`url(#${idPrefix}-aurora-stream-back)`}
            />
          </svg>
        </div>
      )}

      {/* Main Content Container */}
      <div className={`container-clean relative z-20 flex flex-col w-full max-w-full overflow-x-clip ${compact ? 'gap-4 px-4 sm:px-6' : 'gap-5 sm:gap-6 md:gap-7'}`}>
        {/* Top Center Command Bar (Shown on Core Designs except Dual/Magazine where inline) */}
        {!isFestival && (
          isSpotlight ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs w-full">
              <SafeNav
                previewMode={previewMode}
                to="/programs/community-resource-center"
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 hover:bg-white border border-purple-200/90 font-bold text-[#5A1E65] shadow-xs hover:border-purple-400 transition-colors cursor-pointer"
                title="View Community Resource Center hours and free clinical services"
              >
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>{`${statusHeadline} · ${statusSchedule} · ${statusTag}`}</span>
              </SafeNav>

              <div className="hidden sm:inline-flex items-center gap-2 text-slate-700 bg-white/90 px-4 py-1.5 rounded-full border border-purple-200/70 text-xs font-semibold shadow-2xs">
                <Phone className="w-3.5 h-3.5 text-purple-700" />
                <span>{helplineText}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-start w-full max-w-full min-w-0">
              <SafeNav
                previewMode={previewMode}
                data-no-autofit="true"
                to="/programs/community-resource-center"
                className={`hero-status-pill group inline-flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 shadow-md transition-all cursor-pointer w-fit max-w-full ${
                  isMobile ? 'whitespace-normal max-w-[calc(100%-8px)]' : 'whitespace-nowrap'
                } ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 border-white/25 text-white'
                    : 'bg-white/95 hover:bg-white border-purple-200/90 hover:border-purple-400 shadow-purple-500/10'
                }`}
                title="View Community Resource Center hours and free clinical services"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-full">
                  <span className="relative flex h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]"></span>
                  </span>
                  <span className={`text-xs sm:text-sm font-bold leading-snug ${isMobile ? 'truncate max-w-[290px]' : 'whitespace-nowrap truncate'} block min-w-0`}>
                    <strong className={isDark ? 'text-emerald-300 font-extrabold' : centerStatus?.isOpenNow ? 'text-emerald-700 font-extrabold' : 'text-[#5A1E65] font-extrabold'}>
                      {statusHeadline}
                    </strong>{' '}
                    <span className="text-rose-400 font-black">•</span>{' '}
                    <span className={isDark ? 'text-white/90 font-bold' : 'text-slate-900 font-bold'}>{statusSchedule}</span>{' '}
                    <span className="text-amber-500 font-black">•</span>{' '}
                    <strong className={isDark ? 'text-amber-300 font-extrabold' : 'bg-gradient-to-r from-[#5A1E65] via-rose-600 to-indigo-700 bg-clip-text text-transparent font-extrabold'}>
                      {statusTag}
                    </strong>
                  </span>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isDark ? 'bg-white/20 text-white' : 'bg-purple-100/80 group-hover:bg-[#5A1E65]'}`}>
                  <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-purple-800 group-hover:text-white'} group-hover:translate-x-0.5 transition-all`} />
                </div>
              </SafeNav>
            </div>
          )
        )}

        {/* ================================================================
            DESIGN 1: FLAGSHIP AURORA RIBBON (Live Production Default)
           ================================================================ */}
        {resolvedId === 'aurora' && (
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-6 lg:gap-8 xl:gap-10 items-center`}>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-7 xl:col-span-6'} flex flex-col justify-center gap-5 sm:gap-6 z-10 pb-6 sm:pb-8 lg:pb-12`}>
              <div className="flex flex-col gap-2.5 sm:gap-3.5 max-w-full">
                <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-900 self-start max-w-full break-words">
                  <span className="max-w-full break-words">{merged.eyebrow}</span>
                </div>
                {renderAuroraHeadline({ compactSize: compact })}
                <p className="text-[15.5px] sm:text-[17px] md:text-[1.16rem] text-slate-900 leading-[1.68] font-semibold tracking-[-0.01em] max-w-full sm:max-w-xl pt-1 antialiased break-words">
                  {renderHighlightedHeroSubtext(merged.subtitle || merged.description)}
                </p>
              </div>
              {renderStandardCtas({ horizontal: false })}
            </div>

            <div className={`${isMobile ? 'w-full' : 'lg:col-span-5 xl:col-span-6'} relative flex flex-col justify-center`}>
              <div className="relative z-10 w-full select-none">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/25 via-pink-400/25 to-amber-300/30 blur-2xl pointer-events-none rounded-3xl" />
                <div className="relative w-full rounded-3xl sm:rounded-[2.25rem] overflow-hidden bg-slate-100 shadow-xl border-2 border-white/80 group">
                  <img
                    src={auroraPhoto}
                    alt="Diversity Collective Ventura County community volunteers"
                    className={`w-full ${isMobile ? 'h-52' : 'min-h-[280px] sm:min-h-[360px] lg:min-h-[440px]'} object-cover group-hover:scale-105 transition-transform duration-700 ease-out`}
                    onError={(e) => {
                      e.target.src = '/images/community-gathering.jpg';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 2: CIVIC CENTER & 3D SPOTLIGHT PATHFINDER
           ================================================================ */}
        {isSpotlight && (
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-8 lg:gap-12 items-center pb-8 sm:pb-12 z-10`}>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-7'} flex flex-col gap-6 z-10`}>
              <div className="flex flex-col gap-3 sm:gap-3.5">
                <span className="inline-flex items-center text-[11px] sm:text-xs font-bold text-[#5A1E65] py-1 px-3.5 bg-purple-50/95 border border-purple-200/90 rounded-full shadow-2xs self-start">
                  {merged.eyebrow}
                </span>
                {renderAuroraHeadline({ compactSize: compact })}
                <p className="text-[15.5px] sm:text-[17px] md:text-[1.15rem] text-slate-900 leading-[1.68] font-semibold tracking-[-0.01em] max-w-xl pt-1 antialiased">
                  {renderHighlightedHeroSubtext(merged.subtitle || merged.description)}
                </p>
              </div>

              {renderStandardCtas({ horizontal: true })}

              <div className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-purple-100 shadow-md flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>Instant Center Navigator — What Brings You In Today?</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    100% Confidential
                  </span>
                </div>

                <div className="overflow-x-auto snap-x scrollbar-hide flex flex-row gap-2 snap-start pb-2 md:overflow-visible md:snap-none md:pb-0 md:grid md:grid-cols-2 md:sm:grid-cols-4 md:gap-2">
                  {SERVICE_PATHS.map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setHeroService(svc.id)}
                      className={`snap-start min-w-[110px] flex-shrink-0 p-2.5 rounded-xl text-left transition-all border-2 text-xs font-semibold cursor-pointer ${
                        heroService === svc.id
                          ? `${svc.badgeClass} shadow-sm`
                          : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <div className={`font-extrabold flex items-center gap-1.5 ${svc.titleColor}`}>
                        <span>{svc.emoji}</span>
                        <span className="truncate">{svc.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5 truncate">{svc.sub}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700">{activeServiceObj.msg}</span>
                  <SafeNav
                    previewMode={previewMode}
                    to={activeServiceObj.to}
                    className={`font-extrabold ${activeServiceObj.titleColor} inline-flex items-center gap-1 whitespace-nowrap cursor-pointer`}
                  >
                    <span>{activeServiceObj.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </SafeNav>
                </div>
              </div>
            </div>

            <div className={`${isMobile ? 'w-full' : 'lg:col-span-5'} relative z-20`}>
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-rose-500 via-amber-400 to-teal-500 rounded-3xl blur-2xl opacity-35 pointer-events-none" aria-hidden="true" />
              <CardSpotlight
                className="glass-card rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-2xl border-2 border-purple-200/90 relative"
                tilt={false}
                maxTilt={0}
                scale={1}
                glare={false}
                spotlightColor="transparent"
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src={spotlightPhoto}
                    alt="Diversity Collective Ventura County community members gathering"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/hero-community.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-white text-xs pointer-events-none">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                      <MapPin className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                      <span className="font-semibold text-white drop-shadow-md text-[11px] sm:text-xs">
                        {merged.locationBadge}
                      </span>
                    </div>
                    <span className="text-emerald-300 drop-shadow-md font-bold text-[11px] bg-emerald-950/85 px-2.5 py-1 rounded-full border border-emerald-400/50 shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Open Today
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white p-1 border-2 border-purple-100 shadow-sm flex items-center justify-center flex-shrink-0">
                      <img src="/images/logo-square.png" alt="Diversity Collective Emblem" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">{merged.cardTitle}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{merged.cardSubtitle}</p>
                    </div>
                  </div>
                  <SafeNav
                    previewMode={previewMode}
                    to="/programs/community-resource-center"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#5A1E65] p-2 hover:bg-purple-50 rounded-lg cursor-pointer"
                  >
                    <span>About Us</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </SafeNav>
                </div>
              </CardSpotlight>
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 3: CENTER NAVIGATOR PORTAL (Triage Grid Hero)
           ================================================================ */}
        {resolvedId === 'portal' && (
          <div className="pb-10 space-y-8 z-10">
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-8 items-center`}>
              <div className={`${isMobile ? 'w-full' : 'lg:col-span-7'} space-y-4`}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300 text-xs font-extrabold">
                  <Stethoscope className="w-3.5 h-3.5" /> CENTER NAVIGATOR PORTAL
                </span>
                {renderAuroraHeadline({ compactSize: compact })}
                <p className="text-base text-slate-700 font-semibold max-w-2xl">
                  {renderHighlightedHeroSubtext(merged.subtitle || merged.description)}
                </p>
                {renderStandardCtas({ horizontal: true })}
              </div>
              <div className={`${isMobile ? 'w-full' : 'lg:col-span-5'} overflow-x-auto snap-x scrollbar-hide flex flex-row gap-3 snap-start pb-2 md:overflow-visible md:snap-none md:pb-0`}>
                {SERVICE_PATHS.map((svc) => (
                  <SafeNav
                    key={svc.id}
                    previewMode={previewMode}
                    to={svc.to}
                    className={`snap-start min-w-[140px] flex-shrink-0 p-4 rounded-2xl border-2 ${svc.badgeClass} shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{svc.emoji}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-70" />
                    </div>
                    <div>
                      <p className={`text-sm font-black ${svc.titleColor}`}>{svc.label}</p>
                      <p className="text-[11px] font-medium opacity-80">{svc.sub}</p>
                    </div>
                  </SafeNav>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 4: BENTO EDITORIAL GRID
           ================================================================ */}
        {resolvedId === 'bento' && (
          <div className={`pb-10 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-4 z-10`}>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-7'} p-6 sm:p-8 rounded-3xl bg-white border border-indigo-200 shadow-sm flex flex-col justify-between gap-5`}>
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-black uppercase tracking-wider">
                  {merged.eyebrow}
                </span>
                {renderAuroraHeadline({ compactSize: true })}
                <p className="text-sm sm:text-base text-slate-700 font-medium">
                  {renderHighlightedHeroSubtext(merged.subtitle || merged.description)}
                </p>
              </div>
              {renderStandardCtas({ horizontal: true })}
            </div>

            <div className={`${isMobile ? 'w-full' : 'lg:col-span-5'} grid grid-rows-2 gap-4`}>
              <div className="rounded-3xl overflow-hidden border border-indigo-200 relative min-h-[190px] bg-slate-900">
                <img src={spotlightPhoto} alt="Community" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-xs text-white text-xs font-bold flex items-center justify-between">
                  <span className="truncate">📍 {merged.locationBadge}</span>
                  <span className="text-emerald-300 shrink-0">Open Today</span>
                </div>
              </div>
              <div className="overflow-x-auto snap-x scrollbar-hide flex flex-row gap-4 snap-start pb-2 md:overflow-visible md:snap-none md:pb-0 md:grid md:grid-cols-2 md:gap-4">
                <div className="snap-start min-w-[200px] flex-shrink-0 p-4 rounded-3xl bg-gradient-to-br from-[#5A1E65] to-indigo-700 text-white flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">24/7 Helpline</span>
                  <p className="text-sm font-black leading-snug">{helplineText}</p>
                </div>
                <div className="p-4 rounded-3xl bg-amber-100 border border-amber-300 text-slate-950 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">{merged.cardTitle}</span>
                  <p className="text-xs font-bold text-slate-800">{merged.cardSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 5: COMMUNITY STORY MOSAIC
           ================================================================ */}
        {resolvedId === 'mosaic' && (
          <div className="pb-10 space-y-6 text-center z-10">
            <div className="max-w-3xl mx-auto space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-200 text-xs font-black uppercase tracking-wider">
                {merged.eyebrow}
              </span>
              {renderAuroraHeadline({ compactSize: compact })}
              <p className="text-base text-slate-700 font-semibold">
                {renderHighlightedHeroSubtext(merged.subtitle || merged.description)}
              </p>
              <div className="flex justify-center">
                {renderStandardCtas({ horizontal: true })}
              </div>
            </div>
            <div className={`overflow-x-auto snap-x scrollbar-hide flex flex-row gap-4 snap-start pb-2 md:grid md:grid-cols-1 md:flex-col md:overflow-visible md:snap-none md:pb-0 sm:grid sm:grid-cols-3 sm:gap-4`}>
              {[auroraPhoto, '/images/community-gathering.jpg', '/images/youth-umbrella.jpg'].map((imgUrl, idx) => (
                <div key={idx} className="snap-start min-w-[260px] sm:min-w-auto sm:flex-none rounded-3xl overflow-hidden border-2 border-white shadow-lg aspect-[4/3] bg-slate-100 flex-shrink-0">
                  <img
                    src={imgUrl}
                    alt={`Community moment ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/community-gathering.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 6: MODERN ARCHITECTURAL SPLIT
           ================================================================ */}
        {resolvedId === 'architectural' && (
          <div className={`pb-10 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} border-t-2 border-slate-900 pt-6 gap-6 items-stretch z-10`}>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-7 pr-0 lg:pr-8 lg:border-r-2 lg:border-slate-900'} flex flex-col justify-between gap-5`}>
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-slate-600 block">
                  [ {merged.eyebrow} ]
                </span>
                {renderAuroraHeadline({ compactSize: compact })}
                <p className="text-base text-slate-800 font-medium border-l-4 border-[#5A1E65] pl-4">
                  {renderHighlightedHeroSubtext(merged.subtitle || merged.description)}
                </p>
              </div>
              {renderStandardCtas({ horizontal: true })}
            </div>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-5'} flex flex-col gap-3`}>
              <div className="flex-1 rounded-2xl overflow-hidden border-2 border-slate-900 min-h-[260px]">
                <img src={auroraPhoto} alt="Architectural center view" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-bold">
                <span>{merged.locationBadge}</span>
                <span className="text-amber-300">{statusSchedule}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 7: PRISMATIC SUNSET (High-Contrast Dark Gradient + Polaroid)
           ================================================================ */}
        {resolvedId === 'sunset' && (
          <div className={`pb-12 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-8 items-center z-10`}>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-7'} space-y-5`}>
              <span className="inline-block px-3.5 py-1 rounded-full bg-white/15 border border-white/30 text-amber-200 text-xs font-extrabold uppercase tracking-wider">
                {merged.eyebrow}
              </span>
              {renderAuroraHeadline({ compactSize: compact, darkMode: true })}
              <p className="text-base text-purple-100 font-medium max-w-xl leading-relaxed">
                {renderHighlightedHeroSubtext(merged.subtitle || merged.description, { dark: true })}
              </p>
              {renderStandardCtas({ horizontal: true, darkMode: true })}
            </div>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-5'} flex justify-center`}>
              <div className="p-3 pb-5 bg-white rounded-3xl shadow-2xl rotate-2 max-w-md w-full border-4 border-amber-200">
                <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                  <img src={auroraPhoto} alt="Prismatic Sunset Community" className="w-full h-full object-cover" />
                </div>
                <div className="pt-3 px-2 flex items-center justify-between text-slate-900">
                  <span className="font-display font-black text-sm">{merged.cardTitle}</span>
                  <span className="text-xs font-bold text-[#5A1E65]">Ventura County</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 8: CULTURAL MAGAZINE MASTHEAD
           ================================================================ */}
        {resolvedId === 'magazine' && (
          <div className="pb-10 space-y-6 z-10">
            <div className="border-y-2 border-slate-900 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-serif">
              <span className="font-black uppercase tracking-[0.25em] text-slate-900">DISPATCH · VENTURA COUNTY</span>
              <span className="italic text-[#5A1E65] font-semibold">{merged.eyebrow}</span>
              <span className="font-mono text-slate-600">{statusSchedule}</span>
            </div>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-8 items-center`}>
              <div className={`${isMobile ? 'w-full' : 'lg:col-span-6'} space-y-4`}>
                {renderAuroraHeadline({ compactSize: compact })}
                <p className="font-serif text-lg text-slate-800 leading-relaxed">
                  {renderHighlightedHeroSubtext(merged.subtitle || merged.description)}
                </p>
                {renderStandardCtas({ horizontal: true })}
              </div>
              <div className={`${isMobile ? 'w-full' : 'lg:col-span-6'}`}>
                <div className="rounded-2xl overflow-hidden border border-stone-400 shadow-xl aspect-[16/10]">
                  <img src={spotlightPhoto} alt="Editorial Feature" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 9: CONSTELLATION HUB (Orbiting Service Pills)
           ================================================================ */}
        {resolvedId === 'constellation' && (
          <div className={`pb-10 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-8 items-center z-10`}>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-7'} space-y-4`}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold">
                <Sparkles className="w-3.5 h-3.5" /> {merged.eyebrow}
              </span>
              {renderAuroraHeadline({ compactSize: compact })}
              <p className="text-base text-slate-800 font-semibold">
                {renderHighlightedHeroSubtext(merged.subtitle || merged.description)}
              </p>
              {renderStandardCtas({ horizontal: true })}
            </div>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-5'} overflow-x-auto snap-x scrollbar-hide flex flex-row gap-3 snap-start pb-2 md:overflow-visible md:snap-none md:pb-0`}>
              {SERVICE_PATHS.map((svc, idx) => (
                <SafeNav
                  key={svc.id}
                  previewMode={previewMode}
                  to={svc.to}
                  className={`snap-start min-w-[160px] flex-shrink-0 p-4 rounded-full border-2 ${svc.badgeClass} shadow-md flex items-center gap-3 hover:scale-[1.02] transition-transform cursor-pointer ${
                    idx % 2 === 1 ? 'mt-2' : ''
                  }`}
                >
                  <span className="text-2xl">{svc.emoji}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-black truncate ${svc.titleColor}`}>{svc.label}</p>
                    <p className="text-[10px] font-semibold opacity-75 truncate">{svc.sub}</p>
                  </div>
                </SafeNav>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 10: LUMINOUS NIGHT CENTER (Obsidian Dark Mode)
           ================================================================ */}
        {resolvedId === 'night' && (
          <div className={`pb-12 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-8 items-center z-10 relative`}>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-7'} space-y-5`}>
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/90 border border-purple-500/50 text-purple-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {merged.eyebrow}
              </span>
              {renderAuroraHeadline({ compactSize: compact, darkMode: true })}
              <p className="text-base text-slate-300 leading-relaxed max-w-xl">
                {renderHighlightedHeroSubtext(merged.subtitle || merged.description, { dark: true })}
              </p>
              {renderStandardCtas({ horizontal: true, darkMode: true })}
            </div>
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-5'} relative`}>
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-purple-500 via-cyan-400 to-rose-500 opacity-55 blur-xl" />
              <div className="relative rounded-3xl overflow-hidden border border-purple-400/40 bg-slate-950 shadow-2xl aspect-[4/3]">
                <img src={auroraPhoto} alt="Night Center" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            DESIGN 11: DUAL CARE & PRIDE DECISION SPLIT
           ================================================================ */}
        {resolvedId === 'dual' && (
          <div className="pb-10 space-y-6 z-10">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-[#5A1E65]">{merged.eyebrow}</span>
              {renderAuroraHeadline({ compactSize: compact })}
            </div>
            <div className={`overflow-x-auto snap-x scrollbar-hide flex flex-row gap-5 snap-start pb-2 md:grid md:grid-cols-1 md:flex-col md:overflow-visible md:snap-none md:pb-0 md:md:grid-cols-2 md:gap-5`}>
              <div className="snap-start min-w-[280px] sm:min-w-auto sm:flex-none p-6 rounded-3xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white shadow-lg flex flex-col justify-between gap-4 flex-shrink-0">
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-teal-200">Pathway 01 · Free Confidential Support</span>
                  <h3 className="font-display text-2xl font-black">I Need Care & Safe Harbor</h3>
                  <p className="text-xs text-teal-100 leading-relaxed">
                    Free rapid HIV/STI testing, youth peer groups (13–23), adult support, and direct drop-in care.
                  </p>
                </div>
                <SafeNav
                  previewMode={previewMode}
                  to={primaryLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-teal-900 font-black text-xs self-start cursor-pointer"
                >
                  <span>{merged.primaryCtaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </SafeNav>
              </div>
              <div className="snap-start min-w-[280px] sm:min-w-auto sm:flex-none p-6 rounded-3xl bg-gradient-to-br from-[#5A1E65] to-indigo-800 text-white shadow-lg flex flex-col justify-between gap-4 flex-shrink-0">
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">Pathway 02 · Solidarity & Joy</span>
                  <h3 className="font-display text-2xl font-black">I Want to Celebrate & Give</h3>
                  <p className="text-xs text-purple-100 leading-relaxed">
                    Visit our Ventura center, volunteer for Pride Festival, or fuel zero-fee 501(c)(3) mutual aid.
                  </p>
                </div>
                <SafeNav
                  previewMode={previewMode}
                  to={secondaryLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FDE047] text-slate-950 font-black text-xs self-start cursor-pointer"
                >
                  <span>{merged.secondaryCtaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </SafeNav>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            SEASONAL & LGBTQ+ FESTIVAL HEROES (12..19)
           ================================================================ */}
        {isFestival && (
          <div className="relative py-4 sm:py-6 flex flex-col gap-6">
            <AnimatedFestivalAtmosphere themeId={resolvedId} />
            <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900 text-white text-xs font-bold shadow-md">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>{activeThemeObj.badge}</span>
                <span className="text-purple-300">•</span>
                <span className="text-purple-200 font-medium">{activeThemeObj.eventDates}</span>
              </div>
              {onTriggerConfetti && !previewMode && (
                <button
                  type="button"
                  onClick={onTriggerConfetti}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-[#5A1E65] bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-full transition-all cursor-pointer shadow-2xs"
                  title="Celebrate this community milestone with confetti!"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Celebrate Event 🎉</span>
                </button>
              )}
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-6 items-center relative z-10`}>
              <div className={`${isMobile ? 'w-full' : 'lg:col-span-8'} flex flex-col gap-3`}>
                <span className={`text-xs font-extrabold tracking-[0.2em] uppercase block ${isDark ? 'text-amber-300' : 'text-[#5A1E65]'}`}>
                  SPECIAL EVENT SEASON · {merged.eyebrow}
                </span>
                <h1 className={`font-fraunces ${isMobile ? 'text-2xl sm:text-4xl' : isTablet ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-3xl sm:text-5xl md:text-6xl'} font-bold tracking-tight leading-[1.1] ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {activeThemeObj.headline}
                </h1>
                <p className={`text-base sm:text-lg leading-relaxed font-semibold pt-1 antialiased ${isDark ? 'text-purple-100' : 'text-slate-900'}`}>
                  {renderHighlightedHeroSubtext(activeThemeObj.description, { dark: isDark })}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <SafeNav
                    previewMode={previewMode}
                    to="/events"
                    className="btn-primary py-3 px-6 text-sm font-bold shadow-md inline-flex items-center gap-2 group cursor-pointer"
                  >
                    <span>View Event Calendar & Schedules</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </SafeNav>
                  <SafeNav
                    previewMode={previewMode}
                    to="/volunteer"
                    className="btn-secondary py-3 px-5 text-sm font-bold bg-white inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Volunteer at Event</span>
                  </SafeNav>
                  <SafeNav
                    previewMode={previewMode}
                    to="/donate"
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-950 bg-[#FDE047] hover:bg-[#FACC15] rounded-full border border-amber-300 shadow-sm transition-all cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-current text-slate-950" />
                    <span>Support Event Fund</span>
                  </SafeNav>
                </div>
              </div>

              <div className={`${isMobile ? 'w-full' : 'lg:col-span-4'}`}>
                <div className="rounded-3xl overflow-hidden border-2 border-white/80 shadow-xl aspect-[4/3] bg-slate-900">
                  <img src={auroraPhoto} alt={activeThemeObj.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          FULL-BLEED FOREGROUND AURORA WAVE CROSSOVER
         ================================================================ */}
      {!isFestival && (resolvedId === 'aurora' || isSpotlight) && (
        <div className={`relative w-full ${compact ? '-mt-4' : '-mt-6 sm:-mt-8 md:-mt-12 lg:-mt-16'} pointer-events-none z-10 overflow-hidden leading-none select-none`}>
          <svg
            className={`w-full ${compact ? 'h-16 sm:h-24' : 'h-28 sm:h-36 md:h-48 lg:h-56 xl:h-64'} block filter drop-shadow-[0_-10px_25px_rgba(217,70,239,0.35)]`}
            viewBox="0 0 1440 220"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`${idPrefix}-vibrant-wave-amber`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.88" />
                <stop offset="35%" stopColor="#FB7185" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#C084FC" stopOpacity="0.80" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-vibrant-wave-magenta`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="0.95" />
                <stop offset="30%" stopColor="#EC4899" stopOpacity="0.92" />
                <stop offset="65%" stopColor="#A855F7" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.88" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-vibrant-wave-cyan`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.90" />
                <stop offset="35%" stopColor="#06B6D4" stopOpacity="0.88" />
                <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.82" />
              </linearGradient>
            </defs>

            <g className="animate-ribbon-base">
              <path
                d="M -100,170 C 180,180 460,140 740,105 C 1020,70 1260,65 1540,95 L 1540,225 L -100,225 Z"
                fill={`url(#${idPrefix}-vibrant-wave-amber)`}
              />
            </g>
            <g className="animate-ribbon-undulate">
              <path
                d="M -100,145 C 160,155 430,110 710,75 C 970,42 1220,40 1540,70 L 1540,225 L -100,225 Z"
                fill={`url(#${idPrefix}-vibrant-wave-magenta)`}
              />
              <path
                d="M -100,145 C 160,155 430,110 710,75 C 970,42 1220,40 1540,70"
                stroke="rgba(255, 255, 255, 0.95)"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            <g className="animate-ribbon-wave-slow">
              <path
                d="M -100,180 C 200,190 480,150 760,115 C 1040,82 1280,78 1540,105 L 1540,225 L -100,225 Z"
                fill={`url(#${idPrefix}-vibrant-wave-cyan)`}
              />
              <path
                d="M -100,180 C 200,190 480,150 760,115 C 1040,82 1280,78 1540,105"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </svg>
        </div>
      )}

      {afterWaveContent}
    </section>
  );
}
