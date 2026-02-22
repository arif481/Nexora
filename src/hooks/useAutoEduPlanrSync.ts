'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { pushEduPlanrData, runEduPlanrSync } from '@/lib/services/eduplanrSync';
import { queueIntegrationSyncJob } from '@/lib/services/integrations';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type SyncDirection = 'pull' | 'push' | 'bidirectional';

export interface SyncState {
    status: SyncStatus;
    direction: SyncDirection | null;
    lastPullAt: Date | null;
    lastPushAt: Date | null;
    lastError: string | null;
    pullCount: number;
    pushCount: number;
}

const DEBOUNCE_MS = 5000; // 5 second debounce before auto-push
const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000; // Full bidirectional sync every 5 minutes

export function useAutoEduPlanrSync() {
    const { user } = useAuth();
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const autoSyncTimer = useRef<NodeJS.Timeout | null>(null);
    const [syncState, setSyncState] = useState<SyncState>({
        status: 'idle',
        direction: null,
        lastPullAt: null,
        lastPushAt: null,
        lastError: null,
        pullCount: 0,
        pushCount: 0,
    });

    const doPush = useCallback(async () => {
        if (!user?.uid) return;

        setSyncState(prev => ({ ...prev, status: 'syncing', direction: 'push' }));

        try {
            await pushEduPlanrData(user.uid);
            setSyncState(prev => ({
                ...prev,
                status: 'success',
                lastPushAt: new Date(),
                pushCount: prev.pushCount + 1,
                lastError: null,
            }));

            // Reset to idle after 3 seconds
            setTimeout(() => {
                setSyncState(prev => prev.status === 'success' ? { ...prev, status: 'idle' } : prev);
            }, 3000);
        } catch (e: any) {
            setSyncState(prev => ({
                ...prev,
                status: 'error',
                lastError: e.message || 'Push failed',
            }));
        }
    }, [user?.uid]);

    const syncAll = useCallback(async (reason: 'manual' | 'scheduled' | 'webhook' = 'scheduled') => {
        if (!user?.uid) return;

        setSyncState(prev => ({ ...prev, status: 'syncing', direction: 'bidirectional' }));

        try {
            const jobId = await queueIntegrationSyncJob(user.uid, 'eduplanr', reason);
            await runEduPlanrSync(user.uid, jobId);

            setSyncState(prev => ({
                ...prev,
                status: 'success',
                lastPullAt: new Date(),
                lastPushAt: new Date(),
                pullCount: prev.pullCount + 1,
                pushCount: prev.pushCount + 1,
                lastError: null,
            }));

            setTimeout(() => {
                setSyncState(prev => prev.status === 'success' ? { ...prev, status: 'idle' } : prev);
            }, 3000);
        } catch (e: any) {
            setSyncState(prev => ({
                ...prev,
                status: 'error',
                lastError: e.message || 'Sync failed',
            }));
        }
    }, [user?.uid]);

    const schedulePush = useCallback(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(doPush, DEBOUNCE_MS);
    }, [doPush]);

    // Listen for local data changes and trigger auto-push
    useEffect(() => {
        if (!user?.uid) return;

        const unsubscribers: (() => void)[] = [];

        // Watch wellness changes
        try {
            const wellnessRef = collection(db, COLLECTIONS.WELLNESS_ENTRIES);
            const wellnessQ = query(wellnessRef, where('userId', '==', user.uid));
            unsubscribers.push(onSnapshot(wellnessQ, () => schedulePush(), () => { }));
        } catch { /* wellness collection might not exist */ }

        // Watch task changes (for EduPlanr-sourced tasks)
        try {
            const tasksRef = collection(db, COLLECTIONS.TASKS);
            const tasksQ = query(tasksRef, where('userId', '==', user.uid), where('source', '==', 'eduplanr'));
            unsubscribers.push(onSnapshot(tasksQ, () => schedulePush(), () => { }));
        } catch { /* ignore */ }

        // Watch habit changes
        try {
            const habitsRef = collection(db, COLLECTIONS.HABITS || 'habits');
            const habitsQ = query(habitsRef, where('userId', '==', user.uid));
            unsubscribers.push(onSnapshot(habitsQ, () => schedulePush(), () => { }));
        } catch { /* ignore */ }

        // Watch subject changes (for real-time push)
        try {
            const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
            const subjectsQ = query(subjectsRef, where('userId', '==', user.uid));
            unsubscribers.push(onSnapshot(subjectsQ, () => schedulePush(), () => { }));
        } catch { /* ignore */ }

        return () => {
            unsubscribers.forEach(unsub => unsub());
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [user?.uid, schedulePush]);


    // Periodic full sync and sync on mount
    useEffect(() => {
        if (!user?.uid) return;

        // Perform full sync on visit
        syncAll('scheduled');

        autoSyncTimer.current = setInterval(() => {
            syncAll('scheduled');
        }, AUTO_SYNC_INTERVAL_MS);

        return () => {
            if (autoSyncTimer.current) clearInterval(autoSyncTimer.current);
        };
    }, [user?.uid, syncAll]);

    return syncState;
}
