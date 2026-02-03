'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  Goal,
  Milestone,
  subscribeToGoals,
  subscribeToActiveGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  toggleMilestone,
  addMilestone,
  removeMilestone,
} from '@/lib/services/goals';

interface UseGoalsReturn {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  createGoal: (data: CreateGoalData) => Promise<string>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateProgress: (goalId: string, progress: number) => Promise<void>;
  toggleMilestone: (goalId: string, milestoneId: string, completed: boolean) => Promise<void>;
  addMilestone: (goalId: string, data: Partial<Milestone>) => Promise<void>;
  removeMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  refresh: () => void;
}

interface CreateGoalData {
  title: string;
  description?: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  startDate?: Date;
  targetDate?: Date;
  milestones?: Milestone[];
  color?: string;
  icon?: string;
}

export function useGoals(activeOnly: boolean = false): UseGoalsReturn {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const subscribeFn = activeOnly ? subscribeToActiveGoals : subscribeToGoals;
    
    const unsubscribe = subscribeFn(
      user.uid,
      (fetchedGoals) => {
        setGoals(fetchedGoals);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, activeOnly]);

  const handleCreateGoal = useCallback(
    async (data: CreateGoalData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        const goalId = await createGoal(user.uid, data);
        return goalId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateGoal = useCallback(
    async (goalId: string, updates: Partial<Goal>): Promise<void> => {
      try {
        await updateGoal(goalId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteGoal = useCallback(
    async (goalId: string): Promise<void> => {
      try {
        await deleteGoal(goalId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleUpdateProgress = useCallback(
    async (goalId: string, progress: number): Promise<void> => {
      try {
        await updateGoalProgress(goalId, progress);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleToggleMilestone = useCallback(
    async (goalId: string, milestoneId: string, completed: boolean): Promise<void> => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      try {
        await toggleMilestone(goalId, milestoneId, completed, goal.milestones);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [goals]
  );

  const handleAddMilestone = useCallback(
    async (goalId: string, data: Partial<Milestone>): Promise<void> => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      try {
        await addMilestone(goalId, data, goal.milestones);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [goals]
  );

  const handleRemoveMilestone = useCallback(
    async (goalId: string, milestoneId: string): Promise<void> => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      try {
        await removeMilestone(goalId, milestoneId, goal.milestones);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [goals]
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    goals,
    loading,
    error,
    createGoal: handleCreateGoal,
    updateGoal: handleUpdateGoal,
    deleteGoal: handleDeleteGoal,
    updateProgress: handleUpdateProgress,
    toggleMilestone: handleToggleMilestone,
    addMilestone: handleAddMilestone,
    removeMilestone: handleRemoveMilestone,
    refresh,
  };
}

// Hook for goal statistics
export function useGoalStats(goals: Goal[]) {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    averageProgress: 0,
    upcomingDeadlines: 0,
  });

  useEffect(() => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const newStats = {
      total: goals.length,
      completed: goals.filter((g) => g.status === 'completed').length,
      inProgress: goals.filter((g) => g.status === 'in-progress').length,
      notStarted: goals.filter((g) => g.status === 'not-started').length,
      averageProgress: goals.length > 0
        ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
        : 0,
      upcomingDeadlines: goals.filter((g) => {
        if (!g.targetDate || g.status === 'completed') return false;
        const deadline = new Date(g.targetDate);
        return deadline >= now && deadline <= oneWeekFromNow;
      }).length,
    };

    setStats(newStats);
  }, [goals]);

  return stats;
}

// Hook for goals by category
export function useGoalsByCategory(goals: Goal[]) {
  const [goalsByCategory, setGoalsByCategory] = useState<Record<string, Goal[]>>({});

  useEffect(() => {
    const categorized: Record<string, Goal[]> = {};

    goals.forEach((goal) => {
      const category = goal.category || 'personal';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(goal);
    });

    setGoalsByCategory(categorized);
  }, [goals]);

  return goalsByCategory;
}
