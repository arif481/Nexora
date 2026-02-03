'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Brain,
  Target,
  CheckCircle2,
  Clock,
  CalendarDays,
  ListTodo,
  TrendingUp,
  Sparkles,
  Plus,
  ChevronRight,
  Activity,
  Flame,
  Loader2,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Badge, PriorityBadge } from '@/components/ui/Badge';
import { EmptyState, LoadingSpinner } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { formatTime, getGreeting, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, useTaskStats } from '@/hooks/useTasks';
import { useHabits, useHabitCompletions } from '@/hooks/useHabits';
import { useCalendar, useTodayEvents } from '@/hooks/useCalendar';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { tasks, loading: tasksLoading } = useTasks();
  const taskStats = useTaskStats();
  const { habits, loading: habitsLoading } = useHabits();
  const completionData = useHabitCompletions(habits as any, 1);
  const { events: todayEvents, loading: eventsLoading } = useTodayEvents();
  const { openAIPanel } = useUIStore();

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  // Get today's tasks (due today)
  const todayTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === today.toDateString() && task.status !== 'completed';
    }).slice(0, 5);
  }, [tasks, today]);

  // Get today's habits
  const todayHabits = useMemo(() => {
    return (habits as any[]).filter(habit => habit.targetDays?.includes(dayOfWeek)).slice(0, 5);
  }, [habits, dayOfWeek]);

  // Calculate habit stats
  const habitStats = useMemo(() => {
    const todayHabitsList = (habits as any[]).filter(habit => habit.targetDays?.includes(dayOfWeek));
    const completed = todayHabitsList.filter(h => completionData[h.id]?.[todayKey]).length;
    const total = todayHabitsList.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [habits, completionData, todayKey, dayOfWeek]);

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return todayEvents
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 4);
  }, [todayEvents]);

  const loading = authLoading || tasksLoading || habitsLoading || eventsLoading;

  // Show loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-dark-400">Loading dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={<Brain className="w-16 h-16" />}
            title="Welcome to Nexora"
            description="Sign in to access your personalized AI-powered dashboard"
            action={
              <Button variant="glow" size="lg" onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
            }
          />
        </div>
      </MainLayout>
    );
  }

  const greeting = getGreeting();

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sun className="w-8 h-8 text-neon-orange" />
              {greeting}, {user.displayName?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-dark-400 mt-1">
              Here's your overview for {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button variant="glow" onClick={openAIPanel}>
            <Sparkles className="w-4 h-4 mr-2" />
            Ask AI
          </Button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Tasks */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-dark-400">Tasks Today</span>
              <ListTodo className="w-5 h-5 text-neon-cyan" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{taskStats.dueToday}</p>
                <p className="text-xs text-dark-500">{taskStats.overdue} overdue</p>
              </div>
              <CircularProgress value={taskStats.completionRate} size={40} strokeWidth={3} />
            </div>
          </Card>

          {/* Habits */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-dark-400">Habits</span>
              <Target className="w-5 h-5 text-neon-purple" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{habitStats.completed}/{habitStats.total}</p>
                <p className="text-xs text-dark-500">completed today</p>
              </div>
              <CircularProgress value={habitStats.percentage} size={40} strokeWidth={3} variant="purple" />
            </div>
          </Card>

          {/* Events */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-dark-400">Events</span>
              <CalendarDays className="w-5 h-5 text-neon-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{todayEvents.length}</p>
              <p className="text-xs text-dark-500">{upcomingEvents.length} upcoming</p>
            </div>
          </Card>

          {/* Focus Score */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-dark-400">Focus Score</span>
              <Activity className="w-5 h-5 text-neon-green" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {Math.round((taskStats.completionRate + habitStats.percentage) / 2)}%
                </p>
                <p className="text-xs text-dark-500">productivity</p>
              </div>
              <TrendingUp className="w-6 h-6 text-neon-green" />
            </div>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card variant="glass">
              <CardHeader
                title="Today's Tasks"
                icon={<ListTodo className="w-5 h-5 text-neon-cyan" />}
                action={
                  <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                }
              />
              <CardContent>
                {todayTasks.length > 0 ? (
                  <div className="space-y-3">
                    {todayTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/50 hover:bg-dark-800 transition-colors"
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          task.priority === 'critical' || task.priority === 'high' 
                            ? 'bg-neon-orange' 
                            : task.priority === 'medium' 
                            ? 'bg-neon-purple' 
                            : 'bg-neon-cyan'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{task.title}</p>
                          {task.dueDate && (
                            <p className="text-xs text-dark-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTime(new Date(task.dueDate))}
                            </p>
                          )}
                        </div>
                        <PriorityBadge priority={task.priority} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-neon-green mx-auto mb-3" />
                    <p className="text-dark-400">No tasks due today</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => router.push('/tasks')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Habits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="glass">
              <CardHeader
                title="Habits"
                icon={<Target className="w-5 h-5 text-neon-purple" />}
                action={
                  <Button variant="ghost" size="sm" onClick={() => router.push('/habits')}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                }
              />
              <CardContent>
                {todayHabits.length > 0 ? (
                  <div className="space-y-3">
                    {todayHabits.map((habit: any, index: number) => {
                      const isCompleted = completionData[habit.id]?.[todayKey];
                      return (
                        <motion.div
                          key={habit.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/50"
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            isCompleted ? 'bg-neon-green text-dark-900' : 'bg-dark-700'
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Target className="w-4 h-4 text-dark-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm font-medium truncate',
                              isCompleted ? 'text-neon-green' : 'text-white'
                            )}>
                              {habit.name}
                            </p>
                            {habit.streak > 0 && (
                              <p className="text-xs text-dark-500 flex items-center gap-1">
                                <Flame className="w-3 h-3 text-neon-orange" />
                                {habit.streak} day streak
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-400">No habits for today</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => router.push('/habits')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Habit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Calendar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="glass">
            <CardHeader
              title="Upcoming Events"
              icon={<CalendarDays className="w-5 h-5 text-neon-orange" />}
              action={
                <Button variant="ghost" size="sm" onClick={() => router.push('/calendar')}>
                  View Calendar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              }
            />
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 rounded-lg bg-dark-800/50 border border-dark-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant={
                            event.category === 'work' ? 'cyan' :
                            event.category === 'health' ? 'green' :
                            event.category === 'personal' ? 'orange' : 
                            event.category === 'social' ? 'purple' : 'default'
                          }
                          size="sm"
                        >
                          {event.category}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-white mb-1 truncate">{event.title}</h4>
                      <p className="text-sm text-dark-400">
                        {formatTime(new Date(event.startTime))} - {formatTime(new Date(event.endTime))}
                      </p>
                      {event.location && (
                        <p className="text-xs text-dark-500 mt-1 truncate">{event.location}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No upcoming events today</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push('/calendar')}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="glass" className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-neon-purple/10">
                <Brain className="w-6 h-6 text-neon-purple" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-2">AI Insights</h3>
                <p className="text-dark-300 text-sm">
                  {taskStats.overdue > 0
                    ? `⚠️ You have ${taskStats.overdue} overdue task${taskStats.overdue > 1 ? 's' : ''}. Would you like me to help prioritize your workload?`
                    : habitStats.percentage >= 80
                    ? "🎉 Great job on your habits today! You're building excellent consistency."
                    : habitStats.total > 0 && habitStats.completed === 0
                    ? "🌅 Good morning! Start your day by completing one small habit to build momentum."
                    : taskStats.dueToday === 0 && todayEvents.length === 0
                    ? "📅 You have a clear day ahead. Perfect time for deep work or planning ahead!"
                    : "💪 You're making progress! Keep up the momentum."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={openAIPanel}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get Personalized Advice
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
