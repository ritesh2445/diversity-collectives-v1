import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, Tablet, Smartphone, Lock, ExternalLink, RefreshCw } from 'lucide-react';

export const VIEWPORT_CONFIGS = {
  desktop: {
    targetW: 1280,
    targetH: 820,
    icon: Monitor,
    label: '1280px Desktop',
    maxWidth: '100%'
  },
  tablet: {
    targetW: 768,
    targetH: 1024,
    icon: Tablet,
    label: '768px Tablet',
    maxWidth: '768px'
  },
  mobile: {
    targetW: 375,
    targetH: 812,
    icon: Smartphone,
    label: '375px Mobile',
    maxWidth: '375px'
  }
};

export const VIEWPORT_WIDTHS = {
  desktop: 1280,
  tablet: 768,
  mobile: 375
};

/**
 * Responsive Device Preview Frame
 * Unified same-origin live sync preview for Desktop (1280px), Tablet (768px), and Mobile (375px).
 *
 * Uses the exact same proven method across all 3 viewports:
 * - Direct iframe loading same-origin preview with native CSS stylesheets & Google Fonts
 * - Exact physical viewport target dimensions (1280px, 768px, 375px)
 * - Proportional CSS transform-scale fitting into any available studio column
 * - macOS browser chrome with traffic lights, URL bar, reload, badge & new tab launcher
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

  const config = VIEWPORT_CONFIGS[viewport] || VIEWPORT_CONFIGS.desktop;
  const { targetW, targetH, icon: DeviceIcon, label, maxWidth } = config;

  const sep = previewUrl.includes('?') ? '&' : '?';
  const frameSrc = `${previewUrl}${sep}viewport=${viewport}`;

  const availableW = containerWidth || (viewport === 'mobile' ? 375 : viewport === 'tablet' ? 768 : 1280);
  const scale = availableW < targetW ? Math.max(0.25, availableW / targetW) : 1;
  const scaledCanvasH = Math.round(targetH * scale);

  return (
    <div
      ref={measureNode}
      className={`w-full flex justify-center ${className}`}
      style={{ maxWidth }}
    >
      {/* Device Browser Chrome Mockup (Exact same method for Desktop, Tablet & Mobile) */}
      <div className="w-full bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden flex flex-col transition-all duration-300">
        {/* Browser Top Navigation Bar */}
        <div className="w-full bg-slate-100 border-b border-slate-200 px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between text-xs select-none gap-1.5 sm:gap-2">
          {/* macOS Traffic Lights + Refresh Action */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-400 border border-rose-500/30 inline-block" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 border border-amber-500/30 inline-block" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 border border-emerald-500/30 inline-block" />
            </div>
            <button
              type="button"
              onClick={handleReload}
              title="Reload Preview"
              className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Browser Address Bar Pill */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 sm:px-4 py-1 rounded-full border border-slate-300/80 text-slate-700 font-semibold text-[10px] sm:text-[11px] shadow-2xs max-w-sm w-full mx-1 sm:mx-2 justify-center min-w-0">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">https://diversitycollective.org{previewUrl.split('?')[0] === '/' ? '' : previewUrl.split('?')[0]}</span>
          </div>

          {/* Device Dimension Badge & New Tab Launcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2 sm:px-2.5 py-0.5 rounded-md whitespace-nowrap">
              <DeviceIcon className="w-3 h-3 text-slate-700 shrink-0" />
              <span>{label} {scale < 0.999 ? `· ${Math.round(scale * 100)}%` : ''}</span>
            </div>
            <a
              href={frameSrc}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Live Preview in New Window"
              className="p-1 text-slate-500 hover:text-[#5A1E65] hover:bg-slate-200 rounded-md transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Scaled Native Device Content Canvas */}
        <div
          className="w-full relative bg-white overflow-hidden"
          style={{
            height: `${scaledCanvasH}px`,
            minHeight: `${scaledCanvasH}px`
          }}
          data-viewport={viewport}
        >
          {frameSrc ? (
            <div
              style={{
                width: `${targetW}px`,
                height: `${targetH}px`,
                transform: scale < 0.999 ? `scale(${scale})` : 'none',
                transformOrigin: 'top left',
                position: scale < 0.999 ? 'absolute' : 'relative',
                top: 0,
                left: 0
              }}
            >
              <iframe
                key={frameSrc}
                ref={iframeRef}
                src={frameSrc}
                onLoad={onIframeLoad}
                title={`${label} Live Preview`}
                className="w-full h-full border-0 bg-white"
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
