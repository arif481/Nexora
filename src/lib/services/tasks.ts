/* eslint-disable @typescript-eslint/no-explicit-any */
// Tasks Service - Real-time Firestore operations
import {
  collection,
  addDoc,
  doc,
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
import { db, COLLECTIONS } from '../firebase';
import type { Task, Subtask } from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert Task from Firestore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertTaskFromFirestore = (doc: any): Task => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    projectId: data.projectId,
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    energyLevel: data.energyLevel || 'medium',
    dueDate: convertTimestamp(data.dueDate),
    dueTime: data.dueTime,
    estimatedDuration: data.estimatedDuration,
    actualDuration: data.actualDuration,
    tags: data.tags || [],
    category: data.category,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subtasks: (data.subtasks || []).map((s: any) => ({
      ...s,
      completedAt: convertTimestamp(s.completedAt),
    })),
    dependencies: data.dependencies || [],
    recurrence: data.recurrence,
    reminders: data.reminders || [],
    contextTriggers: data.contextTriggers || [],
    notes: data.notes,
    attachments: data.attachments || [],
    createdAt: convertTimestamp(data.createdAt) || new Date(),
    updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    completedAt: convertTimestamp(data.completedAt),
    aiSuggestions: data.aiSuggestions || [],
  };
};

// Create a new task
export const createTask = async (
  userId: string,
  taskData: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  const tasksRef = collection(db, COLLECTIONS.TASKS);

  const newTask = {
    userId,
    title: taskData.title || 'New Task',
    description: taskData.description || '',
    projectId: taskData.projectId || null,
    status: taskData.status || 'todo',
    priority: taskData.priority || 'medium',
    energyLevel: taskData.energyLevel || 'medium',
    dueDate: taskData.dueDate || null,
    dueTime: taskData.dueTime || null,
    estimatedDuration: taskData.estimatedDuration || null,
    actualDuration: taskData.actualDuration || null,
    tags: taskData.tags || [],
    category: taskData.category || null,
    subtasks: taskData.subtasks || [],
    dependencies: taskData.dependencies || [],
    recurrence: taskData.recurrence || null,
    reminders: taskData.reminders || [],
    contextTriggers: taskData.contextTriggers || [],
    notes: taskData.notes || null,
    attachments: taskData.attachments || [],
    aiSuggestions: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(tasksRef, newTask);
  return docRef.id;
};

// Update a task
export const updateTask = async (
  taskId: string,
  updates: Partial<Task>
): Promise<void> => {
  const taskRef = doc(db, COLLECTIONS.TASKS, taskId);

  // Remove undefined values and convert dates
  const cleanUpdates: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(updates).forEach(([key, value]: [string, any]) => {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });

  await updateDoc(taskRef, {
    ...cleanUpdates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a task
export const deleteTask = async (taskId: string): Promise<void> => {
  const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
  await deleteDoc(taskRef);
};

// Complete a task
export const completeTask = async (taskId: string): Promise<void> => {
  const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
  await updateDoc(taskRef, {
    status: 'done',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// Reopen a task
export const reopenTask = async (taskId: string): Promise<void> => {
  const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
  await updateDoc(taskRef, {
    status: 'todo',
    completedAt: null,
    updatedAt: serverTimestamp(),
  });
};

// Toggle subtask completion
export const toggleSubtask = async (
  taskId: string,
  subtaskId: string,
  completed: boolean,
  allSubtasks: Subtask[]
): Promise<void> => {
  const updatedSubtasks = allSubtasks.map(st =>
    st.id === subtaskId
      ? { ...st, completed, completedAt: completed ? new Date() : undefined }
      : st
  );

  const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
  await updateDoc(taskRef, {
    subtasks: updatedSubtasks,
    updatedAt: serverTimestamp(),
  });
};

// Add subtask to a task
export const addSubtask = async (
  taskId: string,
  subtaskTitle: string,
  existingSubtasks: Subtask[]
): Promise<void> => {
  const newSubtask: Subtask = {
    id: `subtask_${Date.now()}`,
    title: subtaskTitle,
    completed: false,
  };

  const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
  await updateDoc(taskRef, {
    subtasks: [...existingSubtasks, newSubtask],
    updatedAt: serverTimestamp(),
  });
};

// Subscribe to user's tasks in real-time
export const subscribeToTasks = (
  userId: string,
  callback: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const tasksRef = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map(convertTaskFromFirestore);
      callback(tasks);
    },
    (error) => {
      console.error('Error subscribing to tasks:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Subscribe to pending tasks only
export const subscribeToPendingTasks = (
  userId: string,
  callback: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const tasksRef = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksRef,
    where('userId', '==', userId),
    where('status', 'in', ['todo', 'in-progress', 'review']),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map(convertTaskFromFirestore);
      callback(tasks);
    },
    (error) => {
      console.error('Error subscribing to pending tasks:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Get tasks due today
export const subscribeToTasksDueToday = (
  userId: string,
  callback: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasksRef = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksRef,
    where('userId', '==', userId),
    where('dueDate', '>=', Timestamp.fromDate(today)),
    where('dueDate', '<', Timestamp.fromDate(tomorrow)),
    orderBy('dueDate', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map(convertTaskFromFirestore);
      callback(tasks);
    },
    (error) => {
      console.error('Error subscribing to today\'s tasks:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Batch update tasks
export const batchUpdateTasks = async (
  updates: { taskId: string; data: Partial<Task> }[]
): Promise<void> => {
  const batch = writeBatch(db);

  updates.forEach(({ taskId, data }) => {
    const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
    batch.update(taskRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
};

// Batch delete tasks
export const batchDeleteTasks = async (taskIds: string[]): Promise<void> => {
  const batch = writeBatch(db);

  taskIds.forEach((taskId) => {
    const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
    batch.delete(taskRef);
  });

  await batch.commit();
};
