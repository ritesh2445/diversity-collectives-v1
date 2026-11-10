import React from 'react';
import { Type, Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export const DCVC_BRAND_COLORS = [
  { name: 'Royal Purple (Primary)', hex: '#5A1E65' },
  { name: 'Sunset Rose (Accent)', hex: '#D91B5C' },
  { name: 'Golden Amber (Warmth)', hex: '#D97706' },
  { name: 'Emerald Sanctuary (Health)', hex: '#1E5A44' },
  { name: 'Deep Slate (Readability)', hex: '#0F172A' },
  { name: 'Ocean Sky (Bright)', hex: '#0284C7' }
];

export const FONT_SIZE_OPTIONS = [
  { id: 'sm', label: 'Compact (14px)', cssClass: 'text-sm' },
  { id: 'base', label: 'Standard (16px)', cssClass: 'text-base' },
  { id: 'lg', label: 'Medium Large (18px)', cssClass: 'text-lg' },
  { id: 'xl', label: 'Extra Large (20px)', cssClass: 'text-xl' },
  { id: '2xl', label: 'Headline (24px)', cssClass: 'text-2xl font-bold' },
  { id: '3xl', label: 'Hero Display (30px)', cssClass: 'text-3xl font-black' }
];

export default function StyleCustomizer({
  fontSize = 'base',
  fontColor = '#0F172A',
  textAlign = 'left',
  onFontSizeChange,
  onFontColorChange,
  onTextAlignChange,
  label = 'Typography & Color Styling'
}) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-purple-700" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] text-slate-400 font-mono">Real-time styling</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Font Size Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Text Size</label>
          <select
            value={fontSize || 'base'}
            onChange={(e) => onFontSizeChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
          >
            {FONT_SIZE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Alignment */}
        {onTextAlignChange && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Alignment</label>
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-0.5">
              {[
                { id: 'left', icon: AlignLeft },
                { id: 'center', icon: AlignCenter },
                { id: 'right', icon: AlignRight }
              ].map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => onTextAlignChange(btn.id)}
                    className={`flex-1 py-1 flex items-center justify-center rounded-lg cursor-pointer ${
                      textAlign === btn.id ? 'bg-[#5A1E65] text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Color Palette */}
      <div>
        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Palette className="w-3 h-3 text-slate-400" />
            <span>Text / Accent Color</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">{fontColor}</span>
        </label>
        
        <div className="flex items-center gap-2 flex-wrap">
          {DCVC_BRAND_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onFontColorChange(c.hex)}
              title={c.name}
              className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                fontColor === c.hex ? 'scale-125 border-slate-950 shadow-xs' : 'border-white hover:scale-110 shadow-2xs'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}

          {/* Custom Hex Picker Input */}
          <div className="flex items-center gap-1.5 ml-auto">
            <input
              type="color"
              value={fontColor?.startsWith('#') ? fontColor : '#0F172A'}
              onChange={(e) => onFontColorChange(e.target.value)}
              className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
              title="Pick custom color"
            />
            <input
              type="text"
              value={fontColor || ''}
              onChange={(e) => onFontColorChange(e.target.value)}
              placeholder="#5A1E65"
              className="w-20 px-1.5 py-1 text-[11px] font-mono border rounded-lg border-slate-300 text-center"
            />
          </div>
        </div>
      </div>

      {/* Mini Live Preview */}
      <div className="pt-2 border-t border-slate-200">
        <span className="text-[10px] text-slate-400 block mb-1">Preview Sample:</span>
        <div 
          className="p-2.5 rounded-xl bg-white border border-slate-200 overflow-hidden"
          style={{ textAlign: textAlign || 'left' }}
        >
          <p 
            style={{ color: fontColor || '#0F172A' }} 
            className={`font-display transition-all ${
              fontSize === 'sm' ? 'text-sm' :
              fontSize === 'lg' ? 'text-lg font-bold' :
              fontSize === 'xl' ? 'text-xl font-bold' :
              fontSize === '2xl' ? 'text-2xl font-black' :
              fontSize === '3xl' ? 'text-3xl font-black' : 'text-base font-semibold'
            }`}
          >
            Diversity Collective Ventura County
          </p>
        </div>
      </div>
    </div>
  );
}

