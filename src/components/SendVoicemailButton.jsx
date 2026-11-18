import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import VoicemailModal from './VoicemailModal';

export default function SendVoicemailButton({
  className = '',
  label = 'Send Voice Message',
  subject = '',
  compact = false
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const defaultClasses = compact
    ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#5A1E65] border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
    : "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5A1E65] border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs";

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={className || defaultClasses}
        title="Leave a voice message for DCVC staff"
      >
        <Mic className={compact ? "w-3 h-3 text-[#5A1E65] shrink-0" : "w-3.5 h-3.5 text-[#5A1E65] shrink-0"} />
        <span>{label}</span>
      </button>

      <VoicemailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultSubject={subject}
      />
    </>
  );
}
