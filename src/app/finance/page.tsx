'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

// Types
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  recurring?: boolean;
}

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  color: string;
  icon: any;
}

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: Date;
  color: string;
}

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

// Mock data
const mockTransactions: Transaction[] = [
  { id: '1', type: 'expense', amount: 45.50, category: 'food', description: 'Grocery shopping', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: '2', type: 'expense', amount: 120.00, category: 'utilities', description: 'Electric bill', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), recurring: true },
  { id: '3', type: 'income', amount: 3500.00, category: 'salary', description: 'Monthly salary', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), recurring: true },
  { id: '4', type: 'expense', amount: 15.99, category: 'entertainment', description: 'Netflix subscription', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), recurring: true },
  { id: '5', type: 'expense', amount: 65.00, category: 'transport', description: 'Gas', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: '6', type: 'expense', amount: 89.99, category: 'shopping', description: 'New headphones', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
  { id: '7', type: 'income', amount: 500.00, category: 'freelance', description: 'Side project', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { id: '8', type: 'expense', amount: 32.50, category: 'food', description: 'Restaurant dinner', date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
];

const mockBudgets: Budget[] = [
  { id: '1', category: 'food', limit: 500, spent: 340, color: '#f97316', icon: Utensils },
  { id: '2', category: 'shopping', limit: 300, spent: 280, color: '#ec4899', icon: ShoppingCart },
  { id: '3', category: 'transport', limit: 200, spent: 120, color: '#3b82f6', icon: Car },
  { id: '4', category: 'entertainment', limit: 150, spent: 75, color: '#a855f7', icon: Music },
  { id: '5', category: 'utilities', limit: 250, spent: 220, color: '#fbbf24', icon: Zap },
];

const mockSavingsGoals: SavingsGoal[] = [
  { id: '1', name: 'Emergency Fund', target: 10000, current: 7500, color: '#00f0ff' },
  { id: '2', name: 'Vacation', target: 3000, current: 1200, deadline: new Date('2026-08-01'), color: '#a855f7' },
  { id: '3', name: 'New Laptop', target: 2000, current: 800, color: '#f97316' },
];

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [budgets] = useState<Budget[]>(mockBudgets);
  const [savingsGoals] = useState<SavingsGoal[]>(mockSavingsGoals);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { openAIPanel } = useUIStore();

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyTransactions = transactions.filter(t => t.date >= startOfMonth);
    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

    return { income, expenses, balance, savingsRate };
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filter === 'all' || t.type === filter)
      .filter(t => 
        searchQuery === '' ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryConfig[t.category]?.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, filter, searchQuery]);

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
            <p className="text-2xl font-bold text-neon-green">{formatCurrency(stats.income)}</p>
            <p className="text-xs text-dark-500">this month</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Monthly Expenses</span>
              <ArrowDownLeft className="w-6 h-6 text-neon-orange" />
            </div>
            <p className="text-2xl font-bold text-neon-orange">{formatCurrency(stats.expenses)}</p>
            <p className="text-xs text-dark-500">this month</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Net Balance</span>
              <Wallet className="w-6 h-6 text-neon-cyan" />
            </div>
            <p className={cn(
              'text-2xl font-bold',
              stats.balance >= 0 ? 'text-neon-green' : 'text-status-error'
            )}>
              {formatCurrency(stats.balance)}
            </p>
            <p className="text-xs text-dark-500">this month</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Savings Rate</span>
              <CircularProgress value={stats.savingsRate} size={48} strokeWidth={4} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.savingsRate}%</p>
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
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                }
              />
              <CardContent className="space-y-4">
                {budgets.map(budget => {
                  const percentage = Math.round((budget.spent / budget.limit) * 100);
                  const isOverBudget = percentage > 100;
                  const isNearLimit = percentage >= 80 && percentage <= 100;
                  const Icon = budget.icon;

                  return (
                    <div key={budget.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: budget.color }} />
                          <span className="text-sm text-white">
                            {categoryConfig[budget.category]?.label}
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
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        variant={isOverBudget ? 'purple' : isNearLimit ? 'orange' : 'cyan'}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Savings Goals */}
            <Card variant="glass">
              <CardHeader
                title="Savings Goals"
                icon={<PiggyBank className="w-5 h-5 text-neon-green" />}
              />
              <CardContent className="space-y-4">
                {savingsGoals.map(goal => {
                  const percentage = Math.round((goal.current / goal.target) * 100);

                  return (
                    <div key={goal.id} className="p-3 rounded-lg bg-dark-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{goal.name}</span>
                        <span className="text-xs" style={{ color: goal.color }}>
                          {percentage}%
                        </span>
                      </div>
                      <Progress value={percentage} variant="green" size="sm" />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-dark-400">
                          {formatCurrency(goal.current)} saved
                        </span>
                        <span className="text-xs text-dark-500">
                          {formatCurrency(goal.target)} goal
                        </span>
                      </div>
                    </div>
                  );
                })}

                <Button variant="ghost" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-1" />
                  New Goal
                </Button>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card variant="glass">
              <CardHeader
                title="AI Insights"
                icon={<Brain className="w-5 h-5 text-neon-purple" />}
              />
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-neon-green" />
                    <span className="text-xs font-medium text-neon-green">Good News!</span>
                  </div>
                  <p className="text-sm text-dark-300">
                    You're spending 15% less on food compared to last month. Great budgeting!
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-neon-orange" />
                    <span className="text-xs font-medium text-neon-orange">Watch Out</span>
                  </div>
                  <p className="text-sm text-dark-300">
                    Shopping expenses are 93% of your budget. Consider holding off on purchases.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-dark-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-neon-cyan" />
                    <span className="text-xs font-medium text-dark-200">Suggestion</span>
                  </div>
                  <p className="text-sm text-dark-400">
                    At your current rate, you'll reach your Emergency Fund goal in 3 months!
                  </p>
                </div>

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
            onAdd={transaction => {
              setTransactions(prev => [transaction, ...prev]);
              setIsAddTransactionOpen(false);
            }}
            onClose={() => setIsAddTransactionOpen(false)}
          />
        </Modal>

        {/* Transaction Details Modal */}
        <Modal
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          title="Transaction Details"
          size="sm"
        >
          {selectedTransaction && (
            <TransactionDetails
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
              onDelete={() => {
                setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
                setSelectedTransaction(null);
              }}
            />
          )}
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Add Transaction Form
function AddTransactionForm({
  onAdd,
  onClose,
}: {
  onAdd: (transaction: Transaction) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);

  const categories = type === 'income'
    ? ['salary', 'freelance', 'investment', 'other']
    : ['food', 'shopping', 'transport', 'utilities', 'entertainment', 'health', 'travel', 'housing', 'phone', 'other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date),
      recurring,
    });
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
        <Button type="submit" variant="glow">Add Transaction</Button>
      </div>
    </form>
  );
}

// Transaction Details Component
function TransactionDetails({
  transaction,
  onClose,
  onDelete,
}: {
  transaction: Transaction;
  onClose: () => void;
  onDelete: () => void;
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
          <Button variant="outline" size="sm">
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
