'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Search,
    MapPin,
    Calendar,
    Plus,
    Clock,
    CheckCircle2,
    PlaneTakeoff,
    MoreHorizontal
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTrips } from '@/hooks/useTravel';
import { cn } from '@/lib/utils';
import type { Trip } from '@/types';
import { format, isPast, isFuture, isWithinInterval } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/Loading';
import { AddTripModal } from '@/components/features/travel/AddTripModal';
import { TripDetailsModal } from '@/components/features/travel/TripDetailsModal';

export default function TravelPage() {
    const { trips, loading } = useTrips();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<Trip['status'] | 'all'>('all');

    const [isAddTripOpen, setIsAddTripOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

    const statuses: { id: Trip['status'] | 'all'; label: string }[] = [
        { id: 'all', label: 'All Trips' },
        { id: 'planned', label: 'Planned' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'ongoing', label: 'Ongoing' },
        { id: 'completed', label: 'Completed' },
    ];

    const filteredTrips = useMemo(() => {
        return trips.filter((t) => {
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    t.title.toLowerCase().includes(query) ||
                    t.destination.toLowerCase().includes(query) ||
                    t.notes?.toLowerCase().includes(query)
                );
            }
            return true;
        }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime()); // Newest first
    }, [trips, searchQuery, filterStatus]);

    const ongoingTrip = useMemo(() => {
        return trips.find(t => t.status === 'ongoing' || isWithinInterval(new Date(), { start: t.startDate, end: t.endDate }));
    }, [trips]);

    const upcomingTrips = useMemo(() => {
        return trips.filter(t => t.status === 'upcoming' || (isFuture(t.startDate) && t.status !== 'planned')).sort((a, b) => a.startDate.getTime() - b.startDate.getTime()).slice(0, 2);
    }, [trips]);

    return (
        <MainLayout>
            <PageContainer
                title="Travel Planner"
                subtitle="Manage itineraries, packing lists, and keep track of your adventures."
                actions={
                    <Button variant="glow" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddTripOpen(true)}>
                        Plan Trip
                    </Button>
                }
            >
                <div className="flex flex-col xl:flex-row gap-6 mt-4">

                    {/* Main Area: Trip Board */}
                    <div className="flex-1 space-y-6">

                        {/* Filters & Search */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                                {statuses.map((status) => {
                                    const isActive = filterStatus === status.id;
                                    const count = status.id === 'all'
                                        ? trips.length
                                        : trips.filter(t => t.status === status.id).length;

                                    return (
                                        <button
                                            key={status.id}
                                            onClick={() => setFilterStatus(status.id)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-sm font-medium transition-all snap-start whitespace-nowrap border flex items-center gap-2",
                                                isActive
                                                    ? "bg-neon-purple/10 text-neon-purple border-neon-purple/20"
                                                    : "bg-glass-light text-white/60 hover:text-white hover:bg-glass-medium border-transparent"
                                            )}
                                        >
                                            {status.label}
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded-full text-[10px]",
                                                isActive ? "bg-neon-purple/20 text-neon-purple" : "bg-dark-600 text-white/40"
                                            )}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative md:w-64 flex-shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search trips..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-glass-light border border-glass-border rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-purple/40 focus:bg-glass-medium transition-all"
                                />
                            </div>
                        </div>

                        {/* Trips Grid */}
                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : filteredTrips.length === 0 ? (
                            <Card variant="glass" className="py-20 text-center border-dashed">
                                <CardContent className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-glass-medium flex items-center justify-center mb-4">
                                        <Briefcase className="w-8 h-8 text-white/20" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">No trips found</h3>
                                    <p className="text-white/50 max-w-sm mb-6">
                                        {searchQuery ? "No trips match your search criteria." : "Your travel board is empty. Start planning your next adventure."}
                                    </p>
                                    <Button variant="glow" leftIcon={<PlaneTakeoff className="w-4 h-4" />} onClick={() => setIsAddTripOpen(true)}>
                                        Plan Your First Trip
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                <AnimatePresence>
                                    {filteredTrips.map(trip => (
                                        <motion.div
                                            layout
                                            key={trip.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={() => setSelectedTrip(trip)}
                                            className="bg-glass-light border border-glass-border rounded-xl overflow-hidden hover:border-white/20 transition-all cursor-pointer group flex flex-col min-h-[220px]"
                                        >
                                            <div className="h-24 w-full relative overflow-hidden bg-dark-900 border-b border-glass-border">
                                                {trip.coverImage ? (
                                                    <img src={trip.coverImage} alt={trip.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 to-neon-cyan/10 flex items-center justify-center">
                                                        <Briefcase className="w-8 h-8 text-white/10" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md",
                                                        trip.status === 'ongoing' ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/20" :
                                                            trip.status === 'upcoming' ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/20" :
                                                                trip.status === 'completed' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                                                                    "bg-dark-900/60 text-white/60 border border-white/10"
                                                    )}>
                                                        {trip.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-lg text-white group-hover:text-neon-cyan transition-colors line-clamp-1">{trip.title}</h4>
                                                    <div className="flex items-center gap-1.5 text-sm text-white/50 mt-1">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span className="truncate">{trip.destination}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center justify-between text-white/40 text-xs font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>{format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}</span>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-neon-purple flex items-center gap-1">
                                                        View Itinerary <span className="text-lg leading-none">&rsaquo;</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: Active / Upcoming */}
                    <div className="xl:w-80 flex-shrink-0 space-y-4">
                        {/* Ongoing Trip Widget */}
                        {ongoingTrip && (
                            <Card variant="gradient" className="bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 border-neon-cyan/30">
                                <CardContent className="p-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-neon-cyan flex items-center gap-2 mb-3">
                                        <PlaneTakeoff className="w-4 h-4" />
                                        Currently Abroad
                                    </h3>
                                    <div
                                        className="bg-dark-900/50 rounded-xl p-3 border border-dark-700 cursor-pointer hover:border-neon-cyan/50 transition-colors"
                                        onClick={() => setSelectedTrip(ongoingTrip)}
                                    >
                                        <h4 className="text-base font-bold text-white mb-1">{ongoingTrip.title}</h4>
                                        <p className="text-sm text-white/60 flex items-center gap-1.5 mb-2"><MapPin className="w-3.5 h-3.5" /> {ongoingTrip.destination}</p>
                                        <div className="flex items-center gap-2 text-xs text-white/40">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{format(new Date(ongoingTrip.startDate), 'MMM d')} - {format(new Date(ongoingTrip.endDate), 'MMM d')}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Upcoming Trips Widget */}
                        <Card variant="glass">
                            <CardContent className="p-4">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                                    <Calendar className="w-4 h-4 text-neon-purple" />
                                    Upcoming Trips
                                </h3>
                                {upcomingTrips.length === 0 ? (
                                    <p className="text-sm text-white/40 text-center py-4">No upcoming trips scheduled.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingTrips.map((trip) => (
                                            <div
                                                key={trip.id}
                                                className="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 hover:bg-glass-medium border border-transparent hover:border-glass-border cursor-pointer transition-colors group"
                                                onClick={() => setSelectedTrip(trip)}
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-white/90 group-hover:text-neon-purple transition-colors mb-0.5">{trip.title}</p>
                                                    <p className="text-[10px] text-white/50 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {format(new Date(trip.startDate), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <MoreHorizontal className="w-4 h-4 text-white/20 group-hover:text-white/60" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {upcomingTrips.length > 0 && (
                                    <Button variant="ghost" className="w-full mt-3 text-xs text-white/40 hover:text-white" onClick={() => setFilterStatus('upcoming')}>
                                        View all upcoming
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContainer>

            <AddTripModal
                isOpen={isAddTripOpen}
                onClose={() => setIsAddTripOpen(false)}
            />

            {selectedTrip && (
                <TripDetailsModal
                    isOpen={!!selectedTrip}
                    trip={selectedTrip}
                    onClose={() => setSelectedTrip(null)}
                />
            )}
        </MainLayout>
    );
}
