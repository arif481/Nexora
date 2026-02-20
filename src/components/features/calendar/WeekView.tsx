import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { CalendarEvent, EventCategory } from '@/types';

interface WeekViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onTimeSlotClick: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeekView({ currentDate, events, onEventClick, onTimeSlotClick }: WeekViewProps) {
    // Get the start of the current week (Sunday)
    const weekStart = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }, [currentDate]);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [weekStart]);

    const getEventsForDayAndHour = (date: Date, hour: number) => {
        return events.filter(event => {
            if (event.allDay) return false;
            const eventStart = new Date(event.startTime);
            return (
                eventStart.getDate() === date.getDate() &&
                eventStart.getMonth() === date.getMonth() &&
                eventStart.getFullYear() === date.getFullYear() &&
                eventStart.getHours() === hour
            );
        });
    };

    const getCategoryColor = (category: EventCategory) => {
        const map: Record<EventCategory, string> = {
            work: 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan',
            personal: 'bg-neon-purple/20 border-neon-purple text-neon-purple',
            health: 'bg-neon-green/20 border-neon-green text-neon-green',
            social: 'bg-neon-orange/20 border-neon-orange text-neon-orange',
            learning: 'bg-neon-pink/20 border-neon-pink text-neon-pink',
            rest: 'bg-blue-500/20 border-blue-500 text-blue-500',
            other: 'bg-gray-500/20 border-gray-500 text-gray-500',
        };
        return map[category] || map['other'];
    };

    const formatHour = (hour: number) => {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    };

    return (
        <Card variant="glass" className="flex flex-col h-[600px] overflow-hidden">
            {/* Header */}
            <div className="flex border-b border-dark-700 bg-dark-800/50 sticky top-0 z-10 pr-2">
                <div className="w-16 flex-shrink-0" /> {/* Time column header placeholder */}
                {weekDays.map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                        <div key={i} className="flex-1 text-center py-3 border-l border-dark-700">
                            <div className="text-xs text-dark-400 font-medium uppercase tracking-wider">{DAYS[date.getDay()]}</div>
                            <div className={cn(
                                "text-lg font-semibold mt-1 w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                                isToday ? "bg-neon-cyan text-black" : "text-white"
                            )}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Grid scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="flex min-w-max md:min-w-full">
                    {/* Time scale */}
                    <div className="w-16 flex-shrink-0 bg-dark-800/30">
                        {HOURS.map(hour => (
                            <div key={hour} className="h-20 border-b border-dark-700/50 flex items-start justify-center text-[10px] text-dark-500 pt-1">
                                {formatHour(hour)}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    {weekDays.map((date, dayIdx) => (
                        <div key={dayIdx} className="flex-1 border-l border-dark-700/50 relative min-w-[120px]">
                            {HOURS.map(hour => {
                                const hourEvents = getEventsForDayAndHour(date, hour);
                                return (
                                    <div
                                        key={hour}
                                        className="h-20 border-b border-dark-700/50 relative group cursor-pointer hover:bg-dark-700/20 transition-colors"
                                        onClick={() => onTimeSlotClick(date, hour)}
                                    >
                                        {/* Event Blocks */}
                                        <div className="absolute inset-0 px-1 py-0.5 overflow-hidden flex flex-col gap-0.5">
                                            {hourEvents.map(event => {
                                                const start = new Date(event.startTime);
                                                const end = new Date(event.endTime);
                                                const durationMins = (end.getTime() - start.getTime()) / (1000 * 60);
                                                const heightPx = Math.max(16, (durationMins / 60) * 80 - 4); // 80px per hour

                                                return (
                                                    <div
                                                        key={event.id}
                                                        style={{ height: `${heightPx}px`, minHeight: '1.5rem' }}
                                                        className={cn(
                                                            "w-full rounded border p-1 text-xs truncate transition-all hover:brightness-125 z-10 shadow-sm relative",
                                                            getCategoryColor(event.category)
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEventClick(event);
                                                        }}
                                                    >
                                                        <span className="font-semibold block truncate leading-tight">{event.title}</span>
                                                        {durationMins >= 45 && (
                                                            <span className="text-[9px] opacity-80 block truncate">
                                                                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
