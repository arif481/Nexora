import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { InvestmentPortfolio } from '@/types';
import {
    subscribeToPortfolios,
    createPortfolio,
    updatePortfolio,
    deletePortfolio as removePortfolio,
} from '@/lib/services/investments';

export function useInvestments() {
    const { user } = useAuth();
    const [portfolios, setPortfolios] = useState<InvestmentPortfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setPortfolios([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = subscribeToPortfolios(
            user.uid,
            (fetched) => {
                setPortfolios(fetched);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err.message);
                setPortfolios([]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const addPortfolio = useCallback(
        async (
            data: Omit<InvestmentPortfolio, 'id' | 'userId' | 'createdAt' | 'lastUpdated'>
        ): Promise<string> => {
            if (!user) throw new Error('User not authenticated');

            try {
                return await createPortfolio(user.uid, data);
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        [user]
    );

    const editPortfolio = useCallback(
        async (id: string, updates: Partial<InvestmentPortfolio>): Promise<void> => {
            try {
                await updatePortfolio(id, updates);
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        []
    );

    const deletePortfolio = useCallback(
        async (id: string): Promise<void> => {
            try {
                await removePortfolio(id);
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        []
    );

    return {
        portfolios,
        loading,
        error,
        addPortfolio,
        editPortfolio,
        deletePortfolio,
    };
}
