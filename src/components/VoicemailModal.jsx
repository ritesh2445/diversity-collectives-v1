import React, { useEffect } from 'react';
import { X, Mic } from 'lucide-react';
import VoicemailRecorder from './VoicemailRecorder';

export default function VoicemailModal({ isOpen, onClose, defaultSubject = '' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voicemail-modal-title"
    >
      <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 my-8 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5A1E65] flex items-center justify-center border border-purple-100">
              <Mic className="w-4 h-4 text-[#5A1E65]" />
            </div>
            <div>
              <h3 id="voicemail-modal-title" className="font-display font-black text-slate-900 text-base">
                Send Us a Voice Message
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                Staff will listen to your recording and reply promptly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close voice message modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <VoicemailRecorder
            defaultOpen={true}
            defaultSubject={defaultSubject}
            onSubmitted={() => {
              setTimeout(() => {
                if (typeof onClose === 'function') onClose();
              }, 2500);
            }}
          />
        </div>
      </div>
    </div>
  );
}
