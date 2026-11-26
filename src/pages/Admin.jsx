import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import QRCode from 'qrcode';
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
  KeyRound,
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
  Heart,
  Edit,
  MapPin,
  Phone,
  Globe,
  Filter,
  Mic,
  Volume2,
  Play,
  Pause,
  Lightbulb,
  History,
  RotateCcw
} from 'lucide-react';
import { businessDirectorySeed } from '../data/dcvcData';
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
import SponsorshipManager from '../admin/components/SponsorshipManager.jsx';
import ImagePicker from '../admin/components/ImagePicker.jsx';
import VoicemailItemRow from '../components/VoicemailItemRow.jsx';
import { getSiteStateMeta, SYNC_EVENTS, fetchAndApplyLiveSiteState, applySiteStatePayload } from '../services/liveSync.js';
import { cmsStore } from '../services/cmsStore.js';
import { getMediaSuggestions, updateMediaSuggestion, deleteMediaSuggestion } from '../admin/services/cmsClient.js';
import { setStoredToken } from '../admin/services/adminClient.js';
import {
  ADMIN_SECTIONS,
  canAccessAdminTab,
  canAccessInboxSubTab,
  getFirstAllowedAdminTab,
  isSectionRestrictedUser,
  formatSectionLabels
} from '../admin/permissions.js';

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
    ctaUrl: 'https://diversitycollective.org/events'
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
    ctaUrl: 'https://diversitycollective.org/programs'
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
    ctaUrl: 'https://diversitycollective.org/events'
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

  const [auth0Config, setAuth0Config] = useState(() => {
    let cached = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dcvc_auth0_config');
        if (stored) cached = JSON.parse(stored);
      } catch {}
    }
    const domain = envDomain || cached?.domain || '';
    const clientId = envClientId || cached?.clientId || '';
    const audience = envAudience || '';
    const enabled = Boolean(hasEnvAuth0 || (cached?.enabled && domain && clientId));
    return {
      enabled,
      domain,
      clientId,
      audience,
      enforceSso: Boolean(cached?.enforceSso)
    };
  });
  const [providersChecked, setProvidersChecked] = useState(() => hasEnvAuth0 || Boolean(auth0Config.domain && auth0Config.clientId));

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
          const merged = {
            enabled: Boolean(data.auth0.enabled || hasEnvAuth0),
            domain: data.auth0.domain || envDomain || '',
            clientId: data.auth0.clientId || envClientId || '',
            audience: data.auth0.audience !== undefined ? data.auth0.audience : (envAudience || ''),
            enforceSso: Boolean(data.auth0.enforceSso)
          };
          setAuth0Config((prev) => {
            if (
              prev.enabled === merged.enabled &&
              prev.domain === merged.domain &&
              prev.clientId === merged.clientId &&
              prev.audience === merged.audience &&
              prev.enforceSso === merged.enforceSso
            ) {
              return prev;
            }
            return merged;
          });
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('dcvc_auth0_config', JSON.stringify(merged));
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setProvidersChecked(true);
      });
    return () => { active = false; };
  }, [hasEnvAuth0, envDomain, envClientId, envAudience]);

  if (!providersChecked && !auth0Config.domain) {
    return (
      <div className="admin-workspace dcvc-admin-cool min-h-screen bg-[#E9EFF6] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-[#5A1E65]">
          <RefreshCw className="w-7 h-7 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            {hasAuth0CallbackParams ? 'Completing Auth0 Secure Sign-In...' : 'Loading DCVC Admin Suite...'}
          </span>
        </div>
      </div>
    );
  }

  if (auth0Config.enabled && auth0Config.domain && auth0Config.clientId) {
    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/admin` : '/admin';
    return (
      <Auth0Provider
        key={`${auth0Config.domain}:${auth0Config.clientId}`}
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

  // Auth State: Authenticated via secure HttpOnly session cookies (zero tokens in client storage)
  const [token, setToken] = useState('');
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('dcvc_admin_token');
        localStorage.removeItem('dcvc_admin_token');
        const stored = sessionStorage.getItem('dcvc_admin_user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);

  useEffect(() => {
    if (isVerifyingSession) {
      const timer = setTimeout(() => setIsVerifyingSession(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isVerifyingSession]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const isPreviewHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.pages.dev') ||
    window.location.hostname.endsWith('.workers.dev')
  );
  const [turnstileToken, setTurnstileToken] = useState(() => isPreviewHost ? 'cf-preview-bypass-token' : '');
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
  const rawAuth0Error = auth0.enabled ? (auth0.error?.message || '') : '';
  const friendlyAuth0Error = /invalid state/i.test(rawAuth0Error)
    ? 'Sign-in session expired or state mismatch. Please click "Sign In with Google" again.'
    : rawAuth0Error;
  const displayedAuthError = authError || friendlyAuth0Error || '';

  // Clean stale Auth0 callback query params (?code=...&state=...&error=...) if Auth0 reports an error
  useEffect(() => {
    if (auth0.enabled && auth0.error && typeof window !== 'undefined') {
      if (/(?:^|[?&])(?:code|state|error)=/.test(window.location.search)) {
        window.history.replaceState({}, document.title, '/admin');
      }
    }
  }, [auth0.enabled, auth0.error]);

  useEffect(() => {
    // Immediately fetch latest authoritative server state when Admin mounts
    fetchAndApplyLiveSiteState({ force: true }).catch(() => {});

    // Periodic live sync poll every 15 seconds to ensure teammates see each other's changes
    const pollInterval = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchAndApplyLiveSiteState().catch(() => {});
      }
    }, 15000);

    const onSyncStatus = (e) => {
      if (!e?.detail) return;
      setLiveSyncStatus((prev) => ({
        status: e.detail.status || prev.status,
        version: e.detail.version ?? prev.version
      }));
    };
    window.addEventListener(SYNC_EVENTS.STATUS_CHANGED, onSyncStatus);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener(SYNC_EVENTS.STATUS_CHANGED, onSyncStatus);
    };
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
        setClientSession(data.token, data.user);
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
  const [setupQrDataUrl, setSetupQrDataUrl] = useState('');
  const [setupTotpCode, setSetupTotpCode] = useState('');
  const [setupTotpLoading, setSetupTotpLoading] = useState(false);
  const [setupTotpStatus, setSetupTotpStatus] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableTotpPassword, setDisableTotpPassword] = useState('');
  const [disableTotpCode, setDisableTotpCode] = useState('');
  const [disableTotpLoading, setDisableTotpLoading] = useState(false);

  // Superadmin: Team Member Password Modal State
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [modalPasswordLoading, setModalPasswordLoading] = useState(false);
  const [modalPasswordSuccess, setModalPasswordSuccess] = useState(null);
  const [modalPasswordError, setModalPasswordError] = useState('');
  const [copiedModalPassword, setCopiedModalPassword] = useState(false);

  // Password Rotation & Session Control State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdTotpCode, setPwdTotpCode] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdStatus, setPwdStatus] = useState(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  // Active Tab: 'hero' | 'appearance' | 'cms' | 'inbox' | 'gallery' | 'logs' | 'security'
  const [activeTab, setActiveTab] = useState('hero');
  const [appearanceSubTab, setAppearanceSubTab] = useState('theme'); // 'theme' | 'cards'
  const [inboxSubTab, setInboxSubTab] = useState('directory'); // 'directory' | 'inquiries' | 'newsletter'

  // Activity Logs & 5-Step Undo State
  const [auditLogs, setAuditLogs] = useState([]);
  const [undoHistory, setUndoHistory] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [undoConfirmOpen, setUndoConfirmOpen] = useState(false);
  const [undoLoading, setUndoLoading] = useState(false);
  const [undoFeedback, setUndoFeedback] = useState(null);

  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail?.tab) setActiveTab(e.detail.tab);
    };
    window.addEventListener('dcvc_navigate_admin_tab', handleNav);
    return () => window.removeEventListener('dcvc_navigate_admin_tab', handleNav);
  }, []);

  // Cooldown timer for email OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Dynamically generate Authenticator App QR Code data URL when enrollment data arrives
  useEffect(() => {
    if (setupTotpData?.otpauthUri) {
      QRCode.toDataURL(setupTotpData.otpauthUri, {
        width: 240,
        margin: 2,
        color: {
          dark: '#5A1E65',
          light: '#FFFFFF'
        }
      }).then((url) => {
        setSetupQrDataUrl(url);
      }).catch((err) => {
        console.warn('Could not generate QR code data URL:', err);
      });
    } else {
      setSetupQrDataUrl('');
    }
  }, [setupTotpData]);

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
  const [showImportSubs, setShowImportSubs] = useState(false);
  const [importSubText, setImportSubText] = useState('');
  const [importSubSource, setImportSubSource] = useState('admin_bulk_import');
  const [importingSubs, setImportingSubs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // { success: boolean, message: string }
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Directory & Inquiries State
  const [directoryBusinesses, setDirectoryBusinesses] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dcvc_live_directory_businesses');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return businessDirectorySeed;
  });
  const [directoryFilter, setDirectoryFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryActionMsg, setDirectoryActionMsg] = useState(null);
  const [directoryDeletingId, setDirectoryDeletingId] = useState(null);
  const [isSeedingDirectory, setIsSeedingDirectory] = useState(false);
  const [showBizModal, setShowBizModal] = useState(false);
  const [editingBiz, setEditingBiz] = useState(null);
  const [bizModalSaving, setBizModalSaving] = useState(false);
  const [bizFormData, setBizFormData] = useState({
    name: '',
    category: 'Dining & Coffee',
    city: 'Ventura',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    owner_name: '',
    owner_email: '',
    is_featured: false,
    is_verified: true,
    status: 'approved'
  });

  const directoryCounts = useMemo(() => {
    const all = directoryBusinesses.length;
    const approved = directoryBusinesses.filter(b => b.status === 'approved').length;
    const pending = directoryBusinesses.filter(b => b.status === 'pending').length;
    const rejected = directoryBusinesses.filter(b => b.status === 'rejected' || b.status === 'archived').length;
    return { all, approved, pending, rejected };
  }, [directoryBusinesses]);

  const pendingBusinesses = useMemo(() => {
    return directoryBusinesses.filter(b => b.status === 'pending');
  }, [directoryBusinesses]);

  const filteredDirectoryBusinesses = useMemo(() => {
    return directoryBusinesses.filter(biz => {
      // Status filter
      if (directoryFilter === 'approved' && biz.status !== 'approved') return false;
      if (directoryFilter === 'pending' && biz.status !== 'pending') return false;
      if (directoryFilter === 'rejected' && biz.status !== 'rejected' && biz.status !== 'archived') return false;

      // Search filter
      if (directorySearch.trim()) {
        const q = directorySearch.toLowerCase();
        const matchesName = (biz.name || '').toLowerCase().includes(q);
        const matchesCat = (biz.category || '').toLowerCase().includes(q);
        const matchesCity = (biz.city || '').toLowerCase().includes(q);
        const matchesOwner = (biz.owner_name || biz.ownerName || '').toLowerCase().includes(q);
        const matchesDesc = (biz.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesCity && !matchesOwner && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  }, [directoryBusinesses, directoryFilter, directorySearch]);

  const [inquiries, setInquiries] = useState([]);
  const [inquiryType, setInquiryType] = useState('contact');
  const [selectedInquiryView, setSelectedInquiryView] = useState(null);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [showAddInquiryModal, setShowAddInquiryModal] = useState(false);
  const [newInquiryForm, setNewInquiryForm] = useState(null);

  // Voicemail Inbox State
  const [voicemails, setVoicemails] = useState([]);
  const [voicemailStatusFilter, setVoicemailStatusFilter] = useState('all');
  const [mediaSuggestions, setMediaSuggestions] = useState([]);
  const [mediaSuggestionStatusFilter, setMediaSuggestionStatusFilter] = useState('all');
  const [mediaSuggestionSearch, setMediaSuggestionSearch] = useState('');
  const [voicemailSearch, setVoicemailSearch] = useState('');
  const [playingVoicemailId, setPlayingVoicemailId] = useState(null);

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
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserEmail, setEditingUserEmail] = useState('');
  const [dispatchingOtpId, setDispatchingOtpId] = useState(null);
  const [newUserUseCustomSections, setNewUserUseCustomSections] = useState(false);
  const [newUserAllowedSections, setNewUserAllowedSections] = useState(['community']);
  const [sectionsModalUser, setSectionsModalUser] = useState(null);
  const [sectionsModalSaving, setSectionsModalSaving] = useState(false);

  // Load user session on mount via HttpOnly cookie and listen for cross-tab auth state events
  useEffect(() => {
    fetchCurrentUser();

    let authChannel = null;
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        authChannel = new BroadcastChannel('dcvc_admin_auth');
        authChannel.onmessage = (event) => {
          if (event?.data?.type === 'ADMIN_AUTH_LOGOUT') {
            setUser(null);
            setToken('');
            setPending2fa(null);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem('dcvc_admin_user');
            }
          } else if (event?.data?.type === 'ADMIN_AUTH_STATE_CHANGED') {
            fetchCurrentUser();
          }
        };
      } catch {}
    }

    return () => {
      if (authChannel) {
        try { authChannel.close(); } catch {}
      }
    };
  }, []);

  // Enforce valid landing tab/subtab & load permitted tab data
  useEffect(() => {
    if (!user) return;
    if (!canAccessAdminTab(user, activeTab)) {
      const nextTab = getFirstAllowedAdminTab(user);
      if (nextTab !== activeTab) {
        setActiveTab(nextTab);
        return;
      }
    }
    if (activeTab === 'inbox') {
      if (!canAccessInboxSubTab(user, inboxSubTab)) {
        const firstSub = ['directory', 'inquiries', 'voicemail', 'suggestions', 'newsletter'].find((t) => canAccessInboxSubTab(user, t));
        if (firstSub && firstSub !== inboxSubTab) {
          setInboxSubTab(firstSub);
          return;
        }
      }
      if (inboxSubTab === 'newsletter' && canAccessInboxSubTab(user, 'newsletter')) fetchSubscriberStats();
      if (inboxSubTab === 'directory' && canAccessInboxSubTab(user, 'directory')) fetchDirectoryBusinesses();
      if (inboxSubTab === 'inquiries' && canAccessInboxSubTab(user, 'inquiries')) fetchInquiries(inquiryType);
      if (inboxSubTab === 'voicemail' && canAccessInboxSubTab(user, 'voicemail')) fetchVoicemails();
      if (inboxSubTab === 'suggestions' && canAccessInboxSubTab(user, 'suggestions')) fetchMediaSuggestions();
    }
    if (activeTab === 'gallery' && canAccessAdminTab(user, 'gallery')) fetchAdminGallery();
    if (activeTab === 'security' && user.role === 'admin') fetchTeamUsers();
    if (activeTab === 'logs') fetchAuditLogs();
  }, [user, activeTab, inboxSubTab, inquiryType]);

  // Keep undo availability count in sync after live state changes
  useEffect(() => {
    if (user) {
      fetchAuditLogs();
    }
  }, [user, liveSyncStatus.version]);

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
        setUndoHistory(Array.isArray(data.undoHistory) ? data.undoHistory : []);
      }
    } catch {
      // Ignore network hiccup cleanly
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDeleteAuditLogs = async () => {
    if (!window.confirm('Are you sure you want to delete all recorded activity logs? This cannot be undone.')) {
      return;
    }
    setLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        method: 'DELETE',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAuditLogs([]);
        setUndoFeedback({ type: 'success', text: 'All activity logs deleted.' });
      } else {
        setUndoFeedback({ type: 'error', text: data.error || 'Could not delete logs.' });
      }
    } catch (err) {
      setUndoFeedback({ type: 'error', text: err?.message || 'Network error while deleting logs.' });
    } finally {
      setLogsLoading(false);
    }
  };

  const handleConfirmUndo = async () => {
    if (undoLoading) return;
    setUndoLoading(true);
    setUndoFeedback(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/site-state/undo`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setUndoFeedback({ type: 'error', text: data.error || 'Could not undo change.' });
        setUndoConfirmOpen(false);
        return;
      }
      if (data.state && typeof data.state === 'object') {
        applySiteStatePayload(data.state, { broadcast: true });
      }
      await fetchAndApplyLiveSiteState({ force: true });
      setUndoHistory(Array.isArray(data.undoHistory) ? data.undoHistory : []);
      setUndoFeedback({
        type: 'success',
        text: `Reverted "${data.revertedEntry?.actionLabel || 'recent change'}" (now at v${data.version}).`
      });
      setUndoConfirmOpen(false);
      await fetchAuditLogs();
    } catch (err) {
      setUndoFeedback({ type: 'error', text: err?.message || 'Network error while undoing.' });
      setUndoConfirmOpen(false);
    } finally {
      setUndoLoading(false);
    }
  };

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
    const shouldSendCustom = newUserRole !== 'admin' && newUserUseCustomSections;
    if (shouldSendCustom && newUserAllowedSections.length === 0) {
      setTeamStatus({
        success: false,
        message: 'Please select at least one section or choose Full Role Access.'
      });
      return;
    }
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
          allowedSections: shouldSendCustom ? newUserAllowedSections : null,
          ...(newUserPassword ? { password: newUserPassword } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setTeamStatus({
          success: true,
          message: data.message || 'Admin access granted.',
          userEmail: newUserEmail.trim()
        });
        setNewUserName('');
        setNewUserEmail('');
        setNewUserRole('editor');
        setNewUserPassword('');
        setNewUserUseCustomSections(false);
        setNewUserAllowedSections(['community']);
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

  const handleSaveUserSections = async (e) => {
    e.preventDefault();
    if (!sectionsModalUser) return;
    if (sectionsModalUser.mode === 'custom' && sectionsModalUser.selectedSections.length === 0) {
      setTeamStatus({
        success: false,
        message: 'Select at least one admin section or choose Full Role Access.'
      });
      return;
    }
    setSectionsModalSaving(true);
    setTeamStatus(null);
    try {
      const allowedSections = sectionsModalUser.mode === 'custom' ? sectionsModalUser.selectedSections : null;
      const res = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(sectionsModalUser.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ allowedSections })
      });
      const data = await res.json();
      if (data.success) {
        setTeamStatus({
          success: true,
          message: allowedSections
            ? `Updated section access for ${sectionsModalUser.email}: ${formatSectionLabels(allowedSections)}.`
            : `Restored full ${sectionsModalUser.role} access for ${sectionsModalUser.email}.`
        });
        setSectionsModalUser(null);
        fetchTeamUsers();
      } else {
        setTeamStatus({ success: false, message: data.error || 'Failed to update section access.' });
      }
    } catch {
      setTeamStatus({ success: false, message: 'Network error updating section permissions.' });
    } finally {
      setSectionsModalSaving(false);
    }
  };

  const handleDispatchUserOtp = async (member) => {
    setTeamStatus(null);
    setDispatchingOtpId(member.id);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(member.id)}/dispatch-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setTeamStatus({
          success: true,
          message: data.message || `Login OTP dispatched to ${member.email}.`,
          userEmail: member.email
        });
      } else {
        setTeamStatus({ success: false, message: data.error || 'Failed to dispatch OTP code.' });
      }
    } catch {
      setTeamStatus({ success: false, message: 'Network error dispatching OTP code.' });
    } finally {
      setDispatchingOtpId(null);
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

  const handleGeneratePassword = () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%^&*()_+-=[]{}';
    const all = uppers + lowers + digits + symbols;
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const chars = [
      uppers[bytes[0] % uppers.length],
      lowers[bytes[1] % lowers.length],
      digits[bytes[2] % digits.length],
      symbols[bytes[3] % symbols.length]
    ];
    for (let i = 4; i < 16; i++) {
      chars.push(all[bytes[i] % all.length]);
    }
    for (let i = chars.length - 1; i > 0; i--) {
      const j = bytes[i] % (i + 1);
      const temp = chars[i];
      chars[i] = chars[j];
      chars[j] = temp;
    }
    setModalPassword(chars.join(''));
    setShowModalPassword(true);
    setModalPasswordError('');
  };

  const handleSaveUserPassword = async (e) => {
    if (e) e.preventDefault();
    if (!passwordModalUser) return;
    const cleanPwd = modalPassword.trim();
    if (cleanPwd.length < 12) {
      setModalPasswordError('Password must be at least 12 characters.');
      return;
    }
    if (!/[A-Z]/.test(cleanPwd) || !/[a-z]/.test(cleanPwd) || !/\d/.test(cleanPwd) || !/[^A-Za-z0-9]/.test(cleanPwd)) {
      setModalPasswordError('Password must include uppercase, lowercase, number, and special character.');
      return;
    }
    setModalPasswordLoading(true);
    setModalPasswordError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(passwordModalUser.id)}/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ password: cleanPwd })
      });
      const data = await res.json();
      if (data.success) {
        setModalPasswordSuccess({
          password: cleanPwd,
          message: data.message || `Password successfully set for ${passwordModalUser.name}.`
        });
        setTeamUsers(prev => prev.map(u => u.id === passwordModalUser.id ? { ...u, hasPassword: true, authMode: 'password_or_sso' } : u));
      } else {
        setModalPasswordError(data.error || 'Failed to update user password.');
      }
    } catch {
      setModalPasswordError('Network error updating password.');
    } finally {
      setModalPasswordLoading(false);
    }
  };

  const fetchAdminGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/gallery`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.photos) && data.photos.length > 0) {
          setGalleryPhotos(data.photos);
          setGalleryLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load gallery photos from API:', err);
    }
    // Fallback to cmsStore gallery
    const fallbackPhotos = cmsStore.data.gallery || [];
    setGalleryPhotos(fallbackPhotos);
    setGalleryLoading(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setUploadFileName(file.name);
    const previewUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(previewUrl);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      // Downscale oversized photos (>1MB) gently so Turso/Worker persistence always stays fast & reliable
      if (file.size > 1024 * 1024 && typeof document !== 'undefined') {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round((img.width || 800) * scale);
          canvas.height = Math.round((img.height || 600) * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setUploadFileData(canvas.toDataURL('image/webp', 0.85));
            return;
          }
          setUploadFileData(dataUrl);
        };
        img.onerror = () => setUploadFileData(dataUrl);
        img.src = dataUrl;
      } else {
        setUploadFileData(dataUrl);
      }
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
          message: data.message || `Photo "${uploadTitle}" uploaded and live on CDN!`
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
      // Local fallback for offline / serverless deployment
      try {
        const localPhoto = {
          id: `photo-${Date.now()}`,
          title: uploadTitle.trim(),
          category: uploadCategory,
          year: uploadYear,
          description: uploadDescription.trim(),
          quote: uploadQuote.trim(),
          featured: uploadFeatured,
          image_url: uploadFileData,
          cdn_url: uploadFileData
        };
        cmsStore.saveGalleryPhoto(localPhoto);
        setGalleryPhotos(prev => [localPhoto, ...prev]);
        setGalleryActionStatus({
          success: true,
          message: `Photo "${uploadTitle}" saved and published to gallery!`
        });
        setShowUploadModal(false);
        setUploadTitle('');
        setUploadDescription('');
        setUploadQuote('');
        setUploadFileData(null);
        setUploadFileName('');
        setUploadPreviewUrl('');
      } catch (saveErr) {
        setGalleryActionStatus({
          success: false,
          message: 'Unable to save photo: ' + saveErr.message
        });
      }
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
      if (res.ok) {
        setGalleryActionStatus({
          success: true,
          message: `Photo "${title}" removed from repository.`
        });
        fetchAdminGallery();
        return;
      }
    } catch (err) {
      console.warn('API delete gallery photo fallback:', err);
    }
    // Local fallback
    cmsStore.deleteGalleryPhoto(id);
    setGalleryPhotos(prev => prev.filter(p => p.id !== id));
    setGalleryActionStatus({
      success: true,
      message: `Photo "${title}" deleted from gallery.`
    });
  };

  const buildAuthHeaders = (extra = {}) => ({
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra
  });

  const setClientSession = (authToken, authUser) => {
    if (typeof window !== 'undefined') {
      // Security: Purge any authentication tokens from client storage
      sessionStorage.removeItem('dcvc_admin_token');
      localStorage.removeItem('dcvc_admin_token');
      if (authUser) {
        sessionStorage.setItem('dcvc_admin_user', JSON.stringify(authUser));
      }
      try {
        const ch = new BroadcastChannel('dcvc_admin_auth');
        ch.postMessage({ type: 'ADMIN_AUTH_STATE_CHANGED' });
        ch.close();
      } catch {}
    }
    if (authToken) {
      setToken(authToken); // In-memory only for this tab turn
      setStoredToken(authToken); // Sync to adminClient so liveSync can include Authorization header
    }
    if (authUser) setUser(authUser);
  };

  const clearClientSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dcvc_admin_token');
      localStorage.removeItem('dcvc_admin_token');
      sessionStorage.removeItem('dcvc_admin_user');
      localStorage.removeItem('dcvc_admin_user');
      try {
        const ch = new BroadcastChannel('dcvc_admin_auth');
        ch.postMessage({ type: 'ADMIN_AUTH_LOGOUT' });
        ch.close();
      } catch {}
    }
    setStoredToken(null); // Clear the shared in-memory token used by liveSync
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
        if (typeof sessionStorage !== 'undefined' && data.user) {
          sessionStorage.setItem('dcvc_admin_user', JSON.stringify(data.user));
        }
        if (data.user?.mustChangePassword) {
          setActiveTab('security');
        }
      } else if (res.status === 401 || res.status === 403) {
        clearClientSession();
      }
    } catch {
      // Retain session on network errors if user profile is cached
    } finally {
      setIsVerifyingSession(false);
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
      const effectiveTurnstile = turnstileToken || (isPreviewHost ? 'cf-preview-bypass-token' : '');
      const res = await fetch(`${API_BASE_URL}/admin/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, turnstileToken: effectiveTurnstile })
      });
      const data = await res.json();
      if (data.success && data.tempToken) {
        setOtpTempToken(data.tempToken);
        setOtpMaskedEmail(data.email || cleanEmail);
        setOtpSent(true);
        setOtpCooldown(60);
        if (data.domainUnverified || data.emailDispatched === false) {
          setAuthError(data.message || 'Domain diversitycollective.org is unverified in Resend. Please switch to the Password tab above to sign in, or ask a Superadmin to set your password.');
        }
      } else {
        setAuthError(data.error || 'Unable to dispatch verification code. Please check your email.');
      }
    } catch {
      setAuthError('Network error connecting to verification service. Please retry.');
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
        setClientSession(data.token, data.user);
        setOtpSent(false);
        setOtpCode('');
      } else {
        setAuthError(data.error || 'Invalid or expired verification code.');
      }
    } catch {
      setAuthError('Verification network failure. Please retry.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setGoogleLoading(true);

    try {
      if (auth0.enabled && auth0.loginWithRedirect) {
        auth0AttemptedSubRef.current = '';
        await auth0.loginWithRedirect({
          authorizationParams: {
            connection: 'google-oauth2',
            redirect_uri: `${window.location.origin}/admin`,
            prompt: 'select_account'
          }
        });
        return;
      }

      setAuthError('Google Single Sign-On is not configured on this environment. Please sign in with your authorized Email OTP or Password.');
    } catch (err) {
      setAuthError(err?.message || 'Unable to start Google Single Sign-On. Please try again or use Email OTP.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setTwoFactorSuccessMsg('');

    const effectiveToken = turnstileToken || (isPreviewHost ? 'cf-preview-bypass-token' : '');

    if (!effectiveToken) {
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
          turnstileToken: effectiveToken
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
        setClientSession(data.token, data.user);
        setPending2fa(null);
      } else {
        setAuthError(data.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch {
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
        setClientSession(data.token, data.user);
        setPending2fa(null);
        setTwoFactorCode('');
        setTwoFactorSuccessMsg('');
        if (data.user?.mustChangePassword) {
          setActiveTab('security');
        }
      } else {
        setAuthError(data.error || 'Invalid security code. Please verify and try again.');
      }
    } catch {
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
          secret: (setupTotpData.secret || '').replace(/[\s=-]/g, '').toUpperCase(),
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
          setClientSession(data.token, null);
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

  const parseImportSubscribersPreview = (rawText) => {
    const emailRegex = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/ig;
    const seen = new Set();
    const valid = [];
    let duplicateCount = 0;

    if (!rawText || !rawText.trim()) {
      return { valid: [], duplicateCount: 0, invalidLines: 0 };
    }

    const trimmed = rawText.trim();
    // Handle JSON array or { subscribers } export files cleanly
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.subscribers) ? parsed.subscribers : []);
        for (const item of list) {
          const rawEmail = typeof item === 'string' ? item : (item?.email || item?.Email || '');
          const clean = String(rawEmail).trim().toLowerCase();
          if (clean && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(clean)) {
            if (seen.has(clean)) duplicateCount += 1;
            else {
              seen.add(clean);
              valid.push(clean);
            }
          }
        }
        if (valid.length > 0) {
          return { valid, duplicateCount, invalidLines: 0 };
        }
      } catch (_) {}
    }

    const lines = trimmed.split(/[\r\n]+/);
    let invalidLines = 0;
    for (const line of lines) {
      const stripped = line.trim();
      if (!stripped) continue;
      // Skip common CSV header rows silently
      if (/^(email|e-mail|subscriber|address)\b/i.test(stripped) && !stripped.includes('@')) continue;
      const matches = stripped.match(emailRegex);
      if (!matches || matches.length === 0) {
        invalidLines += 1;
        continue;
      }
      for (const m of matches) {
        const em = m.toLowerCase().trim();
        if (seen.has(em)) duplicateCount += 1;
        else {
          seen.add(em);
          valid.push(em);
        }
      }
    }
    return { valid, duplicateCount, invalidLines };
  };

  const handleImportSubscribersFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setImportSubText((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
    } catch (err) {
      setSubActionMsg({ success: false, message: `Could not read file: ${err.message}` });
    } finally {
      e.target.value = '';
    }
  };

  const handleImportSubscribers = async (e) => {
    e.preventDefault();
    const { valid } = parseImportSubscribersPreview(importSubText);
    if (valid.length === 0) {
      setSubActionMsg({ success: false, message: 'No valid email addresses detected in your import list.' });
      return;
    }
    setImportingSubs(true);
    setSubActionMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/newsletter/subscribers/import`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          emails: valid,
          source: importSubSource || 'admin_bulk_import'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSubActionMsg({ success: true, message: data.message });
        setImportSubText('');
        setShowImportSubs(false);
        fetchSubscriberStats();
      } else {
        setSubActionMsg({ success: false, message: data.error || data.message || 'Bulk import failed' });
      }
    } catch (err) {
      setSubActionMsg({ success: false, message: err.message || 'Bulk import request failed' });
    } finally {
      setImportingSubs(false);
      setTimeout(() => setSubActionMsg(null), 6000);
    }
  };

  const fetchDirectoryBusinesses = async () => {
    setDirectoryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/directory?status=all`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.businesses) ? data.businesses : [];
        if (list.length > 0) {
          setDirectoryBusinesses(list);
          try {
            localStorage.setItem('dcvc_live_directory_businesses', JSON.stringify(list));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('Could not load directory listings:', err);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const fetchPendingBusinesses = fetchDirectoryBusinesses;

  const INQUIRY_CATEGORY_SEED = {
    contact: [
      {
        id: 'inq-c-1',
        name: 'Morgan Blake',
        email: 'morgan.b@example.org',
        phone: '(805) 555-8821',
        topic: 'Youth Peer Programs',
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
        topic: 'Affirming Business Directory',
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

  const getValidCategoryInquiries = (type) => {
    const seed = INQUIRY_CATEGORY_SEED[type] || [];
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
    return seed;
  };

  const fetchInquiries = async (type) => {
    const initialList = getValidCategoryInquiries(type);
    setInquiries(initialList);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/inquiries?type=${type}`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.inquiries && Array.isArray(data.inquiries) && data.inquiries.length > 0) {
          setInquiries(data.inquiries);
          try {
            localStorage.setItem(`dcvc_admin_inquiries_${type}`, JSON.stringify(data.inquiries));
          } catch {}
          return;
        }
      }
    } catch (err) {
      console.warn('Could not load inquiries:', err);
    }
  };

  const handleSelectInquiryType = (newType) => {
    setInquiryType(newType);
    fetchInquiries(newType);
  };

  const handleInquiryStatusChange = async (inqId, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/admin/inquiries/${inquiryType}/${inqId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
    } catch {}

    setInquiries(prev => {
      const updated = prev.map(item => item.id === inqId ? { ...item, status: newStatus } : item);
      try {
        localStorage.setItem(`dcvc_admin_inquiries_${inquiryType}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedInquiryView && selectedInquiryView.id === inqId) {
      setSelectedInquiryView(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleDeleteInquiry = async (inqId) => {
    if (!window.confirm('Are you sure you want to delete this form submission? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/admin/inquiries/${inquiryType}/${inqId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
    } catch {}

    setInquiries(prev => {
      const updated = prev.filter(item => item.id !== inqId);
      try {
        localStorage.setItem(`dcvc_admin_inquiries_${inquiryType}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedInquiryView && selectedInquiryView.id === inqId) {
      setSelectedInquiryView(null);
    }
  };

  const handleSaveInquiryEdit = async (e) => {
    e?.preventDefault();
    if (!editingInquiry) return;

    let updatedEntry = { ...editingInquiry };
    if (inquiryType === 'appointment') {
      if (updatedEntry.appointment_date || updatedEntry.time_slot) {
        updatedEntry.subject = `[APPOINTMENT] HIV/Wellness Screening Slot: ${updatedEntry.appointment_date || ''} (${updatedEntry.time_slot || ''})`;
      }
      if (updatedEntry.service || updatedEntry.appointment_date) {
        updatedEntry.message = `Screening Service: ${updatedEntry.service || 'HIV/STI Screening'}\nDate: ${updatedEntry.appointment_date || ''}\nSlot: ${updatedEntry.time_slot || ''}\nLanguage: ${updatedEntry.preferred_language || 'English'}\nNotes: ${updatedEntry.notes || 'None'}`;
      }
    } else if (inquiryType === 'resource') {
      if (updatedEntry.organization_name || updatedEntry.category) {
        updatedEntry.subject = `[RESOURCE] Resource Submission: ${updatedEntry.organization_name || 'Affirming Provider'} (${updatedEntry.category || 'General'})`;
      }
      if (updatedEntry.organization_name || updatedEntry.description) {
        updatedEntry.message = `Organization: ${updatedEntry.organization_name || ''}\nCategory: ${updatedEntry.category || ''}\nCity: ${updatedEntry.city || ''}\nAddress: ${updatedEntry.address || 'N/A'}\nWebsite: ${updatedEntry.website || 'N/A'}\nSpanish Available: ${updatedEntry.spanish_available ? 'Yes' : 'No'}\nSliding Scale / Free: ${updatedEntry.sliding_scale ? 'Yes' : 'No'}\nDescription: ${updatedEntry.description || ''}`;
      }
    }

    try {
      await fetch(`${API_BASE_URL}/admin/inquiries/${inquiryType}/${updatedEntry.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: buildAuthHeaders(),
        body: JSON.stringify(updatedEntry)
      });
    } catch {}

    setInquiries(prev => {
      const updated = prev.map(item => item.id === updatedEntry.id ? { ...item, ...updatedEntry } : item);
      try {
        localStorage.setItem(`dcvc_admin_inquiries_${inquiryType}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedInquiryView && selectedInquiryView.id === updatedEntry.id) {
      setSelectedInquiryView({ ...selectedInquiryView, ...updatedEntry });
    }

    setEditingInquiry(null);
  };

  const handleOpenAddInquiryModal = (type = inquiryType) => {
    if (type === 'appointment') {
      setNewInquiryForm({
        name: '',
        client_alias: '',
        email: '',
        phone: '',
        appointment_date: new Date().toISOString().slice(0, 10),
        time_slot: '3:00 PM – 4:00 PM',
        service: 'Free Confidential HIV Screening (Rapid Fingerstick)',
        preferred_language: 'English',
        notes: '',
        status: 'unread'
      });
    } else if (type === 'resource') {
      setNewInquiryForm({
        organization_name: '',
        category: 'Health & Wellness',
        contact_name: '',
        email: '',
        phone: '',
        city: 'Ventura',
        address: '',
        website: '',
        spanish_available: false,
        sliding_scale: true,
        description: '',
        status: 'unread',
        notes: ''
      });
    } else if (type === 'volunteer') {
      setNewInquiryForm({
        full_name: '',
        email: '',
        phone: '',
        city: 'Ventura',
        availability: 'Weekends',
        roles_of_interest: '["Community Outreach", "Event Support"]',
        skills_experience: '',
        status: 'unread',
        notes: ''
      });
    } else if (type === 'training') {
      setNewInquiryForm({
        organization_name: '',
        contact_name: '',
        email: '',
        phone: '',
        course_title: 'LGBTQ+ Clinical Competency for Medical Providers',
        estimated_attendees: '25',
        preferred_date: '',
        goals_and_notes: '',
        status: 'unread',
        notes: ''
      });
    } else if (type === 'accessibility') {
      setNewInquiryForm({
        contact_name: '',
        contact_email: '',
        barrier_description: '',
        page_url: '/',
        assistive_tech: '',
        status: 'open',
        remediation_notes: ''
      });
    } else {
      // contact
      setNewInquiryForm({
        name: '',
        email: '',
        phone: '',
        topic: 'General Inquiry',
        subject: '',
        message: '',
        status: 'unread',
        notes: ''
      });
    }
    setShowAddInquiryModal(true);
  };

  const handleCreateInquirySubmit = async (e) => {
    e?.preventDefault();
    if (!newInquiryForm) return;

    const id = `inq-${inquiryType.slice(0, 3)}-${Date.now()}`;
    let entry = { ...newInquiryForm, id, created_at: new Date().toISOString() };

    if (inquiryType === 'appointment') {
      entry.subject = `[APPOINTMENT] HIV/Wellness Screening Slot: ${entry.appointment_date} (${entry.time_slot})`;
      entry.message = `Screening Service: ${entry.service}\nDate: ${entry.appointment_date}\nSlot: ${entry.time_slot}\nLanguage: ${entry.preferred_language || 'English'}\nNotes: ${entry.notes || 'None'}`;
    } else if (inquiryType === 'resource') {
      entry.subject = `[RESOURCE] Resource Submission: ${entry.organization_name} (${entry.category})`;
      entry.message = `Organization: ${entry.organization_name}\nCategory: ${entry.category}\nCity: ${entry.city}\nAddress: ${entry.address || 'N/A'}\nWebsite: ${entry.website || 'N/A'}\nSpanish Available: ${entry.spanish_available ? 'Yes' : 'No'}\nSliding Scale / Free: ${entry.sliding_scale ? 'Yes' : 'No'}\nDescription: ${entry.description || ''}`;
    } else if (inquiryType === 'contact') {
      entry.subject = entry.subject || entry.topic || 'General Contact Inquiry';
    }

    try {
      await fetch(`${API_BASE_URL}/admin/inquiries/${inquiryType}`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders(),
        body: JSON.stringify(entry)
      });
    } catch {}

    setInquiries(prev => {
      const updated = [entry, ...prev];
      try {
        localStorage.setItem(`dcvc_admin_inquiries_${inquiryType}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setShowAddInquiryModal(false);
    setNewInquiryForm(null);
  };

  const DEFAULT_VOICEMAILS_SEED = [
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

  const fetchVoicemails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/voicemails`, {
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.voicemails && Array.isArray(data.voicemails) && data.voicemails.length > 0) {
          setVoicemails(data.voicemails);
          try {
            localStorage.setItem('dcvc_admin_voicemails', JSON.stringify(data.voicemails));
          } catch {}
          return;
        }
      }
    } catch (err) {
      console.warn('Could not load voicemails from API:', err);
    }

    try {
      const local = localStorage.getItem('dcvc_admin_voicemails');
      if (local) {
        setVoicemails(JSON.parse(local));
        return;
      }
    } catch {}

    setVoicemails(DEFAULT_VOICEMAILS_SEED);
    try {
      localStorage.setItem('dcvc_admin_voicemails', JSON.stringify(DEFAULT_VOICEMAILS_SEED));
    } catch {}
  };

  const handleVoicemailStatusChange = async (id, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/admin/voicemails/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
    } catch {}

    setVoicemails((prev) => {
      const updated = prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v));
      try {
        localStorage.setItem('dcvc_admin_voicemails', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleVoicemailNotesChange = async (id, notes) => {
    const now = new Date().toISOString();
    try {
      await fetch(`${API_BASE_URL}/admin/voicemails/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ admin_notes: notes })
      });
    } catch {}

    setVoicemails((prev) => {
      const updated = prev.map((v) => (v.id === id ? { ...v, admin_notes: notes, notes_updated_at: now } : v));
      try {
        localStorage.setItem('dcvc_admin_voicemails', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteVoicemail = async (id) => {
    if (!window.confirm('Are you sure you want to delete this voicemail and its recording? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/admin/voicemails/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
    } catch {}

    setVoicemails((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      try {
        localStorage.setItem('dcvc_admin_voicemails', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const exportVoicemailsToCsv = () => {
    if (!voicemails || voicemails.length === 0) {
      alert('No voicemails available to export.');
      return;
    }

    const headers = ['ID', 'Caller Name', 'Email', 'Subject', 'Duration (seconds)', 'Status', 'Staff Notes', 'Date Received'];
    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return '"' + str + '"';
    };

    const rows = voicemails.map((v) => [
      v.id || '',
      v.name || '',
      v.email || '',
      v.subject || '',
      v.duration_seconds || 0,
      v.status || 'new',
      v.admin_notes || '',
      v.created_at || ''
    ]);

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map((row) => row.map(escapeCell).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dcvc_voicemails_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportInquiriesToCsv = (items, categoryName = 'form_submissions') => {
    if (!items || items.length === 0) {
      alert('No form submissions available to export in this category.');
      return;
    }

    const headers = [
      'ID',
      'Category',
      'Name',
      'Email',
      'Phone',
      'Subject / Topic / Barrier',
      'Message / Details / Goals',
      'Organization / City',
      'Format / Roles / Assistive Tech',
      'Status',
      'Internal Notes',
      'Created Date'
    ];

    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = items.map((inq) => [
      inq.id || '',
      categoryName,
      inq.name || inq.full_name || inq.contact_name || '',
      inq.email || inq.contact_email || '',
      inq.phone || '',
      inq.subject || inq.course_title || inq.barrier_description || '',
      inq.message || inq.skills_experience || inq.goals_and_notes || '',
      inq.organization_name || inq.city || '',
      inq.preferred_format || inq.roles_of_interest || inq.assistive_tech || inq.page_url || '',
      inq.status || 'unread',
      inq.notes || inq.remediation_notes || '',
      inq.created_at || ''
    ]);

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map(row => row.map(escapeCell).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dcvc_${categoryName}_submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchMediaSuggestions = async () => {
    try {
      const local = getMediaSuggestions() || [];
      try {
        const res = await fetch(`${API_BASE_URL}/admin/media-suggestions`, {
          credentials: 'include',
          headers: buildAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setMediaSuggestions(data.suggestions);
            return;
          }
        }
      } catch (err) {
        // Fallback to local CMS store
      }
      setMediaSuggestions(local);
    } catch {
      setMediaSuggestions(cmsStore.getMediaSuggestions() || []);
    }
  };

  const handleMediaSuggestionStatusChange = async (id, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/admin/media-suggestions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: newStatus })
      });
    } catch {}
    const updated = updateMediaSuggestion(id, { status: newStatus });
    setMediaSuggestions(updated);
  };

  const handleDeleteMediaSuggestion = async (id, topic) => {
    if (!window.confirm(`Are you sure you want to delete the idea "${topic || 'this suggestion'}"?`)) return;
    try {
      await fetch(`${API_BASE_URL}/admin/media-suggestions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
    } catch {}
    const updated = deleteMediaSuggestion(id);
    setMediaSuggestions(updated);
  };

  const exportMediaSuggestionsToCsv = () => {
    if (!mediaSuggestions || mediaSuggestions.length === 0) {
      alert('No media or podcast suggestions available to export.');
      return;
    }

    const headers = [
      'ID',
      'Topic / Title',
      'Category',
      'Submitter Name',
      'Submitter Email',
      'Guest Recommendation',
      'Reference URL',
      'Description / Pitch',
      'Status',
      'Submitted Date'
    ];

    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = mediaSuggestions.map((s) => [
      s.id || '',
      s.topic || '',
      s.category || '',
      s.name || '',
      s.email || '',
      s.guestRecommendation || '',
      s.linkUrl || '',
      s.description || '',
      s.status || 'new',
      s.createdAt || ''
    ]);

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map(row => row.map(escapeCell).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dcvc_podcast_ideas_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConvertSuggestionToPodcast = (suggestion) => {
    handleMediaSuggestionStatusChange(suggestion.id, 'in_production');
    setActiveTab('cms');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('dcvc-admin-cms-subtab', { detail: { subTab: 'podcasts' } }));
      window.dispatchEvent(new CustomEvent('dcvc-admin-create-podcast', {
        detail: {
          title: suggestion.topic || '',
          category: suggestion.category || 'Community Stories',
          guests: suggestion.guestRecommendation || '',
          link: suggestion.linkUrl || '',
          description: suggestion.description || ''
        }
      }));
    }, 100);
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

  const handleModerateBusiness = async (id, status, name) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/directory/${id}/moderate`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setDirectoryBusinesses(prev => prev.map(biz => biz.id === id ? { ...biz, status } : biz));
        setDirectoryActionMsg({
          type: 'success',
          text: `Listing "${name || id}" marked as ${status}.`
        });
        try {
          const stored = localStorage.getItem('dcvc_live_directory_businesses');
          if (stored) {
            const list = JSON.parse(stored);
            const updated = list.map(b => b.id === id ? { ...b, status } : b);
            localStorage.setItem('dcvc_live_directory_businesses', JSON.stringify(updated));
            window.dispatchEvent(new Event('dcvc-directory-updated'));
          }
        } catch (_) {}
      } else {
        const err = await res.json().catch(() => ({}));
        setDirectoryActionMsg({ type: 'error', text: err.error || 'Failed to update listing status.' });
      }
    } catch (err) {
      console.error('Moderation error:', err);
      setDirectoryActionMsg({ type: 'error', text: 'Network error updating listing status.' });
    }
  };

  const handleToggleDcvcVerified = async (biz) => {
    const isCurrentlyVerified = biz.is_verified !== undefined
      ? Boolean(biz.is_verified)
      : (biz.isVerifiedAffirming !== undefined
          ? Boolean(biz.isVerifiedAffirming)
          : (biz.affirmingPledgeSignedAt || Boolean(biz.ownerName)));
    const nextVerified = !isCurrentlyVerified;

    setDirectoryBusinesses(prev => prev.map(b => b.id === biz.id ? { ...b, is_verified: nextVerified, isVerifiedAffirming: nextVerified } : b));
    setDirectoryActionMsg({
      type: 'success',
      text: `"${biz.name}" DCVC Approval badge & rainbow edge lighting turned ${nextVerified ? 'ON' : 'OFF'}.`
    });

    try {
      const stored = localStorage.getItem('dcvc_live_directory_businesses');
      const list = stored ? JSON.parse(stored) : [...businessDirectorySeed];
      const updated = list.map(b => b.id === biz.id ? { ...b, is_verified: nextVerified, isVerifiedAffirming: nextVerified } : b);
      localStorage.setItem('dcvc_live_directory_businesses', JSON.stringify(updated));
      window.dispatchEvent(new Event('dcvc-directory-updated'));
    } catch (_) {}

    try {
      await fetch(`${API_BASE_URL}/admin/directory/${biz.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ is_verified: nextVerified })
      });
    } catch (_) {}
  };

  const handleDeleteBusiness = async (biz) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${biz.name}" from the directory? This action cannot be undone.`)) {
      return;
    }
    setDirectoryDeletingId(biz.id);
    setDirectoryActionMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/directory/${biz.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: buildAuthHeaders()
      });
      if (res.ok) {
        setDirectoryBusinesses(prev => prev.filter(b => b.id !== biz.id));
        setDirectoryActionMsg({
          type: 'success',
          text: `Permanently removed "${biz.name}" from the business directory.`
        });
        try {
          const stored = localStorage.getItem('dcvc_live_directory_businesses');
          if (stored) {
            const list = JSON.parse(stored);
            const updated = list.filter(b => b.id !== biz.id);
            localStorage.setItem('dcvc_live_directory_businesses', JSON.stringify(updated));
            window.dispatchEvent(new Event('dcvc-directory-updated'));
          }
        } catch (_) {}
      } else {
        const err = await res.json().catch(() => ({}));
        setDirectoryActionMsg({ type: 'error', text: err.error || 'Failed to delete business listing.' });
      }
    } catch (err) {
      console.error('Delete business error:', err);
      setDirectoryActionMsg({ type: 'error', text: 'Network error deleting business listing.' });
    } finally {
      setDirectoryDeletingId(null);
    }
  };

  const handleSeedDirectory = async () => {
    setIsSeedingDirectory(true);
    setDirectoryActionMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/directory/seed`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ businesses: businessDirectorySeed })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDirectoryActionMsg({
          type: 'success',
          text: data.message || `Pre-populated directory with ${data.seededCount || businessDirectorySeed.length} authentic local businesses!`
        });
        await fetchDirectoryBusinesses();
        try {
          localStorage.setItem('dcvc_live_directory_businesses', JSON.stringify(businessDirectorySeed));
          window.dispatchEvent(new Event('dcvc-directory-updated'));
        } catch (_) {}
      } else {
        setDirectoryActionMsg({ type: 'error', text: data.error || 'Failed to seed directory.' });
      }
    } catch (err) {
      console.error('Seed directory error:', err);
      setDirectoryActionMsg({ type: 'error', text: 'Network error seeding directory.' });
    } finally {
      setIsSeedingDirectory(false);
    }
  };

  const handleOpenAddBusiness = () => {
    setEditingBiz(null);
    setBizFormData({
      name: '',
      category: 'Dining & Coffee',
      city: 'Ventura',
      address: '',
      phone: '',
      email: '',
      website: '',
      cover_url: '',
      image: '',
      description: '',
      owner_name: '',
      owner_email: '',
      is_featured: false,
      is_verified: true,
      status: 'approved'
    });
    setShowBizModal(true);
  };

  const handleOpenEditBusiness = (biz) => {
    setEditingBiz(biz);
    setBizFormData({
      name: biz.name || '',
      category: biz.category || 'Dining & Coffee',
      city: biz.city || 'Ventura',
      address: biz.address || '',
      phone: biz.phone || '',
      email: biz.email || '',
      website: biz.website || '',
      cover_url: biz.cover_url || biz.image || '',
      image: biz.image || biz.cover_url || '',
      description: biz.description || '',
      owner_name: biz.owner_name || biz.ownerName || '',
      owner_email: biz.owner_email || biz.ownerEmail || '',
      is_featured: Boolean(biz.is_featured),
      is_verified: biz.is_verified !== undefined
        ? Boolean(biz.is_verified)
        : (biz.isVerifiedAffirming !== undefined
            ? Boolean(biz.isVerifiedAffirming)
            : Boolean(biz.affirmingPledgeSignedAt || biz.ownerName)),
      status: biz.status || 'approved'
    });
    setShowBizModal(true);
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    if (!bizFormData.name.trim()) {
      alert('Please enter a business name.');
      return;
    }
    setBizModalSaving(true);
    try {
      const isEdit = Boolean(editingBiz);
      const url = isEdit
        ? `${API_BASE_URL}/admin/directory/${editingBiz.id}`
        : `${API_BASE_URL}/admin/directory`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(bizFormData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowBizModal(false);
        setDirectoryActionMsg({
          type: 'success',
          text: isEdit ? `Listing "${bizFormData.name}" updated successfully.` : `New listing "${bizFormData.name}" created.`
        });
        await fetchDirectoryBusinesses();
        try {
          const stored = localStorage.getItem('dcvc_live_directory_businesses');
          let list = stored ? JSON.parse(stored) : [...businessDirectorySeed];
          if (isEdit) {
            list = list.map(b => b.id === editingBiz.id ? { ...b, ...bizFormData } : b);
          } else if (data.business) {
            list = [data.business, ...list];
          }
          localStorage.setItem('dcvc_live_directory_businesses', JSON.stringify(list));
          window.dispatchEvent(new Event('dcvc-directory-updated'));
        } catch (_) {}
      } else {
        alert(data.error || 'Failed to save business listing.');
      }
    } catch (err) {
      console.error('Save business error:', err);
      alert('Network error while saving business listing.');
    } finally {
      setBizModalSaving(false);
    }
  };

  // =========================================================================
  // VIEW: Login Screen & 2FA Challenge Screen
  // =========================================================================
  if (!user) {
    const isVerifyingAuth = isVerifyingSession ||
      Boolean(token && !user) ||
      Boolean(auth0.enabled && (auth0.isLoading || auth0Exchanging || (auth0.isAuthenticated && !user && !displayedAuthError)));

    if (isVerifyingAuth) {
      return (
        <div className="admin-workspace dcvc-admin-cool min-h-screen bg-[#E9EFF6] flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-[#5A1E65]">
            <RefreshCw className="w-7 h-7 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
              {auth0Exchanging ? 'Authorizing DCVC Session...' : 'Verifying Administrative Session...'}
            </span>
          </div>
        </div>
      );
    }

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
                  onVerify={setTurnstileToken}
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
    <div className="admin-workspace dcvc-admin-cool min-h-screen w-full max-w-full overflow-x-clip bg-[#E9EFF6] text-slate-900 pb-20 notranslate" translate="no">
      
      {/* Top Admin Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs w-full max-w-full overflow-x-clip">
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
                {isSectionRestrictedUser(user) && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 max-w-[200px] truncate"
                    title={formatSectionLabels(user.allowedSections)}
                  >
                    Scoped: {formatSectionLabels(user.allowedSections)}
                  </span>
                )}
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
            currentUser={user}
            onNavigate={(tab, subTab) => {
              if (tab && canAccessAdminTab(user, tab)) setActiveTab(tab);
              if (tab === 'appearance' && subTab && canAccessAdminTab(user, 'appearance')) setAppearanceSubTab(subTab);
              if (tab === 'cms' && subTab && canAccessAdminTab(user, 'cms')) {
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
            {user?.role !== 'read_only' && (
              <button
                type="button"
                onClick={() => {
                  setUndoFeedback(null);
                  setUndoConfirmOpen(true);
                }}
                disabled={undoHistory.length === 0 || undoLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                  undoHistory.length > 0
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
                title={
                  undoHistory.length > 0
                    ? `Undo most recent change (${undoHistory.length}/5 available)`
                    : 'No recent changes available to undo'
                }
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  undoHistory.length > 0 ? 'bg-amber-200 text-amber-950' : 'bg-slate-200 text-slate-500'
                }`}>
                  {undoHistory.length}/5
                </span>
              </button>
            )}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
            <div className="text-right hidden sm:block min-w-0 max-w-[200px]">
              <span className="text-xs font-bold text-slate-800 block truncate leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-500 block truncate leading-tight">{user.email}</span>
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

        {/* Streamlined Tab Navigation (Filtered by Role & Section Access) */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto border-t border-slate-100">
          {canAccessAdminTab(user, 'hero') && (
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
          )}

          {canAccessAdminTab(user, 'appearance') && (
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
          )}

          {canAccessAdminTab(user, 'cms') && (
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
          )}

          {canAccessAdminTab(user, 'sponsorships') && (
          <button
            type="button"
            onClick={() => setActiveTab('sponsorships')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'sponsorships'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Sponsorships & Documents</span>
          </button>
          )}

          {canAccessAdminTab(user, 'features') && (
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
          )}

          {canAccessAdminTab(user, 'donations') && (
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
          )}

          {canAccessAdminTab(user, 'inbox') && (
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
            {canAccessInboxSubTab(user, 'directory') && pendingBusinesses.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                {pendingBusinesses.length}
              </span>
            )}
          </button>
          )}

          {canAccessAdminTab(user, 'gallery') && (
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
          )}

          {canAccessAdminTab(user, 'status') && (
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
          )}

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'logs'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity Logs</span>
            {undoHistory.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                {undoHistory.length}/5
              </span>
            )}
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
        {activeTab === 'hero' && canAccessAdminTab(user, 'hero') && (
          <div className="space-y-6">
            <DesignEditor />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: COLORS, FONTS & CARD ORDER                                 */}
        {/* ================================================================= */}
        {activeTab === 'appearance' && canAccessAdminTab(user, 'appearance') && (
          <div className="space-y-6">
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
        {activeTab === 'cms' && canAccessAdminTab(user, 'cms') && (
          <div className="space-y-6">
            <CmsStudio currentUser={user} />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: SPONSORSHIPS & CORPORATE PARTNERSHIP DOCUMENTS                */}
        {/* ================================================================= */}
        {activeTab === 'sponsorships' && canAccessAdminTab(user, 'sponsorships') && (
          <div className="space-y-6">
            <SponsorshipManager />
          </div>
        )}

        {activeTab === 'features' && canAccessAdminTab(user, 'features') && (
          <div className="space-y-6">
            <SiteFeaturesStudio />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: DONATIONS & AUTOMATED EMAIL TEMPLATE                         */}
        {/* ================================================================= */}
        {activeTab === 'donations' && canAccessAdminTab(user, 'donations') && (
          <div className="space-y-6">
            <DonationSettingsStudio currentUser={user} />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: DIRECTORY, INQUIRIES & NEWSLETTER                          */}
        {/* ================================================================= */}
        {activeTab === 'inbox' && canAccessAdminTab(user, 'inbox') && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 inline-flex flex-wrap gap-1 shadow-xs">
              {canAccessInboxSubTab(user, 'directory') && (
              <button
                onClick={() => setInboxSubTab('directory')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  inboxSubTab === 'directory'
                    ? 'bg-[#5A1E65] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Business Directory ({directoryBusinesses.length})</span>
                {directoryCounts.pending > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-300 text-amber-950 font-black">
                    {directoryCounts.pending} pending
                  </span>
                )}
              </button>
              )}
              {canAccessInboxSubTab(user, 'inquiries') && (
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
              )}
              {canAccessInboxSubTab(user, 'voicemail') && (
              <button
                onClick={() => {
                  setInboxSubTab('voicemail');
                  fetchVoicemails();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  inboxSubTab === 'voicemail'
                    ? 'bg-[#5A1E65] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voicemail Inbox</span>
                {voicemails.filter(v => v.status === 'new').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                    {voicemails.filter(v => v.status === 'new').length} New
                  </span>
                )}
              </button>
              )}
              {canAccessInboxSubTab(user, 'suggestions') && (
              <button
                onClick={() => {
                  setInboxSubTab('suggestions');
                  fetchMediaSuggestions();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  inboxSubTab === 'suggestions'
                    ? 'bg-[#5A1E65] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Podcast & Content Ideas ({mediaSuggestions.length})</span>
                {mediaSuggestions.filter(s => s.status === 'new').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                    {mediaSuggestions.filter(s => s.status === 'new').length} New
                  </span>
                )}
              </button>
              )}
              {canAccessInboxSubTab(user, 'newsletter') && (
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
              )}
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

                  {/* Import Subscribers Button */}
                  <button
                    type="button"
                    onClick={() => setShowImportSubs((prev) => !prev)}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      showImportSubs
                        ? 'bg-[#5A1E65] text-white border-[#5A1E65]'
                        : 'border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900'
                    }`}
                    title="Bulk import subscribers from CSV, TXT, JSON, or pasted emails"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Import Subscribers</span>
                  </button>

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

              {/* Bulk Import Subscribers Panel */}
              {showImportSubs && (() => {
                const preview = parseImportSubscribersPreview(importSubText);
                return (
                  <form
                    onSubmit={handleImportSubscribers}
                    className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-indigo-50/60 border border-purple-200 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                          <UploadCloud className="w-4 h-4 text-[#5A1E65]" />
                          Bulk Import Newsletter Subscribers
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Upload a CSV/TXT/JSON file or paste email addresses (one per line, comma-separated, or exported spreadsheet rows). Existing unsubscribed contacts are reactivated cleanly and duplicates are skipped automatically.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowImportSubs(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Close import panel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-purple-300 bg-white hover:bg-purple-50/60 cursor-pointer text-xs font-bold text-purple-900 transition-colors">
                        <FileText className="w-4 h-4 text-[#5A1E65]" />
                        <span>Choose CSV, TXT, or JSON File</span>
                        <input
                          type="file"
                          accept=".csv,.txt,.json,text/csv,text/plain,application/json"
                          onChange={handleImportSubscribersFile}
                          className="sr-only"
                        />
                      </label>

                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                        <label htmlFor="bulk-sub-source" className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                          Source Tag:
                        </label>
                        <input
                          id="bulk-sub-source"
                          type="text"
                          value={importSubSource}
                          onChange={(e) => setImportSubSource(e.target.value)}
                          placeholder="admin_bulk_import"
                          className="w-full text-xs text-slate-800 bg-transparent focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <textarea
                      rows={4}
                      value={importSubText}
                      onChange={(e) => setImportSubText(e.target.value)}
                      placeholder={"alex@example.com\nsam.rivera@venturacounty.org, jordan@community.net\n\"Taylor Lee <taylor@example.org>\""}
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-slate-800"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`px-2.5 py-1 rounded-full font-bold border ${
                          preview.valid.length > 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {preview.valid.length} valid unique email{preview.valid.length === 1 ? '' : 's'} ready
                        </span>
                        {preview.duplicateCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                            {preview.duplicateCount} duplicate{preview.duplicateCount === 1 ? '' : 's'} collapsed
                          </span>
                        )}
                        {preview.invalidLines > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                            {preview.invalidLines} line{preview.invalidLines === 1 ? '' : 's'} without valid email skipped
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {importSubText && (
                          <button
                            type="button"
                            onClick={() => setImportSubText('')}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={importingSubs || preview.valid.length === 0}
                          className="px-4 py-1.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{importingSubs ? 'Importing...' : `Import ${preview.valid.length || ''} Subscriber${preview.valid.length === 1 ? '' : 's'}`}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                );
              })()}

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

        {/* DIRECTORY MANAGEMENT SUITE */}
        {inboxSubTab === 'directory' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-black text-slate-950">
                    Affirming Business Directory Management
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-[#5A1E65]">
                    {directoryBusinesses.length} Total
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pre-populated registry with verified affirming businesses across Ventura County. Create, edit, moderate, or remove listings.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddBusiness}
                  className="px-3.5 py-2 rounded-xl bg-[#5A1E65] hover:bg-[#43154C] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Business</span>
                </button>
                <button
                  type="button"
                  onClick={handleSeedDirectory}
                  disabled={isSeedingDirectory}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Pre-populate directory with 12 authentic Ventura County businesses"
                >
                  {isSeedingDirectory ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>Pre-Populate Directory</span>
                </button>
                <button
                  type="button"
                  onClick={fetchDirectoryBusinesses}
                  disabled={directoryLoading}
                  className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-200"
                  title="Refresh directory list from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${directoryLoading ? 'animate-spin text-purple-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Action Feedback Notification Banner */}
            {directoryActionMsg && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                directoryActionMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {directoryActionMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{directoryActionMsg.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectoryActionMsg(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Status Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl flex-wrap">
                {[
                  { id: 'all', label: 'All Listings', count: directoryCounts.all },
                  { id: 'approved', label: 'Approved / Live', count: directoryCounts.approved },
                  { id: 'pending', label: 'Pending Review', count: directoryCounts.pending, badge: directoryCounts.pending > 0 },
                  { id: 'rejected', label: 'Rejected', count: directoryCounts.rejected }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDirectoryFilter(tab.id)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      directoryFilter === tab.id
                        ? 'bg-white text-purple-950 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      tab.badge
                        ? 'bg-amber-400 text-amber-950 font-black'
                        : directoryFilter === tab.id
                          ? 'bg-purple-100 text-[#5A1E65]'
                          : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Filter by name, city, category..."
                  className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 bg-slate-50/50"
                />
                {directorySearch && (
                  <button
                    type="button"
                    onClick={() => setDirectorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Directory Cards List */}
            {filteredDirectoryBusinesses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                {directoryFilter === 'pending' ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">All caught up!</p>
                    <p className="text-xs text-slate-500">No business listings currently pending moderation review.</p>
                    <button
                      type="button"
                      onClick={() => setDirectoryFilter('all')}
                      className="text-xs font-bold text-[#5A1E65] hover:underline cursor-pointer"
                    >
                      View All Listings ({directoryCounts.all})
                    </button>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No businesses match your current filter</p>
                    <p className="text-xs text-slate-500">Try clearing your search query or re-populate with seed businesses.</p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {directorySearch && (
                        <button
                          type="button"
                          onClick={() => setDirectorySearch('')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSeedDirectory}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 cursor-pointer inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Pre-Populate Full Seed Directory</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDirectoryBusinesses.map((biz) => {
                  const isPending = biz.status === 'pending';
                  const isRejected = biz.status === 'rejected' || biz.status === 'archived';
                  const isApproved = biz.status === 'approved' || (!biz.status && !isPending && !isRejected);
                  const isDeleting = directoryDeletingId === biz.id;
                  const isDcvcApproved = biz.is_verified !== undefined
                    ? Boolean(biz.is_verified)
                    : (biz.isVerifiedAffirming !== undefined
                        ? Boolean(biz.isVerifiedAffirming)
                        : (biz.affirmingPledgeSignedAt || Boolean(biz.ownerName)));

                  return (
                    <div
                      key={biz.id || biz.slug}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isPending
                          ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                          : isRejected
                            ? 'bg-rose-50/20 border-rose-200 opacity-80'
                            : 'bg-white border-slate-200 hover:border-purple-200 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-950 text-sm tracking-tight truncate max-w-xs sm:max-w-sm">
                            {biz.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#5A1E65]">
                            {biz.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {biz.city || 'Ventura'}
                          </span>

                          {/* Status Badge */}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              Pending Review
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Live on Site
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                              Rejected
                            </span>
                          )}

                          {biz.is_featured ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Featured
                            </span>
                          ) : null}

                          {isDcvcApproved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 shadow-2xs">
                              <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                              <span>DCVC Approved</span>
                            </span>
                          ) : null}
                        </div>

                        {biz.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl">
                            {biz.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                          {biz.address && (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-xs">{biz.address}</span>
                            </span>
                          )}
                          {biz.phone && (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{biz.phone}</span>
                            </span>
                          )}
                          {biz.website && (
                            <a
                              href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#5A1E65] hover:underline font-bold"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span>Website</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {(biz.owner_name || biz.ownerName || biz.owner_email || biz.ownerEmail) && (
                            <span className="text-slate-400">
                              Owner: {biz.owner_name || biz.ownerName || 'Verified Member'}
                              {(biz.owner_email || biz.ownerEmail) ? ` (${biz.owner_email || biz.ownerEmail})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleModerateBusiness(biz.id, 'approved', biz.name)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Approve business listing"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModerateBusiness(biz.id, 'rejected', biz.name)}
                              className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                              title="Reject business listing"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => handleModerateBusiness(biz.id, 'rejected', biz.name)}
                            className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-200"
                            title="Unpublish / Move to Rejected"
                          >
                            <X className="w-3 h-3" />
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        )}

                        {isRejected && (
                          <button
                            type="button"
                            onClick={() => handleModerateBusiness(biz.id, 'approved', biz.name)}
                            className="px-2.5 py-1.5 rounded-xl text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1 cursor-pointer border border-emerald-200"
                            title="Re-approve listing"
                          >
                            <Check className="w-3 h-3" />
                            <span>Re-Approve</span>
                          </button>
                        )}

                        {/* One-Click DCVC Approved Badge Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleDcvcVerified(biz)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${
                            isDcvcApproved
                              ? 'bg-purple-900 hover:bg-purple-950 text-white border-purple-700 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                          title={isDcvcApproved ? 'Turn OFF DCVC Approved Badge & Rainbow Edge' : 'Turn ON DCVC Approved Badge & Rainbow Edge'}
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isDcvcApproved ? 'text-amber-300' : 'text-slate-400'}`} />
                          <span className="whitespace-nowrap">{isDcvcApproved ? 'DCVC Badge: ON' : 'DCVC Badge: OFF'}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditBusiness(biz)}
                          className="p-2 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-200 transition-all"
                          title="Edit listing details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteBusiness(biz)}
                          disabled={isDeleting}
                          className="p-2 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 text-xs font-bold flex items-center gap-1 cursor-pointer border border-rose-200 transition-all disabled:opacity-50"
                          title="Delete business permanently"
                        >
                          {isDeleting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add / Edit Business Modal */}
            {showBizModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 my-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-display text-lg font-black text-slate-950">
                        {editingBiz ? 'Edit Business Listing' : 'Add Affirming Business Listing'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {editingBiz ? `Update directory details for ${editingBiz.name}` : 'Create a new verified affirming listing in the directory'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBizModal(false)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveBusiness} className="space-y-4">
                    {/* Name & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={bizFormData.name}
                          onChange={(e) => setBizFormData({ ...bizFormData, name: e.target.value })}
                          placeholder="e.g. Beacon Coffee Company"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Category *
                        </label>
                        <select
                          value={bizFormData.category}
                          onChange={(e) => setBizFormData({ ...bizFormData, category: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 bg-white"
                        >
                          <option value="Dining & Coffee">Dining & Coffee</option>
                          <option value="Health & Wellness">Health & Wellness</option>
                          <option value="Legal & Financial">Legal & Financial</option>
                          <option value="Retail & Gifts">Retail & Gifts</option>
                          <option value="Fitness & Recreation">Fitness & Recreation</option>
                          <option value="Professional Services">Professional Services</option>
                        </select>
                      </div>
                    </div>

                    {/* City & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          City / Region *
                        </label>
                        <select
                          value={bizFormData.city}
                          onChange={(e) => setBizFormData({ ...bizFormData, city: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 bg-white"
                        >
                          {['Ventura', 'Oxnard', 'Camarillo', 'Ojai', 'Thousand Oaks', 'Simi Valley', 'Moorpark', 'Santa Paula', 'Port Hueneme', 'Fillmore'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={bizFormData.address}
                          onChange={(e) => setBizFormData({ ...bizFormData, address: e.target.value })}
                          placeholder="e.g. 5777 Valentine Rd, Ventura, CA"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                        />
                      </div>
                    </div>

                    {/* Phone & Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={bizFormData.phone}
                          onChange={(e) => setBizFormData({ ...bizFormData, phone: e.target.value })}
                          placeholder="(805) 555-0123"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                        />
                        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer text-[11px] font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(bizFormData.voicemailOnly)}
                            onChange={(e) => setBizFormData({ ...bizFormData, voicemailOnly: e.target.checked })}
                            className="rounded text-[#5A1E65] focus:ring-purple-400"
                          />
                          <span>Toggle voicemails only (show Send Voicemail button)</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Website URL
                        </label>
                        <input
                          type="text"
                          value={bizFormData.website}
                          onChange={(e) => setBizFormData({ ...bizFormData, website: e.target.value })}
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                        />
                      </div>
                    </div>

                    {/* Owner / Contact Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Owner / Submitter Name
                        </label>
                        <input
                          type="text"
                          value={bizFormData.owner_name}
                          onChange={(e) => setBizFormData({ ...bizFormData, owner_name: e.target.value })}
                          placeholder="Jane Doe"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={bizFormData.owner_email}
                          onChange={(e) => setBizFormData({ ...bizFormData, owner_email: e.target.value })}
                          placeholder="contact@example.com"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                        />
                      </div>
                    </div>

                    <ImagePicker
                      value={bizFormData.cover_url || bizFormData.image || ''}
                      onChange={(url) => setBizFormData((prev) => ({ ...prev, cover_url: url, image: url }))}
                      label="Business Cover Photo / Logo"
                      aspectRatio="aspect-[16/9]"
                      helpText="Upload a storefront photo, atmosphere image, or business logo."
                    />

                    {/* Description */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Business Description
                      </label>
                      <textarea
                        rows={3}
                        value={bizFormData.description}
                        onChange={(e) => setBizFormData({ ...bizFormData, description: e.target.value })}
                        placeholder="Brief description of the business and its welcoming environment..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 resize-none"
                      />
                    </div>

                    {/* Status & Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Directory Status
                        </label>
                        <select
                          value={bizFormData.status}
                          onChange={(e) => setBizFormData({ ...bizFormData, status: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 bg-white font-bold"
                        >
                          <option value="approved">Approved (Live)</option>
                          <option value="pending">Pending Moderation</option>
                          <option value="rejected">Rejected / Archived</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="is_verified"
                          checked={bizFormData.is_verified}
                          onChange={(e) => setBizFormData({ ...bizFormData, is_verified: e.target.checked })}
                          className="rounded border-slate-300 text-[#5A1E65] focus:ring-purple-400"
                        />
                        <label htmlFor="is_verified" className="text-xs font-bold text-slate-700 cursor-pointer">
                          DCVC Approved (Rainbow Glow & Flipping Badge)
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={bizFormData.is_featured}
                          onChange={(e) => setBizFormData({ ...bizFormData, is_featured: e.target.checked })}
                          className="rounded border-slate-300 text-[#5A1E65] focus:ring-purple-400"
                        />
                        <label htmlFor="is_featured" className="text-xs font-bold text-slate-700 cursor-pointer">
                          Featured Listing
                        </label>
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowBizModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bizModalSaving}
                        className="px-5 py-2 rounded-xl bg-[#5A1E65] hover:bg-[#43154C] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {bizModalSaving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{editingBiz ? 'Save Changes' : 'Create Listing'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OPERATIONAL INQUIRIES & FORM SUBMISSIONS */}
        {inboxSubTab === 'inquiries' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-black text-slate-950 flex items-center gap-2">
                  <span>Operational Inquiries & Form Submissions</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 uppercase">
                    {inquiries.length} {inquiryType} {inquiries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View complete form details, change status, edit, delete, or export submission data in CSV format.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Inquiries Category Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
                  {['contact', 'appointment', 'resource', 'volunteer', 'training', 'accessibility'].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleSelectInquiryType(t)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        inquiryType === t ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Add Entry Button */}
                <button
                  type="button"
                  onClick={() => handleOpenAddInquiryModal(inquiryType)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#5A1E65] hover:bg-[#43154C] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title={`Add a new ${inquiryType} submission entry`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {inquiryType === 'appointment' ? 'Appointment' : inquiryType === 'resource' ? 'Resource' : inquiryType === 'volunteer' ? 'Volunteer' : inquiryType === 'training' ? 'Training' : 'Inquiry'}</span>
                </button>

                {/* CSV Export Button */}
                <button
                  type="button"
                  onClick={() => exportInquiriesToCsv(inquiries, inquiryType)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Export all current form submissions to CSV file"
                >
                  <Download className="w-3.5 h-3.5 text-purple-700" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    {inquiryType === 'appointment' ? (
                      <>
                        <th className="py-3 px-4">Client (Confidential)</th>
                        <th className="py-3 px-4">Screening Date, Slot & Service</th>
                      </>
                    ) : inquiryType === 'resource' ? (
                      <>
                        <th className="py-3 px-4">Resource / Organization</th>
                        <th className="py-3 px-4">Category, Contact & Location</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Subject / Details</th>
                      </>
                    )}
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {inquiries.length > 0 ? (
                    inquiries.map((inq) => (
                      <tr key={inq.id} className="hover:bg-slate-50/60 transition-colors">
                        {inquiryType === 'appointment' ? (
                          <>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 block">
                                  {inq.name || inq.client_alias || 'Confidential Client'}
                                </span>
                                {inq.preferred_language && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                                    {inq.preferred_language}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 block">{inq.email || inq.contact || 'No email provided'}</span>
                              {inq.phone && <span className="text-[10px] text-slate-400 block">{inq.phone}</span>}
                            </td>
                            <td className="py-3 px-4 max-w-md">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-purple-100 text-[#5A1E65]">
                                  {inq.appointment_date || inq.date || 'TBD Date'}
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  {inq.time_slot || inq.slot || 'TBD Time Slot'}
                                </span>
                              </div>
                              <span className="font-bold text-slate-900 block mt-1">
                                {inq.service || inq.subject?.replace(/^\[APPOINTMENT\]\s*/i, '') || 'Free Confidential HIV Screening'}
                              </span>
                              {inq.notes && (
                                <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 italic">
                                  Note: {inq.notes}
                                </span>
                              )}
                            </td>
                          </>
                        ) : inquiryType === 'resource' ? (
                          <>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 block">
                                  {inq.organization_name || inq.title || inq.name || 'Community Resource'}
                                </span>
                              </div>
                              {inq.website && (
                                <a
                                  href={inq.website.startsWith('http') ? inq.website : `https://${inq.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-purple-700 hover:underline block"
                                >
                                  {inq.website}
                                </a>
                              )}
                              <span className="text-[11px] text-slate-500 block">
                                Contact: {inq.contact_person || inq.contact_name || inq.name || 'Representative'}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-md">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  {inq.category || 'Health & Wellness'}
                                </span>
                                {inq.city && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    📍 {inq.city}
                                  </span>
                                )}
                                {inq.spanish_available && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                    Español
                                  </span>
                                )}
                                {inq.sliding_scale && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                    Sliding Scale / Free
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                                {inq.description || inq.message || ''}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 block">
                                  {inq.preferred_name || inq.preferredName || inq.name || inq.full_name || inq.contact_name || 'Anonymous Community Member'}
                                </span>
                                {inq.pronouns && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800">
                                    {inq.pronouns}
                                  </span>
                                )}
                              </div>
                              {(inq.preferred_name || inq.preferredName) && inq.full_name && (inq.preferred_name || inq.preferredName) !== inq.full_name && (
                                <span className="text-[10px] text-slate-400 block italic">Legal: {inq.full_name}</span>
                              )}
                              <span className="text-[11px] text-slate-500 block">{inq.email || inq.contact_email || 'No email provided'}</span>
                              {inq.phone && <span className="text-[10px] text-slate-400 block">{inq.phone}</span>}
                            </td>
                            <td className="py-3 px-4 max-w-md">
                              <span className="font-bold text-slate-800 block truncate">{inq.subject || inq.topic || inq.course_title || inq.barrier_description || 'General Inquiry'}</span>
                              <span className="text-[11px] text-slate-500 line-clamp-2">{inq.message || inq.skills_experience || inq.goals_and_notes || ''}</span>
                              {(inq.city || inq.organization_name) && (
                                <span className="text-[10px] text-purple-700 font-medium block mt-0.5">
                                  {inq.organization_name || inq.city}
                                </span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="py-3 px-4">
                          <select
                            value={inq.status || 'unread'}
                            onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer capitalize shadow-2xs ${
                              inq.status === 'resolved' || inq.status === 'completed' || inq.status === 'remediated' || inq.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : inq.status === 'in_progress' || inq.status === 'proposal_sent' || inq.status === 'under_review' || inq.status === 'oriented' || inq.status === 'contacted'
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : inq.status === 'archived' || inq.status === 'inactive' || inq.status === 'cancelled' || inq.status === 'closed'
                                ? 'bg-slate-100 text-slate-600 border-slate-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="unread">Unread / New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved / Done</option>
                            <option value="archived">Archived</option>
                            {inquiryType === 'volunteer' && (
                              <>
                                <option value="contacted">Contacted</option>
                                <option value="oriented">Oriented</option>
                                <option value="active">Active Volunteer</option>
                                <option value="inactive">Inactive</option>
                              </>
                            )}
                            {inquiryType === 'training' && (
                              <>
                                <option value="inquiry_received">Inquiry Received</option>
                                <option value="proposal_sent">Proposal Sent</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </>
                            )}
                            {inquiryType === 'accessibility' && (
                              <>
                                <option value="open">Open</option>
                                <option value="under_review">Under Review</option>
                                <option value="remediated">Remediated</option>
                                <option value="closed">Closed</option>
                              </>
                            )}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                          {inq.created_at ? new Date(inq.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedInquiryView(inq)}
                              className="p-1.5 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                              title="View complete form information"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingInquiry({ ...inq })}
                              className="p-1.5 rounded-lg text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                              title="Edit entry"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInquiry(inq.id)}
                              className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No inquiries recorded for category "{inquiryType}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MODAL 1: VIEW COMPLETE FORM INFORMATION */}
            {selectedInquiryView && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in my-8">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900">
                        {inquiryType} Submission
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {selectedInquiryView.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        selectedInquiryView.status === 'resolved' || selectedInquiryView.status === 'completed' || selectedInquiryView.status === 'remediated'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedInquiryView.status === 'in_progress'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedInquiryView.status || 'unread'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedInquiryView(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Complete Form Fields */}
                  <div className="space-y-4 text-xs">
                    {inquiryType === 'appointment' ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-900">
                              Diversity SHINES Clinical Screening Appointment
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-950">
                              Confidential Health Record
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Screening Service</span>
                              <span className="text-xs font-black text-purple-950 block mt-0.5">
                                {selectedInquiryView.service || selectedInquiryView.subject || 'Free Confidential HIV Screening'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Preferred Language</span>
                              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                                {selectedInquiryView.preferred_language || 'English'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Screening Date</span>
                              <span className="text-xs font-black text-slate-900 block mt-0.5">
                                {selectedInquiryView.appointment_date || 'Scheduled Date'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Reserved Time Slot</span>
                              <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                                {selectedInquiryView.time_slot || 'Standard Slot'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Client Name / Alias</span>
                            <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                              {selectedInquiryView.client_alias || selectedInquiryView.name || selectedInquiryView.full_name || 'Confidential Client'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Confidential Email</span>
                            <a
                              href={`mailto:${selectedInquiryView.email || ''}`}
                              className="text-xs font-semibold text-purple-700 hover:underline block mt-0.5"
                            >
                              {selectedInquiryView.email || '—'}
                            </a>
                          </div>
                          {selectedInquiryView.phone && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Confidential Phone / SMS</span>
                              <a href={`tel:${selectedInquiryView.phone}`} className="text-xs font-semibold text-slate-700 hover:underline block mt-0.5">
                                {selectedInquiryView.phone}
                              </a>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Booking Date</span>
                            <span className="text-xs text-slate-600 block mt-0.5">
                              {selectedInquiryView.created_at ? new Date(selectedInquiryView.created_at).toLocaleString() : '—'}
                            </span>
                          </div>
                        </div>

                        {(selectedInquiryView.notes || selectedInquiryView.message) && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Confidential Clinical & Intake Notes</span>
                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs mt-1 leading-relaxed whitespace-pre-wrap">
                              {selectedInquiryView.notes || selectedInquiryView.message}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : inquiryType === 'resource' ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
                              Affirming Community Resource Submission
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {selectedInquiryView.spanish_available && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Español / Spanish
                                </span>
                              )}
                              {selectedInquiryView.sliding_scale && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                  Sliding Scale / Free
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Organization / Provider Name</span>
                            <h4 className="text-base font-black text-indigo-950 mt-0.5">
                              {selectedInquiryView.organization_name || selectedInquiryView.name || 'Resource Organization'}
                            </h4>
                            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              {selectedInquiryView.category || 'Health & Wellness'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Person</span>
                            <span className="text-xs font-bold text-slate-900 block mt-0.5">
                              {selectedInquiryView.contact_name || selectedInquiryView.name || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email Address</span>
                            <a
                              href={`mailto:${selectedInquiryView.email || ''}`}
                              className="text-xs font-semibold text-purple-700 hover:underline block mt-0.5"
                            >
                              {selectedInquiryView.email || '—'}
                            </a>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone</span>
                            <a href={`tel:${selectedInquiryView.phone || ''}`} className="text-xs font-semibold text-slate-700 hover:underline block mt-0.5">
                              {selectedInquiryView.phone || '—'}
                            </a>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">City / Address</span>
                            <span className="text-xs text-slate-800 font-medium block mt-0.5">
                              {[selectedInquiryView.address, selectedInquiryView.city].filter(Boolean).join(', ') || 'Ventura County'}
                            </span>
                          </div>
                          {selectedInquiryView.website && (
                            <div className="sm:col-span-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Website</span>
                              <a
                                href={selectedInquiryView.website.startsWith('http') ? selectedInquiryView.website : `https://${selectedInquiryView.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-purple-700 hover:underline block mt-0.5 break-all"
                              >
                                {selectedInquiryView.website}
                              </a>
                            </div>
                          )}
                        </div>

                        {(selectedInquiryView.description || selectedInquiryView.message) && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Services & Description</span>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap mt-1">
                              {selectedInquiryView.description || selectedInquiryView.message}
                            </div>
                          </div>
                        )}

                        {selectedInquiryView.notes && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Staff Verification Notes</span>
                            <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs mt-1">
                              {selectedInquiryView.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {selectedInquiryView.preferred_name || selectedInquiryView.preferredName ? 'Preferred Name' : 'Contact Name'}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-sm font-extrabold text-slate-900">
                                {selectedInquiryView.preferred_name || selectedInquiryView.preferredName || selectedInquiryView.name || selectedInquiryView.full_name || selectedInquiryView.contact_name || 'Anonymous'}
                              </span>
                              {selectedInquiryView.pronouns && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                  {selectedInquiryView.pronouns}
                                </span>
                              )}
                            </div>
                            {selectedInquiryView.full_name && (selectedInquiryView.preferred_name || selectedInquiryView.preferredName) && (
                              <span className="text-[11px] text-slate-500 block mt-1">
                                Legal Name (Confidential): <strong className="text-slate-700">{selectedInquiryView.full_name}</strong>
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email Address</span>
                            <a
                              href={`mailto:${selectedInquiryView.email || selectedInquiryView.contact_email}`}
                              className="text-xs font-semibold text-purple-700 hover:underline block mt-0.5"
                            >
                              {selectedInquiryView.email || selectedInquiryView.contact_email || '—'}
                            </a>
                          </div>
                          {selectedInquiryView.phone && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone</span>
                              <a href={`tel:${selectedInquiryView.phone}`} className="text-xs font-semibold text-slate-700 hover:underline block mt-0.5">
                                {selectedInquiryView.phone}
                              </a>
                            </div>
                          )}
                          {(selectedInquiryView.city || selectedInquiryView.organization_name) && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                {selectedInquiryView.organization_name ? 'Organization' : 'City / Region'}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                                {selectedInquiryView.organization_name || selectedInquiryView.city}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Submission Date</span>
                            <span className="text-xs text-slate-600 block mt-0.5">
                              {selectedInquiryView.created_at ? new Date(selectedInquiryView.created_at).toLocaleString() : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Specific Category Information */}
                        {(selectedInquiryView.subject || selectedInquiryView.course_title) && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Subject / Topic</span>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">
                              {selectedInquiryView.subject || selectedInquiryView.course_title}
                            </p>
                          </div>
                        )}

                        {(selectedInquiryView.message || selectedInquiryView.skills_experience || selectedInquiryView.goals_and_notes) && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Message & Inquiry Details</span>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap mt-1">
                              {selectedInquiryView.message || selectedInquiryView.skills_experience || selectedInquiryView.goals_and_notes}
                            </div>
                          </div>
                        )}

                        {selectedInquiryView.barrier_description && (
                          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                            <strong className="block text-xs font-bold text-rose-950">Accessibility Barrier Description:</strong>
                            <p className="whitespace-pre-wrap">{selectedInquiryView.barrier_description}</p>
                            {selectedInquiryView.page_url && (
                              <div className="text-[11px] text-rose-700">Page URL: {selectedInquiryView.page_url}</div>
                            )}
                            {selectedInquiryView.assistive_tech && (
                              <div className="text-[11px] text-rose-700">Assistive Technology: {selectedInquiryView.assistive_tech}</div>
                            )}
                          </div>
                        )}

                        {selectedInquiryView.roles_of_interest && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Volunteer Roles of Interest</span>
                            <p className="text-xs font-medium text-slate-800 mt-0.5">{selectedInquiryView.roles_of_interest}</p>
                          </div>
                        )}

                        {selectedInquiryView.availability && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Availability</span>
                            <p className="text-xs font-medium text-slate-800 mt-0.5">{selectedInquiryView.availability}</p>
                          </div>
                        )}

                        {selectedInquiryView.estimated_attendees && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Estimated Attendees</span>
                              <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedInquiryView.estimated_attendees}</p>
                            </div>
                            {selectedInquiryView.preferred_date && (
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Date</span>
                                <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedInquiryView.preferred_date}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {(selectedInquiryView.notes || selectedInquiryView.remediation_notes) && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Internal Staff Notes</span>
                            <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs mt-1">
                              {selectedInquiryView.notes || selectedInquiryView.remediation_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions inside View Modal */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Change Status:</span>
                      <select
                        value={selectedInquiryView.status || 'unread'}
                        onChange={(e) => handleInquiryStatusChange(selectedInquiryView.id, e.target.value)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="unread">Unread / New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInquiry({ ...selectedInquiryView });
                          setSelectedInquiryView(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Entry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInquiry(selectedInquiryView.id)}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedInquiryView(null)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 2: EDIT FORM SUBMISSION ENTRY */}
            {editingInquiry && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in my-8">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-display text-lg font-black text-slate-950">
                        Edit {inquiryType === 'appointment' ? 'Appointment' : inquiryType === 'resource' ? 'Resource' : inquiryType.toUpperCase()} Entry
                      </h3>
                      <p className="text-xs text-slate-500">ID: {editingInquiry.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingInquiry(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveInquiryEdit} className="space-y-4 text-xs">
                    {inquiryType === 'appointment' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Client Name / Alias *</label>
                            <input
                              type="text"
                              value={editingInquiry.client_alias || editingInquiry.name || ''}
                              onChange={(e) => setEditingInquiry(prev => ({
                                ...prev,
                                name: e.target.value,
                                client_alias: e.target.value
                              }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Confidential Email</label>
                            <input
                              type="email"
                              value={editingInquiry.email || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Confidential Phone</label>
                            <input
                              type="text"
                              value={editingInquiry.phone || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Appointment Status</label>
                            <select
                              value={editingInquiry.status || 'unread'}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                            >
                              <option value="unread">Scheduled / New</option>
                              <option value="in_progress">Confirmed / Reminded</option>
                              <option value="resolved">Completed</option>
                              <option value="archived">Cancelled / Archived</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Screening Date *</label>
                            <input
                              type="date"
                              value={editingInquiry.appointment_date || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, appointment_date: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Time Slot *</label>
                            <select
                              value={editingInquiry.time_slot || '3:00 PM – 4:00 PM'}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, time_slot: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            >
                              <option value="1:00 PM – 2:00 PM">1:00 PM – 2:00 PM</option>
                              <option value="2:00 PM – 3:00 PM">2:00 PM – 3:00 PM</option>
                              <option value="3:00 PM – 4:00 PM">3:00 PM – 4:00 PM</option>
                              <option value="4:00 PM – 5:00 PM">4:00 PM – 5:00 PM</option>
                              <option value="5:00 PM – 6:00 PM">5:00 PM – 6:00 PM</option>
                              <option value="6:00 PM – 7:00 PM">6:00 PM – 7:00 PM</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Clinical Screening Service *</label>
                            <select
                              value={editingInquiry.service || 'Free Confidential HIV Screening (Rapid Fingerstick)'}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, service: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            >
                              <option value="Free Confidential HIV Screening (Rapid Fingerstick)">Free Confidential HIV Screening (Rapid Fingerstick)</option>
                              <option value="STI Screening & Health Navigation">STI Screening & Health Navigation</option>
                              <option value="PrEP / PEP Consultation & Referral">PrEP / PEP Consultation & Referral</option>
                              <option value="Gender Affirming Care Resource Navigation">Gender Affirming Care Resource Navigation</option>
                              <option value="Harm Reduction Supplies & Consultation">Harm Reduction Supplies & Consultation</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Preferred Language</label>
                            <select
                              value={editingInquiry.preferred_language || 'English'}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, preferred_language: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            >
                              <option value="English">English</option>
                              <option value="Spanish">Spanish / Español</option>
                              <option value="Bilingual">Bilingual</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Confidential Clinical & Intake Notes</label>
                          <textarea
                            rows={3}
                            value={editingInquiry.notes || ''}
                            onChange={(e) => setEditingInquiry(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Clinical screening notes, testing coordinator notes, or follow-up status..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>
                      </>
                    ) : inquiryType === 'resource' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Organization / Provider Name *</label>
                            <input
                              type="text"
                              value={editingInquiry.organization_name || editingInquiry.name || ''}
                              onChange={(e) => setEditingInquiry(prev => ({
                                ...prev,
                                organization_name: e.target.value,
                                name: e.target.value
                              }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Resource Category *</label>
                            <select
                              value={editingInquiry.category || 'Health & Wellness'}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                            >
                              <option value="Health & Wellness">Health & Wellness</option>
                              <option value="Mental Health & Counseling">Mental Health & Counseling</option>
                              <option value="Youth & Family Support">Youth & Family Support</option>
                              <option value="Legal & Advocacy">Legal & Advocacy</option>
                              <option value="Housing & Shelter Assistance">Housing & Shelter Assistance</option>
                              <option value="Trans & Non-Binary Support">Trans & Non-Binary Support</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Person</label>
                            <input
                              type="text"
                              value={editingInquiry.contact_name || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, contact_name: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Email *</label>
                            <input
                              type="email"
                              value={editingInquiry.email || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone</label>
                            <input
                              type="text"
                              value={editingInquiry.phone || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">City</label>
                            <input
                              type="text"
                              value={editingInquiry.city || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, city: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status</label>
                            <select
                              value={editingInquiry.status || 'unread'}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                            >
                              <option value="unread">Pending Review</option>
                              <option value="in_progress">Under Review</option>
                              <option value="resolved">Verified / Listed</option>
                              <option value="archived">Declined / Archived</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Street Address</label>
                            <input
                              type="text"
                              value={editingInquiry.address || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, address: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Website URL</label>
                            <input
                              type="text"
                              value={editingInquiry.website || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, website: e.target.value }))}
                              placeholder="https://..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-6 py-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!editingInquiry.spanish_available}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, spanish_available: e.target.checked }))}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="font-semibold text-slate-700">Spanish Language Available</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!editingInquiry.sliding_scale}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, sliding_scale: e.target.checked }))}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="font-semibold text-slate-700">Sliding Scale / Free Services</span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Resource Description *</label>
                          <textarea
                            rows={3}
                            value={editingInquiry.description || editingInquiry.message || ''}
                            onChange={(e) => setEditingInquiry(prev => ({
                              ...prev,
                              description: e.target.value,
                              message: e.target.value
                            }))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Staff Verification Notes</label>
                          <input
                            type="text"
                            value={editingInquiry.notes || ''}
                            onChange={(e) => setEditingInquiry(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Verification status, vetting checks, or follow-up notes..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Name</label>
                            <input
                              type="text"
                              value={editingInquiry.name || editingInquiry.full_name || editingInquiry.contact_name || ''}
                              onChange={(e) => setEditingInquiry(prev => ({
                                ...prev,
                                name: e.target.value,
                                full_name: e.target.value,
                                contact_name: e.target.value
                              }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email</label>
                            <input
                              type="email"
                              value={editingInquiry.email || editingInquiry.contact_email || ''}
                              onChange={(e) => setEditingInquiry(prev => ({
                                ...prev,
                                email: e.target.value,
                                contact_email: e.target.value
                              }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone</label>
                            <input
                              type="text"
                              value={editingInquiry.phone || ''}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status</label>
                            <select
                              value={editingInquiry.status || 'unread'}
                              onChange={(e) => setEditingInquiry(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                            >
                              <option value="unread">Unread / New</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Subject / Topic</label>
                          <input
                            type="text"
                            value={editingInquiry.subject || editingInquiry.course_title || editingInquiry.barrier_description || ''}
                            onChange={(e) => setEditingInquiry(prev => ({
                              ...prev,
                              subject: e.target.value,
                              course_title: e.target.value,
                              barrier_description: e.target.value
                            }))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Message / Details</label>
                          <textarea
                            rows={4}
                            value={editingInquiry.message || editingInquiry.skills_experience || editingInquiry.goals_and_notes || ''}
                            onChange={(e) => setEditingInquiry(prev => ({
                              ...prev,
                              message: e.target.value,
                              skills_experience: e.target.value,
                              goals_and_notes: e.target.value
                            }))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Internal Admin Notes</label>
                          <input
                            type="text"
                            value={editingInquiry.notes || editingInquiry.remediation_notes || ''}
                            onChange={(e) => setEditingInquiry(prev => ({
                              ...prev,
                              notes: e.target.value,
                              remediation_notes: e.target.value
                            }))}
                            placeholder="Internal staff notes, follow-up status, or notes on resolution..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>
                      </>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingInquiry(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 3: ADD NEW FORM SUBMISSION ENTRY */}
            {showAddInquiryModal && newInquiryForm && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in my-8">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-display text-lg font-black text-slate-950">
                        Add New {inquiryType === 'appointment' ? 'Appointment Booking' : inquiryType === 'resource' ? 'Community Resource' : inquiryType === 'volunteer' ? 'Volunteer Application' : inquiryType === 'training' ? 'Training Booking' : inquiryType === 'accessibility' ? 'A11y Report' : 'Contact Submission'}
                      </h3>
                      <p className="text-xs text-slate-500">Record a new verified entry directly under category "{inquiryType}".</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddInquiryModal(false);
                        setNewInquiryForm(null);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateInquirySubmit} className="space-y-4 text-xs">
                    {inquiryType === 'appointment' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Client Name / Alias *</label>
                            <input
                              type="text"
                              value={newInquiryForm.client_alias || newInquiryForm.name || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, name: e.target.value, client_alias: e.target.value }))}
                              placeholder="e.g. Maya R. or Confidential Client"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Confidential Email</label>
                            <input
                              type="email"
                              value={newInquiryForm.email || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="client@example.org"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Confidential Phone / SMS</label>
                            <input
                              type="text"
                              value={newInquiryForm.phone || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="(805) 555-0199"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Preferred Language</label>
                            <select
                              value={newInquiryForm.preferred_language || 'English'}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, preferred_language: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            >
                              <option value="English">English</option>
                              <option value="Spanish">Spanish / Español</option>
                              <option value="Bilingual">Bilingual</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Screening Date *</label>
                            <input
                              type="date"
                              value={newInquiryForm.appointment_date || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Time Slot *</label>
                            <select
                              value={newInquiryForm.time_slot || '3:00 PM – 4:00 PM'}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, time_slot: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            >
                              <option value="1:00 PM – 2:00 PM">1:00 PM – 2:00 PM</option>
                              <option value="2:00 PM – 3:00 PM">2:00 PM – 3:00 PM</option>
                              <option value="3:00 PM – 4:00 PM">3:00 PM – 4:00 PM</option>
                              <option value="4:00 PM – 5:00 PM">4:00 PM – 5:00 PM</option>
                              <option value="5:00 PM – 6:00 PM">5:00 PM – 6:00 PM</option>
                              <option value="6:00 PM – 7:00 PM">6:00 PM – 7:00 PM</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Clinical Screening Service *</label>
                          <select
                            value={newInquiryForm.service || 'Free Confidential HIV Screening (Rapid Fingerstick)'}
                            onChange={(e) => setNewInquiryForm(prev => ({ ...prev, service: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                          >
                            <option value="Free Confidential HIV Screening (Rapid Fingerstick)">Free Confidential HIV Screening (Rapid Fingerstick)</option>
                            <option value="STI Screening & Health Navigation">STI Screening & Health Navigation</option>
                            <option value="PrEP / PEP Consultation & Referral">PrEP / PEP Consultation & Referral</option>
                            <option value="Gender Affirming Care Resource Navigation">Gender Affirming Care Resource Navigation</option>
                            <option value="Harm Reduction Supplies & Consultation">Harm Reduction Supplies & Consultation</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Confidential Clinical & Intake Notes</label>
                          <textarea
                            rows={3}
                            value={newInquiryForm.notes || ''}
                            onChange={(e) => setNewInquiryForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Screening intake details, special accommodations, or staff follow-up..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>
                      </>
                    ) : inquiryType === 'resource' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Organization / Provider Name *</label>
                            <input
                              type="text"
                              value={newInquiryForm.organization_name || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({
                                ...prev,
                                organization_name: e.target.value,
                                name: e.target.value
                              }))}
                              placeholder="e.g. Ventura Coast Affirming Therapy"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Resource Category *</label>
                            <select
                              value={newInquiryForm.category || 'Health & Wellness'}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                            >
                              <option value="Health & Wellness">Health & Wellness</option>
                              <option value="Mental Health & Counseling">Mental Health & Counseling</option>
                              <option value="Youth & Family Support">Youth & Family Support</option>
                              <option value="Legal & Advocacy">Legal & Advocacy</option>
                              <option value="Housing & Shelter Assistance">Housing & Shelter Assistance</option>
                              <option value="Trans & Non-Binary Support">Trans & Non-Binary Support</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Person</label>
                            <input
                              type="text"
                              value={newInquiryForm.contact_name || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, contact_name: e.target.value }))}
                              placeholder="Dr. Jordan Rivera, LMFT"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                            <input
                              type="email"
                              value={newInquiryForm.email || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="contact@affirmingtherapy.org"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone</label>
                            <input
                              type="text"
                              value={newInquiryForm.phone || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="(805) 555-0145"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">City</label>
                            <input
                              type="text"
                              value={newInquiryForm.city || 'Ventura'}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="Ventura, Oxnard, Camarillo..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Street Address</label>
                            <input
                              type="text"
                              value={newInquiryForm.address || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="e.g. 500 E Santa Clara St, Suite 201"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Website URL</label>
                            <input
                              type="text"
                              value={newInquiryForm.website || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, website: e.target.value }))}
                              placeholder="https://..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-6 py-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!newInquiryForm.spanish_available}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, spanish_available: e.target.checked }))}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="font-semibold text-slate-700">Spanish Language Available</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!newInquiryForm.sliding_scale}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, sliding_scale: e.target.checked }))}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="font-semibold text-slate-700">Sliding Scale / Free Services</span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Resource & Services Description *</label>
                          <textarea
                            rows={3}
                            value={newInquiryForm.description || ''}
                            onChange={(e) => setNewInquiryForm(prev => ({
                              ...prev,
                              description: e.target.value,
                              message: e.target.value
                            }))}
                            placeholder="Provide a clear description of affirming services, intake requirements, and hours..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            required
                          />
                        </div>
                      </>
                    ) : inquiryType === 'volunteer' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                            <input
                              type="text"
                              value={newInquiryForm.full_name || newInquiryForm.name || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, full_name: e.target.value, name: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email *</label>
                            <input
                              type="email"
                              value={newInquiryForm.email || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone</label>
                            <input
                              type="text"
                              value={newInquiryForm.phone || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">City</label>
                            <input
                              type="text"
                              value={newInquiryForm.city || 'Ventura'}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, city: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Roles of Interest</label>
                          <input
                            type="text"
                            value={newInquiryForm.roles_of_interest || ''}
                            onChange={(e) => setNewInquiryForm(prev => ({ ...prev, roles_of_interest: e.target.value }))}
                            placeholder="e.g. ['Event Support', 'Community Outreach']"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Skills & Experience</label>
                          <textarea
                            rows={3}
                            value={newInquiryForm.skills_experience || ''}
                            onChange={(e) => setNewInquiryForm(prev => ({ ...prev, skills_experience: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>
                      </>
                    ) : inquiryType === 'training' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Organization *</label>
                            <input
                              type="text"
                              value={newInquiryForm.organization_name || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, organization_name: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Person *</label>
                            <input
                              type="text"
                              value={newInquiryForm.contact_name || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, contact_name: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email *</label>
                            <input
                              type="email"
                              value={newInquiryForm.email || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone</label>
                            <input
                              type="text"
                              value={newInquiryForm.phone || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Course Title</label>
                            <input
                              type="text"
                              value={newInquiryForm.course_title || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, course_title: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Attendees</label>
                            <input
                              type="text"
                              value={newInquiryForm.estimated_attendees || '25'}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, estimated_attendees: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Training Goals & Notes</label>
                          <textarea
                            rows={3}
                            value={newInquiryForm.goals_and_notes || ''}
                            onChange={(e) => setNewInquiryForm(prev => ({ ...prev, goals_and_notes: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Name *</label>
                            <input
                              type="text"
                              value={newInquiryForm.name || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Community member name"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email *</label>
                            <input
                              type="email"
                              value={newInquiryForm.email || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="member@example.com"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone</label>
                            <input
                              type="text"
                              value={newInquiryForm.phone || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="(805) 555-0100"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Topic / Subject</label>
                            <input
                              type="text"
                              value={newInquiryForm.subject || newInquiryForm.topic || ''}
                              onChange={(e) => setNewInquiryForm(prev => ({ ...prev, subject: e.target.value, topic: e.target.value }))}
                              placeholder="e.g. Community Center Hours"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Message / Inquiry Details *</label>
                          <textarea
                            rows={3}
                            value={newInquiryForm.message || ''}
                            onChange={(e) => setNewInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Enter the community member's question or message..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Internal Admin Notes</label>
                          <input
                            type="text"
                            value={newInquiryForm.notes || ''}
                            onChange={(e) => setNewInquiryForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Optional follow-up notes for the triage team..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                          />
                        </div>
                      </>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddInquiryModal(false);
                          setNewInquiryForm(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Create Entry
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
          

        {/* VOICEMAIL INBOX */}
        {inboxSubTab === 'voicemail' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-black text-slate-950">
                    Voicemail Inbox
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-[#5A1E65]">
                    {voicemails.length} Recordings
                  </span>
                  {voicemails.filter(v => v.status === 'new').length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 animate-pulse">
                      {voicemails.filter(v => v.status === 'new').length} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Listen to, triage, and archive audio messages submitted by visitors when staff are away.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportVoicemailsToCsv}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export all voicemails to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-purple-700" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={fetchVoicemails}
                  className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-200"
                  title="Refresh voicemails from server"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl flex-wrap">
                {[
                  { id: 'all', label: 'All Messages', count: voicemails.length },
                  { id: 'new', label: 'New', count: voicemails.filter(v => v.status === 'new').length, badge: voicemails.filter(v => v.status === 'new').length > 0 },
                  { id: 'reviewed', label: 'Reviewed', count: voicemails.filter(v => v.status === 'reviewed').length },
                  { id: 'responded', label: 'Responded', count: voicemails.filter(v => v.status === 'responded').length },
                  { id: 'archived', label: 'Archived', count: voicemails.filter(v => v.status === 'archived').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVoicemailStatusFilter(tab.id)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      voicemailStatusFilter === tab.id
                        ? 'bg-white text-purple-950 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      tab.badge
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : voicemailStatusFilter === tab.id
                          ? 'bg-purple-100 text-[#5A1E65]'
                          : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={voicemailSearch}
                  onChange={(e) => setVoicemailSearch(e.target.value)}
                  placeholder="Search by caller, email, subject, notes..."
                  className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 bg-slate-50/50"
                />
                {voicemailSearch && (
                  <button
                    type="button"
                    onClick={() => setVoicemailSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Voicemails List */}
            {(() => {
              const filtered = voicemails.filter(v => {
                const matchesStatus = voicemailStatusFilter === 'all' || v.status === voicemailStatusFilter;
                const matchesSearch = !voicemailSearch || 
                  (v.name && v.name.toLowerCase().includes(voicemailSearch.toLowerCase())) ||
                  (v.email && v.email.toLowerCase().includes(voicemailSearch.toLowerCase())) ||
                  (v.subject && v.subject.toLowerCase().includes(voicemailSearch.toLowerCase())) ||
                  (v.admin_notes && v.admin_notes.toLowerCase().includes(voicemailSearch.toLowerCase()));
                return matchesStatus && matchesSearch;
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Mic className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold">No voicemails match the selected criteria.</p>
                    <p className="text-xs text-slate-400">Incoming voice recordings left by visitors will appear here.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filtered.map(v => (
                    <VoicemailItemRow
                      key={v.id}
                      voicemail={v}
                      apiBaseUrl={API_BASE_URL}
                      onStatusChange={handleVoicemailStatusChange}
                      onNotesChange={handleVoicemailNotesChange}
                      onDelete={handleDeleteVoicemail}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* PODCAST & CONTENT IDEAS INBOX */}
        {inboxSubTab === 'suggestions' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-black text-slate-950">
                    Podcast & Content Ideas
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-[#5A1E65]">
                    {mediaSuggestions.length} Total
                  </span>
                  {mediaSuggestions.filter(s => s.status === 'new').length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 animate-pulse">
                      {mediaSuggestions.filter(s => s.status === 'new').length} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Review listener topic proposals, community speaker recommendations, and episode pitches submitted via the Podcasts & Media hub.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportMediaSuggestionsToCsv}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export all podcast ideas to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-purple-700" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={fetchMediaSuggestions}
                  className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-200"
                  title="Refresh suggestions from server"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl flex-wrap">
                {[
                  { id: 'all', label: 'All Ideas', count: mediaSuggestions.length },
                  { id: 'new', label: 'New', count: mediaSuggestions.filter(s => s.status === 'new').length, badge: mediaSuggestions.filter(s => s.status === 'new').length > 0 },
                  { id: 'reviewed', label: 'Reviewed', count: mediaSuggestions.filter(s => s.status === 'reviewed').length },
                  { id: 'in_production', label: 'In Production', count: mediaSuggestions.filter(s => s.status === 'in_production').length },
                  { id: 'archived', label: 'Archived', count: mediaSuggestions.filter(s => s.status === 'archived').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMediaSuggestionStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      mediaSuggestionStatusFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      tab.badge
                        ? 'bg-amber-400 text-slate-950'
                        : mediaSuggestionStatusFilter === tab.id
                          ? 'bg-purple-100 text-[#5A1E65]'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mediaSuggestionSearch}
                  onChange={(e) => setMediaSuggestionSearch(e.target.value)}
                  placeholder="Search topic, speaker, email..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-400 transition-colors"
                />
              </div>
            </div>

            {/* Suggestions List */}
            {(() => {
              const filtered = mediaSuggestions.filter(s => {
                const matchesStatus = mediaSuggestionStatusFilter === 'all' || (s.status || 'new') === mediaSuggestionStatusFilter;
                const query = mediaSuggestionSearch.toLowerCase().trim();
                const matchesSearch = !query ||
                  (s.topic && s.topic.toLowerCase().includes(query)) ||
                  (s.name && s.name.toLowerCase().includes(query)) ||
                  (s.email && s.email.toLowerCase().includes(query)) ||
                  (s.guestRecommendation && s.guestRecommendation.toLowerCase().includes(query)) ||
                  (s.description && s.description.toLowerCase().includes(query));
                return matchesStatus && matchesSearch;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 space-y-2">
                    <Lightbulb className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No Content Ideas Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {mediaSuggestionSearch
                        ? `No ideas match the search "${mediaSuggestionSearch}". Try another keyword or clear the search.`
                        : `No ideas currently marked as ${mediaSuggestionStatusFilter}.`}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filtered.map(s => {
                    const statusColor = {
                      new: 'bg-amber-100 text-amber-900 border-amber-300',
                      reviewed: 'bg-blue-100 text-blue-900 border-blue-300',
                      in_production: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                      archived: 'bg-slate-100 text-slate-700 border-slate-300'
                    }[s.status || 'new'] || 'bg-slate-100 text-slate-700 border-slate-300';

                    return (
                      <div
                        key={s.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-[#5A1E65]">
                                {s.category || 'Content Idea'}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${statusColor}`}>
                                {(s.status || 'new').replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                              </span>
                            </div>
                            <h3 className="font-display text-base font-black text-slate-950 pt-1">
                              {s.topic}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleConvertSuggestionToPodcast(s)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                              title="Prefill a new Podcast Episode with this pitch"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-300" />
                              <span>Create Episode</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMediaSuggestion(s.id, s.topic)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete idea"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        {s.description && (
                          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                            {s.description}
                          </p>
                        )}

                        {/* Guest / Link Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {s.guestRecommendation && (
                            <div className="flex items-center gap-2 text-slate-700">
                              <Users className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span><strong className="text-slate-900">Recommended Guest:</strong> {s.guestRecommendation}</span>
                            </div>
                          )}
                          {s.linkUrl && (
                            <div className="flex items-center gap-2 text-slate-700 truncate">
                              <ExternalLink className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <a
                                href={s.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-700 hover:underline truncate font-semibold"
                              >
                                {s.linkUrl}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Submitter & Status Triage Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-700">Submitted by:</span>
                            <span className="text-slate-900 font-semibold">{s.name || 'Anonymous Community Member'}</span>
                            {s.email && (
                              <a
                                href={`mailto:${s.email}?subject=Regarding DCVC Podcast Pitch: ${encodeURIComponent(s.topic || '')}`}
                                className="text-purple-700 hover:underline flex items-center gap-1 font-medium"
                              >
                                <Mail className="w-3 h-3" />
                                {s.email}
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400 mr-1">Triage:</span>
                            {['new', 'reviewed', 'in_production', 'archived'].map(st => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleMediaSuggestionStatusChange(s.id, st)}
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  (s.status || 'new') === st
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                              >
                                {st === 'in_production' ? 'In Prod' : st.charAt(0).toUpperCase() + st.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: COMMUNITY GALLERY STUDIO (GitHub + jsDelivr Multi-CDN)     */}
        {/* ================================================================= */}
        {activeTab === 'gallery' && canAccessAdminTab(user, 'gallery') && (
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
                      Cloud media storage · Multi-CDN edge delivery.
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
                  <span className="text-sm font-extrabold text-slate-900 block mt-1">Cloud Media Storage</span>
                  <span className="text-xs text-slate-500">Secure Edge Assets</span>
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
                          if (!e.target.dataset.fallbackTried && photo.image_url && e.target.getAttribute('src') !== photo.image_url) {
                            e.target.dataset.fallbackTried = '1';
                            e.target.src = photo.image_url;
                          } else {
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling?.dataset?.missingPlaceholder) {
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }
                        }}
                      />
                      <div
                        data-missing-placeholder="1"
                        style={{ display: 'none' }}
                        className="w-full h-full flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-500 p-4 text-center"
                      >
                        <ImageIcon className="w-7 h-7 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-600">Image missing — Delete &amp; re-upload</span>
                      </div>
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
                        Upload to Media CDN
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
                            <span>Uploading to Media CDN...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Publish to Media CDN</span>
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
        {activeTab === 'status' && canAccessAdminTab(user, 'status') && (
          <div className="space-y-6">
            <SiteStatusManager />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3.8: ACTIVITY LOGS & 5-STEP UNDO                              */}
        {/* ================================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Undo 5 Most Recent Changes Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Undo Recent Site Changes ({undoHistory.length}/5 Available)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Each tap reverts 1 change at a time (up to the 5 most recent published changes). Confirmation is required before reverting.
                    </p>
                  </div>
                </div>

                {user?.role !== 'read_only' && (
                  <button
                    type="button"
                    onClick={() => {
                      setUndoFeedback(null);
                      setUndoConfirmOpen(true);
                    }}
                    disabled={undoHistory.length === 0 || undoLoading}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                      undoHistory.length > 0
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Undo Most Recent Change</span>
                  </button>
                )}
              </div>

              {undoFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    undoFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {undoFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{undoFeedback.text}</span>
                </div>
              )}

              {undoHistory.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 text-center">
                  No recent site-state changes are currently queued for undo. Make any edit in Hero, Appearance, CMS, or Features to create an undo checkpoint.
                </div>
              ) : (
                <div className="space-y-2">
                  {undoHistory.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        idx === 0
                          ? 'bg-amber-50/70 border-amber-300 text-slate-900'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          idx === 0 ? 'bg-amber-200 text-amber-950' : 'bg-slate-200 text-slate-700'
                        }`}>
                          #{idx + 1} {idx === 0 ? '· Next Undo' : ''}
                        </span>
                        <span className="font-bold truncate">{item.actionLabel}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
                        <span className="font-semibold text-slate-700">{item.actorEmail}</span>
                        <span>·</span>
                        <span>v{item.prevVersion} → v{item.newVersion}</span>
                        <span>·</span>
                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Full Admin & User Audit Logs */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#5A1E65] flex items-center justify-center shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Admin & User Activity Logs (Last 30 Days)</h2>
                    <p className="text-xs text-slate-500">
                      Chronological audit trail of logins, content edits, deletions, resets, and undo actions across all team members. Logs older than 30 days are automatically purged.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={logsSearch}
                      onChange={(e) => setLogsSearch(e.target.value)}
                      placeholder="Filter by user or action..."
                      className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#5A1E65] w-48 sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={fetchAuditLogs}
                    disabled={logsLoading}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  {user?.role !== 'read_only' && (
                    <button
                      type="button"
                      onClick={handleDeleteAuditLogs}
                      disabled={logsLoading || auditLogs.length === 0}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Logs</span>
                    </button>
                  )}
                </div>
              </div>

              {logsLoading && auditLogs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 font-medium">
                  Loading activity logs...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 font-medium">
                  No activity logs recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 pr-4 font-bold">Time</th>
                        <th className="py-2.5 pr-4 font-bold">User / Admin</th>
                        <th className="py-2.5 pr-4 font-bold">Action</th>
                        <th className="py-2.5 pr-4 font-bold">Target</th>
                        <th className="py-2.5 pr-4 font-bold">Details</th>
                        <th className="py-2.5 font-bold">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs
                        .filter((log) => {
                          if (!logsSearch.trim()) return true;
                          const q = logsSearch.toLowerCase();
                          return (
                            String(log.user_email || '').toLowerCase().includes(q) ||
                            String(log.action || '').toLowerCase().includes(q) ||
                            String(log.target_type || '').toLowerCase().includes(q) ||
                            String(log.details || '').toLowerCase().includes(q)
                          );
                        })
                        .map((log) => {
                          let parsedDetails = log.details;
                          try {
                            if (typeof log.details === 'string' && log.details.startsWith('{')) {
                              const obj = JSON.parse(log.details);
                              parsedDetails = Object.entries(obj)
                                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                                .join(' · ');
                            }
                          } catch {}
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 pr-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                                {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                              </td>
                              <td className="py-2.5 pr-4 font-bold text-slate-800 whitespace-nowrap">
                                {log.user_email || 'system'}
                              </td>
                              <td className="py-2.5 pr-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  String(log.action || '').includes('undo')
                                    ? 'bg-amber-100 text-amber-900'
                                    : String(log.action || '').includes('delete') || String(log.action || '').includes('reset')
                                    ? 'bg-rose-100 text-rose-800'
                                    : String(log.action || '').includes('login')
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-purple-100 text-[#5A1E65]'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4 text-slate-600 whitespace-nowrap">
                                {log.target_type}{log.target_id ? ` (${log.target_id})` : ''}
                              </td>
                              <td className="py-2.5 pr-4 text-slate-600 max-w-xs truncate" title={String(parsedDetails || '')}>
                                {parsedDetails || '—'}
                              </td>
                              <td className="py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                {log.ip_address || '—'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
                  <div className={`p-4 rounded-2xl text-xs space-y-2.5 ${
                    teamStatus.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      {teamStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      )}
                      <span className="font-semibold">{teamStatus.message}</span>
                    </div>
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
                                  member.hasPassword
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : member.authMode === 'sso'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {member.hasPassword ? 'Password Active' : (member.authMode === 'sso' ? 'Auth0 SSO' : 'SSO / No Password')}
                                </span>
                                  {!member.isActive && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                      Suspended
                                    </span>
                                  )}
                                  {member.role !== 'admin' && Array.isArray(member.allowedSections) && (
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 max-w-[260px] truncate"
                                      title={formatSectionLabels(member.allowedSections)}
                                    >
                                      Sections: {formatSectionLabels(member.allowedSections)}
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

                                {member.role !== 'admin' && (
                                  <button
                                    type="button"
                                    disabled={!member.isActive}
                                    onClick={() => setSectionsModalUser({
                                      id: member.id,
                                      name: member.name,
                                      email: member.email,
                                      role: member.role,
                                      mode: Array.isArray(member.allowedSections) ? 'custom' : 'full',
                                      selectedSections: Array.isArray(member.allowedSections) ? [...member.allowedSections] : ['community']
                                    })}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all shadow-2xs disabled:opacity-50 ${
                                      Array.isArray(member.allowedSections)
                                        ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950'
                                        : 'border-slate-200 bg-white hover:bg-purple-50 text-[#5A1E65]'
                                    }`}
                                    title={`Configure specific admin sections for ${member.name}`}
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                    <span>{Array.isArray(member.allowedSections) ? `Sections (${member.allowedSections.length})` : 'Section Access'}</span>
                                  </button>
                                )}

                              <button
                                type="button"
                                disabled={!member.isActive}
                                onClick={() => {
                                  setPasswordModalUser(member);
                                  setModalPassword('');
                                  setShowModalPassword(false);
                                  setModalPasswordSuccess(null);
                                  setModalPasswordError('');
                                  setCopiedModalPassword(false);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-purple-50 text-xs font-bold text-[#5A1E65] cursor-pointer transition-all shadow-2xs disabled:opacity-50"
                                title={`Set or change password for ${member.name} (${member.email})`}
                              >
                                <KeyRound className="w-3.5 h-3.5 text-[#5A1E65]" />
                                <span>{member.hasPassword ? 'Change Password' : 'Set Password'}</span>
                              </button>

                              <button
                                type="button"
                                disabled={dispatchingOtpId === member.id || !member.isActive}
                                onClick={() => handleDispatchUserOtp(member)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-bold text-[#5A1E65] cursor-pointer disabled:opacity-50 transition-all"
                                title={`Dispatch fresh login OTP to ${member.email}`}
                              >
                                <Key className={`w-3.5 h-3.5 ${dispatchingOtpId === member.id ? 'animate-spin' : ''}`} />
                                <span>{dispatchingOtpId === member.id ? 'Dispatching...' : 'Dispatch OTP'}</span>
                              </button>

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

                {/* Modal: Configure Granular Section Permissions for Team Member */}
                {sectionsModalUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-purple-200 space-y-5 animate-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
                            <Sliders className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Configure Section Access</h3>
                            <p className="text-[11px] text-slate-500 font-mono truncate max-w-[320px]">
                              {sectionsModalUser.name} ({sectionsModalUser.email}) · Role: {sectionsModalUser.role}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSectionsModalUser(null)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveUserSections} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSectionsModalUser((prev) => ({ ...prev, mode: 'full' }))}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              sectionsModalUser.mode === 'full'
                                ? 'border-[#5A1E65] bg-purple-50/70 ring-2 ring-purple-200'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="text-xs font-extrabold text-slate-900">Full {sectionsModalUser.role} Access</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">Access all standard sections permitted for this role.</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSectionsModalUser((prev) => ({
                              ...prev,
                              mode: 'custom',
                              selectedSections: prev.selectedSections.length > 0 ? prev.selectedSections : ['community']
                            }))}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              sectionsModalUser.mode === 'custom'
                                ? 'border-[#5A1E65] bg-purple-50/70 ring-2 ring-purple-200'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="text-xs font-extrabold text-slate-900">Specific Sections Only</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">Restrict this user strictly to checked tabs (enforced on server &amp; UI).</div>
                          </button>
                        </div>

                        {sectionsModalUser.mode === 'custom' && (
                          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                                Quick Presets:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: 'Community Groups Only', ids: ['community'] },
                                  { label: 'Events Only', ids: ['events'] },
                                  { label: 'Directory Only', ids: ['directory'] },
                                  { label: 'Gallery & Media', ids: ['gallery', 'podcasts'] }
                                ].map((preset) => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => setSectionsModalUser((prev) => ({ ...prev, selectedSections: preset.ids }))}
                                    className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-[11px] font-bold text-[#5A1E65] cursor-pointer"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setSectionsModalUser((prev) => ({ ...prev, selectedSections: [] }))}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-600 cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                              {ADMIN_SECTIONS.map((sec) => {
                                const checked = sectionsModalUser.selectedSections.includes(sec.id);
                                return (
                                  <label
                                    key={sec.id}
                                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                      checked
                                        ? 'bg-white border-[#5A1E65] shadow-2xs'
                                        : 'bg-white/60 border-slate-200 hover:bg-white'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => setSectionsModalUser((prev) => ({
                                        ...prev,
                                        selectedSections: checked
                                          ? prev.selectedSections.filter((x) => x !== sec.id)
                                          : [...prev.selectedSections, sec.id]
                                      }))}
                                      className="mt-0.5 rounded accent-[#5A1E65] w-4 h-4 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <span className="text-xs font-bold text-slate-900 block leading-tight">{sec.label}</span>
                                      <span className="text-[10px] text-slate-500 block leading-snug">{sec.desc}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setSectionsModalUser(null)}
                            className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={sectionsModalSaving || (sectionsModalUser.mode === 'custom' && sectionsModalUser.selectedSections.length === 0)}
                            className="flex-1 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            {sectionsModalSaving ? 'Saving Access...' : 'Save Section Access'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Modal: Superadmin Set/Reset Password for Team Member */}
                {passwordModalUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-purple-200 space-y-5 animate-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Set Account Password</h3>
                            <p className="text-[11px] text-slate-500 font-mono truncate max-w-[240px]">{passwordModalUser.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPasswordModalUser(null)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {modalPasswordSuccess ? (
                        <div className="space-y-4">
                          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{modalPasswordSuccess.message}</span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700 block">Password for {passwordModalUser.name}:</label>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-sm text-slate-900 font-bold">
                              <span className="truncate mr-2 select-all">{modalPasswordSuccess.password}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(modalPasswordSuccess.password);
                                  setCopiedModalPassword(true);
                                  setTimeout(() => setCopiedModalPassword(false), 2000);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                              >
                                {copiedModalPassword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedModalPassword ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 italic">
                              Share this password with {passwordModalUser.email} so they can log in via the Password tab immediately.
                            </p>
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setPasswordModalUser(null)}
                              className="w-full py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveUserPassword} className="space-y-4">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Enter a new password or generate a strong random password. The staff member will be able to log in immediately using this password.
                          </p>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700 block">New Password</label>
                              <button
                                type="button"
                                onClick={handleGeneratePassword}
                                className="text-[11px] font-bold text-[#5A1E65] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Generate Secure Password</span>
                              </button>
                            </div>

                            <div className="relative">
                              <input
                                type={showModalPassword ? 'text' : 'password'}
                                required
                                value={modalPassword}
                                onChange={(e) => {
                                  setModalPassword(e.target.value);
                                  setModalPasswordError('');
                                }}
                                placeholder="Enter at least 12 characters..."
                                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-mono font-medium outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setShowModalPassword(!showModalPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>

                            {/* Validation Checklist */}
                            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 pt-1">
                              <span className={`flex items-center gap-1 ${modalPassword.length >= 12 ? 'text-emerald-700 font-bold' : ''}`}>
                                <Check className={`w-3 h-3 ${modalPassword.length >= 12 ? 'text-emerald-600' : 'text-slate-300'}`} />
                                12+ Characters
                              </span>
                              <span className={`flex items-center gap-1 ${/[A-Z]/.test(modalPassword) ? 'text-emerald-700 font-bold' : ''}`}>
                                <Check className={`w-3 h-3 ${/[A-Z]/.test(modalPassword) ? 'text-emerald-600' : 'text-slate-300'}`} />
                                Uppercase Letter
                              </span>
                              <span className={`flex items-center gap-1 ${/[a-z]/.test(modalPassword) ? 'text-emerald-700 font-bold' : ''}`}>
                                <Check className={`w-3 h-3 ${/[a-z]/.test(modalPassword) ? 'text-emerald-600' : 'text-slate-300'}`} />
                                Lowercase Letter
                              </span>
                              <span className={`flex items-center gap-1 ${/\d/.test(modalPassword) && /[^A-Za-z0-9]/.test(modalPassword) ? 'text-emerald-700 font-bold' : ''}`}>
                                <Check className={`w-3 h-3 ${/\d/.test(modalPassword) && /[^A-Za-z0-9]/.test(modalPassword) ? 'text-emerald-600' : 'text-slate-300'}`} />
                                Number & Symbol
                              </span>
                            </div>
                          </div>

                          {modalPasswordError && (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{modalPasswordError}</span>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setPasswordModalUser(null)}
                              className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={modalPasswordLoading || modalPassword.length < 12}
                              className="flex-1 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            >
                              {modalPasswordLoading ? 'Saving...' : 'Set Password'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* Grant Access to New Person Form */}
                <form
                  onSubmit={handleGrantAccess}
                  autoComplete="off"
                  className="pt-5 border-t border-slate-100 space-y-4"
                >
                  {/* Invisible decoy inputs to capture aggressive browser credential autofill */}
                  <input
                    type="text"
                    name="fake_admin_username_prevent_autofill"
                    tabIndex={-1}
                    aria-hidden="true"
                    autoComplete="off"
                    style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
                  />
                  <input
                    type="password"
                    name="fake_admin_password_prevent_autofill"
                    tabIndex={-1}
                    aria-hidden="true"
                    autoComplete="new-password"
                    style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
                  />

                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#5A1E65]" />
                    <h3 className="text-sm font-bold text-slate-900">Grant Admin Panel Access to Another Person</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter the person&apos;s verified email address (work or personal) to allow them into DCVC Admin. An onboarding 6-digit OTP verification code will be dispatched automatically to their email upon granting access.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="new-team-name" className="text-xs font-bold text-slate-700 block">Full Name</label>
                      <input
                        id="new-team-name"
                        name="new_team_member_name"
                        type="text"
                        required
                        autoComplete="off"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="e.g. Jordan Rivera"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="new-team-email" className="text-xs font-bold text-slate-700 block">Authorized Email (Auth0 SSO)</label>
                      <input
                        id="new-team-email"
                        name="new_team_member_email"
                        type="email"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck="false"
                        readOnly
                        onFocus={(e) => { e.currentTarget.readOnly = false; }}
                        onClick={(e) => { e.currentTarget.readOnly = false; }}
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="jordan@example.org"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                      />
                    </div>
                      <div className="space-y-1">
                        <label htmlFor="new-team-role" className="text-xs font-bold text-slate-700 block">Permission Role</label>
                        <select
                          id="new-team-role"
                          name="new_team_member_role"
                          value={newUserRole}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewUserRole(val);
                            if (val === 'admin') setNewUserUseCustomSections(false);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-bold bg-white outline-none"
                        >
                          <option value="admin">Admin — Full Access & Team Management</option>
                          <option value="approver">Approver — Directory Moderation</option>
                          <option value="editor">Editor — Content & Gallery</option>
                          <option value="read_only">Read Only — View Inbox & Reports</option>
                        </select>
                      </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="new-team-password" className="text-xs font-bold text-slate-700 block">Optional Local Password (leave blank for SSO-only)</label>
                        {newUserPassword && (
                          <button
                            type="button"
                            onClick={() => setNewUserPassword('')}
                            className="text-[10px] text-purple-700 font-bold hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="new-team-password"
                          name="new_team_member_password"
                          type={showNewUserPassword ? "text" : "password"}
                          autoComplete="new-password"
                          readOnly
                          onFocus={(e) => { e.currentTarget.readOnly = false; }}
                          onClick={(e) => { e.currentTarget.readOnly = false; }}
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Leave blank for Auth0 SSO (Recommended)"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] text-xs font-medium outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showNewUserPassword ? "Hide password" : "Show password"}
                        >
                          {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    </div>

                    {newUserRole !== 'admin' && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block">Admin Section Access Scope</span>
                            <span className="text-[11px] text-slate-500">Give access to all sections for this role, or restrict strictly to chosen sections (e.g. Community Groups only).</span>
                          </div>
                          <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1 shrink-0 self-start">
                            <button
                              type="button"
                              onClick={() => setNewUserUseCustomSections(false)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                !newUserUseCustomSections ? 'bg-[#5A1E65] text-white' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              All Role Sections
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewUserUseCustomSections(true)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                newUserUseCustomSections ? 'bg-[#5A1E65] text-white' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              Specific Sections Only
                            </button>
                          </div>
                        </div>

                        {newUserUseCustomSections && (
                          <div className="space-y-2.5 pt-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1">Presets:</span>
                              {[
                                { label: 'Community Groups Only', ids: ['community'] },
                                { label: 'Events Only', ids: ['events'] },
                                { label: 'Directory Only', ids: ['directory'] },
                                { label: 'Gallery & Media', ids: ['gallery', 'podcasts'] }
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => setNewUserAllowedSections(preset.ids)}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-[11px] font-bold text-[#5A1E65] cursor-pointer"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                              {ADMIN_SECTIONS.map((sec) => {
                                const checked = newUserAllowedSections.includes(sec.id);
                                return (
                                  <label
                                    key={sec.id}
                                    className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                                      checked ? 'bg-white border-[#5A1E65] shadow-2xs' : 'bg-white/60 border-slate-200 hover:bg-white'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => setNewUserAllowedSections((prev) =>
                                        checked ? prev.filter((x) => x !== sec.id) : [...prev, sec.id]
                                      )}
                                      className="mt-0.5 rounded accent-[#5A1E65] w-3.5 h-3.5 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <span className="text-[11px] font-bold text-slate-900 block leading-tight">{sec.label}</span>
                                      <span className="text-[10px] text-slate-500 block leading-tight">{sec.group}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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

                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row items-center gap-6 p-5 rounded-2xl bg-white border border-purple-200">
                        {setupQrDataUrl ? (
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <img
                              src={setupQrDataUrl}
                              alt="Authenticator 2FA QR Code"
                              className="w-44 h-44 rounded-xl border border-purple-100 p-2 bg-white shadow-xs"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Point Camera & Scan</span>
                          </div>
                        ) : (
                          <div className="w-44 h-44 rounded-xl border border-purple-100 bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-600 mr-1.5" />
                            <span>Loading QR...</span>
                          </div>
                        )}

                        <div className="space-y-3 min-w-0 flex-1">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            Open <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>1Password</strong> on your mobile phone, select <strong>Add Account</strong>, and scan the QR code.
                          </p>
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 block">Manual Setup Key:</span>
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-purple-100 flex items-center justify-between font-mono text-xs tracking-wider text-slate-900 font-bold">
                              <span className="truncate mr-2 select-all">{setupTotpData.formattedKey}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(setupTotpData.secret);
                                  setCopiedKey(true);
                                  setTimeout(() => setCopiedKey(false), 2000);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-[#5A1E65] text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                              >
                                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="pt-0.5">
                            <a
                              href={setupTotpData.otpauthUri}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A1E65] hover:underline"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>Tap to register directly on this device</span>
                            </a>
                          </div>
                        </div>
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
                  <h3 className="text-base font-bold text-slate-900">
                    {user?.hasPassword === false ? 'Set Account Password' : 'Change Staff Password'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Requires at least 12 characters with uppercase, lowercase, number, and symbol. {user?.hasPassword === false ? 'Allows you to sign in directly with Email and Password without relying on OTP delivery.' : 'Rotating your password revokes older sessions everywhere.'}
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
                {user?.hasPassword !== false && (
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
                )}
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

      {/* Undo Confirmation Modal */}
      {undoConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-amber-200 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-black text-slate-950">
                Confirm Undo Change
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to undo the most recent published change? This will immediately restore the previous live state ({undoHistory.length}/5 undo steps available).
              </p>
              {undoHistory[0] && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Change to Revert:</span>
                  <span className="font-extrabold block">{undoHistory[0].actionLabel}</span>
                  <span className="text-[11px] text-slate-600 block">
                    By {undoHistory[0].actorEmail} · v{undoHistory[0].prevVersion} → v{undoHistory[0].newVersion}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={undoLoading}
                onClick={() => setUndoConfirmOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={undoLoading || undoHistory.length === 0}
                onClick={handleConfirmUndo}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {undoLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Reverting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirm Undo</span>
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

