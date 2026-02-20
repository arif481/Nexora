// Flashcard Service - Firestore operations for spaced-repetition flashcards
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
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { Flashcard } from '@/types';

const FLASHCARDS_COLLECTION = 'flashcards';

const convertTimestamp = (timestamp: Timestamp | Date | null): Date => {
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return timestamp || new Date();
};

const convertFlashcard = (docSnap: any): Flashcard => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        subjectId: data.subjectId,
        topicId: data.topicId,
        front: data.front,
        back: data.back,
        difficulty: data.difficulty || 'medium',
        interval: data.interval || 0,
        easeFactor: data.easeFactor || 2.5,
        repetitions: data.repetitions || 0,
        nextReview: convertTimestamp(data.nextReview),
        lastReview: data.lastReview ? convertTimestamp(data.lastReview) : undefined,
        createdAt: convertTimestamp(data.createdAt),
    };
};

export const subscribeToFlashcards = (
    userId: string,
    subjectId: string,
    callback: (cards: Flashcard[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const ref = collection(db, FLASHCARDS_COLLECTION);
    const q = query(
        ref,
        where('userId', '==', userId),
        where('subjectId', '==', subjectId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertFlashcard)),
        (error) => {
            console.error('Flashcards subscription error:', error);
            if (onError) onError(error);
        }
    );
};

export const createFlashcard = async (
    userId: string,
    data: Omit<Flashcard, 'id' | 'createdAt'>
): Promise<string> => {
    const ref = collection(db, FLASHCARDS_COLLECTION);
    const docRef = await addDoc(ref, {
        ...data,
        userId,
        nextReview: data.nextReview || new Date(),
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updateFlashcard = async (
    cardId: string,
    updates: Partial<Flashcard>
): Promise<void> => {
    const ref = doc(db, FLASHCARDS_COLLECTION, cardId);
    await updateDoc(ref, updates);
};

export const deleteFlashcard = async (cardId: string): Promise<void> => {
    const ref = doc(db, FLASHCARDS_COLLECTION, cardId);
    await deleteDoc(ref);
};
