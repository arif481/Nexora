// Gamification Service - XP, levels, and achievements

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { XPEvent, XPEventType } from '@/types';

const COLLECTIONS = {
    XP_EVENTS: 'xpEvents',
};

// XP values per action
export const XP_VALUES: Record<XPEventType, number> = {
    task_complete: 20,
    habit_checkin: 15,
    focus_session: 25,
    journal_entry: 10,
    goal_milestone: 50,
    streak_bonus: 30,
};

// Level thresholds
export const LEVELS = [
    { level: 1, name: 'Beginner', minXP: 0, maxXP: 199, badge: '🌱' },
    { level: 2, name: 'Explorer', minXP: 200, maxXP: 499, badge: '🔍' },
    { level: 3, name: 'Achiever', minXP: 500, maxXP: 999, badge: '⚡' },
    { level: 4, name: 'Champion', minXP: 1000, maxXP: 1999, badge: '🏆' },
    { level: 5, name: 'Master', minXP: 2000, maxXP: 3999, badge: '🌟' },
    { level: 6, name: 'Legend', minXP: 4000, maxXP: 7999, badge: '👑' },
    { level: 7, name: 'Nexora Elite', minXP: 8000, maxXP: Infinity, badge: '💎' },
];

export function getLevelFromXP(totalXP: number) {
    return (
        LEVELS.slice().reverse().find(l => totalXP >= l.minXP) ?? LEVELS[0]
    );
}

export function getProgressToNextLevel(totalXP: number): number {
    const current = getLevelFromXP(totalXP);
    if (current.maxXP === Infinity) return 100;
    const range = current.maxXP - current.minXP;
    const progress = totalXP - current.minXP;
    return Math.min(100, Math.round((progress / range) * 100));
}

// Predefined achievements
export const ACHIEVEMENTS = [
    { id: 'first_task', name: 'First Steps', description: 'Complete your first task', icon: '✅', xp: 50, rarity: 'common' as const },
    { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', xp: 100, rarity: 'rare' as const },
    { id: 'streak_30', name: 'Monthly Master', description: '30-day streak', icon: '🏆', xp: 500, rarity: 'epic' as const },
    { id: 'focus_10', name: 'Deep Worker', description: 'Complete 10 focus sessions', icon: '🧠', xp: 150, rarity: 'rare' as const },
    { id: 'journal_7', name: 'Reflector', description: 'Journal 7 days in a row', icon: '📔', xp: 100, rarity: 'rare' as const },
    { id: 'habit_perfect_week', name: 'Habit Hero', description: 'Complete all habits for a full week', icon: '💪', xp: 200, rarity: 'epic' as const },
    { id: 'savings_goal', name: 'Money Mindful', description: 'Reach a savings goal', icon: '💰', xp: 300, rarity: 'epic' as const },
    { id: 'level_5', name: 'Master Mind', description: 'Reach level 5', icon: '🌟', xp: 500, rarity: 'legendary' as const },
];

export async function awardXP(
    userId: string,
    type: XPEventType,
    description?: string
): Promise<void> {
    try {
        await addDoc(collection(db, COLLECTIONS.XP_EVENTS), {
            userId,
            type,
            xp: XP_VALUES[type],
            description: description || type.replace('_', ' '),
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.error('Failed to award XP:', err);
    }
}

export function subscribeToXPEvents(
    userId: string,
    callback: (events: XPEvent[], totalXP: number) => void,
    onError?: (err: Error) => void
): () => void {
    const q = query(
        collection(db, COLLECTIONS.XP_EVENTS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(
        q,
        (snap) => {
            const events = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    userId: data.userId,
                    type: data.type as XPEventType,
                    xp: data.xp ?? 0,
                    description: data.description ?? '',
                    createdAt: data.createdAt?.toDate?.() ?? new Date(),
                } as XPEvent;
            });
            const totalXP = events.reduce((sum, e) => sum + (e.xp ?? 0), 0);
            callback(events, totalXP);
        },
        (err) => {
            console.error('XP subscription error:', err);
            if (onError) onError(err);
        }
    );
}

export function subscribeToRecentXPEvents(
    userId: string,
    count: number,
    callback: (events: XPEvent[], totalXP: number) => void
): () => void {
    const q = query(
        collection(db, COLLECTIONS.XP_EVENTS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(count)
    );

    return onSnapshot(q, (snap) => {
        const events = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                userId: data.userId,
                type: data.type as XPEventType,
                xp: data.xp ?? 0,
                description: data.description ?? '',
                createdAt: data.createdAt?.toDate?.() ?? new Date(),
            } as XPEvent;
        });
        const totalXP = events.reduce((sum, e) => sum + (e.xp ?? 0), 0);
        callback(events, totalXP);
    });
}
