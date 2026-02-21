// Media lookup services using free APIs
// TMDB (free, 1000 req/day) + Open Library (free, no key)

export interface MediaSearchResult {
    title: string;
    creator?: string;
    coverImage?: string;
    year?: string;
    overview?: string;
    externalId?: string;
}

/**
 * Search TMDB for movies or TV shows.
 * Requires NEXT_PUBLIC_TMDB_API_KEY env var.
 */
export async function searchTMDB(
    query: string,
    type: 'movie' | 'tv' = 'movie'
): Promise<MediaSearchResult[]> {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey || !query.trim()) return [];

    try {
        const endpoint = type === 'movie'
            ? `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`
            : `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`;

        const res = await fetch(endpoint);
        if (!res.ok) return [];

        const data = await res.json();
        return (data.results || []).slice(0, 5).map((item: Record<string, unknown>) => ({
            title: type === 'movie' ? String(item.title || '') : String(item.name || ''),
            creator: '', // TMDB doesn't return director in search
            coverImage: item.poster_path
                ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                : undefined,
            year: type === 'movie'
                ? String(item.release_date || '').substring(0, 4)
                : String(item.first_air_date || '').substring(0, 4),
            overview: String(item.overview || '').substring(0, 200),
            externalId: `tmdb-${item.id}`,
        }));
    } catch {
        return [];
    }
}

/**
 * Search Open Library for books (completely free, no API key).
 */
export async function searchOpenLibrary(query: string): Promise<MediaSearchResult[]> {
    if (!query.trim()) return [];

    try {
        const res = await fetch(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`
        );
        if (!res.ok) return [];

        const data = await res.json();
        return (data.docs || []).slice(0, 5).map((item: Record<string, unknown>) => ({
            title: String(item.title || ''),
            creator: Array.isArray(item.author_name)
                ? (item.author_name as string[])[0]
                : undefined,
            coverImage: item.cover_i
                ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
                : undefined,
            year: String(item.first_publish_year || ''),
            overview: '',
            externalId: `ol-${item.key}`,
        }));
    } catch {
        return [];
    }
}

/**
 * Unified search across TMDB and Open Library.
 */
export async function searchMedia(
    query: string,
    type: 'movie' | 'tv' | 'book'
): Promise<MediaSearchResult[]> {
    if (type === 'book') {
        return searchOpenLibrary(query);
    }
    return searchTMDB(query, type);
}
