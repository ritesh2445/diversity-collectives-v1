import React, { useEffect, useState } from 'react';
import {
  DEFAULT_FORM_SCHEMAS,
  getSiteFeatures,
  subscribeToSiteFeatures
} from '../services/siteFeaturesStore';
import { fetchAndApplyLiveSiteState } from '../services/liveSync';

/**
 * Subscribe to a live, Admin-editable form schema by ID and refresh on mount/focus.
 */
export function useLiveFormSchema(formId) {
  const [features, setFeatures] = useState(getSiteFeatures);

  useEffect(() => {
    const unsub = subscribeToSiteFeatures((next) => setFeatures(next));
    fetchAndApplyLiveSiteState({ force: true }).catch(() => {});
    return unsub;
  }, [formId]);

  const fallback = DEFAULT_FORM_SCHEMAS[formId] || { title: '', description: '', submitLabel: 'Submit', fields: [] };
  return features?.formSchemas?.[formId] || fallback;
}

/**
 * Build initial form state object from schema field definitions and optional overrides.
 */
export function buildInitialValues(fields = [], overrides = {}) {
  const initial = {};
  for (const field of fields) {
    if (!field?.id) continue;
    if (overrides[field.id] !== undefined) {
      initial[field.id] = overrides[field.id];
    } else if (field.type === 'checkbox') {
      initial[field.id] = Boolean(field.defaultValue);
    } else if (field.type === 'checkbox_group') {
      initial[field.id] = Array.isArray(field.defaultValue) ? [...field.defaultValue] : [];
    } else {
      initial[field.id] = field.defaultValue !== undefined ? String(field.defaultValue) : '';
    }
  }
  return { ...initial, ...overrides };
}

/**
 * Toggle a single option inside a checkbox_group array field.
 */
export function toggleCheckboxGroupValue(currentList, option) {
  const arr = Array.isArray(currentList) ? currentList : [];
  return arr.includes(option) ? arr.filter((item) => item !== option) : [...arr, option];
}

/**
 * Validate required dynamic schema fields and return first human-readable error if invalid.
 */
export function validateSchemaFields(fields = [], values = {}) {
  for (const field of fields) {
    if (!field?.required) continue;
    const val = values[field.id];
    if (field.type === 'checkbox') {
      if (!val) return `Please confirm "${field.label}".`;
    } else if (field.type === 'checkbox_group') {
      if (!Array.isArray(val) || val.length === 0) return `Please select at least one option for "${field.label}".`;
    } else if (!String(val || '').trim()) {
      return `Please complete "${field.label}".`;
    }
  }
  return null;
}

/**
 * Format any custom Admin-added fields (outside standard API fields) so submissions always retain their answers.
 */
export function formatCustomFieldsSummary(fields = [], values = {}, standardFieldIds = []) {
  const standardSet = new Set(standardFieldIds);
  const lines = [];
  for (const field of fields) {
    if (!field?.id || standardSet.has(field.id)) continue;
    const rawVal = values[field.id];
    if (Array.isArray(rawVal)) {
      if (rawVal.length > 0) lines.push(`${field.label}: ${rawVal.join(', ')}`);
    } else if (typeof rawVal === 'boolean') {
      if (rawVal) lines.push(`${field.label}: Yes`);
    } else if (rawVal !== undefined && String(rawVal).trim()) {
      lines.push(`${field.label}: ${String(rawVal).trim()}`);
    }
  }
  return lines.join('\n');
}

/**
 * Renders an Admin-configured form schema identically across public site pages.
 */
export default function DynamicSchemaFields({
  formId = 'form',
  fields = [],
  values = {},
  onChange,
  onToggleOption,
  renderAfterField,
  renderCustomField,
  inputClassName = 'w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white text-slate-900',
  labelClassName = 'text-xs font-bold uppercase tracking-wider text-slate-800',
  accentRingClass = 'border-[#5A1E65] bg-purple-50 text-[#5A1E65] font-bold',
  idleOptionClass = 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {(fields || []).map((field) => {
        const isFullWidth =
          field.grid === 'full' ||
          field.type === 'textarea' ||
          field.type === 'checkbox_group' ||
          field.type === 'checkbox';
        const colSpanClass = isFullWidth ? 'sm:col-span-2' : 'sm:col-span-1';
        const inputId = `${formId}-field-${field.id}`;
        const rawVal = values[field.id];

        if (typeof renderCustomField === 'function') {
          const customRendered = renderCustomField(field, { colSpanClass, inputId, value: rawVal });
          if (customRendered !== undefined && customRendered !== null) {
            return (
              <React.Fragment key={field.id}>
                {customRendered}
                {typeof renderAfterField === 'function' ? renderAfterField(field, colSpanClass) : null}
              </React.Fragment>
            );
          }
        }

        return (
          <React.Fragment key={field.id}>
            <div className={`${colSpanClass} space-y-1.5`}>
              {field.type === 'checkbox' ? (
                <label
                  htmlFor={inputId}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50/40 cursor-pointer transition-colors"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    required={Boolean(field.required)}
                    checked={Boolean(rawVal)}
                    onChange={(e) => onChange(field.id, e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65] accent-[#5A1E65] cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-snug">
                    <span>
                      {field.label} {field.required && <span className="text-rose-600">*</span>}
                    </span>
                    {field.helperText && (
                      <span className="block text-[11px] font-normal text-slate-600 mt-1">{field.helperText}</span>
                    )}
                  </span>
                </label>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={inputId} className={labelClassName}>
                      {field.label} {field.required && <span className="text-rose-600">*</span>}
                    </label>
                    {field.badge && (
                      <span className="text-[10px] text-purple-700 font-semibold normal-case shrink-0">
                        {field.badge}
                      </span>
                    )}
                  </div>

                  {field.type === 'select' ? (
                    <select
                      id={inputId}
                      required={Boolean(field.required)}
                      value={rawVal || ''}
                      onChange={(e) => onChange(field.id, e.target.value)}
                      className={`${inputClassName} font-medium`}
                    >
                      <option value="">Select {field.label}...</option>
                      {(field.options || []).map((opt) => {
                        const val = typeof opt === 'object' && opt !== null ? String(opt.value ?? opt.label ?? '') : String(opt || '');
                        const lbl = typeof opt === 'object' && opt !== null ? String(opt.label ?? opt.value ?? '') : String(opt || '');
                        return (
                          <option key={val} value={val}>
                            {lbl}
                          </option>
                        );
                      })}
                    </select>
                  ) : field.type === 'checkbox_group' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {(field.options || []).map((opt) => {
                        const optionLabel = typeof opt === 'object' && opt !== null ? String(opt.label ?? opt.value ?? '') : String(opt || '');
                        const selected = Array.isArray(rawVal) && rawVal.includes(optionLabel);
                        return (
                          <label
                            key={optionLabel}
                            className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-start gap-2.5 ${
                              selected ? accentRingClass : idleOptionClass
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                onToggleOption
                                  ? onToggleOption(field.id, optionLabel)
                                  : onChange(field.id, toggleCheckboxGroupValue(rawVal, optionLabel))
                              }
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65] accent-[#5A1E65] shrink-0"
                            />
                            <span className="leading-snug">{optionLabel}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      id={inputId}
                      rows={4}
                      required={Boolean(field.required)}
                      placeholder={field.placeholder || ''}
                      value={rawVal || ''}
                      onChange={(e) => onChange(field.id, e.target.value)}
                      className={`${inputClassName} resize-y`}
                    />
                  ) : (
                    <input
                      id={inputId}
                      type={field.type || 'text'}
                      required={Boolean(field.required)}
                      min={field.type === 'number' ? '1' : undefined}
                      placeholder={field.placeholder || ''}
                      value={rawVal || ''}
                      onChange={(e) => onChange(field.id, e.target.value)}
                      className={inputClassName}
                    />
                  )}

                  {field.helperText && (
                    <p className="text-[11px] text-slate-500">{field.helperText}</p>
                  )}
                </>
              )}
            </div>
            {typeof renderAfterField === 'function' ? renderAfterField(field, colSpanClass) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
