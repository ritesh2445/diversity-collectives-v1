import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const VIEWPORT_WIDTHS = {
  desktop: 1280,
  tablet: 768,
  mobile: 390
};

/**
 * Isolated same-origin iframe viewport with automatic ResizeObserver scaling.
 * Ensures Tailwind CSS media queries (@media min-width) evaluate against the
 * selected device width (1280px Desktop, 768px Tablet, 390px Mobile) rather
 * than leaking the outer Admin window's breakpoints into a narrow column.
 */
export default function DevicePreviewFrame({
  viewport = 'desktop',
  title = 'Live Homepage Preview',
  maxContainerWidth = null,
  className = '',
  children
}) {
  const hostRef = useRef(null);
  const iframeRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(680);

  const deviceWidth = VIEWPORT_WIDTHS[viewport] || VIEWPORT_WIDTHS.desktop;

  // Measure available preview container width
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      const nextW = el.clientWidth;
      if (nextW > 0) setContainerWidth(nextW);
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

  // Initialize isolated iframe document and mirror parent stylesheets/fonts
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    let bodyObserver = null;

    const setupIframe = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.open();
      doc.write(
        '<!doctype html><html><head><meta charset="utf-8" /><base href="' +
          window.location.origin +
          '/" /></head><body class="bg-white text-slate-800 antialiased"></body></html>'
      );
      doc.close();

      // Copy parent styles and font links into iframe <head>
      const headNodes = document.head.querySelectorAll('link[rel="stylesheet"], style');
      headNodes.forEach((node) => {
        try {
          doc.head.appendChild(node.cloneNode(true));
        } catch {
          // Skip unreadable cross-origin style tags safely
        }
      });

      const resetStyle = doc.createElement('style');
      resetStyle.textContent = `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          overflow: hidden !important;
          min-height: 0 !important;
        }
      `;
      doc.head.appendChild(resetStyle);

      const rootDiv = doc.createElement('div');
      rootDiv.id = 'dcvc-preview-portal-root';
      doc.body.appendChild(rootDiv);
      setMountNode(rootDiv);

      const measureHeight = () => {
        const h = Math.max(rootDiv.scrollHeight || 0, doc.body?.scrollHeight || 0);
        if (h > 100) setContentHeight(h);
      };

      doc.head.querySelectorAll('link[rel="stylesheet"]').forEach((linkEl) => {
        linkEl.addEventListener('load', measureHeight);
      });

      // Re-measure right after styles finish applying
      setTimeout(measureHeight, 60);
      setTimeout(measureHeight, 280);

      if (typeof ResizeObserver !== 'undefined') {
        bodyObserver = new ResizeObserver(measureHeight);
        bodyObserver.observe(rootDiv);
      }
    };

    setupIframe();

    return () => {
      if (bodyObserver) bodyObserver.disconnect();
      setMountNode(null);
    };
  }, [viewport]);

  const effectiveHostWidth = maxContainerWidth
    ? Math.min(containerWidth || maxContainerWidth, maxContainerWidth)
    : containerWidth || 560;

  const scale = Math.min(1, Math.max(0.25, effectiveHostWidth / deviceWidth));
  const scaledWidth = Math.round(deviceWidth * scale);
  const frameHeight = Math.max(480, contentHeight);
  const scaledHeight = Math.round(frameHeight * scale);

  return (
    <div ref={hostRef} className={`w-full overflow-hidden ${className}`}>
      <div
        className="mx-auto relative overflow-hidden bg-white"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`
        }}
      >
        <iframe
          ref={iframeRef}
          title={title}
          scrolling="no"
          style={{
            width: `${deviceWidth}px`,
            height: `${frameHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            border: 0,
            display: 'block',
            backgroundColor: '#ffffff'
          }}
        />
        {mountNode ? createPortal(children, mountNode) : null}
      </div>
    </div>
  );
}
