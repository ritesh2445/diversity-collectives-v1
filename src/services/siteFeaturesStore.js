/**
 * DCVC Site Features Reactive Store
 * Manages:
 *  1. Flex Space availability, automated schedule timings, and slot bookings
 *  2. HIV Screening slot quotas, real-time remaining slot counts, and bookings
 *  3. Auto Broadcast Popups (automatic today-event detection + custom Admin broadcast)
 *  4. Dynamic Form Builder schemas for all site forms
 */

import { publishAdminSitePatch } from './liveSync.js';
import { isDateAllowedForHiv, isDateAllowedForFlex } from '../utils/calendarBooking.js';

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
    schemaVersion: 3,
    title: 'Send Us a Message',
    description: 'Messages are reviewed daily by our Community Resource Center team during weekday operating hours.',
    consentText: 'I consent to Diversity Collective Ventura County securely processing and storing my contact details to reply to this inquiry in accordance with our Privacy Policy. Information will never be sold or shared.',
    submitLabel: 'Send Confidential Message',
    fields: [
      { id: 'name', label: 'Your Full Name', type: 'text', required: true, grid: 'half', placeholder: 'Alex Rivera' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, grid: 'half', placeholder: 'alex@example.com' },
      { id: 'phone', label: 'Phone Number (Optional)', type: 'tel', required: false, grid: 'half', placeholder: '(805) 555-0123' },
      { id: 'topic', label: 'Topic of Inquiry', type: 'select', required: true, grid: 'half', defaultValue: 'General Inquiry', options: [
        'General Inquiry',
        'Diversity SHINES Rapid Health Testing',
        'Rainbow Umbrella (Youth 13–23)',
        'Little Unicorns (Kids 9–13)',
        'P.R.I.D.E. Training & Education',
        'Volunteering Opportunities',
        'Donations & Corporate Sponsorship',
        'In-Kind Donations (Equipment, Supplies, Services)',
        'Hosting a Meeting at the Center'
      ] },
      { id: 'message', label: 'Your Message', type: 'textarea', required: true, grid: 'full', placeholder: 'Tell us how we can best assist or welcome you...' }
    ]
  },
  volunteer: {
    id: 'volunteer',
    schemaVersion: 3,
    title: 'Volunteer Application Form',
    description: 'Please share your background, availability, and areas of passion. Our volunteer coordinator conducts monthly orientation sessions.',
    consentText: 'Volunteer Safety & Vetting Consent: Because Diversity Collective provides safe spaces for minor youth and vulnerable adults, I agree to comply with our Code of Conduct and standard volunteer vetting policies under our Privacy Policy.',
    submitLabel: 'Submit Volunteer Application',
    fields: [
      { id: 'preferredName', label: 'Preferred Name', type: 'text', required: true, grid: 'half', badge: 'Primary Communication', placeholder: 'Jordan', helperText: 'The name our team, mentors, and community will use to address you.' },
      { id: 'pronouns', label: 'Pronouns', type: 'text', required: false, grid: 'half', badge: 'Optional', placeholder: 'e.g. they/them, she/her, he/him', helperText: 'Helps us foster an affirming and respectful team environment.' },
      { id: 'fullName', label: 'Full Legal Name', type: 'text', required: true, grid: 'half', badge: 'Confidential', placeholder: 'Legal First and Last Name', helperText: 'Preserved confidentially for background verification and safety records.' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, grid: 'half', placeholder: 'jordan@example.com', helperText: "Where we'll send orientation details and scheduling confirmations." },
      { id: 'phone', label: 'Phone Number (Optional)', type: 'tel', required: false, grid: 'half', placeholder: '(805) 555-0144' },
      { id: 'availability', label: 'General Availability', type: 'select', required: true, grid: 'half', defaultValue: 'Weekdays (Afternoons 1:00 – 5:00 PM)', options: [
        'Weekdays (Afternoons 1:00 – 5:00 PM)',
        'Friday Evenings (Youth Circles 5:00 – 8:00 PM)',
        'Weekends (Special Events & Festivals)',
        'Flexible / As Needed'
      ] },
      { id: 'areasOfInterest', label: 'Select Areas of Interest (Check all that apply)', type: 'checkbox_group', required: false, grid: 'full', options: [
        'Community Resource Center Hospitality & Reception',
        'Youth Programs (Rainbow Umbrella & Little Unicorns)',
        'Diversity SHINES Outreach & Safer-Sex Kit Packing',
        'Ventura County Pride Festival & Gala Event Logistics',
        'Social Media, Photography & Community Outreach',
        'Lending Library & Archive Curation'
      ] },
      { id: 'message', label: 'Why do you wish to volunteer with Diversity Collective?', type: 'textarea', required: false, grid: 'full', placeholder: 'Share a little about yourself, your hobbies, or any past volunteer experience...' }
    ]
  },
  training: {
    id: 'training',
    schemaVersion: 3,
    title: 'Request a P.R.I.D.E. Workshop',
    description: 'Equip your organization with actionable LGBTQ+ cultural competency grounded in Ventura County lived experience. Our training leads will review your inquiry and coordinate scheduling.',
    consentText: 'I consent to Diversity Collective Ventura County using my contact details to coordinate this educational workshop inquiry under our Privacy Policy.',
    submitLabel: 'Send Booking Inquiry',
    fields: [
      { id: 'organizationName', label: 'Organization or Agency Name', type: 'text', required: true, grid: 'half', placeholder: 'e.g. Ventura County Unified School District' },
      { id: 'contactName', label: 'Contact Person Name', type: 'text', required: true, grid: 'half', placeholder: 'e.g. Jordan Smith' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, grid: 'half', placeholder: 'jordan@example.org' },
      { id: 'phone', label: 'Phone Number (Optional)', type: 'tel', required: false, grid: 'half', placeholder: '(805) 555-0199' },
      { id: 'isSeekingDcvcApprovedStatus', label: 'Enroll Our Business in the DCVC Approved Partner Pathway ⭐', type: 'checkbox', required: false, grid: 'full', helperText: 'Check this box if your goal is to earn the official storefront window cling, framed certificate, and 3D verified badge in the Ventura County Business Directory.' },
      { id: 'courseSlug', label: 'Select Training Curriculum', type: 'select', required: true, grid: 'half', options: [
        'LGBTQ+ Cultural Competency Foundations',
        'Affirming Healthcare & Patient Care Standards',
        'Safe Schools & Youth Allyship',
        'DCVC Approved Affirming Business Accreditation'
      ] },
      { id: 'estimatedAttendees', label: 'Estimated Attendee Count', type: 'select', required: true, grid: 'half', options: [
        'Under 15 Participants',
        '15 – 30 Participants',
        '30 – 60 Participants',
        '60 – 100 Participants',
        '100+ Participants (Assembly or Conference)'
      ] },
      { id: 'preferredFormat', label: 'Preferred Delivery Format', type: 'select', required: true, grid: 'half', defaultValue: 'In-Person at Our Facility', options: [
        'In-Person at Our Facility',
        'In-Person at DCVC Center (Ventura)',
        'Interactive Live Virtual (Zoom)',
        'Hybrid Delivery'
      ] },
      { id: 'requestedDate', label: 'Target Date or Preferred Timeframe', type: 'text', required: false, grid: 'half', placeholder: 'e.g. November 2026 or Next Quarter' },
      { id: 'notes', label: 'Specific Organizational Goals or Questions', type: 'textarea', required: false, grid: 'full', placeholder: "Share details about your team's background, past training, or specific scenarios you wish to address..." }
    ]
  },
  directory_submit: {
    id: 'directory_submit',
    schemaVersion: 3,
    title: 'Submit Your Business',
    description: 'Join the official Ventura County LGBTQ+ Affirming Directory. All submissions are moderated by DCVC staff before public listing to ensure safe, inclusive spaces for our community.',
    consentText: 'Community Affirming Pledge: I confirm this business adheres to strict non-discrimination, respects pronouns, provides a safe environment for all gender identities and expressions, and consents to DCVC staff verification under our Privacy Policy.',
    submitLabel: 'Submit Business for Staff Approval',
    fields: [
      { id: 'businessName', label: 'Business or Enterprise Name', type: 'text', required: true, grid: 'full', placeholder: 'e.g. Coastal Sol Cafe' },
      { id: 'category', label: 'Primary Category', type: 'select', required: true, grid: 'half', defaultValue: 'Dining & Coffee', options: [
        'Dining & Coffee',
        'Health & Wellness',
        'Legal & Financial',
        'Retail & Gifts',
        'Fitness & Recreation',
        'Professional Services',
        'Arts & Creative',
        'Community Organization'
      ] },
      { id: 'city', label: 'Ventura County City', type: 'select', required: true, grid: 'half', defaultValue: 'Ventura', options: [
        'Ventura',
        'Oxnard',
        'Camarillo',
        'Ojai',
        'Thousand Oaks',
        'Simi Valley',
        'Moorpark',
        'Santa Paula',
        'Port Hueneme',
        'Fillmore'
      ] },
      { id: 'address', label: 'Physical Street Address', type: 'text', required: false, grid: 'full', placeholder: 'e.g. 123 Main St, Ventura, CA 93001' },
      { id: 'website', label: 'Website URL', type: 'url', required: false, grid: 'half', placeholder: 'https://example.com' },
      { id: 'phone', label: 'Public Phone Number', type: 'tel', required: false, grid: 'half', placeholder: '(805) 555-0100' },
      { id: 'description', label: 'Business Description & Community Mission', type: 'textarea', required: true, grid: 'full', placeholder: 'Tell patrons about your products, services, welcoming culture, and why your business is an affirming space...' },
      { id: 'isLGBTQOwned', label: '🌈 This is an LGBTQ+ Owned Business (51%+ queer / trans ownership)', type: 'checkbox', required: false, grid: 'full' },
      { id: 'ownerName', label: 'Your Name & Title', type: 'text', required: true, grid: 'half', badge: 'Private to DCVC Staff', placeholder: 'e.g. Maria Gonzalez, Owner' },
      { id: 'ownerEmail', label: 'Verification Email', type: 'email', required: true, grid: 'half', badge: 'Private to DCVC Staff', placeholder: 'maria@example.com' }
    ]
  },
  resource_submit: {
    id: 'resource_submit',
    schemaVersion: 3,
    title: 'Submit a Community Resource or Provider',
    description: "Help us expand Ventura County's network of vetted, LGBTQ+ affirming healthcare practitioners, social services, and grassroots programs.",
    consentText: 'I confirm that this organization/provider maintains an actively affirming, safe, and non-discriminatory environment for all LGBTQIA+ individuals.',
    submitLabel: 'Submit Affirming Resource for Review',
    fields: [
      { id: 'organizationName', label: 'Organization or Provider Name', type: 'text', required: true, grid: 'half', placeholder: 'e.g. Ventura Coast Wellness Center' },
      { id: 'category', label: 'Primary Category', type: 'select', required: true, grid: 'half', defaultValue: 'Healthcare & Mental Health', options: [
        'Healthcare & Mental Health',
        'Youth & Family Services',
        'Legal Aid & Advocacy',
        'Crisis & Emergency Housing',
        'Transgender & Non-Binary Care',
        'HIV/STI Testing & Prevention',
        'Seniors & Elder Care',
        'Education & GSA Support',
        'Faith & Affirming Communities',
        'Other Affirming Community Resource'
      ] },
      { id: 'email', label: 'Contact Email', type: 'email', required: true, grid: 'half', placeholder: 'contact@agency.org' },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: false, grid: 'half', placeholder: '(805) 555-0123' },
      { id: 'website', label: 'Website URL', type: 'url', required: false, grid: 'half', placeholder: 'https://example.org' },
      { id: 'city', label: 'City in Ventura County', type: 'select', required: false, grid: 'half', defaultValue: 'Ventura', options: [
        'Ventura',
        'Oxnard',
        'Camarillo',
        'Ojai',
        'Thousand Oaks',
        'Simi Valley',
        'Santa Paula',
        'Moorpark',
        'Port Hueneme',
        'Fillmore',
        'Countywide'
      ] },
      { id: 'description', label: 'Description of Services & LGBTQ+ Affirming Practices', type: 'textarea', required: true, grid: 'full', placeholder: 'Describe services offered, intake processes, languages spoken, insurance or low-cost options, and specific LGBTQ+ competency...' },
      { id: 'spanishAvailable', label: 'Spanish Language Services Available', type: 'checkbox', required: false, grid: 'half' },
      { id: 'freeOrSlidingScale', label: 'Free, Medi-Cal, or Sliding-Scale Accepted', type: 'checkbox', required: false, grid: 'half' }
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
    formSchemas: (() => {
      const merged = { ...base.formSchemas };
      const V1_DEFAULT_IDS = {
        contact: new Set(['name', 'email', 'phone', 'topic', 'message']),
        volunteer: new Set(['name', 'email', 'phone', 'role', 'availability']),
        training: new Set(['organization', 'contactName', 'email', 'headcount', 'notes']),
        directory_submit: new Set(['businessName', 'category', 'city', 'email', 'website']),
        resource_submit: new Set(['title', 'category', 'phone', 'website', 'description'])
      };

      if (raw.formSchemas && typeof raw.formSchemas === 'object') {
        for (const [formId, rawSchema] of Object.entries(raw.formSchemas)) {
          if (!rawSchema || typeof rawSchema !== 'object') continue;
          const baseSchema = base.formSchemas[formId] || {};
          const baseFields = Array.isArray(baseSchema.fields) ? baseSchema.fields : [];
          const rawFields = Array.isArray(rawSchema.fields) ? rawSchema.fields : [];
          const baseVersion = Number(baseSchema.schemaVersion || 1);
          const rawVersion = Number(rawSchema.schemaVersion || 1);

          // Automatically upgrade legacy v1 schemas to v2 full synchronized forms while preserving custom fields added by Admins
          if (baseVersion >= 2 && rawVersion < baseVersion) {
            const v1Ids = V1_DEFAULT_IDS[formId] || new Set();
            const baseFieldIds = new Set(baseFields.map((bf) => bf.id));
            const customFields = rawFields.filter((rf) => rf && rf.id && !v1Ids.has(rf.id) && !baseFieldIds.has(rf.id));
            merged[formId] = {
              ...baseSchema,
              schemaVersion: baseVersion,
              fields: [...baseFields, ...customFields]
            };
            continue;
          }

          const deletedSet = new Set(Array.isArray(rawSchema.deletedFieldIds) ? rawSchema.deletedFieldIds : []);
          const mergedFields = rawFields.length > 0
            ? rawFields.map((rf) => {
                const bf = baseFields.find((b) => b.id === rf.id);
                if ((rf.type === 'select' || rf.type === 'checkbox_group') && (!Array.isArray(rf.options) || rf.options.length === 0)) {
                  return { ...rf, options: bf?.options || [] };
                }
                return rf;
              })
            : (rawVersion >= 2 ? [] : baseFields);

          // Only backfill undeleted baseFields for unversioned schemas (such as hiv_screening/flex_space legacy data)
          if (rawVersion < 2) {
            for (const bf of baseFields) {
              if (!deletedSet.has(bf.id) && !mergedFields.some((mf) => mf.id === bf.id)) {
                mergedFields.push(bf);
              }
            }
          }

          merged[formId] = {
            ...baseSchema,
            ...rawSchema,
            ...(baseVersion >= 2 ? { schemaVersion: Math.max(baseVersion, rawVersion) } : {}),
            fields: mergedFields
          };
        }
      }
      return merged;
    })()
  };
}

let inMemoryFeatures = null;

export function getSiteFeatures() {
  if (typeof localStorage === 'undefined') {
    if (!inMemoryFeatures) inMemoryFeatures = cloneDefaults();
    return inMemoryFeatures;
  }
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
  inMemoryFeatures = next;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }
  notifyFeaturesUpdated(next);

  try {
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      publishAdminSitePatch({ siteFeatures: next }).catch(() => {});
    }
  } catch {
    // Non-blocking
  }

  return next;
}

export function subscribeToSiteFeatures(listener) {
  if (typeof window === 'undefined') return () => {};
  const onCustom = (e) => listener(e.detail ? mergeFeatures(e.detail) : getSiteFeatures());
  const onStorage = (e) => {
    if (e.key === FEATURES_STORAGE_KEY) listener(getSiteFeatures());
  };
  let ch = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = (e) => {
        if (e.data?.type === FEATURES_EVENT) listener(e.data.payload ? mergeFeatures(e.data.payload) : getSiteFeatures());
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

export { mergeFeatures as normalizeSiteFeatures };

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

export function bookTimeSlot(kind, { date, slot, name, contact, email, phone, purpose, service, notes, validateDate = false }) {
  if (!date || !slot) {
    return { ok: false, error: 'Please choose both a date and an available time slot.' };
  }
  const features = getSiteFeatures();

  if (kind === 'flex' && features.flexSpace?.manualStatus === 'closed') {
    return { ok: false, error: 'Bookings are currently unavailable because Flex Space is closed.' };
  }

  // Strict date validation by service kind when enabled
  if (validateDate) {
    if (kind === 'hiv') {
      const check = isDateAllowedForHiv(date, features.hivScreening);
      if (!check.allowed) {
        return { ok: false, error: check.reason };
      }
    } else if (kind === 'flex') {
      const check = isDateAllowedForFlex(date, features.flexSpace);
      if (!check.allowed) {
        return { ok: false, error: check.reason };
      }
    }
  }

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

