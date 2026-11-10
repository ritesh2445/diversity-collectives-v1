import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Type, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Eye, 
  Sliders, 
  CornerDownRight, 
  Paintbrush,
  Sun,
  Layers,
  ArrowRight
} from 'lucide-react';

export const THEME_STORAGE_KEY = 'dcvc_site_theme_settings';

export const DEFAULT_THEME_SETTINGS = {
  // Primary Buttons (e.g. Explore Free Programs, Submit, Inquire)
  btnPrimaryBg: '#5A1E65',
  btnPrimaryBgGradient: 'linear-gradient(135deg, #5A1E65 0%, #7E22CE 55%, #4338CA 100%)',
  btnPrimaryText: '#FFFFFF',
  btnPrimaryHoverBg: '#4A1553',
  btnPrimaryRadius: '9999px', // '9999px' (pill) | '16px' (modern 2xl) | '8px' (rounded-md)

  // Secondary Buttons (e.g. Visit Sanctuary, Call, Secondary CTAs)
  btnSecondaryBg: '#FFFFFF',
  btnSecondaryText: '#0F172A',
  btnSecondaryBorder: '#E2E8F0',
  btnSecondaryHoverBg: '#FAF5FF',

  // Donate / Gold Action Button
  btnDonateBg: '#FDE047',
  btnDonateText: '#020617',
  btnDonateHoverBg: '#FACC15',

  // Typography Stacks
  headingFont: 'Plus Jakarta Sans', // 'Plus Jakarta Sans', 'Playfair Display', 'Syne', 'Outfit', 'Cinzel', 'Inter'
  bodyFont: 'Plus Jakarta Sans',    // 'Plus Jakarta Sans', 'Inter', 'Roboto', 'OpenDyslexic', 'Arial'
  fontSizeScale: 100, // 90%, 100%, 110%

  // Card Appearance
  cardRadius: '24px', // '16px', '24px', '32px'
  cardElevation: 'standard' // 'subtle', 'standard', 'pronounced'
};

export function loadSiteTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME_SETTINGS;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_SETTINGS;
    return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

export function applySiteThemeToDOM(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Primary Button Colors
  root.style.setProperty('--dcvc-btn-primary-bg', theme.btnPrimaryBgGradient || theme.btnPrimaryBg);
  root.style.setProperty('--dcvc-btn-primary-text', theme.btnPrimaryText);
  root.style.setProperty('--dcvc-btn-primary-hover', theme.btnPrimaryHoverBg);
  root.style.setProperty('--dcvc-btn-radius', theme.btnPrimaryRadius);

  // Secondary Button Colors
  root.style.setProperty('--dcvc-btn-secondary-bg', theme.btnSecondaryBg);
  root.style.setProperty('--dcvc-btn-secondary-text', theme.btnSecondaryText);
  root.style.setProperty('--dcvc-btn-secondary-border', theme.btnSecondaryBorder);

  // Donate Button Colors
  root.style.setProperty('--dcvc-btn-donate-bg', theme.btnDonateBg);
  root.style.setProperty('--dcvc-btn-donate-text', theme.btnDonateText);

  // Fonts
  if (theme.headingFont) {
    root.style.setProperty('--font-display', `'${theme.headingFont}', sans-serif`);
  }
  if (theme.bodyFont) {
    root.style.setProperty('--font-sans', `'${theme.bodyFont}', sans-serif`);
  }

  // Card Radius
  root.style.setProperty('--dcvc-card-radius', theme.cardRadius);
}

export default function SiteThemeStudio({ onThemeSaved }) {
  const [theme, setTheme] = useState(loadSiteTheme);
  const [saveToast, setSaveToast] = useState('');

  useEffect(() => {
    applySiteThemeToDOM(theme);
  }, [theme]);

  const handleColorChange = (key, val) => {
    setTheme(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
      applySiteThemeToDOM(theme);
      window.dispatchEvent(new CustomEvent('dcvc-site-theme-updated', { detail: theme }));
      setSaveToast('Global site styles & button colors published successfully!');
      if (onThemeSaved) onThemeSaved(theme);
      setTimeout(() => setSaveToast(''), 4000);
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all button colors, fonts, and styling back to DCVC Flagship defaults?')) {
      setTheme(DEFAULT_THEME_SETTINGS);
      localStorage.removeItem(THEME_STORAGE_KEY);
      applySiteThemeToDOM(DEFAULT_THEME_SETTINGS);
      setSaveToast('Reset to original flagship defaults.');
      setTimeout(() => setSaveToast(''), 3000);
    }
  };

  const COLOR_PALETTES = [
    { name: 'Royal Sanctuary Purple (Default)', primary: '#5A1E65', text: '#FFFFFF', gradient: 'linear-gradient(135deg, #5A1E65 0%, #7E22CE 55%, #4338CA 100%)' },
    { name: 'Electric Violet & Magenta', primary: '#7C3AED', text: '#FFFFFF', gradient: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)' },
    { name: 'Sunset Coral & Amber', primary: '#E11D48', text: '#FFFFFF', gradient: 'linear-gradient(135deg, #E11D48 0%, #F59E0B 100%)' },
    { name: 'Emerald Sanctuary & Teal', primary: '#059669', text: '#FFFFFF', gradient: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)' },
    { name: 'High-Contrast Midnight & Gold', primary: '#0F172A', text: '#FDE047', gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' },
    { name: 'Ocean Coastal Cyan', primary: '#0284C7', text: '#FFFFFF', gradient: 'linear-gradient(135deg, #0284C7 0%, #3B82F6 100%)' }
  ];

  const FONT_OPTIONS = [
    { name: 'Plus Jakarta Sans (Modern Editorial)', val: 'Plus Jakarta Sans' },
    { name: 'Inter (Clean Technical)', val: 'Inter' },
    { name: 'Playfair Display (Literary Serif)', val: 'Playfair Display' },
    { name: 'Syne (Bold Architectural)', val: 'Syne' },
    { name: 'Cinzel (Classical Luxury)', val: 'Cinzel' },
    { name: 'OpenDyslexic (Max Neurodivergent Accessibility)', val: 'OpenDyslexic' }
  ];

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      
      {/* Studio Header & Save Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5A1E65] to-purple-800 text-amber-300 flex items-center justify-center shadow-md">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black text-slate-950 flex items-center gap-2">
              <span>Site Theme, Button Colors & Typography Studio</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#5A1E65]">
                Full Control
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Configure button colors, button font colors, heading fonts, body fonts, and corner radiuses for everything on the website.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to default colors & fonts"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Apply & Publish to Live Site</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs text-center flex items-center justify-center gap-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Live Interactive Preview Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>Real-Time Button & Typography Preview</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Heading: {theme.headingFont} · Body: {theme.bodyFont}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
          
          {/* Primary Button Sample */}
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              Primary Button Preview:
            </span>
            <button
              type="button"
              style={{
                background: theme.btnPrimaryBgGradient || theme.btnPrimaryBg,
                color: theme.btnPrimaryText,
                borderRadius: theme.btnPrimaryRadius
              }}
              className="px-6 py-3.5 font-bold text-xs shadow-lg inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore Free Programs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-slate-400 block">
              Text Color: <code className="text-white font-mono">{theme.btnPrimaryText}</code>
            </span>
          </div>

          {/* Secondary Button Sample */}
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              Secondary Button Preview:
            </span>
            <button
              type="button"
              style={{
                backgroundColor: theme.btnSecondaryBg,
                color: theme.btnSecondaryText,
                borderColor: theme.btnSecondaryBorder,
                borderRadius: theme.btnPrimaryRadius
              }}
              className="px-5 py-3 font-bold text-xs border-2 shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Visit Sanctuary</span>
            </button>
            <span className="text-[10px] text-slate-400 block">
              Text Color: <code className="text-white font-mono">{theme.btnSecondaryText}</code>
            </span>
          </div>

          {/* Donate Warm Gold Sample */}
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              Donate Action Pill Preview:
            </span>
            <button
              type="button"
              style={{
                backgroundColor: theme.btnDonateBg,
                color: theme.btnDonateText,
                borderRadius: '9999px'
              }}
              className="px-5 py-2.5 font-black text-xs shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Donate · Zeffy 0% Fee</span>
            </button>
            <span className="text-[10px] text-slate-400 block">
              Background: <code className="text-white font-mono">{theme.btnDonateBg}</code>
            </span>
          </div>

        </div>
      </div>

      {/* Studio Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* LEFT COLUMN: Button Colors & Styles */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Paintbrush className="w-4 h-4 text-[#5A1E65]" />
            <h3 className="font-display text-base font-extrabold text-slate-950">
              Button Colors & Corner Radiuses
            </h3>
          </div>

          {/* Preset Palettes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quick Theme Palettes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COLOR_PALETTES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setTheme(prev => ({
                      ...prev,
                      btnPrimaryBg: p.primary,
                      btnPrimaryBgGradient: p.gradient,
                      btnPrimaryText: p.text
                    }));
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 flex items-center gap-2.5 text-left text-xs font-bold cursor-pointer transition-all hover:bg-purple-50/50"
                >
                  <span className="w-5 h-5 rounded-full shadow-xs flex-shrink-0" style={{ background: p.gradient }} />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Button Customization */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
              1. Primary Buttons (CTAs, Forms, Hero)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Button Background Color (Hex)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.btnPrimaryBg}
                    onChange={(e) => {
                      handleColorChange('btnPrimaryBg', e.target.value);
                      handleColorChange('btnPrimaryBgGradient', e.target.value);
                    }}
                    className="w-9 h-9 rounded-xl border border-slate-300 p-0.5 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.btnPrimaryBg}
                    onChange={(e) => {
                      handleColorChange('btnPrimaryBg', e.target.value);
                      handleColorChange('btnPrimaryBgGradient', e.target.value);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Button Font Color (Text on Button)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.btnPrimaryText}
                    onChange={(e) => handleColorChange('btnPrimaryText', e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-300 p-0.5 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.btnPrimaryText}
                    onChange={(e) => handleColorChange('btnPrimaryText', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Quick Text Color Chips for Buttons */}
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Quick Text Color Preset on Primary Button:
              </span>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Pure White (#FFFFFF)', val: '#FFFFFF' },
                  { label: 'Deep Black (#000000)', val: '#000000' },
                  { label: 'Warm Gold (#FDE047)', val: '#FDE047' },
                  { label: 'Soft Ivory (#FFFBEB)', val: '#FFFBEB' }
                ].map(c => (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => handleColorChange('btnPrimaryText', c.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      theme.btnPrimaryText.toUpperCase() === c.val.toUpperCase()
                        ? 'bg-purple-900 text-white border-purple-500'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {c.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Radius */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Button Corner Radius
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Full Pill (Default)', val: '9999px' },
                  { label: 'Modern 2XL (16px)', val: '16px' },
                  { label: 'Subtle (8px)', val: '8px' }
                ].map(r => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => handleColorChange('btnPrimaryRadius', r.val)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      theme.btnPrimaryRadius === r.val
                        ? 'bg-[#5A1E65] text-white border-[#5A1E65]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary & Donate Customization */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              2. Secondary & Donate Buttons
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Secondary Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.btnSecondaryText}
                    onChange={(e) => handleColorChange('btnSecondaryText', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.btnSecondaryText}
                    onChange={(e) => handleColorChange('btnSecondaryText', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Donate Button Background (Gold)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.btnDonateBg}
                    onChange={(e) => handleColorChange('btnDonateBg', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={theme.btnDonateBg}
                    onChange={(e) => handleColorChange('btnDonateBg', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Typography & Global Fonts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Type className="w-4 h-4 text-[#5A1E65]" />
            <h3 className="font-display text-base font-extrabold text-slate-950">
              Site Typography & Font Families
            </h3>
          </div>

          {/* Heading Font Family */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Primary Heading Font Family (H1, H2, Section Titles)
            </label>
            <select
              value={theme.headingFont}
              onChange={(e) => handleColorChange('headingFont', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.val} value={f.val}>{f.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Changes headline font styles across all pages, banners, hero segments, and cards.
            </p>
          </div>

          {/* Body Font Family */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Body & Paragraph Font Family
            </label>
            <select
              value={theme.bodyFont}
              onChange={(e) => handleColorChange('bodyFont', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.val} value={f.val}>{f.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Controls body descriptions, event cards, blog articles, and directory content text.
            </p>
          </div>

          {/* Card Corner Radius */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Card Corner Radius
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Architectural (16px)', val: '16px' },
                { label: 'Luxury (24px)', val: '24px' },
                { label: 'Pill / Soft (32px)', val: '32px' }
              ].map(cr => (
                <button
                  key={cr.val}
                  type="button"
                  onClick={() => handleColorChange('cardRadius', cr.val)}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    theme.cardRadius === cr.val
                      ? 'bg-[#5A1E65] text-white border-[#5A1E65]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#5A1E65] to-purple-800 hover:from-purple-900 hover:to-purple-950 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish All Design Changes</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

