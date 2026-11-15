import React, { useRef, useState, useEffect } from 'react';

export const VIEWPORT_WIDTHS = {
  desktop: 1280,
  tablet: 768,
  mobile: 390
};

/**
 * Responsive Device Preview Frame
 * Scales and constrains the homepage preview accurately to authentic target device
 * dimensions (1280px Desktop, 768px Tablet, 390px Mobile) with GPU transform scaling,
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

  // Measure unscaled content height so the container scales its bounding box accurately
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
    const timer1 = setTimeout(updateHeight, 100);
    const timer2 = setTimeout(updateHeight, 400);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateHeight);
      ro.observe(el);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        ro.disconnect();
      };
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [children, viewport]);

  const effectiveContainerWidth = maxContainerWidth
    ? Math.min(containerWidth || maxContainerWidth, maxContainerWidth)
    : containerWidth || 600;

  // Calculate proportional scale factor:
  // If target device width exceeds container width (e.g. 1280px desktop in 600px studio column),
  // scale down proportionally so the complete 1280px design fits without clipping or giant fonts.
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
        className={`transition-all duration-200 relative bg-white overflow-hidden ${
          viewport === 'mobile'
            ? 'rounded-[2rem] border-4 border-slate-900 shadow-2xl my-2 ring-1 ring-slate-800/10'
            : viewport === 'tablet'
            ? 'rounded-2xl border-2 border-slate-700 shadow-xl my-2'
            : 'rounded-xl border border-slate-300 shadow-lg'
        }`}
        style={{
          width: isScaled ? `${scaledWidth}px` : `${deviceWidth}px`,
          maxWidth: '100%',
          height: scaledHeight ? `${scaledHeight}px` : 'auto'
        }}
      >
        {/* Sleek Mobile Phone Dynamic Header */}
        {viewport === 'mobile' && (
          <div className="w-full bg-slate-950 py-1.5 px-4 flex items-center justify-between text-[10px] text-white/80 select-none z-20 relative">
            <span className="font-bold text-white tracking-tight">9:41</span>
            <div className="w-16 h-3 bg-black rounded-full mx-auto border border-white/10" />
            <div className="flex items-center gap-1.5 text-[9px] font-bold">
              <span>5G</span>
              <div className="w-4 h-2 rounded-xs border border-white/70 p-0.5 flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>
        )}

        {/* Scaled Preview Surface */}
        <div
          ref={contentRef}
          style={{
            width: `${deviceWidth}px`,
            transform: isScaled ? `scale(${scale})` : 'none',
            transformOrigin: 'top left',
            backgroundColor: '#ffffff'
          }}
          className="bg-white min-h-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
