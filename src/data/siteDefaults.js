/**
 * Canonical Single Source of Truth for Frontend & Admin Studio Defaults
 * Any updates to live frontend copy, section defaults, or theme tokens here
 * automatically pre-populate in the Admin Panel as the baseline editable state.
 */

export const DEFAULT_HERO_THEME_ID = 'aurora';

export const DEFAULT_SITE_THEME = {
  // Primary Buttons (Explore Free Programs, Submit, Inquire)
  btnPrimaryBg: '#5A1E65',
  btnPrimaryBgGradient: 'linear-gradient(135deg, #5A1E65 0%, #7E22CE 55%, #4338CA 100%)',
  btnPrimaryText: '#FFFFFF',
  btnPrimaryHoverBg: '#4A1553',
  btnPrimaryRadius: '9999px',

  // Secondary Buttons (Visit Center, Call, Secondary CTAs)
  btnSecondaryBg: '#FFFFFF',
  btnSecondaryText: '#0F172A',
  btnSecondaryBorder: '#E2E8F0',
  btnSecondaryHoverBg: '#FAF5FF',

  // Donate / Gold Action Button
  btnDonateBg: '#FDE047',
  btnDonateText: '#020617',
  btnDonateHoverBg: '#FACC15',

  // Top Navigation Bar Buttons
  navBtnText: '#000000',
  navBtnActiveBg: '#5A1E65',
  navBtnActiveText: '#FFFFFF',

  // Typography Stacks
  headingFont: 'Plus Jakarta Sans',
  bodyFont: 'Plus Jakarta Sans',
  fontSizeScale: 100,

  // Card Appearance
  cardRadius: '24px',
  cardElevation: 'standard'
};

export const DEFAULT_PAGE_BLOCKS = [
  {
    id: 'block-impact-popups',
    type: 'impact_popups',
    title: 'Impact Quick Pop-ups (Highlight Sentences)',
    enabled: true,
    props: {
      intervalMs: 3800,
      stat1Number: '10+',
      stat1Label: 'years serving and advocating for Ventura County’s LGBTQ+ community.',
      stat2Number: '5,000+',
      stat2Label: 'free, confidential HIV & STI screenings delivered through Diversity SHINES.',
      stat3Number: '1,200+',
      stat3Label: 'LGBTQ+ youth empowered through Rainbow Umbrella peer circles & Pride Prom.',
      stat4Number: '100%',
      stat4Label: 'free and confidential care—no insurance or fees ever required.',
      stat5Number: '10',
      stat5Label: 'Ventura County cities united through affirming programs and mutual aid.'
    }
  },
  {
    id: 'block-hero',
    type: 'hero_banner',
    title: 'Hero Section & Center Bar',
    enabled: true,
    props: {
      statusHeadline: 'Center Open Today',
      statusSchedule: 'Mon–Fri 1:00 PM – 5:00 PM',
      statusTag: 'HIV/STI Screenings 1st Mon 3–7 PM',
      helplineText: 'Helpline: (805) 644-5428 · 24/7 Crisis: Dial 988',
      eyebrow: 'ESTABLISHED 2014 · VENTURA COUNTY 501(C)(3) NONPROFIT',
      titleLine1: 'You Are',
      titleAccentWord: 'Always Welcome',
      titleLine2: 'Here.',
      description:
        "Diversity Collective is Ventura County's premier cultural center and clinical wellness home — delivering free rapid health testing, youth peer programs, mutual aid, and intersectional advocacy across all 10 county cities.",
      primaryCtaText: 'Explore Free Programs',
      primaryCtaUrl: '/programs',
      secondaryCtaText: 'Visit Center',
      secondaryCtaUrl: '/contact',
      emailAddress: 'info@diversitycollective.org',
      photoUrl: '/images/volunteers.jpg',
      spotlightImage: '/images/community-gathering.jpg',
      locationBadge: '2471 Portola Road, Suite 100, Ventura',
      cardTitle: 'Community Resource Center',
      cardSubtitle: 'Physical safe harbor & clinical navigation'
    }
  },
  {
    id: 'block-stats',
    type: 'impact_stats',
    title: 'Impact (Detailed Milestones)',
    enabled: true,
    props: {
      eyebrow: '10-YEAR TRACK RECORD',
      headline: 'Trusted community support across Ventura County.',
      description: 'Since 2014, we have provided barrier-free, non-judgmental services to LGBTQ+ individuals, youth, and families.',
      stat1Number: '10+',
      stat1Label: 'Years of Community Service',
      stat1Sub: 'Defending rights and providing safe harbor in Ventura County since 2014.',
      stat2Number: '5,000+',
      stat2Label: 'Health Screenings',
      stat2Sub: 'Free, confidential HIV/STI testing and care navigation through Diversity SHINES.',
      stat3Number: '1,200+',
      stat3Label: 'Youth Empowered',
      stat3Sub: 'Safe peer circles, Pride Prom, and mentorship through Rainbow Umbrella.',
      stat4Number: '100%',
      stat4Label: 'Free & Confidential',
      stat4Sub: 'No insurance or fees required. Complete privacy and affirming care for all.'
    }
  },
  {
    id: 'block-upcoming-week',
    type: 'upcoming_week',
    title: 'Upcoming Programs & Events This Week',
    enabled: true,
    props: {
      eyebrow: 'THIS WEEK ACROSS VENTURA COUNTY',
      headline: 'Upcoming Programs & Events This Week',
      description: 'Explore verified weekly peer circles, youth spaces, recovery meetings, and special gatherings scheduled across Ventura County.',
      ctaText: 'View All Gatherings'
    }
  },
  {
    id: 'block-programs',
    type: 'programs_section',
    title: 'Programs (9 Featured Initiatives)',
    enabled: true,
    props: {
      eyebrow: 'CORE INITIATIVES',
      headline: 'Programs for every chapter of life.',
      description: 'Explore peer support groups, youth circles, recovery meetings, and community fellowship programs below.',
      ctaText: 'View All Programs'
    }
  },
  {
    id: 'block-signature-events',
    type: 'signature_events',
    title: 'Signature Annual Events (AIDS Walk, Pride Prom, Pride)',
    enabled: true,
    props: {
      eyebrow: 'SIGNATURE ANNUAL EVENTS',
      headline: 'Events That Unite Ventura County.',
      description: 'Celebrate, remember, and advocate together at our flagship annual community gatherings.',
      ctaText: 'Explore All Events'
    }
  },
  {
    id: 'block-events',
    type: 'events_section',
    title: 'Events for the Upcoming Week',
    enabled: true,
    props: {
      eyebrow: 'THIS WEEK AT DCVC',
      headline: 'Events for the Upcoming Week',
      ctaText: 'View Full Calendar'
    }
  },
  {
    id: 'block-calendar',
    type: 'calendar_section',
    title: 'Interactive Community Calendar',
    enabled: true,
    props: {
      eyebrow: 'COMMUNITY CALENDAR',
      headline: 'Interactive Schedule & Dates',
      description: 'Browse upcoming dates at a glance — distinct from our recurring Programs and Signature Events.',
      ctaText: 'Open Full Calendar Page'
    }
  },
  {
    id: 'block-special-engagements',
    type: 'special_engagements',
    title: 'Special Engagements (Hosted Groups)',
    enabled: true,
    props: {
      eyebrow: 'HOSTED AT DCVC',
      headline: 'Special Engagements & Hosted Collectives',
      description: 'Partner organizations and creative youth collectives we are currently hosting inside our Community Resource Center.',
      ctaText: 'Inquire About Hosting'
    }
  },
  {
    id: 'block-partnerships',
    type: 'partnerships_section',
    title: 'Civic & Community Partnerships',
    enabled: true,
    props: {
      eyebrow: 'CIVIC & COMMUNITY ALLIANCES',
      headline: 'Partnerships & Official Sponsors.',
      description: 'Collaboration with public health agencies, philanthropic foundations, and regional allies powers free programs across all 10 Ventura County cities.',
      ctaText: 'View All Sponsors & Partners'
    }
  },
  {
    id: 'block-directory',
    type: 'directory_cta',
    title: 'Affirming Business Directory Spotlight',
    enabled: true,
    props: {
      eyebrow: 'VENTURA COUNTY AFFIRMING NETWORK',
      headline: 'Shop, Dine & Connect Safely.',
      description: 'Discover verified LGBTQ+ owned and affirming businesses across Ventura, Oxnard, Ojai, Camarillo, and the Conejo Valley.',
      ctaText: 'Browse Full Directory',
      secondaryCtaText: 'Submit Your Business'
    }
  },
  {
    id: 'block-flex-space',
    type: 'flex_space',
    title: 'Flex Space & Slot Booking',
    enabled: true,
    props: {
      eyebrow: 'FLEX SPACE · SLOT BOOKING',
      headline: 'Community Flex Space at 2471 Portola Rd',
      description: 'Reserve a private or collaborative Flex Space time slot inside our Community Resource Center for peer meetings, telehealth, study, or organizing.',
      ctaText: 'Reserve a Flex Space Slot'
    }
  },
  {
    id: 'block-giving',
    type: 'zeffy_giving',
    title: 'Support Our Mission (0% Fee Zeffy)',
    enabled: true,
    props: {
      eyebrow: '❤️ 501(C)(3) COMMUNITY PHILANTHROPY',
      headline: 'Every Gift Directly Sustains Our Safe Harbor.',
      description: 'We never charge fees or require insurance for testing, drop-in care, or youth circles. Community contributions keep our doors open for anyone seeking care and belonging.',
      ctaText: 'Support Our Community'
    }
  },
  {
    id: 'block-voices',
    type: 'community_voices',
    title: 'Community Stories & Voices',
    enabled: true,
    props: {
      eyebrow: 'COMMUNITY VOICES',
      headline: 'In our neighbors’ words.'
    }
  },
  {
    id: 'block-newsletter',
    type: 'newsletter_section',
    title: 'Newsletter & Center Dispatch',
    enabled: true,
    props: {
      headline: 'Stay Connected With Our Center.'
    }
  },
  {
    id: 'block-final-cta',
    type: 'final_cta',
    title: 'Final Center Call to Action',
    enabled: true,
    props: {
      eyebrow: 'SUPPORT OUR 501(C)(3) MISSION',
      headlineLine1: '"We do what we do,',
      headlineAccent: 'because of you."',
      description: 'Diversity Collective of Ventura County is solely dedicated to advocating for and caring for our local LGBTQ+ community. Your generosity ensures our doors remain open, safe, and free for all.',
      primaryCtaText: 'Make a Community Gift Online',
      secondaryCtaText: 'Explore Volunteer Roles'
    }
  }
];

const DEFAULT_BLOCKS_BY_TYPE = new Map(
  DEFAULT_PAGE_BLOCKS.map((block) => [block.type, block])
);

export function replaceSanctuaryWithCenter(val) {
  if (typeof val === 'string') {
    return val
      .replace(/\bVisit Sanctuary\b/gi, 'Visit Center')
      .replace(/\bSanctuary\b/g, 'Center')
      .replace(/\bsanctuary\b/g, 'center')
      .replace(/\bSANCTUARY\b/g, 'CENTER');
  }
  if (Array.isArray(val)) {
    return val.map(replaceSanctuaryWithCenter);
  }
  if (val && typeof val === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = replaceSanctuaryWithCenter(v);
    }
    return res;
  }
  return val;
}

/**
 * Normalizes homepage layout blocks against DEFAULT_PAGE_BLOCKS so:
 * - Remote CMS syncs or partial overrides never lose section props or labels
 * - Any newly added default homepage blocks auto-populate in Admin for editing
 * - Legacy hero_banner cached defaults from older releases gently inherit updated live fields
 */
export function normalizePageLayoutBlocks(rawBlocks) {
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) {
    return DEFAULT_PAGE_BLOCKS.map((b) => ({ ...b, props: { ...(b.props || {}) } }));
  }

  const seenTypes = new Set();
  const normalized = rawBlocks
    .filter((block) => block && typeof block === 'object' && typeof block.type === 'string')
    .map((block, idx) => {
      const fallback = DEFAULT_BLOCKS_BY_TYPE.get(block.type);
      seenTypes.add(block.type);
      const rawProps = block.props && typeof block.props === 'object' ? block.props : {};

      // Clean out undefined keys from rawProps so live code defaults populate missing keys
      const definedProps = {};
      for (const [k, v] of Object.entries(rawProps)) {
        if (v !== undefined && v !== null) {
          definedProps[k] = v;
        }
      }

      const mergedBlock = {
        ...(fallback || {}),
        ...block,
        id: block.id || fallback?.id || `block-${block.type || idx}`,
        type: block.type || fallback?.type,
        title: block.title || block.label || fallback?.title || block.type,
        enabled: block.enabled !== false,
        props: {
          ...(fallback?.props || {}),
          ...definedProps
        }
      };

      return replaceSanctuaryWithCenter(mergedBlock);
    });

  if (normalized.length === 0) {
    return DEFAULT_PAGE_BLOCKS.map((b) => ({ ...b, props: { ...(b.props || {}) } }));
  }

  return replaceSanctuaryWithCenter(normalized);
}

/**
 * Upgrades legacy cached full-homepage layouts (e.g., from pre-partnerships releases)
 * onto the current DEFAULT_PAGE_BLOCKS sequence while preserving edited section props
 * and visibility flags. Leaves partial arrays untouched.
 */
export function upgradeOrNormalizePageLayout(rawBlocks) {
  const normalized = normalizePageLayoutBlocks(rawBlocks);
  const hasLegacyStatusOnly = normalized.some((b) => b?.type === 'status_pill');
  const heroBlock = normalized.find((b) => b?.type === 'hero_banner');
  const isLegacyHeroShape = Boolean(heroBlock && !heroBlock.props?.emailAddress && heroBlock.props?.phoneText);
  const hasFullLegacyOrder =
    normalized.some((b) => b?.type === 'hero_banner') &&
    normalized.some((b) => b?.type === 'programs_section') &&
    normalized.some((b) => b?.type === 'directory_cta');
  const missingV3Sections =
    !normalized.some((b) => b?.type === 'upcoming_week') ||
    !normalized.some((b) => b?.type === 'impact_popups') ||
    !normalized.some((b) => b?.type === 'signature_events') ||
    !normalized.some((b) => b?.type === 'calendar_section') ||
    !normalized.some((b) => b?.type === 'special_engagements') ||
    !normalized.some((b) => b?.type === 'flex_space');

  if (!hasLegacyStatusOnly && !isLegacyHeroShape && !(hasFullLegacyOrder && missingV3Sections)) {
    return replaceSanctuaryWithCenter(normalized);
  }

  const savedByType = new Map(normalized.map((b) => [b.type, b]));
  const upgraded = DEFAULT_PAGE_BLOCKS.map((defBlock) => {
    const prev = savedByType.get(defBlock.type);
    if (!prev) {
      return { ...defBlock, props: { ...(defBlock.props || {}) } };
    }
    return {
      ...defBlock,
      enabled: prev.enabled !== false,
      title: prev.title || defBlock.title,
      label: prev.label || prev.title || defBlock.title,
      props: {
        ...(defBlock.props || {}),
        ...(prev.props || {})
      }
    };
  });

  return replaceSanctuaryWithCenter(upgraded);
}

