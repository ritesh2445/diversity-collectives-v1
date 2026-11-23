/**
 * DCVC Calendar & Appointment Booking Engine
 * Strict date validation and clinic scheduling rules:
 * - HIV/STI Screenings: Exclusively 1st Monday of each month (3:00 PM – 7:00 PM) + dates explicitly opened by admin
 * - Community Flex Space: Weekdays only (Monday – Friday, 1:00 PM – 5:00 PM)
 */

function formatIso(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function getTodayIso() {
  const now = new Date();
  return formatIso(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Returns the exact day of month (1..7) of the 1st Monday in a given year and 0-indexed month.
 */
export function getFirstMondayDay(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 = Sun, 1 = Mon...
  // Days until Monday (1)
  const offset = (8 - firstDay) % 7; // if Sunday (0) -> 1; if Monday (1) -> 0; if Tuesday (2) -> 6...
  return 1 + offset;
}

/**
 * Checks if a given year, month (0-indexed), and day is the 1st Monday of that month.
 */
export function isFirstMonday(year, monthIndex, day) {
  return day === getFirstMondayDay(year, monthIndex);
}

/**
 * Generates the upcoming official 1st Monday clinic dates for the next N months.
 */
export function getUpcomingHivClinicDates(monthsAhead = 12, extraDates = [], blockedDates = []) {
  const today = getTodayIso();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const clinicDates = new Set();

  for (let i = 0; i < monthsAhead; i++) {
    const target = new Date(currentYear, currentMonth + i, 1);
    const y = target.getFullYear();
    const m = target.getMonth();
    const firstMon = getFirstMondayDay(y, m);
    const iso = formatIso(y, m, firstMon);

    if (iso >= today) {
      clinicDates.add(iso);
    }
  }

  // Include any extra dates opened by admin
  if (Array.isArray(extraDates)) {
    for (const d of extraDates) {
      if (typeof d === 'string' && d.trim() && d.trim() >= today) {
        clinicDates.add(d.trim());
      }
    }
  }

  // Exclude any explicitly blocked dates
  const blockedSet = new Set(Array.isArray(blockedDates) ? blockedDates.map(b => String(b).trim()) : []);
  for (const b of blockedSet) {
    clinicDates.delete(b);
  }

  return Array.from(clinicDates).sort();
}

/**
 * Strict validator for HIV screening appointments.
 */
export function isDateAllowedForHiv(dateStr, hivConfig = {}) {
  if (!dateStr || typeof dateStr !== 'string') {
    return {
      allowed: false,
      reason: 'Please select an appointment date.'
    };
  }

  const today = getTodayIso();
  if (dateStr < today) {
    return {
      allowed: false,
      reason: 'Appointment date cannot be in the past.'
    };
  }

  const extraDates = Array.isArray(hivConfig.allowedDates) ? hivConfig.allowedDates : [];
  const blockedDates = Array.isArray(hivConfig.blockedDates) ? hivConfig.blockedDates : [];

  if (blockedDates.includes(dateStr)) {
    return {
      allowed: false,
      reason: 'This date has been marked closed by DCVC clinic administrators. Please select another date.'
    };
  }

  if (extraDates.includes(dateStr)) {
    return { allowed: true };
  }

  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (isFirstMonday(y, m - 1, d)) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: 'Confidential HIV & STI screenings are scheduled exclusively on the 1st Monday of each month (3:00 PM – 7:00 PM) or on dates explicitly opened by DCVC. All other dates are closed for screenings.'
  };
}

/**
 * Generates the upcoming valid weekdays for Community Flex Space.
 */
export function getUpcomingFlexSpaceDates(daysAhead = 45, extraDates = [], blockedDates = []) {
  const today = getTodayIso();
  const now = new Date();
  const dates = new Set();
  const blockedSet = new Set(Array.isArray(blockedDates) ? blockedDates.map(b => String(b).trim()) : []);

  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const dayOfWeek = d.getDay();
    const iso = formatIso(d.getFullYear(), d.getMonth(), d.getDate());

    // Monday (1) through Friday (5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !blockedSet.has(iso)) {
      dates.add(iso);
    }
  }

  if (Array.isArray(extraDates)) {
    for (const ed of extraDates) {
      if (typeof ed === 'string' && ed.trim() >= today && !blockedSet.has(ed.trim())) {
        dates.add(ed.trim());
      }
    }
  }

  return Array.from(dates).sort();
}

/**
 * Strict validator for Community Flex Space appointments.
 */
export function isDateAllowedForFlex(dateStr, flexConfig = {}) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { allowed: false, reason: 'Please select a reservation date.' };
  }

  const today = getTodayIso();
  if (dateStr < today) {
    return { allowed: false, reason: 'Reservation date cannot be in the past.' };
  }

  const extraDates = Array.isArray(flexConfig.allowedDates) ? flexConfig.allowedDates : [];
  const blockedDates = Array.isArray(flexConfig.blockedDates) ? flexConfig.blockedDates : [];

  if (blockedDates.includes(dateStr)) {
    return {
      allowed: false,
      reason: 'The Community Flex Space is closed on this date. Please choose another date.'
    };
  }

  if (extraDates.includes(dateStr)) {
    return { allowed: true };
  }

  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        allowed: false,
        reason: 'The Community Flex Space is open Weekdays only (Monday – Friday, 1:00 PM – 5:00 PM). Weekends are closed.'
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}
