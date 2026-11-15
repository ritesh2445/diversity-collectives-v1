import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, Tablet, Smartphone, Lock, Globe } from 'lucide-react';

export const VIEWPORT_WIDTHS = {
  desktop: 1280,
  tablet: 768,
  mobile: 375
};

/**
 * Isolated Iframe Portal
 * Clones all parent stylesheets, Google Fonts, and animations into a true sandboxed
 * browsing context so that CSS media queries (@media min-width) and fluid viewport
 * units evaluate against the authentic target device width (375px, 768px, or 1280px),
 * exactly matching how the live website looks on phones, tablets, and desktop displays.
 */
function IsolatedDeviceIframe({
  targetWidth,
  viewport,
  children,
  onSelectBlock,
  onHeightChange
}) {
  const iframeRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return undefined;

    // Initialize document HTML structure if empty
    if (!doc.body || !doc.getElementById('preview-root')) {
      doc.open();
      doc.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin:0;padding:0;background:#ffffff;overflow-x:hidden;-webkit-font-smoothing:antialiased;">
    <div id="preview-root" style="width:100%;min-height:100%;"></div>
  </body>
</html>`);
      doc.close();
    }

    // Synchronize parent stylesheets, Google Fonts, and Tailwind rules into iframe head
    const syncHead = () => {
      if (!doc.head) return;
      doc.head.innerHTML = '';

      const nodes = document.head.querySelectorAll(
        'style, link[rel="stylesheet"], link[rel="preconnect"], link[rel="preload"]'
      );
      nodes.forEach((node) => {
        try {
          doc.head.appendChild(node.cloneNode(true));
        } catch {
          // ignore transient clone issues
        }
      });

      // Inject base resets to guarantee zero white margins or scroll jumping
      const baseReset = doc.createElement('style');
      baseReset.textContent = `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          width: 100% !important;
          min-height: 100% !important;
          overflow-x: hidden !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        * {
          box-sizing: border-box;
        }
        /* Custom scrollbar matching live website */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `;
      doc.head.appendChild(baseReset);
    };

    syncHead();

    // Listen for dynamically loaded styles in development
    const observer = new MutationObserver(syncHead);
    observer.observe(document.head, { childList: true, subtree: true });

    // Native click event listener to bridge block selection across the iframe boundary
    const handleDocClick = (e) => {
      const blockEl = e.target?.closest?.('[data-block-id]');
      if (blockEl && onSelectBlock) {
        const id = blockEl.getAttribute('data-block-id');
        if (id) {
          onSelectBlock(id);
        }
      }
    };
    doc.addEventListener('click', handleDocClick);

    const rootEl = doc.getElementById('preview-root') || doc.body;
    setMountNode(rootEl);

    return () => {
      observer.disconnect();
      doc.removeEventListener('click', handleDocClick);
    };
  }, [onSelectBlock]);

  // Continuously observe content height changes (when themes switch, sections are toggled, etc.)
  useEffect(() => {
    if (!mountNode || !onHeightChange) return undefined;
    const iframe = iframeRef.current;
    if (!iframe) return undefined;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return undefined;

    const measureHeight = () => {
      const root = doc.getElementById('preview-root') || doc.body;
      const h = Math.max(
        root?.scrollHeight || 0,
        root?.offsetHeight || 0,
        doc.body?.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0
      );
      if (h > 150) {
        onHeightChange(h);
      }
    };

    measureHeight();
    const interval = setInterval(measureHeight, 400);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && doc.body) {
      ro = new ResizeObserver(measureHeight);
      ro.observe(doc.body);
    }

    return () => {
      clearInterval(interval);
      if (ro) ro.disconnect();
    };
  }, [mountNode, onHeightChange, children, viewport]);

  return (
    <iframe
      ref={iframeRef}
      title={`${viewport} Live Device Preview`}
      style={{
        width: `${targetWidth}px`,
        height: '100%',
        minHeight: '100%',
        border: 'none',
        display: 'block',
        backgroundColor: '#ffffff'
      }}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}

/**
 * Responsive Device Preview Frame
 * Seamlessly isolates desktop, tablet, and mobile previews in authentic device frames
 * without media query leakage, empty white voids, broken word wraps, or clipped graphics.
 */
export default function DevicePreviewFrame({
  viewport = 'desktop',
  title = 'Live Homepage Preview',
  onSelectBlock = null,
  className = '',
  children
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(900);

  const deviceWidth = VIEWPORT_WIDTHS[viewport] || VIEWPORT_WIDTHS.desktop;

  // Measure available container width accurately
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    updateWidth();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateWidth);
      ro.observe(el);
    }
    window.addEventListener('resize', updateWidth);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const handleHeightChange = useCallback((h) => {
    setContentHeight((prev) => (Math.abs(prev - h) > 10 ? h : prev));
  }, []);

  // =========================================================================
  // 1. MOBILE PHONE PREVIEW (Authentic 375px iPhone Frame with Dynamic Notch)
  // =========================================================================
  if (viewport === 'mobile') {
    const availableW = containerWidth || 400;
    const phoneScale = availableW < 395 ? Math.max(0.65, availableW / 395) : 1;

    return (
      <div
        ref={containerRef}
        className={`w-full flex flex-col items-center justify-start py-2 ${className}`}
      >
        <div
          className="transition-transform duration-200"
          style={{
            transform: phoneScale < 1 ? `scale(${phoneScale})` : 'none',
            transformOrigin: 'top center'
          }}
        >
          {/* Authentic iPhone Chassis */}
          <div className="w-[391px] bg-slate-950 rounded-[3rem] p-2 border-[8px] border-slate-900 shadow-2xl ring-1 ring-slate-800/30 overflow-hidden flex flex-col">
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

            {/* Sandboxed Mobile Screen Viewport (375px wide) */}
            <div className="w-[375px] h-[660px] bg-white rounded-b-[2.25rem] overflow-hidden relative">
              <IsolatedDeviceIframe
                targetWidth={375}
                viewport="mobile"
                onSelectBlock={onSelectBlock}
                onHeightChange={handleHeightChange}
              >
                {children}
              </IsolatedDeviceIframe>
            </div>

            {/* Bottom iOS Home Indicator Bar */}
            <div className="w-full bg-slate-950 py-1.5 flex justify-center rounded-b-[2.25rem]">
              <div className="w-28 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. TABLET PREVIEW (Authentic 768px iPad Frame)
  // =========================================================================
  if (viewport === 'tablet') {
    const availableW = containerWidth || 768;
    const tabletScale = availableW < 800 ? Math.max(0.4, availableW / 800) : 1;
    const isScaled = tabletScale < 0.999;

    return (
      <div
        ref={containerRef}
        className={`w-full flex flex-col items-center justify-start py-2 ${className}`}
      >
        <div
          className="transition-transform duration-200"
          style={{
            transform: isScaled ? `scale(${tabletScale})` : 'none',
            transformOrigin: 'top center',
            marginBottom: isScaled ? `-${Math.round((780 - 780 * tabletScale))}px` : '0px'
          }}
        >
          {/* Authentic iPad Chassis */}
          <div className="w-[788px] bg-slate-900 rounded-[2.25rem] p-2.5 border-[8px] border-slate-800 shadow-2xl ring-1 ring-slate-700/30 overflow-hidden flex flex-col">
            {/* Top iPad Camera Notch */}
            <div className="w-full bg-slate-900 py-1.5 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-white/10" />
            </div>

            {/* Sandboxed Tablet Viewport (768px wide) */}
            <div className="w-[768px] h-[720px] bg-white rounded-2xl overflow-hidden relative">
              <IsolatedDeviceIframe
                targetWidth={768}
                viewport="tablet"
                onSelectBlock={onSelectBlock}
                onHeightChange={handleHeightChange}
              >
                {children}
              </IsolatedDeviceIframe>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. DESKTOP PREVIEW (Authentic 1280px Desktop Browser Window with Proportional Scaling)
  // =========================================================================
  const availableW = containerWidth || 1280;
  // If the available column width is narrower than 1280px (e.g. 620px in 3-column studio),
  // scale down proportionally from top left so the complete 1280px 2-column desktop
  // layout fits flawlessly with zero white voids and zero cramped 3-letter word wraps.
  const desktopScale = availableW < 1280 ? Math.max(0.25, availableW / 1280) : 1;
  const isScaled = desktopScale < 0.999;
  const scaledHeight = Math.round(contentHeight * desktopScale);

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col items-center justify-start ${className}`}
    >
      {/* Desktop Browser Chrome Mockup */}
      <div className="w-full bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden flex flex-col">
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
            <span>1280px Desktop</span>
          </div>
        </div>

        {/* Scaled / Isolated Desktop Canvas */}
        <div
          className="w-full relative bg-white overflow-hidden"
          style={{
            height: isScaled ? `${scaledHeight}px` : 'auto',
            minHeight: isScaled ? `${scaledHeight}px` : '600px'
          }}
        >
          <div
            style={{
              position: isScaled ? 'absolute' : 'relative',
              top: 0,
              left: 0,
              width: '1280px',
              height: `${contentHeight}px`,
              transform: isScaled ? `scale(${desktopScale})` : 'none',
              transformOrigin: 'top left',
              backgroundColor: '#ffffff'
            }}
          >
            <IsolatedDeviceIframe
              targetWidth={1280}
              viewport="desktop"
              onSelectBlock={onSelectBlock}
              onHeightChange={handleHeightChange}
            >
              {children}
            </IsolatedDeviceIframe>
          </div>
        </div>
      </div>
    </div>
  );
}
