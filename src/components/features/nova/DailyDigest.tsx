'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
    Sun, Calendar, CheckCircle2, Flame, TrendingUp,
    Droplets, Quote, Sparkles,
} from 'lucide-react';
import type { DailyDigestData } from '@/lib/services/nova-intelligence';

interface DailyDigestProps {
    data: DailyDigestData;
}

export function DailyDigest({ data }: DailyDigestProps) {
    return (
        <Card variant="glass" className="overflow-hidden">
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-neon-purple/20 via-neon-cyan/10 to-neon-pink/20 px-5 pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-neon-cyan" />
                    <span className="text-xs font-medium text-neon-cyan uppercase tracking-wider">NOVA Daily Digest</span>
                </div>
                <h2 className="text-xl font-bold text-white">{data.greeting}</h2>
                <p className="text-sm text-dark-300 mt-1">{data.date}</p>
                <p className="text-sm text-dark-400 mt-2">{data.summary}</p>
            </div>

            <CardContent className="space-y-5 pt-4">
                {/* Today's Tasks */}
                {data.todaysTasks.length > 0 && (
                    <div>
                        <h4 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Today's Focus
                        </h4>
                        <div className="space-y-2">
                            {data.todaysTasks.map((task, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-800/40">
                                    <span className="text-sm text-white truncate flex-1 mr-2">{task.title}</span>
                                    <Badge
                                        variant={task.priority === 'high' ? 'orange' : task.priority === 'medium' ? 'cyan' : 'default'}
                                        size="sm"
                                    >
                                        {task.dueText}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Events */}
                {data.upcomingEvents.length > 0 && (
                    <div>
                        <h4 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            Coming Up
                        </h4>
                        <div className="space-y-2">
                            {data.upcomingEvents.map((event, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-800/40">
                                    <span className="text-sm text-white">{event.title}</span>
                                    <span className="text-xs text-dark-400 font-mono">{event.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Habit Streaks */}
                {data.habitStreaks.length > 0 && (
                    <div>
                        <h4 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Flame className="w-3.5 h-3.5" />
                            Active Streaks
                        </h4>
                        <div className="flex gap-3">
                            {data.habitStreaks.map((h, i) => (
                                <div key={i} className="flex-1 p-3 rounded-lg bg-dark-800/40 text-center">
                                    <p className="text-lg font-bold text-neon-orange">{h.streak}d</p>
                                    <p className="text-[11px] text-dark-400 truncate">{h.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Finance + Wellness row */}
                <div className="grid grid-cols-2 gap-3">
                    {data.financeAlert && (
                        <div className="p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/10">
                            <TrendingUp className="w-4 h-4 text-neon-cyan mb-1.5" />
                            <p className="text-xs text-dark-300">{data.financeAlert}</p>
                        </div>
                    )}
                    {data.wellnessTip && (
                        <div className="p-3 rounded-lg bg-neon-green/5 border border-neon-green/10">
                            <Droplets className="w-4 h-4 text-neon-green mb-1.5" />
                            <p className="text-xs text-dark-300">{data.wellnessTip}</p>
                        </div>
                    )}
                </div>

                {/* Quote */}
                <div className="p-4 rounded-xl bg-dark-800/30 border-l-2 border-neon-purple/50">
                    <Quote className="w-4 h-4 text-neon-purple mb-2" />
                    <p className="text-sm text-dark-300 italic">{data.motivationalQuote}</p>
                </div>
            </CardContent>
        </Card>
    );
}
