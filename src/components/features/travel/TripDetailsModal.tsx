'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MapPin, Calendar, Briefcase, Plus, Plane, Hotel, Navigation, Activity, Utensils, Hash,
    CheckCircle2, Trash2, ShieldCheck, Shirt, Smartphone, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTrips, useItinerary, usePackingList } from '@/hooks/useTravel';
import { cn } from '@/lib/utils';
import type { Trip, ItineraryItem, PackingItem } from '@/types';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/Loading';

interface TripDetailsModalProps {
    isOpen: boolean;
    trip: Trip;
    onClose: () => void;
}

export function TripDetailsModal({ isOpen, trip, onClose }: TripDetailsModalProps) {
    const { deleteTrip } = useTrips();
    const { items: itinerary, loading: initLoading, addItem: addItin, deleteItem: delItin } = useItinerary(isOpen ? trip.id : null);
    const { items: packing, loading: packLoading, addItem: addPack, updateItem: updPack, deleteItem: delPack } = usePackingList(isOpen ? trip.id : null);

    const [activeTab, setActiveTab] = useState<'itinerary' | 'packing'>('itinerary');
    const [isAddingItin, setIsAddingItin] = useState(false);
    const [isAddingPack, setIsAddingPack] = useState(false);

    // Itinerary Form
    const [itinTitle, setItinTitle] = useState('');
    const [itinType, setItinType] = useState<ItineraryItem['type']>('flight');
    const [itinStartTime, setItinStartTime] = useState('');
    const [itinEndTime, setItinEndTime] = useState('');
    const [itinLocation, setItinLocation] = useState('');
    const [itinCost, setItinCost] = useState('');

    // Packing Form
    const [packName, setPackName] = useState('');
    const [packCategory, setPackCategory] = useState<PackingItem['category']>('clothing');
    const [packQuantity, setPackQuantity] = useState('1');

    const handleDeleteTrip = async () => {
        if (confirm('Are you sure you want to delete this trip entirely?')) {
            await deleteTrip(trip.id);
            onClose();
        }
    };

    const handleAddItin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itinTitle.trim() || !itinStartTime) return;
        try {
            await addItin({
                title: itinTitle.trim(),
                type: itinType,
                startTime: new Date(itinStartTime),
                endTime: itinEndTime ? new Date(itinEndTime) : undefined,
                location: itinLocation.trim() || undefined,
                cost: itinCost ? Number(itinCost) : undefined,
            });
            setIsAddingItin(false);
            setItinTitle('');
            setItinStartTime('');
            setItinEndTime('');
            setItinLocation('');
            setItinCost('');
        } catch (e) { console.error('Error adding itinerary', e); }
    };

    const handleAddPack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!packName.trim()) return;
        try {
            await addPack({
                name: packName.trim(),
                category: packCategory,
                quantity: Number(packQuantity) || 1,
                isPacked: false,
            });
            setIsAddingPack(false);
            setPackName('');
            setPackQuantity('1');
        } catch (e) { console.error('Error adding packing item', e); }
    };

    const ITIN_ICONS: Record<string, any> = {
        flight: Plane, hotel: Hotel, transit: Navigation, activity: Activity, food: Utensils, other: Hash
    };

    const PACK_ICONS: Record<string, any> = {
        clothing: Shirt, toiletries: ShieldCheck, electronics: Smartphone, documents: FileText, other: Briefcase
    };

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
                        className="relative w-full max-w-4xl bg-dark-800 border border-glass-border rounded-2xl shadow-glass-lg overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header w/ Cover Image */}
                        <div className="relative h-48 w-full bg-dark-900 border-b border-glass-border">
                            {trip.coverImage ? (
                                <div className="absolute inset-0 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent z-10" />
                                    <img src={trip.coverImage} alt={trip.destination} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 to-neon-cyan/10 z-0 flex items-center justify-center">
                                    <Briefcase className="w-16 h-16 text-white/10" />
                                </div>
                            )}

                            <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
                                <div className="flex justify-end gap-2">
                                    <button onClick={handleDeleteTrip} className="p-2 bg-dark-900/50 backdrop-blur text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                    <button onClick={onClose} className="p-2 bg-dark-900/50 backdrop-blur text-white hover:bg-glass-medium rounded-xl transition-all"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="text-white mt-auto">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/20">
                                            {trip.status}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-bold font-heading drop-shadow-md">{trip.title}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-white/80 font-medium drop-shadow">
                                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {trip.destination}</span>
                                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-glass-border px-6">
                            <button
                                className={cn("px-6 py-4 text-sm font-medium transition-colors border-b-2", activeTab === 'itinerary' ? "border-neon-cyan text-neon-cyan" : "border-transparent text-white/50 hover:text-white")}
                                onClick={() => setActiveTab('itinerary')}
                            >
                                Itinerary
                            </button>
                            <button
                                className={cn("px-6 py-4 text-sm font-medium transition-colors border-b-2", activeTab === 'packing' ? "border-neon-purple text-neon-purple" : "border-transparent text-white/50 hover:text-white")}
                                onClick={() => setActiveTab('packing')}
                            >
                                Packing List
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-dark-950/50">
                            {activeTab === 'itinerary' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-lg font-semibold text-white">Trip Schedule</h3>
                                        <Button variant="outline" size="sm" onClick={() => setIsAddingItin(!isAddingItin)}>
                                            {isAddingItin ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Add Item</>}
                                        </Button>
                                    </div>

                                    {isAddingItin && (
                                        <form onSubmit={handleAddItin} className="p-4 bg-dark-800 border border-neon-cyan/30 rounded-xl space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-white/40 tracking-wider">Title *</label>
                                                    <input type="text" required value={itinTitle} onChange={e => setItinTitle(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Flight Delta 241" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-white/40 tracking-wider">Type</label>
                                                    <select value={itinType} onChange={e => setItinType(e.target.value as any)} className="w-full bg-dark-900 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan/50">
                                                        {Object.keys(ITIN_ICONS).map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-white/40 tracking-wider">Start Time *</label>
                                                    <input type="datetime-local" required value={itinStartTime} onChange={e => setItinStartTime(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan/50 custom-calendar-icon" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-white/40 tracking-wider">End Time</label>
                                                    <input type="datetime-local" value={itinEndTime} onChange={e => setItinEndTime(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan/50 custom-calendar-icon" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-white/40 tracking-wider">Location</label>
                                                    <input type="text" value={itinLocation} onChange={e => setItinLocation(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., JFK Terminal 4" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-white/40 tracking-wider">Cost (Est. $)</label>
                                                    <input type="number" min="0" value={itinCost} onChange={e => setItinCost(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan/50" placeholder="Optional" />
                                                </div>
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <Button type="submit" variant="glow" size="sm" disabled={!itinTitle.trim() || !itinStartTime}>Save Item</Button>
                                            </div>
                                        </form>
                                    )}

                                    {initLoading ? (
                                        <div className="py-10 flex justify-center"><LoadingSpinner /></div>
                                    ) : itinerary.length === 0 ? (
                                        <div className="py-12 text-center text-white/40 border-2 border-dashed border-glass-border rounded-xl">Your itinerary is empty.</div>
                                    ) : (
                                        <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-glass-border">
                                            {itinerary.map(item => {
                                                const Icon = ITIN_ICONS[item.type] || Hash;
                                                return (
                                                    <div key={item.id} className="relative pl-12">
                                                        <div className="absolute left-[9px] top-4 w-[22px] h-[22px] rounded-full bg-dark-900 border-[3px] border-dark-950 flex items-center justify-center text-neon-cyan z-10 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                                                            <Icon className="w-3 h-3" />
                                                        </div>
                                                        <div className="bg-glass-light border border-glass-border rounded-xl p-4 hover:border-neon-cyan/30 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs font-semibold uppercase tracking-wider text-neon-cyan">{format(new Date(item.startTime), 'MMM d, h:mm a')}</span>
                                                                    {item.endTime && <span className="text-xs text-white/40">- {format(new Date(item.endTime), 'h:mm a')}</span>}
                                                                </div>
                                                                <h4 className="text-base font-medium text-white">{item.title}</h4>
                                                                {item.location && <p className="text-sm text-white/60 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {item.location}</p>}
                                                            </div>
                                                            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-glass-border pt-3 md:pt-0">
                                                                {item.cost && <span className="text-sm font-medium text-white/80">${item.cost.toLocaleString()}</span>}
                                                                <button onClick={() => delItin(item.id)} className="text-white/30 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'packing' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-lg font-semibold text-white">Packing List</h3>
                                        <Button variant="outline" size="sm" onClick={() => setIsAddingPack(!isAddingPack)} className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10">
                                            {isAddingPack ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Add Item</>}
                                        </Button>
                                    </div>

                                    {isAddingPack && (
                                        <form onSubmit={handleAddPack} className="flex flex-col md:flex-row gap-3 p-4 bg-dark-800 border border-neon-purple/30 rounded-xl">
                                            <div className="flex-1 relative">
                                                <input type="text" required value={packName} onChange={e => setPackName(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple/50" placeholder="Item name (e.g., Socks)" />
                                            </div>
                                            <select value={packCategory} onChange={e => setPackCategory(e.target.value as any)} className="w-32 bg-dark-900 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple/50">
                                                {Object.keys(PACK_ICONS).map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                                            </select>
                                            <input type="number" min="1" value={packQuantity} onChange={e => setPackQuantity(e.target.value)} className="w-20 bg-dark-900 border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple/50 text-center" />
                                            <Button type="submit" variant="glow" className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 border-neon-purple/50 shadow-[0_0_15px_rgba(188,19,254,0.3)]">Add</Button>
                                        </form>
                                    )}

                                    {packLoading ? (
                                        <div className="py-10 flex justify-center"><LoadingSpinner /></div>
                                    ) : packing.length === 0 ? (
                                        <div className="py-12 text-center text-white/40 border-2 border-dashed border-glass-border rounded-xl">Nothing added to your packing list yet.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {Object.keys(PACK_ICONS).map(category => {
                                                const itemsInCategory = packing.filter(p => p.category === category);
                                                if (itemsInCategory.length === 0) return null;

                                                const CatIcon = PACK_ICONS[category];
                                                const packedCount = itemsInCategory.filter(i => i.isPacked).length;

                                                return (
                                                    <div key={category} className="bg-glass-light border border-glass-border rounded-xl p-4 h-fit">
                                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-glass-border">
                                                            <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wider flex items-center gap-2">
                                                                <CatIcon className="w-4 h-4 text-neon-purple" /> {category}
                                                            </h4>
                                                            <span className="text-xs font-medium text-white/50">{packedCount} / {itemsInCategory.length}</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {itemsInCategory.map(item => (
                                                                <div key={item.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-glass-medium group transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            onClick={() => updPack(item.id, { isPacked: !item.isPacked })}
                                                                            className={cn("w-5 h-5 rounded flex items-center justify-center border transition-colors", item.isPacked ? "bg-neon-purple border-neon-purple text-dark-950" : "border-white/30 group-hover:border-white/60")}
                                                                        >
                                                                            {item.isPacked && <CheckCircle2 className="w-4 h-4" />}
                                                                        </button>
                                                                        <span className={cn("text-sm transition-all", item.isPacked ? "text-white/30 line-through" : "text-white/90")}>
                                                                            {item.name} {item.quantity > 1 && <span className="text-white/40 text-xs ml-1">x{item.quantity}</span>}
                                                                        </span>
                                                                    </div>
                                                                    <button onClick={() => delPack(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400/50 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
