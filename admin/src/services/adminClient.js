/**
 * DCVC Admin Dashboard — Centralized Admin Client
 * Communicates with Cloudflare Worker Backend (/api/admin/*)
 * Includes offline development fallback for complete zero-credential local testing.
 */

const API_BASE = import.meta.env?.VITE_API_URL || '/api';

export function getStoredToken() {
  return localStorage.getItem('dcvc_admin_token');
}

export function setStoredToken(token) {
  if (token) localStorage.setItem('dcvc_admin_token', token);
  else localStorage.removeItem('dcvc_admin_token');
}

export function getStoredUser() {
  const u = localStorage.getItem('dcvc_admin_user');
  return u ? JSON.parse(u) : null;
}

export function setStoredUser(user) {
  if (user) localStorage.setItem('dcvc_admin_user', JSON.stringify(user));
  else localStorage.removeItem('dcvc_admin_user');
}

async function fetchWithAuth(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    setStoredToken(null);
    setStoredUser(null);
    window.location.reload();
    throw new Error('Session expired. Please log in again.');
  }

  return res;
}

// ----------------------------------------------------------------------------
// 1. Authentication
// ----------------------------------------------------------------------------
export async function adminLogin(email, password, mfaCode = '') {
  try {
    const res = await fetch(`${API_BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mfaCode })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setStoredToken(data.token);
      setStoredUser(data.user);
      return { success: true, user: data.user, token: data.token };
    }
    return { success: false, error: data.error || 'Authentication failed' };
  } catch {
    // Development offline fallback
    if (email === 'admin@diversitycollective.org' && password === 'DCVC-Admin-2026!') {
      const mockUser = {
        id: 'adm-dev-1',
        email: 'admin@diversitycollective.org',
        name: 'Tess Allen (Executive Director)',
        role: 'admin'
      };
      const mockToken = 'mock_dev_admin_token_' + Date.now();
      setStoredToken(mockToken);
      setStoredUser(mockUser);
      return { success: true, user: mockUser, token: mockToken };
    }
    return { success: false, error: 'Network error or invalid credentials.' };
  }
}

// ----------------------------------------------------------------------------
// 2. Directory Moderation
// ----------------------------------------------------------------------------
export async function getDirectorySubmissions(status = 'pending') {
  try {
    const res = await fetchWithAuth(`/admin/directory?status=${status}`);
    const data = await res.json();
    return data.businesses || [];
  } catch (err) {
    console.warn('Using local fallback for directory submissions:', err);
    const stored = localStorage.getItem('dcvc_admin_mock_biz');
    let list = stored ? JSON.parse(stored) : [
      {
        id: 'biz-1',
        slug: 'harbor-books-ventura',
        name: 'Harbor Books & Community Corner',
        category: 'Retail & Gifts',
        city: 'Ventura',
        status: 'pending',
        owner_name: 'Jordan Rivera',
        owner_email: 'jordan@harborbooks.example',
        phone: '(805) 555-0142',
        address: '2471 Portola Road, Suite 102',
        website: 'https://harborbooks.example',
        description: 'Affirming independent bookstore featuring queer literature, poetry open mics, and free community reading space.',
        affirming_pledge_signed_at: '2026-03-01T12:00:00Z',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'biz-2',
        slug: 'coastal-botanicals-oxnard',
        name: 'Coastal Botanicals & Wellness',
        category: 'Healthcare & Wellness',
        city: 'Oxnard',
        status: 'pending',
        owner_name: 'Dr. Elena Diaz',
        owner_email: 'elena@coastalbotanicals.example',
        phone: '(805) 555-0189',
        address: '500 Esplanade Dr',
        website: 'https://coastalbotanicals.example',
        description: 'Inclusive holistic health collective providing sliding-scale acupuncture, herbalism, and trauma-informed bodywork.',
        affirming_pledge_signed_at: '2026-03-02T15:30:00Z',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'biz-3',
        slug: 'channel-islands-coffee-roasters',
        name: 'Channel Islands Coffee Roasters',
        category: 'Restaurants, Cafes & Food',
        city: 'Ventura',
        status: 'approved',
        owner_name: 'Sam Chen',
        owner_email: 'sam@cicoffee.example',
        phone: '(805) 555-0211',
        address: '128 Main St',
        website: 'https://cicoffee.example',
        description: 'Locally-roasted ethically sourced coffee, queer safe space cafe, hosting monthly LGBTQ+ youth open mic.',
        affirming_pledge_signed_at: '2026-02-15T09:00:00Z',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString()
      }
    ];

    if (status !== 'all') {
      list = list.filter(b => b.status === status);
    }
    return list;
  }
}

export async function moderateBusinessListing(businessId, newStatus, notes = '') {
  try {
    const res = await fetchWithAuth(`/admin/directory/${businessId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ status: newStatus, notes })
    });
    return await res.json();
  } catch {
    // Local fallback
    const stored = localStorage.getItem('dcvc_admin_mock_biz');
    let list = stored ? JSON.parse(stored) : [];
    list = list.map(b => b.id === businessId ? { ...b, status: newStatus, admin_notes: notes } : b);
    localStorage.setItem('dcvc_admin_mock_biz', JSON.stringify(list));
    recordLocalAuditLog('moderate_business_' + newStatus, 'business', businessId);
    return { success: true, message: `Listing marked as ${newStatus}.` };
  }
}

export async function editBusinessListing(businessId, updates) {
  try {
    const res = await fetchWithAuth(`/admin/directory/${businessId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return await res.json();
  } catch {
    const stored = localStorage.getItem('dcvc_admin_mock_biz');
    let list = stored ? JSON.parse(stored) : [];
    list = list.map(b => b.id === businessId ? { ...b, ...updates } : b);
    localStorage.setItem('dcvc_admin_mock_biz', JSON.stringify(list));
    recordLocalAuditLog('edit_business', 'business', businessId);
    return { success: true, message: 'Business listing updated.' };
  }
}

export async function deleteBusinessListing(businessId) {
  try {
    const res = await fetchWithAuth(`/admin/directory/${businessId}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch {
    const stored = localStorage.getItem('dcvc_admin_mock_biz');
    let list = stored ? JSON.parse(stored) : [];
    list = list.filter(b => b.id !== businessId);
    localStorage.setItem('dcvc_admin_mock_biz', JSON.stringify(list));
    recordLocalAuditLog('delete_business', 'business', businessId);
    return { success: true, message: 'Business listing removed.' };
  }
}

export async function getBusinessCorrections() {
  try {
    const res = await fetchWithAuth(`/admin/corrections`);
    const data = await res.json();
    return data.corrections || [];
  } catch {
    return [
      {
        id: 'corr-1',
        business_id: 'biz-1',
        business_name: 'Harbor Books & Community Corner',
        request_type: 'update_hours',
        details: 'Store hours have shifted to Tue–Sat 10 AM – 7 PM, Sun 11 AM – 5 PM.',
        requester_name: 'Jordan Rivera',
        requester_email: 'jordan@harborbooks.example',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];
  }
}

export async function resolveBusinessCorrection(correctionId, status = 'resolved') {
  try {
    const res = await fetchWithAuth(`/admin/corrections/${correctionId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch {
    recordLocalAuditLog('resolve_correction', 'correction', correctionId);
    return { success: true, message: `Correction set to ${status}.` };
  }
}

// ----------------------------------------------------------------------------
// 3. Operational Inquiries
// ----------------------------------------------------------------------------
export async function getInquiries(type = 'contact') {
  try {
    const res = await fetchWithAuth(`/admin/inquiries?type=${type}`);
    const data = await res.json();
    return data.inquiries || [];
  } catch {
    const mockData = {
      contact: [
        {
          id: 'inq-c-1',
          name: 'Morgan Blake',
          email: 'morgan.b@example.org',
          phone: '(805) 555-8821',
          subject: 'Question on youth peer support schedules',
          message: 'Hi DCVC, does Rainbow Umbrella meet every Friday in Ventura? Are parents welcome to attend with youth?',
          status: 'unread',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: 'inq-c-2',
          name: 'Casey Miller',
          email: 'casey.m@example.org',
          phone: '(805) 555-9912',
          subject: 'Affirming business directory badge verification',
          message: 'We submitted our cafe last week. We would love to display the DCVC Affirming Business sticker in our window.',
          status: 'in_progress',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ],
      volunteer: [
        {
          id: 'inq-v-1',
          full_name: 'Alex Harper',
          email: 'alex.h@example.org',
          phone: '(805) 555-3341',
          city: 'Oxnard',
          roles_of_interest: '["Pride Festival", "Youth Peer Circle Support", "Library Lending"]',
          availability: 'Weekends and Friday evenings',
          skills: 'Event coordination, CPR certified, bilingual in English and Spanish',
          status: 'unread',
          created_at: new Date(Date.now() - 3600000 * 8).toISOString()
        }
      ],
      training: [
        {
          id: 'inq-t-1',
          organization_name: 'Ventura Community Healthcare Clinic',
          contact_name: 'Dr. Rebecca Martinez',
          email: 'rmartinez@vchc.example.org',
          phone: '(805) 555-7762',
          course_title: 'LGBTQ+ Clinical Competency for Medical Providers',
          estimated_attendees: '45 clinical staff members',
          status: 'unread',
          created_at: new Date(Date.now() - 3600000 * 14).toISOString()
        }
      ],
      accessibility: [
        {
          id: 'inq-a-1',
          name: 'Taylor Reed',
          email: 'taylor.r@example.org',
          barrier_description: 'Screen reader announced the festival flyer image as "botanical-flyer.jpg" without descriptive alt text on the news page.',
          page_url: '/news/botanical-diversity-gala',
          status: 'unread',
          created_at: new Date(Date.now() - 3600000 * 30).toISOString()
        }
      ]
    };
    return mockData[type] || [];
  }
}

export async function updateInquiryStatus(type, inquiryId, status) {
  try {
    const res = await fetchWithAuth(`/admin/inquiries/${type}/${inquiryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch {
    recordLocalAuditLog(`update_${type}_status_${status}`, type, inquiryId);
    return { success: true, message: `Status updated to ${status}.` };
  }
}

// ----------------------------------------------------------------------------
// 4. Staff & RBAC Team Management
// ----------------------------------------------------------------------------
export async function getStaffUsers() {
  try {
    const res = await fetchWithAuth(`/admin/users`);
    const data = await res.json();
    return data.users || [];
  } catch {
    const stored = localStorage.getItem('dcvc_admin_staff_users');
    if (stored) return JSON.parse(stored);
    const defaults = [
      { id: 'usr-1', name: 'Tess Allen', email: 'tess@diversitycollective.org', role: 'admin', title: 'Executive Director', active: true, createdAt: '2024-01-15' },
      { id: 'usr-2', name: 'Marcus Vance', email: 'marcus@diversitycollective.org', role: 'admin', title: 'Operations Director', active: true, createdAt: '2024-03-20' },
      { id: 'usr-3', name: 'Sofia Rodriguez', email: 'sofia@diversitycollective.org', role: 'approver', title: 'Programs & Sanctuary Lead', active: true, createdAt: '2024-08-10' },
      { id: 'usr-4', name: 'Jordan Lee', email: 'jordan@diversitycollective.org', role: 'editor', title: 'Community Outreach Coordinator', active: true, createdAt: '2025-01-05' },
      { id: 'usr-5', name: 'Elena Diaz', email: 'elena.board@diversitycollective.org', role: 'read_only', title: 'Board of Directors Audit Liaison', active: true, createdAt: '2025-06-12' }
    ];
    localStorage.setItem('dcvc_admin_staff_users', JSON.stringify(defaults));
    return defaults;
  }
}

export async function createStaffUser(userData) {
  try {
    const res = await fetchWithAuth(`/admin/users`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return await res.json();
  } catch {
    const stored = await getStaffUsers();
    const newUser = {
      id: 'usr-' + Date.now(),
      name: userData.name,
      email: userData.email,
      role: userData.role || 'editor',
      title: userData.title || 'Staff Member',
      active: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newUser, ...stored];
    localStorage.setItem('dcvc_admin_staff_users', JSON.stringify(updated));
    recordLocalAuditLog('create_staff_user', 'user', newUser.id);
    return { success: true, user: newUser };
  }
}

export async function updateStaffRole(userId, newRole) {
  try {
    const res = await fetchWithAuth(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole })
    });
    return await res.json();
  } catch {
    const stored = await getStaffUsers();
    const updated = stored.map(u => u.id === userId ? { ...u, role: newRole } : u);
    localStorage.setItem('dcvc_admin_staff_users', JSON.stringify(updated));
    recordLocalAuditLog('update_staff_role_' + newRole, 'user', userId);
    return { success: true, message: `Role updated to ${newRole}.` };
  }
}

export async function deleteStaffUser(userId) {
  try {
    const res = await fetchWithAuth(`/admin/users/${userId}`, { method: 'DELETE' });
    return await res.json();
  } catch {
    const stored = await getStaffUsers();
    const updated = stored.filter(u => u.id !== userId);
    localStorage.setItem('dcvc_admin_staff_users', JSON.stringify(updated));
    recordLocalAuditLog('revoke_staff_user', 'user', userId);
    return { success: true, message: 'User access revoked.' };
  }
}

// ----------------------------------------------------------------------------
// 5. Drag & Drop Page & Block Design Editor
// ----------------------------------------------------------------------------
export const DEFAULT_PAGE_BLOCKS = [
  {
    id: 'block-status',
    type: 'status_pill',
    title: 'Live Sanctuary Open Status Pill',
    enabled: true,
    props: {
      headline: 'Sanctuary Open Today',
      schedule: 'Mon–Fri 1:00 PM – 5:00 PM',
      serviceTag: 'Free HIV/STI Screenings',
      linkUrl: '/programs/community-resource-center'
    }
  },
  {
    id: 'block-hero',
    type: 'hero_banner',
    title: 'Flagship Hero Declaration',
    enabled: true,
    props: {
      eyebrow: 'ESTABLISHED 2014 • VENTURA COUNTY 501(C)(3) NONPROFIT',
      titleLine1: 'You Are',
      titleAccentWord: 'Always',
      titleLine2: 'Welcome Here.',
      description: "Diversity Collective is Ventura County's premier cultural sanctuary and clinical wellness home — delivering free rapid health testing, youth peer programs, mutual aid, and intersectional advocacy across all 10 county cities.",
      primaryCtaText: 'Explore Free Programs',
      primaryCtaUrl: '/programs',
      secondaryCtaText: 'Visit Sanctuary',
      secondaryCtaUrl: '/contact',
      phoneText: '(805) 644-LGBT (5428)',
      phoneUrl: 'tel:8056445428',
      photoUrl: '/images/community-gathering.jpg',
      locationBadge: '2471 Portola Road, Suite 100, Ventura'
    }
  },
  {
    id: 'block-wave',
    type: 'wave_ribbon',
    title: 'Full-Bleed Continuous Wave River',
    enabled: true,
    props: {
      gradientTheme: 'electric_pride',
      hasWhiteStroke: true,
      hasCrestHighlight: true,
      motionSpeed: 'standard'
    }
  },
  {
    id: 'block-pillars',
    type: 'four_pillars',
    title: '4-Pillars Accent Strip',
    enabled: true,
    props: {
      pillars: [
        { id: 'people', label: 'PEOPLE', icon: 'Users', url: '/community' },
        { id: 'safety', label: 'SAFETY', icon: 'Shield', url: '/programs/community-resource-center' },
        { id: 'wellness', label: 'WELLNESS', icon: 'Lotus', url: '/programs/diversity-shines' },
        { id: 'opportunity', label: 'OPPORTUNITY', icon: 'Heart', url: '/donate' }
      ]
    }
  },
  {
    id: 'block-stats',
    type: 'impact_stats',
    title: 'Impact Milestones & Counters',
    enabled: true,
    props: {
      stat1Number: '10+',
      stat1Label: 'Years of Community Service',
      stat2Number: '5,000+',
      stat2Label: 'Free Health Screenings',
      stat3Number: '1,200+',
      stat3Label: 'LGBTQ+ Youth Empowered'
    }
  },
  {
    id: 'block-giving',
    type: 'zeffy_giving',
    title: 'Zero-Fee Community Giving Callout',
    enabled: true,
    props: {
      headline: 'Fueling Dignity & Free Healthcare in Ventura County',
      description: '100% of your gift supports confidential rapid HIV/STI testing, peer youth circles, and cultural safe harbors with 0% platform fees via Zeffy.',
      ctaText: 'Support Our Community'
    }
  }
];

export function getSavedPageLayout() {
  const stored = localStorage.getItem('dcvc_admin_custom_layout');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PAGE_BLOCKS;
    }
  }
  return DEFAULT_PAGE_BLOCKS;
}

export function savePageLayout(blocks) {
  localStorage.setItem('dcvc_admin_custom_layout', JSON.stringify(blocks));
  recordLocalAuditLog('save_drag_and_drop_layout', 'layout', 'homepage');
  return { success: true, timestamp: new Date().toISOString() };
}

// ----------------------------------------------------------------------------
// 6. System Health & Diagnostics
// ----------------------------------------------------------------------------
export async function getSystemHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    return data;
  } catch {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      integrations: {
        databaseConfigured: true,
        resendConfigured: true,
        turnstileConfigured: true,
        zeffyWebhookConfigured: true,
        workersAiConfigured: true,
        chatbotEnabled: true
      },
      appreciationTiers: {
        communityAllyMin: 1,
        prideAdvocateMin: 50,
        rainbowChampionMin: 150,
        visionaryBenefactorMin: 500
      }
    };
  }
}

// ----------------------------------------------------------------------------
// 7. Audit Trail Helper
// ----------------------------------------------------------------------------
export async function getAuditLogs() {
  try {
    const res = await fetchWithAuth(`/admin/audit-logs`);
    const data = await res.json();
    return data.logs || [];
  } catch {
    const stored = localStorage.getItem('dcvc_admin_local_audit');
    if (stored) return JSON.parse(stored);
    return [
      { id: 'log-1', action: 'system_boot', user_email: 'admin@diversitycollective.org', target_type: 'system', target_id: 'prod', created_at: '2026-03-01 10:00:00' },
      { id: 'log-2', action: 'moderate_business_approved', user_email: 'tess@diversitycollective.org', target_type: 'business', target_id: 'biz-3', created_at: '2026-03-02 14:15:22' },
      { id: 'log-3', action: 'update_hero_theme_pride', user_email: 'marcus@diversitycollective.org', target_type: 'theme', target_id: 'fest-pride', created_at: '2026-03-03 09:30:11' }
    ];
  }
}

function recordLocalAuditLog(action, targetType, targetId) {
  const user = getStoredUser();
  const existing = localStorage.getItem('dcvc_admin_local_audit');
  const logs = existing ? JSON.parse(existing) : [];
  const newLog = {
    id: 'log-' + Date.now(),
    action,
    user_email: user?.email || 'admin@diversitycollective.org',
    target_type: targetType,
    target_id: targetId,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  logs.unshift(newLog);
  localStorage.setItem('dcvc_admin_local_audit', JSON.stringify(logs.slice(0, 100)));
}

export function getExportUrl(type) {
  const token = getStoredToken();
  return `${API_BASE}/admin/export/${type}?token=${token}`;
}

// ----------------------------------------------------------------------------
// 8. Hero Theme & Seasonal Festival Dispatcher
// ----------------------------------------------------------------------------
export const HERO_THEMES = [
  {
    id: 'default',
    number: '01',
    name: 'Classic DCVC Flagship (Default)',
    category: 'layout',
    badge: 'Original Default Flagship',
    badgeColor: 'bg-purple-100 text-[#5A1E65] border-purple-300',
    description: 'The beloved original DCVC flagship layout featuring the interactive 3D Card Spotlight, physical sanctuary location badge, and "What Brings You In Today?" smart pathfinder.',
    palette: ['#5A1E65', '#B45309', '#0F172A', '#FAF5FF', '#38BDF8'],
    bestFor: 'Everyday comprehensive sanctuary presence & maximum feature completeness'
  },
  {
    id: 'aurora',
    number: '02',
    name: 'Immersive Aurora Billboard',
    category: 'layout',
    badge: 'Warm Editorial Luxury',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Warm alabaster cream canvas (#FAF8F5) with soft sweeping aurora ribbons, Fraunces humanist serif, and authentic community photography.',
    palette: ['#FAF8F5', '#5A1E65', '#E11D48', '#F59E0B', '#06B6D4'],
    bestFor: 'High-fashion editorial elegance and organic community warmth'
  },
  {
    id: 'portal',
    number: '03',
    name: 'Sanctuary Navigator Portal',
    category: 'layout',
    badge: 'Civic Service Finder',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Immediate community utility with an interactive 4-card service triage: Free Rapid Testing, Youth Circles, Drop-In Library & Volunteer Aid.',
    palette: ['#0D9488', '#5A1E65', '#F59E0B', '#F43F5E', '#FFFFFF'],
    bestFor: 'Direct service navigation with zero wasted space'
  },
  {
    id: 'bento',
    number: '04',
    name: 'Bento Editorial Grid',
    category: 'layout',
    badge: 'Modern Modular Tiles',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Apple/Linear-inspired modular bento cards organizing identity, photography, live hours, crisis lines, and four pillars into high-tech blocks.',
    palette: ['#4F46E5', '#10B981', '#5A1E65', '#F59E0B', '#FAF8F5'],
    bestFor: '100% space utilization and modern tech-forward visual rhythm'
  },
  {
    id: 'mosaic',
    number: '05',
    name: 'Community Story Mosaic',
    category: 'layout',
    badge: 'Authentic Human Warmth',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Centered welcoming statement paired with a 3-photo authentic community mosaic celebrating Pride crowds, volunteers, and the Portola Rd center.',
    palette: ['#FAF7F2', '#E11D48', '#5A1E65', '#EA580C', '#0284C7'],
    bestFor: 'Grassroots human connection and real community faces'
  },
  {
    id: 'architectural',
    number: '06',
    name: 'Modern Architectural Split',
    category: 'layout',
    badge: 'Prestige Magazine Layout',
    badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'High-contrast architectural split with razor-sharp structural dividing rules, high-fashion typography, and full-height visual framing.',
    palette: ['#0F172A', '#5A1E65', '#FFFFFF', '#64748B', '#F1F5F9'],
    bestFor: 'Authoritative civic leadership and cultural prestige'
  },
  {
    id: 'sunset',
    number: '07',
    name: 'Prismatic Sunset',
    category: 'layout',
    badge: 'High-Energy Queer Joy',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    description: 'Full-bleed glowing gradient canvas in royal purple, magenta, and sunburst gold, featuring tilted Polaroid-style authentic photo cards.',
    palette: ['#2E0854', '#C2185B', '#F57C00', '#FACC15', '#FFFFFF'],
    bestFor: 'Celebratory festival energy, youth engagement, and vibrant spirit'
  },
  {
    id: 'fest-pride',
    number: '12',
    name: 'Pride Month Festival (June)',
    category: 'festival',
    badge: 'June Pride Month',
    badgeColor: 'bg-gradient-to-r from-red-100 via-amber-100 to-purple-100 text-purple-950 border-purple-300',
    eventDates: 'All of June (Annual Highlight)',
    headline: 'Ventura County Pride — All 10 Cities, One Family',
    description: 'Full Progress Pride spectrum celebration with animated confetti bursts, parade schedules, Pride festival booth volunteering, and sponsor highlights.',
    palette: ['#EF4444', '#F97316', '#FBBF24', '#10B981', '#06B6D4', '#8B5CF6', '#FFFFFF', '#F472B6', '#38BDF8'],
    bestFor: 'June Pride celebrations and major festival announcements'
  },
  {
    id: 'fest-tvd',
    number: '13',
    name: 'Transgender Visibility & Care',
    category: 'festival',
    badge: 'March 31 & Nov 13-20',
    badgeColor: 'bg-cyan-100 text-cyan-950 border-cyan-300',
    eventDates: 'TDOV (March 31) · Trans Awareness Week (Nov 13–20)',
    headline: 'Visibility. Dignity. Unconditional Safe Harbor.',
    description: 'Trans Pride palette (soft cyan, pastel pink, white) highlighting free gender-affirming resources, clinical healthcare navigation, name-change clinics, and trans youth peer circles.',
    palette: ['#38BDF8', '#F472B6', '#FFFFFF', '#0F172A', '#5A1E65'],
    bestFor: 'TDOV, Trans Awareness Week, and TDOR community solidarity'
  },
  {
    id: 'fest-spirit',
    number: '14',
    name: 'Spirit Day: Go Purple for Youth',
    category: 'festival',
    badge: 'Third Thursday in October',
    badgeColor: 'bg-purple-100 text-purple-950 border-purple-300',
    eventDates: 'Third Thursday of October (Annual Anti-Bullying)',
    headline: 'Go Purple — Standing Resolutely With LGBTQ+ Youth',
    description: 'Luminous royal amethyst purple theme dedicated to anti-bullying solidarity, youth peer circles through Rainbow Umbrella, and 24/7 crisis support.',
    palette: ['#5A1E65', '#7E22CE', '#A855F7', '#FAF5FF', '#FDE047'],
    bestFor: 'Spirit Day and annual anti-bullying awareness month'
  },
  {
    id: 'fest-coming-out',
    number: '15',
    name: 'National Coming Out Day',
    category: 'festival',
    badge: 'October 11',
    badgeColor: 'bg-rose-100 text-rose-950 border-rose-300',
    eventDates: 'October 11 (Annual Celebration)',
    headline: 'Living Openly. Loved Fiercely. You Are Safe Here.',
    description: 'Radiant, brave celebration of authenticity and pride. Direct access to affirming community circles, family guidance, and safe harbor in Ventura County.',
    palette: ['#E11D48', '#EA580C', '#F59E0B', '#10B981', '#06B6D4'],
    bestFor: 'National Coming Out Day and autumn community milestones'
  },
  {
    id: 'fest-world-aids',
    number: '16',
    name: 'World AIDS Day: Zero Stigma',
    category: 'festival',
    badge: 'December 1',
    badgeColor: 'bg-red-100 text-red-950 border-red-300',
    eventDates: 'December 1 (Annual Global Day)',
    headline: 'Remember. Advocate. Free Rapid Screenings for All.',
    description: 'Red ribbon solidarity honoring lives lost and celebrating scientific advancement. Direct walk-in rapid HIV/STI testing appointments through Diversity SHINES with zero stigma.',
    palette: ['#DC2626', '#991B1B', '#0F172A', '#FEE2E2', '#FFFFFF'],
    bestFor: 'World AIDS Day and clinical community health outreach'
  },
  {
    id: 'fest-lesbian',
    number: '17',
    name: 'Lesbian Visibility & Leadership',
    category: 'festival',
    badge: 'Late April',
    badgeColor: 'bg-amber-100 text-amber-950 border-amber-300',
    eventDates: 'April 26 (Annual Visibility Day) · Late April Week',
    headline: 'Celebrating Lesbian Leadership, Heritage & Visibility',
    description: 'Sunset orange, peach, white, and magenta pride spectrum honoring lesbian leadership, grassroots organizers, women’s peer circles, and historical archives in Ventura.',
    palette: ['#D9480F', '#F76707', '#FFA94D', '#FFFFFF', '#D6336C'],
    bestFor: 'Lesbian Visibility Week and women’s leadership events'
  },
  {
    id: 'fest-bi',
    number: '18',
    name: 'Bisexual Awareness Week',
    category: 'festival',
    badge: 'September 16–23',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-300',
    eventDates: 'September 16–23 (Bi+ Awareness Week)',
    headline: 'Visible, Valid, Empowered: Celebrating Bi+ Community',
    description: 'Magenta, lavender, and royal blue pride gradient dedicated to bisexuality/pansexuality awareness, eliminating erasure, and affirming mental health circles.',
    palette: ['#D946EF', '#8B5CF6', '#3B82F6', '#FAF5FF', '#0F172A'],
    bestFor: 'Bi+ Visibility Week and autumn mental health awareness'
  },
  {
    id: 'fest-prom',
    number: '19',
    name: 'Youth Pride Prom & Gala Season',
    category: 'festival',
    badge: 'Spring Season',
    badgeColor: 'bg-yellow-100 text-yellow-950 border-yellow-300',
    eventDates: 'Spring Season (Annual Youth Pride Prom & Gala)',
    headline: 'An Unforgettable Night of Authentic Queer Joy',
    description: 'Glamorous starlight, gold, and royal violet gala aesthetic promoting free prom tickets for local youth (13–23), community gala seating, and attire donations.',
    palette: ['#F59E0B', '#7C3AED', '#4C1D95', '#FEF3C7', '#FFFFFF'],
    bestFor: 'Annual Youth Pride Prom, community galas, and spring fundraising'
  }
];

export function getActiveHeroTheme() {
  if (typeof window === 'undefined') return 'default';
  try {
    const saved = localStorage.getItem('dcvc_active_hero_theme');
    if (saved && HERO_THEMES.some(t => t.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'default';
}

export function setActiveHeroTheme(themeId) {
  if (typeof window === 'undefined') return;
  try {
    const theme = HERO_THEMES.find(t => t.id === themeId);
    if (theme) {
      localStorage.setItem('dcvc_active_hero_theme', themeId);
      recordLocalAuditLog('activate_hero_theme_' + themeId, 'theme', themeId);
      window.dispatchEvent(new CustomEvent('dcvc-hero-theme-changed', { 
        detail: { themeId, theme } 
      }));
    }
  } catch (err) {
    console.error('Error saving hero theme:', err);
  }
}
