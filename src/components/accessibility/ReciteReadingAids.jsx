import React, { useState, useEffect, useRef } from 'react';
import { a11yStore } from '../../accessibility/a11yStore';

export default function ReciteReadingAids() {
  const [settings, setSettings] = useState(a11yStore.getState());
  const [magnifiedText, setMagnifiedText] = useState('');

  const rulerRef = useRef(null);
  const maskTopRef = useRef(null);
  const maskBottomRef = useRef(null);
  const spotlightRef = useRef(null);
  const rafIdRef = useRef(null);
  const latestPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const unsubscribe = a11yStore.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const isActive =
      settings.ruler ||
      settings.screenMask ||
      settings.magnifier ||
      settings.cursorHighlight;

    if (!isActive) return;

    const updateDOM = () => {
      const { x, y } = latestPos.current;

      // Update Ruler
      if (rulerRef.current) {
        rulerRef.current.style.top = `${y}px`;
      }

      // Update Screen Mask
      if (maskTopRef.current) {
        maskTopRef.current.style.height = `${Math.max(0, y - 70)}px`;
      }
      if (maskBottomRef.current) {
        maskBottomRef.current.style.top = `${y + 70}px`;
      }

      // Update Spotlight
      if (spotlightRef.current) {
        spotlightRef.current.style.left = `${x}px`;
        spotlightRef.current.style.top = `${y}px`;
      }

      rafIdRef.current = null;
    };

    const handlePointerMove = (e) => {
      latestPos.current = { x: e.clientX, y: e.clientY };
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(updateDOM);
      }
    };

    const handleSelection = () => {
      if (settings.magnifier) {
        const selection = window.getSelection()?.toString().trim();
        if (selection && selection.length > 0) {
          setMagnifiedText(selection.slice(0, 160));
        } else {
          setMagnifiedText('');
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('selectionchange', handleSelection);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [settings.ruler, settings.screenMask, settings.magnifier, settings.cursorHighlight]);

  return (
    <>
      {/* 1. Reading Ruler (GPU Accelerated Hardware Smooth) */}
      {settings.ruler && (
        <div
          ref={rulerRef}
          className="recite-reading-ruler"
          aria-hidden="true"
        />
      )}

      {/* 2. Screen Mask (Letterbox Reading Focus Band) */}
      {settings.screenMask && (
        <div className="recite-screen-mask-overlay" aria-hidden="true">
          <div
            ref={maskTopRef}
            className="recite-screen-mask-top"
          />
          <div
            ref={maskBottomRef}
            className="recite-screen-mask-bottom"
          />
        </div>
      )}

      {/* 3. Cursor Spotlight Ring */}
      {settings.cursorHighlight && (
        <div
          ref={spotlightRef}
          className="recite-cursor-highlight-ring"
          aria-hidden="true"
        />
      )}

      {/* 4. Text Magnifier Glass Lens */}
      {settings.magnifier && magnifiedText && (
        <aside
          role="region"
          aria-label="Text Magnifier Preview"
          className="fixed bottom-6 left-6 max-w-lg p-5 rounded-2xl bg-[#0B1528] text-white shadow-2xl border-2 border-amber-400 z-[99999] a11y-toolbar-isolated"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <span>🔍 Text Magnifier Lens (250%)</span>
            <button
              onClick={() => setMagnifiedText('')}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
              aria-label="Close Magnifier Lens"
            >
              ✕
            </button>
          </div>
          <p className="text-2xl font-bold leading-relaxed pt-2 text-white selection:bg-amber-400 selection:text-black">
            {magnifiedText}
          </p>
        </aside>
      )}
    </>
  );
}
