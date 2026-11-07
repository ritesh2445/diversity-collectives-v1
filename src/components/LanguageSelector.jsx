import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { translationService, SUPPORTED_LANGUAGES } from '../services/translationService';
import { a11yStore } from '../accessibility/a11yStore';

export default function LanguageSelector({ variant = 'header', className = '' }) {
  const [currentLang, setCurrentLang] = useState(() => translationService.getLanguage());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = translationService.subscribe((langCode) => {
      setCurrentLang(langCode);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code) => {
    translationService.setLanguage(code);
    a11yStore.update('currentLanguage', code);
    const targetObj = SUPPORTED_LANGUAGES.find(l => l.code === code);
    a11yStore.announce(`Language changed to ${targetObj ? targetObj.nativeName : code}`);
    setIsOpen(false);
  };

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  // VARIANT: MOBILE DRAWER (Grid/List of chips for easy touch access)
  if (variant === 'mobile') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 px-1">
          <Globe className="w-3.5 h-3.5 text-[#5A1E65]" />
          <span>Language / Idioma</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-xs'
                    : 'bg-slate-50 hover:bg-purple-50 text-slate-700 border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span className="truncate">{lang.nativeName}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-amber-300" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // VARIANT: DESKTOP HEADER DROPDOWN
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select Website Language. Current: ${activeLangObj.nativeName}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-300/90 bg-white hover:bg-purple-50 text-slate-800 hover:text-[#5A1E65] text-xs font-bold transition-all shadow-2xs cursor-pointer flex-shrink-0"
      >
        <Globe className="w-3.5 h-3.5 text-[#5A1E65]" />
        <span className="text-sm leading-none">{activeLangObj.flag}</span>
        <span className="text-[11px] font-black uppercase tracking-wider">{activeLangObj.code.split('-')[0]}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-purple-200/90 shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150 notranslate"
        >
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">
              Select Language / Idioma
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-[#5A1E65] font-bold">
              10 Languages
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 space-y-0.5 no-scrollbar">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#5A1E65] text-white font-bold'
                      : 'text-slate-700 hover:bg-purple-50 hover:text-[#5A1E65]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="truncate">{lang.nativeName}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                      ({lang.label})
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-300 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
