'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import type { WellnessEntry, SleepData, ActivityData, NutritionData, StressData, FocusSession, Exercise, Meal } from '@/types';
import {
  subscribeToWellnessEntry,
  subscribeToWellnessRange,
  subscribeToRecentWellness,
  getOrCreateWellnessEntry,
  updateSleepData,
  updateActivityData,
  addExercise,
  updateNutritionData,
  addMeal,
  updateWaterIntake,
  updateStressData,
  addFocusSession,
} from '@/lib/services/wellness';

interface UseWellnessReturn {
  entry: WellnessEntry | null;
  loading: boolean;
  error: string | null;
  initializeEntry: (date?: Date) => Promise<WellnessEntry>;
  updateSleep: (date: Date, data: Partial<SleepData>) => Promise<void>;
  updateActivity: (date: Date, data: Partial<ActivityData>) => Promise<void>;
  addExercise: (date: Date, exercise: Exercise) => Promise<void>;
  updateNutrition: (date: Date, data: Partial<NutritionData>) => Promise<void>;
  addMeal: (date: Date, meal: Meal) => Promise<void>;
  addWater: (date: Date, amount: number) => Promise<void>;
  updateStress: (date: Date, data: Partial<StressData>) => Promise<void>;
  addFocusSession: (date: Date, session: Omit<FocusSession, 'id'>) => Promise<void>;
  refresh: () => void;
}

export function useWellness(date: Date = new Date()): UseWellnessReturn {
  const { user } = useAuth();
  const [entry, setEntry] = useState<WellnessEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEntry(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const unsubscribe = subscribeToWellnessEntry(
      user.uid,
      date,
      (fetchedEntry) => {
        setEntry(fetchedEntry);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Wellness subscription error:', err);
        setError(err.message);
        setEntry(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, date]);

  const handleInitializeEntry = useCallback(
    async (entryDate: Date = new Date()): Promise<WellnessEntry> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        const newEntry = await getOrCreateWellnessEntry(user.uid, entryDate);
        return newEntry;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateSleep = useCallback(
    async (entryDate: Date, data: Partial<SleepData>): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await updateSleepData(user.uid, entryDate, data);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateActivity = useCallback(
    async (entryDate: Date, data: Partial<ActivityData>): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await updateActivityData(user.uid, entryDate, data);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleAddExercise = useCallback(
    async (entryDate: Date, exercise: Exercise): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await addExercise(user.uid, entryDate, exercise);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateNutrition = useCallback(
    async (entryDate: Date, data: Partial<NutritionData>): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await updateNutritionData(user.uid, entryDate, data);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleAddMeal = useCallback(
    async (entryDate: Date, meal: Meal): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await addMeal(user.uid, entryDate, meal);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleAddWater = useCallback(
    async (entryDate: Date, amount: number): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await updateWaterIntake(user.uid, entryDate, amount);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateStress = useCallback(
    async (entryDate: Date, data: Partial<StressData>): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await updateStressData(user.uid, entryDate, data);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleAddFocusSession = useCallback(
    async (entryDate: Date, session: Omit<FocusSession, 'id'>): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await addFocusSession(user.uid, entryDate, session);
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
    entry,
    loading,
    error,
    initializeEntry: handleInitializeEntry,
    updateSleep: handleUpdateSleep,
    updateActivity: handleUpdateActivity,
    addExercise: handleAddExercise,
    updateNutrition: handleUpdateNutrition,
    addMeal: handleAddMeal,
    addWater: handleAddWater,
    updateStress: handleUpdateStress,
    addFocusSession: handleAddFocusSession,
    refresh,
  };
}

// Hook for wellness data over a date range
export function useWellnessRange(startDate: Date, endDate: Date) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToWellnessRange(
      user.uid,
      startDate,
      endDate,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching wellness range:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, startDate, endDate]);

  return { entries, loading };
}

// Hook for recent wellness data
export function useRecentWellness(days: number = 7) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRecentWellness(
      user.uid,
      days,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching recent wellness:', err);
        setEntries([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, days]);

  return { entries, loading };
}

// Hook for wellness statistics
export function useWellnessStats(entries: WellnessEntry[]) {
  // Ensure entries is always an array - do this before useMemo to ensure stable reference
  const safeEntries = Array.isArray(entries) ? entries : [];
  
  const stats = useMemo(() => {
    if (safeEntries.length === 0) {
      return {
        avgSleepDuration: 0,
        avgSleepQuality: 0,
        totalActiveMinutes: 0,
        avgStressLevel: 0,
        totalWaterIntake: 0,
        totalFocusMinutes: 0,
        avgMealsPerDay: 0,
        exerciseCount: 0,
      };
    }

    const sleepEntries = safeEntries.filter((e) => e.sleep?.duration > 0);
    const avgSleepDuration = sleepEntries.length > 0
      ? sleepEntries.reduce((sum, e) => sum + e.sleep.duration, 0) / sleepEntries.length
      : 0;

    const avgSleepQuality = sleepEntries.length > 0
      ? sleepEntries.reduce((sum, e) => sum + e.sleep.quality, 0) / sleepEntries.length
      : 0;

    const totalActiveMinutes = safeEntries.reduce((sum, e) => sum + (e.activity?.activeMinutes || 0), 0);
    
    const stressEntries = safeEntries.filter((e) => e.stress?.level);
    const avgStressLevel = stressEntries.length > 0
      ? stressEntries.reduce((sum, e) => sum + e.stress.level, 0) / stressEntries.length
      : 0;

    const totalWaterIntake = safeEntries.reduce((sum, e) => sum + (e.nutrition?.waterIntake || 0), 0);
    
    const totalFocusMinutes = safeEntries.reduce(
      (sum, e) => sum + (e.focusSessions || []).reduce((s, f) => s + f.duration, 0),
      0
    );

    const totalMeals = safeEntries.reduce((sum, e) => sum + (e.nutrition?.meals?.length || 0), 0);
    const avgMealsPerDay = safeEntries.length > 0 ? totalMeals / safeEntries.length : 0;

    const exerciseCount = safeEntries.reduce((sum, e) => sum + (e.activity?.exercises?.length || 0), 0);

    return {
      avgSleepDuration,
      avgSleepQuality,
      totalActiveMinutes,
      avgStressLevel,
      totalWaterIntake,
      totalFocusMinutes,
      avgMealsPerDay,
      exerciseCount,
    };
  }, [safeEntries]);

  return stats;
}
