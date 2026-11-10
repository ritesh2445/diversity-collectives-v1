import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { usePageMeta } from '../utils/seo';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_ABBRS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

export default function Events() {
  usePageMeta({
    title: 'Events & Cultural Calendar',
    description: 'Explore upcoming LGBTQ+ youth circles, health screening clinics, social mixers, and Pride celebrations across Ventura County.',
    canonicalPath: '/events'
  });

  const [events, setEvents] = useState(() => cmsStore.getEvents());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  
  // Traditional Monthly Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date(2026, 9, 1)); // Oct 2026 default to align with authentic events
  const [selectedDateFilter, setSelectedDateFilter] = useState(null); // '2026-10-09' or null

  useEffect(() => {
    const unsubscribe = cmsStore.subscribe((data) => {
      if (data?.events) setEvents(data.events);
    });
    return unsubscribe;
  }, []);

  const categories = [
    'All', 
    'Health & Wellness', 
    'Youth', 
    'Adult Support', 
    'Seniors', 
    'Professional Growth', 
    'Signature Event', 
    'Festival & Celebration'
  ];

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
    setSelectedDateFilter(null);
  };

  // Helper to parse event month abbreviation
  const getEventDateKey = (evt) => {
    const monthIndex = MONTH_ABBRS.indexOf((evt.month || '').toUpperCase());
    if (monthIndex === -1) return null;
    const year = evt.year || '2026';
    const day = String(evt.day || '1').padStart(2, '0');
    const month = String(monthIndex + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        evt.title.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q) ||
        evt.location.toLowerCase().includes(q) ||
        evt.category.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'All' || evt.category === selectedCategory;

      const dateKey = getEventDateKey(evt);
      const matchesDate = !selectedDateFilter || dateKey === selectedDateFilter;

      return matchesSearch && matchesCat && matchesDate;
    });
  }, [events, searchQuery, selectedCategory, selectedDateFilter]);

  // Calendar calculations for selected month
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth(); // 0-11
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)

  // Group events by day of current calendar month
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(evt => {
      const monthIndex = MONTH_ABBRS.indexOf((evt.month || '').toUpperCase());
      const evtYear = parseInt(evt.year || '2026', 10);
      if (monthIndex === calendarMonth && evtYear === calendarYear) {
        const dayNum = parseInt(evt.day, 10);
        if (!map[dayNum]) map[dayNum] = [];
        map[dayNum].push(evt);
      }
    });
    return map;
  }, [events, calendarMonth, calendarYear]);

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
    setSelectedDateFilter(null);
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
    setSelectedDateFilter(null);
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
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
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
              <span className="font-serif italic font-normal text-[#5A1E65]">Upcoming Gatherings.</span>
            </h1>
            <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
              From weekly youth circles and free testing clinics to seaside Pride and annual galas, explore upcoming events across Ventura County.
            </p>
          </div>

          {/* View Switcher: List vs Traditional Calendar Grid */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 self-start md:self-end flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setSelectedDateFilter(null);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[#5A1E65] text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>View Calendar</span>
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
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
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

            {/* Days of the Week */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
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
                    Filtered by Date: <strong>{selectedDateFilter}</strong> ({filteredEvents.length} gathering{filteredEvents.length === 1 ? '' : 's'} found)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter(null)}
                  className="px-3 py-1.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-colors cursor-pointer"
                >
                  Show All Gatherings for Month
                </button>
              </div>
            )}

          </div>
        </section>
      )}

      {/* Event Cards Section */}
      <section className="container-clean py-8">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
              {viewMode === 'calendar' ? 'Events for Selected Timeframe' : 'Upcoming Gatherings'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Showing {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </p>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
            <p className="font-display text-xl font-bold text-slate-900">No gatherings match your criteria.</p>
            <p className="text-xs text-slate-500">Try adjusting your category filter, selected date, or search terms.</p>
            <button 
              onClick={() => { 
                setSearchInput('');
                setSearchQuery(''); 
                setSelectedCategory('All'); 
                setSelectedDateFilter(null);
              }}
              className="btn-primary py-2 px-5 text-xs font-bold mt-2 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6 perspective-1000">
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
                  className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-slate-200/90 hover:border-[#5A1E65]/80 transition-all duration-200 shadow-sm hover:shadow-xl"
                  tilt={true}
                  maxTilt={2.2}
                  scale={1.008}
                  glare={true}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Large Typographic Date Badge */}
                    <div className="md:col-span-2 flex md:justify-center">
                      <div className={`flex flex-col items-center justify-center min-w-[80px] p-4 rounded-2xl bg-gradient-to-b ${dateGradients[idx % dateGradients.length]} shadow-md`}>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">{evt.month}</span>
                        <span className="font-display text-2xl sm:text-3xl font-black">{evt.day}</span>
                        <span className="text-[10px] font-mono text-white/70 mt-0.5">{evt.year}</span>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="md:col-span-7 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200">
                          {evt.category}
                        </span>
                        {evt.isCancelled && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                            ⚠️ Cancelled / Rescheduled
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#5A1E65]" /> {evt.time}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                        <Link to={`/events/${evt.slug}`} className="hover:text-[#5A1E65] transition-colors">
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

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {evt.description}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{evt.location} · {evt.address}</span>
                      </div>
                    </div>

                    {/* Actions: 100% In-App */}
                    <div className="md:col-span-3 flex flex-col md:items-end gap-2.5 relative z-20">
                      <Link
                        to={`/events/${evt.slug}`}
                        className="btn-primary py-3 px-6 text-xs font-bold w-full md:w-auto text-center shadow-md hover:shadow-xl inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Details & RSVP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {evt.registrationUrl ? (
                        <Link
                          to={evt.registrationUrl.startsWith('http') ? '/appointments' : evt.registrationUrl}
                          className="text-xs font-bold text-[#5A1E65] hover:underline flex items-center gap-1 py-1"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Direct Registration</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Free Drop-In · No Ticket Needed</span>
                      )}
                    </div>

                  </div>
                </CardSpotlight>
              );
            })}
          </div>
        )}

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
              Signature Gatherings of Ventura County
            </h3>
            <p className="text-sm md:text-base text-purple-100 max-w-2xl leading-relaxed">
              Throughout the year, DCVC convenes our county for premier celebratory milestones — including Ventura County Pride, the Diversity Gala, and the AIDS Walk.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              {annualSignatureEvents.map((sig) => (
                <Link
                  key={sig.title}
                  to={sig.link.startsWith('http') ? '/events' : sig.link}
                  className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-amber-300 transition-all hover:scale-102 flex flex-col justify-between group cursor-pointer"
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
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
