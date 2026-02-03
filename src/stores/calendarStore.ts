import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  CalendarEvent, 
  FocusBlock,
  EventCategory 
} from '@/types';

interface CalendarState {
  events: CalendarEvent[];
  focusBlocks: FocusBlock[];
  selectedDate: Date;
  selectedEvent: CalendarEvent | null;
  view: CalendarView;
  isLoading: boolean;
  error: string | null;

  // Actions
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;
  selectEvent: (event: CalendarEvent | null) => void;
  setSelectedDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  setFocusBlocks: (blocks: FocusBlock[]) => void;
  addFocusBlock: (block: FocusBlock) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForWeek: (startDate: Date) => CalendarEvent[];
  getEventsForMonth: (year: number, month: number) => CalendarEvent[];
  getUpcomingEvents: (limit?: number) => CalendarEvent[];
  getConflicts: () => CalendarEvent[][];
  getFocusBlocksForDate: (date: Date) => FocusBlock[];
}

type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      focusBlocks: [],
      selectedDate: new Date(),
      selectedEvent: null,
      view: 'week',
      isLoading: false,
      error: null,

      setEvents: (events) => set({ events, isLoading: false }),

      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, event],
        })),

      updateEvent: (eventId, updates) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? { ...event, ...updates, updatedAt: new Date() }
              : event
          ),
          selectedEvent:
            state.selectedEvent?.id === eventId
              ? { ...state.selectedEvent, ...updates, updatedAt: new Date() }
              : state.selectedEvent,
        })),

      deleteEvent: (eventId) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== eventId),
          selectedEvent:
            state.selectedEvent?.id === eventId ? null : state.selectedEvent,
        })),

      selectEvent: (event) => set({ selectedEvent: event }),

      setSelectedDate: (date) => set({ selectedDate: date }),

      setView: (view) => set({ view }),

      setFocusBlocks: (focusBlocks) => set({ focusBlocks }),

      addFocusBlock: (block) =>
        set((state) => ({
          focusBlocks: [...state.focusBlocks, block],
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      getEventsForDate: (date) => {
        const { events } = get();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return events.filter((event) => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          return (
            (eventStart >= startOfDay && eventStart <= endOfDay) ||
            (eventEnd >= startOfDay && eventEnd <= endOfDay) ||
            (eventStart <= startOfDay && eventEnd >= endOfDay)
          );
        });
      },

      getEventsForWeek: (startDate) => {
        const { events } = get();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        return events.filter((event) => {
          const eventStart = new Date(event.startTime);
          return eventStart >= startDate && eventStart < endDate;
        });
      },

      getEventsForMonth: (year, month) => {
        const { events } = get();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        return events.filter((event) => {
          const eventStart = new Date(event.startTime);
          return eventStart >= startDate && eventStart <= endDate;
        });
      },

      getUpcomingEvents: (limit = 5) => {
        const { events } = get();
        const now = new Date();

        return events
          .filter((event) => new Date(event.startTime) >= now)
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
          .slice(0, limit);
      },

      getConflicts: () => {
        const { events } = get();
        const conflicts: CalendarEvent[][] = [];

        for (let i = 0; i < events.length; i++) {
          for (let j = i + 1; j < events.length; j++) {
            const eventA = events[i];
            const eventB = events[j];

            const startA = new Date(eventA.startTime).getTime();
            const endA = new Date(eventA.endTime).getTime();
            const startB = new Date(eventB.startTime).getTime();
            const endB = new Date(eventB.endTime).getTime();

            // Check for overlap
            if (startA < endB && endA > startB) {
              conflicts.push([eventA, eventB]);
            }
          }
        }

        return conflicts;
      },

      getFocusBlocksForDate: (date) => {
        const { focusBlocks } = get();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return focusBlocks.filter((block) => {
          const blockStart = new Date(block.startTime);
          return blockStart >= startOfDay && blockStart <= endOfDay;
        });
      },
    }),
    {
      name: 'nexora-calendar',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        events: state.events,
        focusBlocks: state.focusBlocks,
        view: state.view,
      }),
    }
  )
);
