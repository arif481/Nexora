'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, MessageSquare, Send, Calendar, Clock, Sparkles, Hash,
    Plus, Search, Copy, Check, Trash2, ExternalLink, Briefcase
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTemplates, useFollowUps } from '@/hooks/useComms';
import { cn } from '@/lib/utils';
import { format, isPast, addDays, getDaysInMonth, isToday } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/Loading';
import { AddTemplateModal, AddFollowUpModal } from '@/components/features/comms/CommsModals';

type TabId = 'followups' | 'templates';

export default function CommsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('followups');
    const [searchQuery, setSearchQuery] = useState('');

    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const [isFollowUpModalOpen, setFollowUpModalOpen] = useState(false);

    // Hooks
    const { templates, loading: tplLoading, deleteTemplate } = useTemplates();
    const { followUps, loading: fupLoading, updateFollowUp, deleteFollowUp } = useFollowUps();

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleStatusChange = async (id: string, newStatus: 'pending' | 'completed' | 'snoozed') => {
        await updateFollowUp(id, { status: newStatus });
    };

    const handleSnooze = async (id: string, days: number = 3) => {
        const fup = followUps.find(f => f.id === id);
        if (!fup) return;
        const newDate = addDays(new Date(fup.dueDate), days);
        await updateFollowUp(id, { dueDate: newDate, status: 'snoozed' });
    };

    const renderFollowUps = () => {
        if (fupLoading) return <div className="py-10 flex justify-center"><LoadingSpinner /></div>;

        let filtered = followUps.filter(f => f.contactName.toLowerCase().includes(searchQuery.toLowerCase()) || f.context.toLowerCase().includes(searchQuery.toLowerCase()));

        // Sort logic (Pending first, sorted by soonest date)
        const sorted = [...filtered].sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        if (sorted.length === 0) return <EmptyState icon={Clock} title="No Follow-ups" message="You're all caught up with your communications!" />;

        return (
            <div className="space-y-4">
                {sorted.map(fup => {
                    const isOverdue = isPast(new Date(fup.dueDate)) && !isToday(new Date(fup.dueDate));
                    const isPending = fup.status !== 'completed';

                    return (
                        <div key={fup.id} className={cn(
                            "bg-glass-light border rounded-xl p-5 hover:border-white/20 transition-all flex flex-col md:flex-row gap-4 justify-between",
                            fup.status === 'completed' ? "opacity-50 border-glass-border" : "border-glass-border",
                            isOverdue && isPending ? "border-red-500/30" : ""
                        )}>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                        fup.method === 'email' ? "bg-blue-500/20 text-blue-400" :
                                            fup.method === 'call' ? "bg-green-500/20 text-green-400" :
                                                "bg-purple-500/20 text-purple-400"
                                    )}>
                                        {fup.method === 'email' && <Mail className="w-5 h-5" />}
                                        {fup.method === 'call' && <MessageSquare className="w-5 h-5" />}
                                        {fup.method !== 'email' && fup.method !== 'call' && <Send className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className={cn("font-bold text-lg", fup.status === 'completed' ? "line-through text-white/50" : "text-white")}>
                                            {fup.contactName}
                                        </h4>
                                        <p className="text-xs text-white/60 font-medium">{fup.context}</p>
                                    </div>
                                </div>

                                {fup.notes && (
                                    <p className="text-sm text-white/50 mt-3 pl-14 italic max-w-xl">"{fup.notes}"</p>
                                )}
                            </div>

                            <div className="flex flex-row md:flex-col items-center justify-end gap-3 pl-14 md:pl-0">
                                <div className="flex items-center gap-1.5 text-xs text-white/60 w-full md:w-auto md:justify-end">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className={isOverdue && isPending ? "text-red-400 font-bold" : ""}>
                                        {format(new Date(fup.dueDate), 'MMM d, h:mm a')}
                                    </span>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto mt-auto">
                                    {fup.status !== 'completed' && (
                                        <>
                                            <Button variant="ghost" className="h-8 px-3 text-xs bg-dark-900" onClick={() => handleSnooze(fup.id)}>Snooze 3d</Button>
                                            <Button variant="glow" className="h-8 px-3 text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30" onClick={() => handleStatusChange(fup.id, 'completed')}>Done</Button>
                                        </>
                                    )}
                                    {fup.status === 'completed' && (
                                        <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => handleStatusChange(fup.id, 'pending')}>Undo</Button>
                                    )}
                                    <button onClick={() => deleteFollowUp(fup.id)} className="p-2 text-red-400/30 hover:text-red-400 rounded-lg hover:bg-dark-900 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderTemplates = () => {
        if (tplLoading) return <div className="py-10 flex justify-center"><LoadingSpinner /></div>;

        let filtered = templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()) || t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

        if (filtered.length === 0) return <EmptyState icon={Briefcase} title="No Templates" message="Save your common email templates to copy with one click." />;

        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filtered.map(tpl => (
                    <div key={tpl.id} className="bg-glass-light border border-glass-border rounded-xl p-5 hover:border-white/20 transition-all flex flex-col group">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-white text-lg">{tpl.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] uppercase tracking-wider text-neon-cyan bg-neon-cyan/10 px-1.5 py-0.5 rounded">{tpl.category}</span>
                                    {tpl.tags?.map(tag => <span key={tag} className="text-xs text-white/40">#{tag}</span>)}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => deleteTemplate(tpl.id)} className="p-1.5 text-red-400/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                <Button variant="glow" className="h-8 px-3" onClick={() => handleCopy(tpl.body, tpl.id)}>
                                    {copiedId === tpl.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    <span className="ml-1.5">{copiedId === tpl.id ? 'Copied!' : 'Copy'}</span>
                                </Button>
                            </div>
                        </div>

                        {tpl.subject && (
                            <div className="text-sm font-semibold text-white/80 mb-2 pb-2 border-b border-glass-border/50 truncate">
                                <span className="text-white/40 font-normal mr-2">Subj:</span>{tpl.subject}
                            </div>
                        )}

                        <div className="flex-1 text-sm text-white/60 whitespace-pre-wrap font-mono bg-dark-900/50 p-3 rounded-lg border border-dark-900 overflow-y-auto max-h-[150px] scrollbar-thin scrollbar-thumb-glass-border">
                            {tpl.body}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <MainLayout>
            <PageContainer
                title="Communications Hub"
                subtitle="Manage follow-ups, emails, and conversational AI templates."
                actions={
                    <div className="flex gap-2">
                        <Button variant="glow" leftIcon={<Mail className="w-4 h-4" />} onClick={() => setTemplateModalOpen(true)}>Template</Button>
                        <Button variant="glow" className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setFollowUpModalOpen(true)}>
                            Follow-Up
                        </Button>
                    </div>
                }
            >
                <div className="mt-4 flex flex-col sm:flex-row gap-4 border-b border-glass-border">
                    <div className="flex overflow-x-auto scrollbar-none flex-1">
                        <button
                            onClick={() => setActiveTab('followups')}
                            className={cn(
                                "px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2",
                                activeTab === 'followups' ? "border-neon-cyan text-neon-cyan" : "border-transparent text-white/50 hover:text-white"
                            )}
                        >
                            <Clock className="w-4 h-4" />
                            Follow-Ups
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={cn(
                                "px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2",
                                activeTab === 'templates' ? "border-neon-purple text-neon-purple" : "border-transparent text-white/50 hover:text-white"
                            )}
                        >
                            <Mail className="w-4 h-4" />
                            Templates
                        </button>
                    </div>
                    <div className="py-2 sm:py-3 sm:pr-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'followups' ? 'follow-ups' : 'templates'}...`}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-dark-900 border border-glass-border rounded-xl text-sm text-white focus:border-neon-cyan/50 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'followups' && renderFollowUps()}
                            {activeTab === 'templates' && renderTemplates()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </PageContainer>

            <AddTemplateModal isOpen={isTemplateModalOpen} onClose={() => setTemplateModalOpen(false)} />
            <AddFollowUpModal isOpen={isFollowUpModalOpen} onClose={() => setFollowUpModalOpen(false)} />

        </MainLayout>
    );
}

function EmptyState({ icon: Icon, title, message }: any) {
    return (
        <Card variant="glass" className="py-20 text-center border-dashed">
            <CardContent className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-glass-medium flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/50 max-w-sm">{message}</p>
            </CardContent>
        </Card>
    );
}
