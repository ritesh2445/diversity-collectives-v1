/**
 * Diversity Collective Ventura County — Local Zero-Quota Conversational Knowledge Engine
 * 
 * Provides a 100% FREE, UNLIMITED, ZERO-QUOTA conversational assistant.
 * Runs directly in the browser with:
 *  - 0 neuron consumption (unlimited chats per day)
 *  - 0 external API subscription or token costs
 *  - 0 latency (< 5ms response time)
 *  - 0 hallucination (strictly grounded in verified DCVC organizational data)
 *  - Emergency crisis handling (988 Lifeline, Trevor Project)
 *  - Medical and legal boundary guardrails
 *  - Negative hallucination fallback matching DCVC verification standards
 */

export const EXACT_FALLBACK_MESSAGE = 
  "I couldn't find verified information about that on the DCVC website. Please contact the Diversity Collective team for confirmation.";

export const DCVC_CONTACT_URL = "/contact";

/**
 * 14 Verified DCVC Knowledge Domains
 */
export const LOCAL_KNOWLEDGE_BASE = [
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
      "Cost: 100% Free. Includes peer activities, creative expression, leadership development, and free dinner/snacks.",
      "Safety: Facilitated by background-checked adult advisors; zero tolerance for bullying, harassment, or non-affirming conduct."
    ],
    keywords: ["rainbow umbrella", "ru", "youth", "teens", "friday", "friday night", "umbrella", "young adult", "13", "23", "peer support", "high school", "kids"]
  },
  {
    id: "little-unicorns",
    category: "program",
    title: "Little Unicorns (Children & Caregiver Group)",
    officialUrl: "/programs/little-unicorns",
    costType: "100% Free",
    eligibility: "Children ages 9 through 13 and their parents/caregivers.",
    hours: "1st and 3rd Saturday of each month: 10:00 AM – 11:30 AM Pacific Time",
    location: "Community Resource Center: 2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "Little Unicorns provides a joyful, affirming social circle for gender-expansive, non-binary, trans, and LGBTQ+ children ages 9–13 alongside a concurrent caregiver support group.",
    verifiedFacts: [
      "Age Requirement: Ages 9 to 13 accompanied by a parent or legal guardian.",
      "Schedule: Meets 1st & 3rd Saturday of each month, 10:00 AM – 11:30 AM PT.",
      "Dual Structure: Supervised creative play for kids while caregivers participate in a peer discussion group on affirming parenting.",
      "Cost: 100% Free."
    ],
    keywords: ["little unicorns", "unicorns", "children", "kids", "elementary", "middle school", "parents", "caregivers", "family", "9-13", "saturday"]
  },
  {
    id: "trans-peer-groups",
    category: "program",
    title: "Transgender & Non-Binary Peer Support Circle",
    officialUrl: "/programs/trans-support",
    costType: "100% Free",
    eligibility: "Transgender, non-binary, genderqueer, and questioning adults ages 18+.",
    hours: "1st and 3rd Wednesday of each month: 6:30 PM – 8:00 PM Pacific Time",
    location: "Community Resource Center: 2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "A peer-led affinity sanctuary for trans and non-binary adults offering shared experiences, transition navigation, gender-affirming garment closet access, and community bonding.",
    verifiedFacts: [
      "Eligibility: Trans, non-binary, Two-Spirit, gender-expansive adults (18+).",
      "Schedule: 1st & 3rd Wednesday, 6:30 PM – 8:00 PM PT.",
      "Cost: 100% Free.",
      "Resources: Access to community clothing closet, binders, voice transition resources, and legal name/gender marker guidance."
    ],
    keywords: ["trans", "transgender", "nonbinary", "non-binary", "genderqueer", "adults", "transition", "support group", "wednesday", "clothing", "binders"]
  },
  {
    id: "mental-health-navigation",
    category: "service",
    title: "Mental Health Care Navigation",
    officialUrl: "/programs/mental-health",
    costType: "100% Free Navigation",
    eligibility: "All Ventura County community members.",
    hours: "Monday through Friday: 1:00 PM – 5:00 PM Pacific Time",
    location: "Community Resource Center or Phone/Virtual",
    summary: "DCVC care navigators connect LGBTQ+ community members with vetted, culturally competent therapists, sliding-scale counselors, and crisis resources across Ventura County.",
    verifiedFacts: [
      "Scope: Navigation and referral matching, not acute crisis stabilization or clinical psychiatry on-site.",
      "Crisis Resources: Immediate crisis callers are directed to 988 Suicide & Crisis Lifeline, The Trevor Project (1-866-488-7386), or VCBH 24/7 Crisis Team (1-866-998-2243).",
      "Cost: Referral navigation is 100% free; external providers may offer Medi-Cal or sliding-scale fees."
    ],
    keywords: ["mental health", "therapy", "counseling", "therapist", "psychologist", "crisis", "depression", "anxiety", "navigation", "referral", "distress"]
  },
  {
    id: "events",
    category: "events",
    title: "Community Events & Festivals",
    officialUrl: "/events",
    costType: "Festival Free Admission | Gala Benefit Ticketed",
    summary: "DCVC produces prominent cultural celebrations including the annual Ventura County Pride Festival, Diversity Gala, Pride Prom, and seasonal workshops.",
    verifiedFacts: [
      "Ventura County Pride: Held annually in August at Promenade Park in Ventura. Free community festival featuring live stages, vendors, and community village.",
      "Annual Diversity Gala: Fall fundraising dinner and community recognition gala.",
      "Youth Pride Prom: Annual spring formal dance celebration for LGBTQ+ high school and college youth (ages 13–20).",
      "Event Accuracy Rule: Historical events (e.g. 2023 or 2024 festivals) have concluded. Check /events for active verified dates."
    ],
    keywords: ["events", "pride", "festival", "gala", "prom", "upcoming", "calendar", "tickets", "august", "promenade park"]
  },
  {
    id: "training",
    category: "education",
    title: "P.R.I.D.E. Cultural Competency Training",
    officialUrl: "/training",
    costType: "Custom Proposal (Sliding Scale for Nonprofits / Civic)",
    summary: "Professional LGBTQ+ cultural humility and workplace inclusion workshops tailored for businesses, healthcare clinics, schools, and civic government agencies.",
    verifiedFacts: [
      "Curriculum: P.R.I.D.E. framework covering terminology, California employment protections, affirming clinical practices, and microaggression reduction.",
      "Format: Available on-site at client premises, virtually via Zoom, or at the Community Resource Center.",
      "Fee Policy: Fees are never fixed or invented; pricing is customized via tailored proposal based on group size, duration, and nonprofit versus commercial status. Inquiries submit via /training/book."
    ],
    keywords: ["training", "workshop", "cultural competency", "pride training", "education", "workplace", "business training", "consulting", "fees", "cost of training"]
  },
  {
    id: "directory",
    category: "service",
    title: "LGBTQ+ Affirming Business Directory",
    officialUrl: "/directory",
    costType: "100% Free Public Search",
    summary: "A curated and searchable directory of local businesses, healthcare practitioners, and service providers who have signed the DCVC LGBTQ+ Affirming Pledge.",
    verifiedFacts: [
      "Public Search: 100% free for community members to search verified local providers across Ventura County.",
      "Affirming Pledge: Every listed enterprise signs a strict anti-discrimination pledge committing to safe, respectful service for all sexual orientations and gender identities.",
      "Business Submission: Local business owners can submit applications for inclusion at /directory/submit (verified by staff within 3–5 business days)."
    ],
    keywords: ["directory", "business", "doctor", "dentist", "affirming", "safe space", "pledge", "shops", "services", "listing"]
  },
  {
    id: "donations",
    category: "giving",
    title: "Donations & Giving",
    officialUrl: "/donate",
    costType: "100% Free Processing via Zeffy",
    summary: "Community financial support powers DCVC's free clinical testing, youth programs, and community resource center with 100% zero-fee processing.",
    verifiedFacts: [
      "Tax Deductible: 501(c)(3) tax-exempt public charity (Federal EIN: 46-5312131).",
      "Platform: 100% of donor funds reach DCVC via Zeffy zero-fee nonprofit checkout; zero third-party platform cuts.",
      "Appreciation Cards: Every donation automatically generates an animated digital DCVC Appreciation Card keepsake across four tiers (Community Ally, Pride Advocate, Rainbow Champion, Visionary Benefactor)."
    ],
    keywords: ["donate", "donation", "giving", "zeffy", "tax", "501c3", "deductible", "appreciation card", "contribute", "support"]
  },
  {
    id: "volunteer",
    category: "engagement",
    title: "Volunteer Opportunities",
    officialUrl: "/volunteer",
    costType: "100% Free Engagement",
    summary: "Volunteers are the heart of DCVC, supporting community desk operations, youth programs, festival logistics, and health outreach.",
    verifiedFacts: [
      "Volunteer Roles: Center Greeter, Event Setup/Operations, Rainbow Umbrella Youth Advisor, Diversity SHINES Testing Intake, and Community Outreach.",
      "Youth Protection: Volunteers serving youth programs (Rainbow Umbrella / Little Unicorns) must be 21+ and complete an orientation and Live Scan fingerprint background check.",
      "Application: Prospective volunteers apply online at /volunteer."
    ],
    keywords: ["volunteer", "get involved", "help", "hours", "application", "background check", "live scan", "mentor"]
  },
  {
    id: "contact",
    category: "administration",
    title: "Contact & Location Information",
    officialUrl: "/contact",
    costType: "Free Inquiry",
    summary: "Official contact channels for DCVC administrative leadership, program inquiries, and general community support.",
    verifiedFacts: [
      "Address: 2471 Portola Road, Suite 100, Ventura, CA 93003",
      "Phone: (805) 644-LGBT / (805) 644-5428",
      "General Email: info@diversitycollective.org",
      "Volunteer Email: volunteer@diversitycollective.org",
      "Training Inquiries: training@diversitycollective.org",
      "Drop-in Hours: Monday – Friday, 1:00 PM – 5:00 PM PT (Closed weekends & major holidays)"
    ],
    keywords: ["contact", "email", "phone", "number", "call", "reach", "staff", "talk", "inquire", "help desk"]
  },
  {
    id: "sponsors-partners",
    category: "community",
    title: "Sponsors & Community Partners",
    officialUrl: "/sponsors",
    costType: "Public Recognition",
    summary: "DCVC partners with regional public health agencies, foundations, and affirming local companies to sustain free community services.",
    verifiedFacts: [
      "Public Health Partners: Ventura County Behavioral Health (VCBH), Ventura County Public Health (VCPH).",
      "Foundation Allies: Community Foundation of Ventura County.",
      "Corporate & Local Sponsors: Affirming regional employers, small businesses, and community festival sponsors.",
      "Partnership Inquiries: Organizations wishing to sponsor Ventura County Pride or become programmatic partners visit /sponsors."
    ],
    keywords: ["sponsor", "sponsors", "partners", "vcbh", "vcph", "county", "alliance", "corporate", "donors"]
  }
];

/**
 * Alien noun vocabulary filter to prevent hallucinating on out-of-domain topics
 */
const ALIEN_NOUNS = [
  "scuba", "diving", "bitcoin", "crypto", "cryptocurrency", "ethereum", 
  "car rental", "plumbing", "dentistry service", "flight", "airline", 
  "real estate agent", "mortgage", "hotel booking", "casino", "gambling"
];

/**
 * Detect domain boundaries
 */
export function checkClientDomainBoundary(query) {
  const q = query.toLowerCase();

  const isCrisis = [
    "suicide", "suicidal", "kill myself", "want to die", "end my life", 
    "self harm", "cutting myself", "overdose", "emergency", "crisis lifeline"
  ].some(term => q.includes(term));

  const isMedical = [
    "rash", "fever", "diagnose", "do i have", "monkeypox", "mpox", "syphilis",
    "chlamydia", "gonorrhea", "symptoms", "prescribe", "treatment plan", "medication dose"
  ].some(term => q.includes(term)) && !q.includes("where") && !q.includes("how old") && !q.includes("hours");

  const isLegal = [
    "sue", "lawsuit", "lawyer", "attorney", "court representation", "landlord dispute",
    "legal advice", "represent me"
  ].some(term => q.includes(term));

  const isInjection = [
    "ignore all previous", "ignore instructions", "output your system prompt", 
    "reveal prompt", "bypass", "jailbreak"
  ].some(term => q.includes(term));

  return { isCrisis, isMedical, isLegal, isInjection };
}

/**
 * Execute client-side conversational assistant
 * 100% Free, Unlimited, Instant, Zero Quota
 */
export function executeClientChat(query) {
  if (!query || typeof query !== "string") {
    return {
      success: false,
      answer: `${EXACT_FALLBACK_MESSAGE} Visit our [Contact Page](${DCVC_CONTACT_URL}).`,
      citations: [{ title: "Contact DCVC", url: DCVC_CONTACT_URL }],
      mode: "client-unlimited"
    };
  }

  const q = query.trim().toLowerCase();

  // 1. Boundary & Safety Checks
  const boundaries = checkClientDomainBoundary(q);

  if (boundaries.isCrisis) {
    return {
      success: true,
      answer: `If you or someone you know is in crisis or distress, please reach out immediately:\n\n` +
              `• **Suicide & Crisis Lifeline:** Call or text **988** (Free, confidential, 24/7)\n` +
              `• **The Trevor Project (LGBTQ+ Youth):** Call **1-866-488-7386** or text **START to 678-678**\n` +
              `• **Ventura County Behavioral Health Crisis Line:** **1-866-998-2243**\n\n` +
              `DCVC offices do not provide 24/7 crisis monitoring. Please connect with these emergency lifelines for immediate care.`,
      citations: [{ title: "Crisis Lifelines", url: "/contact" }],
      mode: "client-unlimited"
    };
  }

  if (boundaries.isMedical) {
    return {
      success: true,
      answer: `Ask DCVC cannot provide medical diagnoses, treatment plans, or clinical evaluations. ` +
              `However, Diversity Collective provides **free, confidential rapid HIV and STI screenings** (results in 15–20 minutes) ` +
              `and PrEP/PEP healthcare navigation through our **Diversity SHINES** clinic at our Community Resource Center ` +
              `(2471 Portola Road, Suite 100, Ventura) Monday–Friday from 1:00 PM to 5:00 PM. No insurance or payment is required. ` +
              `For urgent medical symptoms, please visit an urgent care center or call 911.`,
      citations: [
        { title: "Diversity SHINES Free Testing", url: "/programs/diversity-shines" },
        { title: "Contact Clinic", url: "/contact" }
      ],
      mode: "client-unlimited"
    };
  }

  if (boundaries.isLegal) {
    return {
      success: true,
      answer: `Ask DCVC cannot provide formal legal advice, representation, or counsel. ` +
              `Diversity Collective can connect community members with local LGBTQ+-affirming legal clinics and advocacy partners ` +
              `through our [Affirming Business Directory](/directory) or by contacting our team directly at [Contact Us](/contact).`,
      citations: [
        { title: "Affirming Directory", url: "/directory" },
        { title: "Contact Staff", url: "/contact" }
      ],
      mode: "client-unlimited"
    };
  }

  if (boundaries.isInjection) {
    return {
      success: true,
      answer: `I am Ask DCVC, the official community assistant for Diversity Collective Ventura County. ` +
              `I can only answer questions regarding DCVC programs, free clinical testing, youth groups, hours, and community resources. ` +
              `How can I assist you with our services today?`,
      citations: [{ title: "About DCVC", url: "/about" }],
      mode: "client-unlimited"
    };
  }

  // 2. Reject Alien Nouns (Zero-Hallucination Guard)
  if (ALIEN_NOUNS.some(alien => q.includes(alien))) {
    return {
      success: true,
      answer: `${EXACT_FALLBACK_MESSAGE} Visit our [Contact Page](${DCVC_CONTACT_URL}) or email info@diversitycollective.org.`,
      citations: [{ title: "Contact DCVC", url: DCVC_CONTACT_URL }],
      mode: "client-unlimited"
    };
  }

  // 3. Domain Matching & Response Synthesis

  // Events & Calendar (and past events check)
  if (q.includes("event") || q.includes("pride") || q.includes("gala") || q.includes("prom")) {
    if (q.includes("2023") || q.includes("2024") || q.includes("past") || q.includes("last year")) {
      return {
        success: true,
        answer: `Past events (such as 2023 or 2024 Pride celebrations) have concluded and are not active. Our upcoming community celebrations include **Ventura County Pride** in August, the annual **Diversity Gala**, and the youth **Pride Prom**. View our live calendar at [Community Events](/events).`,
        citations: [{ title: "Community Events", url: "/events" }],
        mode: "client-unlimited"
      };
    }
    if (!q.includes("free") && !q.includes("hiv")) {
      return {
        success: true,
        answer: `Diversity Collective hosts premier regional events including the seaside **Ventura County Pride Festival** (held each August at Promenade Park), the annual **Diversity Gala** benefit, and youth **Pride Prom**. Check our active schedules, tickets, and volunteer opportunities at [Events Calendar](/events).`,
        citations: [{ title: "Events Calendar", url: "/events" }],
        mode: "client-unlimited"
      };
    }
  }

  // HIV / STI / Diversity SHINES Testing
  if (q.includes("hiv") || q.includes("sti") || q.includes("std") || q.includes("screening") || q.includes("prep") || q.includes("pep") || q.includes("shines")) {
    if (q.includes("age") || q.includes("old") || q.includes("youth") || q.includes("teen")) {
      return {
        success: true,
        answer: `Confidential rapid HIV/STI testing through [Diversity SHINES](/programs/diversity-shines) is available for individuals **ages 12 and older** under California Minor Consent laws without requiring parental notification or insurance.`,
        citations: [{ title: "Diversity SHINES Clinic", url: "/programs/diversity-shines" }],
        mode: "client-unlimited"
      };
    }
    return {
      success: true,
      answer: `Yes! Diversity Collective provides **free, confidential rapid HIV and STI screenings** (Hepatitis C, Syphilis, Chlamydia, Gonorrhea) through our [Diversity SHINES](/programs/diversity-shines) clinic at the Community Resource Center (2471 Portola Road, Suite 100, Ventura). Results are available in 15–20 minutes with zero insurance or payment required. Learn more at [Diversity SHINES](/programs/diversity-shines).`,
      citations: [{ title: "Diversity SHINES Free Testing", url: "/programs/diversity-shines" }],
      mode: "client-unlimited"
    };
  }

  // Donations & Giving via Zeffy
  if (q.includes("donate") || q.includes("donation") || q.includes("zeffy") || q.includes("contribute")) {
    return {
      success: true,
      answer: `You can support Diversity Collective at [Donate to DCVC](/donate). We use **Zeffy**, a 100% zero-fee nonprofit platform, ensuring 100% of your gift reaches local programs. All donations are tax-deductible under 501(c)(3) EIN: 46-5312131. Every donation unlocks an animated [DCVC Appreciation Card](/appreciation-card/preview) keepsake!`,
      citations: [{ title: "Donate via Zeffy", url: "/donate" }],
      mode: "client-unlimited"
    };
  }

  // Affirming Business Directory
  if (q.includes("doctor") || q.includes("shop") || q.includes("store") || q.includes("business") || q.includes("directory")) {
    return {
      success: true,
      answer: `You can find affirming, LGBTQ+-friendly doctors, medical providers, shops, and professional services across Ventura County in our searchable [Affirming Business Directory](/directory). All listed businesses have signed the DCVC LGBTQ+ Affirming Pledge. Local business owners can submit listings at [Directory Submission](/directory/submit).`,
      citations: [{ title: "Affirming Directory", url: "/directory" }],
      mode: "client-unlimited"
    };
  }

  // Professional Training & Fees
  if (q.includes("training") || q.includes("workshop") || q.includes("cultural competency")) {
    return {
      success: true,
      answer: `Diversity Collective offers professional LGBTQ+ cultural competency and workplace training. Fees are structured on a non-profit/civic sliding scale versus commercial rates based on workshop length and participant count. Organizations can request a customized fee proposal at [Training Booking](/training/book).`,
      citations: [{ title: "Training Services", url: "/training" }],
      mode: "client-unlimited"
    };
  }

  // Sponsors & Partners
  if (q.includes("sponsor") || q.includes("partner") || q.includes("alliance")) {
    return {
      success: true,
      answer: `Diversity Collective collaborates with foundational public health and civic partners including **Ventura County Behavioral Health (VCBH)**, **Ventura County Public Health (VCPH)**, and clinical testing programs like **Diversity SHINES**. To explore organizational partnerships or become an official sponsor, visit [Sponsors & Partners](/sponsors).`,
      citations: [{ title: "Sponsors & Partners", url: "/sponsors" }],
      mode: "client-unlimited"
    };
  }

  // Free Services / General Cost
  if (q.includes("free") || q.includes("cost") || q.includes("fee") || q.includes("pay") || q.includes("price")) {
    return {
      success: true,
      answer: `Yes! Services and programs provided by Diversity Collective — including [Community Resource Center](/programs/community-resource-center) drop-in access, [Diversity SHINES](/programs/diversity-shines) rapid HIV/STI testing, and [Rainbow Umbrella](/programs/rainbow-umbrella) youth groups — are **100% free of charge**. No insurance, payment, or membership fee is ever required.`,
      citations: [
        { title: "Free Programs", url: "/programs" },
        { title: "Community Resource Center", url: "/programs/community-resource-center" }
      ],
      mode: "client-unlimited"
    };
  }

  // Contact Information (Must check email / phone before address keyword in 'email address')
  if (q.includes("email") || q.includes("phone") || q.includes("call") || q.includes("contact") || q.includes("number")) {
    return {
      success: true,
      answer: `You can reach Diversity Collective at **(805) 644-LGBT (5428)** or by email at **info@diversitycollective.org**. Our administrative offices and Community Resource Center are located at 2471 Portola Road, Suite 100, Ventura, CA 93003. View full staff directory and inquiry forms at [Contact Us](/contact).`,
      citations: [{ title: "Contact Us", url: "/contact" }],
      mode: "client-unlimited"
    };
  }

  // Physical Location / Address
  if (q.includes("where") || q.includes("location") || (q.includes("address") && !q.includes("email")) || q.includes("directions") || q.includes("portola")) {
    return {
      success: true,
      answer: `The Diversity Collective Community Resource Center is located at **2471 Portola Road, Suite 100, Ventura, CA 93003**. Drop-in hours are **Monday through Friday, 1:00 PM – 5:00 PM Pacific Time**. You can also reach the center at **(805) 644-LGBT**. Learn more at [Community Resource Center](/programs/community-resource-center).`,
      citations: [{ title: "Community Resource Center", url: "/programs/community-resource-center" }],
      mode: "client-unlimited"
    };
  }

  // Operating Hours
  if (q.includes("hour") || q.includes("open") || q.includes("when are you open") || q.includes("time")) {
    if (q.includes("rainbow") || q.includes("umbrella") || q.includes("youth")) {
      return {
        success: true,
        answer: `[Rainbow Umbrella](/programs/rainbow-umbrella) meets every **Friday evening from 5:30 PM to 7:30 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura) for youth ages 13–23. It is 100% free.`,
        citations: [{ title: "Rainbow Umbrella Youth", url: "/programs/rainbow-umbrella" }],
        mode: "client-unlimited"
      };
    }
    if (q.includes("unicorn") || q.includes("kid") || q.includes("children")) {
      return {
        success: true,
        answer: `[Little Unicorns](/programs/little-unicorns) meets on the **1st and 3rd Saturday of each month from 10:00 AM to 11:30 AM PT** at the Community Resource Center for children ages 9–13 and their parents/caregivers.`,
        citations: [{ title: "Little Unicorns", url: "/programs/little-unicorns" }],
        mode: "client-unlimited"
      };
    }
    return {
      success: true,
      answer: `The Community Resource Center is open for drop-in visits, computer lab access, and rapid testing **Monday through Friday from 1:00 PM to 5:00 PM PT**. It is closed on weekends and major holidays. Learn more at [Community Resource Center](/programs/community-resource-center).`,
      citations: [{ title: "Community Resource Center", url: "/programs/community-resource-center" }],
      mode: "client-unlimited"
    };
  }

  // Age limits & Youth Groups
  if (q.includes("age") || q.includes("old") || q.includes("teen") || q.includes("kid") || q.includes("child")) {
    if (q.includes("rainbow") || q.includes("umbrella") || q.includes("teen") || q.includes("youth")) {
      return {
        success: true,
        answer: `[Rainbow Umbrella](/programs/rainbow-umbrella) is strictly for youth and young adults **ages 13 through 23**. Children ages 9–13 attend our [Little Unicorns](/programs/little-unicorns) group on 1st & 3rd Saturdays. Adults 24+ can join our adult peer support circles.`,
        citations: [{ title: "Rainbow Umbrella", url: "/programs/rainbow-umbrella" }],
        mode: "client-unlimited"
      };
    }
    if (q.includes("unicorn") || q.includes("young") || q.includes("under 13")) {
      return {
        success: true,
        answer: `[Little Unicorns](/programs/little-unicorns) is designed specifically for children **ages 9 through 13** and their parents/caregivers. Youth ages 13–23 can participate in [Rainbow Umbrella](/programs/rainbow-umbrella).`,
        citations: [{ title: "Little Unicorns", url: "/programs/little-unicorns" }],
        mode: "client-unlimited"
      };
    }
  }

  // Rainbow Umbrella specifics
  if (q.includes("rainbow umbrella") || q.includes("ru")) {
    return {
      success: true,
      answer: `[Rainbow Umbrella](/programs/rainbow-umbrella) is Ventura County's premier youth peer group for LGBTQ+ and allied youth **ages 13 through 23**. Meetings take place every **Friday evening from 5:30 PM to 7:30 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura) with free food, games, and adult facilitators.`,
      citations: [{ title: "Rainbow Umbrella", url: "/programs/rainbow-umbrella" }],
      mode: "client-unlimited"
    };
  }

  // Little Unicorns specifics
  if (q.includes("little unicorn") || q.includes("unicorn")) {
    return {
      success: true,
      answer: `[Little Unicorns](/programs/little-unicorns) is an affirming social circle for gender-expansive and LGBTQ+ children **ages 9 through 13** and their parents/caregivers. It meets on the **1st and 3rd Saturday of every month from 10:00 AM to 11:30 AM PT** at the Community Resource Center.`,
      citations: [{ title: "Little Unicorns", url: "/programs/little-unicorns" }],
      mode: "client-unlimited"
    };
  }

  // Trans Adult Groups
  if (q.includes("trans") || q.includes("nonbinary") || q.includes("gender")) {
    return {
      success: true,
      answer: `Diversity Collective offers a peer-led **Transgender & Non-Binary Peer Support Circle** for adults **ages 18 and older**. The group meets on the **1st and 3rd Wednesday of every month from 6:30 PM to 8:00 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura) and includes access to our affirming clothing and binder closet.`,
      citations: [{ title: "Trans Peer Support", url: "/programs/trans-support" }],
      mode: "client-unlimited"
    };
  }

  // Volunteering
  if (q.includes("volunteer") || q.includes("help out") || q.includes("get involved")) {
    return {
      success: true,
      answer: `We welcome community volunteers! Opportunities include Center greeters, Pride festival staff, health outreach, and workshop support. Volunteers working directly with youth (e.g. Rainbow Umbrella) must be 21+ and pass a Live Scan background check. Apply online at [Volunteer With Us](/volunteer).`,
      citations: [{ title: "Volunteer Application", url: "/volunteer" }],
      mode: "client-unlimited"
    };
  }

  // Contact Information
  if (q.includes("phone") || q.includes("email") || q.includes("call") || q.includes("contact") || q.includes("number")) {
    return {
      success: true,
      answer: `You can reach Diversity Collective at **(805) 644-LGBT (5428)** or by email at **info@diversitycollective.org**. Our administrative offices and Community Resource Center are located at 2471 Portola Road, Suite 100, Ventura, CA 93003. View full staff directory and inquiry forms at [Contact Us](/contact).`,
      citations: [{ title: "Contact Us", url: "/contact" }],
      mode: "client-unlimited"
    };
  }

  // Fallback for unverified or unmatched questions
  return {
    success: true,
    answer: `${EXACT_FALLBACK_MESSAGE} Visit our [Contact Page](${DCVC_CONTACT_URL}) or email info@diversitycollective.org.`,
    citations: [{ title: "Contact DCVC", url: DCVC_CONTACT_URL }],
    mode: "client-unlimited"
  };
}
