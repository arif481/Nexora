import { FieldValue } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from './firebase-admin.mjs';

const COLLECTIONS = {
  INTEGRATION_SYNC_INBOX: 'integrationSyncInbox',
  INTEGRATION_SYNC_JOBS: 'integrationSyncJobs',
  USER_INTEGRATIONS: 'userIntegrations',
};

const argUserId = process.argv[2] || process.env.SYNC_TEST_USER_ID;
const argProvider = process.argv[3] || process.env.SYNC_TEST_PROVIDER || 'mobileBridge';

if (!argUserId) {
  console.error('Usage: npm run sync:seed -- <userId> [provider]');
  process.exit(1);
}

const createPayloads = (provider) => {
  const today = new Date();
  const oneHourLater = new Date(today.getTime() + 60 * 60 * 1000);

  if (provider === 'plaid') {
    return [
      {
        entityType: 'transaction',
        externalId: `plaid_tx_${Date.now()}`,
        payload: {
          amount: 18.75,
          currency: 'USD',
          type: 'expense',
          category: 'food',
          description: 'Seeded coffee transaction',
          date: today.toISOString(),
          tags: ['seed', 'plaid'],
        },
      },
    ];
  }

  if (provider === 'googleCalendar' || provider === 'appleCalendar') {
    return [
      {
        entityType: 'calendarEvent',
        externalId: `${provider}_event_${Date.now()}`,
        payload: {
          title: 'Seeded Calendar Event',
          description: 'Auto imported test event',
          startTime: today.toISOString(),
          endTime: oneHourLater.toISOString(),
          allDay: false,
          category: 'personal',
          source: provider === 'googleCalendar' ? 'google' : 'apple',
        },
      },
    ];
  }

  if (provider === 'todoist' || provider === 'notion') {
    return [
      {
        entityType: 'task',
        externalId: `${provider}_task_${Date.now()}`,
        payload: {
          title: 'Seeded Imported Task',
          description: 'Imported from seed script',
          status: 'pending',
          priority: 'medium',
          energyLevel: 'medium',
          dueDate: today.toISOString(),
          tags: ['seed', provider],
        },
      },
    ];
  }

  if (provider === 'appleHealth' || provider === 'healthConnect' || provider === 'fitbit' || provider === 'googleFit') {
    return [
      {
        entityType: 'wellnessSnapshot',
        externalId: `${provider}_wellness_${Date.now()}`,
        payload: {
          date: today.toISOString(),
          activity: {
            steps: 7634,
            activeMinutes: 42,
          },
          sleep: {
            duration: 435,
            quality: 7,
          },
          stress: {
            level: 4,
            notes: 'Seeded sample wellness data',
            triggers: ['deadline'],
            copingMethods: ['walk'],
          },
        },
      },
    ];
  }

  return [
    {
      entityType: 'transaction',
      externalId: `seed_tx_${Date.now()}`,
      payload: {
        amount: 32.4,
        currency: 'USD',
        type: 'expense',
        category: 'transport',
        description: 'Seeded mobile bridge transaction',
        date: today.toISOString(),
        tags: ['seed', 'mobileBridge'],
      },
    },
    {
      entityType: 'wellnessSnapshot',
      externalId: `seed_wellness_${Date.now()}`,
      payload: {
        date: today.toISOString(),
        activity: {
          steps: 10456,
          activeMinutes: 64,
        },
        sleep: {
          duration: 462,
          quality: 8,
        },
        period: {
          isPeriodDay: true,
          flowLevel: 2,
          painLevel: 3,
          moodScore: 7,
          symptoms: ['cramps'],
          comfortPreferences: ['tea', 'heating pad'],
          cycleLength: 28,
        },
      },
    },
    {
      entityType: 'calendarEvent',
      externalId: `seed_event_${Date.now()}`,
      payload: {
        title: 'Seeded Mobile Event',
        description: 'Imported via seed script',
        startTime: today.toISOString(),
        endTime: oneHourLater.toISOString(),
        category: 'personal',
      },
    },
    {
      entityType: 'task',
      externalId: `seed_task_${Date.now()}`,
      payload: {
        title: 'Seeded Mobile Task',
        description: 'Imported via seed script',
        status: 'pending',
        priority: 'high',
        dueDate: today.toISOString(),
        tags: ['seed'],
      },
    },
  ];
};

const main = async () => {
  const { db } = initFirebaseAdmin();

  await db.collection(COLLECTIONS.USER_INTEGRATIONS).doc(argUserId).set({
    [argProvider]: {
      connected: true,
      syncEnabled: true,
      status: 'idle',
      syncMode: 'pull',
      lastError: '',
    },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const payloads = createPayloads(argProvider);
  const inboxIds = [];

  for (const payload of payloads) {
    const docRef = await db.collection(COLLECTIONS.INTEGRATION_SYNC_INBOX).add({
      userId: argUserId,
      provider: argProvider,
      entityType: payload.entityType,
      payload: payload.payload,
      externalId: payload.externalId,
      checksum: null,
      source: 'seed-script',
      status: 'pending',
      error: '',
      syncJobId: null,
      createdAt: FieldValue.serverTimestamp(),
      processedAt: null,
    });

    inboxIds.push(docRef.id);
  }

  const jobRef = await db.collection(COLLECTIONS.INTEGRATION_SYNC_JOBS).add({
    userId: argUserId,
    provider: argProvider,
    reason: 'manual',
    status: 'queued',
    summary: '',
    error: '',
    createdAt: FieldValue.serverTimestamp(),
    startedAt: null,
    finishedAt: null,
  });

  console.log('Seed completed:');
  console.log(`  userId: ${argUserId}`);
  console.log(`  provider: ${argProvider}`);
  console.log(`  inboxItems: ${inboxIds.length}`);
  console.log(`  inboxIds: ${inboxIds.join(', ')}`);
  console.log(`  queuedJobId: ${jobRef.id}`);
};

main().catch((error) => {
  console.error('Failed to seed sync inbox:', error);
  process.exitCode = 1;
});
