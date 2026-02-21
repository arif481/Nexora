'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Tv, BookOpen, Gamepad2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useEntertainment } from '@/hooks/useEntertainment';
import { cn } from '@/lib/utils';
import type { EntertainmentType, EntertainmentStatus, EntertainmentItem } from '@/types';
import { searchMedia, type MediaSearchResult } from '@/lib/parsers/mediaLookup';

interface AddMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editItem?: EntertainmentItem | null;
}

export function AddMediaModal({ isOpen, onClose, onSuccess, editItem }: AddMediaModalProps) {
    const { createItem, updateItem } = useEntertainment();
    const [loading, setLoading] = useState(false);

    const [type, setType] = useState<EntertainmentType>('movie');
    const [title, setTitle] = useState('');
    const [creator, setCreator] = useState('');
    const [status, setStatus] = useState<EntertainmentStatus>('planned');
    const [rating, setRating] = useState('');
    const [progress, setProgress] = useState('');
    const [totalProgress, setTotalProgress] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout>();

    // Pre-fill when editing
    useEffect(() => {
        if (editItem) {
            setType(editItem.type);
            setTitle(editItem.title);
            setCreator(editItem.creator || '');
            setStatus(editItem.status);
            setRating(editItem.rating ? String(editItem.rating) : '');
            setProgress(editItem.progress !== undefined ? String(editItem.progress) : '');
            setTotalProgress(editItem.totalProgress ? String(editItem.totalProgress) : '');
            setCoverImage(editItem.coverImage || '');
        }
    }, [editItem]);

    const types: { id: EntertainmentType; label: string; icon: any }[] = [
        { id: 'movie', label: 'Movie', icon: Film },
        { id: 'tv', label: 'TV Show', icon: Tv },
        { id: 'book', label: 'Book', icon: BookOpen },
        { id: 'game', label: 'Game', icon: Gamepad2 },
    ];

    const statuses: { id: EntertainmentStatus; label: string }[] = [
        { id: 'planned', label: 'Want to' },
        { id: 'in_progress', label: 'Current' },
        { id: 'completed', label: 'Done' },
        { id: 'dropped', label: 'Dropped' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            const data = {
                type,
                title: title.trim(),
                creator: creator.trim() || undefined,
                status,
                rating: rating ? Number(rating) : undefined,
                progress: progress ? Number(progress) : undefined,
                totalProgress: totalProgress ? Number(totalProgress) : undefined,
                coverImage: coverImage.trim() || undefined,
                startedAt: status === 'in_progress' ? new Date() : undefined,
                completedAt: status === 'completed' ? new Date() : undefined,
            };

            if (editItem) {
                await updateItem(editItem.id, data);
            } else {
                await createItem(data);
            }
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to save item:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setCreator('');
        setStatus('planned');
        setRating('');
        setProgress('');
        setTotalProgress('');
        setCoverImage('');
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
                            <h2 className="text-xl font-semibold text-white">{editItem ? 'Edit Media' : 'Add to Library'}</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-white/50 hover:text-white hover:bg-glass-medium rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin">
                            <form id="add-media-form" onSubmit={handleSubmit} className="p-6 space-y-6">

                                {/* Type Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-white/70">Media Type</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {types.map((t) => {
                                            const Icon = t.icon;
                                            const isActive = type === t.id;
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setType(t.id)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                                                        isActive
                                                            ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                                                            : "bg-glass-light border-glass-border text-white/50 hover:text-white/80 hover:bg-glass-medium"
                                                    )}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span className="text-xs font-medium">{t.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-medium text-white/70">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => {
                                            setTitle(e.target.value);
                                            // Debounced media search
                                            const q = e.target.value.trim();
                                            if (searchTimeout.current) clearTimeout(searchTimeout.current);
                                            if (q.length >= 3 && (type === 'movie' || type === 'tv' || type === 'book')) {
                                                setSearching(true);
                                                searchTimeout.current = setTimeout(async () => {
                                                    const results = await searchMedia(q, type === 'tv' ? 'tv' : type === 'book' ? 'book' : 'movie');
                                                    setSearchResults(results);
                                                    setShowSuggestions(results.length > 0);
                                                    setSearching(false);
                                                }, 500);
                                            } else {
                                                setSearchResults([]);
                                                setShowSuggestions(false);
                                                setSearching(false);
                                            }
                                        }}
                                        onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                                        placeholder="e.g., Inception, The Great Gatsby..."
                                        className="w-full bg-glass-light border border-glass-border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                    />
                                    {/* Search indicator */}
                                    {searching && (
                                        <div className="absolute right-3 top-[38px]">
                                            <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
                                        </div>
                                    )}
                                    {/* Auto-fill suggestions */}
                                    {showSuggestions && searchResults.length > 0 && (
                                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-xl overflow-hidden shadow-xl">
                                            {searchResults.map((result, i) => (
                                                <button
                                                    key={result.externalId || i}
                                                    type="button"
                                                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-dark-700 transition-colors text-left"
                                                    onClick={() => {
                                                        setTitle(result.title);
                                                        if (result.creator) setCreator(result.creator);
                                                        if (result.coverImage) setCoverImage(result.coverImage);
                                                        setShowSuggestions(false);
                                                    }}
                                                >
                                                    {result.coverImage && (
                                                        <img src={result.coverImage} alt="" className="w-8 h-12 object-cover rounded" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white truncate">{result.title}</p>
                                                        <p className="text-xs text-dark-400">
                                                            {[result.creator, result.year].filter(Boolean).join(' · ')}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Creator (Director, Author, Studio) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">
                                        {type === 'movie' ? 'Director' : type === 'book' ? 'Author' : type === 'game' ? 'Studio' : 'Creator'}
                                    </label>
                                    <input
                                        type="text"
                                        value={creator}
                                        onChange={(e) => setCreator(e.target.value)}
                                        placeholder="Optional"
                                        className="w-full bg-glass-light border border-glass-border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                    />
                                </div>

                                {/* Status Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-white/70">Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {statuses.map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setStatus(s.id)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                                                    status === s.id
                                                        ? "bg-white/10 border-white/20 text-white"
                                                        : "bg-glass-light border-glass-border text-white/50 hover:text-white hover:bg-glass-medium"
                                                )}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Optional Grid: Rating & Progress */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Rating (1-10)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            step="0.1"
                                            value={rating}
                                            onChange={(e) => setRating(e.target.value)}
                                            placeholder="e.g., 8.5"
                                            className="w-full bg-glass-light border border-glass-border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                        />
                                    </div>

                                    {type !== 'movie' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-white/70">Progress</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={progress}
                                                    onChange={(e) => setProgress(e.target.value)}
                                                    placeholder="Current"
                                                    className="w-full bg-glass-light border border-glass-border rounded-xl px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                                />
                                                <span className="text-white/40">/</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={totalProgress}
                                                    onChange={(e) => setTotalProgress(e.target.value)}
                                                    placeholder="Total"
                                                    className="w-full bg-glass-light border border-glass-border rounded-xl px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cover Image URL */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Cover Image URL</label>
                                    <input
                                        type="url"
                                        value={coverImage}
                                        onChange={(e) => setCoverImage(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-glass-light border border-glass-border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                    />
                                    {coverImage && (
                                        <div className="mt-2 text-xs text-white/50 break-all truncate">
                                            Previewing from URL...
                                        </div>
                                    )}
                                </div>

                            </form>
                        </div>

                        <div className="p-6 border-t border-glass-border bg-dark-800/50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="add-media-form"
                                variant="glow"
                                disabled={!title.trim() || loading}
                            >
                                {loading ? (editItem ? 'Saving...' : 'Adding...') : (editItem ? 'Save Changes' : 'Add to Library')}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
