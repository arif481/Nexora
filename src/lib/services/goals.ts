// Goals Service - Real-time Firestore operations
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
} from 'firebase/firestore';
import { db } from '../firebase';

// Goal type (not in main types, define locally)
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
  progress: number; // 0-100
  startDate?: Date;
  targetDate?: Date;
  completedDate?: Date;
  milestones: Milestone[];
  linkedTasks: string[];
  linkedHabits: string[];
  notes?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  targetDate?: Date;
  order: number;
}

const COLLECTION_NAME = 'goals';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert Goal from Firestore
const convertGoalFromFirestore = (doc: any): Goal => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    category: data.category || 'personal',
    priority: data.priority || 'medium',
    status: data.status || 'not-started',
    progress: data.progress || 0,
    startDate: convertTimestamp(data.startDate),
    targetDate: convertTimestamp(data.targetDate),
    completedDate: convertTimestamp(data.completedDate),
    milestones: (data.milestones || []).map((m: any) => ({
      ...m,
      completedAt: convertTimestamp(m.completedAt),
      targetDate: convertTimestamp(m.targetDate),
    })),
    linkedTasks: data.linkedTasks || [],
    linkedHabits: data.linkedHabits || [],
    notes: data.notes,
    color: data.color,
    icon: data.icon,
    createdAt: convertTimestamp(data.createdAt) || new Date(),
    updatedAt: convertTimestamp(data.updatedAt) || new Date(),
  };
};

// Create a new goal
export const createGoal = async (
  userId: string,
  goalData: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  const goalsRef = collection(db, COLLECTION_NAME);
  
  const newGoal = {
    userId,
    title: goalData.title || 'New Goal',
    description: goalData.description || '',
    category: goalData.category || 'personal',
    priority: goalData.priority || 'medium',
    status: goalData.status || 'not-started',
    progress: goalData.progress || 0,
    startDate: goalData.startDate || null,
    targetDate: goalData.targetDate || null,
    completedDate: null,
    milestones: goalData.milestones || [],
    linkedTasks: goalData.linkedTasks || [],
    linkedHabits: goalData.linkedHabits || [],
    notes: goalData.notes || null,
    color: goalData.color || '#06b6d4',
    icon: goalData.icon || 'target',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(goalsRef, newGoal);
  return docRef.id;
};

// Update a goal
export const updateGoal = async (
  goalId: string,
  updates: Partial<Goal>
): Promise<void> => {
  const goalRef = doc(db, COLLECTION_NAME, goalId);
  await updateDoc(goalRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a goal
export const deleteGoal = async (goalId: string): Promise<void> => {
  const goalRef = doc(db, COLLECTION_NAME, goalId);
  await deleteDoc(goalRef);
};

// Update goal progress
export const updateGoalProgress = async (
  goalId: string,
  progress: number
): Promise<void> => {
  const goalRef = doc(db, COLLECTION_NAME, goalId);
  const updates: any = {
    progress: Math.min(100, Math.max(0, progress)),
    updatedAt: serverTimestamp(),
  };

  // Auto-complete if progress is 100
  if (progress >= 100) {
    updates.status = 'completed';
    updates.completedDate = serverTimestamp();
  }

  await updateDoc(goalRef, updates);
};

// Toggle milestone completion
export const toggleMilestone = async (
  goalId: string,
  milestoneId: string,
  completed: boolean,
  allMilestones: Milestone[]
): Promise<void> => {
  const updatedMilestones = allMilestones.map(m =>
    m.id === milestoneId
      ? { ...m, completed, completedAt: completed ? new Date() : undefined }
      : m
  );

  // Calculate progress based on milestones
  const completedCount = updatedMilestones.filter(m => m.completed).length;
  const progress = updatedMilestones.length > 0
    ? Math.round((completedCount / updatedMilestones.length) * 100)
    : 0;

  const goalRef = doc(db, COLLECTION_NAME, goalId);
  const updates: any = {
    milestones: updatedMilestones,
    progress,
    updatedAt: serverTimestamp(),
  };

  if (progress >= 100) {
    updates.status = 'completed';
    updates.completedDate = serverTimestamp();
  }

  await updateDoc(goalRef, updates);
};

// Add milestone to a goal
export const addMilestone = async (
  goalId: string,
  milestoneData: Partial<Milestone>,
  existingMilestones: Milestone[]
): Promise<void> => {
  const newMilestone: Milestone = {
    id: `milestone_${Date.now()}`,
    title: milestoneData.title || 'New Milestone',
    description: milestoneData.description,
    completed: false,
    targetDate: milestoneData.targetDate,
    order: existingMilestones.length,
  };

  const goalRef = doc(db, COLLECTION_NAME, goalId);
  await updateDoc(goalRef, {
    milestones: [...existingMilestones, newMilestone],
    updatedAt: serverTimestamp(),
  });
};

// Remove milestone from a goal
export const removeMilestone = async (
  goalId: string,
  milestoneId: string,
  existingMilestones: Milestone[]
): Promise<void> => {
  const updatedMilestones = existingMilestones.filter(m => m.id !== milestoneId);
  
  // Recalculate progress
  const completedCount = updatedMilestones.filter(m => m.completed).length;
  const progress = updatedMilestones.length > 0
    ? Math.round((completedCount / updatedMilestones.length) * 100)
    : 0;

  const goalRef = doc(db, COLLECTION_NAME, goalId);
  await updateDoc(goalRef, {
    milestones: updatedMilestones,
    progress,
    updatedAt: serverTimestamp(),
  });
};

// Subscribe to user's goals
export const subscribeToGoals = (
  userId: string,
  callback: (goals: Goal[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const goalsRef = collection(db, COLLECTION_NAME);
  const q = query(
    goalsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const goals = snapshot.docs.map(convertGoalFromFirestore);
      callback(goals);
    },
    (error) => {
      console.error('Error subscribing to goals:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Subscribe to active goals only
export const subscribeToActiveGoals = (
  userId: string,
  callback: (goals: Goal[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const goalsRef = collection(db, COLLECTION_NAME);
  const q = query(
    goalsRef,
    where('userId', '==', userId),
    where('status', 'in', ['not-started', 'in-progress']),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const goals = snapshot.docs.map(convertGoalFromFirestore);
      callback(goals);
    },
    (error) => {
      console.error('Error subscribing to active goals:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Subscribe to goals by category
export const subscribeToGoalsByCategory = (
  userId: string,
  category: string,
  callback: (goals: Goal[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const goalsRef = collection(db, COLLECTION_NAME);
  const q = query(
    goalsRef,
    where('userId', '==', userId),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const goals = snapshot.docs.map(convertGoalFromFirestore);
      callback(goals);
    },
    (error) => {
      console.error('Error subscribing to goals by category:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Batch delete goals
export const batchDeleteGoals = async (goalIds: string[]): Promise<void> => {
  const batch = writeBatch(db);

  goalIds.forEach((goalId) => {
    const goalRef = doc(db, COLLECTION_NAME, goalId);
    batch.delete(goalRef);
  });

  await batch.commit();
};
