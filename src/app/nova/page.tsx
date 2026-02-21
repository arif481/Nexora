'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Sparkles, Brain, Zap, PenTool, TrendingUp, LogIn,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import type { AIContext } from '@/lib/services/gemini';

import { DailyDigest } from '@/components/features/nova/DailyDigest';
import { ProactiveNudges } from '@/components/features/nova/ProactiveNudges';
import {
    AutomationRules,
    type AutomationRule,
} from '@/components/features/nova/AutomationRules';
import { MonthlyInsights } from '@/components/features/nova/MonthlyInsights';
import { AIWritingTools } from '@/components/features/nova/AIWritingTools';
import {
    generateNudges,
    generateDailyDigest,
} from '@/lib/services/nova-intelligence';

type Tab = 'overview' | 'automation' | 'writing' | 'insights';

const TABS: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'writing', label: 'Writing Tools', icon: PenTool },
    { id: 'insights', label: 'Insights', icon: Brain },
];

export default function NovaPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { tasks } = useTasks();
    const { goals } = useGoals();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem('nexora_nova_rules');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt) }));
            }
        } catch { }
        return [];
    });

    // Persist automation rules to localStorage
    useEffect(() => {
        try { localStorage.setItem('nexora_nova_rules', JSON.stringify(automationRules)); } catch { }
    }, [automationRules]);

    // Build context from available data
    const aiContext: AIContext = useMemo(() => ({
        tasks: tasks || [],
        goals: goals || [],
        pathname: '/nova',
    }), [tasks, goals]);

    const nudges = useMemo(() => {
        const all = generateNudges({ tasks, goals });
        return all.filter(n => !dismissedNudges.has(n.id));
    }, [tasks, goals, dismissedNudges]);

    const digestData = useMemo(() => generateDailyDigest({
        tasks,
        goals,
    }), [tasks, goals]);

    const handleDismissNudge = useCallback((id: string) => {
        setDismissedNudges(prev => new Set(prev).add(id));
    }, []);

    // Automation rules handlers (persisted via localStorage)
    const handleAddRule = useCallback((rule: Omit<AutomationRule, 'id' | 'createdAt'>) => {
        setAutomationRules(prev => [
            { ...rule, id: `rule_${Date.now()}`, createdAt: new Date() },
            ...prev,
        ]);
    }, []);

    const handleToggleRule = useCallback((id: string, enabled: boolean) => {
        setAutomationRules(prev =>
            prev.map(r => r.id === id ? { ...r, enabled } : r)
        );
    }, []);

    const handleDeleteRule = useCallback((id: string) => {
        setAutomationRules(prev => prev.filter(r => r.id !== id));
    }, []);

    if (authLoading) {
        return (
            <MainLayout>
                <PageContainer title="NOVA Intelligence" subtitle="Your AI-powered life assistant">
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        <LoadingSpinner size="lg" />
                    </div>
                </PageContainer>
            </MainLayout>
        );
    }

    if (!user) {
        return (
            <MainLayout>
                <PageContainer title="NOVA Intelligence" subtitle="Your AI-powered life assistant">
                    <Card variant="glass" className="max-w-md mx-auto p-8 text-center">
                        <LogIn className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Sign in to access NOVA</h3>
                        <p className="text-dark-400 mb-6">Unlock AI-powered insights, automation, and writing tools.</p>
                        <Button variant="glow" onClick={() => router.push('/auth/login')}>Sign In</Button>
                    </Card>
                </PageContainer>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <PageContainer title="NOVA Intelligence" subtitle="AI-powered insights, automation & tools">
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                                    activeTab === tab.id
                                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                                        : 'bg-dark-800/50 text-dark-300 hover:text-white border border-transparent'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <DailyDigest data={digestData} />
                            <div className="space-y-6">
                                <ProactiveNudges nudges={nudges} onDismiss={handleDismissNudge} />
                                {nudges.length === 0 && (
                                    <Card variant="glass" className="p-6 text-center">
                                        <Sparkles className="w-8 h-8 text-neon-green mx-auto mb-3" />
                                        <p className="text-sm text-dark-300">All clear! No nudges right now.</p>
                                        <p className="text-xs text-dark-500 mt-1">NOVA is monitoring your data and will alert you when needed.</p>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'automation' && (
                        <AutomationRules
                            rules={automationRules}
                            onAddRule={handleAddRule}
                            onToggleRule={handleToggleRule}
                            onDeleteRule={handleDeleteRule}
                        />
                    )}

                    {activeTab === 'writing' && (
                        <AIWritingTools context={aiContext} />
                    )}

                    {activeTab === 'insights' && (
                        <MonthlyInsights context={aiContext} />
                    )}
                </motion.div>
            </PageContainer>
        </MainLayout>
    );
}
