'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Flame,
  Target,
  CheckCircle2,
  TrendingUp,
  Trophy,
  Star,
  Zap,
  MoreHorizontal,
  Trash2,
  Brain,
  Sun,
  Moon,
  Coffee,
  Dumbbell,
  BookOpen,
  Heart,
  Droplets,
  Leaf,
  Music,
  Code,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingSpinner } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { useHabits, useHabitCompletions } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';
import type { Habit, HabitCategory } from '@/types';

// Habit icons
const habitIcons: Record<string, any> = {
  exercise: Dumbbell,
  meditation: Leaf,
  reading: BookOpen,
  water: Droplets,
  sleep: Moon,
  morning: Sun,
  coding: Code,
  music: Music,
  health: Heart,
  coffee: Coffee,
  brain: Brain,
  star: Star,
  lightning: Zap,
  target: Target,
  default: Target,
};

const iconOptions = [
  { name: 'Target', value: 'target', icon: Target },
  { name: 'Exercise', value: 'exercise', icon: Dumbbell },
  { name: 'Meditation', value: 'meditation', icon: Leaf },
  { name: 'Reading', value: 'reading', icon: BookOpen },
  { name: 'Water', value: 'water', icon: Droplets },
  { name: 'Sleep', value: 'sleep', icon: Moon },
  { name: 'Morning', value: 'morning', icon: Sun },
  { name: 'Coding', value: 'coding', icon: Code },
  { name: 'Music', value: 'music', icon: Music },
  { name: 'Health', value: 'health', icon: Heart },
];

const colorOptions = [
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#f97316', // orange
  '#10b981', // green
  '#ec4899', // pink
  '#eab308', // yellow
  '#ef4444', // red
  '#3b82f6', // blue
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { habits, loading, createHabit, updateHabit, deleteHabit, toggleCompletion } = useHabits();
  const completionData = useHabitCompletions(habits as any, 7);
  
  const [selectedHabit, setSelectedHabit] = useState<(Habit & { icon?: string; color?: string }) | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActualEditMode, setIsActualEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    icon: 'target',
    color: '#06b6d4',
    targetDays: [0, 1, 2, 3, 4, 5, 6] as number[],
  });
  const { openAIPanel } = useUIStore();

  // Form state for new habit
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    icon: 'target',
    color: '#06b6d4',
    category: 'other' as HabitCategory,
    frequency: 'daily' as const,
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '',
  });

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  // Cast habits to include icon and color
  const habitsWithExtras = habits as (Habit & { icon?: string; color?: string })[];

  // Get habits due today
  const todayHabits = habitsWithExtras.filter(habit => habit.targetDays?.includes(dayOfWeek));
  const otherHabits = habitsWithExtras.filter(habit => !habit.targetDays?.includes(dayOfWeek));

  // Calculate stats
  const stats = useMemo(() => {
    const totalCompletedToday = todayHabits.filter(
      h => completionData[h.id]?.[todayKey]
    ).length;
    const totalDueToday = todayHabits.length;
    const completionRate = totalDueToday > 0 ? (totalCompletedToday / totalDueToday) * 100 : 0;
    const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.longestStreak || 0)) : 0;
    const currentStreaks = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

    return {
      completedToday: totalCompletedToday,
      dueToday: totalDueToday,
      completionRate: Math.round(completionRate),
      longestStreak,
      currentStreaks,
      totalHabits: habits.length,
    };
  }, [habits, completionData, todayHabits, todayKey]);

  // Toggle habit completion for today
  const handleToggleCompletion = async (habitId: string) => {
    const isCurrentlyCompleted = completionData[habitId]?.[todayKey];
    try {
      await toggleCompletion(habitId, today, !isCurrentlyCompleted);
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  // Create new habit
  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) return;
    
    setIsSaving(true);
    try {
      await createHabit({
        name: newHabit.name,
        description: newHabit.description,
        category: newHabit.category,
        frequency: newHabit.frequency,
        targetDays: newHabit.targetDays,
        routine: newHabit.name,
        icon: newHabit.icon,
        color: newHabit.color,
      } as any);
      
      setIsCreateModalOpen(false);
      setNewHabit({
        name: '',
        description: '',
        icon: 'target',
        color: '#06b6d4',
        category: 'other',
        frequency: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        reminderTime: '',
      });
    } catch (err) {
      console.error('Failed to create habit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete habit
  const handleDeleteHabit = async () => {
    if (!selectedHabit) return;
    
    setIsSaving(true);
    try {
      await deleteHabit(selectedHabit.id);
      setIsDeleteModalOpen(false);
      setSelectedHabit(null);
    } catch (err) {
      console.error('Failed to delete habit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Open edit form with habit data
  const openEditForm = (habit: Habit & { icon?: string; color?: string }) => {
    setSelectedHabit(habit);
    setEditForm({
      name: habit.name,
      description: habit.description || '',
      icon: habit.icon || 'target',
      color: habit.color || '#06b6d4',
      targetDays: habit.targetDays || [0, 1, 2, 3, 4, 5, 6],
    });
    setIsActualEditMode(true);
    setIsEditModalOpen(true);
  };

  // Save edited habit
  const handleSaveEdit = async () => {
    if (!selectedHabit || !editForm.name.trim()) return;
    
    setIsSaving(true);
    try {
      await updateHabit(selectedHabit.id, {
        name: editForm.name,
        description: editForm.description,
        targetDays: editForm.targetDays,
        icon: editForm.icon,
        color: editForm.color,
      } as any);
      setIsEditModalOpen(false);
      setIsActualEditMode(false);
      setSelectedHabit(null);
    } catch (err) {
      console.error('Failed to update habit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getIcon = (iconName: string) => {
    return habitIcons[iconName] || habitIcons.default;
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const last7Days = getLast7Days();

  // Show loading state
  if (authLoading || loading) {
    return (
      <MainLayout>
        <PageContainer title="Habits" subtitle="Build consistency, transform your life">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-dark-400">Loading habits...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Habits" subtitle="Build consistency, transform your life">
          <EmptyState
            icon={<Target className="w-12 h-12" />}
            title="Sign in to track habits"
            description="Create an account to start building better habits"
            action={
              <Button variant="glow" onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
            }
          />
        </PageContainer>
      </MainLayout>
    );
  }

  const HabitCard = ({ habit }: { habit: Habit & { icon?: string; color?: string } }) => {
    const Icon = getIcon(habit.icon || 'default');
    const isCompletedToday = completionData[habit.id]?.[todayKey];
    const isDueToday = habit.targetDays?.includes(dayOfWeek);
    const habitColor = habit.color || '#06b6d4';

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'group relative rounded-xl transition-all duration-200',
          'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
          'hover:border-neon-cyan/30',
          isCompletedToday && 'bg-neon-green/5 border-neon-green/30'
        )}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            {/* Checkbox */}
            <button
              onClick={() => handleToggleCompletion(habit.id)}
              disabled={!isDueToday}
              className={cn(
                'mt-0.5 w-8 h-8 rounded-xl flex-shrink-0',
                'flex items-center justify-center transition-all',
                isDueToday
                  ? isCompletedToday
                    ? 'bg-neon-green text-dark-900'
                    : 'border-2 border-dark-500 hover:border-neon-cyan'
                  : 'bg-dark-800/50 cursor-not-allowed'
              )}
              style={{
                backgroundColor: isCompletedToday ? habitColor : undefined,
                borderColor: isCompletedToday ? habitColor : undefined,
              }}
            >
              {isCompletedToday ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Icon className="w-4 h-4 text-dark-400" />
              )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  'font-medium truncate',
                  isCompletedToday ? 'text-neon-green' : 'text-white'
                )}>
                  {habit.name}
                </h3>
                {(habit.streak || 0) >= 7 && (
                  <Badge variant="orange" size="sm">
                    <Flame className="w-3 h-3 mr-0.5" />
                    {habit.streak}
                  </Badge>
                )}
              </div>
              {habit.description && (
                <p className="text-xs text-dark-400 line-clamp-1">{habit.description}</p>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => {
                setSelectedHabit(habit);
                setIsEditModalOpen(true);
              }}
              className="p-1.5 rounded-lg hover:bg-dark-700/50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreHorizontal className="w-4 h-4 text-dark-400" />
            </button>
          </div>

          {/* Weekly progress */}
          <div className="flex items-center gap-1.5">
            {last7Days.map((date, i) => {
              const dateKey = date.toISOString().split('T')[0];
              const isCompleted = completionData[habit.id]?.[dateKey];
              const isTargetDay = habit.targetDays?.includes(date.getDay());
              const isToday = i === 6;

              return (
                <div
                  key={dateKey}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <div
                    className={cn(
                      'w-full h-8 rounded-lg flex items-center justify-center transition-all',
                      isCompleted
                        ? 'bg-opacity-100'
                        : isTargetDay
                        ? 'bg-dark-800/50 border border-dashed border-dark-600'
                        : 'bg-dark-800/30',
                      isToday && !isCompleted && isTargetDay && 'border-neon-cyan/50'
                    )}
                    style={{
                      backgroundColor: isCompleted ? habitColor : undefined,
                    }}
                  >
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className={cn(
                    'text-[10px]',
                    isToday ? 'text-neon-cyan font-medium' : 'text-dark-500'
                  )}>
                    {DAYS[date.getDay()].charAt(0)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-700/30">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-neon-orange" />
              <span className="text-xs text-dark-300">
                {habit.streak || 0} day streak
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-neon-purple" />
              <span className="text-xs text-dark-400">
                Best: {habit.longestStreak || 0}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <PageContainer title="Habits" subtitle="Build consistency, transform your life">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {/* Today's Progress */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Today's Progress</span>
              <CircularProgress
                value={stats.completionRate}
                size={48}
                strokeWidth={4}
              />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.completedToday}/{stats.dueToday}
            </p>
            <p className="text-xs text-dark-500">habits completed</p>
          </Card>

          {/* Current Streaks */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Active Streaks</span>
              <Flame className="w-6 h-6 text-neon-orange" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.currentStreaks}</p>
            <p className="text-xs text-dark-500">total streak days</p>
          </Card>

          {/* Best Streak */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Longest Streak</span>
              <Trophy className="w-6 h-6 text-neon-purple" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.longestStreak}</p>
            <p className="text-xs text-dark-500">days in a row</p>
          </Card>

          {/* Total Habits */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Total Habits</span>
              <Target className="w-6 h-6 text-neon-cyan" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalHabits}</p>
            <p className="text-xs text-dark-500">habits tracked</p>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habits List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Today's Habits</h2>
              <Button
                variant="glow"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New Habit
              </Button>
            </div>

            {/* Due Today */}
            {todayHabits.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {todayHabits.map(habit => (
                    <HabitCard key={habit.id} habit={habit} />
                  ))}
                </AnimatePresence>
              </div>
            ) : habits.length > 0 ? (
              <EmptyState
                icon={<Target className="w-12 h-12" />}
                title="No habits for today"
                description="Take a rest day or add new habits"
                action={
                  <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Habit
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<Target className="w-12 h-12" />}
                title="No habits yet"
                description="Start building better habits today"
                action={
                  <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Your First Habit
                  </Button>
                }
              />
            )}

            {/* Other Habits */}
            {otherHabits.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-sm font-medium text-dark-400">Other Habits</h3>
                {otherHabits.map(habit => (
                  <HabitCard key={habit.id} habit={habit} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* AI Insights */}
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-neon-purple" />
                <h3 className="font-medium text-white">AI Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
                  <p className="text-sm text-dark-300">
                    {stats.completionRate >= 80
                      ? "🎉 Amazing consistency! You're crushing your habits today."
                      : stats.completionRate >= 50
                      ? "💪 Good progress! A few more habits to complete today."
                      : stats.dueToday === 0
                      ? "🌟 No habits scheduled today. Enjoy your rest!"
                      : "🌟 New day, fresh start! Begin with your easiest habit."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={openAIPanel}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get More Insights
                </Button>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card variant="glass" className="p-4">
              <h3 className="font-medium text-white mb-4">Weekly Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Completion Rate</span>
                  <span className="text-sm font-medium text-neon-cyan">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} variant="cyan" size="sm" />
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-dark-400">Total Streaks</span>
                  <span className="text-sm text-white">{stats.currentStreaks} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Best Streak</span>
                  <span className="text-sm text-white">{stats.longestStreak} days</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Create Habit Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Habit"
        >
          <div className="space-y-4">
            <Input
              label="Habit Name"
              placeholder="e.g., Morning Meditation"
              value={newHabit.name}
              onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
            />
            
            <Input
              label="Description (optional)"
              placeholder="e.g., 15 minutes of mindfulness"
              value={newHabit.description}
              onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
            />

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map(({ name, value, icon: IconComponent }) => (
                  <button
                    key={value}
                    onClick={() => setNewHabit(prev => ({ ...prev, icon: value }))}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      newHabit.icon === value
                        ? 'bg-neon-cyan/20 border border-neon-cyan'
                        : 'bg-dark-800 border border-dark-700 hover:border-dark-500'
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewHabit(prev => ({ ...prev, color }))}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all',
                      newHabit.color === color && 'ring-2 ring-white ring-offset-2 ring-offset-dark-900'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Target Days */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Target Days</label>
              <div className="flex gap-2">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => {
                      setNewHabit(prev => ({
                        ...prev,
                        targetDays: prev.targetDays.includes(i)
                          ? prev.targetDays.filter(d => d !== i)
                          : [...prev.targetDays, i].sort()
                      }));
                    }}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                      newHabit.targetDays.includes(i)
                        ? 'bg-neon-cyan text-dark-900'
                        : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                    )}
                  >
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="glow"
                className="flex-1"
                onClick={handleCreateHabit}
                disabled={!newHabit.name.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Habit'
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit/Delete Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setIsActualEditMode(false);
            setSelectedHabit(null);
          }}
          title={isActualEditMode ? "Edit Habit" : "Habit Options"}
        >
          {selectedHabit && !isActualEditMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/50">
                {(() => {
                  const Icon = getIcon(selectedHabit.icon || 'default');
                  return <Icon className="w-6 h-6" style={{ color: selectedHabit.color }} />;
                })()}
                <div>
                  <h4 className="font-medium text-white">{selectedHabit.name}</h4>
                  <p className="text-xs text-dark-400">{selectedHabit.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-dark-800/50 text-center">
                  <Flame className="w-5 h-5 text-neon-orange mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{selectedHabit.streak || 0}</p>
                  <p className="text-xs text-dark-400">Current Streak</p>
                </div>
                <div className="p-3 rounded-lg bg-dark-800/50 text-center">
                  <Trophy className="w-5 h-5 text-neon-purple mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{selectedHabit.longestStreak || 0}</p>
                  <p className="text-xs text-dark-400">Best Streak</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEditForm(selectedHabit)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
          
          {selectedHabit && isActualEditMode && (
            <div className="space-y-4">
              <Input
                label="Habit Name"
                placeholder="e.g., Morning Exercise"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />

              <Input
                label="Description"
                placeholder="Optional description..."
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setEditForm(prev => ({ ...prev, icon: option.value }))}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        editForm.icon === option.value
                          ? 'bg-neon-cyan/20 ring-2 ring-neon-cyan'
                          : 'bg-dark-800 hover:bg-dark-700'
                      )}
                    >
                      <option.icon className="w-5 h-5" style={{ color: editForm.color }} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setEditForm(prev => ({ ...prev, color }))}
                      className={cn(
                        'w-8 h-8 rounded-lg transition-all',
                        editForm.color === color && 'ring-2 ring-white ring-offset-2 ring-offset-dark-900'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Target Days</label>
                <div className="flex gap-2">
                  {DAYS.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => {
                        setEditForm(prev => ({
                          ...prev,
                          targetDays: prev.targetDays.includes(index)
                            ? prev.targetDays.filter(d => d !== index)
                            : [...prev.targetDays, index]
                        }));
                      }}
                      className={cn(
                        'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                        editForm.targetDays.includes(index)
                          ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                          : 'bg-dark-800 text-dark-400 border border-dark-700'
                      )}
                    >
                      {day.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsActualEditMode(false);
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="glow"
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={!editForm.name.trim() || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedHabit(null);
          }}
          title="Delete Habit"
        >
          <div className="space-y-4">
            <p className="text-dark-300">
              Are you sure you want to delete "{selectedHabit?.name}"? This will also delete all completion history.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedHabit(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                onClick={handleDeleteHabit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}
