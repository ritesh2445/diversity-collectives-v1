import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, MapPin, AlertCircle, Users, ArrowLeft } from 'lucide-react';
import DynamicSchemaFields from '../components/DynamicSchemaFields';
import BookingCalendarPicker from '../components/BookingCalendarPicker';
import {
  getSiteFeatures,
  subscribeToSiteFeatures,
  computeFlexSpaceStatus,
  getSlotAvailability,
  bookTimeSlot
} from '../services/siteFeaturesStore';
import { fetchAndApplyLiveSiteState } from '../services/liveSync';
import { submitInquiry } from '../services/api';
import {
  getTodayIso,
  isDateAllowedForFlex,
  getUpcomingFlexSpaceDates
} from '../utils/calendarBooking.js';
import { usePageMeta } from '../utils/seo';

export default function FlexSpaceBooking() {
  usePageMeta({
    title: 'Community Flex Space Booking | Diversity Collective Ventura County',
    description: 'Check real-time availability and reserve a private, affirming Community Flex Space time slot at 2471 Portola Road, Suite 100, Ventura.',
    canonicalPath: '/flex-space'
  });

  const [features, setFeatures] = useState(getSiteFeatures);
  const flexCfg = features.flexSpace;
  const initialDate = useMemo(() => {
    const list = getUpcomingFlexSpaceDates(30, flexCfg?.allowedDates, flexCfg?.blockedDates);
    return list[0] || getTodayIso();
  }, [flexCfg]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formValues, setFormValues] = useState({});
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchAndApplyLiveSiteState({ force: true }).catch(() => {});
    return subscribeToSiteFeatures((next) => setFeatures(next));
  }, []);

  const schema = features.formSchemas?.flex_space;
  const liveStatus = computeFlexSpaceStatus(flexCfg);
  const isManuallyClosed = flexCfg?.manualStatus === 'closed';
  const slots = getSlotAvailability('flex', selectedDate, features);

  const handleFieldChange = (id, val) => {
    setFormValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (isManuallyClosed) {
      setStatusMsg({ ok: false, text: 'Bookings are currently unavailable while Flex Space is closed.' });
      return;
    }

    const check = isDateAllowedForFlex(selectedDate, flexCfg);
    if (!check.allowed) {
      setStatusMsg({ ok: false, text: check.reason });
      return;
    }

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
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      <div className="container-clean space-y-8">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#5A1E65] py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Info & Live Status */}
          <div className="lg:col-span-5 space-y-5">
            <span className="glass-pill">FLEX SPACE · SLOT BOOKING</span>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-950 leading-tight">
              {flexCfg?.title || 'Community Flex Space at 2471 Portola Rd'}
            </h1>
            <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed">
              {flexCfg?.description || 'Need a quiet, affirming space for peer support, telehealth, study, or community organizing? Check real-time availability and reserve a Flex Space time slot.'}
            </p>

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
                  Automated Hours: {flexCfg?.autoHours?.openTime || '13:00'} – {flexCfg?.autoHours?.closeTime || '17:00'} (Mon–Fri)
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
                <h2 className="font-display text-xl font-black text-slate-950">
                  {schema?.title || 'Reserve a Flex Space Slot'}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {isManuallyClosed
                    ? 'Flex Space reservations are currently paused by staff.'
                    : 'Select a date and available time window below.'}
                </p>
              </div>
              {isManuallyClosed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5" /> Bookings Unavailable
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#5A1E65] border border-purple-200">
                  <Users className="w-3.5 h-3.5" /> Real-Time Slots
                </span>
              )}
            </div>

            {isManuallyClosed && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold block">Bookings Currently Unavailable — Flex Space Closed</span>
                  <p className="text-amber-900/90 leading-relaxed">
                    Online Flex Space slot reservations are temporarily closed. Please check back soon or contact DCVC staff for assistance.
                  </p>
                </div>
              </div>
            )}

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
              <fieldset
                disabled={isManuallyClosed}
                className={isManuallyClosed ? 'space-y-4 opacity-50 pointer-events-none select-none' : 'space-y-4'}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#5A1E65]" /> 1. Select Available Weekday (Mon–Fri, 1–5 PM) *
                    </label>
                    <BookingCalendarPicker
                      selectedDate={selectedDate}
                      onSelectDate={(newDate) => {
                        setSelectedDate(newDate);
                        setSelectedSlot('');
                      }}
                      mode="flex"
                      config={flexCfg}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#5A1E65]" /> 2. Available Time Slots *
                      </span>
                      <span className="text-[11px] text-purple-900 font-semibold lowercase">
                        (1:00 PM – 5:00 PM)
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slots.map((s) => (
                        <button
                          key={s.slot}
                          type="button"
                          disabled={isManuallyClosed || s.isFull}
                          onClick={() => setSelectedSlot(s.slot)}
                          className={`px-3 py-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                            selectedSlot === s.slot
                              ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-sm'
                              : s.isFull
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-white text-slate-800 border-slate-300 hover:border-purple-400'
                          }`}
                        >
                          <div className="truncate font-extrabold text-xs sm:text-sm">{s.slot}</div>
                          <div className={`text-[10px] font-semibold mt-0.5 ${selectedSlot === s.slot ? 'text-amber-200' : s.isFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {isManuallyClosed ? 'Unavailable' : s.isFull ? 'Booked' : `${s.remaining} slot left`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <DynamicSchemaFields
                  formId="flex_space"
                  fields={schema?.fields || []}
                  values={formValues}
                  onChange={handleFieldChange}
                  inputClassName="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:border-[#5A1E65] outline-none"
                  labelClassName="block text-xs font-bold text-slate-800"
                />
              </fieldset>

              <button
                type="submit"
                disabled={isManuallyClosed}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all ${
                  isManuallyClosed
                    ? 'bg-slate-200 text-slate-600 border border-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white shadow-md hover:shadow-lg cursor-pointer'
                }`}
              >
                {isManuallyClosed
                  ? 'Bookings Unavailable (Flex Space Closed)'
                  : (schema?.submitLabel || 'Book Flex Space Slot')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
