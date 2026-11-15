import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, ArrowRight } from 'lucide-react';
import { parseEventDate } from '../utils/eventDates';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Section #7: Dedicated Interactive Calendar Section on Homepage
 * Distinct from Programs and Signature Events — displays scheduled dates cleanly.
 */
export default function HomeCalendarSection({ events = [], props = {}, style = {} }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const eventMap = useMemo(() => {
    const map = new Map();
    (events || []).forEach((evt) => {
      const parsed = parseEventDate(evt);
      if (!parsed) return;
      const y = parsed.dateObj ? parsed.dateObj.getFullYear() : Number(evt.year || viewYear);
      const m = parsed.dateObj ? parsed.dateObj.getMonth() : parsed.monthIndex;
      const d = parsed.dateObj ? parsed.dateObj.getDate() : Number(evt.day);
      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        const key = `${y}-${m}-${d}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(evt);
      }
    });
    return map;
  }, [events, viewYear]);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const selectedKey = `${viewYear}-${viewMonth}-${selectedDay}`;
  const selectedDayEvents = eventMap.get(selectedKey) || [];

  const monthEvents = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const evts = eventMap.get(`${viewYear}-${viewMonth}-${d}`);
      if (evts) evts.forEach((e) => list.push({ day: d, evt: e }));
    }
    return list;
  }, [eventMap, viewYear, viewMonth, daysInMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  return (
    <section
      id="home-calendar"
      style={style}
      className="py-14 md:py-20 bg-gradient-to-br from-purple-100/70 via-indigo-50/80 to-rose-100/60 border-b border-purple-200/70 relative overflow-hidden"
    >
      {/* Subtle Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-purple-300/25 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="container-clean relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-3 max-w-xl">
            <span className="glass-pill">
              {props.eyebrow || 'COMMUNITY CALENDAR'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-950">
              {props.headline || 'Interactive Schedule & Dates'}
            </h2>
            <p className="text-slate-800 text-sm font-semibold leading-relaxed">
              {props.description || 'Browse scheduled dates at a glance — distinct from our recurring Programs and Signature Events.'}
            </p>
          </div>
          <Link to="/events" className="btn-secondary w-full sm:w-auto shrink-0 max-w-full">
            <span>{props.ctaText || 'Open Full Calendar Page'}</span>
            <CalendarIcon className="w-4 h-4 text-[#5A1E65]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-4 items-start">
          {/* Calendar Grid */}
          <div className="lg:col-span-7 bg-white/90 backdrop-blur-xl rounded-3xl border border-purple-200/90 shadow-xl shadow-purple-900/5 p-3.5 sm:p-6 min-w-0 max-w-full">
            <div className="flex items-center justify-between mb-4 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#5A1E65] via-purple-700 to-indigo-700 text-white shadow-md">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="p-1.5 sm:p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-display text-base sm:text-xl font-black tracking-tight text-white">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h3>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="p-1.5 sm:p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-purple-900 mb-2">
              {WEEKDAYS.map((w) => <div key={w} className="py-0.5 sm:py-1">{w}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 sm:h-12" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const key = `${viewYear}-${viewMonth}-${day}`;
                const hasEvents = eventMap.has(key);
                const isSelected = selectedDay === day;
                const isToday =
                  day === now.getDate() &&
                  viewMonth === now.getMonth() &&
                  viewYear === now.getFullYear();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`h-9 sm:h-12 rounded-xl flex flex-col items-center justify-center text-xs sm:text-sm font-bold transition-all cursor-pointer relative min-w-0 ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#5A1E65] via-purple-700 to-indigo-600 text-white shadow-md shadow-purple-500/30 scale-[1.04]'
                        : isToday
                          ? 'bg-gradient-to-br from-amber-100 to-rose-100 text-[#5A1E65] border border-purple-300 font-black'
                          : hasEvents
                            ? 'bg-purple-50/90 hover:bg-purple-100 text-slate-950 border border-purple-200/70'
                            : 'hover:bg-purple-50 text-slate-900 border border-transparent'
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvents && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected ? 'bg-amber-300' : 'bg-rose-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day & Month Highlights */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-xl rounded-3xl border border-purple-200/90 shadow-xl shadow-purple-900/5 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1E65]">
                  Selected Date
                </span>
                <h4 className="font-display text-lg font-black text-slate-950">
                  {MONTH_NAMES[viewMonth]} {selectedDay}, {viewYear}
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#5A1E65] border border-purple-200">
                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDayEvents.map((evt) => (
                  <Link
                    key={evt.id}
                    to={`/events/${evt.slug}`}
                    className="block p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-100/80 border border-purple-200/70 hover:border-[#5A1E65] transition-all space-y-1.5 group cursor-pointer shadow-2xs hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-bold text-slate-950 text-sm group-hover:text-[#5A1E65] transition-colors">{evt.title}</h5>
                      <span className="text-[11px] font-extrabold text-[#5A1E65] shrink-0 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                        Details <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#5A1E65]" /> {evt.time}
                    </p>
                    <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#5A1E65]" /> {evt.location}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium space-y-2">
                <p>No special calendar events listed on this specific day.</p>
                {monthEvents.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <p className="font-bold text-slate-900">Scheduled this month:</p>
                    {monthEvents.slice(0, 3).map(({ day, evt }) => (
                      <button
                        key={evt.id + day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-purple-300 flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-bold text-slate-900 truncate">{evt.title}</span>
                        <span className="text-[11px] font-black text-[#5A1E65] shrink-0 ml-2">
                          {MONTH_NAMES[viewMonth].slice(0, 3)} {day}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

