/**
 * Diversity Collective Ventura County — Luna AI Dynamic Learning & Intelligence Engine
 * 
 * Continuous Self-Learning Knowledge Graph for Luna:
 * 1. Deep Ingestion of ALL site content:
 *    - Core organization facts, missions, and live settings
 *    - All 9+ recurring programs & community circles
 *    - All live & upcoming events (with dynamic past event detection)
 *    - All affirming directory businesses (15+ categories, cities, contacts)
 *    - All board of directors & staff members
 *    - All training courses & sliding-scale proposal fees
 *    - All community resources & crisis lifelines (988, Trevor Project, VCBH)
 *    - Special facilities (Flex Space, Computer Lab, Mutual Aid Pantry)
 *    - Special engagements (Amplify Arts / After Hours)
 *    - News articles & announcements
 *    - Custom admin knowledge entries
 * 
 * 2. Real-Time Self-Updating:
 *    - Listens to cmsStore reactive notifications
 *    - Listens to window storage / multi-tab live sync events
 *    - Auto-rebuilds learned knowledge graph when content is added or modified
 *    - Explicit learning trigger: learnFromSite()
 *    - Exposes learning status metrics for the Admin Dashboard
 * 
 * 3. Intelligent Natural Language Answering:
 *    - Entity-centric matching: accurately answers specific entity questions
 *      (e.g., "What time does Narcotics Anonymous meet?", "Where is Beacon Coffee?")
 *    - Distinguishes program/circle schedules from general center hours
 *    - Searches and returns affirming directory businesses with contact details
 *    - Enforces safety guardrails (Crisis 988, medical disclaimers, legal referrals)
 *    - Friendly, natural conversational synthesis with verified markdown citations
 */

import {
  orgInfo,
  programsList,
  liveEvents,
  resourcesDirectory,
  boardMembers,
  staffMembers,
  sponsorsList,
  trainingCourses,
  newsArticles,
  communityGroups,
  specialEngagements,
  annualSignatureEvents,
  businessDirectorySeed,
  getBoardMemberSlug
} from '../data/dcvcData.js';
import { communityDetailsData } from '../data/communityData.js';
import { cmsStore } from './cmsStore.js';
import {
  searchSiteWithSuggestions,
  normalizeText,
  tokenize,
  damerauLevenshtein
} from '../utils/smartSiteSearch.js';

export const EXACT_FALLBACK_MESSAGE =
  "I couldn't find verified information about that on the DCVC website. Please contact the Diversity Collective team for confirmation.";

export const DCVC_CONTACT_URL = "/contact";

const LEARNED_KNOWLEDGE_STORAGE_KEY = 'dcvc_luna_learned_knowledge';
const CUSTOM_KNOWLEDGE_STORAGE_KEY = 'dcvc_luna_custom_knowledge';
const DIRECTORY_STORAGE_KEY = 'dcvc_live_directory_businesses';

const GENERIC_SUFFIX_REGEX = /\b(company|co|inc|llc|group|services|practice|clinic|wellness|consulting|associates)\b/gi;

function stripBusinessSuffixes(name) {
  return String(name || '').replace(GENERIC_SUFFIX_REGEX, '').replace(/\s+/g, ' ').trim();
}

/**
 * Load directory businesses from live storage or seed
 */
export function getLiveDirectoryBusinesses() {
  if (typeof window === 'undefined') return businessDirectorySeed;
  try {
    const stored = localStorage.getItem(DIRECTORY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return businessDirectorySeed;
}

/**
 * Load custom staff-authored knowledge snippets
 */
export function getStoredCustomKnowledge() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CUSTOM_KNOWLEDGE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export class LunaLearningEngine {
  constructor() {
    this.version = '4.0-learning';
    this.lastLearnedAt = null;
    this.knowledge = {
      settings: {},
      programs: [],
      communityGroups: [],
      events: [],
      businesses: [],
      board: [],
      staff: [],
      podcasts: [],
      trainings: [],
      resources: [],
      facilities: [],
      specialEngagements: [],
      news: [],
      sponsors: [],
      customKnowledge: []
    };
    this.entityIndex = new Map();
    this.keywordMap = new Map();
    this.isInitialized = false;

    // Initial learning pass
    this.learnFromSite();

    // Auto-learn when cmsStore updates (both browser and Node/tests)
    if (cmsStore && typeof cmsStore.subscribe === 'function') {
      cmsStore.subscribe((updatedData) => {
        this.learnFromSite(updatedData);
      });
    }

    // Auto-learn when running in browser
    if (typeof window !== 'undefined') {
      // Multi-tab and storage events
      window.addEventListener('storage', (e) => {
        if (
          e.key === 'dcvc_live_cms_data' ||
          e.key === DIRECTORY_STORAGE_KEY ||
          e.key === CUSTOM_KNOWLEDGE_STORAGE_KEY
        ) {
          this.learnFromSite();
        }
      });

      // Custom app live-sync events across all admin workflows
      const liveSyncEvents = [
        'dcvc:cms-updated',
        'dcvc:luna-relearn',
        'dcvc-directory-updated',
        'dcvc-event-updated',
        'dcvc-news-updated',
        'dcvc-resource-updated',
        'dcvc-reviews-updated',
        'dcvc-training-updated'
      ];
      liveSyncEvents.forEach((evt) => {
        window.addEventListener(evt, () => {
          this.learnFromSite();
        });
      });
    }
  }

  /**
   * Primary Learning Pipeline: Ingests all site content into a structured knowledge graph
   * @param {Object} [customData] Optional snapshot override (e.g. from tests or CMS event)
   */
  learnFromSite(customData = null) {
    const liveCms = customData || (cmsStore && cmsStore.getAllData ? cmsStore.getAllData() : {}) || {};
    const settings = liveCms.settings || (cmsStore && cmsStore.getSettings ? cmsStore.getSettings() : {}) || {};
    const livePrograms = liveCms.programs || programsList || [];
    const liveEventsList = liveCms.events || liveEvents || [];
    const liveTrainings = liveCms.trainings || trainingCourses || [];
    const liveNews = liveCms.news || newsArticles || [];
    const liveResources = liveCms.resources || resourcesDirectory || [];
    const liveSponsors = liveCms.sponsors || sponsorsList || [];
    const liveBusinesses = (liveCms.businesses && liveCms.businesses.length > 0) ? liveCms.businesses : getLiveDirectoryBusinesses();
    const liveCustom = (liveCms.customKnowledge && liveCms.customKnowledge.length > 0) ? liveCms.customKnowledge : getStoredCustomKnowledge();

    // Board & Staff separation
    let liveBoard = [];
    let liveStaff = [];
    if (Array.isArray(liveCms.staff) && liveCms.staff.length > 0) {
      liveBoard = liveCms.staff.filter((s) => s.category === 'board');
      liveStaff = liveCms.staff.filter((s) => s.category !== 'board');
    }
    if (liveBoard.length === 0) liveBoard = boardMembers || [];
    if (liveStaff.length === 0) liveStaff = staffMembers || [];

    // Ensure all seed board members exist in liveBoard
    for (const bm of boardMembers || []) {
      if (!liveBoard.some((b) => normalizeText(b.name) === normalizeText(bm.name))) {
        liveBoard.push(bm);
      }
    }

    // Ensure foundational leadership exists in liveStaff
    for (const sm of staffMembers || []) {
      if (!liveStaff.some((s) => normalizeText(s.name) === normalizeText(sm.name))) {
        liveStaff.push(sm);
      }
    }

    // 1. Settings & Core Identity
    this.knowledge.settings = {
      name: settings.name || orgInfo.name || "Diversity Collective Ventura County",
      legalName: orgInfo.legalName || "Diversity Collective Ventura County, Inc. (DCVC)",
      nonprofitStatus: "501(c)(3) tax-exempt public charity (founded 2014)",
      ein: settings.ein || orgInfo.ein || "46-5312131",
      mission: settings.mission || orgInfo.mission || "Promoting advocacy, visibility, safety, and wellness for the LGBTQ+ community across all 10 Ventura County cities.",
      vision: orgInfo.vision || "A community where LGBTQ+ individuals thrive with equitable access to care, affirming resources, and unconditional belonging.",
      tagline: settings.tagline || orgInfo.tagline || "You Are Always Welcome Here.",
      address: settings.address || orgInfo.address?.full || "2471 Portola Road, Suite 100, Ventura, CA 93003",
      hours: settings.hours || orgInfo.hours || "Monday through Friday: 1:00 PM – 5:00 PM Pacific Time",
      phone: settings.phone || orgInfo.phone || "(805) 644-LGBT (5428)",
      email: settings.email || orgInfo.email || "info@diversitycollective.org",
      bannerAlertActive: Boolean(settings.bannerAlertActive),
      bannerAlertText: settings.bannerAlertText || "",
      bannerAlertLink: settings.bannerAlertLink || "/events",
      donationUrl: settings.donationUrl || "/donate",
      volunteerUrl: settings.volunteerUrl || "/volunteer",
      serviceArea: "All 10 Ventura County cities: Ventura, Oxnard, Camarillo, Thousand Oaks, Simi Valley, Moorpark, Santa Paula, Fillmore, Port Hueneme, and Ojai.",
      leadership: {
        executiveDirector: "Tess Allen",
        boardPresident: "Roland Catabona",
        boardVicePresident: "Genevieve Flores-Haro",
        boardSecretary: "Unique Dowtin",
        boardTreasurer: "Ron Demeter"
      }
    };

    // 2. Programs
    this.knowledge.programs = livePrograms.map((p) => ({
      id: p.id || `prog-${p.slug}`,
      slug: p.slug || normalizeText(p.title).replace(/\s+/g, '-'),
      title: p.title,
      tagline: p.tagline || '',
      audience: p.audience || 'All LGBTQ+ community & allies',
      schedule: p.schedule || 'Regular schedule',
      location: p.location || 'Community Resource Center: 2471 Portola Road, Suite 100, Ventura',
      isFree: p.isFree !== false,
      costType: p.costType || '100% Free',
      summary: p.summary || '',
      description: p.description || '',
      amenities: p.amenities || [],
      contactEmail: p.contactEmail || 'info@diversitycollective.org',
      contactPhone: p.contactPhone || '(805) 644-LGBT',
      url: `/programs/${p.slug || normalizeText(p.title).replace(/\s+/g, '-')}`
    }));

    // 3. Community Circles & Groups (with enriched schedules & announcements)
    this.knowledge.communityGroups = (communityGroups || []).map((grp) => {
      const detail = Object.values(communityDetailsData || {}).find(
        (d) => normalizeText(d.name) === normalizeText(grp.name)
      );
      const announcements = detail?.announcements || [];
      return {
        id: grp.id || `comm-${normalizeText(grp.name).replace(/\s+/g, '-')}`,
        name: grp.name,
        category: grp.category || 'Peer Support Circle',
        ages: grp.ages || 'All ages',
        frequency: grp.frequency || '',
        schedule: grp.schedule || grp.frequency || 'Regular schedule',
        location: grp.location || 'Community Resource Center: 2471 Portola Road, Suite 100, Ventura',
        description: grp.description || '',
        meetingFormat: grp.meetingFormat || 'In-person peer discussion',
        contactEmail: grp.contactEmail || 'info@diversitycollective.org',
        announcements,
        costType: '100% Free',
        url: '/community'
      };
    });

    // 4. Live Events & Calendar
    this.knowledge.events = liveEventsList.map((ev) => {
      const slug = ev.slug || normalizeText(ev.title).replace(/\s+/g, '-');
      return {
        id: ev.id || `evt-${slug}`,
        slug,
        title: ev.title,
        category: ev.category || 'Community Event',
        date: ev.date || '',
        time: ev.time || '',
        location: ev.location || 'Ventura County',
        isFree: ev.isFree !== false,
        ticketPrice: ev.ticketPrice || (ev.isFree !== false ? 'Free admission' : 'See event details'),
        summary: ev.summary || '',
        description: ev.description || '',
        highlights: ev.highlights || [],
        rsvpRequired: Boolean(ev.rsvpRequired),
        organizer: ev.organizer || 'Diversity Collective',
        url: `/events/${slug}`
      };
    });

    // 5. Affirming Business Directory
    // 10. Podcasts & Community Media
    const livePodcasts = liveCms.podcasts || [];
    this.knowledge.podcasts = livePodcasts.map((pod) => ({
      id: pod.id || `pod-${pod.slug}`,
      slug: pod.slug,
      title: pod.title,
      category: pod.category || 'Podcasts & Media',
      host: pod.host || 'DCVC Team',
      guests: pod.guests || '',
      duration: pod.duration || '',
      date: pod.date || '',
      link: pod.link || '/media',
      summary: pod.summary || pod.description || '',
      url: `/media#${pod.slug}`
    }));

    this.knowledge.businesses = (liveBusinesses || []).map((b) => ({
      id: b.id || `biz-${b.slug || normalizeText(b.name)}`,
      slug: b.slug || normalizeText(b.name).replace(/\s+/g, '-'),
      name: b.name,
      category: b.category || 'General Service',
      city: b.city || 'Ventura County',
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      website: b.website || '',
      isLGBTQOwned: Boolean(b.isLGBTQOwned),
      isVerifiedAffirming: b.isVerifiedAffirming !== false,
      description: b.description || '',
      tags: b.tags || [],
      url: '/directory'
    }));

    // 6. Board Members
    this.knowledge.board = (liveBoard || []).map((bm) => {
      const slug = bm.slug || getBoardMemberSlug(bm);
      return {
        id: bm.id || `board-${slug}`,
        slug,
        name: bm.name,
        role: bm.role || 'Board Member',
        committee: bm.committee || '',
        bio: bm.bio || '',
        extendedBio: bm.extendedBio || [],
        quote: bm.quote || '',
        focusAreas: bm.focusAreas || [],
        city: bm.city || 'Ventura County',
        pronouns: bm.pronouns || '',
        url: `/board/${slug}`
      };
    });

    // 7. Staff Members
    this.knowledge.staff = (liveStaff || []).map((st) => ({
      id: st.id || `staff-${normalizeText(st.name).replace(/\s+/g, '-')}`,
      name: st.name,
      role: st.role || 'DCVC Staff',
      bio: st.bio || '',
      email: st.email || 'info@diversitycollective.org',
      focusAreas: st.focusAreas || [],
      url: '/board-and-staff'
    }));

    // 8. Training Workshops
    this.knowledge.trainings = (liveTrainings || []).map((tr) => {
      const slug = tr.slug || normalizeText(tr.title).replace(/\s+/g, '-');
      return {
        id: tr.id || `train-${slug}`,
        slug,
        title: tr.title,
        badge: tr.badge || 'Professional Workshop',
        format: tr.format || 'Interactive Workshop (In-person or Virtual)',
        duration: tr.duration || 'Flexible format',
        targetAudience: tr.targetAudience || 'Corporate workplaces, healthcare systems, schools, and non-profits',
        feeStructure: tr.feeStructure || 'Non-profit/civic sliding scale versus commercial rates based on group size and format. Organizations request a formal proposal at /training/book.',
        summary: tr.summary || '',
        description: tr.description || '',
        learningObjectives: tr.learningObjectives || [],
        bookingUrl: '/training/book',
        url: `/training/${slug}`
      };
    });

    // 9. Community Resources & Crisis Lines
    this.knowledge.resources = [];
    for (const catGroup of liveResources) {
      const catName = catGroup.category || 'Community Resource';
      for (const item of catGroup.items || []) {
        this.knowledge.resources.push({
          id: item.id || `res-${normalizeText(item.name).replace(/\s+/g, '-')}`,
          name: item.name,
          category: catName,
          phone: item.phone || '',
          url: item.url || '/resources',
          notes: item.notes || '',
          address: item.address || '',
          city: item.city || '',
          spanishAvailable: Boolean(item.spanishAvailable),
          isFreeOrSlidingScale: item.isFreeOrSlidingScale !== false
        });
      }
    }

    // 10. Special Facilities & Amenities
    this.knowledge.facilities = [
      {
        id: 'facility-crc',
        title: 'Community Resource Center (Physical Drop-in Hub)',
        address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
        hours: this.knowledge.settings.hours,
        phone: this.knowledge.settings.phone,
        costType: '100% Free',
        summary: 'Ventura County’s central LGBTQ+ community hub providing free drop-in access, high-speed computer/cyber lab, printing for essential needs, mutual aid pantry, and meeting space.',
        url: '/programs/community-resource-center'
      },
      {
        id: 'facility-flex-space',
        title: 'Community Flex Space & Meeting Room',
        address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
        hours: 'Available during Community Resource Center hours or by reservation',
        summary: 'Bookable community meeting and workshop space equipped with high-speed Wi-Fi, presentation display, and configurable seating. Available for community groups and partner gatherings.',
        bookingUrl: '/#flex-space',
        url: '/#flex-space'
      },
      {
        id: 'facility-pantry-library',
        title: 'Mutual Aid Food Pantry & LGBTQ+ Lending Library',
        address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
        hours: 'Mon–Fri 1:00 PM – 5:00 PM PT',
        costType: '100% Free',
        summary: 'Free mutual aid pantry offering non-perishable food, hygiene supplies, safer sex harm reduction kits, and an extensive LGBTQ+ affirming book lending library.',
        url: '/programs/community-resource-center'
      }
    ];

    // 11. Special Engagements
    this.knowledge.specialEngagements = (specialEngagements || []).map((se) => ({
      id: se.id || `se-${normalizeText(se.title).replace(/\s+/g, '-')}`,
      title: se.title,
      subtitle: se.subtitle || '',
      schedule: se.schedule || 'Check events calendar',
      location: se.location || 'Community Resource Center: 2471 Portola Road, Suite 100, Ventura',
      description: se.description || '',
      features: se.features || [],
      url: '/events'
    }));

    // 12. News Articles
    this.knowledge.news = liveNews.map((n) => ({
      id: n.id || `news-${n.slug}`,
      slug: n.slug || normalizeText(n.title).replace(/\s+/g, '-'),
      title: n.title,
      date: n.date || '',
      author: n.author || 'DCVC Team',
      excerpt: n.excerpt || '',
      content: n.content || '',
      url: `/news/${n.slug || normalizeText(n.title).replace(/\s+/g, '-')}`
    }));

    // 13. Sponsors & Partners
    this.knowledge.sponsors = liveSponsors.map((sp) => ({
      id: sp.id || `sponsor-${normalizeText(sp.name).replace(/\s+/g, '-')}`,
      name: sp.name,
      tier: sp.tier || 'Community Partner',
      role: sp.role || '',
      description: sp.description || `${sp.name} is an official community partner of Diversity Collective.`,
      url: '/sponsors'
    }));

    // 14. Custom Staff-Authored Facts
    this.knowledge.customKnowledge = liveCustom;

    // Compile rapid entity and keyword maps
    this.rebuildEntityGraph();

    this.lastLearnedAt = new Date().toISOString();
    this.isInitialized = true;
  }

  /**
   * Rebuild indexed entity graphs for instant lookups and fuzzy matching
   */
  rebuildEntityGraph() {
    this.entityIndex.clear();
    this.keywordMap.clear();

    const register = (entity, type, names, keywords = []) => {
      const entry = { entity, type, names, keywords };
      for (const n of names) {
        if (!n) continue;
        const norm = normalizeText(n);
        if (norm) {
          // Standing programs and community circles take precedence over individual event calendar dates
          if (type === 'Event' && this.entityIndex.has(norm)) {
            const existing = this.entityIndex.get(norm);
            if (existing && (existing.type === 'Program' || existing.type === 'CommunityGroup')) {
              continue;
            }
          }
          this.entityIndex.set(norm, entry);
        }
      }
      for (const kw of keywords) {
        if (!kw) continue;
        const norm = normalizeText(kw);
        if (norm && norm.length >= 3) {
          if (!this.keywordMap.has(norm)) this.keywordMap.set(norm, []);
          this.keywordMap.get(norm).push(entry);
        }
      }
    };

    // Registered Leadership in settings & orgInfo
    register({
      name: "Roland Catabona",
      role: "Board President",
      bio: "Roland Catabona serves as the President of the Board of Directors for Diversity Collective Ventura County, championing LGBTQ+ health equity, community visibility, and organizational governance across all 10 Ventura County cities.",
      url: "/board-and-staff"
    }, 'BoardMember', ['Roland Catabona', 'Roland'], ['President', 'Board President', 'Leadership', 'Board of Directors']);

    register({
      name: "Tess Allen",
      role: "Executive Director",
      bio: "Tess Allen serves as the Executive Director of Diversity Collective Ventura County. With an extensive background in the nonprofit sector, Tess leads DCVC's community programs, Diversity SHINES clinical health initiatives, and regional partnerships.",
      url: "/board-and-staff"
    }, 'Staff', ['Tess Allen', 'Tess'], ['Executive Director', 'Director', 'Leadership']);

    register({
      name: "Genevieve Flores-Haro",
      role: "Associate Director",
      bio: "Genevieve Flores-Haro guides public policy, grassroots community advocacy, and intersectional wellness programming across Ventura County.",
      url: "/board-and-staff"
    }, 'Staff', ['Genevieve Flores-Haro', 'Genevieve Flores Haro', 'Genevieve'], ['Associate Director', 'Advocacy', 'Leadership', 'Public Policy']);

    // Programs
    for (const p of this.knowledge.programs) {
      const aliases = [
        p.title,
        p.slug,
        p.slug.replace(/-/g, ' ')
      ];
      if (p.slug.includes('shines') || p.title.toLowerCase().includes('shines')) {
        aliases.push('shines', 'diversity shines', 'hiv test', 'hiv testing', 'sti test', 'sti testing', 'rapid testing', 'screening clinic');
      }
      if (p.slug.includes('rainbow') || p.title.toLowerCase().includes('umbrella')) {
        aliases.push('rainbow umbrella', 'ru', 'youth program', 'teen group');
      }
      if (p.slug.includes('unicorn') || p.title.toLowerCase().includes('unicorn')) {
        aliases.push('little unicorns', 'unicorns', 'kids group', 'children group');
      }
      if (p.slug.includes('crc') || p.slug.includes('community-resource-center')) {
        aliases.push('crc', 'community resource center', 'portola center');
      }
      register(p, 'Program', aliases, [p.audience, p.schedule, p.location, ...(p.amenities || [])]);
    }

    // Community Groups
    for (const g of this.knowledge.communityGroups) {
      const aliases = [g.name, g.name.replace(/Group|Circle|Meeting/i, '').trim()];
      if (g.name.toLowerCase().includes('queer adulting')) {
        aliases.push('queer adulting', 'adulting group', 'queer adults');
      }
      if (g.name.toLowerCase().includes('narcotics anonymous')) {
        aliases.push('narcotics anonymous', 'na', 'na meeting', 'recovery meeting', 'lgbtq recovery');
      }
      if (g.name.toLowerCase().includes('toastmasters')) {
        aliases.push('diversity toastmasters', 'toastmasters', 'public speaking');
      }
      if (g.name.toLowerCase().includes('pflag')) {
        aliases.push('pflag', 'pflag ventura', 'parents of lgbtq');
      }
      if (g.name.toLowerCase().includes('transverse') || g.name.toLowerCase().includes('trans peer')) {
        aliases.push('trans peer group', 'transverse', 'trans group', 'transgender group');
      }
      if (g.name.toLowerCase().includes('silver')) {
        aliases.push('silver collective', 'seniors', 'lgbtq seniors', '55+');
      }
      if (g.name.toLowerCase().includes('men')) {
        aliases.push('mens collective', "men's collective", 'mens group');
      }
      register(g, 'CommunityGroup', aliases, [g.frequency, g.ages, g.location, g.category]);
    }

    // Explicit Adult Transgender Circle Registration
    register({
      id: "trans-peer-groups",
      title: "Transgender & Non-Binary Peer Support Circle",
      name: "Transgender & Non-Binary Peer Support Circle",
      category: "Peer Support Circle",
      ages: "Transgender, non-binary, genderqueer, and questioning adults ages 18+",
      schedule: "1st and 3rd Wednesday of each month: 6:30 PM – 8:00 PM Pacific Time",
      location: "Community Resource Center: 2471 Portola Road, Suite 100, Ventura, CA 93003",
      costType: "100% Free",
      description: "A peer-led affinity space for trans and non-binary adults offering shared experiences, transition navigation, gender-affirming garment closet access, and community bonding.",
      url: "/programs/trans-support"
    }, 'CommunityGroup', [
      'Transgender & Non-Binary Peer Support Circle',
      'Trans Adult Support',
      'Trans Adult Group',
      'Transgender Adult Circle',
      'support groups for trans adults',
      'groups for trans adults'
    ], ['trans adults', 'transgender adults', '18 and older', 'binders', 'support groups for trans adults']);

    // Events
    for (const e of this.knowledge.events) {
      register(e, 'Event', [e.title, e.slug, e.slug.replace(/-/g, ' ')], [e.date, e.time, e.location, e.category, ...(e.highlights || [])]);
    }

    // Affirming Businesses (with short stripped name aliases)
    for (const b of this.knowledge.businesses) {
      const stripped = stripBusinessSuffixes(b.name);
      const aliases = [b.name, b.slug, b.slug.replace(/-/g, ' ')];
      if (stripped && stripped.toLowerCase() !== b.name.toLowerCase()) {
        aliases.push(stripped);
      }
      const beforeAmp = b.name.split(/\s*(&|\band\b)\s*/i)[0].trim();
      if (beforeAmp && beforeAmp.length >= 4 && beforeAmp.toLowerCase() !== b.name.toLowerCase()) {
        aliases.push(beforeAmp);
      }
      register(b, 'Business', aliases, [b.category, b.city, b.address, b.phone, ...(b.tags || [])]);
    }

    // Board Members
    for (const bm of this.knowledge.board) {
      register(bm, 'BoardMember', [bm.name, bm.slug, bm.slug.replace(/-/g, ' ')], [bm.role, bm.committee, bm.city, ...(bm.focusAreas || [])]);
    }

    // Staff
    for (const st of this.knowledge.staff) {
      register(st, 'Staff', [st.name], [st.role, ...(st.focusAreas || [])]);
    }

    // Training Courses
    for (const tr of this.knowledge.trainings) {
      register(tr, 'Training', [tr.title, tr.slug, tr.slug.replace(/-/g, ' ')], [tr.format, tr.duration, tr.targetAudience, tr.badge]);
    }

    // Facilities
    for (const f of this.knowledge.facilities) {
      const aliases = [f.title];
      if (f.id === 'facility-flex-space') {
        aliases.push('flex space', 'meeting space', 'meeting room', 'book flex space', 'book room');
      }
      if (f.id === 'facility-pantry-library') {
        aliases.push('food pantry', 'pantry', 'mutual aid', 'lending library', 'library', 'clothing closet');
      }
      register(f, 'Facility', aliases, [f.address, f.hours]);
    }

    // Special Engagements
    for (const se of this.knowledge.specialEngagements) {
      const aliases = [se.title, se.slug, se.id];
      if (se.title.toLowerCase().includes('amplify')) {
        aliases.push('amplify arts', 'amplify after hours', 'after hours', 'amplify arts amplify after hours');
      }
      if (se.title.toLowerCase().includes('transverse')) {
        aliases.push('the transverse', 'transverse', 'transverse peer gatherings');
      }
      register(se, 'SpecialEngagement', aliases, [se.schedule, se.location, ...(se.features || [])]);
    }

    // Crisis Resources
    for (const r of this.knowledge.resources) {
      register(r, 'Resource', [r.name], [r.category, r.phone, r.city, r.notes]);
    }

    // Custom Knowledge
    for (const ck of this.knowledge.customKnowledge) {
      const aliases = [ck.topic, ck.title];
      if (Array.isArray(ck.keywords)) {
        aliases.push(...ck.keywords);
      }
      register(ck, 'CustomFact', aliases, ck.keywords || []);
    }
  }

  /**
   * Find an exact or high-confidence entity match from a user query
   */
  resolveEntity(query) {
    const qNorm = normalizeText(query);
    if (!qNorm) return null;

    // 1. Direct whole-string or substring match in entity names
    for (const [nameNorm, entry] of this.entityIndex.entries()) {
      if (nameNorm.length >= 3) {
        if (qNorm === nameNorm || qNorm.includes(nameNorm)) {
          return entry;
        }
        if (qNorm.length >= 4 && nameNorm.includes(qNorm)) {
          return entry;
        }
      }
    }

    // 2. Token-level matching against entity names with edit distance tolerance
    const queryTokens = tokenize(qNorm, true);
    for (const [nameNorm, entry] of this.entityIndex.entries()) {
      const nameTokens = tokenize(nameNorm, true);
      if (nameTokens.length === 0) continue;

      let matchedTokens = 0;
      for (const qTok of queryTokens) {
        if (nameTokens.some((nTok) => nTok === qTok || (qTok.length >= 4 && nTok.length >= 4 && damerauLevenshtein(qTok, nTok, 1) <= 1))) {
          matchedTokens++;
        }
      }

      // If all meaningful tokens of the entity name are in the query
      if (matchedTokens >= nameTokens.length && nameTokens.length >= 2) {
        return entry;
      }
      // Or if query matches 2+ words of a 3-word entity
      if (nameTokens.length >= 3 && matchedTokens >= 2) {
        return entry;
      }
      // Or if a distinctive single word matches (length >= 5)
      if (nameTokens.length === 1 && matchedTokens === 1 && nameTokens[0].length >= 5) {
        return entry;
      }
    }

    return null;
  }

  /**
   * Status metrics for Admin Dashboard
   */
  getLearningStatus() {
    const totalEntities =
      this.knowledge.programs.length +
      this.knowledge.communityGroups.length +
      this.knowledge.events.length +
      this.knowledge.businesses.length +
      this.knowledge.board.length +
      this.knowledge.staff.length +
      this.knowledge.trainings.length +
      this.knowledge.resources.length +
      this.knowledge.facilities.length +
      this.knowledge.specialEngagements.length +
      this.knowledge.news.length +
      this.knowledge.customKnowledge.length;

    return {
      version: this.version,
      lastLearnedAt: this.lastLearnedAt,
      isInitialized: this.isInitialized,
      totalEntities,
      counts: {
        programs: this.knowledge.programs.length,
        communityGroups: this.knowledge.communityGroups.length,
        events: this.knowledge.events.length,
        businesses: this.knowledge.businesses.length,
        board: this.knowledge.board.length,
        staff: this.knowledge.staff.length,
        trainings: this.knowledge.trainings.length,
        resources: this.knowledge.resources.length,
        news: this.knowledge.news.length,
        customKnowledge: this.knowledge.customKnowledge.length
      }
    };
  }

  /**
   * Save a new custom knowledge fact from the Admin panel
   */
  addCustomFact(fact) {
    const current = getStoredCustomKnowledge();
    const newFact = {
      id: fact.id || `custom-${Date.now()}`,
      topic: fact.topic || 'General Information',
      title: fact.title || fact.topic || 'Custom Fact',
      answer: fact.answer || fact.fact || '',
      keywords: Array.isArray(fact.keywords) ? fact.keywords : (fact.keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
      updatedAt: new Date().toISOString()
    };
    const updated = [newFact, ...current.filter((c) => c.id !== newFact.id)];
    try {
      localStorage.setItem(CUSTOM_KNOWLEDGE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
    this.learnFromSite();
    return newFact;
  }

  /**
   * Delete a custom knowledge fact
   */
  removeCustomFact(id) {
    const current = getStoredCustomKnowledge();
    const updated = current.filter((c) => c.id !== id);
    try {
      localStorage.setItem(CUSTOM_KNOWLEDGE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
    this.learnFromSite();
    return true;
  }

  /**
   * Check domain safety boundaries (Crisis, Urgent Medical, Legal Advice, Injections)
   */
  checkSafetyBoundaries(query) {
    const q = query.toLowerCase();

    // Crisis / Suicidal ideation
    const isCrisis = [
      "suicide", "suicidal", "kill myself", "want to die", "end my life",
      "self harm", "cutting myself", "overdose", "emergency hotline", "crisis lifeline"
    ].some((term) => q.includes(term));

    // Medical diagnosis
    const isMedical = [
      "rash", "fever", "diagnose", "do i have", "monkeypox", "mpox", "syphilis symptoms",
      "chlamydia symptoms", "gonorrhea symptoms", "prescribe", "treatment plan", "medication dose"
    ].some((term) => q.includes(term)) && !q.includes("where") && !q.includes("how old") && !q.includes("hours");

    // Legal representation
    const isLegal = [
      "sue my", "lawsuit against", "file a lawsuit", "legal representation in court",
      "can i sue", "retain a lawyer to represent me"
    ].some((term) => q.includes(term));

    // Prompt injection
    const isInjection = [
      "ignore all previous", "ignore previous instructions", "disregard previous", "disregard all previous",
      "reveal your system prompt", "reveal your prompt", "output your system prompt", "output system prompt",
      "output your prompt", "what is your system prompt", "what are your instructions", "developer mode", "jailbreak",
      "system prompt"
    ].some((term) => q.includes(term));

    return { isCrisis, isMedical, isLegal, isInjection };
  }

  /**
   * Handle casual small talk & greetings warmly
   */
  handleCasualSmallTalk(rawQuery) {
    const norm = normalizeText(rawQuery).replace(/([a-z])\1{2,}/g, '$1');
    const q = norm.trim();

    // Greetings
    if (/^(hi|hii|hey|hello|helo|hola|namaste|yo|sup|good morning|morning|good afternoon|good evening|gm|howdy|luna|hey luna|hi luna|hello luna)(\s+(there|luna|everyone|friend|all))?$/.test(q)) {
      return {
        success: true,
        answer: `Hey there! 💜 I'm **Luna**, your Diversity Collective Ventura County guide. How can I help you today? Ask me about free HIV/STI testing, upcoming events, youth & trans circles, affirming local businesses, training, or how to get involved!`,
        citations: [
          { title: "Programs", url: "/programs" },
          { title: "Events Calendar", url: "/events" }
        ],
        mode: "client-conversational"
      };
    }

    // Podcasts & Media questions
    if (/\b(podcast|podcasts|media|episode|episodes|audio story|audio stories|interview|listen)\b/i.test(q)) {
      const episodeList = (this.knowledge.podcasts || []).slice(0, 3).map(p => `• **${p.title}** (${p.duration || 'Full episode'})`).join('\n');
      return {
        success: true,
        answer: `Diversity Collective produces community podcasts and audio stories amplifying LGBTQ+ voices, healthcare equity, youth leadership, and local history across Ventura County! 🎙️\n\n${episodeList ? `Recent episodes include:\n${episodeList}\n\n` : ''}You can stream all episodes, check show notes, and **suggest ideas for new content or guest speakers** on our Podcasts & Media page.`,
        citations: [
          { title: "Podcasts & Media", url: "/media" }
        ],
        mode: "client-factual"
      };
    }

    // Who are you / persona questions
    if (/^(who are you|what is your name|what are you|what can you do|who made you|tell me about yourself)\??$/.test(q)) {
      return {
        success: true,
        answer: `I'm **Luna**, your caring virtual friend and community guide for **Diversity Collective Ventura County (DCVC)**! 💜🌈\n\nI'm always here to help you feel supported and connected! You can ask me about:\n• **Free Clinical Screenings:** Rapid HIV/STI testing via Diversity SHINES\n• **Youth Sanctuaries:** Rainbow Umbrella (13–23) & Little Unicorns (9–13)\n• **Community Circles:** Queer Adulting, Narcotics Anonymous, Trans Groups, Toastmasters, Silver Collective\n• **Affirming Business Directory:** LGBTQ+-friendly doctors, dentists, therapists, and shops\n• **Events & Calendar:** Dates, locations, and RSVPs\n• **Volunteering & Donations:** Ways to support our local LGBTQ+ community\n\nWhat would you like to explore together today, friend?`,
        citations: [
          { title: "About DCVC", url: "/about" },
          { title: "Programs", url: "/programs" }
        ],
        mode: "client-conversational"
      };
    }

    // How are you check-ins
    if (/^(how\s+(are|r)\s+(you|u)|hows\s+it\s+going|whats\s+up|what\s+s\s+up)(\s+.*)?\??$/i.test(q)) {
      return {
        success: true,
        answer: `Doing great, thank you for asking! ✨ I'm here and ready to help you explore everything happening at Diversity Collective Ventura County. What are you looking for today?`,
        citations: [{ title: "Community Resource Center", url: "/programs/community-resource-center" }],
        mode: "client-conversational"
      };
    }

    // Thanks / Appreciation
    if (/^(thanks|thank you|thank u|thx|ty|much appreciated|awesome thank you|great thanks)!*$/.test(q)) {
      return {
        success: true,
        answer: `You're so welcome! 💜 Feel free to ask anytime you need information on our programs, events, or local LGBTQ+ resources. Have a wonderful day!`,
        citations: [{ title: "Community Resource Center", url: "/programs/community-resource-center" }],
        mode: "client-conversational"
      };
    }

    // Farewells
    if (/^(bye|goodbye|see ya|cya|take care|have a good day|good night)$/.test(q)) {
      return {
        success: true,
        answer: `Take care! 🌈 Remember, our Community Resource Center is open Monday–Friday from 1:00 PM to 5:00 PM PT at 2471 Portola Road, Suite 100, Ventura. You are always welcome here!`,
        citations: [{ title: "Contact Us", url: "/contact" }],
        mode: "client-conversational"
      };
    }

    return null;
  }

  /**
   * Main Query Processor: Synthesizes high-accuracy, dynamically grounded answers
   */
  answerQuery(userQuery, options = {}) {
    const { history = [], customSnapshot = null } = options;

    if (customSnapshot) {
      this.learnFromSite(customSnapshot);
    }

    // Auto-detect dynamic storage changes in browser and re-learn on demand
    if (typeof window !== 'undefined') {
      try {
        const currentCms = localStorage.getItem('dcvc_live_cms_data');
        const currentDir = localStorage.getItem(DIRECTORY_STORAGE_KEY);
        const currentCustom = localStorage.getItem(CUSTOM_KNOWLEDGE_STORAGE_KEY);
        const sig = `${currentCms ? currentCms.length : 0}-${currentDir ? currentDir.length : 0}-${currentCustom ? currentCustom.length : 0}`;
        if (this._lastStorageSig && this._lastStorageSig !== sig) {
          this.learnFromSite();
        }
        this._lastStorageSig = sig;
      } catch (_) {}
    }

    const rawTrimmed = (userQuery || '').trim();
    if (!rawTrimmed) {
      return {
        success: false,
        answer: "Please ask a question about Diversity Collective Ventura County.",
        citations: [{ title: "Contact Us", url: "/contact" }],
        mode: "client-unlimited"
      };
    }

    const rawLower = rawTrimmed.toLowerCase();

    // 1. Safety Guardrails
    const boundaries = this.checkSafetyBoundaries(rawTrimmed);
    if (boundaries.isCrisis) {
      return {
        success: true,
        answer: `If you or someone you know is in crisis or distress, please reach out immediately:\n\n` +
          `• **Suicide & Crisis Lifeline:** Call or text **988** (Free, confidential, 24/7)\n` +
          `• **The Trevor Project (LGBTQ+ Youth):** Call **1-866-488-7386** or text **START to 678-678** (24/7)\n` +
          `• **Ventura County Behavioral Health Crisis Line:** **1-866-998-2243** (24/7 Access)\n` +
          `• **Trans Lifeline:** **1-877-565-8860**\n\n` +
          `DCVC offices do not provide 24/7 crisis monitoring. Please connect with these emergency lifelines for immediate care.`,
        citations: [{ title: "Crisis Lifelines", url: "/contact" }],
        mode: "client-unlimited"
      };
    }

    if (boundaries.isMedical) {
      return {
        success: true,
        answer: `Luna (Ask DCVC) cannot provide medical diagnoses, treatment plans, or clinical evaluations. ` +
          `However, Diversity Collective provides **free, confidential rapid HIV and STI screenings** (results in 15–20 minutes) ` +
          `and PrEP/PEP healthcare navigation through our **Diversity SHINES** clinic on the **1st Monday of every month from 3:00 PM to 7:00 PM PT** ` +
          `at our Community Resource Center (2471 Portola Road, Suite 100, Ventura). Walk-in testing is welcomed, or you can book an appointment at [Book Appointment](/appointments). ` +
          `Free safer sex barrier supplies and harm reduction kits are also available for drop-in pickup Monday–Friday from 1:00 PM to 5:00 PM. No insurance or payment is required. ` +
          `For urgent medical symptoms, please visit an urgent care center or call 911.`,
        citations: [
          { title: "Diversity SHINES Free Testing", url: "/programs/diversity-shines" },
          { title: "Book Appointment", url: "/appointments" }
        ],
        mode: "client-unlimited"
      };
    }

    if (boundaries.isLegal) {
      return {
        success: true,
        answer: `Luna (Ask DCVC) cannot provide formal legal advice, representation, or counsel. ` +
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
        answer: `I am Luna, the official community assistant and virtual friend for Diversity Collective Ventura County! ` +
          `I can help you with questions about DCVC programs, free clinical testing, youth groups, hours, and community resources. ` +
          `How can I help you today, friend?`,
        citations: [{ title: "About DCVC", url: "/about" }],
        mode: "client-unlimited"
      };
    }

    // 2. Casual Small Talk
    const casual = this.handleCasualSmallTalk(rawTrimmed);
    if (casual) return casual;

    // 2b. Out-of-Scope / Non-Existent Programs Guard (e.g. Scuba, Crypto, Gambling)
    const UNVERIFIED_ALIEN_TOPICS = [
      "scuba", "diving", "bitcoin", "crypto", "cryptocurrency", "ethereum",
      "casino", "gambling", "airline flight"
    ];
    if (UNVERIFIED_ALIEN_TOPICS.some((alien) => rawLower.includes(alien))) {
      return {
        success: true,
        answer: `${EXACT_FALLBACK_MESSAGE} Visit our [Contact Page](${DCVC_CONTACT_URL}) or email info@diversitycollective.org.`,
        citations: [{ title: "Contact DCVC", url: DCVC_CONTACT_URL }],
        mode: "client-unlimited"
      };
    }

    // 3. Resolve context if follow-up turn (e.g. "tell me more", "when is it?", "where is that?")
    let effectiveQuery = rawTrimmed;
    if (/^(tell me more|more info|more details|where is it|when is that|how do i join|sign up|who leads it)\??$/i.test(rawTrimmed) && Array.isArray(history) && history.length > 0) {
      const prevUserMsg = [...history].reverse().find((m) => m.role === 'user' && m.text);
      if (prevUserMsg) {
        effectiveQuery = `${prevUserMsg.text} ${rawTrimmed}`;
      }
    }

    // 4. Mission & Organizational Overview
    if (
      (/\b(mission|vision|core values)\b/i.test(rawLower) || /^(what is dcvc|about dcvc|who is dcvc|tell me about dcvc)\??$/i.test(rawLower)) &&
      !rawLower.includes("event") && !rawLower.includes("hour")
    ) {
      return {
        success: true,
        answer: `**${this.knowledge.settings.name}** is a 501(c)(3) tax-exempt public charity established in 2014 (EIN: ${this.knowledge.settings.ein}).\n\n` +
          `• **Mission:** ${this.knowledge.settings.mission}\n` +
          `• **Vision:** ${this.knowledge.settings.vision}\n` +
          `• **Service Area:** ${this.knowledge.settings.serviceArea}\n` +
          `• **Community Resource Center:** ${this.knowledge.settings.address}\n\n` +
          `Learn more about our history and programs at [About DCVC](/about).`,
        citations: [{ title: "About DCVC", url: "/about" }],
        mode: "client-unlimited"
      };
    }

    // 4b. Custom Staff Knowledge Snippets Scan (High priority for specific closures, custom FAQs, etc.)
    if (Array.isArray(this.knowledge.customKnowledge) && this.knowledge.customKnowledge.length > 0) {
      for (const fact of this.knowledge.customKnowledge) {
        const keywords = Array.isArray(fact.keywords) ? fact.keywords : [];
        const matchesKeyword = keywords.some((kw) => kw && rawLower.includes(kw.toLowerCase().trim()));
        const matchesTopic = fact.topic && rawLower.includes(fact.topic.toLowerCase().trim());
        const matchesTitle = fact.title && rawLower.includes(fact.title.toLowerCase().trim());
        if (matchesKeyword || matchesTopic || matchesTitle) {
          return {
            success: true,
            answer: fact.answer || fact.fact || '',
            citations: [{ title: fact.title || fact.topic || "DCVC Information", url: "/about" }],
            mode: "client-unlimited"
          };
        }
      }
    }

    // 4c. Action & Procedural Workflows (How to Submit, Book, Volunteer, Donate, Contact)
    // 1. Business Directory Submission
    if (
      (/\b(submit|add|list|register|application|apply|how do i get listed|how to get listed)\b/i.test(rawLower) &&
       /\b(business|directory|vendor|shop|practice|clinic|provider|company)\b/i.test(rawLower)) ||
      /\bhow (do|can) i submit (a|my) business\b/i.test(rawLower) ||
      /\bbusiness submission\b/i.test(rawLower) ||
      /\badd (my|a) business\b/i.test(rawLower)
    ) {
      return {
        success: true,
        answer: `Local business owners, healthcare practitioners, and professional service providers can submit their listing to the **DCVC LGBTQ+ Affirming Business Directory** online at [Submit a Business](/directory/submit).\n\n` +
          `**How to Submit & Get Verified:**\n` +
          `1. **Complete the Online Form:** Provide your business name, category, Ventura County street address, phone number, website, and a welcoming description at [Directory Submission](/directory/submit).\n` +
          `2. **Sign the Affirming Pledge:** Confirm your commitment to providing a safe, affirming, and non-discriminatory environment for LGBTQ+ community members, clients, and staff.\n` +
          `3. **Staff Verification:** Our team reviews every submission (typically within 3–5 business days). Once verified, your listing goes live in the public directory with official DCVC Verified status and special edge lighting!\n\n` +
          `👉 Start your submission: [Directory Submission Form](/directory/submit).`,
        citations: [
          { title: "Directory Submission Form", url: "/directory/submit" },
          { title: "Affirming Directory", url: "/directory" }
        ],
        mode: "client-unlimited"
      };
    }

    // 2. Community Resource Submission
    if (
      (/\b(submit|add|suggest|recommend)\b/i.test(rawLower) && /\b(resource|helpline|lifeline|organization|service|hotline)\b/i.test(rawLower)) ||
      /\bresource submission\b/i.test(rawLower) ||
      /\bhow (do|can) i submit a resource\b/i.test(rawLower)
    ) {
      return {
        success: true,
        answer: `You can suggest a community resource, healthcare lifeline, or local advocacy organization to be included in our countywide directory at [Submit a Resource](/resources/submit).\n\n` +
          `**Submission Guidelines:**\n` +
          `• Resources must directly serve Ventura County residents or provide certified 24/7 crisis support.\n` +
          `• Every entry is vetted by DCVC care navigators to ensure accurate contact information and affirming service standards.\n\n` +
          `👉 Submit details online: [Resource Submission Form](/resources/submit).`,
        citations: [
          { title: "Submit a Resource", url: "/resources/submit" },
          { title: "Community Resources", url: "/resources" }
        ],
        mode: "client-unlimited"
      };
    }

    // 3. Training & Workshop Booking
    if (
      (/\b(book|request|schedule|inquire|proposal|pricing|quote)\b/i.test(rawLower) && /\b(training|workshop|pride training|cultural competency|workplace training)\b/i.test(rawLower)) ||
      /\btraining booking\b/i.test(rawLower) ||
      /\bhow (do|can) i book training\b/i.test(rawLower)
    ) {
      return {
        success: true,
        answer: `Diversity Collective offers customized **P.R.I.D.E. Workplace Cultural Humility & Inclusion Workshops** for businesses, schools, healthcare clinics, and civic agencies across Ventura County.\n\n` +
          `**How to Request Training:**\n` +
          `• **Flexible Delivery:** Available on-site at your facility, virtually via Zoom, or at our Community Resource Center.\n` +
          `• **Customized Proposal:** Workshop pricing is tailored via formal proposal based on group size, duration, and nonprofit versus corporate tier (sliding scale available for grassroots nonprofits).\n\n` +
          `👉 Submit a workshop inquiry: [Book Training Workshop](/training/booking).`,
        citations: [
          { title: "Training Booking Form", url: "/training/booking" },
          { title: "P.R.I.D.E. Training Overview", url: "/training" }
        ],
        mode: "client-unlimited"
      };
    }

    // 4. Health / STI / HIV Appointments
    if (
      (/\b(book|schedule|make|set up)\b/i.test(rawLower) && /\b(appointment|visit|intake|screening)\b/i.test(rawLower)) ||
      /\b(how (do|can) i get tested|schedule testing|book testing|make appointment)\b/i.test(rawLower)
    ) {
      return {
        success: true,
        answer: `You can book a free, confidential health appointment or wellness intake online at [Book an Appointment](/appointments).\n\n` +
          `**Available Services:**\n` +
          `• **Diversity SHINES Rapid HIV & STI Testing:** 15–20 minute confidential rapid screenings. Walk-ins welcomed 1st Monday of every month (3:00–7:00 PM PT), or reserve an appointment online.\n` +
          `• **Mental Health & Care Intake:** Confidential referrals to affirming, licensed therapists in Ventura County.\n` +
          `• **Free Safer Sex Supplies:** Drop in Mon–Fri 1:00–5:00 PM at 2471 Portola Road, Suite 100, Ventura for barrier supplies and Narcan kits.\n\n` +
          `👉 Schedule your visit: [Appointment Booking](/appointments).`,
        citations: [
          { title: "Schedule Appointment", url: "/appointments" },
          { title: "Diversity SHINES Clinic", url: "/programs/diversity-shines" }
        ],
        mode: "client-unlimited"
      };
    }

    // 5. Volunteer Application
    if (
      /\b(how (do|can) i volunteer|how to volunteer|sign up to volunteer|volunteer application|apply to volunteer|get involved)\b/i.test(rawLower)
    ) {
      return {
        success: true,
        answer: `We are always looking for passionate community members to get involved! You can apply online at [Volunteer With DCVC](/volunteer).\n\n` +
          `**Key Volunteer Roles:**\n` +
          `• **Resource Center Greeter:** Front desk welcome, lending library checkouts, and mutual aid pantry support (Mon–Fri 1–5 PM).\n` +
          `• **Ventura County Pride Festival Crew:** Event setup, stage management, festival safety, and info booths.\n` +
          `• **Health Outreach:** Community distribution of testing information and safer sex kits.\n` +
          `• **Youth Mentorship:** Supporting Rainbow Umbrella circles (ages 21+ with mandatory Live Scan background checks required for youth safety).\n\n` +
          `👉 Submit an application: [Volunteer Application Form](/volunteer).`,
        citations: [
          { title: "Volunteer Application", url: "/volunteer" },
          { title: "Community Center", url: "/programs/community-resource-center" }
        ],
        mode: "client-unlimited"
      };
    }

    // 6. Donations
    if (
      /\b(how (do|can) i donate|how to donate|where to donate|make a donation|give money|financial support|tax-deductible|tax deductible)\b/i.test(rawLower)
    ) {
      return {
        success: true,
        answer: `You can make a secure, tax-deductible donation online at [Donate to DCVC](/donate).\n\n` +
          `**Why Give Through DCVC:**\n` +
          `• **100% Impact:** We use Zeffy, a 100% zero-fee nonprofit platform, so 100% of your dollars support community programs.\n` +
          `• **Instant Appreciation Card:** Every gift automatically generates an animated digital keepsake card recognizing your donor tier!\n` +
          `• **501(c)(3) Tax Deductible:** DCVC is a registered 501(c)(3) public charity (EIN: 46-5312131).\n\n` +
          `👉 Make your gift: [Donate to DCVC](/donate).`,
        citations: [
          { title: "Donate to DCVC", url: "/donate" },
          { title: "About DCVC", url: "/about" }
        ],
        mode: "client-unlimited"
      };
    }

    // 4d. Historical Concluded Events Guard (Prevents past historical events from being resolved as active events)
    if (
      (rawLower.includes("2023") || rawLower.includes("2024") || rawLower.includes("past event") || rawLower.includes("concluded")) &&
      (rawLower.includes("pride") || rawLower.includes("event") || rawLower.includes("festival") || rawLower.includes("gala") || rawLower.includes("prom"))
    ) {
      return {
        success: true,
        answer: `Past events (such as 2023 or 2024 Pride celebrations) have concluded and are not active. Our upcoming community celebrations include **Ventura County Pride** in August, the annual **Diversity Gala**, and the youth **Pride Prom**. View our live calendar at [Community Events](/events).`,
        citations: [{ title: "Community Events", url: "/events" }],
        mode: "client-unlimited"
      };
    }

    // 5. Specific Entity Resolution (High Precision matching for specific programs, groups, people, businesses)
    const entityMatch = this.resolveEntity(effectiveQuery);
    if (entityMatch) {
      const specificAnswer = this.synthesizeEntityAnswer(entityMatch, effectiveQuery);
      if (specificAnswer) {
        return specificAnswer;
      }
    }

    // 6. Category Intent Matching (Broad queries: "events", "hours", "directory", "youth", "adults", "cost")
    const categoryAnswer = this.synthesizeCategoryAnswer(effectiveQuery);
    if (categoryAnswer) {
      return categoryAnswer;
    }

    // 7. Dynamic Live Search Fallback using smartSiteSearch
    const siteSearch = searchSiteWithSuggestions(effectiveQuery, { limit: 5 });
    if (siteSearch.results && siteSearch.results.length > 0 && siteSearch.results[0].score >= 18) {
      const top = siteSearch.results[0];
      const secondary = siteSearch.results.slice(1, 3).filter((r) => r.score >= 18);
      const typoNote = siteSearch.correctedQuery ? `*(Showing live site results for "${siteSearch.correctedQuery}")*\n\n` : '';
      const bullets = secondary.map((item) => `• **[${item.title}](${item.url})**${item.subtitle ? ` — ${item.subtitle}` : ''}`);

      const answer = `${typoNote}Here is what I found across our live site for **[${top.title}](${top.url})**${top.subtitle ? ` (${top.subtitle})` : ''}:\n\n${top.snippet}${bullets.length ? `\n\nRelated pages:\n${bullets.join('\n')}` : ''}`;
      return {
        success: true,
        answer,
        citations: siteSearch.results.slice(0, 3).map((r) => ({ title: r.title.split('·')[0].trim(), url: r.url })),
        mode: "client-unlimited"
      };
    }

    // 8. Final Honest Fallback
    return {
      success: true,
      answer: `${EXACT_FALLBACK_MESSAGE} Visit our [Contact Page](${DCVC_CONTACT_URL}) or email info@diversitycollective.org.`,
      citations: [{ title: "Contact DCVC", url: DCVC_CONTACT_URL }],
      mode: "client-unlimited"
    };
  }

  /**
   * Synthesize high-precision entity answer
   */
  synthesizeEntityAnswer(match, query) {
    const { entity, type } = match;
    const q = query.toLowerCase();

    // PROGRAM ENTITY
    if (type === 'Program') {
      const citations = [{ title: entity.title, url: entity.url }];
      // Diversity SHINES rapid testing
      if (entity.slug.includes('shines') || entity.title.toLowerCase().includes('shines') || q.includes('hiv') || q.includes('sti') || q.includes('testing')) {
        if (q.includes('age') || q.includes('old') || q.includes('youth') || q.includes('teen')) {
          return {
            success: true,
            answer: `Confidential rapid HIV/STI testing through [Diversity SHINES](/programs/diversity-shines) is available for individuals **ages 12 and older** under California Minor Consent laws without requiring parental notification or insurance.`,
            citations,
            mode: "client-unlimited"
          };
        }
        if (q.includes('when') || q.includes('time') || q.includes('schedule') || q.includes('hour') || q.includes('date') || q.includes('day')) {
          return {
            success: true,
            answer: `Free confidential rapid HIV and STI screenings through [Diversity SHINES](/programs/diversity-shines) take place on the **1st Monday of every month from 3:00 PM to 7:00 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura).\n\n• **Screenings Offered:** Rapid HIV (results in 15–20 minutes), Hepatitis C, Syphilis, Chlamydia, Gonorrhea\n• **Walk-ins & Appointments:** Walk-ins are welcome; appointments can be reserved in advance at [Book Appointment](/appointments)\n• **Harm Reduction Supplies:** Free safer sex supplies and harm reduction kits are available for drop-in pickup Monday–Friday from 1:00 PM to 5:00 PM PT`,
            citations: [
              { title: "Diversity SHINES Free Testing", url: "/programs/diversity-shines" },
              { title: "Book Appointment", url: "/appointments" }
            ],
            mode: "client-unlimited"
          };
        }
        return {
          success: true,
          answer: `Yes! Diversity Collective provides **free, confidential rapid HIV and STI screenings** (Hepatitis C, Syphilis, Chlamydia, Gonorrhea) through our [Diversity SHINES](/programs/diversity-shines) clinic on the **1st Monday of every month from 3:00 PM to 7:00 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura). Results are available in 15–20 minutes with zero insurance or payment required. Learn more at [Diversity SHINES](/programs/diversity-shines) or reserve a time at [Book Appointment](/appointments).`,
          citations: [
            { title: "Diversity SHINES Free Testing", url: "/programs/diversity-shines" },
            { title: "Book Appointment", url: "/appointments" }
          ],
          mode: "client-unlimited"
        };
      }

      // Rainbow Umbrella
      if (entity.slug.includes('rainbow') || entity.title.toLowerCase().includes('umbrella')) {
        if (q.includes('age') || q.includes('old') || q.includes('who can attend')) {
          return {
            success: true,
            answer: `[Rainbow Umbrella](/programs/rainbow-umbrella) is strictly for youth and young adults **ages 13 through 23**. Children ages 9–13 attend our [Little Unicorns](/programs/little-unicorns) group on 1st & 3rd Saturdays. Adults 24+ can join our adult peer support circles.`,
            citations,
            mode: "client-unlimited"
          };
        }
        if (q.includes('when') || q.includes('hour') || q.includes('time') || q.includes('meet') || q.includes('day')) {
          return {
            success: true,
            answer: `[Rainbow Umbrella](/programs/rainbow-umbrella) meets every **Friday evening from 5:30 PM to 7:30 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura) for youth ages 13–23. It is 100% free with snacks and activities.`,
            citations,
            mode: "client-unlimited"
          };
        }
        return {
          success: true,
          answer: `[Rainbow Umbrella](/programs/rainbow-umbrella) is Ventura County's premier youth peer group for LGBTQ+ and allied youth **ages 13 through 23**. Meetings take place every **Friday evening from 5:30 PM to 7:30 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura) with free food, games, and adult facilitators.`,
          citations,
          mode: "client-unlimited"
        };
      }

      // Little Unicorns
      if (entity.slug.includes('unicorn') || entity.title.toLowerCase().includes('unicorn')) {
        if (q.includes('age') || q.includes('old') || q.includes('who can attend') || q.includes('younger')) {
          return {
            success: true,
            answer: `[Little Unicorns](/programs/little-unicorns) is designed specifically for children **ages 9 through 13** and their parents/caregivers. Youth ages 13–23 can participate in [Rainbow Umbrella](/programs/rainbow-umbrella).`,
            citations,
            mode: "client-unlimited"
          };
        }
        return {
          success: true,
          answer: `[Little Unicorns](/programs/little-unicorns) is an affirming social circle for gender-expansive and LGBTQ+ children **ages 9 through 13** and their parents/caregivers. It meets on the **1st and 3rd Saturday of every month from 10:00 AM to 11:30 AM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura).`,
          citations,
          mode: "client-unlimited"
        };
      }

      // Community Resource Center
      if (entity.slug.includes('crc') || entity.slug.includes('community-resource-center')) {
        if (q.includes('where') || q.includes('location') || q.includes('address')) {
          return {
            success: true,
            answer: `The Community Resource Center is located at **2471 Portola Road, Suite 100, Ventura, CA 93003** (near Highway 101 and Telephone Road). Operating hours are **Monday through Friday from 1:00 PM to 5:00 PM PT**. Phone: **(805) 644-LGBT**. Learn more at [Community Resource Center](/programs/community-resource-center).`,
            citations,
            mode: "client-unlimited"
          };
        }
        if (q.includes('hour') || q.includes('open') || q.includes('time') || q.includes('schedule')) {
          return {
            success: true,
            answer: `The Community Resource Center is open for drop-in visits, computer lab access, and rapid testing **Monday through Friday from 1:00 PM to 5:00 PM PT**. It is closed on weekends and major holidays. Learn more at [Community Resource Center](/programs/community-resource-center).`,
            citations,
            mode: "client-unlimited"
          };
        }
      }

      // General Program Answer
      return {
        success: true,
        answer: `**[${entity.title}](${entity.url})**\n\n${entity.summary || entity.description}\n\n• **Schedule:** ${entity.schedule}\n• **Audience:** ${entity.audience}\n• **Location:** ${entity.location}\n• **Cost:** ${entity.costType || '100% Free'}`,
        citations,
        mode: "client-unlimited"
      };
    }

    // COMMUNITY GROUP ENTITY (e.g. Narcotics Anonymous, Toastmasters, Queer Adulting, Silver Collective)
    if (type === 'CommunityGroup') {
      const citations = [{ title: entity.name || entity.title, url: entity.url }];

      if (entity.id === 'trans-peer-groups' || (q.includes('trans') && (q.includes('adult') || q.includes('18')))) {
        return {
          success: true,
          answer: `Diversity Collective offers a peer-led **[Transgender & Non-Binary Peer Support Circle](/programs/trans-support)** for adults **ages 18 and older**. The group meets on the **1st and 3rd Wednesday of every month from 6:30 PM to 8:00 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura) and includes access to our affirming clothing and binder closet. In addition, Transverse hosts a bi-weekly Trans Peer Group on Sundays at 4:00 PM. Learn more at [Trans Peer Support](/programs/trans-support) or [Community Circles](/community).`,
          citations: [{ title: "Trans Peer Support", url: "/programs/trans-support" }],
          mode: "client-unlimited"
        };
      }

      const recentNote = entity.announcements && entity.announcements.length > 0
        ? `\n\n*Latest update:* ${entity.announcements[0].title}: ${entity.announcements[0].content}`
        : '';

      return {
        success: true,
        answer: `**[${entity.name}](${entity.url})**\n\n${entity.description}\n\n• **Schedule:** Meets ${entity.schedule}\n• **Ages / Eligibility:** ${entity.ages}\n• **Location:** ${entity.location}\n• **Cost:** 100% Free drop-in${recentNote}`,
        citations,
        mode: "client-unlimited"
      };
    }

    // DIRECTORY BUSINESS ENTITY
    if (type === 'Business') {
      const citations = [{ title: `${entity.name} (Directory)`, url: entity.url }];
      return {
        success: true,
        answer: `Yes! **[${entity.name}](${entity.url})** is listed in our Affirming Business Directory:\n\n` +
          `• **Category:** ${entity.category}${entity.isLGBTQOwned ? ' (LGBTQ+ Owned)' : ''} — Verified Affirming\n` +
          (entity.address ? `• **Address:** ${entity.address}\n` : '') +
          (entity.phone ? `• **Phone:** ${entity.phone}\n` : '') +
          (entity.email ? `• **Email:** ${entity.email}\n` : '') +
          (entity.website ? `• **Website:** [${entity.website}](${entity.website})\n` : '') +
          `\n${entity.description}\n\n` +
          (entity.tags?.length ? `*Tags:* ${entity.tags.join(', ')}\n\n` : '') +
          `Explore all verified affirming businesses at [Affirming Directory](/directory).`,
        citations,
        mode: "client-unlimited"
      };
    }

    // EVENT ENTITY
    if (type === 'Event') {
      const citations = [{ title: entity.title, url: entity.url }];
      return {
        success: true,
        answer: `Here are the latest details for **[${entity.title}](${entity.url})**:\n\n` +
          `• **Date & Time:** ${entity.date}${entity.time ? ` · ${entity.time}` : ''}\n` +
          `• **Location:** ${entity.location}\n` +
          `• **Admission:** ${entity.isFree ? '100% Free' : (entity.ticketPrice || 'Ticketed event')}\n\n` +
          `${entity.summary || entity.description}\n\n` +
          `RSVP or learn more at [${entity.title}](${entity.url}).`,
        citations,
        mode: "client-unlimited"
      };
    }

    // BOARD MEMBER ENTITY
    if (type === 'BoardMember') {
      const citations = [{ title: entity.name, url: entity.url }];
      const committeeText = entity.committee ? ` (Committee: ${entity.committee})` : '';
      const quoteText = entity.quote ? `\n\n*"${entity.quote}"*` : '';
      const focusText = entity.focusAreas?.length ? `\n\n*Focus Areas:* ${entity.focusAreas.join(', ')}` : '';

      return {
        success: true,
        answer: `**${entity.name}** serves on the Board of Directors for Diversity Collective Ventura County as **${entity.role}**${committeeText}.\n\n` +
          `${entity.bio}${quoteText}${focusText}\n\n` +
          `Explore their full editorial profile at [${entity.name}](${entity.url}).`,
        citations,
        mode: "client-unlimited"
      };
    }

    // STAFF ENTITY
    if (type === 'Staff') {
      const citations = [{ title: entity.name, url: entity.url }];
      return {
        success: true,
        answer: `**${entity.name}** serves as **${entity.role}** at Diversity Collective Ventura County.\n\n` +
          `${entity.bio || 'Part of our dedicated operations and care navigation team.'}\n\n` +
          `Contact: ${entity.email || 'info@diversitycollective.org'}. View our full leadership at [Board & Staff](/board-and-staff).`,
        citations,
        mode: "client-unlimited"
      };
    }

    // TRAINING COURSE ENTITY
    if (type === 'Training') {
      const citations = [
        { title: entity.title, url: entity.url },
        { title: "Request Proposal", url: "/training/book" }
      ];
      return {
        success: true,
        answer: `**[${entity.title}](${entity.url})**\n\n` +
          `${entity.summary || entity.description}\n\n` +
          `• **Format:** ${entity.format} (${entity.duration})\n` +
          `• **Target Audience:** ${entity.targetAudience}\n` +
          `• **Fees:** ${entity.feeStructure}\n\n` +
          `Organizations can customize training modules and request a customized fee proposal at [Training Booking](/training/book).`,
        citations,
        mode: "client-unlimited"
      };
    }

    // FACILITY ENTITY (Flex Space, Pantry, Library)
    if (type === 'Facility') {
      const citations = [{ title: entity.title, url: entity.url }];
      return {
        success: true,
        answer: `**[${entity.title}](${entity.url})**\n\n` +
          `${entity.summary}\n\n` +
          `• **Location:** ${entity.address}\n` +
          `• **Hours:** ${entity.hours}\n` +
          (entity.costType ? `• **Cost:** ${entity.costType}\n\n` : '\n') +
          `For reservations or questions, visit [${entity.title}](${entity.url}) or call (805) 644-LGBT.`,
        citations,
        mode: "client-unlimited"
      };
    }

    // SPECIAL ENGAGEMENT ENTITY (Amplify Arts)
    if (type === 'SpecialEngagement') {
      const citations = [{ title: entity.title, url: entity.url }];
      return {
        success: true,
        answer: `**[${entity.title}](${entity.url})**\n\n` +
          `${entity.description}\n\n` +
          `• **Schedule:** ${entity.schedule}\n` +
          `• **Location:** ${entity.location}\n` +
          (entity.features?.length ? `• **Highlights:** ${entity.features.join(', ')}\n\n` : '\n\n') +
          `Learn more at [Community Events](/events).`,
        citations,
        mode: "client-unlimited"
      };
    }

    // CUSTOM FACT ENTITY
    if (type === 'CustomFact') {
      return {
        success: true,
        answer: entity.answer,
        citations: [{ title: entity.title || "DCVC Information", url: "/about" }],
        mode: "client-unlimited"
      };
    }

    return null;
  }

  /**
   * Synthesize broad category answers
   */
  synthesizeCategoryAnswer(query) {
    const q = query.toLowerCase();

    // 1. Events & Calendar (with historical past events guard)
    if (
      q.includes("event") || q.includes("pride") || q.includes("gala") || q.includes("prom") ||
      q.includes("festival") || q.includes("calendar") || q.includes("upcoming")
    ) {
      // Historical past events check
      if (q.includes("2023") || q.includes("2024") || q.includes("past") || q.includes("last year")) {
        return {
          success: true,
          answer: `Past events (such as 2023 or 2024 Pride celebrations) have concluded and are not active. Our upcoming community celebrations include **Ventura County Pride** in August, the annual **Diversity Gala**, and the youth **Pride Prom**. View our live calendar at [Community Events](/events).`,
          citations: [{ title: "Community Events", url: "/events" }],
          mode: "client-unlimited"
        };
      }

      // Live upcoming events dynamic extraction
      const eventsList = this.knowledge.events || [];
      const upcomingHighlights = eventsList.slice(0, 4).map((e) =>
        `• **[${e.title}](${e.url})** — ${e.date}${e.time ? ` at ${e.time}` : ''} (${e.location})`
      ).join('\n');

      return {
        success: true,
        answer: `Diversity Collective hosts premier regional events including the seaside **Ventura County Pride Festival** (held each August at Promenade Park), the annual **Diversity Gala** benefit, and youth **Pride Prom**.\n\n` +
          `**Upcoming events on our live calendar:**\n${upcomingHighlights}\n\n` +
          `Check active schedules, RSVP, and volunteer opportunities at [Events Calendar](/events).`,
        citations: [
          { title: "Events Calendar", url: "/events" },
          ...eventsList.slice(0, 3).map((e) => ({ title: e.title, url: e.url }))
        ],
        mode: "client-unlimited"
      };
    }

    // 2. Affirming Business Directory (e.g. coffee, doctor, lawyer, therapist, counseling, shop, dining)
    if (
      q.includes("directory") || q.includes("business") || q.includes("doctor") || q.includes("physician") ||
      q.includes("dentist") || q.includes("dental") || q.includes("lawyer") || q.includes("attorney") || q.includes("legal") ||
      q.includes("therapist") || q.includes("therapy") || q.includes("counsel") || q.includes("mental health") || q.includes("psycholog") ||
      q.includes("shop") || q.includes("store") || q.includes("restaurant") || q.includes("dining") ||
      q.includes("coffee") || q.includes("affirming business") ||
      (q.includes("affirming") && (q.includes("find") || q.includes("recommend") || q.includes("where") || q.includes("near")))
    ) {
      if (q.includes("submit") || q.includes("add") || q.includes("list") || q.includes("register") || q.includes("apply") || q.includes("how do i") || q.includes("join")) {
        return {
          success: true,
          answer: `Local business owners, healthcare practitioners, and professional service providers can submit their listing to the **DCVC LGBTQ+ Affirming Business Directory** online at [Submit a Business](/directory/submit).\n\n` +
            `**How to Submit & Get Verified:**\n` +
            `1. **Complete the Online Form:** Provide your business name, category, Ventura County street address, phone number, website, and a welcoming description at [Directory Submission](/directory/submit).\n` +
            `2. **Sign the Affirming Pledge:** Confirm your commitment to providing a safe, affirming, and non-discriminatory environment for LGBTQ+ community members, clients, and staff.\n` +
            `3. **Staff Verification:** Our team reviews every submission (typically within 3–5 business days). Once verified, your listing goes live in the public directory with official DCVC Verified status and special edge lighting!\n\n` +
            `👉 Start your submission: [Directory Submission Form](/directory/submit).`,
          citations: [
            { title: "Directory Submission Form", url: "/directory/submit" },
            { title: "Affirming Directory", url: "/directory" }
          ],
          mode: "client-unlimited"
        };
      }

      const businesses = this.knowledge.businesses || [];
      // Search businesses matching specific terms
      let matches = businesses.filter((b) => {
        const text = `${b.name} ${b.category} ${b.city} ${b.description} ${b.tags.join(' ')}`.toLowerCase();
        if ((q.includes('therapist') || q.includes('counsel') || q.includes('therapy') || q.includes('mental health') || q.includes('psycholog')) &&
            (text.includes('therapist') || text.includes('counsel') || text.includes('therapy') || text.includes('mental health') || text.includes('wellness') || text.includes('psycholog'))) {
          if (q.includes('ventura') && !b.city.toLowerCase().includes('ventura')) return false;
          if (q.includes('oxnard') && !b.city.toLowerCase().includes('oxnard')) return false;
          if (q.includes('ojai') && !b.city.toLowerCase().includes('ojai')) return false;
          return true;
        }
        if (q.includes('coffee') && text.includes('coffee')) return true;
        if ((q.includes('doctor') || q.includes('physician')) && (text.includes('doctor') || text.includes('health') || text.includes('medical'))) return true;
        if ((q.includes('dentist') || q.includes('dental')) && (text.includes('dentist') || text.includes('dental'))) return true;
        if ((q.includes('lawyer') || q.includes('attorney') || q.includes('legal')) && (text.includes('law') || text.includes('legal'))) return true;
        if (q.includes('oxnard') && b.city.toLowerCase().includes('oxnard')) return true;
        if (q.includes('ventura') && b.city.toLowerCase().includes('ventura')) return true;
        if (q.includes('ojai') && b.city.toLowerCase().includes('ojai')) return true;
        return false;
      });

      if (matches.length === 0) {
        matches = businesses.slice(0, 3);
      } else {
        matches = matches.slice(0, 4);
      }

      const listText = matches.map((b) =>
        `• **[${b.name}](/directory)** (${b.city}) — ${b.category}${b.isLGBTQOwned ? ' · LGBTQ+ Owned' : ''}. ${b.phone ? `Phone: ${b.phone}. ` : ''}${b.description.slice(0, 140)}...`
      ).join('\n');

      return {
        success: true,
        answer: `You can find affirming, LGBTQ+-friendly doctors, mental health therapists, shops, and professional services across Ventura County in our searchable [Affirming Business Directory](/directory). All listed businesses have signed the DCVC LGBTQ+ Affirming Pledge.\n\n` +
          `**Featured Affirming Listings:**\n${listText}\n\n` +
          `Explore all listings or submit a local business at [Affirming Business Directory](/directory).`,
        citations: [{ title: "Affirming Directory", url: "/directory" }],
        mode: "client-unlimited"
      };
    }

    // 3. Board of Directors / Leadership
    if (q.includes("board") || q.includes("director") || q.includes("leadership") || q.includes("president") || q.includes("executive director")) {
      const board = this.knowledge.board || [];
      const list = board.map((bm) => `• **[${bm.name}](${bm.url})** — ${bm.role}${bm.committee ? ` (${bm.committee})` : ''}`).join('\n');
      return {
        success: true,
        answer: `Diversity Collective Ventura County is governed by our dedicated community Board of Directors:\n\n${list}\n\n` +
          `Executive Director: **Tess Allen**\n` +
          `Board President: **Roland Catabona**\n\n` +
          `Explore full editorial bios and committee appointments at [Board & Staff](/board-and-staff).`,
        citations: [{ title: "Board & Staff", url: "/board-and-staff" }],
        mode: "client-unlimited"
      };
    }

    // 3b. Professional Training & Workplace Education
    if (q.includes("training") || q.includes("workshop") || q.includes("cultural competency")) {
      return {
        success: true,
        answer: `Diversity Collective offers professional LGBTQ+ cultural competency and workplace training (including our foundational **P.R.I.D.E. Cultural Competency Workshop**). Fees are structured on a non-profit/civic sliding scale versus commercial rates based on group size and needs. Organizations can request a customized fee proposal at [Training Booking](/training/book).`,
        citations: [
          { title: "Training Services", url: "/training" },
          { title: "Request Proposal", url: "/training/book" }
        ],
        mode: "client-unlimited"
      };
    }

    // 3c. Transgender Adult Support Circles
    if (q.includes("trans") || q.includes("nonbinary") || q.includes("non-binary") || q.includes("gender")) {
      return {
        success: true,
        answer: `Diversity Collective offers a peer-led **Transgender & Non-Binary Peer Support Circle** for adults **ages 18 and older**. The group meets on the **1st and 3rd Wednesday of every month from 6:30 PM to 8:00 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura) and includes access to our affirming clothing and binder closet. In addition, Transverse hosts a bi-weekly Trans Peer Group on Sundays at 4:00 PM. Learn more at [Trans Peer Support](/programs/trans-support) or [Community Circles](/community).`,
        citations: [{ title: "Trans Peer Support", url: "/programs/trans-support" }],
        mode: "client-unlimited"
      };
    }

    // 4. Free Services / General Cost
    if (
      q.includes("free") || q.includes("cost") || q.includes("fee") || q.includes("pay") || q.includes("price") ||
      q.includes("gratis") || q.includes("gratuito")
    ) {
      return {
        success: true,
        answer: `Yes! Services and programs provided by Diversity Collective — including [Community Resource Center](/programs/community-resource-center) drop-in access, [Diversity SHINES](/programs/diversity-shines) rapid HIV/STI testing, and [Rainbow Umbrella](/programs/rainbow-umbrella) youth groups — are **100% free of charge**. No insurance, payment, or membership fee is ever required.\n\n` +
          `*Note:* For professional workplace education, organizations request a sliding-scale proposal at [Training Booking](/training/book). Annual signature fundraisers like the Diversity Gala offer ticketed community admissions.`,
        citations: [
          { title: "Free Programs", url: "/programs" },
          { title: "Community Resource Center", url: "/programs/community-resource-center" }
        ],
        mode: "client-unlimited"
      };
    }

    // 5. Operating Hours (when no specific program or entity was matched)
    if (q.includes("hour") || q.includes("open") || q.includes("when are you open") || q.includes("time")) {
      return {
        success: true,
        answer: `The Community Resource Center is open for drop-in visits, computer lab access, mutual aid pantry, and rapid testing **${this.knowledge.settings.hours}**. It is closed on weekends and major holidays.\n\n` +
          `Specific evening groups meet on separate schedules (e.g. [Rainbow Umbrella](/programs/rainbow-umbrella) Fridays 5:30–7:30 PM, [Queer Adulting](/community) 1st & 3rd Wednesdays 7–9 PM). Learn more at [Community Resource Center](/programs/community-resource-center).`,
        citations: [{ title: "Community Resource Center", url: "/programs/community-resource-center" }],
        mode: "client-unlimited"
      };
    }

    // 6. Center Location & Address
    if (q.includes("where") || q.includes("location") || (q.includes("address") && !q.includes("email")) || q.includes("directions") || q.includes("portola")) {
      return {
        success: true,
        answer: `The Diversity Collective Community Resource Center is located at **${this.knowledge.settings.address}** (near Highway 101 and Telephone Road in Ventura). Drop-in hours are **${this.knowledge.settings.hours}**. You can call us at **${this.knowledge.settings.phone}**. Learn more at [Community Resource Center](/programs/community-resource-center).`,
        citations: [{ title: "Community Resource Center", url: "/programs/community-resource-center" }],
        mode: "client-unlimited"
      };
    }

    // 7. Contact Information
    if (q.includes("email") || q.includes("phone") || q.includes("call") || q.includes("contact") || q.includes("number")) {
      return {
        success: true,
        answer: `You can reach Diversity Collective at **${this.knowledge.settings.phone}** or by email at **${this.knowledge.settings.email}**. Our administrative offices and Community Resource Center are located at ${this.knowledge.settings.address}. Submit an online inquiry anytime at [Contact Us](/contact).`,
        citations: [{ title: "Contact Us", url: "/contact" }],
        mode: "client-unlimited"
      };
    }

    // 8. Volunteering
    if (q.includes("volunteer") || q.includes("help out") || q.includes("get involved")) {
      return {
        success: true,
        answer: `We welcome community volunteers! Opportunities include Center greeters, Pride festival staff, health outreach, and workshop support. Volunteers working directly with youth (e.g. Rainbow Umbrella) must be 21+ and pass a Live Scan background check. Apply online at [Volunteer With Us](/volunteer).`,
        citations: [{ title: "Volunteer Application", url: "/volunteer" }],
        mode: "client-unlimited"
      };
    }

    // 9. Donations & Giving
    if (q.includes("donate") || q.includes("donation") || q.includes("zeffy") || q.includes("contribute") || q.includes("appreciation card")) {
      return {
        success: true,
        answer: `You can support Diversity Collective at [Donate to DCVC](/donate). We use **Zeffy**, a 100% zero-fee nonprofit platform, ensuring 100% of your gift reaches local programs. All donations are tax-deductible under 501(c)(3) EIN: ${this.knowledge.settings.ein}. Confirmed donations unlock a personalized [DCVC Appreciation Card](/appreciation-card/preview) keepsake!`,
        citations: [
          { title: "Donate via Zeffy", url: "/donate" },
          { title: "Appreciation Card Preview", url: "/appreciation-card/preview" }
        ],
        mode: "client-unlimited"
      };
    }

    // 10. Dyslexia & Accessibility
    if (q.includes("dyslexia") || q.includes("bionic") || q.includes("opendyslexic") || q.includes("lexend") || q.includes("accessibility") || q.includes("focus audio")) {
      return {
        success: true,
        answer: `Diversity Collective includes a built-in **Accessibility & Dyslexia Support Suite** (press **Alt + A** or click the **Accessibility** launcher)! Features include 1-click **Dyslexia Center Mode**, **OpenDyslexic, Lexend & Atkinson Hyperlegible** fonts, **Bionic Anchor Reading**, **Irlen color comfort overlays**, **ambient Focus Audio**, and a reading ruler. Learn more at [Accessibility Statement](/accessibility).`,
        citations: [{ title: "Accessibility Tools", url: "/accessibility" }],
        mode: "client-unlimited"
      };
    }

    // 11. Sponsors & Partners
    if (q.includes("sponsor") || q.includes("partner") || q.includes("alliance")) {
      return {
        success: true,
        answer: `Diversity Collective collaborates with foundational public health and civic partners including **Ventura County Behavioral Health (VCBH)**, **Ventura County Public Health (VCPH)**, and clinical testing programs like **Diversity SHINES**. To explore organizational partnerships or become an official sponsor, visit [Sponsors & Partners](/sponsors).`,
        citations: [{ title: "Sponsors & Partners", url: "/sponsors" }],
        mode: "client-unlimited"
      };
    }

    // 12. Youth Programs Overview
    if (q.includes("youth") || q.includes("teen") || q.includes("kid") || q.includes("children")) {
      return {
        success: true,
        answer: `Diversity Collective offers dedicated youth initiatives across Ventura County:\n\n` +
          `• **[Rainbow Umbrella](/programs/rainbow-umbrella)** (Ages 13–23): Weekly peer support, Fridays 5:30–7:30 PM at the Resource Center.\n` +
          `• **[Little Unicorns](/programs/little-unicorns)** (Ages 9 through 13 & Caregivers): Affirming social play & parenting circle, 1st & 3rd Saturdays 10:00–11:30 AM.\n` +
          `• **[Amplify Arts (Amplify After Hours)](/events)**: Youth arts, music, and mental wellness creative workshops.\n` +
          `• **[Pride Prom](/events)**: Annual inclusive, chaperoned dance for youth ages 13–23.\n\n` +
          `All youth programs are 100% free with background-checked chaperones.`,
        citations: [
          { title: "Rainbow Umbrella", url: "/programs/rainbow-umbrella" },
          { title: "Little Unicorns", url: "/programs/little-unicorns" }
        ],
        mode: "client-unlimited"
      };
    }

    // 13. Adult Support Groups Overview
    if (q.includes("adult") || q.includes("support group") || q.includes("circles") || q.includes("recovery")) {
      return {
        success: true,
        answer: `Diversity Collective hosts regular free adult community groups at our Resource Center:\n\n` +
          `• **[Queer Adulting](/community)** (Ages 18+): 1st & 3rd Wednesday, 7:00 PM – 9:00 PM.\n` +
          `• **[Trans & Non-Binary Peer Support](/community)** (Ages 18+): Bi-weekly Sundays at 4:00 PM (by Transverse).\n` +
          `• **[Narcotics Anonymous](/community)**: LGBTQ+-welcoming recovery meeting, Mondays 7:00 PM – 8:30 PM.\n` +
          `• **[Diversity Toastmasters](/community)**: 1st & 3rd Tuesday, 6:30 PM – 8:00 PM.\n` +
          `• **[Silver Collective](/community)** (Ages 55+): 2nd Thursday, 6:00 PM – 7:30 PM.\n` +
          `• **[Men's Collective](/community)**: Weekly personal growth circle for LGBTQ+ men.\n\n` +
          `Learn more and check dates at [Community Circles](/community).`,
        citations: [{ title: "Community Circles", url: "/community" }],
        mode: "client-unlimited"
      };
    }

    return null;
  }
}

// Singleton export
export const lunaLearningEngine = new LunaLearningEngine();
