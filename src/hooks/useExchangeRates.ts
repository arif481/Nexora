// Exchange rate React hook with auto-caching

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getExchangeRates, convertCurrency, type ExchangeRates, COMMON_CURRENCIES } from '@/lib/services/exchangeRates';

export { COMMON_CURRENCIES };

export function useExchangeRates(baseCurrency: string = 'USD') {
    const [rates, setRates] = useState<ExchangeRates | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        getExchangeRates(baseCurrency)
            .then(data => {
                if (mounted) {
                    setRates(data);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (mounted) {
                    setError(err);
                    setLoading(false);
                }
            });

        return () => { mounted = false; };
    }, [baseCurrency]);

    const convert = useCallback(
        async (amount: number, toCurrency: string) => {
            return convertCurrency(amount, baseCurrency, toCurrency);
        },
        [baseCurrency]
    );

    const getRate = useCallback(
        (toCurrency: string): number | null => {
            return rates?.rates[toCurrency] ?? null;
        },
        [rates]
    );

    return {
        rates,
        loading,
        error,
        convert,
        getRate,
        lastUpdated: rates?.lastUpdated || null,
    };
}
