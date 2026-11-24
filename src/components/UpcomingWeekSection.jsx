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
import { resolveProgramLink } from './WeeklyProgramsCalendar';
import { cmsStore } from '../services/cmsStore';
import MobileCarousel from './MobileCarousel';

const DAY_CARD_THEMES = [
  {
    outerGlow: 'from-fuchsia-400/70 via-purple-400/60 to-indigo-400/70',
    topBar: 'from-fuchsia-500 via-purple-500 to-indigo-500',
    surface: 'bg-gradient-to-br from-white via-fuchsia-50/60 to-purple-50/80',
    hoverShadow: 'hover:shadow-[0_18px_40px_-12px_rgba(168,85,247,0.32)]',
    dayLabel: 'text-fuchsia-700',
    divider: 'border-purple-200/70',
    itemBorder: 'border-purple-100 hover:border-fuchsia-300 border-l-4 border-l-fuchsia-500',
    badge: 'bg-fuchsia-100/90 text-fuchsia-900 border border-fuchsia-200/80',
    timePill: 'bg-purple-100/80 text-[#5A1E65]',
    link: 'text-fuchsia-700 hover:text-purple-900',
  },
  {
    outerGlow: 'from-amber-400/75 via-rose-400/65 to-pink-400/75',
    topBar: 'from-amber-400 via-orange-500 to-rose-500',
    surface: 'bg-gradient-to-br from-white via-amber-50/60 to-rose-50/80',
    hoverShadow: 'hover:shadow-[0_18px_40px_-12px_rgba(244,63,94,0.28)]',
    dayLabel: 'text-rose-700',
    divider: 'border-rose-200/70',
    itemBorder: 'border-rose-100 hover:border-amber-300 border-l-4 border-l-amber-500',
    badge: 'bg-amber-100/90 text-amber-950 border border-amber-200/80',
    timePill: 'bg-rose-100/80 text-rose-900',
    link: 'text-rose-700 hover:text-rose-900',
  },
  {
    outerGlow: 'from-teal-400/75 via-sky-400/65 to-indigo-400/75',
    topBar: 'from-teal-400 via-sky-500 to-indigo-500',
    surface: 'bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/80',
    hoverShadow: 'hover:shadow-[0_18px_40px_-12px_rgba(14,165,233,0.28)]',
    dayLabel: 'text-sky-700',
    divider: 'border-sky-200/70',
    itemBorder: 'border-sky-100 hover:border-teal-300 border-l-4 border-l-teal-500',
    badge: 'bg-teal-100/90 text-teal-950 border border-teal-200/80',
    timePill: 'bg-sky-100/80 text-sky-900',
    link: 'text-sky-700 hover:text-indigo-900',
  },
];

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

  const ctaLabel =
    props?.ctaText && props.ctaText !== 'View All Gatherings' && props.ctaText !== 'View Weekly Schedule'
      ? props.ctaText
      : 'View Events';

  return (
    <section 
      id="upcoming-week-section"
      data-block-id="block-upcoming-week"
      style={style}
      className="py-14 md:py-20 bg-gradient-to-br from-[#F9F2FF] via-[#FFF4F8] to-[#EEF8FF] border-b border-purple-200/70 relative overflow-hidden scroll-reveal"
    >
      {/* Rich multi-tone ambient lighting orbs */}
      <div 
        className="absolute -top-24 right-1/4 w-[28rem] h-[28rem] rounded-full bg-fuchsia-300/25 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute -bottom-24 left-6 w-[24rem] h-[24rem] rounded-full bg-amber-200/35 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-sky-300/25 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="container-clean relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-gradient-to-r from-purple-100/90 via-fuchsia-50/90 to-amber-50/90 border border-purple-200/90 shadow-xs inline-flex items-center gap-1.5 w-fit">
              <CalendarIcon className="w-3.5 h-3.5 text-fuchsia-700" />
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
              className="py-3 px-6 rounded-full text-xs sm:text-sm font-extrabold !text-white bg-gradient-to-r from-[#5A1E65] via-purple-700 to-fuchsia-600 hover:brightness-110 hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-4 h-4 !text-white" />
            </Link>
          </div>
        </div>

        {/* Days Swipable Carousel on Mobile / Grid on Desktop */}
        <MobileCarousel cols={3} autoScrollMs={0} className="items-stretch" cardClassName="h-full flex flex-col">
          {upcomingDays.map((dayGroup, idx) => {
            const theme = DAY_CARD_THEMES[idx % DAY_CARD_THEMES.length];
            return (
              <div
                key={dayGroup.dayIso}
                className={`group p-[1.5px] rounded-3xl bg-gradient-to-br ${theme.outerGlow} transition-all duration-300 hover:-translate-y-1 ${theme.hoverShadow} h-full flex flex-col ${
                  dayGroup.isToday ? 'ring-2 ring-[#5A1E65]/30 shadow-lg' : 'shadow-sm'
                }`}
              >
                <div
                  className={`relative overflow-hidden p-6 rounded-[calc(1.5rem-1.5px)] ${theme.surface} backdrop-blur-md flex flex-col justify-between gap-4 h-full`}
                >
                  {/* Top prismatic accent bar */}
                  <div
                    className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${theme.topBar}`}
                    aria-hidden="true"
                  />

                  <div className="space-y-4 pt-1">
                    {/* Date Header Badge */}
                    <div className={`flex items-center justify-between gap-2 border-b ${theme.divider} pb-3`}>
                      <div>
                        <span className={`text-[11px] font-black uppercase tracking-wider ${theme.dayLabel} block`}>
                          {dayGroup.dayName}
                        </span>
                        <span className="font-display text-lg font-extrabold text-slate-950">
                          {dayGroup.formattedDate}
                        </span>
                      </div>

                      {dayGroup.isToday && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#5A1E65] to-fuchsia-600 text-white shadow-sm animate-pulse">
                          Happening Today
                        </span>
                      )}
                    </div>

                    {/* Items on this day */}
                    <div className="space-y-3.5">
                      {dayGroup.items.map((item) => (
                        <div 
                          key={item.id}
                          className={`p-3.5 rounded-2xl bg-white/95 border ${theme.itemBorder} space-y-1.5 shadow-xs hover:shadow-md transition-all duration-200`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${theme.badge}`}>
                              {item.recurrenceLabel || item.category}
                            </span>

                            {item.time && (
                              <div className={`flex items-center gap-1 text-[11px] font-extrabold font-mono px-2 py-0.5 rounded-md ${theme.timePill}`}>
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
                            <span className="text-slate-600 font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              <span>DCVC Center</span>
                            </span>

                            <Link
                              to={resolveProgramLink(item)}
                              className={`font-bold ${theme.link} hover:underline flex items-center gap-0.5`}
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
                  <div className={`pt-2.5 border-t ${theme.divider} text-[11px] text-slate-600 font-medium flex items-center justify-between`}>
                    <span>Free · No RSVP required</span>
                    <Link to="/community" className={`${theme.link} font-bold hover:underline`}>
                      All Peer Groups →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </MobileCarousel>

      </div>
    </section>
  );
}
