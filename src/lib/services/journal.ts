// Journal Service - Real-time Firestore operations
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
  getDoc,
  limit,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { JournalEntry, MoodEntry, AIInsight } from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert JournalEntry from Firestore
const convertJournalFromFirestore = (doc: any): JournalEntry => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    date: convertTimestamp(data.date),
    mood: data.mood || { score: 5, emotions: [], energyLevel: 5, stressLevel: 5 },
    content: data.content || '',
    gratitude: data.gratitude || [],
    highlights: data.highlights || [],
    challenges: data.challenges || [],
    learnings: data.learnings || [],
    goals: data.goals || [],
    tags: data.tags || [],
    attachments: data.attachments || [],
    aiInsights: data.aiInsights || [],
    isEncrypted: data.isEncrypted || false,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    // Additional UI properties
    title: data.title,
    icon: data.icon,
  } as JournalEntry & { title?: string; icon?: string };
};

// Create a new journal entry
export const createJournalEntry = async (
  userId: string,
  entryData: Partial<Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  const journalRef = collection(db, COLLECTIONS.JOURNAL_ENTRIES);
  
  const newEntry = {
    userId,
    date: entryData.date || new Date(),
    mood: entryData.mood || {
      score: 5,
      emotions: [],
      energyLevel: 5,
      stressLevel: 5,
    },
    content: entryData.content || '',
    gratitude: entryData.gratitude || [],
    highlights: entryData.highlights || [],
    challenges: entryData.challenges || [],
    learnings: entryData.learnings || [],
    goals: entryData.goals || [],
    tags: entryData.tags || [],
    attachments: entryData.attachments || [],
    aiInsights: entryData.aiInsights || [],
    isEncrypted: entryData.isEncrypted || false,
    title: (entryData as any).title || null,
    icon: (entryData as any).icon || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(journalRef, newEntry);
  return docRef.id;
};

// Update a journal entry
export const updateJournalEntry = async (
  entryId: string,
  updates: Partial<JournalEntry>
): Promise<void> => {
  const entryRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
  await updateDoc(entryRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Update journal entry content
export const updateJournalContent = async (
  entryId: string,
  content: string
): Promise<void> => {
  const entryRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
  await updateDoc(entryRef, {
    content,
    updatedAt: serverTimestamp(),
  });
};

// Update mood in journal entry
export const updateJournalMood = async (
  entryId: string,
  mood: Partial<MoodEntry>
): Promise<void> => {
  const entryRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);
  
  if (!entryDoc.exists()) {
    throw new Error('Journal entry not found');
  }

  const currentMood = entryDoc.data().mood || {};
  
  await updateDoc(entryRef, {
    mood: { ...currentMood, ...mood },
    updatedAt: serverTimestamp(),
  });
};

// Delete a journal entry
export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  const entryRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
  await deleteDoc(entryRef);
};

// Add gratitude item
export const addGratitudeItem = async (
  entryId: string,
  item: string,
  existingItems: string[]
): Promise<void> => {
  const entryRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
  await updateDoc(entryRef, {
    gratitude: [...existingItems, item],
    updatedAt: serverTimestamp(),
  });
};

// Remove gratitude item
export const removeGratitudeItem = async (
  entryId: string,
  index: number,
  existingItems: string[]
): Promise<void> => {
  const updatedItems = existingItems.filter((_, i) => i !== index);
  const entryRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
  await updateDoc(entryRef, {
    gratitude: updatedItems,
    updatedAt: serverTimestamp(),
  });
};

// Subscribe to user's journal entries
export const subscribeToJournalEntries = (
  userId: string,
  callback: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const journalRef = collection(db, COLLECTIONS.JOURNAL_ENTRIES);
  const q = query(
    journalRef,
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map(convertJournalFromFirestore);
      callback(entries);
    },
    (error) => {
      console.error('Error subscribing to journal entries:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Subscribe to recent journal entries (limit)
export const subscribeToRecentJournalEntries = (
  userId: string,
  count: number,
  callback: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const journalRef = collection(db, COLLECTIONS.JOURNAL_ENTRIES);
  const q = query(
    journalRef,
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(count)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map(convertJournalFromFirestore);
      callback(entries);
    },
    (error) => {
      console.error('Error subscribing to recent journal entries:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Get journal entry for a specific date
export const subscribeToJournalEntryForDate = (
  userId: string,
  date: Date,
  callback: (entry: JournalEntry | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const journalRef = collection(db, COLLECTIONS.JOURNAL_ENTRIES);
  const q = query(
    journalRef,
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<=', Timestamp.fromDate(endOfDay)),
    limit(1)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        callback(convertJournalFromFirestore(snapshot.docs[0]));
      }
    },
    (error) => {
      console.error('Error subscribing to journal entry for date:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Get mood trend data
export const subscribeToMoodTrend = (
  userId: string,
  days: number,
  callback: (data: { date: Date; mood: MoodEntry }[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const journalRef = collection(db, COLLECTIONS.JOURNAL_ENTRIES);
  const q = query(
    journalRef,
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    orderBy('date', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const entry = convertJournalFromFirestore(doc);
        return {
          date: entry.date,
          mood: entry.mood,
        };
      });
      callback(data);
    },
    (error) => {
      console.error('Error subscribing to mood trend:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};
