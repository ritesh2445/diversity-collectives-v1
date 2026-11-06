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
  Trash2
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
  getAuditLogs,
  getExportUrl
} from './services/adminClient.js';

export default function AdminApp() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState('directory');

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

  // If unauthenticated, show professional login portal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-900 font-bold text-xs uppercase tracking-wider rounded-full mb-3">
              Staff & Board Portal
            </span>
            <h1 className="text-2xl font-extrabold text-[#5A1E65]">
              Diversity Collective Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Affirming Directory Moderation & Operational Control
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Staff Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@diversitycollective.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                MFA / Security Code (Optional in Dev)
              </label>
              <input
                type="text"
                value={loginMfa}
                onChange={(e) => setLoginMfa(e.target.value)}
                placeholder="6-digit authenticator code"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Deployed independently from diversitycollective.org • RBAC enforced
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-gradient-to-r from-[#5A1E65] to-purple-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
              DC
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white">
                DCVC Management Portal
              </h2>
              <p className="text-[11px] text-purple-200">
                Staff & Board Administration
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
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto">
          {[
            { id: 'directory', label: 'Directory Moderation', icon: Building2 },
            { id: 'inquiries', label: 'Inquiries & Operations', icon: Mail },
            { id: 'exports', label: 'Data Exports (CSV)', icon: Download },
            { id: 'audit', label: 'Activity Audit Trail', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Notification Banner */}
      {feedbackMsg && (
        <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2 px-4 shadow-xs">
          {feedbackMsg}
        </div>
      )}

      {/* Main Body Content */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {/* TAB 1: DIRECTORY MODERATION */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Affirming Business Directory</h2>
                <p className="text-xs text-slate-500">Review pending business submissions and correction requests</p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
                {['pending', 'approved', 'rejected', 'all'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setDirectoryStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all ${
                      directoryStatusFilter === st
                        ? 'bg-white text-purple-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Business List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {businesses.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-sm">No businesses in "{directoryStatusFilter}" status.</p>
                </div>
              ) : (
                businesses.map((biz) => (
                  <div key={biz.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">{biz.name}</h3>
                          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                            {biz.category} • {biz.city}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          biz.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          biz.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {biz.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
                        {biz.description || 'No description provided.'}
                      </p>

                      <div className="text-[11px] text-slate-500 space-y-1 border-t border-slate-100 pt-2">
                        <p><strong>Owner:</strong> {biz.owner_name} (&lt;{biz.owner_email}&gt;)</p>
                        <p><strong>Address:</strong> {biz.address || 'Ventura County'}</p>
                        <p><strong>Website:</strong> {biz.website || 'N/A'}</p>
                        <p><strong>Pledge Signed:</strong> {biz.affirming_pledge_signed_at ? 'Yes (Verified)' : 'No'}</p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                      {biz.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleModerate(biz.id, 'approved')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleModerate(biz.id, 'rejected')}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteBiz(biz.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer ml-auto"
                          title="Remove listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Corrections & Removal Requests */}
            {corrections.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-extrabold text-base text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Pending Correction & Removal Requests ({corrections.length})</span>
                </h3>
                <div className="space-y-3">
                  {corrections.map((corr) => (
                    <div key={corr.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{corr.business_name}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {corr.request_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{corr.details}</p>
                        <p className="text-[10px] text-slate-400 mt-1">From: {corr.requester_name} ({corr.requester_email})</p>
                      </div>

                      <button
                        onClick={() => handleResolveCorrection(corr.id)}
                        className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer whitespace-nowrap self-start sm:self-auto"
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

        {/* TAB 2: OPERATIONAL INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Operational Inquiries</h2>
                <p className="text-xs text-slate-500">Contact requests, volunteer applications, training bookings</p>
              </div>

              {/* Inquiry Type Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
                {[
                  { id: 'contact', label: 'Contact Forms' },
                  { id: 'volunteer', label: 'Volunteer Apps' },
                  { id: 'training', label: 'Training Requests' },
                  { id: 'accessibility', label: 'A11y Reports' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setInquiryType(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all ${
                      inquiryType === t.id
                        ? 'bg-white text-purple-900 shadow-xs'
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
                <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
                  <Mail className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-sm">No records found for {inquiryType}.</p>
                </div>
              ) : (
                inquiries.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {item.name || item.full_name || item.organization_name || item.contact_name || 'Inquiry'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {item.email} • {item.phone || 'No phone'} {item.city ? `• ${item.city}` : ''}
                      </p>
                      <p className="text-xs text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {item.message || item.barrier_description || item.goals_and_notes || (item.roles_of_interest ? `Roles: ${item.roles_of_interest}` : '')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <select
                        value={item.status || 'unread'}
                        onChange={(e) => handleInquiryStatusChange(item.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none"
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

        {/* TAB 3: DATA EXPORTS (CSV) */}
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

        {/* TAB 4: ACTIVITY AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Administrative Audit Log</h2>
              <p className="text-xs text-slate-500">Immutable ledger of administrative actions and moderation events</p>
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

