import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  ChevronRight,
  HeartHandshake
} from 'lucide-react';
import { 
  getUpcomingWeeklySchedule, 
  DEFAULT_WEEKLY_SCHEDULE 
} from '../utils/recurringSchedule';
import { cmsStore } from '../services/cmsStore';

export default function UpcomingWeekSection({ 
  props = {},
  schedule = null, 
  events = null,
  style = {} 
}) {
  const activeSchedule = useMemo(() => {
    return schedule || cmsStore.getWeeklySchedule?.() || DEFAULT_WEEKLY_SCHEDULE;
  }, [schedule]);

  const allEvents = useMemo(() => {
    return events || cmsStore.getEvents?.() || [];
  }, [events]);

  const upcomingDays = useMemo(() => {
    return getUpcomingWeeklySchedule(new Date(), activeSchedule, allEvents);
  }, [activeSchedule, allEvents]);

  return (
    <section 
      id="upcoming-week-section"
      data-block-id="block-upcoming-week"
      style={style}
      className="py-14 md:py-20 bg-gradient-to-b from-white via-purple-50/40 to-white border-b border-purple-200/60 relative overflow-hidden scroll-reveal"
    >
      {/* Ambient background glows */}
      <div 
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-purple-200/20 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-0 left-10 w-80 h-80 rounded-full bg-amber-100/30 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="container-clean relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200 shadow-xs flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[#5A1E65]" />
              {props?.eyebrow || 'THIS WEEK ACROSS VENTURA COUNTY'}
            </span>

            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              {props?.headline || 'Upcoming Programs & Events This Week'}
            </h2>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              {props?.description || 'Join affirming peer groups, youth circles, and wellness gatherings happening this week at our Community Resource Center. All programs are free and welcoming.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/events"
              className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center justify-center gap-2 shadow-md"
            >
              <span>{props?.ctaText || 'View Weekly Schedule'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {upcomingDays.map((dayGroup) => (
            <div
              key={dayGroup.dayIso}
              className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-4 h-full ${
                dayGroup.isToday
                  ? 'bg-gradient-to-br from-purple-50/90 via-white to-purple-50/50 border-purple-300 shadow-md ring-2 ring-[#5A1E65]/10'
                  : 'bg-white/90 backdrop-blur-xs border-purple-100/80 hover:border-purple-200 shadow-xs hover:shadow-lg'
              }`}
            >
              <div className="space-y-4">
                {/* Date Header Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-purple-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                      {dayGroup.dayName}
                    </span>
                    <span className="font-display text-base font-extrabold text-slate-950">
                      {dayGroup.formattedDate}
                    </span>
                  </div>

                  {dayGroup.isToday && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5A1E65] text-white animate-pulse">
                      Happening Today
                    </span>
                  )}
                </div>

                {/* Items on this day */}
                <div className="space-y-3.5">
                  {dayGroup.items.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-purple-200 space-y-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100/70 text-[#5A1E65]">
                          {item.recurrenceLabel || item.category}
                        </span>

                        {item.time && (
                          <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#5A1E65] font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{item.time}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-display text-sm font-extrabold text-slate-950">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>DCVC Center</span>
                        </span>

                        <Link
                          to={item.link}
                          className="font-bold text-[#5A1E65] hover:underline flex items-center gap-0.5"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Card Footer */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Free · No RSVP required</span>
                <Link to="/community" className="text-purple-700 font-semibold hover:underline">
                  All Peer Groups →
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
