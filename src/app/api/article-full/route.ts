import { NextRequest, NextResponse } from 'next/server';
import { scrapeFullArticle } from '@/lib/scraper';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const article = await scrapeFullArticle(url);

        if (!article) {
            return NextResponse.json({ error: 'Failed to extract article content' }, { status: 404 });
        }

        return NextResponse.json(article, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        console.error('Error in article-full API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
