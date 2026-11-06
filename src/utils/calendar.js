/**
 * Diversity Collective Ventura County — Calendar Utilities
 * Generates downloadable .ics calendar files and direct Google/Apple/Outlook web links
 * for any cultural gathering, clinic screening, or community circle.
 */

function formatIcsDate(dateObj) {
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const year = dateObj.getUTCFullYear();
  const month = pad(dateObj.getUTCMonth() + 1);
  const day = pad(dateObj.getUTCDate());
  const hours = pad(dateObj.getUTCHours());
  const minutes = pad(dateObj.getUTCMinutes());
  const seconds = pad(dateObj.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function parseEventDate(event) {
  // Support year, month string (e.g. "OCT"), day string (e.g. "05")
  const monthMap = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
  };
  const year = parseInt(event.year || new Date().getFullYear(), 10);
  const month = event.month ? (monthMap[event.month.toUpperCase()] ?? new Date().getMonth()) : new Date().getMonth();
  const day = parseInt(event.day || '1', 10);

  // Default to 18:00 (6:00 PM) UTC if not parsed
  const start = new Date(Date.UTC(year, month, day, 18, 0, 0));
  const end = new Date(Date.UTC(year, month, day, 20, 0, 0)); // 2 hour duration

  return { start, end };
}

/**
 * Generate Google Calendar Web URL
 */
export function getGoogleCalendarUrl(event) {
  const { start, end } = parseEventDate(event);
  const title = encodeURIComponent(event.title || 'Diversity Collective Gathering');
  const details = encodeURIComponent(`${event.description || ''}\n\nLocation: ${event.location || ''}\nDiversity Collective Ventura County: https://diversitycollective.org`);
  const location = encodeURIComponent(event.address || event.location || '2471 Portola Road, Suite 100, Ventura, CA 93003');
  const dates = `${formatIcsDate(start)}/${formatIcsDate(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

/**
 * Generate and download an .ics file compatible with Apple Calendar, Outlook, and mobile devices
 */
export function buildIcsString(event) {
  const { start, end } = parseEventDate(event);
  const uid = `${event.slug || event.id || 'event'}-${Date.now()}@diversitycollective.org`;
  const cleanTitle = (event.title || 'Diversity Collective Event').replace(/\n/g, ' ');
  const cleanLocation = (event.address || event.location || '2471 Portola Road, Suite 100, Ventura, CA 93003').replace(/\n/g, ' ');
  const cleanDescription = (event.description || '').replace(/\n/g, '\\n');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Diversity Collective Ventura County//NONSGML Cultural Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    'ORGANIZER;CN="Diversity Collective Ventura County":mailto:info@diversitycollective.org',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return icsLines.join('\r\n');
}

/**
 * Generate and download an .ics file compatible with Apple Calendar, Outlook, and mobile devices
 */
export function downloadIcsFile(event) {
  const icsContent = buildIcsString(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.slug || 'dcvc-event'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
