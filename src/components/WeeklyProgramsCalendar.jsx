import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Info,
  ChevronRight
} from 'lucide-react';
import { DEFAULT_WEEKLY_SCHEDULE } from '../utils/recurringSchedule';
import { cmsStore } from '../services/cmsStore';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeeklyProgramsCalendar({ schedule: propSchedule, className = '' }) {
  const [schedule, setSchedule] = useState(() => propSchedule || cmsStore.getWeeklySchedule?.() || DEFAULT_WEEKLY_SCHEDULE);
  const [selectedDay, setSelectedDay] = useState('Monday');

  useEffect(() => {
    if (propSchedule) {
      setSchedule(propSchedule);
      return;
    }
    const unsub = cmsStore.subscribe(() => {
      setSchedule(cmsStore.getWeeklySchedule?.() || DEFAULT_WEEKLY_SCHEDULE);
    });
    return unsub;
  }, [propSchedule]);

  const programsByDay = DAY_ORDER.reduce((acc, day) => {
    acc[day] = schedule.filter(p => p.dayName === day);
    return acc;
  }, {});

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header Explainer */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-purple-100 pb-5">
        <div>
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
            WEEKLY RECURRING SCHEDULE
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1.5">
            Weekly Programs & Peer Support Circles
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Free recurring gatherings hosted at the DCVC Community Resource Center (2471 Portola Rd, Suite 100, Ventura). Check occurrence schedules below.
          </p>
        </div>

        <Link
          to="/appointments"
          className="btn-secondary py-2 px-4 text-xs font-bold shrink-0 self-start sm:self-auto"
        >
          <span>Book STI Screening</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Mobile Day Selector Tabs */}
      <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none" role="tablist" aria-label="Select day of week">
        {DAY_ORDER.map((day) => {
          const count = programsByDay[day]?.length || 0;
          const isActive = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#5A1E65] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200'
              }`}
            >
              <span>{day}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-purple-800 text-purple-100' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Single Day View */}
      <div className="block lg:hidden space-y-3">
        {programsByDay[selectedDay]?.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
            No regular peer support groups scheduled on {selectedDay}. Drop-in center hours are Monday–Friday 1:00 PM – 5:00 PM.
          </div>
        ) : (
          programsByDay[selectedDay].map((prog) => (
            <ProgramScheduleCard key={prog.id} program={prog} />
          ))
        )}
      </div>

      {/* Desktop 7-Day Grid View */}
      <div className="hidden lg:grid grid-cols-7 gap-3.5 items-stretch">
        {DAY_ORDER.map((day) => {
          const progs = programsByDay[day] || [];
          return (
            <div
              key={day}
              className="flex flex-col rounded-3xl bg-white border border-purple-100/90 shadow-sm overflow-hidden"
            >
              <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50/50 border-b border-purple-100 text-center">
                <span className="font-display font-extrabold text-xs text-slate-900 block uppercase tracking-wider">
                  {day}
                </span>
                <span className="text-[10px] text-purple-700 font-bold block mt-0.5">
                  {progs.length} {progs.length === 1 ? 'Program' : 'Programs'}
                </span>
              </div>

              <div className="p-2.5 flex-grow space-y-2.5 flex flex-col justify-start">
                {progs.length === 0 ? (
                  <div className="p-3 text-center rounded-xl bg-slate-50 text-[11px] text-slate-400 italic">
                    Drop-ins welcome
                  </div>
                ) : (
                  progs.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-purple-50/40 hover:bg-purple-50/90 border border-purple-100/80 hover:border-purple-300 transition-all flex flex-col justify-between gap-2 text-left"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-[#5A1E65] bg-white px-2 py-0.5 rounded-md border border-purple-200/80 inline-block">
                          {p.recurrenceLabel}
                        </span>

                        <h3 className="font-display text-xs font-black text-slate-950 leading-snug">
                          {p.name}
                        </h3>

                        {p.time && (
                          <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#5A1E65] pt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{p.time}</span>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-600 line-clamp-3 leading-relaxed pt-0.5">
                          {p.description}
                        </p>
                      </div>

                      <Link
                        to={p.link || '/community'}
                        className="text-[10px] font-bold text-purple-800 hover:text-purple-950 hover:underline flex items-center gap-1 pt-1 border-t border-purple-100"
                      >
                        <span>Learn more</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgramScheduleCard({ program }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-100 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200">
          {program.recurrenceLabel}
        </span>
        <span className="text-[11px] font-semibold text-slate-500">
          {program.category}
        </span>
      </div>

      <div>
        <h3 className="font-display text-base font-extrabold text-slate-950">
          {program.name}
        </h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {program.description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 pt-2 border-t border-slate-100">
        {program.time && (
          <div className="flex items-center gap-1.5 font-bold text-[#5A1E65]">
            <Clock className="w-3.5 h-3.5" />
            <span>{program.time}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          <span>{program.location}</span>
        </div>
      </div>

      <Link
        to={program.link || '/community'}
        className="text-xs font-bold text-[#5A1E65] hover:underline inline-flex items-center gap-1 pt-1"
      >
        <span>View Program Details</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
