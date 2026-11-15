import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Clock, 
  History, 
  RotateCcw, 
  Calendar, 
  Sparkles, 
  FileText,
  AlertTriangle,
  Upload,
  Download
} from 'lucide-react';
import { getVersionHistory, rollbackVersion } from '../services/adminClient.js';

export default function UnifiedCrudModal({ 
  isOpen, 
  onClose, 
  entityType = 'business', 
  entityId = null,
  initialData = {}, 
  schema = [], 
  onSave,
  onTriggerFeedback 
}) {
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState('published'); // 'draft' | 'scheduled' | 'published'
  const [scheduledAt, setScheduledAt] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('edit'); // 'edit' | 'history'
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
      setStatus(initialData?.status || 'published');
      setScheduledAt(initialData?.scheduled_at || '');
      loadHistory();
    }
  }, [isOpen, entityId]);

  const loadHistory = async () => {
    if (!entityId) return;
    const h = await getVersionHistory(entityType, entityId);
    setHistory(h);
  };

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleRollback = async (versionId) => {
    if (!confirm(`Rollback to version ${versionId}?`)) return;
    const res = await rollbackVersion(entityType, entityId, versionId);
    if (res.success) {
      onTriggerFeedback?.(res.message);
      await loadHistory();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.({
      ...formData,
      status,
      scheduled_at: status === 'scheduled' ? scheduledAt : null,
      updated_at: new Date().toISOString()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
              Schema-Driven CRUD & Governance
            </span>
            <h3 className="font-bold text-lg text-slate-900">
              {entityId ? `Edit ${entityType}` : `Create New ${entityType}`}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSubTab('edit')}
                className={`px-3 py-1 rounded-lg cursor-pointer ${activeSubTab === 'edit' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600'}`}
              >
                Form Fields
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('history')}
                className={`px-3 py-1 rounded-lg cursor-pointer flex items-center gap-1 ${activeSubTab === 'history' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600'}`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({history.length})</span>
              </button>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeSubTab === 'edit' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Draft / Scheduled / Published Lifecycle Control */}
            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3">
              <label className="block text-xs font-bold text-[#5A1E65] uppercase">
                Release Lifecycle Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'draft', label: 'Draft (Internal Only)', desc: 'Not visible to public' },
                  { id: 'scheduled', label: 'Scheduled Release', desc: 'Goes live automatically' },
                  { id: 'published', label: 'Published (Live)', desc: 'Visible on public site' }
                ].map(s => {
                  const isSelected = status === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#5A1E65] text-white border-purple-800 shadow-xs font-bold' 
                          : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-xs block font-bold">{s.label}</span>
                      <span className={`text-[10px] block ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                        {s.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {status === 'scheduled' && (
                <div className="pt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-700" />
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                  />
                  <span className="text-xs text-slate-500">Scheduled publish time</span>
                </div>
              )}
            </div>

            {/* Dynamic Schema Form Fields */}
            <div className="space-y-3">
              {schema.map(field => {
                const val = formData[field.key] ?? '';
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {field.label} {field.required && <span className="text-rose-600">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        required={field.required}
                        value={val}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#5A1E65] outline-none"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={val}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      >
                        {field.options?.map(opt => (
                          <option key={opt.value || opt} value={opt.value || opt}>
                            {opt.label || opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        required={field.required}
                        value={val}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#5A1E65] outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#5A1E65] text-white text-xs font-bold cursor-pointer shadow-xs hover:bg-purple-900"
              >
                Save Record
              </button>
            </div>
          </form>
        ) : (
          /* Version History Tab */
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Audit checkpoints and previous snapshots of this record. One-click rollback restores prior states with non-destructive version tagging.
            </p>

            <div className="space-y-2.5">
              {history.map(item => (
                <div key={item.versionId} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                        {item.versionId}
                      </span>
                      <strong className="text-slate-900">{item.actorName}</strong>
                      <span className="text-slate-400 text-[11px] font-mono">({item.actorEmail})</span>
                    </div>
                    <p className="text-slate-600 mt-1">{item.changeSummary}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {item.canRollback && (
                    <button
                      type="button"
                      onClick={() => handleRollback(item.versionId)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-purple-50 hover:text-purple-900 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                      <span>Rollback</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
