export interface AddOnlyCalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
}

const pad = (value: number): string => String(value).padStart(2, '0');

const toGoogleDateTime = (date: Date): string => {
  const utcDate = new Date(date);
  return `${utcDate.getUTCFullYear()}${pad(utcDate.getUTCMonth() + 1)}${pad(utcDate.getUTCDate())}T${pad(utcDate.getUTCHours())}${pad(utcDate.getUTCMinutes())}${pad(utcDate.getUTCSeconds())}Z`;
};

const toGoogleAllDayDate = (date: Date): string => {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
};

const escapeIcsText = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
};

const formatIcsDate = (date: Date): string => {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

const toIcsContent = (event: AddOnlyCalendarEvent): string => {
  const uid = `${event.id}@nexora`;
  const now = formatIcsDate(new Date());
  const start = formatIcsDate(event.startTime);
  const end = formatIcsDate(event.endTime);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nexora//Add-Only Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description || '')}`,
    `LOCATION:${escapeIcsText(event.location || '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

export const getGoogleCalendarAddLink = (event: AddOnlyCalendarEvent): string => {
  const start = event.allDay ? toGoogleAllDayDate(event.startTime) : toGoogleDateTime(event.startTime);
  const endDate = event.allDay
    ? new Date(event.endTime.getFullYear(), event.endTime.getMonth(), event.endTime.getDate() + 1)
    : event.endTime;
  const end = event.allDay ? toGoogleAllDayDate(endDate) : toGoogleDateTime(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description || '',
    location: event.location || '',
    dates: `${start}/${end}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const downloadAppleCalendarEvent = (event: AddOnlyCalendarEvent): void => {
  const ics = toIcsContent(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'event'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
