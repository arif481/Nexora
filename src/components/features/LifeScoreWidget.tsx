'use client';

import { useMemo } from 'react';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

interface LifeScoreProps {
    tasks?: { status: string }[];
    habits?: { completedDates?: string[] }[];
    focusMinutes?: number;
    journalCount?: number;
    transactions?: { type: string; amount: number }[];
    wellnessEntries?: { sleep?: { quality: number } }[];
}

const DIMENSIONS = [
    { key: 'productivity', label: 'Productivity' },
    { key: 'health', label: 'Health' },
    { key: 'finance', label: 'Finance' },
    { key: 'learning', label: 'Learning' },
    { key: 'wellbeing', label: 'Wellbeing' },
    { key: 'social', label: 'Social' },
    { key: 'fun', label: 'Fun' },
    { key: 'purpose', label: 'Purpose' },
];

function clamp(v: number, min = 0, max = 10) {
    return Math.min(max, Math.max(min, Math.round(v)));
}

export function LifeScoreWidget({
    tasks = [],
    habits = [],
    focusMinutes = 0,
    journalCount = 0,
    transactions = [],
    wellnessEntries = [],
}: LifeScoreProps) {
    const scores = useMemo(() => {
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const totalTasks = tasks.length || 1;
        const productivity = clamp((completedTasks / totalTasks) * 10 * 0.6 + Math.min(focusMinutes / 60, 4) * 0.4 * 10 / 4);

        const avgSleepQuality = wellnessEntries.length
            ? wellnessEntries.reduce((s, e) => s + (e.sleep?.quality ?? 50), 0) / wellnessEntries.length / 10
            : 5;
        const health = clamp(avgSleepQuality);

        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const savingsRate = income > 0 ? ((income - expenses) / income) : 0;
        const finance = clamp(5 + savingsRate * 5);

        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
        const habitDays = new Set(
            habits.flatMap(h =>
                (h.completedDates ?? []).filter(d => new Date(d) >= thirtyDaysAgo)
            )
        ).size;
        const learning = clamp((focusMinutes / 300) * 5 + (habitDays / 30) * 5);

        const wellbeing = clamp(journalCount > 0 ? Math.min(journalCount * 1.5 + 3, 10) : 4);
        const social = clamp(5); // placeholder until social features added
        const fun = clamp(4 + Math.min(habitDays / 10, 3));
        const purpose = clamp((productivity + wellbeing + learning) / 3);

        return [
            { dimension: 'Productivity', score: productivity },
            { dimension: 'Health', score: health },
            { dimension: 'Finance', score: finance },
            { dimension: 'Learning', score: learning },
            { dimension: 'Wellbeing', score: wellbeing },
            { dimension: 'Social', score: social },
            { dimension: 'Fun', score: fun },
            { dimension: 'Purpose', score: purpose },
        ];
    }, [tasks, habits, focusMinutes, journalCount, transactions, wellnessEntries]);

    const overallScore = useMemo(
        () => Math.round(scores.reduce((s, d) => s + d.score, 0) / scores.length * 10),
        [scores]
    );

    return (
        <Card variant="glass" className="p-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3 px-5 pt-5 pb-2">
                <div className="p-2 rounded-xl bg-neon-cyan/20">
                    <Sparkles className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Life Score</h3>
                    <p className="text-sm text-dark-400">Your 8-dimension overview</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-2xl font-bold text-neon-cyan">{overallScore}</p>
                    <p className="text-xs text-dark-400">/ 100</p>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={scores} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis
                                dataKey="dimension"
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                            />
                            <Radar
                                name="Score"
                                dataKey="score"
                                stroke="#06b6d4"
                                fill="#06b6d4"
                                fillOpacity={0.3}
                                strokeWidth={2}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '0.75rem',
                                    color: '#fff',
                                    fontSize: 12,
                                }}
                                formatter={(v: number) => [`${v}/10`, 'Score']}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
