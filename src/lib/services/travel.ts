/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { Trip, ItineraryItem, PackingItem } from '@/types';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// --- Trips ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertTripFromFirestore = (doc: any): Trip => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        destination: data.destination,
        startDate: convertTimestamp(data.startDate) || new Date(),
        endDate: convertTimestamp(data.endDate) || new Date(),
        status: data.status,
        coverImage: data.coverImage,
        budget: data.budget,
        notes: data.notes,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    };
};

export const createTrip = async (
    userId: string,
    tripData: Partial<Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
    if (!tripData.title || !tripData.destination || !tripData.startDate || !tripData.endDate) {
        throw new Error('Title, destination, startDate, and endDate are required');
    }

    const tripsRef = collection(db, COLLECTIONS.TRIPS);

    const newTrip = {
        userId,
        title: tripData.title,
        destination: tripData.destination,
        startDate: Timestamp.fromDate(tripData.startDate),
        endDate: Timestamp.fromDate(tripData.endDate),
        status: tripData.status || 'planned',
        coverImage: tripData.coverImage || null,
        budget: tripData.budget || null,
        notes: tripData.notes || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(tripsRef, newTrip);
    return docRef.id;
};

export const updateTrip = async (tripId: string, updates: Partial<Trip>): Promise<void> => {
    const tripRef = doc(db, COLLECTIONS.TRIPS, tripId);
    const cleanUpdates: Record<string, any> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(updates).forEach(([key, value]: [string, any]) => {
        if (value !== undefined) {
            if (value instanceof Date) {
                cleanUpdates[key] = Timestamp.fromDate(value);
            } else {
                cleanUpdates[key] = value;
            }
        }
    });

    await updateDoc(tripRef, { ...cleanUpdates, updatedAt: serverTimestamp() });
};

export const deleteTrip = async (tripId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.TRIPS, tripId));
    // Note: in a real app, delete associated itinerary and packing items as well via batch operations or cloud functions.
};

export const subscribeToTrips = (
    userId: string,
    callback: (trips: Trip[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const tripsRef = collection(db, COLLECTIONS.TRIPS);
    const q = query(tripsRef, where('userId', '==', userId), orderBy('startDate', 'asc'));

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertTripFromFirestore)),
        (error) => {
            console.error('Error subscribing to trips:', error);
            if (onError) onError(error);
        }
    );
};

// --- Itinerary ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertItineraryFromFirestore = (doc: any): ItineraryItem => {
    const data = doc.data();
    return {
        id: doc.id,
        tripId: data.tripId,
        userId: data.userId,
        title: data.title,
        type: data.type,
        startTime: convertTimestamp(data.startTime) || new Date(),
        endTime: convertTimestamp(data.endTime),
        location: data.location,
        cost: data.cost,
        confirmationNo: data.confirmationNo,
        notes: data.notes,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
    };
};

export const addItineraryItem = async (
    userId: string,
    tripId: string,
    itemData: Partial<Omit<ItineraryItem, 'id' | 'userId' | 'tripId' | 'createdAt'>>
): Promise<string> => {
    if (!itemData.title || !itemData.type || !itemData.startTime) {
        throw new Error('Title, type, and startTime are required');
    }

    const itemsRef = collection(db, COLLECTIONS.ITINERARY_ITEMS);
    const docRef = await addDoc(itemsRef, {
        userId,
        tripId,
        title: itemData.title,
        type: itemData.type,
        startTime: Timestamp.fromDate(itemData.startTime),
        endTime: itemData.endTime ? Timestamp.fromDate(itemData.endTime) : null,
        location: itemData.location || null,
        cost: itemData.cost || null,
        confirmationNo: itemData.confirmationNo || null,
        notes: itemData.notes || null,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updateItineraryItem = async (itemId: string, updates: Partial<ItineraryItem>): Promise<void> => {
    const itemRef = doc(db, COLLECTIONS.ITINERARY_ITEMS, itemId);
    const cleanUpdates: Record<string, any> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(updates).forEach(([key, value]: [string, any]) => {
        if (value !== undefined) {
            if (value instanceof Date) {
                cleanUpdates[key] = Timestamp.fromDate(value);
            } else {
                cleanUpdates[key] = value;
            }
        }
    });

    await updateDoc(itemRef, cleanUpdates);
};

export const deleteItineraryItem = async (itemId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.ITINERARY_ITEMS, itemId));
};

export const subscribeToItinerary = (
    userId: string,
    tripId: string,
    callback: (items: ItineraryItem[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const itemsRef = collection(db, COLLECTIONS.ITINERARY_ITEMS);
    const q = query(
        itemsRef,
        where('userId', '==', userId),
        where('tripId', '==', tripId),
        orderBy('startTime', 'asc')
    );

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertItineraryFromFirestore)),
        (error) => {
            console.error('Error subscribing to itinerary:', error);
            if (onError) onError(error);
        }
    );
};

// --- Packing List ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertPackingFromFirestore = (doc: any): PackingItem => {
    const data = doc.data();
    return {
        id: doc.id,
        tripId: data.tripId,
        userId: data.userId,
        name: data.name,
        category: data.category,
        quantity: data.quantity || 1,
        isPacked: data.isPacked || false,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
    };
};

export const addPackingItem = async (
    userId: string,
    tripId: string,
    itemData: Partial<Omit<PackingItem, 'id' | 'userId' | 'tripId' | 'createdAt'>>
): Promise<string> => {
    if (!itemData.name || !itemData.category) {
        throw new Error('Name and category are required');
    }

    const itemsRef = collection(db, COLLECTIONS.PACKING_ITEMS);
    const docRef = await addDoc(itemsRef, {
        userId,
        tripId,
        name: itemData.name,
        category: itemData.category,
        quantity: itemData.quantity || 1,
        isPacked: itemData.isPacked || false,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updatePackingItem = async (itemId: string, updates: Partial<PackingItem>): Promise<void> => {
    const itemRef = doc(db, COLLECTIONS.PACKING_ITEMS, itemId);
    const cleanUpdates: Record<string, any> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(updates).forEach(([key, value]: [string, any]) => {
        if (value !== undefined) cleanUpdates[key] = value;
    });

    await updateDoc(itemRef, cleanUpdates);
};

export const deletePackingItem = async (itemId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.PACKING_ITEMS, itemId));
};

export const subscribeToPackingList = (
    userId: string,
    tripId: string,
    callback: (items: PackingItem[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const itemsRef = collection(db, COLLECTIONS.PACKING_ITEMS);
    const q = query(
        itemsRef,
        where('userId', '==', userId),
        where('tripId', '==', tripId),
        orderBy('createdAt', 'asc') // Could order by category, but Firebase index needed. Just sort in UI.
    );

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertPackingFromFirestore)),
        (error) => {
            console.error('Error subscribing to packing list:', error);
            if (onError) onError(error);
        }
    );
};
