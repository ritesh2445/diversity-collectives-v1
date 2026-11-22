import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  MapPin, 
  RotateCcw,
  ExternalLink 
} from 'lucide-react';
import { cmsStore } from '../../services/cmsStore';
import { DEFAULT_WEEKLY_SCHEDULE } from '../../utils/recurringSchedule';

const DAY_OPTIONS = [
  { name: 'Monday', dayOfWeek: 1 },
  { name: 'Tuesday', dayOfWeek: 2 },
  { name: 'Wednesday', dayOfWeek: 3 },
  { name: 'Thursday', dayOfWeek: 4 },
  { name: 'Friday', dayOfWeek: 5 },
  { name: 'Saturday', dayOfWeek: 6 },
  { name: 'Sunday', dayOfWeek: 0 },
];

const RECURRENCE_PRESETS = [
  { id: 'every', label: 'Every Week', value: 'every', labelTpl: 'Every {Day}' },
  { id: 'first_third', label: '1st & 3rd of Month', value: [1, 3], labelTpl: '1st & 3rd {Day} of the Month' },
  { id: 'second', label: '2nd of Month', value: [2], labelTpl: '2nd {Day} of the Month' },
  { id: 'first', label: '1st of Month', value: [1], labelTpl: '1st {Day} of the Month' },
  { id: 'third', label: '3rd of Month', value: [3], labelTpl: '3rd {Day} of the Month' },
  { id: 'custom', label: 'Custom Recurrence', value: 'custom', labelTpl: '{Custom}' }
];

export default function WeeklyScheduleManager({ onToast }) {
  const [schedule, setSchedule] = useState(() => cmsStore.getWeeklySchedule?.() || DEFAULT_WEEKLY_SCHEDULE);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const unsub = cmsStore.subscribe(() => {
      setSchedule(cmsStore.getWeeklySchedule?.() || DEFAULT_WEEKLY_SCHEDULE);
    });
    return unsub;
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      id: `prog-${Date.now()}`,
      name: '',
      dayName: 'Monday',
      dayOfWeek: 1,
      recurrenceType: 'every',
      recurrence: 'every',
      recurrenceLabel: 'Every Monday',
      time: '',
      category: 'Peer Support',
      location: 'DCVC Community Resource Center',
      address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
      description: '',
      link: '/community'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prog) => {
    setEditingItem(prog);
    let recurrenceType = 'every';
    if (Array.isArray(prog.recurrence)) {
      if (prog.recurrence.length === 2 && prog.recurrence[0] === 1 && prog.recurrence[1] === 3) {
        recurrenceType = 'first_third';
      } else if (prog.recurrence.length === 1 && prog.recurrence[0] === 2) {
        recurrenceType = 'second';
      } else if (prog.recurrence.length === 1 && prog.recurrence[0] === 1) {
        recurrenceType = 'first';
      } else if (prog.recurrence.length === 1 && prog.recurrence[0] === 3) {
        recurrenceType = 'third';
      } else {
        recurrenceType = 'custom';
      }
    }

    setFormData({
      ...prog,
      recurrenceType
    });
    setIsModalOpen(true);
  };

  const handleDayChange = (dayName) => {
    const found = DAY_OPTIONS.find(d => d.name === dayName);
    const dayOfWeek = found ? found.dayOfWeek : 1;
    let label = formData.recurrenceLabel;
    if (formData.recurrenceType === 'every') {
      label = `Every ${dayName}`;
    } else if (formData.recurrenceType === 'first_third') {
      label = `1st & 3rd ${dayName} of the Month`;
    } else if (formData.recurrenceType === 'second') {
      label = `2nd ${dayName} of the Month`;
    }
    setFormData(prev => ({
      ...prev,
      dayName,
      dayOfWeek,
      recurrenceLabel: label
    }));
  };

  const handleRecurrenceTypeChange = (recurrenceType) => {
    let recurrence = 'every';
    let recurrenceLabel = `Every ${formData.dayName}`;
    if (recurrenceType === 'first_third') {
      recurrence = [1, 3];
      recurrenceLabel = `1st & 3rd ${formData.dayName} of the Month`;
    } else if (recurrenceType === 'second') {
      recurrence = [2];
      recurrenceLabel = `2nd ${formData.dayName} of the Month`;
    } else if (recurrenceType === 'first') {
      recurrence = [1];
      recurrenceLabel = `1st ${formData.dayName} of the Month`;
    } else if (recurrenceType === 'third') {
      recurrence = [3];
      recurrenceLabel = `3rd ${formData.dayName} of the Month`;
    } else if (recurrenceType === 'custom') {
      recurrence = 'every';
    }

    setFormData(prev => ({
      ...prev,
      recurrenceType,
      recurrence,
      recurrenceLabel
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Program name is required.');
      return;
    }

    const updated = cmsStore.saveWeeklyProgram(formData);
    setSchedule(updated);
    setIsModalOpen(false);
    onToast?.(`Weekly program "${formData.name}" saved successfully.`);
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the weekly recurring schedule?`)) {
      return;
    }
    const updated = cmsStore.deleteWeeklyProgram(id);
    setSchedule(updated);
    onToast?.(`Weekly program "${name}" removed.`);
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset the weekly schedule back to the verified default timetable?')) {
      return;
    }
    const updated = cmsStore.saveWeeklySchedule(DEFAULT_WEEKLY_SCHEDULE);
    setSchedule(updated);
    onToast?.('Weekly programs calendar reset to official verified schedule.');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-purple-100 shadow-xs">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            DETERMINISTIC OCCURRENCE ENGINE
          </span>
          <h3 className="font-display text-xl font-bold text-slate-950 mt-1">
            Weekly Recurring Programs Schedule ({schedule.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manages recurring programs displayed on the public Weekly Calendar and Homepage "Upcoming This Week" section.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restore official default schedule"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Weekly Program</span>
          </button>
        </div>
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedule.map((prog) => (
          <div
            key={prog.id}
            className="p-5 rounded-3xl bg-white border-2 border-slate-200/90 hover:border-purple-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#5A1E65] border border-purple-200">
                  {prog.dayName}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {prog.category || 'Support'}
                </span>
              </div>

              <div>
                <h4 className="font-display font-extrabold text-slate-950 text-base leading-snug">
                  {prog.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    {prog.recurrenceLabel}
                  </span>
                  {prog.time && (
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#5A1E65]" />
                      <span>{prog.time}</span>
                    </span>
                  )}
                </div>
              </div>

              {prog.description && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {prog.description}
                </p>
              )}

              <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{prog.location || 'DCVC CRC'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                {prog.id}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditModal(prog)}
                  className="p-2 rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer"
                  title="Edit Program"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(prog.id, prog.name)}
                  className="p-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Delete Program"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 my-8 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-slate-950">
                    {editingItem ? 'Edit Weekly Program' : 'Add New Weekly Program'}
                  </h3>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    {formData.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  Program Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Narcotics Anonymous"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-slate-700">
                    Day of the Week
                  </label>
                  <select
                    value={formData.dayName || 'Monday'}
                    onChange={(e) => handleDayChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none text-sm bg-white"
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-slate-700">
                    Meeting Time (Leave empty if unannounced)
                  </label>
                  <input
                    type="text"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 6:00 PM"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-slate-700">
                    Recurrence Pattern
                  </label>
                  <select
                    value={formData.recurrenceType || 'every'}
                    onChange={(e) => handleRecurrenceTypeChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none text-sm bg-white"
                  >
                    {RECURRENCE_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-slate-700">
                    Recurrence Display Label
                  </label>
                  <input
                    type="text"
                    value={formData.recurrenceLabel || ''}
                    onChange={(e) => setFormData({ ...formData, recurrenceLabel: e.target.value })}
                    placeholder="e.g. 1st & 3rd Tuesday of the Month"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-slate-700">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Adult Peer Support"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-slate-700">
                    Website Learn More Link
                  </label>
                  <input
                    type="text"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="e.g. /community or /programs/rainbow-umbrella"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  Location & Address
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="DCVC Community Resource Center"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  Description / Purpose
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the peer group, attendees, and activities..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Weekly Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
