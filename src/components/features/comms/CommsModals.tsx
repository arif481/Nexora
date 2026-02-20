'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Calendar, Clock, MessageSquare, Briefcase, User, Mail, Hash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTemplates, useFollowUps } from '@/hooks/useComms';
import type { MessageTemplate, FollowUp } from '@/types';

export function BaseModal({ isOpen, onClose, title, children, onSubmit, loading, valid }: any) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-dark-800 border border-glass-border rounded-2xl shadow-glass-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-glass-border">
                            <h2 className="text-xl font-semibold text-white">{title}</h2>
                            <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-glass-medium rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-thin">
                            <form id={`form-${title.replace(/\\s/g, '')}`} onSubmit={onSubmit} className="p-6 space-y-4">
                                {children}
                            </form>
                        </div>
                        <div className="p-6 border-t border-glass-border bg-dark-800/50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" form={`form-${title.replace(/\\s/g, '')}`} variant="glow" disabled={!valid || loading}>
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// --- Add Template Modal ---
export function AddTemplateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { addTemplate } = useTemplates();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [category, setCategory] = useState<MessageTemplate['category']>('work');
    const [tagsInput, setTagsInput] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !body.trim()) return;
        setLoading(true);
        try {
            await addTemplate({
                name: name.trim(),
                subject: subject.trim() || undefined,
                body: body.trim(),
                category,
                tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
            });
            onClose();
        } finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="New Template" onSubmit={handleSubmit} loading={loading} valid={name && body}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Template Name *</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Intro Email" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50">
                            <option value="work">Work</option>
                            <option value="personal">Personal</option>
                            <option value="networking">Networking</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Subject Line</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-dark-900 border border-glass-border rounded-xl text-sm text-white focus:border-neon-cyan/50" placeholder="Optional email subject" />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Body *</label>
                    <textarea required value={body} onChange={e => setBody(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50 min-h-[150px] resize-y" placeholder="Hi {{Name}},\n\nI wanted to reach out regarding..." />
                </div>

                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Tags (comma separated)</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-dark-900 border border-glass-border rounded-xl text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., coldoutreach, follow-up" />
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

// --- Add Follow-up Modal ---
export function AddFollowUpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { addFollowUp } = useFollowUps();
    const [loading, setLoading] = useState(false);

    const [contactName, setContactName] = useState('');
    const [context, setContext] = useState('');
    const [method, setMethod] = useState<FollowUp['method']>('email');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactName.trim() || !context.trim() || !dueDate) return;
        setLoading(true);
        try {
            await addFollowUp({
                contactName: contactName.trim(),
                context: context.trim(),
                method,
                dueDate: new Date(dueDate),
                notes: notes.trim() || undefined,
                status: 'pending',
            });
            onClose();
        } finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Add Follow-up" onSubmit={handleSubmit} loading={loading} valid={contactName && context && dueDate}>
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Contact Name *</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input type="text" required value={contactName} onChange={e => setContactName(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-dark-900 border border-glass-border rounded-xl text-sm text-white focus:border-neon-cyan/50" placeholder="Who are you following up with?" />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Context / Topic *</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input type="text" required value={context} onChange={e => setContext(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-dark-900 border border-glass-border rounded-xl text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Q3 Project Proposal" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Due Date *</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 z-10" />
                            <input type="datetime-local" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-dark-900 border border-glass-border rounded-xl text-sm text-white focus:border-neon-cyan/50 custom-calendar-icon" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Method</label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                            <select value={method} onChange={e => setMethod(e.target.value as any)} className="w-full pl-9 pr-4 py-3 bg-dark-900 border border-glass-border rounded-xl text-sm text-white focus:border-neon-cyan/50 appearance-none">
                                <option value="email">Email</option>
                                <option value="call">Phone Call</option>
                                <option value="message">Text / Slack</option>
                                <option value="in-person">In-Person</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50 min-h-[80px] resize-none" placeholder="Details, links, etc." />
                </div>
            </div>
        </BaseModal>
    );
}
