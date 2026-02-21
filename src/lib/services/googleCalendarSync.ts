// Google Calendar Sync Service
// Uses Google Calendar API v3 REST endpoints (free, 1M queries/day)

import type { CalendarEvent } from '@/types';

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Fetch events from Google Calendar within a date range.
 */
export async function fetchGoogleCalendarEvents(
    accessToken: string,
    timeMin: Date,
    timeMax: Date
): Promise<Partial<CalendarEvent>[]> {
    try {
        const params = new URLSearchParams({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '250',
        });

        const res = await fetch(`${GCAL_BASE}/calendars/primary/events?${params}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(`Google Calendar API error: ${res.status} ${error.error?.message || ''}`);
        }

        const data = await res.json();

        return (data.items || []).map((item: Record<string, any>) => ({
            title: item.summary || 'Untitled Event',
            description: item.description || undefined,
            startTime: item.start?.dateTime
                ? new Date(item.start.dateTime)
                : item.start?.date
                    ? new Date(item.start.date)
                    : new Date(),
            endTime: item.end?.dateTime
                ? new Date(item.end.dateTime)
                : item.end?.date
                    ? new Date(item.end.date)
                    : new Date(),
            allDay: !!item.start?.date && !item.start?.dateTime,
            location: item.location || undefined,
            attendees: (item.attendees || []).map((a: Record<string, string>) => ({
                email: a.email,
                name: a.displayName || a.email,
                status: a.responseStatus || 'pending',
            })),
            externalId: item.id,
            source: 'google' as const,
            category: 'meeting' as const,
            color: item.colorId ? getGoogleColorHex(item.colorId) : undefined,
        }));
    } catch (err) {
        console.error('Failed to fetch Google Calendar events:', err);
        return [];
    }
}

/**
 * Create an event in Google Calendar from a Nexora event.
 */
export async function pushEventToGoogle(
    accessToken: string,
    event: CalendarEvent
): Promise<string | null> {
    try {
        const body: Record<string, unknown> = {
            summary: event.title,
            description: event.description || undefined,
            location: event.location || undefined,
        };

        if (event.allDay) {
            body.start = { date: formatDate(event.startTime) };
            body.end = { date: formatDate(event.endTime) };
        } else {
            body.start = { dateTime: event.startTime.toISOString() };
            body.end = { dateTime: event.endTime.toISOString() };
        }

        if (event.attendees?.length) {
            body.attendees = event.attendees.map(a => ({ email: a.email }));
        }

        const res = await fetch(`${GCAL_BASE}/calendars/primary/events`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`Failed to push event: ${res.status}`);

        const data = await res.json();
        return data.id || null;
    } catch (err) {
        console.error('Failed to push event to Google Calendar:', err);
        return null;
    }
}

/**
 * Delete an event from Google Calendar.
 */
export async function deleteGoogleEvent(
    accessToken: string,
    eventId: string
): Promise<boolean> {
    try {
        const res = await fetch(`${GCAL_BASE}/calendars/primary/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return res.ok || res.status === 404; // 404 = already deleted
    } catch {
        return false;
    }
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getGoogleColorHex(colorId: string): string {
    const colors: Record<string, string> = {
        '1': '#7986CB', '2': '#33B679', '3': '#8E24AA',
        '4': '#E67C73', '5': '#F6BF26', '6': '#F4511E',
        '7': '#039BE5', '8': '#616161', '9': '#3F51B5',
        '10': '#0B8043', '11': '#D50000',
    };
    return colors[colorId] || '#039BE5';
}
