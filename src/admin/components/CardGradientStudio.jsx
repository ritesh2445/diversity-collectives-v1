import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  RotateCcw,
  Eye,
  Sliders,
  Layers,
  Phone,
  ArrowUpRight,
  ShieldCheck,
  Star,
  Users,
  Clock,
  MapPin,
  Lock,
  Heart
} from 'lucide-react';
import {
  getAllCardThemes,
  saveAllCardThemes,
  updateCategoryTheme,
  resetCardThemes,
  subscribeToCardThemes,
  LUXURY_GRADIENT_PRESETS,
  DEFAULT_RESOURCE_THEMES,
  DEFAULT_COMMUNITY_THEMES
} from '../../services/cardThemeStore.js';
import CardSpotlight from '../../components/CardSpotlight.jsx';

export default function CardGradientStudio() {
  const [themes, setThemes] = useState(getAllCardThemes());
  const activeTab = 'resources';
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync on updates
  useEffect(() => {
    return subscribeToCardThemes((newThemes) => {
      setThemes(newThemes);
    });
  }, []);

  const resourceCategories = Object.keys(themes.resources);
  const currentCategories = resourceCategories;

  // Set default selected category if none or not in current tab
  useEffect(() => {
    if (!currentCategories.includes(selectedCategory)) {
      setSelectedCategory(currentCategories[0] || '');
    }
  }, [activeTab, currentCategories, selectedCategory]);

  const currentTheme =
    activeTab === 'resources'
      ? themes.resources[selectedCategory] || DEFAULT_RESOURCE_THEMES[selectedCategory] || {}
      : themes.community[selectedCategory] || DEFAULT_COMMUNITY_THEMES[selectedCategory] || {};

  const handleColorChange = (key, value) => {
    const updated = { ...currentTheme, [key]: value };
    updateCategoryTheme(activeTab, selectedCategory, updated);
  };

  const handleApplyPreset = (preset) => {
    const updated = {
      ...currentTheme,
      gradientFrom: preset.gradientFrom,
      gradientVia: preset.gradientVia,
      gradientTo: preset.gradientTo,
      accentColor: preset.accentColor,
      badgeColor: preset.badgeColor,
      btnBg: preset.btnBg || preset.accentColor,
      btnText: preset.btnText || '#FFFFFF',
      glowColor: preset.glowColor,
      presetId: preset.id
    };
    updateCategoryTheme(activeTab, selectedCategory, updated);
  };

  const handleSave = () => {
    saveAllCardThemes(themes, { broadcast: true, publish: true });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (!window.confirm('Reset all card gradients to original factory luxury themes?')) return;
    resetCardThemes();
    setThemes(getAllCardThemes());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const gradientStyle = {
    background: `linear-gradient(145deg, ${currentTheme.gradientFrom || '#FAF5FF'} 0%, ${currentTheme.gradientVia || '#FDFBFF'} 50%, ${currentTheme.gradientTo || '#FFFFFF'} 100%)`
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 p-6 sm:p-8 rounded-3xl border border-purple-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-300" />
              <span>Card Gradient & Theme Studio</span>
            </span>
            <span className="text-xs text-purple-200">0ms Real-Time Sync</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
            Resource Directory Card Styling
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
            Customize the calm soft gradients, accents, borders, and buttons for every Resource Directory category. Changes reflect immediately on public resource cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-300" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4 text-slate-950" />
            <span>Save Themes</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Resource card category gradients successfully saved and synced live!</span>
        </div>
      )}

      {/* Directory Category Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="px-5 py-2.5 rounded-2xl text-xs font-black bg-[#5A1E65] text-white border border-purple-800 shadow-md ring-2 ring-purple-300/40 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>Resource Directory Cards</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-900 text-purple-100">
            {resourceCategories.length}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Community Groups have their own dedicated image, announcement, and reflection cards in Website Content (CMS).
        </span>
      </div>

      {/* Category Pills Selector */}
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
          Select Category to Customize
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {currentCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const catTheme =
              activeTab === 'resources'
                ? themes.resources[cat] || {}
                : themes.community[cat] || {};
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-slate-950 text-white border-purple-500 shadow-md ring-2 ring-purple-400/40'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-white/30"
                  style={{
                    background: `linear-gradient(135deg, ${catTheme.gradientFrom || '#333'}, ${catTheme.gradientTo || '#111'})`
                  }}
                />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <h3 className="font-display text-lg font-black text-slate-950">
              {selectedCategory}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a curated luxury gradient preset or fine-tune exact hex color stops.
            </p>
          </div>

          {/* 1-Click Luxury Presets */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Luxury Gradient Presets</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {LUXURY_GRADIENT_PRESETS.map((preset) => {
                const isActive = currentTheme.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col gap-2 group ${
                      isActive
                        ? 'border-purple-600 ring-2 ring-purple-400 bg-purple-50/40'
                        : 'border-slate-200 hover:border-purple-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div
                      className="w-full h-8 rounded-xl shadow-inner border border-white/20"
                      style={{
                        background: `linear-gradient(135deg, ${preset.gradientFrom} 0%, ${preset.gradientVia} 50%, ${preset.gradientTo} 100%)`
                      }}
                    />
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="truncate">{preset.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-purple-700 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fine-Tuning Color Stops */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-700" />
              <span>Fine-Tune Gradient Stops & Accents</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Gradient Start (Top-Left)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentTheme.gradientFrom || '#FAF5FF'}
                    onChange={(e) => handleColorChange('gradientFrom', e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={currentTheme.gradientFrom || '#FAF5FF'}
                    onChange={(e) => handleColorChange('gradientFrom', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Gradient Mid (Atmospheric)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentTheme.gradientVia || '#FDFBFF'}
                    onChange={(e) => handleColorChange('gradientVia', e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={currentTheme.gradientVia || '#FDFBFF'}
                    onChange={(e) => handleColorChange('gradientVia', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Gradient End (Bottom-Right)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentTheme.gradientTo || '#FFFFFF'}
                    onChange={(e) => handleColorChange('gradientTo', e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={currentTheme.gradientTo || '#FFFFFF'}
                    onChange={(e) => handleColorChange('gradientTo', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Category Accent &amp; Button Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentTheme.accentColor || '#5A1E65'}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={currentTheme.accentColor || '#5A1E65'}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Category Tag Badge Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentTheme.badgeColor || '#45124E'}
                    onChange={(e) => handleColorChange('badgeColor', e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={currentTheme.badgeColor || '#45124E'}
                    onChange={(e) => handleColorChange('badgeColor', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>Live Public Card Preview</span>
            </span>
            <span className="text-[11px] text-slate-400">Exact visitor rendering</span>
          </div>

          {/* Interactive Card Preview */}
          <div className="relative">
            <div
              className="p-6 sm:p-7 rounded-3xl relative overflow-hidden transition-all duration-300 space-y-4 border-2 min-h-[500px] flex flex-col justify-between"
              style={{
                ...gradientStyle,
                borderColor: currentTheme.borderColor || `${currentTheme.accentColor || '#5A1E65'}40`,
                boxShadow: `0 10px 30px -10px ${currentTheme.glowColor || 'rgba(0,0,0,0.06)'}, 0 2px 6px rgba(0,0,0,0.03)`
              }}
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                <span
                  className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"
                  style={{
                    backgroundColor: currentTheme.badgeBg || '#F3E8FF',
                    color: currentTheme.badgeColor || currentTheme.accentColor || '#5A1E65',
                    border: `1.5px solid ${currentTheme.borderColor || currentTheme.accentColor || '#DDD6FE'}`
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{selectedCategory}</span>
                </span>
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${currentTheme.accentColor || '#5A1E65'}12`,
                    color: currentTheme.accentColor || '#5A1E65'
                  }}
                >
                  Verified Lifeline
                </span>
              </div>

              {/* Title */}
              <div className="min-h-[4.25rem] sm:min-h-[4.75rem] flex flex-col justify-center shrink-0">
                <span
                  className="text-[11px] font-black uppercase tracking-wider block mb-1"
                  style={{ color: currentTheme.accentColor || '#5A1E65' }}
                >
                  COMMUNITY LIFELINE PROVIDER
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  988 Suicide &amp; Crisis Lifeline
                </h3>
              </div>

              {/* Description Box */}
              <div
                className="rounded-2xl p-4 bg-white/90 border shadow-xs space-y-2 min-h-[6.5rem] sm:min-h-[7rem] flex flex-col justify-center shrink-0"
                style={{ borderColor: currentTheme.borderColor || '#E2E8F0' }}
              >
                <div
                  className="text-xs sm:text-sm font-bold flex items-center gap-1.5"
                  style={{ color: currentTheme.accentColor || '#5A1E65' }}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Confidential 24/7 Crisis Support</span>
                </div>
                <p className="text-sm text-slate-800 italic font-serif leading-relaxed line-clamp-3">
                  "Free, confidential 24/7 support across the US for distress or mental health crisis. Call or text 988."
                </p>
              </div>

              {/* Feature Checklist Bullets */}
              <div className="space-y-1.5 text-xs sm:text-sm text-slate-800 font-semibold">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" style={{ color: currentTheme.accentColor || '#5A1E65' }} />
                  <span>100% Free &amp; Confidential Community Care</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" style={{ color: currentTheme.accentColor || '#5A1E65' }} />
                  <span>No insurance, ID, or referral required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" style={{ color: currentTheme.accentColor || '#5A1E65' }} />
                  <span>Culturally competent affirming staff</span>
                </div>
              </div>

              {/* Action Button Preview */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  className="w-full py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:opacity-95 cursor-pointer"
                  style={{
                    backgroundColor: currentTheme.btnBg || currentTheme.accentColor || '#2563EB',
                    color: '#FFFFFF'
                  }}
                >
                  <Heart className="w-4 h-4 fill-white text-white" />
                  <span className="font-bold text-white">
                    Access Service Online ↗
                  </span>
                </button>

                <button
                  type="button"
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm border-2 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ borderColor: currentTheme.accentColor || '#5A1E65' }}
                >
                  <Phone className="w-4 h-4 shrink-0" style={{ color: currentTheme.accentColor || '#5A1E65' }} />
                  <span className="font-bold text-slate-900">Call 988</span>
                </button>
              </div>

              {/* Bottom Footnote */}
              <div className="text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-1.5 pt-1">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Verified • Diversity Collective Partner</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
