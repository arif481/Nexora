// Firebase Configuration
// Replace with your Firebase project configuration

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
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
let db: Firestore;
let analytics: Analytics | null = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);

// Initialize Firestore with persistent cache (replaces deprecated enableIndexedDbPersistence)
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  // Firestore already initialized, get the existing instance
  db = getFirestore(app);
}

const storage: FirebaseStorage = getStorage(app);

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
  FINANCE_PEOPLE_ACCOUNTS: 'financePeopleAccounts',
  FINANCE_PEOPLE_ENTRIES: 'financePeopleEntries',
  FINANCE_PEOPLE_TYPES: 'financePeopleTypes',
  AI_MEMORIES: 'aiMemories',
  PREDICTIONS: 'predictions',
  NOTIFICATIONS: 'notifications',
  ACHIEVEMENTS: 'achievements',
  KNOWLEDGE_NODES: 'knowledgeNodes',
  FOCUS_BLOCKS: 'focusBlocks',
  FOCUS_SESSIONS: 'focusSessions',
  USER_INTEGRATIONS: 'userIntegrations',
  USER_LINKED_ACCOUNTS: 'userLinkedAccounts',
  INTEGRATION_SYNC_JOBS: 'integrationSyncJobs',
  INTEGRATION_SYNC_LOGS: 'integrationSyncLogs',
  INTEGRATION_MAPPINGS: 'integrationMappings',
  INTEGRATION_SYNC_INBOX: 'integrationSyncInbox',
} as const;

// Storage paths
export const STORAGE_PATHS = {
  PROFILE_IMAGES: 'profile-images',
  ATTACHMENTS: 'attachments',
  NOTES_MEDIA: 'notes-media',
  JOURNAL_MEDIA: 'journal-media',
  VOICE_RECORDINGS: 'voice-recordings',
} as const;
