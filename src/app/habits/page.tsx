'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Flame,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  TrendingUp,
  Trophy,
  Star,
  Zap,
  Clock,
  MoreHorizontal,
  Edit3,
  Trash2,
  Pause,
  Play,
  BarChart3,
  Sparkles,
  Brain,
  ChevronRight,
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
  Lightbulb,
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
import type { Habit, HabitCompletion } from '@/types';

// Habit icons
const habitIcons = {
  exercise: Dumbbell,
  meditation: Leaf,
  reading: BookOpen,
  water: Droplets,
  sleep: Moon,
  morning: Sun,
  coding: Code,
  music: Music,
  health: Heart,
  default: Target,
};

// Mock habits
const mockHabits: Habit[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Morning Meditation',
    description: '15 minutes of mindfulness meditation',
    icon: 'meditation',
    color: '#a855f7',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '07:00',
    currentStreak: 7,
    bestStreak: 14,
    completions: [],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Read 30 Minutes',
    description: 'Read at least 30 minutes of non-fiction',
    icon: 'reading',
    color: '#f97316',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    currentStreak: 3,
    bestStreak: 21,
    completions: [],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: '3',
    userId: 'user1',
    name: 'Exercise',
    description: '30 min workout or 10k steps',
    icon: 'exercise',
    color: '#10b981',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5], // Weekdays
    reminderTime: '17:00',
    currentStreak: 5,
    bestStreak: 30,
    completions: [],
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: '4',
    userId: 'user1',
    name: 'Drink 8 Glasses of Water',
    description: 'Stay hydrated throughout the day',
    icon: 'water',
    color: '#00f0ff',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    currentStreak: 12,
    bestStreak: 45,
    completions: [],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: '5',
    userId: 'user1',
    name: 'Code Side Project',
    description: 'Work on personal projects for at least 1 hour',
    icon: 'coding',
    color: '#ec4899',
    frequency: 'weekly',
    targetDays: [0, 6], // Weekends
    currentStreak: 2,
    bestStreak: 8,
    completions: [],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generate completion data for the last 7 days
const generateCompletionData = (habits: Habit[]) => {
  const data: Record<string, Record<string, boolean>> = {};
  const today = new Date();

  habits.forEach(habit => {
    data[habit.id] = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      // Random completion status for demo (more likely to be completed recently)
      data[habit.id][dateKey] = Math.random() > 0.3 - (i * 0.05);
    }
  });

  return data;
};

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [completionData, setCompletionData] = useState(() => generateCompletionData(mockHabits));
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { openAIPanel } = useUIStore();

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  // Get habits due today
  const todayHabits = habits.filter(habit => habit.targetDays?.includes(dayOfWeek));

  // Calculate stats
  const stats = useMemo(() => {
    const totalCompletedToday = todayHabits.filter(
      h => completionData[h.id]?.[todayKey]
    ).length;
    const totalDueToday = todayHabits.length;
    const completionRate = totalDueToday > 0 ? (totalCompletedToday / totalDueToday) * 100 : 0;
    const longestStreak = Math.max(...habits.map(h => h.bestStreak));
    const currentStreaks = habits.reduce((sum, h) => sum + h.currentStreak, 0);

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
  const toggleHabitCompletion = (habitId: string) => {
    setCompletionData(prev => ({
      ...prev,
      [habitId]: {
        ...prev[habitId],
        [todayKey]: !prev[habitId]?.[todayKey],
      },
    }));

    // Update streak
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== habitId) return h;
        const wasCompleted = completionData[habitId]?.[todayKey];
        return {
          ...h,
          currentStreak: wasCompleted ? h.currentStreak - 1 : h.currentStreak + 1,
          bestStreak: wasCompleted ? h.bestStreak : Math.max(h.bestStreak, h.currentStreak + 1),
        };
      })
    );
  };

  const getIcon = (iconName: string) => {
    return habitIcons[iconName as keyof typeof habitIcons] || habitIcons.default;
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

  const HabitCard = ({ habit }: { habit: Habit }) => {
    const Icon = getIcon(habit.icon || 'default');
    const isCompletedToday = completionData[habit.id]?.[todayKey];
    const isDueToday = habit.targetDays?.includes(dayOfWeek);

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
              onClick={() => toggleHabitCompletion(habit.id)}
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
                backgroundColor: isCompletedToday ? habit.color : undefined,
                borderColor: isCompletedToday ? habit.color : undefined,
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
                {habit.currentStreak >= 7 && (
                  <Badge variant="orange" size="sm">
                    <Flame className="w-3 h-3 mr-0.5" />
                    {habit.currentStreak}
                  </Badge>
                )}
              </div>
              {habit.description && (
                <p className="text-xs text-dark-400 line-clamp-1">{habit.description}</p>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => setSelectedHabit(habit)}
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
                      backgroundColor: isCompleted ? habit.color : undefined,
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
                {habit.currentStreak} day streak
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-neon-purple" />
              <span className="text-xs text-dark-400">
                Best: {habit.bestStreak}
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
            ) : (
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
            )}

            {/* Other Habits */}
            {habits.filter(h => !h.targetDays?.includes(dayOfWeek)).length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-sm font-medium text-dark-400">Other Habits</h3>
                {habits
                  .filter(h => !h.targetDays?.includes(dayOfWeek))
                  .map(habit => (
                    <HabitCard key={habit.id} habit={habit} />
                  ))}
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Weekly Overview */}
            <Card variant="glass">
              <CardHeader
                title="Weekly Overview"
                icon={<BarChart3 className="w-5 h-5 text-neon-cyan" />}
              />
              <CardContent>
                <div className="space-y-3">
                  {last7Days.map((date, i) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const completedCount = habits.filter(
                      h => completionData[h.id]?.[dateKey]
                    ).length;
                    const dueCount = habits.filter(
                      h => h.targetDays?.includes(date.getDay())
                    ).length;
                    const percentage = dueCount > 0 ? (completedCount / dueCount) * 100 : 0;
                    const isToday = i === 6;

                    return (
                      <div key={dateKey} className="flex items-center gap-3">
                        <span className={cn(
                          'w-8 text-xs',
                          isToday ? 'text-neon-cyan font-medium' : 'text-dark-400'
                        )}>
                          {DAYS[date.getDay()]}
                        </span>
                        <div className="flex-1">
                          <Progress
                            value={percentage}
                            size="sm"
                            variant={percentage === 100 ? 'green' : 'cyan'}
                          />
                        </div>
                        <span className="text-xs text-dark-400 w-8 text-right">
                          {completedCount}/{dueCount}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
                    <span className="text-xs font-medium text-neon-green">Great Progress!</span>
                  </div>
                  <p className="text-sm text-dark-300">
                    Your meditation streak is growing. Keep it up for 3 more days to hit your personal best!
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-dark-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-neon-orange" />
                    <span className="text-xs font-medium text-dark-200">Suggestion</span>
                  </div>
                  <p className="text-sm text-dark-400">
                    You're most consistent with morning habits. Consider scheduling exercise earlier.
                  </p>
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={openAIPanel}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get More Insights
                </Button>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card variant="glass">
              <CardHeader
                title="Achievements"
                icon={<Trophy className="w-5 h-5 text-neon-orange" />}
              />
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'First Week', desc: '7 day streak', unlocked: true, icon: Star },
                    { name: 'Consistency', desc: '30 day streak', unlocked: true, icon: Flame },
                    { name: 'Habit Master', desc: '100 day streak', unlocked: false, icon: Trophy },
                  ].map((achievement, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg',
                        achievement.unlocked
                          ? 'bg-neon-orange/10 border border-neon-orange/20'
                          : 'bg-dark-800/30 opacity-50'
                      )}
                    >
                      <achievement.icon
                        className={cn(
                          'w-5 h-5',
                          achievement.unlocked ? 'text-neon-orange' : 'text-dark-500'
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{achievement.name}</p>
                        <p className="text-xs text-dark-400">{achievement.desc}</p>
                      </div>
                      {achievement.unlocked && (
                        <CheckCircle2 className="w-4 h-4 text-neon-green ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Create Habit Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Habit"
          size="lg"
        >
          <HabitEditor onClose={() => setIsCreateModalOpen(false)} />
        </Modal>

        {/* Habit Details Modal */}
        <Modal
          isOpen={!!selectedHabit}
          onClose={() => setSelectedHabit(null)}
          title={selectedHabit?.name || 'Habit Details'}
          size="md"
        >
          {selectedHabit && (
            <HabitDetails
              habit={selectedHabit}
              completionData={completionData[selectedHabit.id] || {}}
              onClose={() => setSelectedHabit(null)}
            />
          )}
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Habit Editor Component
function HabitEditor({ habit, onClose }: { habit?: Habit; onClose: () => void }) {
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [selectedIcon, setSelectedIcon] = useState(habit?.icon || 'default');
  const [color, setColor] = useState(habit?.color || '#00f0ff');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(habit?.frequency || 'daily');
  const [targetDays, setTargetDays] = useState<number[]>(habit?.targetDays || [0, 1, 2, 3, 4, 5, 6]);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime || '');

  const iconOptions = Object.entries(habitIcons);
  const colorOptions = ['#00f0ff', '#a855f7', '#f97316', '#10b981', '#ec4899', '#fbbf24'];

  const toggleDay = (day: number) => {
    if (targetDays.includes(day)) {
      setTargetDays(targetDays.filter(d => d !== day));
    } else {
      setTargetDays([...targetDays, day].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ name, description, selectedIcon, color, frequency, targetDays, reminderTime });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Habit Name"
        placeholder="e.g., Morning Meditation"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          Description (optional)
        </label>
        <textarea
          placeholder="Add details about your habit..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        />
      </div>

      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {iconOptions.map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedIcon(key)}
              className={cn(
                'p-3 rounded-xl transition-all',
                selectedIcon === key
                  ? 'bg-neon-cyan/20 border-2 border-neon-cyan'
                  : 'bg-dark-800/50 hover:bg-dark-700/50'
              )}
            >
              <Icon className={cn(
                'w-5 h-5',
                selectedIcon === key ? 'text-neon-cyan' : 'text-dark-400'
              )} />
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Color</label>
        <div className="flex gap-2">
          {colorOptions.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-10 h-10 rounded-xl transition-all',
                color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-900' : ''
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Frequency</label>
        <div className="flex gap-2">
          {(['daily', 'weekly'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm capitalize transition-all',
                frequency === f
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'bg-dark-800/50 text-dark-300 hover:text-white'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Target Days */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Target Days</label>
        <div className="flex gap-2">
          {DAYS.map((day, i) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(i)}
              className={cn(
                'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                targetDays.includes(i)
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'bg-dark-800/50 text-dark-400 hover:text-white'
              )}
            >
              {day.charAt(0)}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder */}
      <Input
        type="time"
        label="Reminder Time (optional)"
        value={reminderTime}
        onChange={e => setReminderTime(e.target.value)}
      />

      {/* AI Suggestion */}
      <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-neon-purple" />
          <span className="text-sm font-medium text-neon-purple">AI Tip</span>
        </div>
        <p className="text-sm text-dark-300">
          Start small! Habits are easier to build when they take less than 2 minutes to start. You can always increase the duration later.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="glow">
          {habit ? 'Save Changes' : 'Create Habit'}
        </Button>
      </div>
    </form>
  );
}

// Habit Details Component
function HabitDetails({
  habit,
  completionData,
  onClose,
}: {
  habit: Habit;
  completionData: Record<string, boolean>;
  onClose: () => void;
}) {
  const Icon = habitIcons[habit.icon as keyof typeof habitIcons] || habitIcons.default;

  // Calculate completion rate
  const completedDays = Object.values(completionData).filter(Boolean).length;
  const totalDays = Object.keys(completionData).length;
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: `${habit.color}20` }}
        >
          <Icon className="w-8 h-8" style={{ color: habit.color }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{habit.name}</h3>
          {habit.description && (
            <p className="text-sm text-dark-400">{habit.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-dark-800/30 text-center">
          <Flame className="w-5 h-5 text-neon-orange mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{habit.currentStreak}</p>
          <p className="text-xs text-dark-400">Current Streak</p>
        </div>
        <div className="p-3 rounded-lg bg-dark-800/30 text-center">
          <Trophy className="w-5 h-5 text-neon-purple mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{habit.bestStreak}</p>
          <p className="text-xs text-dark-400">Best Streak</p>
        </div>
        <div className="p-3 rounded-lg bg-dark-800/30 text-center">
          <TrendingUp className="w-5 h-5 text-neon-green mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{completionRate}%</p>
          <p className="text-xs text-dark-400">Completion</p>
        </div>
      </div>

      {/* Schedule */}
      <div className="p-4 rounded-xl bg-dark-800/30">
        <p className="text-sm text-dark-400 mb-2">Schedule</p>
        <div className="flex gap-2">
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                'flex-1 py-2 rounded-lg text-center text-sm',
                habit.targetDays?.includes(i)
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'bg-dark-700/30 text-dark-500'
              )}
            >
              {day.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      {/* Reminder */}
      {habit.reminderTime && (
        <div className="flex items-center gap-2 text-dark-300">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Reminder at {habit.reminderTime}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-dark-700/50">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Pause className="w-4 h-4 mr-1" />
            Pause
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-status-error hover:text-status-error"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" size="sm">
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
