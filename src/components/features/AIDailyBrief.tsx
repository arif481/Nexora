'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Sun, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface AIDailyBriefProps {
    generateBrief: (prompt: string) => Promise<string>;
    userName?: string;
    taskCount?: number;
    habitsDueToday?: number;
}

const CACHE_KEY_PREFIX = 'nexora_daily_brief_';

function todayKey() {
    return CACHE_KEY_PREFIX + new Date().toISOString().split('T')[0];
}

export function AIDailyBrief({
    generateBrief,
    userName = 'there',
    taskCount = 0,
    habitsDueToday = 0,
}: AIDailyBriefProps) {
    const [brief, setBrief] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTimeGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const generate = useCallback(async (force = false) => {
        const key = todayKey();
        if (!force) {
            const cached = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
            if (cached) { setBrief(cached); return; }
        }
        setLoading(true);
        setError(null);
        try {
            const prompt = `You are NOVA, a friendly AI life assistant. Generate a short, warm morning briefing (3–4 sentences max) for ${userName}. They have ${taskCount} pending tasks and ${habitsDueToday} habits due today. Give one concrete focus tip for today and one motivational nudge. Be specific, uplifting, and concise.`;
            const result = await generateBrief(prompt);
            setBrief(result);
            if (typeof window !== 'undefined') localStorage.setItem(key, result);
        } catch (e: any) {
            setError('Could not generate brief. Check your AI key.');
        } finally {
            setLoading(false);
        }
    }, [generateBrief, userName, taskCount, habitsDueToday]);

    useEffect(() => { generate(); }, [generate]);

    return (
        <Card variant="glass" className="border border-neon-cyan/20 bg-gradient-to-br from-neon-cyan/5 to-transparent">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-xl bg-neon-cyan/20">
                            <Sun className="w-5 h-5 text-neon-cyan" />
                        </div>
                        <div>
                            <p className="text-xs text-neon-cyan font-medium uppercase tracking-wide">AI Daily Brief</p>
                            <p className="text-sm text-dark-400">{getTimeGreeting()}, {userName}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generate(true)}
                        disabled={loading}
                        leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
                    >
                        Refresh
                    </Button>
                </div>

                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={`h-3 rounded-full bg-dark-700 animate-pulse ${i === 2 ? 'w-3/4' : 'w-full'}`} />
                            ))}
                        </motion.div>
                    )}
                    {!loading && error && (
                        <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-neon-orange">
                            {error}
                        </motion.p>
                    )}
                    {!loading && brief && (
                        <motion.div key="brief" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                            <p className="text-sm text-dark-200 leading-relaxed">{brief}</p>
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-700">
                                <span className="text-xs text-dark-400">
                                    📋 {taskCount} tasks · 🌿 {habitsDueToday} habits today
                                </span>
                                <Sparkles className="w-3.5 h-3.5 text-neon-cyan ml-auto" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
