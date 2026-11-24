import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ArrowUpRight, 
  Sparkles,
  Ticket,
  AlertTriangle,
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { cmsStore } from '../services/cmsStore';
import { annualSignatureEvents } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';
import AutoSlideImage from '../components/AutoSlideImage.jsx';
import MobileCarousel from '../components/MobileCarousel.jsx';
import WeeklyProgramsCalendar from '../components/WeeklyProgramsCalendar.jsx';
import { usePageMeta } from '../utils/seo';
import {
  parseEventDate,
  findBestCalendarMonth,
  getLocalizedMonthName,
  getLocalizedMonthAbbr,
  getLocalizedWeekdays,
  isUpcomingEvent,
  isPastEvent,
  getPacificEventEndTimestamp,
  getCurrentPacificDate
} from '../utils/eventDates';
import { translationService } from '../services/translationService';

export default function Events() {
  usePageMeta({
    title: 'Events & Cultural Calendar',
    description: 'Explore upcoming LGBTQ+ youth circles, health screening clinics, social mixers, and Pride celebrations across Ventura County.',
    canonicalPath: '/events'
  });

  const [currentLang, setCurrentLang] = useState(() => translationService.getLanguage?.() || 'en');

  useEffect(() => {
    return translationService.subscribe((lang) => setCurrentLang(lang));
  }, []);

  const [events, setEvents] = useState(() => cmsStore.getEvents());
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'All');
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') === 'calendar' ? 'calendar' : 'list'); // 'list' | 'calendar'
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'past' ? 'past' : 'upcoming'); // 'upcoming' | 'past'

  useEffect(() => {
    const cat = searchParams.get('category');
    const search = searchParams.get('search');
    const view = searchParams.get('view');
    const tab = searchParams.get('tab');
    if (cat !== null) setSelectedCategory(cat || 'All');
    if (search !== null) {
      setSearchQuery(search);
      setSearchInput(search);
    }
    if (view && ['list', 'calendar'].includes(view)) setViewMode(view);
    if (tab && ['upcoming', 'past'].includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  // Traditional Monthly Calendar State — smartly focuses on active scheduled events
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() =>
    findBestCalendarMonth(cmsStore.getEvents())
  );
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);

  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      setEvents(cmsStore.getEvents());
    });
    return unsubscribe;
  }, []);

  const categories = useMemo(() => {
    const defaults = [
      'All',
      'Health & Wellness',
      'Youth',
      'Adult Support',
      'Seniors',
      'Professional Growth',
      'Signature Event',
      'Festival & Celebration'
    ];
    const extras = (events || [])
      .map((e) => e.category)
      .filter((c) => c && !defaults.includes(c));
    return [...defaults, ...Array.from(new Set(extras))];
  }, [events]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
    setSelectedDateFilter(null);
  };

  const getEventDateKey = (evt) => parseEventDate(evt)?.dateKey || null;

  const scheduledMonths = useMemo(() => {
    const buckets = new Map();
    (events || []).forEach((evt) => {
      const parsed = parseEventDate(evt);
      if (!parsed) return;
      const key = `${parsed.year}-${String(parsed.monthIndex + 1).padStart(2, '0')}`;
      const existing = buckets.get(key) || {
        key,
        year: parsed.year,
        monthIndex: parsed.monthIndex,
        count: 0
      };
      existing.count += 1;
      buckets.set(key, existing);
    });
    return Array.from(buckets.values()).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex
    );
  }, [events]);

  // Calendar calculations for selected month
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth(); // 0-11
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)

  const currentMonthName = getLocalizedMonthName(calendarMonth, currentLang);
  const nextMonthDate = new Date(calendarYear, calendarMonth + 1, 1);
  const nextMonthName = getLocalizedMonthName(nextMonthDate.getMonth(), currentLang);
  const prevMonthDate = new Date(calendarYear, calendarMonth - 1, 1);
  const prevMonthName = getLocalizedMonthName(prevMonthDate.getMonth(), currentLang);

  const monthEvents = useMemo(() => {
    return (events || []).filter((e) => {
      const parsed = parseEventDate(e);
      return parsed && parsed.monthIndex === calendarMonth && parsed.year === calendarYear;
    });
  }, [events, calendarMonth, calendarYear]);

  const upcomingCount = useMemo(() => {
    const pacificNow = getCurrentPacificDate();
    const isCurrentCalendarMonth = calendarYear === pacificNow.year && calendarMonth === pacificNow.monthIndex;
    if (isCurrentCalendarMonth) {
      return monthEvents.filter(isUpcomingEvent).length;
    }
    return monthEvents.filter((e) => {
      const parsed = parseEventDate(e);
      if (!parsed) return false;
      if (parsed.year > pacificNow.year) return true;
      if (parsed.year === pacificNow.year && parsed.monthIndex > pacificNow.monthIndex) return true;
      return isUpcomingEvent(e);
    }).length;
  }, [monthEvents, calendarMonth, calendarYear]);

  const pastCount = useMemo(() => {
    return monthEvents.filter(isPastEvent).length;
  }, [monthEvents]);

  const filteredEvents = useMemo(() => {
    const pacificNow = getCurrentPacificDate();
    const isCurrentCalendarMonth = calendarYear === pacificNow.year && calendarMonth === pacificNow.monthIndex;

    return (events || [])
      .filter((evt) => {
        // If user explicitly clicked a day in calendar view or date pill, show that date
        if (selectedDateFilter) {
          const dateKey = getEventDateKey(evt);
          if (dateKey !== selectedDateFilter) return false;
        } else {
          // Strictly show events for the currently selected calendar month & year
          const parsed = parseEventDate(evt);
          if (!parsed || parsed.monthIndex !== calendarMonth || parsed.year !== calendarYear) {
            return false;
          }

          if (viewMode === 'list') {
            if (activeTab === 'past' && !isPastEvent(evt)) return false;
            if (activeTab === 'upcoming' && isCurrentCalendarMonth && !isUpcomingEvent(evt)) return false;
          }
        }

        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
          (evt.title || '').toLowerCase().includes(q) ||
          (evt.description || '').toLowerCase().includes(q) ||
          (evt.location || '').toLowerCase().includes(q) ||
          (evt.category || '').toLowerCase().includes(q);

        const matchesCat = selectedCategory === 'All' || evt.category === selectedCategory;

        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        const tsA = getPacificEventEndTimestamp(a);
        const tsB = getPacificEventEndTimestamp(b);
        // Past events sort descending (most recent first), upcoming sort ascending (soonest first)
        return activeTab === 'past' && !selectedDateFilter ? tsB - tsA : tsA - tsB;
      });
  }, [events, searchQuery, selectedCategory, selectedDateFilter, viewMode, activeTab, calendarMonth, calendarYear]);

  // Group events by day of current calendar month
  const eventsByDay = useMemo(() => {
    const map = {};
    (events || []).forEach((evt) => {
      const parsed = parseEventDate(evt);
      if (!parsed) return;
      if (parsed.monthIndex === calendarMonth && parsed.year === calendarYear) {
        if (!map[parsed.day]) map[parsed.day] = [];
        map[parsed.day].push(evt);
      }
    });
    return map;
  }, [events, calendarMonth, calendarYear]);

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
    setSelectedDateFilter(null);
    document.getElementById('events-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
    setSelectedDateFilter(null);
    document.getElementById('events-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectDay = (day) => {
    const monthStr = String(calendarMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const key = `${calendarYear}-${monthStr}-${dayStr}`;
    if (selectedDateFilter === key) {
      setSelectedDateFilter(null);
    } else {
      setSelectedDateFilter(key);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        {/* Specular Ambient Glow */}
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="max-w-3xl flex flex-col gap-4">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
              OFFICIAL CALENDAR & CULTURAL LIFE
            </span>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
              Cultural Calendar & <br />
              <span className="font-serif italic font-normal text-[#5A1E65]">Upcoming Events.</span>
            </h1>
            <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
              From weekly youth circles and free testing clinics to seaside Pride and annual galas, explore upcoming events across Ventura County.
            </p>
          </div>

          {/* View Switcher: List vs Traditional Calendar Grid vs Weekly Programs */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 self-start md:self-end flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setSelectedDateFilter(null);
              }}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#5A1E65] shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-4 h-4" />
              <span>Cards View</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('calendar');
              }}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[#5A1E65] text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Monthly Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('weekly');
                setSelectedDateFilter(null);
              }}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-[#5A1E65] text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Weekly Programs</span>
            </button>
          </div>
        </div>

        {/* Search Bar with Dedicated Search Button and Category Filters */}
        <div className="mt-10 pt-8 border-t border-slate-100 space-y-4">
          
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search gatherings, screenings, topics, or venues..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-[#5A1E65] focus:bg-white focus:ring-2 focus:ring-purple-100 rounded-2xl outline-none transition-all font-medium text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="btn-primary py-3 px-6 text-xs font-extrabold shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search Events</span>
            </button>
            {(searchQuery || selectedCategory !== 'All' || selectedDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedDateFilter(null);
                }}
                className="py-3 px-4 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer text-center"
              >
                Clear All
              </button>
            )}
          </form>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 pt-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex-shrink-0 cursor-pointer border-2 interactive-card-3d ${
                  selectedCategory === cat
                    ? 'bg-slate-950 text-white border-purple-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Traditional Interactive Monthly Calendar View */}
      {viewMode === 'calendar' && (
        <section className="container-clean py-10">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-xl mb-12">
            
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#5A1E65] flex items-center justify-center font-bold">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    className="font-display text-2xl sm:text-3xl font-black text-slate-950 notranslate"
                    translate="no"
                  >
                    {getLocalizedMonthName(calendarMonth, currentLang)} {calendarYear}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Click any highlighted date to view events scheduled on that day
                  </p>
                </div>
              </div>

              {/* Month Switcher Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-purple-50 hover:text-[#5A1E65] flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-purple-50 hover:text-[#5A1E65] flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {scheduledMonths.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                  Months With Scheduled Events:
                </span>
                {scheduledMonths.map((bucket) => {
                  const isActiveMonth = bucket.year === calendarYear && bucket.monthIndex === calendarMonth;
                  return (
                    <button
                      key={bucket.key}
                      type="button"
                      onClick={() => {
                        setCurrentCalendarDate(new Date(bucket.year, bucket.monthIndex, 1));
                        setSelectedDateFilter(null);
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border notranslate ${
                        isActiveMonth
                          ? 'bg-[#5A1E65] text-white border-[#5A1E65] shadow-xs'
                          : 'bg-purple-50/70 text-[#5A1E65] border-purple-200 hover:bg-purple-100'
                      }`}
                      translate="no"
                    >
                      {getLocalizedMonthAbbr(bucket.monthIndex, currentLang)} {bucket.year} ({bucket.count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Days of the Week */}
            <div
              className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 notranslate"
              translate="no"
            >
              {getLocalizedWeekdays(currentLang, 3).map((w, idx) => (
                <span key={idx}>{w}</span>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Blank offset cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[72px] sm:min-h-[96px] rounded-2xl bg-slate-50/50 border border-transparent" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayEvents = eventsByDay[dayNum] || [];
                const monthStr = String(calendarMonth + 1).padStart(2, '0');
                const dayStr = String(dayNum).padStart(2, '0');
                const dateKey = `${calendarYear}-${monthStr}-${dayStr}`;
                const isSelected = selectedDateFilter === dateKey;
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`min-h-[72px] sm:min-h-[96px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600 shadow-md'
                        : hasEvents
                        ? 'border-purple-200 bg-white hover:border-[#5A1E65] hover:shadow-md'
                        : 'border-slate-100 bg-white/70 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm font-black ${
                        isSelected 
                          ? 'text-[#5A1E65]' 
                          : hasEvents 
                          ? 'text-slate-900' 
                          : 'text-slate-400'
                      }`}>
                        {dayNum}
                      </span>
                      {hasEvents && (
                        <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                      )}
                    </div>

                    {hasEvents && (
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div 
                            key={ev.id}
                            className="text-[10px] sm:text-[11px] font-bold text-[#5A1E65] truncate bg-purple-100/70 px-1.5 py-0.5 rounded-md leading-tight"
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] text-slate-500 font-bold block">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Filter Banner */}
            {selectedDateFilter && (
              <div className="mt-6 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Filtered by Date: <strong>{selectedDateFilter}</strong> ({filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'} found)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter(null)}
                  className="px-3 py-1.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-colors cursor-pointer"
                >
                  Show All Events for Month
                </button>
              </div>
            )}

          </div>
        </section>
      )}

      {/* Weekly Programs Calendar View */}
      {viewMode === 'weekly' && (
        <section className="container-clean py-10">
          <WeeklyProgramsCalendar />
        </section>
      )}

      {/* Event Cards Section */}
      <section className="container-clean py-8" id="events-container">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
              {selectedDateFilter
                ? 'Events on Selected Date'
                : viewMode === 'calendar'
                ? `Events for ${currentMonthName} ${calendarYear}`
                : viewMode === 'weekly'
                ? 'All Upcoming Events'
                : activeTab === 'upcoming'
                ? `Events for ${currentMonthName} ${calendarYear}`
                : `Past Events Archive (${currentMonthName} ${calendarYear})`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Showing {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'} for {currentMonthName} {calendarYear}
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
              {activeTab === 'upcoming' && !selectedDateFilter ? ' · Current Month' : ''}
            </p>
          </div>

          {/* Toggle between Upcoming Events and Past Archive in Cards View */}
          {viewMode === 'list' && !selectedDateFilter && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upcoming'
                    ? 'bg-[#5A1E65] text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upcoming ({upcomingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'past'
                    ? 'bg-[#5A1E65] text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Past Archive ({pastCount})
              </button>
            </div>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
            <p className="font-display text-xl font-bold text-slate-900">No events match your criteria for {currentMonthName} {calendarYear}.</p>
            <p className="text-xs text-slate-500">Try adjusting your category filter, selected date, or browse upcoming months.</p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button 
                onClick={() => { 
                  setSearchInput('');
                  setSearchQuery(''); 
                  setSelectedCategory('All'); 
                  setSelectedDateFilter(null);
                }}
                className="btn-primary py-2 px-5 text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="px-5 py-2 rounded-xl bg-[#5A1E65] text-white text-xs font-bold cursor-pointer hover:bg-[#43144A] transition-colors"
              >
                View Events for {nextMonthName}
              </button>
            </div>
          </div>
        ) : (
          <MobileCarousel
            cols={1}
            autoScrollMs={0}
            showDots={true}
            cardClassName="h-full"
            className="lg:gap-6"
          >
            {filteredEvents.map((evt, idx) => {
              const dateGradients = [
                'from-purple-950 via-purple-900 to-indigo-950 text-white',
                'from-amber-600 via-amber-500 to-amber-700 text-white',
                'from-emerald-700 via-teal-700 to-emerald-800 text-white',
                'from-slate-900 via-slate-800 to-purple-950 text-white'
              ];

              return (
                <CardSpotlight 
                  key={evt.id}
                  className="group relative overflow-hidden rounded-3xl border-2 border-purple-200/70 hover:border-[#5A1E65] bg-gradient-to-br from-white via-purple-50/35 to-amber-50/25 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between"
                  tilt={false}
                  maxTilt={0}
                  scale={1}
                  glare={false}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Large Typographic Date Badge */}
                    {(() => {
                      const parsedDate = parseEventDate(evt);
                      const badgeMonth = parsedDate
                        ? getLocalizedMonthAbbr(parsedDate.monthIndex, currentLang)
                        : (evt.month || 'TBD');
                      const badgeDay = parsedDate?.dayStr || evt.day || '—';
                      const badgeYear = parsedDate?.yearStr || evt.year || '2026';
                      return (
                        <div className="md:col-span-2 flex md:justify-center">
                          <div className={`flex flex-col items-center justify-center min-w-[100px] sm:min-w-[110px] p-4 sm:p-5 rounded-2xl bg-gradient-to-b ${dateGradients[idx % dateGradients.length]} shadow-md text-white`}>
                            <span
                              className="text-xs font-black uppercase tracking-wider text-amber-200 notranslate leading-tight"
                              translate="no"
                            >
                              {badgeMonth}
                            </span>
                            <span className="font-display text-3xl sm:text-4xl font-black leading-tight pt-0.5">{badgeDay}</span>
                            <span className="text-xs font-mono text-white/80 mt-0.5">{badgeYear}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Event Details */}
                    <div className="md:col-span-7 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100/80 text-[#5A1E65] border border-purple-200">
                          {evt.category}
                        </span>
                        {evt.isCancelled && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                            ⚠️ Cancelled / Rescheduled
                          </span>
                        )}
                        <span className="text-xs text-slate-600 font-bold flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200/80">
                          <Clock className="w-3.5 h-3.5 text-[#5A1E65]" /> {evt.time}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950 tracking-tight break-words min-w-0">
                        <Link to={`/events/${evt.slug}`} className="hover:text-[#5A1E65] transition-colors break-words">
                          {evt.title}
                        </Link>
                      </h2>

                      {evt.isCancelled && evt.cancellationNotice && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-rose-950 font-bold">Important Notice:</strong>
                            <span>{evt.cancellationNotice}</span>
                          </div>
                        </div>
                      )}

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        {evt.description}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{evt.location} · {evt.address}</span>
                      </div>
                    </div>

                    {/* Actions & Flyer Showcase */}
                    <div className="md:col-span-3 flex flex-col md:items-end gap-2.5 relative z-20">
                      <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden border border-purple-200/90 shadow-sm bg-slate-100 mb-1">
                        <AutoSlideImage
                          images={Array.isArray(evt.images) && evt.images.length > 0 ? evt.images : [evt.image || '/images/community-gathering.jpg']}
                          alt={evt.title}
                          aspectRatio="aspect-[16/10]"
                          className="w-full h-full"
                          imageFit="cover"
                          fallbackSrc="/images/community-gathering.jpg"
                          showDots={true}
                          showArrows={false}
                        />
                      </div>
                      <Link
                        to={`/events/${evt.slug}`}
                        className="btn-primary py-3 px-6 text-xs font-bold w-full md:w-auto text-center shadow-md hover:shadow-xl inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Details & RSVP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {evt.registrationUrl ? (
                        evt.registrationUrl.startsWith('http') ? (
                          <a
                            href={evt.registrationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#5A1E65] hover:underline flex items-center gap-1 py-1"
                          >
                            <span>External Registration Link</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <Link
                            to={evt.registrationUrl}
                            className="text-xs font-bold text-[#5A1E65] hover:underline flex items-center gap-1 py-1"
                          >
                            <span>{evt.category === 'Health & Wellness' ? 'Book Screening Slot' : 'Direct Registration'}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-500 font-bold bg-white/70 px-2.5 py-0.5 rounded-full border border-slate-200/80">Free Drop-In · All Welcome</span>
                      )}
                    </div>

                  </div>
                </CardSpotlight>
              );
            })}
          </MobileCarousel>
        )}

        {/* View Events for Next Month (and Previous Month) */}
        <div className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#5A1E65]" />
            <span>View Events for {prevMonthName}</span>
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-102 active:scale-98"
          >
            <span>View Events for {nextMonthName}</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </div>

      </section>

      {/* Annual Signature Events Spotlight */}
      <section className="container-clean pt-6">
        <div className="p-8 md:p-12 aurora-bg text-white rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ANNUAL FLAGSHIPS</span>
            </span>
            <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-white">
              Signature Events of Ventura County
            </h3>
            <p className="text-sm md:text-base text-purple-100 max-w-2xl leading-relaxed">
              Throughout the year, DCVC convenes our county for premier celebratory milestones — including Ventura County Pride, the Diversity Gala, AIDS Walk Ventura, Pride Prom, and Transgender Day of Remembrance.
            </p>

            <MobileCarousel cols={3} autoScrollMs={0} className="pt-4">
              {annualSignatureEvents.map((sig) => (
                <Link
                  key={sig.title}
                  to={sig.link.startsWith('http') ? '/events' : sig.link}
                  className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-amber-300 transition-all hover:scale-102 flex flex-col justify-between group cursor-pointer h-full"
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">{sig.season || 'Annual'}</span>
                    <h4 className="font-display text-xl font-bold text-white group-hover:text-amber-200 transition-colors flex items-center justify-between">
                      <span>{sig.title}</span>
                      <ArrowUpRight className="w-4 h-4 text-amber-300" />
                    </h4>
                    <p className="text-xs text-purple-100 leading-relaxed">{sig.description}</p>
                  </div>
                </Link>
              ))}
            </MobileCarousel>
          </div>
        </div>
      </section>

    </div>
  );
}
