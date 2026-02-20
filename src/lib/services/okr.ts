// OKR Service - Firestore operations for Objectives & Key Results
import {
    collection, doc, addDoc, updateDoc, deleteDoc,
    query, where, orderBy, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Objective } from '@/types';

const OKR_COLLECTION = 'okr_objectives';

const convertTimestamp = (ts: Timestamp | Date | null): Date => {
    if (ts instanceof Timestamp) return ts.toDate();
    return ts || new Date();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertObjective = (docSnap: any): Objective => {
    const d = docSnap.data();
    return {
        id: docSnap.id,
        userId: d.userId,
        title: d.title,
        description: d.description,
        timeframe: d.timeframe || 'quarterly',
        startDate: convertTimestamp(d.startDate),
        endDate: convertTimestamp(d.endDate),
        status: d.status || 'on_track',
        keyResults: d.keyResults || [],
        color: d.color || '#06b6d4',
        createdAt: convertTimestamp(d.createdAt),
        updatedAt: convertTimestamp(d.updatedAt),
    };
};

export const subscribeToObjectives = (
    userId: string,
    callback: (objectives: Objective[]) => void,
    onError?: (error: Error) => void
) => {
    const ref = collection(db, OKR_COLLECTION);
    const q = query(ref, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertObjective)),
        (error) => { console.error('OKR subscription error:', error); if (onError) onError(error); }
    );
};

export const createObjective = async (userId: string, data: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = collection(db, OKR_COLLECTION);
    const docRef = await addDoc(ref, {
        ...data,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updateObjective = async (id: string, updates: Partial<Objective>) => {
    const ref = doc(db, OKR_COLLECTION, id);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
};

export const deleteObjective = async (id: string) => {
    const ref = doc(db, OKR_COLLECTION, id);
    await deleteDoc(ref);
};
