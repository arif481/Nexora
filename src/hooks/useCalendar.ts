'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { CalendarEvent, FocusBlock, EventCategory, EnergyLevel } from '@/types';
import {
  subscribeToCalendarEvents,
  subscribeToEventsInRange,
  subscribeToFocusBlocks,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createFocusBlock,
  updateFocusBlock,
  deleteFocusBlock,
} from '@/lib/services/calendar';

interface UseCalendarReturn {
  events: CalendarEvent[];
  focusBlocks: FocusBlock[];
  loading: boolean;
  error: string | null;
  createEvent: (data: CreateEventData) => Promise<string>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  createFocusBlock: (data: CreateFocusBlockData) => Promise<string>;
  updateFocusBlock: (blockId: string, updates: Partial<FocusBlock>) => Promise<void>;
  deleteFocusBlock: (blockId: string) => Promise<void>;
  refresh: () => void;
}

interface CreateEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  location?: string;
  color?: string;
  category?: EventCategory;
  energyRequired?: EnergyLevel;
  isFlexible?: boolean;
}

interface CreateFocusBlockData {
  title: string;
  startTime: Date;
  endTime: Date;
  type?: 'deep-work' | 'shallow-work' | 'meeting' | 'break' | 'rest';
  linkedTaskIds?: string[];
}

export function useCalendar(): UseCalendarReturn {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setFocusBlocks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to events
    const unsubscribeEvents = subscribeToCalendarEvents(
      user.uid,
      (fetchedEvents) => {
        setEvents(fetchedEvents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Calendar events subscription error:', err);
        setError(err.message);
        setLoading(false);
        setEvents([]); // Set empty array so UI doesn't hang
      }
    );

    // Subscribe to focus blocks
    const unsubscribeFocusBlocks = subscribeToFocusBlocks(
      user.uid,
      (fetchedBlocks) => {
        setFocusBlocks(fetchedBlocks);
      },
      (err) => {
        console.error('Focus blocks subscription error:', err);
        setError(err.message);
        setFocusBlocks([]); // Set empty array so UI doesn't hang
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeFocusBlocks();
    };
  }, [user]);

  const handleCreateEvent = useCallback(
    async (data: CreateEventData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');

      try {
        const eventId = await createCalendarEvent(user.uid, data);
        return eventId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateEvent = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>): Promise<void> => {
      try {
        await updateCalendarEvent(eventId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string): Promise<void> => {
      try {
        await deleteCalendarEvent(eventId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleCreateFocusBlock = useCallback(
    async (data: CreateFocusBlockData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');

      try {
        const blockId = await createFocusBlock(user.uid, data);
        return blockId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateFocusBlock = useCallback(
    async (blockId: string, updates: Partial<FocusBlock>): Promise<void> => {
      try {
        await updateFocusBlock(blockId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteFocusBlock = useCallback(
    async (blockId: string): Promise<void> => {
      try {
        await deleteFocusBlock(blockId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    events,
    focusBlocks,
    loading,
    error,
    createEvent: handleCreateEvent,
    updateEvent: handleUpdateEvent,
    deleteEvent: handleDeleteEvent,
    createFocusBlock: handleCreateFocusBlock,
    updateFocusBlock: handleUpdateFocusBlock,
    deleteFocusBlock: handleDeleteFocusBlock,
    refresh,
  };
}

// Hook for events in a specific date range
export function useEventsInRange(startDate: Date, endDate: Date) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize date strings to prevent infinite re-renders
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToEventsInRange(
      user.uid,
      new Date(startDateStr),
      new Date(endDateStr),
      (fetchedEvents) => {
        setEvents(fetchedEvents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        setEvents([]);
      }
    );

    return () => unsubscribe();
  }, [user, startDateStr, endDateStr]);

  return { events, loading, error };
}

// Hook for today's events
export function useTodayEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setLoading(true);
    const unsubscribe = subscribeToEventsInRange(
      user.uid,
      today,
      tomorrow,
      (fetchedEvents) => {
        setEvents(fetchedEvents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        setEvents([]);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { events, loading, error };
}

// Hook for events by category
export function useEventsByCategory(events: CalendarEvent[]) {
  const [eventsByCategory, setEventsByCategory] = useState<Record<EventCategory, CalendarEvent[]>>({
    work: [],
    personal: [],
    health: [],
    social: [],
    learning: [],
    rest: [],
    exam: [],
    other: [],
  });

  useEffect(() => {
    const categorized: Record<EventCategory, CalendarEvent[]> = {
      work: [],
      personal: [],
      health: [],
      social: [],
      learning: [],
      rest: [],
      exam: [],
      other: [],
    };

    events.forEach((event) => {
      const category = event.category || 'other';
      categorized[category].push(event);
    });

    setEventsByCategory(categorized);
  }, [events]);

  return eventsByCategory;
}
