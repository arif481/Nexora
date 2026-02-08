import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from './firebase-admin.mjs';

const COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  CALENDAR_EVENTS: 'calendarEvents',
  WELLNESS_ENTRIES: 'wellnessEntries',
  TRANSACTIONS: 'transactions',
  USER_INTEGRATIONS: 'userIntegrations',
  INTEGRATION_SYNC_JOBS: 'integrationSyncJobs',
  INTEGRATION_SYNC_LOGS: 'integrationSyncLogs',
  INTEGRATION_MAPPINGS: 'integrationMappings',
  INTEGRATION_SYNC_INBOX: 'integrationSyncInbox',
};

const PROVIDER_PERMISSION_KEY = {
  appleHealth: 'allowHealthDataSync',
  healthConnect: 'allowHealthDataSync',
  fitbit: 'allowHealthDataSync',
  googleFit: 'allowHealthDataSync',
  plaid: 'allowFinanceDataSync',
  googleCalendar: 'allowCalendarDataSync',
  appleCalendar: 'allowCalendarDataSync',
  todoist: 'allowTaskDataSync',
  notion: 'allowTaskDataSync',
  mobileBridge: null,
};

const TASK_STATUSES = new Set(['pending', 'in-progress', 'completed', 'cancelled', 'snoozed']);
const TASK_PRIORITIES = new Set(['critical', 'high', 'medium', 'low']);
const ENERGY_LEVELS = new Set(['high', 'medium', 'low']);
const EVENT_CATEGORIES = new Set(['work', 'personal', 'health', 'social', 'learning', 'rest', 'other']);

const MAX_JOBS = Number.parseInt(process.env.SYNC_WORKER_MAX_JOBS || '20', 10);
const MAX_ITEMS_PER_JOB = Number.parseInt(process.env.SYNC_WORKER_MAX_ITEMS_PER_JOB || '150', 10);
const INBOX_BATCH_SIZE = Number.parseInt(process.env.SYNC_WORKER_INBOX_BATCH_SIZE || '25', 10);

const nowIso = () => new Date().toISOString();

const log = (message, data) => {
  if (data === undefined) {
    console.log(`[sync-worker ${nowIso()}] ${message}`);
    return;
  }
  console.log(`[sync-worker ${nowIso()}] ${message}`, data);
};

const asObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
};

const asString = (value, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const asStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item).trim()).filter(Boolean);
};

const toDate = (value, fallback = new Date()) => {
  if (!value) return fallback;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
};

const toTimestampOrNull = (value) => {
  if (!value) return null;
  const date = toDate(value, null);
  if (!date) return null;
  return Timestamp.fromDate(date);
};

const dateKey = (date) => toDate(date).toISOString().slice(0, 10);

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickDefined = (value) => Object.fromEntries(
  Object.entries(value).filter(([, item]) => item !== undefined)
);

const getCalendarSource = (provider) => {
  if (provider === 'googleCalendar') return 'google';
  if (provider === 'appleCalendar') return 'apple';
  return 'nexora';
};

const buildSummary = (stats) => {
  return [
    `${stats.processed} item(s) imported`,
    `${stats.created} created`,
    `${stats.updated} updated`,
    `${stats.failed} failed`,
    `${stats.skipped} skipped`,
    `tx:${stats.transactions}`,
    `wellness:${stats.wellness}`,
    `events:${stats.calendarEvents}`,
    `tasks:${stats.tasks}`,
  ].join(' | ');
};

const addSyncLog = async (db, userId, provider, level, message, metadata = null) => {
  await db.collection(COLLECTIONS.INTEGRATION_SYNC_LOGS).add({
    userId,
    provider,
    level,
    message,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  });
};

const markJob = async (db, jobId, status, updates = {}) => {
  await db.collection(COLLECTIONS.INTEGRATION_SYNC_JOBS).doc(jobId).update({
    status,
    summary: updates.summary || '',
    error: updates.error || '',
    finishedAt: FieldValue.serverTimestamp(),
  });
};

const setIntegrationStatus = async (db, userId, provider, updates) => {
  await db.collection(COLLECTIONS.USER_INTEGRATIONS).doc(userId).set({
    [provider]: updates,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
};

const getUserPreferences = async (db, userId) => {
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
  if (!userDoc.exists) {
    throw new Error(`User ${userId} does not exist`);
  }

  const userData = asObject(userDoc.data());
  const preferences = asObject(userData.preferences);
  const dataPermissions = asObject(preferences.dataPermissions);

  return {
    allowHealthDataSync: dataPermissions.allowHealthDataSync !== false,
    allowFinanceDataSync: dataPermissions.allowFinanceDataSync !== false,
    allowCalendarDataSync: dataPermissions.allowCalendarDataSync !== false,
    allowTaskDataSync: dataPermissions.allowTaskDataSync !== false,
    allowLocationDataSync: dataPermissions.allowLocationDataSync === true,
    allowBackgroundSync: dataPermissions.allowBackgroundSync !== false,
    allowAIExternalDataAccess: dataPermissions.allowAIExternalDataAccess !== false,
  };
};

const getProviderState = async (db, userId, provider) => {
  const docSnap = await db.collection(COLLECTIONS.USER_INTEGRATIONS).doc(userId).get();
  if (!docSnap.exists) return {};
  const data = asObject(docSnap.data());
  return asObject(data[provider]);
};

const claimNextJob = async (db) => {
  const queued = await db
    .collection(COLLECTIONS.INTEGRATION_SYNC_JOBS)
    .where('status', '==', 'queued')
    .orderBy('createdAt', 'asc')
    .limit(1)
    .get();

  if (queued.empty) return null;

  const candidate = queued.docs[0].ref;
  const claimed = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(candidate);
    if (!snapshot.exists) return null;

    const data = asObject(snapshot.data());
    if (data.status !== 'queued') return null;

    tx.update(candidate, {
      status: 'running',
      startedAt: FieldValue.serverTimestamp(),
      error: '',
      summary: '',
    });

    return {
      id: snapshot.id,
      ...data,
    };
  });

  return claimed;
};

const getMapping = async (db, userId, provider, entityType, externalId) => {
  const snapshot = await db
    .collection(COLLECTIONS.INTEGRATION_MAPPINGS)
    .where('userId', '==', userId)
    .where('provider', '==', provider)
    .where('entityType', '==', entityType)
    .where('externalId', '==', externalId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0];
};

const upsertMapping = async (db, userId, provider, entityType, externalId, internalId, checksum = null) => {
  const existing = await getMapping(db, userId, provider, entityType, externalId);

  if (existing) {
    await existing.ref.update({
      internalId,
      checksum: checksum || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return existing.id;
  }

  const docRef = await db.collection(COLLECTIONS.INTEGRATION_MAPPINGS).add({
    userId,
    provider,
    entityType,
    externalId,
    internalId,
    checksum: checksum || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
};

const upsertTransaction = async (db, item, payload) => {
  const externalId = asString(payload.externalId || item.externalId || item.id).trim() || item.id;
  const amount = toNumber(payload.amount, 0);
  const type = payload.type === 'income' ? 'income' : 'expense';
  const category = asString(payload.category, 'other');
  const date = toDate(payload.date || payload.postedAt || item.createdAt);
  const description = asString(payload.description, '');
  const currency = asString(payload.currency, 'USD');
  const tags = asStringArray(payload.tags);

  const mapping = await getMapping(db, item.userId, item.provider, 'transaction', externalId);

  const patch = {
    userId: item.userId,
    amount,
    currency,
    type,
    category,
    description,
    date: Timestamp.fromDate(date),
    recurring: false,
    recurrenceRule: null,
    tags,
    attachments: [],
    externalSource: item.provider,
    externalId,
    lastSyncedAt: FieldValue.serverTimestamp(),
  };

  if (mapping) {
    await db.collection(COLLECTIONS.TRANSACTIONS).doc(mapping.data().internalId).update(patch);

    await upsertMapping(
      db,
      item.userId,
      item.provider,
      'transaction',
      externalId,
      mapping.data().internalId,
      asString(payload.checksum || item.checksum || '')
    );

    return { created: 0, updated: 1, kind: 'transactions' };
  }

  const createdDoc = await db.collection(COLLECTIONS.TRANSACTIONS).add({
    ...patch,
    importedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  await upsertMapping(
    db,
    item.userId,
    item.provider,
    'transaction',
    externalId,
    createdDoc.id,
    asString(payload.checksum || item.checksum || '')
  );

  return { created: 1, updated: 0, kind: 'transactions' };
};

const ensureWellnessEntry = async (db, userId, date) => {
  const docId = `${userId}_${dateKey(date)}`;
  const ref = db.collection(COLLECTIONS.WELLNESS_ENTRIES).doc(docId);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      userId,
      date: Timestamp.fromDate(date),
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
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return ref;
};

const upsertWellnessSnapshot = async (db, item, payload) => {
  const date = toDate(payload.date || payload.recordedAt || item.createdAt);
  const entryRef = await ensureWellnessEntry(db, item.userId, date);
  const existing = asObject((await entryRef.get()).data());

  const activityPayload = asObject(payload.activity);
  const sleepPayload = asObject(payload.sleep);
  const stressPayload = asObject(payload.stress);
  const periodPayload = asObject(payload.period);

  const sleepPatch = pickDefined({
    duration: sleepPayload.duration !== undefined ? toNumber(sleepPayload.duration, 0) : undefined,
    quality: sleepPayload.quality !== undefined ? toNumber(sleepPayload.quality, 5) : undefined,
    interruptions: sleepPayload.interruptions !== undefined ? toNumber(sleepPayload.interruptions, 0) : undefined,
    notes: sleepPayload.notes !== undefined ? asString(sleepPayload.notes, '') : undefined,
    bedTime: sleepPayload.bedTime ? toTimestampOrNull(sleepPayload.bedTime) : undefined,
    wakeTime: sleepPayload.wakeTime ? toTimestampOrNull(sleepPayload.wakeTime) : undefined,
  });

  const updateData = {
    date: Timestamp.fromDate(date),
  };

  if (Object.keys(activityPayload).length > 0) {
    updateData.activity = {
      ...asObject(existing.activity),
      ...pickDefined({
        steps: activityPayload.steps !== undefined ? toNumber(activityPayload.steps, 0) : undefined,
        activeMinutes: activityPayload.activeMinutes !== undefined ? toNumber(activityPayload.activeMinutes, 0) : undefined,
        exercises: Array.isArray(activityPayload.exercises) ? activityPayload.exercises : asObject(existing.activity).exercises || [],
      }),
    };
  }

  if (Object.keys(sleepPatch).length > 0) {
    updateData.sleep = {
      ...asObject(existing.sleep),
      ...sleepPatch,
    };
  }

  if (Object.keys(stressPayload).length > 0) {
    updateData.stress = {
      ...asObject(existing.stress),
      ...pickDefined({
        level: stressPayload.level !== undefined ? toNumber(stressPayload.level, 5) : undefined,
        triggers: stressPayload.triggers !== undefined ? asStringArray(stressPayload.triggers) : undefined,
        copingMethods: stressPayload.copingMethods !== undefined ? asStringArray(stressPayload.copingMethods) : undefined,
        notes: stressPayload.notes !== undefined ? asString(stressPayload.notes, '') : undefined,
      }),
    };
  }

  if (Object.keys(periodPayload).length > 0) {
    updateData.period = {
      ...asObject(existing.period),
      ...pickDefined({
        isPeriodDay: periodPayload.isPeriodDay !== undefined ? Boolean(periodPayload.isPeriodDay) : undefined,
        flowLevel: periodPayload.flowLevel !== undefined ? toNumber(periodPayload.flowLevel, 0) : undefined,
        painLevel: periodPayload.painLevel !== undefined ? toNumber(periodPayload.painLevel, 0) : undefined,
        moodScore: periodPayload.moodScore !== undefined ? toNumber(periodPayload.moodScore, 5) : undefined,
        symptoms: periodPayload.symptoms !== undefined ? asStringArray(periodPayload.symptoms) : undefined,
        comfortPreferences: periodPayload.comfortPreferences !== undefined ? asStringArray(periodPayload.comfortPreferences) : undefined,
        cycleLength: periodPayload.cycleLength !== undefined ? toNumber(periodPayload.cycleLength, 28) : undefined,
        notes: periodPayload.notes !== undefined ? asString(periodPayload.notes, '') : undefined,
      }),
    };
  }

  await entryRef.set(updateData, { merge: true });

  const externalId = asString(payload.externalId || item.externalId || '').trim();
  if (externalId) {
    const entryId = `${item.userId}_${dateKey(date)}`;
    await upsertMapping(
      db,
      item.userId,
      item.provider,
      'wellnessEntry',
      externalId,
      entryId,
      asString(payload.checksum || item.checksum || '')
    );
  }

  return { created: 0, updated: 1, kind: 'wellness' };
};

const upsertCalendarEvent = async (db, item, payload) => {
  const externalId = asString(payload.externalId || item.externalId || item.id).trim() || item.id;
  const startTime = toDate(payload.startTime || payload.start || payload.date || item.createdAt);
  const endTime = toDate(payload.endTime || payload.end || new Date(startTime.getTime() + 60 * 60 * 1000));

  const patch = {
    userId: item.userId,
    title: asString(payload.title, 'Imported Event'),
    description: asString(payload.description, ''),
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
    allDay: Boolean(payload.allDay),
    location: payload.location ? asString(payload.location, '') : null,
    attendees: Array.isArray(payload.attendees) ? payload.attendees : [],
    recurrence: payload.recurrence || null,
    reminders: Array.isArray(payload.reminders) ? payload.reminders : [],
    color: asString(payload.color, '#06b6d4'),
    category: EVENT_CATEGORIES.has(payload.category) ? payload.category : 'other',
    energyRequired: ENERGY_LEVELS.has(payload.energyRequired) ? payload.energyRequired : 'medium',
    isFlexible: Boolean(payload.isFlexible),
    linkedTaskId: payload.linkedTaskId ? asString(payload.linkedTaskId, '') : null,
    externalId,
    source: asString(payload.source, getCalendarSource(item.provider)),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const mapping = await getMapping(db, item.userId, item.provider, 'calendarEvent', externalId);

  if (mapping) {
    await db.collection(COLLECTIONS.CALENDAR_EVENTS).doc(mapping.data().internalId).update(patch);

    await upsertMapping(
      db,
      item.userId,
      item.provider,
      'calendarEvent',
      externalId,
      mapping.data().internalId,
      asString(payload.checksum || item.checksum || '')
    );

    return { created: 0, updated: 1, kind: 'calendarEvents' };
  }

  const createdDoc = await db.collection(COLLECTIONS.CALENDAR_EVENTS).add({
    ...patch,
    createdAt: FieldValue.serverTimestamp(),
  });

  await upsertMapping(
    db,
    item.userId,
    item.provider,
    'calendarEvent',
    externalId,
    createdDoc.id,
    asString(payload.checksum || item.checksum || '')
  );

  return { created: 1, updated: 0, kind: 'calendarEvents' };
};

const upsertTask = async (db, item, payload) => {
  const externalId = asString(payload.externalId || item.externalId || item.id).trim() || item.id;

  const status = TASK_STATUSES.has(payload.status) ? payload.status : 'pending';
  const priority = TASK_PRIORITIES.has(payload.priority) ? payload.priority : 'medium';
  const energyLevel = ENERGY_LEVELS.has(payload.energyLevel) ? payload.energyLevel : 'medium';

  const patch = {
    userId: item.userId,
    title: asString(payload.title, 'Imported Task'),
    description: asString(payload.description, ''),
    status,
    priority,
    energyLevel,
    dueDate: payload.dueDate ? toTimestampOrNull(payload.dueDate) : null,
    dueTime: payload.dueTime ? asString(payload.dueTime, '') : null,
    estimatedDuration: payload.estimatedDuration !== undefined ? toNumber(payload.estimatedDuration, 0) : null,
    actualDuration: payload.actualDuration !== undefined ? toNumber(payload.actualDuration, 0) : null,
    tags: asStringArray(payload.tags),
    category: payload.category ? asString(payload.category, '') : null,
    subtasks: Array.isArray(payload.subtasks) ? payload.subtasks : [],
    dependencies: asStringArray(payload.dependencies),
    recurrence: payload.recurrence || null,
    reminders: Array.isArray(payload.reminders) ? payload.reminders : [],
    contextTriggers: Array.isArray(payload.contextTriggers) ? payload.contextTriggers : [],
    notes: payload.notes ? asString(payload.notes, '') : null,
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    aiSuggestions: Array.isArray(payload.aiSuggestions) ? payload.aiSuggestions : [],
    updatedAt: FieldValue.serverTimestamp(),
  };

  const mapping = await getMapping(db, item.userId, item.provider, 'task', externalId);

  if (mapping) {
    await db.collection(COLLECTIONS.TASKS).doc(mapping.data().internalId).update(patch);

    await upsertMapping(
      db,
      item.userId,
      item.provider,
      'task',
      externalId,
      mapping.data().internalId,
      asString(payload.checksum || item.checksum || '')
    );

    return { created: 0, updated: 1, kind: 'tasks' };
  }

  const createdDoc = await db.collection(COLLECTIONS.TASKS).add({
    ...patch,
    createdAt: FieldValue.serverTimestamp(),
  });

  await upsertMapping(
    db,
    item.userId,
    item.provider,
    'task',
    externalId,
    createdDoc.id,
    asString(payload.checksum || item.checksum || '')
  );

  return { created: 1, updated: 0, kind: 'tasks' };
};

const getPendingInboxItems = async (db, userId, provider, limitCount) => {
  const snapshot = await db
    .collection(COLLECTIONS.INTEGRATION_SYNC_INBOX)
    .where('userId', '==', userId)
    .where('provider', '==', provider)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .limit(limitCount)
    .get();

  return snapshot.docs;
};

const isEntityAllowed = (entityType, permissions) => {
  if (entityType === 'transaction') return permissions.allowFinanceDataSync !== false;
  if (entityType === 'wellnessSnapshot') return permissions.allowHealthDataSync !== false;
  if (entityType === 'calendarEvent') return permissions.allowCalendarDataSync !== false;
  if (entityType === 'task') return permissions.allowTaskDataSync !== false;
  return false;
};

const processInboxItem = async (db, job, inboxDoc, permissions, stats) => {
  const data = asObject(inboxDoc.data());
  const item = {
    id: inboxDoc.id,
    userId: data.userId,
    provider: data.provider,
    entityType: data.entityType,
    payload: asObject(data.payload),
    externalId: data.externalId,
    checksum: data.checksum,
    createdAt: data.createdAt,
  };

  await inboxDoc.ref.update({
    status: 'processing',
    syncJobId: job.id,
    error: '',
  });

  if (!isEntityAllowed(item.entityType, permissions)) {
    const message = `Skipping ${item.entityType}: permission disabled`;

    await inboxDoc.ref.update({
      status: 'failed',
      error: message,
      processedAt: FieldValue.serverTimestamp(),
    });

    await addSyncLog(db, item.userId, item.provider, 'warning', message, {
      inboxItemId: item.id,
      syncJobId: job.id,
    });

    stats.failed += 1;
    return;
  }

  try {
    let result;

    switch (item.entityType) {
      case 'transaction':
        result = await upsertTransaction(db, item, item.payload);
        stats.transactions += 1;
        break;
      case 'wellnessSnapshot':
        result = await upsertWellnessSnapshot(db, item, item.payload);
        stats.wellness += 1;
        break;
      case 'calendarEvent':
        result = await upsertCalendarEvent(db, item, item.payload);
        stats.calendarEvents += 1;
        break;
      case 'task':
        result = await upsertTask(db, item, item.payload);
        stats.tasks += 1;
        break;
      default:
        throw new Error(`Unsupported entityType: ${item.entityType}`);
    }

    await inboxDoc.ref.update({
      status: 'processed',
      processedAt: FieldValue.serverTimestamp(),
      error: '',
    });

    stats.processed += 1;
    stats.created += result.created;
    stats.updated += result.updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import inbox payload';

    await inboxDoc.ref.update({
      status: 'failed',
      error: message,
      processedAt: FieldValue.serverTimestamp(),
    });

    await addSyncLog(db, item.userId, item.provider, 'error', 'Failed to process sync inbox item', {
      inboxItemId: item.id,
      syncJobId: job.id,
      entityType: item.entityType,
      error: message,
    });

    stats.failed += 1;
  }
};

const processJob = async (db, job) => {
  const userId = asString(job.userId);
  const provider = asString(job.provider);
  const reason = asString(job.reason || 'manual');

  if (!userId || !provider) {
    await markJob(db, job.id, 'failed', {
      summary: 'Invalid sync job payload',
      error: 'Missing userId or provider',
    });
    return;
  }

  const stats = {
    processed: 0,
    created: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    transactions: 0,
    wellness: 0,
    calendarEvents: 0,
    tasks: 0,
  };

  try {
    const permissions = await getUserPreferences(db, userId);
    const providerState = await getProviderState(db, userId, provider);

    if (reason !== 'manual' && permissions.allowBackgroundSync === false) {
      throw new Error('Background sync is disabled for this user');
    }

    const requiredPermission = PROVIDER_PERMISSION_KEY[provider];
    if (requiredPermission && permissions[requiredPermission] === false) {
      throw new Error(`Permission ${requiredPermission} is disabled`);
    }

    if (providerState.connected !== true) {
      throw new Error(`${provider} is not connected for this user`);
    }

    await setIntegrationStatus(db, userId, provider, {
      status: 'syncing',
      lastError: '',
    });

    let remaining = MAX_ITEMS_PER_JOB;

    while (remaining > 0) {
      const batchLimit = Math.min(INBOX_BATCH_SIZE, remaining);
      const inboxItems = await getPendingInboxItems(db, userId, provider, batchLimit);

      if (inboxItems.length === 0) {
        break;
      }

      for (const inboxDoc of inboxItems) {
        await processInboxItem(db, job, inboxDoc, permissions, stats);
        remaining -= 1;
        if (remaining <= 0) break;
      }
    }

    if (stats.processed === 0 && stats.failed === 0) {
      stats.skipped += 1;
      await addSyncLog(db, userId, provider, 'info', 'No pending inbox payloads to import', {
        syncJobId: job.id,
      });
    }

    const summary = buildSummary(stats);
    const status = stats.failed > 0
      ? (stats.processed > 0 ? 'partial' : 'failed')
      : 'succeeded';

    await setIntegrationStatus(db, userId, provider, {
      status: status === 'failed' ? 'error' : 'idle',
      lastError: status === 'failed' ? summary : '',
      lastSynced: FieldValue.serverTimestamp(),
    });

    await markJob(db, job.id, status, {
      summary,
      error: status === 'failed' ? summary : '',
    });

    await addSyncLog(
      db,
      userId,
      provider,
      status === 'failed' ? 'error' : stats.failed > 0 ? 'warning' : 'info',
      `Sync job ${status}: ${summary}`,
      {
        syncJobId: job.id,
        reason,
        ...stats,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync job failed';

    await markJob(db, job.id, 'failed', {
      summary: message,
      error: message,
    });

    await setIntegrationStatus(db, userId, provider, {
      status: 'error',
      lastError: message,
    });

    await addSyncLog(db, userId, provider, 'error', 'Sync job failed', {
      syncJobId: job.id,
      reason,
      error: message,
    });
  }
};

const main = async () => {
  if (!Number.isFinite(MAX_JOBS) || MAX_JOBS < 1) {
    throw new Error('SYNC_WORKER_MAX_JOBS must be a positive integer');
  }

  if (!Number.isFinite(MAX_ITEMS_PER_JOB) || MAX_ITEMS_PER_JOB < 1) {
    throw new Error('SYNC_WORKER_MAX_ITEMS_PER_JOB must be a positive integer');
  }

  const { db } = initFirebaseAdmin();
  log('Worker started', {
    maxJobs: MAX_JOBS,
    maxItemsPerJob: MAX_ITEMS_PER_JOB,
    batchSize: INBOX_BATCH_SIZE,
  });

  let processedJobs = 0;

  for (let i = 0; i < MAX_JOBS; i += 1) {
    const job = await claimNextJob(db);

    if (!job) {
      break;
    }

    processedJobs += 1;
    log(`Processing sync job ${job.id}`, {
      userId: job.userId,
      provider: job.provider,
      reason: job.reason,
    });

    await processJob(db, job);
  }

  log('Worker finished', { processedJobs });
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[sync-worker ${nowIso()}] Fatal error:`, message);
  process.exitCode = 1;
});
