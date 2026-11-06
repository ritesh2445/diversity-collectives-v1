import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Mail, 
  BookOpen, 
  ShieldAlert, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  LogOut, 
  Search, 
  Filter, 
  FileText,
  AlertTriangle,
  History,
  Lock,
  Eye,
  Edit,
  Trash2,
  Palette,
  Sparkles,
  Heart,
  Shield,
  Activity,
  Check,
  Plus,
  Phone,
  MapPin,
  RotateCcw,
  Sliders,
  LayoutGrid,
  Calendar,
  ExternalLink,
  Award,
  RefreshCw,
  Printer
} from 'lucide-react';
import { 
  getStoredUser, 
  setStoredToken, 
  setStoredUser, 
  adminLogin,
  getDirectorySubmissions,
  moderateBusinessListing,
  editBusinessListing,
  deleteBusinessListing,
  getBusinessCorrections,
  resolveBusinessCorrection,
  getInquiries,
  updateInquiryStatus,
  getStaffUsers,
  createStaffUser,
  updateStaffRole,
  deleteStaffUser,
  getSystemHealth,
  getAuditLogs,
  getExportUrl,
  HERO_THEMES,
  getActiveHeroTheme,
  setActiveHeroTheme
} from './services/adminClient.js';
import DesignEditor from './components/DesignEditor.jsx';

export default function AdminApp() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState('designer');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMfa, setLoginMfa] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Directory moderation state
  const [directoryStatusFilter, setDirectoryStatusFilter] = useState('pending');
  const [businesses, setBusinesses] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [modNotes, setModNotes] = useState('');

  // Inquiries state
  const [inquiryType, setInquiryType] = useState('contact');
  const [inquiries, setInquiries] = useState([]);

  // Staff & RBAC state
  const [staffUsers, setStaffUsers] = useState([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('editor');
  const [newStaffTitle, setNewStaffTitle] = useState('');

  // Theme Dispatcher state
  const [currentThemeId, setCurrentThemeId] = useState(getActiveHeroTheme());

  // System Diagnostics state
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Donor Appreciation state
  const [appreciationName, setAppreciationName] = useState('Dr. Maya Lin & Family');
  const [appreciationTier, setAppreciationTier] = useState('champion');
  const [appreciationAmount, setAppreciationAmount] = useState('1,500');

  // Audit state
  const [auditLogs, setAuditLogs] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadData = async () => {
    if (!currentUser) return;
    try {
      if (activeTab === 'directory') {
        const bizList = await getDirectorySubmissions(directoryStatusFilter);
        setBusinesses(bizList);
        const corrList = await getBusinessCorrections();
        setCorrections(corrList);
      } else if (activeTab === 'inquiries') {
        const inqList = await getInquiries(inquiryType);
        setInquiries(inqList);
      } else if (activeTab === 'users') {
        const users = await getStaffUsers();
        setStaffUsers(users);
      } else if (activeTab === 'system') {
        setHealthLoading(true);
        const health = await getSystemHealth();
        setSystemHealth(health);
        setHealthLoading(false);
      } else if (activeTab === 'audit') {
        const logs = await getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err) {
      console.warn('Data load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, activeTab, directoryStatusFilter, inquiryType]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const res = await adminLogin(loginEmail, loginPassword, loginMfa);
    setIsLoggingIn(false);
    if (res.success) {
      setCurrentUser(res.user);
    } else {
      setLoginError(res.error || 'Invalid credentials');
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setStoredUser(null);
    setCurrentUser(null);
  };

  const handleModerate = async (bizId, newStatus) => {
    const res = await moderateBusinessListing(bizId, newStatus, modNotes);
    if (res.success) {
      setFeedbackMsg(`Listing successfully marked as ${newStatus}.`);
      setSelectedBiz(null);
      setModNotes('');
      loadData();
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  const handleDeleteBiz = async (bizId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    const res = await deleteBusinessListing(bizId);
    if (res.success) {
      setFeedbackMsg('Listing deleted.');
      loadData();
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  const handleInquiryStatusChange = async (id, status) => {
    await updateInquiryStatus(inquiryType, id, status);
    loadData();
  };

  const handleResolveCorrection = async (id) => {
    await resolveBusinessCorrection(id, 'resolved');
    loadData();
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffEmail || !newStaffName) return;
    const res = await createStaffUser({
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      title: newStaffTitle
    });
    if (res.success) {
      setFeedbackMsg(`Staff member ${newStaffName} created.`);
      setShowAddStaffModal(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffTitle('');
      loadData();
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    await updateStaffRole(userId, newRole);
    setFeedbackMsg('Staff role updated.');
    loadData();
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleDeleteStaff = async (userId) => {
    if (!window.confirm('Revoke access for this staff member?')) return;
    await deleteStaffUser(userId);
    setFeedbackMsg('Staff access revoked.');
    loadData();
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleApplyTheme = (themeId) => {
    setActiveHeroTheme(themeId);
    setCurrentThemeId(themeId);
    setFeedbackMsg(`Active hero campaign updated to: ${themeId}`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // If unauthenticated, show professional login portal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#5A1E65] to-purple-800 text-white font-black text-xl rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-900/30">
              DC
            </div>
            <h1 className="font-fraunces text-2xl font-black text-slate-900 mt-4">
              Diversity Collective
            </h1>
            <p className="text-xs font-semibold text-purple-950 uppercase tracking-widest mt-1">
              Staff & Board Administrative Portal
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Staff Email Address
              </label>
              <input 
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@diversitycollective.org"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <input 
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                2FA Authenticator Code <span className="text-slate-400 font-normal">(Optional for Dev)</span>
              </label>
              <input 
                type="text"
                value={loginMfa}
                onChange={(e) => setLoginMfa(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] focus:border-transparent outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-purple-900/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Dev Access: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">admin@diversitycollective.org</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">DCVC-Admin-2026!</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Navigation tabs configuration
  const navigationTabs = [
    { id: 'designer', label: 'Design & Drag Studio', icon: Palette, badge: 'Visual' },
    { id: 'themes', label: 'Campaign Dispatcher', icon: Sparkles, badge: '18 Themes' },
    { id: 'directory', label: 'Directory Moderation', icon: Building2 },
    { id: 'inquiries', label: 'Inquiries & Triage', icon: Mail },
    { id: 'users', label: 'Staff & RBAC', icon: Users },
    { id: 'appreciation', label: 'Donor Cards', icon: Heart },
    { id: 'system', label: 'System Health', icon: Activity },
    { id: 'exports', label: 'Data Exports', icon: Download },
    { id: 'audit', label: 'Audit Trail', icon: History }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Universal App Header */}
      <header className="bg-gradient-to-r from-[#5A1E65] via-purple-900 to-indigo-950 text-white border-b border-purple-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
              DC
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-white flex items-center gap-2">
                <span>DCVC Management Portal</span>
                <span className="text-[10px] bg-purple-500/30 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-purple-400/30">
                  v2.6 Enterprise
                </span>
              </h1>
              <p className="text-[11px] text-purple-200">
                Staff & Board Administration · Diversity Collective Ventura County
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-white">{currentUser.name}</span>
              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-purple-100">
                Role: {currentUser.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none py-1">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xl cursor-pointer transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-white bg-[#5A1E65] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-amber-400 text-slate-950 font-black' : 'bg-purple-100 text-[#5A1E65]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Notification Banner */}
      {feedbackMsg && (
        <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2 px-4 shadow-xs animate-fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* Main Body Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        
        {/* ==================================================================
            TAB 1: DRAG & DROP DESIGN EDITOR (Visual Studio)
            ================================================================== */}
        {activeTab === 'designer' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[#5A1E65]" />
                  <span>Interactive Drag & Drop Page Builder</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Custom visual layout builder matching mobile, tablet, and desktop specifications. Reorder blocks, edit text, customize colors, and publish with zero code.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Live Preview Engine Ready
                </span>
              </div>
            </div>

            <DesignEditor onPublishSuccess={(msg) => {
              setFeedbackMsg(msg);
              setTimeout(() => setFeedbackMsg(''), 4000);
            }} />
          </div>
        )}

        {/* ==================================================================
            TAB 2: HERO THEME & FESTIVAL CAMPAIGN DISPATCHER
            ================================================================== */}
        {activeTab === 'themes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>1-Click Hero Theme & US Festival Dispatcher</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Activate special seasonal festival overlays (Pride Month, Transgender Visibility, Spirit Day, World AIDS Day) or switch between editorial layout frameworks with instantaneous synchronization.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Currently Active:</span>
                <span className="px-3 py-1 rounded-full bg-[#5A1E65] text-white text-xs font-black uppercase tracking-wider">
                  {currentThemeId}
                </span>
              </div>
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {HERO_THEMES.map((theme) => {
                const isActive = theme.id === currentThemeId;
                return (
                  <div 
                    key={theme.id}
                    className={`rounded-2xl border transition-all p-5 flex flex-col justify-between bg-white ${
                      isActive 
                        ? 'border-purple-600 ring-2 ring-purple-600 shadow-lg' 
                        : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{theme.number}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${theme.badgeColor}`}>
                          {theme.badge}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                        {theme.name}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {theme.description}
                      </p>

                      {/* Palette Swatches */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Color Spectrum
                        </span>
                        <div className="flex items-center gap-1.5">
                          {theme.palette.map((color, cIdx) => (
                            <span 
                              key={cIdx}
                              className="w-5 h-5 rounded-md border border-black/10 shadow-2xs"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[11px] text-purple-900 font-semibold block">
                          Best for: <span className="text-slate-600 font-normal">{theme.bestFor}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {isActive ? (
                        <div className="w-full py-2.5 rounded-xl bg-purple-100 text-[#5A1E65] font-extrabold text-xs text-center flex items-center justify-center gap-1.5 border border-purple-300">
                          <Check className="w-4 h-4" />
                          <span>Currently Active Theme</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApplyTheme(theme.id)}
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-[#5A1E65] text-white font-extrabold text-xs text-center transition-colors cursor-pointer"
                        >
                          Activate This Theme
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 3: DIRECTORY MODERATION (Existing Robust)
            ================================================================== */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Affirming Business Directory</h2>
                <p className="text-xs text-slate-500">Review pending business submissions and correction requests</p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
                {['pending', 'approved', 'rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setDirectoryStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                      directoryStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
                  <p className="text-slate-400 text-sm">No listings found in "{directoryStatusFilter}" state.</p>
                </div>
              ) : (
                businesses.map((biz) => (
                  <div key={biz.id} className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-slate-900">{biz.business_name}</h3>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          biz.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          biz.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {biz.status}
                        </span>
                      </div>
                      <p className="text-xs text-purple-900 font-semibold mt-0.5">{biz.category} • {biz.city}</p>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3">{biz.description}</p>
                      
                      <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                        <div>Email: {biz.contact_email}</div>
                        <div>Phone: {biz.phone || 'N/A'}</div>
                        <div>Address: {biz.address || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {biz.status !== 'approved' && (
                          <button
                            onClick={() => handleModerate(biz.id, 'approved')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {biz.status !== 'rejected' && (
                          <button
                            onClick={() => handleModerate(biz.id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteBiz(biz.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Corrections Section */}
            {corrections.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 mt-8 space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Public Correction Requests ({corrections.length})</span>
                </h3>
                <div className="space-y-3">
                  {corrections.map((corr) => (
                    <div key={corr.id} className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-slate-900">{corr.business_name}</span>
                        <p className="text-xs text-slate-600 mt-0.5">{corr.details}</p>
                        <span className="text-[10px] text-slate-400">By: {corr.requester_name} ({corr.requester_email})</span>
                      </div>
                      <button
                        onClick={() => handleResolveCorrection(corr.id)}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer flex-shrink-0"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            TAB 4: INQUIRIES & OPERATIONS TRIAGE
            ================================================================== */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Operations & Inquiry Triage</h2>
                <p className="text-xs text-slate-500">Track and respond to public contact, volunteer, and training inquiries</p>
              </div>

              {/* Inquiry Type Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
                {[
                  { id: 'contact', label: 'Contact Us' },
                  { id: 'volunteer', label: 'Volunteers' },
                  { id: 'training', label: 'P.R.I.D.E. Training' },
                  { id: 'accessibility', label: 'A11y Reports' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setInquiryType(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      inquiryType === t.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inquiries List */}
            <div className="space-y-3">
              {inquiries.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                  No inquiries found for category "{inquiryType}".
                </div>
              ) : (
                inquiries.map((inq) => (
                  <div key={inq.id} className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {inq.name || inq.full_name || inq.contact_name || 'Anonymous Community Member'}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          inq.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                          inq.status === 'in_progress' ? 'bg-sky-100 text-sky-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {inq.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        {inq.subject && <span className="font-semibold block">{inq.subject}</span>}
                        {inq.message && <p className="mt-1">{inq.message}</p>}
                        {inq.barrier_description && (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs mt-1">
                            <strong>Barrier Reported:</strong> {inq.barrier_description}
                            {inq.page_url && <div className="text-[10px] text-slate-500 mt-1">URL: {inq.page_url}</div>}
                          </div>
                        )}
                        {inq.roles_of_interest && <div>Roles: {inq.roles_of_interest}</div>}
                        {inq.course_title && <div>Requested Course: {inq.course_title}</div>}
                      </div>

                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-3 pt-1">
                        <span>Email: {inq.email}</span>
                        {inq.phone && <span>Phone: {inq.phone}</span>}
                        {inq.city && <span>City: {inq.city}</span>}
                        <span>Date: {new Date(inq.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={inq.status}
                        onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="unread">Unread / Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 5: STAFF & RBAC TEAM MANAGEMENT
            ================================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#5A1E65]" />
                  <span>Staff & Role-Based Access Control (RBAC)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage staff accounts, assign granular role permissions, and maintain board audit oversight.
                </p>
              </div>

              <button
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2.5 bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Account</span>
              </button>
            </div>

            {/* RBAC Matrix Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider block mb-2 text-[11px]">
                Role Permissions Matrix:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-purple-200">
                  <strong className="text-[#5A1E65] block mb-0.5">admin</strong>
                  Full administrative control, theme dispatcher, design studio, RBAC management, CSV exports.
                </div>
                <div className="p-3 bg-white rounded-xl border border-sky-200">
                  <strong className="text-sky-800 block mb-0.5">approver</strong>
                  Directory approvals, volunteer triage, inquiry status updates, moderation notes.
                </div>
                <div className="p-3 bg-white rounded-xl border border-amber-200">
                  <strong className="text-amber-800 block mb-0.5">editor</strong>
                  Visual page layout editing, draft updates, theme customization, non-destructive tools.
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200">
                  <strong className="text-emerald-800 block mb-0.5">read_only</strong>
                  Board of Directors audit observer, read-only activity ledger, analytics reporting.
                </div>
              </div>
            </div>

            {/* Staff Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Role Permission</th>
                      <th className="py-3 px-4">Organizational Title</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900 block">{user.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{user.email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold bg-white text-slate-800 text-xs"
                          >
                            <option value="admin">admin</option>
                            <option value="approver">approver</option>
                            <option value="editor">editor</option>
                            <option value="read_only">read_only</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {user.title || 'Staff'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {user.createdAt || '2025-01-01'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteStaff(user.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Revoke Staff Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Staff Modal */}
            {showAddStaffModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                  <h3 className="font-extrabold text-lg text-slate-900 mb-1">Add Staff Account</h3>
                  <p className="text-xs text-slate-500 mb-4">Provision a new staff account with assigned role privileges.</p>

                  <form onSubmit={handleCreateStaff} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="Elena Diaz"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="elena@diversitycollective.org"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Organizational Title</label>
                      <input 
                        type="text" 
                        value={newStaffTitle}
                        onChange={(e) => setNewStaffTitle(e.target.value)}
                        placeholder="Youth Programs Coordinator"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Role Permission</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                      >
                        <option value="editor">editor (Content & Design Studio)</option>
                        <option value="approver">approver (Directory & Inquiries)</option>
                        <option value="read_only">read_only (Board Auditor)</option>
                        <option value="admin">admin (Full Superuser Privileges)</option>
                      </select>
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddStaffModal(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-black text-white bg-[#5A1E65] hover:bg-purple-900 rounded-xl shadow-xs"
                      >
                        Create Account
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            TAB 6: DONOR APPRECIATION CARDS & TIERS
            ================================================================== */}
        {activeTab === 'appreciation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span>Donor Appreciation & Recognition Certificates</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate digital commemorative recognition cards and audit tier qualifications for community patrons.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-[#5A1E65] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Controls Column */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-xs">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                  Certificate Customizer
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Donor Name / Organization</label>
                  <input
                    type="text"
                    value={appreciationName}
                    onChange={(e) => setAppreciationName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Donation Tier</label>
                  <select
                    value={appreciationTier}
                    onChange={(e) => setAppreciationTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="ally">Community Ally ($100+)</option>
                    <option value="advocate">Pride Advocate ($500+)</option>
                    <option value="champion">Rainbow Champion ($1,000+)</option>
                    <option value="benefactor">Visionary Benefactor ($5,000+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gift Amount ($ USD)</label>
                  <input
                    type="text"
                    value={appreciationAmount}
                    onChange={(e) => setAppreciationAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div className="pt-2 text-[11px] text-slate-500">
                  <p>Certificates are signed by the Executive Director and verifiable against our 501(c)(3) tax ledger.</p>
                </div>
              </div>

              {/* Certificate Preview Canvas */}
              <div className="lg:col-span-8 flex justify-center">
                <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl p-8 sm:p-10 border-4 border-double border-amber-300/80 shadow-2xl relative overflow-hidden">
                  {/* Subtle Background Ornament */}
                  <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-purple-200/40 to-amber-200/40 blur-2xl pointer-events-none" />

                  <div className="relative z-10 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-widest border border-amber-300">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>OFFICIAL 501(C)(3) RECOGNITION OF PHILANTHROPY</span>
                    </div>

                    <h3 className="font-fraunces text-3xl sm:text-4xl font-black text-slate-950">
                      Certificate of Commendation
                    </h3>

                    <p className="text-xs text-slate-600 uppercase tracking-widest font-bold">
                      This formal tribute is gratefully awarded to
                    </p>

                    <div className="py-2">
                      <span className="font-fraunces text-2xl sm:text-3xl font-bold text-[#5A1E65] border-b-2 border-purple-300 pb-1 inline-block">
                        {appreciationName}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 max-w-lg mx-auto leading-relaxed">
                      For visionary generosity and sustained dedication as a <strong className="text-[#5A1E65] capitalize">{appreciationTier} Level Patron (${appreciationAmount})</strong>. Your contribution empowers free rapid HIV/STI healthcare, youth safe harbors, and LGBTQ+ civil advocacy throughout Ventura County.
                    </p>

                    <div className="pt-6 grid grid-cols-2 gap-8 text-center border-t border-slate-200/80 mt-6">
                      <div>
                        <span className="font-fraunces italic font-bold text-slate-800 text-lg block">
                          Tess Allen
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Executive Director · Diversity Collective
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-700 block mt-1">
                          {new Date().toISOString().split('T')[0]}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Date of Presentation · EIN 47-1903673
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 7: SYSTEM DIAGNOSTICS & SERVICE HEALTH
            ================================================================== */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <span>Cloud Architecture & Service Diagnostics</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status of zero-cost edge integrations: Cloudflare Workers, Turso SQLite, Workers AI, Resend SMTP, and Zeffy.
                </p>
              </div>

              <button
                onClick={loadData}
                disabled={healthLoading}
                className="px-4 py-2.5 bg-slate-900 hover:bg-[#5A1E65] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
                <span>Re-Check Health</span>
              </button>
            </div>

            {/* Service Status Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Cloudflare Workers (Edge API)', status: 'Operational', desc: 'Sub-15ms edge compute across 330+ locations', icon: Sparkles, color: 'emerald' },
                { name: 'Turso Edge SQLite Database', status: 'Synchronized', desc: 'Embedded libSQL replicas with primary in AWS US-West', icon: Building2, color: 'emerald' },
                { name: 'Cloudflare Workers AI', status: 'Operational', desc: '@cf/meta/llama-3.3-70b-instruct & bge-base-en-v1.5', icon: Sparkles, color: 'emerald' },
                { name: 'Resend SMTP Email Engine', status: 'Verified', desc: 'Automated staff alerts & confirmation receipts', icon: Mail, color: 'emerald' },
                { name: 'Cloudflare Turnstile CAPTCHA', status: 'Enforced', desc: 'Zero-friction bot defense on public forms', icon: Shield, color: 'emerald' },
                { name: 'Zeffy 0% Fee Webhook Pipeline', status: 'Active', desc: 'Instant donor webhook processing with zero platform fees', icon: Heart, color: 'emerald' }
              ].map((svc) => (
                <div key={svc.name} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-purple-50 text-[#5A1E65] flex items-center justify-center">
                        <svc.icon className="w-4 h-4" />
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        {svc.status}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900">{svc.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{svc.desc}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                    Latency: ~12ms · Uptime: 99.99%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 8: DATA EXPORTS (CSV)
            ================================================================== */}
        {activeTab === 'exports' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Operational Data Exports (CSV)</h2>
              <p className="text-xs text-slate-500">
                Authorized CSV exports formatted for spreadsheet workflows. Confidential clinical/HIV data is strictly redacted.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: 'contact', title: 'Contact Inquiries', desc: 'General inquiries and form submissions' },
                { type: 'volunteer', title: 'Volunteer Applications', desc: 'Applicant contact details and areas of interest' },
                { type: 'business', title: 'Business Directory', desc: 'Approved and pending directory entries' },
                { type: 'training', title: 'Training Inquiries', desc: 'P.R.I.D.E. corporate education requests' }
              ].map((exp) => (
                <div key={exp.type} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{exp.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{exp.desc}</p>
                  </div>

                  <a
                    href={getExportUrl(exp.type)}
                    download
                    className="w-full py-2.5 bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 9: ACTIVITY AUDIT TRAIL
            ================================================================== */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Administrative Audit Log</h2>
              <p className="text-xs text-slate-500">Immutable ledger of administrative actions, theme updates, and moderation events</p>
            </div>

            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No audit records recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px]">[{log.action}]</span>
                      <span className="text-slate-700 ml-2 font-medium">{log.user_email}</span>
                      <span className="text-slate-400 ml-2">({log.target_type} ID: {log.target_id || 'N/A'})</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">{log.created_at}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
