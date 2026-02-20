'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Objective } from '@/types';
import {
    subscribeToObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
} from '@/lib/services/okr';

export function useOKR() {
    const { user } = useAuth();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { setObjectives([]); setLoading(false); return; }
        setLoading(true);
        const unsubscribe = subscribeToObjectives(
            user.uid,
            (objs) => { setObjectives(objs); setLoading(false); },
            () => { setObjectives([]); setLoading(false); }
        );
        return () => unsubscribe();
    }, [user]);

    const addObjective = useCallback(
        async (data: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>) => {
            if (!user) throw new Error('Not authenticated');
            await createObjective(user.uid, data);
        },
        [user]
    );

    const editObjective = useCallback(
        async (id: string, updates: Partial<Objective>) => {
            await updateObjective(id, updates);
        },
        []
    );

    const removeObjective = useCallback(
        async (id: string) => {
            await deleteObjective(id);
        },
        []
    );

    return { objectives, loading, addObjective, editObjective, removeObjective };
}
