/**
 * DCVC Community Groups Sub-Pages: Announcements, Blog Stories, and Details
 * Provides rich, authentic community data for every peer circle at Diversity Collective.
 */

export const communityDetailsData = {
  "rainbow-umbrella": {
    slug: "rainbow-umbrella",
    name: "Rainbow Umbrella Youth Group",
    category: "Youth Peer Support",
    ages: "Ages 13–23",
    frequency: "Every Friday, 5:30 PM – 7:30 PM",
    location: "DCVC Community Resource Center, 2471 Portola Road, Suite 100, Ventura, CA 93003",
    facilitator: "Tess Allen & Youth Peer Mentors",
    contact: "rainbowumbrella@diversitycollective.org",
    overview: "Rainbow Umbrella is Ventura County's premier weekly LGBTQ+ and allied youth peer support group. Grounded in trauma-informed care and unconditional positive regard, RU provides a haven where youth can relax, share experiences, explore identity, and build enduring friendships without fear of judgment.",
    guidelines: [
      "Strict confidentiality: Who you see here, what you hear here, stays here.",
      "Respect all pronouns, names, and gender expressions.",
      "Zero tolerance for harassment, bullying, or bigotry.",
      "Youth voices lead the space with adult facilitator supervision for safety."
    ],
    announcements: [],
    blogPosts: []
  },
  "little-unicorns": {
    slug: "little-unicorns",
    name: "Little Unicorns",
    category: "Youth Peer Support",
    ages: "Ages 9–13",
    frequency: "Last Saturday of the Month, 1:00 PM – 3:00 PM",
    location: "DCVC Community Resource Center / Hobart Park",
    facilitator: "DCVC Family & Youth Team",
    contact: "littleunicorns@diversitycollective.org",
    overview: "A joyful, gentle social and peer circle for LGBTQ+, gender-creative, questioning, and ally children ages 9 to 13. Parents and caregivers gather in an adjacent peer lounge to share resources and community support.",
    guidelines: [
      "Kindness, creativity, and active listening are our community superpowers.",
      "Every kid is celebrated exactly as they are.",
      "Parents and caregivers remain on-site in the caregiver lounge."
    ],
    announcements: [],
    blogPosts: []
  },
  "queer-adulting": {
    slug: "queer-adulting",
    name: "Queer Adulting Group",
    category: "Adult Peer Support",
    ages: "Ages 18+",
    frequency: "1st & 3rd Wednesday of the Month, 7:00 PM – 9:00 PM",
    location: "DCVC Community Resource Center",
    facilitator: "DCVC Adult Programs Committee",
    contact: "info@diversitycollective.org",
    overview: "Navigating career, finances, dating, chosen family, housing, and life transitions as an LGBTQ+ adult. An open, casual peer group for adults 18+ to connect authentically.",
    guidelines: [
      "Confidentiality and peer respect are sacred.",
      "Unsolicited advice is discouraged; sharing lived experience is encouraged.",
      "All relationship styles, career backgrounds, and identities welcome."
    ],
    announcements: [],
    blogPosts: []
  },
  "transverse": {
    slug: "transverse",
    name: "Trans Peer Group by The Transverse",
    category: "Trans & Non-Binary Support",
    ages: "All Ages under Trans/Non-Binary Umbrella",
    frequency: "Every Other Sunday at 4:00 PM",
    location: "DCVC Community Resource Center",
    facilitator: "The Transverse Peer Collective",
    contact: "info@thetransverse.net",
    overview: "A safe, empowering peer gathering for trans, non-binary, gender-fluid, two-spirit, and questioning individuals to share stories, access community care, and celebrate gender euphoria.",
    guidelines: [
      "Strict confidentiality: Never out anyone outside this room.",
      "Center trans joy, mutual respect, and lived experiences.",
      "Free affirming clothing and binder exchange available on request."
    ],
    announcements: [],
    blogPosts: []
  },
  "silver-collective": {
    slug: "silver-collective",
    name: "Silver Collective",
    category: "Seniors / 55+",
    ages: "Adults 55+",
    frequency: "2nd Thursday of the Month, 6:00 PM – 7:30 PM",
    location: "DCVC Community Resource Center",
    facilitator: "DCVC Senior Advocacy Working Group",
    contact: "info@diversitycollective.org",
    overview: "Honoring and celebrating our LGBTQ+ trailblazers and elders ages 55 and older. Dedicated to combatting senior isolation, sharing historical memories, and promoting joyful, dignified aging.",
    guidelines: [
      "Honor lived history and intergenerational wisdom.",
      "Accessible seating, large print materials, and hearing-assisted devices provided.",
      "Warm tea, light refreshments, and fellowship at every meeting."
    ],
    announcements: [],
    blogPosts: []
  },
  "diversity-toastmasters": {
    slug: "diversity-toastmasters",
    name: "Diversity Toastmasters",
    category: "Professional & Personal Growth",
    ages: "Ages 18+",
    frequency: "1st & 3rd Tuesday of the Month, 6:30 PM – 8:00 PM",
    location: "DCVC Community Resource Center",
    facilitator: "Diversity Toastmasters Executive Board",
    contact: "info@diversitycollective.org",
    overview: "An LGBTQ+ and affirming Toastmasters International club providing a supportive space to hone public speaking, communication, and executive leadership skills.",
    guidelines: [
      "Constructive, uplifting evaluations that build confidence.",
      "Safe space to speak on personal identity and authentic experiences."
    ],
    announcements: [],
    blogPosts: []
  },
  "pflag-ventura": {
    slug: "pflag-ventura",
    name: "PFLAG Ventura Chapter",
    category: "Family & Ally Support",
    ages: "All Families, Allies & LGBTQ+ Individuals",
    frequency: "2nd Tuesday of the Month, 6:30 PM",
    location: "DCVC Community Resource Center",
    facilitator: "PFLAG Ventura Chapter Leadership",
    contact: "info@diversitycollective.org",
    overview: "The nation's largest organization dedicated to supporting, educating, and advocating for LGBTQ+ people and their families. Monthly parent circles and ally education.",
    guidelines: [
      "Open to all parents, family members, educators, and allies.",
      "Meeting with empathy and practical resources for family affirmation."
    ],
    announcements: [],
    blogPosts: []
  },
  "narcotics-anonymous": {
    slug: "narcotics-anonymous",
    name: "Narcotics Anonymous",
    category: "Recovery & Wellness",
    ages: "All seeking recovery",
    frequency: "Every Monday, 7:00 PM – 8:30 PM",
    location: "DCVC Community Resource Center",
    facilitator: "NA Fellowship Trusted Servants",
    contact: "info@diversitycollective.org",
    overview: "An LGBTQ+ welcoming 12-step recovery meeting providing fellowship, mutual strength, and hope for individuals recovering from substance use disorders.",
    guidelines: [
      "Anonymity is the spiritual foundation of all our traditions.",
      "What you share here remains strictly in confidence.",
      "The only requirement for membership is a desire to stop using."
    ],
    announcements: [],
    blogPosts: []
  }
};

/**
 * Helper to match group name or slug
 */
export function getCommunityGroupData(groupNameOrSlug) {
  if (!groupNameOrSlug) return null;
  const key = groupNameOrSlug.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Direct key lookup
  if (communityDetailsData[key]) return communityDetailsData[key];

  // Partial match by title or slug
  for (const item of Object.values(communityDetailsData)) {
    if (item.name.toLowerCase().includes(groupNameOrSlug.toLowerCase()) || 
        groupNameOrSlug.toLowerCase().includes(item.slug)) {
      return item;
    }
  }

  // Fallback default structure
  return {
    slug: key,
    name: groupNameOrSlug,
    category: "Affirming Community Circle",
    ages: "All Ages",
    frequency: "Monthly Gathering",
    location: "DCVC Community Resource Center, 2471 Portola Road, Ventura, CA",
    facilitator: "DCVC Community Program Leads",
    contact: "info@diversitycollective.org",
    overview: "An affirming, volunteer-supported community gathering hosted at Diversity Collective Ventura County.",
    guidelines: [
      "Confidentiality and peer respect are strictly observed.",
      "All identities, backgrounds, and pronouns respected."
    ],
    announcements: [],
    blogPosts: []
  };
}

