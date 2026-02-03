'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { FocusSession } from '@/types';
import { 
  addFocusSession,
  subscribeToWellnessEntry,
} from '@/lib/services/wellness';

interface FocusTask {
  id: string;
  name: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
}

interface UseFocusReturn {
  sessions: FocusSession[];
  tasks: FocusTask[];
  loading: boolean;
  error: string | null;
  addSession: (session: Omit<FocusSession, 'id'>) => Promise<void>;
  addTask: (task: Omit<FocusTask, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<FocusTask>) => void;
  removeTask: (taskId: string) => void;
  refresh: () => void;
}

export function useFocus(): UseFocusReturn {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load focus sessions from wellness entries for today
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const unsubscribe = subscribeToWellnessEntry(
      user.uid,
      today,
      (entry) => {
        if (entry) {
          setSessions(entry.focusSessions || []);
        } else {
          setSessions([]);
        }
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

  // Load tasks from localStorage for now (can be extended to Firestore)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('focusTasks');
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks));
        } catch (e) {
          console.error('Failed to parse focus tasks:', e);
        }
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && tasks.length > 0) {
      localStorage.setItem('focusTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleAddSession = useCallback(
    async (session: Omit<FocusSession, 'id'>): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      try {
        await addFocusSession(user.uid, today, session);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const addTask = useCallback((task: Omit<FocusTask, 'id'>) => {
    const newTask: FocusTask = {
      ...task,
      id: `task_${Date.now()}`,
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<FocusTask>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    sessions,
    tasks,
    loading,
    error,
    addSession: handleAddSession,
    addTask,
    updateTask,
    removeTask,
    refresh,
  };
}

export function useFocusStats(sessions: FocusSession[]) {
  const [stats, setStats] = useState({
    todayPomodoros: 0,
    todayMinutes: 0,
    weekPomodoros: 0,
    weekMinutes: 0,
    streak: 0,
  });

  useEffect(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const todaySessions = sessions.filter(s => 
      s.endTime && new Date(s.endTime) >= startOfDay
    );
    
    const todayPomodoros = todaySessions.filter(s => s.type === 'pomodoro').length;
    const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // For weekly stats, we'd need to query more data
    // For now, use today's data as placeholder
    const weekPomodoros = todayPomodoros;
    const weekMinutes = todayMinutes;

    setStats({
      todayPomodoros,
      todayMinutes,
      weekPomodoros,
      weekMinutes,
      streak: 0, // Would need historical data
    });
  }, [sessions]);

  return stats;
}
