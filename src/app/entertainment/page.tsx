'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Film,
    Tv,
    BookOpen,
    Gamepad2,
    Plus,
    Search,
    Star,
    CheckCircle2,
    Clock,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import { MainLayout, PageContainer, Section } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useEntertainment } from '@/hooks/useEntertainment';
import { cn } from '@/lib/utils';
import type { EntertainmentType, EntertainmentItem, EntertainmentStatus } from '@/types';
import { LoadingSpinner } from '@/components/ui/Loading';
import { AddMediaModal } from '@/components/features/entertainment/AddMediaModal';

export default function EntertainmentPage() {
    const { items, loading, createItem, updateItem, deleteItem } = useEntertainment();
    const [activeTab, setActiveTab] = useState<EntertainmentType | 'all'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (activeTab !== 'all' && item.type !== activeTab) return false;
            if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [items, activeTab, searchQuery]);

    const stats = useMemo(() => {
        return {
            movies: items.filter(i => i.type === 'movie').length,
            shows: items.filter(i => i.type === 'tv').length,
            books: items.filter(i => i.type === 'book').length,
            games: items.filter(i => i.type === 'game').length,
        };
    }, [items]);

    const tabs: { id: EntertainmentType | 'all', label: string, icon: any, count?: number }[] = [
        { id: 'all', label: 'All Library', icon: LayoutGrid, count: items.length },
        { id: 'movie', label: 'Movies', icon: Film, count: stats.movies },
        { id: 'tv', label: 'TV Shows', icon: Tv, count: stats.shows },
        { id: 'book', label: 'Books', icon: BookOpen, count: stats.books },
        { id: 'game', label: 'Games', icon: Gamepad2, count: stats.games },
    ];

    return (
        <MainLayout>
            <PageContainer
                title="Entertainment"
                subtitle="Track your movies, shows, books, and games"
                actions={
                    <Button variant="glow" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
                        Add Media
                    </Button>
                }
            >
                {/* Top Navigation & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                    {/* Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all snap-start whitespace-nowrap",
                                        isActive
                                            ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                                            : "bg-glass-light text-white/60 hover:text-white hover:bg-glass-medium border border-transparent"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    <span className={cn(
                                        "ml-1.5 px-2 py-0.5 rounded-full text-[10px]",
                                        isActive ? "bg-neon-cyan/20 text-neon-cyan" : "bg-dark-600 text-white/40"
                                    )}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 pl-9 pr-4 py-2 bg-glass-light border border-glass-border rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/40 focus:bg-glass-medium transition-all"
                            />
                        </div>

                        <div className="flex items-center bg-glass-light rounded-xl p-1 border border-glass-border">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn("p-1.5 rounded-lg transition-colors", viewMode === 'grid' ? "bg-dark-600 text-white" : "text-white/40 hover:text-white/80")}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-1.5 rounded-lg transition-colors", viewMode === 'list' ? "bg-dark-600 text-white" : "text-white/40 hover:text-white/80")}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="mt-8">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <Card variant="glass" className="py-20 text-center border-dashed">
                            <CardContent className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-glass-medium flex items-center justify-center mb-4">
                                    <Film className="w-8 h-8 text-white/20" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No media found</h3>
                                <p className="text-white/50 max-w-sm mb-6">
                                    {searchQuery ? "No items match your search. Try changing your filters." : "Your entertainment library is empty. Start tracking your favorite movies, shows, books, and games."}
                                </p>
                                <Button variant="glow" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
                                    Add your first item
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <motion.div
                            layout
                            className={cn(
                                "grid gap-4",
                                viewMode === 'grid'
                                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                                    : "grid-cols-1"
                            )}
                        >
                            <AnimatePresence>
                                {filteredItems.map(item => (
                                    <MediaCard key={item.id} item={item} viewMode={viewMode} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </PageContainer>

            <AddMediaModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </MainLayout>
    );
}

function MediaCard({ item, viewMode }: { item: EntertainmentItem, viewMode: 'grid' | 'list' }) {
    const getIcon = () => {
        switch (item.type) {
            case 'movie': return <Film className="w-4 h-4" />;
            case 'tv': return <Tv className="w-4 h-4" />;
            case 'book': return <BookOpen className="w-4 h-4" />;
            case 'game': return <Gamepad2 className="w-4 h-4" />;
        }
    };

    const statusColors = {
        planned: "text-white/50 bg-white/5 border-white/10",
        in_progress: "text-neon-orange bg-neon-orange/10 border-neon-orange/20",
        completed: "text-neon-green bg-neon-green/10 border-neon-green/20",
        dropped: "text-red-400 bg-red-400/10 border-red-400/20",
    };

    const statusLabels = {
        planned: "Want to",
        in_progress: "Current",
        completed: "Done",
        dropped: "Dropped",
    };

    if (viewMode === 'list') {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-4 p-3 pr-5 bg-glass-light border border-glass-border rounded-xl hover:bg-glass-medium transition-colors group cursor-pointer"
            >
                <div className="w-12 h-16 rounded-md bg-dark-700 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {item.coverImage ? (
                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-white/20">{getIcon()}</div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white truncate">{item.title}</h4>
                        {item.rating && (
                            <div className="flex items-center gap-1 text-[10px] text-neon-yellow font-medium">
                                <Star className="w-3 h-3 fill-current" />
                                {item.rating}/10
                            </div>
                        )}
                    </div>
                    {item.creator && <p className="text-xs text-white/50 truncate mb-1">{item.creator}</p>}
                    <div className="flex items-center gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                            {getIcon()}
                            <span className="capitalize">{item.type}</span>
                        </span>
                        {item.totalProgress && item.progress !== undefined && (
                            <span>• {item.progress} / {item.totalProgress}</span>
                        )}
                    </div>
                </div>

                <div className={cn("px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold border", statusColors[item.status])}>
                    {statusLabels[item.status]}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative cursor-pointer"
        >
            <div className="aspect-[2/3] rounded-2xl bg-dark-800 border border-glass-border overflow-hidden relative mb-3 hover:border-white/20 transition-colors shadow-glass-sm group-hover:shadow-glass-md">
                {item.coverImage ? (
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-3">
                        {getIcon()}
                        <span className="text-xs font-medium uppercase tracking-widest">{item.type}</span>
                    </div>
                )}

                {/* Rating Badge */}
                {item.rating && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-dark-900/80 backdrop-blur-md rounded-lg text-xs font-semibold text-neon-yellow flex items-center gap-1 border border-white/5">
                        <Star className="w-3 h-3 fill-current" />
                        {item.rating}
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                    {item.status === 'completed' && <div className="w-6 h-6 rounded-full bg-neon-green/90 text-dark-950 flex items-center justify-center shadow-lg"><CheckCircle2 className="w-4 h-4" /></div>}
                    {item.status === 'in_progress' && <div className="w-6 h-6 rounded-full bg-neon-orange/90 text-dark-950 flex items-center justify-center shadow-lg"><Clock className="w-4 h-4" /></div>}
                </div>

                {/* Progress Bar */}
                {item.status === 'in_progress' && item.totalProgress && item.progress !== undefined && (
                    <div className="absolute bottom-0 inset-x-0 h-1.5 bg-dark-900/60 backdrop-blur-md">
                        <div
                            className="h-full bg-gradient-to-r from-neon-orange to-neon-pink"
                            style={{ width: `${Math.min(100, (item.progress / item.totalProgress) * 100)}%` }}
                        />
                    </div>
                )}
            </div>

            <div>
                <h4 className="font-semibold text-white/90 truncate group-hover:text-white transition-colors">{item.title}</h4>
                {item.creator ? (
                    <p className="text-xs text-white/40 truncate">{item.creator}</p>
                ) : (
                    <p className="text-xs text-white/30 truncate capitalize">{item.type}</p>
                )}
            </div>
        </motion.div>
    );
}
