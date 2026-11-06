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
    minAmount: 1,
    accentColor: '#D97706', // Amber-600
    themeGradient: 'from-amber-500 via-rose-500 to-purple-600',
    cardBackground: 'bg-gradient-to-br from-amber-50 via-rose-50/50 to-purple-50',
    borderStyle: 'border-amber-300 shadow-amber-900/10',
    badgeText: 'COMMUNITY ALLY',
    tagline: 'Lifting Each Other Up, One Step at a Time',
    impactNarrative: 'Your generous contribution provides vital safer-sex supplies, harm reduction kits, and welcoming computer access for local community members finding sanctuary at our Ventura Community Resource Center.',
    quote: '"Thank you for believing that everyone deserves a space where they are welcomed without reservation."',
    insignia: 'Warm Amber Sunrise & Prismatic Leaf',
    envelopeAccent: 'from-amber-400 to-rose-400'
  },
  [APPRECIATION_TIERS.PRIDE_ADVOCATE]: {
    id: APPRECIATION_TIERS.PRIDE_ADVOCATE,
    title: 'Pride Advocate',
    circleName: 'Advocate Circle',
    minAmount: 50,
    accentColor: '#5A1E65', // Brand Deep Purple
    themeGradient: 'from-purple-600 via-fuchsia-500 to-amber-500',
    cardBackground: 'bg-gradient-to-br from-purple-50 via-fuchsia-50/40 to-slate-50',
    borderStyle: 'border-purple-300 shadow-purple-900/15',
    badgeText: 'PRIDE ADVOCATE',
    tagline: 'Championing Health, Visibility & Dignity',
    impactNarrative: 'Your gift directly funds free, confidential rapid HIV and STI testing clinics, PrEP/PEP healthcare navigation, and stigma-free education through Diversity SHINES.',
    quote: '"Because of your advocacy, community members have immediate, compassionate access to the care they need to stay healthy and thrive."',
    insignia: 'Deep Amethyst Heart & Radiant Stars',
    envelopeAccent: 'from-purple-600 to-indigo-600'
  },
  [APPRECIATION_TIERS.RAINBOW_CHAMPION]: {
    id: APPRECIATION_TIERS.RAINBOW_CHAMPION,
    title: 'Rainbow Champion',
    circleName: 'Champion Circle',
    minAmount: 150,
    accentColor: '#1E5A44', // Forest Emerald
    themeGradient: 'from-emerald-600 via-teal-500 to-purple-700',
    cardBackground: 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-purple-50/50',
    borderStyle: 'border-emerald-300 shadow-emerald-900/15',
    badgeText: 'RAINBOW CHAMPION',
    tagline: 'Fostering Resilience & Youth Leadership',
    impactNarrative: 'Your partnership underwrites weekly Rainbow Umbrella and Little Unicorns youth peer circles, creating lifelong friendships, mental health resilience, and affirming spaces where young people can be their authentic selves.',
    quote: '"Research proves having even one affirming adult reduces youth suicide risk by 40%. Your support ensures that sanctuary is always open."',
    insignia: 'Prismatic Crystal & Emerald Laurel',
    envelopeAccent: 'from-emerald-600 to-teal-700'
  },
  [APPRECIATION_TIERS.VISIONARY_BENEFACTOR]: {
    id: APPRECIATION_TIERS.VISIONARY_BENEFACTOR,
    title: 'Visionary Benefactor',
    circleName: 'Visionary Circle',
    minAmount: 500,
    accentColor: '#B45309', // Deep Gold / Amber-700
    themeGradient: 'from-amber-400 via-purple-700 to-indigo-900',
    cardBackground: 'bg-gradient-to-br from-amber-50 via-purple-50/60 to-indigo-50/50',
    borderStyle: 'border-amber-400 ring-2 ring-amber-300/60 shadow-amber-900/25',
    badgeText: 'VISIONARY BENEFACTOR',
    tagline: 'Transforming Lives Across Ventura County',
    impactNarrative: 'As a Visionary Benefactor, your profound investment anchors the operational foundation of Diversity Collective Ventura County. You empower the flagship Community Resource Center, sustain year-round advocacy, and ensure Ventura County Pride and the Youth Pride Prom remain forever free, affirming, and accessible to all.',
    quote: '"Your leadership transforms our community from surviving to thriving. We honor your extraordinary commitment to LGBTQ+ equality and dignity."',
    insignia: 'Sovereign Gold Crest & Diamond Prism',
    envelopeAccent: 'from-amber-500 via-yellow-400 to-purple-900'
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

