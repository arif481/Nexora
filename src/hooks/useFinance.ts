'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import type { Transaction, Budget, Subscription } from '@/types';
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
