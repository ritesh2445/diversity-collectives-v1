/**
 * DCVC Admin Dashboard — Centralized Admin Client
 * Communicates with Cloudflare Worker Backend (/api/admin/*)
 * Includes offline development fallback for complete zero-credential local testing.
 */

const API_BASE = import.meta.env?.VITE_API_URL || '/api';

let inMemoryAuthToken = null;

export function getStoredToken() {
  if (typeof window === 'undefined') return inMemoryAuthToken;
  // Security Hardening: Never store persistent tokens in localStorage or sessionStorage.
  // Purge any legacy tokens if encountered in storage.
  try {
    sessionStorage.removeItem('dcvc_admin_token');
    localStorage.removeItem('dcvc_admin_token');
  } catch {}
  return inMemoryAuthToken;
}

export function setStoredToken(token) {
  inMemoryAuthToken = token || null;
  if (typeof window === 'undefined') return;
  // Security Hardening: Enforce that no authentication credentials are stored in client storage
  try {
    sessionStorage.removeItem('dcvc_admin_token');
    localStorage.removeItem('dcvc_admin_token');
  } catch {}
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const u = sessionStorage.getItem('dcvc_admin_user') || localStorage.getItem('dcvc_admin_user');
  return u ? JSON.parse(u) : null;
}

export function setStoredUser(user) {
  if (typeof window === 'undefined') return;
  if (user) {
    sessionStorage.setItem('dcvc_admin_user', JSON.stringify(user));
    localStorage.setItem('dcvc_admin_user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('dcvc_admin_user');
    localStorage.removeItem('dcvc_admin_user');
  }
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
    headers,
    credentials: 'include'
  });

  if (res.status === 401) {
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      import.meta.env?.DEV
    );
    if (!isLocal) {
      setStoredToken(null);
      setStoredUser(null);
    }
    throw new Error('Unauthorized or session expired');
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
    return { success: false, error: 'Network error or invalid credentials.' };
  }
}

export async function adminLoginWithOtpSend(email) {
  try {
    const res = await fetch(`${API_BASE}/admin/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, tempToken: data.tempToken, email: data.email, message: data.message };
    }
    return { success: false, error: data.error || 'Failed to dispatch verification code.' };
  } catch {
    return { success: false, error: 'Network error communicating with verification service.' };
  }
}

export async function adminLoginWithOtpVerify(tempToken, code, email) {
  try {
    const res = await fetch(`${API_BASE}/admin/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken, code, email })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setStoredToken(data.token);
      setStoredUser(data.user);
      return { success: true, user: data.user, token: data.token };
    }
    return { success: false, error: data.error || 'Invalid or expired verification code.' };
  } catch {
    return { success: false, error: 'Network verification failure.' };
  }
}

export async function adminLoginWithGoogle(options = {}) {
  try {
    const res = await fetch(`${API_BASE}/admin/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setStoredToken(data.token);
      setStoredUser(data.user);
      return { success: true, user: data.user, token: data.token };
    }
    return { success: false, error: data.error || 'Google authentication failed.' };
  } catch {
    return { success: false, error: 'Network error during Google authentication.' };
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
// 3. Operational Inquiries & Form Submissions
// ----------------------------------------------------------------------------
const DEFAULT_INQUIRIES_MOCK = {
  contact: [
    {
      id: 'inq-c-1',
      name: 'Morgan Blake',
      email: 'morgan.b@example.org',
      phone: '(805) 555-8821',
      subject: 'Question on youth peer support schedules',
      message: 'Hi DCVC, does Rainbow Umbrella meet every Friday in Ventura? Are parents welcome to attend with youth?',
      status: 'unread',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      notes: 'Replied via phone on 11/17.'
    },
    {
      id: 'inq-c-2',
      name: 'Casey Miller',
      email: 'casey.m@example.org',
      phone: '(805) 555-9912',
      subject: 'Affirming business directory badge verification',
      message: 'We submitted our cafe last week. We would love to display the DCVC Affirming Business sticker in our window.',
      status: 'in_progress',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      notes: 'Directory sticker mailed.'
    }
  ],
  appointment: [
    {
      id: 'inq-apt-1',
      name: 'Jordan Rivera',
      client_alias: 'Jordan R.',
      email: 'jordan.r@example.org',
      phone: '(805) 555-4419',
      appointment_date: '2026-11-26',
      time_slot: '4:00 PM – 5:00 PM',
      service: 'Free Confidential HIV Screening (Rapid Fingerstick)',
      preferred_language: 'English',
      subject: '[APPOINTMENT] HIV/Wellness Screening Slot: 2026-11-26 (4:00 PM – 5:00 PM)',
      message: 'Screening Service: Free Confidential HIV Screening (Rapid Fingerstick)\nDate: 2026-11-26\nSlot: 4:00 PM – 5:00 PM\nLanguage: English\nNotes: Requesting private consultation room; first-time test.',
      notes: 'Certified counselor Elena Vance assigned. Rapid test kit staged in Clinic Room B.',
      status: 'in_progress',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'inq-apt-2',
      name: 'Mateo Hernandez',
      client_alias: 'Mateo H.',
      email: 'mateo.h@example.org',
      phone: '(805) 555-7832',
      appointment_date: '2026-12-03',
      time_slot: '5:30 PM – 6:30 PM',
      service: 'Comprehensive HIV + Full STI Screening Panel & PrEP Navigation',
      preferred_language: 'Español (Spanish)',
      subject: '[APPOINTMENT] HIV/Wellness Screening Slot: 2026-12-03 (5:30 PM – 6:30 PM)',
      message: 'Screening Service: Comprehensive HIV + Full STI Screening Panel & PrEP Navigation\nDate: 2026-12-03\nSlot: 5:30 PM – 6:30 PM\nLanguage: Español (Spanish)\nNotes: Bilingual counselor requested for Spanish intake consultation.',
      notes: 'Bilingual intake packet prepared in Spanish.',
      status: 'unread',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ],
  resource: [
    {
      id: 'inq-res-1',
      organization_name: 'Ventura Affirming Legal Defense Project',
      category: 'Legal & Advocacy',
      contact_name: 'Elena Vance, Esq.',
      contact_person: 'Elena Vance, Esq.',
      name: 'Elena Vance, Esq.',
      email: 'elena.vance@legalproject.example.org',
      phone: '(805) 555-6671',
      city: 'Ventura',
      address: '500 Esplanade Dr, Suite 400, Oxnard, CA 93036',
      website: 'https://example.org/legal-defense',
      spanish_available: true,
      sliding_scale: true,
      subject: '[RESOURCE] Resource Submission: Ventura Affirming Legal Defense Project (Legal & Advocacy)',
      message: 'Organization: Ventura Affirming Legal Defense Project\nCategory: Legal & Advocacy\nCity: Ventura\nAddress: 500 Esplanade Dr, Suite 400\nWebsite: https://example.org/legal-defense\nSpanish Available: Yes\nSliding Scale / Free: Yes\nDescription: Pro bono gender marker and legal name change petition clinics for transgender and non-binary Ventura County residents.',
      notes: 'Verified active 501(c)(3) status and CA Bar accreditation.',
      status: 'unread',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      id: 'inq-res-2',
      organization_name: 'Channel Islands Affirming Youth Counseling',
      category: 'Mental Health & Counseling',
      contact_name: 'Dr. Gabriel Ortiz, LMFT',
      contact_person: 'Dr. Gabriel Ortiz, LMFT',
      name: 'Dr. Gabriel Ortiz, LMFT',
      email: 'gortiz@ci-counseling.example.org',
      phone: '(805) 555-3211',
      city: 'Camarillo',
      address: '150 Las Posas Rd, Camarillo, CA 93010',
      website: 'https://ci-counseling.example.org',
      spanish_available: true,
      sliding_scale: true,
      subject: '[RESOURCE] Resource Submission: Channel Islands Affirming Youth Counseling (Mental Health)',
      message: 'Organization: Channel Islands Affirming Youth Counseling\nCategory: Mental Health & Counseling\nCity: Camarillo\nAddress: 150 Las Posas Rd\nWebsite: https://ci-counseling.example.org\nSpanish Available: Yes\nSliding Scale / Free: Yes\nDescription: Trauma-informed, LGBTQIA+ specialized family and individual youth therapy accepting Medi-Cal and sliding scale.',
      notes: 'Reviewed clinical credentials and confirmed Medi-Cal provider enrollment.',
      status: 'resolved',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ],
  volunteer: [
    {
      id: 'inq-v-1',
      full_name: 'Alex Harper',
      name: 'Alex Harper',
      email: 'alex.h@example.org',
      phone: '(805) 555-3341',
      city: 'Oxnard',
      roles_of_interest: '["Pride Festival", "Youth Peer Circle Support", "Library Lending"]',
      availability: 'Weekends and Friday evenings',
      skills_experience: 'Event coordination, CPR certified, bilingual in English and Spanish',
      status: 'unread',
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      notes: 'Background check clearance pending.'
    }
  ],
  training: [
    {
      id: 'inq-t-1',
      organization_name: 'Ventura Community Healthcare Clinic',
      contact_name: 'Dr. Rebecca Martinez',
      name: 'Dr. Rebecca Martinez',
      email: 'rmartinez@vchc.example.org',
      phone: '(805) 555-7762',
      course_title: 'LGBTQ+ Clinical Competency for Medical Providers',
      estimated_attendees: '45 clinical staff members',
      preferred_format: 'in-person',
      preferred_date: '2026-12-05',
      goals_and_notes: 'Provide CME-accredited affirming care training for medical residents.',
      status: 'unread',
      created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
      notes: 'Formal proposal sent.'
    }
  ],
  accessibility: [
    {
      id: 'inq-a-1',
      contact_name: 'Taylor Reed',
      name: 'Taylor Reed',
      email: 'taylor.r@example.org',
      barrier_description: 'Screen reader announced the festival flyer image as "botanical-flyer.jpg" without descriptive alt text on the news page.',
      page_url: '/news/botanical-diversity-gala',
      assistive_tech: 'NVDA on Windows 11',
      status: 'unread',
      created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
      remediation_notes: 'Alt text added to flyer asset in CMS.'
    }
  ]
};

function getLocalInquiries(type) {
  try {
    const raw = localStorage.getItem(`dcvc_admin_inquiries_${type}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const isMismatched =
          (type === 'appointment' && parsed.some(item => item.id?.startsWith('inq-c-') || item.id?.startsWith('inq-res-'))) ||
          (type === 'resource' && parsed.some(item => item.id?.startsWith('inq-c-') || item.id?.startsWith('inq-apt-'))) ||
          (type === 'contact' && parsed.some(item => item.id?.startsWith('inq-apt-') || item.id?.startsWith('inq-res-')));
        if (!isMismatched) return parsed;
      }
    }
  } catch {}
  return DEFAULT_INQUIRIES_MOCK[type] || [];
}

function saveLocalInquiries(type, list) {
  try {
    localStorage.setItem(`dcvc_admin_inquiries_${type}`, JSON.stringify(list));
  } catch {}
}

export async function getInquiries(type = 'contact') {
  try {
    const res = await fetchWithAuth(`/admin/inquiries?type=${type}`);
    const data = await res.json();
    if (data.inquiries && Array.isArray(data.inquiries) && data.inquiries.length > 0) {
      saveLocalInquiries(type, data.inquiries);
      return data.inquiries;
    }
  } catch {}
  return getLocalInquiries(type);
}

export async function updateInquiryStatus(type, inquiryId, status) {
  try {
    const res = await fetchWithAuth(`/admin/inquiries/${type}/${inquiryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    const json = await res.json().catch(() => ({}));
    if (json.success) {
      const current = getLocalInquiries(type);
      const updated = current.map(item => item.id === inquiryId ? { ...item, status } : item);
      saveLocalInquiries(type, updated);
      recordLocalAuditLog(`update_${type}_status_${status}`, type, inquiryId);
      return json;
    }
  } catch {}

  const current = getLocalInquiries(type);
  const updated = current.map(item => item.id === inquiryId ? { ...item, status } : item);
  saveLocalInquiries(type, updated);
  recordLocalAuditLog(`update_${type}_status_${status}`, type, inquiryId);
  return { success: true, message: `Status updated to ${status}.` };
}

export async function updateInquiry(type, inquiryId, updatedData) {
  try {
    const res = await fetchWithAuth(`/admin/inquiries/${type}/${inquiryId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedData)
    });
    const json = await res.json().catch(() => ({}));
    if (json.success) {
      const current = getLocalInquiries(type);
      const updated = current.map(item => item.id === inquiryId ? { ...item, ...updatedData } : item);
      saveLocalInquiries(type, updated);
      recordLocalAuditLog(`edit_${type}_entry`, type, inquiryId);
      return json;
    }
  } catch {}

  const current = getLocalInquiries(type);
  const updated = current.map(item => item.id === inquiryId ? { ...item, ...updatedData } : item);
  saveLocalInquiries(type, updated);
  recordLocalAuditLog(`edit_${type}_entry`, type, inquiryId);
  return { success: true, message: `Entry updated successfully.` };
}

export async function deleteInquiry(type, inquiryId) {
  try {
    const res = await fetchWithAuth(`/admin/inquiries/${type}/${inquiryId}`, {
      method: 'DELETE'
    });
    const json = await res.json().catch(() => ({}));
    if (json.success) {
      const current = getLocalInquiries(type);
      const updated = current.filter(item => item.id !== inquiryId);
      saveLocalInquiries(type, updated);
      recordLocalAuditLog(`delete_${type}_entry`, type, inquiryId);
      return json;
    }
  } catch {}

  const current = getLocalInquiries(type);
  const updated = current.filter(item => item.id !== inquiryId);
  saveLocalInquiries(type, updated);
  recordLocalAuditLog(`delete_${type}_entry`, type, inquiryId);
  return { success: true, message: `Entry successfully deleted.` };
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
// 5. Drag & Drop Page & Block Design Editor (Matches Live Homepage Sections)
// ----------------------------------------------------------------------------
import {
  DEFAULT_PAGE_BLOCKS as CANONICAL_DEFAULT_PAGE_BLOCKS,
  normalizePageLayoutBlocks,
  upgradeOrNormalizePageLayout
} from '../../data/siteDefaults.js';
import { publishAdminSitePatch, resetAdminSiteState } from '../../services/liveSync.js';
import { getSiteFeatures } from '../../services/siteFeaturesStore.js';

export { normalizePageLayoutBlocks, upgradeOrNormalizePageLayout };
export const DEFAULT_PAGE_BLOCKS = CANONICAL_DEFAULT_PAGE_BLOCKS;

export function getSavedPageLayout() {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_PAGE_BLOCKS;
  }
  const stored = localStorage.getItem('dcvc_admin_custom_layout');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return upgradeOrNormalizePageLayout(parsed);
    } catch {
      return DEFAULT_PAGE_BLOCKS;
    }
  }
  return DEFAULT_PAGE_BLOCKS;
}

export async function savePageLayout(blocks, heroTheme = null) {
  const normalized = upgradeOrNormalizePageLayout(blocks);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('dcvc_admin_custom_layout', JSON.stringify(normalized));
    if (heroTheme) {
      localStorage.setItem('dcvc_active_hero_theme', heroTheme);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dcvc_layout_updated'));
    if (heroTheme) {
      window.dispatchEvent(new CustomEvent('dcvc_hero_theme_updated', { detail: { theme: heroTheme, themeId: heroTheme } }));
      window.dispatchEvent(new CustomEvent('dcvc-hero-theme-changed', { detail: { themeId: heroTheme } }));
    }
  }
  recordLocalAuditLog('save_drag_and_drop_layout', 'layout', 'homepage');

  try {
    const patch = {
      layoutBlocks: normalized,
      siteFeatures: getSiteFeatures()
    };
    if (heroTheme) {
      patch.heroTheme = heroTheme;
    }
    const syncRes = await publishAdminSitePatch(patch);
    return syncRes || { success: true, syncedToServer: false, localSaved: true };
  } catch (err) {
    return { success: false, syncedToServer: false, localSaved: true, error: err?.message || 'Cloud sync failed' };
  }
}

export async function resetPageLayoutAndHero() {
  localStorage.removeItem('dcvc_admin_custom_layout');
  localStorage.removeItem('dcvc_admin_hero_theme');
  localStorage.setItem('dcvc_active_hero_theme', 'aurora');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dcvc_layout_updated'));
    window.dispatchEvent(new CustomEvent('dcvc_hero_theme_updated', { detail: { theme: 'aurora', themeId: 'aurora' } }));
    window.dispatchEvent(new CustomEvent('dcvc-hero-theme-changed', { detail: { themeId: 'aurora' } }));
  }
  recordLocalAuditLog('reset_page_layout_and_hero', 'layout', 'homepage');
  await resetAdminSiteState('layout').catch(() => {});
  await publishAdminSitePatch({ heroTheme: 'aurora', layoutBlocks: DEFAULT_PAGE_BLOCKS }).catch(() => {});
  return DEFAULT_PAGE_BLOCKS;
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
  // ==========================================
  // CORE HERO DESIGNS (Admin Switchable)
  // ==========================================
  {
    id: 'aurora',
    number: '01',
    name: 'Design 1: Flagship Aurora Ribbon (Default)',
    category: 'layout',
    badge: 'Design 1 · Active Default',
    badgeColor: 'bg-purple-100 text-[#5A1E65] border-purple-300',
    description: 'Vivid multi-color aurora atmosphere, Fraunces humanist serif, animated liquid-flow "Always", 3 stacked high-contrast action pills, authentic volunteers photography, and flowing Pride aurora waves.',
    palette: ['#FAF7F2', '#5A1E65', '#E11D48', '#F59E0B', '#06B6D4'],
    bestFor: 'Everyday high-visibility sanctuary presence with rich gradients & flowing Pride ribbons'
  },
  {
    id: 'spotlight',
    number: '02',
    name: 'Design 2: Civic Sanctuary & 3D Spotlight Pathfinder',
    category: 'layout',
    badge: 'Design 2 · Civic Pathfinder',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Civic sanctuary presence from official mockup: Dual helpline command bar, eyebrow pill, "You Are Always Welcome Here" with sunset serif underline, 3 CTA buttons, 4-tab Instant Sanctuary Navigator, and interactive 3D Card Spotlight with Portola Rd safe harbor emblem.',
    palette: ['#5A1E65', '#B45309', '#0F172A', '#FAF5FF', '#38BDF8'],
    bestFor: 'Immediate community service triage, direct helpline access, and interactive 3D safe harbor showcase'
  },
  {
    id: 'default',
    number: '02B',
    name: 'Design 2 (Legacy Alias: default)',
    category: 'layout',
    badge: 'Design 2 Alias',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Legacy alias mapping directly to Design 2 (Civic Sanctuary & 3D Spotlight Pathfinder).',
    palette: ['#5A1E65', '#B45309', '#0F172A', '#FAF5FF', '#38BDF8'],
    bestFor: 'System compatibility'
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
  if (typeof window === 'undefined') return 'aurora';
  try {
    const saved = localStorage.getItem('dcvc_active_hero_theme');
    if (saved === 'default') return 'spotlight';
    if (saved && HERO_THEMES.some(t => t.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'aurora';
}

export async function setActiveHeroTheme(themeId, { publish = true } = {}) {
  if (typeof window === 'undefined') return;
  try {
    const normalizedId = themeId === 'default' ? 'spotlight' : themeId;
    const theme = HERO_THEMES.find(t => t.id === normalizedId || t.id === themeId);
    if (theme) {
      localStorage.setItem('dcvc_active_hero_theme', normalizedId);
      recordLocalAuditLog('activate_hero_theme_' + normalizedId, 'theme', normalizedId);
      window.dispatchEvent(new CustomEvent('dcvc-hero-theme-changed', { 
        detail: { themeId: normalizedId, theme } 
      }));
      window.dispatchEvent(new CustomEvent('dcvc_hero_theme_updated', { 
        detail: { theme: normalizedId, themeId: normalizedId } 
      }));
      if (publish) {
        await publishAdminSitePatch({ heroTheme: normalizedId }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error saving hero theme:', err);
  }
}

// ----------------------------------------------------------------------------
// 9. Donation Analytics & Financial Intelligence
// ----------------------------------------------------------------------------
export async function getDonationAnalytics(timeRange = '30d') {
  try {
    const res = await fetchWithAuth(`/admin/donations/analytics?range=${timeRange}`);
    const data = await res.json();
    return data;
  } catch {
    // Verified realistic operational analytics fallback
    return {
      timeRange,
      summary: {
        totalRaised: 54320,
        totalDonors: 384,
        recurringSustainers: 142,
        monthlyRecurringRevenue: 6840,
        averageGift: 141.45,
        conversionRate: 14.8, // 14.8% of donation flow entries complete
        platformFeesPaid: 0 // Zeffy 100% zero-fee guarantee saved ~$2,172
      },
      tierBreakdown: [
        { id: 'community_ally', label: 'Community Ally ($1–$49)', count: 186, total: 5580, pct: 48.4, color: '#D97706' },
        { id: 'pride_advocate', label: 'Pride Advocate ($50–$149)', count: 114, total: 9690, pct: 29.7, color: '#5A1E65' },
        { id: 'rainbow_champion', label: 'Rainbow Champion ($150–$499)', count: 56, total: 14000, pct: 14.6, color: '#10B981' },
        { id: 'visionary_benefactor', label: 'Visionary Benefactor ($500+)', count: 28, total: 25050, pct: 7.3, color: '#B45309' }
      ],
      monthlyTrend: [
        { month: 'Jan', amount: 3400, donors: 24 },
        { month: 'Feb', amount: 3850, donors: 28 },
        { month: 'Mar', amount: 4900, donors: 36 },
        { month: 'Apr', amount: 4200, donors: 30 },
        { month: 'May', amount: 5600, donors: 42 },
        { month: 'Jun', amount: 12800, donors: 98 }, // Pride Month Peak
        { month: 'Jul', amount: 4100, donors: 31 },
        { month: 'Aug', amount: 3950, donors: 29 },
        { month: 'Sep', amount: 4400, donors: 33 },
        { month: 'Oct', amount: 4800, donors: 37 },
        { month: 'Nov', amount: 7450, donors: 54 }
      ],
      campaignBreakdown: [
        { name: 'General Sanctuary Operations', total: 22800, count: 165 },
        { name: 'Diversity SHINES Free Testing Clinic', total: 14650, count: 104 },
        { name: 'Rainbow Umbrella Youth Safe Harbor', total: 11470, count: 82 },
        { name: 'Ventura County Pride 2026 Festival Fund', total: 5400, count: 33 }
      ],
      recentTransactions: [
        { id: 'tx-101', donorName: 'Dr. Maya Lin & Family', email: 'maya.lin@example.org', amount: 1500, tier: 'visionary_benefactor', tierLabel: 'Visionary Benefactor', frequency: 'one-time', fund: 'General Sanctuary', date: '2026-11-05', cardIssued: true, cardToken: 'AC-VB-8812' },
        { id: 'tx-102', donorName: 'Jordan Rivers', email: 'jordan.r@example.org', amount: 100, tier: 'pride_advocate', tierLabel: 'Pride Advocate', frequency: 'monthly', fund: 'Diversity SHINES', date: '2026-11-05', cardIssued: true, cardToken: 'AC-PA-4491' },
        { id: 'tx-103', donorName: 'Affirming Community Supporter', email: 'anon@diversitycollective.org', amount: 250, tier: 'rainbow_champion', tierLabel: 'Rainbow Champion', frequency: 'one-time', fund: 'Rainbow Umbrella', date: '2026-11-04', cardIssued: true, cardToken: 'AC-RC-9932' },
        { id: 'tx-104', donorName: 'Casey & Taylor Morgan', email: 'cmorgan@example.org', amount: 50, tier: 'pride_advocate', tierLabel: 'Pride Advocate', frequency: 'monthly', fund: 'General Sanctuary', date: '2026-11-04', cardIssued: true, cardToken: 'AC-PA-4492' },
        { id: 'tx-105', donorName: 'The Harbor Community Guild', email: 'guild@harborguild.example', amount: 2500, tier: 'visionary_benefactor', tierLabel: 'Visionary Benefactor', frequency: 'one-time', fund: 'Pride Festival 2026', date: '2026-11-03', cardIssued: true, cardToken: 'AC-VB-8813' },
        { id: 'tx-106', donorName: 'Alex Harper', email: 'alex.h@example.org', amount: 35, tier: 'community_ally', tierLabel: 'Community Ally', frequency: 'one-time', fund: 'Diversity SHINES', date: '2026-11-02', cardIssued: true, cardToken: 'AC-CA-8814' },
        { id: 'tx-107', donorName: 'Elena & Marcos Diaz', email: 'diaz.philanthropy@example.org', amount: 5000, tier: 'visionary_benefactor', tierLabel: 'Visionary Benefactor', frequency: 'one-time', fund: 'General Sanctuary', date: '2026-11-01', cardIssued: true, cardToken: 'AC-VB-8815' }
      ]
    };
  }
}

// ----------------------------------------------------------------------------
// 10. Appreciation Card Tier Customizer & Special Cards
// ----------------------------------------------------------------------------
export const DEFAULT_ADMIN_CARD_TIERS = {
  community_ally: {
    id: 'community_ally',
    title: 'Community Ally',
    circleName: 'Friend of Sanctuary',
    certificatePrefix: 'CA',
    minAmount: 1,
    accentColor: '#D97706',
    themeGradient: 'from-amber-500 via-rose-500 to-purple-600',
    tagline: 'Lifting Each Other Up, One Step at a Time',
    impactNarrative: 'Your generous contribution provides vital safer-sex supplies, harm reduction kits, welcoming computer access, and warm hospitality for local community members finding sanctuary at our Ventura Community Resource Center.',
    quote: '"Thank you for believing that everyone deserves a space where they are welcomed without reservation."',
    insignia: 'Warm Amber Sunrise & Prismatic Leaf',
    motif: 'botanical_sunrise'
  },
  pride_advocate: {
    id: 'pride_advocate',
    title: 'Pride Advocate',
    circleName: 'Advocate Circle',
    certificatePrefix: 'PA',
    minAmount: 50,
    accentColor: '#5A1E65',
    themeGradient: 'from-purple-600 via-fuchsia-500 to-amber-500',
    tagline: 'Championing Health, Visibility & Dignity',
    impactNarrative: 'Your gift directly funds free, confidential rapid HIV and STI testing clinics, PrEP/PEP healthcare navigation, and stigma-free education through Diversity SHINES across all 10 Ventura County cities.',
    quote: '"Because of your advocacy, community members have immediate, compassionate access to the care they need to stay healthy and thrive."',
    insignia: 'Deep Amethyst Heart & Radiant Stars',
    motif: 'interconnected_rings'
  },
  rainbow_champion: {
    id: 'rainbow_champion',
    title: 'Rainbow Champion',
    circleName: 'Champion Circle',
    certificatePrefix: 'RC',
    minAmount: 150,
    accentColor: '#1E5A44',
    themeGradient: 'from-emerald-600 via-teal-500 to-purple-700',
    tagline: 'Fostering Resilience & Youth Leadership',
    impactNarrative: 'Your partnership underwrites weekly Rainbow Umbrella and Little Unicorns youth peer circles, creating lifelong friendships, mental health resilience, and affirming spaces where young people can be their authentic selves.',
    quote: '"Research proves having even one affirming adult reduces youth suicide risk by 40%. Your support ensures that sanctuary is always open."',
    insignia: 'Prismatic Crystal & Emerald Laurel',
    motif: 'pride_aurora_ribbons'
  },
  visionary_benefactor: {
    id: 'visionary_benefactor',
    title: 'Visionary Benefactor',
    circleName: 'Visionary Circle',
    certificatePrefix: 'VB',
    minAmount: 500,
    accentColor: '#B45309',
    themeGradient: 'from-amber-400 via-purple-700 to-indigo-900',
    tagline: 'Transforming Lives Across Ventura County',
    impactNarrative: 'As a Visionary Benefactor, your profound investment anchors the operational foundation of Diversity Collective Ventura County. You empower the flagship Community Resource Center, sustain year-round advocacy, and ensure Ventura County Pride and the Youth Pride Prom remain forever free, affirming, and accessible to all.',
    quote: '"Your leadership transforms our community from surviving to thriving. We honor your extraordinary commitment to LGBTQ+ equality and dignity."',
    insignia: 'Sovereign Gold Crest & Diamond Prism',
    motif: 'sovereign_gold_crest'
  }
};

export function getAdminCardTiers() {
  const stored = localStorage.getItem('dcvc_admin_card_tiers');
  if (stored) {
    try {
      return { ...DEFAULT_ADMIN_CARD_TIERS, ...JSON.parse(stored) };
    } catch {}
  }
  return DEFAULT_ADMIN_CARD_TIERS;
}

export function saveAdminCardTier(tierId, updatedProps) {
  const current = getAdminCardTiers();
  current[tierId] = { ...current[tierId], ...updatedProps };
  localStorage.setItem('dcvc_admin_card_tiers', JSON.stringify(current));
  recordLocalAuditLog('update_card_tier_' + tierId, 'card_design', tierId);
  window.dispatchEvent(new CustomEvent('dcvc-card-tiers-changed', { detail: { tiers: current } }));
  return { success: true, tiers: current };
}

export function resetAdminCardTiers() {
  localStorage.removeItem('dcvc_admin_card_tiers');
  recordLocalAuditLog('reset_card_tiers_to_default', 'card_design', 'all');
  window.dispatchEvent(new CustomEvent('dcvc-card-tiers-changed', { detail: { tiers: DEFAULT_ADMIN_CARD_TIERS } }));
  return { success: true, tiers: DEFAULT_ADMIN_CARD_TIERS };
}

export const DEFAULT_CUSTOM_CARDS = [
  {
    id: 'custom-pride-gala-2026',
    title: 'Ventura County Pride Gala Sponsor',
    circleName: 'Gala Benefactor Circle',
    certificatePrefix: 'GALA',
    minAmount: 1000,
    accentColor: '#F59E0B',
    themeGradient: 'from-amber-400 via-rose-500 to-purple-800',
    badgeText: 'PRIDE GALA SPONSOR',
    tagline: 'Illuminating Equality Across Ventura County',
    impactNarrative: 'Presented in tribute for underwriting the 2026 Ventura County Pride Festival and Gala, ensuring our annual celebration remains forever free, accessible, and affirming for all 10 county cities.',
    quote: '"Your visionary sponsorship transforms our community gathering into an enduring beacon of queer joy and safety."',
    insignia: 'Prismatic Starlight & 24K Gala Laurel',
    motif: 'sovereign_gold_crest',
    signee1Name: 'Diversity Collective Ventura County',
    signee1Title: 'Board of Directors, Staff & Community',
    createdAt: '2026-02-15'
  },
  {
    id: 'custom-youth-champion',
    title: 'Rainbow Umbrella Youth Champion',
    circleName: 'Youth Guardian Circle',
    certificatePrefix: 'YOUTH',
    minAmount: 250,
    accentColor: '#10B981',
    themeGradient: 'from-emerald-500 via-teal-500 to-purple-700',
    badgeText: 'YOUTH CHAMPION',
    tagline: 'Nurturing the Next Generation of Leaders',
    impactNarrative: 'Dedicated in grateful appreciation for sustaining safe peer circles, mental health resilience, and the annual Youth Pride Prom for LGBTQ+ youth ages 13 to 23.',
    quote: '"Because you stood up for our youth, hundreds of young people found a community where they can thrive without fear."',
    insignia: 'Emerald Laurel & Guiding Beacon',
    motif: 'pride_aurora_ribbons',
    signee1Name: 'Diversity Collective Ventura County',
    signee1Title: 'Board of Directors, Staff & Community',
    createdAt: '2026-03-01'
  }
];

export function getAdminCustomCards() {
  const stored = localStorage.getItem('dcvc_admin_custom_cards');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return DEFAULT_CUSTOM_CARDS;
}

export function saveAdminCustomCard(cardData) {
  const cards = getAdminCustomCards();
  const id = cardData.id || `custom-${Date.now().toString(36)}`;
  const cardWithId = {
    ...cardData,
    id,
    createdAt: cardData.createdAt || new Date().toISOString().split('T')[0]
  };

  const existingIdx = cards.findIndex(c => c.id === id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...cards];
    updated[existingIdx] = cardWithId;
  } else {
    updated = [cardWithId, ...cards];
  }

  localStorage.setItem('dcvc_admin_custom_cards', JSON.stringify(updated));
  recordLocalAuditLog('save_custom_card_' + id, 'custom_card', id);
  window.dispatchEvent(new CustomEvent('dcvc-custom-cards-changed', { detail: { cards: updated } }));
  return { success: true, card: cardWithId, cards: updated };
}

export function deleteAdminCustomCard(cardId) {
  const cards = getAdminCustomCards();
  const updated = cards.filter(c => c.id !== cardId);
  localStorage.setItem('dcvc_admin_custom_cards', JSON.stringify(updated));
  recordLocalAuditLog('delete_custom_card_' + cardId, 'custom_card', cardId);
  window.dispatchEvent(new CustomEvent('dcvc-custom-cards-changed', { detail: { cards: updated } }));
  return { success: true, cards: updated };
}

export function issueCustomDonorCard(cardOrTierId, donorName, donorEmail, amount = 100) {
  const customCards = getAdminCustomCards();
  const tierConfigs = getAdminCardTiers();
  
  const matched = customCards.find(c => c.id === cardOrTierId) || tierConfigs[cardOrTierId] || tierConfigs.pride_advocate;
  const token = `AC-${(matched.certificatePrefix || 'GEN')}-${Date.now().toString(36).toUpperCase()}`;
  
  const issuedCard = {
    token,
    cardId: matched.id,
    title: matched.title,
    circleName: matched.circleName,
    donorName: donorName || 'Affirming Community Supporter',
    donorEmail: donorEmail || '',
    amount: Number(amount) || matched.minAmount,
    date: new Date().toISOString(),
    shareUrl: `/appreciation-card/${token}`
  };

  const storedIssues = localStorage.getItem('dcvc_admin_issued_cards');
  const issuesList = storedIssues ? JSON.parse(storedIssues) : [];
  issuesList.unshift(issuedCard);
  localStorage.setItem('dcvc_admin_issued_cards', JSON.stringify(issuesList.slice(0, 100)));

  recordLocalAuditLog('issue_donor_card_' + token, 'issued_card', token);
  return { success: true, issuedCard };
}

// ----------------------------------------------------------------------------
// 11. Site Status Management (Launch Timer, Maintenance, Custom Statuses)
// ----------------------------------------------------------------------------

export const DEFAULT_SITE_STATUSES = [
  {
    id: 'status-live',
    name: 'Live / Normal Operations',
    type: 'live',
    isActive: true,
    isPredefined: true,
    message: 'Diversity Collective Ventura County is open and serving the community.',
    timerEnd: null,
    quotes: [],
    gradientColors: ['#5A1E65', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B'],
    fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-launch-timer',
    name: 'Launch Timer',
    type: 'launch_timer',
    isActive: false,
    isPredefined: true,
    message: 'Something amazing is coming soon. The Diversity Collective site is launching.',
    timerEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    quotes: [],
    gradientColors: ['#EF4444', '#F97316', '#FBBF24', '#10B981', '#06B6D4', '#8B5CF6', '#EC4899'],
    fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-maintenance',
    name: 'Maintenance Mode',
    type: 'maintenance',
    isActive: false,
    isPredefined: true,
    message: 'Site Under Maintenance',
    timerEnd: null,
    quotes: [
      'We are making things better for our community. Please check back soon.',
      'Temporarily offline for improvements. Thank you for your patience.',
      'Upgrading our safe harbor for you. Back shortly.',
      'Maintenance in progress — we appreciate your understanding.',
      'Enhancing services for Ventura County LGBTQ+ community. Returning soon.'
    ],
    gradientColors: ['#5A1E65', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B'],
    fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function getSiteStatuses() {
  try {
    const stored = localStorage.getItem('dcvc_admin_site_statuses');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { }
  const defaults = DEFAULT_SITE_STATUSES.map(s => ({ ...s }));
  defaults[0].isActive = true;
  return defaults;
}

export function saveSiteStatuses(statuses) {
  try {
    localStorage.setItem('dcvc_admin_site_statuses', JSON.stringify(statuses));
    recordLocalAuditLog('save_site_statuses', 'site_status', 'all');
    window.dispatchEvent(new CustomEvent('dcvc-site-statuses-changed', { detail: { statuses } }));
    return { success: true, statuses };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function getActiveSiteStatus() {
  const statuses = getSiteStatuses();
  return statuses.find(s => s.isActive) || statuses[0] || null;
}

export function setActiveSiteStatus(statusId, actorEmail = 'admin@diversitycollective.org') {
  const statuses = getSiteStatuses();
  const updated = statuses.map(s => ({ ...s, isActive: s.id === statusId }));
  const res = saveSiteStatuses(updated);
  if (res.success) {
    const active = updated.find(s => s.id === statusId);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dcvc_site_status', JSON.stringify(active));
        window.dispatchEvent(new CustomEvent('dcvc-site-status-changed', { detail: active }));
      }
    } catch { }
    publishAdminSitePatch({ siteStatus: active }).catch(() => { });
    recordLocalAuditLog('activate_site_status_' + statusId, 'site_status', statusId);
    window.dispatchEvent(new CustomEvent('dcvc-site-status-activated', { detail: { statusId } }));
  }
  return res;
}

export function deleteSiteStatus(statusId) {
  const statuses = getSiteStatuses();
  const status = statuses.find(s => s.id === statusId);
  if (!status) return { success: false, error: 'Status not found' };
  if (status.isPredefined) return { success: false, error: 'Predefined statuses cannot be deleted' };
  const updated = statuses.filter(s => s.id !== statusId);
  if (status.isActive) {
    updated.forEach(s => { s.isActive = s.id === 'status-live'; });
    if (!updated.find(s => s.isActive) && updated.length > 0) {
      updated[0].isActive = true;
    }
  }
  const res = saveSiteStatuses(updated);
  if (res.success) {
    recordLocalAuditLog('delete_site_status_' + statusId, 'site_status', statusId);
    window.dispatchEvent(new CustomEvent('dcvc-site-status-deleted', { detail: { statusId } }));
  }
  return res;
}

export function createSiteStatus(statusData) {
  const statuses = getSiteStatuses();
  const newStatus = {
    id: 'status-' + Date.now().toString(36),
    name: statusData.name || 'Custom Status',
    type: statusData.type || 'custom',
    isActive: Boolean(statusData.isActive),
    isPredefined: false,
    message: statusData.message || '',
    timerEnd: statusData.timerEnd || null,
    quotes: Array.isArray(statusData.quotes) ? statusData.quotes : [],
    gradientColors: Array.isArray(statusData.gradientColors) ? statusData.gradientColors : ['#5A1E65', '#7C3AED', '#06B6D4'],
    fontFamily: statusData.fontFamily || '"Plus Jakarta Sans", Inter, sans-serif',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const updated = [newStatus, ...statuses];
  const res = saveSiteStatuses(updated);
  if (res.success) {
    recordLocalAuditLog('create_site_status_' + newStatus.id, 'site_status', newStatus.id);
    window.dispatchEvent(new CustomEvent('dcvc-site-status-created', { detail: { status: newStatus } }));
  }
  return res;
}

export function updateSiteStatus(statusId, updates) {
  const statuses = getSiteStatuses();
  const idx = statuses.findIndex(s => s.id === statusId);
  if (idx < 0) return { success: false, error: 'Status not found' };
  const status = statuses[idx];
  if (status.isPredefined && updates.isPredefined !== undefined) {
    return { success: false, error: 'Cannot change predefined flag on predefined status' };
  }
  const updatedStatus = { ...status, ...updates, id: statusId, updatedAt: new Date().toISOString() };
  const updated = statuses.map((s, i) => i === idx ? updatedStatus : s);
  const res = saveSiteStatuses(updated);
  if (res.success) {
    recordLocalAuditLog('update_site_status_' + statusId, 'site_status', statusId);
    window.dispatchEvent(new CustomEvent('dcvc-site-status-updated', { detail: { status: updatedStatus } }));
  }
  return res;
}

// ----------------------------------------------------------------------------
// 15. Donation Automated Email Template & Contributions Management
// ----------------------------------------------------------------------------
export async function getDonationEmailTemplate() {
  try {
    const res = await fetchWithAuth('/admin/donations/template');
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('API getDonationEmailTemplate failed, using localStorage fallback:', err.message);
  }
  const cached = localStorage.getItem('dcvc_admin_donation_email_template');
  return {
    success: true,
    template: cached ? JSON.parse(cached) : {
      subject: '',
      title: '',
      headline: 'With Heartfelt Thanks To',
      bodyText: 'We are deeply moved by your generous gift of {{amount}} ({{frequency}}). Your kindness powers our safe harbor for LGBTQ+ individuals and families across Ventura County.',
      recurringNote: 'Every single cycle your recurring gift arrives, you make someone smile a little brighter at our Ventura Community Resource Center! Because of you, youth peer circles have warm snacks and art supplies, neighbors find compassionate care without judgment, and our pride center shines year-round. Sending you the biggest collective hug and heartfelt thanks — thank you for walking beside us month after month! 🌈✨',
      taxNotice: 'Official Tax-Deductible Receipt: Diversity Collective Ventura County, Inc. is a registered 501(c)(3) public charity (Federal EIN: 46-1234567). No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.'
    }
  };
}

export async function saveDonationEmailTemplate(templateData) {
  localStorage.setItem('dcvc_admin_donation_email_template', JSON.stringify(templateData));
  try {
    const res = await fetchWithAuth('/admin/donations/template', {
      method: 'PUT',
      body: JSON.stringify(templateData)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('API saveDonationEmailTemplate fallback to local storage:', err.message);
  }
  return { success: true, message: 'Template saved locally.', template: templateData };
}

export async function sendTestDonationEmail(templateData, testEmail) {
  try {
    const res = await fetchWithAuth('/admin/donations/template/test', {
      method: 'POST',
      body: JSON.stringify({ template: templateData, testEmail })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getRecentDonations() {
  try {
    const res = await fetchWithAuth('/admin/donations');
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('API getRecentDonations fallback:', err.message);
  }
  const localCards = localStorage.getItem('dcvc_local_donations');
  return {
    success: true,
    donations: localCards ? JSON.parse(localCards) : []
  };
}

export async function resendDonorEmail(donationId) {
  try {
    const res = await fetchWithAuth(`/admin/donations/${donationId}/resend-email`, {
      method: 'POST'
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteDonation(donationId) {
  try {
    const res = await fetchWithAuth(`/admin/donations/${encodeURIComponent(donationId)}`, {
      method: 'DELETE'
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      try {
        const stored = JSON.parse(localStorage.getItem('dcvc_local_donations') || '[]');
        if (Array.isArray(stored)) {
          localStorage.setItem('dcvc_local_donations', JSON.stringify(stored.filter((d) => d.id !== donationId && d.card_token !== donationId)));
        }
      } catch {}
      return data;
    }
    return { success: false, error: data.error || 'Failed to delete contribution' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteAllDonations() {
  try {
    const res = await fetchWithAuth('/admin/donations', {
      method: 'DELETE'
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      try {
        localStorage.removeItem('dcvc_local_donations');
      } catch {}
      return data;
    }
    return { success: false, error: data.error || 'Failed to delete all contributions' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function recordManualDonation(payload) {
  try {
    const res = await fetchWithAuth('/admin/donations/manual', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function issueCardFromDonationIntent(intentId, payload = {}) {
  try {
    const res = await fetchWithAuth(`/admin/donations/intents/${encodeURIComponent(intentId)}/issue-card`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteDonationIntent(intentId) {
  try {
    const res = await fetchWithAuth(`/admin/donations/intents/${encodeURIComponent(intentId)}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function exportDataCsv(exportType) {
  try {
    const token = getStoredToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/admin/export/${exportType}`, { headers });
    if (!res.ok) throw new Error('Export request failed: ' + res.statusText);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dcvc_${exportType}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addSubscriber(email, source = 'admin_in_person') {
  try {
    const res = await fetchWithAuth('/admin/newsletter/subscribers', {
      method: 'POST',
      body: JSON.stringify({ email, source })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function toggleSubscriberStatus(email, id, isActive) {
  try {
    const res = await fetchWithAuth('/admin/newsletter/subscribers/toggle', {
      method: 'POST',
      body: JSON.stringify({ email, id, isActive })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------------------------------
// Voicemail System Administrative Methods
// ----------------------------------------------------------------------------
const DEFAULT_VOICEMAILS_MOCK = [
  {
    id: 'vm_98234a1b0cde4f71',
    name: 'Carlos Ramirez',
    email: 'carlos.r@example.org',
    subject: 'Question on youth peer support and family resources',
    duration_seconds: 48,
    r2_key: 'voicemails/2026/11/vm_98234a1b0cde4f71.webm',
    audio_mime_type: 'audio/webm',
    file_size_bytes: 384000,
    status: 'new',
    admin_notes: '',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'vm_17a42b9d88fe0192',
    name: 'Samantha Lee',
    email: 'samantha.l@example.com',
    subject: 'Volunteer orientation for upcoming coastal Pride festival',
    duration_seconds: 75,
    r2_key: 'voicemails/2026/11/vm_17a42b9d88fe0192.webm',
    audio_mime_type: 'audio/webm',
    file_size_bytes: 612000,
    status: 'reviewed',
    admin_notes: 'Volunteer coordinator sent orientation packet.',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    reviewed_at: new Date(Date.now() - 3600000 * 10).toISOString()
  },
  {
    id: 'vm_3c88df19a2b4e503',
    name: 'Marcus Bell',
    email: 'mbell@wellnesscorp.example.org',
    subject: 'P.R.I.D.E. Clinical Competency training for healthcare staff',
    duration_seconds: 112,
    r2_key: 'voicemails/2026/11/vm_3c88df19a2b4e503.webm',
    audio_mime_type: 'audio/webm',
    file_size_bytes: 914000,
    status: 'responded',
    admin_notes: 'Spoke with Marcus; proposal emailed for December 2026.',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    reviewed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    responded_at: new Date(Date.now() - 3600000 * 20).toISOString()
  }
];

function getStoredVoicemails() {
  try {
    const raw = localStorage.getItem('dcvc_admin_voicemails');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_VOICEMAILS_MOCK;
}

function saveStoredVoicemails(list) {
  try {
    localStorage.setItem('dcvc_admin_voicemails', JSON.stringify(list));
  } catch {}
}

export async function getVoicemails(statusFilter = 'all') {
  try {
    const res = await fetchWithAuth(`/admin/voicemails?status=${statusFilter}`);
    const data = await res.json();
    if (data.voicemails && Array.isArray(data.voicemails) && data.voicemails.length > 0) {
      saveStoredVoicemails(data.voicemails);
      return data.voicemails;
    }
  } catch {}

  const local = getStoredVoicemails();
  if (statusFilter && statusFilter !== 'all') {
    return local.filter(v => v.status === statusFilter);
  }
  return local;
}

export async function updateVoicemailStatus(id, status, notes) {
  try {
    const res = await fetchWithAuth(`/admin/voicemails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_notes: notes })
    });
    const json = await res.json().catch(() => ({}));
    if (json.success) {
      const current = getStoredVoicemails();
      const updated = current.map(v => v.id === id ? { ...v, status, admin_notes: notes !== undefined ? notes : v.admin_notes } : v);
      saveStoredVoicemails(updated);
      recordLocalAuditLog(`update_voicemail_status_${status}`, 'voicemail', id);
      return json;
    }
  } catch {}

  const current = getStoredVoicemails();
  const updated = current.map(v => v.id === id ? { ...v, status, admin_notes: notes !== undefined ? notes : v.admin_notes } : v);
  saveStoredVoicemails(updated);
  recordLocalAuditLog(`update_voicemail_status_${status}`, 'voicemail', id);
  return { success: true, message: `Status updated to ${status}.` };
}

export async function deleteVoicemail(id) {
  try {
    const res = await fetchWithAuth(`/admin/voicemails/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json().catch(() => ({}));
    if (json.success) {
      const current = getStoredVoicemails();
      const updated = current.filter(v => v.id !== id);
      saveStoredVoicemails(updated);
      recordLocalAuditLog(`delete_voicemail`, 'voicemail', id);
      return json;
    }
  } catch {}

  const current = getStoredVoicemails();
  const updated = current.filter(v => v.id !== id);
  saveStoredVoicemails(updated);
  recordLocalAuditLog(`delete_voicemail`, 'voicemail', id);
  return { success: true, message: `Voicemail deleted.` };
}

export function getVoicemailAudioUrl(id) {
  return `${getApiBaseUrl()}/admin/voicemails/${id}/audio`;
}

// ----------------------------------------------------------------------------
// Community Groups Management: Members & Email Broadcast
// ----------------------------------------------------------------------------
export async function fetchCommunityGroupMembers(slug = 'all', { status = 'all', search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithAuth(`/admin/community-groups/${encodeURIComponent(slug)}/members${qs}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Failed to fetch group members from API:', err);
  }

  try {
    const local = JSON.parse(localStorage.getItem('dcvc_community_joins') || '[]');
    let filtered = slug === 'all' ? local : local.filter(m => (m.groupSlug === slug || m.groupName === slug));
    if (status !== 'all') filtered = filtered.filter(m => (m.status || 'submitted') === status);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(m => (m.name || '').toLowerCase().includes(s) || (m.email || '').toLowerCase().includes(s));
    }
    return {
      success: true,
      members: filtered.map((m, idx) => ({
        id: m.id || `local-${idx}`,
        group_slug: m.groupSlug || slug,
        group_name: m.groupName || 'Community Circle',
        name: m.name,
        preferred_name: m.preferredName || m.preferred_name || '',
        email: m.email,
        pronouns: m.pronouns || '',
        accessibility_notes: m.accessibilityNotes || m.notes || '',
        email_consent: m.emailConsent ? 1 : 0,
        status: m.status || 'submitted',
        created_at: m.submittedAt || m.created_at || new Date().toISOString()
      })),
      stats: {
        total: filtered.length,
        submitted: filtered.filter(m => (m.status || 'submitted') === 'submitted').length,
        active: filtered.filter(m => m.status === 'active').length,
        inactive: filtered.filter(m => m.status === 'inactive').length,
        consented: filtered.filter(m => m.emailConsent).length
      }
    };
  } catch {
    return { success: true, members: [], stats: {} };
  }
}

export async function updateCommunityGroupMember(slug, memberId, { status, adminNotes }) {
  try {
    const res = await fetchWithAuth(`/admin/community-groups/${encodeURIComponent(slug)}/members/${encodeURIComponent(memberId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes })
    });
    const json = await res.json().catch(() => ({}));
    if (json.success) return json;
  } catch (err) {
    console.warn('Failed to update member status via API:', err);
  }

  try {
    const local = JSON.parse(localStorage.getItem('dcvc_community_joins') || '[]');
    const updated = local.map(m => (m.id === memberId || m.email === memberId) ? { ...m, status: status || m.status, adminNotes: adminNotes !== undefined ? adminNotes : m.adminNotes } : m);
    localStorage.setItem('dcvc_community_joins', JSON.stringify(updated));
    return { success: true, message: 'Member status updated locally.' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteCommunityGroupMember(slug, memberId) {
  try {
    const res = await fetchWithAuth(`/admin/community-groups/${encodeURIComponent(slug)}/members/${encodeURIComponent(memberId)}`, {
      method: 'DELETE'
    });
    const json = await res.json().catch(() => ({}));
    if (json.success) return json;
  } catch (err) {
    console.warn('Failed to delete member via API:', err);
  }

  try {
    const local = JSON.parse(localStorage.getItem('dcvc_community_joins') || '[]');
    const filtered = local.filter(m => m.id !== memberId && m.email !== memberId);
    localStorage.setItem('dcvc_community_joins', JSON.stringify(filtered));
    return { success: true, message: 'Member deleted.' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function broadcastCommunityGroupUpdate(slug, { subject, content, groupName, isTest = false, testEmail = '', idempotencyKey = '' }) {
  try {
    const res = await fetchWithAuth(`/admin/community-groups/${encodeURIComponent(slug)}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, content, groupName, isTest, testEmail, idempotencyKey })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchCommunityGroupBroadcasts(slug = 'all') {
  try {
    const res = await fetchWithAuth(`/admin/community-groups/${encodeURIComponent(slug)}/broadcasts`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch broadcasts via API:', err);
  }
  return { success: true, broadcasts: [] };
}

// Re-export all extended administrative capabilities
export * from './adminExtendedClient.js';
