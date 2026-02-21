'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Calendar, Link as LinkIcon, Car, TestTube2, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSubscriptions, useVehicles, useMedications, usePets } from '@/hooks/useAdmin';
import type { AdminSubscription, Vehicle, Medication, Pet } from '@/types';

// --- Shared Modal Wrapper ---
export function BaseModal({ isOpen, onClose, title, children, onSubmit, loading, valid }: any) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-dark-800 border border-glass-border rounded-2xl shadow-glass-lg overflow-hidden flex flex-col max-h-[90vh]">
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

// --- Add/Edit Subscription Modal ---
export function AddSubscriptionModal({ isOpen, onClose, editItem }: { isOpen: boolean; onClose: () => void; editItem?: any }) {
    const { add, update } = useSubscriptions();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [billingCycle, setBillingCycle] = useState<AdminSubscription['billingCycle']>('monthly');
    const [category, setCategory] = useState<AdminSubscription['category']>('software');
    const [nextPaymentDate, setNextPaymentDate] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (editItem) {
            setName(editItem.name || '');
            setCost(String(editItem.cost || ''));
            setBillingCycle(editItem.billingCycle || 'monthly');
            setCategory(editItem.category || 'software');
            setNextPaymentDate(editItem.nextPaymentDate ? new Date(editItem.nextPaymentDate).toISOString().split('T')[0] : '');
            setUrl(editItem.url || '');
        } else {
            setName(''); setCost(''); setBillingCycle('monthly'); setCategory('software'); setNextPaymentDate(''); setUrl('');
        }
    }, [editItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !cost || !nextPaymentDate) return;
        setLoading(true);
        try {
            const data = {
                name: name.trim(),
                cost: Number(cost),
                billingCycle,
                category,
                nextPaymentDate: new Date(nextPaymentDate),
                url: url.trim() || undefined,
            };
            if (editItem?.id) {
                await update(editItem.id, data);
            } else {
                await add(data);
            }
            onClose();
        } finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Subscription' : 'Add Subscription'} onSubmit={handleSubmit} loading={loading} valid={name && cost && nextPaymentDate}>
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Name *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Netflix" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Cost ($) *</label>
                        <input type="number" required min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Cycle *</label>
                        <select value={billingCycle} onChange={e => setBillingCycle(e.target.value as any)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50">
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="weekly">Weekly</option>
                            <option value="quarterly">Quarterly</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Next Payment *</label>
                    <input type="date" required value={nextPaymentDate} onChange={e => setNextPaymentDate(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50 custom-calendar-icon" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50">
                            <option value="entertainment">Entertainment</option>
                            <option value="software">Software</option>
                            <option value="utilities">Utilities</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">URL Link</label>
                        <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="https://..." />
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

// --- Add/Edit Vehicle Modal ---
export function AddVehicleModal({ isOpen, onClose, editItem }: { isOpen: boolean; onClose: () => void; editItem?: any }) {
    const { add, update } = useVehicles();
    const [loading, setLoading] = useState(false);
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [licensePlate, setLicensePlate] = useState('');

    useEffect(() => {
        if (editItem) {
            setMake(editItem.make || '');
            setModel(editItem.model || '');
            setYear(String(editItem.year || ''));
            setLicensePlate(editItem.licensePlate || '');
        } else {
            setMake(''); setModel(''); setYear(''); setLicensePlate('');
        }
    }, [editItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!make.trim() || !model.trim() || !year) return;
        setLoading(true);
        try {
            const data = {
                make: make.trim(),
                model: model.trim(),
                year: Number(year),
                licensePlate: licensePlate.trim() || undefined,
            };
            if (editItem?.id) {
                await update(editItem.id, data);
            } else {
                await add(data);
            }
            onClose();
        } finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Vehicle' : 'Add Vehicle'} onSubmit={handleSubmit} loading={loading} valid={make && model && year}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Make *</label>
                        <input type="text" required value={make} onChange={e => setMake(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Toyota" />
                    </div>
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Model *</label>
                        <input type="text" required value={model} onChange={e => setModel(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Camry" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Year *</label>
                        <input type="number" required value={year} onChange={e => setYear(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., 2021" />
                    </div>
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">License Plate</label>
                        <input type="text" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50 uppercase" placeholder="ABC-123" />
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

// --- Add/Edit Medication Modal ---
export function AddMedicationModal({ isOpen, onClose, editItem }: { isOpen: boolean; onClose: () => void; editItem?: any }) {
    const { add, update } = useMedications();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');

    useEffect(() => {
        if (editItem) {
            setName(editItem.name || '');
            setDosage(editItem.dosage || '');
            setFrequency(editItem.frequency || '');
        } else {
            setName(''); setDosage(''); setFrequency('');
        }
    }, [editItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !dosage.trim() || !frequency.trim()) return;
        setLoading(true);
        try {
            const data = {
                name: name.trim(),
                dosage: dosage.trim(),
                frequency: frequency.trim(),
            };
            if (editItem?.id) {
                await update(editItem.id, data);
            } else {
                await add(data);
            }
            onClose();
        } finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Medication' : 'Add Medication'} onSubmit={handleSubmit} loading={loading} valid={name && dosage && frequency}>
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Name *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Lisinopril" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Dosage *</label>
                        <input type="text" required value={dosage} onChange={e => setDosage(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., 10mg" />
                    </div>
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Frequency *</label>
                        <input type="text" required value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., 2x daily" />
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

// --- Add/Edit Pet Modal ---
export function AddPetModal({ isOpen, onClose, editItem }: { isOpen: boolean; onClose: () => void; editItem?: any }) {
    const { add, update } = usePets();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('');
    const [breed, setBreed] = useState('');

    useEffect(() => {
        if (editItem) {
            setName(editItem.name || '');
            setSpecies(editItem.species || '');
            setBreed(editItem.breed || '');
        } else {
            setName(''); setSpecies(''); setBreed('');
        }
    }, [editItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !species.trim()) return;
        setLoading(true);
        try {
            const data = {
                name: name.trim(),
                species: species.trim(),
                breed: breed.trim() || undefined,
            };
            if (editItem?.id) {
                await update(editItem.id, data);
            } else {
                await add(data);
            }
            onClose();
        } finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Pet' : 'Add Pet'} onSubmit={handleSubmit} loading={loading} valid={name && species}>
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Name *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Bella" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Species *</label>
                        <input type="text" required value={species} onChange={e => setSpecies(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Dog" />
                    </div>
                    <div>
                        <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Breed</label>
                        <input type="text" value={breed} onChange={e => setBreed(e.target.value)} className="w-full bg-dark-900 border border-glass-border rounded-xl px-4 py-3 text-sm text-white focus:border-neon-cyan/50" placeholder="e.g., Golden Retriever" />
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}
