'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Habit, HabitCategory, HabitFrequency } from '@/types';
import {
  subscribeToHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  getHabitCompletionsForRange,
} from '@/lib/services/habits';

interface UseHabitsReturn {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  createHabit: (data: CreateHabitData) => Promise<string>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: Date, completed: boolean, notes?: string) => Promise<void>;
  getCompletionsForRange: (habit: Habit, startDate: Date, endDate: Date) => Record<string, boolean>;
  refresh: () => void;
}

interface CreateHabitData {
  name: string;
  description?: string;
  category?: HabitCategory;
  frequency?: HabitFrequency;
  targetDays?: number[];
  targetTime?: string;
  duration?: number;
  reminderEnabled?: boolean;
  reminderTime?: string;
  cue?: string;
  routine?: string;
  reward?: string;
  identity?: string;
  triggers?: string[];
  isPositive?: boolean;
  icon?: string;
  color?: string;
}

export function useHabits(): UseHabitsReturn {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToHabits(
      user.uid,
      (fetchedHabits) => {
        setHabits(fetchedHabits);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateHabit = useCallback(
    async (data: CreateHabitData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        const habitId = await createHabit(user.uid, data);
        return habitId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateHabit = useCallback(
    async (habitId: string, updates: Partial<Habit>): Promise<void> => {
      try {
        await updateHabit(habitId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteHabit = useCallback(
    async (habitId: string): Promise<void> => {
      try {
        await deleteHabit(habitId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleToggleCompletion = useCallback(
    async (habitId: string, date: Date, completed: boolean, notes?: string): Promise<void> => {
      try {
        await toggleHabitCompletion(habitId, date, completed, notes);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleGetCompletionsForRange = useCallback(
    (habit: Habit, startDate: Date, endDate: Date): Record<string, boolean> => {
      return getHabitCompletionsForRange(habit, startDate, endDate);
    },
    []
  );

  const refresh = useCallback(() => {
    // Force re-subscription by toggling loading
    setLoading(true);
  }, []);

  return {
    habits,
    loading,
    error,
    createHabit: handleCreateHabit,
    updateHabit: handleUpdateHabit,
    deleteHabit: handleDeleteHabit,
    toggleCompletion: handleToggleCompletion,
    getCompletionsForRange: handleGetCompletionsForRange,
    refresh,
  };
}

// Hook for getting completion data for habits
export function useHabitCompletions(habits: Habit[], days: number = 7) {
  const [completionData, setCompletionData] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data: Record<string, Record<string, boolean>> = {};
    
    habits.forEach((habit) => {
      data[habit.id] = getHabitCompletionsForRange(habit, startDate, endDate);
    });

    setCompletionData(data);
  }, [habits, days]);

  return completionData;
}
