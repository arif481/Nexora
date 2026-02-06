'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { FocusSession } from '@/types';
import { 
  addFocusSession,
  subscribeToWellnessEntry,
} from '@/lib/services/wellness';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

interface FocusTask {
  id: string;
  name: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  userId?: string;
  createdAt?: Date;
}

interface UseFocusReturn {
  sessions: FocusSession[];
  tasks: FocusTask[];
  loading: boolean;
  error: string | null;
  addSession: (session: Omit<FocusSession, 'id'>) => Promise<void>;
  addTask: (task: Omit<FocusTask, 'id'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<FocusTask>) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
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

  // Load tasks from Firebase focusBlocks collection
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const q = query(
      collection(db, 'focusBlocks'),
      where('userId', '==', user.uid),
      where('completed', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const focusTasks: FocusTask[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as FocusTask[];
        setTasks(focusTasks);
      },
      (err) => {
        console.error('Focus tasks error:', err);
        // Fall back to local storage if Firebase fails
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
      }
    );

    return () => unsubscribe();
  }, [user]);

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

  const addTask = useCallback(async (task: Omit<FocusTask, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await addDoc(collection(db, 'focusBlocks'), {
        ...task,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      // Fallback to local storage
      const newTask: FocusTask = {
        ...task,
        id: `task_${Date.now()}`,
      };
      setTasks(prev => {
        const updated = [...prev, newTask];
        localStorage.setItem('focusTasks', JSON.stringify(updated));
        return updated;
      });
    }
  }, [user]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<FocusTask>) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'focusBlocks', taskId), updates);
    } catch (err: any) {
      // Fallback to local state
      setTasks(prev => {
        const updated = prev.map(t => t.id === taskId ? { ...t, ...updates } : t);
        localStorage.setItem('focusTasks', JSON.stringify(updated));
        return updated;
      });
    }
  }, [user]);

  const removeTask = useCallback(async (taskId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'focusBlocks', taskId));
    } catch (err: any) {
      // Fallback to local state
      setTasks(prev => {
        const updated = prev.filter(t => t.id !== taskId);
        localStorage.setItem('focusTasks', JSON.stringify(updated));
        return updated;
      });
    }
  }, [user]);

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
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayPomodoros: 0,
    todayMinutes: 0,
    weekPomodoros: 0,
    weekMinutes: 0,
    streak: 0,
  });

  useEffect(() => {
    if (!user) {
      setStats({
        todayPomodoros: 0,
        todayMinutes: 0,
        weekPomodoros: 0,
        weekMinutes: 0,
        streak: 0,
      });
      return;
    }

    const calculateStats = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      // Calculate today's stats from provided sessions
      const todaySessions = sessions.filter(s => 
        s.endTime && new Date(s.endTime) >= startOfDay
      );
      
      const todayPomodoros = todaySessions.filter(s => s.type === 'pomodoro').length;
      const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);

      // Query for weekly stats from wellness entries
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const weekQuery = query(
          collection(db, 'wellnessEntries'),
          where('userId', '==', user.uid),
          where('date', '>=', startOfWeek)
        );
        
        const weekSnapshot = await getDocs(weekQuery);
        let weekPomodoros = 0;
        let weekMinutes = 0;
        
        weekSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const focusSessions = data.focusSessions || [];
          weekPomodoros += focusSessions.filter((s: any) => s.type === 'pomodoro').length;
          weekMinutes += focusSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
        });

        // Calculate streak - count consecutive days with focus sessions
        let streak = 0;
        let checkDate = new Date(startOfDay);
        checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday
        
        // First, check if user has focused today
        if (todayPomodoros > 0) {
          streak = 1;
        }
        
        // Query up to 30 days back for streak calculation
        const thirtyDaysAgo = new Date(startOfDay);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const streakQuery = query(
          collection(db, 'wellnessEntries'),
          where('userId', '==', user.uid),
          where('date', '>=', thirtyDaysAgo),
          where('date', '<', startOfDay)
        );
        
        const streakSnapshot = await getDocs(streakQuery);
        const daysWithFocus = new Set<string>();
        
        streakSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const focusSessions = data.focusSessions || [];
          const pomodoroCount = focusSessions.filter((s: any) => s.type === 'pomodoro').length;
          if (pomodoroCount > 0) {
            const entryDate = data.date?.toDate?.() || new Date(data.date);
            daysWithFocus.add(entryDate.toDateString());
          }
        });
        
        // Count consecutive days from yesterday backwards
        while (checkDate >= thirtyDaysAgo) {
          if (daysWithFocus.has(checkDate.toDateString())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        setStats({
          todayPomodoros,
          todayMinutes,
          weekPomodoros,
          weekMinutes,
          streak,
        });
      } catch (error) {
        console.error('Error calculating focus stats:', error);
        // Fallback to today's data only
        setStats({
          todayPomodoros,
          todayMinutes,
          weekPomodoros: todayPomodoros,
          weekMinutes: todayMinutes,
          streak: todayPomodoros > 0 ? 1 : 0,
        });
      }
    };

    calculateStats();
  }, [user, sessions]);

  return stats;
}
