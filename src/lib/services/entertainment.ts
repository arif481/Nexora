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
import type { EntertainmentItem, EntertainmentType } from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert item from Firestore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertItemFromFirestore = (doc: any): EntertainmentItem => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        creator: data.creator,
        status: data.status || 'planned',
        rating: data.rating,
        review: data.review,
        coverImage: data.coverImage,
        progress: data.progress,
        totalProgress: data.totalProgress,
        tags: data.tags || [],
        startedAt: convertTimestamp(data.startedAt),
        completedAt: convertTimestamp(data.completedAt),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    };
};

export const createEntertainmentItem = async (
    userId: string,
    itemData: Partial<Omit<EntertainmentItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
    if (!itemData.type || !itemData.title) {
        throw new Error('Type and title are required fields');
    }

    const itemsRef = collection(db, COLLECTIONS.ENTERTAINMENT_ITEMS);

    const newItem = {
        userId,
        type: itemData.type,
        title: itemData.title,
        creator: itemData.creator || null,
        status: itemData.status || 'planned',
        rating: itemData.rating || null,
        review: itemData.review || null,
        coverImage: itemData.coverImage || null,
        progress: itemData.progress || null,
        totalProgress: itemData.totalProgress || null,
        tags: itemData.tags || [],
        startedAt: itemData.startedAt || null,
        completedAt: itemData.completedAt || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(itemsRef, newItem);
    return docRef.id;
};

export const updateEntertainmentItem = async (
    itemId: string,
    updates: Partial<EntertainmentItem>
): Promise<void> => {
    const itemRef = doc(db, COLLECTIONS.ENTERTAINMENT_ITEMS, itemId);

    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            if (value instanceof Date) {
                cleanUpdates[key] = Timestamp.fromDate(value);
            } else {
                cleanUpdates[key] = value;
            }
        }
    });

    await updateDoc(itemRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
    });
};

export const deleteEntertainmentItem = async (itemId: string): Promise<void> => {
    const itemRef = doc(db, COLLECTIONS.ENTERTAINMENT_ITEMS, itemId);
    await deleteDoc(itemRef);
};

export const subscribeToEntertainmentItems = (
    userId: string,
    typeFilter: EntertainmentType | null,
    callback: (items: EntertainmentItem[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const itemsRef = collection(db, COLLECTIONS.ENTERTAINMENT_ITEMS);

    let q;
    if (typeFilter) {
        q = query(
            itemsRef,
            where('userId', '==', userId),
            where('type', '==', typeFilter),
            orderBy('updatedAt', 'desc')
        );
    } else {
        q = query(
            itemsRef,
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );
    }

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const items = snapshot.docs.map(convertItemFromFirestore);
            callback(items);
        },
        (error) => {
            console.error('Error subscribing to entertainment items:', error);
            if (onError) onError(error);
        }
    );

    return unsubscribe;
};
