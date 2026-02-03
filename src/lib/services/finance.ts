// Finance Service - Real-time Firestore operations
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
  limit,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { Transaction, Budget, Subscription } from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// ====== TRANSACTIONS ======

const convertTransactionFromFirestore = (doc: any): Transaction => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    amount: data.amount,
    currency: data.currency || 'USD',
    type: data.type,
    category: data.category,
    description: data.description,
    date: convertTimestamp(data.date),
    recurring: data.recurring || false,
    recurrenceRule: data.recurrenceRule,
    tags: data.tags || [],
    attachments: data.attachments || [],
    createdAt: convertTimestamp(data.createdAt),
    // Additional UI properties
    icon: data.icon,
    color: data.color,
  } as Transaction & { icon?: string; color?: string };
};

export const createTransaction = async (
  userId: string,
  transactionData: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>
): Promise<string> => {
  const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
  
  const newTransaction = {
    userId,
    amount: transactionData.amount || 0,
    currency: transactionData.currency || 'USD',
    type: transactionData.type || 'expense',
    category: transactionData.category || 'other',
    description: transactionData.description || '',
    date: transactionData.date || new Date(),
    recurring: transactionData.recurring || false,
    recurrenceRule: transactionData.recurrenceRule || null,
    tags: transactionData.tags || [],
    attachments: transactionData.attachments || [],
    icon: (transactionData as any).icon || null,
    color: (transactionData as any).color || null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(transactionsRef, newTransaction);
  return docRef.id;
};

export const updateTransaction = async (
  transactionId: string,
  updates: Partial<Transaction>
): Promise<void> => {
  const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
  await updateDoc(transactionRef, updates);
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
  await deleteDoc(transactionRef);
};

export const subscribeToTransactions = (
  userId: string,
  callback: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
  const q = query(
    transactionsRef,
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const transactions = snapshot.docs.map(convertTransactionFromFirestore);
      callback(transactions);
    },
    (error) => {
      console.error('Error subscribing to transactions:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

export const subscribeToRecentTransactions = (
  userId: string,
  count: number,
  callback: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
  const q = query(
    transactionsRef,
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(count)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const transactions = snapshot.docs.map(convertTransactionFromFirestore);
      callback(transactions);
    },
    (error) => {
      console.error('Error subscribing to recent transactions:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

export const subscribeToTransactionsInRange = (
  userId: string,
  startDate: Date,
  endDate: Date,
  callback: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
  const q = query(
    transactionsRef,
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const transactions = snapshot.docs.map(convertTransactionFromFirestore);
      callback(transactions);
    },
    (error) => {
      console.error('Error subscribing to transactions in range:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// ====== BUDGETS ======

const convertBudgetFromFirestore = (doc: any): Budget => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    amount: data.amount,
    spent: data.spent || 0,
    category: data.category,
    period: data.period,
    startDate: convertTimestamp(data.startDate),
    endDate: convertTimestamp(data.endDate),
    alerts: data.alerts || [],
    // Additional UI properties
    color: data.color,
    icon: data.icon,
  } as Budget & { color?: string; icon?: string };
};

export const createBudget = async (
  userId: string,
  budgetData: Partial<Omit<Budget, 'id' | 'userId'>>
): Promise<string> => {
  const budgetsRef = collection(db, COLLECTIONS.BUDGETS);
  
  const newBudget = {
    userId,
    name: budgetData.name || 'New Budget',
    amount: budgetData.amount || 0,
    spent: 0,
    category: budgetData.category || 'general',
    period: budgetData.period || 'monthly',
    startDate: budgetData.startDate || new Date(),
    endDate: budgetData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    alerts: budgetData.alerts || [{ threshold: 80, triggered: false }],
    color: (budgetData as any).color || '#06b6d4',
    icon: (budgetData as any).icon || null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(budgetsRef, newBudget);
  return docRef.id;
};

export const updateBudget = async (
  budgetId: string,
  updates: Partial<Budget>
): Promise<void> => {
  const budgetRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
  await updateDoc(budgetRef, updates);
};

export const updateBudgetSpent = async (
  budgetId: string,
  amount: number
): Promise<void> => {
  const budgetRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
  await updateDoc(budgetRef, { spent: amount });
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  const budgetRef = doc(db, COLLECTIONS.BUDGETS, budgetId);
  await deleteDoc(budgetRef);
};

export const subscribeToBudgets = (
  userId: string,
  callback: (budgets: Budget[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const budgetsRef = collection(db, COLLECTIONS.BUDGETS);
  const q = query(
    budgetsRef,
    where('userId', '==', userId),
    orderBy('startDate', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const budgets = snapshot.docs.map(convertBudgetFromFirestore);
      callback(budgets);
    },
    (error) => {
      console.error('Error subscribing to budgets:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// ====== SUBSCRIPTIONS ======

const convertSubscriptionFromFirestore = (doc: any): Subscription => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    amount: data.amount,
    currency: data.currency || 'USD',
    billingCycle: data.billingCycle,
    nextBillingDate: convertTimestamp(data.nextBillingDate),
    category: data.category,
    isActive: data.isActive !== false,
    reminder: data.reminder || false,
    reminderDays: data.reminderDays || 3,
    notes: data.notes,
    // Additional UI properties
    color: data.color,
    icon: data.icon,
    logo: data.logo,
  } as Subscription & { color?: string; icon?: string; logo?: string };
};

export const createSubscription = async (
  userId: string,
  subscriptionData: Partial<Omit<Subscription, 'id' | 'userId'>>
): Promise<string> => {
  const subscriptionsRef = collection(db, COLLECTIONS.SUBSCRIPTIONS);
  
  const newSubscription = {
    userId,
    name: subscriptionData.name || 'New Subscription',
    amount: subscriptionData.amount || 0,
    currency: subscriptionData.currency || 'USD',
    billingCycle: subscriptionData.billingCycle || 'monthly',
    nextBillingDate: subscriptionData.nextBillingDate || new Date(),
    category: subscriptionData.category || 'other',
    isActive: subscriptionData.isActive !== false,
    reminder: subscriptionData.reminder || false,
    reminderDays: subscriptionData.reminderDays || 3,
    notes: subscriptionData.notes || null,
    color: (subscriptionData as any).color || '#06b6d4',
    icon: (subscriptionData as any).icon || null,
    logo: (subscriptionData as any).logo || null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(subscriptionsRef, newSubscription);
  return docRef.id;
};

export const updateSubscription = async (
  subscriptionId: string,
  updates: Partial<Subscription>
): Promise<void> => {
  const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
  await updateDoc(subscriptionRef, updates);
};

export const deleteSubscription = async (subscriptionId: string): Promise<void> => {
  const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
  await deleteDoc(subscriptionRef);
};

export const toggleSubscriptionActive = async (
  subscriptionId: string,
  isActive: boolean
): Promise<void> => {
  const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
  await updateDoc(subscriptionRef, { isActive });
};

export const subscribeToSubscriptions = (
  userId: string,
  callback: (subscriptions: Subscription[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const subscriptionsRef = collection(db, COLLECTIONS.SUBSCRIPTIONS);
  const q = query(
    subscriptionsRef,
    where('userId', '==', userId),
    orderBy('nextBillingDate', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const subscriptions = snapshot.docs.map(convertSubscriptionFromFirestore);
      callback(subscriptions);
    },
    (error) => {
      console.error('Error subscribing to subscriptions:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

export const subscribeToActiveSubscriptions = (
  userId: string,
  callback: (subscriptions: Subscription[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const subscriptionsRef = collection(db, COLLECTIONS.SUBSCRIPTIONS);
  const q = query(
    subscriptionsRef,
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('nextBillingDate', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const subscriptions = snapshot.docs.map(convertSubscriptionFromFirestore);
      callback(subscriptions);
    },
    (error) => {
      console.error('Error subscribing to active subscriptions:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Batch operations
export const batchDeleteTransactions = async (transactionIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  transactionIds.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.TRANSACTIONS, id));
  });
  await batch.commit();
};
