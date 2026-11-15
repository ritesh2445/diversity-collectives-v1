/**
 * DCVC Site Features Reactive Store
 * Manages:
 *  1. Flex Space availability, automated schedule timings, and slot bookings
 *  2. HIV Screening slot quotas, real-time remaining slot counts, and bookings
 *  3. Auto Broadcast Popups (automatic today-event detection + custom Admin broadcast)
 *  4. Dynamic Form Builder schemas for all site forms
 */

const FEATURES_STORAGE_KEY = 'dcvc_site_features_v1';
const FEATURES_EVENT = 'dcvc-site-features-updated';
const CHANNEL_NAME = 'dcvc_live_sync';

export const DEFAULT_FORM_SCHEMAS = {
  hiv_screening: {
    id: 'hiv_screening',
    title: 'Confidential HIV & STI Screening Slot Booking',
    description: 'Free confidential HIV & STI (syphilis, chlamydia, gonorrhea) screening performed by certified HIV counselors. Every 1st Monday 3:00 PM – 7:00 PM at DCVC CRC (2471 Portola Rd, Suite 100, Ventura). Walk-ins also welcomed.',
    submitLabel: 'Reserve Confidential Slot',
    fields: [
      { id: 'name', label: 'Name or Preferred Alias (Confidential)', type: 'text', required: true, placeholder: 'e.g., Alex or Initials' },
      { id: 'contact', label: 'Confidential Email or Phone Number', type: 'text', required: true, placeholder: 'you@example.com or (805) 555-0199' },
      { id: 'service', label: 'Screening / Consultation Requested', type: 'select', required: true, options: [
        'Free Confidential HIV Screening (Rapid Fingerstick)',
        'Confidential STI Screening (Syphilis, Chlamydia & Gonorrhea)',
        'Comprehensive HIV + Full STI Screening Panel',
        'PrEP (Pre-Exposure Prophylaxis) Navigation & Linkage',
        'PEP (Post-Exposure Prophylaxis Emergency Care within 72 hrs)',
        'Free SHINE With Me Safer Sex Kit Pickup / Consultation'
      ] },
      { id: 'preferredLanguage', label: 'Preferred Language for Counselor', type: 'select', required: false, options: [
        'English',
        'Español (Spanish)',
        'No preference'
      ] },
      { id: 'notes', label: 'Confidential Note or Accommodations (Optional)', type: 'textarea', required: false, placeholder: 'Any accessibility or privacy accommodations you need...' }
    ]
  },
  flex_space: {
    id: 'flex_space',
    title: 'Community Flex Space Slot Booking',
    description: 'Reserve a private or collaborative Flex Space time slot at 2471 Portola Rd, Suite 100.',
    submitLabel: 'Book Flex Space Slot',
    fields: [
      { id: 'name', label: 'Your Name / Organization', type: 'text', required: true, placeholder: 'Full name or community group' },
      { id: 'email', label: 'Contact Email', type: 'email', required: true, placeholder: 'you@example.org' },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '(805) 555-0199' },
      { id: 'purpose', label: 'Session Purpose / Group Size', type: 'text', required: true, placeholder: 'e.g., Peer study circle (6 people)' }
    ]
  },
  contact: {
    id: 'contact',
    title: 'General Contact & Inquiry Form',
    description: 'Reach DCVC staff for support, press, partnerships, or general questions.',
    submitLabel: 'Send Inquiry',
    fields: [
      { id: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@example.org' },
      { id: 'phone', label: 'Phone (Optional)', type: 'tel', required: false, placeholder: '(805) 555-0199' },
      { id: 'topic', label: 'Inquiry Topic', type: 'select', required: true, options: [
        'General Question & Resource Center',
        'Peer Support & Youth Programs',
        'HIV/STI Testing & Diversity SHINES',
        'Media, Press & Partnerships',
        'Volunteer & Internship Opportunities'
      ] },
      { id: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'How can our team support you?' }
    ]
  },
  volunteer: {
    id: 'volunteer',
    title: 'Volunteer Application Form',
    description: 'Join DCVC volunteers supporting the Center, Pride, and Youth circles.',
    submitLabel: 'Submit Volunteer Application',
    fields: [
      { id: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@example.org' },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '(805) 555-0199' },
      { id: 'role', label: 'Preferred Volunteer Role', type: 'select', required: true, options: [
        'Center Greeter & Drop-In Host',
        'Event & Pride Logistics',
        'Rainbow Umbrella Youth Mentor (21+)',
        'Diversity SHINES Health Outreach'
      ] },
      { id: 'availability', label: 'Weekly Availability', type: 'textarea', required: false, placeholder: 'Days and times you are available' }
    ]
  },
  training: {
    id: 'training',
    title: 'P.R.I.D.E. Educational Training Request',
    description: 'Request LGBTQ+ cultural competency workshops for schools, clinics, or workplaces.',
    submitLabel: 'Request Training Proposal',
    fields: [
      { id: 'organization', label: 'Organization / School Name', type: 'text', required: true, placeholder: 'Organization name' },
      { id: 'contactName', label: 'Primary Contact Name', type: 'text', required: true, placeholder: 'Your name' },
      { id: 'email', label: 'Work Email', type: 'email', required: true, placeholder: 'name@organization.org' },
      { id: 'headcount', label: 'Estimated Participants', type: 'number', required: false, placeholder: '25' },
      { id: 'notes', label: 'Workshop Goals & Preferred Dates', type: 'textarea', required: false, placeholder: 'Tell us about your team' }
    ]
  },
  directory_submit: {
    id: 'directory_submit',
    title: 'Affirming Business Directory Submission',
    description: 'Apply to list your LGBTQ+ owned or affirming Ventura County business.',
    submitLabel: 'Submit Business Listing',
    fields: [
      { id: 'businessName', label: 'Business Name', type: 'text', required: true, placeholder: 'Business or practice name' },
      { id: 'category', label: 'Category', type: 'select', required: true, options: [
        'Healthcare & Wellness', 'Food & Hospitality', 'Legal & Financial', 'Retail & Creative', 'Home & Auto Services', 'Other'
      ] },
      { id: 'city', label: 'Ventura County City', type: 'text', required: true, placeholder: 'Ventura, Oxnard, Thousand Oaks...' },
      { id: 'email', label: 'Contact Email', type: 'email', required: true, placeholder: 'owner@business.com' },
      { id: 'website', label: 'Website URL', type: 'url', required: false, placeholder: 'https://...' }
    ]
  },
  resource_submit: {
    id: 'resource_submit',
    title: 'Community Resource Recommendation',
    description: 'Suggest a verified affirming community resource for Ventura County.',
    submitLabel: 'Submit Resource',
    fields: [
      { id: 'title', label: 'Resource / Organization Name', type: 'text', required: true, placeholder: 'Organization name' },
      { id: 'category', label: 'Category', type: 'select', required: true, options: [
        'Crisis & Helplines', 'Health & Wellness', 'Youth & Family', 'Housing & Food', 'Legal & Advocacy'
      ] },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '(805) 555-0100' },
      { id: 'website', label: 'Website', type: 'url', required: false, placeholder: 'https://...' },
      { id: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Services provided and eligibility' }
    ]
  }
};

export const DEFAULT_SITE_FEATURES = {
  flexSpace: {
    enabled: true,
    title: 'Community Flex Space',
    subtitle: 'Private & Collaborative Room at 2471 Portola Rd, Suite 100',
    description: 'Need a quiet, affirming space for peer support, telehealth, study, or community organizing? Check real-time availability and reserve a Flex Space time slot.',
    manualStatus: 'auto', // 'auto' | 'available' | 'occupied' | 'closed'
    autoHours: {
      days: [1, 2, 3, 4, 5], // Mon-Fri
      openTime: '13:00',
      closeTime: '17:00'
    },
    slotCapacity: 1,
    slots: [
      '1:00 PM – 2:00 PM',
      '2:00 PM – 3:00 PM',
      '3:00 PM – 4:00 PM',
      '4:00 PM – 5:00 PM'
    ],
    bookings: []
  },
  hivScreening: {
    slotCapacity: 4,
    slots: [
      '3:00 PM – 4:00 PM',
      '4:00 PM – 5:00 PM',
      '5:00 PM – 6:00 PM',
      '6:00 PM – 7:00 PM'
    ],
    bookings: []
  },
  broadcastPopup: {
    enabled: true,
    autoDetectTodayEvents: true,
    customEnabled: false,
    customTitle: '',
    customMessage: '',
    customCtaLabel: 'View Event Details',
    customCtaUrl: '/events',
    style: 'auto', // 'auto' | 'sliding_slides' | 'ticker' | 'compact'
    maxCharsPerSlide: 60
  },
  formSchemas: DEFAULT_FORM_SCHEMAS
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SITE_FEATURES));
}

function mergeFeatures(raw) {
  const base = cloneDefaults();
  if (!raw || typeof raw !== 'object') return base;
  return {
    flexSpace: {
      ...base.flexSpace,
      ...(raw.flexSpace || {}),
      autoHours: {
        ...base.flexSpace.autoHours,
        ...(raw.flexSpace?.autoHours || {})
      },
      slots: Array.isArray(raw.flexSpace?.slots) && raw.flexSpace.slots.length > 0 ? raw.flexSpace.slots : base.flexSpace.slots,
      bookings: Array.isArray(raw.flexSpace?.bookings) ? raw.flexSpace.bookings : []
    },
    hivScreening: {
      ...base.hivScreening,
      ...(raw.hivScreening || {}),
      slots: Array.isArray(raw.hivScreening?.slots) && raw.hivScreening.slots.length > 0 ? raw.hivScreening.slots : base.hivScreening.slots,
      bookings: Array.isArray(raw.hivScreening?.bookings) ? raw.hivScreening.bookings : []
    },
    broadcastPopup: {
      ...base.broadcastPopup,
      ...(raw.broadcastPopup || {})
    },
    formSchemas: {
      ...base.formSchemas,
      ...(raw.formSchemas || {})
    }
  };
}

export function getSiteFeatures() {
  if (typeof localStorage === 'undefined') return cloneDefaults();
  try {
    const raw = localStorage.getItem(FEATURES_STORAGE_KEY);
    return raw ? mergeFeatures(JSON.parse(raw)) : cloneDefaults();
  } catch {
    return cloneDefaults();
  }
}

function notifyFeaturesUpdated(next) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FEATURES_EVENT, { detail: next }));
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const ch = new BroadcastChannel(CHANNEL_NAME);
        ch.postMessage({ type: FEATURES_EVENT, payload: next });
        ch.close();
      } catch {
        // ignore
      }
    }
  }
}

export function saveSiteFeatures(updater) {
  const current = getSiteFeatures();
  const nextRaw = typeof updater === 'function' ? updater(current) : updater;
  const next = mergeFeatures(nextRaw);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }
  notifyFeaturesUpdated(next);
  return next;
}

export function subscribeToSiteFeatures(listener) {
  if (typeof window === 'undefined') return () => {};
  const onCustom = (e) => listener(e.detail || getSiteFeatures());
  const onStorage = (e) => {
    if (e.key === FEATURES_STORAGE_KEY) listener(getSiteFeatures());
  };
  let ch = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = (e) => {
        if (e.data?.type === FEATURES_EVENT) listener(e.data.payload || getSiteFeatures());
      };
    } catch {
      ch = null;
    }
  }
  window.addEventListener(FEATURES_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(FEATURES_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
    if (ch) ch.close();
  };
}

function parseTimeMinutes(hhmm = '13:00') {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (Number.isFinite(h) ? h : 13) * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * Computes live Flex Space availability from manual override or automated schedule.
 */
export function computeFlexSpaceStatus(flexConfig, now = new Date()) {
  const cfg = flexConfig || DEFAULT_SITE_FEATURES.flexSpace;
  const mode = cfg.manualStatus || 'auto';
  if (mode === 'available') {
    return { status: 'available', isAvailable: true, label: 'Flex Space Available Now', mode: 'manual' };
  }
  if (mode === 'occupied') {
    return { status: 'occupied', isAvailable: false, label: 'Flex Space Currently Occupied', mode: 'manual' };
  }
  if (mode === 'closed') {
    return { status: 'closed', isAvailable: false, label: 'Flex Space Closed', mode: 'manual' };
  }

  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const allowedDays = Array.isArray(cfg.autoHours?.days) ? cfg.autoHours.days : [1, 2, 3, 4, 5];
  const openMin = parseTimeMinutes(cfg.autoHours?.openTime || '13:00');
  const closeMin = parseTimeMinutes(cfg.autoHours?.closeTime || '17:00');

  if (allowedDays.includes(day) && minutes >= openMin && minutes < closeMin) {
    return { status: 'available', isAvailable: true, label: 'Available Today (Auto Schedule)', mode: 'auto' };
  }
  return { status: 'closed', isAvailable: false, label: 'Outside Automated Hours (Reserve Ahead)', mode: 'auto' };
}

export function getSlotAvailability(kind, dateStr, features = getSiteFeatures()) {
  const cfg = kind === 'hiv' ? features.hivScreening : features.flexSpace;
  const capacity = Math.max(1, Number(cfg.slotCapacity || 1));
  const bookings = Array.isArray(cfg.bookings) ? cfg.bookings : [];
  return (cfg.slots || []).map((slot) => {
    const bookedCount = dateStr
      ? bookings.filter((b) => b.date === dateStr && b.slot === slot).length
      : 0;
    const remaining = Math.max(0, capacity - bookedCount);
    return {
      slot,
      capacity,
      bookedCount,
      remaining,
      isFull: remaining === 0
    };
  });
}

export function bookTimeSlot(kind, { date, slot, name, contact, email, phone, purpose, service, notes }) {
  if (!date || !slot) {
    return { ok: false, error: 'Please choose both a date and an available time slot.' };
  }
  const features = getSiteFeatures();
  const avail = getSlotAvailability(kind, date, features).find((s) => s.slot === slot);
  if (!avail || avail.remaining <= 0) {
    return { ok: false, error: `Sorry, the "${slot}" slot on ${date} is now full. Please select another slot.` };
  }
  const booking = {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date,
    slot,
    name: String(name || '').trim(),
    contact: String(contact || email || phone || '').trim(),
    email: String(email || '').trim(),
    phone: String(phone || '').trim(),
    purpose: String(purpose || '').trim(),
    service: String(service || '').trim(),
    notes: String(notes || '').trim(),
    createdAt: new Date().toISOString()
  };

  const next = saveSiteFeatures((prev) => {
    const key = kind === 'hiv' ? 'hivScreening' : 'flexSpace';
    return {
      ...prev,
      [key]: {
        ...prev[key],
        bookings: [booking, ...(prev[key].bookings || [])]
      }
    };
  });

  return { ok: true, booking, features: next };
}

const MONTH_ABBRS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Checks whether an event matches today's local calendar date or if Admin has a custom broadcast active.
 */
/**
 * Splits a long sentence/announcement into clean, natural readable slides
 * strictly capped by character limits to guarantee zero height expansion on mobile & desktop.
 */
export function splitSentenceIntoSlides(text, maxChars = 60) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= maxChars) return [clean];

  const words = clean.split(' ');
  const slides = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxChars) {
      current += ' ' + word;
    } else {
      slides.push(current);
      current = word;
    }
  }
  if (current) slides.push(current);
  return slides;
}

export function getActiveBroadcastPopup(events = [], features = getSiteFeatures(), now = new Date()) {
  const cfg = features?.broadcastPopup || DEFAULT_SITE_FEATURES.broadcastPopup;
  if (!cfg.enabled) return null;

  const style = cfg.style || 'auto';
  const maxCharsPerSlide = Number(cfg.maxCharsPerSlide) || 60;

  if (cfg.customEnabled && (cfg.customTitle || cfg.customMessage)) {
    return {
      id: `custom-${cfg.customTitle}-${cfg.customMessage}`.slice(0, 64),
      kind: 'custom',
      badge: 'Live Community Broadcast',
      title: cfg.customTitle || 'Community Announcement',
      message: cfg.customMessage,
      ctaLabel: cfg.customCtaLabel || 'Learn More',
      ctaUrl: cfg.customCtaUrl || '/events',
      style,
      maxCharsPerSlide
    };
  }

  if (!cfg.autoDetectTodayEvents || !Array.isArray(events)) return null;

  const todayYear = String(now.getFullYear());
  const todayMonthAbbr = MONTH_ABBRS[now.getMonth()];
  const todayDayNum = now.getDate();
  const todayIso = `${todayYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(todayDayNum).padStart(2, '0')}`;

  const match = events.find((evt) => {
    if (!evt || evt.isCanceled) return false;
    if (evt.date && String(evt.date).startsWith(todayIso)) return true;
    const evtMonth = String(evt.month || '').trim().toUpperCase().slice(0, 3);
    const evtDay = Number(evt.day);
    const evtYear = evt.year ? String(evt.year).trim() : todayYear;
    return evtMonth === todayMonthAbbr && evtDay === todayDayNum && evtYear === todayYear;
  });

  if (!match) return null;

  return {
    id: `event-${match.id || match.slug || todayIso}`,
    kind: 'today_event',
    badge: "Happening Today at DCVC",
    title: match.title,
    message: `${match.time || 'Today'} · ${match.location || 'Community Resource Center'}${match.description ? ` — ${match.description.slice(0, 140)}` : ''}`,
    ctaLabel: 'View Event Details',
    ctaUrl: match.slug ? `/events/${match.slug}` : '/events',
    style,
    maxCharsPerSlide
  };
}

