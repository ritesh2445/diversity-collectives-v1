import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mail, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Lock, 
  LogOut, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Inbox, 
  Briefcase, 
  Calendar, 
  Search,
  Check,
  X,
  ArrowRight,
  Clock,
  ChevronRight
} from 'lucide-react';
import { usePageMeta } from '../utils/seo';

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
    headline: 'Ventura County Pride 2026: Celebrating Resilience, Joy & Sanctuary',
    authorName: 'Tess Allen',
    authorTitle: 'Executive Director',
    content: `We are overjoyed to officially announce the dates for the 27th annual Ventura County Pride Festival!

Join thousands of community members, families, affirming businesses, and queer creators at Plaza Park in downtown Ventura for a historic celebration of resilience and sanctuary.

Festival Highlights for 2026:
• Main Stage Musical Performances & Drag Headliners
• Youth & Teen Sanctuary Pavilion hosted by Rainbow Umbrella
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

export default function Admin() {
  usePageMeta({
    title: 'Administrative Portal & Newsletter Studio | DCVC',
    description: 'Diversity Collective staff and board administrative portal.',
    canonicalPath: '/admin'
  });

  // Auth State
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dcvc_admin_token') || localStorage.getItem('dcvc_admin_token') || '';
    }
    return '';
  });
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('admin@diversitycollective.org');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Tab: 'newsletter' | 'directory' | 'inquiries' | 'audit'
  const [activeTab, setActiveTab] = useState('newsletter');

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
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // { success: boolean, message: string }
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Directory & Inquiries State
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [inquiryType, setInquiryType] = useState('contact');

  // Load user session on mount
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  // Load tab data
  useEffect(() => {
    if (user && token) {
      if (activeTab === 'newsletter') fetchSubscriberStats();
      if (activeTab === 'directory') fetchPendingBusinesses();
      if (activeTab === 'inquiries') fetchInquiries(inquiryType);
    }
  }, [user, activeTab, inquiryType]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (data.success && data.token) {
        sessionStorage.setItem('dcvc_admin_token', data.token);
        localStorage.setItem('dcvc_admin_token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setAuthError(data.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err) {
      setAuthError('Connection failure reaching administrative endpoint. Please retry.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dcvc_admin_token');
    localStorage.removeItem('dcvc_admin_token');
    setToken('');
    setUser(null);
  };

  const fetchSubscriberStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/newsletter/subscribers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriberStats(data);
      }
    } catch (err) {
      console.warn('Could not load subscriber stats:', err);
    }
  };

  const fetchPendingBusinesses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/directory?status=pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
        headers: { 'Authorization': `Bearer ${token}` }
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
  // VIEW: Login Screen
  // =========================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 py-16">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#5A1E65] border border-purple-200">
              Staff & Board Access
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
              DCVC Administrative Portal
            </h1>
            <p className="text-xs text-slate-500">
              Sign in with your authorized Diversity Collective staff credentials to access the Newsletter Studio, Directory moderation, and operational inquiries.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="admin@diversitycollective.org"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 text-sm font-medium outline-none"
                placeholder="••••••••••••••••"
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
                  <span>Sign In to Admin Workspace</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Protected by PBKDF2-SHA256 authenticated encryption & audit logging.
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
    <div className="min-h-screen bg-slate-50/60 pb-24">
      
      {/* Top Admin Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5A1E65] to-purple-900 flex items-center justify-center text-white font-black text-sm shadow-xs">
              DC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-slate-950 text-sm sm:text-base">
                  DCVC Admin Workspace
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-[#5A1E65]">
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Diversity Collective Ventura County · Administrative Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block">{user.name}</span>
              <span className="text-[10px] text-slate-400 block">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto border-t border-slate-100">
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'newsletter'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Newsletter Studio</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-200/80 text-purple-900 font-bold">
              {subscriberStats.activeSubscribers}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'directory'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Directory Moderation</span>
            {pendingBusinesses.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
                {pendingBusinesses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'inquiries'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Operational Inquiries</span>
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ================================================================= */}
        {/* TAB 1: NEWSLETTER STUDIO                                          */}
        {/* ================================================================= */}
        {activeTab === 'newsletter' && (
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
                          <strong>Support Community Sanctuary:</strong> Diversity Collective is Ventura County's only LGBTQ+ Community Resource Center. Our free programs are made possible by donors like you.
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
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-display text-base font-black text-slate-950">
                    Active Subscriber Registry ({subscriberStats.totalSubscribers} Total)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified opt-ins with timestamps and CAN-SPAM compliance records.
                  </p>
                </div>
                <button
                  onClick={fetchSubscriberStats}
                  className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Subscriber Email</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Opt-In Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {subscriberStats.subscribers && subscriberStats.subscribers.length > 0 ? (
                      subscriberStats.subscribers.map((sub) => (
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
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 italic">
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

        {/* ================================================================= */}
        {/* TAB 2: DIRECTORY MODERATION                                       */}
        {/* ================================================================= */}
        {activeTab === 'directory' && (
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

        {/* ================================================================= */}
        {/* TAB 3: OPERATIONAL INQUIRIES                                      */}
        {/* ================================================================= */}
        {activeTab === 'inquiries' && (
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
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['contact', 'volunteer', 'training', 'accessibility'].map((t) => (
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

      </main>

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

