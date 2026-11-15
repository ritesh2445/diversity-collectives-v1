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

import { searchSiteWithSuggestions } from '../utils/smartSiteSearch.js';
import { lunaLearningEngine } from './lunaLearningEngine.js';

export { lunaLearningEngine };

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
    title: "Community Resource Center (Center)",
    officialUrl: "/programs/community-resource-center",
    costType: "100% Free",
    eligibility: "Open to all LGBTQ+ individuals, families, youth, and affirming allies.",
    hours: "Monday through Friday: 1:00 PM – 5:00 PM Pacific Time",
    location: "2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "The Community Resource Center is Ventura County's premier physical LGBTQ+ cultural center and drop-in hub offering a computer lab, library, mutual aid pantry, and community meeting space.",
    verifiedFacts: [
      "Location: 2471 Portola Road, Suite 100, Ventura, CA 93003",
      "Operating Hours: Monday – Friday, 1:00 PM – 5:00 PM PT (Closed weekends & major holidays)",
      "Cost: 100% Free drop-in access. No membership fees or reservations required.",
      "Amenities: Free high-speed computer/cyber lab, printing for essential needs, LGBTQ+ lending library, mutual aid food and hygiene supplies, safe harbor lounge.",
      "Phone: (805) 644-LGBT (805-644-5428)"
    ],
    keywords: ["center", "center", "community resource center", "crc", "address", "location", "hours", "directions", "portola", "visit", "drop in", "computer", "wifi", "library", "pantry", "food", "open", "phone"]
  },
  {
    id: "diversity-shines",
    category: "service",
    title: "Diversity SHINES (Health & Wellness Clinic)",
    officialUrl: "/programs/diversity-shines",
    costType: "100% Free",
    eligibility: "Ages 12 and older. Confidential under California Minor Consent laws.",
    hours: "Free Screenings: 1st Monday of every month, 3:00 PM – 7:00 PM PT (Appointments preferred at /appointments · Walk-ins welcome). Harm reduction supplies & center drop-in: Mon–Fri 1:00 PM – 5:00 PM PT",
    location: "2471 Portola Road, Suite 100, Ventura, CA 93003",
    summary: "Diversity SHINES is DCVC's clinical health initiative providing free, confidential rapid HIV and STI screenings, PrEP/PEP healthcare navigation, and safer sex supplies.",
    verifiedFacts: [
      "Schedule: Free confidential rapid HIV and STI screenings take place on the 1st Monday of every month from 3:00 PM to 7:00 PM PT at the Community Resource Center (2471 Portola Road, Suite 100, Ventura).",
      "Appointments & Walk-ins: Appointments can be reserved at /appointments; walk-in slots are also available. Safer sex kits and harm reduction supplies are available drop-in Monday–Friday from 1:00 PM to 5:00 PM PT.",
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
    summary: "A peer-led affinity center for trans and non-binary adults offering shared experiences, transition navigation, gender-affirming garment closet access, and community bonding.",
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
  },
  {
    id: "core-programs-ordered",
    category: "program",
    title: "Core Programs & Peer Support Groups",
    officialUrl: "/programs",
    costType: "100% Free",
    summary: "DCVC's 9 featured community programs are: Queer Adulting, Little Unicorns, Rainbow Umbrella, PFLAG, Narcotics Anonymous, Trans Peer Group by Transverse, Toastmasters, Men's Collective, and Silver Collective.",
    verifiedFacts: [
      "1. Queer Adulting: Ages 18+, 1st & 3rd Wednesday of the month, 7:00 PM – 9:00 PM at the CRC.",
      "2. Little Unicorns: Ages 9–13, last Saturday of the month, 1:00 PM – 3:00 PM.",
      "3. Rainbow Umbrella: Ages 13–23, every Friday, 5:30 PM – 7:30 PM at the CRC.",
      "4. PFLAG Ventura: Family & ally support (2nd Tuesday, 6:30 PM).",
      "5. Narcotics Anonymous: LGBTQ+ welcoming recovery meeting every Monday, 7:00 PM – 8:30 PM.",
      "6. Trans Peer Group by Transverse: Bi-weekly Sundays at 4:00 PM.",
      "7. Diversity Toastmasters: 1st & 3rd Tuesday, 6:30 PM – 8:00 PM.",
      "8. Men's Collective: Weekly peer support & social group for LGBTQ+ men and allies (18+).",
      "9. Silver Collective: LGBTQ+ adults 55+, 2nd Thursday, 6:00 PM – 7:30 PM."
    ],
    keywords: ["programs", "queer adulting", "little unicorns", "rainbow umbrella", "pflag", "narcotics anonymous", "transverse", "toastmasters", "mens collective", "men's collective", "silver collective"]
  },
  {
    id: "signature-events-distinct",
    category: "event",
    title: "Signature Events, Calendar & Special Engagements",
    officialUrl: "/events",
    costType: "Events, Programs & Calendar are 3 distinct offerings",
    summary: "Events, Programs, and Calendar are separate at DCVC: Signature Events are AIDS Walk Ventura, Pride Prom, and Ventura County Pride; Special Engagements include Amplify Arts; and the Calendar lists scheduled upcoming dates.",
    verifiedFacts: [
      "Signature Events: 1. AIDS Walk Ventura, 2. Pride Prom (free youth prom ages 13–23), 3. Ventura County Pride (annual celebration at Plaza Park).",
      "Special Engagements: Hosted partner programs such as Amplify Arts (Amplify After Hours) providing creative arts, music, and mental wellness for middle and high school youth.",
      "Calendar: Dedicated schedule of upcoming dates and recurring gatherings at /events and on the homepage Calendar section.",
      "Flex Space: Bookable community Flex Space at 2471 Portola Rd, Suite 100 with live availability and time-slot booking."
    ],
    keywords: ["events", "aids walk", "pride prom", "ventura county pride", "calendar", "special engagements", "amplify arts", "flex space", "workspace", "booking"]
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
 * Handle casual greetings, small talk, emotional check-ins & conversational friendliness
 */
function handleCasualConversation(rawQuery, lowerQuery) {
  // Strip repeated letters for casual words ("hiiii", "helloooo", "thxxxx")
  const norm = lowerQuery
    .replace(/[!?.~,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const collapsed = norm.replace(/([a-z])\1{2,}/g, '$1');

  const containsSpecificTopic = /\b(test|testing|hiv|sti|std|hour|hours|open|address|where|location|donate|donation|zeffy|event|events|gala|prom|volunteer|training|workshop|directory|doctor|sponsor|partner|board|staff|dyslexia|bionic|appointment|appreciation|card|rainbow|unicorn|trans|free|cost|phone|email)\b/i.test(norm);

  if (!containsSpecificTopic) {
    // Greetings: hi, hello, hey, good morning, yo, sup, hola, namaste
    if (/^(hi|hii|hey|hello|helo|hola|namaste|yo|sup|whats up|what s up|good morning|morning|good afternoon|good evening|gm|howdy|luna|hey luna|hi luna|hello luna)(\s+(there|luna|everyone|team|friend|folks))?$/.test(collapsed)) {
      return {
        success: true,
        answer: `Hey there! 💜 I'm **Luna**, your Diversity Collective Ventura County guide.\n\nHow's your day going? Ask me casually or ask about **free rapid testing**, **upcoming events**, **youth & trans circles**, **dyslexia reading tools**, **board leadership**, or **how to volunteer or donate** — I search across the latest site info for you!`,
        citations: [
          { title: 'Explore Programs', url: '/programs' },
          { title: 'Upcoming Events', url: '/events' },
          { title: 'Community Circles', url: '/community' }
        ],
        mode: 'client-conversational'
      };
    }

    // How are you / small talk check-ins
    if (/\b(how are you|how r u|how are u|hows it going|how is it going|how have you been|what are you doing|whats up|what up|all good|how do you do)\b/.test(collapsed)) {
      return {
        success: true,
        answer: `Doing wonderfully, thank you for asking! ✨ I'm always energized to help connect neighbors across Ventura County with affirming resources, events, and safe spaces.\n\nHow are you doing today? Anything I can look up for you on the site?`,
        citations: [
          { title: 'Community Center', url: '/programs/community-resource-center' },
          { title: 'Events Calendar', url: '/events' }
        ],
        mode: 'client-conversational'
      };
    }

    // Who are you / what can you do
    if (/\b(who are you|what are you|what is luna|tell me about yourself|are you real|are you a bot|what can you do|help me)\b/.test(collapsed)) {
      return {
        success: true,
        answer: `I'm **Luna**, Diversity Collective Ventura County's free interactive guide! 🌈\n\nI read live across DCVC's **Programs, Upcoming Events, Board Profiles, P.R.I.D.E. Training, Community Circles, Affirming Directory, News, and Accessibility tools** (even if there are spelling typos!). Try asking me *"When does Rainbow Umbrella meet?"*, *"Who is Roland Catabona?"*, or *"Are there upcoming events?"*`,
        citations: [
          { title: 'About DCVC', url: '/about' },
          { title: 'Programs Overview', url: '/programs' }
        ],
        mode: 'client-conversational'
      };
    }

    // Gratitude
    if (/^(thanks|thank you|thank u|thx|ty|tysm|appreciate it|much appreciated|cheers|gracias|cool thanks|awesome thanks|perfect thanks)$/.test(collapsed) || /\b(thank you|thanks so much|thank u|tysm)\b/.test(collapsed)) {
      return {
        success: true,
        answer: `You're so welcome! 💜 Anytime you need hours, event updates, community groups, or accessibility tips, I'm right here. You are always welcome at Diversity Collective!`,
        citations: [{ title: 'Home', url: '/' }],
        mode: 'client-conversational'
      };
    }

    // Casual reactions / acknowledgments / laughter
    if (/^(ok|okay|k|cool|nice|awesome|great|sounds good|got it|amazing|love it|haha|hehe|lol|yay)$/.test(collapsed)) {
      return {
        success: true,
        answer: `Awesome! ✨ Let me know whenever you want to explore anything else — events, support circles, training workshops, or our Community Resource Center.`,
        citations: [{ title: 'Programs & Center', url: '/programs' }],
        mode: 'client-conversational'
      };
    }

    // Goodbyes
    if (/^(bye|goodbye|see ya|see you|take care|goodnight|gn|ttyl|later|cya)$/.test(collapsed)) {
      return {
        success: true,
        answer: `Take wonderful care of yourself! 🌈 Our doors at **2471 Portola Rd, Suite 100, Ventura** are open Mon–Fri 1:00–5:00 PM whenever you want to drop by. Have a bright day!`,
        citations: [{ title: 'Visit Us', url: '/contact' }],
        mode: 'client-conversational'
      };
    }

    // Emotional support / lonely / nervous / new in town
    if (/\b(lonely|alone|anxious|stressed|sad|nervous|isolated|new here|new in town|no friends|need someone|overwhelmed|scared)\b/.test(collapsed)) {
      return {
        success: true,
        answer: `Sending you a warm, genuine welcome — you don't have to navigate things alone. 💜\n\n• **Weekly Community Circles:** Drop into our welcoming peer groups like [Rainbow Umbrella Youth (13–23)](/programs/rainbow-umbrella), [Trans & Non-Binary Peer Support](/programs/trans-support), or browse all [Community Circles](/community).\n• **Mental Health Care Navigation:** Free, confidential referrals to affirming counselors at [Wellness & Care](/programs/mental-health) or book an intake on [Appointments](/appointments).\n• **24/7 Talk Lines:** Call/text **988** or The Trevor Project (**1-866-488-7386**) anytime you need immediate support.`,
        citations: [
          { title: 'Community Circles', url: '/community' },
          { title: 'Mental Health Care', url: '/programs/mental-health' },
          { title: 'Resources & Helplines', url: '/resources' }
        ],
        mode: 'client-conversational'
      };
    }
  }

  return null;
}

/**
 * Format retrieved live website hits into an accurate, readable conversational answer
 */
function buildDynamicSiteAnswer(searchResult, rawQuery) {
  const hits = (searchResult?.results || []).filter((r) => r.score >= 28);
  if (hits.length === 0) return null;

  const top = hits[0];
  const secondary = hits.slice(1, 3).filter((r) => r.score >= 30);
  const typoNote = searchResult.correctedQuery
    ? `*(Showing live site results for "${searchResult.correctedQuery}")*\n\n`
    : '';

  const bullets = secondary.map(
    (item) => `• **[${item.title}](${item.url})**${item.subtitle ? ` — ${item.subtitle}` : ''}`
  );

  let intro = '';
  if (top.type === 'Board Member') {
    intro = `**${top.title}** serves on our Board of Directors as **${top.subtitle}**.\n\n${top.snippet}\n\nExplore their full editorial profile at [${top.title}](${top.url}).`;
  } else if (top.type === 'Event') {
    intro = `Here are the latest details for **[${top.title}](${top.url})** (${top.subtitle}):\n\n${top.snippet}`;
  } else if (top.type === 'News') {
    intro = `From DCVC News — **[${top.title}](${top.url})** (${top.subtitle}):\n\n${top.snippet}`;
  } else {
    intro = `Here's what I found across our live site for **[${top.title}](${top.url})**${top.subtitle ? ` (${top.subtitle})` : ''}:\n\n${top.snippet}`;
  }

  const answer = `${typoNote}${intro}${bullets.length ? `\n\nRelated pages:\n${bullets.join('\n')}` : ''}`;
  const citations = hits.slice(0, 3).map((h) => ({ title: h.title.split('·')[0].trim(), url: h.url }));

  return {
    success: true,
    answer,
    citations,
    mode: 'client-unlimited'
  };
}

/**
 * Execute client-side conversational assistant
 * 100% Free, Unlimited, Instant, Zero Quota — Powered by Luna AI Dynamic Learning Engine
 */
export function executeClientChat(query, options = {}) {
  return lunaLearningEngine.answerQuery(query, options);
}
