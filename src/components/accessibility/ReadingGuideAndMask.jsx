import React, { useState, useEffect } from 'react';
import { a11yStore } from '../../accessibility/a11yStore';

export default function ReadingGuideAndMask() {
  const [settings, setSettings] = useState(a11yStore.getState());
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [magnifiedText, setMagnifiedText] = useState('');

  useEffect(() => {
    const unsubscribe = a11yStore.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const isActive =
      settings.readingGuide ||
      settings.readingMask ||
      settings.cursorHighlight ||
      settings.textMagnifier;

    if (!isActive) return;

    const handlePointerMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleSelection = () => {
      if (settings.textMagnifier) {
        const selection = window.getSelection()?.toString().trim();
        if (selection && selection.length > 0) {
          setMagnifiedText(selection.slice(0, 150));
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
    };
  }, [settings.readingGuide, settings.readingMask, settings.cursorHighlight, settings.textMagnifier]);

  return (
    <>
      {/* 1. Reading Guide Horizontal Bar */}
      {settings.readingGuide && (
        <div
          className="a11y-reading-guide-line"
          style={{ top: `${mousePos.y}px` }}
          aria-hidden="true"
        />
      )}

      {/* 2. Reading Mask Focus Aperture */}
      {settings.readingMask && (
        <div className="a11y-reading-mask-overlay" aria-hidden="true">
          <div
            className="a11y-reading-mask-top"
            style={{ height: `${Math.max(0, mousePos.y - 65)}px` }}
          />
          <div
            className="a11y-reading-mask-bottom"
            style={{ top: `${mousePos.y + 65}px` }}
          />
        </div>
      )}

      {/* 3. Cursor Highlight Spotlight Ring */}
      {settings.cursorHighlight && (
        <div
          className="a11y-cursor-highlight-ring"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
          aria-hidden="true"
        />
      )}

      {/* 4. Text Magnifier Tooltip */}
      {settings.textMagnifier && magnifiedText && (
        <aside
          role="region"
          aria-label="Text Magnifier Preview"
          className="fixed bottom-6 left-6 max-w-lg p-5 rounded-2xl bg-slate-950/95 text-white shadow-2xl border-2 border-amber-400 z-[99999] a11y-isolated"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <span>🔍 Text Magnifier (250%)</span>
            <button
              onClick={() => setMagnifiedText('')}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
              aria-label="Close Magnifier Preview"
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
