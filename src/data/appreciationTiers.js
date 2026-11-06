/**
 * Diversity Collective Ventura County — Appreciation Card Tiers
 * 
 * Defines the 4 donor recognition tiers, visual themes, impact narratives,
 * and threshold resolution logic.
 */

export const APPRECIATION_TIERS = {
  COMMUNITY_ALLY: 'community_ally',
  PRIDE_ADVOCATE: 'pride_advocate',
  RAINBOW_CHAMPION: 'rainbow_champion',
  VISIONARY_BENEFACTOR: 'visionary_benefactor'
};

export const DEFAULT_THRESHOLDS = {
  [APPRECIATION_TIERS.COMMUNITY_ALLY]: 1,       // $1 – $49
  [APPRECIATION_TIERS.PRIDE_ADVOCATE]: 50,     // $50 – $149
  [APPRECIATION_TIERS.RAINBOW_CHAMPION]: 150,  // $150 – $499
  [APPRECIATION_TIERS.VISIONARY_BENEFACTOR]: 500 // $500+
};

export const TIER_CONFIGS = {
  [APPRECIATION_TIERS.COMMUNITY_ALLY]: {
    id: APPRECIATION_TIERS.COMMUNITY_ALLY,
    title: 'Community Ally',
    circleName: 'Friend of Sanctuary',
    certificatePrefix: 'CA',
    minAmount: 1,
    accentColor: '#D97706', // Amber-600
    themeGradient: 'from-amber-500 via-rose-500 to-purple-600',
    cardBackground: 'bg-gradient-to-br from-amber-50/90 via-[#FCF9F2] to-rose-50/60',
    borderStyle: 'border-amber-300 shadow-amber-900/10',
    badgeText: 'COMMUNITY ALLY',
    tagline: 'Lifting Each Other Up, One Step at a Time',
    impactNarrative: 'Your generous contribution provides vital safer-sex supplies, harm reduction kits, welcoming computer access, and warm hospitality for local community members finding sanctuary at our Ventura Community Resource Center.',
    quote: '"Thank you for believing that everyone deserves a space where they are welcomed without reservation."',
    insignia: 'Warm Amber Sunrise & Prismatic Leaf',
    envelopeAccent: 'from-amber-400 to-rose-400',
    envelopeBg: 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EE] to-[#FDF2F4]',
    motif: 'botanical_sunrise'
  },
  [APPRECIATION_TIERS.PRIDE_ADVOCATE]: {
    id: APPRECIATION_TIERS.PRIDE_ADVOCATE,
    title: 'Pride Advocate',
    circleName: 'Advocate Circle',
    certificatePrefix: 'PA',
    minAmount: 50,
    accentColor: '#5A1E65', // Brand Deep Purple
    themeGradient: 'from-purple-600 via-fuchsia-500 to-amber-500',
    cardBackground: 'bg-gradient-to-br from-purple-50/90 via-[#FAF5FF] to-sky-50/60',
    borderStyle: 'border-purple-300 shadow-purple-900/15',
    badgeText: 'PRIDE ADVOCATE',
    tagline: 'Championing Health, Visibility & Dignity',
    impactNarrative: 'Your gift directly funds free, confidential rapid HIV and STI testing clinics, PrEP/PEP healthcare navigation, and stigma-free education through Diversity SHINES across all 10 Ventura County cities.',
    quote: '"Because of your advocacy, community members have immediate, compassionate access to the care they need to stay healthy and thrive."',
    insignia: 'Deep Amethyst Heart & Radiant Stars',
    envelopeAccent: 'from-purple-600 to-indigo-600',
    envelopeBg: 'bg-gradient-to-br from-[#FAF5FF] via-[#F3E8FF] to-[#EDE9FE]',
    motif: 'interconnected_rings'
  },
  [APPRECIATION_TIERS.RAINBOW_CHAMPION]: {
    id: APPRECIATION_TIERS.RAINBOW_CHAMPION,
    title: 'Rainbow Champion',
    circleName: 'Champion Circle',
    certificatePrefix: 'RC',
    minAmount: 150,
    accentColor: '#1E5A44', // Forest Emerald
    themeGradient: 'from-emerald-600 via-teal-500 to-purple-700',
    cardBackground: 'bg-gradient-to-br from-emerald-50/90 via-[#F0FDF4] to-purple-50/60',
    borderStyle: 'border-emerald-300 shadow-emerald-900/15',
    badgeText: 'RAINBOW CHAMPION',
    tagline: 'Fostering Resilience & Youth Leadership',
    impactNarrative: 'Your partnership underwrites weekly Rainbow Umbrella and Little Unicorns youth peer circles, creating lifelong friendships, mental health resilience, and affirming spaces where young people can be their authentic selves.',
    quote: '"Research proves having even one affirming adult reduces youth suicide risk by 40%. Your support ensures that sanctuary is always open."',
    insignia: 'Prismatic Crystal & Emerald Laurel',
    envelopeAccent: 'from-emerald-600 to-teal-700',
    envelopeBg: 'bg-gradient-to-br from-[#ECFDF5] via-[#E0F2FE] to-[#F5F3FF]',
    motif: 'pride_aurora_ribbons'
  },
  [APPRECIATION_TIERS.VISIONARY_BENEFACTOR]: {
    id: APPRECIATION_TIERS.VISIONARY_BENEFACTOR,
    title: 'Visionary Benefactor',
    circleName: 'Visionary Circle',
    certificatePrefix: 'VB',
    minAmount: 500,
    accentColor: '#B45309', // Deep Gold / Amber-700
    themeGradient: 'from-amber-400 via-purple-700 to-indigo-900',
    cardBackground: 'bg-gradient-to-br from-[#0F0D22] via-[#1B1238] to-[#0D1527] text-white',
    borderStyle: 'border-amber-400/90 ring-2 ring-amber-300/60 shadow-2xl shadow-amber-900/30',
    badgeText: 'VISIONARY BENEFACTOR',
    tagline: 'Transforming Lives Across Ventura County',
    impactNarrative: 'As a Visionary Benefactor, your profound investment anchors the operational foundation of Diversity Collective Ventura County. You empower the flagship Community Resource Center, sustain year-round advocacy, and ensure Ventura County Pride and the Youth Pride Prom remain forever free, affirming, and accessible to all.',
    quote: '"Your leadership transforms our community from surviving to thriving. We honor your extraordinary commitment to LGBTQ+ equality and dignity."',
    insignia: 'Sovereign Gold Crest & Diamond Prism',
    envelopeAccent: 'from-amber-500 via-yellow-400 to-purple-900',
    envelopeBg: 'bg-gradient-to-br from-[#1E1635] via-[#2D1B4E] to-[#0F0D22]',
    motif: 'sovereign_gold_crest'
  }
};

/**
 * Determine the appreciation tier based on a donation amount and configurable thresholds
 * @param {number} amountInDollars 
 * @param {Object} [customThresholds]
 * @returns {Object} Tier configuration
 */
export function getTierForAmount(amountInDollars, customThresholds = {}) {
  const amount = Number(amountInDollars) || 0;
  const t = { ...DEFAULT_THRESHOLDS, ...customThresholds };

  if (amount >= (t[APPRECIATION_TIERS.VISIONARY_BENEFACTOR] ?? 500)) {
    return TIER_CONFIGS[APPRECIATION_TIERS.VISIONARY_BENEFACTOR];
  }
  if (amount >= (t[APPRECIATION_TIERS.RAINBOW_CHAMPION] ?? 150)) {
    return TIER_CONFIGS[APPRECIATION_TIERS.RAINBOW_CHAMPION];
  }
  if (amount >= (t[APPRECIATION_TIERS.PRIDE_ADVOCATE] ?? 50)) {
    return TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE];
  }
  return TIER_CONFIGS[APPRECIATION_TIERS.COMMUNITY_ALLY];
}

/**
 * Format currency nicely
 */
export function formatDonationAmount(centsOrDollars, isCents = false) {
  const dollars = isCents ? Number(centsOrDollars) / 100 : Number(centsOrDollars);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(dollars);
}

/**
 * Retrieve active tier configurations, including any customizations made by staff in the Admin Portal
 */
export function getActiveTierConfigs() {
  if (typeof window === 'undefined') return TIER_CONFIGS;
  try {
    const custom = localStorage.getItem('dcvc_admin_card_tiers');
    if (custom) {
      const parsed = JSON.parse(custom);
      return {
        ...TIER_CONFIGS,
        ...parsed
      };
    }
  } catch {}
  return TIER_CONFIGS;
}

/**
 * Retrieve special custom cards created by staff in the Admin Portal
 */
export function getCustomSpecialCards() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('dcvc_admin_custom_cards');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    {
      id: 'custom-pride-gala-2026',
      title: 'Ventura County Pride Gala Sponsor',
      circleName: 'Gala Benefactor Circle',
      certificatePrefix: 'GALA',
      minAmount: 1000,
      accentColor: '#F59E0B',
      themeGradient: 'from-amber-400 via-rose-500 to-purple-800',
      badgeText: 'PRIDE GALA SPONSOR',
      tagline: 'Illuminating Equality Across Ventura County',
      impactNarrative: 'Presented in tribute for underwriting the 2026 Ventura County Pride Festival and Gala, ensuring our annual celebration remains forever free, accessible, and affirming for all 10 county cities.',
      quote: '"Your visionary sponsorship transforms our community gathering into an enduring beacon of queer joy and safety."',
      insignia: 'Prismatic Starlight & 24K Gala Laurel',
      motif: 'sovereign_gold_crest',
      signee1Name: 'Tess Allen',
      signee1Title: 'Executive Director · DCVC',
      signee2Name: 'Roland Catabona',
      signee2Title: 'President, Board of Directors',
      createdAt: '2026-02-15'
    },
    {
      id: 'custom-youth-champion',
      title: 'Rainbow Umbrella Youth Champion',
      circleName: 'Youth Guardian Circle',
      certificatePrefix: 'YOUTH',
      minAmount: 250,
      accentColor: '#10B981',
      themeGradient: 'from-emerald-500 via-teal-500 to-purple-700',
      badgeText: 'YOUTH CHAMPION',
      tagline: 'Nurturing the Next Generation of Leaders',
      impactNarrative: 'Dedicated in grateful appreciation for sustaining safe peer circles, mental health resilience, and the annual Youth Pride Prom for LGBTQ+ youth ages 13 to 23.',
      quote: '"Because you stood up for our youth, hundreds of young people found a community where they can thrive without fear."',
      insignia: 'Emerald Laurel & Guiding Beacon',
      motif: 'pride_aurora_ribbons',
      signee1Name: 'Tess Allen',
      signee1Title: 'Executive Director · DCVC',
      signee2Name: 'Sofia Rodriguez',
      signee2Title: 'Youth & Sanctuary Programs Lead',
      createdAt: '2026-03-01'
    }
  ];
}

