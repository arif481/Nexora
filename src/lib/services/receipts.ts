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
import type { ReceiptScan } from '@/types';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertReceiptFromFirestore = (doc: any): ReceiptScan => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        transactionId: data.transactionId,
        merchantName: data.merchantName || 'Unknown Merchant',
        totalAmount: data.totalAmount || 0,
        date: convertTimestamp(data.date),
        lineItems: data.lineItems || [],
        imageUrl: data.imageUrl || '',
        status: data.status || 'pending',
        createdAt: convertTimestamp(data.createdAt),
    };
};

export const createReceiptScan = async (
    userId: string,
    receiptData: Omit<ReceiptScan, 'id' | 'userId' | 'createdAt'>
): Promise<string> => {
    const ref = collection(db, COLLECTIONS.RECEIPT_SCANS);
    const newData = {
        userId,
        ...receiptData,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(ref, newData);
    return docRef.id;
};

export const updateReceiptScan = async (
    receiptId: string,
    updates: Partial<ReceiptScan>
): Promise<void> => {
    const ref = doc(db, COLLECTIONS.RECEIPT_SCANS, receiptId);
    await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

export const deleteReceiptScan = async (receiptId: string): Promise<void> => {
    const ref = doc(db, COLLECTIONS.RECEIPT_SCANS, receiptId);
    await deleteDoc(ref);
};

export const subscribeToReceiptScans = (
    userId: string,
    callback: (receipts: ReceiptScan[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const ref = collection(db, COLLECTIONS.RECEIPT_SCANS);
    const q = query(ref, where('userId', '==', userId));

    return onSnapshot(
        q,
        (snapshot) => {
            const receipts = snapshot.docs.map(convertReceiptFromFirestore);
            receipts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            callback(receipts);
        },
        (error) => {
            console.error('Error subscribing to receipt scans:', error);
            if (onError) onError(error);
        }
    );
};
