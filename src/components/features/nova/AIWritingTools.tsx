'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    PenTool, Mail, BookOpen, FileText, Sparkles, Copy,
    Check, RefreshCw, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateGeminiResponse, isAIConfigured, type AIContext } from '@/lib/services/gemini';

interface AIWritingToolsProps {
    context?: AIContext;
}

type WritingTool = 'email' | 'journal_prompt' | 'document' | 'message';

const TOOLS: { id: WritingTool; label: string; icon: typeof Mail; placeholder: string; color: string }[] = [
    { id: 'email', label: 'Email Drafter', icon: Mail, placeholder: 'Describe the email (recipient, subject, tone)...', color: 'text-neon-cyan' },
    { id: 'journal_prompt', label: 'Journal Prompt', icon: BookOpen, placeholder: 'What mood or topic? (or leave empty for a surprise)', color: 'text-neon-green' },
    { id: 'document', label: 'Document Generator', icon: FileText, placeholder: 'Describe the document you need...', color: 'text-neon-purple' },
    { id: 'message', label: 'Message Composer', icon: PenTool, placeholder: 'Who and what is the message about?', color: 'text-neon-orange' },
];

const TONE_OPTIONS = ['professional', 'friendly', 'casual', 'formal', 'empathetic'] as const;

export function AIWritingTools({ context }: AIWritingToolsProps) {
    const [selectedTool, setSelectedTool] = useState<WritingTool>('email');
    const [prompt, setPrompt] = useState('');
    const [tone, setTone] = useState<string>('professional');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const currentTool = TOOLS.find(t => t.id === selectedTool)!;

    const buildPrompt = (): string => {
        const toolLabels: Record<WritingTool, string> = {
            email: 'Write an email',
            journal_prompt: 'Generate a thoughtful journal prompt',
            document: 'Generate a document',
            message: 'Compose a message',
        };

        let aiPrompt = `${toolLabels[selectedTool]}. Tone: ${tone}.`;
        if (prompt.trim()) aiPrompt += ` Details: ${prompt}`;
        if (selectedTool === 'journal_prompt' && !prompt.trim()) {
            aiPrompt += ' Based on my recent activities and mood, suggest a meaningful reflection prompt.';
        }
        aiPrompt += ' Keep it concise and ready to use.';
        return aiPrompt;
    };

    const handleGenerate = async () => {
        setLoading(true);
        setResult('');
        try {
            const res = await generateGeminiResponse(buildPrompt(), context);
            setResult(res.content);
        } catch (err) {
            setResult('Failed to generate content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-neon-cyan" />
                    <h3 className="text-lg font-semibold text-white">AI Writing Tools</h3>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Tool Selector */}
                <div className="flex flex-wrap gap-2">
                    {TOOLS.map(tool => {
                        const Icon = tool.icon;
                        return (
                            <button
                                key={tool.id}
                                onClick={() => { setSelectedTool(tool.id); setResult(''); }}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all',
                                    selectedTool === tool.id
                                        ? 'bg-dark-700/80 text-white border border-dark-500/50'
                                        : 'bg-dark-800/30 text-dark-400 hover:text-white border border-transparent'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', selectedTool === tool.id ? tool.color : '')} />
                                {tool.label}
                            </button>
                        );
                    })}
                </div>

                {/* Input Area */}
                <div className="space-y-3">
                    <textarea
                        className="w-full bg-dark-800/50 border border-dark-600 rounded-xl p-3 text-sm text-white placeholder-dark-500 resize-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/50 transition-all"
                        rows={3}
                        placeholder={currentTool.placeholder}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />

                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-dark-400 mb-1 block">Tone</label>
                            <select
                                className="w-full bg-dark-800 border border-dark-600 rounded-lg p-2 text-sm text-white"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                            >
                                {TONE_OPTIONS.map(t => (
                                    <option key={t} value={t} className="capitalize">{t}</option>
                                ))}
                            </select>
                        </div>
                        <Button
                            variant="glow"
                            onClick={handleGenerate}
                            disabled={loading || !isAIConfigured()}
                            leftIcon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            className="mt-4"
                        >
                            {loading ? 'Writing...' : 'Generate'}
                        </Button>
                    </div>
                </div>

                {/* Result */}
                {result && (
                    <div className="relative">
                        <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-600/50">
                            <div className="whitespace-pre-wrap text-sm text-dark-200 leading-relaxed">
                                {result}
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5" />}
                            className="absolute top-3 right-3"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                )}

                {!isAIConfigured() && (
                    <p className="text-xs text-dark-500 text-center py-2">
                        Configure your Gemini API key in Settings to use AI Writing Tools.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
