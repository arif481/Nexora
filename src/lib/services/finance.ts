// Finance Service - Real-time Firestore operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
  limit,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type {
  Transaction,
  Budget,
  Subscription,
  PersonAccount,
  PersonAccountEntry,
  PersonAccountType,
  NetWorthAccount,
  NetWorthSnapshot,
  SavingsGoal,
  BodyMetricEntry,
  GoalMilestone,
  InboxItem,
  InboxItemType,
} from '@/types';


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
    externalSource: data.externalSource,
    externalId: data.externalId,
    importedAt: data.importedAt ? convertTimestamp(data.importedAt) : undefined,
    lastSyncedAt: data.lastSyncedAt ? convertTimestamp(data.lastSyncedAt) : undefined,
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
    externalSource: transactionData.externalSource || null,
    externalId: transactionData.externalId || null,
    importedAt: transactionData.importedAt || null,
    lastSyncedAt: transactionData.lastSyncedAt || null,
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

// ====== PEOPLE ACCOUNTS ======

const convertPersonAccountFromFirestore = (doc: any): PersonAccount => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    contactInfo: data.contactInfo || undefined,
    notes: data.notes || undefined,
    currency: data.currency || 'USD',
    balance: typeof data.balance === 'number' ? data.balance : 0,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt || data.createdAt),
    lastActivityAt: data.lastActivityAt ? convertTimestamp(data.lastActivityAt) : undefined,
  };
};

export const createPersonAccount = async (
  userId: string,
  accountData: Partial<Omit<PersonAccount, 'id' | 'userId' | 'balance' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  const accountsRef = collection(db, COLLECTIONS.FINANCE_PEOPLE_ACCOUNTS);

  const newAccount = {
    userId,
    name: accountData.name || 'New Person',
    contactInfo: accountData.contactInfo || null,
    notes: accountData.notes || null,
    currency: accountData.currency || 'USD',
    balance: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivityAt: null,
  };

  const docRef = await addDoc(accountsRef, newAccount);
  return docRef.id;
};

export const updatePersonAccount = async (
  accountId: string,
  updates: Partial<PersonAccount>
): Promise<void> => {
  const accountRef = doc(db, COLLECTIONS.FINANCE_PEOPLE_ACCOUNTS, accountId);
  await updateDoc(accountRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deletePersonAccount = async (userId: string, accountId: string): Promise<void> => {
  const accountRef = doc(db, COLLECTIONS.FINANCE_PEOPLE_ACCOUNTS, accountId);
  const entriesRef = collection(db, COLLECTIONS.FINANCE_PEOPLE_ENTRIES);
  const entriesQuery = query(
    entriesRef,
    where('userId', '==', userId),
    where('accountId', '==', accountId)
  );
  const entriesSnapshot = await getDocs(entriesQuery);

  const batch = writeBatch(db);
  entriesSnapshot.docs.forEach((entryDoc) => batch.delete(entryDoc.ref));
  batch.delete(accountRef);
  await batch.commit();
};

export const subscribeToPersonAccounts = (
  userId: string,
  callback: (accounts: PersonAccount[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const accountsRef = collection(db, COLLECTIONS.FINANCE_PEOPLE_ACCOUNTS);
  const q = query(
    accountsRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const accounts = snapshot.docs.map(convertPersonAccountFromFirestore);
      callback(accounts);
    },
    (error) => {
      console.error('Error subscribing to person accounts:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// ====== PEOPLE ACCOUNT ENTRIES ======

const convertPersonAccountEntryFromFirestore = (doc: any): PersonAccountEntry => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    accountId: data.accountId,
    amount: data.amount || 0,
    currency: data.currency || 'USD',
    typeKey: data.typeKey || 'custom',
    typeLabel: data.typeLabel || 'Record',
    balanceEffect: data.balanceEffect === 'decrease' ? 'decrease' : 'increase',
    note: data.note || undefined,
    date: convertTimestamp(data.date),
    createdAt: convertTimestamp(data.createdAt),
  };
};

export const createPersonAccountEntry = async (
  userId: string,
  accountId: string,
  entryData: Partial<Omit<PersonAccountEntry, 'id' | 'userId' | 'accountId' | 'createdAt'>>
): Promise<string> => {
  const entriesRef = collection(db, COLLECTIONS.FINANCE_PEOPLE_ENTRIES);

  const amount = entryData.amount || 0;
  const balanceEffect = entryData.balanceEffect === 'decrease' ? 'decrease' : 'increase';
  const delta = balanceEffect === 'increase' ? amount : -amount;

  const newEntry = {
    userId,
    accountId,
    amount,
    currency: entryData.currency || 'USD',
    typeKey: entryData.typeKey || 'custom',
    typeLabel: entryData.typeLabel || 'Record',
    balanceEffect,
    note: entryData.note || null,
    date: entryData.date || new Date(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(entriesRef, newEntry);

  const accountRef = doc(db, COLLECTIONS.FINANCE_PEOPLE_ACCOUNTS, accountId);
  await updateDoc(accountRef, {
    balance: increment(delta),
    updatedAt: serverTimestamp(),
    lastActivityAt: entryData.date || new Date(),
  });

  return docRef.id;
};

export const subscribeToPersonAccountEntries = (
  userId: string,
  accountId: string,
  callback: (entries: PersonAccountEntry[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const entriesRef = collection(db, COLLECTIONS.FINANCE_PEOPLE_ENTRIES);
  const q = query(
    entriesRef,
    where('userId', '==', userId),
    where('accountId', '==', accountId),
    orderBy('date', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map(convertPersonAccountEntryFromFirestore);
      callback(entries);
    },
    (error) => {
      console.error('Error subscribing to person account entries:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// ====== PEOPLE ACCOUNT TYPES ======

const convertPersonAccountTypeFromFirestore = (doc: any): PersonAccountType => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    balanceEffect: data.balanceEffect === 'decrease' ? 'decrease' : 'increase',
    createdAt: convertTimestamp(data.createdAt),
  };
};

export const createPersonAccountType = async (
  userId: string,
  typeData: Partial<Omit<PersonAccountType, 'id' | 'userId' | 'createdAt'>>
): Promise<string> => {
  const typesRef = collection(db, COLLECTIONS.FINANCE_PEOPLE_TYPES);
  const newType = {
    userId,
    name: typeData.name || 'Custom type',
    balanceEffect: typeData.balanceEffect === 'decrease' ? 'decrease' : 'increase',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(typesRef, newType);
  return docRef.id;
};

export const deletePersonAccountType = async (typeId: string): Promise<void> => {
  const typeRef = doc(db, COLLECTIONS.FINANCE_PEOPLE_TYPES, typeId);
  await deleteDoc(typeRef);
};

export const subscribeToPersonAccountTypes = (
  userId: string,
  callback: (types: PersonAccountType[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const typesRef = collection(db, COLLECTIONS.FINANCE_PEOPLE_TYPES);
  const q = query(
    typesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const types = snapshot.docs.map(convertPersonAccountTypeFromFirestore);
      callback(types);
    },
    (error) => {
      console.error('Error subscribing to person account types:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

export const batchDeleteTransactions = async (transactionIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  transactionIds.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.TRANSACTIONS, id));
  });
  await batch.commit();
};

// ====== NET WORTH ACCOUNTS ======

const convertNetWorthAccount = (d: any): NetWorthAccount => {
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId,
    name: data.name,
    type: data.type,
    subtype: data.subtype,
    balance: data.balance ?? 0,
    currency: data.currency || 'USD',
    institution: data.institution || undefined,
    notes: data.notes || undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const createNetWorthAccount = async (
  userId: string,
  data: Omit<NetWorthAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const ref = collection(db, COLLECTIONS.NET_WORTH_ACCOUNTS);
  const docRef = await addDoc(ref, {
    userId,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateNetWorthAccount = async (
  accountId: string,
  updates: Partial<Omit<NetWorthAccount, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.NET_WORTH_ACCOUNTS, accountId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteNetWorthAccount = async (accountId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.NET_WORTH_ACCOUNTS, accountId));
};

export const subscribeToNetWorthAccounts = (
  userId: string,
  callback: (accounts: NetWorthAccount[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.NET_WORTH_ACCOUNTS),
    where('userId', '==', userId),
    orderBy('type', 'asc'),
    orderBy('name', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(convertNetWorthAccount)),
    (err) => { if (onError) onError(err); }
  );
};

// ====== NET WORTH SNAPSHOTS ======

const convertSnapshot = (d: any): NetWorthSnapshot => {
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId,
    date: convertTimestamp(data.date),
    totalAssets: data.totalAssets ?? 0,
    totalLiabilities: data.totalLiabilities ?? 0,
    netWorth: data.netWorth ?? 0,
  };
};

export const saveNetWorthSnapshot = async (
  userId: string,
  totalAssets: number,
  totalLiabilities: number
): Promise<void> => {
  const netWorth = totalAssets - totalLiabilities;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await addDoc(collection(db, COLLECTIONS.NET_WORTH_SNAPSHOTS), {
    userId,
    date: today,
    totalAssets,
    totalLiabilities,
    netWorth,
  });
};

export const subscribeToNetWorthSnapshots = (
  userId: string,
  callback: (snapshots: NetWorthSnapshot[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.NET_WORTH_SNAPSHOTS),
    where('userId', '==', userId),
    orderBy('date', 'asc'),
    limit(24)
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(convertSnapshot)),
    (err) => { if (onError) onError(err); }
  );
};

// ====== SAVINGS GOALS ======

const convertSavingsGoal = (d: any): SavingsGoal => {
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId,
    name: data.name,
    emoji: data.emoji || '🎯',
    targetAmount: data.targetAmount ?? 0,
    currentAmount: data.currentAmount ?? 0,
    currency: data.currency || 'USD',
    targetDate: data.targetDate ? convertTimestamp(data.targetDate) : undefined,
    category: data.category || 'general',
    color: data.color || '#06b6d4',
    notes: data.notes || undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const createSavingsGoal = async (
  userId: string,
  data: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const ref = collection(db, COLLECTIONS.SAVINGS_GOALS);
  const docRef = await addDoc(ref, {
    userId,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateSavingsGoal = async (
  goalId: string,
  updates: Partial<Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.SAVINGS_GOALS, goalId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteSavingsGoal = async (goalId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.SAVINGS_GOALS, goalId));
};

export const subscribeToSavingsGoals = (
  userId: string,
  callback: (goals: SavingsGoal[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.SAVINGS_GOALS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(convertSavingsGoal)),
    (err) => { if (onError) onError(err); }
  );
};

// ====== BODY METRICS ======

const convertBodyMetric = (d: any): BodyMetricEntry => {
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId,
    date: convertTimestamp(data.date),
    weight: data.weight ?? undefined,
    weightUnit: data.weightUnit || 'kg',
    bodyFatPct: data.bodyFatPct ?? undefined,
    bmi: data.bmi ?? undefined,
    notes: data.notes || undefined,
    createdAt: convertTimestamp(data.createdAt),
  };
};

export const createBodyMetricEntry = async (
  userId: string,
  data: Omit<BodyMetricEntry, 'id' | 'userId' | 'createdAt'>
): Promise<string> => {
  const ref = collection(db, COLLECTIONS.BODY_METRICS);
  const docRef = await addDoc(ref, {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const subscribeToBodyMetrics = (
  userId: string,
  callback: (entries: BodyMetricEntry[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.BODY_METRICS),
    where('userId', '==', userId),
    orderBy('date', 'asc'),
    limit(90)
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(convertBodyMetric)),
    (err) => { if (onError) onError(err); }
  );
};

// ====== GOAL MILESTONES ======

const convertGoalMilestone = (d: any): GoalMilestone => {
  const data = d.data();
  return {
    id: d.id,
    goalId: data.goalId,
    userId: data.userId,
    title: data.title,
    description: data.description || undefined,
    dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
    completed: data.completed ?? false,
    completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
    createdAt: convertTimestamp(data.createdAt),
  };
};

export const createGoalMilestone = async (
  userId: string,
  goalId: string,
  data: Omit<GoalMilestone, 'id' | 'userId' | 'goalId' | 'createdAt' | 'completed' | 'completedAt'>
): Promise<string> => {
  const ref = collection(db, COLLECTIONS.GOAL_MILESTONES);
  const docRef = await addDoc(ref, {
    userId,
    goalId,
    ...data,
    completed: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateGoalMilestone = async (
  milestoneId: string,
  updates: Partial<Omit<GoalMilestone, 'id' | 'userId' | 'goalId' | 'createdAt'>>
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.GOAL_MILESTONES, milestoneId), updates);
};

export const deleteGoalMilestone = async (milestoneId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.GOAL_MILESTONES, milestoneId));
};

export const subscribeToGoalMilestones = (
  userId: string,
  goalId: string,
  callback: (milestones: GoalMilestone[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.GOAL_MILESTONES),
    where('userId', '==', userId),
    where('goalId', '==', goalId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(convertGoalMilestone)),
    (err) => { if (onError) onError(err); }
  );
};

export const subscribeToAllGoalMilestones = (
  userId: string,
  callback: (milestones: GoalMilestone[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.GOAL_MILESTONES),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(convertGoalMilestone)),
    (err) => { if (onError) onError(err); }
  );
};

// ====== INBOX ITEMS ======

const convertInboxItem = (d: any): InboxItem => {
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId,
    content: data.content,
    classifiedAs: (data.classifiedAs as InboxItemType) || 'unclassified',
    processed: data.processed ?? false,
    createdAt: convertTimestamp(data.createdAt),
  };
};

export const createInboxItem = async (
  userId: string,
  content: string,
  classifiedAs: InboxItemType = 'unclassified'
): Promise<string> => {
  const ref = collection(db, COLLECTIONS.INBOX_ITEMS);
  const docRef = await addDoc(ref, {
    userId,
    content,
    classifiedAs,
    processed: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateInboxItem = async (
  itemId: string,
  updates: Partial<Pick<InboxItem, 'classifiedAs' | 'processed'>>
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.INBOX_ITEMS, itemId), updates);
};

export const deleteInboxItem = async (itemId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.INBOX_ITEMS, itemId));
};

export const subscribeToInboxItems = (
  userId: string,
  callback: (items: InboxItem[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.INBOX_ITEMS),
    where('userId', '==', userId),
    where('processed', '==', false),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(convertInboxItem)),
    (err) => { if (onError) onError(err); }
  );
};
