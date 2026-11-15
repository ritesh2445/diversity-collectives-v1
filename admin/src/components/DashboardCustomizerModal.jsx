import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Layout, 
  Check, 
  X, 
  Sliders, 
  Moon, 
  Sun, 
  Monitor, 
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { 
  ADMIN_THEMES, 
  getAdminThemePreferences, 
  saveAdminThemePreferences,
  getDashboardLayout,
  saveDashboardLayout
} from '../services/adminClient.js';

export default function DashboardCustomizerModal({ 
  isOpen, 
  onClose, 
  onLayoutChange, 
  onThemeChange 
}) {
  const [themePrefs, setThemePrefs] = useState(getAdminThemePreferences());
  const [layout, setLayout] = useState(getDashboardLayout());

  useEffect(() => {
    if (isOpen) {
      setThemePrefs(getAdminThemePreferences());
      setLayout(getDashboardLayout());
    }
  }, [isOpen]);

  const handleSelectTheme = (themeId) => {
    const updated = { ...themePrefs, themeId };
    setThemePrefs(updated);
    saveAdminThemePreferences(updated);
    onThemeChange?.(updated);
  };

  const handleToggleWidget = (key) => {
    const updated = { ...layout, [key]: !layout[key] };
    setLayout(updated);
    saveDashboardLayout(updated);
    onLayoutChange?.(updated);
  };

  if (!isOpen) return null;

  const widgetDefinitions = [
    { key: 'showKpiCards', label: 'Executive KPI Metric Summary Cards', desc: 'Displays revenue, sustainers, active directory listings, and response time' },
    { key: 'showAnomaliesAlert', label: 'AI Anomaly & Outlier Alerts', desc: 'Surfaces machine learning alerts on traffic, inquiry surges, or error spikes' },
    { key: 'showRecentDonations', label: 'Recent Donations & Sustainer Transactions', desc: 'Financial transaction table with live Zeffy status indicators' },
    { key: 'showPendingModeration', label: 'Community Directory Moderation Queue', desc: 'Quick approval cards for incoming business applications' },
    { key: 'showHealthGauges', label: 'Infrastructure & Edge Health Gauges', desc: 'Sub-50ms latency gauges for Turso DB, Worker Edge, and Resend' },
    { key: 'showActivityStream', label: 'Live Staff Activity Feed', desc: 'Real-time audit events across team members' },
    { key: 'showKanbanPreview', label: 'Workflow Tasks & Kanban Rollup', desc: 'Quick view of tasks currently assigned to you or in progress' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-lg text-slate-900">Personalize Dashboard & Brand Theme</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Theme Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Brand Theme & Accent Colors
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADMIN_THEMES.map(theme => {
              const isSelected = themePrefs.themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected ? 'ring-2 ring-purple-700 border-purple-400 bg-purple-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-5 h-5 rounded-full shadow-2xs border border-white"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span className="text-xs font-bold text-slate-900">{theme.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-purple-700" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Widgets Layout Customizer */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Overview Dashboard Widget Visibility
            </label>
            <span className="text-[11px] text-slate-400 font-medium">Toggle to show/hide</span>
          </div>

          <div className="space-y-2">
            {widgetDefinitions.map(w => {
              const isEnabled = layout[w.key] !== false;
              return (
                <div 
                  key={w.key}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{w.label}</span>
                    <span className="text-[11px] text-slate-500 leading-tight">{w.desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleWidget(w.key)}
                    className="p-1 cursor-pointer"
                  >
                    {isEnabled ? (
                      <ToggleRight className="w-7 h-7 text-purple-700" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#5A1E65] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs hover:bg-purple-900"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
