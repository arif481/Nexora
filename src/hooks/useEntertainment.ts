'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    createEntertainmentItem as createService,
    updateEntertainmentItem as updateService,
    deleteEntertainmentItem as deleteService,
    subscribeToEntertainmentItems,
} from '@/lib/services/entertainment';
import type { EntertainmentItem, EntertainmentType } from '@/types';

export function useEntertainment(typeFilter: EntertainmentType | null = null) {
    const { user } = useAuth();
    const [items, setItems] = useState<EntertainmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToEntertainmentItems(
            user.uid,
            typeFilter,
            (fetchedItems) => {
                setItems(fetchedItems);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, typeFilter]);

    const createItem = useCallback(
        async (
            itemData: Partial<Omit<EntertainmentItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
        ) => {
            if (!user) throw new Error('User not authenticated');
            return await createService(user.uid, itemData);
        },
        [user]
    );

    const updateItem = useCallback(
        async (itemId: string, updates: Partial<EntertainmentItem>) => {
            await updateService(itemId, updates);
        },
        []
    );

    const deleteItem = useCallback(
        async (itemId: string) => {
            await deleteService(itemId);
        },
        []
    );

    return {
        items,
        loading,
        error,
        createItem,
        updateItem,
        deleteItem,
    };
}
