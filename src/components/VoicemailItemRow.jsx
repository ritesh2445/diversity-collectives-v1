import React, { useState, useEffect } from 'react';
import {
  Clock,
  Download,
  Trash2,
  Volume2,
  Check,
  PhoneCall,
  Mail,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileEdit,
  Save,
  Archive,
  RotateCcw
} from 'lucide-react';

export default function VoicemailItemRow({
  voicemail,
  apiBaseUrl,
  onStatusChange,
  onNotesChange,
  onDelete
}) {
  const v = voicemail;
  const [notes, setNotes] = useState(v.admin_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync if external notes update
  useEffect(() => {
    setNotes(v.admin_notes || '');
  }, [v.admin_notes]);

  const audioSrc = v.audio_data
    ? `data:${v.audio_mime_type || 'audio/webm'};base64,${v.audio_data}`
    : `${apiBaseUrl}/admin/voicemails/${v.id}/audio`;

  const durationFmt = v.duration_seconds
    ? `${Math.floor(v.duration_seconds / 60)}:${String(v.duration_seconds % 60).padStart(2, '0')}`
    : '0:00';

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onNotesChange(v.id, notes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Handled in parent
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleInsertQuickNote = (snippet) => {
    const timestamp = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    const prefix = `[${timestamp}] ${snippet}\n`;
    const newNotes = prefix + (notes ? notes.trim() : '');
    setNotes(newNotes);
  };

  const statusConfig = {
    new: {
      label: 'New',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse',
      btnActive: 'bg-amber-500 text-slate-950 shadow-xs'
    },
    reviewed: {
      label: 'Reviewed',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
      btnActive: 'bg-sky-600 text-white shadow-xs'
    },
    responded: {
      label: 'Responded',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      btnActive: 'bg-emerald-600 text-white shadow-xs'
    },
    archived: {
      label: 'Archived',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      btnActive: 'bg-slate-700 text-white shadow-xs'
    }
  };

  const currentStatus = v.status || 'new';

  return (
    <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-xs hover:border-purple-300 transition-all space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-sm text-slate-950">
            {v.name || 'Anonymous Caller'}
          </span>
          <span
            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
              statusConfig[currentStatus]?.badgeClass || 'bg-slate-100 text-slate-700'
            }`}
          >
            {statusConfig[currentStatus]?.label || currentStatus}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            {v.created_at ? new Date(v.created_at).toLocaleString() : 'Recently'}
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
            Duration: {durationFmt}
          </span>
        </div>

        {/* Status Selection Buttons & Delete Action */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {(['new', 'reviewed', 'responded', 'archived']).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onStatusChange(v.id, st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentStatus === st
                    ? statusConfig[st].btnActive
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {statusConfig[st].label}
              </button>
            ))}
          </div>

          {/* Delete Action with In-Place Confirmation */}
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-300 animate-fadeIn">
              <span className="text-[10px] font-bold text-rose-900 px-1">Delete?</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete(v.id);
                }}
                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete this voicemail and recording"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Caller Info & Subject */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Contact Email
          </span>
          {v.email ? (
            <a
              href={`mailto:${v.email}`}
              className="text-xs font-bold text-[#5A1E65] hover:underline flex items-center gap-1"
            >
              <Mail className="w-3 h-3 text-[#5A1E65]" />
              <span>{v.email}</span>
            </a>
          ) : (
            <span className="text-slate-400 italic">No email provided</span>
          )}
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Subject / Inquiry Reason
          </span>
          <span className="text-xs font-semibold text-slate-800">
            {v.subject || 'General Inquiry'}
          </span>
        </div>
      </div>

      {/* Audio Player and Download */}
      <div className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100 text-[#5A1E65] shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <audio controls preload="none" src={audioSrc} className="w-full h-9 rounded-lg">
            Your browser does not support the audio element.
          </audio>
        </div>
        <a
          href={audioSrc}
          download={`voicemail_${v.id}.webm`}
          className="px-3.5 py-2 rounded-xl bg-white border border-purple-200 hover:bg-purple-50 text-[#5A1E65] font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
          title="Download audio recording to computer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Audio</span>
        </a>
      </div>

      {/* Follow-up Notes Workspace */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <FileEdit className="w-3.5 h-3.5 text-[#5A1E65]" />
              <span>Follow-up & Case Resolution Notes</span>
            </label>
            {v.notes_updated_at && (
              <span className="text-[10px] text-slate-400">
                Updated {new Date(v.notes_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Quick Insert Chips */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold hidden md:inline">Quick chips:</span>
            {[
              { label: '📞 Callback Left', text: 'Left phone callback message for caller.' },
              { label: '✉️ Sent Email', text: 'Sent email response with program information.' },
              { label: '🤝 Referred', text: 'Referred caller to appropriate DCVC peer support group.' },
              { label: '✅ Resolved', text: 'Inquiry addressed and fully resolved with visitor.' }
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleInsertQuickNote(chip.text)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-[#5A1E65] border border-slate-200 transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Record follow-up calls, emails sent, services referred, or resolution steps..."
          className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5A1E65] text-xs bg-slate-50/40 text-slate-900 font-medium leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {saveSuccess ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 animate-fadeIn">
                <Check className="w-3.5 h-3.5" /> Follow-up notes successfully saved!
              </span>
            ) : (
              <span>Notes are saved securely to DCVC Admin Records.</span>
            )}
          </div>

          <button
            type="button"
            disabled={isSavingNotes}
            onClick={handleSaveNotes}
            className="px-4 py-1.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
