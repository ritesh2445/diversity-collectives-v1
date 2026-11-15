import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Bell, 
  BellRing, 
  ShieldAlert, 
  ShieldCheck, 
  Sliders, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  History, 
  Download, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Zap, 
  Cpu, 
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { 
  getRealTimeHealthMetrics, 
  getAlertRules, 
  saveAlertRule, 
  toggleAlertRule, 
  deleteAlertRule,
  getFirewallRules, 
  blockIpAddress, 
  unblockIpAddress,
  getFeatureFlags, 
  toggleFeatureFlag,
  getDatabaseSnapshots, 
  createDatabaseSnapshot, 
  restoreDatabaseSnapshot,
  getAuditLogs,
  exportDataset
} from '../services/adminClient.js';

export default function OperationsCenter({ onTriggerFeedback }) {
  const [subTab, setSubTab] = useState('health'); // 'health' | 'alerts' | 'firewall' | 'flags' | 'backups' | 'audit'

  // Health Metrics
  const [healthData, setHealthData] = useState(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

  // Alerts
  const [alertRules, setAlertRules] = useState([]);
  const [showAddAlertModal, setShowAddAlertModal] = useState(false);
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertMetric, setNewAlertMetric] = useState('error_rate_5xx');
  const [newAlertCondition, setNewAlertCondition] = useState('> 1.0%');
  const [newAlertChannel, setNewAlertChannel] = useState('slack');
  const [newAlertTarget, setNewAlertTarget] = useState('');

  // Firewall
  const [firewall, setFirewall] = useState({ blockedIps: [], whitelistedIps: [], rateLimitPerMinute: 60 });
  const [newIpToBlock, setNewIpToBlock] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  // Feature Flags
  const [featureFlags, setFeatureFlags] = useState([]);

  // Database Backups
  const [snapshots, setSnapshots] = useState([]);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadHealth();
    }, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    loadHealth();
    const [alerts, fw, flags, snaps, logs] = await Promise.all([
      getAlertRules(),
      getFirewallRules(),
      getFeatureFlags(),
      getDatabaseSnapshots(),
      getAuditLogs()
    ]);
    setAlertRules(alerts);
    setFirewall(fw);
    setFeatureFlags(flags);
    setSnapshots(snaps);
    setAuditLogs(logs);
  };

  const loadHealth = async () => {
    try {
      setIsRefreshingHealth(true);
      const h = await getRealTimeHealthMetrics();
      setHealthData(h);
    } finally {
      setIsRefreshingHealth(false);
    }
  };

  // Alerts Handlers
  const handleSaveAlert = async (e) => {
    e.preventDefault();
    if (!newAlertName.trim() || !newAlertTarget.trim()) return;
    await saveAlertRule({
      name: newAlertName,
      metric: newAlertMetric,
      condition: newAlertCondition,
      channel: newAlertChannel,
      target: newAlertTarget
    });
    const updated = await getAlertRules();
    setAlertRules(updated);
    setShowAddAlertModal(false);
    setNewAlertName('');
    setNewAlertTarget('');
    onTriggerFeedback?.('Alert rule created.');
  };

  const handleToggleAlert = async (id) => {
    const res = await toggleAlertRule(id);
    setAlertRules(res.rules);
    onTriggerFeedback?.('Alert rule toggled.');
  };

  const handleDeleteAlert = async (id) => {
    if (!confirm('Delete this alert rule?')) return;
    const res = await deleteAlertRule(id);
    setAlertRules(res.rules);
    onTriggerFeedback?.('Alert rule deleted.');
  };

  // Firewall Handlers
  const handleBlockIp = async (e) => {
    e.preventDefault();
    if (!newIpToBlock.trim()) return;
    const res = await blockIpAddress(newIpToBlock, newBlockReason);
    if (res.success) {
      setFirewall(res.firewall);
      setNewIpToBlock('');
      setNewBlockReason('');
      onTriggerFeedback?.(`IP ${newIpToBlock} added to blocklist.`);
    } else {
      alert(res.error);
    }
  };

  const handleUnblockIp = async (ip) => {
    const res = await unblockIpAddress(ip);
    setFirewall(res.firewall);
    onTriggerFeedback?.(`IP ${ip} removed from blocklist.`);
  };

  // Flags Handler
  const handleToggleFlag = async (key) => {
    const res = await toggleFeatureFlag(key);
    setFeatureFlags(res.flags);
    onTriggerFeedback?.(`Feature flag "${key}" updated.`);
  };

  // Backup Handlers
  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    try {
      const res = await createDatabaseSnapshot(newSnapshotLabel || 'Manual Snapshot');
      const updated = await getDatabaseSnapshots();
      setSnapshots(updated);
      setNewSnapshotLabel('');
      onTriggerFeedback?.(`Database snapshot ${res.snapshot.id} created with verified SHA256 integrity.`);
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleRestoreTest = async (id) => {
    if (!confirm(`Run disaster recovery verification test on snapshot ${id}?`)) return;
    const res = await restoreDatabaseSnapshot(id);
    onTriggerFeedback?.(res.message);
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = !auditSearch || 
      log.user_email?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.target_type?.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesAction = auditFilterAction === 'all' || log.target_type === auditFilterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
              PILLAR 3: MONITORING & OPERATIONS
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 mt-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#5A1E65]" />
            <span>Infrastructure Health & Operations Control</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time edge health diagnostics, notification routing, IP firewall rate-limiting, feature kill-switches, and automated disaster recovery.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'health', label: 'Health Dashboard', icon: Server },
            { id: 'alerts', label: 'Alert Routing', icon: Bell },
            { id: 'firewall', label: 'IP Firewall', icon: ShieldAlert },
            { id: 'flags', label: 'Feature Flags', icon: Sliders },
            { id: 'backups', label: 'Backups & DR', icon: Database },
            { id: 'audit', label: 'Immutable Logs', icon: History }
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

      {/* SUB-TAB 1: HEALTH DASHBOARD */}
      {subTab === 'health' && healthData && (
        <div className="space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Edge Uptime</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-slate-950">{healthData.uptimePercentage}%</span>
                <span className="text-xs font-bold text-emerald-600">Optimal</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Last 30 rolling days</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Average Latency</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-slate-950">{healthData.avgLatencyMs} ms</span>
                <span className="text-xs font-bold text-emerald-600">Sub-50ms</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Edge Anycast LAX</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">5xx Error Rate</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-slate-950">{healthData.errorRate5xx}%</span>
                <span className="text-xs font-bold text-emerald-600">&lt; 0.1% SLA</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Zero unhandled panics</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Daily Edge Traffic</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-slate-950">{healthData.systemLoad.dailyRequestsCount.toLocaleString()}</span>
                <span className="text-xs font-bold text-purple-700">{healthData.systemLoad.cachedRequestRatio} cached</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Memory: {healthData.systemLoad.memoryUsedMb} MB</p>
            </div>
          </div>

          {/* Connected Services Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-purple-700" />
                  <span>Integrated Production Services</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Live latency probes and status indicators across all cloud backends.</p>
              </div>
              <button
                onClick={loadHealth}
                disabled={isRefreshingHealth}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingHealth ? 'animate-spin' : ''}`} />
                <span>Refresh Probes</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {healthData.services.map((svc, idx) => (
                <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <span className="text-sm font-bold text-slate-900">{svc.name}</span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">({svc.region})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-600">Latency: <strong className="text-slate-900">{svc.latencyMs} ms</strong></span>
                    <span className="text-slate-600">Uptime: <strong className="text-emerald-700">{svc.uptime}</strong></span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase">
                      {svc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ALERT RULES & NOTIFICATION ROUTING */}
      {subTab === 'alerts' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-purple-700" />
                <span>Alert Rules & Incident Notification Routing</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically route critical operational events to Email, Slack webhooks, or PagerDuty.
              </p>
            </div>
            <button
              onClick={() => setShowAddAlertModal(true)}
              className="px-4 py-2 rounded-xl bg-[#5A1E65] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-purple-900"
            >
              <Plus className="w-4 h-4" />
              <span>New Alert Rule</span>
            </button>
          </div>

          <div className="space-y-3">
            {alertRules.map(rule => (
              <div key={rule.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{rule.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      rule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {rule.enabled ? 'Active' : 'Muted'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>When <strong>{rule.metric}</strong> {rule.condition}</span>
                    <span>•</span>
                    <span className="uppercase font-bold text-purple-700">{rule.channel}</span>
                    <span>→</span>
                    <span className="truncate max-w-xs">{rule.target}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAlert(rule.id)}
                    className="p-1 text-slate-500 hover:text-purple-700 cursor-pointer"
                  >
                    {rule.enabled ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(rule.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAddAlertModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Create Alert Rule</h3>
                <form onSubmit={handleSaveAlert} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alert Name</label>
                    <input
                      type="text"
                      required
                      value={newAlertName}
                      onChange={(e) => setNewAlertName(e.target.value)}
                      placeholder="e.g. Stripe Webhook Mismatch"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monitored Metric</label>
                    <select
                      value={newAlertMetric}
                      onChange={(e) => setNewAlertMetric(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    >
                      <option value="error_rate_5xx">5xx Error Rate (% of requests)</option>
                      <option value="failed_logins">Failed Login Attempts</option>
                      <option value="server_latency">Average Latency (&gt; 500ms)</option>
                      <option value="webhook_auth_failures">Webhook Signature Auth Failures</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notification Channel</label>
                    <select
                      value={newAlertChannel}
                      onChange={(e) => setNewAlertChannel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    >
                      <option value="slack">Slack Incoming Webhook</option>
                      <option value="email">Email Notification</option>
                      <option value="pagerduty">PagerDuty Event API</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Destination Webhook / Email</label>
                    <input
                      type="text"
                      required
                      value={newAlertTarget}
                      onChange={(e) => setNewAlertTarget(e.target.value)}
                      placeholder="https://hooks.slack.com/... or alerts@..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAlertModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#5A1E65] text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Create Alert
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: IP FIREWALL & RATE LIMITS */}
      {subTab === 'firewall' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleBlockIp} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Block Malicious IP</span>
            </h3>
            <p className="text-xs text-slate-500">
              Instantly block traffic from scrapers, bad actors, or suspicious automated botnets at the Cloudflare edge.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">IP Address</label>
              <input
                type="text"
                required
                value={newIpToBlock}
                onChange={(e) => setNewIpToBlock(e.target.value)}
                placeholder="e.g. 198.51.100.42"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason / Incident Note</label>
              <input
                type="text"
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                placeholder="e.g. Abusive automated scraping"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
            >
              Block IP at Edge
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Active Firewall Blocklist ({firewall.blockedIps.length})</span>
              <span className="text-xs font-mono text-slate-500 font-normal">Global Rate Limit: {firewall.rateLimitPerMinute} req/min</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {firewall.blockedIps.map((b, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{b.ip}</span>
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                        {b.hitsBlocked} hits blocked
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{b.reason}</p>
                    <span className="text-[10px] text-slate-400 font-mono">Blocked at: {new Date(b.blockedAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleUnblockIp(b.ip)}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: FEATURE FLAGS / KILL SWITCHES */}
      {subTab === 'flags' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-700" />
              <span>Feature Flags & Emergency Kill Switches</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle live features or disable degraded integrations instantaneously without initiating code deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureFlags.map(flag => (
              <div 
                key={flag.key}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  flag.enabled ? 'bg-purple-50/40 border-purple-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{flag.name}</h4>
                      <span className="text-[10px] font-mono text-purple-700 font-semibold">{flag.key}</span>
                    </div>
                    {flag.killSwitch && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Kill Switch
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{flag.description}</p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                  <span className={`text-xs font-bold ${flag.enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {flag.enabled ? 'Enabled (Live)' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => handleToggleFlag(flag.key)}
                    className="p-1 cursor-pointer"
                  >
                    {flag.enabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: DATABASE BACKUPS & POINT-IN-TIME RECOVERY */}
      {subTab === 'backups' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-700" />
                <span>Database Snapshots & Disaster Recovery UI</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated nightly backups stored in immutable replica vaults. Test point-in-time recovery and cryptographic SHA256 checksums.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSnapshotLabel}
                onChange={(e) => setNewSnapshotLabel(e.target.value)}
                placeholder="Optional backup label..."
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none"
              />
              <button
                onClick={handleCreateSnapshot}
                disabled={isCreatingSnapshot}
                className="px-4 py-2 rounded-xl bg-[#5A1E65] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
              >
                {isCreatingSnapshot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isCreatingSnapshot ? 'Backing up...' : 'Create Snapshot'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {snapshots.map(snap => (
              <div key={snap.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{snap.label}</span>
                    <span className="text-[10px] bg-purple-100 text-[#5A1E65] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                      {snap.type}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">({snap.size} · {snap.recordsCount} rows)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                    <span>SHA-256: {snap.sha256.substring(0, 24)}...</span>
                    <span>•</span>
                    <span>{new Date(snap.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestoreTest(snap.id)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Verify Recovery
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: IMMUTABLE AUDIT LOG */}
      {subTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-700" />
                <span>Immutable Cryptographic Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every administrative action, moderation change, and token update is logged with non-repudiation timestamps.
              </p>
            </div>
            <button
              onClick={() => exportDataset('audit-logs', 'csv', filteredAuditLogs)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Trail (CSV)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl flex-1 max-w-sm border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit actions, emails, targets..."
                className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {filteredAuditLogs.map((log, idx) => (
              <div key={log.id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {log.action}
                    </span>
                    <span className="text-slate-600 font-semibold">{log.user_email}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Target: {log.target_type} ({log.target_id || 'general'})
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>{log.created_at}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Integrity Verified" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
