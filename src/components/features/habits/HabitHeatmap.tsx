import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import type { Habit } from '@/types';

// Helper to format date strictly to YYYY-MM-DD
const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function HabitHeatmap({ habit }: { habit: Habit & { color?: string } }) {
    const hueColor = habit.color || '#06b6d4'; // Default to cyan

    // Generate last 365 days
    const heatmapData = useMemo(() => {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d);
        }
        return dates;
    }, []);

    const completionSet = useMemo(() => {
        const set = new Set<string>();
        habit.completions?.forEach(c => {
            if (c.completed) {
                set.add(formatDate(new Date(c.date)));
            }
        });
        return set;
    }, [habit.completions]);

    // Group by weeks for the grid
    const weeks = useMemo(() => {
        const wks = [];
        let currentWeek = [];

        // pad the first week if the first day is not sunday
        const firstDay = heatmapData[0].getDay();
        for (let i = 0; i < firstDay; i++) {
            currentWeek.push(null);
        }

        for (const d of heatmapData) {
            if (currentWeek.length === 7) {
                wks.push(currentWeek);
                currentWeek = [];
            }
            currentWeek.push(d);
        }

        // pad the last week 
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) currentWeek.push(null);
            wks.push(currentWeek);
        }

        return wks;
    }, [heatmapData]);

    const monthLabels = useMemo(() => {
        const labels = [];
        let lastMonth = -1;
        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            const day = week.find(d => d !== null);
            if (day) {
                const m = day.getMonth();
                if (m !== lastMonth) {
                    labels.push({ x: i, label: day.toLocaleString('default', { month: 'short' }) });
                    lastMonth = m;
                }
            }
        }
        return labels;
    }, [weeks]);

    return (
        <Card variant="glass" className="p-4 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-medium text-white">Annual Consistency</h3>
                <p className="text-xs text-dark-400">365 Days Heatmap</p>
            </div>
            <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                <div className="min-w-max flex flex-col gap-1">
                    {/* Month labels */}
                    <div className="flex text-xs text-dark-400 mb-1" style={{ paddingLeft: '24px' }}>
                        {monthLabels.map((m, i) => (
                            <div key={i} style={{ position: 'absolute', marginLeft: `${m.x * 14}px` }}>{m.label}</div>
                        ))}
                    </div>

                    <div className="flex gap-1 h-32 relative mt-4">
                        {/* Day labels (Sun, Mon, etc) */}
                        <div className="flex flex-col gap-1 text-[10px] text-dark-500 pr-2 pt-1">
                            <span className="h-2.5 flex items-center"></span>
                            <span className="h-2.5 flex items-center">Mon</span>
                            <span className="h-2.5 flex items-center"></span>
                            <span className="h-2.5 flex items-center">Wed</span>
                            <span className="h-2.5 flex items-center"></span>
                            <span className="h-2.5 flex items-center">Fri</span>
                            <span className="h-2.5 flex items-center"></span>
                        </div>

                        {weeks.map((week, wIndex) => (
                            <div key={wIndex} className="flex flex-col gap-1">
                                {week.map((day, dIndex) => {
                                    if (!day) return <div key={dIndex} className="w-2.5 h-2.5 rounded-sm bg-transparent" />;

                                    const isCompleted = completionSet.has(formatDate(day));
                                    const isTargetDay = habit.targetDays?.includes(day.getDay());
                                    const bgClass = isCompleted ? 'bg-opacity-100' : isTargetDay ? 'bg-dark-800' : 'bg-dark-800/30';

                                    return (
                                        <div
                                            key={dIndex}
                                            className={`w-2.5 h-2.5 rounded-sm transition-colors ${bgClass}`}
                                            style={{ backgroundColor: isCompleted ? hueColor : undefined }}
                                            title={`${formatDate(day)}: ${isCompleted ? 'Completed' : 'Missed'}`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
