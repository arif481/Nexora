import { getIntegrationMapping, upsertIntegrationMapping, addSyncLog, updateSyncJobStatus } from './sync';
import { createCalendarEvent, updateCalendarEvent } from './calendar';
import { createTask, updateTask } from './tasks';
import { getDoc, doc, getDocs, collection, query, where, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';

const EDUPLANR_PULL_URL = process.env.NEXT_PUBLIC_EDUPLANR_API_URL || 'https://edu-planr.vercel.app/api/nexora-sync';
const EDUPLANR_PUSH_URL = process.env.NEXT_PUBLIC_EDUPLANR_PUSH_URL || 'https://edu-planr.vercel.app/api/nexora-push';

// ─── Get Integration Credentials ───
async function getEduPlanrCredentials(userId: string) {
    const integrationDoc = await getDoc(doc(db, COLLECTIONS.USER_INTEGRATIONS, userId));
    const integrations = integrationDoc.data();
    const eduplanrData = integrations?.eduplanr;

    if (!eduplanrData || !eduplanrData.email || !eduplanrData.syncToken) {
        throw new Error('EduPlanr is not properly configured. Missing email or sync token.');
    }

    return { email: eduplanrData.email, syncToken: eduplanrData.syncToken };
}

// ─── PULL: Fetch data FROM EduPlanr ───
async function pullFromEduPlanr(userId: string, email: string, syncToken: string) {
    const response = await fetch(EDUPLANR_PULL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, syncToken }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Failed to pull from EduPlanr.');
    }

    const { data } = await response.json();
    const { events = [], tasks = [], subjects = [], syllabi = [], examEvents = [] } = data;

    let syncedEvents = 0;
    let syncedTasks = 0;
    let syncedExams = 0;

    // Sync Calendar Events (Study Sessions)
    for (const event of events) {
        const existingMapping = await getIntegrationMapping(userId, 'eduplanr', 'calendarEvent', event.externalId);

        const eventData = {
            title: event.title,
            description: event.description,
            startTime: new Date(event.startTime),
            endTime: new Date(event.endTime),
            allDay: event.allDay,
            category: event.category || 'learning',
            energyRequired: event.energyRequired || 'medium',
            isFlexible: event.isFlexible || false,
            source: 'eduplanr' as const,
            externalId: event.externalId,
        };

        if (existingMapping) {
            await updateCalendarEvent(existingMapping.internalId, eventData);
        } else {
            const newId = await createCalendarEvent(userId, eventData);
            await upsertIntegrationMapping(userId, 'eduplanr', 'calendarEvent', event.externalId, newId);
        }
        syncedEvents++;
    }

    // Sync Tasks (Assignments)
    for (const task of tasks) {
        const existingMapping = await getIntegrationMapping(userId, 'eduplanr', 'task', task.externalId);

        const taskData = {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            energyLevel: task.energyLevel || 'medium',
            category: task.category || 'academic',
            source: 'eduplanr' as const,
            externalId: task.externalId,
            ...(task.dueDate ? { dueDate: new Date(task.dueDate) } : {}),
        };

        if (existingMapping) {
            await updateTask(existingMapping.internalId, taskData);
        } else {
            const newId = await createTask(userId, taskData);
            await upsertIntegrationMapping(userId, 'eduplanr', 'task', task.externalId, newId);
        }
        syncedTasks++;
    }

    // Sync Exam Events from Exam Routines
    for (const exam of examEvents) {
        const existingMapping = await getIntegrationMapping(userId, 'eduplanr', 'calendarEvent', exam.externalId);

        // Build datetime from date + time strings
        const examStart = exam.date && exam.startTime ? new Date(`${exam.date}T${exam.startTime}`) : new Date();
        const examEnd = exam.date && exam.endTime ? new Date(`${exam.date}T${exam.endTime}`) : new Date(examStart.getTime() + 2 * 60 * 60 * 1000);

        const examEventData = {
            title: exam.title,
            description: exam.description || '',
            startTime: examStart,
            endTime: examEnd,
            allDay: false,
            category: 'exam' as const,
            energyRequired: 'high' as const,
            isFlexible: false,
            source: 'eduplanr' as const,
            externalId: exam.externalId,
            color: exam.subjectColor || '#ef4444',
        };

        if (existingMapping) {
            await updateCalendarEvent(existingMapping.internalId, examEventData);
        } else {
            const newId = await createCalendarEvent(userId, examEventData);
            await upsertIntegrationMapping(userId, 'eduplanr', 'calendarEvent', exam.externalId, newId);
        }
        syncedExams++;
    }

    return { syncedEvents, syncedTasks, syncedExams, subjects, syllabi };
}

// ─── PUSH: Send Nexora data TO EduPlanr ───
async function pushToEduPlanr(userId: string, email: string, syncToken: string) {
    const payload: Record<string, any> = {};

    // 1. Collect today's wellness data
    try {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const wellnessRef = collection(db, COLLECTIONS.WELLNESS_ENTRIES);
        const wellnessQ = query(wellnessRef, where('userId', '==', userId), where('date', '==', dateStr));
        const wellnessSnap = await getDocs(wellnessQ);

        if (!wellnessSnap.empty) {
            const w = wellnessSnap.docs[0].data();
            payload.wellness = {
                date: dateStr,
                sleep: w.sleep || null,
                stress: w.stress || null,
                energy: w.activity?.activeMinutes ? 'active' : 'low',
                mood: w.mood || null,
                overallScore: w.overallScore || null,
            };
        }
    } catch (e) {
        console.warn('Could not collect wellness data for push:', e);
    }

    // 2. Collect active habits
    try {
        const habitsRef = collection(db, COLLECTIONS.HABITS || 'habits');
        const habitsQ = query(habitsRef, where('userId', '==', userId));
        const habitsSnap = await getDocs(habitsQ);

        payload.habits = habitsSnap.docs.map(d => {
            const h = d.data();
            return {
                name: h.title || h.name,
                streak: h.streak || 0,
                category: h.category || 'general',
                frequency: h.frequency || 'daily',
            };
        });
    } catch (e) {
        console.warn('Could not collect habits for push:', e);
    }

    // 3. Collect active goals
    try {
        const goalsRef = collection(db, 'goals');
        const goalsQ = query(goalsRef, where('userId', '==', userId), where('status', 'in', ['not-started', 'in-progress']));
        const goalsSnap = await getDocs(goalsQ);

        payload.goals = goalsSnap.docs.map(d => {
            const g = d.data();
            return {
                title: g.title,
                category: g.category || 'general',
                progress: g.progress || 0,
                status: g.status || 'in-progress',
                targetDate: g.targetDate instanceof Timestamp ? g.targetDate.toDate().toISOString() : g.targetDate || null,
            };
        });
    } catch (e) {
        console.warn('Could not collect goals for push:', e);
    }

    // 4. Collect upcoming personal events (non-eduplanr, next 7 days)
    try {
        const now = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
        const eventsQ = query(
            eventsRef,
            where('userId', '==', userId),
            where('startTime', '>=', Timestamp.fromDate(now)),
            where('startTime', '<=', Timestamp.fromDate(weekFromNow)),
        );
        const eventsSnap = await getDocs(eventsQ);

        payload.events = eventsSnap.docs
            .map(d => d.data())
            .filter(e => e.source !== 'eduplanr') // Only send non-eduplanr events
            .map(e => ({
                title: e.title,
                startTime: e.startTime instanceof Timestamp ? e.startTime.toDate().toISOString() : e.startTime,
                endTime: e.endTime instanceof Timestamp ? e.endTime.toDate().toISOString() : e.endTime,
                category: e.category || 'personal',
                allDay: e.allDay || false,
            }));
    } catch (e) {
        console.warn('Could not collect events for push:', e);
    }

    // 5. Collect task status updates for EduPlanr-sourced tasks
    try {
        const tasksRef = collection(db, COLLECTIONS.TASKS);
        const tasksQ = query(tasksRef, where('userId', '==', userId), where('source', '==', 'eduplanr'));
        const tasksSnap = await getDocs(tasksQ);

        payload.taskUpdates = tasksSnap.docs.map(d => {
            const t = d.data();
            return {
                externalId: t.externalId,
                status: t.status,
            };
        });
    } catch (e) {
        console.warn('Could not collect task updates for push:', e);
    }

    // 6. Send the payload to EduPlanr
    const response = await fetch(EDUPLANR_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, syncToken, payload }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Failed to push data to EduPlanr.');
    }

    const result = await response.json();
    return result;
}

// ─── MAIN SYNC FUNCTION: Bidirectional ───
export async function runEduPlanrSync(userId: string, jobId: string) {
    try {
        await updateSyncJobStatus(jobId, 'running');

        const { email, syncToken } = await getEduPlanrCredentials(userId);

        // Phase 1: Pull from EduPlanr
        await addSyncLog(userId, 'eduplanr', 'info', '⬇️ Pulling data from EduPlanr...');
        const pullResult = await pullFromEduPlanr(userId, email, syncToken);

        // Phase 2: Push to EduPlanr
        await addSyncLog(userId, 'eduplanr', 'info', '⬆️ Pushing data to EduPlanr...');
        let pushResult;
        try {
            pushResult = await pushToEduPlanr(userId, email, syncToken);
        } catch (pushError: any) {
            // Push errors should not fail the entire sync
            await addSyncLog(userId, 'eduplanr', 'warning', `Push partially failed: ${pushError.message}`);
            pushResult = { message: 'Push skipped due to error' };
        }

        const summaryMsg = `✅ Synced ${pullResult.syncedEvents} sessions, ${pullResult.syncedTasks} tasks, ${pullResult.syncedExams} exams. Push: ${pushResult.message || 'OK'}`;
        await updateSyncJobStatus(jobId, 'succeeded', { summary: summaryMsg });
        await addSyncLog(userId, 'eduplanr', 'info', summaryMsg);

    } catch (error: any) {
        console.error('EduPlanr Sync Client Error:', error);
        const errorMsg = error.message || 'Unknown error during sync';
        await updateSyncJobStatus(jobId, 'failed', { error: errorMsg });
        await addSyncLog(userId, 'eduplanr', 'error', `Sync failed: ${errorMsg}`);
    }
}

// ─── PUSH-ONLY FUNCTION (for auto-sync triggers) ───
export async function pushEduPlanrData(userId: string) {
    try {
        const { email, syncToken } = await getEduPlanrCredentials(userId);
        await pushToEduPlanr(userId, email, syncToken);
    } catch (error: any) {
        console.error('EduPlanr Push Error:', error);
    }
}
