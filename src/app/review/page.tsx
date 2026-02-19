'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
    ResponsiveContainer, CartesianGrid, LineChart, Line,
} from 'recharts';
import {
    Sparkles, Calendar, TrendingUp, BookOpen,
    Target, Brain, RefreshCw, CheckCircle2, LogIn,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleAI } from '@/hooks/useAI';
import { generateAIResponse } from '@/lib/services/ai';

import { useTransactions } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';

const CHART_STYLE = {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.75rem',
    color: '#fff',
    fontSize: 12,
};

function getWeekRange() {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
}

export default function WeeklyReviewPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { isThinking: aiLoading } = useSimpleAI();

    const { transactions } = useTransactions();

    const [narrative, setNarrative] = useState<string | null>(null);
    const [intentions, setIntentions] = useState('');
    const [generating, setGenerating] = useState(false);

    const { start } = getWeekRange();

    const weekTransactions = useMemo(() =>
        transactions.filter(t => new Date(t.date) >= start),
        [transactions, start]
    );

    const spendingData = useMemo(() => {
        const days: Record<string, number> = {};
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = labels[d.getDay() === 0 ? 6 : d.getDay() - 1];
            days[key] = days[key] || 0;
        }
        weekTransactions.filter(t => t.type === 'expense').forEach(t => {
            const d = new Date(t.date);
            const key = labels[d.getDay() === 0 ? 6 : d.getDay() - 1];
            if (key in days) days[key] += t.amount;
        });
        return labels.map(day => ({ day, amount: Math.round(days[day] || 0) }));
    }, [weekTransactions]);

    const weekStats = useMemo(() => {
        const income = weekTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = weekTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return { income, expenses, saved: income - expenses };
    }, [weekTransactions]);

    const generateReview = async () => {
        setGenerating(true);
        try {
            const prompt = `Generate a warm, insightful weekly review narrative (4–5 sentences) for a life OS user. This week: spent $${weekStats.expenses.toFixed(0)}, earned $${weekStats.income.toFixed(0)}, saved $${weekStats.saved.toFixed(0)}. Focus on patterns, wins, and one gentle suggestion for next week. Be personalized and encouraging.`;
            const result = await generateAIResponse(prompt);
            setNarrative(result.content || null);
        } catch {
            setNarrative('Could not generate review. Please check your AI settings.');
        } finally {
            setGenerating(false);
        }
    };

    if (authLoading) return <MainLayout><PageContainer title="Weekly Review"><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></PageContainer></MainLayout>;

    if (!user) return (
        <MainLayout>
            <PageContainer title="Weekly Review" subtitle="Reflect on your week">
                <Card variant="glass" className="max-w-md mx-auto p-8 text-center">
                    <LogIn className="w-10 h-10 text-neon-cyan mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Sign in to review your week</h3>
                    <Button variant="glow" onClick={() => router.push('/auth/login')}>Sign In</Button>
                </Card>
            </PageContainer>
        </MainLayout>
    );

    return (
        <MainLayout>
            <PageContainer title="Weekly Review" subtitle="Reflect on your week and set intentions">
                <div className="space-y-6">
                    {/* Stats row */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Income', value: `$${weekStats.income.toFixed(0)}`, color: 'text-neon-green', icon: TrendingUp },
                            { label: 'Spent', value: `$${weekStats.expenses.toFixed(0)}`, color: 'text-neon-orange', icon: Target },
                            { label: 'Saved', value: `$${weekStats.saved.toFixed(0)}`, color: 'text-neon-cyan', icon: CheckCircle2 },
                        ].map(({ label, value, color, icon: Icon }) => (
                            <Card key={label} variant="glass" className="p-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-dark-400">{label} this week</span>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                            </Card>
                        ))}
                    </motion.div>

                    {/* Spending chart */}
                    <Card variant="glass">
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-neon-cyan" />Daily Spending
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={spendingData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={CHART_STYLE} />
                                        <Bar dataKey="amount" fill="#06b6d4" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Narrative */}
                    <Card variant="glass" className="border border-neon-purple/20">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-neon-purple" />AI Weekly Narrative
                            </h3>
                            <Button
                                variant="glow"
                                size="sm"
                                onClick={generateReview}
                                disabled={generating || aiLoading}
                                leftIcon={<RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />}
                            >
                                {narrative ? 'Regenerate' : 'Generate Review'}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {generating ? (
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`h-3 rounded-full bg-dark-700 animate-pulse ${i === 3 ? 'w-2/3' : 'w-full'}`} />
                                    ))}
                                </div>
                            ) : narrative ? (
                                <p className="text-sm text-dark-200 leading-relaxed">{narrative}</p>
                            ) : (
                                <p className="text-dark-400 text-sm text-center py-4">
                                    Click &quot;Generate Review&quot; to get your AI-powered weekly summary.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Intentions */}
                    <Card variant="glass">
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-neon-green" />Intentions for Next Week
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={intentions}
                                onChange={e => setIntentions(e.target.value)}
                                rows={4}
                                placeholder="What do you want to focus on next week? Set your intentions here..."
                                className="w-full bg-dark-800/60 border border-dark-600 rounded-xl p-3 text-sm text-white placeholder-dark-400 resize-none focus:outline-none focus:border-neon-cyan/50 transition-colors"
                            />
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
        </MainLayout>
    );
}
