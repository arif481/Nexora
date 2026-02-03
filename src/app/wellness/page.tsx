'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useWellness, useRecentWellness, useWellnessStats } from '@/hooks/useWellness';
import { cn } from '@/lib/utils';
import type { Exercise, Meal } from '@/types';

export default function WellnessPage() {
  const { user, loading: authLoading } = useAuth();
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
  } = useWellness(selectedDate);
  const { entries: recentEntries, loading: recentLoading } = useRecentWellness(7);
  const wellnessStats = useWellnessStats(recentEntries);

  const [isAddSleepOpen, setIsAddSleepOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isAddWaterOpen, setIsAddWaterOpen] = useState(false);
  const [isUpdateMoodOpen, setIsUpdateMoodOpen] = useState(false);
  const { openAIPanel } = useUIStore();

  const loading = authLoading || wellnessLoading;

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

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <PageContainer title="Wellness" subtitle="Track your health and well-being">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading wellness data...</p>
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
            <Button variant="glow" onClick={() => window.location.href = '/auth/login'}>
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

            {/* Weekly Trend */}
            <Card variant="glass">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-neon-green" />
                  Weekly Overview
                </h3>
              </CardHeader>
              <CardContent>
                {recentEntries.length === 0 ? (
                  <p className="text-sm text-dark-400 text-center py-4">No data this week</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-400">Days tracked</span>
                      <span className="text-sm font-medium text-white">{recentEntries.length}/7</span>
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

        {/* Add Exercise Modal */}
        <Modal
          isOpen={isAddExerciseOpen}
          onClose={() => setIsAddExerciseOpen(false)}
          title="Add Exercise"
        >
          <AddExerciseForm
            onClose={() => setIsAddExerciseOpen(false)}
            onSubmit={async (data) => {
              await addExercise(selectedDate, data);
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
          title="Update Mood & Stress"
        >
          <UpdateMoodForm
            currentData={entry?.stress}
            onClose={() => setIsUpdateMoodOpen(false)}
            onSubmit={async (data) => {
              await updateStress(selectedDate, data);
              setIsUpdateMoodOpen(false);
            }}
          />
        </Modal>
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
