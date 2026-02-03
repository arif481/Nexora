'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Note } from '@/types';
import {
  subscribeToNotes,
  subscribeToArchivedNotes,
  subscribeToPinnedNotes,
  createNote,
  updateNote,
  updateNoteContent,
  deleteNote,
  toggleNotePin,
  toggleNoteFavorite,
  archiveNote,
  unarchiveNote,
  updateNoteAccess,
  batchDeleteNotes,
  batchArchiveNotes,
} from '@/lib/services/notes';

interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: string | null;
  createNote: (data: CreateNoteData) => Promise<string>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  updateContent: (noteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  togglePin: (noteId: string, isPinned: boolean) => Promise<void>;
  toggleFavorite: (noteId: string, isFavorite: boolean) => Promise<void>;
  archiveNote: (noteId: string) => Promise<void>;
  unarchiveNote: (noteId: string) => Promise<void>;
  markAccessed: (noteId: string) => Promise<void>;
  batchDelete: (noteIds: string[]) => Promise<void>;
  batchArchive: (noteIds: string[]) => Promise<void>;
  refresh: () => void;
}

interface CreateNoteData {
  title?: string;
  content?: string;
  contentType?: 'text' | 'markdown' | 'rich-text';
  tags?: string[];
  category?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  color?: string;
  icon?: string;
}

export function useNotes(archived: boolean = false): UseNotesReturn {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const subscribeFn = archived ? subscribeToArchivedNotes : subscribeToNotes;
    
    const unsubscribe = subscribeFn(
      user.uid,
      (fetchedNotes) => {
        setNotes(fetchedNotes);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, archived]);

  const handleCreateNote = useCallback(
    async (data: CreateNoteData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        const noteId = await createNote(user.uid, data);
        return noteId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateNote = useCallback(
    async (noteId: string, updates: Partial<Note>): Promise<void> => {
      try {
        await updateNote(noteId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleUpdateContent = useCallback(
    async (noteId: string, content: string): Promise<void> => {
      try {
        await updateNoteContent(noteId, content);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteNote = useCallback(
    async (noteId: string): Promise<void> => {
      try {
        await deleteNote(noteId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleTogglePin = useCallback(
    async (noteId: string, isPinned: boolean): Promise<void> => {
      try {
        await toggleNotePin(noteId, isPinned);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleToggleFavorite = useCallback(
    async (noteId: string, isFavorite: boolean): Promise<void> => {
      try {
        await toggleNoteFavorite(noteId, isFavorite);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleArchiveNote = useCallback(
    async (noteId: string): Promise<void> => {
      try {
        await archiveNote(noteId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleUnarchiveNote = useCallback(
    async (noteId: string): Promise<void> => {
      try {
        await unarchiveNote(noteId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleMarkAccessed = useCallback(
    async (noteId: string): Promise<void> => {
      try {
        await updateNoteAccess(noteId);
      } catch (err: any) {
        // Silent fail for access tracking
        console.error('Failed to update note access:', err);
      }
    },
    []
  );

  const handleBatchDelete = useCallback(
    async (noteIds: string[]): Promise<void> => {
      try {
        await batchDeleteNotes(noteIds);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleBatchArchive = useCallback(
    async (noteIds: string[]): Promise<void> => {
      try {
        await batchArchiveNotes(noteIds);
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
    notes,
    loading,
    error,
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    updateContent: handleUpdateContent,
    deleteNote: handleDeleteNote,
    togglePin: handleTogglePin,
    toggleFavorite: handleToggleFavorite,
    archiveNote: handleArchiveNote,
    unarchiveNote: handleUnarchiveNote,
    markAccessed: handleMarkAccessed,
    batchDelete: handleBatchDelete,
    batchArchive: handleBatchArchive,
    refresh,
  };
}

// Hook for pinned notes only
export function usePinnedNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToPinnedNotes(
      user.uid,
      (fetchedNotes) => {
        setNotes(fetchedNotes);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching pinned notes:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { notes, loading };
}

// Hook for searching notes
export function useNoteSearch(notes: Note[], searchQuery: string) {
  const [results, setResults] = useState<Note[]>(notes);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(notes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        note.category?.toLowerCase().includes(query)
    );

    setResults(filtered);
  }, [notes, searchQuery]);

  return results;
}

// Hook for notes by category
export function useNotesByCategory(notes: Note[]) {
  const [notesByCategory, setNotesByCategory] = useState<Record<string, Note[]>>({});

  useEffect(() => {
    const categorized: Record<string, Note[]> = { Uncategorized: [] };

    notes.forEach((note) => {
      const category = note.category || 'Uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(note);
    });

    setNotesByCategory(categorized);
  }, [notes]);

  return notesByCategory;
}
