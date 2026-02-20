import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { IntegrationKey } from '@/lib/services/integrations';
import { createTransaction, updateTransaction } from '@/lib/services/finance';
import {
  updateActivityData,
  updateSleepData,
  updateStressData,
  updatePeriodData,
} from '@/lib/services/wellness';

export type SyncJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'partial';
export type SyncLogLevel = 'info' | 'warning' | 'error';
export type MappingEntityType = 'transaction' | 'calendarEvent' | 'wellnessEntry' | 'task';
export type InboxEntityType = 'transaction' | 'wellnessSnapshot' | 'calendarEvent' | 'task';
export type InboxStatus = 'pending' | 'processing' | 'processed' | 'failed';

export interface IntegrationSyncJob {
  id: string;
  userId: string;
  provider: IntegrationKey;
  reason: 'manual' | 'scheduled' | 'webhook';
  status: SyncJobStatus;
  summary?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

export interface IntegrationSyncLog {
  id: string;
  userId: string;
  provider: IntegrationKey;
  level: SyncLogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IntegrationMapping {
  id: string;
  userId: string;
  provider: IntegrationKey;
  entityType: MappingEntityType;
  externalId: string;
  internalId: string;
  checksum?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ImportedTransactionPayload {
  externalId: string;
  amount: number;
  currency?: string;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: Date;
  tags?: string[];
  checksum?: string;
}

interface ImportedWellnessPayload {
  date: Date;
  activity?: {
    steps?: number;
    activeMinutes?: number;
  };
  sleep?: {
    duration?: number;
    quality?: number;
    bedTime?: Date;
    wakeTime?: Date;
  };
  stress?: {
    level?: number;
    notes?: string;
    triggers?: string[];
    copingMethods?: string[];
  };
  period?: {
    isPeriodDay?: boolean;
    flowLevel?: 0 | 1 | 2 | 3 | 4;
    painLevel?: number;
    moodScore?: number;
    symptoms?: string[];
    comfortPreferences?: string[];
    cycleLength?: number;
    notes?: string;
  };
}

export interface IntegrationSyncInboxItem {
  id: string;
  userId: string;
  provider: IntegrationKey;
  entityType: InboxEntityType;
  payload: Record<string, unknown>;
  externalId?: string;
  checksum?: string;
  source?: string;
  status: InboxStatus;
  error?: string;
  syncJobId?: string;
  createdAt: Date;
  processedAt?: Date;
}

const INTEGRATION_SYNC_JOBS = COLLECTIONS.INTEGRATION_SYNC_JOBS;
const INTEGRATION_SYNC_LOGS = COLLECTIONS.INTEGRATION_SYNC_LOGS;
const INTEGRATION_MAPPINGS = COLLECTIONS.INTEGRATION_MAPPINGS;
const INTEGRATION_SYNC_INBOX = COLLECTIONS.INTEGRATION_SYNC_INBOX;

const convertTimestamp = (value: Timestamp | Date | null | undefined): Date => {
  if (!value) return new Date();
  if (value instanceof Timestamp) return value.toDate();
  return value instanceof Date ? value : new Date(value);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertSyncJob = (docSnap: any): IntegrationSyncJob => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    provider: data.provider,
    reason: data.reason,
    status: data.status,
    summary: data.summary,
    error: data.error,
    createdAt: convertTimestamp(data.createdAt),
    startedAt: data.startedAt ? convertTimestamp(data.startedAt) : undefined,
    finishedAt: data.finishedAt ? convertTimestamp(data.finishedAt) : undefined,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertSyncLog = (docSnap: any): IntegrationSyncLog => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    provider: data.provider,
    level: data.level,
    message: data.message,
    metadata: data.metadata,
    createdAt: convertTimestamp(data.createdAt),
  };
};

export const subscribeToSyncJobs = (
  userId: string,
  callback: (jobs: IntegrationSyncJob[]) => void,
  maxItems: number = 15
): (() => void) => {
  const jobsRef = collection(db, INTEGRATION_SYNC_JOBS);
  const jobsQuery = query(
    jobsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );

  return onSnapshot(jobsQuery, (snapshot) => {
    callback(snapshot.docs.map(convertSyncJob));
  });
};

export const subscribeToSyncLogs = (
  userId: string,
  callback: (logs: IntegrationSyncLog[]) => void,
  maxItems: number = 30
): (() => void) => {
  const logsRef = collection(db, INTEGRATION_SYNC_LOGS);
  const logsQuery = query(
    logsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );

  return onSnapshot(logsQuery, (snapshot) => {
    callback(snapshot.docs.map(convertSyncLog));
  });
};

export const updateSyncJobStatus = async (
  jobId: string,
  status: SyncJobStatus,
  updates: {
    summary?: string;
    error?: string;
  } = {}
): Promise<void> => {
  const jobRef = doc(db, INTEGRATION_SYNC_JOBS, jobId);

  const patch: Record<string, unknown> = {
    status,
  };

  if (status === 'running') {
    patch.startedAt = serverTimestamp();
  }

  if (status === 'succeeded' || status === 'failed' || status === 'partial') {
    patch.finishedAt = serverTimestamp();
  }

  if (updates.summary !== undefined) patch.summary = updates.summary;
  if (updates.error !== undefined) patch.error = updates.error;

  await updateDoc(jobRef, patch);
};

export const addSyncLog = async (
  userId: string,
  provider: IntegrationKey,
  level: SyncLogLevel,
  message: string,
  metadata?: Record<string, unknown>
): Promise<string> => {
  const logsRef = collection(db, INTEGRATION_SYNC_LOGS);
  const docRef = await addDoc(logsRef, {
    userId,
    provider,
    level,
    message,
    metadata: metadata || null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const enqueueIntegrationPayload = async (
  userId: string,
  provider: IntegrationKey,
  entityType: InboxEntityType,
  payload: Record<string, unknown>,
  options: {
    externalId?: string;
    checksum?: string;
    source?: string;
  } = {}
): Promise<string> => {
  const inboxRef = collection(db, INTEGRATION_SYNC_INBOX);
  const docRef = await addDoc(inboxRef, {
    userId,
    provider,
    entityType,
    payload,
    externalId: options.externalId || null,
    checksum: options.checksum || null,
    source: options.source || 'manual',
    status: 'pending',
    error: null,
    syncJobId: null,
    createdAt: serverTimestamp(),
    processedAt: null,
  });
  return docRef.id;
};

export const getIntegrationMapping = async (
  userId: string,
  provider: IntegrationKey,
  entityType: MappingEntityType,
  externalId: string
): Promise<IntegrationMapping | null> => {
  const mappingRef = collection(db, INTEGRATION_MAPPINGS);
  const mappingQuery = query(
    mappingRef,
    where('userId', '==', userId),
    where('provider', '==', provider),
    where('entityType', '==', entityType),
    where('externalId', '==', externalId),
    limit(1)
  );

  const snapshot = await getDocs(mappingQuery);
  if (snapshot.empty) return null;

  const item = snapshot.docs[0];
  const data = item.data();
  return {
    id: item.id,
    userId: data.userId,
    provider: data.provider,
    entityType: data.entityType,
    externalId: data.externalId,
    internalId: data.internalId,
    checksum: data.checksum,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const upsertIntegrationMapping = async (
  userId: string,
  provider: IntegrationKey,
  entityType: MappingEntityType,
  externalId: string,
  internalId: string,
  checksum?: string
): Promise<void> => {
  const existing = await getIntegrationMapping(userId, provider, entityType, externalId);

  if (existing) {
    await updateDoc(doc(db, INTEGRATION_MAPPINGS, existing.id), {
      internalId,
      checksum: checksum || existing.checksum || null,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await addDoc(collection(db, INTEGRATION_MAPPINGS), {
    userId,
    provider,
    entityType,
    externalId,
    internalId,
    checksum: checksum || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const upsertImportedTransaction = async (
  userId: string,
  provider: IntegrationKey,
  payload: ImportedTransactionPayload
): Promise<string> => {
  const existingMap = await getIntegrationMapping(userId, provider, 'transaction', payload.externalId);

  if (existingMap) {
    await updateTransaction(existingMap.internalId, {
      amount: payload.amount,
      currency: payload.currency || 'USD',
      category: payload.category,
      description: payload.description || '',
      date: payload.date,
      tags: payload.tags || [],
      externalSource: provider,
      externalId: payload.externalId,
      lastSyncedAt: new Date(),
    });

    await upsertIntegrationMapping(
      userId,
      provider,
      'transaction',
      payload.externalId,
      existingMap.internalId,
      payload.checksum
    );

    return existingMap.internalId;
  }

  const internalId = await createTransaction(userId, {
    amount: payload.amount,
    currency: payload.currency || 'USD',
    type: payload.type,
    category: payload.category,
    description: payload.description || '',
    date: payload.date,
    tags: payload.tags || [],
    externalSource: provider,
    externalId: payload.externalId,
    importedAt: new Date(),
    lastSyncedAt: new Date(),
  });

  await upsertIntegrationMapping(
    userId,
    provider,
    'transaction',
    payload.externalId,
    internalId,
    payload.checksum
  );

  return internalId;
};

export const applyImportedWellnessSnapshot = async (
  userId: string,
  provider: IntegrationKey,
  payload: ImportedWellnessPayload
): Promise<void> => {
  if (payload.activity) {
    await updateActivityData(userId, payload.date, {
      steps: payload.activity.steps,
      activeMinutes: payload.activity.activeMinutes,
    });
  }

  if (payload.sleep) {
    await updateSleepData(userId, payload.date, {
      duration: payload.sleep.duration,
      quality: payload.sleep.quality,
      bedTime: payload.sleep.bedTime,
      wakeTime: payload.sleep.wakeTime,
    });
  }

  if (payload.stress) {
    await updateStressData(userId, payload.date, {
      level: payload.stress.level,
      notes: payload.stress.notes,
      triggers: payload.stress.triggers,
      copingMethods: payload.stress.copingMethods,
    });
  }

  if (payload.period) {
    await updatePeriodData(userId, payload.date, {
      isPeriodDay: payload.period.isPeriodDay,
      flowLevel: payload.period.flowLevel,
      painLevel: payload.period.painLevel,
      moodScore: payload.period.moodScore,
      symptoms: payload.period.symptoms,
      comfortPreferences: payload.period.comfortPreferences,
      cycleLength: payload.period.cycleLength,
      notes: payload.period.notes,
    });
  }

  await addSyncLog(userId, provider, 'info', 'Imported wellness snapshot', {
    date: payload.date.toISOString(),
    hasActivity: Boolean(payload.activity),
    hasSleep: Boolean(payload.sleep),
    hasStress: Boolean(payload.stress),
    hasPeriod: Boolean(payload.period),
  });
};

export const markIntegrationSyncedNow = async (
  userId: string,
  provider: IntegrationKey,
  summary?: string
): Promise<void> => {
  const integrationsRef = doc(db, COLLECTIONS.USER_INTEGRATIONS, userId);
  await setDoc(
    integrationsRef,
    {
      [provider]: {
        lastSynced: new Date(),
        status: 'idle',
        lastError: '',
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  if (summary) {
    await addSyncLog(userId, provider, 'info', summary);
  }
};
