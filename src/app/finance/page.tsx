'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Edit3,
  Trash2,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Zap,
  Smartphone,
  Heart,
  Plane,
  Gift,
  Coffee,
  Music,
  Sparkles,
  Brain,
  Target,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  PieChart,
  LogIn,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions, useBudgets, useSubscriptions, useFinanceStats } from '@/hooks/useFinance';
import type { Transaction, Budget } from '@/types';

// Category config
const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  food: { label: 'Food & Dining', icon: Utensils, color: '#f97316' },
  shopping: { label: 'Shopping', icon: ShoppingCart, color: '#ec4899' },
  transport: { label: 'Transportation', icon: Car, color: '#3b82f6' },
  utilities: { label: 'Utilities', icon: Zap, color: '#fbbf24' },
  entertainment: { label: 'Entertainment', icon: Music, color: '#a855f7' },
  health: { label: 'Health', icon: Heart, color: '#ef4444' },
  travel: { label: 'Travel', icon: Plane, color: '#00f0ff' },
  housing: { label: 'Housing', icon: Home, color: '#10b981' },
  phone: { label: 'Phone & Internet', icon: Smartphone, color: '#6366f1' },
  other: { label: 'Other', icon: Receipt, color: '#6b7280' },
  salary: { label: 'Salary', icon: DollarSign, color: '#22c55e' },
  freelance: { label: 'Freelance', icon: Wallet, color: '#00f0ff' },
  investment: { label: 'Investment', icon: TrendingUp, color: '#a855f7' },
};

export default function FinancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: transactionsLoading, createTransaction, updateTransaction, deleteTransaction: deleteTransactionFn } = useTransactions();
  const { budgets, loading: budgetsLoading, createBudget, updateBudget, deleteBudget } = useBudgets();
  const { subscriptions, loading: subscriptionsLoading, createSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
  const stats = useFinanceStats(transactions, budgets);
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isAddSubscriptionOpen, setIsAddSubscriptionOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { openAIPanel } = useUIStore();

  const loading = authLoading || transactionsLoading || budgetsLoading || subscriptionsLoading;

  // Calculate monthly stats - MUST be called before any early returns
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyTransactions = safeTransactions.filter(t => new Date(t.date) >= startOfMonth);
    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

    return { income, expenses, balance, savingsRate };
  }, [safeTransactions]);

  // Filter transactions - MUST be called before any early returns
  const filteredTransactions = useMemo(() => {
    return safeTransactions
      .filter(t => filter === 'all' || t.type === filter)
      .filter(t => 
        searchQuery === '' ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        categoryConfig[t.category]?.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [safeTransactions, filter, searchQuery]);

  // Show loading state
  if (loading) {
    return (
      <MainLayout>
        <PageContainer title="Finance" subtitle="Track spending, grow wealth">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading finance data...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Finance" subtitle="Track spending, grow wealth">
          <Card variant="glass" className="max-w-md mx-auto p-8 text-center">
            <LogIn className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Sign in to track finances</h3>
            <p className="text-dark-400 mb-6">
              Track your income, expenses, and budgets with real-time sync across devices.
            </p>
            <Button variant="glow" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const config = categoryConfig[transaction.category] || categoryConfig.other;
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="group flex items-center gap-4 p-4 rounded-xl bg-dark-800/30 hover:bg-dark-700/30 transition-colors cursor-pointer"
        onClick={() => setSelectedTransaction(transaction)}
      >
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-white truncate">{transaction.description}</p>
            {transaction.recurring && (
              <Badge variant="outline" size="sm">Recurring</Badge>
            )}
          </div>
          <p className="text-sm text-dark-400">{config.label}</p>
        </div>

        <div className="text-right">
          <p className={cn(
            'font-semibold',
            transaction.type === 'income' ? 'text-neon-green' : 'text-white'
          )}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </p>
          <p className="text-xs text-dark-500">{formatDate(transaction.date)}</p>
        </div>

        <button
          onClick={e => { e.stopPropagation(); }}
          className="p-2 rounded-lg hover:bg-dark-600/50 opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreHorizontal className="w-4 h-4 text-dark-400" />
        </button>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <PageContainer title="Finance" subtitle="Track spending, grow wealth">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Monthly Income</span>
              <ArrowUpRight className="w-6 h-6 text-neon-green" />
            </div>
            <p className="text-2xl font-bold text-neon-green">{formatCurrency(monthlyStats.income)}</p>
            <p className="text-xs text-dark-500">this month</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Monthly Expenses</span>
              <ArrowDownLeft className="w-6 h-6 text-neon-orange" />
            </div>
            <p className="text-2xl font-bold text-neon-orange">{formatCurrency(monthlyStats.expenses)}</p>
            <p className="text-xs text-dark-500">this month</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Net Balance</span>
              <Wallet className="w-6 h-6 text-neon-cyan" />
            </div>
            <p className={cn(
              'text-2xl font-bold',
              monthlyStats.balance >= 0 ? 'text-neon-green' : 'text-status-error'
            )}>
              {formatCurrency(monthlyStats.balance)}
            </p>
            <p className="text-xs text-dark-500">this month</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Savings Rate</span>
              <CircularProgress value={monthlyStats.savingsRate} size={48} strokeWidth={4} />
            </div>
            <p className="text-2xl font-bold text-white">{monthlyStats.savingsRate}%</p>
            <p className="text-xs text-dark-500">of income saved</p>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-2">
                {(['all', 'income', 'expense'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm capitalize transition-all',
                      filter === f
                        ? f === 'income'
                          ? 'bg-neon-green/20 text-neon-green'
                          : f === 'expense'
                          ? 'bg-neon-orange/20 text-neon-orange'
                          : 'bg-neon-cyan/20 text-neon-cyan'
                        : 'bg-dark-800/50 text-dark-300 hover:text-white'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="w-full sm:w-64"
                />
                <Button variant="glow" onClick={() => setIsAddTransactionOpen(true)}>
                  <Plus className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </div>

            {/* Transactions */}
            <Card variant="glass">
              <CardHeader
                title="Recent Transactions"
                icon={<Receipt className="w-5 h-5 text-neon-cyan" />}
              />
              <CardContent className="space-y-2">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.slice(0, 10).map(transaction => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))
                ) : (
                  <EmptyState
                    icon={<Receipt className="w-12 h-12" />}
                    title="No transactions"
                    description="Add your first transaction to start tracking"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Budget Overview */}
            <Card variant="glass">
              <CardHeader
                title="Budget Overview"
                icon={<PieChart className="w-5 h-5 text-neon-orange" />}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setIsAddBudgetOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                }
              />
              <CardContent className="space-y-4">
                {budgets.length > 0 ? budgets.map(budget => {
                  const percentage = Math.round((budget.spent / budget.amount) * 100);
                  const isOverBudget = percentage > 100;
                  const isNearLimit = percentage >= 80 && percentage <= 100;
                  const config = categoryConfig[budget.category] || categoryConfig.other;
                  const Icon = config.icon;

                  return (
                    <div 
                      key={budget.id} 
                      className="p-3 rounded-lg hover:bg-dark-700/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedBudget(budget)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                          <span className="text-sm text-white">
                            {budget.name || config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {(isOverBudget || isNearLimit) && (
                            <AlertTriangle className={cn(
                              'w-4 h-4',
                              isOverBudget ? 'text-status-error' : 'text-neon-orange'
                            )} />
                          )}
                          <span className="text-xs text-dark-400">
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                          </span>
                          <Edit3 className="w-3 h-3 text-dark-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        variant={isOverBudget ? 'purple' : isNearLimit ? 'orange' : 'cyan'}
                        size="sm"
                      />
                    </div>
                  );
                }) : (
                  <p className="text-sm text-dark-400 text-center py-4">No budgets set. Create one to track spending.</p>
                )}
              </CardContent>
            </Card>

            {/* Subscriptions */}
            <Card variant="glass">
              <CardHeader
                title="Subscriptions"
                icon={<CreditCard className="w-5 h-5 text-neon-purple" />}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setIsAddSubscriptionOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                }
              />
              <CardContent className="space-y-3">
                {subscriptions.length > 0 ? subscriptions.map(sub => {
                  const nextBilling = sub.nextBillingDate instanceof Date 
                    ? sub.nextBillingDate 
                    : new Date(sub.nextBillingDate);
                  const daysUntil = Math.ceil((nextBilling.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div 
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-700/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedSubscription(sub)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-neon-purple" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{sub.name}</p>
                          <p className="text-xs text-dark-400">
                            {daysUntil <= 0 ? 'Due today' : daysUntil === 1 ? 'Due tomorrow' : `Due in ${daysUntil} days`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatCurrency(sub.amount)}</p>
                        <p className="text-xs text-dark-400">/{sub.billingCycle}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-dark-400 text-center py-4">No subscriptions tracked. Add one to monitor recurring payments.</p>
                )}
                {subscriptions.length > 0 && (
                  <div className="pt-2 border-t border-dark-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Monthly Total</span>
                      <span className="text-white font-medium">
                        {formatCurrency(subscriptions.reduce((sum, s) => {
                          const amount = s.amount;
                          if (s.billingCycle === 'yearly') return sum + (amount / 12);
                          if (s.billingCycle === 'quarterly') return sum + (amount / 3);
                          if (s.billingCycle === 'weekly') return sum + (amount * 4);
                          return sum + amount;
                        }, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card variant="glass">
              <CardHeader
                title="AI Insights"
                icon={<Brain className="w-5 h-5 text-neon-purple" />}
              />
              <CardContent className="space-y-3">
                {stats.budgetUtilization > 80 ? (
                  <div className="p-3 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-neon-orange" />
                      <span className="text-xs font-medium text-neon-orange">Watch Out</span>
                    </div>
                    <p className="text-sm text-dark-300">
                      You've used {Math.round(stats.budgetUtilization)}% of your total budget this period.
                    </p>
                  </div>
                ) : monthlyStats.savingsRate > 20 ? (
                  <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-neon-green" />
                      <span className="text-xs font-medium text-neon-green">Good News!</span>
                    </div>
                    <p className="text-sm text-dark-300">
                      Great job! You're saving {monthlyStats.savingsRate}% of your income this month.
                    </p>
                  </div>
                ) : null}

                {stats.topCategories.length > 0 && (
                  <div className="p-3 rounded-lg bg-dark-800/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-neon-cyan" />
                      <span className="text-xs font-medium text-dark-200">Top Spending</span>
                    </div>
                    <p className="text-sm text-dark-400">
                      Your highest expense category is {categoryConfig[stats.topCategories[0]?.category]?.label || stats.topCategories[0]?.category} at {formatCurrency(stats.topCategories[0]?.amount || 0)}.
                    </p>
                  </div>
                )}

                <Button variant="ghost" size="sm" className="w-full" onClick={openAIPanel}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get Financial Advice
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Add Transaction Modal */}
        <Modal
          isOpen={isAddTransactionOpen}
          onClose={() => setIsAddTransactionOpen(false)}
          title="Add Transaction"
          size="md"
        >
          <AddTransactionForm
            onAdd={async (data) => {
              await createTransaction(data);
              setIsAddTransactionOpen(false);
            }}
            onClose={() => setIsAddTransactionOpen(false)}
          />
        </Modal>

        {/* Transaction Details Modal */}
        <Modal
          isOpen={!!selectedTransaction && !isEditTransactionOpen}
          onClose={() => setSelectedTransaction(null)}
          title="Transaction Details"
          size="sm"
        >
          {selectedTransaction && (
            <TransactionDetails
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
              onDelete={async () => {
                await deleteTransactionFn(selectedTransaction.id);
                setSelectedTransaction(null);
              }}
              onEdit={() => setIsEditTransactionOpen(true)}
            />
          )}
        </Modal>

        {/* Edit Transaction Modal */}
        <Modal
          isOpen={isEditTransactionOpen && !!selectedTransaction}
          onClose={() => setIsEditTransactionOpen(false)}
          title="Edit Transaction"
          size="md"
        >
          {selectedTransaction && (
            <EditTransactionForm
              transaction={selectedTransaction}
              onSave={async (data) => {
                await updateTransaction(selectedTransaction.id, data);
                setIsEditTransactionOpen(false);
                setSelectedTransaction(null);
              }}
              onClose={() => setIsEditTransactionOpen(false)}
            />
          )}
        </Modal>

        {/* Add Budget Modal */}
        <Modal
          isOpen={isAddBudgetOpen}
          onClose={() => setIsAddBudgetOpen(false)}
          title="Create Budget"
          size="md"
        >
          <AddBudgetForm
            onAdd={async (data) => {
              await createBudget(data);
              setIsAddBudgetOpen(false);
            }}
            onClose={() => setIsAddBudgetOpen(false)}
          />
        </Modal>

        {/* Budget Details/Edit Modal */}
        <Modal
          isOpen={!!selectedBudget}
          onClose={() => setSelectedBudget(null)}
          title="Edit Budget"
          size="md"
        >
          {selectedBudget && (
            <BudgetDetailsForm
              budget={selectedBudget}
              onSave={async (data) => {
                await updateBudget(selectedBudget.id, data);
                setSelectedBudget(null);
              }}
              onDelete={async () => {
                await deleteBudget(selectedBudget.id);
                setSelectedBudget(null);
              }}
              onClose={() => setSelectedBudget(null)}
            />
          )}
        </Modal>

        {/* Add Subscription Modal */}
        <Modal
          isOpen={isAddSubscriptionOpen}
          onClose={() => setIsAddSubscriptionOpen(false)}
          title="Add Subscription"
          size="md"
        >
          <AddSubscriptionForm
            onAdd={async (data) => {
              await createSubscription(data);
              setIsAddSubscriptionOpen(false);
            }}
            onClose={() => setIsAddSubscriptionOpen(false)}
          />
        </Modal>

        {/* Subscription Details/Edit Modal */}
        <Modal
          isOpen={!!selectedSubscription}
          onClose={() => setSelectedSubscription(null)}
          title="Edit Subscription"
          size="md"
        >
          {selectedSubscription && (
            <SubscriptionDetailsForm
              subscription={selectedSubscription}
              onSave={async (data) => {
                await updateSubscription(selectedSubscription.id, data);
                setSelectedSubscription(null);
              }}
              onDelete={async () => {
                await deleteSubscription(selectedSubscription.id);
                setSelectedSubscription(null);
              }}
              onClose={() => setSelectedSubscription(null)}
            />
          )}
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Add Transaction Form
interface CreateTransactionData {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date?: Date;
  recurring?: boolean;
}

function AddTransactionForm({
  onAdd,
  onClose,
}: {
  onAdd: (data: CreateTransactionData) => Promise<void>;
  onClose: () => void;
}) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = type === 'income'
    ? ['salary', 'freelance', 'investment', 'other']
    : ['food', 'shopping', 'transport', 'utilities', 'entertainment', 'health', 'travel', 'housing', 'phone', 'other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAdd({
        type,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date),
        recurring,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type Toggle */}
      <div className="flex gap-2">
        {(['expense', 'income'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory(t === 'income' ? 'salary' : 'food');
            }}
            className={cn(
              'flex-1 py-3 rounded-xl text-sm font-medium transition-all',
              type === t
                ? t === 'income'
                  ? 'bg-neon-green/20 text-neon-green border-2 border-neon-green'
                  : 'bg-neon-orange/20 text-neon-orange border-2 border-neon-orange'
                : 'bg-dark-800/50 text-dark-300 border-2 border-transparent'
            )}
          >
            {t === 'income' ? (
              <span className="flex items-center justify-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Income
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ArrowDownLeft className="w-4 h-4" />
                Expense
              </span>
            )}
          </button>
        ))}
      </div>

      <Input
        label="Amount"
        type="number"
        placeholder="0.00"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        leftIcon={<DollarSign className="w-4 h-4" />}
        required
        step="0.01"
        min="0"
      />

      <Input
        label="Description"
        placeholder="What was this for?"
        value={description}
        onChange={e => setDescription(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                  category === cat
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'bg-dark-800/50 text-dark-300 hover:text-white'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      <Input
        type="date"
        label="Date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />

      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          onClick={() => setRecurring(!recurring)}
          className={cn(
            'w-12 h-6 rounded-full transition-colors relative',
            recurring ? 'bg-neon-cyan' : 'bg-dark-700'
          )}
        >
          <div
            className={cn(
              'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
              recurring ? 'translate-x-6' : 'translate-x-0.5'
            )}
          />
        </button>
        <span className="text-sm text-dark-200">Recurring transaction</span>
      </label>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
}

// Transaction Details Component
function TransactionDetails({
  transaction,
  onClose,
  onDelete,
  onEdit,
}: {
  transaction: Transaction;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const config = categoryConfig[transaction.category] || categoryConfig.other;
  const Icon = config.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon className="w-8 h-8" style={{ color: config.color }} />
        </div>
        <div>
          <p className={cn(
            'text-2xl font-bold',
            transaction.type === 'income' ? 'text-neon-green' : 'text-white'
          )}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </p>
          <p className="text-dark-400">{config.label}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/30">
          <span className="text-sm text-dark-400">Description</span>
          <span className="text-sm text-white">{transaction.description}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/30">
          <span className="text-sm text-dark-400">Date</span>
          <span className="text-sm text-white">
            {transaction.date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/30">
          <span className="text-sm text-dark-400">Type</span>
          <Badge variant={transaction.type === 'income' ? 'green' : 'orange'}>
            {transaction.type}
          </Badge>
        </div>
        {transaction.recurring && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/30">
            <span className="text-sm text-dark-400">Recurring</span>
            <Badge variant="cyan">Monthly</Badge>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-dark-700/50">
        <Button variant="ghost" size="sm" className="text-status-error" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

// Edit Transaction Form
function EditTransactionForm({
  transaction,
  onSave,
  onClose,
}: {
  transaction: Transaction;
  onSave: (data: Partial<Transaction>) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type, setType] = useState<'income' | 'expense'>(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [description, setDescription] = useState(transaction.description || '');
  const [date, setDate] = useState(
    transaction.date instanceof Date 
      ? transaction.date.toISOString().split('T')[0] 
      : new Date(transaction.date).toISOString().split('T')[0]
  );
  const [recurring, setRecurring] = useState(transaction.recurring || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = ['food', 'shopping', 'transport', 'utilities', 'entertainment', 'health', 'travel', 'housing', 'phone', 'other'];
  const incomeCategories = ['salary', 'freelance', 'investment', 'other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: new Date(date),
        recurring,
      });
    } catch (error) {
      console.error('Failed to update transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="flex gap-2 p-1 bg-dark-800 rounded-lg">
        <button
          type="button"
          className={cn(
            'flex-1 py-2 rounded-md text-sm font-medium transition-colors',
            type === 'expense' ? 'bg-neon-orange text-white' : 'text-dark-400 hover:text-white'
          )}
          onClick={() => {
            setType('expense');
            setCategory('food');
          }}
        >
          Expense
        </button>
        <button
          type="button"
          className={cn(
            'flex-1 py-2 rounded-md text-sm font-medium transition-colors',
            type === 'income' ? 'bg-neon-green text-white' : 'text-dark-400 hover:text-white'
          )}
          onClick={() => {
            setType('income');
            setCategory('salary');
          }}
        >
          Income
        </button>
      </div>

      {/* Amount */}
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark-200">Category</label>
        <div className="grid grid-cols-4 gap-2">
          {(type === 'expense' ? expenseCategories : incomeCategories).map((cat) => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'p-3 rounded-lg border transition-colors flex flex-col items-center gap-1',
                  category === cat
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-dark-700 hover:border-dark-500'
                )}
              >
                <Icon className="w-5 h-5" style={{ color: config.color }} />
                <span className="text-xs text-dark-300">{config.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What was this for?"
      />

      {/* Date */}
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* Recurring Toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          onClick={() => setRecurring(!recurring)}
          className={cn(
            'w-12 h-6 rounded-full transition-colors relative',
            recurring ? 'bg-neon-cyan' : 'bg-dark-700'
          )}
        >
          <div
            className={cn(
              'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
              recurring ? 'translate-x-6' : 'translate-x-0.5'
            )}
          />
        </button>
        <span className="text-sm text-dark-200">Recurring transaction</span>
      </label>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

// Add Budget Form
function AddBudgetForm({
  onAdd,
  onClose,
}: {
  onAdd: (data: { name: string; amount: number; category: string; period?: 'weekly' | 'monthly' | 'yearly' }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['food', 'shopping', 'transport', 'utilities', 'entertainment', 'health', 'travel', 'housing', 'phone', 'other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name || categoryConfig[category].label,
        amount: parseFloat(amount),
        category,
        period,
      });
    } catch (error) {
      console.error('Failed to create budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <Input
        label="Budget Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Monthly Groceries"
      />

      {/* Amount */}
      <Input
        label="Budget Amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark-200">Category</label>
        <div className="grid grid-cols-5 gap-2">
          {categories.map((cat) => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'p-3 rounded-lg border transition-colors flex flex-col items-center gap-1',
                  category === cat
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-dark-700 hover:border-dark-500'
                )}
              >
                <Icon className="w-5 h-5" style={{ color: config.color }} />
                <span className="text-xs text-dark-300">{config.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Period */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark-200">Budget Period</label>
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 py-2 rounded-lg border transition-colors text-sm',
                period === p
                  ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                  : 'border-dark-700 text-dark-400 hover:border-dark-500'
              )}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
}

// Budget Details/Edit Form
function BudgetDetailsForm({
  budget,
  onSave,
  onDelete,
  onClose,
}: {
  budget: Budget;
  onSave: (data: Partial<Budget>) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(budget.name || '');
  const [amount, setAmount] = useState(budget.amount.toString());
  const [category, setCategory] = useState(budget.category);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = ['food', 'shopping', 'transport', 'utilities', 'entertainment', 'health', 'travel', 'housing', 'phone', 'other'];
  const config = categoryConfig[budget.category] || categoryConfig.other;
  const percentage = Math.round((budget.spent / budget.amount) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name || categoryConfig[category].label,
        amount: parseFloat(amount),
        category,
      });
    } catch (error) {
      console.error('Failed to update budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Status */}
      <div className="p-4 rounded-lg bg-dark-800/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-dark-400">Current Spending</span>
          <span className="text-sm font-medium text-white">
            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
          </span>
        </div>
        <Progress
          value={Math.min(percentage, 100)}
          variant={percentage > 100 ? 'purple' : percentage >= 80 ? 'orange' : 'cyan'}
          size="sm"
        />
        <p className="text-xs text-dark-400 text-right">{percentage}% used</p>
      </div>

      {/* Name */}
      <Input
        label="Budget Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Monthly Groceries"
      />

      {/* Amount */}
      <Input
        label="Budget Amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark-200">Category</label>
        <div className="grid grid-cols-5 gap-2">
          {categories.map((cat) => {
            const catConfig = categoryConfig[cat];
            const Icon = catConfig.icon;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'p-3 rounded-lg border transition-colors flex flex-col items-center gap-1',
                  category === cat
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-dark-700 hover:border-dark-500'
                )}
              >
                <Icon className="w-5 h-5" style={{ color: catConfig.color }} />
                <span className="text-xs text-dark-300">{catConfig.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="text-status-error"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="glow" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}

// Add Subscription Form
function AddSubscriptionForm({
  onAdd,
  onClose,
}: {
  onAdd: (data: {
    name: string;
    amount: number;
    billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextBillingDate?: Date;
    category?: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('entertainment');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['entertainment', 'utilities', 'phone', 'health', 'shopping', 'other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        name,
        amount: parseFloat(amount),
        billingCycle,
        nextBillingDate: new Date(nextBillingDate),
        category,
      });
    } catch (error) {
      console.error('Failed to create subscription:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <Input
        label="Subscription Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Netflix, Spotify, Gym"
        required
      />

      {/* Amount */}
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />

      {/* Billing Cycle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark-200">Billing Cycle</label>
        <div className="grid grid-cols-4 gap-2">
          {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                'py-2 rounded-lg border transition-colors text-xs',
                billingCycle === cycle
                  ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                  : 'border-dark-700 text-dark-400 hover:border-dark-500'
              )}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Next Billing Date */}
      <Input
        label="Next Billing Date"
        type="date"
        value={nextBillingDate}
        onChange={(e) => setNextBillingDate(e.target.value)}
      />

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark-200">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => {
            const config = categoryConfig[cat] || categoryConfig.other;
            const Icon = config.icon;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'p-2 rounded-lg border transition-colors flex items-center gap-2',
                  category === cat
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-dark-700 hover:border-dark-500'
                )}
              >
                <Icon className="w-4 h-4" style={{ color: config.color }} />
                <span className="text-xs text-dark-300">{config.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Subscription'}
        </Button>
      </div>
    </form>
  );
}

// Subscription Details/Edit Form
function SubscriptionDetailsForm({
  subscription,
  onSave,
  onDelete,
  onClose,
}: {
  subscription: any;
  onSave: (data: any) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(subscription.name || '');
  const [amount, setAmount] = useState(subscription.amount?.toString() || '');
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>(
    subscription.billingCycle || 'monthly'
  );
  const [nextBillingDate, setNextBillingDate] = useState(() => {
    const date = subscription.nextBillingDate instanceof Date 
      ? subscription.nextBillingDate 
      : new Date(subscription.nextBillingDate);
    return date.toISOString().split('T')[0];
  });
  const [category, setCategory] = useState(subscription.category || 'entertainment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = ['entertainment', 'utilities', 'phone', 'health', 'shopping', 'other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        amount: parseFloat(amount),
        billingCycle,
        nextBillingDate: new Date(nextBillingDate),
        category,
      });
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Status */}
      <div className="p-4 rounded-lg bg-dark-800/50 flex items-center justify-between">
        <div>
          <p className="text-sm text-dark-400">Current Amount</p>
          <p className="text-lg font-semibold text-white">{formatCurrency(subscription.amount)}/{subscription.billingCycle}</p>
        </div>
        <Badge variant={subscription.isActive !== false ? 'green' : 'orange'}>
          {subscription.isActive !== false ? 'Active' : 'Paused'}
        </Badge>
      </div>

      {/* Name */}
      <Input
        label="Subscription Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Netflix, Spotify"
        required
      />

      {/* Amount */}
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />

      {/* Billing Cycle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark-200">Billing Cycle</label>
        <div className="grid grid-cols-4 gap-2">
          {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                'py-2 rounded-lg border transition-colors text-xs',
                billingCycle === cycle
                  ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                  : 'border-dark-700 text-dark-400 hover:border-dark-500'
              )}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Next Billing Date */}
      <Input
        label="Next Billing Date"
        type="date"
        value={nextBillingDate}
        onChange={(e) => setNextBillingDate(e.target.value)}
      />

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark-200">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => {
            const config = categoryConfig[cat] || categoryConfig.other;
            const Icon = config.icon;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'p-2 rounded-lg border transition-colors flex items-center gap-2',
                  category === cat
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-dark-700 hover:border-dark-500'
                )}
              >
                <Icon className="w-4 h-4" style={{ color: config.color }} />
                <span className="text-xs text-dark-300">{config.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="text-status-error"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="glow" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}