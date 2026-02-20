'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Mail, Phone, MapPin, Calendar, Tag, Gift,
    MessageSquare, Plus, Clock, Edit3, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useContacts, useContactInteractions } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';
import type { Contact, ContactInteraction } from '@/types';
import { format } from 'date-fns';

interface ContactDetailsModalProps {
    isOpen: boolean;
    contact: Contact;
    onClose: () => void;
}

export function ContactDetailsModal({ isOpen, contact, onClose }: ContactDetailsModalProps) {
    const { deleteContact, logInteraction } = useContacts();
    const { interactions, loading: interactionsLoading } = useContactInteractions(isOpen ? contact.id : null);

    const [activeTab, setActiveTab] = useState<'details' | 'interactions'>('details');
    const [isLogging, setIsLogging] = useState(false);
    const [interactionType, setInteractionType] = useState<ContactInteraction['type']>('message');
    const [interactionNotes, setInteractionNotes] = useState('');
    const [interactionDate, setInteractionDate] = useState(new Date().toISOString().split('T')[0]);

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this contact?')) {
            await deleteContact(contact.id);
            onClose();
        }
    };

    const handleLogInteraction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await logInteraction(contact.id, {
                type: interactionType,
                notes: interactionNotes.trim() || undefined,
                date: new Date(interactionDate),
            });
            setIsLogging(false);
            setInteractionNotes('');
            setInteractionDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            console.error('Failed to log interaction', error);
        }
    };

    const interactionTypes: { id: ContactInteraction['type']; label: string }[] = [
        { id: 'meetup', label: 'Meetup' },
        { id: 'call', label: 'Call' },
        { id: 'message', label: 'Message' },
        { id: 'email', label: 'Email' },
        { id: 'other', label: 'Other' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-dark-800 border border-glass-border rounded-2xl shadow-glass-lg overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-glass-border bg-dark-800/80">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-neon-cyan/10 flex items-center justify-center text-neon-cyan text-xl font-bold border border-neon-cyan/20">
                                    {contact.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{contact.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold tracking-wider bg-dark-700 text-white/60 border border-glass-border">
                                            {contact.relationship}
                                        </span>
                                        {contact.frequency && (
                                            <span className="text-xs text-white/40 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Connect {contact.frequency}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                                    title="Delete Contact"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-white/50 hover:text-white hover:bg-glass-medium rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-glass-border">
                            <button
                                className={cn(
                                    "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                                    activeTab === 'details' ? "border-neon-cyan text-neon-cyan" : "border-transparent text-white/50 hover:text-white"
                                )}
                                onClick={() => setActiveTab('details')}
                            >
                                Profile Details
                            </button>
                            <button
                                className={cn(
                                    "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                                    activeTab === 'interactions' ? "border-neon-cyan text-neon-cyan" : "border-transparent text-white/50 hover:text-white"
                                )}
                                onClick={() => setActiveTab('interactions')}
                            >
                                Log & History
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                            {activeTab === 'details' ? (
                                <div className="space-y-6">
                                    {/* Contact Info Group */}
                                    <div className="bg-glass-light border border-glass-border rounded-xl p-4 space-y-4">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Contact Info</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {contact.email ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-glass-medium flex items-center justify-center text-white/50"><Mail className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Email</p>
                                                        <p className="text-sm text-white/90">{contact.email}</p>
                                                    </div>
                                                </div>
                                            ) : <div className="text-sm text-white/30 italic flex items-center gap-2"><Mail className="w-4 h-4" /> No email added</div>}

                                            {contact.phone ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-glass-medium flex items-center justify-center text-white/50"><Phone className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Phone</p>
                                                        <p className="text-sm text-white/90">{contact.phone}</p>
                                                    </div>
                                                </div>
                                            ) : <div className="text-sm text-white/30 italic flex items-center gap-2"><Phone className="w-4 h-4" /> No phone added</div>}
                                        </div>

                                        {contact.address && (
                                            <div className="flex items-start gap-3 pt-2">
                                                <div className="w-8 h-8 rounded-lg bg-glass-medium flex items-center justify-center text-white/50 shrink-0"><MapPin className="w-4 h-4" /></div>
                                                <div>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Address</p>
                                                    <p className="text-sm text-white/90 leading-relaxed">{contact.address}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Personal Group */}
                                    <div className="bg-glass-light border border-glass-border rounded-xl p-4 space-y-4">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Personal Traits</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {contact.birthday && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-neon-pink/10 text-neon-pink border border-neon-pink/20 flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Birthday</p>
                                                        <p className="text-sm text-white/90">{format(new Date(contact.birthday), 'MMMM do, yyyy')}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {contact.anniversary && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-neon-purple/10 text-neon-purple border border-neon-purple/20 flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Anniversary</p>
                                                        <p className="text-sm text-white/90">{format(new Date(contact.anniversary), 'MMMM do, yyyy')}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            {contact.tags && contact.tags.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {contact.tags.map(t => (
                                                            <span key={t} className="px-2 py-1 rounded-md bg-glass-medium text-xs text-white/70 border border-glass-border">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {contact.giftIdeas && contact.giftIdeas.length > 0 && (
                                                <div className="pt-2">
                                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1"><Gift className="w-3 h-3" /> Gift Ideas</p>
                                                    <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                                                        {contact.giftIdeas.map((g, i) => <li key={i}>{g}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Log new interaction */}
                                    {!isLogging ? (
                                        <Button variant="outline" className="w-full border-dashed" onClick={() => setIsLogging(true)} leftIcon={<Plus className="w-4 h-4" />}>
                                            Log New Interaction
                                        </Button>
                                    ) : (
                                        <form onSubmit={handleLogInteraction} className="bg-glass-light border border-neon-cyan/30 rounded-xl p-4 space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-semibold text-white">Log Interaction</h4>
                                                <button type="button" onClick={() => setIsLogging(false)} className="text-white/40 hover:text-white">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-white/40 tracking-wider">Type</label>
                                                    <select
                                                        value={interactionType}
                                                        onChange={(e) => setInteractionType(e.target.value as any)}
                                                        className="w-full bg-dark-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
                                                    >
                                                        {interactionTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-white/40 tracking-wider">Date</label>
                                                    <input
                                                        type="date"
                                                        value={interactionDate}
                                                        onChange={(e) => setInteractionDate(e.target.value)}
                                                        max={new Date().toISOString().split('T')[0]}
                                                        className="w-full bg-dark-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50 custom-calendar-icon"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase text-white/40 tracking-wider">Notes</label>
                                                <textarea
                                                    value={interactionNotes}
                                                    onChange={(e) => setInteractionNotes(e.target.value)}
                                                    placeholder="What did you discuss? Anything to follow up on?"
                                                    className="w-full bg-dark-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon-cyan/50 min-h-[80px] resize-none"
                                                />
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsLogging(false)}>Cancel</Button>
                                                <Button type="submit" variant="glow" size="sm">Save</Button>
                                            </div>
                                        </form>
                                    )}

                                    {/* History List */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Past Interactions</h3>
                                        {interactionsLoading ? (
                                            <div className="text-center py-8 text-white/30 text-sm">Loading history...</div>
                                        ) : interactions.length === 0 ? (
                                            <div className="text-center py-8 text-white/30 text-sm italic">
                                                No interactions logged yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-glass-border">
                                                {interactions.map((interaction) => (
                                                    <div key={interaction.id} className="relative pl-10">
                                                        <div className="absolute left-3 top-1.5 w-2.5 h-2.5 rounded-full bg-neon-cyan border-[3px] border-dark-900 shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                                                        <div className="bg-glass-light border border-glass-border rounded-xl p-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs font-semibold uppercase text-neon-cyan tracking-wider">{interaction.type}</span>
                                                                <span className="text-[10px] text-white/40">{format(new Date(interaction.date), 'MMM d, yyyy')}</span>
                                                            </div>
                                                            {interaction.notes ? (
                                                                <p className="text-sm text-white/80">{interaction.notes}</p>
                                                            ) : (
                                                                <p className="text-sm text-white/30 italic">No notes added.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
