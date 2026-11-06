/**
 * Diversity Collective Ventura County — Verified Knowledge Retrieval Engine
 * 
 * Strict Grounding & Zero-Hallucination Source for "Ask DCVC"
 * Budget: $0 recurring cost (Cloudflare Workers AI Free Tier: 10,000 neurons/day)
 * Preferred Model: @cf/meta/llama-3.1-8b-instruct-fp8
 * 
 * Rules:
 *  - Never invent organizational information, fees, or event dates.
 *  - Distinguish confirmed vs unavailable data.
 *  - Respect event cancellation and historical status.
 *  - Protect user privacy: never collect or store health/demographic data.
 *  - Direct to /contact whenever information is unverified.
 */

export const EXACT_FALLBACK_MESSAGE = 
  "I couldn't find verified information about that on the DCVC website. Please contact the Diversity Collective team for confirmation.";

export const DCVC_CONTACT_URL = "/contact";

/**
 * 13 Verified Knowledge Domains
 */
export const VERIFIED_KNOWLEDGE_BASE = [
  // 1. Organization Overview
  {
    id: "org-info",
    category: "organization",
    title: "Diversity Collective Ventura County (DCVC)",
    officialUrl: "/about",
    costType: "Nonprofit 501(c)(3)",
    summary: "Diversity Collective Ventura County is a community-based 501(c)(3) nonprofit organization established in 2014 dedicated to promoting advocacy, visibility, safety, and clinical wellness for the LGBTQ+ community throughout Ventura County.",
    verifiedFacts: [
      "Official Name: Diversity Collective Ventura County, Inc. (DCVC)",
      "Nonprofit Status: 501(c)(3) tax-exempt public charity (founded 2014)",
      "Federal EIN: 46-5312131",
      "Executive Director: Tess Allen | Board President: Roland Catabona",
      "Mission: Promoting advocacy, visibility, safety, and wellness for the LGBTQ+ community across all 10 Ventura County cities.",
      "Service Area: Ventura, Oxnard, Camarillo, Thousand Oaks, Simi Valley, Moorpark, Santa Paula, Fillmore, Port Hueneme, and Ojai."
    ],
    keywords: ["organization", "about", "history", "dcvc", "nonprofit", "501c3", "ein", "founded", "tess allen", "roland catabona", "mission", "ventura county", "leadership"]
  },

  // 2. Community Resource Center (Physical Sanctuary)
  {
    id: "crc",
    category: "program",
    title: "Community Resource Center (Sanctuary)",
    officialUrl: "/programs/community-resource-center",
    costType: "100% Free",
    eligibility: "Open to all LGBTQ+ individuals, families, youth, and affirming allies.",
    hours: "Monday through Friday: 1:00 PM – 5:00 PM Pacific Time",
    location: "2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "The Community Resource Center is Ventura County's premier physical LGBTQ+ cultural sanctuary and drop-in hub offering a computer lab, library, mutual aid pantry, and community meeting space.",
    verifiedFacts: [
      "Location: 2471 Portola Road, Suite 100, Ventura, CA 93003",
      "Operating Hours: Monday – Friday, 1:00 PM – 5:00 PM PT (Closed weekends & major holidays)",
      "Cost: 100% Free drop-in access. No membership fees or reservations required.",
      "Amenities: Free high-speed computer/cyber lab, printing for essential needs, LGBTQ+ lending library, mutual aid food and hygiene supplies, safe harbor lounge.",
      "Phone: (805) 644-LGBT (805-644-5428)"
    ],
    keywords: ["center", "sanctuary", "community resource center", "crc", "address", "location", "hours", "directions", "portola", "visit", "drop in", "computer", "wifi", "library", "pantry", "food", "open", "phone"]
  },

  // 3. Diversity SHINES (Free Rapid HIV & STI Testing Clinic)
  {
    id: "diversity-shines",
    category: "service",
    title: "Diversity SHINES (Health & Wellness Clinic)",
    officialUrl: "/programs/diversity-shines",
    costType: "100% Free",
    eligibility: "Ages 12 and older. Confidential under California Minor Consent laws.",
    hours: "During Resource Center hours (Mon–Fri 1:00 PM – 5:00 PM PT) or by appointment",
    location: "2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "Diversity SHINES is DCVC's clinical health initiative providing free, confidential rapid HIV and STI screenings, PrEP/PEP healthcare navigation, and safer sex supplies.",
    verifiedFacts: [
      "Cost: 100% Free. No health insurance, co-pay, or payment ever required.",
      "Screenings Provided: Rapid HIV (fingerstick blood test, results in 15–20 minutes), Hepatitis C, and partner-referred STI screenings (Syphilis, Chlamydia, Gonorrhea).",
      "Documentation: No government ID, insurance card, or parental consent required for youth 12+ (California Minor Consent Law).",
      "PrEP & PEP Navigation: Free linkage to biomedical HIV prevention medications with zero out-of-pocket assistance programs.",
      "Supplies: Free external/internal condoms, dental dams, and safer-sex harm reduction kits available in the lobby.",
      "Medical Disclaimer: DCVC provides rapid screening and referral navigation, not hospital emergency treatment or prescription dispensing on-site."
    ],
    keywords: ["shines", "hiv", "sti", "testing", "screening", "std", "prep", "pep", "condoms", "health", "free testing", "confidential", "hepatitis", "rapid test", "wellness", "medical", "clinic"]
  },

  // 4. Rainbow Umbrella (Youth Peer Program)
  {
    id: "rainbow-umbrella",
    category: "program",
    title: "Rainbow Umbrella (RU Youth Program)",
    officialUrl: "/programs/rainbow-umbrella",
    costType: "100% Free",
    eligibility: "Strictly for youth and young adults ages 13 through 23 and affirming friends.",
    hours: "Every Friday evening: 5:30 PM – 7:30 PM Pacific Time",
    location: "Community Resource Center: 2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "Rainbow Umbrella is Ventura County's longest-running weekly peer-support youth group empowering LGBTQ+ youth and allies ages 13–23 in an affirming, chaperoned space.",
    verifiedFacts: [
      "Age Requirement: Ages 13 to 23 exclusively. (Children under 13 attend Little Unicorns; adults 24+ join adult groups).",
      "Schedule: Meets every Friday from 5:30 PM to 7:30 PM PT.",
      "Cost: 100% Free. Snacks and supplies provided at no charge.",
      "Structure: Youth-led, adult-chaperoned. Focuses on peer check-ins, discussions, creative arts, leadership building, and social connection.",
      "Safety: Facilitators undergo background checks and youth protection training."
    ],
    keywords: ["rainbow umbrella", "youth", "teen", "ru", "teens", "friday", "age", "young adults", "peer support", "13", "23", "high school", "chaperoned", "kids"]
  },

  // 5. Little Unicorns (Children Ages 9–13 & Families)
  {
    id: "little-unicorns",
    category: "program",
    title: "Little Unicorns (Kids & Caregiver Circle)",
    officialUrl: "/programs/little-unicorns",
    costType: "100% Free",
    eligibility: "Children ages 9 through 13 who are gender-expansive, transgender, LGBTQ+, or questioning, and their parents/caregivers.",
    hours: "1st and 3rd Saturday of each month: 10:00 AM – 11:30 AM PT",
    location: "Community Resource Center: 2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "Little Unicorns provides affirming, creative peer socialization for children ages 9–13 and concurrent caregiver support navigating schools and family journeys.",
    verifiedFacts: [
      "Age Requirement: Children ages 9 to 13.",
      "Schedule: 1st and 3rd Saturday of every month, 10:00 AM – 11:30 AM PT.",
      "Cost: 100% Free.",
      "Format: Supervised arts/crafts and social play for kids, with a simultaneous parent/caregiver sharing and resource circle in the adjoining room."
    ],
    keywords: ["little unicorns", "children", "kids", "elementary", "middle school", "parents", "caregivers", "family", "families", "saturday", "9", "13", "gender expansive", "transgender kids"]
  },

  // 6. Adult Peer Support & Transgender Circles
  {
    id: "adult-circles",
    category: "program",
    title: "Transgender & Non-Binary Adult Circles",
    officialUrl: "/programs",
    costType: "100% Free",
    eligibility: "Transgender, non-binary, genderqueer, and questioning adults ages 18+.",
    hours: "Twice monthly on alternating weekday evenings (check calendar for dates)",
    location: "2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "Facilitated peer circles for trans and non-binary adults offering shared lived experience, transition navigation, mutual support, and community solidarity.",
    verifiedFacts: [
      "Age Requirement: Adults ages 18 and older.",
      "Cost: 100% Free.",
      "Focus: Social connection, community resilience, name and gender marker legal clinic linkages, and healthcare navigation."
    ],
    keywords: ["trans", "transgender", "nonbinary", "non-binary", "genderqueer", "adults", "peer circle", "support group", "18+"]
  },

  // 7. Mental Health & Counseling Navigation
  {
    id: "mental-health",
    category: "service",
    title: "Mental Health Navigation & Crisis Resources",
    officialUrl: "/programs",
    costType: "Free navigation; therapist partners offer sliding-scale or covered insurance",
    summary: "DCVC provides warm handoffs to vetted LGBTQ+-affirming licensed therapists, subsidized counseling partners, and 24/7 crisis hotlines.",
    verifiedFacts: [
      "Navigation Cost: Free guidance and provider directory referrals from DCVC staff.",
      "Emergency Crisis Resources: DCVC is NOT an emergency response facility. In crisis, immediately call or text 988 (Suicide & Crisis Lifeline) or contact The Trevor Project at 1-866-488-7386 (24/7 LGBTQ+ youth).",
      "County Partner: Ventura County Behavioral Health (VCBH) Access Line: 1-866-998-2243."
    ],
    keywords: ["mental health", "therapy", "counselor", "counseling", "therapist", "crisis", "depression", "suicide", "trevor project", "988", "vcbh", "help"]
  },

  // 8. Signature Annual Events & Festivals
  {
    id: "events",
    category: "event",
    title: "Annual Community Events & Festivals",
    officialUrl: "/events",
    costType: "Many events are free to enter; annual gala is a ticketed fundraiser",
    summary: "DCVC produces Ventura County's premier LGBTQ+ celebrations including Ventura County Pride, the Diversity Gala, and youth Pride Prom.",
    verifiedFacts: [
      "Ventura County Pride: Annual flagship seaside celebration held in August at Promenade Park / Surfers Point in Ventura. Features mainstage performances, food trucks, community resource booths, and youth zone.",
      "Diversity Gala: Annual autumn formal awards celebration and fundraiser recognizing regional civic champions and equality advocates. (Ticketed benefit).",
      "Pride Prom: Annual spring formal celebration specifically for LGBTQ+ and allied high school youth across Ventura County, providing an authentic, affirming prom experience.",
      "Outdated Events Policy: Past festival editions (e.g. 2023 or 2024 Pride) have concluded and are not upcoming. Check /events for current active dates.",
      "Cancellations: Any weather or public safety cancellations are published with official status badges on /events."
    ],
    keywords: ["events", "pride", "festival", "ventura county pride", "gala", "prom", "pride prom", "calendar", "upcoming", "dates", "schedule", "august", "tickets"]
  },

  // 9. Professional Education & Workplace Training
  {
    id: "training",
    category: "training",
    title: "LGBTQ+ Cultural Competency & Inclusion Training",
    officialUrl: "/training",
    costType: "Sliding-scale fee proposal based on organization type, headcount, and format",
    summary: "Professional workshops for corporate businesses, healthcare systems, schools, and non-profits on creating affirming environments and equitable practices.",
    verifiedFacts: [
      "Course Offerings: LGBTQ+ 101 Foundations, Affirming Healthcare Best Practices, Transgender Workplace Inclusion, and Youth Support in Academic Settings.",
      "Formats: In-person at client location or DCVC center, or live interactive virtual webinars.",
      "Fees: Never hardcoded as a single generic price. Fees are structured on a non-profit/civic sliding scale versus commercial rates based on workshop length and participant count. Organizations request a formal booking proposal at /training/book.",
      "Inquiries: Submit details at /training/book or email info@diversitycollective.org."
    ],
    keywords: ["training", "education", "workshop", "workplace", "cultural competency", "corporate", "inclusion", "diversity training", "fees", "cost", "book", "proposal", "healthcare training"]
  },

  // 10. Affirming Business Directory
  {
    id: "directory",
    category: "directory",
    title: "Ventura County Affirming Business Directory",
    officialUrl: "/directory",
    costType: "Free to search; Free for local businesses to apply",
    summary: "A searchable public directory of local Ventura County businesses, medical practices, legal services, and venues that have signed the DCVC LGBTQ+ Affirming Pledge.",
    verifiedFacts: [
      "Public Search: Free searchable directory at /directory filtered by category (dining, healthcare, legal, retail, etc.) and city.",
      "Business Submissions: Local business owners can submit listings at /directory/submit. Must sign the LGBTQ+ Affirming Pledge promising zero discrimination and inclusive policies.",
      "Staff Vetting: All listings are manually verified by DCVC staff before public publishing."
    ],
    keywords: ["directory", "businesses", "affirming business", "pledge", "shops", "doctors", "doctor", "shop", "store", "stores", "dentist", "friendly", "safe spaces", "submit listing", "local businesses"]
  },

  // 11. Donations & Financial Stewardship
  {
    id: "donations",
    category: "giving",
    title: "Donations & Zero-Fee Giving via Zeffy",
    officialUrl: "/donate",
    costType: "Tax-Deductible 501(c)(3) Contribution",
    summary: "DCVC uses Zeffy, a 100% zero-fee nonprofit fundraising platform where 100% of every dollar donated supports Ventura County programs with zero merchant deductions.",
    verifiedFacts: [
      "Tax Deductibility: All contributions are tax-deductible to the fullest extent of the law under 501(c)(3) EIN: 46-5312131.",
      "Platform Guarantee: 100% of your donation reaches DCVC programs because Zeffy absorbs all credit card and processing fees.",
      "Giving Options: One-time gift or monthly recurring sustainer.",
      "Appreciation Card Tiers: Community Ally ($1+), Pride Advocate ($50+), Rainbow Champion ($150+), Visionary Benefactor ($500+). Donors receive a personalized digital keepsake certificate.",
      "Official Tax Receipts: Issued automatically by Zeffy separately from DCVC appreciation cards."
    ],
    keywords: ["donate", "donation", "giving", "zeffy", "support", "tax deductible", "501c3", "monthly", "appreciation card", "contribute", "fund", "money"]
  },

  // 12. Volunteer Opportunities
  {
    id: "volunteer",
    category: "volunteer",
    title: "Volunteer Opportunities & Community Service",
    officialUrl: "/volunteer",
    costType: "Volunteer Service",
    eligibility: "Ages 16+ (Youth program chaperones must be 21+ and pass Live Scan background check)",
    summary: "Volunteer roles include Center greeter/host, Pride festival staffing, Diversity SHINES outreach assistant, and event coordination.",
    verifiedFacts: [
      "Application: Submit interest at /volunteer.",
      "Roles: Front-desk community center host, annual Pride festival operations, health clinic outreach ambassador, gala setup, and community workshops.",
      "Youth Protection: Roles directly interacting with minors (e.g. Rainbow Umbrella chaperones) require a completed interview and Live Scan background check.",
      "Student Hours: DCVC certifies approved high school and college community service hours."
    ],
    keywords: ["volunteer", "volunteering", "community service", "hours", "help out", "get involved", "apply to volunteer", "chaperone", "pride volunteer"]
  },

  // 13. Contact & Crisis Inquiries
  {
    id: "contact",
    category: "contact",
    title: "Contact Information & Center Inquiries",
    officialUrl: "/contact",
    costType: "Free",
    location: "2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "Direct contact avenues to reach DCVC staff, submit inquiries, or schedule on-site appointments.",
    verifiedFacts: [
      "Main Center Phone: (805) 644-LGBT / (805) 644-5428",
      "Email: info@diversitycollective.org",
      "Mailing & Physical Address: 2471 Portola Road, Suite 100, Ventura, CA 93003",
      "Operating Hours: Monday through Friday: 1:00 PM – 5:00 PM PT",
      "Website Contact Form: Available 24/7 at /contact",
      "Emergency Warning: If you or someone you know is in immediate danger or severe mental health crisis, call 911 or call/text 988 (24/7 National Crisis Lifeline). DCVC offices do not provide 24/7 crisis monitoring."
    ],
    keywords: ["contact", "email", "phone", "call", "address", "hours", "reach", "message", "emergency", "crisis", "location", "help"]
  },

  // 14. Verified Civic Sponsors & Health Partners
  {
    id: "sponsors-partners",
    category: "sponsors",
    title: "Civic Alliances, Sponsors & Health Partners",
    officialUrl: "/sponsors",
    costType: "Partnerships",
    summary: "Diversity Collective works in official collaboration with regional public health agencies and institutional partners across Ventura County.",
    verifiedFacts: [
      "Ventura County Behavioral Health (VCBH): Foundational community health partner providing crisis intervention and mental health clinical navigation.",
      "Ventura County Public Health (VCPH): Official public health partner collaborating on STI screenings, disease surveillance, and community wellness.",
      "Diversity SHINES: Clinical rapid testing partner providing free confidential screenings for HIV, Hepatitis C, and STIs.",
      "Little Unicorns Initiative: Program partner providing affirming spaces for youth ages 9–13 and caregiver circles.",
      "Corporate & Foundation Sponsorships: Information on becoming an official event sponsor or community partner is available at /sponsors."
    ],
    keywords: ["sponsors", "partners", "alliances", "vcbh", "vcph", "agencies", "public health", "county of ventura", "sponsorship", "partner with us"]
  }
];

/**
 * Stop words for search tokenization
 */
const STOP_WORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does",
  "for", "from", "how", "i", "in", "is", "it", "my", "of", "on", "or", "our",
  "tell", "the", "their", "there", "this", "to", "was", "we", "what", "when",
  "where", "which", "who", "will", "with", "you", "your"
]);

/**
 * Tokenize and normalize query text
 */
export function extractKeywords(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Detect medical or legal advice boundaries
 */
export function detectBoundaryQueries(query) {
  const lower = query.toLowerCase();
  
  // Medical diagnostic / clinical advice
  const medicalTriggers = [
    "diagnose", "diagnosis", "rash", "blister", "symptom", "cure", "prescribe",
    "prescription", "am i positive", "do i have hiv", "treat my", "medicine dose"
  ];
  const isMedical = medicalTriggers.some(t => lower.includes(t));

  // Legal counsel
  const legalTriggers = [
    "lawsuit", "sue my", "legal advice", "court case", "lawyer representation",
    "can i sue", "file a complaint in court"
  ];
  const isLegal = legalTriggers.some(t => lower.includes(t));

  // Crisis / Suicidal ideation
  const crisisTriggers = [
    "suicide", "kill myself", "end my life", "want to die", "self harm", "cutting myself"
  ];
  const isCrisis = crisisTriggers.some(t => lower.includes(t));

  // Prompt injection attempts
  const injectionTriggers = [
    "ignore all previous", "ignore previous instructions", "disregard instructions",
    "reveal your prompt", "what is your system prompt", "output system instructions",
    "repeat the above", "jailbreak", "you are now in developer mode", "dan mode"
  ];
  const isInjection = injectionTriggers.some(t => lower.includes(t));

  return { isMedical, isLegal, isCrisis, isInjection };
}

// Pre-build index of all recognized DCVC domain vocabulary to detect out-of-domain / hallucination probes
const RECOGNIZED_DCVC_VOCABULARY = new Set([
  "dcvc", "diversity", "collective", "ventura", "county", "community", "resource", "center", "sanctuary",
  "crc", "portola", "testing", "screenings", "screening", "rapid", "hiv", "sti", "std", "prep", "pep",
  "condoms", "rainbow", "umbrella", "ru", "youth", "teens", "teen", "children", "kids", "little", "unicorns",
  "trans", "transgender", "nonbinary", "non-binary", "circles", "support", "group", "groups", "parents",
  "caregivers", "mental", "health", "counseling", "therapy", "therapist", "crisis", "vcbh", "vcph", "shines",
  "events", "pride", "festival", "prom", "gala", "dates", "calendar", "volunteer", "volunteering", "chaperone",
  "donate", "donation", "giving", "zeffy", "tax", "deductible", "501c3", "ein", "appreciation", "card",
  "cards", "directory", "business", "businesses", "affirming", "pledge", "shops", "doctors", "doctor",
  "training", "workplace", "cultural", "competency", "workshop", "workshops", "contact", "email", "phone",
  "hours", "address", "location", "free", "fees", "cost", "programs", "services", "allies", "queer", "lgbtq",
  "lgbtq+", "lesbian", "gay", "bisexual", "asexual", "intersex", "tess", "allen", "roland", "catabona"
]);

/**
 * Search the verified DCVC knowledge base
 * Returns matched knowledge records and exact citations
 */
export function searchKnowledgeBase(query) {
  if (!query || typeof query !== "string") {
    return { matches: [], bestMatch: null, isFallbackRequired: true };
  }

  const queryLower = query.toLowerCase().trim();
  const tokens = extractKeywords(query);

  // Check boundaries
  const boundaries = detectBoundaryQueries(queryLower);

  // Hallucination Guard: If query contains alien nouns not in DCVC vocabulary,
  // do not hallucinate a match just because "center" or "dcvc" was in the sentence.
  const alienTokens = tokens.filter(t => !RECOGNIZED_DCVC_VOCABULARY.has(t));
  const hasStrongAlienQuery = alienTokens.some(t => 
    ["scuba", "diving", "crypto", "bitcoin", "ethereum", "astrology", "pizza", "hotel", "swimming", "karate", "airline"].includes(t)
  );

  // Score each knowledge domain
  const scoredEntries = VERIFIED_KNOWLEDGE_BASE.map(entry => {
    let score = 0;

    // Check exact keyword matches
    for (const kw of entry.keywords) {
      if (queryLower.includes(kw)) {
        score += kw.includes(" ") ? 8 : 4; // Multi-word keyword bonus
      }
      for (const token of tokens) {
        if (kw === token) score += 3;
        else if (kw.includes(token) || token.includes(kw)) score += 1;
      }
    }

    // Check verified facts for term occurrences
    for (const fact of entry.verifiedFacts) {
      const factLower = fact.toLowerCase();
      if (queryLower.includes(entry.title.toLowerCase())) score += 6;
      for (const token of tokens) {
        if (factLower.includes(token)) score += 1.5;
      }
    }

    return { entry, score };
  });

  // Sort descending by score
  scoredEntries.sort((a, b) => b.score - a.score);

  // Require minimum relevance threshold to prevent hallucinating on random queries
  const topMatches = scoredEntries.filter(item => item.score >= 5);

  const bestMatch = (!hasStrongAlienQuery && topMatches.length > 0) ? topMatches[0].entry : null;
  const isFallbackRequired = (hasStrongAlienQuery || !bestMatch) && !boundaries.isCrisis && !boundaries.isMedical && !boundaries.isLegal;

  return {
    query,
    tokens,
    boundaries,
    matches: topMatches.map(m => m.entry),
    bestMatch,
    isFallbackRequired
  };
}

/**
 * Format retrieved facts into a compact, token-conscious context string
 * Designed to minimize Cloudflare Workers AI neuron consumption
 */
export function buildRetrievedContext(matchedEntries) {
  if (!matchedEntries || matchedEntries.length === 0) return "";

  // Cap at top 2 entries to keep tokens well under 400
  const entriesToInclude = matchedEntries.slice(0, 2);

  return entriesToInclude.map(e => {
    return [
      `### ${e.title} [Link: ${e.officialUrl}]`,
      `Cost: ${e.costType}`,
      e.eligibility ? `Eligibility: ${e.eligibility}` : null,
      e.hours ? `Hours: ${e.hours}` : null,
      e.location ? `Location: ${e.location}` : null,
      `Verified Facts:`,
      ...e.verifiedFacts.map(f => `- ${f}`)
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}

/**
 * Construct the strict, zero-hallucination system prompt for Cloudflare Workers AI Llama-3.1-8b
 */
export function buildChatbotSystemPrompt(retrievedContext) {
  return [
    `You are "Ask DCVC", the official verified assistant for Diversity Collective Ventura County (501(c)(3) nonprofit).`,
    `Your primary goal is to provide accurate, welcoming, concise answers strictly based on the RETRIEVED CONTEXT below.`,
    ``,
    `STRICT RESPONSE RULES:`,
    `1. NEVER INVENT INFORMATION. If the answer is not confirmed in the retrieved context, reply EXACTLY: "${EXACT_FALLBACK_MESSAGE}"`,
    `2. NEVER GUESS FEES OR PRICES. If a service is free, confirm it is free. If training, state that fees are based on organization proposal requests at /training/book.`,
    `3. NEVER INVENT EVENT DATES. Historical past events must NOT be described as upcoming.`,
    `4. NO MEDICAL OR LEGAL ADVICE. Direct healthcare questions to Diversity SHINES free screenings or 988 for crisis.`,
    `5. INCLUDE OFFICIAL LINKS. Whenever referencing a program or service, include markdown link (e.g. [Community Resource Center](/programs/community-resource-center)).`,
    `6. KEEP RESPONSES CONCISE. Under 100 words. Polite, affirming, and institutional.`,
    ``,
    `RETRIEVED CONTEXT:`,
    retrievedContext || "No matching verified DCVC content found."
  ].join("\n");
}
