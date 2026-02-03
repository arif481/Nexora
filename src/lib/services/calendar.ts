// Calendar Service - Real-time Firestore operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { CalendarEvent, FocusBlock, EventCategory, EnergyLevel } from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert CalendarEvent from Firestore
const convertEventFromFirestore = (doc: any): CalendarEvent => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    startTime: convertTimestamp(data.startTime),
    endTime: convertTimestamp(data.endTime),
    allDay: data.allDay || false,
    location: data.location,
    attendees: data.attendees || [],
    recurrence: data.recurrence,
    reminders: data.reminders || [],
    color: data.color,
    category: data.category || 'other',
    energyRequired: data.energyRequired || 'medium',
    isFlexible: data.isFlexible || false,
    linkedTaskId: data.linkedTaskId,
    externalId: data.externalId,
    source: data.source || 'nexora',
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

// Convert FocusBlock from Firestore
const convertFocusBlockFromFirestore = (doc: any): FocusBlock => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    startTime: convertTimestamp(data.startTime),
    endTime: convertTimestamp(data.endTime),
    type: data.type || 'deep-work',
    linkedTaskIds: data.linkedTaskIds || [],
    completed: data.completed || false,
    actualFocusMinutes: data.actualFocusMinutes,
    distractions: data.distractions,
  };
};

// Create a new calendar event
export const createCalendarEvent = async (
  userId: string,
  eventData: Partial<Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
  
  const newEvent = {
    userId,
    title: eventData.title || 'New Event',
    description: eventData.description || '',
    startTime: eventData.startTime || new Date(),
    endTime: eventData.endTime || new Date(Date.now() + 60 * 60 * 1000),
    allDay: eventData.allDay || false,
    location: eventData.location || null,
    attendees: eventData.attendees || [],
    recurrence: eventData.recurrence || null,
    reminders: eventData.reminders || [],
    color: eventData.color || '#06b6d4',
    category: eventData.category || 'other',
    energyRequired: eventData.energyRequired || 'medium',
    isFlexible: eventData.isFlexible || false,
    linkedTaskId: eventData.linkedTaskId || null,
    externalId: eventData.externalId || null,
    source: eventData.source || 'nexora',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(eventsRef, newEvent);
  return docRef.id;
};

// Update a calendar event
export const updateCalendarEvent = async (
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<void> => {
  const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId);
  await updateDoc(eventRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a calendar event
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId);
  await deleteDoc(eventRef);
};

// Subscribe to user's calendar events
export const subscribeToCalendarEvents = (
  userId: string,
  callback: (events: CalendarEvent[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
  const q = query(
    eventsRef,
    where('userId', '==', userId),
    orderBy('startTime', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map(convertEventFromFirestore);
      callback(events);
    },
    (error) => {
      console.error('Error subscribing to calendar events:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Subscribe to events for a specific date range
export const subscribeToEventsInRange = (
  userId: string,
  startDate: Date,
  endDate: Date,
  callback: (events: CalendarEvent[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
  const q = query(
    eventsRef,
    where('userId', '==', userId),
    where('startTime', '>=', Timestamp.fromDate(startDate)),
    where('startTime', '<=', Timestamp.fromDate(endDate)),
    orderBy('startTime', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map(convertEventFromFirestore);
      callback(events);
    },
    (error) => {
      console.error('Error subscribing to events in range:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Create a focus block
export const createFocusBlock = async (
  userId: string,
  blockData: Partial<Omit<FocusBlock, 'id' | 'userId'>>
): Promise<string> => {
  const blocksRef = collection(db, COLLECTIONS.FOCUS_BLOCKS);
  
  const newBlock = {
    userId,
    title: blockData.title || 'Focus Block',
    startTime: blockData.startTime || new Date(),
    endTime: blockData.endTime || new Date(Date.now() + 60 * 60 * 1000),
    type: blockData.type || 'deep-work',
    linkedTaskIds: blockData.linkedTaskIds || [],
    completed: false,
    actualFocusMinutes: null,
    distractions: 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(blocksRef, newBlock);
  return docRef.id;
};

// Update a focus block
export const updateFocusBlock = async (
  blockId: string,
  updates: Partial<FocusBlock>
): Promise<void> => {
  const blockRef = doc(db, COLLECTIONS.FOCUS_BLOCKS, blockId);
  await updateDoc(blockRef, updates);
};

// Delete a focus block
export const deleteFocusBlock = async (blockId: string): Promise<void> => {
  const blockRef = doc(db, COLLECTIONS.FOCUS_BLOCKS, blockId);
  await deleteDoc(blockRef);
};

// Subscribe to focus blocks
export const subscribeToFocusBlocks = (
  userId: string,
  callback: (blocks: FocusBlock[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const blocksRef = collection(db, COLLECTIONS.FOCUS_BLOCKS);
  const q = query(
    blocksRef,
    where('userId', '==', userId),
    orderBy('startTime', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const blocks = snapshot.docs.map(convertFocusBlockFromFirestore);
      callback(blocks);
    },
    (error) => {
      console.error('Error subscribing to focus blocks:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Get today's events
export const subscribeToTodayEvents = (
  userId: string,
  callback: (events: CalendarEvent[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return subscribeToEventsInRange(userId, today, tomorrow, callback, onError);
};

// Batch create events
export const batchCreateEvents = async (
  userId: string,
  events: Partial<CalendarEvent>[]
): Promise<string[]> => {
  const ids: string[] = [];
  
  for (const eventData of events) {
    const id = await createCalendarEvent(userId, eventData);
    ids.push(id);
  }
  
  return ids;
};

// Batch delete events
export const batchDeleteEvents = async (eventIds: string[]): Promise<void> => {
  const batch = writeBatch(db);

  eventIds.forEach((eventId) => {
    const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId);
    batch.delete(eventRef);
  });

  await batch.commit();
};
