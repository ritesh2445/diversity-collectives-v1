/**
 * Determine Appreciation Card Tier based on amount and configurable thresholds
 */
export function resolveAppreciationTier(amountDollars, env) {
  const t1 = parseInt(env.APPRECIATION_TIER_1_MIN || '1', 10);
  const t2 = parseInt(env.APPRECIATION_TIER_2_MIN || '50', 10);
  const t3 = parseInt(env.APPRECIATION_TIER_3_MIN || '150', 10);
  const t4 = parseInt(env.APPRECIATION_TIER_4_MIN || '500', 10);

  if (amountDollars >= t4) {
    return {
      tier: 'visionary_benefactor',
      tierName: 'Visionary Benefactor',
      badge: 'VISIONARY CIRCLE',
      tagline: 'Transforming Lives Across Ventura County',
      impact: 'As a Visionary Benefactor, your profound investment anchors the operational foundation of Diversity Collective Ventura County. You empower the flagship Community Resource Center, sustain year-round advocacy, and ensure Ventura County Pride and the Youth Pride Prom remain forever free, affirming, and accessible to all.'
    };
  }
  if (amountDollars >= t3) {
    return {
      tier: 'rainbow_champion',
      tierName: 'Rainbow Champion',
      badge: 'CHAMPION CIRCLE',
      tagline: 'Fostering Resilience & Youth Leadership',
      impact: 'Your partnership underwrites weekly Rainbow Umbrella and Little Unicorns youth peer circles, creating lifelong friendships, mental health resilience, and affirming spaces where young people can be their authentic selves.'
    };
  }
  if (amountDollars >= t2) {
    return {
      tier: 'pride_advocate',
      tierName: 'Pride Advocate',
      badge: 'ADVOCATE CIRCLE',
      tagline: 'Championing Health, Visibility & Dignity',
      impact: 'Your gift directly funds free, confidential rapid HIV and STI testing clinics, PrEP/PEP healthcare navigation, and stigma-free education through Diversity SHINES.'
    };
  }
  return {
    tier: 'community_ally',
    tierName: 'Community Ally',
    badge: 'COMMUNITY ALLY',
    tagline: 'Lifting Each Other Up, One Step at a Time',
    impact: 'Your generous contribution provides vital safer-sex supplies, harm reduction kits, and welcoming computer access for local community members finding sanctuary at our Ventura Community Resource Center.'
  };
}

