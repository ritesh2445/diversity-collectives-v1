import React, { useEffect, useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import LunaLearningStudio from './LunaLearningStudio.jsx';
import {
  getSiteFeatures,
  saveSiteFeatures,
  subscribeToSiteFeatures,
  computeFlexSpaceStatus,
  DEFAULT_FORM_SCHEMAS
} from '../../services/siteFeaturesStore';

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
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Booked Flex Space Slots ({features.flexSpace.bookings?.length || 0})
            </h4>

            {(features.flexSpace.bookings || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl">
                No Flex Space reservations recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {features.flexSpace.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
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
                      onClick={() =>
                        updateFeatures((p) => ({
                          ...p,
                          flexSpace: {
                            ...p.flexSpace,
                            bookings: p.flexSpace.bookings.filter((x) => x.id !== b.id)
                          }
                        }), `Released slot ${b.date} (${b.slot})`)
                      }
                      className="text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      Release Slot
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. HIV SCREENING SLOT QUOTAS */}
      {subTab === 'hiv' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-display text-xl font-black text-slate-950">HIV Screening Limited-Slot Control</h3>
            <p className="text-xs text-slate-600 font-medium">
              Set maximum appointments per time window and manage confidential slot reservations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Slots Per Time Window</label>
              <input
                type="number"
                min={1}
                max={25}
                value={features.hivScreening.slotCapacity || 3}
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
                    if (!newSlotText.trim()) return;
                    updateFeatures((p) => ({
                      ...p,
                      hivScreening: { ...p.hivScreening, slots: [...(p.hivScreening.slots || []), newSlotText.trim()] }
                    }));
                    setNewSlotText('');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#5A1E65] text-white text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(features.hivScreening.slots || []).map((slot) => (
              <span key={slot} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-[#5A1E65]">
                {slot}
                <button
                  type="button"
                  onClick={() => updateFeatures((p) => ({
                    ...p,
                    hivScreening: { ...p.hivScreening, slots: p.hivScreening.slots.filter((s) => s !== slot) }
                  }))}
                  className="text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Confidential Screening Reservations List */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-display text-sm font-bold text-slate-900 mb-2">
              Confidential Slot Reservations ({features.hivScreening.bookings?.length || 0})
            </h4>
            {(!features.hivScreening.bookings || features.hivScreening.bookings.length === 0) ? (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl">
                No HIV / STI screening reservations recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {features.hivScreening.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-black text-slate-900">
                        {b.date} · {b.slot}
                      </span>
                      <span className="text-slate-600 ml-2">
                        — {b.name} ({b.contact || b.email || b.phone || 'Confidential'}) · {b.service || 'HIV/STI Screening'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateFeatures((p) => ({
                          ...p,
                          hivScreening: {
                            ...p.hivScreening,
                            bookings: p.hivScreening.bookings.filter((x) => x.id !== b.id)
                          }
                        }), `Released screening slot ${b.date} (${b.slot})`)
                      }
                      className="text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      Release Slot
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

