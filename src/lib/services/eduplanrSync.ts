import { getIntegrationMapping, upsertIntegrationMapping, addSyncLog, updateSyncJobStatus } from './sync';
import { createCalendarEvent, updateCalendarEvent } from './calendar';
import { createTask, updateTask } from './tasks';
import { getDoc, doc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';

export async function runEduPlanrSync(userId: string, jobId: string) {
    try {
        await updateSyncJobStatus(jobId, 'running');

        // 1. Get user integrations to find EduPlanr email and token
        const integrationDoc = await getDoc(doc(db, COLLECTIONS.USER_INTEGRATIONS, userId));
        const integrations = integrationDoc.data();
        const eduplanrData = integrations?.eduplanr;

        if (!eduplanrData || !eduplanrData.email || !eduplanrData.syncToken) {
            throw new Error("EduPlanr is not properly configured. Missing email or sync token.");
        }

        // 2. Call the Next.js API route
        const response = await fetch('/api/integrations/eduplanr/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: eduplanrData.email,
                syncToken: eduplanrData.syncToken
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to sync with EduPlanr.');
        }

        const { data } = await response.json();
        const { events, tasks } = data;

        let syncedEvents = 0;
        let syncedTasks = 0;

        // 3. Sync Calendar Events (Study Sessions)
        for (const event of events) {
            const existingMapping = await getIntegrationMapping(userId, 'eduplanr', 'calendarEvent', event.externalId);

            const eventData = {
                title: event.title,
                description: event.description,
                startTime: new Date(event.startTime),
                endTime: new Date(event.endTime),
                allDay: event.allDay,
                category: event.category,
                energyRequired: event.energyRequired,
                isFlexible: event.isFlexible,
                source: 'eduplanr' as const,
                externalId: event.externalId
            };

            if (existingMapping) {
                await updateCalendarEvent(existingMapping.internalId, eventData);
            } else {
                const newId = await createCalendarEvent(userId, eventData);
                await upsertIntegrationMapping(userId, 'eduplanr', 'calendarEvent', event.externalId, newId);
            }
            syncedEvents++;
        }

        // 4. Sync Tasks (Assignments)
        for (const task of tasks) {
            const existingMapping = await getIntegrationMapping(userId, 'eduplanr', 'task', task.externalId);

            const taskData = {
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                energyLevel: task.energyLevel,
                category: task.category,
                source: 'eduplanr' as const,
                externalId: task.externalId,
                ...(task.dueDate ? { dueDate: new Date(task.dueDate) } : {})
            };

            if (existingMapping) {
                await updateTask(existingMapping.internalId, taskData);
            } else {
                const newId = await createTask(userId, taskData);
                await upsertIntegrationMapping(userId, 'eduplanr', 'task', task.externalId, newId);
            }
            syncedTasks++;
        }

        const summaryMsg = `Successfully synced ${syncedEvents} study sessions and ${syncedTasks} tasks.`;
        await updateSyncJobStatus(jobId, 'succeeded', { summary: summaryMsg });
        await addSyncLog(userId, 'eduplanr', 'info', summaryMsg);

    } catch (error: any) {
        console.error('EduPlanr Sync Client Error:', error);
        const errorMsg = error.message || 'Unknown error during sync';
        await updateSyncJobStatus(jobId, 'failed', { error: errorMsg });
        await addSyncLog(userId, 'eduplanr', 'error', `Sync failed: ${errorMsg}`);
    }
}
