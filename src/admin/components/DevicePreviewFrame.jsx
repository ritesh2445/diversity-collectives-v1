import React from 'react';

export const VIEWPORT_WIDTHS = {
  desktop: 1280,
  tablet: 768,
  mobile: 375
};

/**
 * Responsive Device Preview Frame
 * Seamlessly isolates desktop, tablet, and mobile previews in the Admin Studio
 * without empty white voids, broken word wraps, or clipped graphics.
 */
export default function DevicePreviewFrame({
  viewport = 'desktop',
  title = 'Live Homepage Preview',
  maxContainerWidth = null,
  className = '',
  children
}) {
  if (viewport === 'mobile') {
    return (
      <div className={`w-full flex justify-center py-2 ${className}`}>
        <div className="w-full max-w-[375px] bg-white rounded-[2.25rem] border-[6px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-800/10">
          {/* Sleek Mobile Phone Dynamic Notch & Status Header */}
          <div className="w-full bg-slate-950 py-2 px-5 flex items-center justify-between text-[11px] text-white/80 select-none z-20 rounded-t-[1.75rem]">
            <span className="font-bold text-white tracking-tight">9:41</span>
            <div className="w-20 h-4 bg-black rounded-full mx-auto border border-white/10 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
              <div className="w-2 h-2 rounded-full bg-blue-950" />
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold">
              <span>5G</span>
              <div className="w-4 h-2 rounded-xs border border-white/70 p-0.5 flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>

          <div className="w-full bg-white admin-preview-mobile">
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (viewport === 'tablet') {
    return (
      <div className={`w-full flex justify-center py-2 ${className}`}>
        <div className="w-full max-w-[768px] bg-white rounded-2xl border-2 border-slate-700 shadow-xl overflow-hidden admin-preview-tablet">
          {children}
        </div>
      </div>
    );
  }

  // Desktop View: Fills the entire preview canvas naturally at 100% width
  return (
    <div className={`w-full bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden ${className}`}>
      <div className="w-full bg-white admin-preview-desktop">
        {children}
      </div>
    </div>
  );
}
