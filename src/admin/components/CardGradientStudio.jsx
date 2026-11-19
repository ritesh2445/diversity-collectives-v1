import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  Eye,
  Save,
  HelpCircle
} from 'lucide-react';
import {
  DEFAULT_CATEGORY_THEMES,
  GRADIENT_PALETTE_PRESETS,
  loadCategoryThemes,
  saveCategoryThemesToStorage
} from '../../utils/cardGradients.js';

export default function CardGradientStudio({ onThemesChanged }) {
  const [themes, setThemes] = useState(loadCategoryThemes);
  const [activeCategory, setActiveCategory] = useState('Health & Sexual Wellness');
  const [saveStatus, setSaveStatus] = useState('');

  const currentTheme = themes[activeCategory] || DEFAULT_CATEGORY_THEMES[activeCategory] || {
    name: 'Custom Theme',
    fromColor: '#f1f5f9',
    viaColor: '#e2e8f0',
    toColor: '#cbd5e1',
    gradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
    borderColor: '#cbd5e1',
    borderHoverColor: '#64748b',
    textColor: '#0f172a',
    accentColor: '#5A1E65'
  };

  const handleUpdateCurrentTheme = (updates) => {
    const updatedTheme = { ...currentTheme, ...updates };
    // Recalculate gradient if from/via/to colors changed
    if (updates.fromColor || updates.viaColor || updates.toColor) {
      const from = updates.fromColor || currentTheme.fromColor;
      const via = updates.viaColor || currentTheme.viaColor || from;
      const to = updates.toColor || currentTheme.toColor;
      updatedTheme.gradient = `linear-gradient(135deg, ${from} 0%, ${via} 50%, ${to} 100%)`;
      updatedTheme.badgeBg = from;
    }
    const newThemes = {
      ...themes,
      [activeCategory]: updatedTheme
    };
    setThemes(newThemes);
    saveCategoryThemesToStorage(newThemes);
    if (onThemesChanged) onThemesChanged(newThemes);
    setSaveStatus('✓ Changes saved live');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleApplyPreset = (preset) => {
    handleUpdateCurrentTheme({
      fromColor: preset.fromColor,
      viaColor: preset.viaColor,
      toColor: preset.toColor,
      gradient: preset.gradient,
      borderColor: preset.borderColor,
      borderHoverColor: preset.accentColor,
      textColor: preset.textColor,
      accentColor: preset.accentColor,
      badgeBg: preset.fromColor,
      badgeText: preset.accentColor,
      badgeBorder: preset.borderColor
    });
  };

  const handleResetToDefaults = () => {
    if (!window.confirm('Reset all card gradients to original curated styles?')) return;
    setThemes(DEFAULT_CATEGORY_THEMES);
    saveCategoryThemesToStorage(DEFAULT_CATEGORY_THEMES);
    if (onThemesChanged) onThemesChanged(DEFAULT_CATEGORY_THEMES);
    setSaveStatus('✓ Reset all card gradients to default');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const allCategories = Object.keys(DEFAULT_CATEGORY_THEMES);

  return (
    <div className="bg-white rounded-3xl border-2 border-purple-200/90 shadow-sm p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-[#5A1E65]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-black text-slate-900">
                Card Gradient & Color Customizer
              </h3>
              <p className="text-xs text-slate-500">
                Customize category gradient colors, border tones, and accent highlights for Resources and Community cards.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          )}
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Category Selection Tabs */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
          Select Category to Customize
        </label>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => {
            const isActive = activeCategory === cat;
            const theme = themes[cat] || DEFAULT_CATEGORY_THEMES[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-white/50 shadow-2xs shrink-0"
                  style={{ background: theme.gradient || theme.fromColor }}
                />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview & Color Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        {/* Left Column: Live Card Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-[#5A1E65]" />
              <span>Live Card Preview ({activeCategory})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">100% Client-Side Live</span>
          </div>

          <div
            className="p-6 sm:p-7 rounded-3xl transition-all duration-300 shadow-md space-y-4"
            style={{
              background: currentTheme.gradient,
              border: `2px solid ${currentTheme.borderColor || '#cbd5e1'}`
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs"
                style={{
                  backgroundColor: currentTheme.badgeBg || currentTheme.fromColor,
                  color: currentTheme.badgeText || currentTheme.accentColor,
                  borderColor: currentTheme.badgeBorder || currentTheme.borderColor
                }}
              >
                {activeCategory}
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-white/70 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/60">
                Verified Provider
              </span>
            </div>

            <div className="space-y-1.5">
              <h4
                className="font-display text-xl font-bold tracking-tight"
                style={{ color: currentTheme.textColor || '#0f172a' }}
              >
                Example Community Provider
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Affirming, culturally competent support, rapid wellness navigation, and drop-in peer resources for Ventura County.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-900/10 flex items-center justify-between text-xs">
              <span
                className="font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border"
                style={{
                  color: currentTheme.accentColor,
                  borderColor: currentTheme.borderColor
                }}
              >
                📞 (805) 644-5428
              </span>
              <span
                className="px-3 py-1 rounded-xl font-bold text-white shadow-2xs"
                style={{ backgroundColor: currentTheme.accentColor }}
              >
                Access Service →
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Gradient Preset Selector & Custom Inputs */}
        <div className="lg:col-span-7 space-y-5 bg-slate-50 p-5 rounded-3xl border border-slate-200">
          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Curated Presets</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADIENT_PALETTE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-400 hover:scale-[1.02] transition-all text-left shadow-2xs cursor-pointer flex flex-col justify-between h-16 group"
                >
                  <span
                    className="w-full h-3.5 rounded-md border border-black/10 group-hover:shadow-xs transition-shadow"
                    style={{ background: p.gradient }}
                  />
                  <span className="text-[10px] font-bold text-slate-800 truncate mt-1">
                    {p.name.split(' (')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Granular Color Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Granular Hex Color Customization
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* From Color */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Start Gradient</label>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
                  <input
                    type="color"
                    value={currentTheme.fromColor || '#e0f2fe'}
                    onChange={(e) => handleUpdateCurrentTheme({ fromColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTheme.fromColor || '#e0f2fe'}
                    onChange={(e) => handleUpdateCurrentTheme({ fromColor: e.target.value })}
                    className="w-full text-xs font-mono font-bold uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* Via Color */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Middle Tone</label>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
                  <input
                    type="color"
                    value={currentTheme.viaColor || currentTheme.fromColor || '#ecfeff'}
                    onChange={(e) => handleUpdateCurrentTheme({ viaColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTheme.viaColor || currentTheme.fromColor || '#ecfeff'}
                    onChange={(e) => handleUpdateCurrentTheme({ viaColor: e.target.value })}
                    className="w-full text-xs font-mono font-bold uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* To Color */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">End Gradient</label>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
                  <input
                    type="color"
                    value={currentTheme.toColor || '#e0e7ff'}
                    onChange={(e) => handleUpdateCurrentTheme({ toColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTheme.toColor || '#e0e7ff'}
                    onChange={(e) => handleUpdateCurrentTheme({ toColor: e.target.value })}
                    className="w-full text-xs font-mono font-bold uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Border Color */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Card Border Color</label>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
                  <input
                    type="color"
                    value={currentTheme.borderColor || '#7dd3fc'}
                    onChange={(e) => handleUpdateCurrentTheme({ borderColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTheme.borderColor || '#7dd3fc'}
                    onChange={(e) => handleUpdateCurrentTheme({ borderColor: e.target.value })}
                    className="w-full text-xs font-mono font-bold uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Accent & Button Color</label>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
                  <input
                    type="color"
                    value={currentTheme.accentColor || '#0284c7'}
                    onChange={(e) => handleUpdateCurrentTheme({ accentColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTheme.accentColor || '#0284c7'}
                    onChange={(e) => handleUpdateCurrentTheme({ accentColor: e.target.value })}
                    className="w-full text-xs font-mono font-bold uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
