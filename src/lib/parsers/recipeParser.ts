// Recipe URL parser — uses Gemini API to extract recipe data from URL content

import type { Recipe } from '@/types';

/**
 * Parse a recipe from a URL by scraping the page and using Gemini AI to extract data.
 * Falls back to basic HTML parsing if Gemini is not available.
 */
export async function parseRecipeFromURL(url: string): Promise<Partial<Recipe> | null> {
    try {
        // Step 1: Fetch the page HTML via our server-side proxy
        const scrapeRes = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        if (!scrapeRes.ok) {
            throw new Error('Failed to fetch URL');
        }

        const { html } = await scrapeRes.json();

        // Step 2: Try Gemini API for smart extraction
        const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (geminiKey) {
            return await extractWithGemini(html, url, geminiKey);
        }

        // Step 3: Fallback to basic HTML parsing
        return extractFromHTML(html, url);
    } catch (err) {
        console.error('Recipe parse error:', err);
        return null;
    }
}

async function extractWithGemini(
    html: string,
    sourceUrl: string,
    apiKey: string
): Promise<Partial<Recipe>> {
    const prompt = `Extract recipe data from this HTML. Return ONLY valid JSON with these fields:
{
  "title": "recipe name",
  "prepTime": minutes as number or null,
  "cookTime": minutes as number or null,
  "servings": number or null,
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "tags": ["tag1", "tag2"] // e.g. cuisine type, diet type
}

HTML content:
${html.substring(0, 10000)}`;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
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

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON in response');

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            title: parsed.title || '',
            sourceUrl,
            prepTime: parsed.prepTime || undefined,
            cookTime: parsed.cookTime || undefined,
            servings: parsed.servings || undefined,
            ingredients: parsed.ingredients || [],
            instructions: parsed.instructions || [],
            tags: parsed.tags || [],
        };
    } catch {
        // Fallback to basic parsing
        return extractFromHTML(html, sourceUrl);
    }
}

function extractFromHTML(html: string, sourceUrl: string): Partial<Recipe> {
    // Basic regex-based extraction for common recipe schemas
    const getMetaContent = (property: string): string | undefined => {
        const match = html.match(new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]*)"`, 'i'))
            || html.match(new RegExp(`content="([^"]*)"[^>]+(?:property|name)="${property}"`, 'i'));
        return match?.[1];
    };

    const title = getMetaContent('og:title')
        || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]
        || '';

    const description = getMetaContent('og:description')
        || getMetaContent('description')
        || '';

    return {
        title: title.trim(),
        sourceUrl,
        ingredients: [],
        instructions: description ? [description] : [],
        tags: [],
    };
}
