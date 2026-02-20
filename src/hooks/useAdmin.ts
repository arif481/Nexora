'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    addSubscription as addSubscriptionService,
    updateSubscription as updateSubscriptionService,
    deleteSubscription as deleteSubscriptionService,
    subscribeToSubscriptions,
    addVehicle as addVehicleService,
    updateVehicle as updateVehicleService,
    deleteVehicle as deleteVehicleService,
    subscribeToVehicles,
    addMedication as addMedicationService,
    updateMedication as updateMedicationService,
    deleteMedication as deleteMedicationService,
    subscribeToMedications,
    addPet as addPetService,
    updatePet as updatePetService,
    deletePet as deletePetService,
    subscribeToPets,
} from '@/lib/services/admin';
import type { AdminSubscription, Vehicle, Medication, Pet } from '@/types';

export function useSubscriptions() {
    const { user } = useAuth();
    const [items, setItems] = useState<AdminSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToSubscriptions(
            user.uid,
            (data) => {
                setItems(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const add = useCallback(
        async (subData: Partial<Omit<AdminSubscription, 'id' | 'userId' | 'createdAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await addSubscriptionService(user.uid, subData);
        },
        [user]
    );

    const update = useCallback(
        async (id: string, updates: Partial<AdminSubscription>) => await updateSubscriptionService(id, updates),
        []
    );

    const remove = useCallback(
        async (id: string) => await deleteSubscriptionService(id),
        []
    );

    return { items, loading, error, add, update, remove };
}

export function useVehicles() {
    const { user } = useAuth();
    const [items, setItems] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToVehicles(
            user.uid,
            (data) => {
                setItems(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const add = useCallback(
        async (data: Partial<Omit<Vehicle, 'id' | 'userId' | 'createdAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await addVehicleService(user.uid, data);
        },
        [user]
    );

    const update = useCallback(
        async (id: string, updates: Partial<Vehicle>) => await updateVehicleService(id, updates),
        []
    );

    const remove = useCallback(
        async (id: string) => await deleteVehicleService(id),
        []
    );

    return { items, loading, error, add, update, remove };
}

export function useMedications() {
    const { user } = useAuth();
    const [items, setItems] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToMedications(
            user.uid,
            (data) => {
                setItems(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const add = useCallback(
        async (data: Partial<Omit<Medication, 'id' | 'userId' | 'createdAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await addMedicationService(user.uid, data);
        },
        [user]
    );

    const update = useCallback(
        async (id: string, updates: Partial<Medication>) => await updateMedicationService(id, updates),
        []
    );

    const remove = useCallback(
        async (id: string) => await deleteMedicationService(id),
        []
    );

    return { items, loading, error, add, update, remove };
}

export function usePets() {
    const { user } = useAuth();
    const [items, setItems] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToPets(
            user.uid,
            (data) => {
                setItems(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const add = useCallback(
        async (data: Partial<Omit<Pet, 'id' | 'userId' | 'createdAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await addPetService(user.uid, data);
        },
        [user]
    );

    const update = useCallback(
        async (id: string, updates: Partial<Pet>) => await updatePetService(id, updates),
        []
    );

    const remove = useCallback(
        async (id: string) => await deletePetService(id),
        []
    );

    return { items, loading, error, add, update, remove };
}
