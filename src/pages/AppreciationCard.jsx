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
  ExternalLink,
  Printer,
  FileText,
  Flame,
  Shield,
  Users,
  Lock,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { orgInfo } from '../data/dcvcData';
import { 
  APPRECIATION_TIERS, 
  TIER_CONFIGS, 
  getTierForAmount, 
  formatDonationAmount,
  getActiveTierConfigs,
  getCustomSpecialCards
} from '../data/appreciationTiers';
import { usePageMeta } from '../utils/seo';

// ============================================================================
// BESPOKE TIER ARTWORK 1: COMMUNITY ALLY (Warm Botanical Laurel & Sunrise)
// ============================================================================
function CommunityAllyArtwork() {
  return (
    <div className="relative w-full h-44 sm:h-52 flex items-center justify-center overflow-hidden my-2 select-none" aria-hidden="true">
      <svg className="w-full max-w-md h-full filter drop-shadow-sm" viewBox="0 0 500 200" fill="none">
        <defs>
          <linearGradient id="ally-sun-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#FB7185" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ally-gold-stem" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
          <linearGradient id="ally-leaf-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Radiant Sunrise Aura */}
        <circle cx="250" cy="115" r="75" fill="url(#ally-sun-glow)" />
        <circle cx="250" cy="115" r="42" fill="#FDE68A" fillOpacity="0.4" />
        <circle cx="250" cy="115" r="22" fill="#F59E0B" fillOpacity="0.75" />

        {/* Gentle Sun Rays */}
        {[-45, -30, -15, 0, 15, 30, 45].map((angle, i) => (
          <line
            key={i}
            x1="250"
            y1="115"
            x2={250 + Math.sin((angle * Math.PI) / 180) * 85}
            y2={115 - Math.cos((angle * Math.PI) / 180) * 85}
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeOpacity="0.65"
          />
        ))}

        {/* Left Botanical Laurel Branch */}
        <path
          d="M 250,155 C 210,150 170,130 150,90 C 140,70 142,48 152,32"
          stroke="url(#ally-gold-stem)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Left Leaves */}
        {[
          { cx: 160, cy: 45, rx: 10, ry: 5, rot: -40 },
          { cx: 148, cy: 70, rx: 12, ry: 6, rot: -20 },
          { cx: 156, cy: 95, rx: 13, ry: 6, rot: 10 },
          { cx: 175, cy: 120, rx: 14, ry: 7, rot: 35 },
          { cx: 205, cy: 140, rx: 13, ry: 6, rot: 55 }
        ].map((leaf, idx) => (
          <ellipse
            key={`left-${idx}`}
            cx={leaf.cx}
            cy={leaf.cy}
            rx={leaf.rx}
            ry={leaf.ry}
            transform={`rotate(${leaf.rot} ${leaf.cx} ${leaf.cy})`}
            fill="url(#ally-leaf-fill)"
            stroke="#D97706"
            strokeWidth="1.25"
          />
        ))}

        {/* Right Botanical Laurel Branch */}
        <path
          d="M 250,155 C 290,150 330,130 350,90 C 360,70 358,48 348,32"
          stroke="url(#ally-gold-stem)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right Leaves */}
        {[
          { cx: 340, cy: 45, rx: 10, ry: 5, rot: 40 },
          { cx: 352, cy: 70, rx: 12, ry: 6, rot: 20 },
          { cx: 344, cy: 95, rx: 13, ry: 6, rot: -10 },
          { cx: 325, cy: 120, rx: 14, ry: 7, rot: -35 },
          { cx: 295, cy: 140, rx: 13, ry: 6, rot: -55 }
        ].map((leaf, idx) => (
          <ellipse
            key={`right-${idx}`}
            cx={leaf.cx}
            cy={leaf.cy}
            rx={leaf.rx}
            ry={leaf.ry}
            transform={`rotate(${leaf.rot} ${leaf.cx} ${leaf.cy})`}
            fill="url(#ally-leaf-fill)"
            stroke="#D97706"
            strokeWidth="1.25"
          />
        ))}

        {/* Base Ribbon Tie */}
        <path
          d="M 235,152 C 245,158 255,158 265,152 C 272,168 280,180 286,188 M 228,188 C 234,180 242,168 248,152"
          stroke="#D97706"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// BESPOKE TIER ARTWORK 2: PRIDE ADVOCATE (Interconnected Geometric Stained Glass)
// ============================================================================
function PrideAdvocateArtwork() {
  return (
    <div className="relative w-full h-44 sm:h-52 flex items-center justify-center overflow-hidden my-2 select-none" aria-hidden="true">
      <svg className="w-full max-w-md h-full filter drop-shadow-md" viewBox="0 0 500 200" fill="none">
        <defs>
          <linearGradient id="advocate-purple-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5A1E65" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#C026D3" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="advocate-facet-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#DB2777" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="advocate-facet-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="advocate-facet-3" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Ambient Back Glow */}
        <circle cx="250" cy="100" r="85" fill="url(#advocate-purple-glow)" />

        {/* Interlocking Stained-Glass Rings (Advocacy & Unity) */}
        <circle cx="215" cy="100" r="54" stroke="url(#advocate-facet-1)" strokeWidth="3" fill="none" opacity="0.9" />
        <circle cx="285" cy="100" r="54" stroke="url(#advocate-facet-2)" strokeWidth="3" fill="none" opacity="0.9" />
        <circle cx="250" cy="80" r="46" stroke="url(#advocate-facet-3)" strokeWidth="2.5" strokeDasharray="6 3" fill="none" opacity="0.85" />

        {/* Central Geometric Care Star / Health Cross Fusion */}
        <g transform="translate(250, 100)">
          {/* 8-pointed Stained-Glass Mandala Facets */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <path
              key={i}
              d="M 0,0 L 9,-28 L 0,-42 L -9,-28 Z"
              transform={`rotate(${deg})`}
              fill={i % 2 === 0 ? "url(#advocate-facet-1)" : "url(#advocate-facet-3)"}
              stroke="#FFFFFF"
              strokeWidth="1.2"
              opacity="0.95"
            />
          ))}
          {/* Center Heart Emblem */}
          <circle cx="0" cy="0" r="14" fill="#5A1E65" stroke="#FFFFFF" strokeWidth="2" />
          <path
            d="M 0,-4 C -2,-7 -6,-7 -6,-3 C -6,2 0,6 0,6 C 0,6 6,2 6,-3 C 6,-7 2,-7 0,-4 Z"
            fill="#F472B6"
          />
        </g>

        {/* Floating Constellation Dots */}
        {[
          { cx: 140, cy: 60, r: 2.5 },
          { cx: 165, cy: 145, r: 2 },
          { cx: 335, cy: 55, r: 2 },
          { cx: 360, cy: 135, r: 3 },
          { cx: 250, cy: 25, r: 2.5 }
        ].map((pt, i) => (
          <circle key={i} cx={pt.cx} cy={pt.cy} r={pt.r} fill="#A855F7" opacity="0.8" />
        ))}
      </svg>
    </div>
  );
}

// ============================================================================
// BESPOKE TIER ARTWORK 3: RAINBOW CHAMPION (Dynamic Cascading Pride Aurora)
// ============================================================================
function RainbowChampionArtwork() {
  return (
    <div className="relative w-full h-44 sm:h-52 flex items-center justify-center overflow-hidden my-2 select-none" aria-hidden="true">
      <svg className="w-full max-w-md h-full filter drop-shadow-md" viewBox="0 0 500 200" fill="none">
        <defs>
          {/* Progress Pride Flow 1: Warm Sunset to Emerald */}
          <linearGradient id="champ-ribbon-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
            <stop offset="25%" stopColor="#F97316" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#10B981" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.85" />
          </linearGradient>
          {/* Progress Pride Flow 2: Oceanic Cyan to Royal Amethyst */}
          <linearGradient id="champ-ribbon-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#6366F1" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#A855F7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.9" />
          </linearGradient>
          {/* Central Prismatic Sunburst */}
          <radialGradient id="champ-star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Multi-Hue Aurora Backwash */}
        <circle cx="250" cy="100" r="90" fill="url(#champ-star-glow)" />

        {/* Cascading Pride Aurora Ribbon 1 (Top Undulation) */}
        <path
          d="M 10,135 C 110,175 190,50 250,85 C 310,120 390,45 490,95 L 490,140 C 390,90 310,165 250,130 C 190,95 110,220 10,180 Z"
          fill="url(#champ-ribbon-1)"
          opacity="0.85"
        />

        {/* Cascading Pride Aurora Ribbon 2 (Lower Crest with Crisp White Stroke) */}
        <path
          d="M 10,110 C 120,70 180,160 250,120 C 320,80 380,170 490,115"
          stroke="url(#champ-ribbon-2)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 10,110 C 120,70 180,160 250,120 C 320,80 380,170 490,115"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 4"
          fill="none"
        />

        {/* Central Brilliant Champion Star with Multi-Point Radiance */}
        <g transform="translate(250, 100)">
          {/* Star Beams */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
            <line
              key={i}
              x1="0"
              y1="0"
              x2="0"
              y2={i % 3 === 0 ? "-32" : "-18"}
              transform={`rotate(${deg})`}
              stroke={i % 3 === 0 ? "#F59E0B" : "#EC4899"}
              strokeWidth={i % 3 === 0 ? "2.5" : "1.25"}
              strokeLinecap="round"
            />
          ))}
          {/* Center Prismatic Core */}
          <polygon
            points="0,-16 4,-5 16,0 4,5 0,16 -4,5 -16,0 -4,-5"
            fill="#FDE047"
            stroke="#5A1E65"
            strokeWidth="1.5"
          />
        </g>

        {/* Twinkling Starlight Field */}
        {[
          { x: 90, y: 55, size: 10, color: "#F59E0B" },
          { x: 160, y: 155, size: 8, color: "#EC4899" },
          { x: 350, y: 45, size: 12, color: "#06B6D4" },
          { x: 420, y: 145, size: 9, color: "#10B981" },
          { x: 290, y: 165, size: 7, color: "#8B5CF6" }
        ].map((s, idx) => (
          <g key={idx} transform={`translate(${s.x}, ${s.y})`}>
            <polygon
              points={`0,-${s.size} ${s.size/3},-${s.size/3} ${s.size},0 ${s.size/3},${s.size/3} 0,${s.size} -${s.size/3},${s.size/3} -${s.size},0 -${s.size/3},-${s.size/3}`}
              fill={s.color}
              opacity="0.9"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================================================
// BESPOKE TIER ARTWORK 4: VISIONARY BENEFACTOR (Sovereign Gold Crest & Beacon)
// ============================================================================
function VisionaryBenefactorArtwork() {
  return (
    <div className="relative w-full h-48 sm:h-56 flex items-center justify-center overflow-hidden my-2 select-none" aria-hidden="true">
      <svg className="w-full max-w-lg h-full filter drop-shadow-xl" viewBox="0 0 540 220" fill="none">
        <defs>
          {/* Sovereign 24K Liquid Gold Metallic Gradient */}
          <linearGradient id="benefactor-gold-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="25%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="75%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          {/* Deep Royal Midnight Radial Background */}
          <radialGradient id="benefactor-night-lantern" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#7C3AED" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0B0919" stopOpacity="0" />
          </radialGradient>
          {/* Gold Filigree Ribbon Gradient */}
          <linearGradient id="benefactor-crest-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#78350F" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Ambient Starlight Core Glow */}
        <circle cx="270" cy="105" r="95" fill="url(#benefactor-night-lantern)" />

        {/* Architectural Coastal Waves & Mountain Silhouette (Topatopa & Pacific) */}
        <path
          d="M 60,165 C 130,145 190,175 270,150 C 350,125 410,160 480,145 L 480,175 L 60,175 Z"
          fill="#1E1B4B"
          opacity="0.6"
        />
        <path
          d="M 60,165 C 130,145 190,175 270,150 C 350,125 410,160 480,145"
          stroke="url(#benefactor-gold-metallic)"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
        />

        {/* Outer Filigree Architectural Flourish Arcs */}
        <path
          d="M 170,110 C 170,55 215,22 270,22 C 325,22 370,55 370,110 C 370,155 320,185 270,195 C 220,185 170,155 170,110 Z"
          stroke="url(#benefactor-gold-metallic)"
          strokeWidth="2.5"
          fill="url(#benefactor-crest-fill)"
        />
        <path
          d="M 185,110 C 185,65 222,35 270,35 C 318,35 355,65 355,110 C 355,148 312,174 270,182 C 228,174 185,148 185,110 Z"
          stroke="url(#benefactor-gold-metallic)"
          strokeWidth="1.2"
          strokeDasharray="4 2"
          fill="none"
        />

        {/* Sovereign Crest Lantern (The Community Beacon of Center) */}
        <g transform="translate(270, 105)">
          {/* Radiating Light Beams */}
          {[-60, -40, -20, 0, 20, 40, 60].map((deg, i) => (
            <line
              key={i}
              x1="0"
              y1="-10"
              x2={Math.sin((deg * Math.PI) / 180) * 80}
              y2={-10 - Math.cos((deg * Math.PI) / 180) * 80}
              stroke="#FDE047"
              strokeWidth={i === 3 ? "2.5" : "1.25"}
              strokeOpacity={i === 3 ? "0.95" : "0.5"}
            />
          ))}

          {/* Lantern Crown & Finial */}
          <path
            d="M 0,-50 L 5,-40 L -5,-40 Z M 0,-40 L 16,-28 L -16,-28 Z"
            fill="url(#benefactor-gold-metallic)"
          />
          {/* Lantern Glass Body */}
          <polygon
            points="-18,-28 18,-28 12,10 -12,10"
            fill="#FEF08A"
            fillOpacity="0.85"
            stroke="url(#benefactor-gold-metallic)"
            strokeWidth="2"
          />
          {/* Inner Eternal Flame of Center */}
          <path
            d="M 0,-18 C 5,-12 6,-6 4,0 C 2,5 -2,5 -4,0 C -6,-6 -5,-12 0,-18 Z"
            fill="#F59E0B"
          />
          <path
            d="M 0,-14 C 2,-10 3,-6 2,-2 C 1,2 -1,2 -2,-2 C -3,-6 -2,-10 0,-14 Z"
            fill="#FFFFFF"
          />
          {/* Lantern Base & Hanging Ring */}
          <path
            d="M -16,10 L 16,10 L 10,22 L -10,22 Z"
            fill="url(#benefactor-gold-metallic)"
          />
        </g>

        {/* Flanking Ornate Gold Laurel Leaves */}
        {[-1, 1].map((dir, sIdx) => (
          <g key={sIdx} transform={`scale(${dir}, 1) translate(${dir === -1 ? -540 : 0}, 0)`}>
            <path
              d="M 270,195 C 295,190 325,180 345,155 C 365,130 380,95 385,60"
              stroke="url(#benefactor-gold-metallic)"
              strokeWidth="2"
              fill="none"
            />
            {[
              { x: 310, y: 175, rot: 30 },
              { x: 335, y: 150, rot: 45 },
              { x: 355, y: 120, rot: 60 },
              { x: 370, y: 90, rot: 75 }
            ].map((p, idx) => (
              <ellipse
                key={idx}
                cx={p.x}
                cy={p.y}
                rx="10"
                ry="4.5"
                transform={`rotate(${p.rot} ${p.x} ${p.y})`}
                fill="url(#benefactor-gold-metallic)"
                stroke="#FEF08A"
                strokeWidth="1"
              />
            ))}
          </g>
        ))}

        {/* 24K Diamond Starlight Sparkles */}
        {[
          { x: 120, y: 50 },
          { x: 150, y: 140 },
          { x: 390, y: 40 },
          { x: 420, y: 130 }
        ].map((pt, i) => (
          <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
            <polygon
              points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2"
              fill="#FDE047"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================================================
// MAIN APPRECIATION CARD PAGE COMPONENT
// ============================================================================
const API_BASE_URL = typeof window !== 'undefined' && window.location.origin
  ? (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || 'https://dcvc-api.diversity-collective-vc.workers.dev/api')
  : 'https://dcvc-api.diversity-collective-vc.workers.dev/api';

const PREVIEW_PLACEHOLDER_NAME = 'Sample Community Supporter';

export default function AppreciationCard() {
  const { token } = useParams();
  const isPreview = !token || token === 'preview';

  // Preview controls (strictly non-editable showcase)
  const [activeTierId, setActiveTierId] = useState(APPRECIATION_TIERS.PRIDE_ADVOCATE);
  const [captureShieldActive, setCaptureShieldActive] = useState(false);

  // Card state
  const [cardData, setCardData] = useState(() => {
    if (isPreview) {
      return {
        donorDisplayName: PREVIEW_PLACEHOLDER_NAME,
        tier: APPRECIATION_TIERS.PRIDE_ADVOCATE,
        tierName: TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE].title,
        amountCents: TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE].minAmount * 100,
        frequency: 'monthly',
        isAnonymous: false,
        impactMessage: TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE].impactNarrative,
        createdAt: new Date().toISOString()
      };
    }
    return null;
  });
  const [cardError, setCardError] = useState(null);
  const [isLoading, setIsLoading] = useState(!isPreview);
  const [isOpened, setIsOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);
  const cardRef = useRef(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  usePageMeta({
    title: isPreview
      ? 'Appreciation Card Showcase | Diversity Collective Ventura County'
      : 'Your DCVC Appreciation Card | Diversity Collective Ventura County',
    description: 'Browse sample DCVC Donor Appreciation Card tiers or open your Zeffy-verified personalized keepsake.',
    canonicalPath: `/appreciation-card/${token || 'preview'}`
  });

  // Anti-screenshot / capture deterrent listener for public preview mode
  useEffect(() => {
    if (!isPreview || typeof window === 'undefined') return undefined;

    const triggerShield = () => setCaptureShieldActive(true);
    const clearShield = () => setCaptureShieldActive(false);

    const handleKeyDown = (e) => {
      const key = String(e.key || '').toLowerCase();
      const isCaptureShortcut =
        key === 'printscreen' ||
        ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'p') ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && ['3', '4', '5', 's'].includes(key));

      if (isCaptureShortcut) {
        if (key !== 'printscreen') e.preventDefault();
        triggerShield();
      }
    };

    const handleVisibility = () => {
      if (document.hidden) triggerShield();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', triggerShield);
    window.addEventListener('focus', clearShield);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', triggerShield);
      window.removeEventListener('focus', clearShield);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isPreview]);

  const fetchVerifiedCard = async () => {
    if (!token || isPreview) return;
    setIsLoading(true);
    setCardError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/appreciation-cards/${encodeURIComponent(token)}`, {
        cache: 'no-store'
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success && json.card) {
        setCardData(json.card);
        setActiveTierId(json.card.tier || APPRECIATION_TIERS.COMMUNITY_ALLY);
        setCardError(null);
      } else {
        setCardData(null);
        setCardError({
          status: res.status,
          message:
            json.error ||
            (res.status === 403
              ? 'This appreciation keepsake is waiting for Zeffy payment confirmation.'
              : res.status === 410
                ? 'This appreciation keepsake has been revoked due to a refunded or disputed transaction.'
                : 'No verified Zeffy appreciation card matched this link yet.')
        });
      }
    } catch (err) {
      setCardData(null);
      setCardError({
        status: 503,
        message: 'Unable to reach our donation verification server right now. Please try again in a moment.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real card data by token (or update sample tier in public preview)
  useEffect(() => {
    const activeConfigs = getActiveTierConfigs();
    const customCards = getCustomSpecialCards();

    if (isPreview) {
      const config = customCards.find(c => c.id === activeTierId) || 
        activeConfigs[activeTierId] || 
        activeConfigs[APPRECIATION_TIERS.PRIDE_ADVOCATE];

      setCardError(null);
      setCardData({
        donorDisplayName: PREVIEW_PLACEHOLDER_NAME,
        tier: activeTierId,
        tierName: config.title,
        amountCents: (config.minAmount || 50) * 100,
        frequency: 'monthly',
        isAnonymous: false,
        impactMessage: config.impactNarrative,
        createdAt: new Date().toISOString()
      });
      setIsLoading(false);
      return;
    }

    fetchVerifiedCard();
  }, [token, isPreview, activeTierId]);

  // Handle opening interaction + tier-tailored celebration particles
  const handleOpenCard = () => {
    setIsOpened(true);

    if (!prefersReducedMotion) {
      try {
        let colors = ['#5A1E65', '#F59E0B', '#10B981', '#E11D48', '#8B5CF6'];
        let count = 70;

        if (activeTierId === APPRECIATION_TIERS.COMMUNITY_ALLY) {
          colors = ['#F59E0B', '#FBBF24', '#FB7185', '#EDE9FE', '#FEF3C7'];
          count = 50;
        } else if (activeTierId === APPRECIATION_TIERS.PRIDE_ADVOCATE) {
          colors = ['#5A1E65', '#C026D3', '#06B6D4', '#EC4899', '#FAF5FF'];
          count = 75;
        } else if (activeTierId === APPRECIATION_TIERS.RAINBOW_CHAMPION) {
          colors = ['#EF4444', '#F97316', '#FBBF24', '#10B981', '#06B6D4', '#8B5CF6'];
          count = 100;
        } else if (activeTierId === APPRECIATION_TIERS.VISIONARY_BENEFACTOR) {
          colors = ['#FDE047', '#D97706', '#F59E0B', '#FEF08A', '#7C3AED'];
          count = 130;
        }

        confetti({
          particleCount: count,
          spread: 85,
          origin: { y: 0.6 },
          colors,
          disableForReducedMotion: true
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

  // Pre-flight check: Await document web fonts, image decoding, and SVG layout computation
  const preflightCardAssets = async (element) => {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn('Font readiness check skipped:', e);
      }
    }

    const imgs = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 800);
        });
      })
    );

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  };

  // Cross-device download & iOS Safari Web Share API integration
  const saveOrShareFile = async (blob, fileName, mimeType, title) => {
    const file = new File([blob], fileName, { type: mimeType });
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: title || 'DCVC Appreciation Card',
          text: 'Diversity Collective Ventura County Keepsake'
        });
        return { success: true, method: 'share' };
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          return { success: false, method: 'aborted' };
        }
        console.warn('Web Share failed, falling back to download:', shareErr);
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return { success: true, method: 'download' };
  };

  const handlePrint = () => {
    const card = cardRef.current;
    if (card) {
      // Measure actual rendered height and calculate proportional scale to fit exactly within A4 Landscape (194mm printable height = ~733px)
      const cardH = card.offsetHeight || 880;
      const cardW = card.offsetWidth || 896;
      // Target height is 680px to guarantee safe margins and prevent any second page
      const scale = Math.min(1, Math.min(680 / cardH, 950 / cardW));
      card.style.setProperty('--print-scale', scale.toFixed(3));
    }
    window.print();
  };

  const handleDownloadHighRes = async () => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    try {
      setIsGeneratingDownload(true);
      await preflightCardAssets(cardElement);

      const isMobile = typeof window !== 'undefined' && (
        window.innerWidth < 768 ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      );
      // Desktop: 2.5x pixel ratio for sharp 300 DPI target; Mobile: 1.75x to safely respect iOS 288MB limit
      const pixelRatio = isMobile ? 1.75 : 2.5;

      const dataUrl = await toPng(cardElement, {
        quality: 0.98,
        pixelRatio
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const cleanName = (cardData?.donorDisplayName || 'Supporter').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `DCVC-Appreciation-Card-${(currentTier.badgeText || 'Donor').replace(/[^a-zA-Z0-9]/g, '-')}-${cleanName}.png`;

      await saveOrShareFile(blob, fileName, 'image/png', `DCVC ${currentTier.title} Keepsake Card`);
    } catch (err) {
      console.error('Failed to export high-res card:', err);
      handlePrint();
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  const handleDownloadPdf = async () => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    try {
      setIsGeneratingDownload(true);
      await preflightCardAssets(cardElement);

      const isMobile = typeof window !== 'undefined' && (
        window.innerWidth < 768 ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      );
      const pixelRatio = isMobile ? 1.75 : 2.5;

      const dataUrl = await toPng(cardElement, {
        quality: 0.98,
        pixelRatio
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 8;
      const maxW = pageWidth - (margin * 2);
      const maxH = pageHeight - (margin * 2);

      const cardRect = cardElement.getBoundingClientRect();
      const cardAspect = cardRect.width / cardRect.height;
      const targetAspect = maxW / maxH;

      let renderW, renderH, offsetX, offsetY;
      if (cardAspect > targetAspect) {
        renderW = maxW;
        renderH = maxW / cardAspect;
        offsetX = margin;
        offsetY = margin + (maxH - renderH) / 2;
      } else {
        renderH = maxH;
        renderW = maxH * cardAspect;
        offsetX = margin + (maxW - renderW) / 2;
        offsetY = margin;
      }

      pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');

      const cleanName = (cardData?.donorDisplayName || 'Supporter').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `DCVC-Certificate-${(currentTier.badgeText || 'Donor').replace(/[^a-zA-Z0-9]/g, '-')}-${cleanName}.pdf`;

      const pdfBlob = pdf.output('blob');
      await saveOrShareFile(pdfBlob, fileName, 'application/pdf', `DCVC ${currentTier.title} Certificate`);
    } catch (err) {
      console.error('Failed to export PDF certificate:', err);
      handlePrint();
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  const activeConfigs = getActiveTierConfigs();
  const customCards = getCustomSpecialCards();
  const currentTier = customCards.find(c => c.id === (cardData?.tier || activeTierId)) || 
    activeConfigs[cardData?.tier || activeTierId] || 
    activeConfigs[APPRECIATION_TIERS.COMMUNITY_ALLY];

  const isDark = (cardData?.tier || activeTierId) === APPRECIATION_TIERS.VISIONARY_BENEFACTOR;

  // Unique verified certificate token code
  const certificateId = isPreview
    ? `DCVC-SAMPLE-${currentTier.certificatePrefix || 'GEN'}-PREVIEW`
    : `DCVC-AC-${currentTier.certificatePrefix || 'GEN'}-2026-${(token || 'VERIFIED').substring(0, 6).toUpperCase()}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Verifying Zeffy confirmation &amp; retrieving keepsake...</p>
        </div>
      </div>
    );
  }

  // Real token route without confirmed payment -> Strict Zeffy Verification Required state
  if (!isPreview && (cardError || !cardData)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-16 px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border-2 border-purple-100 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#5A1E65]">
              Zeffy Payment Verification Required
            </span>
            <h1 className="font-fraunces text-2xl font-black text-slate-950">
              {cardError?.status === 410 ? 'Appreciation Card Revoked' : 'Awaiting Zeffy Confirmation'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {cardError?.message || 'Personalized Appreciation Cards featuring your donor name are minted and emailed only after Zeffy confirms your completed contribution.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={fetchVerifiedCard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Verification Status</span>
            </button>
            <Link
              to="/appreciation-card/preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Browse Public Sample Preview</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-br from-[#FAF5FF] via-white to-[#FFFBEB] text-slate-900 py-6 sm:py-10 px-4 sm:px-6 lg:px-10 ${
        isPreview ? 'select-none' : 'selection:bg-purple-900 selection:text-white'
      }`}
      onContextMenu={(e) => { if (isPreview) e.preventDefault(); }}
      onCopy={(e) => { if (isPreview) e.preventDefault(); }}
      onDragStart={(e) => { if (isPreview) e.preventDefault(); }}
    >
      {/* Print suppression in public preview mode */}
      {isPreview && (
        <style>{`
          @media print {
            .dcvc-preview-protected, body {
              display: none !important;
            }
          }
        `}</style>
      )}

      {/* Full-Screen Top Navigation Strip */}
      <div className="max-w-5xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white border border-purple-200 text-xs font-bold text-slate-800 hover:text-[#5A1E65] shadow-xs transition-all"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180 text-[#5A1E65]" />
          <span>Back to Diversity Collective</span>
        </Link>
        <Link
          to="/donate"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-extrabold shadow-xs transition-all"
        >
          <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>Support DCVC via Zeffy</span>
        </Link>
      </div>

      {/* =================================================================== */}
      {/* FULL-SCREEN TIER SWITCHER BAR (No Login Required · Non-Editable)    */}
      {/* =================================================================== */}
      {isPreview && (
        <aside aria-label="Public Appreciation Card Tiers" className="max-w-4xl mx-auto mb-7 bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-purple-200 shadow-xl print:hidden space-y-4 dcvc-preview-protected">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-xs font-black uppercase tracking-wider text-purple-950">
                  Public Appreciation Card Preview
                </h1>
                <p className="text-[11px] text-slate-500">
                  Full-screen public sample · Official named cards unlock upon Zeffy confirmation
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-800 whitespace-nowrap">
              <Lock className="w-3 h-3" />
              <span>Protected</span>
            </span>
          </div>

          {/* Core Tier Switcher Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {Object.values(activeConfigs).map((tier) => {
              const isSelected = activeTierId === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    setActiveTierId(tier.id);
                    setIsOpened(false);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-sm ring-2 ring-purple-300'
                      : 'bg-slate-50 hover:bg-purple-50/70 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-extrabold text-[11px] truncate">{tier.title}</span>
                  <span className="text-[10px] opacity-80">${tier.minAmount}+</span>
                </button>
              );
            })}
          </div>

          {/* Special Custom Cards Switcher */}
          {customCards.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Commemorative Editions ({customCards.length})</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {customCards.map((card) => {
                  const isSelected = activeTierId === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setActiveTierId(card.id);
                        setIsOpened(false);
                      }}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-[#5A1E65] text-white border-[#5A1E65]'
                          : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-slate-800'
                      }`}
                    >
                      <span className="truncate font-bold text-[11px] pr-2">{card.title}</span>
                      <span className="text-[10px] font-mono font-bold flex-shrink-0">${card.minAmount}+</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Read-Only Controls Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Shield className="w-3.5 h-3.5 text-purple-700" />
              <span>Non-editable sample preview · Downloads &amp; captures disabled</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpened(prev => !prev)}
              className="font-bold text-[#5A1E65] hover:text-purple-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isOpened ? 'Show Sealed' : 'Preview Card'}</span>
            </button>
          </div>
        </aside>
      )}

      {/* =================================================================== */}
      {/* FULL-SCREEN CARD CONTAINER (Restored Spacious Desktop Showcase)     */}
      {/* =================================================================== */}
      <div className="mx-auto transition-all duration-300 relative max-w-4xl">
        {/* Capture / Screenshot Deterrent Shield */}
        {isPreview && captureShieldActive && (
          <div
            onClick={() => setCaptureShieldActive(false)}
            className="absolute inset-0 z-50 rounded-3xl bg-slate-950/92 backdrop-blur-xl text-white flex flex-col items-center justify-center p-6 text-center space-y-3 cursor-pointer border-2 border-amber-400/50 shadow-2xl"
          >
            <ShieldAlert className="w-10 h-10 text-amber-400" />
            <h2 className="font-fraunces text-lg font-black">Sample Preview Protected</h2>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Screenshots and exports are restricted for sample previews. Your personalized keepsake unlocks automatically once Zeffy confirms your donation.
            </p>
            <span className="px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
              Click to Resume Preview
            </span>
          </div>
        )}
        
        {/* =================================================================== */}
        {/* STATE 1: BESPOKE SEALED KEEPSAKE ENVELOPE (Unopened)                */}
        {/* =================================================================== */}
        {!isOpened ? (
          <div className={`rounded-3xl border-2 ${currentTier.borderStyle} ${currentTier.envelopeBg || 'bg-white'} shadow-2xl p-7 sm:p-14 text-center relative overflow-hidden transition-all duration-500`}>
            
            {isPreview && (
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden select-none"
              >
                <span className={`transform -rotate-25 ${isDark ? 'text-white/12 border-white/15' : 'text-slate-900/12 border-slate-900/15'} font-black text-[11px] tracking-[0.2em] uppercase border-2 border-dashed py-1.5 px-4 rounded-xl`}>
                  SAMPLE PREVIEW · UNISSUED
                </span>
              </div>
            )}

            {/* Ambient Background Aura */}
            <div 
              className={`absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gradient-to-tr ${currentTier.themeGradient} opacity-25 blur-3xl pointer-events-none`}
              aria-hidden="true" 
            />

            {/* Keepsake Envelope Presentation Box */}
            <div className="relative z-10 max-w-lg mx-auto space-y-6">
              
              {/* Official DCVC Logo Mark */}
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white p-2 shadow-md border border-purple-200/80 flex items-center justify-center">
                <img 
                  src="/images/logo-square.png" 
                  alt="Diversity Collective Ventura County Official Logo" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Tier Circle Ribbon */}
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                isDark 
                  ? 'bg-amber-950/90 border border-amber-400/80 shadow-md text-amber-300' 
                  : 'bg-white/90 border border-slate-200/90 shadow-2xs text-[#5A1E65]'
              }`}>
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentTier.circleName}</span>
              </div>

              {/* Physical Keepsake Envelope Graphic with Wax Seal */}
              <div className="relative mx-auto w-56 h-40 bg-gradient-to-b from-white to-slate-100 rounded-3xl border-2 border-slate-200/90 shadow-inner flex items-center justify-center group cursor-pointer" onClick={handleOpenCard}>
                {/* Envelope Flap Lines */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/30 to-amber-100/30 rounded-3xl pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-20 border-b-2 border-slate-200/60 [clip-path:polygon(0_0,100%_0,50%_100%)] bg-white/80" />

                {/* Bespoke Wax Hologram Seal */}
                <div className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr ${currentTier.themeGradient} text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300 border-2 border-white`}>
                  {activeTierId === APPRECIATION_TIERS.VISIONARY_BENEFACTOR ? (
                    <Flame className="w-7 h-7 text-amber-200 animate-pulse" />
                  ) : activeTierId === APPRECIATION_TIERS.RAINBOW_CHAMPION ? (
                    <Sparkles className="w-7 h-7 text-white animate-spin" style={{ animationDuration: '8s' }} />
                  ) : activeTierId === APPRECIATION_TIERS.PRIDE_ADVOCATE ? (
                    <Heart className="w-7 h-7 text-white fill-white/80" />
                  ) : (
                    <Star className="w-7 h-7 text-amber-200 fill-amber-200" />
                  )}
                </div>
              </div>

              {/* Envelope Invitation Copy */}
              <div className="space-y-2">
                <h1 className={`text-3xl sm:text-4xl font-fraunces font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  A Gift of Authentic Gratitude
                </h1>
                <p className={`text-sm sm:text-base max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                  Crafted exclusively for <strong className={`${isDark ? 'text-amber-300' : 'text-purple-950'} font-extrabold`}>{cardData?.donorDisplayName}</strong> in formal commemoration of your community philanthropy.
                </p>
              </div>

              {/* Open Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenCard}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#5A1E65] via-purple-800 to-indigo-900 hover:from-[#45124E] hover:to-indigo-950 text-white font-extrabold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-300 btn-shimmer"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Break the Seal & Open Keepsake</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Privacy Notice */}
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected Digital Keepsake · No Private Financial Info Stored</span>
              </p>
            </div>
          </div>
        ) : (
          /* =================================================================== */
          /* STATE 2: REVEALED BESPOKE APPRECIATION CARD (Opened Keepsake)       */
          /* =================================================================== */
          <div className="space-y-6 animate-fade-in">
            
            {/* The Physical Card Canvas */}
            <div 
              id="appreciation-card-render"
              ref={cardRef}
              onContextMenu={(e) => isPreview && e.preventDefault()}
              style={isPreview ? { WebkitUserSelect: 'none', WebkitTouchCallout: 'none', userSelect: 'none' } : undefined}
              className={`relative rounded-3xl p-6 sm:p-12 border-2 ${currentTier.borderStyle} ${currentTier.cardBackground} shadow-2xl overflow-hidden transition-all duration-700 ${isPreview ? 'select-none' : ''}`}
            >
              {/* Subtle Studio Preview Corner Watermark Badge in Public Preview Mode */}
              {isPreview && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none select-none mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-[10px] font-black uppercase tracking-wider text-amber-900 print:hidden"
                >
                  <Shield className="w-3 h-3 text-amber-700" />
                  <span>Sample Preview · Unissued</span>
                </div>
              )}

              {/* Distinct Tier Color Bar at Top */}
              <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${currentTier.themeGradient}`} />

              {/* Dedicated Print & PDF Proportional Scaling Rules */}
              <style>{`
                @media print {
                  @page {
                    size: landscape;
                    margin: 8mm;
                  }
                  html, body {
                    background: #ffffff !important;
                    color: #0f172a !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    overflow: hidden !important;
                  }
                  header, footer, nav, aside, .print\\:hidden, [role="banner"], [role="contentinfo"] {
                    display: none !important;
                  }
                  #appreciation-card-render {
                    box-shadow: none !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    zoom: var(--print-scale, 0.76) !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    margin: 0 auto !important;
                  }
                  #appreciation-card-render * {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                }
              `}</style>

              {/* ============================================================= */}
              {/* CARD HEADER: Official Logo + Tier Insignia + Unique Token ID  */}
              {/* ============================================================= */}
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b ${
                isDark ? 'border-amber-500/30' : 'border-slate-300/40'
              } pb-6 mb-6`}>
                
                {/* Official DCVC Brand Identity */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200/80 flex items-center justify-center flex-shrink-0">
                    <img 
                      src="/images/logo-square.png" 
                      alt="Diversity Collective Ventura County Official Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className={`font-display font-black text-sm sm:text-base tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-950'
                    } block`}>
                      Diversity Collective
                    </span>
                    <span className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase ${
                      isDark ? 'text-amber-300/90' : 'text-slate-500'
                    } block`}>
                      Ventura County 501(c)(3) Nonprofit
                    </span>
                  </div>
                </div>

                {/* Tier Badge & Verified Certificate ID */}
                <div className="text-left sm:text-right space-y-1">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wider ${
                    isDark 
                      ? 'bg-amber-950/90 border border-amber-400/80 shadow-md text-amber-300' 
                      : 'bg-white/90 border border-slate-200 shadow-2xs text-[#5A1E65]'
                  }`}>
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{currentTier.badgeText}</span>
                  </div>
                  <div className={`font-mono text-[10px] ${
                    isDark ? 'text-amber-300/80 font-bold' : 'text-slate-500'
                  } tracking-wider block`}>
                    ID: {certificateId}
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* BESPOKE TIER ARTWORK ILLUSTRATION (Original Concept)          */}
              {/* ============================================================= */}
              <div className="w-full">
                {(currentTier.motif === 'botanical_sunrise' || activeTierId === APPRECIATION_TIERS.COMMUNITY_ALLY) && <CommunityAllyArtwork />}
                {(currentTier.motif === 'interconnected_rings' || activeTierId === APPRECIATION_TIERS.PRIDE_ADVOCATE) && <PrideAdvocateArtwork />}
                {(currentTier.motif === 'pride_aurora_ribbons' || activeTierId === APPRECIATION_TIERS.RAINBOW_CHAMPION) && <RainbowChampionArtwork />}
                {(currentTier.motif === 'sovereign_gold_crest' || activeTierId === APPRECIATION_TIERS.VISIONARY_BENEFACTOR || (!currentTier.motif && activeTierId !== APPRECIATION_TIERS.COMMUNITY_ALLY && activeTierId !== APPRECIATION_TIERS.PRIDE_ADVOCATE && activeTierId !== APPRECIATION_TIERS.RAINBOW_CHAMPION)) && <VisionaryBenefactorArtwork />}
              </div>

              {/* ============================================================= */}
              {/* COMMEMORATIVE INSCRIPTION & PERSONALIZATION                   */}
              {/* ============================================================= */}
              <div className="space-y-5 text-center my-6">
                <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] ${
                  isDark ? 'text-amber-300' : 'text-[#5A1E65]'
                } block`}>
                  Official 501(c)(3) Certificate of Authentic Gratitude
                </span>

                <h3 className={`font-fraunces text-3xl sm:text-5xl font-black ${
                  isDark ? 'text-white' : 'text-slate-950'
                } tracking-tight leading-tight`}>
                  With Heartfelt Thanks To <br />
                  <span className={`bg-gradient-to-r ${
                    isDark ? 'from-amber-200 via-yellow-300 to-amber-400' : currentTier.themeGradient
                  } bg-clip-text text-transparent underline decoration-amber-400/60 decoration-2 underline-offset-8 font-extrabold`}>
                    {cardData?.donorDisplayName}
                  </span>
                </h3>

                <p className={`font-fraunces italic text-base sm:text-xl ${
                  isDark ? 'text-amber-100/95 font-medium' : 'text-slate-700'
                } leading-relaxed max-w-2xl mx-auto pt-1`}>
                  {currentTier.quote}
                </p>

                {/* Impact Statement Box */}
                <div className={`p-5 sm:p-6 rounded-2xl ${
                  isDark 
                    ? 'bg-slate-900/90 border border-amber-500/40 shadow-xl backdrop-blur-md' 
                    : 'bg-white/95 border border-slate-200/90 shadow-sm'
                } text-left max-w-2xl mx-auto space-y-2`}>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${
                    isDark ? 'text-amber-300' : 'text-[#5A1E65]'
                  } flex items-center gap-1.5`}>
                    <Heart className={`w-4 h-4 ${isDark ? 'text-amber-400 fill-amber-400' : 'text-rose-500 fill-current'}`} />
                    <span>Your Ventura County Community Impact</span>
                  </h4>
                  <p className={`text-xs sm:text-sm ${
                    isDark ? 'text-slate-100' : 'text-slate-700'
                  } leading-relaxed font-normal`}>
                    {cardData?.impactMessage || currentTier.impactNarrative}
                  </p>
                </div>
              </div>

              {/* ============================================================= */}
              {/* COLLECTIVE COMMUNITY GRATITUDE & 501(C)(3) COMMEMORATIVE SEAL */}
              {/* ============================================================= */}
              <div className={`pt-6 border-t ${
                isDark ? 'border-amber-500/30' : 'border-slate-300/40'
              } grid grid-cols-1 sm:grid-cols-2 gap-6 items-center mt-8`}>
                
                {/* Collective Community Gratitude */}
                <div className="space-y-1 text-center sm:text-left">
                  <p className={`text-xs font-black uppercase tracking-wider ${
                    isDark ? 'text-amber-300' : 'text-[#5A1E65]'
                  }`}>With Deepest Gratitude</p>
                  <span className={`font-fraunces italic font-bold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  } text-xl block`}>
                    Diversity Collective Ventura County
                  </span>
                  <p className={`text-xs ${
                    isDark ? 'text-slate-200 font-medium' : 'text-slate-600'
                  }`}>Board of Directors, Staff, Volunteers & Community Center</p>
                </div>

                {/* Official 501(c)(3) Non-Profit Commemorative Seal */}
                <div className="text-center sm:text-right space-y-1">
                  <div className={`inline-block p-3 rounded-2xl ${
                    isDark 
                      ? 'bg-slate-900/90 border border-amber-500/40 shadow-lg text-amber-200' 
                      : 'bg-white/95 border border-purple-200 text-[#5A1E65] shadow-2xs'
                  } text-center sm:text-right`}>
                    <p className={`text-[11px] font-bold ${isDark ? 'text-amber-200' : 'text-slate-900'}`}>501(c)(3) Nonprofit Public Charity</p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-300 font-medium' : 'text-slate-600'}`}>Ventura County, California · Established 2014</p>
                    <p className={`text-[9px] font-mono ${
                      isDark ? 'text-amber-400 font-bold' : 'text-purple-700 font-semibold'
                    } tracking-wider`}>CERTIFICATE: {certificateId}</p>
                  </div>
                </div>

              </div>

              {/* Explicit Separation from Official IRS Tax Receipt */}
              <div className={`mt-8 pt-4 border-t ${
                isDark 
                  ? 'border-amber-500/30 bg-slate-900/80 text-slate-200' 
                  : 'border-slate-200/60 bg-slate-50/70 text-slate-600'
              } text-[11px] text-center rounded-2xl p-3.5 border ${
                isDark ? 'border-amber-500/30' : 'border-slate-200/50'
              }`}>
                <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} leading-relaxed`}>
                  <strong className={`${isDark ? 'text-amber-300 font-bold' : 'text-slate-900 font-bold'}`}>Commemorative Keepsake Notice:</strong> This appreciation card is an expressive cultural keepsake honoring your generous community partnership. It does not serve as an official IRS tax receipt. Official tax-deductible donation receipts are issued independently and securely via our nonprofit giving partner, <strong className={isDark ? 'text-white' : ''}>Zeffy</strong>.
                </p>
              </div>

            </div>

            {/* =============================================================== */}
            {/* ACTIONS TOOLBAR: Full Exports for Verified Donors Only          */}
            {/* =============================================================== */}
            {isPreview ? (
              <div className="w-full text-xs font-semibold text-amber-950 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-3 shadow-xs print:hidden">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Protected Sample Preview:</strong> Editing, screenshots, printing, and PNG/PDF downloads are disabled. Personalized keepsakes featuring your name are issued automatically after Zeffy confirms your donation.
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsOpened(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-900 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Close Envelope</span>
                  </button>
                  <Link
                    to="/donate"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#5A1E65] text-white text-xs font-bold hover:bg-purple-900 transition-colors shadow-sm"
                  >
                    <span>Donate via Zeffy to Claim</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-slate-200 shadow-md print:hidden">
                <div className="flex flex-wrap gap-2.5">
                  {/* Download High-Resolution 300 DPI Artwork (PNG) */}
                  <button
                    type="button"
                    onClick={handleDownloadHighRes}
                    disabled={isGeneratingDownload}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5A1E65] to-purple-800 hover:from-purple-900 hover:to-indigo-950 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-40"
                  >
                    <Download className={`w-4 h-4 text-amber-300 ${isGeneratingDownload ? 'animate-bounce' : ''}`} />
                    <span>{isGeneratingDownload ? 'Rendering 300 DPI...' : 'Download Keepsake (300 DPI PNG)'}</span>
                  </button>

                  {/* Download Verified PDF Certificate */}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingDownload}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40"
                  >
                    <FileText className="w-4 h-4 text-amber-300" />
                    <span>Download PDF Certificate</span>
                  </button>

                  {/* Proportional Print / Save Button */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Print Card</span>
                  </button>

                  {/* Copy Clean Share Link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-900 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay Keepsake Seal</span>
                  </button>

                  <Link
                    to="/programs"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#5A1E65] text-white text-xs font-bold hover:bg-purple-900 transition-colors shadow-xs"
                  >
                    <span>See Programs in Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
