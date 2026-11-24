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
import HomeCalendarSection from '../components/HomeCalendarSection.jsx';
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
                placeholder="Search events, screenings, topics, or venues..."
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

      {/* Monthly Interactive Calendar View (Identical to Home Page Calendar) */}
      {viewMode === 'calendar' && (
        <HomeCalendarSection
          events={events}
          props={{
            hideCta: true,
            eyebrow: 'COMMUNITY CALENDAR',
            headline: 'Interactive Schedule & Dates',
            description: 'Browse scheduled dates at a glance — distinct from our recurring Programs and Signature Events.',
            initialYear: calendarYear,
            initialMonth: calendarMonth
          }}
          onSelectDate={(dayNum, monthIdx, yearNum) => {
            const monthStr = String(monthIdx + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const dateKey = `${yearNum}-${monthStr}-${dayStr}`;
            setSelectedDateFilter(dateKey);
            document.getElementById('events-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
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
            cols={3}
            autoScrollMs={0}
            showDots={true}
            className="items-stretch gap-6"
            cardClassName="h-full flex flex-col"
          >
            {filteredEvents.map((evt, idx) => {
              const dateGradients = [
                'from-purple-800 via-[#5A1E65] to-indigo-900 text-white shadow-purple-500/25',
                'from-amber-500 via-orange-500 to-rose-600 text-white shadow-amber-500/25',
                'from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-teal-500/25',
                'from-rose-600 via-pink-600 to-purple-800 text-white shadow-rose-500/25',
                'from-blue-600 via-indigo-600 to-purple-700 text-white shadow-blue-500/25',
                'from-violet-600 via-purple-700 to-fuchsia-800 text-white shadow-violet-500/25',
                'from-emerald-700 via-teal-700 to-slate-900 text-white shadow-emerald-500/25'
              ];

              let catBadge = "text-purple-800 bg-purple-100/70 border-purple-200";
              const catLower = (evt.category || '').toLowerCase();
              if (catLower.includes('youth')) catBadge = "text-amber-800 bg-amber-100/70 border-amber-200";
              else if (catLower.includes('health') || catLower.includes('screen')) catBadge = "text-teal-800 bg-teal-100/70 border-teal-200";
              else if (catLower.includes('senior') || catLower.includes('55')) catBadge = "text-emerald-800 bg-emerald-100/70 border-emerald-200";
              else if (catLower.includes('growth') || catLower.includes('toastmaster')) catBadge = "text-indigo-800 bg-indigo-100/70 border-indigo-200";
              else if (catLower.includes('pride') || catLower.includes('signature') || catLower.includes('walk') || catLower.includes('gala')) catBadge = "text-rose-800 bg-rose-100/70 border-rose-200";

              const parsedDate = parseEventDate(evt);
              const badgeMonth = parsedDate
                ? getLocalizedMonthAbbr(parsedDate.monthIndex, currentLang)
                : (evt.month || 'EVT');
              const badgeDay = evt.day || parsedDate?.dayStr || '—';

              return (
                <CardSpotlight 
                  key={evt.id}
                  className={`${['card-vibrant-purple', 'card-vibrant-rose', 'card-vibrant-amber', 'card-vibrant-teal', 'card-vibrant-indigo'][idx % 5]} p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-200 flex-1 h-full flex flex-col justify-between rounded-3xl border-2 border-purple-200/70 overflow-hidden group`}
                  contentClassName="flex flex-col justify-between h-full"
                  tilt={false}
                  maxTilt={0}
                  scale={1}
                  glare={false}
                >
                  <div className="flex flex-col justify-between h-full gap-3.5">
                    
                    {/* Event Photography Header */}
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-purple-200/60 shrink-0">
                      <img
                        src={evt.image || '/images/community-gathering.jpg'}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = '/images/community-gathering.jpg'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                      
                      {/* Floating Date Badge */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <div className={`flex flex-col items-center justify-center min-w-[64px] sm:min-w-[70px] px-2.5 py-1.5 rounded-xl bg-gradient-to-b ${dateGradients[idx % dateGradients.length]} text-white shadow-md backdrop-blur-xs`}>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 leading-tight notranslate" translate="no">
                            {badgeMonth}
                          </span>
                          <span className="font-display text-lg sm:text-xl font-black leading-none pt-0.5">{badgeDay}</span>
                        </div>
                      </div>

                      {/* Category & Cancellation Chips */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        {evt.isCancelled && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                            Cancelled
                          </span>
                        )}
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md ${catBadge}`}>
                          {evt.category}
                        </span>
                      </div>
                    </div>

                    {/* Time & Location Row */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-xs text-slate-700 flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-[#5A1E65]" /> {evt.time}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold truncate">
                        📍 {evt.location || 'Ventura'}
                      </span>
                    </div>

                    {/* Title & Description with Standardized Uniform Heights */}
                    <div className="flex flex-col gap-1.5 flex-1">
                      <h3 className="font-display text-lg font-black text-slate-950 pt-0.5 line-clamp-2 min-h-[3.25rem] group-hover:text-[#5A1E65] transition-colors leading-snug">
                        <Link to={`/events/${evt.slug}`} className="hover:text-[#5A1E65] transition-colors">
                          {evt.title}
                        </Link>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed line-clamp-2 min-h-[2.75rem]">
                        {evt.description}
                      </p>
                    </div>

                    {/* Cancellation Notice if applicable */}
                    {evt.isCancelled && evt.cancellationNotice && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{evt.cancellationNotice}</span>
                      </div>
                    )}

                    {/* Standardized Bottom Action */}
                    <div className="pt-3 border-t border-purple-100/80 mt-auto flex flex-col justify-start gap-2 min-h-[4.25rem] relative z-20">
                      <Link 
                        to={`/events/${evt.slug}`}
                        className="btn-secondary text-xs py-2 px-4 w-full text-center font-bold justify-center"
                      >
                        <span>Details & RSVP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      {evt.registrationUrl && (
                        <div className="text-center">
                          {evt.registrationUrl.startsWith('http') ? (
                            <a
                              href={evt.registrationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-[#5A1E65] hover:underline inline-flex items-center gap-1"
                            >
                              <span>External Registration</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          ) : (
                            <Link
                              to={evt.registrationUrl}
                              className="text-[11px] font-bold text-[#5A1E65] hover:underline inline-flex items-center gap-1"
                            >
                              <span>{evt.category === 'Health & Wellness' ? 'Book Screening Slot' : 'Direct Registration'}</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
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
      <section className="container-clean pt-6 pb-8">
        <div className="p-5 sm:p-8 md:p-12 aurora-bg text-white rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="space-y-4 sm:space-y-6 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ANNUAL FLAGSHIPS</span>
            </span>
            <h3 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight">
              Signature Events of Ventura County
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-purple-100 max-w-2xl leading-relaxed">
              Throughout the year, DCVC convenes our county for premier celebratory milestones — including Ventura County Pride, the Diversity Gala, AIDS Walk Ventura, Pride Prom, and Transgender Day of Remembrance.
            </p>

            <MobileCarousel
              cols={3}
              autoScrollMs={0}
              className="pt-2 sm:pt-4 items-stretch"
              cardClassName="h-full flex flex-col"
            >
              {annualSignatureEvents.map((sig) => (
                <Link
                  key={sig.title}
                  to={sig.link.startsWith('http') ? '/events' : sig.link}
                  className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-amber-300 transition-all hover:scale-102 flex flex-col justify-between group cursor-pointer flex-1 h-full gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">{sig.season || 'Annual'}</span>
                    <h4 className="font-display text-base sm:text-xl font-bold text-white group-hover:text-amber-200 transition-colors flex items-start justify-between gap-2">
                      <span className="line-clamp-2">{sig.title}</span>
                      <ArrowUpRight className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    </h4>
                    <p className="text-xs text-purple-100 leading-relaxed line-clamp-3">{sig.description}</p>
                  </div>
                  <span className="text-[11px] font-bold text-amber-300/80 mt-1 block">{sig.schedule || sig.date || ''}</span>
                </Link>
              ))}
            </MobileCarousel>
          </div>
        </div>
      </section>

    </div>
  );
}
