'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import type {
  Transaction,
  Budget,
  Subscription,
  PersonAccount,
  PersonAccountEntry,
  PersonAccountType,
  PersonAccountBalanceEffect,
  NetWorthAccount,
  NetWorthSnapshot,
  SavingsGoal,
  BodyMetricEntry,
  GoalMilestone,
  InboxItem,
  InboxItemType,
} from '@/types';
import {
  subscribeToTransactions,
  subscribeToRecentTransactions,
  subscribeToTransactionsInRange,
  subscribeToBudgets,
  subscribeToSubscriptions,
  subscribeToActiveSubscriptions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createBudget,
  updateBudget,
  updateBudgetSpent,
  deleteBudget,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscriptionActive,
  subscribeToPersonAccounts,
  createPersonAccount,
  updatePersonAccount,
  deletePersonAccount,
  subscribeToPersonAccountEntries,
  createPersonAccountEntry,
  subscribeToPersonAccountTypes,
  createPersonAccountType,
  deletePersonAccountType,
  subscribeToNetWorthAccounts,
  createNetWorthAccount,
  updateNetWorthAccount,
  deleteNetWorthAccount,
  subscribeToNetWorthSnapshots,
  saveNetWorthSnapshot,
  subscribeToSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  subscribeToBodyMetrics,
  createBodyMetricEntry,
  subscribeToGoalMilestones,
  subscribeToAllGoalMilestones,
  createGoalMilestone,
  updateGoalMilestone,
  deleteGoalMilestone,
  subscribeToInboxItems,
  createInboxItem,
  updateInboxItem,
  deleteInboxItem,
} from '@/lib/services/finance';


// ====== TRANSACTIONS HOOK ======

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  createTransaction: (data: CreateTransactionData) => Promise<string>;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  refresh: () => void;
}

interface CreateTransactionData {
  amount: number;
  currency?: string;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date?: Date;
  recurring?: boolean;
  tags?: string[];
  icon?: string;
  color?: string;
}

export function useTransactions(): UseTransactionsReturn {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTransactions(
      user.uid,
      (fetchedTransactions) => {
        setTransactions(fetchedTransactions);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Transactions subscription error:', err);
        setError(err.message);
        setTransactions([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateTransaction = useCallback(
    async (data: CreateTransactionData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');

      try {
        const transactionId = await createTransaction(user.uid, data);
        return transactionId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateTransaction = useCallback(
    async (transactionId: string, updates: Partial<Transaction>): Promise<void> => {
      try {
        await updateTransaction(transactionId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteTransaction = useCallback(
    async (transactionId: string): Promise<void> => {
      try {
        await deleteTransaction(transactionId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    transactions,
    loading,
    error,
    createTransaction: handleCreateTransaction,
    updateTransaction: handleUpdateTransaction,
    deleteTransaction: handleDeleteTransaction,
    refresh,
  };
}

// ====== BUDGETS HOOK ======

interface UseBudgetsReturn {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  createBudget: (data: CreateBudgetData) => Promise<string>;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => Promise<void>;
  updateSpent: (budgetId: string, amount: number) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  refresh: () => void;
}

interface CreateBudgetData {
  name: string;
  amount: number;
  category: string;
  period?: 'weekly' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
  color?: string;
  icon?: string;
}

export function useBudgets(): UseBudgetsReturn {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToBudgets(
      user.uid,
      (fetchedBudgets) => {
        setBudgets(fetchedBudgets);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Budgets subscription error:', err);
        setError(err.message);
        setBudgets([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateBudget = useCallback(
    async (data: CreateBudgetData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');

      try {
        const budgetId = await createBudget(user.uid, data);
        return budgetId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateBudget = useCallback(
    async (budgetId: string, updates: Partial<Budget>): Promise<void> => {
      try {
        await updateBudget(budgetId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleUpdateSpent = useCallback(
    async (budgetId: string, amount: number): Promise<void> => {
      try {
        await updateBudgetSpent(budgetId, amount);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteBudget = useCallback(
    async (budgetId: string): Promise<void> => {
      try {
        await deleteBudget(budgetId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    budgets,
    loading,
    error,
    createBudget: handleCreateBudget,
    updateBudget: handleUpdateBudget,
    updateSpent: handleUpdateSpent,
    deleteBudget: handleDeleteBudget,
    refresh,
  };
}

// ====== SUBSCRIPTIONS HOOK ======

interface UseSubscriptionsReturn {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  createSubscription: (data: CreateSubscriptionData) => Promise<string>;
  updateSubscription: (subscriptionId: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (subscriptionId: string) => Promise<void>;
  toggleActive: (subscriptionId: string, isActive: boolean) => Promise<void>;
  refresh: () => void;
}

interface CreateSubscriptionData {
  name: string;
  amount: number;
  currency?: string;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate?: Date;
  category?: string;
  reminder?: boolean;
  reminderDays?: number;
  notes?: string;
  color?: string;
  icon?: string;
  logo?: string;
}

export function useSubscriptions(activeOnly: boolean = false): UseSubscriptionsReturn {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const subscribeFn = activeOnly ? subscribeToActiveSubscriptions : subscribeToSubscriptions;

    const unsubscribe = subscribeFn(
      user.uid,
      (fetchedSubscriptions) => {
        setSubscriptions(fetchedSubscriptions);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Subscriptions error:', err);
        setError(err.message);
        setSubscriptions([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, activeOnly]);

  const handleCreateSubscription = useCallback(
    async (data: CreateSubscriptionData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');

      try {
        const subscriptionId = await createSubscription(user.uid, data);
        return subscriptionId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateSubscription = useCallback(
    async (subscriptionId: string, updates: Partial<Subscription>): Promise<void> => {
      try {
        await updateSubscription(subscriptionId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteSubscription = useCallback(
    async (subscriptionId: string): Promise<void> => {
      try {
        await deleteSubscription(subscriptionId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleToggleActive = useCallback(
    async (subscriptionId: string, isActive: boolean): Promise<void> => {
      try {
        await toggleSubscriptionActive(subscriptionId, isActive);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    subscriptions,
    loading,
    error,
    createSubscription: handleCreateSubscription,
    updateSubscription: handleUpdateSubscription,
    deleteSubscription: handleDeleteSubscription,
    toggleActive: handleToggleActive,
    refresh,
  };
}

// ====== PEOPLE ACCOUNTS HOOK ======

interface UsePersonAccountsReturn {
  personAccounts: PersonAccount[];
  loading: boolean;
  error: string | null;
  createPersonAccount: (data: CreatePersonAccountData) => Promise<string>;
  updatePersonAccount: (accountId: string, updates: Partial<PersonAccount>) => Promise<void>;
  deletePersonAccount: (accountId: string) => Promise<void>;
  refresh: () => void;
}

interface CreatePersonAccountData {
  name: string;
  contactInfo?: string;
  notes?: string;
  currency?: string;
}

export function usePersonAccounts(): UsePersonAccountsReturn {
  const { user } = useAuth();
  const [personAccounts, setPersonAccounts] = useState<PersonAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPersonAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToPersonAccounts(
      user.uid,
      (fetchedAccounts) => {
        setPersonAccounts(fetchedAccounts);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Person accounts subscription error:', err);
        setError(err.message);
        setPersonAccounts([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreatePersonAccount = useCallback(
    async (data: CreatePersonAccountData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');

      try {
        const accountId = await createPersonAccount(user.uid, data);
        return accountId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdatePersonAccount = useCallback(
    async (accountId: string, updates: Partial<PersonAccount>): Promise<void> => {
      try {
        await updatePersonAccount(accountId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeletePersonAccount = useCallback(
    async (accountId: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      try {
        await deletePersonAccount(user.uid, accountId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    personAccounts,
    loading,
    error,
    createPersonAccount: handleCreatePersonAccount,
    updatePersonAccount: handleUpdatePersonAccount,
    deletePersonAccount: handleDeletePersonAccount,
    refresh,
  };
}

// ====== PEOPLE ACCOUNT ENTRIES HOOK ======

interface UsePersonAccountEntriesReturn {
  entries: PersonAccountEntry[];
  loading: boolean;
  error: string | null;
  createEntry: (data: CreatePersonAccountEntryData) => Promise<string>;
  refresh: () => void;
}

interface CreatePersonAccountEntryData {
  amount: number;
  currency?: string;
  typeKey: string;
  typeLabel: string;
  balanceEffect: PersonAccountBalanceEffect;
  note?: string;
  date?: Date;
}

export function usePersonAccountEntries(accountId: string | null): UsePersonAccountEntriesReturn {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PersonAccountEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !accountId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToPersonAccountEntries(
      user.uid,
      accountId,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Person account entries subscription error:', err);
        setError(err.message);
        setEntries([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, accountId]);

  const handleCreateEntry = useCallback(
    async (data: CreatePersonAccountEntryData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');
      if (!accountId) throw new Error('No account selected');

      try {
        const entryId = await createPersonAccountEntry(user.uid, accountId, data);
        return entryId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user, accountId]
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    entries,
    loading,
    error,
    createEntry: handleCreateEntry,
    refresh,
  };
}

// ====== PEOPLE ACCOUNT TYPES HOOK ======

interface UsePersonAccountTypesReturn {
  customTypes: PersonAccountType[];
  loading: boolean;
  error: string | null;
  createType: (data: CreatePersonAccountTypeData) => Promise<string>;
  deleteType: (typeId: string) => Promise<void>;
  refresh: () => void;
}

interface CreatePersonAccountTypeData {
  name: string;
  balanceEffect: PersonAccountBalanceEffect;
}

export function usePersonAccountTypes(): UsePersonAccountTypesReturn {
  const { user } = useAuth();
  const [customTypes, setCustomTypes] = useState<PersonAccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCustomTypes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToPersonAccountTypes(
      user.uid,
      (fetchedTypes) => {
        setCustomTypes(fetchedTypes);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Person account types subscription error:', err);
        setError(err.message);
        setCustomTypes([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateType = useCallback(
    async (data: CreatePersonAccountTypeData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');

      try {
        const typeId = await createPersonAccountType(user.uid, data);
        return typeId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleDeleteType = useCallback(
    async (typeId: string): Promise<void> => {
      try {
        await deletePersonAccountType(typeId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    customTypes,
    loading,
    error,
    createType: handleCreateType,
    deleteType: handleDeleteType,
    refresh,
  };
}

// ====== FINANCE STATISTICS HOOK ======

export function useFinanceStats(transactions: Transaction[], budgets: Budget[]) {
  // Ensure arrays are always valid - do this before useMemo
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeBudgets = Array.isArray(budgets) ? budgets : [];

  const stats = useMemo(() => {
    if (safeTransactions.length === 0 && safeBudgets.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        budgetUtilization: 0,
        topCategories: [] as { category: string; amount: number }[],
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalIncome = safeTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = safeTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyTransactions = safeTransactions.filter(
      (t) => new Date(t.date) >= startOfMonth
    );

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate budget utilization
    const totalBudget = safeBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = safeBudgets.reduce((sum, b) => sum + b.spent, 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Calculate top expense categories
    const categoryTotals: Record<string, number> = {};
    safeTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const category = t.category || 'other';
        categoryTotals[category] = (categoryTotals[category] || 0) + t.amount;
      });

    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      budgetUtilization,
      topCategories,
    };
  }, [safeTransactions, safeBudgets]);

  return stats;
}

// ====== NET WORTH HOOK ======

export function useNetWorth() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<NetWorthAccount[]>([]);
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const unsub1 = subscribeToNetWorthAccounts(
      user.uid,
      (accs) => { setAccounts(accs); setLoading(false); },
      (err) => setError(err.message)
    );
    const unsub2 = subscribeToNetWorthSnapshots(
      user.uid,
      (snaps) => setSnapshots(snaps),
      (err) => setError(err.message)
    );
    return () => { unsub1(); unsub2(); };
  }, [user]);

  const totals = useMemo(() => {
    const totalAssets = accounts.filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.balance, 0);
    return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
  }, [accounts]);

  const handleCreate = useCallback(async (data: Omit<NetWorthAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    return createNetWorthAccount(user.uid, data);
  }, [user]);

  const handleUpdate = useCallback(async (id: string, upd: Partial<Omit<NetWorthAccount, 'id' | 'userId' | 'createdAt'>>) => {
    return updateNetWorthAccount(id, upd);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    return deleteNetWorthAccount(id);
  }, []);

  const handleSaveSnapshot = useCallback(async () => {
    if (!user) return;
    await saveNetWorthSnapshot(user.uid, totals.totalAssets, totals.totalLiabilities);
  }, [user, totals]);

  return { accounts, snapshots, ...totals, loading, error, createAccount: handleCreate, updateAccount: handleUpdate, deleteAccount: handleDelete, saveSnapshot: handleSaveSnapshot };
}

// ====== SAVINGS GOALS HOOK ======

export function useSavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToSavingsGoals(
      user.uid,
      (g) => { setGoals(g); setLoading(false); },
      (err) => setError(err.message)
    );
    return unsub;
  }, [user]);

  const handleCreate = useCallback(async (data: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    return createSavingsGoal(user.uid, data);
  }, [user]);

  const handleUpdate = useCallback(async (id: string, upd: Partial<Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'>>) => {
    return updateSavingsGoal(id, upd);
  }, []);

  const handleDelete = useCallback(async (id: string) => deleteSavingsGoal(id), []);

  return { goals, loading, error, createGoal: handleCreate, updateGoal: handleUpdate, deleteGoal: handleDelete };
}

// ====== BODY METRICS HOOK ======

export function useBodyMetrics() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<BodyMetricEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const unsub = subscribeToBodyMetrics(
      user.uid,
      (e) => { setEntries(e); setLoading(false); }
    );
    return unsub;
  }, [user]);

  const handleCreate = useCallback(async (data: Omit<BodyMetricEntry, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated');
    return createBodyMetricEntry(user.uid, data);
  }, [user]);

  return { entries, loading, addEntry: handleCreate };
}

// ====== GOAL MILESTONES HOOK ======

export function useGoalMilestones(goalId?: string) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const unsub = goalId
      ? subscribeToGoalMilestones(user.uid, goalId, (m) => { setMilestones(m); setLoading(false); })
      : subscribeToAllGoalMilestones(user.uid, (m) => { setMilestones(m); setLoading(false); });
    return unsub;
  }, [user, goalId]);

  const handleCreate = useCallback(async (gId: string, data: Omit<GoalMilestone, 'id' | 'userId' | 'goalId' | 'createdAt' | 'completed' | 'completedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    return createGoalMilestone(user.uid, gId, data);
  }, [user]);

  const handleUpdate = useCallback(async (id: string, upd: Partial<Omit<GoalMilestone, 'id' | 'userId' | 'goalId' | 'createdAt'>>) => {
    return updateGoalMilestone(id, upd);
  }, []);

  const handleDelete = useCallback(async (id: string) => deleteGoalMilestone(id), []);

  const handleToggle = useCallback(async (milestone: GoalMilestone) => {
    return updateGoalMilestone(milestone.id, {
      completed: !milestone.completed,
      completedAt: !milestone.completed ? new Date() : undefined,
    });
  }, []);

  return { milestones, loading, createMilestone: handleCreate, updateMilestone: handleUpdate, deleteMilestone: handleDelete, toggleMilestone: handleToggle };
}

// ====== INBOX HOOK ======

export function useInbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const unsub = subscribeToInboxItems(
      user.uid,
      (i) => { setItems(i); setLoading(false); }
    );
    return unsub;
  }, [user]);

  const handleCreate = useCallback(async (content: string, classifiedAs: InboxItemType = 'unclassified') => {
    if (!user) throw new Error('Not authenticated');
    return createInboxItem(user.uid, content, classifiedAs);
  }, [user]);

  const handleProcess = useCallback(async (id: string) => updateInboxItem(id, { processed: true }), []);
  const handleReclassify = useCallback(async (id: string, t: InboxItemType) => updateInboxItem(id, { classifiedAs: t }), []);
  const handleDelete = useCallback(async (id: string) => deleteInboxItem(id), []);

  return { items, loading, addItem: handleCreate, processItem: handleProcess, reclassifyItem: handleReclassify, deleteItem: handleDelete };
}
