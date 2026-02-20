'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertTriangle, Lightbulb, Trophy, Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Nudge } from '@/lib/services/nova-intelligence';
import { useRouter } from 'next/navigation';

interface ProactiveNudgesProps {
    nudges: Nudge[];
    onDismiss: (nudgeId: string) => void;
}

const TYPE_STYLES: Record<string, { icon: typeof Sparkles; color: string; bg: string }> = {
    insight: { icon: Lightbulb, color: 'text-neon-cyan', bg: 'border-neon-cyan/20 bg-neon-cyan/5' },
    reminder: { icon: Bell, color: 'text-neon-orange', bg: 'border-neon-orange/20 bg-neon-orange/5' },
    suggestion: { icon: Sparkles, color: 'text-neon-purple', bg: 'border-neon-purple/20 bg-neon-purple/5' },
    celebration: { icon: Trophy, color: 'text-neon-green', bg: 'border-neon-green/20 bg-neon-green/5' },
    warning: { icon: AlertTriangle, color: 'text-status-error', bg: 'border-status-error/20 bg-status-error/5' },
};

export function ProactiveNudges({ nudges, onDismiss }: ProactiveNudgesProps) {
    const router = useRouter();

    if (nudges.length === 0) return null;

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-medium text-dark-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
                NOVA Nudges
            </h3>
            <AnimatePresence mode="popLayout">
                {nudges.slice(0, 5).map(nudge => {
                    const style = TYPE_STYLES[nudge.type] || TYPE_STYLES.suggestion;
                    const Icon = style.icon;

                    return (
                        <motion.div
                            key={nudge.id}
                            layout
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                            className={cn(
                                'relative p-4 rounded-xl border transition-colors',
                                style.bg
                            )}
                        >
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Icon className={cn('w-5 h-5', style.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-white mb-0.5">{nudge.title}</h4>
                                    <p className="text-xs text-dark-400">{nudge.body}</p>
                                    {nudge.actionLabel && nudge.actionUrl && (
                                        <button
                                            onClick={() => router.push(nudge.actionUrl!)}
                                            className={cn('mt-2 text-xs font-medium flex items-center gap-1 hover:underline', style.color)}
                                        >
                                            {nudge.actionLabel}
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                {nudge.dismissable && (
                                    <button
                                        onClick={() => onDismiss(nudge.id)}
                                        className="flex-shrink-0 p-1 rounded-md hover:bg-dark-700/50 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5 text-dark-500" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
