import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchRSSFromUrl } from '@/lib/rssParser';
import { rephraseArticle } from '@/lib/geminiService';
import { storeArticleInS3, NewsArticleData } from '@/lib/s3Service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Fetch news from RSS, rephrase with Gemini, and store in S3
 * GET /api/news/rephrase-and-store?country=INDIA&category=sports&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || 'INDIA';
    const category = searchParams.get('category') || 'sports';
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`📰 Fetching, rephrasing, and storing news - Country: ${country}, Category: ${category}`);

    // Get news sources from database
    const sources = await prisma.newsSource.findMany({
      where: {
        country,
        category,
        active: true,
      },
      take: 3, // Limit to 3 sources to avoid rate limits
    });

    if (sources.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No news sources found',
      }, { status: 404 });
    }

    const processedArticles: NewsArticleData[] = [];
    let totalProcessed = 0;

    // Process each source
    for (const source of sources) {
      try {
        console.log(`  📡 Fetching from ${source.name}...`);

        // Fetch RSS feed
        const feed = await fetchRSSFromUrl(source.url);
        const articlesToProcess = feed.items.slice(0, Math.ceil(limit / sources.length));

        console.log(`  Found ${articlesToProcess.length} articles`);

        // Process each article
        for (const item of articlesToProcess) {
          if (totalProcessed >= limit) break;

          try {
            const title = item.title || 'Untitled';
            const content = item.contentSnippet || item.content || item.description || '';
            const excerpt = item.contentSnippet?.slice(0, 200);

            console.log(`    🔄 Rephrasing: ${title.slice(0, 50)}...`);

            // Rephrase with Gemini
            const rephrased = await rephraseArticle(title, content, excerpt);

            // Create article data
            const articleData: NewsArticleData = {
              id: `${source.country}-${source.category}-${Date.now()}-${totalProcessed}`,
              title: rephrased.rephrasedTitle,
              content: rephrased.rephrasedContent,
              excerpt: rephrased.rephrasedExcerpt || excerpt,
              image: (item as any).enclosure?.url || (item as any)['media:thumbnail']?.$ ?.url,
              source: source.name,
              category: source.category,
              country: source.country,
              publishedAt: item.pubDate || new Date().toISOString(),
              url: item.link,
              rephrasedAt: new Date().toISOString(),
            };

            // Store in S3
            await storeArticleInS3(articleData, country, category);

            processedArticles.push(articleData);
            totalProcessed++;

            console.log(`    ✅ Stored article: ${rephrased.rephrasedTitle.slice(0, 50)}...`);

            // Add delay to respect Gemini rate limits (15 RPM)
            await new Promise(resolve => setTimeout(resolve, 4000));

          } catch (error: any) {
            console.error(`    ❌ Error processing article:`, error.message);
          }
        }

      } catch (error: any) {
        console.error(`  ❌ Error fetching from ${source.name}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed and stored ${processedArticles.length} articles`,
      articles: processedArticles.map(a => ({
        id: a.id,
        title: a.title,
        source: a.source,
        publishedAt: a.publishedAt,
      })),
      stats: {
        totalProcessed: processedArticles.length,
        sourcesUsed: sources.length,
      },
    });

  } catch (error: any) {
    console.error('Error in rephrase-and-store API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process news',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
