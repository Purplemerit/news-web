import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchRSSFromUrl, convertToNewsArticles } from '@/lib/rssParser';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

interface FetchNewsParams {
  country?: string;
  category?: string;
  limit?: number;
}

/**
 * Fetch and store news articles from RSS sources
 * GET /api/news/fetch?country=INDIA&category=sports&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || undefined;
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log(`📰 Fetching news - Country: ${country || 'ALL'}, Category: ${category || 'ALL'}, Limit: ${limit}`);

    // Build query to get active news sources
    const whereClause: any = { active: true };
    if (country) whereClause.country = country;
    if (category) whereClause.category = category;

    // Get news sources from database
    const sources = await prisma.newsSource.findMany({
      where: whereClause,
      take: limit,
    });

    if (sources.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No news sources found for the given criteria',
        fetched: 0,
      });
    }

    console.log(`📡 Found ${sources.length} news sources to fetch from`);

    let totalArticlesFetched = 0;
    const errors: string[] = [];

    // Fetch articles from each source
    for (const source of sources) {
      try {
        console.log(`  ↳ Fetching from ${source.name} (${source.category})...`);

        const feed = await fetchRSSFromUrl(source.url);
        const articles = convertToNewsArticles(feed.items, source.name);

        console.log(`    Found ${articles.length} articles`);
        totalArticlesFetched += articles.length;

        // Optional: Store articles in database if needed
        // (Currently they're fetched on-demand via RSS, but you could cache them here)

      } catch (error: any) {
        const errorMsg = `Error fetching from ${source.name}: ${error.message}`;
        console.error(`    ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully fetched news from ${sources.length} sources`,
      sources: sources.length,
      articlesTotal: totalArticlesFetched,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Error in fetch news API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Manually trigger news fetch for specific sources
 * POST /api/news/fetch
 * Body: { sourceIds: ['id1', 'id2'], country: 'INDIA', category: 'sports' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceIds, country, category }: { sourceIds?: string[], country?: string, category?: string } = body;

    const whereClause: any = { active: true };
    if (sourceIds && sourceIds.length > 0) {
      whereClause.id = { in: sourceIds };
    } else {
      if (country) whereClause.country = country;
      if (category) whereClause.category = category;
    }

    const sources = await prisma.newsSource.findMany({
      where: whereClause,
    });

    let fetchedCount = 0;
    const results = [];

    for (const source of sources) {
      try {
        const feed = await fetchRSSFromUrl(source.url);
        const articles = convertToNewsArticles(feed.items, source.name);

        results.push({
          source: source.name,
          country: source.country,
          category: source.category,
          articlesCount: articles.length,
          success: true,
        });

        fetchedCount += articles.length;
      } catch (error: any) {
        results.push({
          source: source.name,
          country: source.country,
          category: source.category,
          articlesCount: 0,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalSources: sources.length,
      totalArticles: fetchedCount,
      results,
    });

  } catch (error: any) {
    console.error('Error in POST fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', details: error.message },
      { status: 500 }
    );
  }
}
