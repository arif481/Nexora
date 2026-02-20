import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { AutoRule } from '@/types';
import {
    subscribeToAutoRules,
    createAutoRule,
    updateAutoRule,
    deleteAutoRule as removeAutoRule,
} from '@/lib/services/autoRules';

export function useAutoRules() {
    const { user } = useAuth();
    const [rules, setRules] = useState<AutoRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setRules([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = subscribeToAutoRules(
            user.uid,
            (fetchedRules) => {
                setRules(fetchedRules);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Auto Rules subscription error:', err);
                setError(err.message);
                setRules([]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const addRule = useCallback(
        async (
            ruleData: Omit<AutoRule, 'id' | 'userId' | 'createdAt' | 'lastTriggeredAt'>
        ): Promise<string> => {
            if (!user) throw new Error('User not authenticated');

            try {
                return await createAutoRule(user.uid, ruleData);
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        [user]
    );

    const editRule = useCallback(
        async (ruleId: string, updates: Partial<AutoRule>): Promise<void> => {
            try {
                await updateAutoRule(ruleId, updates);
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        []
    );

    const deleteRule = useCallback(
        async (ruleId: string): Promise<void> => {
            try {
                await removeAutoRule(ruleId);
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        []
    );

    return {
        rules,
        loading,
        error,
        addRule,
        editRule,
        deleteRule,
    };
}
