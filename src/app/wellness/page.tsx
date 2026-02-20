'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Heart,
  Activity,
  Moon,
  Droplets,
  Brain,
  Flame,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Clock,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Footprints,
  Dumbbell,
  Apple,
  Coffee,
  Scale,
  Smile,
  Frown,
  Meh,
  Zap,
  Battery,
  Sun,
  LogIn,
  Timer,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingSpinner } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useWellness, useRecentWellness, useWellnessStats } from '@/hooks/useWellness';
import { cn } from '@/lib/utils';
import type { Exercise, Meal, PeriodData, WellnessEntry } from '@/types';
import { WorkoutLogger } from '@/components/features/wellness/WorkoutLogger';
import { MentalHealthCheckIn } from '@/components/features/wellness/MentalHealthCheckIn';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getPeriodCycleInsights = (entries: WellnessEntry[]) => {
  const periodEntries = entries
    .filter(item => item.period?.isPeriodDay)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (periodEntries.length === 0) {
    return {
      lastStart: null as Date | null,
      nextStart: null as Date | null,
      avgCycleLength: 28,
      daysUntilNext: null as number | null,
    };
  }

  // Collapse consecutive period days into cycle start days.
  const cycleStarts: Date[] = [];
  for (const entry of periodEntries) {
    const current = new Date(entry.date);
    const previous = cycleStarts[cycleStarts.length - 1];
    if (!previous) {
      cycleStarts.push(current);
      continue;
    }
    const diffDays = Math.round((current.getTime() - previous.getTime()) / MS_PER_DAY);
    if (diffDays > 2) {
      cycleStarts.push(current);
    }
  }

  const cycleLengths: number[] = [];
  for (let index = 1; index < cycleStarts.length; index += 1) {
    const diff = Math.round((cycleStarts[index].getTime() - cycleStarts[index - 1].getTime()) / MS_PER_DAY);
    if (diff >= 18 && diff <= 45) {
      cycleLengths.push(diff);
    }
  }

  const avgCycleLength =
    cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((sum, value) => sum + value, 0) / cycleLengths.length)
      : 28;

  const lastStart = cycleStarts[cycleStarts.length - 1];
  const nextStart = new Date(lastStart);
  nextStart.setDate(nextStart.getDate() + avgCycleLength);

  const daysUntilNext = Math.round((nextStart.getTime() - Date.now()) / MS_PER_DAY);

  return {
    lastStart,
    nextStart,
    avgCycleLength,
    daysUntilNext,
  };
};

export default function WellnessPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const {
    entry,
    loading: wellnessLoading,
    initializeEntry,
    updateSleep,
    updateActivity,
    addExercise,
    updateNutrition,
    addMeal,
    addWater,
    updateStress,
    updatePeriod,
  } = useWellness(selectedDate);
  const { entries: recentEntries } = useRecentWellness(45);
  const weeklyEntries = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    return recentEntries.filter(item => new Date(item.date) >= weekAgo);
  }, [recentEntries]);
  const wellnessStats = useWellnessStats(weeklyEntries);

  const [isAddSleepOpen, setIsAddSleepOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isAddWaterOpen, setIsAddWaterOpen] = useState(false);
  const [isUpdateMoodOpen, setIsUpdateMoodOpen] = useState(false);
  const [isUpdatePeriodOpen, setIsUpdatePeriodOpen] = useState(false);
  const { openAIPanel } = useUIStore();

  const loading = authLoading || wellnessLoading;
  const showPeriodTracker = profile?.gender === 'female';

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getDateString = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 4) return <Smile className="w-5 h-5 text-neon-green" />;
    if (mood >= 3) return <Meh className="w-5 h-5 text-neon-cyan" />;
    return <Frown className="w-5 h-5 text-neon-orange" />;
  };

  const moodTrendData = useMemo(() => {
    return weeklyEntries
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => {
        const fallbackMood = Math.max(1, 11 - (item.stress?.level || 5));
        const moodScore = item.period?.moodScore || fallbackMood;
        return {
          day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          mood: moodScore,
          stress: item.stress?.level || 0,
          comfort: Math.max(1, 11 - (item.period?.painLevel || item.stress?.level || 5)),
        };
      });
  }, [weeklyEntries]);

  const periodInsights = useMemo(() => {
    if (!showPeriodTracker) return null;
    return getPeriodCycleInsights(recentEntries);
  }, [recentEntries, showPeriodTracker]);

  const cyclePhase = useMemo(() => {
    if (!showPeriodTracker || !periodInsights?.lastStart) return null;
    if (entry?.period?.isPeriodDay) return 'period';

    const cycleLength = Math.max(18, periodInsights.avgCycleLength || 28);
    const daysSinceLastStart = Math.max(
      0,
      Math.round((selectedDate.getTime() - periodInsights.lastStart.getTime()) / MS_PER_DAY)
    );
    const cycleDay = ((daysSinceLastStart % cycleLength) + cycleLength) % cycleLength;

    if (cycleDay <= 4) return 'period';
    if (cycleDay <= 13) return 'follicular';
    if (cycleDay <= 16) return 'ovulation';
    return 'luteal';
  }, [showPeriodTracker, periodInsights, entry?.period?.isPeriodDay, selectedDate]);

  const periodSuggestions = useMemo(() => {
    if (!showPeriodTracker) return [];
    const periodData = entry?.period;
    if (!periodData) {
      return [
        'Track flow and mood today so your cycle prediction becomes more accurate.',
        'Save comfort preferences (tea, heat pad, light walk) for personalized suggestions.',
      ];
    }

    const suggestions: string[] = [];

    if (periodData.painLevel >= 7) {
      suggestions.push('High discomfort detected. Use your favorite comfort ritual and take a short rest block.');
    } else if (periodData.painLevel >= 4) {
      suggestions.push('Try a gentle stretch session and warm hydration to ease cramps.');
    } else {
      suggestions.push('Body seems comfortable today. A short walk can keep energy steady.');
    }

    if (periodData.flowLevel >= 3) {
      suggestions.push('Heavy flow day: keep hydration nearby and schedule lighter tasks if possible.');
    }

    if (periodData.comfortPreferences.includes('heat therapy')) {
      suggestions.push('Heat therapy is in your comfort list. Consider a 15-minute heating pad session.');
    } else if (periodData.comfortPreferences.includes('herbal tea')) {
      suggestions.push('Herbal tea is one of your comforts. Plan 1 warm cup during your next break.');
    } else if (periodData.comfortPreferences.includes('light movement')) {
      suggestions.push('Light movement is your preference. A slow 10-minute walk may help.');
    }

    if (suggestions.length < 3) {
      suggestions.push('Log symptoms consistently this week to improve personalized period insights.');
    }

    return suggestions.slice(0, 3);
  }, [showPeriodTracker, entry?.period]);

  const cyclePhases = [
    { id: 'period', label: 'Period', emoji: '🌸', range: 'Day 1-5' },
    { id: 'follicular', label: 'Follicular', emoji: '✨', range: 'Day 6-13' },
    { id: 'ovulation', label: 'Ovulation', emoji: '🌼', range: 'Day 14-16' },
    { id: 'luteal', label: 'Luteal', emoji: '🫶', range: 'Day 17+' },
  ] as const;

  // Auth loading state
  if (authLoading) {
    return (
      <MainLayout>
        <PageContainer title="Wellness" subtitle="Track your health and well-being">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-dark-400">Loading wellness data...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Wellness" subtitle="Track your health and well-being">
          <Card variant="glass" className="max-w-md mx-auto p-8 text-center">
            <LogIn className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Sign in to track wellness</h3>
            <p className="text-dark-400 mb-6">
              Track sleep, exercise, nutrition, and monitor your overall health.
            </p>
            <Button variant="glow" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  // Initialize entry if it doesn't exist
  const handleInitialize = async () => {
    try {
      await initializeEntry(selectedDate);
    } catch (error) {
      console.error('Failed to initialize entry:', error);
    }
  };

  return (
    <MainLayout>
      <PageContainer title="Wellness" subtitle="Track your health and well-being">
        <div className="relative">
          {showPeriodTracker && (
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_40%)]" />
          )}
          {/* Date Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('prev')}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              />
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white">{getDateString(selectedDate)}</h2>
                <p className="text-sm text-dark-400">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('next')}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                disabled={selectedDate.toDateString() === new Date().toDateString()}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAIPanel()}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              AI Health Insights
            </Button>
          </div>

          {/* Weekly Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <Card variant="glass" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-dark-400">Avg Sleep</span>
                <Moon className="w-6 h-6 text-neon-purple" />
              </div>
              <p className="text-2xl font-bold text-white">{formatTime(Math.round(wellnessStats.avgSleepDuration))}</p>
              <p className="text-xs text-dark-500">{wellnessStats.avgSleepQuality.toFixed(0)}% quality</p>
            </Card>

            <Card variant="glass" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-dark-400">Active Minutes</span>
                <Activity className="w-6 h-6 text-neon-green" />
              </div>
              <p className="text-2xl font-bold text-white">{wellnessStats.totalActiveMinutes}</p>
              <p className="text-xs text-dark-500">this week</p>
            </Card>

            <Card variant="glass" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-dark-400">Water Intake</span>
                <Droplets className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{wellnessStats.totalWaterIntake}</p>
              <p className="text-xs text-dark-500">glasses total</p>
            </Card>

            <Card variant="glass" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-dark-400">Focus Time</span>
                <Brain className="w-6 h-6 text-neon-cyan" />
              </div>
              <p className="text-2xl font-bold text-white">{formatTime(wellnessStats.totalFocusMinutes)}</p>
              <p className="text-xs text-dark-500">this week</p>
            </Card>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Daily Tracking */}
            <div className="lg:col-span-2 space-y-6">
              {/* Initialize Entry Button if no entry exists */}
              {!entry && (
                <Card variant="glass" className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No data for this day</h3>
                  <p className="text-dark-400 mb-4">Start tracking your wellness for {getDateString(selectedDate)}</p>
                  <Button variant="glow" onClick={handleInitialize} leftIcon={<Plus className="w-4 h-4" />}>
                    Start Tracking
                  </Button>
                </Card>
              )}

              {entry && (
                <>
                  {/* Sleep Card */}
                  <Card variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-neon-purple/20">
                          <Moon className="w-5 h-5 text-neon-purple" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Sleep</h3>
                          <p className="text-sm text-dark-400">Track your rest</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setIsAddSleepOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                        Log Sleep
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {entry.sleep?.duration > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-white">{formatTime(entry.sleep.duration)}</p>
                              <p className="text-sm text-dark-400">sleep duration</p>
                            </div>
                            <CircularProgress value={entry.sleep.quality} size={60} strokeWidth={6}>
                              <span className="text-sm font-bold text-white">{entry.sleep.quality}%</span>
                            </CircularProgress>
                          </div>
                          {entry.sleep.bedTime && entry.sleep.wakeTime && (
                            <div className="flex items-center gap-4 text-sm text-dark-400">
                              <span>🛏️ {typeof entry.sleep.bedTime === 'string' ? entry.sleep.bedTime : new Date(entry.sleep.bedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>→</span>
                              <span>☀️ {typeof entry.sleep.wakeTime === 'string' ? entry.sleep.wakeTime : new Date(entry.sleep.wakeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-dark-400 text-center py-4">No sleep data recorded</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Activity Card */}
                  <Card variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-neon-green/20">
                          <Activity className="w-5 h-5 text-neon-green" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Activity</h3>
                          <p className="text-sm text-dark-400">Exercise and movement</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setIsAddExerciseOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                        Add Exercise
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 rounded-lg bg-dark-800/50">
                          <Footprints className="w-5 h-5 mx-auto text-neon-cyan mb-1" />
                          <p className="text-xl font-bold text-white">{entry.activity?.steps || 0}</p>
                          <p className="text-xs text-dark-400">steps</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-dark-800/50">
                          <Timer className="w-5 h-5 mx-auto text-neon-green mb-1" />
                          <p className="text-xl font-bold text-white">{entry.activity?.activeMinutes || 0}</p>
                          <p className="text-xs text-dark-400">active min</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-dark-800/50">
                          <Dumbbell className="w-5 h-5 mx-auto text-neon-orange mb-1" />
                          <p className="text-xl font-bold text-white">{entry.activity?.exercises?.length || 0}</p>
                          <p className="text-xs text-dark-400">exercises</p>
                        </div>
                      </div>
                      {entry.activity?.exercises && entry.activity.exercises.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-dark-300">Exercises</h4>
                          {entry.activity.exercises.map((exercise, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/30">
                              <div className="flex items-center gap-2">
                                <Dumbbell className="w-4 h-4 text-dark-400" />
                                <span className="text-sm text-white">{exercise.type}</span>
                                <Badge variant="outline" size="sm">{exercise.intensity}</Badge>
                              </div>
                              <span className="text-xs text-dark-400">{exercise.duration}min</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-dark-400 text-center py-2">No exercises logged</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Nutrition Card */}
                  <Card variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-neon-orange/20">
                          <Apple className="w-5 h-5 text-neon-orange" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Nutrition</h3>
                          <p className="text-sm text-dark-400">Food and hydration</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsAddWaterOpen(true)} leftIcon={<Droplets className="w-4 h-4" />}>
                          Water
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsAddMealOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                          Meal
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-dark-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-dark-400">Water</span>
                            <Droplets className="w-4 h-4 text-blue-400" />
                          </div>
                          <p className="text-xl font-bold text-white">{entry.nutrition?.waterIntake || 0}</p>
                          <p className="text-xs text-dark-500">of 8 glasses</p>
                          <Progress value={((entry.nutrition?.waterIntake || 0) / 8) * 100} variant="cyan" size="sm" className="mt-2" />
                        </div>
                        <div className="p-3 rounded-lg bg-dark-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-dark-400">Meals</span>
                            <Apple className="w-4 h-4 text-neon-orange" />
                          </div>
                          <p className="text-xl font-bold text-white">{entry.nutrition?.meals?.length || 0}</p>
                          <p className="text-xs text-dark-500">logged today</p>
                        </div>
                      </div>
                      {entry.nutrition?.meals && entry.nutrition.meals.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-dark-300">Meals</h4>
                          {entry.nutrition.meals.map((meal, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/30">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white capitalize">{meal.type}</span>
                                {meal.description && (
                                  <span className="text-xs text-dark-400">- {meal.description}</span>
                                )}
                              </div>
                              {meal.healthRating && (
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: meal.healthRating }).map((_, i) => (
                                    <span key={i} className="text-neon-green">★</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-dark-400 text-center py-2">No meals logged</p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Mood & Stress Card */}
              {entry && (
                <Card variant="glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Heart className="w-5 h-5 text-neon-pink" />
                      Mood & Stress
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsUpdateMoodOpen(true)}>
                      Update
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {entry.stress?.level ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-dark-400">Stress Level</span>
                            <span className="text-sm text-white">{entry.stress.level}/10</span>
                          </div>
                          <Progress
                            value={entry.stress.level * 10}
                            variant={entry.stress.level > 7 ? 'orange' : entry.stress.level > 4 ? 'cyan' : 'green'}
                            size="sm"
                          />
                        </div>
                        {entry.stress.triggers && entry.stress.triggers.length > 0 && (
                          <div>
                            <span className="text-sm text-dark-400">Triggers</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.stress.triggers.map((trigger, i) => (
                                <Badge key={i} variant="outline" size="sm">{trigger}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {entry.stress.notes && (
                          <p className="text-sm text-dark-400 italic">{entry.stress.notes}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-dark-400 mb-2">How are you feeling today?</p>
                        <Button variant="outline" size="sm" onClick={() => setIsUpdateMoodOpen(true)}>
                          Log Mood
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Period Tracker (female profile only) */}
              {entry && showPeriodTracker && (
                <Card variant="glass" className="border border-neon-pink/20 bg-gradient-to-br from-neon-pink/10 to-neon-purple/5">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Heart className="w-5 h-5 text-neon-pink" />
                      Period Tracker
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsUpdatePeriodOpen(true)}>
                      Update
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-dark-800/40 border border-neon-pink/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-300">Today</span>
                        <Badge variant={entry.period?.isPeriodDay ? 'pink' : 'default'} size="sm">
                          {entry.period?.isPeriodDay ? 'Period Day' : 'Not Period Day'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <p className="text-xs text-dark-400">Flow</p>
                          <p className="text-sm text-white">{entry.period?.flowLevel || 0}/4</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Pain</p>
                          <p className="text-sm text-white">{entry.period?.painLevel || 0}/10</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Mood</p>
                          <p className="text-sm text-white">{entry.period?.moodScore || 5}/10</p>
                        </div>
                      </div>
                    </div>

                    {periodInsights && (
                      <div className="p-3 rounded-lg bg-dark-800/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-dark-300">Cycle estimate</span>
                          <Badge variant="outline" size="sm">{periodInsights.avgCycleLength} days</Badge>
                        </div>
                        <p className="text-xs text-dark-400">
                          {periodInsights.nextStart
                            ? `Next expected start: ${periodInsights.nextStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${periodInsights.daysUntilNext !== null ? ` (${periodInsights.daysUntilNext >= 0 ? `${periodInsights.daysUntilNext}d` : `${Math.abs(periodInsights.daysUntilNext)}d late`})` : ''}`
                            : 'Log your first period day to unlock cycle prediction.'}
                        </p>
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-neon-pink/10 border border-neon-pink/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-neon-pink font-medium">Cute P Cycle</p>
                        <Badge variant="pink" size="sm">
                          {cyclePhase || 'tracking'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {cyclePhases.map(phase => (
                          <div
                            key={phase.id}
                            className={cn(
                              'rounded-lg px-2 py-1.5 text-xs border transition-colors',
                              cyclePhase === phase.id
                                ? 'border-neon-pink/60 bg-neon-pink/20 text-neon-pink'
                                : 'border-dark-700/60 bg-dark-800/30 text-dark-300'
                            )}
                          >
                            <p>
                              {phase.emoji} {phase.label}
                            </p>
                            <p className="text-[10px] text-dark-400">{phase.range}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-dark-300 mb-2">Comfort Suggestions</p>
                      <div className="space-y-2">
                        {periodSuggestions.map((tip, index) => (
                          <div key={index} className="text-xs text-dark-300 p-2 rounded-lg bg-dark-800/30 border border-dark-700/40">
                            {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mood Trend Graph */}
              <Card variant="glass">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-neon-pink" />
                    Mood Trend
                  </h3>
                </CardHeader>
                <CardContent>
                  {moodTrendData.length === 0 ? (
                    <p className="text-sm text-dark-400 text-center py-4">Log daily wellness to unlock your mood pattern.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={moodTrendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                            <defs>
                              <linearGradient id="moodTrendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff79c6" stopOpacity={0.45} />
                                <stop offset="100%" stopColor="#ff79c6" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '0.75rem',
                                color: '#fff',
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="mood"
                              stroke="#ff79c6"
                              strokeWidth={2}
                              fill="url(#moodTrendFill)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-dark-400">
                        You&rsquo;re doing great. Keep logging small check-ins to get gentler, personalized support trends.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Trend */}
              <Card variant="glass">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-neon-green" />
                    Weekly Overview
                  </h3>
                </CardHeader>
                <CardContent>
                  {weeklyEntries.length === 0 ? (
                    <p className="text-sm text-dark-400 text-center py-4">No data this week</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-400">Days tracked</span>
                        <span className="text-sm font-medium text-white">{weeklyEntries.length}/7</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-400">Exercises logged</span>
                        <span className="text-sm font-medium text-white">{wellnessStats.exerciseCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-400">Avg meals/day</span>
                        <span className="text-sm font-medium text-white">{wellnessStats.avgMealsPerDay.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-400">Avg stress</span>
                        <span className="text-sm font-medium text-white">{wellnessStats.avgStressLevel.toFixed(1)}/10</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card variant="glass">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-neon-cyan" />
                    Quick Log
                  </h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Droplets className="w-4 h-4" />}
                    onClick={() => entry && addWater(selectedDate, 1)}
                    disabled={!entry}
                  >
                    +1 Glass of Water
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Footprints className="w-4 h-4" />}
                    onClick={() => entry && updateActivity(selectedDate, { steps: (entry.activity?.steps || 0) + 1000 })}
                    disabled={!entry}
                  >
                    +1000 Steps
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Coffee className="w-4 h-4" />}
                    onClick={() => setIsAddMealOpen(true)}
                    disabled={!entry}
                  >
                    Log Meal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Add Sleep Modal */}
          <Modal
            isOpen={isAddSleepOpen}
            onClose={() => setIsAddSleepOpen(false)}
            title="Log Sleep"
          >
            <AddSleepForm
              onClose={() => setIsAddSleepOpen(false)}
              onSubmit={async (data) => {
                await updateSleep(selectedDate, data);
                setIsAddSleepOpen(false);
              }}
            />
          </Modal>

          {/* Workout Logger Modal */}
          <Modal
            isOpen={isAddExerciseOpen}
            onClose={() => setIsAddExerciseOpen(false)}
            title="Workout Log"
          >
            <WorkoutLogger
              initialExercises={entry?.activity?.exercises || []}
              onCancel={() => setIsAddExerciseOpen(false)}
              onSave={async (exercises) => {
                // Get current activity data and just update the exercises array
                await updateActivity(selectedDate, {
                  steps: entry?.activity?.steps || 0,
                  activeMinutes: entry?.activity?.activeMinutes || 0,
                  exercises
                });
                setIsAddExerciseOpen(false);
              }}
            />
          </Modal>

          {/* Add Meal Modal */}
          <Modal
            isOpen={isAddMealOpen}
            onClose={() => setIsAddMealOpen(false)}
            title="Log Meal"
          >
            <AddMealForm
              onClose={() => setIsAddMealOpen(false)}
              onSubmit={async (data) => {
                await addMeal(selectedDate, data);
                setIsAddMealOpen(false);
              }}
            />
          </Modal>

          {/* Add Water Modal */}
          <Modal
            isOpen={isAddWaterOpen}
            onClose={() => setIsAddWaterOpen(false)}
            title="Log Water Intake"
          >
            <AddWaterForm
              currentAmount={entry?.nutrition?.waterIntake || 0}
              onClose={() => setIsAddWaterOpen(false)}
              onSubmit={async (amount) => {
                await addWater(selectedDate, amount);
                setIsAddWaterOpen(false);
              }}
            />
          </Modal>

          {/* Update Mood Modal */}
          <Modal
            isOpen={isUpdateMoodOpen}
            onClose={() => setIsUpdateMoodOpen(false)}
            title="Mental Health Check-In"
          >
            <MentalHealthCheckIn
              initialData={entry?.stress}
              onCancel={() => setIsUpdateMoodOpen(false)}
              onSave={async (data) => {
                await updateStress(selectedDate, data);
                setIsUpdateMoodOpen(false);
              }}
            />
          </Modal>

          {/* Update Period Modal */}
          <Modal
            isOpen={isUpdatePeriodOpen}
            onClose={() => setIsUpdatePeriodOpen(false)}
            title="Period & Comfort Log"
          >
            <UpdatePeriodForm
              currentData={entry?.period}
              onClose={() => setIsUpdatePeriodOpen(false)}
              onSubmit={async (data) => {
                await updatePeriod(selectedDate, data);
                setIsUpdatePeriodOpen(false);
              }}
            />
          </Modal>
        </div>
      </PageContainer>
    </MainLayout>
  );
}

// Add Sleep Form
function AddSleepForm({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: (data: { duration: number; quality: number; bedTime?: Date; wakeTime?: Date }) => Promise<void>;
}) {
  const [hours, setHours] = useState('7');
  const [minutes, setMinutes] = useState('30');
  const [quality, setQuality] = useState('80');
  const [bedTime, setBedTime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [submitting, setSubmitting] = useState(false);

  const timeStringToDate = (timeStr: string): Date => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    return date;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        duration: parseInt(hours) * 60 + parseInt(minutes),
        quality: parseInt(quality),
        bedTime: bedTime ? timeStringToDate(bedTime) : undefined,
        wakeTime: wakeTime ? timeStringToDate(wakeTime) : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">Hours</label>
          <Input
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={e => setHours(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">Minutes</label>
          <Input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Quality (0-100)</label>
        <Input
          type="number"
          min="0"
          max="100"
          value={quality}
          onChange={e => setQuality(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">Bed Time</label>
          <Input
            type="time"
            value={bedTime}
            onChange={e => setBedTime(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">Wake Time</label>
          <Input
            type="time"
            value={wakeTime}
            onChange={e => setWakeTime(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting}>
          {submitting ? 'Saving...' : 'Log Sleep'}
        </Button>
      </div>
    </form>
  );
}

// Add Exercise Form
function AddExerciseForm({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: (data: Exercise) => Promise<void>;
}) {
  const [type, setType] = useState('cardio');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        duration: parseInt(duration),
        intensity,
        notes: notes || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Exercise Type</label>
        <Input
          placeholder="e.g., Running, Yoga, Weight Training"
          value={type}
          onChange={e => setType(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Intensity</label>
        <select
          value={intensity}
          onChange={e => setIntensity(e.target.value as 'low' | 'medium' | 'high')}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Duration (min)</label>
        <Input
          type="number"
          min="1"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Notes (optional)</label>
        <Input
          placeholder="Additional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting || !type}>
          {submitting ? 'Adding...' : 'Add Exercise'}
        </Button>
      </div>
    </form>
  );
}

// Add Meal Form
function AddMealForm({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: (data: Meal) => Promise<void>;
}) {
  const [type, setType] = useState<Meal['type']>('lunch');
  const [description, setDescription] = useState('');
  const [healthRating, setHealthRating] = useState('3');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        time: new Date(),
        description: description || undefined,
        healthRating: parseInt(healthRating),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Meal Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as Meal['type'])}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Description (optional)</label>
        <Input
          placeholder="e.g., Chicken salad with avocado"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Health Rating (1-5)</label>
        <select
          value={healthRating}
          onChange={e => setHealthRating(e.target.value)}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        >
          <option value="1">1 - Very Unhealthy</option>
          <option value="2">2 - Unhealthy</option>
          <option value="3">3 - Moderate</option>
          <option value="4">4 - Healthy</option>
          <option value="5">5 - Very Healthy</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting}>
          {submitting ? 'Logging...' : 'Log Meal'}
        </Button>
      </div>
    </form>
  );
}

// Add Water Form
function AddWaterForm({
  currentAmount,
  onClose,
  onSubmit
}: {
  currentAmount: number;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
}) {
  const [glasses, setGlasses] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(parseInt(glasses));
    } finally {
      setSubmitting(false);
    }
  };

  const quickAdd = async (amount: number) => {
    setSubmitting(true);
    try {
      await onSubmit(amount);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-lg text-white">Current: {currentAmount} glasses</p>
        <p className="text-sm text-dark-400">Goal: 8 glasses</p>
      </div>
      <div className="flex gap-2 justify-center mb-4">
        {[1, 2, 3].map(num => (
          <Button
            key={num}
            type="button"
            variant="outline"
            onClick={() => quickAdd(num)}
            disabled={submitting}
          >
            +{num}
          </Button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Custom Amount</label>
        <Input
          type="number"
          min="1"
          value={glasses}
          onChange={e => setGlasses(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Water'}
        </Button>
      </div>
    </form>
  );
}

// Update Mood Form - actually updates StressData
function UpdateMoodForm({
  currentData,
  onClose,
  onSubmit
}: {
  currentData?: { level: number; triggers?: string[]; copingMethods?: string[]; notes?: string };
  onClose: () => void;
  onSubmit: (data: { level: number; triggers: string[]; copingMethods: string[]; notes?: string }) => Promise<void>;
}) {
  const [stress, setStress] = useState(currentData?.level?.toString() || '5');
  const [notes, setNotes] = useState(currentData?.notes || '');
  const [triggerInput, setTriggerInput] = useState('');
  const [triggers, setTriggers] = useState<string[]>(currentData?.triggers || []);
  const [submitting, setSubmitting] = useState(false);

  const addTrigger = () => {
    if (triggerInput.trim() && !triggers.includes(triggerInput.trim())) {
      setTriggers([...triggers, triggerInput.trim()]);
      setTriggerInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        level: parseInt(stress),
        triggers,
        copingMethods: currentData?.copingMethods || [],
        notes: notes || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Stress Level (1-10)</label>
        <Input
          type="range"
          min="1"
          max="10"
          value={stress}
          onChange={e => setStress(e.target.value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-dark-400">
          <span>Low</span>
          <span>{stress}</span>
          <span>High</span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Stress Triggers</label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a trigger"
            value={triggerInput}
            onChange={e => setTriggerInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTrigger())}
          />
          <Button type="button" variant="outline" onClick={addTrigger}>Add</Button>
        </div>
        {triggers.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {triggers.map((trigger, i) => (
              <Badge key={i} variant="outline">
                {trigger}
                <button
                  type="button"
                  onClick={() => setTriggers(triggers.filter((_, idx) => idx !== i))}
                  className="ml-1"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Notes (optional)</label>
        <Input
          placeholder="How are you feeling?"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting}>
          {submitting ? 'Saving...' : 'Update'}
        </Button>
      </div>
    </form>
  );
}

function UpdatePeriodForm({
  currentData,
  onClose,
  onSubmit,
}: {
  currentData?: PeriodData;
  onClose: () => void;
  onSubmit: (data: Partial<PeriodData>) => Promise<void>;
}) {
  const [isPeriodDay, setIsPeriodDay] = useState(currentData?.isPeriodDay ?? false);
  const [flowLevel, setFlowLevel] = useState((currentData?.flowLevel ?? 0).toString());
  const [painLevel, setPainLevel] = useState((currentData?.painLevel ?? 0).toString());
  const [moodScore, setMoodScore] = useState((currentData?.moodScore ?? 5).toString());
  const [cycleLength, setCycleLength] = useState((currentData?.cycleLength ?? 28).toString());
  const [notes, setNotes] = useState(currentData?.notes || '');
  const [symptoms, setSymptoms] = useState<string[]>(currentData?.symptoms || []);
  const [comfortPreferences, setComfortPreferences] = useState<string[]>(currentData?.comfortPreferences || []);
  const [submitting, setSubmitting] = useState(false);

  const symptomOptions = ['cramps', 'bloating', 'fatigue', 'headache', 'acne', 'back pain', 'sensitive mood'];
  const comfortOptions = ['heat therapy', 'herbal tea', 'light movement', 'breathing exercise', 'extra rest'];

  const toggleSelection = (items: string[], setter: (value: string[]) => void, value: string) => {
    if (items.includes(value)) {
      setter(items.filter(item => item !== value));
    } else {
      setter([...items, value]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        isPeriodDay,
        flowLevel: Number(flowLevel) as PeriodData['flowLevel'],
        painLevel: Number(painLevel),
        moodScore: Number(moodScore),
        cycleLength: Number(cycleLength),
        symptoms,
        comfortPreferences,
        notes: notes || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/40">
        <div>
          <p className="text-sm font-medium text-white">Is today a period day?</p>
          <p className="text-xs text-dark-400">This helps predict your cycle better.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsPeriodDay(!isPeriodDay)}
          className={cn(
            'w-12 h-6 rounded-full transition-colors relative',
            isPeriodDay ? 'bg-neon-pink' : 'bg-dark-700'
          )}
        >
          <div
            className={cn(
              'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
              isPeriodDay ? 'translate-x-6' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-dark-400 mb-1">Flow (0-4)</label>
          <Input
            type="number"
            min="0"
            max="4"
            value={flowLevel}
            onChange={e => setFlowLevel(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-dark-400 mb-1">Pain (0-10)</label>
          <Input
            type="number"
            min="0"
            max="10"
            value={painLevel}
            onChange={e => setPainLevel(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-dark-400 mb-1">Mood (1-10)</label>
          <Input
            type="number"
            min="1"
            max="10"
            value={moodScore}
            onChange={e => setMoodScore(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-dark-400 mb-1">Cycle Length (days)</label>
        <Input
          type="number"
          min="18"
          max="45"
          value={cycleLength}
          onChange={e => setCycleLength(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-dark-400 mb-1">Symptoms</label>
        <div className="flex flex-wrap gap-2">
          {symptomOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => toggleSelection(symptoms, setSymptoms, option)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs border transition-colors',
                symptoms.includes(option)
                  ? 'bg-neon-pink/20 border-neon-pink/40 text-neon-pink'
                  : 'bg-dark-800/40 border-dark-700 text-dark-300'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-dark-400 mb-1">Comfort Preferences</label>
        <div className="flex flex-wrap gap-2">
          {comfortOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => toggleSelection(comfortPreferences, setComfortPreferences, option)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs border transition-colors',
                comfortPreferences.includes(option)
                  ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan'
                  : 'bg-dark-800/40 border-dark-700 text-dark-300'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-dark-400 mb-1">Notes</label>
        <Input
          placeholder="Anything that helped today?"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Period Log'}
        </Button>
      </div>
    </form>
  );
}
