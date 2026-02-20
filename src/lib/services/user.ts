// User Service - Real-time Firestore operations
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { User, UserPreferences, UserStats, GenderIdentity } from '@/types';
import { DEFAULT_COUNTRY_CODE, getCountryPreference } from '@/lib/constants/regional';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Default user preferences
const detectedRegion = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1]?.toUpperCase();
const detectedCountry = getCountryPreference(detectedRegion || DEFAULT_COUNTRY_CODE);
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || detectedCountry.timezone;

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  accentColor: '#06b6d4',
  language: 'en',
  timezone: detectedTimezone,
  country: detectedCountry.code,
  currency: detectedCountry.currency,
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    taskReminders: true,
    calendarAlerts: true,
    insightNotifications: true,
    focusModeExceptions: [],
  },
  privacy: {
    dataCollection: true,
    analyticsEnabled: true,
    localStorageOnly: false,
    encryptionEnabled: false,
  },
  dataPermissions: {
    allowHealthDataSync: true,
    allowFinanceDataSync: true,
    allowCalendarDataSync: true,
    allowTaskDataSync: true,
    allowLocationDataSync: false,
    allowBackgroundSync: true,
    allowAIExternalDataAccess: true,
  },
  aiPersonality: {
    name: 'Nexora',
    tone: 'friendly',
    verbosity: 'balanced',
    proactivity: 'medium',
  },
};

const mergePreferences = (preferences?: Partial<UserPreferences>): UserPreferences => {
  return {
    ...defaultPreferences,
    ...(preferences || {}),
    notifications: {
      ...defaultPreferences.notifications,
      ...(preferences?.notifications || {}),
    },
    privacy: {
      ...defaultPreferences.privacy,
      ...(preferences?.privacy || {}),
    },
    dataPermissions: {
      ...defaultPreferences.dataPermissions,
      ...(preferences?.dataPermissions || {}),
    },
    aiPersonality: {
      ...defaultPreferences.aiPersonality,
      ...(preferences?.aiPersonality || {}),
    },
  };
};

// Default user stats
const defaultStats: UserStats = {
  level: 1,
  experience: 0,
  streakDays: 0,
  tasksCompleted: 0,
  focusMinutes: 0,
  journalEntries: 0,
  habitsCompleted: 0,
};

// Convert User from Firestore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertUserFromFirestore = (doc: any): User => {
  const data = doc.data();
  return {
    id: doc.id,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    gender: data.gender,
    phone: data.phone,
    location: data.location,
    bio: data.bio,
    createdAt: convertTimestamp(data.createdAt),
    lastLoginAt: convertTimestamp(data.lastLoginAt),
    preferences: mergePreferences(data.preferences),
    stats: data.stats || defaultStats,
  };
};

// Create or update user profile
export const createOrUpdateUser = async (
  userId: string,
  userData: {
    email: string;
    displayName?: string;
    photoURL?: string;
  }
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    // Update existing user
    await updateDoc(userRef, {
      email: userData.email,
      displayName: userData.displayName || userDoc.data().displayName,
      photoURL: userData.photoURL || userDoc.data().photoURL,
      lastLoginAt: serverTimestamp(),
    });
  } else {
    // Create new user
    await setDoc(userRef, {
      email: userData.email,
      displayName: userData.displayName || userData.email.split('@')[0],
      photoURL: userData.photoURL || null,
      preferences: defaultPreferences,
      stats: defaultStats,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  }
};

// Get user profile
export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  return convertUserFromFirestore(userDoc);
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: {
    displayName?: string;
    photoURL?: string;
    gender?: GenderIdentity;
    phone?: string;
    location?: string;
    bio?: string;
  }
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  // Filter out undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );
  await updateDoc(userRef, cleanUpdates);
};

// Update user preferences
export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const currentPreferences = mergePreferences(userDoc.data().preferences);

  await updateDoc(userRef, {
    preferences: mergePreferences({ ...currentPreferences, ...preferences }),
  });
};

// Update user stats
export const updateUserStats = async (
  userId: string,
  stats: Partial<UserStats>
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const currentStats = userDoc.data().stats || defaultStats;

  await updateDoc(userRef, {
    stats: { ...currentStats, ...stats },
  });
};

// Increment a stat
export const incrementUserStat = async (
  userId: string,
  statKey: keyof UserStats,
  amount: number = 1
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const currentStats = userDoc.data().stats || defaultStats;
  const currentValue = currentStats[statKey] || 0;

  // Calculate new experience and level if incrementing stats
  const updates: Partial<UserStats> = {
    [statKey]: currentValue + amount,
  };

  // Award XP for certain actions
  const xpRewards: Record<string, number> = {
    tasksCompleted: 10,
    journalEntries: 15,
    habitsCompleted: 5,
    focusMinutes: 0.1, // 1 XP per 10 minutes
  };

  if (xpRewards[statKey]) {
    const xpGained = Math.floor(amount * xpRewards[statKey]);
    const newExperience = (currentStats.experience || 0) + xpGained;

    // Calculate level (100 XP per level)
    const newLevel = Math.floor(newExperience / 100) + 1;

    updates.experience = newExperience;
    updates.level = newLevel;
  }

  await updateDoc(userRef, {
    stats: { ...currentStats, ...updates },
  });
};

// Subscribe to user profile changes
export const subscribeToUser = (
  userId: string,
  callback: (user: User | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);

  const unsubscribe = onSnapshot(
    userRef,
    (doc) => {
      if (doc.exists()) {
        callback(convertUserFromFirestore(doc));
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to user:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Update last login time
export const updateLastLogin = async (userId: string): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    lastLoginAt: serverTimestamp(),
  });
};

// Update streak
export const updateStreak = async (userId: string): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  const lastLogin = userData.lastLoginAt?.toDate() || new Date(0);
  const now = new Date();

  // Check if last login was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const lastLoginDay = new Date(lastLogin);
  lastLoginDay.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  let newStreak = userData.stats?.streakDays || 0;

  if (lastLoginDay.getTime() === yesterday.getTime()) {
    // Consecutive day - increment streak
    newStreak += 1;
  } else if (lastLoginDay.getTime() < yesterday.getTime()) {
    // Missed a day - reset streak
    newStreak = 1;
  }
  // If same day, don't change streak

  await updateDoc(userRef, {
    'stats.streakDays': newStreak,
    lastLoginAt: serverTimestamp(),
  });
};
