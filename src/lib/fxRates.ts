// FX Rates utility - uses free open.er-api.com, cached 6h in localStorage

const CACHE_KEY = 'nexora_fx_rates';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in ms

interface FXCache {
    base: string;
    rates: Record<string, number>;
    fetchedAt: number;
}

export async function getFXRates(base: string = 'USD'): Promise<Record<string, number>> {
    if (typeof window === 'undefined') return { [base]: 1 };

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed: FXCache = JSON.parse(cached);
            if (parsed.base === base && Date.now() - parsed.fetchedAt < CACHE_TTL) {
                return parsed.rates;
            }
        }
    } catch {
        // ignore stale cache errors
    }

    try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
        if (!res.ok) throw new Error('FX fetch failed');
        const data = await res.json();
        const rates: Record<string, number> = data.rates || {};
        rates[base] = 1;

        const cache: FXCache = { base, rates, fetchedAt: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        return rates;
    } catch {
        // Return fallback so UI doesn't break
        return { [base]: 1, USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.1, JPY: 150 };
    }
}

export function convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>
): number {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = rates[fromCurrency] ?? 1;
    const toRate = rates[toCurrency] ?? 1;
    // Convert to base then to target
    return (amount / fromRate) * toRate;
}

export const COMMON_CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
];
