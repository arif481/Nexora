import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Debt } from '@/types';
import {
    subscribeToDebts,
    createDebt,
    updateDebt,
    deleteDebt as removeDebt,
} from '@/lib/services/debts';

export function useDebts() {
    const { user } = useAuth();
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setDebts([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = subscribeToDebts(
            user.uid,
            (fetched) => {
                setDebts(fetched);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setDebts([]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const addDebt = useCallback(
        async (data: Omit<Debt, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
            if (!user) throw new Error('User not authenticated');
            try {
                return await createDebt(user.uid, data);
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        [user]
    );

    const editDebt = useCallback(async (id: string, updates: Partial<Debt>) => {
        try {
            await updateDebt(id, updates);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, []);

    const deleteDebt = useCallback(async (id: string) => {
        try {
            await removeDebt(id);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, []);

    return {
        debts,
        loading,
        error,
        addDebt,
        editDebt,
        deleteDebt,
    };
}
