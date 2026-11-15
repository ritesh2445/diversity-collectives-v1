import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Wrench, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  ShieldAlert, 
  Globe, 
  AlertCircle,
  Play,
  Pause,
  Quote,
  Users,
  Lock,
  Sparkles,
  Calendar,
  Eye,
  RefreshCw,
  Palette
} from 'lucide-react';
import {
  getSiteStatuses,
  saveSiteStatuses,
  setActiveSiteStatus,
  deleteSiteStatus,
  createSiteStatus,
  updateSiteStatus,
  getActiveSiteStatus,
  getStoredUser
} from '../services/adminClient.js';
import SiteStatusOverlay from '../../components/SiteStatusOverlay.jsx';

const STATUS_TYPE_LABELS = {
  live: 'Live / Normal',
  launch_timer: 'Launch Timer',
  maintenance: 'Maintenance Mode',
  down: 'Service Disruption / Outage',
  custom_error: 'Custom Error Page',
  custom: 'Custom Status'
};

const STATUS_TYPE_DESCRIPTIONS = {
  live: 'Site is fully operational and accessible to all visitors.',
  launch_timer: 'Full-screen countdown with animated moving rainbow gradient background. Sets target launch date & time.',
  maintenance: 'Full-screen maintenance notice with rotating quotes and moving rainbow aurora glow.',
  down: 'Full-screen emergency outage notice explaining service disruption.',
  custom_error: 'Custom branded error page with error codes and optional retry button.',
  custom: 'Fully customizable status screen created with custom messages, colors, and quotes.'
};

const TYPE_ICONS = {
  live: Globe,
  launch_timer: Clock,
  maintenance: Wrench,
  down: AlertCircle,
  custom_error: ShieldAlert,
  custom: Sparkles
};

export default function SiteStatusManager() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusId, setActiveStatusId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingStatus, setEditingStatus] = useState(null);
  const [previewStatus, setPreviewStatus] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [user, setUser] = useState(getStoredUser());

  // Form State
  const [form, setForm] = useState({
    name: '',
    type: 'custom',
    title: '',
    message: '',
    description: '',
    timerEnd: '',
    errorCode: '',
    useRainbowGradient: true,
    showSocials: true,
    showRetry: true,
    quotes: ['We are making things better for our community. Please check back soon.'],
    gradientColors: ['#5A1E65', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B'],
    fontFamily: '"Plus Jakarta Sans", Inter, sans-serif'
  });

  const reloadStatuses = () => {
    const list = getSiteStatuses();
    setStatuses(list);
    const active = getActiveSiteStatus();
    setActiveStatusId(active ? active.id : null);
  };

  useEffect(() => {
    reloadStatuses();
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const handleActivate = (id) => {
    setActiveSiteStatus(id);
    reloadStatuses();
    setFeedbackMsg(`Site status activated: ${id}. Changes are live across all visitors.`);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingStatus(null);
    setForm({
      name: '',
      type: 'custom',
      title: 'Diversity Collective Ventura County',
      message: 'Preparing an extraordinary new experience for our community.',
      description: '',
      timerEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      errorCode: '',
      useRainbowGradient: true,
      showSocials: true,
      showRetry: true,
      quotes: [
        'We are making things better for our community. Please check back soon.',
        'Temporarily offline for improvements. Thank you for your patience.',
        'Upgrading our safe harbor for you. Back shortly.'
      ],
      gradientColors: ['#5A1E65', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B'],
      fontFamily: '"Plus Jakarta Sans", Inter, sans-serif'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (status) => {
    setModalMode('edit');
    setEditingStatus(status);
    let formattedTimerEnd = '';
    if (status.timerEnd || status.launchDate) {
      try {
        const d = new Date(status.timerEnd || status.launchDate);
        if (!isNaN(d.getTime())) {
          formattedTimerEnd = d.toISOString().slice(0, 16);
        }
      } catch { }
    }

    setForm({
      name: status.name || '',
      type: status.type || 'custom',
      title: status.title || '',
      message: status.message || '',
      description: status.description || '',
      timerEnd: formattedTimerEnd,
      errorCode: status.errorCode || '',
      useRainbowGradient: status.useRainbowGradient !== false,
      showSocials: status.showSocials !== false,
      showRetry: status.showRetry !== false,
      quotes: Array.isArray(status.quotes) && status.quotes.length > 0 ? [...status.quotes] : [''],
      gradientColors: Array.isArray(status.gradientColors) && status.gradientColors.length > 0
        ? [...status.gradientColors]
        : ['#5A1E65', '#7C3AED', '#06B6D4'],
      fontFamily: status.fontFamily || '"Plus Jakarta Sans", Inter, sans-serif'
    });
    setShowModal(true);
  };

  const handleSaveStatus = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      launchDate: form.type === 'launch_timer' && form.timerEnd ? new Date(form.timerEnd).toISOString() : null,
      timerEnd: form.type === 'launch_timer' && form.timerEnd ? new Date(form.timerEnd).toISOString() : null,
      quotes: form.quotes.filter(q => q && q.trim()).slice(0, 50),
      gradientColors: form.gradientColors.filter(c => c && c.trim()).slice(0, 20)
    };

    if (modalMode === 'create') {
      const res = createSiteStatus({
        ...payload,
        isActive: false
      });
      if (res.success) {
        reloadStatuses();
        setShowModal(false);
        setFeedbackMsg(`Created custom status: "${payload.name}".`);
        setTimeout(() => setFeedbackMsg(''), 4500);
      }
    } else if (editingStatus) {
      const res = updateSiteStatus(editingStatus.id, payload);
      if (res.success) {
        // If this status is currently active, re-sync live public storage immediately
        if (editingStatus.id === activeStatusId) {
          setActiveSiteStatus(editingStatus.id);
        }
        reloadStatuses();
        setShowModal(false);
        setFeedbackMsg(`Updated status screen: "${payload.name}".`);
        setTimeout(() => setFeedbackMsg(''), 4500);
      }
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return;
    const res = deleteSiteStatus(confirmDeleteId);
    if (res.success) {
      reloadStatuses();
      setConfirmDeleteId(null);
      setFeedbackMsg('Custom status deleted.');
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  const handleQuoteChange = (index, value) => {
    const updated = [...form.quotes];
    updated[index] = value;
    setForm(prev => ({ ...prev, quotes: updated }));
  };

  const handleAddQuote = () => {
    setForm(prev => ({ ...prev, quotes: [...prev.quotes, ''] }));
  };

  const handleRemoveQuote = (index) => {
    setForm(prev => ({
      ...prev,
      quotes: prev.quotes.length > 1 ? prev.quotes.filter((_, i) => i !== index) : ['']
    }));
  };

  const handleColorChange = (index, value) => {
    const updated = [...form.gradientColors];
    updated[index] = value;
    setForm(prev => ({ ...prev, gradientColors: updated }));
  };

  const handleAddColor = () => {
    setForm(prev => ({ ...prev, gradientColors: [...prev.gradientColors, '#EC4899'] }));
  };

  const handleRemoveColor = (index) => {
    setForm(prev => ({
      ...prev,
      gradientColors: prev.gradientColors.length > 1 ? prev.gradientColors.filter((_, i) => i !== index) : ['#5A1E65']
    }));
  };

  const activeStatus = statuses.find(s => s.id === activeStatusId) || statuses[0];
  const ActiveTypeIcon = TYPE_ICONS[activeStatus?.type || 'live'] || Globe;

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-display">Site Status & Custom Status Builder</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage live maintenance mode, customizable launch countdown timers, and animated rainbow status screens.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-[#5A1E65] hover:bg-[#45124E] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Status</span>
          </button>
        </div>
      </div>

      {/* Active Live Status Overview Card */}
      <div className={`rounded-3xl p-6 border shadow-xs transition-all ${
        activeStatus?.type === 'maintenance'
          ? 'bg-rose-50/80 border-rose-200 text-rose-950'
          : activeStatus?.type === 'launch_timer'
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : activeStatus?.type === 'down'
              ? 'bg-red-50/80 border-red-200 text-red-950'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              activeStatus?.type === 'maintenance'
                ? 'bg-rose-200 text-rose-800'
                : activeStatus?.type === 'launch_timer'
                  ? 'bg-amber-200 text-amber-800'
                  : activeStatus?.type === 'down'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-emerald-200 text-emerald-800'
            }`}>
              <ActiveTypeIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest opacity-80">
                  CURRENT LIVE SITE STATUS:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  activeStatus?.type === 'live'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#5A1E65] text-white'
                }`}>
                  {STATUS_TYPE_LABELS[activeStatus?.type] || activeStatus?.type}
                </span>
              </div>
              <h3 className="text-xl font-black mt-0.5 text-slate-900">{activeStatus?.name}</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                {activeStatus?.message || STATUS_TYPE_DESCRIPTIONS[activeStatus?.type || 'live']}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {activeStatus?.type !== 'live' && (
              <button
                type="button"
                onClick={() => setPreviewStatus(activeStatus)}
                className="px-4 py-2 bg-white text-slate-800 hover:text-[#5A1E65] border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs hover:border-[#5A1E65] transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-[#5A1E65]" />
                <span>Preview Screen</span>
              </button>
            )}
            {activeStatus?.id !== 'status-live' && (
              <button
                type="button"
                onClick={() => handleActivate('status-live')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Switch To Live</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Screens List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider font-display">
              Configured Status Screens ({statuses.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click &quot;Edit&quot; on any screen to adjust launch countdowns, moving rainbow colors, or messages.
            </p>
          </div>
          <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider border border-purple-100">
            Realtime Propagation
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {statuses.map((status) => {
            const isActive = status.id === activeStatusId;
            const isPredefined = Boolean(status.isPredefined);
            const TypeIcon = TYPE_ICONS[status.type] || Globe;
            const targetDate = status.launchDate || status.timerEnd;

            return (
              <div 
                key={status.id} 
                className={`p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  isActive ? 'bg-purple-50/40' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    status.type === 'live' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : status.type === 'launch_timer' 
                        ? 'bg-amber-100 text-amber-700' 
                        : status.type === 'maintenance' 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-purple-100 text-[#5A1E65]'
                  }`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900">{status.name}</span>
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#5A1E65] text-white text-[10px] font-black tracking-wider">
                          ACTIVE LIVE
                        </span>
                      )}
                      {isPredefined && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                          Predefined Template
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-slate-400 capitalize">
                        ({STATUS_TYPE_LABELS[status.type] || status.type})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {status.message || STATUS_TYPE_DESCRIPTIONS[status.type]}
                    </p>

                    {status.type === 'launch_timer' && targetDate && (
                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 w-fit">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Countdown target: {new Date(targetDate).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                  {/* Preview Button */}
                  {status.type !== 'live' && (
                    <button
                      type="button"
                      onClick={() => setPreviewStatus(status)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-[#5A1E65] hover:border-[#5A1E65] text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 bg-white"
                      title="Preview this status screen"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  )}

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(status)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 bg-white"
                    title="Edit Status Settings & Countdown"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  {/* Activation Button */}
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => handleActivate(status.id)}
                      className="px-4 py-2 rounded-xl bg-[#5A1E65] hover:bg-[#45124E] text-white text-xs font-extrabold cursor-pointer transition-all shadow-xs hover:shadow-sm"
                    >
                      Activate
                    </button>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  )}

                  {/* Delete Button (Only custom non-predefined) */}
                  {!isPredefined && (
                    <button
                      type="button"
                      onClick={() => handleDelete(status.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer transition-all"
                      title="Delete Status"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Status Screen Builder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#5A1E65] flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 font-display">
                    {modalMode === 'create' ? 'Create Custom Status Screen' : `Edit Screen: ${form.name}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customize messages, target countdown timers, rotating quotes, and animated moving rainbow splashes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-6">
              {/* Basic Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Screen Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Major Launch 2026, Scheduled System Maintenance"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#5A1E65]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none focus:border-[#5A1E65]"
                  >
                    <option value="launch_timer">Launch Timer (Live Countdown Ticker)</option>
                    <option value="maintenance">Maintenance Mode (Rotating Quotes)</option>
                    <option value="live">Live / Normal Operations</option>
                    <option value="down">Service Outage / Temporary Downtime</option>
                    <option value="custom_error">Custom Error Page (With Error Code)</option>
                    <option value="custom">Custom Status Screen</option>
                  </select>
                </div>
              </div>

              {/* Title & Message */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hero Title (Display Heading)</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Something Extraordinary Is Coming, Site Under Maintenance"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#5A1E65]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Main Message / Subtitle</label>
                  <textarea
                    rows={2}
                    value={form.message}
                    onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Provide a clear, affirming explanation to community visitors..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#5A1E65]"
                  />
                </div>
              </div>

              {/* Launch Timer Countdown Setting */}
              {form.type === 'launch_timer' && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <label className="text-xs font-extrabold text-amber-950">Target Launch Date & Time</label>
                  </div>
                  <input
                    type="datetime-local"
                    required
                    value={form.timerEnd}
                    onChange={(e) => setForm(prev => ({ ...prev, timerEnd: e.target.value }))}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-amber-300 bg-white text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#5A1E65]"
                  />
                  <p className="text-[11px] text-amber-800">
                    The status page will display a ticking real-time <strong>Days : Hours : Minutes : Seconds</strong> countdown towards this target.
                  </p>
                </div>
              )}

              {/* Custom Error Variant Settings */}
              {form.type === 'custom_error' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">Error Code (Optional)</label>
                    <input
                      type="text"
                      value={form.errorCode}
                      onChange={(e) => setForm(prev => ({ ...prev, errorCode: e.target.value }))}
                      placeholder="e.g. 503, 500, NET-ERR"
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="showRetry"
                      checked={form.showRetry}
                      onChange={(e) => setForm(prev => ({ ...prev, showRetry: e.target.checked }))}
                      className="w-4 h-4 accent-[#5A1E65] rounded"
                    />
                    <label htmlFor="showRetry" className="text-xs font-bold text-rose-950 cursor-pointer">
                      Show &quot;Try Again&quot; reload button
                    </label>
                  </div>
                </div>
              )}

              {/* Rotating Quotes Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">Rotating Quotes & Affirmations</label>
                    <span className="text-[11px] text-slate-400">
                      These auto-cycle smoothly with cross-fade transitions every 5 seconds on the overlay screen.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuote}
                    className="text-xs font-bold text-[#5A1E65] hover:text-[#45124E] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Quote</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {form.quotes.map((quote, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={quote}
                        onChange={(e) => handleQuoteChange(idx, e.target.value)}
                        placeholder={`Affirming message #${idx + 1}`}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#5A1E65]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveQuote(idx)}
                        disabled={form.quotes.length <= 1}
                        className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove quote"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rainbow Gradient Splashes & Colors */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Moving Rainbow Gradient Colors
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Colors used for the moving background aurora lighting effect.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="text-xs font-bold text-[#5A1E65] hover:text-[#45124E] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Color</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="useRainbow"
                    checked={form.useRainbowGradient}
                    onChange={(e) => setForm(prev => ({ ...prev, useRainbowGradient: e.target.checked }))}
                    className="w-4 h-4 accent-[#5A1E65] rounded"
                  />
                  <label htmlFor="useRainbow" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Enable Full-Spectrum Rainbow Splash Motion
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {form.gradientColors.map((color, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(idx, e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => handleColorChange(idx, e.target.value)}
                        className="w-20 px-1 py-1 rounded bg-transparent text-[11px] font-mono font-bold text-slate-700 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        disabled={form.gradientColors.length <= 1}
                        className="text-slate-400 hover:text-rose-600 text-xs ml-auto cursor-pointer disabled:opacity-20"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewStatus({
                    ...form,
                    launchDate: form.type === 'launch_timer' && form.timerEnd ? new Date(form.timerEnd).toISOString() : null
                  })}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-[#5A1E65] border border-slate-200 hover:border-[#5A1E65] rounded-xl flex items-center gap-1.5 cursor-pointer bg-white"
                >
                  <Eye className="w-3.5 h-3.5 text-[#5A1E65]" />
                  <span>Preview This Screen</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-black text-white bg-[#5A1E65] hover:bg-[#45124E] rounded-xl shadow-xs hover:shadow-sm cursor-pointer transition-all"
                  >
                    {modalMode === 'create' ? 'Create & Save Status' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen In-Admin Interactive Preview Modal */}
      {previewStatus && (
        <div className="fixed inset-0 z-[99999] flex flex-col">
          <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-lg z-50">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold">
                Status Screen Live Preview &middot; &quot;{previewStatus.name || previewStatus.title}&quot;
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewStatus(null)}
              className="px-4 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-extrabold hover:bg-slate-100 cursor-pointer"
            >
              Exit Preview
            </button>
          </div>
          <div className="flex-1 relative">
            <SiteStatusOverlay status={previewStatus} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="font-black text-lg text-slate-900 mb-1 font-display">Delete Custom Status?</h3>
            <p className="text-xs text-slate-500 mb-5">
              This will remove this custom status screen permanently. If it is currently active, the site will automatically fall back to Live mode.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Alert Toast */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#5A1E65] text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}
    </div>
  );
}
