// Firebase Configuration
// Replace with your Firebase project configuration

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCJPyALcs2RW5Aq7f9b5q1VPNbNFkpeOkc",
  authDomain: "nexora-400d6.firebaseapp.com",
  projectId: "nexora-400d6",
  storageBucket: "nexora-400d6.firebasestorage.app",
  messagingSenderId: "794160209685",
  appId: "1:794160209685:web:1faceb677b7b9bac2a531c",
  measurementId: "G-2PN6JCSJS8",
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

// Initialize Analytics only on client side
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  CALENDAR_EVENTS: 'calendarEvents',
  NOTES: 'notes',
  JOURNAL_ENTRIES: 'journalEntries',
  HABITS: 'habits',
  SUBJECTS: 'subjects',
  WELLNESS_ENTRIES: 'wellnessEntries',
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  SUBSCRIPTIONS: 'subscriptions',
  AI_MEMORIES: 'aiMemories',
  PREDICTIONS: 'predictions',
  NOTIFICATIONS: 'notifications',
  ACHIEVEMENTS: 'achievements',
  KNOWLEDGE_NODES: 'knowledgeNodes',
  FOCUS_BLOCKS: 'focusBlocks',
  FOCUS_SESSIONS: 'focusSessions',
} as const;

// Storage paths
export const STORAGE_PATHS = {
  PROFILE_IMAGES: 'profile-images',
  ATTACHMENTS: 'attachments',
  NOTES_MEDIA: 'notes-media',
  JOURNAL_MEDIA: 'journal-media',
  VOICE_RECORDINGS: 'voice-recordings',
} as const;
