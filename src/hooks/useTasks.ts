'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Task, TaskStatus, TaskPriority, Subtask } from '@/types';
import {
  subscribeToTasks,
  subscribeToPendingTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  reopenTask,
  toggleSubtask,
  addSubtask,
  batchDeleteTasks,
} from '@/lib/services/tasks';
import { createAchievementNotification } from '@/lib/services/notifications';

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (data: CreateTaskData) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  reopenTask: (taskId: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  batchDelete: (taskIds: string[]) => Promise<void>;
  refresh: () => void;
}

interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  dueTime?: string;
  estimatedDuration?: number;
  tags?: string[];
  category?: string;
  subtasks?: Subtask[];
}

export function useTasks(pendingOnly: boolean = false): UseTasksReturn {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const subscribeFn = pendingOnly ? subscribeToPendingTasks : subscribeToTasks;
    
    const unsubscribe = subscribeFn(
      user.uid,
      (fetchedTasks) => {
        setTasks(fetchedTasks);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Tasks subscription error:', err);
        setError(err.message);
        setLoading(false);
        setTasks([]); // Set empty array so UI doesn't hang
      }
    );

    return () => unsubscribe();
  }, [user, pendingOnly]);

  const handleCreateTask = useCallback(
    async (data: CreateTaskData): Promise<string> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        const taskId = await createTask(user.uid, data);
        return taskId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<Task>): Promise<void> => {
      try {
        await updateTask(taskId, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleDeleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      try {
        await deleteTask(taskId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleCompleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      try {
        await completeTask(taskId);
        
        // Count completed tasks for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedToday = tasks.filter(t => {
          const completedAt = t.completedAt ? new Date(t.completedAt) : null;
          return completedAt && completedAt >= today;
        }).length + 1; // +1 for the one we just completed
        
        // Create achievement notification at milestones
        if (completedToday === 5) {
          await createAchievementNotification(
            user.uid,
            'Productive Day!',
            'You completed 5 tasks today. Keep it up!'
          );
        } else if (completedToday === 10) {
          await createAchievementNotification(
            user.uid,
            'Task Master!',
            'You completed 10 tasks today. Amazing productivity!'
          );
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user, tasks]
  );

  const handleReopenTask = useCallback(
    async (taskId: string): Promise<void> => {
      try {
        await reopenTask(taskId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const handleToggleSubtask = useCallback(
    async (taskId: string, subtaskId: string, completed: boolean): Promise<void> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Task not found');

      try {
        await toggleSubtask(taskId, subtaskId, completed, task.subtasks);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [tasks]
  );

  const handleAddSubtask = useCallback(
    async (taskId: string, title: string): Promise<void> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Task not found');

      try {
        await addSubtask(taskId, title, task.subtasks);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [tasks]
  );

  const handleBatchDelete = useCallback(
    async (taskIds: string[]): Promise<void> => {
      try {
        await batchDeleteTasks(taskIds);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    tasks,
    loading,
    error,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    completeTask: handleCompleteTask,
    reopenTask: handleReopenTask,
    toggleSubtask: handleToggleSubtask,
    addSubtask: handleAddSubtask,
    batchDelete: handleBatchDelete,
    refresh,
  };
}

// Hook for filtering tasks
export function useFilteredTasks(
  tasks: Task[],
  filters: {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    category?: string;
    search?: string;
    dueDateRange?: { start: Date; end: Date };
  }
) {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);

  useEffect(() => {
    let result = [...tasks];

    if (filters.status && filters.status.length > 0) {
      result = result.filter((task) => filters.status!.includes(task.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      result = result.filter((task) => filters.priority!.includes(task.priority));
    }

    if (filters.category) {
      result = result.filter((task) => task.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters.dueDateRange) {
      result = result.filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= filters.dueDateRange!.start && dueDate <= filters.dueDateRange!.end;
      });
    }

    setFilteredTasks(result);
  }, [tasks, filters]);

  return filteredTasks;
}

// Hook for task statistics - fetches its own data if tasks not provided
export function useTaskStats(providedTasks?: Task[]) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(!providedTasks);
  
  // Subscribe to tasks if not provided
  useEffect(() => {
    if (providedTasks) {
      setTasks(providedTasks);
      return;
    }
    
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToTasks(
      user.uid,
      (fetchedTasks) => {
        setTasks(fetchedTasks);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user, providedTasks]);

  const taskList = providedTasks || tasks;

  const stats = {
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    dueToday: 0,
    highPriority: 0,
    completionRate: 0,
    loading,
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  stats.total = taskList.length;
  stats.completed = taskList.filter((t) => t.status === 'completed').length;
  stats.pending = taskList.filter((t) => t.status === 'pending').length;
  stats.inProgress = taskList.filter((t) => t.status === 'in-progress').length;
  stats.overdue = taskList.filter((t) => {
    if (!t.dueDate || t.status === 'completed') return false;
    return new Date(t.dueDate) < today;
  }).length;
  stats.dueToday = taskList.filter((t) => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  }).length;
  stats.highPriority = taskList.filter(
    (t) => (t.priority === 'high' || t.priority === 'critical') && t.status !== 'completed'
  ).length;
  stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return stats;
}
