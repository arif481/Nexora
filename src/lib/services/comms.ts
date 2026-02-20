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
import type { MessageTemplate, FollowUp } from '@/types';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// --- Message Templates ---

const convertTemplateFromFirestore = (doc: any): MessageTemplate => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category,
        tags: data.tags || [],
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    };
};

export const addTemplate = async (
    userId: string,
    data: Partial<Omit<MessageTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
    if (!data.name || !data.body || !data.category) {
        throw new Error('Missing required template fields');
    }

    const collRef = collection(db, COLLECTIONS.COMMS_TEMPLATES);
    const docRef = await addDoc(collRef, {
        ...data,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updateTemplate = async (id: string, updates: Partial<MessageTemplate>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.COMMS_TEMPLATES, id);
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            if (value instanceof Date) cleanUpdates[key] = Timestamp.fromDate(value);
            else cleanUpdates[key] = value;
        }
    });
    cleanUpdates.updatedAt = serverTimestamp();
    await updateDoc(docRef, cleanUpdates);
};

export const deleteTemplate = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.COMMS_TEMPLATES, id));
};

export const subscribeToTemplates = (
    userId: string,
    callback: (templates: MessageTemplate[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const collRef = collection(db, COLLECTIONS.COMMS_TEMPLATES);
    const q = query(collRef, where('userId', '==', userId), orderBy('updatedAt', 'desc'));

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertTemplateFromFirestore)),
        (error) => {
            console.error('Error subscribing to templates:', error);
            if (onError) onError(error);
        }
    );
};

// --- Follow-ups ---

const convertFollowUpFromFirestore = (doc: any): FollowUp => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        contactName: data.contactName,
        contactId: data.contactId,
        context: data.context,
        method: data.method,
        dueDate: convertTimestamp(data.dueDate) || new Date(),
        status: data.status,
        notes: data.notes,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    };
};

export const addFollowUp = async (
    userId: string,
    data: Partial<Omit<FollowUp, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
    if (!data.contactName || !data.context || !data.method || !data.dueDate) {
        throw new Error('Missing required follow-up fields');
    }

    const collRef = collection(db, COLLECTIONS.COMMS_FOLLOWUPS);
    const docRef = await addDoc(collRef, {
        ...data,
        userId,
        status: data.status || 'pending',
        dueDate: Timestamp.fromDate(data.dueDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updateFollowUp = async (id: string, updates: Partial<FollowUp>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.COMMS_FOLLOWUPS, id);
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            if (value instanceof Date) cleanUpdates[key] = Timestamp.fromDate(value);
            else cleanUpdates[key] = value;
        }
    });
    cleanUpdates.updatedAt = serverTimestamp();
    await updateDoc(docRef, cleanUpdates);
};

export const deleteFollowUp = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.COMMS_FOLLOWUPS, id));
};

export const subscribeToFollowUps = (
    userId: string,
    callback: (followUps: FollowUp[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const collRef = collection(db, COLLECTIONS.COMMS_FOLLOWUPS);
    const q = query(collRef, where('userId', '==', userId), orderBy('dueDate', 'asc'));

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertFollowUpFromFirestore)),
        (error) => {
            console.error('Error subscribing to follow-ups:', error);
            if (onError) onError(error);
        }
    );
};
