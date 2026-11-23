import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, Sparkles } from 'lucide-react';
import {
  getTodayIso,
  isDateAllowedForHiv,
  isDateAllowedForFlex,
  getUpcomingHivClinicDates,
  getUpcomingFlexSpaceDates
} from '../utils/calendarBooking.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function BookingCalendarPicker({
  selectedDate,
  onSelectDate,
  mode = 'hiv', // 'hiv' | 'flex'
  config = {},
  className = ''
}) {
  const today = getTodayIso();
  const [initialY, initialM] = selectedDate
    ? selectedDate.split('-').map(Number)
    : today.split('-').map(Number);

  const [currentYear, setCurrentYear] = useState(initialY || new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialM ? initialM - 1 : new Date().getMonth());

  // Upcoming valid dates for quick shortcuts
  const upcomingAllowedDates = useMemo(() => {
    if (mode === 'hiv') {
      return getUpcomingHivClinicDates(12, config.allowedDates, config.blockedDates);
    }
    return getUpcomingFlexSpaceDates(30, config.allowedDates, config.blockedDates);
  }, [mode, config]);

  // Days calculation for current month view
  const { daysInMonth, startWeekday } = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    return {
      daysInMonth: totalDays,
      startWeekday: firstDayWeekday
    };
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const isAllowed = (dateIso) => {
    if (mode === 'hiv') {
      return isDateAllowedForHiv(dateIso, config).allowed;
    }
    return isDateAllowedForFlex(dateIso, config).allowed;
  };

  const formatDisplayDate = (iso) => {
    if (!iso) return '';
    try {
      const [y, m, d] = iso.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 ${className}`}>
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#5A1E65]" />
          <span className="font-display font-extrabold text-sm sm:text-base text-slate-900">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_NAMES.map((wd, i) => (
          <span
            key={wd}
            className={`text-[11px] font-bold uppercase tracking-wider py-1 ${
              i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {wd}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Empty cells before month start */}
        {Array.from({ length: startWeekday }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-9 sm:h-10" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const monthStr = String(currentMonth + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const iso = `${currentYear}-${monthStr}-${dayStr}`;

          const isPast = iso < today;
          const selectable = !isPast && isAllowed(iso);
          const isSelected = selectedDate === iso;

          return (
            <button
              key={iso}
              type="button"
              disabled={!selectable}
              onClick={() => selectable && onSelectDate(iso)}
              className={`h-9 sm:h-10 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-[#5A1E65] text-white shadow-md ring-2 ring-purple-300 scale-105 z-10'
                  : selectable
                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200/80 cursor-pointer hover:scale-105'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed select-none opacity-45'
              }`}
              title={
                selectable
                  ? `Select ${iso} (${mode === 'hiv' ? 'HIV Clinic Day' : 'Open Day'})`
                  : `Closed / Unavailable`
              }
            >
              <span>{dayNum}</span>
              {selectable && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick selection shortcuts for upcoming clinic dates */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-bold flex items-center gap-1 text-slate-700">
            <Sparkles className="w-3 h-3 text-[#5A1E65]" />
            Upcoming Open Dates:
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">
            ● Green dot = Available
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {upcomingAllowedDates.slice(0, 3).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedDate === d
                  ? 'bg-[#5A1E65] text-white'
                  : 'bg-slate-100 hover:bg-purple-50 text-slate-700 border border-slate-200 hover:border-purple-200'
              }`}
            >
              {formatDisplayDate(d)}
            </button>
          ))}
        </div>
      </div>

      {/* Selected date confirmation banner */}
      <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-[#5A1E65] font-semibold flex items-center justify-between">
        <span className="flex items-center gap-1.5 truncate">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Selected: <strong>{formatDisplayDate(selectedDate) || selectedDate}</strong></span>
        </span>
        <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-purple-200 shrink-0 ml-2">
          {mode === 'hiv' ? '3:00 PM – 7:00 PM' : '1:00 PM – 5:00 PM'}
        </span>
      </div>
    </div>
  );
}
