import { NextRequest, NextResponse } from 'next/server';
import { fetchCountryFeeds } from '@/lib/rssParser';
import { CountryCode } from '@/config/multiTenantFeeds';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const country = (searchParams.get('country') as CountryCode) || 'UNITED_STATES';

    if (!query) {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    try {
        // Search across multiple categories to find relevant news
        const categories: any[] = ['news', 'world', 'business', 'technology', 'sports'];

        const results = await Promise.all(
            categories.map(cat => fetchCountryFeeds(country, cat))
        );

        // Flatten and filter by query
        const allArticles = results.flat();
        const filtered = allArticles.filter(art =>
            art.title.toLowerCase().includes(query.toLowerCase()) ||
            art.description.toLowerCase().includes(query.toLowerCase())
        );

        // Remove duplicates based on title
        const unique = Array.from(new Map(filtered.map(item => [item.title, item])).values());

        return NextResponse.json(unique);
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Failed to search news' }, { status: 500 });
    }
}
