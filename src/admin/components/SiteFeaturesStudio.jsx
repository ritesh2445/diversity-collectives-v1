import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  CalendarClock,
  Megaphone,
  ShieldCheck,
  Brain,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Download,
  Lock,
  Unlock,
  Search,
  Calendar,
  Clock,
  Eye
} from 'lucide-react';
import LunaLearningStudio from './LunaLearningStudio.jsx';
import {
  getSiteFeatures,
  saveSiteFeatures,
  subscribeToSiteFeatures,
  computeFlexSpaceStatus,
  getSlotAvailability,
  DEFAULT_FORM_SCHEMAS
} from '../../services/siteFeaturesStore';
import { getUpcomingHivClinicDates, getTodayIso } from '../../utils/calendarBooking.js';

const FORM_OPTIONS = [
  { id: 'hiv_screening', label: 'HIV Screening (Limited Slots)' },
  { id: 'flex_space', label: 'Flex Space Slot Booking' },
  { id: 'contact', label: 'Contact & Inquiry Form' },
  { id: 'volunteer', label: 'Volunteer Application' },
  { id: 'training', label: 'P.R.I.D.E. Training Request' },
  { id: 'directory_submit', label: 'Business Directory Submission' },
  { id: 'resource_submit', label: 'Resource Recommendation' }
];

const WEEKDAY_LABELS = [
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' }
];

export default function SiteFeaturesStudio({ initialSubTab = 'forms' }) {
  const [subTab, setSubTab] = useState(initialSubTab);
  const [features, setFeatures] = useState(getSiteFeatures);
  const [selectedFormId, setSelectedFormId] = useState('hiv_screening');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newSlotText, setNewSlotText] = useState('');
  const [newFlexSlotText, setNewFlexSlotText] = useState('');
  const [newFlexFieldLabel, setNewFlexFieldLabel] = useState('');
  const [newFlexFieldType, setNewFlexFieldType] = useState('text');
  const [savedBanner, setSavedBanner] = useState('');

  // HIV Screening Admin Controls State
  const [hivSearchQuery, setHivSearchQuery] = useState('');
  const [hivDateFilter, setHivDateFilter] = useState('all');
  const [hivSlotFilter, setHivSlotFilter] = useState('all');
  const [hivStatusFilter, setHivStatusFilter] = useState('all');
  const [hivExtraDateInput, setHivExtraDateInput] = useState('');
  const [hivBlockedDateInput, setHivBlockedDateInput] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const upcomingHivDates = useMemo(
    () => getUpcomingHivClinicDates(6, features?.hivScreening?.allowedDates, features?.hivScreening?.blockedDates),
    [features?.hivScreening?.allowedDates, features?.hivScreening?.blockedDates]
  );
  const [hivPreviewDate, setHivPreviewDate] = useState(() => upcomingHivDates[0] || getTodayIso());

  useEffect(() => {
    return subscribeToSiteFeatures((next) => setFeatures(next));
  }, []);

  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail?.subTab) setSubTab(e.detail.subTab);
    };
    window.addEventListener('dcvc_navigate_admin_tab', handleNav);
    return () => window.removeEventListener('dcvc_navigate_admin_tab', handleNav);
  }, []);

  const flashSaved = (msg) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(''), 2500);
  };

  const updateFeatures = (updater, msg = 'Changes saved & synced live!') => {
    const next = saveSiteFeatures(updater);
    setFeatures(next);
    flashSaved(msg);
  };

  const activeSchema = features.formSchemas?.[selectedFormId] || DEFAULT_FORM_SCHEMAS[selectedFormId];
  const flexSchema = features.formSchemas?.flex_space || DEFAULT_FORM_SCHEMAS.flex_space;
  const flexStatus = computeFlexSpaceStatus(features.flexSpace);

  const updateSchema = (patch) => {
    updateFeatures((prev) => ({
      ...prev,
      formSchemas: {
        ...prev.formSchemas,
        [selectedFormId]: {
          ...activeSchema,
          ...patch
        }
      }
    }));
  };

  const updateFlexSchema = (patch, msg = 'Community Flex Form updated!') => {
    updateFeatures((prev) => ({
      ...prev,
      formSchemas: {
        ...prev.formSchemas,
        flex_space: {
          ...flexSchema,
          ...patch
        }
      }
    }), msg);
  };

  const handleAddFlexField = () => {
    const label = newFlexFieldLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${Date.now()}`;
    const newField = {
      id: `${id}_${Date.now().toString(36).slice(-4)}`,
      label,
      type: newFlexFieldType,
      required: false,
      placeholder: `Enter ${label.toLowerCase()}`,
      ...(newFlexFieldType === 'select' ? { options: ['Option 1', 'Option 2'] } : {})
    };
    updateFlexSchema({ fields: [...(flexSchema.fields || []), newField] }, `Added field "${label}" to Flex form`);
    setNewFlexFieldLabel('');
  };

  const moveFlexField = (idx, dir) => {
    const list = [...(flexSchema.fields || [])];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    updateFlexSchema({ fields: list });
  };

  const updateFlexField = (idx, patch) => {
    const list = [...(flexSchema.fields || [])];
    list[idx] = { ...list[idx], ...patch };
    updateFlexSchema({ fields: list });
  };

  const deleteFlexField = (idx) => {
    const removed = (flexSchema.fields || [])[idx];
    const list = (flexSchema.fields || []).filter((_, i) => i !== idx);
    const nextDeleted = removed?.id
      ? Array.from(new Set([...(flexSchema.deletedFieldIds || []), removed.id]))
      : (flexSchema.deletedFieldIds || []);
    updateFlexSchema({ fields: list, deletedFieldIds: nextDeleted }, 'Removed field from Flex form');
  };

  const handleAddField = () => {
    const label = newFieldLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${Date.now()}`;
    const hasOptions = newFieldType === 'select' || newFieldType === 'checkbox_group';
    const newFieldId = `${id}_${Date.now().toString(36).slice(-4)}`;
    const newField = {
      id: newFieldId,
      label,
      type: newFieldType,
      required: false,
      grid: newFieldType === 'textarea' || newFieldType === 'checkbox_group' || newFieldType === 'checkbox' ? 'full' : 'half',
      placeholder: newFieldType === 'checkbox' || newFieldType === 'checkbox_group' ? '' : `Enter ${label.toLowerCase()}`,
      ...(hasOptions ? { options: ['Option 1', 'Option 2'] } : {})
    };
    const nextDeleted = (activeSchema.deletedFieldIds || []).filter((fid) => fid !== newFieldId);
    updateSchema({
      schemaVersion: activeSchema.schemaVersion || 3,
      deletedFieldIds: nextDeleted,
      fields: [...(activeSchema.fields || []), newField]
    }, `Added field "${label}"`);
    setNewFieldLabel('');
  };

  const moveField = (idx, dir) => {
    const list = [...(activeSchema.fields || [])];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    updateSchema({ schemaVersion: activeSchema.schemaVersion || 3, fields: list });
  };

  const updateField = (idx, patch) => {
    const list = [...(activeSchema.fields || [])];
    list[idx] = { ...list[idx], ...patch };
    updateSchema({ schemaVersion: activeSchema.schemaVersion || 3, fields: list });
  };

  const deleteField = (idx) => {
    const removed = (activeSchema.fields || [])[idx];
    const list = (activeSchema.fields || []).filter((_, i) => i !== idx);
    const nextDeleted = removed?.id
      ? Array.from(new Set([...(activeSchema.deletedFieldIds || []), removed.id]))
      : (activeSchema.deletedFieldIds || []);
    updateSchema({
      schemaVersion: activeSchema.schemaVersion || 3,
      deletedFieldIds: nextDeleted,
      fields: list
    }, removed?.label ? `Removed "${removed.label}" from live form` : 'Removed field');
  };

  const handleResetSelectedForm = () => {
    const baseDefault = DEFAULT_FORM_SCHEMAS[selectedFormId];
    if (!baseDefault) return;
    updateFeatures((prev) => ({
      ...prev,
      formSchemas: {
        ...prev.formSchemas,
        [selectedFormId]: JSON.parse(JSON.stringify(baseDefault))
      }
    }), `Restored "${baseDefault.title}" to default fields`);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'forms', label: 'Form Builder (All Forms)', icon: FileText },
            { id: 'flex', label: 'Flex Space & Timings', icon: CalendarClock },
            { id: 'hiv', label: 'HIV Screening Slots', icon: ShieldCheck },
            { id: 'broadcast', label: 'Auto Broadcast Popups', icon: Megaphone },
            { id: 'luna', label: 'Luna Learning Center', icon: Brain }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSubTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  subTab === item.id
                    ? 'bg-[#5A1E65] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {savedBanner && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> {savedBanner}
          </span>
        )}
      </div>

      {/* 1. DYNAMIC FORM BUILDER */}
      {subTab === 'forms' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display text-xl font-black text-slate-950">Universal Form Editor</h3>
              <p className="text-xs text-slate-600 font-medium">
                Edit titles, add new fields, toggle required flags, or customize options for every form on the site.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 outline-none"
              >
                {Object.keys(features.formSchemas || DEFAULT_FORM_SCHEMAS).map((fid) => {
                  const s = (features.formSchemas || DEFAULT_FORM_SCHEMAS)[fid];
                  return (
                    <option key={fid} value={fid}>{s?.title || fid}</option>
                  );
                })}
              </select>
              {DEFAULT_FORM_SCHEMAS[selectedFormId] && (
                <button
                  type="button"
                  onClick={handleResetSelectedForm}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  title="Restore this form back to default live site fields"
                >
                  Reset Defaults
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const name = window.prompt('Enter name for the new custom form (e.g., Youth Prom RSVP or Gala Volunteer):');
                  if (!name || !name.trim()) return;
                  const newId = `custom_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36).slice(-4)}`;
                  const newSchema = {
                    id: newId,
                    title: name.trim(),
                    description: `Custom registration form created by DCVC Admin for events and programs.`,
                    submitLabel: 'Submit Registration',
                    fields: [
                      { id: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
                      { id: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@example.org' },
                      { id: 'notes', label: 'Comments / Details', type: 'textarea', required: false, placeholder: 'Additional details...' }
                    ]
                  };
                  updateFeatures((prev) => ({
                    ...prev,
                    formSchemas: {
                      ...prev.formSchemas,
                      [newId]: newSchema
                    }
                  }), `Created custom form "${name.trim()}"`);
                  setSelectedFormId(newId);
                }}
                className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#5A1E65] text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                title="Create a new custom form"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom Form</span>
              </button>
            </div>
          </div>

          {selectedFormId === 'flex_space' && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-extrabold text-[#5A1E65] flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4" /> Community Flex Space Form & Slots
                </span>
                <p className="text-slate-600">
                  You are editing the Community Flex Space reservation form fields. You can also customize its section copy, bookable time slots, and live hours in the dedicated Flex Space studio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('flex')}
                className="px-3 py-1.5 rounded-xl bg-[#5A1E65] text-white font-bold text-xs hover:bg-purple-900 transition-colors cursor-pointer"
              >
                Open Flex Space & Timings Studio →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Form Title</label>
              <input
                type="text"
                value={activeSchema.title || ''}
                onChange={(e) => updateSchema({ title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Submit Button Text</label>
              <input
                type="text"
                value={activeSchema.submitLabel || ''}
                onChange={(e) => updateSchema({ submitLabel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Form Subtitle / Description</label>
              <input
                type="text"
                value={activeSchema.description || ''}
                onChange={(e) => updateSchema({ description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                placeholder="Intro text shown under form heading on main site..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Consent / Pledge Checkbox Text</label>
              <input
                type="text"
                value={activeSchema.consentText || ''}
                onChange={(e) => updateSchema({ consentText: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                placeholder="Privacy, pledge, or screening consent text..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Form Fields ({activeSchema.fields?.length || 0}) — Synced Identically to Live Website
              </h4>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Instant Live Sync Active
              </span>
            </div>
            {(activeSchema.fields || []).map((field, idx) => (
              <div key={field.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(idx, { label: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900"
                      placeholder="Field Label"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        const patch = { type: nextType };
                        if ((nextType === 'select' || nextType === 'checkbox_group') && (!Array.isArray(field.options) || field.options.length === 0)) {
                          patch.options = ['Option 1', 'Option 2'];
                        }
                        updateField(idx, patch);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="number">Number</option>
                      <option value="url">URL</option>
                      <option value="date">Date</option>
                      <option value="textarea">Long Text</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Single Checkbox</option>
                      <option value="checkbox_group">Multi-Select Checkboxes</option>
                    </select>
                    <select
                      value={field.grid || (field.type === 'textarea' || field.type === 'checkbox_group' || field.type === 'checkbox' ? 'full' : 'half')}
                      onChange={(e) => updateField(idx, { grid: e.target.value })}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700"
                      title="Column width on desktop"
                    >
                      <option value="half">Half Width</option>
                      <option value="full">Full Width</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(field.required)}
                        onChange={(e) => updateField(idx, { required: e.target.checked })}
                        className="accent-[#5A1E65]"
                      />
                      Required
                    </label>
                    <button type="button" onClick={() => moveField(idx, -1)} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 cursor-pointer" title="Move Up">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => moveField(idx, 1)} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 cursor-pointer" title="Move Down">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => deleteField(idx)} className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer" title="Delete Field">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {field.type === 'select' || field.type === 'checkbox_group' ? (
                  <input
                    type="text"
                    value={(field.options || []).join(', ')}
                    onChange={(e) => updateField(idx, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                    placeholder="Comma-separated options (e.g., Option A, Option B, Option C)..."
                  />
                ) : field.type !== 'checkbox' ? (
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                    placeholder="Placeholder hint text..."
                  />
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={field.helperText || ''}
                    onChange={(e) => updateField(idx, { helperText: e.target.value })}
                    className="w-full px-3 py-1 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700"
                    placeholder="Optional helper note under label..."
                  />
                  <input
                    type="text"
                    value={field.badge || ''}
                    onChange={(e) => updateField(idx, { badge: e.target.value })}
                    className="w-full px-3 py-1 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700"
                    placeholder="Optional badge pill (e.g., Affirming Info)..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add New Field */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="New field label (e.g., T-Shirt Size or Dietary Needs)"
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900"
            />
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-800"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="tel">Phone</option>
              <option value="number">Number</option>
              <option value="url">URL</option>
              <option value="date">Date</option>
              <option value="textarea">Long Text</option>
              <option value="select">Dropdown</option>
              <option value="checkbox">Single Checkbox</option>
              <option value="checkbox_group">Multi-Select Checkboxes</option>
            </select>
            <button
              type="button"
              onClick={handleAddField}
              className="px-4 py-2 rounded-xl bg-[#5A1E65] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Field
            </button>
          </div>
        </div>
      )}

      {/* 2. FLEX SPACE AVAILABILITY, FORM & TIMINGS */}
      {subTab === 'flex' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-black text-slate-950">
                Community Flex Space & Booking Form Studio
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Customize section copy, booking form fields, bookable time windows, and real-time open/closed availability.
              </p>
            </div>
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-black border ${
                flexStatus.isAvailable
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              Live Status: {flexStatus.label}
            </span>
          </div>

          {/* Card 1: Public Section Copy */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-display text-base font-black text-slate-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#5A1E65]" />
                Public Section Headline & Description
              </h4>
              <p className="text-xs text-slate-500">
                Text displayed on the left side of the homepage Community Flex Space section.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Headline
                </label>
                <input
                  type="text"
                  value={features.flexSpace.title || ''}
                  onChange={(e) =>
                    updateFeatures((p) => ({
                      ...p,
                      flexSpace: { ...p.flexSpace, title: e.target.value }
                    }))
                  }
                  placeholder="Community Flex Space at 2471 Portola Rd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Description
                </label>
                <textarea
                  rows={2}
                  value={features.flexSpace.description || ''}
                  onChange={(e) =>
                    updateFeatures((p) => ({
                      ...p,
                      flexSpace: { ...p.flexSpace, description: e.target.value }
                    }))
                  }
                  placeholder="Need a quiet, affirming space for peer support, telehealth, study, or community organizing? Check real-time availability and reserve a Flex Space time slot."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Bookable Time Slots */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-display text-base font-black text-slate-950 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#5A1E65]" />
                Bookable Time Windows (Slots)
              </h4>
              <p className="text-xs text-slate-500">
                Time slots visitors can select on the interactive booking calendar.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFlexSlotText}
                onChange={(e) => setNewFlexSlotText(e.target.value)}
                placeholder="e.g., 10:00 AM – 11:00 AM or 5:00 PM – 6:00 PM"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newFlexSlotText.trim()) return;
                  updateFeatures((p) => ({
                    ...p,
                    flexSpace: {
                      ...p.flexSpace,
                      slots: [...(p.flexSpace.slots || []), newFlexSlotText.trim()]
                    }
                  }), `Added Flex slot "${newFlexSlotText.trim()}"`);
                  setNewFlexSlotText('');
                }}
                className="px-4 py-2 rounded-xl bg-[#5A1E65] text-white text-xs font-bold hover:bg-purple-900 cursor-pointer transition-colors"
              >
                Add Slot
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(features.flexSpace.slots || []).map((slot) => (
                <span
                  key={slot}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-[#5A1E65]"
                >
                  {slot}
                  <button
                    type="button"
                    onClick={() =>
                      updateFeatures((p) => ({
                        ...p,
                        flexSpace: {
                          ...p.flexSpace,
                          slots: p.flexSpace.slots.filter((s) => s !== slot)
                        }
                      }), `Removed Flex slot "${slot}"`)
                    }
                    className="text-rose-600 hover:text-rose-800 cursor-pointer font-black text-sm"
                    title={`Remove ${slot}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Card 3: Community Flex Form Builder */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-display text-base font-black text-slate-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#5A1E65]" />
                Community Flex Form Fields & Labels
              </h4>
              <p className="text-xs text-slate-500">
                Customize the reservation form title, submission button, and interactive input fields.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Form Heading Title
                </label>
                <input
                  type="text"
                  value={flexSchema.title || ''}
                  onChange={(e) => updateFlexSchema({ title: e.target.value })}
                  placeholder="Reserve a Flex Space Slot"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submit Button Label
                </label>
                <input
                  type="text"
                  value={flexSchema.submitLabel || ''}
                  onChange={(e) => updateFlexSchema({ submitLabel: e.target.value })}
                  placeholder="Book Flex Space Slot"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Form Input Fields ({flexSchema.fields?.length || 0})
              </h5>

              {(flexSchema.fields || []).map((field, idx) => (
                <div
                  key={field.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateFlexField(idx, { label: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900"
                        placeholder="Field Label"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateFlexField(idx, { type: e.target.value })}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="number">Number</option>
                        <option value="url">URL</option>
                        <option value="textarea">Long Text</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(field.required)}
                          onChange={(e) => updateFlexField(idx, { required: e.target.checked })}
                          className="accent-[#5A1E65]"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => moveFlexField(idx, -1)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFlexField(idx, 1)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFlexField(idx)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {field.type === 'select' ? (
                    <input
                      type="text"
                      value={(field.options || []).join(', ')}
                      onChange={(e) =>
                        updateFlexField(idx, {
                          options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                      placeholder="Comma-separated dropdown options..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateFlexField(idx, { placeholder: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                      placeholder="Placeholder hint text..."
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Add New Field to Flex Form */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={newFlexFieldLabel}
                onChange={(e) => setNewFlexFieldLabel(e.target.value)}
                placeholder="New field label (e.g., Equipment Needed, Organization Website)..."
                className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900"
              />
              <select
                value={newFlexFieldType}
                onChange={(e) => setNewFlexFieldType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-800"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="number">Number</option>
                <option value="url">URL</option>
                <option value="textarea">Long Text</option>
                <option value="select">Dropdown</option>
              </select>
              <button
                type="button"
                onClick={handleAddFlexField}
                className="px-4 py-2 rounded-xl bg-[#5A1E65] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:bg-purple-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field to Flex Form</span>
              </button>
            </div>
          </div>

          {/* Card 4: Live Availability Mode & Hours */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-display text-base font-black text-slate-950 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#5A1E65]" />
                Live Availability Mode & Operating Hours
              </h4>
              <p className="text-xs text-slate-500">
                Automated opening hours or manual override for holidays and special closures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Availability Mode
                </label>
                <select
                  value={features.flexSpace.manualStatus || 'auto'}
                  onChange={(e) =>
                    updateFeatures((p) => ({
                      ...p,
                      flexSpace: { ...p.flexSpace, manualStatus: e.target.value }
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                >
                  <option value="auto">Automated Schedule (Follows Timings)</option>
                  <option value="available">Override: Available Now</option>
                  <option value="occupied">Override: Currently Occupied</option>
                  <option value="closed">Override: Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auto Open Time
                </label>
                <input
                  type="time"
                  value={features.flexSpace.autoHours?.openTime || '13:00'}
                  onChange={(e) =>
                    updateFeatures((p) => ({
                      ...p,
                      flexSpace: {
                        ...p.flexSpace,
                        autoHours: { ...p.flexSpace.autoHours, openTime: e.target.value }
                      }
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auto Close Time
                </label>
                <input
                  type="time"
                  value={features.flexSpace.autoHours?.closeTime || '17:00'}
                  onChange={(e) =>
                    updateFeatures((p) => ({
                      ...p,
                      flexSpace: {
                        ...p.flexSpace,
                        autoHours: { ...p.flexSpace.autoHours, closeTime: e.target.value }
                      }
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Automated Operating Days
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map(({ day, label }) => {
                  const active = (features.flexSpace.autoHours?.days || []).includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const prevDays = features.flexSpace.autoHours?.days || [];
                        const nextDays = active
                          ? prevDays.filter((d) => d !== day)
                          : [...prevDays, day].sort();
                        updateFeatures((p) => ({
                          ...p,
                          flexSpace: {
                            ...p.flexSpace,
                            autoHours: { ...p.flexSpace.autoHours, days: nextDays }
                          }
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        active
                          ? 'bg-[#5A1E65] text-white border-[#5A1E65]'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 5: Booked Reservations */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Booked Flex Space Slots ({features.flexSpace.bookings?.length || 0})
              </h4>
              {(features.flexSpace.bookings || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Delete all ${features.flexSpace.bookings.length} Flex Space booked slots?`)) return;
                    updateFeatures((p) => ({
                      ...p,
                      flexSpace: { ...p.flexSpace, bookings: [] }
                    }), 'Cleared all Flex Space booked slots');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete All ({features.flexSpace.bookings.length})</span>
                </button>
              )}
            </div>

            {(features.flexSpace.bookings || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl">
                No Flex Space reservations recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {features.flexSpace.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-black text-slate-900">
                        {b.date} · {b.slot}
                      </span>
                      <span className="text-slate-600 ml-2">
                        — {b.name} ({b.email || b.phone}) · {b.purpose}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Delete booking for ${b.name || 'visitor'} on ${b.date} (${b.slot}) and release the slot?`)) return;
                        updateFeatures((p) => ({
                          ...p,
                          flexSpace: {
                            ...p.flexSpace,
                            bookings: p.flexSpace.bookings.filter((x) => x.id !== b.id)
                          }
                        }), `Deleted booking & released slot ${b.date} (${b.slot})`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete / Release Slot</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. HIV SCREENING SLOT QUOTAS & FULL ADMIN CONTROL */}
      {subTab === 'hiv' && (() => {
        const hivCfg = features.hivScreening || {};
        const hivBookings = Array.isArray(hivCfg.bookings) ? hivCfg.bookings : [];
        const hivSlots = Array.isArray(hivCfg.slots) ? hivCfg.slots : [];
        const closedSlotsSet = new Set(Array.isArray(hivCfg.closedSlots) ? hivCfg.closedSlots : []);
        const isGloballyClosed = hivCfg.bookingStatus === 'closed';
        const allowedDates = Array.isArray(hivCfg.allowedDates) ? hivCfg.allowedDates : [];
        const blockedDates = Array.isArray(hivCfg.blockedDates) ? hivCfg.blockedDates : [];

        const bookingDates = Array.from(new Set(hivBookings.map((b) => b.date).filter(Boolean))).sort();
        const filteredHivBookings = hivBookings.filter((b) => {
          const matchesDate = hivDateFilter === 'all' || b.date === hivDateFilter;
          const matchesSlot = hivSlotFilter === 'all' || b.slot === hivSlotFilter;
          const bStatus = b.status || 'confirmed';
          const matchesStatus = hivStatusFilter === 'all' || bStatus === hivStatusFilter;
          const q = hivSearchQuery.trim().toLowerCase();
          const matchesSearch = !q || [
            b.name,
            b.contact,
            b.email,
            b.phone,
            b.service,
            b.notes,
            b.date,
            b.slot,
            b.id
          ].some((v) => String(v || '').toLowerCase().includes(q));
          return matchesDate && matchesSlot && matchesStatus && matchesSearch;
        });

        const previewAvailability = getSlotAvailability('hiv', hivPreviewDate, features);

        const handleExportHivCsv = () => {
          const rowsToExport = filteredHivBookings;
          const escapeCsv = (val) => {
            const str = String(val ?? '');
            return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
          };
          const headers = [
            'Booking ID',
            'Date',
            'Time Slot',
            'Client Name',
            'Contact',
            'Service',
            'Preferred Language',
            'Notes',
            'Status',
            'Booked At'
          ];
          const csvLines = [
            headers.map(escapeCsv).join(','),
            ...rowsToExport.map((b) => [
              b.id || '',
              b.date || '',
              b.slot || '',
              b.name || 'Confidential Client',
              b.contact || b.email || b.phone || '',
              b.service || 'HIV/STI Screening',
              b.preferredLanguage || '',
              b.notes || '',
              b.status || 'confirmed',
              b.createdAt || ''
            ].map(escapeCsv).join(','))
          ];
          const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `dcvc-hiv-screening-slots-${getTodayIso()}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setSavedBanner(`Exported ${rowsToExport.length} HIV screening slot(s) to CSV`);
          setTimeout(() => setSavedBanner(''), 3000);
        };

        return (
          <div className="space-y-6">
            {/* Card 1: Global Booking Status & Slot Capacity */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-display text-xl font-black text-slate-950">HIV Screening Limited-Slot Control</h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Full control over appointment capacity, time window open/close status, clinic dates, CSV export, and confidential reservations.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold border inline-flex items-center gap-1.5 ${
                    isGloballyClosed
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {isGloballyClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {isGloballyClosed ? 'Bookings Closed' : 'Bookings Open'}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateFeatures((p) => ({
                        ...p,
                        hivScreening: {
                          ...p.hivScreening,
                          bookingStatus: isGloballyClosed ? 'open' : 'closed'
                        }
                      }), isGloballyClosed ? 'Reopened HIV screening slot bookings' : 'Closed all HIV screening slot bookings')
                    }
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isGloballyClosed
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {isGloballyClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isGloballyClosed ? 'Reopen Bookings' : 'Close All Slots'}</span>
                  </button>
                </div>
              </div>

              {isGloballyClosed && (
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <label className="block text-xs font-bold text-rose-900">
                    Public Notice Shown When Bookings Are Closed
                  </label>
                  <input
                    type="text"
                    value={hivCfg.closedMessage || ''}
                    onChange={(e) =>
                      updateFeatures((p) => ({
                        ...p,
                        hivScreening: { ...p.hivScreening, closedMessage: e.target.value }
                      }))
                    }
                    placeholder="Online HIV/STI screening bookings are currently closed..."
                    className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-xs text-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Slots Per Time Window</label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={hivCfg.slotCapacity || 4}
                    onChange={(e) => updateFeatures((p) => ({
                      ...p,
                      hivScreening: { ...p.hivScreening, slotCapacity: Math.max(1, Number(e.target.value || 1)) }
                    }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Add Time Window</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSlotText}
                      onChange={(e) => setNewSlotText(e.target.value)}
                      placeholder="e.g., 5:00 PM – 6:00 PM"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newSlotText.trim();
                        if (!val || hivSlots.includes(val)) return;
                        updateFeatures((p) => ({
                          ...p,
                          hivScreening: { ...p.hivScreening, slots: [...(p.hivScreening.slots || []), val] }
                        }), `Added time window ${val}`);
                        setNewSlotText('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#5A1E65] text-white text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Windows with individual Open / Close toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Time Windows (Toggle Individual Window Open / Closed or Remove)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {hivSlots.map((slot) => {
                    const isSlotClosed = closedSlotsSet.has(slot);
                    return (
                      <div
                        key={slot}
                        className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-bold ${
                          isSlotClosed
                            ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                            : 'bg-purple-50/70 border-purple-200 text-[#5A1E65]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{slot}</span>
                          {isSlotClosed && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                              Closed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              updateFeatures((p) => {
                                const currentClosed = Array.isArray(p.hivScreening.closedSlots) ? p.hivScreening.closedSlots : [];
                                const nextClosed = currentClosed.includes(slot)
                                  ? currentClosed.filter((s) => s !== slot)
                                  : [...currentClosed, slot];
                                return {
                                  ...p,
                                  hivScreening: { ...p.hivScreening, closedSlots: nextClosed }
                                };
                              }, isSlotClosed ? `Opened slot ${slot}` : `Closed slot ${slot}`)
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                              isSlotClosed
                                ? 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            {isSlotClosed ? 'Open' : 'Close'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm(`Remove time window "${slot}"?`)) return;
                              updateFeatures((p) => ({
                                ...p,
                                hivScreening: {
                                  ...p.hivScreening,
                                  slots: (p.hivScreening.slots || []).filter((s) => s !== slot),
                                  closedSlots: (p.hivScreening.closedSlots || []).filter((s) => s !== slot)
                                }
                              }), `Removed time window ${slot}`);
                            }}
                            title={`Remove ${slot}`}
                            className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 2: Clinic Date Overrides & Live Slot Capacity Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Date Overrides */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div>
                  <h4 className="font-display text-base font-black text-slate-950 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#5A1E65]" />
                    Clinic Date Overrides
                  </h4>
                  <p className="text-xs text-slate-600">
                    Default schedule is the 1st Monday of each month. Open extra clinic dates or block specific dates.
                  </p>
                </div>

                {/* Extra Open Dates */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Open Extra Clinic Date</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={hivExtraDateInput}
                      onChange={(e) => setHivExtraDateInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!hivExtraDateInput || allowedDates.includes(hivExtraDateInput)) return;
                        updateFeatures((p) => ({
                          ...p,
                          hivScreening: {
                            ...p.hivScreening,
                            allowedDates: [...(p.hivScreening.allowedDates || []), hivExtraDateInput].sort(),
                            blockedDates: (p.hivScreening.blockedDates || []).filter((d) => d !== hivExtraDateInput)
                          }
                        }), `Opened extra clinic date ${hivExtraDateInput}`);
                        setHivExtraDateInput('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Open Date
                    </button>
                  </div>
                  {allowedDates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {allowedDates.map((d) => (
                        <span key={d} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                          {d}
                          <button
                            type="button"
                            onClick={() =>
                              updateFeatures((p) => ({
                                ...p,
                                hivScreening: {
                                  ...p.hivScreening,
                                  allowedDates: (p.hivScreening.allowedDates || []).filter((x) => x !== d)
                                }
                              }))
                            }
                            className="text-emerald-700 hover:text-rose-700 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Block Specific Dates */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">Block / Close Specific Date</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={hivBlockedDateInput}
                      onChange={(e) => setHivBlockedDateInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!hivBlockedDateInput || blockedDates.includes(hivBlockedDateInput)) return;
                        updateFeatures((p) => ({
                          ...p,
                          hivScreening: {
                            ...p.hivScreening,
                            blockedDates: [...(p.hivScreening.blockedDates || []), hivBlockedDateInput].sort(),
                            allowedDates: (p.hivScreening.allowedDates || []).filter((d) => d !== hivBlockedDateInput)
                          }
                        }), `Blocked clinic date ${hivBlockedDateInput}`);
                        setHivBlockedDateInput('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Block Date
                    </button>
                  </div>
                  {blockedDates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {blockedDates.map((d) => (
                        <span key={d} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800">
                          {d}
                          <button
                            type="button"
                            onClick={() =>
                              updateFeatures((p) => ({
                                ...p,
                                hivScreening: {
                                  ...p.hivScreening,
                                  blockedDates: (p.hivScreening.blockedDates || []).filter((x) => x !== d)
                                }
                              }))
                            }
                            className="text-rose-700 hover:text-slate-900 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Slot Availability Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display text-base font-black text-slate-950">Live Slot Capacity Overview</h4>
                    <p className="text-xs text-slate-600">Inspect remaining capacity for any clinic date.</p>
                  </div>
                  <input
                    type="date"
                    value={hivPreviewDate}
                    onChange={(e) => setHivPreviewDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                  />
                </div>

                {upcomingHivDates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {upcomingHivDates.slice(0, 4).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setHivPreviewDate(d)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${
                          hivPreviewDate === d
                            ? 'bg-[#5A1E65] text-white border-[#5A1E65]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {previewAvailability.map((s) => (
                    <div
                      key={s.slot}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-900">{s.slot}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-semibold">
                          {s.bookedCount} / {s.capacity} booked
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          s.isClosed
                            ? 'bg-rose-100 text-rose-800'
                            : s.isFull
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.isClosed ? 'Closed' : s.isFull ? 'Full' : `${s.remaining} left`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: Detailed View of Confidential Slot Reservations + Export CSV */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="font-display text-lg font-black text-slate-950">
                    Confidential Slot Reservations ({filteredHivBookings.length} of {hivBookings.length})
                  </h4>
                  <p className="text-xs text-slate-600">
                    Inspect full client details, update appointment status, release slots, or export to CSV.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportHivCsv}
                    disabled={filteredHivBookings.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 disabled:opacity-45 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV ({filteredHivBookings.length})</span>
                  </button>

                  {hivBookings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Delete all ${hivBookings.length} HIV screening reservations? This cannot be undone.`)) return;
                        updateFeatures((p) => ({
                          ...p,
                          hivScreening: { ...p.hivScreening, bookings: [] }
                        }), 'Cleared all HIV screening reservations');
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={hivSearchQuery}
                    onChange={(e) => setHivSearchQuery(e.target.value)}
                    placeholder="Search name, contact, service..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <select
                  value={hivDateFilter}
                  onChange={(e) => setHivDateFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="all">All Dates ({bookingDates.length})</option>
                  {bookingDates.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={hivSlotFilter}
                  onChange={(e) => setHivSlotFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="all">All Time Windows</option>
                  {hivSlots.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={hivStatusFilter}
                  onChange={(e) => setHivStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {filteredHivBookings.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  {hivBookings.length === 0
                    ? 'No HIV / STI screening reservations recorded yet.'
                    : 'No reservations match your current search or filters.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {filteredHivBookings.map((b) => {
                    const isExpanded = expandedBookingId === b.id;
                    const bStatus = b.status || 'confirmed';
                    const statusBadge =
                      bStatus === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : bStatus === 'cancelled'
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-purple-100 text-[#5A1E65] border-purple-200';

                    return (
                      <div
                        key={b.id}
                        className="rounded-2xl bg-slate-50/80 border border-slate-200 overflow-hidden transition-all"
                      >
                        <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-slate-950">
                                {b.date} · {b.slot}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusBadge}`}>
                                {bStatus}
                              </span>
                            </div>
                            <div className="text-slate-700 font-medium truncate">
                              {b.name || 'Confidential Client'} ({b.contact || b.email || b.phone || 'Confidential'}) · {b.service || 'HIV/STI Screening'}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 text-[#5A1E65] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (!window.confirm(`Release screening slot for ${b.name || 'Confidential Client'} on ${b.date} (${b.slot})?`)) return;
                                updateFeatures((p) => ({
                                  ...p,
                                  hivScreening: {
                                    ...p.hivScreening,
                                    bookings: (p.hivScreening.bookings || []).filter((x) => x.id !== b.id)
                                  }
                                }), `Released screening slot ${b.date} (${b.slot})`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Release Slot</span>
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 py-3.5 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Client Name</span>
                              <span className="font-bold text-slate-900">{b.name || 'Confidential Client'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Contact Info</span>
                              <span className="font-semibold text-slate-800">{b.contact || b.email || b.phone || 'Confidential'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Requested Service</span>
                              <span className="font-semibold text-slate-800">{b.service || 'HIV/STI Screening'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preferred Language</span>
                              <span className="font-semibold text-slate-800">{b.preferredLanguage || 'English / Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Booked At</span>
                              <span className="font-mono text-[11px] text-slate-700">
                                {b.createdAt ? new Date(b.createdAt).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Appointment Status</span>
                              <select
                                value={bStatus}
                                onChange={(e) => {
                                  const nextStatus = e.target.value;
                                  updateFeatures((p) => ({
                                    ...p,
                                    hivScreening: {
                                      ...p.hivScreening,
                                      bookings: (p.hivScreening.bookings || []).map((x) =>
                                        x.id === b.id ? { ...x, status: nextStatus } : x
                                      )
                                    }
                                  }), `Updated slot status to ${nextStatus}`);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled (frees slot)</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Notes &amp; Booking ID</span>
                              <p className="text-slate-700 mt-0.5">{b.notes || 'No additional notes provided.'}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {b.id}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 4. AUTO BROADCAST POPUPS */}
      {subTab === 'broadcast' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-display text-xl font-black text-slate-950">Auto Broadcast Popups</h3>
            <p className="text-xs text-slate-600 font-medium">
              Automatically alert visitors when an event is happening today, or publish a custom live popup message.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(features.broadcastPopup.enabled)}
                onChange={(e) => updateFeatures((p) => ({
                  ...p,
                  broadcastPopup: { ...p.broadcastPopup, enabled: e.target.checked }
                }))}
                className="accent-[#5A1E65] w-4 h-4"
              />
              Enable Broadcast Popups Sitewide
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(features.broadcastPopup.autoDetectTodayEvents)}
                onChange={(e) => updateFeatures((p) => ({
                  ...p,
                  broadcastPopup: { ...p.broadcastPopup, autoDetectTodayEvents: e.target.checked }
                }))}
                className="accent-[#5A1E65] w-4 h-4"
              />
              Auto-Popup Today&apos;s Scheduled Events
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(features.broadcastPopup.customEnabled)}
                onChange={(e) => updateFeatures((p) => ({
                  ...p,
                  broadcastPopup: { ...p.broadcastPopup, customEnabled: e.target.checked }
                }))}
                className="accent-[#5A1E65] w-4 h-4"
              />
              Override With Custom Broadcast Message
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Custom Popup Title</label>
              <input
                type="text"
                value={features.broadcastPopup.customTitle || ''}
                onChange={(e) => updateFeatures((p) => ({
                  ...p,
                  broadcastPopup: { ...p.broadcastPopup, customTitle: e.target.value }
                }))}
                placeholder="e.g., Pride Prom Tonight at 6:00 PM!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Label & Link</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={features.broadcastPopup.customCtaLabel || ''}
                  onChange={(e) => updateFeatures((p) => ({
                    ...p,
                    broadcastPopup: { ...p.broadcastPopup, customCtaLabel: e.target.value }
                  }))}
                  placeholder="View Details"
                  className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
                <input
                  type="text"
                  value={features.broadcastPopup.customCtaUrl || ''}
                  onChange={(e) => updateFeatures((p) => ({
                    ...p,
                    broadcastPopup: { ...p.broadcastPopup, customCtaUrl: e.target.value }
                  }))}
                  placeholder="/events"
                  className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Popup Display Style (Sentence Length Strategy)
              </label>
              <select
                value={features.broadcastPopup.style || 'auto'}
                onChange={(e) => updateFeatures((p) => ({
                  ...p,
                  broadcastPopup: { ...p.broadcastPopup, style: e.target.value }
                }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
              >
                <option value="auto">Auto (Smart based on sentence length)</option>
                <option value="sliding_slides">Auto-Sliding Multi-Sentence Carousel (Character-limited slides)</option>
                <option value="ticker">Smooth Horizontal Ticker Ribbon (Continuous marquee)</option>
                <option value="compact">Compact Truncated with "Read More" Modal</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Guarantees height never increases on mobile or laptop regardless of sentence length.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Characters Per Slide (for Auto-Sliding)
              </label>
              <input
                type="number"
                min={35}
                max={100}
                value={features.broadcastPopup.maxCharsPerSlide || 58}
                onChange={(e) => updateFeatures((p) => ({
                  ...p,
                  broadcastPopup: { ...p.broadcastPopup, maxCharsPerSlide: Number(e.target.value) || 58 }
                }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Recommended: 50–65 characters. Automatically breaks long paragraphs into smooth, readable slides.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Custom Popup Message</label>
            <textarea
              rows={2}
              value={features.broadcastPopup.customMessage || ''}
              onChange={(e) => updateFeatures((p) => ({
                ...p,
                broadcastPopup: { ...p.broadcastPopup, customMessage: e.target.value }
              }))}
              placeholder="Write a live announcement for visitors (any length sentence — height will stay strictly uniform)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
            />
          </div>
        </div>
      )}

      {/* 5. LUNA AI KNOWLEDGE & LEARNING STUDIO */}
      {subTab === 'luna' && <LunaLearningStudio />}
    </div>
  );
}

