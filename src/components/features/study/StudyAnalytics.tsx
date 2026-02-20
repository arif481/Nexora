'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    Tooltip as RechartsTooltip,
} from 'recharts';
import { Clock, Brain, TrendingUp, Target, Sparkles, BookOpen } from 'lucide-react';
import type { StudySession, Subject } from '@/types';

interface StudyAnalyticsProps {
    sessions: StudySession[];
    subjects: Subject[];
}

export function StudyAnalytics({ sessions, subjects }: StudyAnalyticsProps) {
    const stats = useMemo(() => {
        const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
        const totalCards = sessions.reduce((sum, s) => sum + (s.cardsReviewed || 0), 0);
        const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
        const accuracy = totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0;

        // Weekly breakdown
        const weeklyData: Record<string, number> = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-US', { weekday: 'short' });
            weeklyData[key] = 0;
        }
        sessions.forEach(s => {
            const d = new Date(s.startTime);
            const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 7 && diffDays >= 0) {
                const key = d.toLocaleDateString('en-US', { weekday: 'short' });
                weeklyData[key] = (weeklyData[key] || 0) + s.duration;
            }
        });

        const chartData = Object.entries(weeklyData).map(([day, minutes]) => ({ day, minutes }));

        // Subject breakdown
        const subjectMap = new Map<string, number>();
        sessions.forEach(s => {
            subjectMap.set(s.subjectId, (subjectMap.get(s.subjectId) || 0) + s.duration);
        });
        const subjectBreakdown = Array.from(subjectMap.entries())
            .map(([id, minutes]) => {
                const subject = subjects.find(s => s.id === id);
                return { name: subject?.name || 'Unknown', minutes, color: subject?.color || '#6b7280' };
            })
            .sort((a, b) => b.minutes - a.minutes);

        return { totalMinutes, totalCards, accuracy, chartData, subjectBreakdown };
    }, [sessions, subjects]);

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neon-cyan" />
                Study Analytics
            </h3>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="glass" className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-dark-400">Total Study</span>
                        <Clock className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <p className="text-2xl font-bold text-white">{formatTime(stats.totalMinutes)}</p>
                    <p className="text-xs text-dark-500">this week</p>
                </Card>

                <Card variant="glass" className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-dark-400">Cards Reviewed</span>
                        <Brain className="w-5 h-5 text-neon-purple" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalCards}</p>
                    <p className="text-xs text-dark-500">flashcards</p>
                </Card>

                <Card variant="glass" className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-dark-400">Accuracy</span>
                        <Target className="w-5 h-5 text-neon-green" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.accuracy}%</p>
                    <p className="text-xs text-dark-500">correct answers</p>
                </Card>

                <Card variant="glass" className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-dark-400">Subjects</span>
                        <BookOpen className="w-5 h-5 text-neon-orange" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.subjectBreakdown.length}</p>
                    <p className="text-xs text-dark-500">studied this week</p>
                </Card>
            </div>

            {/* Weekly Chart */}
            <Card variant="glass">
                <CardHeader>
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-neon-cyan" />
                        Weekly Study Time
                    </h4>
                </CardHeader>
                <CardContent>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: '0.75rem',
                                        color: '#fff',
                                        fontSize: 12,
                                    }}
                                    formatter={(value: number) => [`${value} min`, 'Study Time']}
                                />
                                <Bar dataKey="minutes" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Subject Breakdown */}
            {stats.subjectBreakdown.length > 0 && (
                <Card variant="glass" className="p-5">
                    <h4 className="text-sm font-medium text-white mb-4">Time by Subject</h4>
                    <div className="space-y-3">
                        {stats.subjectBreakdown.map(sub => {
                            const pct = stats.totalMinutes > 0 ? (sub.minutes / stats.totalMinutes) * 100 : 0;
                            return (
                                <div key={sub.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white font-medium">{sub.name}</span>
                                        <span className="text-dark-400">{formatTime(sub.minutes)}</span>
                                    </div>
                                    <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%`, backgroundColor: sub.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
}
