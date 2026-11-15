import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, Tablet, Smartphone, Lock, ExternalLink, RefreshCw } from 'lucide-react';

export const VIEWPORT_WIDTHS = {
  desktop: 1280,
  tablet: 768,
  mobile: 375
};

/**
 * Responsive Device Preview Frame
 * Renders authentic mobile (375px iPhone), tablet (768px iPad), and desktop (1280px macOS)
 * viewports loading the real public website via same-origin live sync iframe.
 *
 * All media queries (@media md:, lg:, xl:) evaluate against authentic physical device
 * dimensions (375px, 768px, 1280px) inside the iframe, while CSS transform-scale
 * guarantees flawless, proportional fitting inside any admin column with zero white voids,
 * zero clipped buttons, and zero broken word wraps.
 */
export default function DevicePreviewFrame({
  viewport = 'desktop',
  title = 'Live Homepage Preview',
  previewUrl = '/?admin_preview=1',
  iframeRef = null,
  onIframeLoad = undefined,
  className = '',
  children
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const measureNode = useCallback((node) => {
    if (node) {
      containerRef.current = node;
      const rect = node.getBoundingClientRect();
      if (rect.width > 0) {
        setContainerWidth(rect.width);
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setContainerWidth(w);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleReload = () => {
    try {
      if (iframeRef?.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    } catch {}
  };

  const sep = previewUrl.includes('?') ? '&' : '?';
  const frameSrc = `${previewUrl}${sep}viewport=${viewport}`;
  const availableW = containerWidth || (viewport === 'mobile' ? 411 : viewport === 'tablet' ? 808 : 1280);

  // =========================================================================
  // 1. MOBILE PHONE PREVIEW (Authentic 375px iPhone Chassis with Dynamic Notch)
  // =========================================================================
  if (viewport === 'mobile') {
    // 375px screen + 2 * (10px padding + 8px border) = 411px chassis width
    const chassisW = 411;
    const chassisH = 760;
    const mobileScale = availableW < chassisW ? Math.max(0.25, availableW / chassisW) : 1;
    const scaledHeight = Math.round(chassisH * mobileScale);

    return (
      <div
        ref={measureNode}
        className={`w-full flex justify-center py-2 ${className}`}
        style={{
          height: mobileScale < 0.999 ? `${scaledHeight}px` : 'auto'
        }}
      >
        <div
          style={{
            width: `${chassisW}px`,
            maxWidth: '100%',
            transform: mobileScale < 0.999 ? `scale(${mobileScale})` : 'none',
            transformOrigin: 'top center'
          }}
          className="bg-slate-950 rounded-[3rem] p-2.5 border-[8px] border-slate-900 shadow-2xl ring-1 ring-slate-800/30 overflow-hidden flex flex-col transition-all duration-300 mx-auto"
        >
          {/* Dynamic Island Notch & iOS Status Header */}
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

          {/* Native Mobile Screen Viewport: Exactly 375px wide, zero crop */}
          <div
            className="bg-white rounded-b-[2.25rem] overflow-hidden relative mx-auto"
            style={{ width: '375px', height: '680px' }}
            data-viewport="mobile"
          >
            {frameSrc ? (
              <iframe
                ref={iframeRef}
                src={frameSrc}
                onLoad={onIframeLoad}
                title="Mobile Live Preview (375px)"
                className="w-full h-full border-0 select-none bg-white"
                style={{ width: '375px', height: '680px' }}
              />
            ) : (
              children
            )}
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
    // 768px screen + 2 * (12px padding + 8px border) = 808px chassis width
    const chassisW = 808;
    const chassisH = 820;
    const tabletScale = availableW < chassisW ? Math.max(0.25, availableW / chassisW) : 1;
    const scaledHeight = Math.round(chassisH * tabletScale);

    return (
      <div
        ref={measureNode}
        className={`w-full flex justify-center py-2 ${className}`}
        style={{
          height: tabletScale < 0.999 ? `${scaledHeight}px` : 'auto'
        }}
      >
        <div
          style={{
            width: `${chassisW}px`,
            maxWidth: '100%',
            transform: tabletScale < 0.999 ? `scale(${tabletScale})` : 'none',
            transformOrigin: 'top center'
          }}
          className="bg-slate-900 rounded-[2rem] p-3 border-[8px] border-slate-800 shadow-2xl ring-1 ring-slate-700/30 overflow-hidden flex flex-col transition-all duration-300 mx-auto"
        >
          {/* Top iPad Camera Notch */}
          <div className="w-full bg-slate-900 py-1.5 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-white/10" />
          </div>

          {/* Native Tablet Viewport: Exactly 768px wide, zero crop */}
          <div
            className="bg-white rounded-2xl overflow-hidden relative mx-auto"
            style={{ width: '768px', height: '760px' }}
            data-viewport="tablet"
          >
            {frameSrc ? (
              <iframe
                ref={iframeRef}
                src={frameSrc}
                onLoad={onIframeLoad}
                title="Tablet Live Preview (768px)"
                className="w-full h-full border-0 select-none bg-white"
                style={{ width: '768px', height: '760px' }}
              />
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. DESKTOP PREVIEW (Authentic 1280px macOS Browser Window)
  // =========================================================================
  const targetW = 1280;
  const targetH = 820;
  const desktopScale = availableW < targetW ? Math.max(0.25, availableW / targetW) : 1;
  const scaledCanvasH = Math.round(targetH * desktopScale);

  return (
    <div
      ref={measureNode}
      className={`w-full flex justify-center ${className}`}
    >
      {/* Desktop Browser Chrome Mockup */}
      <div className="w-full bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden flex flex-col transition-all duration-300">
        {/* Browser Top Navigation Bar */}
        <div className="w-full bg-slate-100 border-b border-slate-200 px-3 sm:px-4 py-2.5 flex items-center justify-between text-xs select-none gap-2">
          {/* macOS Traffic Lights + Refresh Action */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30 inline-block" />
            </div>
            <button
              type="button"
              onClick={handleReload}
              title="Reload Preview"
              className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors ml-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Browser Address Bar Pill */}
          <div className="flex items-center gap-2 bg-white px-3 sm:px-4 py-1 rounded-full border border-slate-300/80 text-slate-700 font-semibold text-[11px] shadow-2xs max-w-sm w-full mx-2 justify-center">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">https://diversitycollective.org</span>
          </div>

          {/* Device Dimension Badge & New Tab Launcher */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2.5 py-0.5 rounded-md">
              <Monitor className="w-3 h-3 text-slate-700" />
              <span>1280px Desktop {desktopScale < 0.999 ? `· ${Math.round(desktopScale * 100)}%` : ''}</span>
            </div>
            <a
              href={frameSrc}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Live Preview in New Window"
              className="p-1 text-slate-500 hover:text-[#5A1E65] hover:bg-slate-200 rounded-md transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Scaled Native Desktop Content Canvas */}
        <div
          className="w-full relative bg-white overflow-hidden"
          style={{
            height: `${scaledCanvasH}px`,
            minHeight: `${scaledCanvasH}px`
          }}
          data-viewport="desktop"
        >
          {frameSrc ? (
            <div
              style={{
                width: `${targetW}px`,
                height: `${targetH}px`,
                transform: desktopScale < 0.999 ? `scale(${desktopScale})` : 'none',
                transformOrigin: 'top left',
                position: desktopScale < 0.999 ? 'absolute' : 'relative',
                top: 0,
                left: 0
              }}
            >
              <iframe
                ref={iframeRef}
                src={frameSrc}
                onLoad={onIframeLoad}
                title="Desktop Live Preview (1280px)"
                className="w-full h-full border-0 select-none bg-white"
                style={{ width: `${targetW}px`, height: `${targetH}px` }}
              />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
