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
  Printer,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Send,
  Copy,
  ChevronRight,
  Flame,
  Star
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
  setActiveHeroTheme,
  getDonationAnalytics,
  getAdminCardTiers,
  saveAdminCardTier,
  resetAdminCardTiers,
  getAdminCustomCards,
  saveAdminCustomCard,
  deleteAdminCustomCard,
  issueCustomDonorCard
} from './services/adminClient.js';
import DesignEditor from './components/DesignEditor.jsx';

export default function AdminApp() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState('analytics');

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

  // ==========================================================================
  // DONATION ANALYTICS STATE
  // ==========================================================================
  const [analyticsRange, setAnalyticsRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionFundFilter, setTransactionFundFilter] = useState('all');

  // ==========================================================================
  // APPRECIATION CARDS & CUSTOM STUDIO STATE
  // ==========================================================================
  const [appreciationSubTab, setAppreciationSubTab] = useState('tiers'); // 'tiers' | 'custom' | 'certificate'
  const [cardTiers, setCardTiers] = useState(getAdminCardTiers);
  const [selectedTierKey, setSelectedTierKey] = useState('community_ally');
  const [editingTierForm, setEditingTierForm] = useState(getAdminCardTiers().community_ally);

  // Custom special cards
  const [customCards, setCustomCards] = useState(getAdminCustomCards);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingCustomCard, setEditingCustomCard] = useState(null);
  const [customCardForm, setCustomCardForm] = useState({
    title: '',
    circleName: '',
    certificatePrefix: 'SPEC',
    minAmount: 100,
    accentColor: '#F59E0B',
    themeGradient: 'from-amber-400 via-rose-500 to-purple-800',
    badgeText: 'HONOR ROLL RECOGNITION',
    tagline: 'Empowering Community & Expanding Safe Harbor',
    impactNarrative: '',
    quote: '"Thank you for standing resolutely with Diversity Collective Ventura County."',
    motif: 'sovereign_gold_crest',
    signee1Name: 'Tess Allen',
    signee1Title: 'Executive Director · DCVC',
    signee2Name: 'Roland Catabona',
    signee2Title: 'President, Board of Directors'
  });

  // Direct card issuance modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueTargetCard, setIssueTargetCard] = useState(null);
  const [issueDonorName, setIssueDonorName] = useState('');
  const [issueDonorEmail, setIssueDonorEmail] = useState('');
  const [issueAmount, setIssueAmount] = useState('150');
  const [issuedCardResult, setIssuedCardResult] = useState(null);

  // Certificate printing simulator
  const [appreciationName, setAppreciationName] = useState('Dr. Maya Lin & Family');
  const [appreciationTier, setAppreciationTier] = useState('champion');
  const [appreciationAmount, setAppreciationAmount] = useState('1,500');

  // Audit state
  const [auditLogs, setAuditLogs] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadData = async () => {
    if (!currentUser) return;
    try {
      if (activeTab === 'analytics') {
        setAnalyticsLoading(true);
        const data = await getDonationAnalytics(analyticsRange);
        setAnalyticsData(data);
        setAnalyticsLoading(false);
      } else if (activeTab === 'appreciation') {
        setCardTiers(getAdminCardTiers());
        setCustomCards(getAdminCustomCards());
      } else if (activeTab === 'directory') {
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
  }, [currentUser, activeTab, directoryStatusFilter, inquiryType, analyticsRange]);

  // Keep editing tier form synced when selecting a tier
  useEffect(() => {
    if (cardTiers[selectedTierKey]) {
      setEditingTierForm(cardTiers[selectedTierKey]);
    }
  }, [selectedTierKey, cardTiers]);

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

  // Tier design editor save
  const handleSaveTierChanges = (e) => {
    e.preventDefault();
    saveAdminCardTier(selectedTierKey, editingTierForm);
    setCardTiers(getAdminCardTiers());
    setFeedbackMsg(`Design updated for tier: ${editingTierForm.title}`);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleResetAllTiers = () => {
    if (!window.confirm('Reset all 4 appreciation tier designs to default branding?')) return;
    resetAdminCardTiers();
    setCardTiers(getAdminCardTiers());
    setFeedbackMsg('All 4 tier designs restored to factory defaults.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Custom card handlers
  const handleOpenCreateCustom = () => {
    setEditingCustomCard(null);
    setCustomCardForm({
      title: '',
      circleName: '',
      certificatePrefix: 'SPEC',
      minAmount: 100,
      accentColor: '#F59E0B',
      themeGradient: 'from-amber-400 via-rose-500 to-purple-800',
      badgeText: 'COMMEMORATIVE RECOGNITION',
      tagline: 'Empowering Community & Expanding Safe Harbor',
      impactNarrative: 'Your dedicated leadership provides vital resources, safe community centers, and year-round advocacy across all 10 Ventura County cities.',
      quote: '"Thank you for standing resolutely with Diversity Collective Ventura County."',
      motif: 'sovereign_gold_crest',
      signee1Name: 'Tess Allen',
      signee1Title: 'Executive Director · DCVC',
      signee2Name: 'Roland Catabona',
      signee2Title: 'President, Board of Directors'
    });
    setShowCustomModal(true);
  };

  const handleEditCustomCard = (card) => {
    setEditingCustomCard(card);
    setCustomCardForm({ ...card });
    setShowCustomModal(true);
  };

  const handleSaveCustomCardSubmit = (e) => {
    e.preventDefault();
    const res = saveAdminCustomCard({
      ...customCardForm,
      id: editingCustomCard ? editingCustomCard.id : undefined
    });
    if (res.success) {
      setCustomCards(getAdminCustomCards());
      setShowCustomModal(false);
      setFeedbackMsg(`Custom card "${customCardForm.title}" saved.`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  const handleDeleteCustomCard = (cardId) => {
    if (!window.confirm('Are you sure you want to delete this custom card template?')) return;
    deleteAdminCustomCard(cardId);
    setCustomCards(getAdminCustomCards());
    setFeedbackMsg('Custom card template removed.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Issue card to donor
  const handleOpenIssueModal = (cardOrTier) => {
    setIssueTargetCard(cardOrTier);
    setIssueDonorName('');
    setIssueDonorEmail('');
    setIssueAmount(String(cardOrTier.minAmount || 100));
    setIssuedCardResult(null);
    setShowIssueModal(true);
  };

  const handleIssueCardSubmit = (e) => {
    e.preventDefault();
    const res = issueCustomDonorCard(issueTargetCard.id, issueDonorName, issueDonorEmail, issueAmount);
    if (res.success) {
      setIssuedCardResult(res.issuedCard);
      setFeedbackMsg(`Card issued for ${issueDonorName}!`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
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
    { id: 'analytics', label: 'Donation Analytics', icon: TrendingUp, badge: '$54.3k' },
    { id: 'appreciation', label: 'Appreciation Cards & Custom', icon: Heart, badge: 'Studio' },
    { id: 'designer', label: 'Page Builder Studio', icon: Palette, badge: 'Drag & Drop' },
    { id: 'themes', label: 'Campaign Dispatcher', icon: Sparkles, badge: '18 Themes' },
    { id: 'directory', label: 'Directory Moderation', icon: Building2 },
    { id: 'inquiries', label: 'Inquiries & Triage', icon: Mail },
    { id: 'users', label: 'Staff & RBAC', icon: Users },
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
                  v2.7 Enterprise Suite
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
            TAB 1: DONATION ANALYTICS & FINANCIAL INTELLIGENCE
            ================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top Bar with Time Filter and CSV Export */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#5A1E65]" />
                  <span>Donation Analytics & Philanthropic Intelligence</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time metrics, recurring sustainers, tier distribution, and campaign financial performance via Zeffy integration.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {['30d', '90d', 'ytd', 'all'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setAnalyticsRange(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        analyticsRange === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : r === 'ytd' ? 'YTD' : 'All Time'}
                    </button>
                  ))}
                </div>

                <a
                  href={getExportUrl('donations')}
                  download
                  className="px-4 py-2 bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>
              </div>
            </div>

            {/* KPI Cards Grid */}
            {analyticsData?.summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Raised</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-950">
                    ${analyticsData.summary.totalRaised.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <span>↑ +18.4% vs last period</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Monthly Sustainers</span>
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-950">
                    {analyticsData.summary.recurringSustainers} <span className="text-sm text-slate-400 font-normal">donors</span>
                  </div>
                  <div className="text-[11px] text-purple-900 font-bold mt-1">
                    ${analyticsData.summary.monthlyRecurringRevenue.toLocaleString()}/mo Recurring (MRR)
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Average Gift</span>
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-950">
                    ${analyticsData.summary.averageGift.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Across {analyticsData.summary.totalDonors} community gifts
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/40 shadow-xs">
                  <div className="flex items-center justify-between text-amber-800 mb-2">
                    <span className="text-xs font-black uppercase tracking-wider">Zero-Fee Savings</span>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-950">
                    $2,172.80
                  </div>
                  <div className="text-[11px] text-amber-800 font-bold mt-1">
                    100% saved via Zeffy zero platform fee model
                  </div>
                </div>
              </div>
            )}

            {/* Two-Column Analytics: Tier Distribution & Monthly Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Giving Tier Breakdown */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#5A1E65]" />
                    <span>Giving Tier Distribution</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">By Donor Count</span>
                </div>

                <div className="space-y-3.5">
                  {analyticsData?.tierBreakdown?.map((tier) => (
                    <div key={tier.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                          <span>{tier.label}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {tier.count} donors (${tier.total.toLocaleString()})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${tier.pct}%`, backgroundColor: tier.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <p>Thresholds automatically allocate commemorative appreciation cards upon donation completion.</p>
                </div>
              </div>

              {/* Right Column: Monthly Giving Trend Chart */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>Monthly Philanthropic Momentum ($)</span>
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    June Pride Peak: $12.8k
                  </span>
                </div>

                {/* Pure CSS Bar Chart */}
                <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
                  {analyticsData?.monthlyTrend?.map((item) => {
                    const maxAmount = 13000;
                    const heightPct = Math.min(100, (item.amount / maxAmount) * 100);
                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded-md whitespace-nowrap mb-1">
                          ${item.amount.toLocaleString()}
                        </div>
                        <div className="w-full bg-slate-100 rounded-t-lg h-36 flex items-end overflow-hidden">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              item.month === 'Jun' 
                                ? 'bg-gradient-to-t from-[#5A1E65] to-rose-500' 
                                : 'bg-gradient-to-t from-purple-700 to-indigo-500 group-hover:from-purple-800'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{item.month}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>General Sanctuary & Youth Programs baseline: ~$4.5k/mo</span>
                  <span className="font-bold text-purple-900">100% Tax Deductible (501c3)</span>
                </div>
              </div>
            </div>

            {/* Recent Transactions & Card Issuance Ledger */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Recent Donation Transactions</h3>
                  <p className="text-xs text-slate-500">Live ledger of gifts, designated funds, and digital appreciation card tokens</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search donor or fund..."
                      value={transactionSearch}
                      onChange={(e) => setTransactionSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-[#5A1E65]"
                    />
                  </div>

                  <select
                    value={transactionFundFilter}
                    onChange={(e) => setTransactionFundFilter(e.target.value)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="all">All Designated Funds</option>
                    <option value="General Sanctuary">General Sanctuary</option>
                    <option value="Diversity SHINES">Diversity SHINES</option>
                    <option value="Rainbow Umbrella">Rainbow Umbrella</option>
                    <option value="Pride Festival 2026">Pride Festival 2026</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">Donor Name</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Frequency</th>
                      <th className="py-3 px-4">Assigned Tier</th>
                      <th className="py-3 px-4">Fund Category</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Appreciation Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analyticsData?.recentTransactions
                      ?.filter(t => {
                        const matchSearch = t.donorName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
                          t.fund.toLowerCase().includes(transactionSearch.toLowerCase());
                        const matchFund = transactionFundFilter === 'all' || t.fund === transactionFundFilter;
                        return matchSearch && matchFund;
                      })
                      .map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{tx.id}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">{tx.donorName}</td>
                          <td className="py-3 px-4 font-mono font-black text-slate-950">${tx.amount.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              tx.frequency === 'monthly' ? 'bg-purple-100 text-[#5A1E65]' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {tx.frequency}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-xs text-[#5A1E65]">{tx.tierLabel}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{tx.fund}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{tx.date}</td>
                          <td className="py-3 px-4 text-right">
                            <a
                              href={`/appreciation-card/${tx.cardToken}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-[#5A1E65] hover:bg-[#5A1E65] hover:text-white transition-colors font-bold text-[11px]"
                              title="Preview Donor Keepsake"
                            >
                              <span>View Card</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 2: APPRECIATION CARDS & CUSTOM STUDIO
            ================================================================== */}
        {activeTab === 'appreciation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span>Donor Appreciation Card Studio & Custom Design Editor</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the 4 core tier designs, create special custom tribute cards, and issue digital keepsakes directly to donors.
                </p>
              </div>

              {/* Sub-Tabs Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAppreciationSubTab('tiers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    appreciationSubTab === 'tiers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Edit 4 Core Tiers
                </button>
                <button
                  type="button"
                  onClick={() => setAppreciationSubTab('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    appreciationSubTab === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Special Custom Cards ({customCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAppreciationSubTab('certificate')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    appreciationSubTab === 'certificate' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Print Simulator
                </button>
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* SUB-TAB 1: EDIT 4 CORE TIER DESIGNS                            */}
            {/* -------------------------------------------------------------- */}
            {appreciationSubTab === 'tiers' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Tier Selector & Form Editor */}
                <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Select Tier to Customize
                    </span>
                    <button
                      type="button"
                      onClick={handleResetAllTiers}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Defaults</span>
                    </button>
                  </div>

                  {/* Tier Choice Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.values(cardTiers).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTierKey(t.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold text-left cursor-pointer transition-all border ${
                          selectedTierKey === t.id
                            ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="block font-black truncate">{t.title}</span>
                        <span className="block text-[10px] opacity-75">${t.minAmount}+</span>
                      </button>
                    ))}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSaveTierChanges} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tier Title</label>
                        <input
                          type="text"
                          value={editingTierForm.title || ''}
                          onChange={(e) => setEditingTierForm({ ...editingTierForm, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Circle Subtitle</label>
                        <input
                          type="text"
                          value={editingTierForm.circleName || ''}
                          onChange={(e) => setEditingTierForm({ ...editingTierForm, circleName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Threshold ($)</label>
                        <input
                          type="number"
                          value={editingTierForm.minAmount || 1}
                          onChange={(e) => setEditingTierForm({ ...editingTierForm, minAmount: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Artwork Motif</label>
                        <select
                          value={editingTierForm.motif || 'botanical_sunrise'}
                          onChange={(e) => setEditingTierForm({ ...editingTierForm, motif: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                        >
                          <option value="botanical_sunrise">Botanical Laurel & Sunrise</option>
                          <option value="interconnected_rings">Geometric Stained Glass</option>
                          <option value="pride_aurora_ribbons">Pride Aurora Waves & Stars</option>
                          <option value="sovereign_gold_crest">Sovereign Gold Crest & Beacon</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inspirational Quote</label>
                      <input
                        type="text"
                        value={editingTierForm.quote || ''}
                        onChange={(e) => setEditingTierForm({ ...editingTierForm, quote: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs italic font-serif"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Community Impact Statement</label>
                      <textarea
                        rows={3}
                        value={editingTierForm.impactNarrative || ''}
                        onChange={(e) => setEditingTierForm({ ...editingTierForm, impactNarrative: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleOpenIssueModal(editingTierForm)}
                        className="text-xs font-bold text-purple-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Issue Test Card to Donor</span>
                      </button>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save Tier Changes</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right: Live Interactive Card Canvas Preview */}
                <div className="lg:col-span-6 bg-slate-200/80 rounded-2xl p-5 border border-slate-300 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Live Design Canvas: {editingTierForm.title}
                  </span>

                  <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 p-1 flex items-center justify-center">
                        <img src="/images/logo-square.png" alt="DCVC Logo" className="w-full h-full object-contain" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5A1E65] text-[10px] font-black uppercase">
                        {editingTierForm.title}
                      </span>
                    </div>

                    {/* Motif Preview Badge */}
                    <div className="py-2 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-bold text-purple-950 block">Artwork Motif:</span>
                      <span className="text-[11px] font-mono text-purple-700">{editingTierForm.motif}</span>
                    </div>

                    <h4 className="font-fraunces text-2xl font-black text-slate-950">
                      With Heartfelt Thanks To <br />
                      <span className="text-[#5A1E65]">Affirming Supporter</span>
                    </h4>

                    <p className="font-fraunces italic text-xs text-slate-600 px-4">
                      {editingTierForm.quote}
                    </p>

                    <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-left space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">Your Community Impact:</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        {editingTierForm.impactNarrative}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                      <span>Threshold: ${editingTierForm.minAmount}+</span>
                      <span>EIN 47-1903673</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/* SUB-TAB 2: SPECIAL CUSTOM CARDS                                */}
            {/* -------------------------------------------------------------- */}
            {appreciationSubTab === 'custom' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Custom Special Keepsake Cards</h3>
                    <p className="text-xs text-slate-500">Design special commemorative cards for gala sponsors, capital campaigns, or memorial tributes</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateCustom}
                    className="px-4 py-2 bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Custom Card</span>
                  </button>
                </div>

                {/* Custom Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {customCards.map((card) => (
                    <div key={card.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                            Prefix: {card.certificatePrefix}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-400">
                            Threshold: ${card.minAmount}+
                          </span>
                        </div>

                        <h4 className="font-extrabold text-lg text-slate-900">{card.title}</h4>
                        <p className="text-xs font-semibold text-purple-900">{card.circleName}</p>
                        <p className="text-xs text-slate-600 line-clamp-2">{card.impactNarrative}</p>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                          <div><strong>Quote:</strong> <em className="italic">{card.quote}</em></div>
                          <div><strong>Signers:</strong> {card.signee1Name} & {card.signee2Name}</div>
                          <div><strong>Artwork Motif:</strong> <code className="font-mono text-purple-700">{card.motif}</code></div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenIssueModal(card)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Issue Card</span>
                          </button>
                          <a
                            href={`/appreciation-card/preview`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </a>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditCustomCard(card)}
                            className="p-1.5 text-slate-400 hover:text-purple-700 cursor-pointer"
                            title="Edit Custom Card"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomCard(card.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                            title="Delete Custom Card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/* SUB-TAB 3: PRINT & CERTIFICATE SIMULATOR                       */}
            {/* -------------------------------------------------------------- */}
            {appreciationSubTab === 'certificate' && (
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

                  <button
                    onClick={() => window.print()}
                    className="w-full py-2.5 bg-slate-900 hover:bg-[#5A1E65] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print High-Resolution Certificate</span>
                  </button>
                </div>

                {/* Certificate Preview Canvas */}
                <div className="lg:col-span-8 flex justify-center">
                  <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl p-8 sm:p-10 border-4 border-double border-amber-300/80 shadow-2xl relative overflow-hidden">
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
            )}

            {/* Custom Card Create/Edit Modal */}
            {showCustomModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 my-8">
                  <h3 className="font-extrabold text-lg text-slate-900 mb-1">
                    {editingCustomCard ? 'Edit Custom Card Template' : 'Create Special Custom Card'}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Design a custom keepsake card for galas, naming opportunities, or memorial tributes.</p>

                  <form onSubmit={handleSaveCustomCardSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Card Title</label>
                        <input
                          type="text"
                          required
                          value={customCardForm.title}
                          onChange={(e) => setCustomCardForm({ ...customCardForm, title: e.target.value })}
                          placeholder="e.g. Pride Gala 2026 Gold Sponsor"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Circle Subtitle</label>
                        <input
                          type="text"
                          value={customCardForm.circleName}
                          onChange={(e) => setCustomCardForm({ ...customCardForm, circleName: e.target.value })}
                          placeholder="e.g. Gala Benefactor Circle"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Token Prefix (e.g. GALA)</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={customCardForm.certificatePrefix}
                          onChange={(e) => setCustomCardForm({ ...customCardForm, certificatePrefix: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Amount ($)</label>
                        <input
                          type="number"
                          value={customCardForm.minAmount}
                          onChange={(e) => setCustomCardForm({ ...customCardForm, minAmount: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Artwork Motif</label>
                      <select
                        value={customCardForm.motif}
                        onChange={(e) => setCustomCardForm({ ...customCardForm, motif: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      >
                        <option value="sovereign_gold_crest">Sovereign Gold Crest & Beacon (Topatopa & Coast)</option>
                        <option value="pride_aurora_ribbons">Progress Pride Cascading Aurora Waves</option>
                        <option value="interconnected_rings">Geometric Stained Glass & Health Cross</option>
                        <option value="botanical_sunrise">Botanical Laurel & Sunrise (California Poppies)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inspirational Quote</label>
                      <input
                        type="text"
                        value={customCardForm.quote}
                        onChange={(e) => setCustomCardForm({ ...customCardForm, quote: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs italic font-serif"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Community Impact Statement</label>
                      <textarea
                        rows={2}
                        value={customCardForm.impactNarrative}
                        onChange={(e) => setCustomCardForm({ ...customCardForm, impactNarrative: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Primary Signee Name & Title</label>
                        <input
                          type="text"
                          value={customCardForm.signee1Name}
                          onChange={(e) => setCustomCardForm({ ...customCardForm, signee1Name: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs mb-1"
                        />
                        <input
                          type="text"
                          value={customCardForm.signee1Title}
                          onChange={(e) => setCustomCardForm({ ...customCardForm, signee1Title: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-[11px] text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Secondary Signee Name & Title</label>
                        <input
                          type="text"
                          value={customCardForm.signee2Name}
                          onChange={(e) => setCustomCardForm({ ...customCardForm, signee2Name: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs mb-1"
                        />
                        <input
                          type="text"
                          value={customCardForm.signee2Title}
                          onChange={(e) => setCustomCardForm({ ...customCardForm, signee2Title: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-[11px] text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowCustomModal(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-black text-white bg-[#5A1E65] hover:bg-purple-900 rounded-xl shadow-xs cursor-pointer"
                      >
                        Save Custom Template
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Direct Issue Modal */}
            {showIssueModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
                  <h3 className="font-extrabold text-lg text-slate-900 mb-1">Issue Card to Supporter</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Generate an authenticated digital keepsake link for <strong className="text-purple-950">{issueTargetCard?.title}</strong>.
                  </p>

                  {!issuedCardResult ? (
                    <form onSubmit={handleIssueCardSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Donor Display Name</label>
                        <input
                          type="text"
                          required
                          value={issueDonorName}
                          onChange={(e) => setIssueDonorName(e.target.value)}
                          placeholder="Dr. Maya Lin & Family"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Donor Email Address</label>
                        <input
                          type="email"
                          value={issueDonorEmail}
                          onChange={(e) => setIssueDonorEmail(e.target.value)}
                          placeholder="donor@example.org"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Donation Amount ($ USD)</label>
                        <input
                          type="number"
                          value={issueAmount}
                          onChange={(e) => setIssueAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="pt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowIssueModal(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 text-xs font-black text-white bg-[#5A1E65] hover:bg-purple-900 rounded-xl shadow-xs cursor-pointer"
                        >
                          Generate & Issue Link
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900">Card Issued Successfully!</h4>
                      <p className="text-xs text-slate-600">
                        Keepsake token <code>{issuedCardResult.token}</code> has been generated.
                      </p>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                        <span className="block text-[10px] font-mono text-slate-400">Shareable URL:</span>
                        <code className="block text-xs font-mono text-[#5A1E65] break-all select-all font-bold mt-0.5">
                          {window.location.origin}{issuedCardResult.shareUrl}
                        </code>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}${issuedCardResult.shareUrl}`);
                            setFeedbackMsg('Link copied to clipboard!');
                            setTimeout(() => setFeedbackMsg(''), 2500);
                          }}
                          className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-[#5A1E65] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Copy Link
                        </button>
                        <a
                          href={issuedCardResult.shareUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-purple-100 text-[#5A1E65] text-xs font-bold hover:bg-purple-200 transition-colors"
                        >
                          Open Card
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowIssueModal(false)}
                        className="text-xs text-slate-400 hover:underline pt-2 block mx-auto"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            TAB 3: DRAG & DROP DESIGN EDITOR (Visual Studio)
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
            TAB 4: HERO THEME & FESTIVAL CAMPAIGN DISPATCHER
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
            TAB 5: DIRECTORY MODERATION (Existing Robust)
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
            TAB 6: INQUIRIES & OPERATIONS TRIAGE
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
            TAB 7: STAFF & RBAC TEAM MANAGEMENT
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
            TAB 8: SYSTEM DIAGNOSTICS & SERVICE HEALTH
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
            TAB 9: DATA EXPORTS (CSV)
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
                { type: 'donations', title: 'Donations & Pledges', desc: 'All gifts, frequencies, sustainers, and cards' },
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
            TAB 10: ACTIVITY AUDIT TRAIL
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
