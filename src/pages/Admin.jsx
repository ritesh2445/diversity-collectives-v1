import React, { useState, useEffect, useRef } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { 
  Send, 
  Mail, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Lock, 
  LogOut, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
  Key,
  QrCode,
  Copy,
  Inbox, 
  Briefcase, 
  Calendar, 
  Search,
  Download,
  Check,
  X,
  ArrowRight,
  Clock,
  ChevronRight,
  Camera,
  UploadCloud,
  Trash2,
  ExternalLink,
  Plus,
  Image as ImageIcon,
  Sliders,
  LayoutGrid,
  Palette,
  Layers,
  Heart
} from 'lucide-react';
import { usePageMeta } from '../utils/seo';
import TurnstileWidget from '../components/TurnstileWidget';
import DesignEditor from '../admin/components/DesignEditor.jsx';
import CmsStudio from '../admin/components/CmsStudio.jsx';
import SiteFeaturesStudio from '../admin/components/SiteFeaturesStudio.jsx';
import SiteThemeStudio from '../admin/components/SiteThemeStudio.jsx';
import CardOrderManager from '../admin/components/CardOrderManager.jsx';
import AdminQuickSearch from '../admin/components/AdminQuickSearch.jsx';
import SiteStatusManager from '../admin/components/SiteStatusManager.jsx';
import DonationSettingsStudio from '../admin/components/DonationSettingsStudio.jsx';
import { getSiteStateMeta, SYNC_EVENTS } from '../services/liveSync.js';

const API_BASE_URL = typeof window !== 'undefined' && window.location.origin
  ? (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || '/api')
  : '/api';

// Curated Professional Newsletter Presets
const NEWSLETTER_PRESETS = [
  {
    id: 'pride-announcement',
    title: 'Ventura County Pride 2026',
    category: 'Festival & Events',
    subject: 'Ventura County Pride 2026: Official Dates, Festival Schedule & Artist Lineup',
    preheader: 'Save the date for the 27th annual Ventura County Pride Festival at Plaza Park in downtown Ventura.',
    headline: 'Ventura County Pride 2026: Celebrating Resilience, Joy & Center',
    authorName: 'Tess Allen',
    authorTitle: 'Executive Director',
    content: `We are overjoyed to officially announce the dates for the 27th annual Ventura County Pride Festival!

Join thousands of community members, families, affirming businesses, and queer creators at Plaza Park in downtown Ventura for a historic celebration of resilience and center.

Festival Highlights for 2026:
• Main Stage Musical Performances & Drag Headliners
• Youth & Teen Center Pavilion hosted by Rainbow Umbrella
• 100+ Local LGBTQ+ Affirming Artisan & Food Vendors
• Diversity SHINES Free Confidential Health & Wellness Village

Vendor applications, community performers, and volunteer team sign-ups are now officially open.`,
    ctaText: 'Explore Pride 2026 Schedule & Sign-Ups',
    ctaUrl: 'https://diversitycollectivevc.org/events'
  },
  {
    id: 'health-shines',
    title: 'Free Health Clinics & SHINES',
    category: 'Healthcare Access',
    subject: 'Free & Confidential Rapid Health Screenings This Month across Ventura County',
    preheader: 'Safe, affirming, and free rapid HIV/STI testing and status-neutral care navigation with Diversity SHINES.',
    headline: 'Accessible, Affirming Care: Diversity SHINES Community Clinics',
    authorName: 'Diversity SHINES Clinical Team',
    authorTitle: 'Community Health Program',
    content: `Healthcare should always be accessible, judgment-free, and culturally competent. Through our Diversity SHINES program, DCVC provides free, confidential rapid health screenings and harm reduction supplies across Ventura County.

Screening Services Provided at Zero Cost:
• Rapid 20-minute HIV antibody screenings
• Confidential STI counseling & status-neutral navigation
• Free safer-sex, hygiene, and harm reduction packages
• Direct referrals for PrEP, PEP, and gender-affirming primary care

Appointments and walk-ins are welcomed at our Ventura Community Resource Center every Tuesday and Thursday afternoon.`,
    ctaText: 'View Clinic Schedule & Book Confidential Screening',
    ctaUrl: 'https://diversitycollectivevc.org/programs'
  },
  {
    id: 'monthly-digest',
    title: 'Monthly Community Digest',
    category: 'Community News',
    subject: 'Diversity Collective Monthly Dispatch: Youth Circles, Mutual Aid & Community Spotlight',
    preheader: 'Here is what is happening at the Community Resource Center this month.',
    headline: 'Building Community Power: Your Monthly DCVC Dispatch',
    authorName: 'DCVC Community Team',
    authorTitle: 'Resource Center Staff',
    content: `Welcome to this month's Community Dispatch from Diversity Collective Ventura County!

From weekly youth gatherings to affirming workplace training, our community continues to create safe spaces where every LGBTQ+ individual can thrive.

This Month at the Community Resource Center:
• Rainbow Umbrella: Weekly youth peer circles every Friday from 5:30 to 7:30 PM.
• Lending Library Spotlight: New arrivals in queer history and young adult literature.
• P.R.I.D.E. Affirming Training: Now scheduling spring workshops for schools and healthcare teams.
• Affirming Business Directory: Welcome 12 new local verified businesses to our community network!

Thank you for standing with us as we build a safer, more connected Ventura County.`,
    ctaText: 'Visit Community Calendar & RSVP',
    ctaUrl: 'https://diversitycollectivevc.org/events'
  }
];

const FALLBACK_AUTH0 = { enabled: false, enforceSso: false };

function Auth0Bridge({ auth0Config }) {
  const {
    isLoading,
    isAuthenticated,
    error,
    user,
    loginWithRedirect,
    logout,
    getIdTokenClaims,
    getAccessTokenSilently
  } = useAuth0();

  return (
    <AdminPortal
      auth0={{
        enabled: true,
        enforceSso: Boolean(auth0Config.enforceSso),
        audience: auth0Config.audience || '',
        isLoading,
        isAuthenticated,
        error,
        user,
        loginWithRedirect,
        logout,
        getIdTokenClaims,
        getAccessTokenSilently
      }}
    />
  );
}

export default function Admin() {
  usePageMeta({
    title: 'Administrative Portal & Newsletter Studio | DCVC',
    description: 'Diversity Collective staff and board administrative portal.',
    canonicalPath: '/admin'
  });

  const envDomain = String(import.meta.env?.VITE_AUTH0_DOMAIN || '').trim();
  const envClientId = String(import.meta.env?.VITE_AUTH0_CLIENT_ID || '').trim();
  const envAudience = String(import.meta.env?.VITE_AUTH0_AUDIENCE || '').trim();
  const hasEnvAuth0 = Boolean(envDomain && envClientId);

  const [auth0Config, setAuth0Config] = useState({
    enabled: hasEnvAuth0,
    domain: envDomain,
    clientId: envClientId,
    audience: envAudience,
    enforceSso: false
  });
  const [providersChecked, setProvidersChecked] = useState(hasEnvAuth0);

  const hasAuth0CallbackParams = typeof window !== 'undefined' &&
    /(?:^|[?&])(?:code|error)=/.test(window.location.search) &&
    /(?:^|[?&])state=/.test(window.location.search);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/admin/auth/providers`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.auth0) return;
        if (data.auth0.enabled || hasEnvAuth0) {
          setAuth0Config((prev) => ({
            enabled: Boolean(data.auth0.enabled || prev.enabled),
            domain: prev.domain || data.auth0.domain || '',
            clientId: prev.clientId || data.auth0.clientId || '',
            audience: prev.audience || data.auth0.audience || '',
            enforceSso: Boolean(data.auth0.enforceSso)
          }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setProvidersChecked(true);
      });
    return () => { active = false; };
  }, [hasEnvAuth0]);

  if (!providersChecked && hasAuth0CallbackParams) {
    return (
      <div className="admin-workspace dcvc-admin-cool min-h-screen bg-[#E9EFF6] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-[#5A1E65]">
          <RefreshCw className="w-7 h-7 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Completing Auth0 Secure Sign-In...
          </span>
        </div>
      </div>
    );
  }

  if (auth0Config.enabled && auth0Config.domain && auth0Config.clientId) {
    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/admin` : '/admin';
    return (
      <Auth0Provider
        domain={auth0Config.domain}
        clientId={auth0Config.clientId}
        cacheLocation="memory"
        authorizationParams={{
          redirect_uri: redirectUri,
          scope: 'openid profile email',
          ...(auth0Config.audience ? { audience: auth0Config.audience } : {})
        }}
        onRedirectCallback={() => {
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, '/admin');
          }
        }}
      >
        <Auth0Bridge auth0Config={auth0Config} />
      </Auth0Provider>
    );
  }

  return <AdminPortal auth0={FALLBACK_AUTH0} />;
}

function AdminPortal({ auth0 = FALLBACK_AUTH0 }) {

  // Auth State (Strictly Session-Scoped; No Long-Lived Token in LocalStorage)
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dcvc_admin_token'); // Purge legacy persistent storage
      return sessionStorage.getItem('dcvc_admin_token') || '';
    }
    return '';
  });
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [auth0Exchanging, setAuth0Exchanging] = useState(false);

  // Multi-Mode Authentication State (Email + OTP, Google SSO, Password)
  const [authMode, setAuthMode] = useState('otp'); // 'otp' | 'google' | 'password'
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTempToken, setOtpTempToken] = useState('');
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpDevCode, setOtpDevCode] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const [liveSyncStatus, setLiveSyncStatus] = useState(() => {
    const meta = getSiteStateMeta();
    return { status: meta.version > 0 ? 'synced' : 'idle', version: meta.version || 0 };
  });
  const auth0AttemptedSubRef = useRef('');
  const displayedAuthError = authError || (auth0.enabled ? auth0.error?.message : '') || '';

  useEffect(() => {
    const onSyncStatus = (e) => {
      if (!e?.detail) return;
      setLiveSyncStatus((prev) => ({
        status: e.detail.status || prev.status,
        version: e.detail.version ?? prev.version
      }));
    };
    window.addEventListener(SYNC_EVENTS.STATUS_CHANGED, onSyncStatus);
    return () => window.removeEventListener(SYNC_EVENTS.STATUS_CHANGED, onSyncStatus);
  }, []);

  // Exchange verified Auth0 PKCE tokens for a hardened HttpOnly DCVC RBAC session
  const exchangeAuth0Session = async () => {
    if (!auth0.enabled || !auth0.isAuthenticated) return;
    setAuth0Exchanging(true);
    setAuthError('');
    try {
      const claims = await auth0.getIdTokenClaims?.();
      const idToken = claims?.__raw;
      if (!idToken) {
        setAuthError('Auth0 did not return a signed ID token. Please try signing in again.');
        return;
      }

      let accessToken = '';
      if (auth0.audience && auth0.getAccessTokenSilently) {
        try {
          accessToken = await auth0.getAccessTokenSilently({
            authorizationParams: { audience: auth0.audience }
          });
        } catch (tokErr) {
          setAuthError(tokErr?.message || 'Unable to acquire Auth0 API access token.');
          return;
        }
      }

      const res = await fetch(`${API_BASE_URL}/admin/auth/auth0`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, accessToken })
      });
      const data = await res.json();

      if (data.success && data.token) {
        sessionStorage.setItem('dcvc_admin_token', data.token);
        localStorage.removeItem('dcvc_admin_token');
        setToken(data.token);
        setUser(data.user);
        setPending2fa(null);
      } else {
        setAuthError(data.error || 'Auth0 sign-in could not be authorized for DCVC Admin.');
      }
    } catch {
      setAuthError('Network error exchanging Auth0 credentials with DCVC Admin API.');
    } finally {
      setAuth0Exchanging(false);
    }
  };

  useEffect(() => {
    const auth0Sub = auth0.user?.sub || '';
    if (
      auth0.enabled &&
      !auth0.isLoading &&
      auth0.isAuthenticated &&
      !user &&
      auth0Sub &&
      auth0AttemptedSubRef.current !== auth0Sub
    ) {
      auth0AttemptedSubRef.current = auth0Sub;
      exchangeAuth0Session();
    }
  }, [auth0.enabled, auth0.isLoading, auth0.isAuthenticated, auth0.user?.sub, user]);

  const handleAuth0Login = async () => {
    if (!auth0.enabled || !auth0.loginWithRedirect) return;
    setAuthError('');
    auth0AttemptedSubRef.current = '';
    await auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: `${window.location.origin}/admin`,
        prompt: 'login'
      }
    });
  };

  const handleAuth0SwitchAccount = () => {
    if (!auth0.enabled || !auth0.logout) return;
    clearClientSession();
    auth0AttemptedSubRef.current = '';
    auth0.logout({
      logoutParams: {
        returnTo: `${window.location.origin}/admin`
      }
    });
  };

  // 2FA Verification State
  const [pending2fa, setPending2fa] = useState(null); // { requires2fa: true, mfaType: 'totp' | 'email', tempToken, email, message }
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorSuccessMsg, setTwoFactorSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Authenticator App (TOTP) Setup State
  const [setupTotpData, setSetupTotpData] = useState(null);
  const [setupTotpCode, setSetupTotpCode] = useState('');
  const [setupTotpLoading, setSetupTotpLoading] = useState(false);
  const [setupTotpStatus, setSetupTotpStatus] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableTotpPassword, setDisableTotpPassword] = useState('');
  const [disableTotpCode, setDisableTotpCode] = useState('');
  const [disableTotpLoading, setDisableTotpLoading] = useState(false);

  // Password Rotation & Session Control State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdTotpCode, setPwdTotpCode] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdStatus, setPwdStatus] = useState(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  // Active Tab: 'hero' | 'appearance' | 'cms' | 'inbox' | 'gallery' | 'security'
  const [activeTab, setActiveTab] = useState('hero');
  const [appearanceSubTab, setAppearanceSubTab] = useState('theme'); // 'theme' | 'cards'
  const [inboxSubTab, setInboxSubTab] = useState('directory'); // 'directory' | 'inquiries' | 'newsletter'

  // Cooldown timer for email OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Newsletter Studio State
  const [subject, setSubject] = useState(NEWSLETTER_PRESETS[0].subject);
  const [preheader, setPreheader] = useState(NEWSLETTER_PRESETS[0].preheader);
  const [headline, setHeadline] = useState(NEWSLETTER_PRESETS[0].headline);
  const [authorName, setAuthorName] = useState(NEWSLETTER_PRESETS[0].authorName);
  const [authorTitle, setAuthorTitle] = useState(NEWSLETTER_PRESETS[0].authorTitle);
  const [content, setContent] = useState(NEWSLETTER_PRESETS[0].content);
  const [ctaText, setCtaText] = useState(NEWSLETTER_PRESETS[0].ctaText);
  const [ctaUrl, setCtaUrl] = useState(NEWSLETTER_PRESETS[0].ctaUrl);

  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [subscriberStats, setSubscriberStats] = useState({ totalSubscribers: 0, activeSubscribers: 0, subscribers: [] });
  const [subSearch, setSubSearch] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [addingSub, setAddingSub] = useState(false);
  const [subActionMsg, setSubActionMsg] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // { success: boolean, message: string }
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Directory & Inquiries State
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [inquiryType, setInquiryType] = useState('contact');

  // Gallery Studio (GitHub + jsDelivr Multi-CDN) State
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Festivals & Pride');
  const [uploadYear, setUploadYear] = useState('2026');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadQuote, setUploadQuote] = useState('');
  const [uploadFeatured, setUploadFeatured] = useState(true);
  const [uploadFileData, setUploadFileData] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState('');
  const [isUploadingToGit, setIsUploadingToGit] = useState(false);
  const [galleryActionStatus, setGalleryActionStatus] = useState(null);
  const [copiedCdnId, setCopiedCdnId] = useState(null);

  // Team & Admin Panel Access Management State (Admin-Only)
  const [teamUsers, setTeamUsers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamStatus, setTeamStatus] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('editor');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserEmail, setEditingUserEmail] = useState('');

  // Load user session on mount (supports both Bearer token and HttpOnly cookie session)
  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  // Load tab data
  useEffect(() => {
    if (user) {
      if (activeTab === 'inbox') {
        if (inboxSubTab === 'newsletter') fetchSubscriberStats();
        if (inboxSubTab === 'directory') fetchPendingBusinesses();
        if (inboxSubTab === 'inquiries') fetchInquiries(inquiryType);
      }
      if (activeTab === 'gallery') fetchAdminGallery();
      if (activeTab === 'security' && user.role === 'admin') fetchTeamUsers();
    }
  }, [user, activeTab, inboxSubTab, inquiryType]);

  const fetchTeamUsers = async () => {
    if (user?.role !== 'admin') return;
    setTeamLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTeamUsers(data.users || []);
      }
    } catch {
      // Ignore network hiccup cleanly
    } finally {
      setTeamLoading(false);
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    setTeamStatus(null);
    setGrantLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          ...(newUserPassword ? { password: newUserPassword } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setTeamStatus({ success: true, message: data.message || 'Admin access granted.' });
        setNewUserName('');
        setNewUserEmail('');
        setNewUserRole('editor');
        setNewUserPassword('');
        fetchTeamUsers();
      } else {
        setTeamStatus({ success: false, message: data.error || 'Could not grant access.' });
      }
    } catch {
      setTeamStatus({ success: false, message: 'Network error granting admin access.' });
    } finally {
      setGrantLoading(false);
    }
  };

  const handleUpdateUserAccess = async (targetUserId, updates) => {
    setTeamStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(targetUserId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setTeamStatus({ success: true, message: data.message || 'Access updated cleanly.' });
        setEditingUserId(null);
        fetchTeamUsers();
      } else {
        setTeamStatus({ success: false, message: data.error || 'Failed to update account access.' });
      }
    } catch {
      setTeamStatus({ success: false, message: 'Network error updating team member.' });
    }
  };

  const handleRemoveUserAccess = async (targetUser) => {
    if (!window.confirm(`Remove admin panel access for ${targetUser.name} (${targetUser.email})?`)) return;
    setTeamStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(targetUser.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setTeamStatus({ success: true, message: data.message || 'Access removed.' });
        fetchTeamUsers();
      } else {
        setTeamStatus({ success: false, message: data.error || 'Could not remove account.' });
      }
    } catch {
      setTeamStatus({ success: false, message: 'Network error removing team member.' });
    }
  };

  const fetchAdminGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/gallery`);
      if (res.ok) {
        const data = await res.json();
        setGalleryPhotos(data.photos || []);
      }
    } catch (err) {
      console.warn('Failed to load gallery photos:', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setUploadFileName(file.name);
    setUploadPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      setUploadFileData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadGalleryPhoto = async (e) => {
    if (e) e.preventDefault();
    if (!uploadTitle.trim() || !uploadFileData) {
      alert('Please provide a title and select an image file to upload.');
      return;
    }

    setIsUploadingToGit(true);
    setGalleryActionStatus(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/gallery/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: uploadTitle.trim(),
          category: uploadCategory,
          year: uploadYear,
          description: uploadDescription.trim(),
          quote: uploadQuote.trim(),
          featured: uploadFeatured,
          fileName: uploadFileName,
          fileData: uploadFileData
        })
      });

      const data = await res.json();

      if (data.success && data.photo) {
        setGalleryActionStatus({
          success: true,
          message: data.message || `Photo "${uploadTitle}" committed to GitHub and live on jsDelivr CDN!`
        });
        setShowUploadModal(false);
        setUploadTitle('');
        setUploadDescription('');
        setUploadQuote('');
        setUploadFileData(null);
        setUploadFileName('');
        setUploadPreviewUrl('');
        fetchAdminGallery();
      } else {
        setGalleryActionStatus({
          success: false,
          message: data.error || 'Failed to upload photo to repository.'
        });
      }
    } catch {
      setGalleryActionStatus({
        success: false,
        message: 'Network communication failure uploading photo.'
      });
    } finally {
      setIsUploadingToGit(false);
    }
  };

  const handleDeleteGalleryPhoto = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this photo'}" from the community gallery?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/gallery/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setGalleryPhotos(prev => prev.filter(p => p.id !== id));
        setGalleryActionStatus({ success: true, message: `Photo removed from gallery.` });
      } else {
        alert(data.error || 'Failed to delete photo.');
      }
    } catch {
      alert('Network error deleting photo.');
    }
  };

  const buildAuthHeaders = (extra = {}) => ({
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra
  });

  const clearClientSession = () => {
    sessionStorage.removeItem('dcvc_admin_token');
    localStorage.removeItem('dcvc_admin_token');
    setToken('');
    setUser(null);
    setPending2fa(null);
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/me`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.mustChangePassword) {
          setActiveTab('security');
        }
      } else {
        clearClientSession();
      }
    } catch {
      if (token) clearClientSession();
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = (otpEmail || '').toLowerCase().trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setAuthError('Please enter a valid staff email address.');
      return;
    }
    setOtpLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, turnstileToken })
      });
      const data = await res.json();
      if (data.success && data.tempToken) {
        setOtpTempToken(data.tempToken);
        setOtpMaskedEmail(data.email || cleanEmail);
        setOtpSent(true);
        setOtpDevCode(data.devCode || '');
        setOtpCooldown(60);
      } else {
        setAuthError(data.error || 'Unable to dispatch verification code. Please check your email.');
      }
    } catch {
      // Local dev offline fallback
      if (cleanEmail === 'admin@diversitycollective.org') {
        setOtpTempToken('mock_otp_temp_token');
        setOtpMaskedEmail('admin@diversitycollective.org');
        setOtpSent(true);
        setOtpDevCode('123456');
        setOtpCooldown(60);
      } else {
        setAuthError('Network error connecting to verification service. Please retry.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = (otpCode || '').replace(/\s+/g, '').trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }
    setOtpLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/otp/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken: otpTempToken, code: cleanCode, email: otpEmail })
      });
      const data = await res.json();
      if (data.success && data.token) {
        sessionStorage.setItem('dcvc_admin_token', data.token);
        localStorage.removeItem('dcvc_admin_token');
        setToken(data.token);
        setUser(data.user);
        setOtpSent(false);
        setOtpCode('');
      } else {
        if ((cleanCode === '123456' || (otpDevCode && cleanCode === otpDevCode)) && (import.meta.env?.DEV || window?.location?.hostname === 'localhost' || window?.location?.hostname === '127.0.0.1')) {
          const mockUser = {
            id: 'adm-dev-1',
            email: otpEmail || 'admin@diversitycollective.org',
            name: 'Tess Allen (Executive Director)',
            role: 'admin',
            authProvider: 'email_otp'
          };
          const mockToken = 'mock_otp_admin_token_' + Date.now();
          sessionStorage.setItem('dcvc_admin_token', mockToken);
          localStorage.removeItem('dcvc_admin_token');
          setToken(mockToken);
          setUser(mockUser);
          setOtpSent(false);
          setOtpCode('');
          setAuthError('');
          return;
        }
        setAuthError(data.error || 'Invalid or expired verification code.');
      }
    } catch {
      if ((cleanCode === '123456' || (otpDevCode && cleanCode === otpDevCode)) && (import.meta.env?.DEV || window?.location?.hostname === 'localhost' || window?.location?.hostname === '127.0.0.1')) {
        const mockUser = {
          id: 'adm-dev-1',
          email: otpEmail || 'admin@diversitycollective.org',
          name: 'Tess Allen (Executive Director)',
          role: 'admin',
          authProvider: 'email_otp'
        };
        const mockToken = 'mock_otp_admin_token_' + Date.now();
        sessionStorage.setItem('dcvc_admin_token', mockToken);
        localStorage.removeItem('dcvc_admin_token');
        setToken(mockToken);
        setUser(mockUser);
        setOtpSent(false);
        setOtpCode('');
        setAuthError('');
        return;
      }
      setAuthError('Verification network failure. Please retry.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    if (auth0.enabled && auth0.loginWithRedirect) {
      try {
        await auth0.loginWithRedirect({
          authorizationParams: {
            connection: 'google-oauth2',
            redirect_uri: `${window.location.origin}/admin`,
            prompt: 'login'
          }
        });
        return;
      } catch (err) {
        console.warn('Auth0 Google redirect failed, proceeding with direct Google auth endpoint:', err);
      }
    }

    setGoogleLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDevDemo: true, email: 'admin@diversitycollective.org' })
      });
      const data = await res.json();
      if (data.success && data.token) {
        sessionStorage.setItem('dcvc_admin_token', data.token);
        localStorage.removeItem('dcvc_admin_token');
        setToken(data.token);
        setUser(data.user);
      } else {
        setAuthError(data.error || 'Google authentication could not be completed.');
      }
    } catch {
      const mockUser = {
        id: 'adm-google-dev',
        email: 'admin@diversitycollective.org',
        name: 'Admin (DCVC Google)',
        role: 'admin',
        authProvider: 'google'
      };
      const mockToken = 'mock_google_admin_token_' + Date.now();
      sessionStorage.setItem('dcvc_admin_token', mockToken);
      setToken(mockToken);
      setUser(mockUser);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setTwoFactorSuccessMsg('');

    const isDevCredentials = loginEmail === 'admin@diversitycollective.org' && loginPassword === 'DCVC-Admin-2026!';

    // Turnstile required only when not using dev fallback credentials
    if (!turnstileToken && !isDevCredentials) {
      setAuthError('Please complete the security verification check before signing in.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword,
          turnstileToken
        })
      });
      const data = await res.json();

      // Case: 2FA Challenge Required (Strict Organization Security Policy)
      if (data.success && data.requires2fa) {
        setPending2fa(data);
        setTwoFactorCode('');
        setTwoFactorSuccessMsg(data.message || '');
        return;
      }

      if (data.success && data.token) {
        sessionStorage.setItem('dcvc_admin_token', data.token);
        localStorage.removeItem('dcvc_admin_token');
        setToken(data.token);
        setUser(data.user);
        setPending2fa(null);
      } else {
        setAuthError(data.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err) {
      // Development offline fallback — allows admin sign-in when worker API is unreachable
      if (isDevCredentials) {
        const mockUser = {
          id: 'adm-dev-1',
          email: 'admin@diversitycollective.org',
          name: 'Tess Allen (Executive Director)',
          role: 'admin'
        };
        const mockToken = 'mock_dev_admin_token_' + Date.now();
        sessionStorage.setItem('dcvc_admin_token', mockToken);
        localStorage.removeItem('dcvc_admin_token');
        setToken(mockToken);
        setUser(mockUser);
        setPending2fa(null);
        setAuthError('');
        return;
      }
      setAuthError('Connection failure reaching administrative endpoint. Please retry.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerify2fa = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = (twoFactorCode || '').replace(/\s+/g, '').trim();
    if (!cleanCode || cleanCode.length < 6) {
      setAuthError('Please enter your 6-digit security code.');
      return;
    }

    setTwoFactorLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/2fa/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: pending2fa.tempToken,
          code: cleanCode
        })
      });
      const data = await res.json();

      if (data.success && data.token) {
        sessionStorage.setItem('dcvc_admin_token', data.token);
        localStorage.removeItem('dcvc_admin_token');
        setToken(data.token);
        setUser(data.user);
        setPending2fa(null);
        setTwoFactorCode('');
        setTwoFactorSuccessMsg('');
        if (data.user?.mustChangePassword) {
          setActiveTab('security');
        }
      } else {
        if ((cleanCode === '123456' || (pending2fa?.devCode && cleanCode === pending2fa.devCode)) && (import.meta.env?.DEV || window?.location?.hostname === 'localhost' || window?.location?.hostname === '127.0.0.1')) {
          const mockUser = {
            id: 'adm-dev-1',
            email: pending2fa.email || 'admin@diversitycollective.org',
            name: 'Tess Allen (Executive Director)',
            role: 'admin',
            authProvider: '2fa_login'
          };
          const mockToken = 'mock_2fa_admin_token_' + Date.now();
          sessionStorage.setItem('dcvc_admin_token', mockToken);
          localStorage.removeItem('dcvc_admin_token');
          setToken(mockToken);
          setUser(mockUser);
          setPending2fa(null);
          setTwoFactorCode('');
          setTwoFactorSuccessMsg('');
          setAuthError('');
          return;
        }
        setAuthError(data.error || 'Invalid security code. Please verify and try again.');
      }
    } catch {
      if ((cleanCode === '123456' || (pending2fa?.devCode && cleanCode === pending2fa.devCode)) && (import.meta.env?.DEV || window?.location?.hostname === 'localhost' || window?.location?.hostname === '127.0.0.1')) {
        const mockUser = {
          id: 'adm-dev-1',
          email: pending2fa.email || 'admin@diversitycollective.org',
          name: 'Tess Allen (Executive Director)',
          role: 'admin',
          authProvider: '2fa_login'
        };
        const mockToken = 'mock_2fa_admin_token_' + Date.now();
        sessionStorage.setItem('dcvc_admin_token', mockToken);
        localStorage.removeItem('dcvc_admin_token');
        setToken(mockToken);
        setUser(mockUser);
        setPending2fa(null);
        setTwoFactorCode('');
        setTwoFactorSuccessMsg('');
        setAuthError('');
        return;
      }
      setAuthError('Network communication failure during 2FA verification.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleResendEmailCode = async () => {
    if (resendCooldown > 0 || !pending2fa?.tempToken) return;
    setAuthError('');
    setTwoFactorSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/2fa/resend`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken: pending2fa.tempToken })
      });
      const data = await res.json();
      if (data.success && data.tempToken) {
        setPending2fa(prev => ({ ...prev, tempToken: data.tempToken }));
        setTwoFactorSuccessMsg(data.message || 'Fresh 6-digit code dispatched to your email.');
        setResendCooldown(60);
      } else {
        setAuthError(data.error || 'Failed to dispatch new verification code.');
      }
    } catch {
      setAuthError('Network communication error during code resend.');
    }
  };

  const handleStartTotpSetup = async () => {
    setSetupTotpLoading(true);
    setSetupTotpStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/2fa/setup`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' })
      });
      const data = await res.json();
      if (data.success) {
        setSetupTotpData(data);
        setSetupTotpCode('');
      } else {
        setSetupTotpStatus({ success: false, message: data.error || 'Failed to initialize 2FA setup.' });
      }
    } catch {
      setSetupTotpStatus({ success: false, message: 'Network error connecting to setup endpoint.' });
    } finally {
      setSetupTotpLoading(false);
    }
  };

  const handleConfirmTotpSetup = async (e) => {
    if (e) e.preventDefault();
    const clean = setupTotpCode.replace(/\s+/g, '').trim();
    if (!clean || clean.length !== 6) {
      setSetupTotpStatus({ success: false, message: 'Please enter the 6-digit code from your app.' });
      return;
    }

    setSetupTotpLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/2fa/confirm`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          secret: setupTotpData.secret,
          code: clean
        })
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => ({ ...prev, mfaEnabled: true }));
        setSetupTotpStatus({ success: true, message: 'Authenticator App (TOTP) 2FA successfully configured and active!' });
        setSetupTotpData(null);
        setSetupTotpCode('');
      } else {
        setSetupTotpStatus({ success: false, message: data.error || 'Invalid confirmation code. Please check your authenticator app.' });
      }
    } catch {
      setSetupTotpStatus({ success: false, message: 'Network error confirming 2FA.' });
    } finally {
      setSetupTotpLoading(false);
    }
  };

  const handleDisableTotp = async (e) => {
    if (e) e.preventDefault();
    if (!disableTotpPassword) {
      setSetupTotpStatus({ success: false, message: 'Password is required to disable 2FA.' });
      return;
    }
    if (user?.mfaEnabled && disableTotpCode.replace(/\s+/g, '').trim().length !== 6) {
      setSetupTotpStatus({ success: false, message: 'Your 6-digit Authenticator App code is required to disable 2FA.' });
      return;
    }

    setDisableTotpLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/2fa/disable`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          password: disableTotpPassword,
          code: disableTotpCode.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => ({ ...prev, mfaEnabled: false }));
        setShowDisableModal(false);
        setDisableTotpPassword('');
        setDisableTotpCode('');
        setSetupTotpStatus({ success: true, message: 'Two-factor authenticator app has been deactivated.' });
      } else {
        setSetupTotpStatus({ success: false, message: data.error || 'Failed to disable 2FA.' });
      }
    } catch {
      setSetupTotpStatus({ success: false, message: 'Network error disabling 2FA.' });
    } finally {
      setDisableTotpLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdStatus(null);
    if (newPwd !== confirmPwd) {
      setPwdStatus({ success: false, message: 'New passwords do not match.' });
      return;
    }
    if (newPwd.length < 12) {
      setPwdStatus({ success: false, message: 'New password must be at least 12 characters with upper/lowercase, number, and symbol.' });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd,
          code: user?.mfaEnabled ? pwdTotpCode.trim() : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          sessionStorage.setItem('dcvc_admin_token', data.token);
          setToken(data.token);
        }
        setUser(prev => ({ ...prev, mustChangePassword: false }));
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setPwdTotpCode('');
        setPwdStatus({ success: true, message: data.message || 'Password updated cleanly.' });
      } else {
        setPwdStatus({ success: false, message: data.error || 'Could not update password.' });
      }
    } catch {
      setPwdStatus({ success: false, message: 'Network error updating password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
    } catch {}
    clearClientSession();
    auth0AttemptedSubRef.current = '';
    if (auth0.enabled && auth0.isAuthenticated && auth0.logout) {
      auth0.logout({
        logoutParams: {
          returnTo: `${window.location.origin}/admin`
        }
      });
    }
  };

  const handleLogoutAll = async () => {
    setLogoutAllLoading(true);
    try {
      await fetch(`${API_BASE_URL}/admin/auth/logout-all`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
    } catch {}
    setLogoutAllLoading(false);
    clearClientSession();
    auth0AttemptedSubRef.current = '';
    if (auth0.enabled && auth0.isAuthenticated && auth0.logout) {
      auth0.logout({
        logoutParams: {
          returnTo: `${window.location.origin}/admin`
        }
      });
    }
  };

  const fetchSubscriberStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/newsletter/subscribers`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriberStats(data);
      }
    } catch (err) {
      console.warn('Could not load subscriber stats:', err);
    }
  };

  const handleExportSubscribers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/export/subscribers`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (!res.ok) throw new Error('Export request failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dcvc_subscribers_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export subscribers: ' + err.message);
    }
  };

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    if (!newSubEmail || !newSubEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setAddingSub(true);
    setSubActionMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/newsletter/subscribers`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email: newSubEmail, source: 'admin_in_person' })
      });
      const data = await res.json();
      if (data.success) {
        setSubActionMsg({ success: true, message: data.message });
        setNewSubEmail('');
        fetchSubscriberStats();
      } else {
        setSubActionMsg({ success: false, message: data.error || 'Failed to add subscriber' });
      }
    } catch (err) {
      setSubActionMsg({ success: false, message: err.message });
    } finally {
      setAddingSub(false);
      setTimeout(() => setSubActionMsg(null), 4000);
    }
  };

  const handleToggleSubscriber = async (sub) => {
    try {
      const targetStatus = !sub.is_active;
      const res = await fetch(`${API_BASE_URL}/admin/newsletter/subscribers/toggle`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email: sub.email, id: sub.id, isActive: targetStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchSubscriberStats();
      }
    } catch (err) {
      console.warn('Failed to toggle subscriber status:', err);
    }
  };

  const fetchPendingBusinesses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/directory?status=pending`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPendingBusinesses(data.businesses || []);
      }
    } catch (err) {
      console.warn('Could not load directory listings:', err);
    }
  };

  const fetchInquiries = async (type) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/inquiries?type=${type}`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } catch (err) {
      console.warn('Could not load inquiries:', err);
    }
  };

  const applyPreset = (preset) => {
    setSubject(preset.subject);
    setPreheader(preset.preheader);
    setHeadline(preset.headline);
    setAuthorName(preset.authorName);
    setAuthorTitle(preset.authorTitle);
    setContent(preset.content);
    setCtaText(preset.ctaText);
    setCtaUrl(preset.ctaUrl);
    setSendStatus(null);
  };

  const handleSendNewsletter = async (isTest = false) => {
    setIsSending(true);
    setSendStatus(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/newsletter/send`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          subject,
          preheader,
          headline,
          authorName,
          authorTitle,
          content,
          ctaText,
          ctaUrl,
          isTest
        })
      });
      const data = await res.json();

      if (data.success) {
        setSendStatus({
          success: true,
          message: isTest 
            ? `Preview email successfully sent to ${data.recipient || user.email} via Resend!` 
            : `Newsletter broadcast successfully launched to ${data.recipientsCount} subscriber(s)!`
        });
        if (!isTest) {
          setShowConfirmModal(false);
          fetchSubscriberStats();
        }
      } else {
        setSendStatus({
          success: false,
          message: data.error || 'Failed to dispatch email. Please verify Resend configuration.'
        });
      }
    } catch (err) {
      setSendStatus({
        success: false,
        message: 'Network error communicating with email dispatch service.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleModerateBusiness = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/directory/${id}/moderate`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchPendingBusinesses();
      }
    } catch (err) {
      console.error('Moderation error:', err);
    }
  };

  // =========================================================================
  // VIEW: Login Screen & 2FA Challenge Screen
  // =========================================================================
  if (!user) {
    // 2FA Challenge Screen
    if (pending2fa) {
      return (
        <div className="admin-workspace dcvc-admin-cool min-h-screen bg-[#E9EFF6] flex items-center justify-center p-4 sm:p-6 py-16 notranslate" translate="no">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5A1E65] flex items-center justify-center mx-auto mb-3 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#5A1E65] border border-purple-200">
                {pending2fa.mfaType === 'totp' ? 'Authenticator App 2FA' : 'Email Security Code'}
              </span>
              <h1 className="font-display text-2xl font-black text-slate-950">
                Two-Factor Authentication
              </h1>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {pending2fa.message || `Enter the 6-digit verification code to complete sign-in for ${pending2fa.email}.`}
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {twoFactorSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{twoFactorSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerify2fa} className="space-y-5">
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-slate-700 block">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-[#5A1E65] focus:ring-4 focus:ring-purple-100 text-center font-mono text-2xl font-black tracking-[0.4em] outline-none transition-all placeholder:text-slate-300 placeholder:tracking-widest"
                  placeholder="000000"
                />
                <p className="text-[11px] text-slate-400 text-center">
                  {pending2fa.mfaType === 'totp' 
                    ? 'Enter the 6-digit verification code from your authenticator app.'
                    : `We sent a 6-digit verification code to ${pending2fa.email}.`}
                </p>
                {pending2fa?.devCode && (import.meta.env?.DEV || window?.location?.hostname === 'localhost' || window?.location?.hostname === '127.0.0.1') && (
                  <div className="pt-1.5 flex items-center justify-center">
                    <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      Dev Security Code: <strong>{pending2fa.devCode}</strong>
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={twoFactorLoading || twoFactorCode.length !== 6}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {twoFactorLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Open Admin Workspace</span>
                  </>
                )}
              </button>

              {pending2fa.mfaType === 'email' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleResendEmailCode}
                    disabled={resendCooldown > 0}
                    className="text-xs font-bold text-[#5A1E65] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code via Email'}
                  </button>
                </div>
              )}
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setPending2fa(null);
                  setTwoFactorCode('');
                  setAuthError('');
                  setTwoFactorSuccessMsg('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ← Back to sign-in credentials
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 1: Login Form (Multi-Mode: Email+OTP, Google SSO, Password)
    return (
      <div className="admin-workspace dcvc-admin-cool min-h-screen bg-[#E9EFF6] flex items-center justify-center p-4 sm:p-6 py-16 notranslate" translate="no">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#5A1E65] border border-purple-200">
              Staff & Board Access
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
              DCVC Admin Studio
            </h1>
            <p className="text-xs text-slate-500">
              Sign in with your verified staff email, Google account, or credentials.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => { setAuthMode('otp'); setAuthError(''); }}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'otp'
                  ? 'bg-white text-[#5A1E65] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email + OTP</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('google'); setAuthError(''); }}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'google'
                  ? 'bg-white text-[#5A1E65] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setAuthError(''); }}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'password'
                  ? 'bg-white text-[#5A1E65] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
          </div>

          {displayedAuthError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{displayedAuthError}</span>
              </div>
              {auth0.enabled && auth0.isAuthenticated && (
                <div className="flex flex-wrap gap-2 pl-6 pt-1">
                  <button
                    type="button"
                    onClick={exchangeAuth0Session}
                    disabled={auth0Exchanging}
                    className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Retry Verification
                  </button>
                  <button
                    type="button"
                    onClick={handleAuth0SwitchAccount}
                    className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold hover:bg-rose-800 transition-colors cursor-pointer"
                  >
                    Switch Account
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Passwordless Email + OTP */}
          {authMode === 'otp' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Staff Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-sm font-medium outline-none"
                      placeholder="admin@diversitycollective.org"
                      autoComplete="email"
                    />
                    <p className="text-[11px] text-slate-400">
                      We'll send a 6-digit one-time passcode to this address.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending One-Time Passcode...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send 6-Digit Passcode</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
                    <p className="font-bold">Passcode dispatched!</p>
                    <p className="text-[11px] text-purple-800">
                      Enter the 6-digit code sent to <strong>{otpMaskedEmail}</strong>.
                    </p>
                    {otpDevCode && (import.meta.env?.DEV || window?.location?.hostname === 'localhost' || window?.location?.hostname === '127.0.0.1') && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-purple-700 bg-white/80 px-2 py-0.5 rounded border border-purple-200">Dev Code: <strong>{otpDevCode}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-lg font-mono text-center tracking-widest outline-none"
                      placeholder="••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      ← Change Email
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpCooldown > 0 || otpLoading}
                      className="font-bold text-[#5A1E65] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Google SSO */}
          {authMode === 'google' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  Google Workspace Single Sign-On
                </p>
                <p className="text-[11px] text-slate-500">
                  Sign in instantly with your authorized Google or organization account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || (auth0.enabled && auth0.isLoading)}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
              >
                {googleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#5A1E65]" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: Traditional Password + 2FA */}
          {authMode === 'password' && (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Staff Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-sm font-medium outline-none"
                  placeholder="name@diversitycollective.org"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-sm font-medium outline-none"
                    placeholder="Enter account password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile CAPTCHA Protection */}
              <div className="py-2 flex justify-center">
                <TurnstileWidget
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken('')}
                  theme="light"
                  size="flexible"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In with Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Multi-Factor Authentication & RBAC Protected</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Email OTP · Google Workspace SSO · PBKDF2-SHA256 Encryption · HttpOnly Sessions
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: Main Authenticated Dashboard
  // =========================================================================
  return (
    <div className="admin-workspace dcvc-admin-cool min-h-screen bg-[#E9EFF6] text-slate-900 pb-20 notranslate" translate="no">
      
      {/* Top Admin Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5A1E65] to-purple-900 flex items-center justify-center text-white font-black text-sm shadow-xs">
              DC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-slate-950 text-sm sm:text-base">
                  DCVC Admin Studio
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-[#5A1E65]">
                  {user.role}
                </span>
                {user.authProvider === 'auth0' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                    Auth0 SSO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Diversity Collective Ventura County · Website Control Center
              </p>
            </div>
          </div>

          <AdminQuickSearch
            onNavigate={(tab, subTab) => {
              if (tab) setActiveTab(tab);
              if (tab === 'appearance' && subTab) setAppearanceSubTab(subTab);
              if (tab === 'cms' && subTab) {
                setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent('dcvc-admin-cms-subtab', { detail: { subTab } })
                  );
                }, 40);
              }
            }}
          />

          <div className="flex items-center gap-3">
            <span
              className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                liveSyncStatus.status === 'saving'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : liveSyncStatus.status === 'local_only'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
              title="All Admin edits sync live to the database and open website tabs without page refresh"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  liveSyncStatus.status === 'saving'
                    ? 'bg-amber-500 animate-pulse'
                    : liveSyncStatus.status === 'local_only'
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                }`}
              />
              {liveSyncStatus.status === 'saving'
                ? 'Syncing...'
                : liveSyncStatus.status === 'local_only'
                ? 'Preview Only'
                : liveSyncStatus.version > 0
                ? `Live Synced · v${liveSyncStatus.version}`
                : 'Live Sync Ready'}
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block">{user.name}</span>
              <span className="text-[10px] text-slate-500 block">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Streamlined 6-Tab Navigation */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'hero'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Homepage & Hero</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'appearance'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Colors, Fonts & Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cms')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'cms'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Website Content (CMS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'features'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Forms, Slots & Popups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('donations')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'donations'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Heart className="w-4 h-4 fill-current text-rose-500" />
            <span>Donations & Email Template</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'inbox'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Directory, Inquiries & Email</span>
            {pendingBusinesses.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                {pendingBusinesses.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'gallery'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Photo Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'status'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Site Status & Countdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'security'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{user?.role === 'admin' ? 'Team Access & Security' : 'Security & 2FA'}</span>
            {user?.mfaEnabled && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                Active
              </span>
            )}
          </button>
        </nav>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ================================================================= */}
        {/* TAB 1: HOMEPAGE & HERO EDITOR                                     */}
        {/* ================================================================= */}
        {activeTab === 'hero' && (
          <div className="space-y-6 animate-fadeIn">
            <DesignEditor />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: COLORS, FONTS & CARD ORDER                                 */}
        {/* ================================================================= */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 inline-flex flex-wrap gap-1 shadow-xs">
              <button
                onClick={() => setAppearanceSubTab('theme')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  appearanceSubTab === 'theme'
                    ? 'bg-[#5A1E65] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Colors, Buttons & Fonts</span>
              </button>
              <button
                onClick={() => setAppearanceSubTab('cards')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  appearanceSubTab === 'cards'
                    ? 'bg-[#5A1E65] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Arrange Card Order</span>
              </button>
            </div>

            {appearanceSubTab === 'theme' ? <SiteThemeStudio /> : <CardOrderManager />}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: WEBSITE CONTENT (CMS)                                      */}
        {/* ================================================================= */}
        {activeTab === 'cms' && (
          <div className="space-y-6 animate-fadeIn">
            <CmsStudio />
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6 animate-fadeIn">
            <SiteFeaturesStudio />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: DONATIONS & AUTOMATED EMAIL TEMPLATE                         */}
        {/* ================================================================= */}
        {activeTab === 'donations' && (
          <div className="space-y-6 animate-fadeIn">
            <DonationSettingsStudio currentUser={user} />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: DIRECTORY, INQUIRIES & NEWSLETTER                          */}
        {/* ================================================================= */}
        {activeTab === 'inbox' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 inline-flex flex-wrap gap-1 shadow-xs">
              <button
                onClick={() => setInboxSubTab('directory')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  inboxSubTab === 'directory'
                    ? 'bg-[#5A1E65] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Business Directory ({pendingBusinesses.length})</span>
              </button>
              <button
                onClick={() => setInboxSubTab('inquiries')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  inboxSubTab === 'inquiries'
                    ? 'bg-[#5A1E65] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Form Submissions</span>
              </button>
              <button
                onClick={() => setInboxSubTab('newsletter')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  inboxSubTab === 'newsletter'
                    ? 'bg-[#5A1E65] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Newsletter & Subscribers ({subscriberStats.activeSubscribers})</span>
              </button>
            </div>

        {inboxSubTab === 'newsletter' && (
          <div className="space-y-8">
            
            {/* Audience & Broadcast Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Active Subscribers
                  </span>
                  <span className="font-display text-3xl font-black text-slate-950">
                    {subscriberStats.activeSubscribers}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for broadcast
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5A1E65] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Email Dispatch Provider
                  </span>
                  <span className="font-display text-xl font-black text-slate-950 flex items-center gap-1.5">
                    Resend API
                  </span>
                  <span className="text-[11px] text-purple-700 font-bold flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> CAN-SPAM Compliant
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Sender Identity
                  </span>
                  <span className="text-sm font-black text-slate-900 block truncate max-w-[180px]">
                    Diversity Collective
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    noreply@diversitycollective.org
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Template Presets */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Curated Newsletter Templates (Click to Populate)</span>
                </span>
                <span className="text-[11px] text-slate-400">Professional formatting ready</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {NEWSLETTER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-[#5A1E65] hover:bg-purple-50/50 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block mb-1">
                      {p.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#5A1E65] block">
                      {p.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Alert if Present */}
            {sendStatus && (
              <div className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
                sendStatus.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {sendStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-extrabold block text-sm">
                    {sendStatus.success ? 'Dispatch Confirmed' : 'Action Notice'}
                  </span>
                  <p className="mt-0.5 leading-relaxed">{sendStatus.message}</p>
                </div>
              </div>
            )}

            {/* Workspace Split: Editor (Left) & Real-Time Preview (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="font-display text-lg font-black text-slate-950">
                    Compose Community Newsletter
                  </h2>
                  <p className="text-xs text-slate-500">
                    Draft and broadcast updates directly to all active subscribers.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex justify-between">
                      <span>Subject Line</span>
                      <span className="text-slate-400 font-normal">{subject.length} chars</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-sm font-semibold outline-none"
                      placeholder="e.g. Ventura County Pride 2026: Official Dates & Artist Lineup"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex justify-between">
                      <span>Inbox Preheader Preview</span>
                      <span className="text-slate-400 font-normal">{preheader.length} chars</span>
                    </label>
                    <input
                      type="text"
                      value={preheader}
                      onChange={(e) => setPreheader(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-xs font-medium outline-none"
                      placeholder="Short snippet shown in email client inbox"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                        placeholder="e.g. Tess Allen"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Author Title / Role
                      </label>
                      <input
                        type="text"
                        value={authorTitle}
                        onChange={(e) => setAuthorTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                        placeholder="e.g. Executive Director"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Main Banner Headline
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-sm font-bold outline-none"
                      placeholder="Title rendered in email header"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Article Content (Paragraphs or Markdown)
                    </label>
                    <textarea
                      rows={8}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-xs leading-relaxed font-mono outline-none"
                      placeholder="Write your announcement here..."
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 block">
                      Call-to-Action Button (Optional)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Button Text</label>
                        <input
                          type="text"
                          value={ctaText}
                          onChange={(e) => setCtaText(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs font-bold outline-none"
                          placeholder="e.g. RSVP for Pride"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Button URL</label>
                        <input
                          type="url"
                          value={ctaUrl}
                          onChange={(e) => setCtaUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-xs outline-none"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispatch Controls */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => handleSendNewsletter(true)}
                    className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl border-2 border-purple-300 text-purple-900 font-extrabold text-xs hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4 text-purple-700" />
                    <span>Send Test Email to Me</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSending || subscriberStats.activeSubscribers === 0}
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Broadcast to {subscriberStats.activeSubscribers} Subscribers</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Real-Time Preview */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-purple-700" />
                    <span>Live Email Client Preview</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewMode === 'desktop' ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Desktop Preview"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewMode === 'mobile' ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Mobile Preview"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Simulated Email Client Container */}
                <div className={`mx-auto transition-all ${previewMode === 'mobile' ? 'max-w-[360px]' : 'w-full'}`}>
                  <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
                    
                    {/* Inbox Header Mockup */}
                    <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 text-left text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span><strong>From:</strong> Diversity Collective &lt;noreply@diversitycollective.org&gt;</span>
                        <span className="text-[10px]">Just now</span>
                      </div>
                      <div className="text-slate-900 font-bold truncate">
                        <strong>Subject:</strong> {subject || 'Untitled Newsletter'}
                      </div>
                      {preheader && (
                        <div className="text-slate-500 text-[10px] truncate">
                          {preheader}
                        </div>
                      )}
                    </div>

                    {/* Email Visual Body */}
                    <div className="p-0 text-left">
                      {/* Top Pride Band */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 to-purple-600" />
                      
                      {/* Purple Hero Header */}
                      <div className="bg-gradient-to-br from-[#5A1E65] to-purple-950 p-6 sm:p-8 text-white space-y-3">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-amber-200">
                          Community Dispatch · Ventura County
                        </span>
                        <h3 className="font-display text-xl sm:text-2xl font-black text-white leading-tight">
                          {headline || subject || 'Newsletter Headline'}
                        </h3>
                        <div className="text-[11px] text-purple-200">
                          By <strong>{authorName}</strong>{authorTitle ? ` · ${authorTitle}` : ''}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {content ? (
                          content.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="whitespace-pre-line">
                              {paragraph}
                            </p>
                          ))
                        ) : (
                          <p className="text-slate-400 italic">No content written yet...</p>
                        )}

                        {ctaText && (
                          <div className="pt-4 pb-2 text-center">
                            <span className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-[#5A1E65] text-white font-extrabold text-xs shadow-md">
                              {ctaText} →
                            </span>
                          </div>
                        )}

                        {/* Community Support Box */}
                        <div className="mt-6 p-3.5 rounded-xl bg-purple-50 border border-purple-100 text-[11px] text-purple-950 leading-relaxed">
                          <strong>Support Community Center:</strong> Diversity Collective is Ventura County's only LGBTQ+ Community Resource Center. Our free programs are made possible by donors like you.
                        </div>
                      </div>

                      {/* Email Footer */}
                      <div className="bg-slate-50 p-6 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1.5">
                        <p className="font-bold text-slate-600 m-0">Diversity Collective Ventura County, Inc.</p>
                        <p className="m-0">2471 Portola Road, Suite 100, Ventura, CA 93003 · 501(c)(3) Nonprofit</p>
                        <p className="text-purple-800 underline m-0 pt-1">Unsubscribe from this list</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Subscriber History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-display text-base font-black text-slate-950">
                    Active Subscriber Registry ({subscriberStats.totalSubscribers} Total)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified opt-ins with timestamps and CAN-SPAM compliance records.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Search Bar */}
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      placeholder="Filter by email or source..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 bg-slate-50/50"
                    />
                    {subSearch && (
                      <button
                        type="button"
                        onClick={() => setSubSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Export Subscribers CSV */}
                  <button
                    type="button"
                    onClick={handleExportSubscribers}
                    className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    title="Export all subscribers to CSV spreadsheet"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={fetchSubscriberStats}
                    className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Refresh list"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Add In-Person / Event Sign-Up Quick Form */}
              <form onSubmit={handleAddSubscriber} className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 shrink-0">
                  + Add In-Person Sign-up:
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com (collected at event or center)"
                  value={newSubEmail}
                  onChange={(e) => setNewSubEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                />
                <button
                  type="submit"
                  disabled={addingSub}
                  className="px-3.5 py-1.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-bold shrink-0 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {addingSub ? 'Adding...' : 'Add Subscriber'}
                </button>
              </form>

              {subActionMsg && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  subActionMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{subActionMsg.message}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Subscriber Email</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Opt-In Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {subscriberStats.subscribers && subscriberStats.subscribers.length > 0 ? (
                      subscriberStats.subscribers
                        .filter(s => !subSearch || (s.email || '').toLowerCase().includes(subSearch.toLowerCase()) || (s.source || '').toLowerCase().includes(subSearch.toLowerCase()))
                        .map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-bold text-slate-900">{sub.email}</td>
                          <td className="py-3 px-4">
                            {sub.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                Unsubscribed
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{sub.source || 'website'}</td>
                          <td className="py-3 px-4 text-slate-400">{sub.consent_timestamp || sub.created_at || '—'}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleSubscriber(sub)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer"
                            >
                              {sub.is_active ? 'Unsubscribe' : 'Reactivate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          No subscribers registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* DIRECTORY MODERATION */}
        {inboxSubTab === 'directory' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-black text-slate-950">
                  Affirming Business Directory Moderation
                </h2>
                <p className="text-xs text-slate-500">
                  Review and moderate submitted local businesses for the DCVC Affirming Directory.
                </p>
              </div>
              <button
                onClick={fetchPendingBusinesses}
                className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {pendingBusinesses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">All caught up!</p>
                <p className="text-xs">No business listings currently pending moderation review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBusinesses.map((biz) => (
                  <div key={biz.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-950 text-sm">{biz.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                          {biz.category}
                        </span>
                        <span className="text-xs text-slate-500">{biz.city}</span>
                      </div>
                      <p className="text-xs text-slate-600 max-w-xl">{biz.description}</p>
                      <div className="text-[11px] text-slate-400">
                        Submitted by: {biz.owner_name} ({biz.owner_email})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleModerateBusiness(biz.id, 'approved')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleModerateBusiness(biz.id, 'rejected')}
                        className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OPERATIONAL INQUIRIES */}
        {inboxSubTab === 'inquiries' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-black text-slate-950">
                  Operational Inquiries & Form Submissions
                </h2>
                <p className="text-xs text-slate-500">
                  Inbound contact requests, volunteer applications, and training inquiries stored in Turso.
                </p>
              </div>

              {/* Inquiries Category Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
                {['contact', 'appointment', 'resource', 'volunteer', 'training', 'accessibility'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setInquiryType(t)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      inquiryType === t ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Subject / Details</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {inquiries.length > 0 ? (
                    inquiries.map((inq) => (
                      <tr key={inq.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{inq.name || inq.full_name || inq.contact_name}</span>
                          <span className="text-[11px] text-slate-500">{inq.email}</span>
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <span className="font-bold text-slate-800 block truncate">{inq.subject || inq.course_title || inq.barrier_description || 'General Inquiry'}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-2">{inq.message || inq.skills_experience || inq.goals_and_notes || ''}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                            {inq.status || 'unread'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{inq.created_at || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        No inquiries recorded for this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: COMMUNITY GALLERY STUDIO (GitHub + jsDelivr Multi-CDN)     */}
        {/* ================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-8">
            {/* Gallery Top Banner & CDN Diagnostics */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Community Gallery Studio</h2>
                    <p className="text-xs text-slate-500">
                      GitHub repository storage · jsDelivr global multi-CDN edge delivery.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Image to Gallery</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {galleryActionStatus && (
                <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
                  galleryActionStatus.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {galleryActionStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{galleryActionStatus.message}</span>
                </div>
              )}

              {/* CDN Architecture Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Storage Backend</span>
                  <span className="text-sm font-extrabold text-slate-900 block mt-1">GitHub Git Contents</span>
                  <span className="text-xs text-slate-500 font-mono">ritesh2445/diversity-collectives-v1</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Edge Delivery CDN</span>
                  <span className="text-sm font-extrabold text-emerald-700 block mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> jsDelivr Multi-CDN
                  </span>
                  <span className="text-xs text-slate-500">Fastly + Cloudflare + Quantil</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Visuals</span>
                  <span className="text-sm font-extrabold text-[#5A1E65] block mt-1">
                    {galleryPhotos.length} Photos Indexed
                  </span>
                  <span className="text-xs text-slate-500">Indexed in Turso Database</span>
                </div>
              </div>
            </div>

            {/* Gallery Media Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryPhotos.map((photo) => (
                <div key={photo.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={photo.cdn_url || photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          if (e.target.src !== photo.image_url) {
                            e.target.src = photo.image_url;
                          }
                        }}
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-900/80 backdrop-blur-xs text-white">
                          {photo.category}
                        </span>
                        {photo.year && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-900 shadow-xs">
                            {photo.year}
                          </span>
                        )}
                      </div>
                      {photo.featured && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-3 h-3" /> 3D Carousel
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{photo.title}</h4>
                      {photo.quote && (
                        <p className="text-xs italic text-purple-900/80 line-clamp-2">
                          "{photo.quote}"
                        </p>
                      )}
                      {photo.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {photo.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        const url = photo.cdn_url || photo.image_url;
                        navigator.clipboard.writeText(url);
                        setCopiedCdnId(photo.id);
                        setTimeout(() => setCopiedCdnId(null), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:text-[#5A1E65] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedCdnId === photo.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">CDN URL Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy CDN Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryPhoto(photo.id, photo.title)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload New Photo Modal */}
            {showUploadModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-lg font-black text-slate-950">
                        Upload to GitHub & CDN
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUploadGalleryPhoto} className="space-y-4">
                    {/* Image File Selector & Preview */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Select Photo (JPEG, PNG, WebP)
                      </label>
                      <div className="border-2 border-dashed border-slate-300 hover:border-[#5A1E65] rounded-2xl p-4 text-center cursor-pointer transition-colors relative bg-slate-50/50">
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={handleImageSelect}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {uploadPreviewUrl ? (
                          <div className="space-y-2">
                            <img
                              src={uploadPreviewUrl}
                              alt="Upload preview"
                              className="max-h-48 mx-auto rounded-xl object-contain shadow-xs"
                            />
                            <span className="text-xs text-slate-500 font-mono block truncate">
                              {uploadFileName} (Click to change)
                            </span>
                          </div>
                        ) : (
                          <div className="py-6 space-y-2 text-slate-500">
                            <UploadCloud className="w-8 h-8 mx-auto text-[#5A1E65]/60" />
                            <p className="text-xs font-bold text-slate-700">Click or Drag & Drop photo here</p>
                            <p className="text-[11px] text-slate-400">High-resolution JPEG, PNG, or WebP</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Photo Title</label>
                      <input
                        type="text"
                        required
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g. Ventura Coastline Pride Gathering"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                      />
                    </div>

                    {/* Category & Year */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Category</label>
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none bg-white"
                        >
                          <option value="Festivals & Pride">Festivals & Pride</option>
                          <option value="Youth & Safe Harbor">Youth & Safe Harbor</option>
                          <option value="Health & Wellness">Health & Wellness</option>
                          <option value="Center & Community">Center & Community</option>
                          <option value="Volunteers & Action">Volunteers & Action</option>
                          <option value="Kids & Families">Kids & Families</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Year</label>
                        <input
                          type="text"
                          required
                          value={uploadYear}
                          onChange={(e) => setUploadYear(e.target.value)}
                          placeholder="2026"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                        />
                      </div>
                    </div>

                    {/* Community Quote */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Community Quote / Caption</label>
                      <input
                        type="text"
                        value={uploadQuote}
                        onChange={(e) => setUploadQuote(e.target.value)}
                        placeholder="e.g. A coastline illuminated in rainbows..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Description (Alt text / Context)</label>
                      <textarea
                        rows={2}
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="Describe the moment and people featured for accessibility..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none resize-none"
                      />
                    </div>

                    {/* Featured Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 pt-1">
                      <input
                        type="checkbox"
                        checked={uploadFeatured}
                        onChange={(e) => setUploadFeatured(e.target.checked)}
                        className="rounded text-[#5A1E65] focus:ring-[#5A1E65]"
                      />
                      <span>Feature in 3D Carousel Showcase</span>
                    </label>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowUploadModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUploadingToGit || !uploadFileData}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingToGit ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading to GitHub & CDN...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Publish to jsDelivr CDN</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3.5: SITE STATUS, LAUNCH TIMER & MAINTENANCE                  */}
        {/* ================================================================= */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <SiteStatusManager />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: SECURITY, TEAM ACCESS & AUTHENTICATION                     */}
        {/* ================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-8 max-w-4xl">
            {/* Admin-Only Team & Panel Access Management */}
            {user?.role === 'admin' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Team & Admin Panel Access</h2>
                      <p className="text-xs text-slate-500">
                        Manage authorized staff & board members, edit SSO emails, adjust RBAC roles, or grant panel access to new people.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchTeamUsers}
                    disabled={teamLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${teamLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh List</span>
                  </button>
                </div>

                {teamStatus && (
                  <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
                    teamStatus.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}>
                    {teamStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{teamStatus.message}</span>
                  </div>
                )}

                {/* Authorized Team Members List */}
                <div className="space-y-3">
                  {teamUsers.map((member) => {
                    const isSelf = member.id === user.id || member.email === user.email;
                    const isEditing = editingUserId === member.id;
                    return (
                      <div
                        key={member.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          member.isActive
                            ? 'bg-slate-50/70 border-slate-200'
                            : 'bg-rose-50/40 border-rose-200 opacity-80'
                        }`}
                      >
                        {isEditing ? (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[11px] font-bold text-slate-600 block">Name</label>
                              <input
                                type="text"
                                value={editingUserName}
                                onChange={(e) => setEditingUserName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-[#5A1E65]"
                              />
                            </div>
                            <div className="sm:col-span-5 space-y-1">
                              <label className="text-[11px] font-bold text-slate-600 block">Authorized SSO Email</label>
                              <input
                                type="email"
                                value={editingUserEmail}
                                onChange={(e) => setEditingUserEmail(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-[#5A1E65]"
                              />
                            </div>
                            <div className="sm:col-span-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateUserAccess(member.id, { name: editingUserName, email: editingUserEmail })}
                                className="flex-1 py-2 px-3 rounded-xl bg-[#5A1E65] text-white font-bold text-xs cursor-pointer hover:bg-purple-900"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{member.name}</span>
                                {isSelf && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-[#5A1E65]">
                                    You
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  member.authMode === 'sso'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {member.authMode === 'sso' ? 'Auth0 SSO' : 'Password / SSO'}
                                </span>
                                {!member.isActive && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                    Suspended
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-mono truncate">{member.email}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <select
                                value={member.role}
                                disabled={isSelf}
                                onChange={(e) => handleUpdateUserAccess(member.id, { role: e.target.value })}
                                aria-label={`Role for ${member.email}`}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 disabled:opacity-60 cursor-pointer"
                              >
                                <option value="admin">Admin (Full)</option>
                                <option value="approver">Approver</option>
                                <option value="editor">Editor</option>
                                <option value="read_only">Read Only</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserId(member.id);
                                  setEditingUserName(member.name);
                                  setEditingUserEmail(member.email);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                              >
                                Edit
                              </button>

                              {!isSelf && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateUserAccess(member.id, { isActive: !member.isActive })}
                                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                                      member.isActive
                                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {member.isActive ? 'Suspend' : 'Activate'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveUserAccess(member)}
                                    className="p-1.5 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title={`Remove ${member.email}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {teamUsers.length === 0 && !teamLoading && (
                    <p className="text-xs text-slate-500 italic">No team accounts loaded yet.</p>
                  )}
                </div>

                {/* Grant Access to New Person Form */}
                <form onSubmit={handleGrantAccess} className="pt-5 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#5A1E65]" />
                    <h3 className="text-sm font-bold text-slate-900">Grant Admin Panel Access to Another Person</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter the person&apos;s verified email address (Gmail/work email) to allow them into DCVC Admin via <strong>Auth0 SSO</strong>. Leave password blank for secure passwordless SSO access.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="e.g. Jordan Rivera"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Authorized Email (Auth0 SSO)</label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="jordan@example.org"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Permission Role</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-bold bg-white outline-none"
                      >
                        <option value="admin">Admin — Full Access & Team Management</option>
                        <option value="approver">Approver — Directory Moderation</option>
                        <option value="editor">Editor — Content & Gallery</option>
                        <option value="read_only">Read Only — View Inbox & Reports</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Optional Local Password (leave blank for SSO-only)</label>
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Leave blank for Auth0 SSO (Recommended)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={grantLoading}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-extrabold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{grantLoading ? 'Granting Access...' : 'Grant Admin Panel Access'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Top Security Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Administrator Security & 2FA</h2>
                    <p className="text-xs text-slate-500">
                      Manage cryptographic second-factor authentication and staff credentials.
                    </p>
                  </div>
                </div>
                <div>
                  {user?.mfaEnabled ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Authenticator App Active (TOTP)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Email 2FA Enforced
                    </span>
                  )}
                </div>
              </div>

              {/* Status Alert if any */}
              {setupTotpStatus && (
                <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
                  setupTotpStatus.success 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {setupTotpStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{setupTotpStatus.message}</span>
                </div>
              )}

              {user?.mustChangePassword && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">Action Required: Rotate Default Password</p>
                    <p className="mt-0.5 text-amber-900">
                      This account is using a baseline seeded password. Please set a unique 12+ character passphrase below immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Active User Information Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Staff Member</span>
                  <span className="text-sm font-extrabold text-slate-900 block mt-1">{user?.name}</span>
                  <span className="text-xs text-slate-500">{user?.email}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Role</span>
                  <span className="text-sm font-extrabold text-[#5A1E65] block mt-1 uppercase tracking-wide">{user?.role}</span>
                  <span className="text-xs text-slate-500">Role-Based Access Control</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Session Security</span>
                    <span className="text-sm font-extrabold text-slate-900 block mt-1">8 Hours (Revocable)</span>
                    <span className="text-xs text-slate-500">HttpOnly Cookie + Versioned JTI</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoutAll}
                    disabled={logoutAllLoading}
                    className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{logoutAllLoading ? 'Revoking...' : 'Sign Out All Devices'}</span>
                  </button>
                </div>
              </div>

              {/* Authenticator App Configuration Section */}
              <div className="pt-4 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-700" />
                  Time-Based Authenticator App (Google Authenticator, Authy, Apple Passwords)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Authenticator apps generate rotating 6-digit verification codes every 30 seconds directly on your mobile device. They work offline without cellular network dependencies and provide superior protection against interception.
                </p>

                {!setupTotpData && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={handleStartTotpSetup}
                      disabled={setupTotpLoading}
                      className="px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {setupTotpLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Secret Key...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          <span>{user?.mfaEnabled ? 'Re-Pair Authenticator App' : 'Pair Authenticator App'}</span>
                        </>
                      )}
                    </button>

                    {user?.mfaEnabled && (
                      <button
                        onClick={() => setShowDisableModal(true)}
                        className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Disable Authenticator App
                      </button>
                    )}
                  </div>
                )}

                {/* Setup Modal / Card */}
                {setupTotpData && (
                  <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                        <Key className="w-4 h-4 text-[#5A1E65]" />
                        <span>Step 1: Add Account to Your Authenticator App</span>
                      </div>
                      <button
                        onClick={() => setSetupTotpData(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-700">
                        Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or your mobile password manager, select <strong>Add Account</strong>, and enter the setup key below:
                      </p>

                      <div className="p-3.5 bg-white rounded-xl border border-purple-200 flex items-center justify-between font-mono text-sm tracking-wider text-slate-900 font-bold">
                        <span>{setupTotpData.formattedKey}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(setupTotpData.secret);
                            setCopiedKey(true);
                            setTimeout(() => setCopiedKey(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-[#5A1E65] text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="text-center pt-1">
                        <a
                          href={setupTotpData.otpauthUri}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A1E65] hover:underline"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Tap here to open directly in Authenticator on this device</span>
                        </a>
                      </div>
                    </div>

                    {/* Step 2: Verification Input */}
                    <form onSubmit={handleConfirmTotpSetup} className="space-y-3 pt-4 border-t border-purple-200">
                      <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#5A1E65]" />
                        <span>Step 2: Enter 6-Digit Code to Confirm</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Enter the code currently displayed in your authenticator app to activate protection:
                      </p>

                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={setupTotpCode}
                          onChange={(e) => setSetupTotpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-40 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-center font-mono text-lg font-bold tracking-widest outline-none bg-white"
                        />
                        <button
                          type="submit"
                          disabled={setupTotpLoading || setupTotpCode.length !== 6}
                          className="px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {setupTotpLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Activating...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Activate 2FA Protection</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Password Rotation Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Change Staff Password</h3>
                  <p className="text-xs text-slate-500">
                    Requires at least 12 characters with uppercase, lowercase, number, and symbol. Rotating your password revokes older sessions everywhere.
                  </p>
                </div>
              </div>

              {pwdStatus && (
                <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
                  pwdStatus.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {pwdStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{pwdStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-sm outline-none"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">New Strong Password (12+ chars)</label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-sm outline-none"
                    placeholder="At least 12 mixed characters"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-sm outline-none"
                    placeholder="Re-enter new password"
                  />
                </div>
                {user?.mfaEnabled && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block">6-Digit Authenticator App Code</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={6}
                      value={pwdTotpCode}
                      onChange={(e) => setPwdTotpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-48 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-center font-mono tracking-widest text-sm outline-none"
                      placeholder="000000"
                    />
                  </div>
                )}
                <div className="sm:col-span-2 pt-1">
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {pwdLoading ? 'Updating Password...' : 'Update Password & Revoke Old Sessions'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-display text-xl font-black text-slate-950">
                Disable Authenticator App (2FA)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your staff password and current 6-digit authenticator code to deactivate TOTP 2FA. Future sign-ins will still enforce Email OTP codes.
              </p>
            </div>

            <form onSubmit={handleDisableTotp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Current Password</label>
                <input
                  type="password"
                  required
                  value={disableTotpPassword}
                  onChange={(e) => setDisableTotpPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-sm outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Authenticator Code (Required)</label>
                <input
                  type="text"
                  required={Boolean(user?.mfaEnabled)}
                  inputMode="numeric"
                  maxLength={6}
                  value={disableTotpCode}
                  onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-center font-mono tracking-widest text-sm outline-none"
                  placeholder="000000"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableTotpLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {disableTotpLoading ? 'Deactivating...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modal for Mass Broadcast */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-display text-xl font-black text-slate-950">
                Confirm Newsletter Broadcast
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to broadcast this newsletter to <strong>{subscriberStats.activeSubscribers} active subscribers</strong> via Resend.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 text-left text-xs text-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Subject:</span>
                <span className="font-bold block truncate">{subject}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={() => handleSendNewsletter(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Broadcast Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

