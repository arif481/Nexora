'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, TrendingUp, RefreshCw, Brain } from 'lucide-react';
import { generateMonthlyInsights } from '@/lib/services/nova-intelligence';
import { isAIConfigured, type AIContext } from '@/lib/services/gemini';

interface MonthlyInsightsProps {
    context: AIContext;
}

export function MonthlyInsights({ context }: MonthlyInsightsProps) {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await generateMonthlyInsights(context);
            setReport(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate insights');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-neon-purple" />
                    <h3 className="text-lg font-semibold text-white">Monthly Life Insights</h3>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={loading}
                    leftIcon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                >
                    {loading ? 'Generating...' : report ? 'Refresh' : 'Generate'}
                </Button>
            </CardHeader>
            <CardContent>
                {report ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                        <div
                            className="text-sm text-dark-300 leading-relaxed space-y-2"
                            dangerouslySetInnerHTML={{
                                __html: report
                                    .replace(/### (.*)/g, '<h4 class="text-white font-semibold mt-4 mb-1">$1</h4>')
                                    .replace(/## (.*)/g, '<h3 class="text-white font-bold mt-4 mb-2">$1</h3>')
                                    .replace(/# (.*)/g, '<h2 class="text-white font-bold mt-4 mb-2">$1</h2>')
                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                    .replace(/\n/g, '<br/>')
                            }}
                        />
                    </div>
                ) : error ? (
                    <p className="text-sm text-status-error py-4 text-center">{error}</p>
                ) : (
                    <div className="py-8 text-center">
                        <TrendingUp className="w-10 h-10 text-dark-500 mx-auto mb-3" />
                        <p className="text-sm text-dark-400">
                            Generate an AI-powered monthly report covering productivity, wellness, finances, and more.
                        </p>
                        {!isAIConfigured() && (
                            <p className="text-xs text-dark-500 mt-2">
                                Configure your Gemini API key in Settings to unlock this feature.
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
