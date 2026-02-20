'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useTasks } from './useTasks';
import { useCalendar } from './useCalendar';
import {
    createTaskDueNotification,
    createEventNotification,
} from '@/lib/services/notifications';

const SENT_KEY = 'nexora_sent_notification_ids';
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function getSentIds(): Set<string> {
    try {
        const stored = sessionStorage.getItem(SENT_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
}

function markSent(id: string) {
    const ids = getSentIds();
    ids.add(id);
    try {
        sessionStorage.setItem(SENT_KEY, JSON.stringify(Array.from(ids)));
    } catch {
        // sessionStorage full or unavailable
    }
}

/**
 * Periodically checks for tasks due today and upcoming calendar events,
 * then fires in-app notifications for them. Uses sessionStorage to avoid
 * duplicate notifications within the same browser session.
 */
export function useNotificationTriggers() {
    const { user } = useAuth();
    const { tasks } = useTasks();
    const { events } = useCalendar();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) return;

        const checkAndNotify = async () => {
            const now = new Date();
            const sentIds = getSentIds();

            // ---------- Tasks due today or overdue ----------
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(todayStart);
            todayEnd.setDate(todayEnd.getDate() + 1);

            for (const task of tasks) {
                if (!task.dueDate || task.status === 'done') continue;

                const dueDate = new Date(task.dueDate);
                const notifKey = `task-due-${task.id}-${dueDate.toDateString()}`;

                if (sentIds.has(notifKey)) continue;

                // Overdue
                if (dueDate < todayStart) {
                    try {
                        await createTaskDueNotification(user.uid, task.title, task.id, 'overdue');
                        markSent(notifKey);
                    } catch {
                        // Notification create failed silently
                    }
                }
                // Due today
                else if (dueDate >= todayStart && dueDate < todayEnd) {
                    try {
                        await createTaskDueNotification(user.uid, task.title, task.id, 'today');
                        markSent(notifKey);
                    } catch {
                        // Notification create failed silently
                    }
                }
            }

            // ---------- Calendar events starting within 30 minutes ----------
            const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000);

            for (const event of events) {
                const startTime = new Date(event.startTime);
                const notifKey = `event-soon-${event.id}-${startTime.toISOString()}`;

                if (sentIds.has(notifKey)) continue;

                // Event starts between now and 30 minutes from now
                if (startTime > now && startTime <= thirtyMinLater) {
                    const minutesUntil = Math.round((startTime.getTime() - now.getTime()) / 60000);
                    const startsInText = minutesUntil <= 1 ? 'in about a minute' : `in ${minutesUntil} minutes`;
                    try {
                        await createEventNotification(user.uid, event.title, event.id, startsInText);
                        markSent(notifKey);
                    } catch {
                        // Notification create failed silently
                    }
                }
            }
        };

        // Run immediately on mount and every 5 minutes
        checkAndNotify();
        intervalRef.current = setInterval(checkAndNotify, CHECK_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [user, tasks, events]);
}
