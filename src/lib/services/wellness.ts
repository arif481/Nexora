// Wellness Service - Real-time Firestore operations
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
  getDoc,
  limit,
  setDoc,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type {
  WellnessEntry,
  SleepData,
  ActivityData,
  NutritionData,
  StressData,
  PeriodData,
  FocusSession,
  Exercise,
  Meal,
} from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert WellnessEntry from Firestore
const convertWellnessFromFirestore = (doc: any): WellnessEntry => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    date: convertTimestamp(data.date),
    sleep: {
      bedTime: data.sleep?.bedTime ? convertTimestamp(data.sleep.bedTime) : undefined,
      wakeTime: data.sleep?.wakeTime ? convertTimestamp(data.sleep.wakeTime) : undefined,
      duration: data.sleep?.duration || 0,
      quality: data.sleep?.quality || 5,
      interruptions: data.sleep?.interruptions || 0,
      notes: data.sleep?.notes,
    },
    activity: {
      steps: data.activity?.steps,
      activeMinutes: data.activity?.activeMinutes || 0,
      exercises: (data.activity?.exercises || []).map((e: any) => ({
        type: e.type,
        duration: e.duration,
        intensity: e.intensity || 'medium',
        notes: e.notes,
      })),
    },
    nutrition: {
      meals: (data.nutrition?.meals || []).map((m: any) => ({
        type: m.type,
        time: convertTimestamp(m.time),
        description: m.description,
        healthRating: m.healthRating,
      })),
      waterIntake: data.nutrition?.waterIntake || 0,
      notes: data.nutrition?.notes,
    },
    stress: {
      level: data.stress?.level || 5,
      triggers: data.stress?.triggers || [],
      copingMethods: data.stress?.copingMethods || [],
      notes: data.stress?.notes,
    },
    period: {
      isPeriodDay: data.period?.isPeriodDay || false,
      flowLevel: data.period?.flowLevel || 0,
      painLevel: data.period?.painLevel || 0,
      moodScore: data.period?.moodScore || 5,
      symptoms: data.period?.symptoms || [],
      comfortPreferences: data.period?.comfortPreferences || [],
      cycleLength: data.period?.cycleLength || 28,
      notes: data.period?.notes,
    },
    focusSessions: (data.focusSessions || []).map((f: any) => ({
      id: f.id,
      startTime: convertTimestamp(f.startTime),
      endTime: convertTimestamp(f.endTime),
      duration: f.duration,
      type: f.type || 'pomodoro',
      taskId: f.taskId,
      distractions: f.distractions || 0,
      quality: f.quality || 3,
    })),
    createdAt: convertTimestamp(data.createdAt),
  };
};

// Get or create wellness entry for a date
export const getOrCreateWellnessEntry = async (
  userId: string,
  date: Date
): Promise<WellnessEntry> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (entryDoc.exists()) {
    return convertWellnessFromFirestore(entryDoc);
  }

  // Create new entry - MUST include userId for Firestore rules
  const newEntry = {
    userId, // Required for Firestore security rules
    date,
    sleep: {
      duration: 0,
      quality: 5,
      interruptions: 0,
    },
    activity: {
      activeMinutes: 0,
      exercises: [],
    },
    nutrition: {
      meals: [],
      waterIntake: 0,
    },
    stress: {
      level: 5,
      triggers: [],
      copingMethods: [],
    },
    period: {
      isPeriodDay: false,
      flowLevel: 0,
      painLevel: 0,
      moodScore: 5,
      symptoms: [],
      comfortPreferences: [],
      cycleLength: 28,
    },
    focusSessions: [],
    createdAt: serverTimestamp(),
  };

  await setDoc(entryRef, newEntry);
  
  return {
    id: entryId,
    userId,
    date,
    sleep: newEntry.sleep as any,
    activity: newEntry.activity as any,
    nutrition: newEntry.nutrition as any,
    stress: newEntry.stress as any,
    focusSessions: [],
    createdAt: new Date(),
  } as WellnessEntry;
};

// Update sleep data
export const updateSleepData = async (
  userId: string,
  date: Date,
  sleepData: Partial<SleepData>
): Promise<void> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (!entryDoc.exists()) {
    await getOrCreateWellnessEntry(userId, date);
  }

  const currentSleep = entryDoc.exists() ? entryDoc.data().sleep || {} : {};
  
  await updateDoc(entryRef, {
    sleep: { ...currentSleep, ...sleepData },
  });
};

// Update activity data
export const updateActivityData = async (
  userId: string,
  date: Date,
  activityData: Partial<ActivityData>
): Promise<void> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (!entryDoc.exists()) {
    await getOrCreateWellnessEntry(userId, date);
  }

  const currentActivity = entryDoc.exists() ? entryDoc.data().activity || {} : {};
  
  await updateDoc(entryRef, {
    activity: { ...currentActivity, ...activityData },
  });
};

// Add exercise
export const addExercise = async (
  userId: string,
  date: Date,
  exercise: Exercise
): Promise<void> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (!entryDoc.exists()) {
    await getOrCreateWellnessEntry(userId, date);
  }

  const currentExercises = entryDoc.exists() ? entryDoc.data().activity?.exercises || [] : [];
  const currentActiveMinutes = entryDoc.exists() ? entryDoc.data().activity?.activeMinutes || 0 : 0;
  
  await updateDoc(entryRef, {
    'activity.exercises': [...currentExercises, exercise],
    'activity.activeMinutes': currentActiveMinutes + exercise.duration,
  });
};

// Update nutrition data
export const updateNutritionData = async (
  userId: string,
  date: Date,
  nutritionData: Partial<NutritionData>
): Promise<void> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (!entryDoc.exists()) {
    await getOrCreateWellnessEntry(userId, date);
  }

  const currentNutrition = entryDoc.exists() ? entryDoc.data().nutrition || {} : {};
  
  await updateDoc(entryRef, {
    nutrition: { ...currentNutrition, ...nutritionData },
  });
};

// Add meal
export const addMeal = async (
  userId: string,
  date: Date,
  meal: Meal
): Promise<void> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (!entryDoc.exists()) {
    await getOrCreateWellnessEntry(userId, date);
  }

  const currentMeals = entryDoc.exists() ? entryDoc.data().nutrition?.meals || [] : [];
  
  await updateDoc(entryRef, {
    'nutrition.meals': [...currentMeals, meal],
  });
};

// Update water intake
export const updateWaterIntake = async (
  userId: string,
  date: Date,
  amount: number
): Promise<void> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (!entryDoc.exists()) {
    await getOrCreateWellnessEntry(userId, date);
  }

  const currentIntake = entryDoc.exists() ? entryDoc.data().nutrition?.waterIntake || 0 : 0;
  
  await updateDoc(entryRef, {
    'nutrition.waterIntake': currentIntake + amount,
  });
};

// Update stress data
export const updateStressData = async (
  userId: string,
  date: Date,
  stressData: Partial<StressData>
): Promise<void> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (!entryDoc.exists()) {
    await getOrCreateWellnessEntry(userId, date);
  }

  const currentStress = entryDoc.exists() ? entryDoc.data().stress || {} : {};
  
  await updateDoc(entryRef, {
    stress: { ...currentStress, ...stressData },
  });
};

// Update period tracking data
export const updatePeriodData = async (
  userId: string,
  date: Date,
  periodData: Partial<PeriodData>
): Promise<void> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;

  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (!entryDoc.exists()) {
    await getOrCreateWellnessEntry(userId, date);
  }

  const currentPeriod = entryDoc.exists() ? entryDoc.data().period || {} : {};

  await updateDoc(entryRef, {
    period: { ...currentPeriod, ...periodData },
  });
};

// Add focus session
export const addFocusSession = async (
  userId: string,
  date: Date,
  session: Omit<FocusSession, 'id'>
): Promise<void> => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  const entryDoc = await getDoc(entryRef);

  if (!entryDoc.exists()) {
    await getOrCreateWellnessEntry(userId, date);
  }

  const currentSessions = entryDoc.exists() ? entryDoc.data().focusSessions || [] : [];
  
  const newSession: FocusSession = {
    ...session,
    id: `focus_${Date.now()}`,
  };

  await updateDoc(entryRef, {
    focusSessions: [...currentSessions, newSession],
  });
};

// Subscribe to wellness entry for a specific date
export const subscribeToWellnessEntry = (
  userId: string,
  date: Date,
  callback: (entry: WellnessEntry | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const dateKey = date.toISOString().split('T')[0];
  const entryId = `${userId}_${dateKey}`;
  
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);

  const unsubscribe = onSnapshot(
    entryRef,
    (doc) => {
      if (doc.exists()) {
        callback(convertWellnessFromFirestore(doc));
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to wellness entry:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Subscribe to wellness entries for a date range
export const subscribeToWellnessRange = (
  userId: string,
  startDate: Date,
  endDate: Date,
  callback: (entries: WellnessEntry[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const entriesRef = collection(db, COLLECTIONS.WELLNESS_ENTRIES);
  const q = query(
    entriesRef,
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map(convertWellnessFromFirestore);
      callback(entries);
    },
    (error) => {
      console.error('Error subscribing to wellness range:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Get recent wellness entries
export const subscribeToRecentWellness = (
  userId: string,
  days: number,
  callback: (entries: WellnessEntry[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  return subscribeToWellnessRange(userId, startDate, endDate, callback, onError);
};

// Delete wellness entry
export const deleteWellnessEntry = async (entryId: string): Promise<void> => {
  const entryRef = doc(db, COLLECTIONS.WELLNESS_ENTRIES, entryId);
  await deleteDoc(entryRef);
};
