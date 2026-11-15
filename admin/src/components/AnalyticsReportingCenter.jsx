import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Calendar, 
  Download, 
  Mail, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Filter, 
  Sliders, 
  FileText, 
  Share2,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  getExecutiveKpis, 
  getScheduledReports, 
  saveScheduledReport, 
  deleteScheduledReport, 
  getBiDataFeeds,
  exportDataset
} from '../services/adminClient.js';

export default function AnalyticsReportingCenter({ onTriggerFeedback }) {
  const [subTab, setSubTab] = useState('kpis'); // 'kpis' | 'builder' | 'scheduled' | 'bi'
  const [kpis, setKpis] = useState(null);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [biFeeds, setBiFeeds] = useState([]);

  // Report Builder State
  const [builderMetric, setBuilderMetric] = useState('donations');
  const [builderRange, setBuilderRange] = useState('30d');
  const [builderGroupBy, setBuilderGroupBy] = useState('week');
  const [builderResults, setBuilderResults] = useState(null);

  // Scheduled Report Modal
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [schedTitle, setSchedTitle] = useState('');
  const [schedCadence, setSchedCadence] = useState('Weekly (Every Monday 08:00 AM)');
  const [schedRecipients, setSchedRecipients] = useState('board@diversitycollective.org');
  const [copiedFeed, setCopiedFeed] = useState(null);

  useEffect(() => {
    loadData();
    runBuilderQuery();
  }, []);

  const loadData = async () => {
    const [k, s, b] = await Promise.all([
      getExecutiveKpis(),
      getScheduledReports(),
      getBiDataFeeds()
    ]);
    setKpis(k);
    setScheduledReports(s);
    setBiFeeds(b);
  };

  const runBuilderQuery = () => {
    // Generate synthetic mock data matching the query selection
    const mockRows = [];
    const labels = builderGroupBy === 'day' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] 
      : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

    labels.forEach((lbl, idx) => {
      mockRows.push({
        period: lbl,
        totalDonations: `$${(2800 + idx * 640).toLocaleString()}`,
        transactionCount: 22 + idx * 6,
        avgGift: `$${Math.round((2800 + idx * 640) / (22 + idx * 6))}`,
        newDirectoryListings: 2 + (idx % 3),
        volunteerSignups: 4 + idx * 2
      });
    });
    setBuilderResults(mockRows);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!schedTitle.trim()) return;
    const recipientsArray = schedRecipients.split(',').map(r => r.trim()).filter(Boolean);
    await saveScheduledReport({
      title: schedTitle,
      cadence: schedCadence,
      recipients: recipientsArray,
      format: 'PDF & CSV Export',
      dataset: builderMetric
    });
    const updated = await getScheduledReports();
    setScheduledReports(updated);
    setShowAddScheduleModal(false);
    setSchedTitle('');
    onTriggerFeedback?.('Scheduled automated report saved.');
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm('Delete this scheduled report?')) return;
    const res = await deleteScheduledReport(id);
    setScheduledReports(res.reports);
    onTriggerFeedback?.('Scheduled report removed.');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedFeed(text);
    setTimeout(() => setCopiedFeed(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
              PILLAR 4: ANALYTICS & EXECUTIVE REPORTING
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#5A1E65]" />
            <span>Executive Business Intelligence & Reporting</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data visualization, drag-and-drop query generation, automated scheduled email deliveries, and live connectors for Tableau, Power BI, and Looker.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'kpis', label: 'Executive KPIs', icon: TrendingUp },
            { id: 'builder', label: 'Custom Query Builder', icon: Sliders },
            { id: 'scheduled', label: 'Scheduled Deliveries', icon: Mail },
            { id: 'bi', label: 'BI Tool Connectors', icon: Share2 }
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

      {/* SUB-TAB 1: EXECUTIVE KPIS */}
      {subTab === 'kpis' && kpis && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Raised (YTD)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-950">${kpis.totalRevenue.toLocaleString()}</span>
                <span className="text-xs font-bold text-emerald-600">{kpis.revenueGrowthRate}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across 412 distinct donors</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Monthly Sustainers</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-950">{kpis.monthlySustainersCount}</span>
                <span className="text-xs font-bold text-purple-700 font-mono">~$2,150/mo MRR</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Automated card renewals</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Affirming Directory</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-950">{kpis.approvedBusinessesCount}</span>
                <span className="text-xs font-bold text-emerald-600">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{kpis.pendingModerationCount} pending moderation</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Inquiry Response Time</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-950">{kpis.avgInquiryResponseHours} hrs</span>
                <span className="text-xs font-bold text-emerald-600">-35% faster</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{kpis.openInquiriesCount} tickets awaiting reply</p>
            </div>
          </div>

          {/* Fund Breakdown & Acquisition Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fund Distributions */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Revenue Allocation by Program Fund</span>
                <PieChart className="w-5 h-5 text-purple-700" />
              </h3>

              <div className="space-y-3 pt-2">
                {kpis.fundBreakdown.map((f, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{f.fund}</span>
                      <span className="text-slate-900 font-mono font-bold">${f.amount.toLocaleString()} ({f.percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#5A1E65] to-amber-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${f.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Donor Acquisition Funnel */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Community Conversion Funnel</span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </h3>

              <div className="space-y-2 pt-2 text-xs">
                <div className="p-3 bg-purple-50 rounded-2xl flex items-center justify-between font-bold text-[#5A1E65]">
                  <span>1. Website Visitors (30d)</span>
                  <span className="font-mono">14,820</span>
                </div>
                <div className="p-3 bg-purple-100/70 rounded-2xl flex items-center justify-between font-bold text-purple-900 ml-4">
                  <span>2. Visited Donation or Directory Page (28.4%)</span>
                  <span className="font-mono">4,208</span>
                </div>
                <div className="p-3 bg-purple-200/80 rounded-2xl flex items-center justify-between font-bold text-purple-950 ml-8">
                  <span>3. Initiated Gift / Business Submission (9.8%)</span>
                  <span className="font-mono">412</span>
                </div>
                <div className="p-3 bg-amber-400 rounded-2xl flex items-center justify-between font-black text-slate-950 ml-12 shadow-xs">
                  <span>4. Joined Recurring Monthly Sustainer Club (9.2%)</span>
                  <span className="font-mono">38</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CUSTOM QUERY REPORT BUILDER */}
      {subTab === 'builder' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-700" />
              <span>Self-Service Custom Report Builder</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Build tailored data reports across transactions, business listings, or volunteers. Export directly to CSV, JSON, or Excel.
            </p>
          </div>

          {/* Builder Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Primary Dataset</label>
              <select
                value={builderMetric}
                onChange={(e) => setBuilderMetric(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="donations">Financial Donations & Tiers</option>
                <option value="directory">Community Directory Submissions</option>
                <option value="inquiries">Contact Inquiries & Volunteers</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Time Horizon</label>
              <select
                value={builderRange}
                onChange={(e) => setBuilderRange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date (2026)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Group By Cadence</label>
              <select
                value={builderGroupBy}
                onChange={(e) => setBuilderGroupBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="day">Daily Aggregate</option>
                <option value="week">Weekly Rollup</option>
                <option value="month">Monthly Summary</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={runBuilderQuery}
                className="w-full py-2 px-3 bg-[#5A1E65] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs hover:bg-purple-900"
              >
                Execute Query
              </button>
            </div>
          </div>

          {/* Results Table & Export */}
          {builderResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Query Preview ({builderResults.length} data rows)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportDataset('custom-report', 'csv', builderResults)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-slate-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={() => exportDataset('custom-report', 'json', builderResults)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Period</th>
                      <th className="p-3">Total Raised</th>
                      <th className="p-3">Gifts Count</th>
                      <th className="p-3">Average Gift</th>
                      <th className="p-3">New Listings</th>
                      <th className="p-3">Volunteer Signups</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {builderResults.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{row.period}</td>
                        <td className="p-3 text-purple-900 font-bold">{row.totalDonations}</td>
                        <td className="p-3 text-slate-700">{row.transactionCount}</td>
                        <td className="p-3 text-slate-700">{row.avgGift}</td>
                        <td className="p-3 text-slate-700">{row.newDirectoryListings}</td>
                        <td className="p-3 text-slate-700">{row.volunteerSignups}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: SCHEDULED AUTOMATED REPORT DELIVERY */}
      {subTab === 'scheduled' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-700" />
                <span>Scheduled & Automated Report Delivery</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically generate and dispatch recurring PDF digests and CSV files to board leadership and financial reviewers.
              </p>
            </div>
            <button
              onClick={() => setShowAddScheduleModal(true)}
              className="px-4 py-2 rounded-xl bg-[#5A1E65] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-purple-900"
            >
              <Plus className="w-4 h-4" />
              <span>New Scheduled Report</span>
            </button>
          </div>

          <div className="space-y-3">
            {scheduledReports.map(rep => (
              <div key={rep.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{rep.title}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                      {rep.cadence}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    <span>Recipients: <strong>{rep.recipients.join(', ')}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    <span>Format: {rep.format}</span>
                    <span>•</span>
                    <span>Last sent: {rep.lastSent ? new Date(rep.lastSent).toLocaleDateString() : 'Pending next cadence'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteSchedule(rep.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAddScheduleModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Schedule Recurring Report</h3>
                <form onSubmit={handleSaveSchedule} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Report Title</label>
                    <input
                      type="text"
                      required
                      value={schedTitle}
                      onChange={(e) => setSchedTitle(e.target.value)}
                      placeholder="e.g. Monthly Director Financial Pack"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cadence / Schedule</label>
                    <select
                      value={schedCadence}
                      onChange={(e) => setSchedCadence(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    >
                      <option value="Weekly (Every Monday 08:00 AM)">Weekly (Every Monday 08:00 AM)</option>
                      <option value="Bi-Weekly (1st and 15th)">Bi-Weekly (1st and 15th)</option>
                      <option value="Monthly (1st of Month)">Monthly (1st of Month)</option>
                      <option value="Quarterly (Fiscal End)">Quarterly (Fiscal End)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Recipients (Comma separated emails)</label>
                    <input
                      type="text"
                      required
                      value={schedRecipients}
                      onChange={(e) => setSchedRecipients(e.target.value)}
                      placeholder="board@..., director@..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddScheduleModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#5A1E65] text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Schedule Report
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: BI TOOL CONNECTORS */}
      {subTab === 'bi' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-700" />
              <span>Business Intelligence Connectors & Data Feeds</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hook Microsoft Power BI, Tableau, or Looker Studio directly to DCVC serverless API endpoints using read-only bearer tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {biFeeds.map((feed, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">{feed.tool}</span>
                    <span className="text-[10px] bg-purple-100 text-[#5A1E65] font-bold px-2 py-0.5 rounded-full font-mono">
                      {feed.feedType}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{feed.name}</h4>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">API Hook Endpoint:</span>
                    <span className="text-purple-900 font-bold truncate block">{feed.endpoint}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Token: {feed.tokenMasked}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Read-Only</span>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">{feed.updatedFrequency}</span>
                  <button
                    onClick={() => handleCopy(feed.endpoint)}
                    className="px-3 py-1 rounded-xl bg-[#5A1E65] text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs hover:bg-purple-900"
                  >
                    {copiedFeed === feed.endpoint ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFeed === feed.endpoint ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
