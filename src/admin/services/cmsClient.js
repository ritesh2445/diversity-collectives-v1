/**
 * DCVC Admin Dashboard — Full CMS Client
 * Comprehensive management of Programs, Events, Articles, Resources, Board & Staff,
 * Gallery Photos, Memory Lane Milestones, and Site-Wide Settings.
 * Multi-tab reactive sync via localStorage ('dcvc_live_cms_data') & CustomEvents.
 */

const CMS_STORAGE_KEY = 'dcvc_live_cms_data';

export const DEFAULT_CMS_SEED = {
  version: '2.8',
  lastUpdated: new Date().toISOString(),
  settings: {
    name: "Diversity Collective Ventura County",
    tagline: "You Are Always Welcome Here.",
    mission: "Providing advocacy, visibility, safety, and wellness for the LGBTQ+ community across all 10 Ventura County cities.",
    phone: "(805) 644-LGBT (5428)",
    phoneRaw: "+18056445428",
    email: "info@diversitycollective.org",
    address: "2471 Portola Road, Suite 100, Ventura, CA 93003",
    hours: "1:00 PM – 5:00 PM Weekdays (Please call for drop-in hours)",
    emergencyCrisisNotice: "24/7 Crisis Support: Dial 988 (Lifeline) or text 'START' to 678-678 (Trevor Project).",
    bannerAlertActive: true,
    bannerAlertText: "Sanctuary Open Today · Mon–Fri 1:00 PM – 5:00 PM · Free HIV/STI Screenings",
    donationUrl: "https://www.diversitycollectivevc.org/get-involved/#donate",
    volunteerUrl: "https://www.diversitycollectivevc.org/volunteer/",
    facebook: "https://www.facebook.com/diversitycollectivevc",
    instagram: "https://www.instagram.com/diversitycollectivevc",
    youtube: "https://www.youtube.com/@diversitycollectivevc"
  },
  programs: [
    {
      id: "prog-crc",
      slug: "community-resource-center",
      title: "Community Resource Center",
      tagline: "The Physical & Cultural Heart of LGBTQ+ Ventura County",
      chapter: "01",
      heroImage: "/images/crc-building.jpg",
      accent: "#1E5A44",
      audience: "All LGBTQIA+ individuals, families, youth, seniors, and allies",
      schedule: "Monday – Friday, 1:00 PM – 5:00 PM",
      location: "2471 Portola Road, Suite 100, Ventura, CA 93003",
      summary: "A safe, welcoming, and affirming space in Ventura providing peer groups, computer lab access, a curated lending library, harm reduction supplies, and community connections.",
      contactEmail: "info@diversitycollective.org",
      contactPhone: "(805) 644-5428",
      active: true
    },
    {
      id: "prog-ru",
      slug: "rainbow-umbrella",
      title: "Rainbow Umbrella",
      tagline: "Peer Support & Affirming Community for LGBTQ+ Youth",
      chapter: "02",
      heroImage: "/images/youth-umbrella.jpg",
      accent: "#692976",
      audience: "Youth ages 13–23 (LGBTQQIAP2+ & questioning individuals)",
      schedule: "Every Friday, 5:30 PM – 7:30 PM",
      location: "Diversity Collective Community Resource Center, 2471 Portola Rd, Ste 100, Ventura",
      summary: "Weekly peer support gathering creating a safe harbor for youth to talk openly, build resilience, develop leadership, and form lifelong friendships.",
      contactEmail: "rainbowumbrella@diversitycollective.org",
      contactPhone: "(805) 644-5428",
      active: true
    },
    {
      id: "prog-shines",
      slug: "diversity-shines",
      title: "Diversity SHINES",
      tagline: "Free, Confidential Rapid Clinical Testing & Wellness Navigation",
      chapter: "03",
      heroImage: "/images/shines-screening.jpg",
      accent: "#B83280",
      audience: "All sexually active individuals, youth ages 12+ (no parental consent required under CA law)",
      schedule: "Walk-in & by appointment, Monday – Friday 1:00 PM – 5:00 PM",
      location: "Private Clinical Consultation Room, 2471 Portola Rd, Ste 100, Ventura",
      summary: "Free, confidential, and affirming health wellness program delivering rapid HIV & Hepatitis C testing with immediate 15-minute results, PrEP/PEP navigation, and harm reduction.",
      contactEmail: "health@diversitycollective.org",
      contactPhone: "(805) 644-5428",
      active: true
    },
    {
      id: "prog-unicorns",
      slug: "little-unicorns",
      title: "Little Unicorns",
      tagline: "Empowering Pre-Teens & Affirming Families",
      chapter: "04",
      heroImage: "/images/little-unicorns.png",
      accent: "#D97706",
      audience: "Children ages 9–13, their parents, caregivers, and siblings",
      schedule: "First Saturday of every month, 11:00 AM – 1:00 PM",
      location: "Diversity Collective Community Resource Center, 2471 Portola Rd, Ste 100, Ventura",
      summary: "Gentle, welcoming monthly social gathering providing an affirming peer space for pre-teens to play games, express creativity, and build confidence alongside caregiver peer support.",
      contactEmail: "info@diversitycollective.org",
      contactPhone: "(805) 644-5428",
      active: true
    },
    {
      id: "prog-trans",
      slug: "trans-peer-support",
      title: "Trans & Non-Binary Peer Support Circle",
      tagline: "A Closed, Affirming Circle for Gender Diversity",
      chapter: "05",
      heroImage: "/images/community-gathering.jpg",
      accent: "#0D9488",
      audience: "Transgender, non-binary, gender-expansive, and questioning adults 18+",
      schedule: "Every second & fourth Tuesday, 6:30 PM – 8:00 PM",
      location: "Diversity Collective Community Resource Center, 2471 Portola Rd, Ste 100, Ventura",
      summary: "A peer-facilitated discussion and mutual aid group offering safe space to share transition journeys, healthcare navigation, emotional triumphs, and everyday realities.",
      contactEmail: "info@diversitycollective.org",
      contactPhone: "(805) 644-5428",
      active: true
    }
  ],
  events: [
    {
      id: "evt-pride-2026",
      slug: "ventura-county-pride-2026",
      title: "Ventura County Pride Festival 2026",
      date: "August 15, 2026",
      time: "11:00 AM – 7:00 PM",
      location: "Promenade Park & Surfers' Point, Ventura",
      category: "Festival & Celebration",
      description: "Our flagship annual celebration uniting over 5,000 community members for live entertainment, local artisans, youth pavilions, affirming faith groups, and free clinical testing overlooking the Pacific.",
      rsvpUrl: "/events/ventura-county-pride-2026",
      isCancelled: false,
      cancellationNotice: "",
      featured: true
    },
    {
      id: "evt-gala-2026",
      slug: "diversity-gala-2026",
      title: "Annual Diversity Gala & Awards 2026",
      date: "October 17, 2026",
      time: "6:00 PM – 10:00 PM",
      location: "Ventura Beach Marriott Grand Ballroom",
      category: "Signature Fundraiser",
      description: "An elegant evening honoring extraordinary LGBTQ+ leaders, civic allies, and youth scholarship recipients. Formal dinner, silent auction, and live musical performances.",
      rsvpUrl: "/donate",
      isCancelled: false,
      cancellationNotice: "",
      featured: true
    },
    {
      id: "evt-prom-2026",
      slug: "pride-prom-2026",
      title: "Ventura County Youth Pride Prom 2026",
      date: "May 2, 2026",
      time: "7:00 PM – 11:00 PM",
      location: "Sanctuary Ballroom, Ventura County",
      category: "Youth Event",
      description: "An unapologetically affirming, sensory-conscious formal dance for LGBTQ+ high schoolers (ages 13–20) across all 10 county school districts. Dress however you want, dance with whoever you love.",
      rsvpUrl: "/events/pride-prom-2026",
      isCancelled: false,
      cancellationNotice: "",
      featured: true
    },
    {
      id: "evt-tdov-2026",
      slug: "trans-day-of-visibility-2026",
      title: "Transgender Day of Visibility Community Rally",
      date: "March 31, 2026",
      time: "5:30 PM – 7:30 PM",
      location: "Plaza Park, Downtown Ventura",
      category: "Advocacy & Visibility",
      description: "Celebrating trans joy, resilience, and artistic expression. Featuring guest speakers, open mic poetry, mutual aid distribution, and solidarity marches.",
      rsvpUrl: "/events",
      isCancelled: false,
      cancellationNotice: "",
      featured: false
    }
  ],
  news: [
    {
      id: "art-1",
      slug: "expanding-free-hiv-testing-2026",
      title: "Expanding Free Rapid Health Screenings Across Ventura County",
      category: "Health & Clinical",
      publishDate: "January 14, 2026",
      author: "Diversity SHINES Clinical Team",
      readTime: "4 min read",
      image: "/images/shines-screening.jpg",
      excerpt: "How our mobile clinic partnerships with Ventura County Public Health are bringing 15-minute confidential HIV and Hepatitis C testing directly to underserved agricultural communities.",
      tags: ["Healthcare", "Diversity SHINES", "Public Health", "Ventura County"]
    },
    {
      id: "art-2",
      slug: "rainbow-umbrella-celebrates-decade",
      title: "Rainbow Umbrella: A Safe Harbor for Youth Across a Decade",
      category: "Youth & Community",
      publishDate: "February 2, 2026",
      author: "Youth Programs Coordinator",
      readTime: "5 min read",
      image: "/images/youth-umbrella.jpg",
      excerpt: "Reflecting on thousands of Friday night peer circles where young LGBTQ+ voices found courage, built lifelong friendships, and organized the county's first Pride Prom.",
      tags: ["Youth", "Rainbow Umbrella", "Mental Health", "Community"]
    },
    {
      id: "art-3",
      slug: "building-affirming-business-pledge",
      title: "Why Local Businesses are Signing the DCVC Affirming Directory Pledge",
      category: "Advocacy & Business",
      publishDate: "March 10, 2026",
      author: "Community Liaison",
      readTime: "3 min read",
      image: "/images/community-gathering.jpg",
      excerpt: "Ventura County small businesses commit to verified inclusive non-discrimination policies, gender-neutral facilities, and staff DEI training.",
      tags: ["Affirming Directory", "Local Business", "Inclusion", "Ventura"]
    }
  ],
  resources: [
    {
      id: "res-1",
      name: "Diversity SHINES Free Rapid HIV/STI Clinic",
      category: "Health & Clinical",
      description: "Free, confidential rapid HIV and Hepatitis C testing with immediate 15-minute results. Walk-in or appointment. Free barrier protection and PrEP navigation.",
      phone: "(805) 644-5428",
      address: "2471 Portola Road, Suite 100, Ventura, CA",
      website: "https://www.diversitycollectivevc.org/programs/diversity-shines",
      verified: true,
      urgent: false
    },
    {
      id: "res-2",
      name: "988 Suicide & Crisis Lifeline (LGBTQ+ Focus)",
      category: "Crisis & Mental Health",
      description: "24/7 free, confidential crisis counseling. Dial 988 and press 3 for LGBTQ+ specialized youth and adult crisis support.",
      phone: "988 (Press 3)",
      address: "Nationwide 24/7 Telephone & Chat",
      website: "https://988lifeline.org",
      verified: true,
      urgent: true
    },
    {
      id: "res-3",
      name: "The Trevor Project",
      category: "Youth Crisis Lifeline",
      description: "24/7 confidential suicide prevention and crisis intervention services for LGBTQ+ young people under 25.",
      phone: "1-866-488-7386",
      address: "Text 'START' to 678-678",
      website: "https://www.thetrevorproject.org",
      verified: true,
      urgent: true
    },
    {
      id: "res-4",
      name: "PFLAG Ventura County",
      category: "Family & Caregiver Support",
      description: "Monthly support groups for parents, families, and friends of LGBTQ+ individuals, promoting understanding and unconditional love.",
      phone: "(805) 765-1672",
      address: "P.O. Box 7762, Ventura, CA 93006",
      website: "https://pflagventuracounty.org",
      verified: true,
      urgent: false
    }
  ],
  staff: [
    {
      id: "stf-1",
      name: "Tess Allen",
      title: "Executive Director",
      category: "staff",
      email: "tess@diversitycollective.org",
      bio: "Leading organizational strategy, clinical wellness partnerships, community advocacy, and countywide sanctuary expansion since 2018.",
      photo: "/images/volunteers.jpg"
    },
    {
      id: "stf-2",
      name: "Roland Catabona",
      title: "President, Board of Directors",
      category: "board",
      email: "board@diversitycollective.org",
      bio: "Community organizer and healthcare advocate guiding governance, fiscal stewardship, and strategic vision for DCVC.",
      photo: "/images/community-gathering.jpg"
    },
    {
      id: "stf-3",
      name: "Elena Morales",
      title: "Director of Youth Programs",
      category: "staff",
      email: "youth@diversitycollective.org",
      bio: "Facilitating Rainbow Umbrella and Little Unicorns circles, youth leadership training, and the annual Youth Pride Prom.",
      photo: "/images/youth-umbrella.jpg"
    },
    {
      id: "stf-4",
      name: "Marcus Vance",
      title: "Clinical Services Coordinator",
      category: "staff",
      email: "health@diversitycollective.org",
      bio: "Certified HIV counselor supervising Diversity SHINES rapid testing, mobile clinics, and healthcare navigation.",
      photo: "/images/shines-screening.jpg"
    }
  ],
  gallery: [
    {
      id: "gal-1",
      title: "Ventura County Pride Coastline Gathering",
      category: "Festivals & Pride",
      year: "2026",
      image: "/images/community-gathering.jpg",
      description: "Community members uniting on the Ventura Promenade for celebration, music, and solidarity.",
      quote: "A coastline illuminated in rainbows, proving love is louder than hate."
    },
    {
      id: "gal-2",
      title: "Rainbow Umbrella Youth Circle",
      category: "Youth & Community",
      year: "2026",
      image: "/images/youth-umbrella.jpg",
      description: "Weekly youth peer support circle exploring creative art and self-expression.",
      quote: "Creating an unconditional safe harbor where every young person is celebrated."
    },
    {
      id: "gal-3",
      title: "First Countywide Youth Pride Prom",
      category: "Youth & Community",
      year: "2023",
      image: "/images/pride-prom.jpeg",
      description: "Hundreds of LGBTQ+ high schoolers across all 10 county cities dancing without judgment.",
      quote: "The magical night we all deserved in high school."
    },
    {
      id: "gal-4",
      title: "Dedicated Community Volunteers",
      category: "Volunteers & Action",
      year: "2026",
      image: "/images/volunteers.jpg",
      description: "Passionate community members packing 'SHINE With Me' safer-sex kits at our outreach booth.",
      quote: "Grassroots mutual aid powered by over 300 passionate volunteers each year."
    }
  ],
  memoryLane: [
    {
      year: "2014",
      title: "Grassroots Founding & 501(c)(3) Incorporation",
      subtitle: "A Collective Vision Born from Community Need",
      description: "In response to a severe lack of LGBTQ+ services in Ventura County, local leaders convened to form DCVC as an official 501(c)(3) nonprofit public benefit corporation.",
      stat: "1st Countywide LGBTQ+ Coalition",
      badge: "Founding Era",
      image: "/images/community-gathering.jpg",
      quote: "Ventura County deserved a safe harbor where nobody had to travel to Los Angeles just to find affirming care."
    },
    {
      year: "2016",
      title: "Rainbow Umbrella Youth Peer Support",
      subtitle: "Opening Safe Harbor for Ages 13–23",
      description: "Launched Rainbow Umbrella, providing weekly facilitated drop-in circles for queer, trans, questioning, and allied young people to explore identity and build resilience.",
      stat: "1,200+ Youth Circle Hours",
      badge: "Youth Safe Harbor",
      image: "/images/youth-umbrella.jpg",
      quote: "Walking into Rainbow Umbrella was the first time I didn't have to apologize for existing."
    },
    {
      year: "2020",
      title: "Permanent Headquarters on Portola Road",
      subtitle: "Opening 2471 Portola Road, Suite 100",
      description: "Inaugurated DCVC's permanent Community Resource Center in Ventura, featuring a lending library, computer lab, counseling suites, and community gathering lounge.",
      stat: "2,500 Sq Ft Physical Sanctuary",
      badge: "Physical Sanctuary",
      image: "/images/crc-building.jpg",
      quote: "A physical sanctuary transforms a grassroots movement into a lasting institution."
    },
    {
      year: "2026",
      title: "The Next Decade of Sanctuary & Belonging",
      subtitle: "Expanding Mobile Clinics & Digital Sanctuary",
      description: "Launching the modernized digital sanctuary platform, mobile outreach vans reaching rural agricultural communities, and expanded trans & youth care.",
      stat: "10 Cities · 1 Countywide Safe Harbor",
      badge: "The Future of DCVC",
      image: "/images/volunteers.jpg",
      quote: "Our doors are open. You are always welcome here."
    }
  ]
};

export function getLiveCmsData() {
  if (typeof localStorage === 'undefined') return DEFAULT_CMS_SEED;
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    if (!raw) {
      saveLiveCmsData(DEFAULT_CMS_SEED);
      return DEFAULT_CMS_SEED;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CMS_SEED,
      ...parsed,
      settings: { ...DEFAULT_CMS_SEED.settings, ...(parsed.settings || {}) },
      programs: parsed.programs || DEFAULT_CMS_SEED.programs,
      events: parsed.events || DEFAULT_CMS_SEED.events,
      news: parsed.news || DEFAULT_CMS_SEED.news,
      resources: parsed.resources || DEFAULT_CMS_SEED.resources,
      staff: parsed.staff || DEFAULT_CMS_SEED.staff,
      gallery: parsed.gallery || DEFAULT_CMS_SEED.gallery,
      memoryLane: parsed.memoryLane || DEFAULT_CMS_SEED.memoryLane
    };
  } catch {
    return DEFAULT_CMS_SEED;
  }
}

export function saveLiveCmsData(data) {
  if (typeof localStorage === 'undefined') return data;
  const payload = { ...data, lastUpdated: new Date().toISOString() };
  localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(payload));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dcvc-cms-updated', { detail: payload }));
  }
  return payload;
}

export function resetCmsToDefault() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CMS_STORAGE_KEY);
  }
  return saveLiveCmsData(DEFAULT_CMS_SEED);
}

// Sub-entity update helpers
export function saveCmsProgram(program) {
  const data = getLiveCmsData();
  const list = [...data.programs];
  const idx = list.findIndex(p => p.id === program.id || p.slug === program.slug);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...program };
  } else {
    list.unshift({ ...program, id: program.id || `prog-${Date.now()}` });
  }
  saveLiveCmsData({ ...data, programs: list });
  return list;
}

export function deleteCmsProgram(id) {
  const data = getLiveCmsData();
  const list = data.programs.filter(p => p.id !== id && p.slug !== id);
  saveLiveCmsData({ ...data, programs: list });
  return list;
}

export function saveCmsEvent(event) {
  const data = getLiveCmsData();
  const list = [...data.events];
  const idx = list.findIndex(e => e.id === event.id || e.slug === event.slug);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...event };
  } else {
    list.unshift({ ...event, id: event.id || `evt-${Date.now()}` });
  }
  saveLiveCmsData({ ...data, events: list });
  return list;
}

export function deleteCmsEvent(id) {
  const data = getLiveCmsData();
  const list = data.events.filter(e => e.id !== id && e.slug !== id);
  saveLiveCmsData({ ...data, events: list });
  return list;
}

export function toggleCmsEventCancel(id, notice = '') {
  const data = getLiveCmsData();
  const list = data.events.map(e => {
    if (e.id === id || e.slug === id) {
      const isCancelling = !e.isCancelled;
      return {
        ...e,
        isCancelled: isCancelling,
        cancellationNotice: isCancelling ? (notice || 'Event rescheduled or cancelled. Contact info@diversitycollective.org for details.') : ''
      };
    }
    return e;
  });
  saveLiveCmsData({ ...data, events: list });
  return list;
}

export function saveCmsArticle(article) {
  const data = getLiveCmsData();
  const list = [...data.news];
  const idx = list.findIndex(a => a.id === article.id || a.slug === article.slug);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...article };
  } else {
    list.unshift({ ...article, id: article.id || `art-${Date.now()}` });
  }
  saveLiveCmsData({ ...data, news: list });
  return list;
}

export function deleteCmsArticle(id) {
  const data = getLiveCmsData();
  const list = data.news.filter(a => a.id !== id && a.slug !== id);
  saveLiveCmsData({ ...data, news: list });
  return list;
}

export function saveCmsResource(resource) {
  const data = getLiveCmsData();
  const list = [...data.resources];
  const idx = list.findIndex(r => r.id === resource.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...resource };
  } else {
    list.unshift({ ...resource, id: resource.id || `res-${Date.now()}` });
  }
  saveLiveCmsData({ ...data, resources: list });
  return list;
}

export function deleteCmsResource(id) {
  const data = getLiveCmsData();
  const list = data.resources.filter(r => r.id !== id);
  saveLiveCmsData({ ...data, resources: list });
  return list;
}

export function saveCmsStaff(member) {
  const data = getLiveCmsData();
  const list = [...data.staff];
  const idx = list.findIndex(s => s.id === member.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...member };
  } else {
    list.push({ ...member, id: member.id || `stf-${Date.now()}` });
  }
  saveLiveCmsData({ ...data, staff: list });
  return list;
}

export function deleteCmsStaff(id) {
  const data = getLiveCmsData();
  const list = data.staff.filter(s => s.id !== id);
  saveLiveCmsData({ ...data, staff: list });
  return list;
}

export function saveCmsGalleryPhoto(photo) {
  const data = getLiveCmsData();
  const list = [...data.gallery];
  const idx = list.findIndex(g => g.id === photo.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...photo };
  } else {
    list.unshift({ ...photo, id: photo.id || `gal-${Date.now()}` });
  }
  saveLiveCmsData({ ...data, gallery: list });
  return list;
}

export function deleteCmsGalleryPhoto(id) {
  const data = getLiveCmsData();
  const list = data.gallery.filter(g => g.id !== id);
  saveLiveCmsData({ ...data, gallery: list });
  return list;
}

export function saveCmsMilestone(milestone) {
  const data = getLiveCmsData();
  const list = [...data.memoryLane];
  const idx = list.findIndex(m => m.year === milestone.year);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...milestone };
  } else {
    list.push(milestone);
    list.sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10));
  }
  saveLiveCmsData({ ...data, memoryLane: list });
  return list;
}

export function deleteCmsMilestone(year) {
  const data = getLiveCmsData();
  const list = data.memoryLane.filter(m => m.year !== year);
  saveLiveCmsData({ ...data, memoryLane: list });
  return list;
}

export function saveCmsSettings(settingsUpdates) {
  const data = getLiveCmsData();
  const updated = { ...data.settings, ...settingsUpdates };
  saveLiveCmsData({ ...data, settings: updated });
  return updated;
}
