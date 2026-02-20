import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { Debt } from '@/types';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

const convertDebtFromFirestore = (doc: any): Debt => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        type: data.type,
        totalAmount: data.totalAmount || 0,
        currentBalance: data.currentBalance || 0,
        interestRate: data.interestRate || 0,
        minimumPayment: data.minimumPayment || 0,
        dueDate: convertTimestamp(data.dueDate),
        strategy: data.strategy || 'avalanche',
        isPaidOff: data.isPaidOff || false,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
    };
};

export const createDebt = async (
    userId: string,
    debtData: Omit<Debt, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    const ref = collection(db, COLLECTIONS.DEBTS);
    const newData = {
        userId,
        ...debtData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(ref, newData);
    return docRef.id;
};

export const updateDebt = async (
    debtId: string,
    updates: Partial<Debt>
): Promise<void> => {
    const ref = doc(db, COLLECTIONS.DEBTS, debtId);
    await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

export const deleteDebt = async (debtId: string): Promise<void> => {
    const ref = doc(db, COLLECTIONS.DEBTS, debtId);
    await deleteDoc(ref);
};

export const subscribeToDebts = (
    userId: string,
    callback: (debts: Debt[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const ref = collection(db, COLLECTIONS.DEBTS);
    const q = query(ref, where('userId', '==', userId));

    return onSnapshot(
        q,
        (snapshot) => {
            const debts = snapshot.docs.map(convertDebtFromFirestore);
            // Sort primarily by active status, then by highest interest
            debts.sort((a, b) => {
                if (a.isPaidOff === b.isPaidOff) {
                    return b.interestRate - a.interestRate;
                }
                return a.isPaidOff ? 1 : -1;
            });
            callback(debts);
        },
        (error) => {
            console.error('Error subscribing to debts:', error);
            if (onError) onError(error);
        }
    );
};
