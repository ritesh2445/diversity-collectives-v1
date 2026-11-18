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
  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth();

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

