'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    addTemplate as addTemplateService,
    updateTemplate as updateTemplateService,
    deleteTemplate as deleteTemplateService,
    subscribeToTemplates,
    addFollowUp as addFollowUpService,
    updateFollowUp as updateFollowUpService,
    deleteFollowUp as deleteFollowUpService,
    subscribeToFollowUps,
} from '@/lib/services/comms';
import type { MessageTemplate, FollowUp } from '@/types';

export function useTemplates() {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setTemplates([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToTemplates(
            user.uid,
            (data) => {
                setTemplates(data);
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

    const addTemplate = useCallback(
        async (data: Partial<Omit<MessageTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await addTemplateService(user.uid, data);
        },
        [user]
    );

    const updateTemplate = useCallback(
        async (id: string, updates: Partial<MessageTemplate>) => await updateTemplateService(id, updates),
        []
    );

    const deleteTemplate = useCallback(
        async (id: string) => await deleteTemplateService(id),
        []
    );

    return { templates, loading, error, addTemplate, updateTemplate, deleteTemplate };
}

export function useFollowUps() {
    const { user } = useAuth();
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setFollowUps([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToFollowUps(
            user.uid,
            (data) => {
                setFollowUps(data);
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

    const addFollowUp = useCallback(
        async (data: Partial<Omit<FollowUp, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await addFollowUpService(user.uid, data);
        },
        [user]
    );

    const updateFollowUp = useCallback(
        async (id: string, updates: Partial<FollowUp>) => await updateFollowUpService(id, updates),
        []
    );

    const deleteFollowUp = useCallback(
        async (id: string) => await deleteFollowUpService(id),
        []
    );

    return { followUps, loading, error, addFollowUp, updateFollowUp, deleteFollowUp };
}
