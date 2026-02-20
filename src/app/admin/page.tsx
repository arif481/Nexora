'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    CreditCard,
    Car,
    TestTube2,
    PawPrint,
    Plus,
    Trash2,
    ExternalLink,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSubscriptions, useVehicles, useMedications, usePets } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';
import { format, isPast, addDays, getDaysInMonth } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/Loading';
import {
    AddSubscriptionModal,
    AddVehicleModal,
    AddMedicationModal,
    AddPetModal
} from '@/components/features/admin/AdminModals';

type TabId = 'subscriptions' | 'vehicles' | 'medications' | 'pets';

const TABS: { id: TabId; label: string; icon: any; color: string }[] = [
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'text-neon-cyan border-neon-cyan' },
    { id: 'vehicles', label: 'Vehicles', icon: Car, color: 'text-neon-purple border-neon-purple' },
    { id: 'medications', label: 'Medications', icon: TestTube2, color: 'text-neon-pink border-neon-pink' },
    { id: 'pets', label: 'Pets', icon: PawPrint, color: 'text-amber-400 border-amber-400' },
];

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<TabId>('subscriptions');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Hooks
    const { items: subs, loading: subsLoading, remove: removeSub } = useSubscriptions();
    const { items: vehicles, loading: vehLoading, remove: removeVeh } = useVehicles();
    const { items: meds, loading: medsLoading, remove: removeMed } = useMedications();
    const { items: pets, loading: petsLoading, remove: removePet } = usePets();

    const handleAddClick = () => setIsModalOpen(true);

    // Render helpers
    const renderSubscriptions = () => {
        if (subsLoading) return <div className="py-10 flex justify-center"><LoadingSpinner /></div>;
        if (subs.length === 0) return <EmptyState icon={CreditCard} title="No subscriptions" message="Track your recurring expenses." />;

        const totalMonthly = subs.reduce((acc, sub) => {
            let monthlyCost = sub.cost;
            if (sub.billingCycle === 'yearly') monthlyCost = sub.cost / 12;
            if (sub.billingCycle === 'weekly') monthlyCost = sub.cost * 4.33;
            if (sub.billingCycle === 'quarterly') monthlyCost = sub.cost / 3;
            return acc + monthlyCost;
        }, 0);

        return (
            <div className="space-y-6">
                <div className="bg-dark-800/50 border border-neon-cyan/20 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-neon-cyan font-bold uppercase tracking-wider">Est. Monthly Cost</p>
                        <p className="text-2xl font-bold text-white">${totalMonthly.toFixed(2)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {subs.map(sub => (
                        <div key={sub.id} className="bg-glass-light border border-glass-border rounded-xl p-4 hover:border-neon-cyan/30 transition-all group flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-semibold text-white">{sub.name}</h4>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{sub.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-neon-cyan">${sub.cost.toFixed(2)}</p>
                                    <p className="text-xs text-white/50">{sub.billingCycle}</p>
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-glass-border flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-white/50">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Next: {format(new Date(sub.nextPaymentDate), 'MMM d, yyyy')}</span>
                                </div>
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    {sub.url && <a href={sub.url} target="_blank" rel="noreferrer" className="p-1.5 text-white/40 hover:text-white"><ExternalLink className="w-4 h-4" /></a>}
                                    <button onClick={() => removeSub(sub.id)} className="p-1.5 text-red-400/50 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderVehicles = () => {
        if (vehLoading) return <div className="py-10 flex justify-center"><LoadingSpinner /></div>;
        if (vehicles.length === 0) return <EmptyState icon={Car} title="No vehicles" message="Keep track of service dates and info." />;

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {vehicles.map(veh => (
                    <div key={veh.id} className="bg-glass-light border border-glass-border rounded-xl p-5 hover:border-neon-purple/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center">
                                    <Car className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-white leading-tight">{veh.year} {veh.make}</h4>
                                    <p className="text-sm text-white/60">{veh.model}</p>
                                </div>
                            </div>
                            <button onClick={() => removeVeh(veh.id)} className="p-2 text-red-400/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6 p-3 bg-dark-900/50 rounded-lg text-sm">
                            <div>
                                <p className="text-[10px] uppercase text-white/40 tracking-wider">License Plate</p>
                                <p className="font-mono text-white/90">{veh.licensePlate || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderMedications = () => {
        if (medsLoading) return <div className="py-10 flex justify-center"><LoadingSpinner /></div>;
        if (meds.length === 0) return <EmptyState icon={TestTube2} title="No medications" message="Track active prescriptions and dosages." />;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meds.map(med => (
                    <div key={med.id} className="bg-glass-light border border-glass-border rounded-xl p-4 hover:border-neon-pink/30 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white text-lg">{med.name}</h4>
                            <button onClick={() => removeMed(med.id)} className="p-1 text-red-400/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-1 mt-3">
                            <p className="text-sm text-neon-pink font-medium bg-neon-pink/10 w-fit px-2 py-0.5 rounded-md">{med.dosage}</p>
                            <p className="text-sm text-white/70 flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5" /> {med.frequency}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderPets = () => {
        if (petsLoading) return <div className="py-10 flex justify-center"><LoadingSpinner /></div>;
        if (pets.length === 0) return <EmptyState icon={PawPrint} title="No pets" message="Manage your furry family members." />;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pets.map(pet => (
                    <div key={pet.id} className="bg-glass-light border border-glass-border rounded-xl p-5 hover:border-amber-400/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center">
                                    <PawPrint className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl text-white">{pet.name}</h4>
                                    <p className="text-sm text-white/60">{pet.breed ? `${pet.breed} (${pet.species})` : pet.species}</p>
                                </div>
                            </div>
                            <button onClick={() => removePet(pet.id)} className="p-2 text-red-400/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const activeTabData = TABS.find(t => t.id === activeTab)!;
    const ActiveIcon = activeTabData.icon;

    return (
        <MainLayout>
            <PageContainer
                title="Life Admin Hub"
                subtitle="Centralize your subscriptions, vehicles, meds, and pets."
                actions={
                    <Button variant="glow" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddClick} className={activeTabData.color.split(' ')[0].replace('text-', 'bg-').replace('bg-', 'bg-') + '/20 ' + activeTabData.color.split(' ')[0]}>
                        Add {activeTabData.label.slice(0, -1)}
                    </Button>
                }
            >
                <div className="mt-4 border-b border-glass-border flex overflow-x-auto scrollbar-none">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2",
                                activeTab === tab.id
                                    ? tab.color
                                    : "border-transparent text-white/50 hover:text-white hover:border-white/20"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
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
                            {activeTab === 'subscriptions' && renderSubscriptions()}
                            {activeTab === 'vehicles' && renderVehicles()}
                            {activeTab === 'medications' && renderMedications()}
                            {activeTab === 'pets' && renderPets()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </PageContainer>

            {/* Render the appropriate modal based on active tab */}
            {activeTab === 'subscriptions' && <AddSubscriptionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
            {activeTab === 'vehicles' && <AddVehicleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
            {activeTab === 'medications' && <AddMedicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
            {activeTab === 'pets' && <AddPetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}

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

function ClockIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
