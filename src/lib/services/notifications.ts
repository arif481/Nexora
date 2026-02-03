// Notifications Service - Real-time Firestore operations
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
  limit,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';

export interface Notification {
  id: string;
  userId: string;
  type: 'task' | 'calendar' | 'ai' | 'achievement' | 'wellness' | 'habit' | 'system';
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
}

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert notification from Firestore
const convertNotificationFromFirestore = (doc: any): Notification => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    type: data.type || 'system',
    title: data.title || '',
    body: data.body || '',
    timestamp: convertTimestamp(data.timestamp),
    read: data.read || false,
    actionUrl: data.actionUrl,
    data: data.data,
  };
};

// Subscribe to user's notifications
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
  limitCount: number = 50
) => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(convertNotificationFromFirestore);
    callback(notifications);
  });
};

// Create a notification
export const createNotification = async (
  userId: string,
  notification: Omit<Notification, 'id' | 'userId' | 'timestamp' | 'read'>
): Promise<string> => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  
  const newNotification = {
    userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    read: false,
    actionUrl: notification.actionUrl || null,
    data: notification.data || null,
    timestamp: serverTimestamp(),
  };

  const docRef = await addDoc(notificationsRef, newNotification);
  return docRef.id;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  await updateDoc(notificationRef, { read: true });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });
  
  await batch.commit();
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  await deleteDoc(notificationRef);
};

// Delete all notifications for a user
export const clearAllNotifications = async (userId: string): Promise<void> => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(notificationsRef, where('userId', '==', userId));
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};

// Create task due notification
export const createTaskDueNotification = async (
  userId: string,
  taskTitle: string,
  taskId: string,
  dueIn: string
): Promise<string> => {
  return createNotification(userId, {
    type: 'task',
    title: 'Task Due Soon',
    body: `"${taskTitle}" is due ${dueIn}`,
    actionUrl: `/tasks?id=${taskId}`,
    data: { taskId },
  });
};

// Create calendar event notification
export const createEventNotification = async (
  userId: string,
  eventTitle: string,
  eventId: string,
  startsIn: string
): Promise<string> => {
  return createNotification(userId, {
    type: 'calendar',
    title: 'Upcoming Event',
    body: `"${eventTitle}" starts ${startsIn}`,
    actionUrl: `/calendar?id=${eventId}`,
    data: { eventId },
  });
};

// Create achievement notification
export const createAchievementNotification = async (
  userId: string,
  achievement: string,
  description: string
): Promise<string> => {
  return createNotification(userId, {
    type: 'achievement',
    title: `Achievement Unlocked! 🎉`,
    body: `${achievement}: ${description}`,
  });
};

// Create habit streak notification
export const createHabitStreakNotification = async (
  userId: string,
  habitName: string,
  streakCount: number
): Promise<string> => {
  return createNotification(userId, {
    type: 'habit',
    title: `Habit Streak! 🔥`,
    body: `You've maintained "${habitName}" for ${streakCount} days!`,
    actionUrl: '/habits',
  });
};

// Create wellness reminder notification
export const createWellnessNotification = async (
  userId: string,
  title: string,
  body: string
): Promise<string> => {
  return createNotification(userId, {
    type: 'wellness',
    title,
    body,
    actionUrl: '/wellness',
  });
};
