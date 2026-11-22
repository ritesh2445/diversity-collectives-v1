/**
 * Smart Event Date Parser & Calendar Normalization Utility
 * Used by both Admin CMS Event Creator/Editor and Public Events Calendar (/events & /)
 * so any human-entered or date-picker event date automatically updates calendars.
 */

export const MONTH_ABBRS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns localized full month name (e.g. "October", "Octubre", "Octobre", "Oktober")
 * with first letter capitalized.
 */
export function getLocalizedMonthName(monthIndex, lang = 'en') {
  try {
    const d = new Date(2026, monthIndex, 1);
    const name = d.toLocaleDateString(lang || 'en', { month: 'long' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return MONTH_FULL[monthIndex] || '';
  }
}

/**
 * Returns localized abbreviated month name (e.g. "OCT", "OCT", "OKT")
 */
export function getLocalizedMonthAbbr(monthIndex, lang = 'en') {
  try {
    const d = new Date(2026, monthIndex, 1);
    const abbr = d.toLocaleDateString(lang || 'en', { month: 'short' });
    return abbr.replace(/\.$/, '').toUpperCase();
  } catch {
    return MONTH_ABBRS[monthIndex] || '';
  }
}

/**
 * Returns localized 7-day weekday abbreviations (Sunday to Saturday)
 * e.g. ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'] for Spanish,
 * ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] for English.
 */
export function getLocalizedWeekdays(lang = 'en', length = 2) {
  try {
    const days = [];
    // 2026-10-04 is a Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(2026, 9, 4 + i);
      const name = d.toLocaleDateString(lang || 'en', { weekday: 'short' });
      const cleaned = name.replace(/\.$/, '');
      const formatted = cleaned.length > length ? cleaned.slice(0, length) : cleaned;
      days.push(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    }
    return days;
  } catch {
    return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  }
}

const MONTH_NAME_LOOKUP = (() => {
  const map = new Map();
  MONTH_ABBRS.forEach((abbr, idx) => map.set(abbr.toLowerCase(), idx));
  MONTH_FULL.forEach((full, idx) => map.set(full.toLowerCase(), idx));
  map.set('sept', 8);
  return map;
})();

function toValidDateParts(year, monthIndex, day) {
  const y = Number(year);
  const m = Number(monthIndex);
  const d = Number(day);
  if (!Number.isInteger(y) || y < 1900 || y > 2100) return null;
  if (!Number.isInteger(m) || m < 0 || m > 11) return null;
  const maxDays = new Date(y, m + 1, 0).getDate();
  if (!Number.isInteger(d) || d < 1 || d > maxDays) return null;

  const paddedMonth = String(m + 1).padStart(2, '0');
  const paddedDay = String(d).padStart(2, '0');
  const isoDate = `${y}-${paddedMonth}-${paddedDay}`;
  return {
    year: y,
    yearStr: String(y),
    monthIndex: m,
    monthAbbr: MONTH_ABBRS[m],
    monthName: MONTH_FULL[m],
    day: d,
    dayStr: String(d),
    isoDate,
    dateKey: isoDate,
    displayDate: `${MONTH_FULL[m]} ${d}, ${y}`,
    timestamp: new Date(y, m, d).getTime()
  };
}

/**
 * Parse an event object or date string (`isoDate`, `date`, or `month`/`day`/`year`).
 */
export function parseEventDate(evtOrStr) {
  if (!evtOrStr) return null;

  if (typeof evtOrStr === 'string') {
    const raw = evtOrStr.trim();
    if (!raw) return null;

    // 1. ISO YYYY-MM-DD (or YYYY-MM-DDTHH:mm...)
    const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|T|\s)/);
    if (isoMatch) {
      return toValidDateParts(isoMatch[1], Number(isoMatch[2]) - 1, isoMatch[3]);
    }

    // 2. Named Month: "August 15, 2026", "Mar 31, 2026", "June 15–17, 2026", "Oct 9 2026"
    const namedMatch = raw.match(/^([A-Za-z]+)\.?\s+(\d{1,2})(?:\s*[-–—]\s*\d{1,2})?(?:,|\s)+(\d{4})/);
    if (namedMatch) {
      const mIdx = MONTH_NAME_LOOKUP.get(namedMatch[1].toLowerCase());
      if (mIdx !== undefined) {
        return toValidDateParts(namedMatch[3], mIdx, namedMatch[2]);
      }
    }

    // 3. Slash format MM/DD/YYYY
    const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      return toValidDateParts(slashMatch[3], Number(slashMatch[1]) - 1, slashMatch[2]);
    }

    // 4. Native JS Date fallback (local parts if valid)
    const fallback = new Date(raw);
    if (!Number.isNaN(fallback.getTime())) {
      return toValidDateParts(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
    }

    return null;
  }

  if (typeof evtOrStr === 'object') {
    // Prefer isoDate or date string first when updated by forms
    if (evtOrStr.isoDate) {
      const parsedIso = parseEventDate(String(evtOrStr.isoDate));
      if (parsedIso) return parsedIso;
    }
    if (evtOrStr.date) {
      const parsedDateStr = parseEventDate(String(evtOrStr.date));
      if (parsedDateStr) return parsedDateStr;
    }
    if (evtOrStr.month && evtOrStr.day) {
      const mIdx = MONTH_NAME_LOOKUP.get(String(evtOrStr.month).trim().toLowerCase());
      const dayMatch = String(evtOrStr.day).match(/\d{1,2}/);
      const yNum = parseInt(String(evtOrStr.year || new Date().getFullYear()), 10);
      if (mIdx !== undefined && dayMatch) {
        return toValidDateParts(yNum, mIdx, dayMatch[0]);
      }
    }
  }

  return null;
}

/**
 * Ensures any event object carries synced `date`, `isoDate`, `month`, `day`, `year` fields
 * so homepage badges, event lists, and the interactive monthly calendar always stay aligned.
 */
export function normalizeCmsEvent(evt) {
  if (!evt || typeof evt !== 'object') return evt;
  const parsed = parseEventDate(evt);
  if (!parsed) return { ...evt };

  const rawDate = typeof evt.date === 'string' ? evt.date.trim() : '';
  const isRawIso = /^\d{4}-\d{1,2}-\d{1,2}/.test(rawDate);
  const displayDate = !rawDate || isRawIso ? parsed.displayDate : rawDate;

  return {
    ...evt,
    isCancelled: Boolean(evt.isCancelled),
    cancellationNotice: evt.cancellationNotice || '',
    date: displayDate,
    isoDate: parsed.isoDate,
    month: parsed.monthAbbr,
    day: evt.day && /\d+[-–]\d+/.test(String(evt.day)) ? String(evt.day) : parsed.dayStr,
    year: parsed.yearStr
  };
}

export function normalizeCmsEventList(events) {
  if (!Array.isArray(events)) return [];
  return events.map(normalizeCmsEvent);
}

/**
 * Picks the smartest default calendar month:
 * - Current month if it has any events
 * - Otherwise the nearest upcoming event month
 * - Otherwise the latest event month
 */
export function findBestCalendarMonth(events, referenceDate = new Date()) {
  const ref = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? referenceDate
    : new Date();
  const pacificToday = getCurrentPacificDate(ref);
  const refYear = pacificToday.year;
  const refMonth = pacificToday.monthIndex;

  const parsedEvents = (Array.isArray(events) ? events : [])
    .map(parseEventDate)
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (parsedEvents.length === 0) {
    return new Date(refYear, refMonth, 1);
  }

  const hasCurrentMonthEvent = parsedEvents.some(
    (p) => p.year === refYear && p.monthIndex === refMonth
  );
  if (hasCurrentMonthEvent) {
    return new Date(refYear, refMonth, 1);
  }

  const monthStartTs = new Date(refYear, refMonth, 1).getTime();
  const nextUpcoming = parsedEvents.find((p) => p.timestamp >= monthStartTs);
  if (nextUpcoming) {
    return new Date(nextUpcoming.year, nextUpcoming.monthIndex, 1);
  }

  const latest = parsedEvents[parsedEvents.length - 1];
  return new Date(latest.year, latest.monthIndex, 1);
}

/**
 * Resolves current calendar date in Ventura County, California (America/Los_Angeles).
 * Handles global viewers in different timezones so dates are not misclassified.
 */
export function getCurrentPacificDate(referenceDate = new Date()) {
  const ref = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? referenceDate
    : new Date();
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = dtf.formatToParts(ref);
    const pMap = {};
    for (const p of parts) pMap[p.type] = p.value;
    const year = parseInt(pMap.year, 10);
    const month = parseInt(pMap.month, 10);
    const day = parseInt(pMap.day, 10);
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, monthIndex: month - 1, day, isoDate };
  } catch {
    const y = ref.getFullYear();
    const m = ref.getMonth();
    const d = ref.getDate();
    return {
      year: y,
      monthIndex: m,
      day: d,
      isoDate: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    };
  }
}

/**
 * Returns UTC epoch timestamp (in ms) when an event concludes in Pacific Time.
 * If the event has an end time (e.g. 7:00 PM), it concludes at that specific time.
 * If all-day or unspecified time, it concludes at 23:59:59 Pacific Time of that date.
 */
export function getPacificEventEndTimestamp(event) {
  if (!event) return 0;
  const parsed = parseEventDate(event);
  if (!parsed || !parsed.isoDate) return 0;

  const [yearStr, monthStr, dayStr] = parsed.isoDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  let hours = 23, minutes = 59, seconds = 59;
  const timeStr = event.time || event.schedule || '';
  if (timeStr && timeStr.toLowerCase() !== 'all day') {
    const allTimes = [...timeStr.matchAll(/(\d{1,2}):(\d{2})\s*([ap]m)?/gi)];
    if (allTimes.length > 0) {
      const targetTime = allTimes[allTimes.length - 1];
      hours = parseInt(targetTime[1], 10);
      minutes = parseInt(targetTime[2], 10);
      const ampm = targetTime[3] ? targetTime[3].toLowerCase() : null;
      if (!ampm && allTimes.length > 1 && allTimes[0][3]) {
        const globalAmpm = (allTimes[allTimes.length - 1][3] || allTimes[0][3]).toLowerCase();
        if (globalAmpm === 'pm' && hours < 12) hours += 12;
      } else if (ampm === 'pm' && hours < 12) {
        hours += 12;
      } else if (ampm === 'am' && hours === 12) {
        hours = 0;
      } else if (!ampm && hours >= 1 && hours <= 7) {
        hours += 12;
      }
      seconds = 0;
    }
  }

  // Find UTC timestamp matching this America/Los_Angeles wall time
  try {
    const guessUtc = Date.UTC(year, month - 1, day, hours, minutes, seconds);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date(guessUtc));
    const pMap = {};
    for (const p of parts) pMap[p.type] = p.value;
    const pYear = parseInt(pMap.year, 10);
    const pMonth = parseInt(pMap.month, 10);
    const pDay = parseInt(pMap.day, 10);
    let pHour = parseInt(pMap.hour, 10);
    if (pHour === 24) pHour = 0;
    const pMin = parseInt(pMap.minute, 10);
    const pSec = parseInt(pMap.second, 10);

    const pUtc = Date.UTC(pYear, pMonth - 1, pDay, pHour, pMin, pSec);
    const offset = guessUtc - pUtc;

    return guessUtc + offset;
  } catch {
    return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
  }
}

/**
 * Returns true if an event is upcoming or currently active relative to referenceDate.
 * Timezone-aware: evaluates against the event's Pacific Time finish.
 */
export function isUpcomingEvent(event, referenceDate = new Date()) {
  const refMs = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? referenceDate.getTime()
    : Date.now();
  const endTs = getPacificEventEndTimestamp(event);
  if (!endTs) return false;
  return endTs >= refMs;
}

/**
 * Returns true if an event is in the past relative to referenceDate.
 */
export function isPastEvent(event, referenceDate = new Date()) {
  return !isUpcomingEvent(event, referenceDate);
}

/**
 * Filters an event list to strictly upcoming events, sorted chronologically (earliest first).
 */
export function filterUpcomingEvents(events, referenceDate = new Date()) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((e) => isUpcomingEvent(e, referenceDate))
    .sort((a, b) => {
      const tsA = getPacificEventEndTimestamp(a);
      const tsB = getPacificEventEndTimestamp(b);
      return tsA - tsB;
    });
}

/**
 * Filters an event list to strictly past events, sorted reverse-chronologically (most recent first).
 */
export function filterPastEvents(events, referenceDate = new Date()) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((e) => isPastEvent(e, referenceDate))
    .sort((a, b) => {
      const tsA = getPacificEventEndTimestamp(a);
      const tsB = getPacificEventEndTimestamp(b);
      return tsB - tsA;
    });
}

