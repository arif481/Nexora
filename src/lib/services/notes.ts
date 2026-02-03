// Notes Service - Real-time Firestore operations
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
import type { Note } from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert Note from Firestore
const convertNoteFromFirestore = (doc: any): Note => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    content: data.content,
    contentType: data.contentType || 'markdown',
    summary: data.summary,
    tags: data.tags || [],
    category: data.category,
    linkedNotes: data.linkedNotes || [],
    linkedTasks: data.linkedTasks || [],
    linkedEvents: data.linkedEvents || [],
    attachments: data.attachments || [],
    aiTags: data.aiTags || [],
    embeddings: data.embeddings,
    isPinned: data.isPinned || false,
    isArchived: data.isArchived || false,
    isFavorite: data.isFavorite || false,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    lastAccessedAt: convertTimestamp(data.lastAccessedAt),
    // Additional UI properties
    color: data.color,
    icon: data.icon,
  } as Note & { color?: string; icon?: string };
};

// Create a new note
export const createNote = async (
  userId: string,
  noteData: Partial<Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>>
): Promise<string> => {
  const notesRef = collection(db, COLLECTIONS.NOTES);
  
  const newNote = {
    userId,
    title: noteData.title || 'Untitled Note',
    content: noteData.content || '',
    contentType: noteData.contentType || 'markdown',
    summary: noteData.summary || null,
    tags: noteData.tags || [],
    category: noteData.category || null,
    linkedNotes: noteData.linkedNotes || [],
    linkedTasks: noteData.linkedTasks || [],
    linkedEvents: noteData.linkedEvents || [],
    attachments: noteData.attachments || [],
    aiTags: noteData.aiTags || [],
    embeddings: noteData.embeddings || null,
    isPinned: noteData.isPinned || false,
    isArchived: noteData.isArchived || false,
    isFavorite: noteData.isFavorite || false,
    color: (noteData as any).color || null,
    icon: (noteData as any).icon || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastAccessedAt: serverTimestamp(),
  };

  const docRef = await addDoc(notesRef, newNote);
  return docRef.id;
};

// Update a note
export const updateNote = async (
  noteId: string,
  updates: Partial<Note>
): Promise<void> => {
  const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
  await updateDoc(noteRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Update note content (frequently called during editing)
export const updateNoteContent = async (
  noteId: string,
  content: string
): Promise<void> => {
  const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
  await updateDoc(noteRef, {
    content,
    updatedAt: serverTimestamp(),
  });
};

// Delete a note
export const deleteNote = async (noteId: string): Promise<void> => {
  const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
  await deleteDoc(noteRef);
};

// Toggle pin status
export const toggleNotePin = async (noteId: string, isPinned: boolean): Promise<void> => {
  const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
  await updateDoc(noteRef, {
    isPinned,
    updatedAt: serverTimestamp(),
  });
};

// Toggle favorite status
export const toggleNoteFavorite = async (noteId: string, isFavorite: boolean): Promise<void> => {
  const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
  await updateDoc(noteRef, {
    isFavorite,
    updatedAt: serverTimestamp(),
  });
};

// Archive a note
export const archiveNote = async (noteId: string): Promise<void> => {
  const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
  await updateDoc(noteRef, {
    isArchived: true,
    updatedAt: serverTimestamp(),
  });
};

// Unarchive a note
export const unarchiveNote = async (noteId: string): Promise<void> => {
  const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
  await updateDoc(noteRef, {
    isArchived: false,
    updatedAt: serverTimestamp(),
  });
};

// Update last accessed time
export const updateNoteAccess = async (noteId: string): Promise<void> => {
  const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
  await updateDoc(noteRef, {
    lastAccessedAt: serverTimestamp(),
  });
};

// Subscribe to user's notes
export const subscribeToNotes = (
  userId: string,
  callback: (notes: Note[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const notesRef = collection(db, COLLECTIONS.NOTES);
  const q = query(
    notesRef,
    where('userId', '==', userId),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notes = snapshot.docs.map(convertNoteFromFirestore);
      callback(notes);
    },
    (error) => {
      console.error('Error subscribing to notes:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Subscribe to archived notes
export const subscribeToArchivedNotes = (
  userId: string,
  callback: (notes: Note[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const notesRef = collection(db, COLLECTIONS.NOTES);
  const q = query(
    notesRef,
    where('userId', '==', userId),
    where('isArchived', '==', true),
    orderBy('updatedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notes = snapshot.docs.map(convertNoteFromFirestore);
      callback(notes);
    },
    (error) => {
      console.error('Error subscribing to archived notes:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Subscribe to pinned notes
export const subscribeToPinnedNotes = (
  userId: string,
  callback: (notes: Note[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const notesRef = collection(db, COLLECTIONS.NOTES);
  const q = query(
    notesRef,
    where('userId', '==', userId),
    where('isPinned', '==', true),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notes = snapshot.docs.map(convertNoteFromFirestore);
      callback(notes);
    },
    (error) => {
      console.error('Error subscribing to pinned notes:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Batch delete notes
export const batchDeleteNotes = async (noteIds: string[]): Promise<void> => {
  const batch = writeBatch(db);

  noteIds.forEach((noteId) => {
    const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
    batch.delete(noteRef);
  });

  await batch.commit();
};

// Batch archive notes
export const batchArchiveNotes = async (noteIds: string[]): Promise<void> => {
  const batch = writeBatch(db);

  noteIds.forEach((noteId) => {
    const noteRef = doc(db, COLLECTIONS.NOTES, noteId);
    batch.update(noteRef, {
      isArchived: true,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
};
