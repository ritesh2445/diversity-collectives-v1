import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitInquiry } from '../services/api';
import TurnstileWidget from '../components/TurnstileWidget';
import { usePageMeta } from '../utils/seo';
import {
  getSiteFeatures,
  subscribeToSiteFeatures,
  getSlotAvailability,
  bookTimeSlot
} from '../services/siteFeaturesStore';

function getTodayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AppointmentBooking() {
  usePageMeta({
    title: 'Schedule Confidential HIV & Wellness Screening',
    description: 'Book a free, confidential rapid HIV/STI screening slot with Diversity SHINES in Ventura County.',
    canonicalPath: '/appointments'
  });

  const [features, setFeatures] = useState(getSiteFeatures);
  const [selectedDate, setSelectedDate] = useState(getTodayIso);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [fieldValues, setFieldValues] = useState({});
  const [confidentialityConsent, setConfidentialityConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    return subscribeToSiteFeatures((next) => setFeatures(next));
  }, []);

  const schema = features.formSchemas?.hiv_screening;
  const slots = getSlotAvailability('hiv', selectedDate, features);
  const totalOpenSlots = slots.reduce((sum, s) => sum + s.remaining, 0);
  const totalCapacity = slots.reduce((sum, s) => sum + s.capacity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSlot) {
      setStatus('error');
      setStatusMsg('Please choose an available screening time slot.');
      return;
    }

    if (!confidentialityConsent) {
      setStatus('error');
      setStatusMsg('Please confirm our confidential appointment agreement.');
      return;
    }

    setStatus('loading');
    const slotResult = bookTimeSlot('hiv', {
      date: selectedDate,
      slot: selectedSlot,
      name: fieldValues.name || 'Confidential Client',
      contact: fieldValues.contact || '',
      service: fieldValues.service || 'Rapid HIV Screening',
      notes: fieldValues.notes || ''
    });

    if (!slotResult.ok) {
      setStatus('error');
      setStatusMsg(slotResult.error);
      return;
    }

    const contactVal = String(fieldValues.contact || '').trim();
    const isEmail = contactVal.includes('@');

    const res = await submitInquiry({
      type: 'appointment',
      name: fieldValues.name || 'Confidential Client',
      email: isEmail ? contactVal : 'confidential-phone@diversitycollective.org',
      phone: isEmail ? '' : contactVal,
      subject: `HIV/Wellness Screening Slot: ${selectedDate} (${selectedSlot})`,
      message: Object.entries(fieldValues)
        .map(([k, v]) => `${k}: ${v}`)
        .concat([`Date: ${selectedDate}`, `Slot: ${selectedSlot}`])
        .join('\n'),
      turnstileToken
    });

    if (res.success) {
      setStatus('success');
      setStatusMsg(`Your confidential slot for ${selectedDate} (${selectedSlot}) is reserved. Our clinical navigation team will confirm discreetly.`);
      setSelectedSlot('');
      setFieldValues({});
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else {
      setStatus('success');
      setStatusMsg(`Your slot for ${selectedDate} (${selectedSlot}) has been reserved locally. If you need immediate confirmation, please call (805) 644-5428.`);
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      <div className="container-clean max-w-3xl">
        <Link
          to="/programs/diversity-shines"
          className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900 mb-8 p-1 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Diversity SHINES</span>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="glass-pill text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border-emerald-200">
              100% Free · Limited Slots
            </span>
            <span className="glass-pill text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-50 border-purple-200">
              Live Slot Availability
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            {schema?.title || 'Confidential HIV & Wellness Screening'}
          </h1>
          <p className="font-serif italic text-base sm:text-lg text-slate-600 mt-3 leading-relaxed">
            {schema?.description || 'Minimal details required. Pick a date and an open time slot below.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#5A1E65] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">Discreet, Protected Center · Limited Slot Booking</span>
              <p className="text-[11px] text-purple-900/90 leading-relaxed mt-0.5">
                We ask only essential details to hold your confidential HIV/STI screening slot at 2471 Portola Road, Suite 100, Ventura.
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-black bg-white border border-purple-200 text-[#5A1E65] shadow-2xs">
            {totalOpenSlots} of {totalCapacity} slots open on {selectedDate}
          </span>
        </div>

        <div className="p-6 sm:p-10 rounded-3xl bg-white border-2 border-slate-200 shadow-xl">
          {status === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl font-black text-slate-900">Screening Slot Reserved!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">{statusMsg}</p>
              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Link to="/programs" className="btn-primary py-2.5 px-6 text-xs font-bold">
                  Explore Free Programs
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setStatusMsg('');
                  }}
                  className="py-2.5 px-5 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Book Another Slot
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              {/* Date & Live Slot Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#5A1E65]" /> Screening Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={getTodayIso()}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#5A1E65]" /> Available Time Slots *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        disabled={s.isFull}
                        onClick={() => setSelectedSlot(s.slot)}
                        className={`px-3 py-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          selectedSlot === s.slot
                            ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-sm'
                            : s.isFull
                              ? 'bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-purple-400'
                        }`}
                      >
                        <div className="truncate">{s.slot}</div>
                        <div className={`text-[10px] font-semibold ${selectedSlot === s.slot ? 'text-amber-200' : s.isFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {s.isFull ? 'Slot Full' : `${s.remaining} of ${s.capacity} slots left`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Minimal Necessary Fields (Editable from Admin Form Builder) */}
              <div className="space-y-4">
                {(schema?.fields || []).map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                      {field.label} {field.required ? '*' : ''}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => setFieldValues((p) => ({ ...p, [field.id]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-purple-600 outline-none"
                      >
                        <option value="">Select an option...</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        rows={2}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => setFieldValues((p) => ({ ...p, [field.id]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-600 outline-none"
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => setFieldValues((p) => ({ ...p, [field.id]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-600 outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confidentialityConsent}
                  onChange={(e) => setConfidentialityConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#5A1E65]"
                />
                <span className="text-xs text-slate-700 font-medium leading-relaxed">
                  I understand this screening reservation is confidential and free of charge through Diversity SHINES.
                </span>
              </label>

              <TurnstileWidget onVerify={setTurnstileToken} />

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#5A1E65] to-purple-800 hover:from-purple-900 hover:to-purple-950 text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Reserving Confidential Slot...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{schema?.submitLabel || 'Confirm Screening Slot'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
