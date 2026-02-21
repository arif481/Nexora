// Exchange rate service with localStorage caching (24h TTL)
// Uses ExchangeRate-API free tier (no key needed for open endpoint)

export interface ExchangeRates {
    base: string;
    rates: Record<string, number>;
    lastUpdated: string;
}

const CACHE_KEY = 'nexora_exchange_rates';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get exchange rates for a base currency.
 * Caches in localStorage for 24h to minimize API calls.
 */
export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    // Check cache first
    try {
        const cached = localStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_TTL) {
                return parsed.data;
            }
        }
    } catch {
        // Cache miss, continue to fetch
    }

    try {
        // Free tier endpoint (no API key needed)
        const res = await fetch(
            `https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`
        );

        if (!res.ok) throw new Error('Exchange rate API error');

        const data = await res.json();

        const result: ExchangeRates = {
            base: baseCurrency,
            rates: data.rates || {},
            lastUpdated: data.time_last_update_utc || new Date().toISOString(),
        };

        // Cache result
        try {
            localStorage.setItem(`${CACHE_KEY}_${baseCurrency}`, JSON.stringify({
                data: result,
                timestamp: Date.now(),
            }));
        } catch {
            // localStorage full, ignore
        }

        return result;
    } catch (err) {
        console.error('Failed to fetch exchange rates:', err);
        // Return empty rates as fallback
        return {
            base: baseCurrency,
            rates: {},
            lastUpdated: '',
        };
    }
}

/**
 * Convert an amount between currencies.
 */
export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const rates = await getExchangeRates(fromCurrency);
    const rate = rates.rates[toCurrency];

    if (!rate) {
        console.warn(`No exchange rate found for ${fromCurrency} → ${toCurrency}`);
        return amount;
    }

    return Math.round(amount * rate * 100) / 100;
}

/**
 * Get a list of commonly used currencies.
 */
export const COMMON_CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
];
