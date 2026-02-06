'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { JournalEntry, MoodEntry } from '@/types';
import {
  subscribeToJournalEntries,
  subscribeToRecentJournalEntries,
  subscribeToJournalEntryForDate,
  subscribeToMoodTrend,
  createJournalEntry,
  updateJournalEntry,
  updateJournalContent,
  updateJournalMood,
  deleteJournalEntry,
  addGratitudeItem,
  removeGratitudeItem,
} from '@/lib/services/journal';

interface UseJournalReturn {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  createEntry: (data: CreateJournalData) => Promise<string>;
  updateEntry: (entryId: string, updates: Partial<JournalEntry>) => Promise<void>;
  updateContent: (entryId: string, content: string) => Promise<void>;
  updateMood: (entryId: string, mood: Partial<MoodEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  addGratitude: (entryId: string, item: string) => Promise<void>;
  removeGratitude: (entryId: string, index: number) => Promise<void>;
  refresh: () => void;
}

interface CreateJournalData {
  date?: Date;
  mood?: MoodEntry;
  content?: string;
  gratitude?: string[];
  highlights?: string[];
  challenges?: string[];
  learnings?: string[];
  goals?: string[];
  tags?: string[];
  title?: string;
  icon?: string;
}

export function useJournal(): UseJournalReturn {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const unsubscribe = subscribeToJournalEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Journal subscription error:', err);
        setError(err.message);
        setEntries([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateEntry = useCallback(
    async (data: CreateJournalData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        const entryId = await createJournalEntry(user.uid, data);
        return entryId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateEntry = useCallback(
    async (entryId: string, updates: Partial<JournalEntry>): Promise<void> => {
      try {
        await updateJournalEntry(entryId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleUpdateContent = useCallback(
    async (entryId: string, content: string): Promise<void> => {
      try {
        await updateJournalContent(entryId, content);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleUpdateMood = useCallback(
    async (entryId: string, mood: Partial<MoodEntry>): Promise<void> => {
      try {
        await updateJournalMood(entryId, mood);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string): Promise<void> => {
      try {
        await deleteJournalEntry(entryId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleAddGratitude = useCallback(
    async (entryId: string, item: string): Promise<void> => {
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) throw new Error('Entry not found');

      try {
        await addGratitudeItem(entryId, item, entry.gratitude);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [entries]
  );

  const handleRemoveGratitude = useCallback(
    async (entryId: string, index: number): Promise<void> => {
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) throw new Error('Entry not found');

      try {
        await removeGratitudeItem(entryId, index, entry.gratitude);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [entries]
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    entries,
    loading,
    error,
    createEntry: handleCreateEntry,
    updateEntry: handleUpdateEntry,
    updateContent: handleUpdateContent,
    updateMood: handleUpdateMood,
    deleteEntry: handleDeleteEntry,
    addGratitude: handleAddGratitude,
    removeGratitude: handleRemoveGratitude,
    refresh,
  };
}

// Hook for recent journal entries
export function useRecentJournal(count: number = 7) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRecentJournalEntries(
      user.uid,
      count,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching recent journal entries:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, count]);

  return { entries, loading };
}

// Hook for journal entry for a specific date
export function useJournalForDate(date: Date) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEntry(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToJournalEntryForDate(
      user.uid,
      date,
      (fetchedEntry) => {
        setEntry(fetchedEntry);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching journal entry for date:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, date]);

  return { entry, loading };
}

// Hook for mood trends
export function useMoodTrend(days: number = 30) {
  const { user } = useAuth();
  const [data, setData] = useState<{ date: Date; mood: MoodEntry }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToMoodTrend(
      user.uid,
      days,
      (fetchedData) => {
        setData(fetchedData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching mood trend:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, days]);

  // Calculate average mood
  const averageMood = data.length > 0
    ? data.reduce((sum, d) => sum + d.mood.score, 0) / data.length
    : 0;

  return { data, loading, averageMood };
}
