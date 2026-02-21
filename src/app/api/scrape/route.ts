import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy to fetch external URLs (avoids CORS).
 * POST /api/scrape  { url: string }
 * Returns { html: string } (truncated to 15 000 chars for safety).
 */
export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Basic validation
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NexoraBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch: ${response.status}` },
                { status: 502 }
            );
        }

        const html = await response.text();

        // Strip scripts and styles, truncate
        const cleaned = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[\s\S]*?<\/footer>/gi, '')
            .substring(0, 15000);

        return NextResponse.json({ html: cleaned });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Scrape failed' },
            { status: 500 }
        );
    }
}
