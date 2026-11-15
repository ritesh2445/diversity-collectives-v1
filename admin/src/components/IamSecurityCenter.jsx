import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Smartphone, 
  Laptop, 
  Lock, 
  Unlock, 
  UserCheck, 
  AlertOctagon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Users, 
  User, 
  Shield, 
  Zap,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { 
  getMfaSettings, 
  setupTotpMfa, 
  confirmTotpMfa, 
  disableTotpMfa, 
  generateNewBackupCodes,
  getActiveSessions, 
  revokeSession, 
  revokeAllSessions,
  getCustomRoles, 
  saveCustomRole, 
  deleteCustomRole, 
  GRANULAR_PERMISSIONS,
  getJitRequests, 
  requestJitElevation, 
  reviewJitRequest,
  updateUserProfile, 
  changeUserPassword,
  getStoredUser
} from '../services/adminClient.js';

export default function IamSecurityCenter({ onTriggerFeedback }) {
  const [subTab, setSubTab] = useState('2fa'); // '2fa' | 'roles' | 'sessions' | 'jit' | 'profile'
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  // 2FA State
  const [mfaSettings, setMfaSettings] = useState(null);
  const [totpSetupData, setTotpSetupData] = useState(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Custom Roles State
  const [roles, setRoles] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });

  // JIT Elevation State
  const [jitRequests, setJitRequests] = useState([]);
  const [jitReason, setJitReason] = useState('');
  const [jitDuration, setJitDuration] = useState(2);
  const [showJitModal, setShowJitModal] = useState(false);

  // Profile & Password State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileTitle, setProfileTitle] = useState(currentUser?.title || 'Administrative Staff');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [mfa, sess, rls, jits] = await Promise.all([
        getMfaSettings(),
        getActiveSessions(),
        getCustomRoles(),
        getJitRequests()
      ]);
      setMfaSettings(mfa);
      setSessions(sess);
      setRoles(rls);
      setJitRequests(jits);
    } catch (err) {
      console.error('Error loading IAM data:', err);
    }
  };

  // 2FA Handlers
  const handleStartTotpEnrollment = async () => {
    setTotpLoading(true);
    setTotpError('');
    try {
      const data = await setupTotpMfa();
      setTotpSetupData(data);
    } catch (err) {
      setTotpError(err.message);
    } finally {
      setTotpLoading(false);
    }
  };

  const handleConfirmTotp = async (e) => {
    e.preventDefault();
    if (!totpVerifyCode || totpVerifyCode.trim().length !== 6) {
      setTotpError('Please enter a valid 6-digit code.');
      return;
    }
    setTotpLoading(true);
    setTotpError('');
    try {
      const res = await confirmTotpMfa(totpSetupData.secret, totpVerifyCode);
      if (res.success) {
        setTotpSetupData(null);
        setTotpVerifyCode('');
        const updated = await getMfaSettings();
        setMfaSettings(updated);
        onTriggerFeedback?.('Authenticator App (2FA) successfully activated.');
      } else {
        setTotpError(res.error || 'Invalid code');
      }
    } catch (err) {
      setTotpError(err.message);
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisableTotp = async () => {
    if (!confirm('Are you sure you want to disable Authenticator App 2FA? This will decrease your account security.')) return;
    try {
      await disableTotpMfa('');
      const updated = await getMfaSettings();
      setMfaSettings(updated);
      onTriggerFeedback?.('Authenticator App (2FA) disabled.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGenerateBackupCodes = () => {
    const codes = generateNewBackupCodes();
    setBackupCodes(codes);
    onTriggerFeedback?.('Generated 8 emergency recovery backup codes.');
  };

  // Sessions Handlers
  const handleRevokeSession = async (id) => {
    if (!confirm('Terminate this session? The device will immediately be logged out.')) return;
    setSessionLoading(true);
    try {
      await revokeSession(id);
      const updated = await getActiveSessions();
      setSessions(updated);
      onTriggerFeedback?.('Session revoked.');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Log out of all other devices everywhere? Your current browser session will remain active.')) return;
    setSessionLoading(true);
    try {
      await revokeAllSessions();
      const updated = await getActiveSessions();
      setSessions(updated);
      onTriggerFeedback?.('All other active sessions revoked.');
    } finally {
      setSessionLoading(false);
    }
  };

  // Role Handlers
  const handleTogglePermission = (permId) => {
    setRoleForm(prev => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter(p => p !== permId) : [...prev.permissions, permId]
      };
    });
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;
    await saveCustomRole(roleForm);
    const updated = await getCustomRoles();
    setRoles(updated);
    setShowRoleModal(false);
    setRoleForm({ name: '', description: '', permissions: [] });
    onTriggerFeedback?.('Custom role saved.');
  };

  const handleDeleteRole = async (id) => {
    if (!confirm('Delete this custom role?')) return;
    const res = await deleteCustomRole(id);
    if (res.success) {
      setRoles(res.roles);
      onTriggerFeedback?.('Role deleted.');
    } else {
      alert(res.error);
    }
  };

  // JIT Handlers
  const handleRequestJit = async (e) => {
    e.preventDefault();
    if (!jitReason.trim()) return;
    await requestJitElevation({ targetRole: 'Super Administrator', reason: jitReason, durationHours: jitDuration });
    const updated = await getJitRequests();
    setJitRequests(updated);
    setShowJitModal(false);
    setJitReason('');
    onTriggerFeedback?.('Just-In-Time privilege elevation request submitted for approval.');
  };

  const handleReviewJit = async (id, decision) => {
    await reviewJitRequest(id, decision);
    const updated = await getJitRequests();
    setJitRequests(updated);
    onTriggerFeedback?.(`JIT Elevation request ${decision}.`);
  };

  // Profile & Password Handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const res = await updateUserProfile({ name: profileName, title: profileTitle });
    if (res.success) {
      setCurrentUser(res.user);
      onTriggerFeedback?.('Profile information updated.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ text: '', type: '' });
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    const res = await changeUserPassword(oldPassword, newPassword);
    if (res.success) {
      setPwdMsg({ text: 'Password successfully updated!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onTriggerFeedback?.('Password updated successfully.');
    } else {
      setPwdMsg({ text: res.error || 'Failed to update password.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
              PILLAR 1: IAM & ENTERPRISE SECURITY
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#5A1E65]" />
            <span>Identity, Roles & Access Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enforce Zero-Trust least privilege, 2FA hardware tokens, session lifecycle tracking, and Just-In-Time role elevation.
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: '2fa', label: '2FA & Passkeys', icon: Key },
            { id: 'roles', label: 'Custom Roles & RBAC', icon: Users },
            { id: 'sessions', label: 'Active Sessions', icon: Laptop },
            { id: 'jit', label: 'JIT Elevation', icon: Zap },
            { id: 'profile', label: 'Profile & Password', icon: User }
          ].map(t => {
            const Icon = t.icon;
            const isActive = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive ? 'bg-[#5A1E65] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: 2FA & PASSKEYS */}
      {subTab === '2fa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2FA Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-700" />
                  <span>Authenticator App (TOTP / RFC 6238)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Use Google Authenticator, 1Password, or Bitwarden to generate single-use 6-digit codes.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                mfaSettings?.totpEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {mfaSettings?.totpEnabled ? 'Active & Enforced' : 'Not Configured'}
              </span>
            </div>

            {!totpSetupData && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
                <div>
                  <h4 className="text-sm font-bold text-[#5A1E65]">
                    {mfaSettings?.totpEnabled ? 'Authenticator 2FA is currently active' : 'Protect your admin account with TOTP'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {mfaSettings?.totpEnabled 
                      ? 'Every login requires your 6-digit authenticator code. You can re-enroll or disable it here.' 
                      : 'Enroll in standard multi-factor authentication to prevent unauthorized credential stuffing.'}
                  </p>
                </div>
                {mfaSettings?.totpEnabled ? (
                  <button
                    onClick={handleDisableTotp}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    Disable TOTP
                  </button>
                ) : (
                  <button
                    onClick={handleStartTotpEnrollment}
                    disabled={totpLoading}
                    className="px-4 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
                  >
                    {totpLoading ? 'Generating QR...' : 'Enroll Authenticator App'}
                  </button>
                )}
              </div>
            )}

            {/* TOTP Enrollment Wizard */}
            {totpSetupData && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-purple-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Step 1: Scan QR Code with Authenticator</h4>
                  <button 
                    onClick={() => setTotpSetupData(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 bg-white p-4 rounded-xl border border-slate-200">
                  <img 
                    src={totpSetupData.qrCodeUrl} 
                    alt="Authenticator QR Code" 
                    className="w-40 h-40 rounded-lg shadow-xs border border-slate-100" 
                  />
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>Open your authenticator app (Google Authenticator, Apple Passwords, Authy, etc.) and scan the QR code.</p>
                    <p className="font-semibold text-slate-800">Or manually enter the secret key:</p>
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg font-mono text-xs text-slate-900">
                      <span>{totpSetupData.secret}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(totpSetupData.secret);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="text-purple-700 hover:text-purple-900 font-bold ml-auto cursor-pointer flex items-center gap-1"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmTotp} className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Step 2: Enter the 6-Digit Verification Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={totpVerifyCode}
                      onChange={(e) => setTotpVerifyCode(e.target.value)}
                      placeholder="123456"
                      className="w-48 px-4 py-2 rounded-xl border border-slate-300 font-mono text-center text-lg tracking-widest focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={totpLoading || totpVerifyCode.length !== 6}
                      className="px-5 py-2 bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {totpLoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                  {totpError && <p className="text-xs text-rose-600 font-semibold">{totpError}</p>}
                </form>
              </div>
            )}

            {/* Email OTP Fallback info */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Email One-Time Password (OTP) Fallback</h4>
                <p className="text-[11px] text-slate-500">Sends high-entropy 6-digit codes to verified staff email via Resend API.</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                Enabled by Default
              </span>
            </div>
          </div>

          {/* Backup Recovery Codes Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              <span>Emergency Backup Codes</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              If you lose access to your authenticator app or mobile phone, single-use backup recovery codes allow emergency account recovery.
            </p>

            <button
              onClick={handleGenerateBackupCodes}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Generate 8 New Backup Codes
            </button>

            {backupCodes.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">Print or store securely:</span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-slate-800">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-white p-1.5 rounded border border-slate-200 text-center font-bold">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CUSTOM ROLES & RBAC BUILDER */}
      {subTab === 'roles' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-700" />
                <span>Granular Role-Based Access Control (RBAC)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define custom roles and enforce least-privilege security boundaries across staff and volunteers.
              </p>
            </div>
            <button
              onClick={() => {
                setRoleForm({ name: '', description: '', permissions: [] });
                setShowRoleModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(role => (
              <div key={role.id} className="p-5 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{role.name}</h4>
                      {role.isSystem ? (
                        <span className="text-[10px] bg-purple-100 text-[#5A1E65] font-black px-2 py-0.5 rounded-full">
                          System Role
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{role.description}</p>
                  </div>
                  {!role.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Delete custom role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-200/60 pt-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Granted Permissions ({role.permissions.length} of {GRANULAR_PERMISSIONS.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map(p => {
                      const def = GRANULAR_PERMISSIONS.find(gp => gp.id === p);
                      return (
                        <span key={p} className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                          {def?.label || p}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal to build custom role */}
          {showRoleModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-900">Custom Role Builder</h3>
                <form onSubmit={handleSaveRole} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role Name</label>
                    <input
                      type="text"
                      required
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      placeholder="e.g. Volunteer Coordinator"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      placeholder="Summary of responsibilities"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Granular Permissions</label>
                    <div className="space-y-2 border border-slate-200 rounded-2xl p-3 max-h-60 overflow-y-auto bg-slate-50">
                      {GRANULAR_PERMISSIONS.map(p => {
                        const isChecked = roleForm.permissions.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(p.id)}
                              className="mt-0.5 w-4 h-4 text-purple-700 rounded border-slate-300"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">{p.label}</span>
                              <span className="text-[11px] text-slate-500">{p.desc}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRoleModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#5A1E65] text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Save Custom Role
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: ACTIVE SESSIONS */}
      {subTab === 'sessions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-purple-700" />
                <span>Session Lifecycle & Device Trust</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor logged-in devices. Force instantaneous revocation on lost devices or security alerts.
              </p>
            </div>
            <button
              onClick={handleRevokeAllSessions}
              disabled={sessionLoading}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Revoke All Other Sessions</span>
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map(sess => (
              <div 
                key={sess.id} 
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  sess.isCurrent ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${sess.isCurrent ? 'bg-[#5A1E65] text-white' : 'bg-slate-200 text-slate-700'}`}>
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{sess.device} · {sess.browser}</span>
                      {sess.isCurrent && (
                        <span className="text-[10px] bg-purple-700 text-white px-2 py-0.5 rounded-full font-bold">
                          Current Device
                        </span>
                      )}
                      {sess.trusted && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                          Trusted IP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                      <span>IP: {sess.ip}</span>
                      <span>•</span>
                      <span>{sess.location}</span>
                      <span>•</span>
                      <span>{sess.lastActive}</span>
                    </div>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer self-start sm:self-auto"
                  >
                    Revoke Session
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: JIT ELEVATION */}
      {subTab === 'jit' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Just-In-Time (JIT) Privileged Access Workflows</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Reduces standing privileges. Staff request short-lived administrative power with strict time windows and audit logging.
              </p>
            </div>
            <button
              onClick={() => setShowJitModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Zap className="w-4 h-4" />
              <span>Request Temporary Super-Admin</span>
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Elevation Requests & Audit History</h4>
            {jitRequests.map(req => (
              <div key={req.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{req.requesterName}</span>
                      <span className="text-xs text-slate-500">({req.requesterEmail})</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-medium">Target: {req.targetRole} ({req.durationHours} hours)</p>
                    <p className="text-xs text-slate-500 italic mt-0.5">Reason: "{req.reason}"</p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewJit(req.id, 'approved')}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewJit(req.id, 'rejected')}
                        className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showJitModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Request Just-In-Time Elevation</h3>
                <form onSubmit={handleRequestJit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Elevation Duration</label>
                    <select
                      value={jitDuration}
                      onChange={(e) => setJitDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    >
                      <option value={1}>1 Hour (Quick task / patch)</option>
                      <option value={2}>2 Hours (Standard maintenance window)</option>
                      <option value={4}>4 Hours (Major content release / audit)</option>
                      <option value={24}>24 Hours (Event emergency incident)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Operational Justification / Reason</label>
                    <textarea
                      required
                      rows={3}
                      value={jitReason}
                      onChange={(e) => setJitReason(e.target.value)}
                      placeholder="Explain why super-administrator access is needed for this task..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowJitModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-xs"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: PROFILE & SELF-SERVICE PASSWORD */}
      {subTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-700" />
              <span>Self-Service Staff Profile</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Display Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Job Title</label>
              <input
                type="text"
                value={profileTitle}
                onChange={(e) => setProfileTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Email</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || 'admin@diversitycollective.org'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed font-mono"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 bg-[#5A1E65] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs hover:bg-purple-900"
            >
              Save Profile Changes
            </button>
          </form>

          <form onSubmit={handleChangePassword} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-700" />
              <span>Change Password & Rotate Token Version</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password (Min 12 chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
            </div>
            {pwdMsg.text && (
              <p className={`text-xs font-semibold ${pwdMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {pwdMsg.text}
              </p>
            )}
            <button
              type="submit"
              className="py-2.5 px-4 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs hover:bg-slate-800"
            >
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
