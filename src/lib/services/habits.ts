// Habits Service - Real-time Firestore operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { Habit, HabitCompletion, HabitCategory, HabitFrequency } from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp || new Date();
};

// Convert Habit from Firestore
const convertHabitFromFirestore = (doc: any): Habit => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    description: data.description,
    category: data.category,
    frequency: data.frequency,
    targetDays: data.targetDays || [],
    targetTime: data.targetTime,
    duration: data.duration,
    reminderEnabled: data.reminderEnabled || false,
    reminderTime: data.reminderTime,
    cue: data.cue,
    routine: data.routine,
    reward: data.reward,
    identity: data.identity,
    streak: data.streak || 0,
    longestStreak: data.longestStreak || 0,
    completions: (data.completions || []).map((c: any) => ({
      ...c,
      date: convertTimestamp(c.date),
    })),
    triggers: data.triggers || [],
    isPositive: data.isPositive !== false,
    status: data.status || 'active',
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    // Additional UI properties
    icon: data.icon,
    color: data.color,
  } as Habit & { icon?: string; color?: string };
};

// Create a new habit
export const createHabit = async (
  userId: string,
  habitData: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  const habitsRef = collection(db, COLLECTIONS.HABITS);
  
  const newHabit = {
    userId,
    name: habitData.name || 'New Habit',
    description: habitData.description || '',
    category: habitData.category || 'other',
    frequency: habitData.frequency || 'daily',
    targetDays: habitData.targetDays || [0, 1, 2, 3, 4, 5, 6],
    targetTime: habitData.targetTime,
    duration: habitData.duration,
    reminderEnabled: habitData.reminderEnabled || false,
    reminderTime: habitData.reminderTime,
    cue: habitData.cue,
    routine: habitData.routine || habitData.name || 'New Habit',
    reward: habitData.reward,
    identity: habitData.identity || '',
    streak: 0,
    longestStreak: 0,
    completions: [],
    triggers: habitData.triggers || [],
    isPositive: habitData.isPositive !== false,
    status: 'active',
    icon: (habitData as any).icon || 'target',
    color: (habitData as any).color || 'cyan',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(habitsRef, newHabit);
  return docRef.id;
};

// Update a habit
export const updateHabit = async (
  habitId: string,
  updates: Partial<Habit>
): Promise<void> => {
  const habitRef = doc(db, COLLECTIONS.HABITS, habitId);
  await updateDoc(habitRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a habit
export const deleteHabit = async (habitId: string): Promise<void> => {
  const habitRef = doc(db, COLLECTIONS.HABITS, habitId);
  await deleteDoc(habitRef);
};

// Toggle habit completion for a specific date
export const toggleHabitCompletion = async (
  habitId: string,
  date: Date,
  completed: boolean,
  notes?: string
): Promise<void> => {
  const habitRef = doc(db, COLLECTIONS.HABITS, habitId);
  const habitDoc = await getDoc(habitRef);
  
  if (!habitDoc.exists()) {
    throw new Error('Habit not found');
  }

  const habitData = habitDoc.data();
  const dateKey = date.toISOString().split('T')[0];
  
  // Get existing completions
  const completions: HabitCompletion[] = habitData.completions || [];
  
  // Find if there's already a completion for this date
  const existingIndex = completions.findIndex(
    (c: any) => {
      const completionDate = c.date instanceof Timestamp 
        ? c.date.toDate().toISOString().split('T')[0]
        : new Date(c.date).toISOString().split('T')[0];
      return completionDate === dateKey;
    }
  );

  if (completed) {
    if (existingIndex >= 0) {
      completions[existingIndex] = {
        date,
        completed: true,
        notes,
      };
    } else {
      completions.push({
        date,
        completed: true,
        notes,
      });
    }
  } else {
    if (existingIndex >= 0) {
      completions.splice(existingIndex, 1);
    }
  }

  // Calculate streak
  const { streak, longestStreak } = calculateStreak(completions, habitData.longestStreak || 0);

  await updateDoc(habitRef, {
    completions,
    streak,
    longestStreak,
    updatedAt: serverTimestamp(),
  });
};

// Calculate streak from completions
const calculateStreak = (
  completions: HabitCompletion[],
  currentLongestStreak: number
): { streak: number; longestStreak: number } => {
  if (completions.length === 0) {
    return { streak: 0, longestStreak: currentLongestStreak };
  }

  // Sort completions by date descending
  const sortedCompletions = [...completions]
    .filter(c => c.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedCompletions.length === 0) {
    return { streak: 0, longestStreak: currentLongestStreak };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastCompletion = new Date(sortedCompletions[0].date);
  lastCompletion.setHours(0, 0, 0, 0);

  // If last completion isn't today or yesterday, streak is 0
  if (lastCompletion < yesterday) {
    return { streak: 0, longestStreak: currentLongestStreak };
  }

  // Count consecutive days
  let streak = 1;
  let currentDate = lastCompletion;

  for (let i = 1; i < sortedCompletions.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    
    const completionDate = new Date(sortedCompletions[i].date);
    completionDate.setHours(0, 0, 0, 0);

    if (completionDate.getTime() === prevDate.getTime()) {
      streak++;
      currentDate = completionDate;
    } else {
      break;
    }
  }

  const longestStreak = Math.max(streak, currentLongestStreak);

  return { streak, longestStreak };
};

// Subscribe to user's habits in real-time
export const subscribeToHabits = (
  userId: string,
  callback: (habits: Habit[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const habitsRef = collection(db, COLLECTIONS.HABITS);
  const q = query(
    habitsRef,
    where('userId', '==', userId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const habits = snapshot.docs.map(convertHabitFromFirestore);
      callback(habits);
    },
    (error) => {
      console.error('Error subscribing to habits:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Get habit completion status for a date range
export const getHabitCompletionsForRange = (
  habit: Habit,
  startDate: Date,
  endDate: Date
): Record<string, boolean> => {
  const completions: Record<string, boolean> = {};
  
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    const isCompleted = habit.completions?.some(c => {
      const completionDate = new Date(c.date).toISOString().split('T')[0];
      return completionDate === dateKey && c.completed;
    }) || false;
    completions[dateKey] = isCompleted;
    current.setDate(current.getDate() + 1);
  }

  return completions;
};

// Batch update habits (for reordering, etc.)
export const batchUpdateHabits = async (
  updates: { habitId: string; data: Partial<Habit> }[]
): Promise<void> => {
  const batch = writeBatch(db);

  updates.forEach(({ habitId, data }) => {
    const habitRef = doc(db, COLLECTIONS.HABITS, habitId);
    batch.update(habitRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
};
