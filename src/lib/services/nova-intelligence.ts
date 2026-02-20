/* eslint-disable @typescript-eslint/no-explicit-any */
// NOVA Proactive Nudges - Intelligence that generates contextual suggestions
import { generateGeminiResponse, isAIConfigured, type AIContext } from './gemini';

export interface Nudge {
    id: string;
    type: 'insight' | 'reminder' | 'suggestion' | 'celebration' | 'warning';
    icon: string;
    title: string;
    body: string;
    actionLabel?: string;
    actionUrl?: string;
    priority: 'low' | 'medium' | 'high';
    category: 'tasks' | 'habits' | 'finance' | 'wellness' | 'goals' | 'calendar' | 'general';
    dismissable: boolean;
}

export interface DailyDigestData {
    greeting: string;
    date: string;
    summary: string;
    todaysTasks: { title: string; priority: string; dueText: string }[];
    upcomingEvents: { title: string; time: string }[];
    habitStreaks: { name: string; streak: number }[];
    financeAlert?: string;
    wellnessTip?: string;
    motivationalQuote: string;
}

// Generate proactive nudges based on current user data
export function generateNudges(context: {
    tasks?: Record<string, any>[];
    habits?: Record<string, any>[];
    events?: Record<string, any>[];
    goals?: Record<string, any>[];
    transactions?: Record<string, any>[];
    wellnessEntries?: Record<string, any>[];
}): Nudge[] {
    const nudges: Nudge[] = [];
    const now = new Date();

    // --- Task Nudges ---
    if (context.tasks) {
        const overdueTasks = context.tasks.filter(t => {
            if (!t.dueDate || t.status === 'done') return false;
            return new Date(t.dueDate) < now;
        });
        if (overdueTasks.length > 0) {
            nudges.push({
                id: 'overdue-tasks',
                type: 'warning',
                icon: '⚠️',
                title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
                body: `"${overdueTasks[0].title}"${overdueTasks.length > 1 ? ` and ${overdueTasks.length - 1} more` : ''} need your attention.`,
                actionLabel: 'View Tasks',
                actionUrl: '/tasks',
                priority: 'high',
                category: 'tasks',
                dismissable: true,
            });
        }

        const todayTasks = context.tasks.filter(t => {
            if (!t.dueDate || t.status === 'done') return false;
            const d = new Date(t.dueDate);
            return d.toDateString() === now.toDateString();
        });
        if (todayTasks.length > 0) {
            nudges.push({
                id: 'today-tasks',
                type: 'reminder',
                icon: '📋',
                title: `${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today`,
                body: `Focus on "${todayTasks[0].title}" first.`,
                actionLabel: 'Plan My Day',
                actionUrl: '/tasks',
                priority: 'medium',
                category: 'tasks',
                dismissable: true,
            });
        }
    }

    // --- Habit Nudges ---
    if (context.habits) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const highStreaks = context.habits.filter((h: any) => h.streak >= 7);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        highStreaks.forEach((h: any) => {
            nudges.push({
                id: `streak-${h.id}`,
                type: 'celebration',
                icon: '🔥',
                title: `${h.streak}-day streak on "${h.name}"!`,
                body: 'Keep the momentum going — you\'re building a powerful routine.',
                priority: 'low',
                category: 'habits',
                dismissable: true,
            });
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const incompleteToday = context.habits.filter((h: any) => {
            const today = now.toISOString().split('T')[0];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const completedToday = h.completions?.some((c: any) =>
                new Date(c.date || c.completedAt).toISOString().split('T')[0] === today
            );
            return !completedToday;
        });
        if (incompleteToday.length > 0 && now.getHours() >= 18) {
            nudges.push({
                id: 'evening-habits',
                type: 'reminder',
                icon: '🌙',
                title: `${incompleteToday.length} habit${incompleteToday.length > 1 ? 's' : ''} left today`,
                body: 'Evening check-in — still time to complete your habits.',
                actionLabel: 'Go to Habits',
                actionUrl: '/habits',
                priority: 'medium',
                category: 'habits',
                dismissable: true,
            });
        }
    }

    // --- Calendar Nudges ---
    if (context.events) {
        const upcomingToday = context.events.filter(e => {
            const start = new Date(e.startTime);
            return start.toDateString() === now.toDateString() && start > now;
        });
        if (upcomingToday.length > 0) {
            const next = upcomingToday[0];
            const minutesUntil = Math.round((new Date(next.startTime).getTime() - now.getTime()) / 60000);
            if (minutesUntil <= 60) {
                nudges.push({
                    id: `next-event-${next.id}`,
                    type: 'reminder',
                    icon: '📅',
                    title: `"${next.title}" in ${minutesUntil}m`,
                    body: 'Prepare or review your agenda.',
                    actionLabel: 'View Event',
                    actionUrl: '/calendar',
                    priority: 'high',
                    category: 'calendar',
                    dismissable: true,
                });
            }
        }
    }

    // --- Finance Nudges ---
    if (context.transactions && context.transactions.length > 0) {
        const thisMonth = context.transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
        });
        const total = thisMonth.reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
        if (total > 0) {
            nudges.push({
                id: 'monthly-spending',
                type: 'insight',
                icon: '💰',
                title: `$${total.toLocaleString()} spent this month`,
                body: 'Check your budget to stay on track.',
                actionLabel: 'View Finance',
                actionUrl: '/finance',
                priority: 'low',
                category: 'finance',
                dismissable: true,
            });
        }
    }

    // --- Goals Nudges ---
    if (context.goals) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const staleGoals = context.goals.filter((g: any) => {
            if (g.status === 'completed') return false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updated = new Date(g.updatedAt || g.createdAt);
            const daysSinceUpdate = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
            return daysSinceUpdate >= 7;
        });
        if (staleGoals.length > 0) {
            nudges.push({
                id: 'stale-goals',
                type: 'suggestion',
                icon: '🎯',
                title: `${staleGoals.length} goal${staleGoals.length > 1 ? 's' : ''} need attention`,
                body: `"${staleGoals[0].title}" hasn't been updated in a week.`,
                actionLabel: 'Review Goals',
                actionUrl: '/goals',
                priority: 'medium',
                category: 'goals',
                dismissable: true,
            });
        }
    }

    return nudges.sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 };
        return p[a.priority] - p[b.priority];
    });
}

// Generate the Daily Digest using context
export function generateDailyDigest(context: {
    tasks?: Record<string, any>[];
    habits?: Record<string, any>[];
    events?: Record<string, any>[];
    goals?: Record<string, any>[];
    transactions?: Record<string, any>[];
    profile?: Record<string, any>;
}): DailyDigestData {
    const now = new Date();
    const hour = now.getHours();
    const name = context.profile?.displayName?.split(' ')[0] || 'there';

    let greeting: string;
    if (hour < 12) greeting = `Good morning, ${name} ☀️`;
    else if (hour < 17) greeting = `Good afternoon, ${name} 🌤️`;
    else greeting = `Good evening, ${name} 🌙`;

    // Today's tasks
    const todaysTasks = (context.tasks || [])
        .filter(t => {
            if (t.status === 'done') return false;
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            return d.toDateString() === now.toDateString() || d < now;
        })
        .slice(0, 5)
        .map(t => ({
            title: t.title,
            priority: t.priority || 'medium',
            dueText: new Date(t.dueDate).toDateString() === now.toDateString() ? 'Due today' : 'Overdue',
        }));

    // Upcoming events
    const upcomingEvents = (context.events || [])
        .filter(e => {
            const s = new Date(e.startTime);
            return s.toDateString() === now.toDateString() && s > now;
        })
        .slice(0, 4)
        .map(e => ({
            title: e.title,
            time: new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

    // Habit streaks
    const habitStreaks = (context.habits || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((h: any) => h.streak > 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => b.streak - a.streak)
        .slice(0, 3)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((h: any) => ({ name: h.name, streak: h.streak }));

    // Finance alert
    let financeAlert: string | undefined;
    if (context.transactions) {
        const thisMonth = context.transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && t.type === 'expense';
        });
        const total = thisMonth.reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
        if (total > 0) financeAlert = `$${total.toLocaleString()} spent so far this month.`;
    }

    // Summary
    const taskCount = todaysTasks.length;
    const eventCount = upcomingEvents.length;
    const parts: string[] = [];
    if (taskCount > 0) parts.push(`${taskCount} task${taskCount > 1 ? 's' : ''} to complete`);
    if (eventCount > 0) parts.push(`${eventCount} event${eventCount > 1 ? 's' : ''} coming up`);
    const summary = parts.length > 0
        ? `You have ${parts.join(' and ')} today.`
        : 'Your schedule looks clear today — a great time for deep work.';

    const quotes = [
        '"The secret of getting ahead is getting started." — Mark Twain',
        '"Small daily improvements are the key to staggering long-term results."',
        '"Consistency is more important than perfection."',
        '"What you do today can improve all your tomorrows."',
        '"The only way to do great work is to love what you do." — Steve Jobs',
    ];

    return {
        greeting,
        date: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        summary,
        todaysTasks,
        upcomingEvents,
        habitStreaks,
        financeAlert,
        wellnessTip: 'Remember to drink water and take movement breaks every hour.',
        motivationalQuote: quotes[now.getDate() % quotes.length],
    };
}

// Generate AI-powered automation rule suggestions
export async function generateAIAutomationSuggestions(context: AIContext): Promise<string[]> {
    if (!isAIConfigured()) return [];
    try {
        const res = await generateGeminiResponse(
            'Based on my data, suggest 3 simple automation rules I could set up. Format each as a short IFTTT-style rule with "When X → Do Y". Be specific to my actual data.',
            context
        );
        return res.suggestions || [];
    } catch {
        return [];
    }
}

// Generate monthly life insights report via AI
export async function generateMonthlyInsights(context: AIContext): Promise<string> {
    if (!isAIConfigured()) {
        return 'Configure your Gemini API key in Settings to unlock Monthly Life Insights.';
    }
    try {
        const res = await generateGeminiResponse(
            'Generate a brief monthly life insights report for me. Cover: productivity trends, wellness patterns, financial health, habit consistency, and one actionable recommendation. Keep it under 200 words. Use markdown formatting with headers.',
            context
        );
        return res.content;
    } catch {
        return 'Unable to generate insights at this time. Please try again later.';
    }
}
