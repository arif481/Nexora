'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    createTrip as createTripService,
    updateTrip as updateTripService,
    deleteTrip as deleteTripService,
    subscribeToTrips,
    addItineraryItem as addItineraryItemService,
    updateItineraryItem as updateItineraryItemService,
    deleteItineraryItem as deleteItineraryItemService,
    subscribeToItinerary,
    addPackingItem as addPackingItemService,
    updatePackingItem as updatePackingItemService,
    deletePackingItem as deletePackingItemService,
    subscribeToPackingList,
} from '@/lib/services/travel';
import type { Trip, ItineraryItem, PackingItem } from '@/types';

export function useTrips() {
    const { user } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setTrips([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToTrips(
            user.uid,
            (data) => {
                setTrips(data);
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

    const createTrip = useCallback(
        async (tripData: Partial<Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await createTripService(user.uid, tripData);
        },
        [user]
    );

    const updateTrip = useCallback(
        async (tripId: string, updates: Partial<Trip>) => {
            await updateTripService(tripId, updates);
        },
        []
    );

    const deleteTrip = useCallback(
        async (tripId: string) => {
            await deleteTripService(tripId);
        },
        []
    );

    return {
        trips,
        loading,
        error,
        createTrip,
        updateTrip,
        deleteTrip,
    };
}

export function useItinerary(tripId: string | null) {
    const { user } = useAuth();
    const [items, setItems] = useState<ItineraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user || !tripId) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToItinerary(
            user.uid,
            tripId,
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
    }, [user, tripId]);

    const addItem = useCallback(
        async (itemData: Partial<Omit<ItineraryItem, 'id' | 'userId' | 'tripId' | 'createdAt'>>) => {
            if (!user || !tripId) throw new Error('Missing auth or trip ID');
            return await addItineraryItemService(user.uid, tripId, itemData);
        },
        [user, tripId]
    );

    const updateItem = useCallback(
        async (itemId: string, updates: Partial<ItineraryItem>) => {
            await updateItineraryItemService(itemId, updates);
        },
        []
    );

    const deleteItem = useCallback(
        async (itemId: string) => {
            await deleteItineraryItemService(itemId);
        },
        []
    );

    return {
        items,
        loading,
        error,
        addItem,
        updateItem,
        deleteItem,
    };
}

export function usePackingList(tripId: string | null) {
    const { user } = useAuth();
    const [items, setItems] = useState<PackingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user || !tripId) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToPackingList(
            user.uid,
            tripId,
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
    }, [user, tripId]);

    const addItem = useCallback(
        async (itemData: Partial<Omit<PackingItem, 'id' | 'userId' | 'tripId' | 'createdAt'>>) => {
            if (!user || !tripId) throw new Error('Missing auth or trip ID');
            return await addPackingItemService(user.uid, tripId, itemData);
        },
        [user, tripId]
    );

    const updateItem = useCallback(
        async (itemId: string, updates: Partial<PackingItem>) => {
            await updatePackingItemService(itemId, updates);
        },
        []
    );

    const deleteItem = useCallback(
        async (itemId: string) => {
            await deletePackingItemService(itemId);
        },
        []
    );

    return {
        items,
        loading,
        error,
        addItem,
        updateItem,
        deleteItem,
    };
}
