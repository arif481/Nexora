'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Image as ImageIcon, Briefcase, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTrips } from '@/hooks/useTravel';
import type { Trip } from '@/types';

interface AddTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddTripModal({ isOpen, onClose, onSuccess }: AddTripModalProps) {
    const { createTrip } = useTrips();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [status, setStatus] = useState<Trip['status']>('planned');
    const [budget, setBudget] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !destination.trim() || !startDate || !endDate) return;

        setLoading(true);
        try {
            await createTrip({
                title: title.trim(),
                destination: destination.trim(),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status,
                coverImage: coverImage.trim() || undefined,
                budget: budget ? Number(budget) : undefined,
                notes: notes.trim() || undefined,
            });
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to create trip:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDestination('');
        setStartDate('');
        setEndDate('');
        setCoverImage('');
        setStatus('planned');
        setBudget('');
        setNotes('');
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
                            <h2 className="text-xl font-semibold text-white">Plan New Trip</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-white/50 hover:text-white hover:bg-glass-medium rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin">
                            <form id="add-trip-form" onSubmit={handleSubmit} className="p-6 space-y-6">

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Trip Title *</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="text"
                                                required
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="e.g., Summer in Europe"
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Destination *</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="text"
                                                required
                                                value={destination}
                                                onChange={(e) => setDestination(e.target.value)}
                                                placeholder="e.g., Paris, France"
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Start Date *</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="date"
                                                required
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm custom-calendar-icon"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">End Date *</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="date"
                                                required
                                                value={endDate}
                                                min={startDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm custom-calendar-icon"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as any)}
                                            className="w-full px-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm appearance-none"
                                        >
                                            <option value="planned">Planned</option>
                                            <option value="upcoming">Upcoming</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Cover Image URL</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="url"
                                                value={coverImage}
                                                onChange={(e) => setCoverImage(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Estimated Budget</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-4 font-medium text-white/40">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="10"
                                                value={budget}
                                                onChange={(e) => setBudget(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Notes</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Flight preferences, ideas, etc."
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm min-h-[80px] resize-none"
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
                                form="add-trip-form"
                                variant="glow"
                                disabled={!title.trim() || !destination.trim() || !startDate || !endDate || loading}
                            >
                                {loading ? 'Saving...' : 'Plan Trip'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
