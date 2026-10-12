import React, { useState, useEffect } from 'react';
import { Accessibility } from 'lucide-react';
import { a11yStore } from '../../accessibility/a11yStore';

export default function ReciteLauncher() {
  const [toolbarOpen, setToolbarOpen] = useState(a11yStore.getState().toolbarOpen);

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

  return (
    <button
      id="accessibility-launcher-button"
      type="button"
      onClick={() => a11yStore.toggleToolbar()}
      aria-expanded={toolbarOpen}
      aria-controls="native-accessibility-companion-ribbon"
      aria-label="Launch Accessibility & Audio Companion Toolbar (Alt + A)"
      title="Accessibility & Audio Tools (Alt + A)"
      className={`fixed bottom-6 right-6 z-[99990] flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#5A1E65] text-white shadow-2xl border-2 border-amber-300 hover:bg-[#43144A] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none a11y-toolbar-isolated focus:outline-none focus:ring-4 focus:ring-amber-400 ${
        toolbarOpen ? 'ring-4 ring-amber-400 bg-[#43144A]' : ''
      }`}
    >
      <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
        <Accessibility className="w-5 h-5 fill-current" aria-hidden="true" />
      </div>
      <div className="flex flex-col text-left">
        <span className="font-extrabold text-xs tracking-wide text-white leading-tight">
          Accessibility
        </span>
        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider leading-none">
          Audio & Tools
        </span>
      </div>
    </button>
  );
}
