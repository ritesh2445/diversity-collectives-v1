import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  ArrowRight, 
  ChevronRight,
  HeartHandshake
} from 'lucide-react';
import { DEFAULT_WEEKLY_SCHEDULE } from '../utils/recurringSchedule';
import { cmsStore } from '../services/cmsStore';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function resolveProgramLink(program) {
  if (program?.link && !program.link.startsWith('/community') && !program.link.startsWith('/events')) {
    return program.link;
  }
  const idOrName = (program?.id || program?.name || '').toLowerCase();
  if (idOrName.includes('na-') || idOrName.includes('narcotics')) return '/programs/narcotics-anonymous';
  if (idOrName.includes('toastmaster')) return '/programs/diversity-toastmasters';
  if (idOrName.includes('pflag')) return '/programs/pflag-ventura';
  if (idOrName.includes('adulting')) return '/programs/queer-adulting';
  if (idOrName.includes('silver')) return '/programs/silver-collective';
  if (idOrName.includes('umbrella') || idOrName.includes('rainbow')) return '/programs/rainbow-umbrella';
  if (idOrName.includes('unicorn')) return '/programs/little-unicorns';
  if (idOrName.includes('transverse') || idOrName.includes('trans')) return '/programs/transverse';
  if (program?.slug) return `/programs/${program.slug}`;
  return '/programs';
}

export default function WeeklyProgramsCalendar({ schedule: propSchedule, className = '' }) {
  const [schedule, setSchedule] = useState(() => propSchedule || cmsStore.getWeeklySchedule?.() || DEFAULT_WEEKLY_SCHEDULE);
  
  // Identify current day of week in California time
  const currentDayName = useMemo(() => {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'long'
      }).format(now);
    } catch {
      return 'Monday';
    }
  }, []);

  const [selectedDay, setSelectedDay] = useState(currentDayName);

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

  const programsByDay = useMemo(() => {
    return DAY_ORDER.reduce((acc, day) => {
      acc[day] = (schedule || []).filter(p => p.dayName === day);
      return acc;
    }, {});
  }, [schedule]);

  return (
    <div className={`space-y-8 ${className}`}>
      
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-purple-200/60 text-[#5A1E65] text-xs font-bold shadow-2xs">
            <span>WEEKLY RECURRING SCHEDULE</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            Weekly Programs & Peer Support Circles
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Free recurring gatherings hosted at the DCVC Community Resource Center (2471 Portola Rd, Suite 100, Ventura). Check occurrence schedules below.
          </p>
        </div>

        <div className="shrink-0">
          <Link
            to="/appointments"
            className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/90 py-2.5 px-5 rounded-full text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow-md"
          >
            <span>Book STI Screening</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
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
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                isActive
                  ? 'bg-[#5A1E65] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-purple-50/80 border border-purple-200/70'
              }`}
            >
              <span>{day}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                isActive ? 'bg-purple-950 text-amber-300' : 'bg-purple-100/80 text-purple-900'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Single Day View */}
      <div className="block lg:hidden space-y-3">
        {programsByDay[selectedDay]?.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white border border-slate-100 text-xs text-slate-600 shadow-xs space-y-2">
            <HeartHandshake className="w-8 h-8 text-[#5A1E65] mx-auto opacity-70" />
            <p className="font-bold text-slate-900">No scheduled group meetings on {selectedDay}</p>
            <p className="text-slate-500 text-[11px]">
              Center drop-in hours are Monday–Friday, 1:00 PM – 5:00 PM. Drop by for free supplies, library, and community connection.
            </p>
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
              className="flex flex-col rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden min-w-0"
            >
              {/* Day Header */}
              <div className="p-4 text-center">
                <span className="font-display font-bold text-xs text-slate-900 block uppercase tracking-wider">
                  {day}
                </span>
                <span className="text-[11px] text-purple-700 font-medium block mt-0.5">
                  {progs.length} {progs.length === 1 ? 'Program' : 'Programs'}
                </span>
              </div>

              {/* Day Programs Body */}
              <div className="p-3 flex-grow space-y-3 flex flex-col justify-start min-w-0">
                {progs.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col justify-between gap-2.5 min-w-0 overflow-hidden"
                  >
                    <div className="space-y-1.5 min-w-0">
                      {/* Recurrence Chip */}
                      {p.recurrenceLabel && (
                        <div className="flex items-center min-w-0 max-w-full">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md block truncate">
                            {p.recurrenceLabel}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="font-bold text-xs text-slate-900 leading-snug">
                        {p.name}
                      </h3>

                      {/* Time */}
                      {p.time && (
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-600 font-medium min-w-0">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{p.time}</span>
                        </div>
                      )}

                      {/* Description */}
                      {p.description && (
                        <p className="text-[10.5px] text-slate-500 line-clamp-3 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    {/* Link */}
                    <Link
                      to={resolveProgramLink(p)}
                      className="text-[10.5px] font-semibold text-slate-700 hover:text-purple-700 inline-flex items-center gap-1 pt-1 group"
                    >
                      <span>Learn more</span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                  </div>
                ))}
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
    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col gap-2.5">
      {program.recurrenceLabel && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md self-start">
          {program.recurrenceLabel}
        </span>
      )}

      <div>
        <h3 className="font-bold text-sm text-slate-900">
          {program.name}
        </h3>
        {program.description && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {program.description}
          </p>
        )}
      </div>

      {program.time && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{program.time}</span>
        </div>
      )}

      <Link
        to={resolveProgramLink(program)}
        className="text-xs font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 pt-1"
      >
        <span>Learn more</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
