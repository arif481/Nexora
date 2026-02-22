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
  AlertCircle,
  RefreshCw,
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
import { DashboardBentoGrid } from '@/components/features/dashboard/DashboardBentoGrid';
import { LifeScoreWidget } from '@/components/features/LifeScoreWidget';
import { AIDailyBrief } from '@/components/features/AIDailyBrief';
import { generateAIResponse } from '@/lib/services/ai';
import { useIntegrations } from '@/hooks/useIntegrations';
import { EduPlanrWidget } from '@/components/features/dashboard/EduPlanrWidget';
import { useAutoEduPlanrSync } from '@/hooks/useAutoEduPlanrSync';
import SyncMonitor from '@/components/features/integrations/SyncMonitor';
import '@/lib/cleanupDuplicates';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const taskStats = useTaskStats();
  const { habits, loading: habitsLoading, error: habitsError } = useHabits();
  const completionData = useHabitCompletions(habits as any, 1);
  const { events: todayEvents, loading: eventsLoading, error: eventsError } = useTodayEvents();
  const { openAIPanel } = useUIStore();
  const { integrations } = useIntegrations();
  const isEduplanrConnected = integrations?.eduplanr?.connected;
  const syncState = useAutoEduPlanrSync();

  // Combine errors for display
  const dataError = tasksError || habitsError || eventsError;

  const today = useMemo(() => new Date(), []);
  const todayKey = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  // Get today's tasks (due today)
  const todayTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === today.toDateString() && task.status !== 'done';
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

  // Show error state if data fetching failed
  if (dataError && !loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="p-4 rounded-full bg-red-500/10">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-white">Unable to Load Dashboard</h2>
          <p className="text-dark-400 text-center max-w-md">
            {dataError.includes('index')
              ? 'Database indexes are being built. This usually takes 2-5 minutes. Please try again shortly.'
              : dataError.includes('permission')
                ? 'You don\'t have permission to access this data. Please sign out and sign in again.'
                : dataError}
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="glow" onClick={() => router.push('/auth/login')}>
              Sign In Again
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

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

  const generateBriefHandler = async (prompt: string) => {
    const res = await generateAIResponse(prompt);
    return res.content;
  };


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

        {/* Bento Grid */}
        <DashboardBentoGrid
          storageKey="nexora_dashboard_layout"
          widgets={[
            ...(isEduplanrConnected ? [{
              id: 'eduplanr-summary',
              className: 'md:col-span-1 lg:col-span-1',
              content: <EduPlanrWidget />
            },
            {
              id: 'sync-monitor',
              className: 'md:col-span-1 lg:col-span-1',
              content: <SyncMonitor syncState={syncState} isConnected={!!isEduplanrConnected} />
            }] : []),
            {
              id: 'daily-brief',
              className: 'md:col-span-2 lg:col-span-2',
              content: (
                <AIDailyBrief
                  generateBrief={generateBriefHandler}
                  userName={user.displayName?.split(' ')[0]}
                  taskCount={taskStats.dueToday}
                  habitsDueToday={habitStats.total}
                />
              )
            },
            {
              id: 'focus-score',
              className: 'md:col-span-1 lg:col-span-1',
              content: (
                <Card variant="glass" className="p-5 h-full flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-dark-400">Focus Score</span>
                    <Activity className="w-5 h-5 text-neon-green" />
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-3xl font-bold text-white">
                        {Math.round((taskStats.completionRate + habitStats.percentage) / 2)}%
                      </p>
                      <p className="text-sm text-dark-500">productivity</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-neon-green" />
                  </div>
                </Card>
              )
            },
            {
              id: 'life-score',
              className: 'md:col-span-1 lg:col-span-1',
              content: <LifeScoreWidget tasks={tasks as any} habits={habits as any} transactions={[]} focusMinutes={0} journalCount={0} wellnessEntries={[]} />
            },
            {
              id: 'tasks',
              className: 'md:col-span-2 lg:col-span-2',
              content: (
                <Card variant="glass" className="h-full">
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
                          <div
                            key={task.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/40 hover:bg-dark-800/60 transition-colors"
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <CheckCircle2 className="w-10 h-10 text-neon-green mx-auto mb-3 opacity-80" />
                        <p className="text-dark-400 text-sm">No tasks due today</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            },
            {
              id: 'habits',
              className: 'md:col-span-1 lg:col-span-1',
              content: (
                <Card variant="glass" className="h-full">
                  <CardHeader
                    title="Habits"
                    icon={<Target className="w-5 h-5 text-neon-purple" />}
                    action={
                      <Button variant="ghost" size="sm" onClick={() => router.push('/habits')}>
                        View
                      </Button>
                    }
                  />
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-white">{habitStats.completed}<span className="text-sm font-normal text-dark-400">/{habitStats.total}</span></p>
                      </div>
                      <CircularProgress value={habitStats.percentage} size={48} strokeWidth={4} variant="purple" />
                    </div>
                    {todayHabits.length > 0 ? (
                      <div className="space-y-2">
                        {todayHabits.map((habit: any) => {
                          const isCompleted = completionData[habit.id]?.[todayKey];
                          return (
                            <div
                              key={habit.id}
                              className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-800/30"
                            >
                              <div className={cn(
                                'w-6 h-6 rounded flex items-center justify-center',
                                isCompleted ? 'bg-neon-green/20' : 'bg-dark-700/50'
                              )}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
                                ) : (
                                  <Target className="w-3.5 h-3.5 text-dark-500" />
                                )}
                              </div>
                              <p className={cn(
                                'text-sm flex-1 truncate',
                                isCompleted ? 'text-dark-300' : 'text-white'
                              )}>
                                {habit.name}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-dark-400 text-center py-4">No habits today</p>
                    )}
                  </CardContent>
                </Card>
              )
            },
            {
              id: 'events',
              className: 'md:col-span-2 lg:col-span-2 xl:col-span-2',
              content: (
                <Card variant="glass" className="h-full">
                  <CardHeader
                    title="Upcoming Events"
                    icon={<CalendarDays className="w-5 h-5 text-neon-orange" />}
                    action={
                      <Button variant="ghost" size="sm" onClick={() => router.push('/calendar')}>
                        Calendar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    }
                  />
                  <CardContent>
                    {upcomingEvents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingEvents.map((event, index) => (
                          <div
                            key={event.id}
                            className={cn(
                              "p-4 rounded-xl border",
                              event.source === 'eduplanr'
                                ? "bg-dark-800/40 border-neon-cyan/20 cursor-pointer hover:bg-dark-800/60"
                                : "bg-dark-800/40 border-dark-700/50"
                            )}
                            onClick={() => {
                              if (event.source === 'eduplanr' && event.externalId) {
                                window.open(`https://eduplanr.app/session/${event.externalId}`, '_blank');
                              }
                            }}
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <CalendarDays className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                        <p className="text-sm text-dark-400">No upcoming events today</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            },
            {
              id: 'insights',
              className: 'md:col-span-3 lg:col-span-3 xl:col-span-4',
              content: (
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
              )
            }
          ]}
        />

      </div>
    </MainLayout>
  );
}
