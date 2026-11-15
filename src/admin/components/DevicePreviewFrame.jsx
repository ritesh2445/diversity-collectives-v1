import React from 'react';
import { Monitor, Tablet, Smartphone, Lock, Globe } from 'lucide-react';

export const VIEWPORT_WIDTHS = {
  desktop: 1280,
  tablet: 768,
  mobile: 375
};

/**
 * Responsive Device Preview Frame
 * Renders live preview directly within the React DOM tree, inheriting 100% of parent
 * Tailwind CSS styles, design tokens, Google Fonts, and animations with zero iframe
 * stylesheet isolation issues, zero CORS errors, and zero missing style sheets.
 */
export default function DevicePreviewFrame({
  viewport = 'desktop',
  title = 'Live Homepage Preview',
  onSelectBlock = null,
  className = '',
  children
}) {
  // =========================================================================
  // 1. MOBILE PHONE PREVIEW (Authentic 375px iPhone Chassis with Dynamic Notch)
  // =========================================================================
  if (viewport === 'mobile') {
    return (
      <div className={`w-full flex justify-center py-2 ${className}`}>
        {/* Sleek iPhone Chassis */}
        <div className="w-full max-w-[395px] bg-slate-950 rounded-[3rem] p-2.5 border-[8px] border-slate-900 shadow-2xl ring-1 ring-slate-800/30 overflow-hidden flex flex-col transition-all duration-300">
          {/* Dynamic Island Notch & Status Header */}
          <div className="w-full bg-slate-950 px-6 pt-1.5 pb-2 flex items-center justify-between text-[11px] text-white/90 select-none rounded-t-[2.25rem]">
            <span className="font-bold tracking-tight text-white">9:41</span>
            {/* Dynamic Island Pill */}
            <div className="w-24 h-5 bg-black rounded-full border border-white/10 flex items-center justify-between px-2.5">
              <div className="w-2 h-2 rounded-full bg-slate-900 ring-1 ring-blue-900/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-950/80" />
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white">
              <span>5G</span>
              <div className="w-4 h-2 rounded-2xs border border-white/70 p-0.5 flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-3xs" />
              </div>
            </div>
          </div>

          {/* Native Mobile Screen Viewport (375px) */}
          <div className="w-full bg-white rounded-b-[2.25rem] overflow-y-auto max-h-[700px] scrollbar-thin" data-viewport="mobile">
            {children}
          </div>

          {/* Bottom iOS Home Indicator Bar */}
          <div className="w-full bg-slate-950 py-2 flex justify-center rounded-b-[2.25rem]">
            <div className="w-28 h-1 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. TABLET PREVIEW (Authentic 768px iPad Chassis)
  // =========================================================================
  if (viewport === 'tablet') {
    return (
      <div className={`w-full flex justify-center py-2 ${className}`}>
        {/* Sleek iPad Chassis */}
        <div className="w-full max-w-[800px] bg-slate-900 rounded-[2rem] p-3 border-[8px] border-slate-800 shadow-2xl ring-1 ring-slate-700/30 overflow-hidden flex flex-col transition-all duration-300">
          {/* Top iPad Camera Notch */}
          <div className="w-full bg-slate-900 py-1 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-white/10" />
          </div>

          {/* Native Tablet Viewport (768px max) */}
          <div className="w-full bg-white rounded-2xl overflow-y-auto max-h-[740px] scrollbar-thin" data-viewport="tablet">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. DESKTOP PREVIEW (macOS Browser Window with Traffic Lights & URL Bar)
  // =========================================================================
  return (
    <div className={`w-full flex justify-center ${className}`}>
      {/* Desktop Browser Chrome Mockup */}
      <div className="w-full bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden flex flex-col transition-all duration-300">
        {/* Browser Top Navigation Bar */}
        <div className="w-full bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs select-none">
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30 inline-block" />
          </div>

          {/* Browser Address Bar Pill */}
          <div className="flex items-center gap-2 bg-white px-4 py-1 rounded-full border border-slate-300/80 text-slate-700 font-semibold text-[11px] shadow-2xs max-w-sm w-full mx-4 justify-center">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">https://diversitycollective.org</span>
          </div>

          {/* Device Dimension Badge */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
            <Monitor className="w-3 h-3 text-slate-600" />
            <span>Desktop</span>
          </div>
        </div>

        {/* Native Desktop Content Canvas */}
        <div className="w-full bg-white overflow-y-auto max-h-[760px] scrollbar-thin" data-viewport="desktop">
          {children}
        </div>
      </div>
    </div>
  );
}
