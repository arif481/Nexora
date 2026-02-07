// Integrations Service - Manage Google Calendar connection
// Handles OAuth connections for external services

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types for integration data
export interface IntegrationCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
}

export interface GoogleCalendarIntegration {
  connected: boolean;
  email?: string;
  credentials?: IntegrationCredentials;
  syncEnabled?: boolean;
  syncMode?: 'add-only' | 'two-way';
  lastSynced?: Date;
}

export interface AppleCalendarIntegration {
  connected: boolean;
  accountLabel?: string;
  syncEnabled?: boolean;
  syncMode?: 'add-only';
  lastSynced?: Date;
}

export interface UserIntegrations {
  googleCalendar?: GoogleCalendarIntegration;
  appleCalendar?: AppleCalendarIntegration;
  updatedAt?: any;
}

export interface LinkedAccount {
  provider: 'google';
  providerId: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  linkedAt: Date;
}

export interface UserLinkedAccounts {
  google?: LinkedAccount;
}

// Collection reference
const INTEGRATIONS_COLLECTION = 'userIntegrations';
const LINKED_ACCOUNTS_COLLECTION = 'userLinkedAccounts';

// ====== INTEGRATIONS ======

// Get user integrations
export async function getUserIntegrations(userId: string): Promise<UserIntegrations | null> {
  const docRef = doc(db, INTEGRATIONS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserIntegrations;
  }
  return null;
}

// Subscribe to user integrations
export function subscribeToIntegrations(
  userId: string,
  callback: (integrations: UserIntegrations) => void
): () => void {
  const docRef = doc(db, INTEGRATIONS_COLLECTION, userId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserIntegrations);
    } else {
      callback({});
    }
  });
}

// Connect Google Calendar
export async function connectGoogleCalendar(
  userId: string,
  credentials: IntegrationCredentials,
  email: string
): Promise<void> {
  const docRef = doc(db, INTEGRATIONS_COLLECTION, userId);
  
  await setDoc(docRef, {
    googleCalendar: {
      connected: true,
      email,
      credentials,
      syncEnabled: true,
      syncMode: 'add-only',
      lastSynced: null,
    },
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Disconnect Google Calendar
export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  const docRef = doc(db, INTEGRATIONS_COLLECTION, userId);
  
  await updateDoc(docRef, {
    googleCalendar: {
      connected: false,
      syncEnabled: false,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function connectAppleCalendar(
  userId: string,
  accountLabel?: string
): Promise<void> {
  const docRef = doc(db, INTEGRATIONS_COLLECTION, userId);

  await setDoc(docRef, {
    appleCalendar: {
      connected: true,
      accountLabel: accountLabel || 'Apple Calendar',
      syncEnabled: true,
      syncMode: 'add-only',
      lastSynced: null,
    },
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function disconnectAppleCalendar(userId: string): Promise<void> {
  const docRef = doc(db, INTEGRATIONS_COLLECTION, userId);

  await updateDoc(docRef, {
    appleCalendar: {
      connected: false,
      syncEnabled: false,
    },
    updatedAt: serverTimestamp(),
  });
}

// ====== LINKED ACCOUNTS (Google Sign-In) ======

// Get user linked accounts
export async function getLinkedAccounts(userId: string): Promise<UserLinkedAccounts | null> {
  const docRef = doc(db, LINKED_ACCOUNTS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserLinkedAccounts;
  }
  return null;
}

// Subscribe to linked accounts
export function subscribeToLinkedAccounts(
  userId: string,
  callback: (accounts: UserLinkedAccounts) => void
): () => void {
  const docRef = doc(db, LINKED_ACCOUNTS_COLLECTION, userId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserLinkedAccounts);
    } else {
      callback({});
    }
  });
}

// Link an account
export async function linkAccount(
  userId: string,
  provider: 'google',
  data: Omit<LinkedAccount, 'provider' | 'linkedAt'>
): Promise<void> {
  const docRef = doc(db, LINKED_ACCOUNTS_COLLECTION, userId);
  
  await setDoc(docRef, {
    [provider]: {
      provider,
      ...data,
      linkedAt: new Date(),
    },
  }, { merge: true });
}

// Unlink an account
export async function unlinkAccount(
  userId: string,
  provider: 'google' | 'github' | 'twitter' | 'linkedin'
): Promise<void> {
  const docRef = doc(db, LINKED_ACCOUNTS_COLLECTION, userId);
  
  await updateDoc(docRef, {
    [provider]: deleteField(),
  });
}

export function getSlackAuthUrl(redirectUri: string): string {
  const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID || '';
  const scope = encodeURIComponent('chat:write channels:read');
  
  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
}

export function getFitbitAuthUrl(redirectUri: string): string {
  const clientId = process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID || '';
  const scope = encodeURIComponent('activity heartrate sleep weight');
  
  return `https://www.fitbit.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
}

export function getStripeConnectUrl(redirectUri: string): string {
  const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID || '';
  
  return `https://connect.stripe.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read_write`;
}

export function getGitHubAuthUrl(redirectUri: string): string {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
  const scope = encodeURIComponent('user:email read:user');
  
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
}

export function getTwitterAuthUrl(): string {
  // Twitter OAuth 2.0 - requires PKCE flow
  // This is a placeholder - actual implementation requires backend
  return '#';
}

export function getLinkedInAuthUrl(redirectUri: string): string {
  const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '';
  const scope = encodeURIComponent('r_liteprofile r_emailaddress');
  
  return `https://www.linkedin.com/oauth/v2/authorization?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
}
