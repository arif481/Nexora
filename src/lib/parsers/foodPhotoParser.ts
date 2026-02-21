// Food photo parser — uses Gemini vision to identify food from photos

export interface FoodParseResult {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    description: string;
    healthRating: number; // 1-10
    estimatedCalories?: number;
}

/**
 * Convert a File to base64.
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Parse a food photo using Gemini vision API.
 * Returns meal type, description, and health rating.
 */
export async function parseFoodPhoto(file: File): Promise<FoodParseResult | null> {
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
        console.warn('Gemini API key not configured for food photo parsing');
        return null;
    }

    try {
        const base64 = await fileToBase64(file);
        const mimeType = file.type || 'image/jpeg';

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `Identify this food/meal. Return ONLY valid JSON:
{
  "type": "breakfast" | "lunch" | "dinner" | "snack",
  "description": "brief description of the food",
  "healthRating": 1-10 (1=very unhealthy, 10=very healthy),
  "estimatedCalories": approximate calories as number
}`,
                            },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64,
                                },
                            },
                        ],
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 500,
                    },
                }),
            }
        );

        if (!res.ok) throw new Error('Gemini API error');

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON in response');

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            type: ['breakfast', 'lunch', 'dinner', 'snack'].includes(parsed.type)
                ? parsed.type
                : 'snack',
            description: String(parsed.description || 'Unknown food'),
            healthRating: Math.max(1, Math.min(10, Number(parsed.healthRating) || 5)),
            estimatedCalories: parsed.estimatedCalories ? Number(parsed.estimatedCalories) : undefined,
        };
    } catch (err) {
        console.error('Food photo parse error:', err);
        return null;
    }
}

/**
 * Parse a receipt image using Gemini vision API.
 * Returns transaction details extracted from the receipt.
 */
export interface ReceiptParseResult {
    merchant: string;
    total: number;
    date?: string;
    items: { name: string; price: number }[];
    currency?: string;
}

export async function parseReceiptPhoto(file: File): Promise<ReceiptParseResult | null> {
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
        console.warn('Gemini API key not configured for receipt parsing');
        return null;
    }

    try {
        const base64 = await fileToBase64(file);
        const mimeType = file.type || 'image/jpeg';

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `Extract receipt data from this image. Return ONLY valid JSON:
{
  "merchant": "store/restaurant name",
  "total": total amount as number,
  "date": "YYYY-MM-DD" or null,
  "items": [{"name": "item name", "price": price_as_number}, ...],
  "currency": "USD" or detected currency code
}`,
                            },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64,
                                },
                            },
                        ],
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2000,
                    },
                }),
            }
        );

        if (!res.ok) throw new Error('Gemini API error');

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON in response');

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            merchant: String(parsed.merchant || 'Unknown'),
            total: Number(parsed.total) || 0,
            date: parsed.date || undefined,
            items: Array.isArray(parsed.items)
                ? parsed.items.map((i: Record<string, unknown>) => ({
                    name: String(i.name || ''),
                    price: Number(i.price) || 0,
                }))
                : [],
            currency: parsed.currency || 'USD',
        };
    } catch (err) {
        console.error('Receipt parse error:', err);
        return null;
    }
}
