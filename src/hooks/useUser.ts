'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { User, UserPreferences, UserStats } from '@/types';
import {
  subscribeToUser,
  getUser,
  updateUserProfile,
  updateUserPreferences,
  updateUserStats,
  incrementUserStat,
} from '@/lib/services/user';

interface UseUserReturn {
  profile: User | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: { displayName?: string; photoURL?: string; phone?: string; location?: string; bio?: string }) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updateStats: (stats: Partial<UserStats>) => Promise<void>;
  incrementStat: (statKey: keyof UserStats, amount?: number) => Promise<void>;
  refresh: () => void;
}

export function useUser(): UseUserReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const unsubscribe = subscribeToUser(
      user.uid,
      (fetchedProfile) => {
        setProfile(fetchedProfile);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('User profile subscription error:', err);
        setError(err.message);
        setProfile(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleUpdateProfile = useCallback(
    async (updates: { displayName?: string; photoURL?: string; phone?: string; location?: string; bio?: string }): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await updateUserProfile(user.uid, updates);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdatePreferences = useCallback(
    async (preferences: Partial<UserPreferences>): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await updateUserPreferences(user.uid, preferences);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateStats = useCallback(
    async (stats: Partial<UserStats>): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await updateUserStats(user.uid, stats);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  const handleIncrementStat = useCallback(
    async (statKey: keyof UserStats, amount: number = 1): Promise<void> => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await incrementUserStat(user.uid, statKey, amount);
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
    profile,
    loading,
    error,
    updateProfile: handleUpdateProfile,
    updatePreferences: handleUpdatePreferences,
    updateStats: handleUpdateStats,
    incrementStat: handleIncrementStat,
    refresh,
  };
}

// Hook for user preferences only
export function useUserPreferences() {
  const { profile } = useUser();
  return profile?.preferences || null;
}

// Hook for user stats only
export function useUserStats() {
  const { profile } = useUser();
  return profile?.stats || null;
}

// Hook for checking user level progress
export function useLevelProgress() {
  const { profile } = useUser();
  
  if (!profile?.stats) {
    return {
      level: 1,
      experience: 0,
      nextLevelXP: 100,
      progress: 0,
    };
  }

  const { level, experience } = profile.stats;
  const currentLevelXP = (level - 1) * 100;
  const nextLevelXP = level * 100;
  const progressXP = experience - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const progress = (progressXP / requiredXP) * 100;

  return {
    level,
    experience,
    nextLevelXP,
    progress: Math.min(100, Math.max(0, progress)),
  };
}
