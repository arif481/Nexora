'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, MapPin, Calendar, Tag, Gift, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useContacts } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types';

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddContactModal({ isOpen, onClose, onSuccess }: AddContactModalProps) {
    const { createContact } = useContacts();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState<Contact['relationship']>('friend');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [birthday, setBirthday] = useState('');
    const [frequency, setFrequency] = useState<Contact['frequency']>('monthly');
    const [tagsInput, setTagsInput] = useState('');
    const [giftIdeasInput, setGiftIdeasInput] = useState('');

    const relationships: { id: Contact['relationship']; label: string }[] = [
        { id: 'family', label: 'Family' },
        { id: 'friend', label: 'Friend' },
        { id: 'colleague', label: 'Colleague' },
        { id: 'acquaintance', label: 'Acquaintance' },
        { id: 'other', label: 'Other' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await createContact({
                name: name.trim(),
                relationship,
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                address: address.trim() || undefined,
                birthday: birthday ? new Date(birthday) : undefined,
                frequency,
                tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
                giftIdeas: giftIdeasInput.split(',').map(g => g.trim()).filter(Boolean),
            });
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to create contact:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setRelationship('friend');
        setEmail('');
        setPhone('');
        setAddress('');
        setBirthday('');
        setFrequency('monthly');
        setTagsInput('');
        setGiftIdeasInput('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-dark-800 border border-glass-border rounded-2xl shadow-glass-lg overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-glass-border">
                            <h2 className="text-xl font-semibold text-white">Add New Contact</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-white/50 hover:text-white hover:bg-glass-medium rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin">
                            <form id="add-contact-form" onSubmit={handleSubmit} className="p-6 space-y-6">

                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Name *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g., Jane Doe"
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-white/70">Relationship *</label>
                                        <div className="flex flex-wrap gap-2">
                                            {relationships.map((rel) => (
                                                <button
                                                    key={rel.id}
                                                    type="button"
                                                    onClick={() => setRelationship(rel.id)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-xs font-medium border transition-colors",
                                                        relationship === rel.id
                                                            ? "bg-white/10 border-white/20 text-white"
                                                            : "bg-glass-light border-glass-border text-white/50 hover:text-white hover:bg-glass-medium"
                                                    )}
                                                >
                                                    {rel.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-glass-border" />

                                {/* Contact Info */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-white/70">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="jane@example.com"
                                                    className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-white/70">Phone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="+1 234 567 890"
                                                    className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-glass-border" />

                                {/* Extra Details */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-white/70">Birthday</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                <input
                                                    type="date"
                                                    value={birthday}
                                                    onChange={(e) => setBirthday(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm custom-calendar-icon"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-white/70">Keep in Touch</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                <select
                                                    value={frequency}
                                                    onChange={(e) => setFrequency(e.target.value as any)}
                                                    className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm appearance-none"
                                                >
                                                    <option value="weekly">Weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="quarterly">Quarterly</option>
                                                    <option value="yearly">Yearly</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Tags (comma-separated)</label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="text"
                                                value={tagsInput}
                                                onChange={(e) => setTagsInput(e.target.value)}
                                                placeholder="design, mentor, college"
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Gift Ideas (comma-separated)</label>
                                        <div className="relative">
                                            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="text"
                                                value={giftIdeasInput}
                                                onChange={(e) => setGiftIdeasInput(e.target.value)}
                                                placeholder="coffee beans, sci-fi books"
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="p-6 border-t border-glass-border bg-dark-800/50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="add-contact-form"
                                variant="glow"
                                disabled={!name.trim() || loading}
                            >
                                {loading ? 'Saving...' : 'Save Contact'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
