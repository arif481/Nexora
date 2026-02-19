'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Inbox, Mic, MicOff, Send, Sparkles, CheckSquare,
    FileText, CalendarDays, Repeat2, HelpCircle, Trash2,
    ChevronRight, LogIn,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useInbox } from '@/hooks/useFinance';
import { generateAIResponse } from '@/lib/services/ai';

import type { InboxItemType } from '@/types';

const TYPE_CONFIG: Record<InboxItemType, { label: string; color: string; icon: React.ElementType }> = {
    task: { label: 'Task', color: 'text-neon-cyan', icon: CheckSquare },
    note: { label: 'Note', color: 'text-neon-purple', icon: FileText },
    event: { label: 'Event', color: 'text-neon-green', icon: CalendarDays },
    habit: { label: 'Habit', color: 'text-neon-orange', icon: Repeat2 },
    unclassified: { label: 'Unclassified', color: 'text-dark-400', icon: HelpCircle },
};

async function classifyWithAI(content: string): Promise<InboxItemType> {
    try {
        const result = await generateAIResponse(
            `Classify this capture into exactly one word: task, note, event, or habit. Capture: "${content}". Reply with only the single word.`
        );
        const word = result.content.trim().toLowerCase();
        if (['task', 'note', 'event', 'habit'].includes(word)) return word as InboxItemType;
    } catch { }
    return 'unclassified';
}

export default function InboxPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { items, loading, addItem, processItem, reclassifyItem, deleteItem } = useInbox();

    const [input, setInput] = useState('');
    const [capturing, setCapturing] = useState(false);
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const handleCapture = useCallback(async () => {
        const text = input.trim();
        if (!text) return;
        setInput('');
        setCapturing(true);
        try {
            const classified = await classifyWithAI(text);

            await addItem(text, classified);
        } catch {
            await addItem(text, 'unclassified');
        } finally {
            setCapturing(false);
        }
    }, [input, addItem]);


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCapture(); }
    };

    const startVoice = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
        const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const rec = new SR();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
            setListening(false);
        };
        rec.onend = () => setListening(false);
        rec.start();
        recognitionRef.current = rec;
        setListening(true);
    };

    if (authLoading) return <MainLayout><PageContainer title="Inbox"><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></PageContainer></MainLayout>;

    if (!user) return (
        <MainLayout>
            <PageContainer title="Inbox" subtitle="Capture anything, classify later">
                <Card variant="glass" className="max-w-md mx-auto p-8 text-center">
                    <LogIn className="w-10 h-10 text-neon-cyan mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Sign in to use Inbox</h3>
                    <Button variant="glow" onClick={() => router.push('/auth/login')}>Sign In</Button>
                </Card>
            </PageContainer>
        </MainLayout>
    );

    return (
        <MainLayout>
            <PageContainer title="Smart Inbox" subtitle="Capture anything — NOVA classifies it automatically">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Capture input */}
                    <Card variant="glass" className="border border-neon-cyan/20">
                        <CardContent className="p-5">
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        rows={2}
                                        placeholder="Capture any thought, task, idea, or event... (Press Enter to capture)"
                                        className="w-full bg-dark-800/60 border border-dark-600 rounded-xl p-3 text-sm text-white placeholder-dark-500 resize-none focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={listening ? () => { recognitionRef.current?.stop(); setListening(false); } : startVoice}
                                        className={listening ? 'text-neon-orange border-neon-orange/40' : ''}
                                        title="Voice capture"
                                    >
                                        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="glow"
                                        size="sm"
                                        onClick={handleCapture}
                                        disabled={!input.trim() || capturing}
                                        leftIcon={capturing ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
                                    >
                                        {capturing ? 'AI...' : 'Capture'}
                                    </Button>
                                </div>
                            </div>
                            {listening && (
                                <p className="text-xs text-neon-orange mt-2 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-neon-orange animate-pulse" />
                                    Listening...
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items */}
                    {loading ? (
                        <div className="flex justify-center py-12"><LoadingSpinner /></div>
                    ) : items.length === 0 ? (
                        <Card variant="glass" className="p-10 text-center">
                            <Inbox className="w-10 h-10 text-dark-500 mx-auto mb-3" />
                            <p className="text-dark-400">Your inbox is empty. Start capturing!</p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-dark-400">{items.length} item{items.length !== 1 ? 's' : ''} to triage</p>
                            <AnimatePresence>
                                {items.map(item => {
                                    const cfg = TYPE_CONFIG[item.classifiedAs];
                                    const TypeIcon = cfg.icon;
                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 12 }}
                                        >
                                            <Card variant="glass" className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <TypeIcon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white">{item.content}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" size="sm" className={cfg.color}>
                                                                {cfg.label}
                                                            </Badge>
                                                            <span className="text-xs text-dark-500">
                                                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        {/* Reclassify buttons */}
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {(['task', 'note', 'event', 'habit'] as InboxItemType[]).filter(t => t !== item.classifiedAs).map(t => (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => reclassifyItem(item.id, t)}
                                                                    className="text-xs text-dark-400 hover:text-white border border-dark-600 hover:border-dark-400 rounded-md px-2 py-0.5 transition-colors"
                                                                >
                                                                    → {t}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => processItem(item.id)}
                                                            title="Mark as processed"
                                                        >
                                                            <ChevronRight className="w-4 h-4 text-neon-green" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteItem(item.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-dark-400 hover:text-neon-orange" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </PageContainer>
        </MainLayout>
    );
}
