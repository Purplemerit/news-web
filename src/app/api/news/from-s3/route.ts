import { NextRequest, NextResponse } from 'next/server';
import { listArticlesFromS3, getArticleFromS3 } from '@/lib/s3Service';

export const dynamic = 'force-dynamic';

/**
 * Fetch rephrased news from S3
 * GET /api/news/from-s3?country=INDIA&category=sports&limit=50
 * GET /api/news/from-s3?country=INDIA&category=sports&id=article-id
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || 'INDIA';
    const category = searchParams.get('category') || 'sports';
    const limit = parseInt(searchParams.get('limit') || '50');
    const articleId = searchParams.get('id');

    // Fetch single article by ID
    if (articleId) {
      const article = await getArticleFromS3(country, category, articleId);

      if (!article) {
        return NextResponse.json(
          { success: false, error: 'Article not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        article,
      });
    }

    // Fetch multiple articles
    const articles = await listArticlesFromS3(country, category, limit);

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
      country,
      category,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error: any) {
    console.error('Error fetching from S3:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news from storage',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
