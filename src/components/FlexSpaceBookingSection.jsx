import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, MapPin, AlertCircle, Users } from 'lucide-react';
import {
  getSiteFeatures,
  subscribeToSiteFeatures,
  computeFlexSpaceStatus,
  getSlotAvailability,
  bookTimeSlot
} from '../services/siteFeaturesStore';
import { submitInquiry } from '../services/api';

function getTodayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Section #11: Flex Space (replaces workspace segment)
 * Live status + automated timings + full slot booking system + Admin-configurable form fields.
 */
export default function FlexSpaceBookingSection({ props = {}, style = {} }) {
  const [features, setFeatures] = useState(getSiteFeatures);
  const [selectedDate, setSelectedDate] = useState(getTodayIso);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formValues, setFormValues] = useState({});
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    return subscribeToSiteFeatures((next) => setFeatures(next));
  }, []);

  const flexCfg = features.flexSpace;
  const schema = features.formSchemas?.flex_space;
  const liveStatus = computeFlexSpaceStatus(flexCfg);
  const slots = getSlotAvailability('flex', selectedDate, features);

  const handleFieldChange = (id, val) => {
    setFormValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!selectedSlot) {
      setStatusMsg({ ok: false, text: 'Please select an available Flex Space time slot.' });
      return;
    }

    const res = bookTimeSlot('flex', {
      date: selectedDate,
      slot: selectedSlot,
      name: formValues.name || '',
      email: formValues.email || '',
      phone: formValues.phone || '',
      purpose: formValues.purpose || '',
      notes: JSON.stringify(formValues)
    });

    if (!res.ok) {
      setStatusMsg({ ok: false, text: res.error });
      return;
    }

    submitInquiry({
      type: 'flex_space',
      name: formValues.name || 'Flex Space Visitor',
      email: formValues.email || 'info@diversitycollective.org',
      phone: formValues.phone || '',
      subject: `Community Flex Space Booking: ${selectedDate} (${selectedSlot})`,
      message: `Reserved slot: ${selectedDate} @ ${selectedSlot}\nPurpose: ${formValues.purpose || 'Community session'}\nDetails: ${JSON.stringify(formValues, null, 2)}`
    }).catch(() => {});

    setStatusMsg({
      ok: true,
      text: `Flex Space reserved for ${selectedDate} (${selectedSlot}). Confirmation logged with DCVC!`
    });
    setSelectedSlot('');
    setFormValues({});
  };

  return (
    <section
      id="flex-space"
      style={style}
      className="py-14 md:py-20 bg-gradient-to-b from-slate-50 via-purple-50/40 to-white border-b border-purple-200/60 relative overflow-hidden"
    >
      <div className="container-clean">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Live Status & Automated Timings */}
          <div className="lg:col-span-5 space-y-5">
            <span className="glass-pill">
              {props.eyebrow || 'FLEX SPACE · SLOT BOOKING'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 leading-tight">
              {flexCfg?.title || props.headline || 'Community Flex Space at 2471 Portola Rd'}
            </h2>
            <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed">
              {flexCfg?.description || props.description}
            </p>

            {/* Live Availability Badge */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                liveStatus.isAvailable
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                  liveStatus.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div className="space-y-1">
                <p className="font-extrabold text-sm">{liveStatus.label}</p>
                <p className="text-xs font-medium opacity-90 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Automated Hours: {flexCfg.autoHours?.openTime || '13:00'} – {flexCfg.autoHours?.closeTime || '17:00'} (Mon–Fri)
                </p>
                <p className="text-xs font-medium opacity-90 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  2471 Portola Road, Suite 100, Ventura
                </p>
              </div>
            </div>
          </div>

          {/* Right: Interactive Slot Picker & Booking Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-purple-200/80 shadow-md p-4 sm:p-8 space-y-5 min-w-0 max-w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-xl font-black text-slate-950">
                  {schema?.title || 'Reserve a Flex Space Slot'}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Select a date and available time window below.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#5A1E65] border border-purple-200">
                <Users className="w-3.5 h-3.5" /> Real-Time Slots
              </span>
            </div>

            {statusMsg && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-2.5 ${
                  statusMsg.ok
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {statusMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#5A1E65]" /> Select Date *
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-[#5A1E65] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Available Time Slots *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        disabled={s.isFull}
                        onClick={() => setSelectedSlot(s.slot)}
                        className={`px-2.5 py-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          selectedSlot === s.slot
                            ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-sm'
                            : s.isFull
                              ? 'bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-purple-400'
                        }`}
                      >
                        <div className="truncate">{s.slot}</div>
                        <div className={`text-[10px] font-semibold ${selectedSlot === s.slot ? 'text-amber-200' : s.isFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {s.isFull ? 'Booked' : `${s.remaining} slot left`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(schema?.fields || []).map((field) => (
                  <div key={field.id} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {field.label} {field.required ? '*' : ''}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:border-[#5A1E65] outline-none"
                      >
                        <option value="">Select...</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        rows={2}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#5A1E65] outline-none"
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#5A1E65] outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {schema?.submitLabel || props.ctaText || 'Book Flex Space Slot'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

