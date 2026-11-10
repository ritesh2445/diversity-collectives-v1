import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import TraditionalAccessibilityIcon from '../icons/TraditionalAccessibilityIcon';
import { a11yStore } from '../../accessibility/a11yStore';
import { EyeOff, X } from 'lucide-react';

export default function ReciteLauncher() {
  const [toolbarOpen, setToolbarOpen] = useState(a11yStore.getState().toolbarOpen);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dcvc_hide_a11y_launcher') === 'true';
    }
    return false;
  });
  const [showHidePrompt, setShowHidePrompt] = useState(false);
  const location = useLocation();
  const pressTimerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = a11yStore.subscribe((settings) => {
      setToolbarOpen(settings.toolbarOpen);
    });
    return unsubscribe;
  }, []);

  // Hotkey: Alt + A
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        a11yStore.toggleToolbar();
      }
      if (e.key === 'Escape' && toolbarOpen) {
        a11yStore.update('toolbarOpen', false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toolbarOpen]);

  // Only show floating button on Home screen ('/') and when not dismissed
  if (location.pathname !== '/' || toolbarOpen || isDismissed) {
    return null;
  }

  const handlePressStart = () => {
    pressTimerRef.current = setTimeout(() => {
      setShowHidePrompt(true);
    }, 550);
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleHide = (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem('dcvc_hide_a11y_launcher', 'true');
    } catch {
      // Safe fallback
    }
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 select-none">
      {/* Hide Confirmation Popover (triggered on long press or right click) */}
      {showHidePrompt && (
        <div 
          className="absolute bottom-14 left-0 mb-2 w-56 p-3 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-purple-300/40 backdrop-blur-md animate-fadeIn text-xs"
          role="dialog"
          aria-label="Hide button prompt"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
            <span className="font-bold text-amber-300">Accessibility Button</span>
            <button
              onClick={() => setShowHidePrompt(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight mb-2.5">
            Hide this floating button? (You can still access it anytime in the top menu or with <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono text-[9px]">Alt+A</kbd>).
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleHide}
              className="flex-1 py-1.5 px-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-[11px] text-center inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <EyeOff className="w-3 h-3" />
              <span>Hide Button</span>
            </button>
            <button
              type="button"
              onClick={() => setShowHidePrompt(false)}
              className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold text-[11px] cursor-pointer"
            >
              Keep
            </button>
          </div>
        </div>
      )}

      <button
        id="accessibility-launcher-button"
        type="button"
        onClick={() => a11yStore.toggleToolbar()}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowHidePrompt(true);
        }}
        aria-expanded={false}
        aria-controls="native-accessibility-companion-ribbon"
        aria-label="Launch Accessibility & Audio Companion Toolbar (Alt + A). Long press to hide."
        title="Accessibility & Audio Tools (Alt + A) • Long-press to hide"
        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-3 rounded-full bg-[#5A1E65] text-white shadow-xl hover:shadow-2xl border-2 border-amber-300 hover:bg-[#43144A] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none a11y-toolbar-isolated focus:outline-none focus:ring-4 focus:ring-amber-400 group"
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs flex-shrink-0">
          <TraditionalAccessibilityIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="font-extrabold text-xs tracking-wide text-white leading-tight">
            Accessibility
          </span>
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider leading-none">
            Audio & Tools
          </span>
        </div>
      </button>
    </div>
  );
}
