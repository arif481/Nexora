// Integrations Service - unified provider model for external sync

import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

// Types for integration data
export interface IntegrationCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
}

export type IntegrationHealthStatus = 'idle' | 'syncing' | 'degraded' | 'error';
export type IntegrationPlatform = 'web' | 'ios' | 'android' | 'cloud';

export interface BaseIntegration {
  connected: boolean;
  syncEnabled?: boolean;
  syncMode?: 'add-only' | 'pull' | 'push' | 'two-way';
  status?: IntegrationHealthStatus;
  platform?: IntegrationPlatform;
  scopes?: string[];
  autoImport?: {
    calendar?: boolean;
    wellness?: boolean;
    finance?: boolean;
    tasks?: boolean;
  };
  syncFrequencyMinutes?: number;
  lastSynced?: Date | null;
  lastError?: string;
}

export interface GoogleCalendarIntegration extends BaseIntegration {
  email?: string;
  credentials?: IntegrationCredentials;
  syncMode?: 'add-only' | 'two-way';
}

export interface AppleCalendarIntegration extends BaseIntegration {
  accountLabel?: string;
  syncMode?: 'add-only';
}

export interface HealthIntegration extends BaseIntegration {
  provider: 'apple-health' | 'health-connect' | 'fitbit' | 'google-fit';
  metrics: string[];
}

export interface FinanceIntegration extends BaseIntegration {
  provider: 'plaid' | 'bank-bridge';
  institution?: string;
  accountMask?: string;
}

export interface TaskIntegration extends BaseIntegration {
  provider: 'todoist' | 'notion' | 'google-tasks';
  accountLabel?: string;
}

export interface MobileBridgeIntegration extends BaseIntegration {
  provider: 'nexora-mobile-bridge';
  appInstalled?: boolean;
  platforms?: Array<'ios' | 'android'>;
}

export interface UserIntegrations {
  googleCalendar?: GoogleCalendarIntegration;
  appleCalendar?: AppleCalendarIntegration;
  appleHealth?: HealthIntegration;
  healthConnect?: HealthIntegration;
  fitbit?: HealthIntegration;
  googleFit?: HealthIntegration;
  plaid?: FinanceIntegration;
  todoist?: TaskIntegration;
  notion?: TaskIntegration;
  mobileBridge?: MobileBridgeIntegration;
  updatedAt?: any;
}

export type IntegrationKey = Exclude<keyof UserIntegrations, 'updatedAt'>;

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

export interface SupportedIntegrationProvider {
  key: IntegrationKey;
  name: string;
  category: 'calendar' | 'wellness' | 'finance' | 'tasks' | 'bridge';
  platform: IntegrationPlatform;
  description: string;
  defaultSyncMode: BaseIntegration['syncMode'];
}

export const SUPPORTED_INTEGRATIONS: SupportedIntegrationProvider[] = [
  {
    key: 'googleCalendar',
    name: 'Google Calendar',
    category: 'calendar',
    platform: 'web',
    description: 'Sync events and reminders from Google Calendar.',
    defaultSyncMode: 'two-way',
  },
  {
    key: 'appleCalendar',
    name: 'Apple Calendar',
    category: 'calendar',
    platform: 'ios',
    description: 'Add-only event export for Apple Calendar.',
    defaultSyncMode: 'add-only',
  },
  {
    key: 'appleHealth',
    name: 'Apple Health',
    category: 'wellness',
    platform: 'ios',
    description: 'Import sleep, steps, workouts, and cycle logs via mobile bridge.',
    defaultSyncMode: 'pull',
  },
  {
    key: 'healthConnect',
    name: 'Health Connect',
    category: 'wellness',
    platform: 'android',
    description: 'Import wellness metrics from Android Health Connect.',
    defaultSyncMode: 'pull',
  },
  {
    key: 'fitbit',
    name: 'Fitbit',
    category: 'wellness',
    platform: 'cloud',
    description: 'Sync Fitbit health and activity data.',
    defaultSyncMode: 'pull',
  },
  {
    key: 'googleFit',
    name: 'Google Fit',
    category: 'wellness',
    platform: 'android',
    description: 'Sync activity and sleep from Google Fit.',
    defaultSyncMode: 'pull',
  },
  {
    key: 'plaid',
    name: 'Plaid Finance',
    category: 'finance',
    platform: 'cloud',
    description: 'Import transactions from linked bank and card accounts.',
    defaultSyncMode: 'pull',
  },
  {
    key: 'todoist',
    name: 'Todoist',
    category: 'tasks',
    platform: 'cloud',
    description: 'Keep tasks and due dates synced with Todoist.',
    defaultSyncMode: 'two-way',
  },
  {
    key: 'notion',
    name: 'Notion',
    category: 'tasks',
    platform: 'cloud',
    description: 'Import linked task databases and milestones from Notion.',
    defaultSyncMode: 'pull',
  },
  {
    key: 'mobileBridge',
    name: 'Nexora Mobile Bridge',
    category: 'bridge',
    platform: 'cloud',
    description: 'Device bridge for iOS/Android protected data ingestion.',
    defaultSyncMode: 'push',
  },
];

const INTEGRATIONS_COLLECTION = COLLECTIONS.USER_INTEGRATIONS;
const LINKED_ACCOUNTS_COLLECTION = COLLECTIONS.USER_LINKED_ACCOUNTS;
const INTEGRATION_SYNC_JOBS = COLLECTIONS.INTEGRATION_SYNC_JOBS;

const setIntegration = async (
  userId: string,
  key: IntegrationKey,
  value: Partial<BaseIntegration> & Record<string, unknown>
): Promise<void> => {
  const docRef = doc(db, INTEGRATIONS_COLLECTION, userId);
  await setDoc(
    docRef,
    {
      [key]: value,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

// ====== INTEGRATIONS ======

export async function getUserIntegrations(userId: string): Promise<UserIntegrations | null> {
  const docRef = doc(db, INTEGRATIONS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserIntegrations;
  }
  return null;
}

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

export async function connectDataIntegration(
  userId: string,
  key: IntegrationKey,
  overrides: Record<string, unknown> = {}
): Promise<void> {
  await setIntegration(userId, key, {
    connected: true,
    syncEnabled: true,
    status: 'idle',
    syncFrequencyMinutes: 30,
    lastError: '',
    ...overrides,
  });
}

export async function disconnectDataIntegration(userId: string, key: IntegrationKey): Promise<void> {
  await setIntegration(userId, key, {
    connected: false,
    syncEnabled: false,
    status: 'idle',
  });
}

export async function updateIntegrationStatus(
  userId: string,
  key: IntegrationKey,
  updates: Partial<BaseIntegration>
): Promise<void> {
  await setIntegration(userId, key, updates as Record<string, unknown>);
}

export async function queueIntegrationSyncJob(
  userId: string,
  provider: IntegrationKey,
  reason: 'manual' | 'scheduled' | 'webhook' = 'manual'
): Promise<string> {
  const jobsRef = collection(db, INTEGRATION_SYNC_JOBS);
  const docRef = await addDoc(jobsRef, {
    userId,
    provider,
    reason,
    status: 'queued',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Connect Google Calendar
export async function connectGoogleCalendar(
  userId: string,
  credentials: IntegrationCredentials,
  email: string
): Promise<void> {
  await setIntegration(userId, 'googleCalendar', {
    connected: true,
    email,
    credentials,
    syncEnabled: true,
    syncMode: 'add-only',
    status: 'idle',
    autoImport: {
      calendar: true,
    },
    lastSynced: null,
  });
}

// Disconnect Google Calendar
export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await disconnectDataIntegration(userId, 'googleCalendar');
}

export async function connectAppleCalendar(
  userId: string,
  accountLabel?: string
): Promise<void> {
  await setIntegration(userId, 'appleCalendar', {
    connected: true,
    accountLabel: accountLabel || 'Apple Calendar',
    syncEnabled: true,
    syncMode: 'add-only',
    status: 'idle',
    autoImport: {
      calendar: true,
    },
    lastSynced: null,
  });
}

export async function disconnectAppleCalendar(userId: string): Promise<void> {
  await disconnectDataIntegration(userId, 'appleCalendar');
}

// ====== LINKED ACCOUNTS (Google Sign-In) ======

export async function getLinkedAccounts(userId: string): Promise<UserLinkedAccounts | null> {
  const docRef = doc(db, LINKED_ACCOUNTS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserLinkedAccounts;
  }
  return null;
}

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
