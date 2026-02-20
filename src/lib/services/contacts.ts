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
import type { Contact, ContactInteraction } from '@/types';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

const convertContactFromFirestore = (doc: any): Contact => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        relationship: data.relationship,
        email: data.email,
        phone: data.phone,
        address: data.address,
        birthday: convertTimestamp(data.birthday),
        anniversary: convertTimestamp(data.anniversary),
        notes: data.notes,
        tags: data.tags || [],
        giftIdeas: data.giftIdeas || [],
        frequency: data.frequency,
        lastContactAt: convertTimestamp(data.lastContactAt),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    };
};

const convertInteractionFromFirestore = (doc: any): ContactInteraction => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        contactId: data.contactId,
        type: data.type,
        date: convertTimestamp(data.date) || new Date(),
        notes: data.notes,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
    };
};

// --- Contacts ---

export const createContact = async (
    userId: string,
    contactData: Partial<Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
    if (!contactData.name || !contactData.relationship) {
        throw new Error('Name and relationship are required fields');
    }

    const contactsRef = collection(db, COLLECTIONS.CONTACTS);

    const newContact = {
        userId,
        name: contactData.name,
        relationship: contactData.relationship,
        email: contactData.email || null,
        phone: contactData.phone || null,
        address: contactData.address || null,
        birthday: contactData.birthday ? Timestamp.fromDate(contactData.birthday) : null,
        anniversary: contactData.anniversary ? Timestamp.fromDate(contactData.anniversary) : null,
        notes: contactData.notes || null,
        tags: contactData.tags || [],
        giftIdeas: contactData.giftIdeas || [],
        frequency: contactData.frequency || null,
        lastContactAt: contactData.lastContactAt ? Timestamp.fromDate(contactData.lastContactAt) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(contactsRef, newContact);
    return docRef.id;
};

export const updateContact = async (
    contactId: string,
    updates: Partial<Contact>
): Promise<void> => {
    const contactRef = doc(db, COLLECTIONS.CONTACTS, contactId);

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

    await updateDoc(contactRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
    });
};

export const deleteContact = async (contactId: string): Promise<void> => {
    const contactRef = doc(db, COLLECTIONS.CONTACTS, contactId);
    await deleteDoc(contactRef);
    // Optional: Also delete all interactions for this contact (requires a batch operation/cloud function, ignoring for now)
};

export const subscribeToContacts = (
    userId: string,
    callback: (contacts: Contact[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const contactsRef = collection(db, COLLECTIONS.CONTACTS);

    const q = query(
        contactsRef,
        where('userId', '==', userId),
        orderBy('name', 'asc')
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const contacts = snapshot.docs.map(convertContactFromFirestore);
            callback(contacts);
        },
        (error) => {
            console.error('Error subscribing to contacts:', error);
            if (onError) onError(error);
        }
    );
};

// --- Interactions ---

export const logInteraction = async (
    userId: string,
    contactId: string,
    interactionData: Partial<Omit<ContactInteraction, 'id' | 'userId' | 'contactId' | 'createdAt'>>
): Promise<string> => {
    if (!interactionData.type || !interactionData.date) {
        throw new Error('Type and date are required fields');
    }

    const interactionsRef = collection(db, COLLECTIONS.CONTACT_INTERACTIONS);

    const newInteraction = {
        userId,
        contactId,
        type: interactionData.type,
        date: Timestamp.fromDate(interactionData.date),
        notes: interactionData.notes || null,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(interactionsRef, newInteraction);

    // Update lastContactAt on the parent contact
    await updateContact(contactId, { lastContactAt: interactionData.date });

    return docRef.id;
};

export const subscribeToInteractions = (
    userId: string,
    contactId: string,
    callback: (interactions: ContactInteraction[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const interactionsRef = collection(db, COLLECTIONS.CONTACT_INTERACTIONS);

    const q = query(
        interactionsRef,
        where('userId', '==', userId),
        where('contactId', '==', contactId),
        orderBy('date', 'desc')
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const interactions = snapshot.docs.map(convertInteractionFromFirestore);
            callback(interactions);
        },
        (error) => {
            console.error('Error subscribing to interactions:', error);
            if (onError) onError(error);
        }
    );
};
