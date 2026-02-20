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
import type { InvestmentPortfolio } from '@/types';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

const convertPortfolioFromFirestore = (doc: any): InvestmentPortfolio => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        type: data.type,
        holdings: data.holdings || [],
        totalValue: data.totalValue || 0,
        costBasis: data.costBasis || 0,
        lastUpdated: convertTimestamp(data.lastUpdated),
        createdAt: convertTimestamp(data.createdAt),
    };
};

export const createPortfolio = async (
    userId: string,
    portfolioData: Omit<InvestmentPortfolio, 'id' | 'userId' | 'createdAt' | 'lastUpdated'>
): Promise<string> => {
    const ref = collection(db, COLLECTIONS.INVESTMENT_PORTFOLIOS);
    const newData = {
        userId,
        ...portfolioData,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(ref, newData);
    return docRef.id;
};

export const updatePortfolio = async (
    portfolioId: string,
    updates: Partial<InvestmentPortfolio>
): Promise<void> => {
    const ref = doc(db, COLLECTIONS.INVESTMENT_PORTFOLIOS, portfolioId);
    await updateDoc(ref, {
        ...updates,
        lastUpdated: serverTimestamp(),
    });
};

export const deletePortfolio = async (portfolioId: string): Promise<void> => {
    const ref = doc(db, COLLECTIONS.INVESTMENT_PORTFOLIOS, portfolioId);
    await deleteDoc(ref);
};

export const subscribeToPortfolios = (
    userId: string,
    callback: (portfolios: InvestmentPortfolio[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const ref = collection(db, COLLECTIONS.INVESTMENT_PORTFOLIOS);
    const q = query(ref, where('userId', '==', userId));

    return onSnapshot(
        q,
        (snapshot) => {
            const portfolios = snapshot.docs.map(convertPortfolioFromFirestore);
            portfolios.sort((a, b) => b.totalValue - a.totalValue); // Sort by highest value 
            callback(portfolios);
        },
        (error) => {
            console.error('Error subscribing to portfolios:', error);
            if (onError) onError(error);
        }
    );
};
