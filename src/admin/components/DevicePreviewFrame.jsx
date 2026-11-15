import React, { useRef, useState, useEffect } from 'react';

export const VIEWPORT_WIDTHS = {
  desktop: 1280,
  tablet: 768,
  mobile: 375
};

/**
 * Responsive Device Preview Frame
 * Scales and constrains the homepage preview accurately to authentic target device
 * dimensions (1280px Desktop, 768px Tablet, 375px Mobile) with GPU transform scaling,
 * preventing layout cramming, oversized fonts, or clipped waves inside the Admin Studio.
 */
export default function DevicePreviewFrame({
  viewport = 'desktop',
  title = 'Live Homepage Preview',
  maxContainerWidth = null,
  className = '',
  children
}) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const deviceWidth = VIEWPORT_WIDTHS[viewport] || VIEWPORT_WIDTHS.desktop;

  // Measure available container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Measure unscaled content height for scaled desktop/tablet views
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return undefined;

    const updateHeight = () => {
      const h = el.scrollHeight;
      if (h > 0) {
        setContentHeight(h);
      }
    };

    updateHeight();
    const t1 = setTimeout(updateHeight, 100);
    const t2 = setTimeout(updateHeight, 400);
    const t3 = setTimeout(updateHeight, 1000);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateHeight);
      ro.observe(el);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        ro.disconnect();
      };
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [children, viewport]);

  const effectiveContainerWidth = maxContainerWidth
    ? Math.min(containerWidth || maxContainerWidth, maxContainerWidth)
    : containerWidth || 600;

  // Calculate proportional scale factor:
  // If target device width exceeds available container width (e.g. 1280px desktop in 600px studio column),
  // scale down proportionally so the complete design fits without clipping or oversized fonts.
  const scale = effectiveContainerWidth < deviceWidth
    ? Math.max(0.2, effectiveContainerWidth / deviceWidth)
    : 1;

  const isScaled = scale < 0.999;
  const scaledWidth = Math.round(deviceWidth * scale);
  const scaledHeight = contentHeight ? Math.round(contentHeight * scale) : undefined;

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col items-center justify-start ${className}`}
    >
      <div
        className={`transition-all duration-200 relative bg-white ${
          viewport === 'mobile'
            ? 'rounded-[2.25rem] border-[6px] border-slate-900 shadow-2xl my-2 ring-1 ring-slate-800/10'
            : viewport === 'tablet'
            ? 'rounded-2xl border-2 border-slate-700 shadow-xl my-2'
            : 'rounded-xl border border-slate-300 shadow-lg'
        }`}
        style={{
          width: isScaled 
            ? `${scaledWidth}px` 
            : viewport === 'mobile' 
            ? `${deviceWidth + 12}px` 
            : `${deviceWidth}px`,
          maxWidth: '100%',
          overflow: isScaled ? 'hidden' : 'visible',
          height: isScaled && scaledHeight ? `${scaledHeight}px` : 'auto'
        }}
      >
        {/* Sleek Mobile Phone Dynamic Notch & Status Header */}
        {viewport === 'mobile' && (
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
        )}

        {/* Scaled / Scoped Preview Surface */}
        <div
          ref={contentRef}
          style={{
            width: `${deviceWidth}px`,
            maxWidth: '100%',
            transform: isScaled ? `scale(${scale})` : 'none',
            transformOrigin: 'top left',
            backgroundColor: '#ffffff'
          }}
          className={`bg-white min-h-0 ${
            viewport === 'mobile'
              ? 'admin-preview-mobile'
              : viewport === 'tablet'
              ? 'admin-preview-tablet'
              : 'admin-preview-desktop'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
