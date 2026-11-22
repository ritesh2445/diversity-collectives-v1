/**
 * Diversity Collective Ventura County — Recurring Programs & Weekly Calendar Engine
 * Implements deterministic monthly occurrence logic (1st, 2nd, 3rd occurrence of weekdays)
 * and chronological week aggregation for public calendars and homepage spotlights.
 */

export const DEFAULT_WEEKLY_SCHEDULE = [
  {
    id: 'prog-na-monday',
    name: 'Narcotics Anonymous',
    dayOfWeek: 1, // Monday
    dayName: 'Monday',
    recurrence: 'every',
    recurrenceLabel: 'Every Monday',
    time: '6:00 PM',
    location: 'DCVC Community Resource Center',
    address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
    category: 'Recovery & Peer Support',
    description: 'LGBTQ+ welcoming recovery meeting providing fellowship, mutual support, and hope for individuals on the journey of recovery.',
    link: '/community'
  },
  {
    id: 'prog-toastmasters-tuesday',
    name: 'Diversity Toastmasters',
    dayOfWeek: 2, // Tuesday
    dayName: 'Tuesday',
    recurrence: [1, 3], // 1st & 3rd Tuesday
    recurrenceLabel: '1st & 3rd Tuesday of the Month',
    time: '6:15 PM',
    location: 'DCVC Community Resource Center',
    address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
    category: 'Professional & Personal Growth',
    description: 'LGBTQ+ friendly club to practice public speaking, presentation skills, and leadership development in a safe, affirming environment.',
    link: '/community'
  },
  {
    id: 'prog-pflag-tuesday',
    name: 'PFLAG Ventura Chapter',
    dayOfWeek: 2, // Tuesday
    dayName: 'Tuesday',
    recurrence: [2], // 2nd Tuesday
    recurrenceLabel: '2nd Tuesday of the Month',
    time: '6:30 PM',
    location: 'DCVC Community Resource Center',
    address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
    category: 'Family & Ally Support',
    description: 'The nation\'s largest organization dedicated to supporting, educating, and advocating for LGBTQ+ people and their families.',
    link: '/community'
  },
  {
    id: 'prog-queer-adulting-wednesday',
    name: 'Queer Adulting Support Group',
    dayOfWeek: 3, // Wednesday
    dayName: 'Wednesday',
    recurrence: [1, 3], // 1st & 3rd Wednesday
    recurrenceLabel: '1st & 3rd Wednesday of the Month',
    time: '', // No time supplied in prompt; do not invent times
    location: 'DCVC Community Resource Center',
    address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
    category: 'Adult Peer Support',
    description: 'An all-inclusive LGBTQAI+ meeting for adults 18+ to socialize, discuss career, relationships, identity, and life milestones.',
    link: '/community'
  },
  {
    id: 'prog-silver-collective-thursday',
    name: 'Silver Collective',
    dayOfWeek: 4, // Thursday
    dayName: 'Thursday',
    recurrence: [2], // 2nd Thursday of every month
    recurrenceLabel: '2nd Thursday of Every Month',
    time: '', // No time supplied in prompt; do not invent times
    location: 'DCVC Community Resource Center',
    address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
    category: 'Seniors / 55+',
    description: 'Creating welcoming spaces for LGBTQ+ adults 55+ to connect, reminisce, learn, and feel celebrated across Ventura County.',
    link: '/community'
  },
  {
    id: 'prog-rainbow-umbrella-friday',
    name: 'Rainbow Umbrella',
    dayOfWeek: 5, // Friday
    dayName: 'Friday',
    recurrence: 'every', // Every Friday
    recurrenceLabel: 'Every Friday',
    time: '', // No time supplied in prompt; do not invent times
    location: 'DCVC Community Resource Center',
    address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
    category: 'Youth Peer Support (Ages 13–23)',
    description: 'Affirming, safe peer support space for LGBTQ+ and questioning youth ages 13–23 to connect and build community.',
    link: '/programs/rainbow-umbrella'
  },
  {
    id: 'prog-little-unicorns-saturday',
    name: 'Little Unicorns',
    dayOfWeek: 6, // Saturday
    dayName: 'Saturday',
    recurrence: 'every', // Saturday program
    recurrenceLabel: 'Saturdays',
    time: '', // No time supplied in prompt; do not invent times
    location: 'DCVC Community Resource Center',
    address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
    category: 'Kids & Family Circle',
    description: 'Safe, playful connection for young LGBTQ+, questioning, and ally kids and their affirming parents.',
    link: '/programs/little-unicorns'
  },
  {
    id: 'prog-transverse-sunday',
    name: 'Transverse',
    dayOfWeek: 0, // Sunday
    dayName: 'Sunday',
    recurrence: 'every', // Sunday program
    recurrenceLabel: 'Sundays',
    time: '', // No time supplied in prompt; do not invent times
    location: 'DCVC Community Resource Center',
    address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
    category: 'Trans & Non-Binary Support',
    description: 'Trans peer support group for transgender and gender-expansive individuals.',
    link: '/community'
  }
];

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns the 1-indexed occurrence count of this weekday in the given month (1st, 2nd, 3rd, 4th, 5th).
 * Day 1–7 = 1st, Day 8–14 = 2nd, Day 15–21 = 3rd, Day 22–28 = 4th, Day 29–31 = 5th.
 */
export function getWeekdayOccurrenceInMonth(date) {
  const d = date instanceof Date ? date : new Date(date);
  return Math.ceil(d.getDate() / 7);
}

/**
 * Checks if a specific program is scheduled on the given date based on recurring logic.
 */
export function isProgramScheduledOnDate(program, date) {
  if (!program) return false;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;

  const dayOfWeek = d.getDay();
  if (Number(program.dayOfWeek) !== dayOfWeek) {
    return false;
  }

  const occurrence = getWeekdayOccurrenceInMonth(d);

  if (program.recurrence === 'every') {
    return true;
  }
  if (Array.isArray(program.recurrence)) {
    return program.recurrence.includes(occurrence);
  }
  if (typeof program.recurrence === 'number') {
    return program.recurrence === occurrence;
  }
  return false;
}

/**
 * Returns all programs from the schedule that are active on the specified date.
 */
export function getProgramsForDate(date, schedule = DEFAULT_WEEKLY_SCHEDULE) {
  const d = date instanceof Date ? date : new Date(date);
  const list = Array.isArray(schedule) && schedule.length > 0 ? schedule : DEFAULT_WEEKLY_SCHEDULE;
  return list.filter((p) => isProgramScheduledOnDate(p, d));
}

/**
 * Helper to produce ISO string YYYY-MM-DD in local time
 */
export function toLocalDateIso(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates an array of Date objects for the current calendar week starting Monday and ending Sunday.
 */
export function getCurrentWeekDays(referenceDate = new Date()) {
  const ref = referenceDate instanceof Date ? new Date(referenceDate.getTime()) : new Date(referenceDate);
  // In JavaScript getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const currentDay = ref.getDay();
  // Distance back to Monday (if Sunday (0), distance is 6 days back)
  const distanceToMonday = (currentDay + 6) % 7;
  
  const monday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - distanceToMonday, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 0, 0, 0));
  }
  return days;
}

/**
 * Aggregates upcoming programs and events for the current week in strict chronological order.
 * - Does NOT display past events.
 * - Shows program names, dates and available times without inventing missing details.
 * - Handles monthly recurring programs (1st/2nd/3rd occurrences) accurately.
 */
export function getUpcomingWeeklySchedule(referenceDate = new Date(), schedule = DEFAULT_WEEKLY_SCHEDULE, events = []) {
  const ref = referenceDate instanceof Date ? new Date(referenceDate.getTime()) : new Date(referenceDate);
  const weekDays = getCurrentWeekDays(ref);

  const todayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0).getTime();
  const todayIso = toLocalDateIso(ref);

  const upcomingDays = [];

  for (const dayDate of weekDays) {
    const dayTimestamp = dayDate.getTime();
    const dayIso = toLocalDateIso(dayDate);

    // Skip past days in the week
    if (dayTimestamp < todayStart) {
      continue;
    }

    const dayName = WEEKDAY_NAMES[dayDate.getDay()];
    const occurrence = getWeekdayOccurrenceInMonth(dayDate);
    const formattedDate = `${dayName}, ${MONTH_NAMES[dayDate.getMonth()]} ${dayDate.getDate()}`;

    // 1. Get recurring programs scheduled for this specific date
    const programsOnDate = getProgramsForDate(dayDate, schedule);

    // 2. Get special calendar events on this date
    const eventsOnDate = (events || []).filter((e) => {
      if (!e) return false;
      if (e.isoDate && e.isoDate === dayIso) return true;
      if (e.date && String(e.date).startsWith(dayIso)) return true;
      return false;
    });

    const items = [
      ...programsOnDate.map((p) => ({
        id: `${p.id}-${dayIso}`,
        title: p.name,
        time: p.time || '',
        category: p.category,
        location: p.location,
        recurrenceLabel: p.recurrenceLabel,
        description: p.description,
        isProgram: true,
        link: p.link || '/community'
      })),
      ...eventsOnDate.map((e) => ({
        id: e.id || `evt-${dayIso}-${e.slug || Math.random()}`,
        title: e.title,
        time: e.time || '',
        category: e.category || 'Special Event',
        location: e.location || 'DCVC Community Resource Center',
        recurrenceLabel: 'Special Gathering',
        description: e.description || '',
        isEvent: true,
        link: `/events/${e.slug || ''}`
      }))
    ];

    if (items.length > 0) {
      upcomingDays.push({
        date: dayDate,
        dayIso,
        dayName,
        occurrence,
        formattedDate,
        isToday: dayIso === todayIso,
        items
      });
    }
  }

  // If the week is finished (e.g. late Sunday) and no upcoming days remain,
  // roll over to next week so the section is always populated with upcoming gatherings!
  if (upcomingDays.length === 0) {
    const nextMonday = new Date(weekDays[0].getTime() + 7 * 24 * 60 * 60 * 1000);
    return getUpcomingWeeklySchedule(nextMonday, schedule, events);
  }

  return upcomingDays;
}
