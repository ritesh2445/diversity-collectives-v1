import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowRight, X, Clock, MapPin } from 'lucide-react';
import { cmsStore } from '../services/cmsStore';
import { parseEventDate, findBestCalendarMonth, getLocalizedMonthName, getLocalizedMonthAbbr, getLocalizedWeekdays } from '../utils/eventDates';
import { translationService } from '../services/translationService';
import { useScrollLock } from '../utils/scrollLock';

/**
 * Responsive Minimized Monthly Calendar Popover.
 * Rendered via createPortal directly into document.body to ensure it is never
 * trapped, clipped, or offset by parent navbar containers or sticky headers.
 */
export default function MiniCalendarPopover({ isOpen, onClose }) {
  useScrollLock(isOpen);

  const [currentLang, setCurrentLang] = useState(() => translationService.getLanguage?.() || 'en');

  useEffect(() => {
    return translationService.subscribe((lang) => setCurrentLang(lang));
  }, []);

  const [events, setEvents] = useState(() => cmsStore.getEvents() || []);
  const [cursorDate, setCursorDate] = useState(() => findBestCalendarMonth(cmsStore.getEvents() || []));
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    return cmsStore.subscribe((data) => {
      if (data?.events) setEvents(data.events);
    });
  }, []);

  // Sync cursor month when opened
  useEffect(() => {
    if (isOpen) {
      setCursorDate(findBestCalendarMonth(events));
      setSelectedDay(null);
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const year = cursorDate.getFullYear();
  const monthIndex = cursorDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();

  const eventsByDay = useMemo(() => {
    const map = {};
    (events || []).forEach((evt) => {
      const parsed = parseEventDate(evt);
      if (!parsed) return;
      if (parsed.year === year && parsed.monthIndex === monthIndex) {
        if (!map[parsed.day]) map[parsed.day] = [];
        map[parsed.day].push(evt);
      }
    });
    return map;
  }, [events, year, monthIndex]);

  const monthEventsList = useMemo(() => {
    return Object.entries(eventsByDay)
      .sort(([a], [b]) => Number(a) - Number(b))
      .flatMap(([, list]) => list);
  }, [eventsByDay]);

  if (!isOpen) return null;

  const previewEvents =
    selectedDay && eventsByDay[selectedDay]
      ? eventsByDay[selectedDay]
      : monthEventsList.slice(0, 3);

  const changeMonth = (delta) => {
    setCursorDate(new Date(year, monthIndex + delta, 1));
    setSelectedDay(null);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-fadeIn"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Events Calendar Quick View"
    >
      <div
        className="w-full max-w-[360px] my-auto bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-purple-200/90 relative animate-in zoom-in-95 text-slate-900"
        style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <span
              className="font-display font-black text-sm sm:text-base text-slate-950 truncate notranslate"
              translate="no"
            >
              {getLocalizedMonthName(monthIndex, currentLang)} {year}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous Month"
              className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-purple-50 hover:text-[#5A1E65] flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next Month"
              className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-purple-50 hover:text-[#5A1E65] flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Mini Calendar"
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Header */}
        <div
          className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase mb-1 notranslate"
          translate="no"
        >
          {getLocalizedWeekdays(currentLang).map((dayName, idx) => (
            <span key={idx}>{dayName}</span>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`blank-${i}`} className="h-7 sm:h-8" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const hasEvt = Boolean(eventsByDay[day]?.length);
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-7 sm:h-8 rounded-lg text-xs font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#5A1E65] text-white shadow-xs scale-105 ring-2 ring-purple-300'
                    : hasEvt
                    ? 'bg-purple-100 text-[#5A1E65] hover:bg-purple-200 font-black'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={hasEvt ? eventsByDay[day].map((e) => e.title).join(', ') : undefined}
              >
                <span>{day}</span>
                {hasEvt && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-0.5 ${
                      isSelected ? 'bg-amber-300' : 'bg-[#5A1E65]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Scheduled Events Section */}
        <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>
              {selectedDay
                ? `${getLocalizedMonthName(monthIndex, currentLang)} ${selectedDay}`
                : translationService.t('cal_scheduled_month', 'Scheduled This Month')}
            </span>
            {selectedDay && (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-[#5A1E65] hover:underline cursor-pointer font-bold"
              >
                {translationService.t('cal_show_all', 'Show All')}
              </button>
            )}
          </div>

          {previewEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-2 text-center bg-slate-50 rounded-xl">
              {translationService.t('cal_no_events', 'No events scheduled on this date.')}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-32 sm:max-h-36 overflow-y-auto pr-0.5">
              {previewEvents.map((ev) => {
                const p = parseEventDate(ev);
                return (
                  <Link
                    key={ev.id || ev.slug}
                    to={`/events/${ev.slug}`}
                    onClick={onClose}
                    className="block p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition-colors group"
                  >
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#5A1E65] truncate">{ev.title}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                      <Clock className="w-3 h-3 text-[#5A1E65] shrink-0" />
                      <span>{p ? `${getLocalizedMonthAbbr(p.monthIndex, currentLang)} ${p.dayStr}` : ev.date} · {ev.time}</span>
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            to="/events"
            onClick={onClose}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer text-center"
          >
            <span className="truncate max-w-[85%]">
              {translationService.t('cal_open_full', 'Open Full Events Calendar')}
            </span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
