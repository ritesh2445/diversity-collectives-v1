/**
 * DCVC Admin Dashboard — Centralized Admin Client
 * Communicates with Cloudflare Worker Backend (/api/admin/*)
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
  } catch (err) {
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
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function getDirectorySubmissions(status = 'pending') {
  try {
    const res = await fetchWithAuth(`/admin/directory?status=${status}`);
    const data = await res.json();
    return data.businesses || [];
  } catch (err) {
    console.warn('Failed to fetch directory submissions:', err);
    return [];
  }
}

export async function moderateBusinessListing(businessId, newStatus, notes = '') {
  const res = await fetchWithAuth(`/admin/directory/${businessId}/moderate`, {
    method: 'POST',
    body: JSON.stringify({ status: newStatus, notes })
  });
  return await res.json();
}

export async function editBusinessListing(businessId, updates) {
  const res = await fetchWithAuth(`/admin/directory/${businessId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  return await res.json();
}

export async function deleteBusinessListing(businessId) {
  const res = await fetchWithAuth(`/admin/directory/${businessId}`, {
    method: 'DELETE'
  });
  return await res.json();
}

export async function getBusinessCorrections() {
  const res = await fetchWithAuth(`/admin/corrections`);
  const data = await res.json();
  return data.corrections || [];
}

export async function resolveBusinessCorrection(correctionId, status = 'resolved') {
  const res = await fetchWithAuth(`/admin/corrections/${correctionId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
  return await res.json();
}

export async function getInquiries(type = 'contact') {
  const res = await fetchWithAuth(`/admin/inquiries?type=${type}`);
  const data = await res.json();
  return data.inquiries || [];
}

export async function updateInquiryStatus(type, inquiryId, status) {
  const res = await fetchWithAuth(`/admin/inquiries/${type}/${inquiryId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  return await res.json();
}

export async function getAuditLogs() {
  const res = await fetchWithAuth(`/admin/audit-logs`);
  const data = await res.json();
  return data.logs || [];
}

export function getExportUrl(type) {
  const token = getStoredToken();
  return `${API_BASE}/admin/export/${type}?token=${token}`;
}

